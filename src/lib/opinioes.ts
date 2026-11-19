"use client";

/**
 * "O que os leitores acham" na página do livro, só com fontes permitidas:
 * - nota média dos leitores no Google Books e no Open Library;
 * - o que a crítica disse: trecho da seção de recepção da Wikipédia (com crédito e link);
 * - links para ler as resenhas no Skoob e no Goodreads (no site deles);
 * - opiniões de quem usa o The Bookside (notas e resenhas das estantes).
 * Resenhas de outros sites não são copiadas: são textos das pessoas e os sites não liberam.
 */
import {
  livrosDoGoogle,
  traducoesDoTitulo,
  type LivroBusca,
} from "@/lib/catalogo";
import { comTempo, json, mesmoTitulo } from "@/lib/fontes";
import { normalizar } from "@/lib/importar";
import { supabase } from "@/lib/supabase";

export type NotaMedia = {
  fonte: "Google Books" | "Open Library";
  media: number;
  total: number;
};

/**
 * A nota média com mais avaliações em cada fonte, para este livro.
 * Edições brasileiras quase nunca têm nota: aí procura também pelo título
 * original (Wikidata), que costuma ter bem mais avaliações.
 */
export async function notasDosLeitores(
  titulo: string,
  autor: string,
): Promise<NotaMedia[]> {
  const daqui = await notasPorTitulo(titulo, autor);
  const poucas = (f: NotaMedia["fonte"]) =>
    (daqui.find((n) => n.fonte === f)?.total ?? 0) < 20;
  if (!poucas("Google Books") && !poucas("Open Library")) return daqui;
  let original: { titulo: string; autor?: string } | undefined;
  try {
    original = (await traducoesDoTitulo(titulo, comTempo())).find(
      (t) => normalizar(t.titulo) !== normalizar(titulo),
    );
  } catch {
    /* sem tradução: fica o que achou */
  }
  if (!original) return daqui;
  const deLa = await notasPorTitulo(original.titulo, original.autor ?? autor);
  // de cada fonte, a que tem mais avaliações
  return (["Google Books", "Open Library"] as const)
    .map((f) =>
      [daqui, deLa]
        .map((l) => l.find((n) => n.fonte === f))
        .filter((n): n is NotaMedia => !!n)
        .sort((a, b) => b.total - a.total)[0],
    )
    .filter((n): n is NotaMedia => !!n);
}

async function notasPorTitulo(
  titulo: string,
  autor: string,
): Promise<NotaMedia[]> {
  const autoria = autor && !autor.startsWith("autoria") ? autor : "";
  const ol = new URLSearchParams({
    title: titulo,
    fields: "key,title,author_name,ratings_average,ratings_count",
    limit: "10",
  });
  if (autoria) ol.set("author", autoria);
  const [google, doOL] = await Promise.all([
    livrosDoGoogle(
      `intitle:"${titulo}"${autoria ? ` inauthor:"${autoria}"` : ""}`,
      undefined,
      comTempo(),
    ).catch(() => [] as LivroBusca[]),
    json<{
      docs?: {
        title: string;
        author_name?: string[];
        ratings_average?: number;
        ratings_count?: number;
      }[];
    }>(`https://openlibrary.org/search.json?${ol}`),
  ]);
  const sobrenome = autoria ? normalizar(autoria).split(" ").pop() : undefined;
  const confere = (t: string, a: string) =>
    mesmoTitulo(t, titulo) && (!sobrenome || normalizar(a).includes(sobrenome));
  const notas: NotaMedia[] = [];
  const g = google
    .filter((l) => l.avaliacao && confere(l.titulo, l.autor))
    .sort((x, y) => y.avaliacao!.total - x.avaliacao!.total)[0];
  if (g?.avaliacao) notas.push({ fonte: "Google Books", ...g.avaliacao });
  const o = (doOL?.docs ?? [])
    .filter(
      (d) =>
        d.ratings_average &&
        d.ratings_count &&
        confere(d.title, d.author_name?.[0] ?? ""),
    )
    .sort((x, y) => y.ratings_count! - x.ratings_count!)[0];
  if (o)
    notas.push({
      fonte: "Open Library",
      media: o.ratings_average!,
      total: o.ratings_count!,
    });
  return notas;
}

export type Critica = {
  texto: string;
  url: string;
  idioma: "pt" | "en";
  pagina: string;
};

/** HTML da Wikipédia → texto corrido, sem as notas de rodapé ([1], [2]…). */
function textoDoHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc
    .querySelectorAll(
      "sup, style, table, .mw-editsection, .reference, .hatnote, figure",
    )
    .forEach((n) => n.remove());
  return [...doc.querySelectorAll("p")]
    .map(
      (p) =>
        p.textContent
          ?.replace(/\[\d+\]/g, "")
          .replace(/\s+/g, " ")
          .trim() ?? "",
    )
    .filter((t) => t.length > 40);
}

async function recepcaoEm(
  idioma: "pt" | "en",
  titulo: string,
  autor: string,
): Promise<Critica | null> {
  const base = `https://${idioma}.wikipedia.org/w/api.php?format=json&origin=*&formatversion=2`;
  const busca = await json<{ query?: { search?: { title: string }[] } }>(
    `${base}&action=query&list=search&srlimit=5&srsearch=${encodeURIComponent(
      `${titulo} ${autor} ${idioma === "pt" ? "livro" : "novel"}`,
    )}`,
  );
  const pagina = (busca?.query?.search ?? []).find((r) =>
    mesmoTitulo(r.title, titulo),
  )?.title;
  if (!pagina) return null;
  const secoes = await json<{
    parse?: { sections?: { index: string; line: string }[] };
  }>(
    `${base}&action=parse&prop=sections&redirects=1&page=${encodeURIComponent(pagina)}`,
  );
  const secao = (secoes?.parse?.sections ?? []).find((s) =>
    /recep|critic|crític|acolhida|reception|critical/i.test(normalizar(s.line)),
  );
  if (!secao) return null;
  const html = await json<{ parse?: { text?: string } }>(
    `${base}&action=parse&prop=text&redirects=1&page=${encodeURIComponent(pagina)}&section=${secao.index}`,
  );
  const paragrafos = textoDoHtml(html?.parse?.text ?? "");
  if (!paragrafos.length) return null;
  let texto = paragrafos[0];
  if (texto.length < 280 && paragrafos[1]) texto += ` ${paragrafos[1]}`;
  if (texto.length > 700)
    texto = `${texto.slice(0, 700).replace(/\s+\S*$/, "")}…`;
  return {
    texto,
    idioma,
    pagina,
    url: `https://${idioma}.wikipedia.org/wiki/${encodeURIComponent(pagina.replace(/ /g, "_"))}`,
  };
}

/** "O que a crítica disse": seção de recepção da Wikipédia em português; senão, em inglês (pelo título original). */
export async function criticaNaWikipedia(
  titulo: string,
  autor: string,
): Promise<Critica | null> {
  const autoria = autor && !autor.startsWith("autoria") ? autor : "";
  const pt = await recepcaoEm("pt", titulo, autoria).catch(() => null);
  if (pt) return pt;
  const [original] = await traducoesDoTitulo(titulo, comTempo()).catch(
    () => [],
  );
  return recepcaoEm(
    "en",
    original?.titulo ?? titulo,
    original?.autor ?? autoria,
  ).catch(() => null);
}

/** Onde ler resenhas de outros leitores (abre no site deles). */
export function linksDeResenhas(titulo: string, autor: string) {
  const autoria = autor && !autor.startsWith("autoria") ? autor : "";
  const termo = `${titulo} ${autoria}`.trim();
  return [
    {
      nome: "Skoob",
      url: `https://www.google.com/search?q=${encodeURIComponent(`${termo} site:skoob.com.br`)}`,
    },
    {
      nome: "Goodreads",
      url: `https://www.goodreads.com/search?q=${encodeURIComponent(termo)}`,
    },
  ];
}

export type OpiniaoNoApp = {
  id: string;
  usuario: string | null;
  nome: string | null;
  foto: string | null;
  nota: number | null;
  resenha: string | null;
  status: string | null;
};

/** Notas e resenhas de quem usa o The Bookside e tem este livro na estante (mesmo id ou mesmo título). */
export async function opinioesNoApp(
  livroId: string,
  titulo: string,
): Promise<OpiniaoNoApp[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("opinioes_do_livro", {
    p_id: livroId,
    p_titulo: titulo,
  });
  if (error) throw error;
  return (data ?? []) as OpiniaoNoApp[];
}
