"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { usePerfil } from "@/lib/perfil-store";
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
  const r = await fetch(`https://openlibrary.org/works/${id.slice(3)}.json`, { signal });
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
const useCapas = create<{ capas: Record<string, string>; definir: (id: string, url: string) => void }>()(
  persist(
    (set) => ({ capas: {}, definir: (id, url) => set((s) => ({ capas: { ...s.capas, [id]: url } })) }),
    { name: "bookside-capas", storage: createJSONStorage(() => localStorage) },
  ),
);

let buscandoCapas = false;

async function procurarCapa(titulo: string, autor: string): Promise<string> {
  const semAutoria = !autor || autor.startsWith("autoria");
  const url = `https://openlibrary.org/search.json?title=${encodeURIComponent(titulo)}${
    semAutoria ? "" : `&author=${encodeURIComponent(autor)}`
  }&limit=5&fields=cover_i`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(String(r.status));
  const { docs } = (await r.json()) as { docs: { cover_i?: number }[] };
  const capa = docs.find((d) => d.cover_i)?.cover_i;
  return capa ? `https://covers.openlibrary.org/b/id/${capa}-M.jpg` : "";
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
      ...sugestoesDeLivros.map((l) => ({ id: l.id, titulo: l.titulo, autor: l.autor })),
      ...usePerfil.getState().livros.filter((l) => !l.capa),
    ].filter((l, i, todos) => todos.findIndex((x) => x.id === l.id) === i && useCapas.getState().capas[l.id] === undefined);
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
  if (livros.some((l) => !l.capa && capas[l.id])) {
    usePerfil.setState({ livros: livros.map((l) => (!l.capa && capas[l.id] ? { ...l, capa: capas[l.id] } : l)) });
  }
}

/** Liga a busca de capas: agora e sempre que entrar um livro novo sem capa. */
export function iniciarCapas() {
  void completarCapas();
  let espera: ReturnType<typeof setTimeout> | undefined;
  return usePerfil.subscribe((s, antes) => {
    if (s.livros === antes.livros || !s.livros.some((l) => !l.capa && useCapas.getState().capas[l.id] === undefined)) return;
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

  return { estado, resultados: estado === "sugestoes" ? sugestoes : resultados };
}
