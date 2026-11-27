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
export type RespostaDescobrir = { versao: string; resultados: ItemDescoberto[]; pesquisaExterna: boolean; avisos: string[]; medidas: Medidas; diagnostico?: Diagnostico | null };
/** versão do motor: muda a chave do cache e descarta resultados de regras antigas */
export const VERSAO_DESCOBERTA = "v3";
type Medidas = { candidatos: number; semEdicaoPt: number; naoLiterarios: number; duplicados: number; comFontes: number; semEvidencia: number; metadadosFracos: number; ms: number };

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

/*
 * Duas etapas, para que a seleção venha de evidências e não da memória do modelo:
 *  A) PESQUISA: Gemini com a ferramenta oficial de busca do Google (grounding)
 *     escreve um relatório livre com as obras recomendadas que encontrou nas
 *     páginas; a resposta traz a lista real de páginas consultadas.
 *  B) EXTRAÇÃO: um segundo pedido (sem internet) só organiza o relatório em JSON,
 *     ligando cada obra aos números das páginas que a citaram. Obra sem página
 *     não entra.
 */
const PESQUISA = `Você é uma livreira brasileira experiente. Pesquise NA INTERNET recomendações reais para a pesquisa do leitor, em crítica literária, suplementos e revistas culturais (Quatro Cinco Um, Suplemento Pernambuco, Revista Bula, PublishNews, Folha, Estadão, The Guardian, Literary Hub, Book Riot), prêmios literários, livreiros, bibliotecários, clubes do livro e comunidades de leitores (Goodreads, Skoob, Reddit).
Faça várias buscas diferentes (por exemplo: a pesquisa traduzida para inglês, "melhores", "recomendações", "traduzidos para o português", "edição brasileira").
Considere só obras LITERÁRIAS pertinentes (romances, contos, poesia, memórias, ensaios), nunca dicionários, revistas, anais, teses, apostilas, guias ou material didático, a menos que a pesquisa peça.
"Origem literária" é a tradição (língua/país da obra), não a ambientação.
Escreva um relatório em português listando de 12 a 18 obras, uma por linha, no formato:
Título da edição em português — Autoria — título original — por que responde à pesquisa (uma frase concreta) — onde foi recomendada.
Só inclua obras que você viu recomendadas nas páginas pesquisadas e que tenham edição publicada em português. Não traduza títulos por conta própria.`;

const EXTRACAO = `Você recebe um relatório de pesquisa e a lista numerada das páginas consultadas.
Extraia as obras do relatório (sem acrescentar nenhuma) em JSON:
{"livros":[{"titulo":string,"autor":string,"original":string,"porque":string,"caracteristicas":[string],"paginas":[number]}]}
"paginas": números das páginas da lista que citam ou recomendam a obra, segundo o relatório e os títulos das páginas. Se nenhuma, [].
"porque": a justificativa do relatório, reescrita em até 110 caracteres, concreta e específica da obra.
"caracteristicas": só ids da lista permitida que a obra tem (no máximo 3).
Não indique dicionários, revistas, anais, teses ou material didático.`;

const modelos = () => [process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-2.5-flash"].filter((m, i, a): m is string => !!m && a.indexOf(m) === i);

type Grounding = {
  groundingChunks?: { web?: { uri?: string; title?: string } }[];
  groundingSupports?: { segment?: { text?: string }; groundingChunkIndices?: number[] }[];
};

async function gemini(modelo: string, sistema: string, pergunta: string, extra: Record<string, unknown>) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: sistema }] }, contents: [{ role: "user", parts: [{ text: pergunta }] }], ...extra }),
    signal: AbortSignal.timeout(35000),
  }).catch(() => null);
  if (!r?.ok) return null;
  const dados = (await r.json().catch(() => ({}))) as { candidates?: { content?: { parts?: { text?: string }[] }; groundingMetadata?: Grounding }[] };
  const c = dados.candidates?.[0];
  return { texto: (c?.content?.parts ?? []).map((p) => p.text ?? "").join(""), g: c?.groundingMetadata };
}

export type Diagnostico = { etapa: "sem-chave" | "pesquisa-falhou" | "sem-paginas" | "extracao-falhou" | "ok"; paginas: number; modelo?: string };

async function pesquisaContextual(pergunta: string, ids: Set<string>): Promise<{ candidatos: Candidato[]; externa: boolean; diagnostico: Diagnostico }> {
  if (!process.env.GEMINI_API_KEY) return { candidatos: [], externa: false, diagnostico: { etapa: "sem-chave", paginas: 0 } };
  for (const modelo of modelos()) {
    const a = await gemini(modelo, PESQUISA, pergunta, { tools: [{ google_search: {} }], generationConfig: { temperature: 0.2 } });
    if (!a?.texto) continue;
    const paginas = (a.g?.groundingChunks ?? [])
      .map((ch) => {
        const dominio = (ch.web?.title ?? "").toLowerCase();
        return { titulo: ch.web?.title ?? "", url: ch.web?.uri ?? "", dominio, tipo: tipoDaFonte(dominio) };
      })
      .filter((f) => f.url);
    if (!paginas.length) return { candidatos: [], externa: false, diagnostico: { etapa: "sem-paginas", paginas: 0, modelo } };
    // trechos do relatório ligados a cada página (ajudam a extração a atribuir as fontes)
    const trechos = new Map<number, string[]>();
    for (const s of a.g?.groundingSupports ?? []) for (const i of s.groundingChunkIndices ?? []) trechos.set(i, [...(trechos.get(i) ?? []), (s.segment?.text ?? "").slice(0, 200)]);
    const lista = paginas.map((p, i) => `[${i}] ${p.dominio}${trechos.get(i)?.length ? ` — citado em: ${trechos.get(i)!.slice(0, 3).join(" | ")}` : ""}`).join("\n");
    const b = await gemini(modelo, EXTRACAO, `Ids permitidos: ${[...ids].join(", ")}\n\nPáginas consultadas:\n${lista}\n\nRelatório:\n${a.texto.slice(0, 12000)}`, {
      generationConfig: { responseMimeType: "application/json", temperature: 0 },
    });
    let json: { livros?: Record<string, unknown>[] } = {};
    try {
      json = JSON.parse(b?.texto ?? "");
    } catch {
      return { candidatos: [], externa: true, diagnostico: { etapa: "extracao-falhou", paginas: paginas.length, modelo } };
    }
    const candidatos = (json.livros ?? [])
      .map((l) => ({
        titulo: texto(l.titulo, 160),
        autor: texto(l.autor, 120),
        original: texto(l.original, 160) || undefined,
        porque: texto(l.porque, 130),
        caracteristicas: listaDe(l.caracteristicas, 3, 40).filter((x) => ids.has(x)),
        fontes: [...new Set((Array.isArray(l.paginas) ? l.paginas : []).map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < paginas.length))]
          .map((n) => paginas[n])
          .filter((f) => f.tipo !== "comercial"),
      }))
      .filter((l) => l.titulo && l.autor)
      .slice(0, 18);
    return { candidatos, externa: true, diagnostico: { etapa: "ok", paginas: paginas.length, modelo } };
  }
  return { candidatos: [], externa: false, diagnostico: { etapa: "pesquisa-falhou", paginas: 0 } };
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
  const medidas: Medidas = { candidatos: 0, semEdicaoPt: 0, naoLiterarios: 0, duplicados: 0, comFontes: 0, semEvidencia: 0, metadadosFracos: 0, ms: 0 };
  let diagnostico: Diagnostico | null = null;

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
  diagnostico = contextual?.diagnostico ?? null;
  // elegibilidade: candidato da pesquisa só entra com pelo menos uma página real que o recomende
  const comEvidencia = (contextual?.candidatos ?? []).filter((c) => c.fontes.length);
  medidas.semEvidencia = (contextual?.candidatos.length ?? 0) - comEvidencia.length;
  const candidatos: Candidato[] = [
    ...sementes.map((s) => ({ ...s, porque: "", caracteristicas: [], fontes: [] })),
    ...comEvidencia,
  ];
  medidas.candidatos = candidatos.length;

  const fora = new Set(excluir.map((t) => norm(t)));
  const vistos = new Set<string>();
  const resolvidos = await Promise.all(
    candidatos.map(async (c, i) => {
      if (fora.has(norm(c.titulo))) return null;
      const r = await edicaoPt(c.titulo, c.autor, c.original);
      if (r.livro && (!r.livro.capa || /desconhecid/.test(r.livro.autor))) {
        medidas.metadadosFracos++;
        return null;
      }
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
  if (contextual && !externa && !sementes.length) avisos.push("A pesquisa em fontes literárias não respondeu desta vez.");
  if (outrosIdiomas) avisos.push("Edições em outros idiomas aparecem só na pesquisa direta por título, autor ou ISBN.");
  medidas.ms = Date.now() - inicio;
  return { versao: VERSAO_DESCOBERTA, resultados, pesquisaExterna: externa, avisos, medidas, diagnostico };
}

