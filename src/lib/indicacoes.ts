"use client";

/**
 * Indicações "pra você", em português, a partir de:
 * 1. autoras que a pessoa avaliou bem (outros livros delas);
 * 2. o que está em alta no the bookside (mais gente pôs na estante nos últimos 60 dias);
 * 3. os gêneros que ela lê e marcou no perfil;
 * 4. lançamentos nesses gêneros.
 * Só edições em português, com capa, que ela ainda não tem nem já passou.
 */
import { useEffect, useMemo, useState } from "react";
import {
  naEstante,
  assuntoDoGosto,
  chaveTitulo,
  lembrarLivros,
  livrosDoGoogle,
  type LivroBusca,
} from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { pareceIngles } from "@/lib/fontes";
import { normalizar } from "@/lib/importar";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";
import { supabase } from "@/lib/supabase";

export type Indicacao = LivroBusca & { motivo: string };

const SESSAO = "bookside-indicacoes-v1";
const PASSADOS = "bookside-passados";

/** livros que a pessoa tocou em "passar": não voltam a aparecer */
export function lembrarPassado(titulo: string) {
  try {
    const l = JSON.parse(localStorage.getItem(PASSADOS) ?? "[]") as string[];
    localStorage.setItem(
      PASSADOS,
      JSON.stringify([...l, chaveTitulo(titulo)].slice(-300)),
    );
  } catch {
    /* sem localStorage */
  }
}
function passados(): Set<string> {
  try {
    return new Set(
      JSON.parse(localStorage.getItem(PASSADOS) ?? "[]") as string[],
    );
  } catch {
    return new Set();
  }
}

/** "Anxious People | Gente ansiosa" → "Gente ansiosa" */
function parteEmPortugues(t: string) {
  const partes = t.split(/\s*[|/]\s*/).filter(Boolean);
  return partes.length > 1 ? (partes.find((p) => !pareceIngles(p)) ?? t) : t;
}

/** é edição em português? (o Google diz o idioma; a sinopse confirma) */
const emPortugues = (l: LivroBusca) =>
  l.idioma === "pt" && !pareceIngles(`${l.titulo} ${l.sinopse ?? ""}`);

/** gênero da estante (em português ou como o Google manda) → assunto de busca */
function assuntoDe(genero: string) {
  const g = genero.toLowerCase();
  return (
    assuntoDoGosto[g] ??
    (/^[a-z ]+$/.test(normalizar(g)) && !assuntoDoGosto[g] ? g : undefined)
  );
}

/** as autoras de quem a pessoa mais gostou (nota alta ou favoritos) */
function autorasQueAma(livros: LivroSalvo[], favoritos: string[]) {
  const pontos = new Map<string, number>();
  for (const l of livros) {
    if (!l.autor || l.autor.startsWith("autoria")) continue;
    const p =
      (favoritos.includes(l.id) ? 3 : 0) +
      (l.nota && l.nota >= 4 ? l.nota - 2 : 0);
    if (p > 0) pontos.set(l.autor, (pontos.get(l.autor) ?? 0) + p);
  }
  return [...pontos].sort((a, b) => b[1] - a[1]).map(([a]) => a);
}

/** os gêneros mais lidos + os marcados no perfil */
function generosQueLe(livros: LivroSalvo[], gostos: string[]) {
  const conta = new Map<string, number>();
  for (const l of livros)
    if (l.genero)
      conta.set(
        l.genero,
        (conta.get(l.genero) ?? 0) + (l.status === "lido" ? 2 : 1),
      );
  const daEstante = [...conta].sort((a, b) => b[1] - a[1]).map(([g]) => g);
  return [...new Set([...daEstante, ...gostos])];
}

const sortear = <T>(l: T[]) =>
  l
    .map((x) => ({ x, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(({ x }) => x);

async function emAltaNoApp(): Promise<Indicacao[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("livros_em_alta", { p_dias: 60 });
  if (error || !data) return [];
  return (
    (
      data as {
        id: string;
        titulo: string;
        autor: string;
        capa: string | null;
        pessoas: number;
      }[]
    )
      // só os que estão em português (ou a parte em português do título)
      .map((x) => ({ ...x, titulo: parteEmPortugues(x.titulo) }))
      .filter((x) => !pareceIngles(x.titulo))
      .map((x) => ({
        id: x.id,
        titulo: x.titulo,
        autor: x.autor || "autoria desconhecida",
        capa: x.capa ?? undefined,
        cor: corDoLivro(x.id),
        motivo: `em alta no the bookside · ${x.pessoas} ${x.pessoas === 1 ? "leitora" : "leitoras"}`,
      }))
  );
}

async function montar(
  livros: LivroSalvo[],
  favoritos: string[],
  gostos: string[],
): Promise<Indicacao[]> {
  const autoras = autorasQueAma(livros, favoritos).slice(0, 3);
  const generos = generosQueLe(livros, gostos)
    .map((g) => ({ g, assunto: assuntoDe(g) }))
    .filter((x): x is { g: string; assunto: string } => !!x.assunto)
    .slice(0, 4);
  const assuntos = generos.length
    ? sortear(generos).slice(0, 2)
    : [
        { g: "romance", assunto: "romance" },
        { g: "suspense", assunto: "thrillers" },
      ];
  const google = (q: string, motivo: string, novos = false) =>
    livrosDoGoogle(q, "pt", undefined, {
      novos,
      inicio: novos ? 0 : Math.floor(Math.random() * 3) * 10,
    })
      .then((l) =>
        l
          .filter((x) => x.capa && emPortugues(x))
          .map((x) => ({ ...x, motivo })),
      )
      .catch(() => [] as Indicacao[]);

  const fontes = await Promise.all([
    ...autoras.map((a) =>
      google(`inauthor:"${a}"`, `porque você gosta de ${a}`),
    ),
    emAltaNoApp().catch(() => [] as Indicacao[]),
    ...assuntos.map((x) =>
      google(`subject:"${x.assunto}"`, `do seu gosto · ${x.g}`),
    ),
    ...assuntos
      .slice(0, 1)
      .map((x) =>
        google(`subject:"${x.assunto}"`, `lançamento · ${x.g}`, true),
      ),
  ]);

  // intercala as fontes, sem repetidos
  const vistos = new Set<string>();
  const lista: Indicacao[] = [];
  for (let i = 0; lista.length < 24 && fontes.some((f) => f[i]); i++)
    for (const f of fontes) {
      const x = f[i];
      if (x && !vistos.has(chaveTitulo(x.titulo))) {
        vistos.add(chaveTitulo(x.titulo));
        lista.push(x);
      }
    }
  lembrarLivros(lista);
  return lista;
}

let emAndamento: { assinatura: string; promessa: Promise<Indicacao[]> } | null =
  null;

/** As indicações da visita (guardadas na sessão para não buscar a cada tela). */
export function useIndicacoes() {
  const livros = usePerfil((s) => s.livros);
  const favoritos = usePerfil((s) => s.favoritos);
  const gostos = usePerfil((s) => s.gostos);
  const [lista, setLista] = useState<Indicacao[] | null>(null);
  // muda quando a pessoa avalia/adiciona livros (não a cada página lida)
  const assinatura =
    livros.map((l) => `${l.id}:${l.nota ?? ""}`).join("|") +
    favoritos.join(",") +
    gostos.join(",");

  useEffect(() => {
    let vivo = true;
    try {
      const salvo = JSON.parse(sessionStorage.getItem(SESSAO) ?? "null") as {
        assinatura: string;
        lista: Indicacao[];
      } | null;
      if (salvo?.assinatura === assinatura && salvo.lista.length) {
        setLista(salvo.lista);
        return;
      }
    } catch {
      /* sem sessionStorage */
    }
    const estado = usePerfil.getState();
    // a mesma busca já em andamento (a tela pode montar duas vezes): reaproveita
    if (emAndamento?.assinatura !== assinatura)
      emAndamento = {
        assinatura,
        promessa: montar(estado.livros, estado.favoritos, estado.gostos),
      };
    emAndamento.promessa.then((l) => {
      if (!vivo) return;
      setLista(l);
      try {
        sessionStorage.setItem(
          SESSAO,
          JSON.stringify({ assinatura, lista: l }),
        );
      } catch {
        /* sem sessionStorage */
      }
    });
    return () => {
      vivo = false;
    };
    // só refaz quando a assinatura muda
  }, [assinatura]);

  const tenho = useMemo(() => naEstante(livros), [livros]);
  const fora = passados();
  return {
    carregando: lista === null,
    lista: (lista ?? []).filter(
      (l) => !tenho(l) && !fora.has(chaveTitulo(l.titulo)),
    ),
  };
}
