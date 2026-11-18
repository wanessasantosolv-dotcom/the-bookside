"use client";

/**
 * Informações de livros em fontes gratuitas da internet (sem IA):
 * - sinopse, páginas e capa: Google Books e Open Library (pela busca esperta do app),
 *   e o resumo da Wikipédia em português quando elas não têm sinopse;
 * - citações: Wikiquote (em português; se não houver, em inglês).
 */
import {
  sinopseDaObra,
  traducoesDoTitulo,
  type LivroBusca,
} from "@/lib/catalogo";
import { acharLivro, normalizar } from "@/lib/importar";

export type InfoDoLivro = {
  titulo: string;
  autor: string;
  sinopse?: string;
  paginas?: number;
  ano?: number;
  capa?: string;
  /** de onde veio a sinopse */
  fonte?: string;
};
export type Citacao = { texto: string; idioma: "pt" | "en"; fonte: string };

const comTempo = (ms = 12000) => AbortSignal.timeout(ms);

async function json<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { signal: comTempo() });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

/** palavras que contam do título (sem artigos e afins) */
const palavras = (t: string) =>
  normalizar(t)
    .split(" ")
    .filter(
      (p) =>
        p.length > 2 &&
        !["the", "and", "dos", "das", "uma", "com", "para", "por"].includes(p),
    );

/** o título achado é mesmo o livro pedido? */
function mesmoTitulo(achado: string, pedido: string) {
  const a = normalizar(achado);
  const ps = palavras(pedido);
  if (!ps.length) return a.includes(normalizar(pedido));
  return ps.filter((p) => a.includes(p)).length / ps.length >= 0.6;
}

/* ---------- Wikipédia ---------- */

async function resumoDaWikipedia(
  titulo: string,
  autor: string,
): Promise<string | undefined> {
  const busca = await json<{ query?: { search?: { title: string }[] } }>(
    `https://pt.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=5&srsearch=${encodeURIComponent(
      `${titulo} ${autor} livro`,
    )}`,
  );
  const sobrenome = autor ? normalizar(autor).split(" ").pop() : undefined;
  for (const r of busca?.query?.search ?? []) {
    if (!mesmoTitulo(r.title, titulo)) continue;
    const resumo = await json<{ extract?: string; type?: string }>(
      `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(r.title.replace(/ /g, "_"))}`,
    );
    const texto = resumo?.extract?.trim();
    if (!texto || resumo?.type === "disambiguation") continue;
    // confere que o artigo fala de um livro (ou da autora)
    const n = normalizar(texto);
    if (
      /\b(livro|romance|obra|novela|conto|poesia|serie)\b/.test(n) ||
      (sobrenome && n.includes(sobrenome))
    )
      return texto;
  }
  return undefined;
}

/** Procura o livro e junta sinopse, páginas, ano e capa. */
export async function infoNaInternet(
  titulo: string,
  autor: string,
): Promise<InfoDoLivro | null> {
  const achados = await acharLivro({ titulo, autor: autor || undefined }).catch(
    () => [] as LivroBusca[],
  );
  const l = achados.find((x) => mesmoTitulo(x.titulo, titulo));
  let sinopse = l?.sinopse;
  let fonte = sinopse
    ? l!.id.startsWith("gb-")
      ? "Google Books"
      : "Open Library"
    : undefined;
  if (!sinopse && l) {
    sinopse = await sinopseDaObra(l.id, comTempo()).catch(() => undefined);
    if (sinopse)
      fonte = l.id.startsWith("gb-") ? "Google Books" : "Open Library";
  }
  if (!sinopse) {
    sinopse = await resumoDaWikipedia(l?.titulo ?? titulo, l?.autor ?? autor);
    if (sinopse) fonte = "Wikipédia";
  }
  if (!l && !sinopse) return null;
  return {
    titulo: l?.titulo ?? titulo,
    autor: l?.autor ?? autor,
    sinopse: sinopse?.slice(0, 1200),
    paginas: l?.paginas,
    ano: l?.ano,
    capa: l?.capa,
    fonte,
  };
}

/* ---------- Wikiquote ---------- */

/** Tira a marcação de wiki de uma linha de citação. */
export function limparWiki(linha: string) {
  return linha
    .replace(/<ref[^>]*\/>/gi, "")
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/\[https?:\/\/\S+\s([^\]]*)\]/g, "$1")
    .replace(/\[https?:\/\/[^\]]*\]/g, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/'{2,}/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["“”«»]+|["“”«»]+$/g, "")
    .trim();
}

/** Citações de uma página do Wikiquote (linhas que começam com um só "*"). */
export function citacoesDoWikitexto(wikitexto: string): string[] {
  const fim = wikitexto.search(
    /^==\s*(ver também|see also|links externos|external links|referências|references|sobre|about|quotes about)/im,
  );
  const corpo = fim > 0 ? wikitexto.slice(0, fim) : wikitexto;
  const vistas = new Set<string>();
  const lista: string[] = [];
  for (const linha of corpo.split("\n")) {
    const m = linha.match(/^\*(?![*:])\s*(.+)$/);
    if (!m) continue;
    const texto = limparWiki(m[1]);
    if (
      texto.length < 15 ||
      texto.length > 400 ||
      /^(capítulo|chapter|página|page|p\.)\s*\d/i.test(texto)
    )
      continue;
    const chave = normalizar(texto);
    if (vistas.has(chave)) continue;
    vistas.add(chave);
    lista.push(texto);
  }
  return lista;
}

async function citacoesNoWikiquote(
  idioma: "pt" | "en",
  titulo: string,
): Promise<Citacao[]> {
  const base = `https://${idioma}.wikiquote.org/w/api.php?format=json&origin=*&formatversion=2`;
  const busca = await json<{ query?: { search?: { title: string }[] } }>(
    `${base}&action=query&list=search&srlimit=5&srsearch=${encodeURIComponent(titulo)}`,
  );
  const pagina = (busca?.query?.search ?? []).find((r) =>
    mesmoTitulo(r.title, titulo),
  )?.title;
  if (!pagina) return [];
  const p = await json<{ parse?: { wikitext?: string } }>(
    `${base}&action=parse&prop=wikitext&redirects=1&page=${encodeURIComponent(pagina)}`,
  );
  return citacoesDoWikitexto(p?.parse?.wikitext ?? "").map((texto) => ({
    texto,
    idioma,
    fonte: `Wikiquote · ${pagina}`,
  }));
}

/** Até 8 citações: primeiro em português; se não tiver, em inglês (pelo título original). */
export async function citacoesDoLivro(titulo: string): Promise<Citacao[]> {
  const pt = await citacoesNoWikiquote("pt", titulo);
  if (pt.length) return pt.slice(0, 8);
  const originais = await traducoesDoTitulo(titulo, comTempo()).catch(() => []);
  for (const t of [...originais.map((o) => o.titulo), titulo]) {
    const en = await citacoesNoWikiquote("en", t);
    if (en.length) return en.slice(0, 8);
  }
  return [];
}
