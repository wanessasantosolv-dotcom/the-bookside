/**
 * Taxonomia literária da descoberta.
 *
 * Cada característica tem id estável, nome em português, categoria, sinônimos
 * (inclusive termos em inglês que leitores usam, como "cozy" ou "slow burn") e
 * os termos usados para buscar no catálogo. "objetiva" diz se o dado pode ser
 * confirmado nos metadados (páginas, idioma, ano); as demais são
 * interpretativas e aparecem assim para quem lê.
 */

export type Categoria = "atmosfera" | "ritmo" | "experiencia" | "tematica" | "ambientacao" | "narrativa" | "origem" | "genero" | "extensao" | "idioma" | "periodo";

export type Caracteristica = {
  id: string;
  nome: string;
  categoria: Categoria;
  sinonimos: string[];
  /** termos de busca no catálogo (o primeiro é o principal) */
  termos: string[];
  /** assunto do Google Books, quando existe um equivalente */
  assunto?: string;
  objetiva?: boolean;
  /** extensão: limites de páginas; idioma: código; período: anos */
  paginas?: [number, number];
  idioma?: string;
  anos?: [number, number];
};

const c = (id: string, nome: string, categoria: Categoria, sinonimos: string[], termos: string[], extra: Partial<Caracteristica> = {}): Caracteristica => ({ id, nome, categoria, sinonimos, termos, ...extra });

export const CARACTERISTICAS: Caracteristica[] = [
  // atmosferas
  c("acolhedora", "Acolhedora", "atmosfera", ["acolhedor", "acolhedores", "acolhedoras", "aconchegante", "aconchegantes", "cozy", "confortavel", "quentinho", "fofo", "reconfortante", "reconfortantes", "comfort"], ["acolhedor", "aconchegante"]),
  c("contemplativa", "Contemplativa", "atmosfera", ["contemplativo", "contemplativos", "calmo", "calmos", "calma", "tranquilo", "tranquilos", "sereno", "quiet"], ["contemplativo", "tranquilo"]),
  c("melancolica", "Melancólica", "atmosfera", ["melancolico", "melancolicos", "melancolicas", "triste", "tristes", "sad", "agridoce"], ["melancolia"]),
  c("nostalgica", "Nostálgica", "atmosfera", ["nostalgico", "nostalgicos", "nostalgia", "saudade"], ["nostalgia", "memórias"]),
  c("esperancosa", "Esperançosa", "atmosfera", ["esperancoso", "esperancosos", "esperanca", "otimista", "final feliz", "finais esperancosos", "hopeful"], ["esperança"]),
  c("intimista", "Intimista", "atmosfera", ["intimo", "intimos", "delicado", "delicada", "sensivel"], ["intimista"]),
  c("misteriosa", "Misteriosa", "atmosfera", ["misterioso", "misteriosos", "misterio", "misterios", "enigmatico", "segredo", "segredos"], ["mistério"], { assunto: "Fiction / Mystery & Detective" }),
  c("sombria", "Sombria", "atmosfera", ["sombrio", "sombrios", "dark", "obscuro", "gotico", "gotica", "goticos"], ["sombrio", "gótico"]),
  c("perturbadora", "Perturbadora", "atmosfera", ["perturbador", "perturbadores", "inquietante", "desconfortavel", "angustiante"], ["perturbador", "inquietante"]),
  c("onirica", "Onírica", "atmosfera", ["onirico", "oniricos", "sonho", "sonhos", "surreal", "surrealista", "ghibli", "studio ghibli", "dreamy"], ["onírico", "fábula"]),
  c("encantadora", "Encantadora", "atmosfera", ["encantador", "encantadores", "magico", "mágico", "whimsical", "caprichoso"], ["encantador"]),
  c("divertida", "Divertida", "atmosfera", ["divertido", "divertidos", "engracado", "engracados", "humor", "comedia", "leve e divertido"], ["humor"], { assunto: "Fiction / Humorous" }),
  c("tensa", "Tensa", "atmosfera", ["tenso", "tensos", "suspense", "eletrizante", "thriller"], ["suspense"], { assunto: "Fiction / Thrillers" }),
  c("outono", "Atmosfera de outono", "atmosfera", ["outono", "outonal", "autumn", "fall vibes"], ["outono"]),
  c("chuvosa", "Para uma tarde chuvosa", "atmosfera", ["chuva", "chuvosa", "chuvoso", "tarde chuvosa", "dia chuvoso", "rainy"], ["introspectivo", "tranquilo"]),

  // ritmo
  c("ritmo-lento", "Ritmo lento", "ritmo", ["lento", "lenta", "devagar", "slow burn", "desenvolvimento lento", "para desacelerar", "desacelerar"], ["contemplativo"]),
  c("ritmo-rapido", "Ritmo rápido", "ritmo", ["rapido", "rapida", "frenetico", "page turner", "viciante", "nao consegue parar", "explodem a cabeca", "explode a cabeca"], ["suspense", "reviravolta"]),

  // experiências de leitura
  c("leve", "Leitura leve", "experiencia", ["leve", "leves", "light", "descompromissado"], ["leve"]),
  c("reflexiva", "Leitura reflexiva", "experiencia", ["reflexivo", "reflexiva", "faz pensar", "fazem pensar", "filosofico", "profundo", "profundos"], ["reflexão", "filosófico"]),
  c("emocionante", "Leitura emocionante", "experiencia", ["emocionante", "emocionantes", "chorar", "choro", "destroem emocionalmente", "destroi", "devastador", "intenso", "intensos"], ["emocionante", "comovente"]),
  c("imersiva", "Leitura imersiva", "experiencia", ["imersivo", "imersiva", "envolvente", "envolventes", "fora da realidade", "escapar"], ["envolvente"]),
  c("desafiadora", "Leitura desafiadora", "experiencia", ["desafiador", "desafiadora", "complexo", "complexos", "denso", "densos"], ["complexo"]),

  // temáticas
  c("amizade", "Amizade", "tematica", ["amizade", "amizades", "amigos", "amigas", "friendship"], ["amizade"]),
  c("familia", "Família", "tematica", ["familia", "familias", "mae", "pai", "irmaos"], ["família"]),
  c("recomecos", "Recomeços", "tematica", ["recomeco", "recomecos", "recomecar", "segunda chance", "nova vida", "fresh start"], ["recomeço", "segunda chance"]),
  c("solidao", "Solidão", "tematica", ["solidao", "sozinho", "sozinha", "isolamento", "loneliness"], ["solidão"]),
  c("luto", "Luto", "tematica", ["luto", "perda", "morte", "grief"], ["luto", "perda"]),
  c("identidade", "Identidade", "tematica", ["identidade", "quem sou"], ["identidade"]),
  c("pertencimento", "Pertencimento", "tematica", ["pertencimento", "pertencer", "lar"], ["pertencimento"]),
  c("memoria", "Memória", "tematica", ["memoria", "lembrancas", "lembranca"], ["memória"]),
  c("amadurecimento", "Amadurecimento", "tematica", ["amadurecimento", "coming of age", "crescer", "juventude"], ["amadurecimento"], { assunto: "Fiction / Coming of Age" }),
  c("cotidiano", "Vida cotidiana", "tematica", ["cotidiano", "cotidiana", "dia a dia", "dias comuns", "vida comum", "slice of life"], ["cotidiano"]),
  c("livros-e-literatura", "Livros e literatura", "tematica", ["livros sobre livros", "sobre livros", "leitores", "escritores"], ["livraria", "livros"]),
  c("existencialismo", "Existencialismo", "tematica", ["existencial", "existencialismo", "sentido da vida"], ["existencialismo"]),
  c("relacoes", "Relações humanas", "tematica", ["relacoes", "relacionamentos", "relacoes humanas", "afeto", "afetos"], ["relações humanas"]),

  // ambientações
  c("livrarias", "Livrarias", "ambientacao", ["livraria", "livrarias", "bookshop", "bookstore"], ["livraria"]),
  c("bibliotecas", "Bibliotecas", "ambientacao", ["biblioteca", "bibliotecas", "library"], ["biblioteca"]),
  c("cafeterias", "Cafeterias", "ambientacao", ["cafe", "cafes", "cafeteria", "cafeterias", "coffee shop"], ["cafeteria", "café"]),
  c("cidade-pequena", "Pequenas cidades", "ambientacao", ["cidade pequena", "cidades pequenas", "pequenas cidades", "pequena cidade", "interior", "vilarejo", "vilarejos", "small town"], ["cidade pequena", "vilarejo"]),
  c("universidades", "Universidades e internatos", "ambientacao", ["universidade", "universidades", "faculdade", "internato", "internatos", "dark academia", "academia"], ["universidade", "dark academia"]),
  c("natureza", "Natureza", "ambientacao", ["natureza", "floresta", "montanha", "montanhas", "campo", "ilha", "ilhas", "mar"], ["natureza"]),
  c("castelos", "Castelos", "ambientacao", ["castelo", "castelos"], ["castelo"]),
  c("mundos-imaginarios", "Mundos imaginários", "ambientacao", ["mundo imaginario", "mundos imaginarios", "outros mundos", "outro mundo"], ["fantasia"]),

  // características narrativas
  c("narrador-nao-confiavel", "Narrador não confiável", "narrativa", ["narrador nao confiavel", "narradores nao confiaveis", "unreliable narrator"], ["narrador não confiável", "suspense psicológico"]),
  c("multiplas-perspectivas", "Múltiplas perspectivas", "narrativa", ["multiplas perspectivas", "varios narradores", "pontos de vista"], ["múltiplos narradores"]),
  c("nao-linear", "Narrativa não linear", "narrativa", ["nao linear", "fragmentado", "fragmentada"], ["narrativa fragmentada"]),
  c("realismo-magico", "Realismo mágico", "narrativa", ["realismo magico", "magical realism", "fantastico"], ["realismo mágico"], { assunto: "Fiction / Magical Realism" }),
  c("reviravoltas", "Reviravoltas", "narrativa", ["reviravolta", "reviravoltas", "plot twist", "twist", "final surpreendente"], ["reviravolta", "suspense"]),
  c("epistolar", "Narrativa epistolar", "narrativa", ["epistolar", "cartas", "diario"], ["romance epistolar"]),
  c("historias-interligadas", "Histórias interligadas", "narrativa", ["historias interligadas", "contos interligados"], ["contos"]),

  // origens literárias (origem da obra; não é nacionalidade nem ambientação)
  c("lit-brasileira", "Literatura brasileira", "origem", ["brasileira", "brasileiro", "brasileiros", "brasileiras", "nacional", "nacionais", "do brasil"], ["literatura brasileira", "romance brasileiro"]),
  c("lit-coreana", "Literatura coreana", "origem", ["coreana", "coreano", "coreanos", "coreanas", "coreia", "korean", "k-lit"], ["literatura coreana", "romance coreano"]),
  c("lit-japonesa", "Literatura japonesa", "origem", ["japonesa", "japones", "japoneses", "japonesas", "japao", "japanese"], ["literatura japonesa", "romance japonês"]),
  c("lit-chinesa", "Literatura chinesa", "origem", ["chinesa", "chines", "chineses", "china"], ["literatura chinesa"]),
  c("lit-latino-americana", "Literatura latino-americana", "origem", ["latino-americana", "latino americana", "latino-americanos", "latinoamericana", "latina", "america latina"], ["literatura latino-americana"]),
  c("lit-africana", "Literaturas africanas", "origem", ["africana", "africanas", "africano", "africanos", "africa"], ["literatura africana"]),
  c("lit-francesa", "Literatura francesa", "origem", ["francesa", "frances", "franceses", "franca"], ["literatura francesa", "romance francês"]),
  c("lit-russa", "Literatura russa", "origem", ["russa", "russo", "russos", "russia"], ["literatura russa", "clássicos russos"]),
  c("lit-indigena", "Literatura indígena", "origem", ["indigena", "indigenas", "povos originarios"], ["literatura indígena"]),
  c("lit-portuguesa", "Literatura portuguesa", "origem", ["portuguesa", "portugues de portugal", "portugal"], ["literatura portuguesa"]),
  c("lit-italiana", "Literatura italiana", "origem", ["italiana", "italiano", "italianos", "italia"], ["literatura italiana"]),
  c("lit-inglesa", "Literatura de língua inglesa", "origem", ["inglesa", "ingles", "britanica", "americana", "norte-americana"], ["literatura inglesa"]),

  // gêneros
  c("fantasia", "Fantasia", "genero", ["fantasia", "fantasy", "fantasticos"], ["fantasia"], { assunto: "Fiction / Fantasy" }),
  c("ficcao-cientifica", "Ficção científica", "genero", ["ficcao cientifica", "sci-fi", "scifi", "distopia", "distopias", "distopico"], ["ficção científica", "distopia"], { assunto: "Fiction / Science Fiction" }),
  c("romance-amoroso", "Romance", "genero", ["romance amoroso", "romances amorosos", "romantico", "romanticos", "love story", "romance de amor"], ["romance"], { assunto: "Fiction / Romance" }),
  c("historico", "Romance histórico", "genero", ["historico", "historicos", "historica", "historicas", "epoca", "periodo historico"], ["romance histórico"], { assunto: "Fiction / Historical" }),
  c("policial", "Policial e mistério", "genero", ["policial", "policiais", "detetive", "investigacao", "crime"], ["romance policial"], { assunto: "Fiction / Mystery & Detective" }),
  c("terror", "Terror", "genero", ["terror", "horror", "assustador", "medo"], ["terror"], { assunto: "Fiction / Horror" }),
  c("poesia", "Poesia", "genero", ["poesia", "poemas", "poeta"], ["poesia"], { assunto: "Poetry" }),
  c("nao-ficcao", "Não ficção", "genero", ["nao ficcao", "nao-ficcao", "ensaio", "ensaios", "biografia", "memorias reais"], ["não ficção"]),
  c("contos", "Contos", "genero", ["conto", "contos", "short stories"], ["contos"], { assunto: "Fiction / Short Stories (single author)" }),
  c("classicos", "Clássicos", "genero", ["classico", "classicos", "classics"], ["clássicos da literatura"], { assunto: "Fiction / Classics" }),

  // extensão (objetiva: número de páginas da edição)
  c("curto", "Curtos", "extensao", ["curto", "curtos", "curta", "curtas", "pequeno", "pequenos", "rapido de ler", "poucas paginas", "novela"], [], { objetiva: true, paginas: [1, 200] }),
  c("medio", "Extensão média", "extensao", ["medio", "medios"], [], { objetiva: true, paginas: [201, 400] }),
  c("longo", "Longos", "extensao", ["longo", "longos", "calhamaco", "calhamacos", "grande", "grandes"], [], { objetiva: true, paginas: [401, 5000] }),

  // idioma da edição (objetivo)
  c("idioma-pt", "Em português", "idioma", ["em portugues"], [], { objetiva: true, idioma: "pt" }),
  c("idioma-en", "Em inglês", "idioma", ["em ingles", "in english"], [], { objetiva: true, idioma: "en" }),

  // período de publicação (objetivo)
  c("contemporaneos", "Contemporâneos", "periodo", ["contemporaneo", "contemporaneos", "contemporanea", "contemporaneas", "recentes", "atuais"], [], { objetiva: true, anos: [2000, 2100] }),
  c("seculo-xx", "Século XX", "periodo", ["seculo xx", "seculo 20"], [], { objetiva: true, anos: [1900, 1999] }),
  c("antes-1900", "Antes de 1900", "periodo", ["seculo xix", "seculo 19", "vitoriano"], [], { objetiva: true, anos: [0, 1899] }),
];

export const PORID = new Map(CARACTERISTICAS.map((x) => [x.id, x]));

export const NOMES_CATEGORIA: Record<Categoria, string> = {
  atmosfera: "Atmosfera",
  ritmo: "Ritmo da leitura",
  experiencia: "Experiência de leitura",
  genero: "Gênero",
  tematica: "Temáticas",
  ambientacao: "Ambientação",
  narrativa: "Características narrativas",
  origem: "Origem literária",
  idioma: "Idioma da edição",
  extensao: "Extensão",
  periodo: "Período de publicação",
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** gênero e número em português: "sombrio" também casa "sombria", "sombrios", "sombrias" */
function flexoes(s: string): string[] {
  const p = s.split(" ");
  const ultima = p[p.length - 1];
  const base = p.slice(0, -1).join(" ");
  const junta = (w: string) => (base ? `${base} ${w}` : w);
  const formas = new Set([s]);
  if (/[oa]$/.test(ultima)) for (const f of ["o", "a", "os", "as"]) formas.add(junta(ultima.slice(0, -1) + f));
  else if (/(or|ista|ante|ente|al|vel)$/.test(ultima)) {
    if (ultima.endsWith("or")) ["ora", "ores", "oras"].forEach((f) => formas.add(junta(ultima.slice(0, -2) + f)));
    if (ultima.endsWith("ista")) formas.add(junta(`${ultima}s`));
    if (/(ante|ente)$/.test(ultima)) formas.add(junta(`${ultima}s`));
    if (ultima.endsWith("al")) formas.add(junta(`${ultima.slice(0, -2)}ais`));
    if (ultima.endsWith("vel")) formas.add(junta(`${ultima.slice(0, -3)}veis`));
  }
  return [...formas];
}

export type Interpretacao = {
  criterios: Caracteristica[];
  /** "sem romance", "sem terror": restrições que pedem ausência */
  sem: Caracteristica[];
  /** "parecidos com X" */
  parecidoCom: string | null;
  /** o que sobrou depois de tirar as palavras reconhecidas (título, autor…) */
  resto: string;
  /** a consulta parece um ISBN */
  isbn: string | null;
  /** pedidos que o app não confirma nos dados (ex.: gênero de quem escreve) */
  avisos: string[];
};

const PALAVRAS_VAZIAS = new Set(["livro", "livros", "historia", "historias", "leitura", "leituras", "de", "da", "do", "das", "dos", "com", "e", "um", "uma", "para", "pra", "sobre", "que", "em", "os", "as", "o", "a", "quero", "algo", "obras", "obra", "romances", "romance", "literatura", "considerados", "consideradas", "escritos", "escritas", "por", "ler", "parecem", "ambientados", "ambientadas", "ambientada", "ambientado", "narrativas", "narrativa", "finais", "final", "mulheres"]);

/** lê a pesquisa e separa características, restrições e o resto (título/autor) */
export function interpretarBusca(consulta: string): Interpretacao {
  const bruto = consulta.trim();
  const isbn = bruto.replace(/[-\s]/g, "");
  if (/^(97[89])?\d{9}[\dXx]$/.test(isbn)) return { criterios: [], sem: [], parecidoCom: null, resto: bruto, isbn, avisos: [] };
  const avisos: string[] = [];
  if (/escrit[oa]s? por (mulheres|homens|autoras|autores)/i.test(bruto)) avisos.push("O app não filtra pelo gênero de quem escreve: os resultados não garantem esse critério.");
  let t = ` ${norm(bruto)} `;
  let parecidoCom: string | null = null;
  const m = bruto.match(/(?:parecid[oa]s? com|semelhantes? a|no estilo de|na vibe de)\s+(.+)$/i);
  if (m) {
    parecidoCom = m[1].replace(/[.?!]+$/, "").trim();
    t = ` ${norm(bruto.slice(0, m.index))} `;
  }
  const sem: Caracteristica[] = [];
  const achados: Caracteristica[] = [];
  // sinônimos mais longos primeiro ("realismo magico" antes de "magico")
  const pares = CARACTERISTICAS.flatMap((x) => [...new Set([norm(x.nome), ...x.sinonimos.map(norm)].flatMap(flexoes))].map((s) => ({ s, x }))).sort((a, b) => b.s.length - a.s.length);
  for (const { s, x } of pares) {
    if (!s) continue;
    const rSem = new RegExp(` (?:sem|nada de|zero) ${s.replace(/[-]/g, "\\-")} `);
    if (rSem.test(t)) {
      if (!sem.includes(x)) sem.push(x);
      t = t.replace(rSem, " ");
      continue;
    }
    const r = new RegExp(` ${s.replace(/[-]/g, "\\-")} `);
    if (r.test(t)) {
      if (!achados.includes(x)) achados.push(x);
      t = t.replace(r, " ");
    }
  }
  // "romance" sozinho é ambíguo (gênero literário x história de amor): fica no texto
  const resto = t
    .split(" ")
    .filter((w) => w && !PALAVRAS_VAZIAS.has(w))
    .join(" ")
    .trim();
  const resto2 = resto.replace(/\b(escrit[oa]s? )?(por )?(mulheres|homens|autoras)\b/g, "").trim();
  return { criterios: achados, sem, parecidoCom, resto: achados.length || sem.length || parecidoCom ? resto2 : bruto, isbn: null, avisos };
}

/** a pesquisa é convencional (título, autor, ISBN) e não pede descoberta */
export const ehBuscaDireta = (i: Interpretacao) => !!i.isbn || (!i.criterios.length && !i.sem.length && !i.parecidoCom && !i.avisos.length);
