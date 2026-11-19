"use client";

import { diasDeLeitura } from "@/lib/numeros";
import type { LivroSalvo } from "@/lib/perfil-store";
import { supabase } from "@/lib/supabase";
import { meuId, pessoasPorId, type PessoaResumo } from "@/lib/social";

export type TipoDesafio =
  | "livros"
  | "paginas"
  | "minutos"
  | "pilha"
  | "bingo"
  | "dias";

export type Desafio = {
  id: string;
  titulo: string;
  tipo: TipoDesafio;
  meta: number;
  inicio: string;
  fim: string;
  modelo: string | null;
  config: Record<string, unknown>;
  codigo: string | null;
  clube_id: string | null;
  criado_por: string;
  criado_em: string;
};

export type Participante = {
  desafio_id: string;
  usuario_id: string;
  progresso: number;
  detalhe: { bingo?: string[] };
  concluido_em: string | null;
  pessoa?: PessoaResumo | null;
};

/* ───────── os modelos prontos ───────── */

export type Modelo = {
  id: string;
  titulo: string;
  emoji: string;
  tipo: TipoDesafio;
  meta: number;
  dias: number;
  descricao: string;
  cor: string;
};

export const modelos: Modelo[] = [
  {
    id: "maratona",
    titulo: "maratona de fim de semana",
    emoji: "🏃‍♀️",
    tipo: "paginas",
    meta: 300,
    dias: 3,
    descricao: "300 páginas em 3 dias. café, cobertor e celular longe.",
    cor: "#6B0D24",
  },
  {
    id: "um-por-semana",
    titulo: "um por semana",
    emoji: "📅",
    tipo: "livros",
    meta: 4,
    dias: 30,
    descricao: "4 livros em 30 dias — um livro por semana.",
    cor: "#B75A6B",
  },
  {
    id: "zerar-pilha",
    titulo: "zerar a pilha",
    emoji: "📚",
    tipo: "pilha",
    meta: 3,
    dias: 60,
    descricao: "termine 3 livros que já estavam no seu quero ler.",
    cor: "#6B7A5E",
  },
  {
    id: "bingo",
    titulo: "bingo literário",
    emoji: "🎯",
    tipo: "bingo",
    meta: 9,
    dias: 90,
    descricao:
      "9 casas: um audiolivro, um tijolão, um lido em 3 dias… as casas se marcam sozinhas.",
    cor: "#C9A46A",
  },
  {
    id: "habito",
    titulo: "hábito de foco",
    emoji: "⏱",
    tipo: "dias",
    meta: 7,
    dias: 14,
    descricao: "leia no modo foco em 7 dias diferentes, em duas semanas.",
    cor: "#464052",
  },
  {
    id: "dez-horas",
    titulo: "10 horas de leitura",
    emoji: "☕",
    tipo: "minutos",
    meta: 600,
    dias: 30,
    descricao: "600 minutos no modo foco em 30 dias.",
    cor: "#2B4C7E",
  },
];

export const unidade: Record<TipoDesafio, [string, string]> = {
  livros: ["livro", "livros"],
  paginas: ["página", "páginas"],
  minutos: ["minuto", "minutos"],
  pilha: ["livro da pilha", "livros da pilha"],
  bingo: ["casa", "casas"],
  dias: ["dia", "dias"],
};

/* ───────── o bingo ───────── */

type Regra = {
  id: string;
  texto: string;
  vale: (l: LivroSalvo, todos: LivroSalvo[], inicio: string) => boolean;
};

export const casasDoBingo: Regra[] = [
  {
    id: "tijolao",
    texto: "mais de 400 páginas",
    vale: (l) => (l.paginas ?? 0) >= 400,
  },
  { id: "audio", texto: "um audiolivro", vale: (l) => l.formato === "audio" },
  {
    id: "rapido",
    texto: "lido em até 3 dias",
    vale: (l) => (diasDeLeitura(l) ?? 99) <= 3,
  },
  {
    id: "curtinho",
    texto: "menos de 200 páginas",
    vale: (l) => !!l.paginas && l.paginas < 200,
  },
  { id: "livre", texto: "livre ✦ qualquer livro", vale: () => true },
  { id: "cinco", texto: "dar 5 estrelas", vale: (l) => l.nota === 5 },
  {
    id: "esquecido",
    texto: "estava no quero ler há 3+ meses",
    vale: (l) =>
      !!l.adicionadoEm &&
      !!l.lidoEm &&
      new Date(l.lidoEm).getTime() - new Date(l.adicionadoEm).getTime() >
        90 * 864e5,
  },
  {
    id: "autora-nova",
    texto: "uma autora nova pra você",
    vale: (l, todos, inicio) =>
      !todos.some(
        (o) =>
          o.id !== l.id &&
          o.status === "lido" &&
          (o.lidoEm ?? "") < inicio &&
          o.autor.toLowerCase() === l.autor.toLowerCase(),
      ),
  },
  {
    id: "outro-mundo",
    texto: "fantasia ou ficção científica",
    vale: (l) =>
      /fantas|fic[cç][aã]o cient|science fiction|fantasy/i.test(l.genero ?? ""),
  },
];

/* ───────── o progresso, calculado pelo que a pessoa marca no app ───────── */

const noPeriodo = (
  iso: string | undefined,
  d: Pick<Desafio, "inicio" | "fim">,
) => !!iso && iso.slice(0, 10) >= d.inicio && iso.slice(0, 10) <= d.fim;

export function calcularProgresso(
  d: Pick<Desafio, "tipo" | "inicio" | "fim" | "meta">,
  livros: LivroSalvo[],
): { progresso: number; bingo?: string[] } {
  const lidos = livros.filter(
    (l) => l.status === "lido" && noPeriodo(l.lidoEm, d),
  );
  const sessoes = livros.flatMap((l) =>
    (l.sessoes ?? []).filter((s) => noPeriodo(s.em, d)),
  );
  switch (d.tipo) {
    case "livros":
      return { progresso: lidos.length };
    case "paginas":
      return {
        progresso:
          lidos.reduce((t, l) => t + (l.paginas ?? 0), 0) +
          // páginas lidas no modo foco em livros que ainda não terminaram
          livros
            .filter((l) => l.status !== "lido" || !noPeriodo(l.lidoEm, d))
            .flatMap((l) => (l.sessoes ?? []).filter((s) => noPeriodo(s.em, d)))
            .reduce((t, s) => t + (s.paginas ?? 0), 0),
      };
    case "minutos":
      return { progresso: sessoes.reduce((t, s) => t + s.minutos, 0) };
    case "dias":
      return { progresso: new Set(sessoes.map((s) => s.em.slice(0, 10))).size };
    case "pilha":
      return {
        progresso: lidos.filter(
          (l) => l.adicionadoEm && l.adicionadoEm.slice(0, 10) < d.inicio,
        ).length,
      };
    case "bingo": {
      const marcadas = casasDoBingo
        .filter((c) => lidos.some((l) => c.vale(l, livros, d.inicio)))
        .map((c) => c.id);
      return { progresso: marcadas.length, bingo: marcadas };
    }
  }
}

/* ───────── banco ───────── */

function db() {
  if (!supabase) throw new Error("sem nuvem");
  return supabase;
}

const codigoNovo = () =>
  Array.from(
    { length: 6 },
    () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)],
  ).join("");

export async function criarDesafio(d: {
  titulo: string;
  tipo: TipoDesafio;
  meta: number;
  inicio: string;
  fim: string;
  modelo?: string;
  comAmigos?: boolean;
  clubeId?: string | null;
}): Promise<string> {
  const { data, error } = await db()
    .from("desafios")
    .insert({
      titulo: d.titulo,
      tipo: d.tipo,
      meta: d.meta,
      inicio: d.inicio,
      fim: d.fim,
      modelo: d.modelo ?? null,
      codigo: d.comAmigos || d.clubeId ? codigoNovo() : null,
      clube_id: d.clubeId ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  const { error: e2 } = await db()
    .from("desafio_participantes")
    .insert({ desafio_id: data.id });
  if (e2) throw e2;
  return data.id as string;
}

export async function entrarComCodigo(codigo: string) {
  const { data, error } = await db().rpc("entrar_no_desafio", {
    p_codigo: codigo,
  });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export async function entrarNoDesafio(id: string) {
  const { error } = await db()
    .from("desafio_participantes")
    .upsert(
      { desafio_id: id },
      { onConflict: "desafio_id,usuario_id", ignoreDuplicates: true },
    );
  if (error) throw error;
}

export async function sairDoDesafio(id: string) {
  const eu = meuId();
  if (!eu) return;
  await db()
    .from("desafio_participantes")
    .delete()
    .eq("desafio_id", id)
    .eq("usuario_id", eu);
}

export async function apagarDesafio(id: string) {
  const { error } = await db().from("desafios").delete().eq("id", id);
  if (error) throw error;
}

/** os desafios em que estou (e os dos meus clubes, para eu poder entrar) */
export async function meusDesafios(): Promise<{
  desafios: Desafio[];
  participo: Set<string>;
  participantes: Participante[];
}> {
  const eu = meuId();
  const { data, error } = await db()
    .from("desafios")
    .select("*")
    .order("fim", { ascending: true });
  if (error) throw error;
  const desafios = (data ?? []) as Desafio[];
  const ids = desafios.map((d) => d.id);
  const { data: ps } = ids.length
    ? await db().from("desafio_participantes").select("*").in("desafio_id", ids)
    : { data: [] };
  const participantes = (ps ?? []) as Participante[];
  const pessoas = await pessoasPorId(participantes.map((p) => p.usuario_id));
  for (const p of participantes) p.pessoa = pessoas.get(p.usuario_id) ?? null;
  return {
    desafios,
    participo: new Set(
      participantes.filter((p) => p.usuario_id === eu).map((p) => p.desafio_id),
    ),
    participantes,
  };
}

/** guarda o meu progresso em cada desafio em que estou (o app calcula; o banco só guarda) */
export async function sincronizarMeuProgresso(
  desafios: Desafio[],
  participo: Set<string>,
  livros: LivroSalvo[],
  jaConcluidos: Set<string>,
) {
  const concluidosAgora: Desafio[] = [];
  for (const d of desafios) {
    if (!participo.has(d.id)) continue;
    const { progresso, bingo } = calcularProgresso(d, livros);
    const concluiu = progresso >= d.meta;
    await db()
      .from("desafio_participantes")
      .update({
        progresso,
        detalhe: bingo ? { bingo } : {},
        atualizado_em: new Date().toISOString(),
        ...(concluiu && !jaConcluidos.has(d.id)
          ? { concluido_em: new Date().toISOString() }
          : {}),
      })
      .eq("desafio_id", d.id)
      .eq("usuario_id", meuId() ?? "");
    if (concluiu && !jaConcluidos.has(d.id)) concluidosAgora.push(d);
  }
  return concluidosAgora;
}

export const diaHoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const somarDias = (dia: string, n: number) => {
  const [a, m, d] = dia.split("-").map(Number);
  const x = new Date(a, m - 1, d + n);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
export const diasRestantes = (fim: string) =>
  Math.round((new Date(`${fim}T23:59:59`).getTime() - Date.now()) / 864e5);

/** desafios já comemorados (para a celebração aparecer uma vez só) */
const CONCLUIDOS = "bookside-desafios-concluidos";
export const concluidosVistos = (): Set<string> => {
  try {
    return new Set(JSON.parse(localStorage.getItem(CONCLUIDOS) ?? "[]"));
  } catch {
    return new Set();
  }
};
export const marcarConcluidos = (ids: string[]) => {
  try {
    localStorage.setItem(
      CONCLUIDOS,
      JSON.stringify([...new Set([...concluidosVistos(), ...ids])]),
    );
  } catch {
    /* sem armazenamento */
  }
};
