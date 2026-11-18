"use client";

/**
 * Informações de livros em fontes gratuitas da internet (sem IA):
 * - sinopse, páginas e capa: Google Books (edições em português primeiro),
 *   BrasilAPI pelo ISBN (Mercado Editorial, CBL), Open Library e Wikipédia;
 * Amazon, Goodreads e Skoob não oferecem acesso gratuito aos dados.
 */
import {
  livrosDoGoogle,
  opcoesDeCapa,
  pareceCapa,
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
  /** capas possíveis (edição brasileira primeiro), já conferidas */
  capas: string[];
  /** onde procurou e o que cada fonte respondeu (para conferir quando não acha) */
  passos: string[];
};

export const comTempo = (ms = 12000) => AbortSignal.timeout(ms);

export async function json<T>(url: string): Promise<T | null> {
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
export function mesmoTitulo(achado: string, pedido: string) {
  const a = normalizar(achado);
  const ps = palavras(pedido);
  if (!ps.length) return a.includes(normalizar(pedido));
  return ps.filter((p) => a.includes(p)).length / ps.length >= 0.6;
}

/* ---------- Wikipédia ---------- */

async function resumoDaWikipedia(
  titulo: string,
  autor: string,
  idioma: "pt" | "en" = "pt",
): Promise<string | undefined> {
  const palavraLivro = idioma === "pt" ? "livro" : "novel";
  const busca = await json<{ query?: { search?: { title: string }[] } }>(
    `https://${idioma}.wikipedia.org/w/api.php?action=query&list=search&format=json&origin=*&srlimit=5&srsearch=${encodeURIComponent(
      `${titulo} ${autor} ${palavraLivro}`,
    )}`,
  );
  const sobrenome = autor ? normalizar(autor).split(" ").pop() : undefined;
  for (const r of busca?.query?.search ?? []) {
    if (!mesmoTitulo(r.title, titulo)) continue;
    const resumo = await json<{ extract?: string; type?: string }>(
      `https://${idioma}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(r.title.replace(/ /g, "_"))}`,
    );
    const texto = resumo?.extract?.trim();
    if (!texto || resumo?.type === "disambiguation") continue;
    // confere que o artigo fala de um livro (ou da autora)
    const n = normalizar(texto);
    if (
      /\b(livro|romance|obra|novela|conto|poesia|serie|novel|book)\b/.test(n) ||
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

/** Edições brasileiras (ISBN 978-85 e 978-65) no Open Library: ISBNs e títulos (com acento). */
async function edicoesBrasileiras(
  titulo: string,
  autor: string,
): Promise<{ isbns: string[]; titulos: string[] }> {
  const q = new URLSearchParams({
    title: titulo,
    fields: "title,isbn,language",
    limit: "8",
  });
  if (autor) q.set("author", autor);
  const r = await json<{
    docs?: { title: string; isbn?: string[]; language?: string[] }[];
  }>(`https://openlibrary.org/search.json?${q}`);
  const brasileiro = (i: string) =>
    /^97(885|865)\d{8}$/.test(i) || /^(85|65)\d{7}[\dX]$/.test(i);
  const docs = (r?.docs ?? []).filter((d) => mesmoTitulo(d.title, titulo));
  return {
    isbns: [
      ...new Set(docs.flatMap((d) => (d.isbn ?? []).filter(brasileiro))),
    ].slice(0, 6),
    titulos: docs
      .filter(
        (d) => (d.isbn ?? []).some(brasileiro) || d.language?.includes("por"),
      )
      .map((d) => d.title),
  };
}

/** Sinopse da edição no Open Library pelo ISBN (da edição ou da obra). */
async function sinopsePeloIsbnNoOL(isbn: string): Promise<string | undefined> {
  const e = await json<{
    description?: string | { value: string };
    works?: { key: string }[];
  }>(`https://openlibrary.org/isbn/${isbn}.json`);
  const direto =
    typeof e?.description === "string" ? e.description : e?.description?.value;
  if (direto?.trim()) return direto.trim();
  const obra = e?.works?.[0]?.key?.split("/").pop();
  return obra
    ? sinopseDaObra(`ol-${obra}`, comTempo()).catch(() => undefined)
    : undefined;
}

/** "ÁGUA FRESCA PARA AS FLORES" → "Água fresca para as flores" (títulos em caixa alta de algumas fontes). */
function tituloBonito(t?: string) {
  const x = t?.trim();
  if (!x) return undefined;
  return x === x.toUpperCase() ? x.charAt(0) + x.slice(1).toLowerCase() : x;
}

/** quantos acentos o texto tem (para preferir o título escrito corretamente) */
const acentos = (t: string) =>
  (t.normalize("NFD").match(/[\u0300-\u036f]/g) ?? []).length;

/**
 * Confere as capas achadas (tira as quebradas, as minúsculas e as de "foto do
 * livro") e completa com a busca de capas do app (várias edições).
 */
async function conferirCapas(
  lista: string[],
  titulo: string,
  autor: string,
): Promise<string[]> {
  const unicas = [...new Set(lista)].slice(0, 10);
  const boas = await Promise.all(
    unicas.map((u) => pareceCapa(u).catch(() => false)),
  );
  const aprovadas = unicas.filter((_, i) => boas[i]);
  const mais = await opcoesDeCapa(titulo, autor).catch(() => [] as string[]);
  return [...new Set([...aprovadas, ...mais])].slice(0, 12);
}

/**
 * Procura o livro e junta título (como saiu no Brasil), sinopse, páginas e capas.
 * Ordem: edição brasileira (Google Books em português ou pelo ISBN brasileiro,
 * BrasilAPI, Open Library), depois qualquer edição, Wikipédia em português e,
 * por último, sinopse em inglês (Wikipédia em inglês pelo título original).
 */
export async function infoNaInternet(
  titulo: string,
  autor: string,
): Promise<InfoDoLivro | null> {
  const consulta = `intitle:${titulo}${autor ? ` inauthor:${autor}` : ""}`;
  const passos: string[] = [];
  let googleFalhou = false;
  const google = (q: string, lang?: string) =>
    livrosDoGoogle(q, lang, comTempo()).catch((e: Error) => {
      googleFalhou = true;
      passos.push(
        `Google Books (${q.startsWith("isbn") ? "pelo ISBN" : "em português"}): não respondeu (${e.message})`,
      );
      return [] as LivroBusca[];
    });
  const [googlePt, achados, br] = await Promise.all([
    google(consulta, "pt"),
    acharLivro({ titulo, autor: autor || undefined }).catch(
      () => [] as LivroBusca[],
    ),
    edicoesBrasileiras(titulo, autor).catch(() => ({
      isbns: [] as string[],
      titulos: [] as string[],
    })),
  ]);
  const confere = (x: LivroBusca) => mesmoTitulo(x.titulo, titulo);
  // a edição brasileira no Google Books também pelo ISBN (quando a busca pelo título não acha)
  let edicoesBR = googlePt.filter(confere);
  if (!edicoesBR.length)
    for (const isbn of br.isbns.slice(0, 2)) {
      edicoesBR = await google(`isbn:${isbn}`);
      if (edicoesBR.length) break;
    }
  if (!googleFalhou)
    passos.push(
      `Google Books: ${edicoesBR.length ? "achou a edição brasileira" : "não achou a edição brasileira"}`,
    );
  passos.push(
    `Open Library: ${br.isbns.length ? `${br.isbns.length} edição(ões) brasileira(s)` : "nenhuma edição brasileira"}; busca geral: ${achados.filter(confere).length} resultado(s)`,
  );
  const candidatos = [...edicoesBR, ...achados.filter(confere)].filter(
    (x, i, a) => a.findIndex((y) => y.id === x.id) === i,
  );
  const l = candidatos[0];

  // sinopses na ordem de preferência; para na primeira em português
  const achadas: Sinopse[] = [];
  const emPt = () => achadas.find((x) => !pareceIngles(x.texto));
  const fonteDe = (x: LivroBusca) =>
    x.id.startsWith("gb-") ? "Google Books" : "Open Library";
  for (const x of candidatos.slice(0, 6))
    if (x.sinopse) achadas.push({ texto: x.sinopse, fonte: fonteDe(x) });

  const titulosBR: string[] = edicoesBR.map((x) => x.titulo);
  let paginas = edicoesBR.find((x) => x.paginas)?.paginas ?? l?.paginas;
  const isbns = [
    ...br.isbns,
    ...candidatos.flatMap((c) => (c.isbn ? [c.isbn] : [])),
  ].filter((x, i, a) => a.indexOf(x) === i);
  // capas na ordem de preferência: edição brasileira primeiro
  const capasPossiveis: string[] = br.isbns
    .slice(0, 3)
    .map(
      (i) => `https://covers.openlibrary.org/b/isbn/${i}-L.jpg?default=false`,
    );
  for (const x of edicoesBR) if (x.capa) capasPossiveis.push(x.capa);

  // BrasilAPI pelo ISBN (Mercado Editorial, CBL): sinopse, páginas, capa e título
  for (const isbn of isbns.slice(0, 4)) {
    if (emPt() && paginas && titulosBR.length) break;
    const b = await json<{
      titulo?: string;
      sinopse?: string;
      paginas?: number;
      capa?: string;
    }>(`/api/isbn/${isbn}`);
    passos.push(
      `BrasilAPI (ISBN ${isbn}): ${
        b
          ? [
              b.sinopse ? "sinopse" : "sem sinopse",
              b.paginas ? "páginas" : "",
              b.capa ? "capa" : "sem capa",
            ]
              .filter(Boolean)
              .join(", ")
          : "não achou"
      }`,
    );
    if (!b) continue;
    paginas ??= b.paginas;
    if (b.capa) capasPossiveis.unshift(b.capa);
    const t = tituloBonito(b.titulo);
    if (t && mesmoTitulo(t, titulo) && br.isbns.includes(isbn))
      titulosBR.push(t);
    if (b.sinopse)
      achadas.push({ texto: b.sinopse, fonte: "BrasilAPI (ISBN)" });
  }
  // Open Library pela edição brasileira (ISBN)
  if (!emPt())
    for (const isbn of br.isbns.slice(0, 3)) {
      const t = await sinopsePeloIsbnNoOL(isbn);
      passos.push(
        `Open Library (ISBN ${isbn}): ${t ? "sinopse" : "sem sinopse"}`,
      );
      if (t) achadas.push({ texto: t, fonte: "Open Library" });
      if (emPt()) break;
    }
  // outras edições
  if (!emPt())
    for (const x of candidatos.slice(0, 3)) {
      if (x.sinopse) continue;
      const t = await sinopseDaObra(x.id, comTempo()).catch(() => undefined);
      if (t) achadas.push({ texto: t, fonte: fonteDe(x) });
      if (emPt()) break;
    }
  if (!emPt()) {
    const w = await resumoDaWikipedia(
      titulosBR[0] ?? titulo,
      l?.autor ?? autor,
      "pt",
    );
    passos.push(`Wikipédia: ${w ? "achou" : "não achou artigo do livro"}`);
    if (w) achadas.push({ texto: w, fonte: "Wikipédia" });
  }
  // último caso: em inglês, pelo título original
  if (!achadas.length) {
    const [original] = await traducoesDoTitulo(titulo, comTempo()).catch(
      () => [],
    );
    const w = await resumoDaWikipedia(
      original?.titulo ?? titulo,
      original?.autor ?? autor,
      "en",
    );
    passos.push(`Wikipédia em inglês: ${w ? "achou" : "não achou"}`);
    if (w) achadas.push({ texto: w, fonte: "Wikipédia em inglês" });
  }

  titulosBR.push(...br.titulos);
  for (const x of candidatos) if (x.capa) capasPossiveis.push(x.capa);
  const capas = await conferirCapas(
    capasPossiveis,
    titulosBR[0] ?? titulo,
    l?.autor ?? autor,
  );
  passos.push(`capas: ${capas.length} achada(s)`);
  if (googleFalhou) {
    // o Google não deixa mais buscar sem chave: confere se a chave está na Vercel
    const r = await json<{ semChave?: boolean }>("/api/livros?q=livro&max=1");
    if (r?.semChave)
      passos.push(
        "⚠ a chave do Google Books (GOOGLE_BOOKS_API_KEY) não está na Vercel — sem ela o Google Books não responde",
      );
  }
  const escolhida = emPt() ?? achadas[0];
  if (!l && !escolhida && !capas.length && !paginas) return null;

  // título como saiu no Brasil: o da edição brasileira mais bem escrito (com acentos)
  const tituloBR = titulosBR
    .filter((t) => mesmoTitulo(t, titulo))
    .sort((a, b) => acentos(b) - acentos(a))[0];
  return {
    titulo:
      tituloBR && acentos(tituloBR) >= acentos(titulo) ? tituloBR : titulo,
    autor: l?.autor ?? autor,
    sinopse: escolhida?.texto.slice(0, 1200),
    paginas,
    ano: l?.ano,
    capa: capas[0],
    capas,
    fonte: escolhida?.fonte,
    emIngles: escolhida ? pareceIngles(escolhida.texto) : undefined,
    passos,
  };
}
