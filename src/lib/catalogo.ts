"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";
import { corDoLivro } from "@/lib/cores";
import { sugestoesDeLivros, type LivroCatalogo } from "@/lib/dados";

/**
 * Busca de livros no Google Books e na Open Library (gratuitas, sem chave).
 * https://developers.google.com/books · https://openlibrary.org/dev/docs/api/search
 * Roda no navegador de quem usa o app.
 */

export type LivroBusca = LivroCatalogo & {
  capa?: string;
  capaGrande?: string;
  /** ISBN-13 (ou 10) da edição, quando a fonte manda */
  isbn?: string;
  /** idioma da edição (ex.: "pt", "en") */
  idioma?: string;
};

const CAMPOS =
  "key,title,author_name,first_publish_year,number_of_pages_median,cover_i,subject";
const CACHE = "bookside-catalogo";

type DocOL = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  cover_i?: number;
  subject?: string[];
};

const paleta = [
  "#6B0D24",
  "#2B1420",
  "#B75A6B",
  "#6B7A5E",
  "#8E1D3D",
  "#4B0D1B",
];

function paraLivro(d: DocOL, i: number): LivroBusca {
  const workId = d.key.replace("/works/", "");
  return {
    id: `ol-${workId}`,
    titulo: d.title,
    autor: (d.author_name?.[0] ?? "autoria desconhecida").toLowerCase(),
    ano: d.first_publish_year,
    paginas: d.number_of_pages_median,
    genero: d.subject?.[0]?.toLowerCase(),
    cor: paleta[i % paleta.length],
    capa: d.cover_i
      ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`
      : undefined,
    capaGrande: d.cover_i
      ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`
      : undefined,
  };
}

/** Guarda os livros vistos na busca para a página do livro abrir sem buscar de novo. */
function lembrar(livros: LivroBusca[]) {
  try {
    const atual = JSON.parse(sessionStorage.getItem(CACHE) ?? "{}") as Record<
      string,
      LivroBusca
    >;
    for (const l of livros) atual[l.id] = l;
    sessionStorage.setItem(CACHE, JSON.stringify(atual));
  } catch {
    /* sem sessionStorage: tudo bem */
  }
}

/** Guarda livros vistos fora da busca (feed, perfil de amiga) para a página do livro abrir. */
export function lembrarLivros(
  livros: {
    id: string;
    titulo: string;
    autor: string;
    capa?: string;
    genero?: string;
    paginas?: number;
  }[],
) {
  lembrar(livros.map((l) => ({ ...l, cor: corDoLivro(l.id) })));
}

export function livroLembrado(id: string): LivroBusca | undefined {
  try {
    return (
      JSON.parse(sessionStorage.getItem(CACHE) ?? "{}") as Record<
        string,
        LivroBusca
      >
    )[id];
  } catch {
    return undefined;
  }
}

type VolumeGB = {
  id: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    description?: string;
    imageLinks?: { thumbnail?: string };
    language?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
  };
};

/** Tira as marcações HTML que o Google Books manda nas sinopses. */
function textoLimpo(html?: string) {
  return html
    ?.replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .trim();
}

function doGoogle(v: VolumeGB, i: number): LivroBusca | null {
  const info = v.volumeInfo;
  if (!info?.title) return null;
  const capa = info.imageLinks?.thumbnail
    ?.replace(/^http:/, "https:")
    .replace("&edge=curl", "");
  const ano = Number(info.publishedDate?.slice(0, 4));
  return {
    id: `gb-${v.id}`,
    titulo: info.title,
    autor: (info.authors?.[0] ?? "autoria desconhecida").toLowerCase(),
    ano: Number.isFinite(ano) && ano > 0 ? ano : undefined,
    paginas: info.pageCount || undefined,
    genero: info.categories?.[0]?.toLowerCase(),
    sinopse: textoLimpo(info.description),
    cor: paleta[i % paleta.length],
    capa,
    capaGrande: capa?.replace("zoom=1", "zoom=2"),
    isbn: (
      info.industryIdentifiers?.find((x) => x.type === "ISBN_13") ??
      info.industryIdentifiers?.find((x) => x.type === "ISBN_10")
    )?.identifier,
    idioma: info.language,
  };
}

/** Busca só no Google Books (com idioma opcional, ex. "pt" para edições brasileiras). */
export async function livrosDoGoogle(
  q: string,
  lang?: string,
  signal?: AbortSignal,
): Promise<LivroBusca[]> {
  const itens = await volumesDoGoogle(q, 20, signal, { lang });
  return itens
    .map((v, i) => doGoogle(v, i))
    .filter((l): l is LivroBusca => !!l);
}

let semRota = false;

/**
 * Pede ao Google Books. Primeiro pela rota do próprio app (/api/livros, com a
 * chave do projeto e cache de 1 dia: mais rápido e sem bloqueio); sem chave
 * configurada, direto do navegador, como antes.
 */
async function volumesDoGoogle(
  q: string,
  max: number,
  signal?: AbortSignal,
  extra: { lang?: string; inicio?: number } = {},
): Promise<VolumeGB[]> {
  const mais = `${extra.lang ? `&lang=${extra.lang}` : ""}${extra.inicio ? `&inicio=${extra.inicio}` : ""}`;
  const maisGoogle = `${extra.lang ? `&langRestrict=${extra.lang}` : ""}${extra.inicio ? `&startIndex=${extra.inicio}` : ""}`;
  if (!semRota) {
    try {
      const r = await fetch(
        `/api/livros?q=${encodeURIComponent(q)}&max=${max}${mais}`,
        { signal },
      );
      if (r.ok) {
        const dados = (await r.json()) as {
          items?: VolumeGB[];
          semChave?: boolean;
        };
        if (!dados.semChave) return dados.items ?? [];
        semRota = true; // sem chave configurada: daqui em diante, direto do navegador
      } else if (r.status === 404) semRota = true;
    } catch (e) {
      if ((e as Error).name === "AbortError") throw e;
    }
  }
  const r = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=${max}${maisGoogle}&printType=books&fields=items(id,volumeInfo(title,subtitle,authors,publishedDate,pageCount,categories,description,imageLinks/thumbnail,language,industryIdentifiers))`,
    { signal },
  );
  if (!r.ok) throw new Error(`busca falhou (${r.status})`);
  return ((await r.json()) as { items?: VolumeGB[] }).items ?? [];
}

/** Google Books: bom em títulos em português e em palavras ainda incompletas. */
async function buscarNoGoogle(
  termo: string,
  signal?: AbortSignal,
): Promise<LivroBusca[]> {
  const items = await volumesDoGoogle(termo, 20, signal);
  return items.map(doGoogle).filter((l): l is LivroBusca => !!l);
}

async function buscarNaOpenLibrary(
  termo: string,
  signal?: AbortSignal,
): Promise<LivroBusca[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(termo)}&limit=20&fields=${CAMPOS}`;
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`busca falhou (${r.status})`);
  const dados = (await r.json()) as { docs: DocOL[] };
  return dados.docs.filter((d) => d.title).map(paraLivro);
}

const chave = (l: LivroBusca) =>
  `${l.titulo} ${l.autor.split(" ").pop()}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Busca nas duas fontes ao mesmo tempo. O Google Books vem primeiro (edições
 * em português); da Open Library entram os livros que ainda não apareceram.
 * Se uma fonte falhar, a outra basta.
 */
export async function buscarLivros(
  termo: string,
  signal?: AbortSignal,
): Promise<LivroBusca[]> {
  const [google, openLibrary] = await Promise.allSettled([
    buscarNoGoogle(termo, signal),
    buscarNaOpenLibrary(termo, signal),
  ]);
  if (google.status === "rejected" && openLibrary.status === "rejected")
    throw google.reason;
  const todos = [
    ...(google.status === "fulfilled" ? google.value : []),
    ...(openLibrary.status === "fulfilled" ? openLibrary.value : []),
  ];
  const vistos = new Set<string>();
  const livros = todos.filter((l) => {
    const k = chave(l);
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
  lembrar(livros);
  return livros;
}

/** Todos os livros de uma autora nas duas fontes (para achar o título certo entre eles). */
export async function buscarPorAutoria(
  autor: string,
  signal?: AbortSignal,
): Promise<LivroBusca[]> {
  const [google, openLibrary] = await Promise.allSettled([
    buscarNoGoogle(`inauthor:"${autor}"`, signal),
    fetch(
      `https://openlibrary.org/search.json?author=${encodeURIComponent(autor)}&limit=40&fields=${CAMPOS}`,
      {
        signal,
      },
    )
      .then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(String(r.status))),
      )
      .then((d: { docs: DocOL[] }) =>
        d.docs.filter((x) => x.title).map(paraLivro),
      ),
  ]);
  if (google.status === "rejected" && openLibrary.status === "rejected")
    throw google.reason;
  const livros = [
    ...(google.status === "fulfilled" ? google.value : []),
    ...(openLibrary.status === "fulfilled" ? openLibrary.value : []),
  ];
  lembrar(livros);
  return livros;
}

type EntidadeWD = {
  labels?: Record<string, { value: string }>;
  claims?: Record<
    string,
    { mainsnak?: { datavalue?: { value?: { id?: string; text?: string } } } }[]
  >;
};

/**
 * Traduções de um título pelo Wikidata (gratuito, sem chave): acha a obra pelo
 * título em português e devolve o título original/em inglês e a autoria.
 * Ex.: "a biblioteca da meia-noite" → "The Midnight Library", Matt Haig.
 */
export async function traducoesDoTitulo(
  titulo: string,
  signal?: AbortSignal,
): Promise<{ titulo: string; autor?: string }[]> {
  const base = "https://www.wikidata.org/w/api.php?format=json&origin=*";
  const busca = (await fetch(
    `${base}&action=wbsearchentities&type=item&limit=7&language=pt&uselang=pt&search=${encodeURIComponent(titulo)}`,
    { signal },
  ).then((r) => r.json())) as { search?: { id: string }[] };
  const ids = (busca.search ?? []).map((x) => x.id);
  if (!ids.length) return [];
  const { entities } = (await fetch(
    `${base}&action=wbgetentities&props=labels|claims&languages=en|pt&ids=${ids.join("|")}`,
    { signal },
  ).then((r) => r.json())) as { entities: Record<string, EntidadeWD> };
  // só obras com autoria (P50) ou título (P1476): livros, não pessoas ou lugares
  const obras = ids
    .map((id) => entities[id])
    .filter((e) => e?.claims?.P50 || e?.claims?.P1476);
  const idsAutoria = [
    ...new Set(
      obras
        .map((e) => e.claims?.P50?.[0]?.mainsnak?.datavalue?.value?.id)
        .filter((x): x is string => !!x),
    ),
  ];
  const autorias: Record<string, EntidadeWD> = idsAutoria.length
    ? ((
        (await fetch(
          `${base}&action=wbgetentities&props=labels&languages=en|pt&ids=${idsAutoria.join("|")}`,
          {
            signal,
          },
        ).then((r) => r.json())) as { entities: Record<string, EntidadeWD> }
      ).entities ?? {})
    : {};
  const vistos = new Set<string>();
  return obras
    .flatMap((e) => {
      const idAutor = e.claims?.P50?.[0]?.mainsnak?.datavalue?.value?.id;
      const autor = idAutor
        ? (autorias[idAutor]?.labels?.en?.value ??
          autorias[idAutor]?.labels?.pt?.value)
        : undefined;
      const original = e.claims?.P1476?.[0]?.mainsnak?.datavalue?.value?.text;
      return [e.labels?.en?.value, original, e.labels?.pt?.value]
        .filter((t): t is string => !!t)
        .map((t) => ({ titulo: t, autor }));
    })
    .filter((t) => {
      const k = `${t.titulo}|${t.autor}`.toLowerCase();
      if (vistos.has(k) || t.titulo.toLowerCase() === titulo.toLowerCase())
        return false;
      vistos.add(k);
      return true;
    })
    .slice(0, 4);
}

/** Sinopse de uma obra (Open Library ou Google Books), quando existe. */
export async function sinopseDaObra(
  id: string,
  signal?: AbortSignal,
): Promise<string | undefined> {
  if (id.startsWith("gb-")) {
    const r = await fetch(
      `https://www.googleapis.com/books/v1/volumes/${id.slice(3)}?fields=volumeInfo/description`,
      {
        signal,
      },
    );
    if (!r.ok) return undefined;
    const d = (await r.json()) as VolumeGB;
    return textoLimpo(d.volumeInfo?.description);
  }
  if (!id.startsWith("ol-")) return undefined;
  const r = await fetch(`https://openlibrary.org/works/${id.slice(3)}.json`, {
    signal,
  });
  if (!r.ok) return undefined;
  const d = (await r.json()) as { description?: string | { value: string } };
  const texto =
    typeof d.description === "string" ? d.description : d.description?.value;
  return texto?.split(/\n-{3,}|\r?\n\r?\n\(/)[0]?.trim();
}

/*
 * Capas das sugestões locais (que não têm capa no código): buscadas uma vez
 * na Open Library pelo título + autoria e guardadas no navegador.
 * "" = procuramos e não há capa.
 */
const useCapas = create<{
  capas: Record<string, string>;
  definir: (id: string, url: string) => void;
}>()(
  persist(
    (set) => ({
      capas: {},
      definir: (id, url) => set((s) => ({ capas: { ...s.capas, [id]: url } })),
    }),
    {
      name: "bookside-capas-v5",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

let buscandoCapas = false;

/** Tira subtítulo e pontuação para a busca achar mais edições. */
function tituloCurto(titulo: string) {
  return titulo.split(/[:(\[]/)[0].trim();
}

type Fonte = (titulo: string, autor?: string) => Promise<string[]>;

async function urlsDaOpenLibrary(params: string): Promise<string[]> {
  const r = await fetch(
    `https://openlibrary.org/search.json?${params}&limit=8&fields=cover_i`,
  );
  if (!r.ok) throw new Error(String(r.status));
  const { docs } = (await r.json()) as { docs: { cover_i?: number }[] };
  return docs
    .filter((d) => d.cover_i)
    .map((d) => `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`);
}

/** Edições com esse título (e autoria) na Open Library. */
const naOpenLibrary: Fonte = (titulo, autor) =>
  urlsDaOpenLibrary(
    `title=${encodeURIComponent(titulo)}${autor ? `&author=${encodeURIComponent(autor)}` : ""}`,
  );

/**
 * Busca ampla: acha a obra por qualquer edição (inclusive traduzida), então
 * "jogos vorazes" encontra "the hunger games" e usa a capa da obra original.
 */
const daObraOriginal: Fonte = (titulo, autor) =>
  urlsDaOpenLibrary(
    `q=${encodeURIComponent(`${titulo}${autor ? ` ${autor}` : ""}`)}`,
  );

/** Google Books: cobre bem as edições brasileiras (títulos em português). */
const noGoogleBooks: Fonte = async (titulo, autor) => {
  const q = `intitle:${titulo}${autor ? ` inauthor:${autor}` : ""}`;
  const items = await volumesDoGoogle(q, 12);
  return items
    .map((i) => i.volumeInfo?.imageLinks?.thumbnail)
    .filter((u): u is string => !!u)
    .map((u) => u.replace(/^http:/, "https:").replace("&edge=curl", ""));
};

function carregar(url: string, cors: boolean) {
  return new Promise<HTMLImageElement>((ok, falha) => {
    const i = new Image();
    if (cors) i.crossOrigin = "anonymous";
    const tempo = setTimeout(() => falha(new Error("demorou")), 8000);
    i.onload = () => (clearTimeout(tempo), ok(i));
    i.onerror = () => (clearTimeout(tempo), falha(new Error("erro")));
    i.src = url;
  });
}

/** Fundo branco/claro nas bordas: é foto do livro (mockup), não a capa. */
function bordaClara(img: HTMLImageElement) {
  try {
    const w = 40;
    const h = Math.round((img.naturalHeight / img.naturalWidth) * w);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    const d = ctx.getImageData(0, 0, w, h).data;
    let claros = 0;
    let total = 0;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (x > 1 && x < w - 2 && y > 1 && y < h - 2) continue;
        const k = (y * w + x) * 4;
        total++;
        if (d[k] > 228 && d[k + 1] > 228 && d[k + 2] > 228) claros++;
      }
    return claros / total > 0.6;
  } catch {
    return false; // imagem sem permissão de leitura: confia na proporção
  }
}

/**
 * A imagem parece uma capa de verdade? Precisa existir, ter proporção de
 * livro (em pé, ~2:3) e não ser uma foto do livro sobre fundo branco.
 */
export async function pareceCapa(url: string): Promise<boolean> {
  let img: HTMLImageElement;
  let legivel = true;
  try {
    img = await carregar(url, true);
  } catch {
    legivel = false;
    try {
      img = await carregar(url, false);
    } catch {
      return false;
    }
  }
  const { naturalWidth: w, naturalHeight: h } = img;
  if (w < 40 || h < 40) return false;
  const proporcao = h / w;
  if (proporcao < 1.3 || proporcao > 1.75) return false;
  return !(legivel && bordaClara(img));
}

async function procurarCapa(
  tituloCompleto: string,
  autorCompleto: string,
): Promise<string> {
  const titulo = tituloCurto(tituloCompleto);
  const autor =
    !autorCompleto || autorCompleto.startsWith("autoria")
      ? undefined
      : autorCompleto;
  const tentativas: [Fonte, string | undefined][] = [
    // primeiro as edições brasileiras (Google Books), depois a Open Library
    [noGoogleBooks, autor],
    [naOpenLibrary, autor],
    [noGoogleBooks, undefined],
    // sem edição em português com capa: usa a capa da obra original (ex.: em inglês)
    [daObraOriginal, autor],
    [naOpenLibrary, undefined],
  ];
  let falhas = 0;
  const vistas = new Set<string>();
  const testar = async (urls: string[]) => {
    for (const u of urls.slice(0, 6)) {
      if (vistas.has(u)) continue;
      vistas.add(u);
      if (await pareceCapa(u)) return u;
    }
    return "";
  };
  for (const [fonte, a] of tentativas) {
    try {
      const achada = await testar(await fonte(titulo, a));
      if (achada) return achada;
    } catch {
      falhas++;
    }
  }
  // último recurso: o título traduzido/original pelo Wikidata (ex.: em inglês)
  try {
    for (const t of (await traducoesDoTitulo(titulo)).slice(0, 2)) {
      for (const fonte of [noGoogleBooks, daObraOriginal]) {
        try {
          const achada = await testar(await fonte(t.titulo, t.autor ?? autor));
          if (achada) return achada;
        } catch {
          falhas++;
        }
      }
    }
  } catch {
    falhas++;
  }
  // se alguma fonte falhou (sem internet, excesso de buscas), não anota "sem capa":
  // tenta de novo outra hora
  if (falhas) throw new Error("busca incompleta");
  return "";
}

/**
 * Várias capas possíveis para um livro (edições diferentes), das duas fontes,
 * para a pessoa escolher. Falhas de rede de uma fonte não derrubam a outra.
 */
export async function opcoesDeCapa(
  tituloCompleto: string,
  autorCompleto: string,
): Promise<string[]> {
  const titulo = tituloCurto(tituloCompleto);
  const autor =
    !autorCompleto || autorCompleto.startsWith("autoria")
      ? undefined
      : autorCompleto;
  const listas = await Promise.all(
    [noGoogleBooks, naOpenLibrary, daObraOriginal].map((f) =>
      f(titulo, autor).catch(() => [] as string[]),
    ),
  );
  const todas = [...new Set(listas.flat())].slice(0, 30);
  const boas = await Promise.all(todas.map(pareceCapa));
  return todas.filter((_, i) => boas[i]);
}

/**
 * Capa que o app colocou sozinho (não veio da busca nem foi escolhida pela
 * pessoa): pode ser revista quando a busca de capas melhora.
 */
function capaAutomatica(l: LivroSalvo) {
  return (
    !!l.capa &&
    !l.capaEscolhida &&
    (!l.id.startsWith("ol-") || l.capa.includes("books.google"))
  );
}

/**
 * Procura na Open Library a capa de todo livro que ainda não tem uma
 * (sugestões locais e livros da estante que entraram pelo teste, por exemplo)
 * e completa os livros guardados na estante.
 */
export async function completarCapas() {
  if (buscandoCapas) return;
  buscandoCapas = true;
  try {
    await useCapas.persist.rehydrate();
    const pendentes = [
      ...sugestoesDeLivros.map((l) => ({
        id: l.id,
        titulo: l.titulo,
        autor: l.autor,
      })),
      ...usePerfil
        .getState()
        .livros.filter((l) => !l.capa || capaAutomatica(l)),
    ].filter(
      (l, i, todos) =>
        todos.findIndex((x) => x.id === l.id) === i &&
        useCapas.getState().capas[l.id] === undefined,
    );
    for (const l of pendentes) {
      try {
        useCapas
          .getState()
          .definir(l.id, await procurarCapa(l.titulo, l.autor));
      } catch {
        break; // sem internet: tenta de novo outra hora
      }
    }
  } finally {
    buscandoCapas = false;
  }
  const { capas } = useCapas.getState();
  const livros = usePerfil.getState().livros;
  const nova = (l: LivroSalvo) => {
    const achada = capas[l.id];
    if (achada === undefined || achada === l.capa) return l.capa;
    if (!l.capa) return achada || undefined;
    if (!capaAutomatica(l)) return l.capa;
    // capa automática revista: usa a nova; sem nova, só tira a foto do Google
    return achada || (l.capa.includes("books.google") ? undefined : l.capa);
  };
  if (livros.some((l) => nova(l) !== l.capa)) {
    usePerfil.setState({
      livros: livros.map((l) =>
        nova(l) !== l.capa ? { ...l, capa: nova(l) } : l,
      ),
    });
  }
}

/** Liga a busca de capas: agora e sempre que entrar um livro novo sem capa. */
export function iniciarCapas() {
  void completarCapas();
  let espera: ReturnType<typeof setTimeout> | undefined;
  return usePerfil.subscribe((s, antes) => {
    if (
      s.livros === antes.livros ||
      !s.livros.some(
        (l) =>
          (!l.capa || capaAutomatica(l)) &&
          useCapas.getState().capas[l.id] === undefined,
      )
    )
      return;
    clearTimeout(espera);
    espera = setTimeout(() => void completarCapas(), 800);
  });
}

let filaCapas: Promise<unknown> = Promise.resolve();
const pedidosCapa = new Set<string>();

/**
 * Capa de um livro qualquer (feed, clube, perfil de amiga): a que veio com
 * ele; se faltar, a da sua estante; se ainda faltar, procura uma vez
 * (Google Books / Open Library) e guarda no navegador.
 */
export function useCapaDoLivro(
  l: { id: string; titulo: string; autor: string; capa?: string },
  quebrada?: string,
) {
  const daEstanteBruta = usePerfil(
    (s) => s.livros.find((x) => x.id === l.id)?.capa,
  );
  const guardadaBruta = useCapas((s) => s.capas[l.id]);
  // uma capa que não carregou (link quebrado) conta como ausente
  const propria = l.capa && l.capa !== quebrada ? l.capa : undefined;
  const daEstante =
    daEstanteBruta && daEstanteBruta !== quebrada ? daEstanteBruta : undefined;
  const guardada = guardadaBruta === quebrada ? undefined : guardadaBruta;
  const falta = !propria && !daEstante && guardada === undefined;
  const pedido = `${l.id}|${quebrada ?? ""}`;
  useEffect(() => {
    if (!falta || pedidosCapa.has(pedido)) return;
    pedidosCapa.add(pedido);
    // uma busca por vez, para não ser bloqueada por excesso de pedidos
    filaCapas = filaCapas.then(async () => {
      // até 3 tentativas, com uma pausa entre elas (a busca pode estar limitada)
      for (let vez = 0; vez < 3; vez++) {
        try {
          useCapas
            .getState()
            .definir(l.id, await procurarCapa(l.titulo, l.autor));
          return;
        } catch {
          await new Promise((ok) => setTimeout(ok, 4000));
        }
      }
      pedidosCapa.delete(pedido);
    });
  }, [falta, pedido, l.id, l.titulo, l.autor]);
  return propria || daEstante || guardada || undefined;
}

/** Gostos do perfil → assunto do Google Books (as categorias de lá são em inglês). */
const assuntoDoGosto: Record<string, string> = {
  romance: "romance",
  suspense: "thrillers",
  "ficção científica": "science fiction",
  "não ficção": "history",
  poesia: "poetry",
  fantasia: "fantasy",
  drama: "drama",
  clássicos: "classics",
  humor: "humor",
  "histórias de família": "family life",
  biografia: "biography",
  terror: "horror",
};
const SUGESTOES_SESSAO = "bookside-sugestoes";

function embaralhar<T>(lista: T[]) {
  return lista
    .map((x) => ({ x, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(({ x }) => x);
}

/**
 * Sugestões de verdade: livros em português dos gêneros de que a pessoa gosta,
 * com capa, que ela ainda não tem. Sorteia gêneros e páginas, então muda a
 * cada visita; fica guardado durante a visita para não buscar a cada tela.
 */
async function sugestoesPorGosto(
  gostos: string[],
  jaTenho: string[],
): Promise<LivroBusca[]> {
  const chave = `${gostos.join(",")}`;
  try {
    const salvo = JSON.parse(
      sessionStorage.getItem(SUGESTOES_SESSAO) ?? "null",
    ) as {
      chave: string;
      livros: LivroBusca[];
    } | null;
    if (salvo?.chave === chave && salvo.livros.length) return salvo.livros;
  } catch {
    /* sem sessionStorage */
  }
  const escolhidos = embaralhar(
    gostos.map((g) => assuntoDoGosto[g]).filter(Boolean),
  );
  const assuntos = (
    escolhidos.length
      ? escolhidos
      : ["fiction", "romance", "thrillers", "fantasy"]
  ).slice(0, 3);
  const tenho = new Set(jaTenho.map(chaveTitulo));
  const listas = await Promise.all(
    assuntos.map((a) =>
      volumesDoGoogle(`subject:"${a}"`, 20, undefined, {
        lang: "pt",
        inicio: Math.floor(Math.random() * 4) * 10,
      })
        .then((items) =>
          items
            .map(doGoogle)
            .filter(
              (l): l is LivroBusca =>
                !!l && !!l.capa && !tenho.has(chaveTitulo(l.titulo)),
            ),
        )
        .catch(() => [] as LivroBusca[]),
    ),
  );
  // intercala os gêneros e tira repetidos
  const vistos = new Set<string>();
  const livros: LivroBusca[] = [];
  for (let i = 0; livros.length < 15 && listas.some((l) => l[i]); i++) {
    for (const l of listas) {
      const x = l[i];
      if (x && !vistos.has(chaveTitulo(x.titulo))) {
        vistos.add(chaveTitulo(x.titulo));
        livros.push(x);
      }
    }
  }
  if (livros.length) {
    lembrar(livros);
    try {
      sessionStorage.setItem(
        SUGESTOES_SESSAO,
        JSON.stringify({ chave, livros }),
      );
    } catch {
      /* sem sessionStorage */
    }
  }
  return livros;
}

const chaveTitulo = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * Sugestões que mudam: começam com a lista local (sem os livros que a pessoa
 * já tem) e trocam pelas sugestões dos gostos dela assim que chegam.
 */
export function useSugestoesVivas(tirarOsQueTenho = true): LivroBusca[] {
  const locais = useSugestoes();
  const gostos = usePerfil((s) => s.gostos);
  const livros = usePerfil((s) => s.livros);
  const [vivas, setVivas] = useState<LivroBusca[] | null>(null);
  const titulos = livros.map((l) => l.titulo);
  const chaveTitulos = titulos.join("|");
  useEffect(() => {
    let vivo = true;
    sugestoesPorGosto(gostos, chaveTitulos ? chaveTitulos.split("|") : []).then(
      (l) => vivo && l.length && setVivas(l),
    );
    return () => {
      vivo = false;
    };
  }, [gostos, chaveTitulos]);
  const tenho = new Set(titulos.map(chaveTitulo));
  const lista = vivas ?? locais;
  return tirarOsQueTenho
    ? lista.filter((l) => !tenho.has(chaveTitulo(l.titulo)))
    : lista;
}

/** Sugestões locais com as capas já encontradas. */
export function useSugestoes(): LivroBusca[] {
  const capas = useCapas((s) => s.capas);
  return sugestoesDeLivros.map((l) =>
    capas[l.id] ? { ...l, capa: capas[l.id] } : l,
  );
}

type Estado = "sugestoes" | "carregando" | "pronto" | "erro";

/**
 * Hook da busca: espera a pessoa parar de digitar, busca na Open Library
 * e, sem termo (ou sem internet), mostra as sugestões locais.
 */
export function useBuscaLivros(termo: string) {
  const sugestoes = useSugestoesVivas();
  const [estado, setEstado] = useState<Estado>("sugestoes");
  const [resultados, setResultados] = useState<LivroBusca[]>(sugestoesDeLivros);
  const limpo = termo.trim();

  useEffect(() => {
    if (limpo.length < 2) {
      setEstado("sugestoes");
      return;
    }
    const controle = new AbortController();
    setEstado("carregando");
    const espera = setTimeout(() => {
      buscarLivros(limpo, controle.signal)
        .then(async (livros) => {
          // poucos resultados: procura pelo título original (Wikidata) também
          if (livros.length < 3) {
            try {
              const [t] = await traducoesDoTitulo(limpo, controle.signal);
              if (t) {
                const mais = await buscarLivros(
                  `${t.titulo} ${t.autor ?? ""}`.trim(),
                  controle.signal,
                );
                livros = [
                  ...livros,
                  ...mais.filter((m) => !livros.some((l) => l.id === m.id)),
                ];
              }
            } catch {
              /* sem tradução: fica o que achou */
            }
          }
          if (controle.signal.aborted) return;
          setResultados(livros);
          setEstado("pronto");
        })
        .catch((e: unknown) => {
          if ((e as Error).name === "AbortError") return;
          const t = limpo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
          setResultados(
            sugestoesDeLivros.filter((l) =>
              `${l.titulo} ${l.autor}`
                .normalize("NFD")
                .replace(/[̀-ͯ]/g, "")
                .toLowerCase()
                .includes(t),
            ),
          );
          setEstado("erro");
        });
    }, 350);
    return () => {
      clearTimeout(espera);
      controle.abort();
    };
  }, [limpo]);

  return {
    estado,
    resultados: estado === "sugestoes" ? sugestoes : resultados,
  };
}
