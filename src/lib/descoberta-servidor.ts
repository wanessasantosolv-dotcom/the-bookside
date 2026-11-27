/**
 * Descoberta literária no servidor. Etapas:
 *  1. recebe a pesquisa já interpretada pelo app (características, "sem", "parecido com");
 *  2. pesquisa contextual NA INTERNET (Gemini com a ferramenta oficial de busca
 *     do Google, "grounding"): recomendações reais de crítica, prêmios, livreiros
 *     e leitores; cada candidato volta com as páginas que o sustentam;
 *     sem essa ferramenta disponível, usa só as curadorias verificadas e avisa;
 *  3. resolve a EDIÇÃO EM PORTUGUÊS de cada candidato no Google Books
 *     (langRestrict=pt + título e autoria conferidos; capa e ISBN dessa edição);
 *     sem edição em português confirmada, o livro sai;
 *  4. tira materiais não literários e duplicatas da mesma obra;
 *  5. classifica (pertinência, curadoria, leitores, recorrência) e diversifica;
 *  6. guarda o resultado em cache (memória + tabela descoberta_cache, 7 dias).
 * Nada da pessoa vai para o Google: só a pesquisa e títulos de livros.
 */
import { chaveDaObra, diversificar, ehEdicaoPt, naoLiterario, pontuar, tipoDaFonte, type TipoFonte } from "@/lib/descoberta-qualidade";

type Fonte = { titulo: string; url: string; tipo: TipoFonte; dominio: string };
type Candidato = { titulo: string; autor: string; original?: string; porque: string; caracteristicas: string[]; fontes: Fonte[] };
export type LivroDescoberto = {
  id: string;
  titulo: string;
  autor: string;
  ano?: number;
  paginas?: number;
  genero?: string;
  sinopse?: string;
  capa?: string;
  capaGrande?: string;
  isbn?: string;
  idioma?: string;
  editora?: string;
  avaliacao?: { media: number; total: number };
};
export type ItemDescoberto = { livro: LivroDescoberto; porque?: string; caracteristicas: string[]; fontes: Fonte[]; pesquisaExterna: boolean };
export type RespostaDescobrir = { resultados: ItemDescoberto[]; pesquisaExterna: boolean; avisos: string[]; medidas: Medidas };
type Medidas = { candidatos: number; semEdicaoPt: number; naoLiterarios: number; duplicados: number; comFontes: number; ms: number };

export const SEMANA = 7 * 864e5;

export const texto = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const listaDe = (v: unknown, n: number, max = 120) =>
  (Array.isArray(v) ? v : [])
    .map((x) => texto(x, max))
    .filter(Boolean)
    .slice(0, n);
export const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && chave ? { url, chave } : null;
}

export async function contaValida(token: string | undefined) {
  const s = supa();
  if (!s || !token) return false;
  const r = await fetch(`${s.url}/auth/v1/user`, { headers: { apikey: s.chave, Authorization: `Bearer ${token}` } }).catch(() => null);
  return !!r?.ok;
}

export async function lerCache(chave: string, token: string): Promise<RespostaDescobrir | null> {
  const s = supa();
  if (!s) return null;
  const r = await fetch(`${s.url}/rest/v1/descoberta_cache?chave=eq.${encodeURIComponent(chave)}&select=resposta,criado_em`, {
    headers: { apikey: s.chave, Authorization: `Bearer ${token}` },
  }).catch(() => null);
  if (!r?.ok) return null;
  const linhas = (await r.json().catch(() => [])) as { resposta: RespostaDescobrir; criado_em: string }[];
  const l = linhas[0];
  return l && Date.now() - +new Date(l.criado_em) < SEMANA ? l.resposta : null;
}

export async function gravarCache(chave: string, consulta: string, resposta: RespostaDescobrir, token: string) {
  const s = supa();
  if (!s) return;
  await fetch(`${s.url}/rest/v1/descoberta_cache`, {
    method: "POST",
    headers: { apikey: s.chave, Authorization: `Bearer ${token}`, "content-type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ chave, consulta, resposta, criado_em: new Date().toISOString() }),
  }).catch(() => null);
}

/* ───────── Google Books (edição em português) ───────── */

type VolumeGB = {
  id: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    description?: string;
    imageLinks?: { thumbnail?: string };
    language?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
    averageRating?: number;
    ratingsCount?: number;
  };
};

async function volumes(q: string, lang?: string): Promise<VolumeGB[]> {
  const u = new URL("https://www.googleapis.com/books/v1/volumes");
  u.searchParams.set("q", q);
  u.searchParams.set("maxResults", "20");
  u.searchParams.set("printType", "books");
  if (lang) u.searchParams.set("langRestrict", lang);
  if (process.env.GOOGLE_BOOKS_API_KEY) u.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  const r = await fetch(u, { next: { revalidate: 86400 * 7 } }).catch(() => null);
  if (!r?.ok) return [];
  return ((await r.json().catch(() => ({}))) as { items?: VolumeGB[] }).items ?? [];
}

const limpo = (h?: string) => h?.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'").trim();

function paraLivro(v: VolumeGB): LivroDescoberto | null {
  const i = v.volumeInfo;
  if (!i?.title) return null;
  const capa = i.imageLinks?.thumbnail?.replace(/^http:/, "https:").replace("&edge=curl", "");
  const ano = Number(i.publishedDate?.slice(0, 4));
  return {
    id: `gb-${v.id}`,
    titulo: i.subtitle && i.title.length < 4 ? `${i.title}: ${i.subtitle}` : i.title,
    autor: (i.authors?.[0] ?? "autoria desconhecida").toLowerCase(),
    ano: Number.isFinite(ano) && ano > 0 ? ano : undefined,
    paginas: i.pageCount || undefined,
    genero: i.categories?.[0]?.toLowerCase(),
    sinopse: limpo(i.description),
    capa,
    capaGrande: capa?.replace("zoom=1", "zoom=2"),
    isbn: (i.industryIdentifiers?.find((x) => x.type === "ISBN_13") ?? i.industryIdentifiers?.find((x) => x.type === "ISBN_10"))?.identifier,
    idioma: i.language,
    editora: i.publisher,
    avaliacao: i.averageRating && i.ratingsCount ? { media: i.averageRating, total: i.ratingsCount } : undefined,
  };
}

/** a edição brasileira (ou portuguesa) de uma obra, conferida por título e sobrenome do autor */
async function edicaoPt(titulo: string, autor: string, original?: string): Promise<{ livro: LivroDescoberto; motivo?: never } | { livro: null; motivo: "sem-pt" | "nao-literario" }> {
  const sobrenome = norm(autor).split(" ").pop() ?? "";
  const confere = (v: VolumeGB, alvo: string) => {
    const t = norm(v.volumeInfo?.title ?? "");
    const a = norm(v.volumeInfo?.authors?.join(" ") ?? "");
    const base = norm(alvo).slice(0, Math.max(5, Math.min(norm(alvo).length, 22)));
    return (t.startsWith(base) || base.startsWith(t.slice(0, 12))) && (!sobrenome || a.includes(sobrenome));
  };
  let viuNaoLiterario = false;
  for (const alvo of [titulo, original].filter((x): x is string => !!x)) {
    const lista = await volumes(`intitle:"${alvo}" inauthor:"${sobrenome}"`, "pt");
    const certos = lista.filter((v) => confere(v, alvo) && ehEdicaoPt({ idioma: v.volumeInfo?.language }));
    for (const v of [...certos.filter((x) => x.volumeInfo?.imageLinks?.thumbnail), ...certos.filter((x) => !x.volumeInfo?.imageLinks?.thumbnail)]) {
      const l = paraLivro(v);
      if (!l) continue;
      if (naoLiterario({ ...l, categorias: v.volumeInfo?.categories, subtitulo: v.volumeInfo?.subtitle })) {
        viuNaoLiterario = true;
        continue;
      }
      return { livro: l };
    }
  }
  return { livro: null, motivo: viuNaoLiterario ? "nao-literario" : "sem-pt" };
}

/* ───────── pesquisa contextual (Gemini + busca do Google) ───────── */

const SISTEMA = `Você é uma curadora literária brasileira. Use a busca na internet para encontrar recomendações REAIS publicadas por crítica literária, suplementos e revistas culturais (ex.: Quatro Cinco Um, Suplemento Pernambuco, Revista Bula, PublishNews, The Guardian, Literary Hub), prêmios literários, livreiros independentes, bibliotecários, clubes do livro e comunidades de leitores (Goodreads, Skoob, Reddit).
Regras obrigatórias:
- Indique só obras que existem e que tenham edição publicada em português (prefira as brasileiras). Use o título oficial da edição em português; se não houver, não indique.
- Não traduza títulos por conta própria.
- Não indique dicionários, livros didáticos, guias, resumos, manuais ou materiais de ensino de idiomas, a menos que a pesquisa peça.
- "Origem literária" é a tradição literária (língua/país da obra), não a ambientação. "Ambientado em X" é a ambientação.
- Restrições "sem" são obrigatórias.
- Equilibre obras reconhecidas e descobertas menos conhecidas, sem sacrificar a pertinência. Não repita a mesma autoria mais de duas vezes.
- Não deduza gênero nem nacionalidade de quem escreve pelo nome.
- Lista de mais vendidos e descrição comercial de editora não contam como recomendação independente.
Responda SÓ com JSON, sem comentários:
{"livros":[{"titulo":string,"autor":string,"original":string,"porque":string,"caracteristicas":[string]}]}
"titulo": título da edição em português. "original": título original (se diferente). "porque": uma frase concreta (até 110 caracteres) sobre por que ESTE livro responde à pesquisa. "caracteristicas": ids da lista recebida que o livro tem (no máximo 3).
Indique de 12 a 16 livros.`;

const modelos = () => [process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash"].filter((m, i, a): m is string => !!m && a.indexOf(m) === i);

type Grounding = {
  groundingChunks?: { web?: { uri?: string; title?: string } }[];
  groundingSupports?: { segment?: { text?: string }; groundingChunkIndices?: number[] }[];
};

async function pesquisaContextual(pergunta: string, ids: Set<string>): Promise<{ candidatos: Candidato[]; externa: boolean } | null> {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) return null;
  for (const modelo of modelos()) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": chave },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SISTEMA }] },
        contents: [{ role: "user", parts: [{ text: pergunta }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.3 },
      }),
    }).catch(() => null);
    if (!r || !r.ok) continue;
    const dados = (await r.json().catch(() => ({}))) as { candidates?: { content?: { parts?: { text?: string }[] }; groundingMetadata?: Grounding }[] };
    const c = dados.candidates?.[0];
    const bruto = (c?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    const g = c?.groundingMetadata;
    let json: { livros?: Record<string, unknown>[] };
    try {
      json = JSON.parse(bruto.slice(bruto.indexOf("{"), bruto.lastIndexOf("}") + 1));
    } catch {
      continue;
    }
    const pedacos = (g?.groundingChunks ?? []).map((ch) => {
      const dominio = (ch.web?.title ?? "").toLowerCase();
      return { titulo: ch.web?.title ?? "", url: ch.web?.uri ?? "", dominio, tipo: tipoDaFonte(dominio) };
    });
    // as páginas que sustentam cada livro: trechos da resposta que citam o título
    const fontesDe = (titulo: string): Fonte[] => {
      const t = norm(titulo).slice(0, 18);
      const idx = new Set<number>();
      for (const s of g?.groundingSupports ?? []) if (t && norm(s.segment?.text ?? "").includes(t)) for (const i of s.groundingChunkIndices ?? []) idx.add(i);
      return [...idx].map((i) => pedacos[i]).filter((f): f is Fonte => !!f?.url && f.tipo !== "comercial");
    };
    const candidatos = (json.livros ?? [])
      .map((l) => {
        const titulo = texto(l.titulo, 160);
        return {
          titulo,
          autor: texto(l.autor, 120),
          original: texto(l.original, 160) || undefined,
          porque: texto(l.porque, 130),
          caracteristicas: listaDe(l.caracteristicas, 3, 40).filter((x) => ids.has(x)),
          fontes: fontesDe(titulo),
        };
      })
      .filter((l) => l.titulo && l.autor)
      .slice(0, 16);
    return { candidatos, externa: pedacos.length > 0 };
  }
  return null;
}

/* ───────── rota ───────── */

export async function executarDescoberta(corpo: Record<string, unknown>): Promise<RespostaDescobrir> {
  const inicio = Date.now();
  const consulta = texto(corpo.consulta, 200);
  const criterios = listaDe(corpo.criterios, 10, 80);
  const sem = listaDe(corpo.sem, 5, 80);
  const parecido = texto(corpo.parecidoCom, 120);
  const contexto = texto(corpo.contexto, 300);
  const excluir = listaDe(corpo.excluir, 80);
  const ids = new Set(listaDe(corpo.ids, 80, 40));
  const sementes = (Array.isArray(corpo.sementes) ? corpo.sementes : []).slice(0, 20).map((s) => ({ titulo: texto((s as Record<string, unknown>).titulo, 160), autor: texto((s as Record<string, unknown>).autor, 120) })).filter((s) => s.titulo && s.autor);
  const outrosIdiomas = corpo.outrosIdiomas === true;
  const avisos: string[] = [];
  const medidas: Medidas = { candidatos: 0, semEdicaoPt: 0, naoLiterarios: 0, duplicados: 0, comFontes: 0, ms: 0 };

  const pergunta = [
    consulta ? `Pesquisa: ${consulta}` : "",
    criterios.length ? `Características desejadas: ${criterios.join("; ")}` : "",
    sem.length ? `Sem: ${sem.join("; ")}` : "",
    parecido ? `Parecidos com: ${parecido}` : "",
    contexto ? `Contexto: ${contexto}` : "",
    `Ids de características permitidos: ${[...ids].join(", ")}`,
    excluir.length ? `Não indicar: ${excluir.slice(0, 40).join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  // curadoria verificada (sementes) + pesquisa contextual na internet
  const contextual = consulta || criterios.length || parecido ? await pesquisaContextual(pergunta, ids) : null;
  const externa = !!contextual?.externa;
  if (!contextual) avisos.push("A pesquisa em fontes literárias externas não está disponível agora; mostramos só curadorias verificadas.");
  const candidatos: Candidato[] = [
    ...sementes.map((s) => ({ ...s, porque: "", caracteristicas: [], fontes: [] })),
    ...(contextual?.candidatos ?? []),
  ];
  medidas.candidatos = candidatos.length;

  const fora = new Set(excluir.map((t) => norm(t)));
  const vistos = new Set<string>();
  const resolvidos = await Promise.all(
    candidatos.map(async (c, i) => {
      if (fora.has(norm(c.titulo))) return null;
      const r = await edicaoPt(c.titulo, c.autor, c.original);
      if (!r.livro) {
        if (r.motivo === "nao-literario") medidas.naoLiterarios++;
        else medidas.semEdicaoPt++;
        return null;
      }
      return { c, i, livro: r.livro };
    }),
  );
  const unicos = resolvidos
    .filter((x): x is NonNullable<typeof x> => !!x)
    .filter((x) => {
      const k = chaveDaObra(x.livro.titulo, x.livro.autor);
      if (vistos.has(k) || fora.has(norm(x.livro.titulo))) {
        medidas.duplicados++;
        return false;
      }
      vistos.add(k);
      return true;
    });

  const pontuados = unicos
    .map((x) => ({
      ...x,
      p: pontuar({
        posicao: x.i,
        total: candidatos.length,
        caracteristicas: x.c.caracteristicas.length,
        pedidas: Math.min(3, criterios.length),
        fontes: x.c.fontes,
        avaliacao: x.livro.avaliacao,
      }).valor + (x.i < sementes.length ? 0.15 : 0), // a curadoria verificada vem primeiro
    }))
    .sort((a, b) => b.p - a.p);

  const resultados: ItemDescoberto[] = diversificar(pontuados.map((x) => ({ ...x, autor: x.livro.autor }))).map((x) => ({
    livro: x.livro,
    porque: x.c.porque || undefined,
    caracteristicas: x.c.caracteristicas,
    // até 4 referências por livro, as independentes primeiro
    fontes: [...x.c.fontes].sort((a, b) => Number(b.tipo === "critica" || b.tipo === "premio") - Number(a.tipo === "critica" || a.tipo === "premio")).slice(0, 4),
    pesquisaExterna: x.c.fontes.length > 0,
  }));
  medidas.comFontes = resultados.filter((r) => r.fontes.length).length;
  if (contextual && !externa) avisos.push("A busca na internet não respondeu desta vez: as indicações vêm do conhecimento da curadoria automática e foram conferidas no catálogo.");
  if (outrosIdiomas) avisos.push("Edições em outros idiomas aparecem só na pesquisa direta por título, autor ou ISBN.");
  medidas.ms = Date.now() - inicio;
  return { resultados, pesquisaExterna: externa, avisos, medidas };
}

