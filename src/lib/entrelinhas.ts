/**
 * Nas entrelinhas — o oráculo dos leitores.
 *
 * Perguntas e pontuação: src/data/nas-entrelinhas-v2.json (fonte oficial).
 * A matriz foi validada nas 1.048.576 combinações possíveis
 * (scripts/validar-entrelinhas.py): 65,93% resultados únicos, 12,5% por carta.
 * Não mude a pontuação do JSON sem rodar a validação de novo.
 *
 * Pontos ficam presos ao id da alternativa (nunca à posição): a ordem é
 * embaralhada uma vez por execução e guardada junto com ela.
 */
import dados from "../data/nas-entrelinhas-v2.json";

export const VERSAO = dados.versao;

export type CartaId = "D" | "X" | "R" | "S" | "W" | "N" | "C" | "E";
export type Alternativa = { id: string; texto: string; pontos: Partial<Record<CartaId, number>>; imagem?: string };
export type PerguntaEntrelinhas = { id: string; titulo: string; enunciado: string; formato: "textual" | "ilustrada" | "editorial"; alternativas: Alternativa[] };

export const PERGUNTAS = dados.perguntas as PerguntaEntrelinhas[];
export const DESEMPATE = dados.desempate as { pergunta: string; alternativas: Record<CartaId, string> };
export const CARTAS = Object.keys(dados.arquetipos) as CartaId[];

/** As duas perguntas de frases (primeira frase e leitura às cegas) usam o tratamento editorial. */
export const EDITORIAIS = new Set(["q07", "q10"]);

const BASE = "/nas-entrelinhas";
export const imagemDaAlternativa = (a: Alternativa) => (a.imagem ? `${BASE}/${a.imagem}` : undefined);
export const VERSO = `${BASE}/cartas/verso.png`;

export type Carta = {
  id: CartaId;
  numero: string;
  nome: string;
  slug: string;
  assinatura: string;
  descricao: string[];
  tracos: string[];
  /** curadoria inicial (título e autor para achar o registro certo no catálogo) */
  curadoria: { titulo: string; autor: string }[];
  /** proporção da arte e posição da faixa do nome (em % da altura), medidas no arquivo */
  arte: { w: number; h: number; faixaCentro: number };
  /** texto alternativo da ilustração */
  alt: string;
};

export const CATALOGO: Record<CartaId, Carta> = {
  D: {
    id: "D",
    numero: "I",
    nome: "A Tecelã de Sonhos",
    slug: "tecela-de-sonhos",
    assinatura: "O impossível é uma história que ainda não foi contada.",
    descricao: [
      "Você habita aquele espaço delicado entre o que existe e o que poderia existir. Nas histórias, encontra possibilidades, símbolos e pequenos universos que continuam crescendo na sua imaginação, mesmo depois da última página.",
      "Sua relação com a literatura é marcada pela capacidade de enxergar o extraordinário em detalhes aparentemente comuns.",
      "Uma história nunca termina completamente quando ainda existem possibilidades a imaginar.",
    ],
    tracos: ["Imaginação", "Contemplação", "Sensibilidade estética", "Narrativas simbólicas"],
    curadoria: [
      { titulo: "Piranesi", autor: "Susanna Clarke" },
      { titulo: "O Oceano no Fim do Caminho", autor: "Neil Gaiman" },
    ],
    arte: { w: 316, h: 458, faixaCentro: 90.83 },
    alt: "Carta com uma leitora de olhos fechados segurando um livro aberto, uma xícara com estrela e uma lua amarela ao fundo.",
  },
  X: {
    id: "X",
    numero: "II",
    nome: "A Decifradora",
    slug: "decifradora",
    assinatura: "Há sempre outra história por trás da história.",
    descricao: [
      "Você lê aquilo que não foi dito. Uma contradição, uma escolha de palavras ou um detalhe esquecido são suficientes para despertar sua curiosidade.",
      "Gosta de encontrar conexões, revisitar interpretações e perceber como pequenos elementos podem transformar o sentido de uma narrativa.",
      "Para você, toda história guarda alguma coisa a ser descoberta.",
    ],
    tracos: ["Curiosidade", "Interpretação", "Atenção aos detalhes", "Conexões narrativas"],
    curadoria: [
      { titulo: "Recursão", autor: "Blake Crouch" },
      { titulo: "O Assassinato de Roger Ackroyd", autor: "Agatha Christie" },
    ],
    arte: { w: 296, h: 458, faixaCentro: 90.83 },
    alt: "Carta com uma leitora de casaco amarelo examinando pistas com uma lupa, entre fotografias e uma impressão digital.",
  },
  R: {
    id: "R",
    numero: "III",
    nome: "A Alquimista dos Afetos",
    slug: "alquimista-dos-afetos",
    assinatura: "Algumas histórias mudam a forma como sentimos.",
    descricao: [
      "Você encontra na literatura diferentes maneiras de compreender o que significa ser humano.",
      "São os encontros, as perdas, as contradições e os pequenos gestos que tornam uma história verdadeiramente sua.",
      "Mais do que acompanhar acontecimentos, você se interessa pelas transformações que acontecem dentro das pessoas.",
    ],
    tracos: ["Sensibilidade emocional", "Empatia", "Relações humanas", "Envolvimento com personagens"],
    curadoria: [
      { titulo: "Pessoas Normais", autor: "Sally Rooney" },
      { titulo: "Três", autor: "Valérie Perrin" },
    ],
    arte: { w: 292, h: 458, faixaCentro: 90.83 },
    alt: "Carta com uma leitora de cabelos ruivos sonhando acordada sobre um livro com um coração, ao lado de rosas.",
  },
  S: {
    id: "S",
    numero: "IV",
    nome: "A Guardiã do Saber",
    slug: "guardia-do-saber",
    assinatura: "Cada página amplia as fronteiras do pensamento.",
    descricao: [
      "Você se interessa por histórias que deslocam certezas e despertam perguntas.",
      "Uma leitura não termina quando o livro se fecha: ela continua nas conversas, nas reflexões e nas novas perspectivas que você leva consigo.",
      "Sua biblioteca é também um encontro de ideias, interpretações e possibilidades de compreender o mundo.",
    ],
    tracos: ["Reflexão", "Curiosidade intelectual", "Interesse por perspectivas", "Profundidade temática"],
    curadoria: [
      { titulo: "Ensaio sobre a Cegueira", autor: "José Saramago" },
      { titulo: "Frankenstein", autor: "Mary Shelley" },
    ],
    arte: { w: 295, h: 458, faixaCentro: 90.83 },
    alt: "Carta com uma leitora de óculos lendo junto a um busto clássico, uma coluna e um ramo de oliveira.",
  },
  W: {
    id: "W",
    numero: "V",
    nome: "A Cartógrafa",
    slug: "cartografa",
    assinatura: "Toda história é um território desconhecido.",
    descricao: [
      "Você lê para atravessar fronteiras.",
      "Gosta de conhecer outras culturas, perspectivas e formas de existir. Uma narrativa pode transportar você para um lugar desconhecido ou revelar aspectos de um mundo que acreditava conhecer.",
      "Sua biblioteca é um mapa em constante construção, cheio de territórios que ainda deseja descobrir.",
    ],
    tracos: ["Exploração", "Abertura a novas perspectivas", "Diversidade literária", "Curiosidade pelo desconhecido"],
    curadoria: [
      { titulo: "Cem Anos de Solidão", autor: "Gabriel García Márquez" },
      { titulo: "Torto Arado", autor: "Itamar Vieira Junior" },
    ],
    arte: { w: 309, h: 437, faixaCentro: 90.39 },
    alt: "Carta com uma viajante de mochila e fones de ouvido segurando um mapa, entre montanhas.",
  },
  N: {
    id: "N",
    numero: "VI",
    nome: "A Gata da Meia-Noite",
    slug: "gata-da-meia-noite",
    assinatura: "O silêncio também conta histórias.",
    descricao: [
      "Você aprecia narrativas que deixam espaço para o mistério, a reflexão e a interpretação.",
      "Encontra beleza nas ambiguidades e nos momentos em que uma história parece conversar apenas com você.",
      "A literatura também representa um espaço particular, onde pensamentos e sensações podem existir sem precisar de respostas definitivas.",
    ],
    tracos: ["Introspecção", "Independência", "Sensibilidade às ambiguidades", "Interesse pelas entrelinhas"],
    curadoria: [
      { titulo: "Eu que Nunca Conheci os Homens", autor: "Jacqueline Harpman" },
      { titulo: "A Metamorfose", autor: "Franz Kafka" },
    ],
    arte: { w: 305, h: 437, faixaCentro: 90.39 },
    alt: "Carta com uma gata deitada sobre uma pilha de livros sob a lua crescente, ao lado de uma xícara.",
  },
  C: {
    id: "C",
    numero: "VII",
    nome: "A Curadora do Tempo",
    slug: "curadora-do-tempo",
    assinatura: "Há coisas que o tempo não merece levar.",
    descricao: [
      "Você guarda mais do que livros. Guarda frases, atmosferas, lembranças e versões de si que existiram durante cada leitura.",
      "Uma dedicatória, uma passagem sublinhada ou a memória do momento em que conheceu uma história podem transformar um livro em algo insubstituível.",
      "Sua biblioteca é também um arquivo afetivo, onde diferentes momentos da sua vida encontram uma maneira de permanecer.",
    ],
    tracos: ["Memória afetiva", "Atenção aos pequenos detalhes", "Preservação de referências", "Conexão entre literatura e experiências pessoais"],
    curadoria: [
      { titulo: "Água Fresca para as Flores", autor: "Valérie Perrin" },
      { titulo: "O Meu Pé de Laranja Lima", autor: "José Mauro de Vasconcelos" },
    ],
    arte: { w: 296, h: 437, faixaCentro: 90.27 },
    alt: "Carta com uma estante de livros, uma flor numa redoma, um globo, uma planta e uma carta lacrada.",
  },
  E: {
    id: "E",
    numero: "VIII",
    nome: "A Viajante de Mundos",
    slug: "viajante-de-mundos",
    assinatura: "Existem muitas vidas dentro de uma só.",
    descricao: [
      "Você se entrega às histórias e permite que elas suspendam o mundo ao redor.",
      "Seja em uma cidade distante, em outra época ou em um universo inventado, encontra na leitura a possibilidade de experimentar outras existências.",
      "Gosta daquela sensação de fechar um livro e precisar de alguns instantes para retornar ao mundo real.",
    ],
    tracos: ["Imersão narrativa", "Imaginação", "Envolvimento com universos literários", "Fascínio por diferentes experiências"],
    curadoria: [
      { titulo: "O Circo da Noite", autor: "Erin Morgenstern" },
      { titulo: "Jogos Vorazes", autor: "Suzanne Collins" },
    ],
    arte: { w: 297, h: 437, faixaCentro: 90.27 },
    alt: "Carta com um livro aberto do qual surge um castelo sob um arco estrelado, e um ingresso dourado.",
  },
};

export const ehCarta = (x: unknown): x is CartaId => typeof x === "string" && (CARTAS as string[]).includes(x);
export const imagemDaCarta = (c: CartaId) => `${BASE}/cartas/${CATALOGO[c].slug}.png`;

/** embaralha uma cópia (Fisher–Yates) */
export function embaralhar<T>(lista: T[], aleatorio: () => number = Math.random): T[] {
  const c = [...lista];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/** a ordem das alternativas de uma execução: ids por pergunta, sorteados uma vez */
export function novaOrdem(aleatorio: () => number = Math.random): Record<string, string[]> {
  return Object.fromEntries(PERGUNTAS.map((p) => [p.id, embaralhar(p.alternativas.map((a) => a.id), aleatorio)]));
}

/** respostas: id da pergunta → id da alternativa (só as respostas finais contam) */
export function pontuar(respostas: Record<string, string>): Record<CartaId, number> {
  const pontos = Object.fromEntries(CARTAS.map((c) => [c, 0])) as Record<CartaId, number>;
  for (const p of PERGUNTAS) {
    const alt = p.alternativas.find((a) => a.id === respostas[p.id]);
    if (!alt) continue;
    for (const [c, v] of Object.entries(alt.pontos)) pontos[c as CartaId] += v ?? 0;
  }
  return pontos;
}

export const respondidas = (respostas: Record<string, string>) => PERGUNTAS.every((p) => p.alternativas.some((a) => a.id === respostas[p.id]));

/** as cartas com a maior pontuação (uma = resultado; mais de uma = desempate) */
export function lideres(respostas: Record<string, string>): CartaId[] {
  const pontos = pontuar(respostas);
  const max = Math.max(...Object.values(pontos));
  return CARTAS.filter((c) => pontos[c] === max);
}

/** afinidade secundária: a segunda maior pontuação, só se for única e próxima */
export function afinidade(respostas: Record<string, string>, principal: CartaId): CartaId | null {
  const pontos = pontuar(respostas);
  const resto = CARTAS.filter((c) => c !== principal).sort((a, b) => pontos[b] - pontos[a]);
  if (!resto.length || pontos[resto[0]] === pontos[resto[1]] || pontos[principal] - pontos[resto[0]] > 1) return null;
  return resto[0];
}
