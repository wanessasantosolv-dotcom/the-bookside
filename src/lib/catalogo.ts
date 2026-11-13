"use client";

import { useEffect, useState } from "react";
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

type Estado = "sugestoes" | "carregando" | "pronto" | "erro";

/**
 * Hook da busca: espera a pessoa parar de digitar, busca na Open Library
 * e, sem termo (ou sem internet), mostra as sugestões locais.
 */
export function useBuscaLivros(termo: string) {
  const [estado, setEstado] = useState<Estado>("sugestoes");
  const [resultados, setResultados] = useState<LivroBusca[]>(sugestoesDeLivros);
  const limpo = termo.trim();

  useEffect(() => {
    if (limpo.length < 2) {
      setEstado("sugestoes");
      setResultados(sugestoesDeLivros);
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

  return { estado, resultados };
}
