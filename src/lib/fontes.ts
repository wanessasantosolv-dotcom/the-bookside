"use client";

/**
 * Informações de livros em fontes gratuitas da internet (sem IA):
 * - sinopse, páginas e capa: Google Books (edições em português primeiro),
 *   BrasilAPI pelo ISBN (Mercado Editorial, CBL), Open Library e Wikipédia;
 * - citações: Wikiquote em português e em inglês, na página do livro ou na
 *   página da autora (as frases que citam o livro como fonte).
 * Amazon, Goodreads e Skoob não oferecem acesso gratuito aos dados.
 */
import {
  livrosDoGoogle,
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
  /** a sinopse só foi achada em inglês */
  emIngles?: boolean;
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

/** o texto parece inglês? (para preferir sinopses em português) */
export function pareceIngles(t: string) {
  const n = ` ${normalizar(t)} `;
  const conta = (ps: string[]) =>
    ps.reduce((k, p) => k + (n.split(` ${p} `).length - 1), 0);
  return (
    conta(["the", "and", "of", "is", "her", "his", "with"]) >
    conta(["que", "de", "e", "um", "uma", "nao", "com", "da", "do"])
  );
}

type Sinopse = { texto: string; fonte: string };

async function sinopseDaBrasilAPI(
  isbn: string,
): Promise<{ sinopse?: string; paginas?: number; capa?: string } | null> {
  return json(`/api/isbn/${isbn}`);
}

/** ISBNs de edições brasileiras (978-85 e 978-65) no Open Library. */
async function isbnsBrasileiros(
  titulo: string,
  autor: string,
): Promise<string[]> {
  const q = new URLSearchParams({
    title: titulo,
    fields: "title,isbn",
    limit: "5",
  });
  if (autor) q.set("author", autor);
  const r = await json<{ docs?: { title: string; isbn?: string[] }[] }>(
    `https://openlibrary.org/search.json?${q}`,
  );
  return (r?.docs ?? [])
    .filter((d) => mesmoTitulo(d.title, titulo))
    .flatMap((d) => d.isbn ?? [])
    .filter(
      (i) => /^97(885|865)\d{8}$/.test(i) || /^(85|65)\d{7}[\dX]$/.test(i),
    )
    .slice(0, 6);
}

/** Procura o livro e junta sinopse, páginas, ano e capa. */
export async function infoNaInternet(
  titulo: string,
  autor: string,
): Promise<InfoDoLivro | null> {
  const consulta = `intitle:${titulo}${autor ? ` inauthor:${autor}` : ""}`;
  const [emPortugues, achados] = await Promise.all([
    livrosDoGoogle(consulta, "pt", comTempo()).catch(() => [] as LivroBusca[]),
    acharLivro({ titulo, autor: autor || undefined }).catch(
      () => [] as LivroBusca[],
    ),
  ]);
  const candidatos = [...emPortugues, ...achados].filter(
    (x, i, a) =>
      mesmoTitulo(x.titulo, titulo) && a.findIndex((y) => y.id === x.id) === i,
  );
  const l = candidatos[0];

  // sinopses na ordem de preferência; para na primeira em português
  const achadas: Sinopse[] = [];
  const emPt = () => achadas.find((x) => !pareceIngles(x.texto));
  const fonteDe = (x: LivroBusca) =>
    x.id.startsWith("gb-") ? "Google Books" : "Open Library";
  for (const x of candidatos.slice(0, 6))
    if (x.sinopse) achadas.push({ texto: x.sinopse, fonte: fonteDe(x) });

  let paginas = l?.paginas;
  let capa = l?.capa;
  if (!emPt() || !paginas) {
    // BrasilAPI pelo ISBN: primeiro os ISBNs brasileiros (978-85 / 978-65) do
    // Open Library, depois os das edições do Google Books
    const isbns = [
      ...(await isbnsBrasileiros(titulo, autor)),
      ...candidatos.flatMap((c) => (c.isbn ? [c.isbn] : [])),
    ].filter((x, i, a) => a.indexOf(x) === i);
    for (const isbn of isbns.slice(0, 4)) {
      const b = await sinopseDaBrasilAPI(isbn);
      if (!b) continue;
      paginas ??= b.paginas;
      capa ??= b.capa;
      if (b.sinopse)
        achadas.push({ texto: b.sinopse, fonte: "BrasilAPI (ISBN)" });
      if (emPt() && paginas) break;
    }
  }
  if (!emPt()) {
    for (const x of candidatos.slice(0, 3)) {
      if (x.sinopse) continue;
      const t = await sinopseDaObra(x.id, comTempo()).catch(() => undefined);
      if (t) achadas.push({ texto: t, fonte: fonteDe(x) });
      if (emPt()) break;
    }
  }
  if (!emPt()) {
    const w = await resumoDaWikipedia(l?.titulo ?? titulo, l?.autor ?? autor);
    if (w) achadas.push({ texto: w, fonte: "Wikipédia" });
  }
  const escolhida = emPt() ?? achadas[0];
  if (!l && !escolhida) return null;
  return {
    // o título digitado só é trocado pelo da edição brasileira do Google Books
    titulo:
      emPortugues.find((x) => mesmoTitulo(x.titulo, titulo))?.titulo ?? titulo,
    autor: l?.autor ?? autor,
    sinopse: escolhida?.texto.slice(0, 1200),
    paginas,
    ano: l?.ano,
    capa,
    fonte: escolhida?.fonte,
    emIngles: escolhida ? pareceIngles(escolhida.texto) : undefined,
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

/**
 * Na página de uma autora no Wikiquote, as frases vêm em seções por obra
 * ("== O Pequeno Príncipe ==") ou com a fonte embaixo ("** O Pequeno Príncipe, cap. 2").
 * Pega só as que são do livro pedido.
 */
export function citacoesDaObra(wikitexto: string, titulos: string[]): string[] {
  const linhas = wikitexto.split("\n");
  const doLivro = (t: string) =>
    titulos.some((x) => mesmoTitulo(limparWiki(t), x));
  const lista: string[] = [];
  let secao = "";
  for (let i = 0; i < linhas.length; i++) {
    const titulo = linhas[i].match(/^=+\s*(.+?)\s*=+\s*$/);
    if (titulo) {
      secao = titulo[1];
      continue;
    }
    const m = linhas[i].match(/^\*(?![*:])\s*(.+)$/);
    if (!m) continue;
    let fonte = "";
    for (let j = i + 1; j < linhas.length && /^\*[*:]/.test(linhas[j]); j++)
      fonte += ` ${linhas[j]}`;
    if (!doLivro(secao) && !doLivro(fonte)) continue;
    const texto = limparWiki(m[1]);
    if (texto.length >= 15 && texto.length <= 400 && !lista.includes(texto))
      lista.push(texto);
  }
  return lista;
}

async function buscarPagina(idioma: "pt" | "en", termo: string) {
  const busca = await json<{ query?: { search?: { title: string }[] } }>(
    `https://${idioma}.wikiquote.org/w/api.php?format=json&origin=*&formatversion=2&action=query&list=search&srlimit=5&srsearch=${encodeURIComponent(termo)}`,
  );
  return (busca?.query?.search ?? []).map((r) => r.title);
}

async function wikitextoDe(idioma: "pt" | "en", pagina: string) {
  const p = await json<{ parse?: { wikitext?: string } }>(
    `https://${idioma}.wikiquote.org/w/api.php?format=json&origin=*&formatversion=2&action=parse&prop=wikitext&redirects=1&page=${encodeURIComponent(pagina)}`,
  );
  return p?.parse?.wikitext ?? "";
}

/** Página da autora no Wikiquote: frases que citam o livro. */
async function citacoesNaPaginaDaAutora(
  idioma: "pt" | "en",
  autor: string,
  titulos: string[],
): Promise<Citacao[]> {
  const sobrenome = normalizar(autor).split(" ").pop() ?? "";
  const pagina = (await buscarPagina(idioma, autor)).find(
    (t) => sobrenome && normalizar(t).includes(sobrenome),
  );
  if (!pagina) return [];
  return citacoesDaObra(await wikitextoDe(idioma, pagina), titulos).map(
    (texto) => ({
      texto,
      idioma,
      fonte: `Wikiquote · ${pagina}`,
    }),
  );
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

/**
 * Até 8 citações. Ordem: página do livro no Wikiquote em português, página da
 * autora em português, e depois o mesmo em inglês (pelo título original).
 */
export async function citacoesDoLivro(
  titulo: string,
  autor = "",
): Promise<Citacao[]> {
  const originais = await traducoesDoTitulo(titulo, comTempo()).catch(() => []);
  const titulos = [titulo, ...originais.map((o) => o.titulo)].filter(
    (t, i, a) => a.indexOf(t) === i,
  );
  const autoria =
    autor && autor !== "autoria desconhecida"
      ? autor
      : (originais[0]?.autor ?? "");
  const etapas: (() => Promise<Citacao[]>)[] = [
    ...titulos.map((t) => () => citacoesNoWikiquote("pt", t)),
    ...(autoria
      ? [() => citacoesNaPaginaDaAutora("pt", autoria, titulos)]
      : []),
    ...titulos.map((t) => () => citacoesNoWikiquote("en", t)),
    ...(autoria
      ? [() => citacoesNaPaginaDaAutora("en", autoria, titulos)]
      : []),
  ];
  for (const etapa of etapas) {
    const achadas = await etapa().catch(() => []);
    if (achadas.length) return achadas.slice(0, 8);
  }
  return [];
}
