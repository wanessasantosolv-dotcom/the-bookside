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
import { RESERVA } from "@/lib/reserva";
import { arquetipos, type ArquetipoId } from "@/lib/teste";

export type Indicacao = LivroBusca & {
  motivo: string;
  /** em alta no the bookside: a média das notas de quem leu e quantas notas */
  notaApp?: number;
  avaliacoesApp?: number;
  /** um trecho de resenha de quem leu, e o nome dela */
  resenhaApp?: { texto: string; de: string };
};

const SESSAO = "bookside-indicacoes-v2";
const PASSADOS = "bookside-passados";
/** todas as indicações que já vieram (para usar quando a busca falhar) */
const POOL = "bookside-indicacoes-pool";
/** capas/edições achadas para os livros da reserva */
const RESERVA_ACHADOS = "bookside-reserva-achados";

function lerJson<T>(chave: string, padrao: T): T {
  try {
    return (JSON.parse(localStorage.getItem(chave) ?? "null") as T) ?? padrao;
  } catch {
    return padrao;
  }
}
function gravarJson(chave: string, valor: unknown) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* sem armazenamento */
  }
}

function guardarNoPool(lista: Indicacao[]) {
  const vistos = new Set<string>();
  const junto = [...lista, ...lerJson<Indicacao[]>(POOL, [])].filter((x) => {
    const k = chaveTitulo(x.titulo);
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
  gravarJson(POOL, junto.slice(0, 250));
}

const slug = (t: string) =>
  normalizar(t)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** a reserva, com os gêneros da pessoa primeiro (e a edição achada, quando já achou) */
function daReserva(generos: string[]): Indicacao[] {
  const achados = lerJson<Record<string, Indicacao>>(RESERVA_ACHADOS, {});
  const lista = montarReserva(generos, achados);
  // a página do livro abre direto com esses dados
  lembrarLivros(lista);
  return lista;
}
function montarReserva(
  generos: string[],
  achados: Record<string, Indicacao>,
): Indicacao[] {
  const gs = generos.map((g) => g.toLowerCase());
  const comGosto = (r: (typeof RESERVA)[number]) =>
    r.generos.some((g) => gs.includes(g));
  return [
    ...sortear(RESERVA.filter(comGosto)),
    ...sortear(RESERVA.filter((r) => !comGosto(r))),
  ].map((r) => {
    const g = r.generos.find((x) => gs.includes(x)) ?? r.generos[0];
    const motivo = comGosto(r)
      ? `do seu gosto · ${g}`
      : `querido por muitos leitores · ${g}`;
    const achado = achados[chaveTitulo(r.titulo)];
    if (achado) return { ...achado, motivo };
    const id = `reserva-${slug(r.titulo)}`;
    return {
      id,
      titulo: r.titulo,
      autor: r.autor,
      cor: corDoLivro(id),
      genero: g,
      motivo,
    };
  });
}

/** acha a edição em português (capa, sinopse) de um livro da reserva; guarda para as próximas vezes */
async function acharEdicao(l: Indicacao): Promise<Indicacao | null> {
  const sobrenome = l.autor.split(" ").pop() ?? l.autor;
  const achados = await livrosDoGoogle(
    `intitle:"${l.titulo.split(":")[0]}" inauthor:"${sobrenome}"`,
    "pt",
  ).catch(() => [] as LivroBusca[]);
  const x = achados.find((a) => a.capa);
  if (!x) return null;
  const pronto: Indicacao = { ...x, motivo: l.motivo };
  const todos = lerJson<Record<string, Indicacao>>(RESERVA_ACHADOS, {});
  todos[chaveTitulo(l.titulo)] = pronto;
  gravarJson(RESERVA_ACHADOS, todos);
  lembrarLivros([pronto]);
  return pronto;
}

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
/** edição em português (idioma da edição + o título/sinopse não parecem inglês) */
export const emPortugues = (l: LivroBusca) =>
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
        sinopse?: string | null;
        media?: number | string | null;
        avaliacoes?: number | null;
        resenha?: string | null;
        resenha_de?: string | null;
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
        sinopse: x.sinopse || undefined,
        notaApp: x.media ? Number(x.media) || undefined : undefined,
        avaliacoesApp: x.avaliacoes ? Number(x.avaliacoes) : undefined,
        resenhaApp:
          x.resenha && x.resenha_de
            ? { texto: x.resenha, de: x.resenha_de }
            : undefined,
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

/**
 * Indicações da IA (Gemini, pela rota do app): ela escolhe títulos pelo gosto da
 * pessoa; o app acha cada um no catálogo (capa, edição em português).
 */
async function sugestoesDaIA(
  livros: LivroSalvo[],
  gostos: string[],
  tipo: { id: string; nome: string } | null,
): Promise<Indicacao[]> {
  if (!supabase) return [];
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return [];
  const amados = livros
    .filter(
      (l) =>
        (l.nota ?? 0) >= 4 ||
        l.amei ||
        l.reacao === "favoritado" ||
        l.reacao === "adorei",
    )
    .slice(0, 15)
    .map((l) => `${l.titulo} (${l.autor})`);
  const naoCurtiu = livros
    .filter(
      (l) =>
        (l.nota && l.nota <= 2) ||
        l.reacao === "nao" ||
        l.status === "abandonado",
    )
    .slice(0, 8)
    .map((l) => `${l.titulo} (${l.autor})`);
  const r = await fetch("/api/ia/sugestoes", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      amados,
      naoCurtiu,
      tenho: livros.slice(0, 60).map((l) => l.titulo),
      generos: generosQueLe(livros, gostos).slice(0, 6),
      tipo: tipo?.nome,
    }),
  });
  if (!r.ok) return [];
  const { livros: sugeridos = [] } = (await r.json()) as {
    livros?: { titulo: string; autor: string; motivo: string }[];
  };
  const achados = await Promise.all(
    sugeridos.slice(0, 10).map((s) =>
      livrosDoGoogle(
        `intitle:"${s.titulo}" inauthor:"${s.autor.split(" ").pop()}"`,
        "pt",
      )
        .then((ls) => ls.find((x) => x.capa))
        .then((x): Indicacao | null =>
          x ? { ...x, motivo: `✦ ia · ${s.motivo || "pelo seu gosto"}` } : null,
        )
        .catch(() => null),
    ),
  );
  return achados.filter((x): x is Indicacao => !!x);
}

async function montar(
  livros: LivroSalvo[],
  favoritos: string[],
  gostos: string[],
  tipo: { id: string; nome: string } | null,
): Promise<Indicacao[]> {
  const autoras = autorasQueAma(livros, favoritos).slice(0, 3);
  const generos = generosQueLe(livros, gostos).slice(0, 4);
  const assuntos = generos.length
    ? sortear(generos).slice(0, 2)
    : ["romance", "suspense"];

  const fontes = await Promise.all([
    sugestoesDaIA(livros, gostos, tipo).catch(() => [] as Indicacao[]),
    ...autoras.map((a) =>
      buscarPt(`inauthor:"${a}"`, `porque você gosta de ${a}`),
    ),
    emAltaNoApp().catch(() => [] as Indicacao[]),
    tendencias("mes", "em alta no mundo").then(sortear),
    ...(tipo ? (ASSUNTOS_DO_TIPO[tipo.id] ?? []) : [])
      .slice(0, 1)
      .map((g) => porGenero(g, `pra ${tipo!.nome.replace(/^a /, "")} · ${g}`)),
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
/** a "chave" das indicações: muda quando mudam os gostos, os favoritos ou o tipo de leitora */
function assinaturaAtual(rodada = 0) {
  const e = usePerfil.getState();
  return [
    (e.favoritos ?? []).join(","),
    (e.gostos ?? []).join(","),
    e.bookside?.principal ?? "",
    rodada,
  ].join("|");
}
const VALIDADE = 12 * 3600e3;

function guardadas(assinatura: string): Indicacao[] | null {
  try {
    const salvo = JSON.parse(localStorage.getItem(SESSAO) ?? "null") as {
      assinatura: string;
      em: number;
      lista: Indicacao[];
    } | null;
    if (
      salvo?.assinatura === assinatura &&
      salvo.lista.length &&
      Date.now() - salvo.em < VALIDADE
    ) {
      // a página do livro abre direto com os dados (capa, sinopse) que vieram daqui
      lembrarLivros(salvo.lista);
      return salvo.lista;
    }
  } catch {
    /* sem armazenamento */
  }
  return null;
}

/** busca (ou reaproveita) as indicações; a mesma busca em andamento é compartilhada */
function obterIndicacoes(assinatura: string): Promise<Indicacao[]> {
  const pronta = guardadas(assinatura);
  if (pronta) return Promise.resolve(pronta);
  if (emAndamento?.assinatura === assinatura) return emAndamento.promessa;
  const e = usePerfil.getState();
  const promessa = montar(
    e.livros,
    e.favoritos,
    e.gostos,
    e.bookside
      ? (arquetipos[e.bookside.principal as ArquetipoId] ?? null)
      : null,
  ).then((lista) => {
    if (lista.length) guardarNoPool(lista);
    try {
      if (lista.length)
        localStorage.setItem(
          SESSAO,
          JSON.stringify({ assinatura, em: Date.now(), lista }),
        );
    } catch {
      /* sem armazenamento */
    }
    return lista;
  });
  emAndamento = { assinatura, promessa };
  return promessa;
}

/** prepara as indicações em segundo plano, para o "descobrir" abrir já com o livro na tela */
export function preaquecerIndicacoes() {
  void obterIndicacoes(assinaturaAtual()).catch(() => {});
}

/** As indicações (guardadas por 12 horas neste aparelho para abrir na hora). */
export function useIndicacoes() {
  const livros = usePerfil((s) => s.livros);
  const favoritos = usePerfil((s) => s.favoritos);
  const gostos = usePerfil((s) => s.gostos);
  const tipo = usePerfil((s) => s.bookside?.principal ?? "");
  const [rodada, setRodada] = useState(0);
  const assinatura = [favoritos.join(","), gostos.join(","), tipo, rodada].join(
    "|",
  );
  const [lista, setLista] = useState<Indicacao[] | null>(() =>
    typeof window === "undefined" ? null : guardadas(assinatura),
  );

  useEffect(() => {
    let vivo = true;
    obterIndicacoes(assinatura)
      .then((l) => vivo && setLista(l))
      .catch(() => vivo && setLista([]));
    return () => {
      vivo = false;
    };
  }, [assinatura]);

  const tenho = useMemo(() => naEstante(livros), [livros]);
  const [trocas, setTrocas] = useState<Record<string, Indicacao>>({});
  const final = useMemo(() => {
    if (lista === null) return [];
    const fora = passados();
    const vistos = new Set<string>();
    const serve = (l: Indicacao) => {
      const k = chaveTitulo(l.titulo);
      if (vistos.has(k) || tenho(l) || fora.has(k)) return false;
      vistos.add(k);
      return true;
    };
    const daVez = lista.filter(serve);
    if (daVez.length >= 8) return daVez;
    // a busca veio fraca (sem internet, limite do Google…): completa com o que
    // já veio antes e com a reserva — o descobrir nunca fica vazio
    const reserva = daReserva(generosQueLe(livros, gostos))
      .map((r) => trocas[r.id] ?? r)
      .filter(serve);
    const antigas = sortear(lerJson<Indicacao[]>(POOL, [])).filter(serve);
    return [...daVez, ...antigas.slice(0, 15), ...reserva].slice(0, 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista, tenho, trocas, rodada]);

  // os livros da reserva ganham capa e sinopse quando o catálogo responde
  useEffect(() => {
    const sem = final
      .filter((l) => l.id.startsWith("reserva-") && !trocas[l.id])
      .slice(0, 6);
    if (!sem.length) return;
    let vivo = true;
    void Promise.all(
      sem.map((l) => acharEdicao(l).then((x) => [l.id, x] as const)),
    ).then((pares) => {
      if (!vivo) return;
      const novas = Object.fromEntries(
        pares.filter((p): p is readonly [string, Indicacao] => !!p[1]),
      );
      if (Object.keys(novas).length) setTrocas((t) => ({ ...t, ...novas }));
    });
    return () => {
      vivo = false;
    };
  }, [final, trocas]);

  return {
    carregando: lista === null,
    lista: final,
    /** busca outra leva (a anterior acabou) */
    maisUmaRodada: () => {
      setLista(null);
      setRodada((r) => r + 1);
    },
  };
}

/** o tipo de leitora (teste) → o que procurar, em português */
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
