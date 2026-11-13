"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";
import { sugestoesDeLivros, type LivroCatalogo } from "@/lib/dados";

/**
 * Busca de livros na Open Library (gratuita, sem chave).
 * https://openlibrary.org/dev/docs/api/search
 * Roda no navegador de quem usa o app.
 */

export type LivroBusca = LivroCatalogo & { capa?: string; capaGrande?: string };

const CAMPOS = "key,title,author_name,first_publish_year,number_of_pages_median,cover_i,subject";
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

const paleta = ["#6B0D24", "#2B1420", "#B75A6B", "#6B7A5E", "#8E1D3D", "#4B0D1B"];

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
    capa: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : undefined,
    capaGrande: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : undefined,
  };
}

/** Guarda os livros vistos na busca para a página do livro abrir sem buscar de novo. */
function lembrar(livros: LivroBusca[]) {
  try {
    const atual = JSON.parse(sessionStorage.getItem(CACHE) ?? "{}") as Record<string, LivroBusca>;
    for (const l of livros) atual[l.id] = l;
    sessionStorage.setItem(CACHE, JSON.stringify(atual));
  } catch {
    /* sem sessionStorage: tudo bem */
  }
}

export function livroLembrado(id: string): LivroBusca | undefined {
  try {
    return (JSON.parse(sessionStorage.getItem(CACHE) ?? "{}") as Record<string, LivroBusca>)[id];
  } catch {
    return undefined;
  }
}

export async function buscarLivros(termo: string, signal?: AbortSignal): Promise<LivroBusca[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(termo)}&limit=20&fields=${CAMPOS}`;
  const r = await fetch(url, { signal });
  if (!r.ok) throw new Error(`busca falhou (${r.status})`);
  const dados = (await r.json()) as { docs: DocOL[] };
  const livros = dados.docs.filter((d) => d.title).map(paraLivro);
  lembrar(livros);
  return livros;
}

/** Sinopse de uma obra da Open Library (quando existe). */
export async function sinopseDaObra(id: string, signal?: AbortSignal): Promise<string | undefined> {
  if (!id.startsWith("ol-")) return undefined;
  const r = await fetch(`https://openlibrary.org/works/${id.slice(3)}.json`, {
    signal,
  });
  if (!r.ok) return undefined;
  const d = (await r.json()) as { description?: string | { value: string } };
  const texto = typeof d.description === "string" ? d.description : d.description?.value;
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
      name: "bookside-capas-v4",
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
  const r = await fetch(`https://openlibrary.org/search.json?${params}&limit=8&fields=cover_i`);
  if (!r.ok) throw new Error(String(r.status));
  const { docs } = (await r.json()) as { docs: { cover_i?: number }[] };
  return docs.filter((d) => d.cover_i).map((d) => `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`);
}

/** Edições com esse título (e autoria) na Open Library. */
const naOpenLibrary: Fonte = (titulo, autor) =>
  urlsDaOpenLibrary(`title=${encodeURIComponent(titulo)}${autor ? `&author=${encodeURIComponent(autor)}` : ""}`);

/**
 * Busca ampla: acha a obra por qualquer edição (inclusive traduzida), então
 * "jogos vorazes" encontra "the hunger games" e usa a capa da obra original.
 */
const daObraOriginal: Fonte = (titulo, autor) =>
  urlsDaOpenLibrary(`q=${encodeURIComponent(`${titulo}${autor ? ` ${autor}` : ""}`)}`);

/** Google Books: cobre bem as edições brasileiras (títulos em português). */
const noGoogleBooks: Fonte = async (titulo, autor) => {
  const q = `intitle:${titulo}${autor ? ` inauthor:${autor}` : ""}`;
  const r = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=12&printType=books&fields=items(volumeInfo/imageLinks)`,
  );
  if (!r.ok) throw new Error(String(r.status));
  const { items } = (await r.json()) as { items?: { volumeInfo?: { imageLinks?: { thumbnail?: string } } }[] };
  return (items ?? [])
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
async function pareceCapa(url: string): Promise<boolean> {
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

async function procurarCapa(tituloCompleto: string, autorCompleto: string): Promise<string> {
  const titulo = tituloCurto(tituloCompleto);
  const autor = !autorCompleto || autorCompleto.startsWith("autoria") ? undefined : autorCompleto;
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
  for (const [fonte, a] of tentativas) {
    let urls: string[];
    try {
      urls = await fonte(titulo, a);
    } catch {
      falhas++;
      continue;
    }
    for (const u of urls.slice(0, 6)) {
      if (vistas.has(u)) continue;
      vistas.add(u);
      if (await pareceCapa(u)) return u;
    }
  }
  // tudo falhou por rede: não guarda "sem capa", tenta outra hora
  if (falhas === tentativas.length) throw new Error("sem conexão");
  return "";
}

/**
 * Várias capas possíveis para um livro (edições diferentes), das duas fontes,
 * para a pessoa escolher. Falhas de rede de uma fonte não derrubam a outra.
 */
export async function opcoesDeCapa(tituloCompleto: string, autorCompleto: string): Promise<string[]> {
  const titulo = tituloCurto(tituloCompleto);
  const autor = !autorCompleto || autorCompleto.startsWith("autoria") ? undefined : autorCompleto;
  const listas = await Promise.all(
    [noGoogleBooks, naOpenLibrary, daObraOriginal].map((f) => f(titulo, autor).catch(() => [] as string[])),
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
  return !!l.capa && !l.capaEscolhida && (!l.id.startsWith("ol-") || l.capa.includes("books.google"));
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
      ...usePerfil.getState().livros.filter((l) => !l.capa || capaAutomatica(l)),
    ].filter(
      (l, i, todos) => todos.findIndex((x) => x.id === l.id) === i && useCapas.getState().capas[l.id] === undefined,
    );
    for (const l of pendentes) {
      try {
        useCapas.getState().definir(l.id, await procurarCapa(l.titulo, l.autor));
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
    usePerfil.setState({ livros: livros.map((l) => (nova(l) !== l.capa ? { ...l, capa: nova(l) } : l)) });
  }
}

/** Liga a busca de capas: agora e sempre que entrar um livro novo sem capa. */
export function iniciarCapas() {
  void completarCapas();
  let espera: ReturnType<typeof setTimeout> | undefined;
  return usePerfil.subscribe((s, antes) => {
    if (
      s.livros === antes.livros ||
      !s.livros.some((l) => (!l.capa || capaAutomatica(l)) && useCapas.getState().capas[l.id] === undefined)
    )
      return;
    clearTimeout(espera);
    espera = setTimeout(() => void completarCapas(), 800);
  });
}

/** Sugestões locais com as capas já encontradas. */
export function useSugestoes(): LivroBusca[] {
  const capas = useCapas((s) => s.capas);
  return sugestoesDeLivros.map((l) => (capas[l.id] ? { ...l, capa: capas[l.id] } : l));
}

type Estado = "sugestoes" | "carregando" | "pronto" | "erro";

/**
 * Hook da busca: espera a pessoa parar de digitar, busca na Open Library
 * e, sem termo (ou sem internet), mostra as sugestões locais.
 */
export function useBuscaLivros(termo: string) {
  const sugestoes = useSugestoes();
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
        .then((livros) => {
          setResultados(livros);
          setEstado("pronto");
        })
        .catch((e: unknown) => {
          if ((e as Error).name === "AbortError") return;
          const t = limpo.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
          setResultados(
            sugestoesDeLivros.filter((l) =>
              `${l.titulo} ${l.autor}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().includes(t),
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
