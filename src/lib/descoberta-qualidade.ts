/**
 * Regras de qualidade da descoberta literária (puras, usadas no servidor e no
 * navegador, e testadas em scripts/testar-descoberta.cjs):
 *  · tipo real da publicação (dicionário, apostila, guia… ficam fora da
 *    descoberta, mas não da pesquisa direta nem de quem pede por eles);
 *  · edição em português confirmada;
 *  · peso de cada fonte de recomendação;
 *  · classificação multifatorial e diversidade.
 */

export type LivroQualidade = {
  titulo: string;
  autor?: string;
  genero?: string;
  /** todas as categorias que a fonte bibliográfica manda */
  categorias?: string[];
  subtitulo?: string;
  idioma?: string;
  paginas?: number;
  avaliacao?: { media: number; total: number };
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** categorias (Google Books / BISAC, em inglês e português) que nunca são literatura de descoberta */
const CATEGORIAS_FORA = [
  "foreign language study",
  "language arts",
  "study aids",
  "reference",
  "education",
  "test preparation",
  "travel",
  "computers",
  "juvenile nonfiction language",
  "dictionaries",
  "dicionarios",
  "linguistica",
  "estudo de linguas",
  "educacao",
  "referencia",
  "turismo",
  "informatica",
  "periodicals",
  "games activities",
  "coloring",
  "colorir",
  "business economics",
  "law",
  "medical",
  "technology engineering",
  "mathematics",
];

/** categorias que confirmam conteúdo literário legítimo (ficção e não ficção de interesse literário) */
const CATEGORIAS_LITERARIAS = [
  "fiction",
  "ficcao",
  "literary",
  "literatura",
  "poetry",
  "poesia",
  "biography",
  "biografia",
  "memoir",
  "essays",
  "ensaios",
  "philosophy",
  "filosofia",
  "history",
  "historia",
  "science",
  "romance",
  "drama",
  "comics",
  "quadrinhos",
  "social science",
  "true crime",
  "juvenile fiction",
  "young adult fiction",
];

/** sinais no título/subtítulo; sozinhos NÃO bastam (um romance pode se chamar "dicionário de…") */
const SINAIS_TITULO: [RegExp, string][] = [
  [/\bdicionario\b|\bdictionary\b|\bvocabulario\b|\bglossario\b/, "dicionário"],
  [/\bgramatica\b|\bgrammar\b|\bconjugacao\b|\bverbos\b/, "gramática"],
  [/\bapostila\b|\bvestibular\b|\benem\b|\bconcursos?\b|\bsimulados?\b|\bquestoes comentadas\b/, "material didático"],
  [/\bexercicios\b|\bcaderno de atividades\b|\bworkbook\b|\batividades para\b/, "exercícios"],
  [/\bcurso de\b|\baprenda\b|\baprender\b|\bpara iniciantes\b|\bfor beginners\b|\blearn\b|\bmetodo de\b/, "ensino"],
  [/\bguia de viagem\b|\btravel guide\b|\bguia turistico\b|\broteiros? de viagem\b/, "guia turístico"],
  [/\blivro de colorir\b|\bcoloring\b|\bcolorir\b/, "livro de colorir"],
  [/\bagenda\b|\bplanner\b|\bdiario de bordo\b/, "agenda"],
  [/\bresumo d[eoa]s?\b|\bresumo\b|\bguia de estudo\b|\bstudy guide\b|\bsparknotes\b|\banalise da obra\b/, "resumo ou guia de estudo"],
  [/\banais\b|\bproceedings\b|\brelatorio\b|\bcatalogo\b|\brevista\b|\bmagazine\b|\bboletim\b/, "publicação não literária"],
  [/\bmanual\b|\bhandbook\b/, "manual"],
  [/\benciclopedia\b|\bencyclopedia\b|\batlas\b/, "enciclopédia"],
];

/** a pessoa está procurando justamente esse tipo de material? (então não esconda) */
export function pedeMaterialTecnico(consulta: string) {
  const c = ` ${norm(consulta)} `;
  return SINAIS_TITULO.some(([re]) => re.test(c)) || /\b(didatico|didaticos|escolar|escolares|para estudar|idioma|idiomas)\b/.test(c);
}

/**
 * Por que este livro não serve para uma descoberta literária (ou null se serve).
 * Decide pelo tipo real: categoria não literária basta; sinal no título só conta
 * junto com ausência de categoria literária ou com outro sinal.
 */
export function naoLiterario(l: LivroQualidade, consulta = ""): string | null {
  if (consulta && pedeMaterialTecnico(consulta)) return null;
  const cats = [...(l.categorias ?? []), l.genero ?? ""].map(norm).filter(Boolean);
  const literaria = cats.some((c) => CATEGORIAS_LITERARIAS.some((k) => c.includes(k)));
  const fora = cats.find((c) => CATEGORIAS_FORA.some((k) => c.includes(k)));
  if (fora && !literaria) return `categoria: ${fora}`;
  const texto = ` ${norm(`${l.titulo} ${l.subtitulo ?? ""}`)} `;
  const sinais = SINAIS_TITULO.filter(([re]) => re.test(texto)).map(([, n]) => n);
  if (!sinais.length) return null;
  if (literaria) return null; // ex.: "Dicionário de lugares imaginários", romance/ensaio
  if (sinais.length >= 2 || !cats.length || fora) return sinais.join(", ");
  return sinais[0];
}

/** edição em português confirmada pelo próprio registro (não basta o título parecer português) */
export const ehEdicaoPt = (l: { idioma?: string }) => !!l.idioma && /^pt\b|^pt-|^por$/i.test(l.idioma);

/* ───────── fontes ───────── */

export type TipoFonte = "critica" | "premio" | "leitores" | "livraria" | "editora" | "comercial" | "referencia" | "outra";

const DOMINIOS: [RegExp, TipoFonte][] = [
  [/quatrocincoum|suplementopernambuco|revistabula|publishnews|folha\.uol|estadao|oglobo|piaui|cultura\.estadao|rascunho|revistacult|literaryhub|lithub|theguardian|nytimes|newyorker|nybooks|bookforum|parisreview|kirkusreviews|npr\.org|bbc\.|lemonde|elpais|bookriot/, "critica"],
  [/premio|prize|award|jabuti|bookerprize|nobelprize|pulitzer|oceanos|sao paulo de literatura|womensprize|nationalbook/, "premio"],
  [/goodreads|skoob|reddit|storygraph|librarything|letterboxd/, "leitores"],
  [/travessa|livrariadavila|blooks|livrariacultura|megafauna|gato sem rabo|gatosemrabo|livrariazaccara|tapera|bookshop\.org|waterstones/, "livraria"],
  [/companhiadasletras|intrinseca|record|rocco|todavia|editora34|ubu|zahar|planeta|harpercollins|darkside|aleph|morrobranco|globolivros|tusquets|nos\.com|dublinense|penguin|randomhouse|simonandschuster|editora/, "editora"],
  [/amazon\.|mercadolivre|americanas|submarino|magazineluiza|shopee|estantevirtual/, "comercial"],
  [/wikipedia|wikidata|openlibrary|books\.google|isbn/, "referencia"],
];

/** peso de cada tipo na classificação (editora confirma edição, mas não é recomendação independente) */
export const PESO_FONTE: Record<TipoFonte, number> = { critica: 1, premio: 1, livraria: 0.7, leitores: 0.6, outra: 0.35, referencia: 0.2, editora: 0.15, comercial: 0 };

export function tipoDaFonte(dominioOuTitulo: string): TipoFonte {
  const d = dominioOuTitulo.toLowerCase();
  return DOMINIOS.find(([re]) => re.test(d))?.[1] ?? "outra";
}

/* ───────── avaliação de leitores ───────── */

/**
 * Média bayesiana (Google Books): puxa notas com poucas avaliações para a média
 * do catálogo. Sem dados, devolve null (não vira zero).
 */
export function notaBayesiana(av?: { media: number; total: number }, m = 30, mediaGeral = 3.8): number | null {
  if (!av || !av.total) return null;
  return (av.media * av.total + mediaGeral * m) / (av.total + m);
}

/* ───────── classificação ───────── */

export type Evidencia = {
  /** posição do candidato na resposta da pesquisa contextual (0 = mais pertinente) */
  posicao: number;
  total: number;
  /** características pedidas que o candidato tem */
  caracteristicas: number;
  pedidas: number;
  fontes: { tipo: TipoFonte; dominio: string }[];
  avaliacao?: { media: number; total: number };
  /** afinidade com o histórico (0 a 1), só nas recomendações espontâneas */
  afinidade?: number | null;
};

const PESOS = { pertinencia: 0.4, curadoria: 0.2, leitores: 0.2, recorrencia: 0.15, afinidade: 0.05 };

/**
 * Pontuação interna (0–1), nunca mostrada ao leitor. Os sinais sem dado saem da
 * conta e o peso deles é redistribuído proporcionalmente entre os que existem.
 */
export function pontuar(e: Evidencia): { valor: number; confianca: number } {
  const independentes = new Set(e.fontes.filter((f) => PESO_FONTE[f.tipo] >= 0.6).map((f) => f.dominio));
  const sinais: [keyof typeof PESOS, number | null][] = [
    ["pertinencia", 0.75 * (1 - e.posicao / Math.max(1, e.total)) + 0.25 * (e.pedidas ? Math.min(1, e.caracteristicas / e.pedidas) : 1)],
    ["curadoria", e.fontes.length ? Math.min(1, e.fontes.filter((f) => f.tipo === "critica" || f.tipo === "premio" || f.tipo === "livraria").reduce((s, f) => s + PESO_FONTE[f.tipo], 0) / 2) : null],
    ["leitores", (() => {
      const b = notaBayesiana(e.avaliacao);
      const deLeitores = e.fontes.some((f) => f.tipo === "leitores");
      if (b === null && !deLeitores) return null;
      return Math.min(1, (b !== null ? (b - 3) / 2 : 0.5) * (deLeitores ? 1 : 0.85) + (deLeitores ? 0.15 : 0));
    })()],
    ["recorrencia", e.fontes.length ? Math.min(1, independentes.size / 3) : null],
    ["afinidade", e.afinidade ?? null],
  ];
  const presentes = sinais.filter(([, v]) => v !== null) as [keyof typeof PESOS, number][];
  const pesoTotal = presentes.reduce((s, [k]) => s + PESOS[k], 0);
  const valor = presentes.reduce((s, [k, v]) => s + PESOS[k] * Math.max(0, Math.min(1, v)), 0) / (pesoTotal || 1);
  return { valor, confianca: pesoTotal };
}

/** diversidade: no máximo `porAutor` livros de uma mesma autoria, sem quebrar a ordem */
export function diversificar<T extends { autor?: string }>(lista: T[], porAutor = 2): T[] {
  const conta = new Map<string, number>();
  const primeiro: T[] = [];
  const depois: T[] = [];
  for (const x of lista) {
    const a = norm(x.autor ?? "");
    const n = conta.get(a) ?? 0;
    (n < porAutor || !a ? primeiro : depois).push(x);
    conta.set(a, n + 1);
  }
  return [...primeiro, ...depois];
}

/** chave da obra (título sem subtítulo + sobrenome), para não mostrar duas edições da mesma */
export function chaveDaObra(titulo: string, autor = "") {
  const t = norm(titulo.split(/[:(]/)[0]);
  return `${t}|${norm(autor)}`;
}
