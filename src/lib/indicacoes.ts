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

/** livros que a pessoa tocou em "passar": não voltam a aparecer (fica no perfil, vale em todo aparelho) */
export function lembrarPassado(titulo: string) {
  const { passados = [], atualizar } = usePerfil.getState();
  atualizar({
    passados: [...new Set([...passados, chaveTitulo(titulo)])].slice(-500),
  });
}
function passados(): Set<string> {
  const doPerfil = usePerfil.getState().passados ?? [];
  // os que ficaram só neste navegador (versão antiga) entram também
  let antigos: string[] = [];
  try {
    antigos = JSON.parse(localStorage.getItem(PASSADOS) ?? "[]") as string[];
  } catch {
    /* sem localStorage */
  }
  return new Set([...doPerfil, ...antigos]);
}

/** leva os "passar" antigos (só deste navegador) para o perfil, uma vez */
export function migrarPassados() {
  try {
    const antigos = JSON.parse(
      localStorage.getItem(PASSADOS) ?? "[]",
    ) as string[];
    if (!antigos.length) return;
    const { passados: atuais = [], atualizar } = usePerfil.getState();
    atualizar({
      passados: [...new Set([...atuais, ...antigos])].slice(-500),
    });
    localStorage.removeItem(PASSADOS);
  } catch {
    /* sem localStorage */
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
        motivo: `em alta no the bookside · ${x.pessoas} ${x.pessoas === 1 ? "leitor" : "leitores"}`,
      }))
  );
}

/** termos em português para cada gênero: trazem bem mais edições brasileiras que o "subject" do Google */
const TERMO_PT: Record<string, string> = {
  romance: "romance contemporâneo",
  suspense: "suspense psicológico",
  "ficção científica": "ficção científica",
  "não ficção": "não ficção",
  poesia: "poesia",
  fantasia: "fantasia",
  drama: "drama",
  clássicos: "clássicos da literatura",
  humor: "comédia romântica",
  "histórias de família": "saga familiar",
  biografia: "biografia",
  terror: "terror",
  thrillers: "thriller",
  mystery: "romance policial",
  fiction: "romance",
};
const termoPt = (g: string) => TERMO_PT[g.toLowerCase()] ?? g.toLowerCase();

const buscarPt = (q: string, motivo: string, novos = false) =>
  livrosDoGoogle(q, "pt", undefined, {
    novos,
    inicio: novos ? 0 : Math.floor(Math.random() * 3) * 10,
  })
    .then((l) =>
      l.filter((x) => x.capa && emPortugues(x)).map((x) => ({ ...x, motivo })),
    )
    .catch(() => [] as Indicacao[]);

/** um gênero: pelo assunto do Google e pelo termo em português, juntos */
const porGenero = (g: string, motivo: string, novos = false) =>
  Promise.all([
    assuntoDe(g) ? buscarPt(`subject:"${assuntoDe(g)}"`, motivo, novos) : [],
    buscarPt(termoPt(g), motivo, novos),
  ]).then(([a, b]) => intercalar([b, a]));

/** os mais lidos/em alta no mundo (Open Library), na edição em português */
async function tendencias(periodo: "ano" | "mes", motivo: string) {
  try {
    const r = await fetch(`/api/tendencias?periodo=${periodo}`);
    if (!r.ok) return [] as Indicacao[];
    const { livros = [] } = (await r.json()) as { livros?: LivroBusca[] };
    return livros.map(
      (l): Indicacao => ({ ...l, cor: corDoLivro(l.id), motivo }),
    );
  } catch {
    return [] as Indicacao[];
  }
}

/** junta listas alternando entre elas, sem títulos repetidos */
function intercalar(fontes: Indicacao[][], max = 40) {
  const vistos = new Set<string>();
  const lista: Indicacao[] = [];
  for (let i = 0; lista.length < max && fontes.some((f) => f[i]); i++)
    for (const f of fontes) {
      const x = f[i];
      if (x && !vistos.has(chaveTitulo(x.titulo))) {
        vistos.add(chaveTitulo(x.titulo));
        lista.push(x);
      }
    }
  return lista;
}

async function montar(
  livros: LivroSalvo[],
  favoritos: string[],
  gostos: string[],
): Promise<Indicacao[]> {
  const autoras = autorasQueAma(livros, favoritos).slice(0, 3);
  const generos = generosQueLe(livros, gostos).slice(0, 4);
  const assuntos = generos.length
    ? sortear(generos).slice(0, 2)
    : ["romance", "suspense"];

  const fontes = await Promise.all([
    ...autoras.map((a) =>
      buscarPt(`inauthor:"${a}"`, `porque você gosta de ${a}`),
    ),
    emAltaNoApp().catch(() => [] as Indicacao[]),
    tendencias("mes", "em alta no mundo").then(sortear),
    ...assuntos.map((g) => porGenero(g, `do seu gosto · ${g}`)),
    ...assuntos.slice(0, 1).map((g) => porGenero(g, `lançamento · ${g}`, true)),
    tendencias(
      "ano",
      `entre os mais lidos de ${new Date().getFullYear()}`,
    ).then(sortear),
  ]);

  // intercala as fontes, sem repetidos
  const lista = intercalar(fontes, 30);
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
  const [rodada, setRodada] = useState(0);
  // muda quando a pessoa avalia/adiciona livros (não a cada página lida)
  const assinatura =
    livros.map((l) => `${l.id}:${l.nota ?? ""}`).join("|") +
    favoritos.join(",") +
    gostos.join(",") +
    `#${rodada}`;

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
    /** busca outra leva (a anterior acabou) */
    maisUmaRodada: () => {
      setLista(null);
      setRodada((r) => r + 1);
    },
  };
}

/* ───────────── as seções da tela "descobrir" ───────────── */

export type Secao = {
  id: string;
  titulo: string;
  sub?: string;
  livros: Indicacao[];
};

/** o tipo de leitora (teste) → os assuntos para procurar */
const ASSUNTOS_DO_TIPO: Record<string, string[]> = {
  coruja: ["thriller", "aventura"],
  detetive: ["romance policial", "mistério"],
  coracao: ["romance", "drama"],
  viajante: ["fantasia", "ficção científica"],
  guardia: ["clássicos da literatura", "romance histórico"],
  curiosa: ["literatura contemporânea", "biografia"],
  aconchego: ["comédia romântica", "romance"],
  entrelinhas: ["poesia", "literatura brasileira"],
};

/** livros mais lidos no the bookside neste ano (marcados como lidos em {ano}) */
async function maisLidosDoAno(ano: number): Promise<Indicacao[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("mais_lidos_do_ano", {
    p_ano: ano,
  });
  if (error || !data) return [];
  return (
    data as {
      id: string;
      titulo: string;
      autor: string;
      capa: string | null;
      pessoas: number;
    }[]
  )
    .map((x) => ({ ...x, titulo: parteEmPortugues(x.titulo) }))
    .filter((x) => !pareceIngles(x.titulo))
    .map((x) => ({
      id: x.id,
      titulo: x.titulo,
      autor: x.autor || "autoria desconhecida",
      capa: x.capa ?? undefined,
      cor: corDoLivro(x.id),
      motivo: `${x.pessoas} ${x.pessoas === 1 ? "leitor" : "leitores"} em ${ano}`,
    }));
}

/** os livros do resultado do teste, achados no catálogo (com capa e edição em português) */
async function livrosDoTipo(
  lista: { titulo: string; autor: string; porque: string }[],
): Promise<Indicacao[]> {
  const achados = await Promise.all(
    lista.map((l) =>
      livrosDoGoogle(`intitle:"${l.titulo}" inauthor:"${l.autor}"`, "pt")
        .then((r) => r.find((x) => x.capa))
        .then(
          (x): Indicacao =>
            x
              ? { ...x, titulo: l.titulo, motivo: l.porque }
              : {
                  id: `tipo-${chaveTitulo(l.titulo).replace(/ /g, "-")}`,
                  titulo: l.titulo,
                  autor: l.autor,
                  cor: corDoLivro(l.titulo),
                  motivo: l.porque,
                },
        )
        .catch(
          (): Indicacao => ({
            id: `tipo-${chaveTitulo(l.titulo).replace(/ /g, "-")}`,
            titulo: l.titulo,
            autor: l.autor,
            cor: corDoLivro(l.titulo),
            motivo: l.porque,
          }),
        ),
    ),
  );
  return achados;
}

/** Monta as prateleiras do "descobrir": cada uma com um motivo claro. */
export async function secoesDoDescobrir(estado: {
  livros: LivroSalvo[];
  favoritos: string[];
  gostos: string[];
  tipo: {
    id: string;
    nome: string;
    livros: { titulo: string; autor: string; porque: string }[];
  } | null;
}): Promise<Secao[]> {
  const ano = new Date().getFullYear();
  const autoras = autorasQueAma(estado.livros, estado.favoritos).slice(0, 2);
  const generos = generosQueLe(estado.livros, estado.gostos).slice(0, 2);
  const assuntosDoTipo = estado.tipo
    ? (ASSUNTOS_DO_TIPO[estado.tipo.id] ?? [])
    : [];
  const motivoTipo = estado.tipo
    ? `pra ${estado.tipo.nome.replace(/^a /, "")}`
    : "";

  const [
    doTipo,
    maisLidosApp,
    maisLidosMundo,
    emAltaApp,
    emAltaMundo,
    ...outros
  ] = await Promise.all([
    estado.tipo
      ? Promise.all([
          livrosDoTipo(estado.tipo.livros),
          ...assuntosDoTipo.map((a) => porGenero(a, motivoTipo)),
        ]).then((ls) => [...ls[0], ...intercalar(ls.slice(1))])
      : Promise.resolve([] as Indicacao[]),
    maisLidosDoAno(ano).catch(() => [] as Indicacao[]),
    tendencias("ano", `entre os mais lidos de ${ano}`),
    emAltaNoApp().catch(() => [] as Indicacao[]),
    tendencias("mes", "em alta no mundo"),
    ...autoras.map((a) => buscarPt(`inauthor:"${a}"`, `de ${a}`)),
    ...generos.map((g) => porGenero(g, g, true)),
  ]);
  const maisLidos = intercalar([maisLidosApp, maisLidosMundo]);
  const emAlta = intercalar([emAltaApp, emAltaMundo]);
  const daAutora = outros.slice(0, autoras.length);
  const lancamentos = outros.slice(autoras.length);

  const secoes: Secao[] = [];
  if (estado.tipo)
    secoes.push({
      id: "tipo",
      titulo: `para ${estado.tipo.nome}`,
      sub: "pelo seu resultado no teste de leitora",
      livros: doTipo,
    });
  secoes.push({
    id: "ano",
    titulo: `os mais lidos de ${ano}`,
    sub: "os mais lidos do ano no mundo e no the bookside, em edição brasileira",
    livros: maisLidos,
  });
  secoes.push({
    id: "alta",
    titulo: "em alta agora",
    sub: "o que está sendo mais lido este mês",
    livros: emAlta,
  });
  autoras.forEach((a, i) =>
    secoes.push({
      id: `autora-${i}`,
      titulo: `porque você gosta de ${a}`,
      livros: daAutora[i] ?? [],
    }),
  );
  generos.forEach((x: string, i) =>
    secoes.push({
      id: `lancamentos-${i}`,
      titulo: `lançamentos em ${x}`,
      livros: lancamentos[i] ?? [],
    }),
  );
  lembrarLivros(secoes.flatMap((x) => x.livros));
  return secoes;
}

/** tira da prateleira o que a pessoa já tem ou já passou, sem repetir títulos */
export function limparSecao(
  livros: Indicacao[],
  tenho: (l: { id?: string; titulo: string }) => boolean,
) {
  const fora = passados();
  const vistos = new Set<string>();
  return livros.filter((l) => {
    const k = chaveTitulo(l.titulo);
    if (vistos.has(k) || tenho(l) || fora.has(k)) return false;
    vistos.add(k);
    return true;
  });
}
