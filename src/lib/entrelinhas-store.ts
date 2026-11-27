"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { CARTAS, PERGUNTAS, VERSAO, afinidade, embaralhar, lideres, novaOrdem, pontuar, respondidas, type CartaId } from "@/lib/entrelinhas";
import { supabase } from "@/lib/supabase";
import { useNuvem } from "@/lib/nuvem";

/*
 * O estado de uma execução de nas entrelinhas. Fica neste aparelho (para
 * retomar) e, com conta, numa tabela privada (só a própria pessoa lê:
 * supabase/atualizacao-2026-11-entrelinhas.sql). O perfil recebe só a carta,
 * e só quando a pessoa escolhe guardar.
 */

export type Fase = "perguntas" | "desempate" | "revelacao" | "concluida";

export type Execucao = {
  id: string;
  versao: number;
  /** ordem das alternativas desta execução (ids), sorteada uma vez */
  ordem: Record<string, string[]>;
  respostas: Record<string, string>;
  indice: number;
  fase: Fase;
  /** empatados, já na ordem embaralhada em que aparecem */
  empatados?: CartaId[];
  desempate?: CartaId;
  carta?: CartaId;
  pontos?: Record<CartaId, number>;
  iniciadaEm: string;
  concluidaEm?: string;
};

export type Resultado = { execucaoId: string; carta: CartaId; afinidade: CartaId | null; concluidaEm: string };

type Estado = {
  execucao: Execucao | null;
  /** o resultado mais recente (privado) */
  resultado: Resultado | null;
  iniciar: () => void;
  responder: (pergunta: string, alternativa: string) => void;
  irPara: (indice: number) => void;
  /** depois da última pergunta: resultado direto ou desempate */
  finalizarPerguntas: () => void;
  escolherDesempate: (c: CartaId) => void;
  voltarDoDesempate: () => void;
  concluir: () => void;
  descartar: () => void;
};

const novoId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** grava a execução na tabela privada (sem conta ou sem a tabela, fica só no aparelho) */
async function sincronizar(e: Execucao, visivel?: boolean) {
  const usuario = useNuvem.getState().usuario?.id;
  if (!supabase || !usuario) return;
  try {
    await supabase.from("entrelinhas_execucoes").upsert({
      id: e.id,
      usuario_id: usuario,
      versao: e.versao,
      ordem: e.ordem,
      respostas: e.respostas,
      pontos: e.pontos ?? pontuar(e.respostas),
      carta: e.carta ?? null,
      empatados: e.empatados ?? null,
      desempate: e.desempate ?? null,
      estado: e.fase === "concluida" ? "concluida" : "em_andamento",
      concluida_em: e.concluidaEm ?? null,
      ...(visivel === undefined ? {} : { visivel }),
    });
  } catch {
    /* sem a tabela ou sem internet: continua neste aparelho */
  }
}

export async function marcarVisibilidade(execucaoId: string, visivel: boolean) {
  const usuario = useNuvem.getState().usuario?.id;
  if (!supabase || !usuario) return;
  try {
    // só uma carta exibida por vez
    if (visivel) await supabase.from("entrelinhas_execucoes").update({ visivel: false }).eq("usuario_id", usuario).neq("id", execucaoId);
    await supabase.from("entrelinhas_execucoes").update({ visivel }).eq("id", execucaoId);
  } catch {
    /* fica só no perfil */
  }
}

/** retoma do banco quando este aparelho não tem nada (ex.: outro celular) */
export async function retomarDaNuvem() {
  const s = useEntrelinhas.getState();
  const usuario = useNuvem.getState().usuario?.id;
  if (!supabase || !usuario || s.execucao || s.resultado) return;
  try {
    const { data } = await supabase
      .from("entrelinhas_execucoes")
      .select("id,versao,ordem,respostas,pontos,carta,empatados,desempate,estado,concluida_em,criado_em")
      .eq("usuario_id", usuario)
      .order("criado_em", { ascending: false })
      .limit(5);
    for (const r of data ?? []) {
      if (r.versao !== VERSAO) continue;
      if (r.estado === "concluida" && r.carta) {
        useEntrelinhas.setState({ resultado: { execucaoId: r.id, carta: r.carta, afinidade: afinidade(r.respostas, r.carta), concluidaEm: r.concluida_em } });
        return;
      }
      if (r.estado === "em_andamento") {
        const feitas = PERGUNTAS.findIndex((p) => !r.respostas?.[p.id]);
        useEntrelinhas.setState({
          execucao: { id: r.id, versao: r.versao, ordem: r.ordem, respostas: r.respostas ?? {}, indice: feitas < 0 ? PERGUNTAS.length - 1 : feitas, fase: "perguntas", iniciadaEm: r.criado_em },
        });
        return;
      }
    }
  } catch {
    /* sem a tabela */
  }
}

export const useEntrelinhas = create<Estado>()(
  persist(
    (set, get) => ({
      execucao: null,
      resultado: null,
      iniciar: () => {
        const e: Execucao = { id: novoId(), versao: VERSAO, ordem: novaOrdem(), respostas: {}, indice: 0, fase: "perguntas", iniciadaEm: new Date().toISOString() };
        set({ execucao: e });
        void sincronizar(e);
      },
      responder: (pergunta, alternativa) => {
        const e = get().execucao;
        if (!e || e.fase !== "perguntas") return;
        // a resposta substitui a anterior: a pontuação sai sempre das respostas finais
        set({ execucao: { ...e, respostas: { ...e.respostas, [pergunta]: alternativa } } });
      },
      irPara: (indice) => {
        const e = get().execucao;
        if (!e) return;
        const nova = { ...e, indice: Math.max(0, Math.min(PERGUNTAS.length - 1, indice)) };
        set({ execucao: nova });
        void sincronizar(nova);
      },
      finalizarPerguntas: () => {
        const e = get().execucao;
        if (!e || !respondidas(e.respostas)) return;
        const topo = lideres(e.respostas);
        const pontos = pontuar(e.respostas);
        const nova: Execucao =
          topo.length === 1
            ? { ...e, pontos, carta: topo[0], empatados: undefined, desempate: undefined, fase: "revelacao" }
            : { ...e, pontos, empatados: embaralhar(topo), desempate: undefined, carta: undefined, fase: "desempate" };
        set({ execucao: nova });
        void sincronizar(nova);
      },
      escolherDesempate: (c) => {
        const e = get().execucao;
        if (!e || e.fase !== "desempate" || !e.empatados?.includes(c)) return;
        const nova: Execucao = { ...e, desempate: c, carta: c, fase: "revelacao" };
        set({ execucao: nova });
        void sincronizar(nova);
      },
      voltarDoDesempate: () => {
        const e = get().execucao;
        if (!e) return;
        set({ execucao: { ...e, fase: "perguntas", indice: PERGUNTAS.length - 1, empatados: undefined, desempate: undefined, carta: undefined } });
      },
      concluir: () => {
        const e = get().execucao;
        if (!e?.carta) return;
        const concluidaEm = new Date().toISOString();
        const nova: Execucao = { ...e, fase: "concluida", concluidaEm };
        set({ execucao: null, resultado: { execucaoId: e.id, carta: e.carta, afinidade: afinidade(e.respostas, e.carta), concluidaEm } });
        void sincronizar(nova);
      },
      descartar: () => set({ execucao: null }),
    }),
    {
      name: "bookside-entrelinhas",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // uma execução de outra versão do teste não é retomada
      merge: (salvo, atual) => {
        const s = (salvo ?? {}) as Partial<Estado>;
        const ok = (c: unknown) => (CARTAS as string[]).includes(c as string);
        return {
          ...atual,
          execucao: s.execucao?.versao === VERSAO ? s.execucao : null,
          resultado: s.resultado && ok(s.resultado.carta) ? s.resultado : null,
        };
      },
    },
  ),
);
