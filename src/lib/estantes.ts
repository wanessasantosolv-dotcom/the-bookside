import { sugestoesDeLivros, type LivroCatalogo } from "@/lib/dados";
import type {
  EstantePropria,
  LivroSalvo,
  NotasDetalhe,
  StatusLivro,
} from "@/lib/perfil-store";

/** As três estantes fixas + as que a pessoa cria. */
export type EstanteInfo = {
  id: string;
  nome: string;
  /** cor da etiqueta de quantidade */
  etiqueta: { fundo: string; texto: string };
  status?: StatusLivro;
  propria?: EstantePropria;
};

export const ESTANTES_FIXAS: EstanteInfo[] = [
  {
    id: "lendo",
    nome: "lendo agora",
    status: "lendo",
    etiqueta: { fundo: "#C27C8D", texto: "#FFFFFF" },
  },
  {
    id: "lidos",
    nome: "lidos",
    status: "lido",
    etiqueta: { fundo: "#692536", texto: "#F6F0E5" },
  },
  {
    id: "quero-ler",
    nome: "quero ler",
    status: "quero",
    etiqueta: { fundo: "#ECAABB", texto: "#692536" },
  },
  {
    id: "pausados",
    nome: "pausados",
    status: "pausado",
    etiqueta: { fundo: "#C9A46A", texto: "#38252C" },
  },
  {
    id: "abandonados",
    nome: "abandonados",
    status: "abandonado",
    etiqueta: { fundo: "#715F65", texto: "#F6F0E5" },
  },
];

export function todasAsEstantes(proprias: EstantePropria[]): EstanteInfo[] {
  return [
    ...ESTANTES_FIXAS,
    ...proprias.map((p) => ({
      id: p.id,
      nome: p.nome,
      propria: p,
      etiqueta: { fundo: p.cor, texto: "#F6F0E5" },
    })),
  ];
}

export function statusDoLivro(l: LivroSalvo): StatusLivro {
  return l.status ?? "lendo";
}

/** Livros de uma estante, do mais recente ao mais antigo. */
export function livrosDaEstante(estante: EstanteInfo, livros: LivroSalvo[]) {
  const lista = estante.status
    ? livros.filter((l) => statusDoLivro(l) === estante.status)
    : livros.filter((l) => l.estantes?.includes(estante.id));
  const data = (l: LivroSalvo) =>
    l.lidoEm ?? l.iniciadoEm ?? l.adicionadoEm ?? "";
  return [...lista].sort((a, b) => data(b).localeCompare(data(a)));
}

/** Junta o que a pessoa salvou com o que o catálogo sabe do livro. */
export function infoDoLivro(
  id: string,
  livros: LivroSalvo[],
  /** livro visto na busca (Open Library), quando não está no catálogo local */
  daBusca?: LivroCatalogo,
): (Partial<LivroCatalogo> & LivroSalvo) | null {
  const salvo = livros.find((l) => l.id === id);
  const catalogo = sugestoesDeLivros.find((l) => l.id === id) ?? daBusca;
  if (!salvo && !catalogo) return null;
  return {
    ...catalogo,
    ...(salvo ?? { id, titulo: catalogo!.titulo, autor: catalogo!.autor }),
    paginas: salvo?.paginas ?? catalogo?.paginas,
    capa: salvo?.capa ?? catalogo?.capa,
  };
}

export function estrelas(nota?: number) {
  if (!nota) return "☆☆☆☆☆";
  const cheias = Math.floor(nota);
  const meia = nota - cheias >= 0.5;
  return (
    "★".repeat(cheias) +
    (meia ? "½" : "") +
    "☆".repeat(5 - cheias - (meia ? 1 : 0))
  );
}

/** "em 2016" quando a pessoa sabe só o ano em que leu */
export function soAno(l: { lidoEm?: string; lidoSoAno?: boolean }) {
  return l.lidoSoAno && l.lidoEm ? `em ${new Date(l.lidoEm).getFullYear()}` : null;
}

export function dataCurta(iso?: string) {
  if (!iso) return "";
  return new Date(iso)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
    .replace(".", "");
}

export function mesDe(iso?: string) {
  if (!iso) return "sem data";
  return new Date(iso).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

/** critérios da ficha (os que ficaram em branco valem 0) no formato da estante */
export function notasCompletas(
  n: Partial<Record<keyof NotasDetalhe, number>>,
): NotasDetalhe {
  return {
    personagens: n.personagens ?? 0,
    plot: n.plot ?? 0,
    escrita: n.escrita ?? 0,
    final: n.final ?? 0,
  };
}

/** o que some ao excluir a ficha pessoal (o livro e o status ficam na estante) */
export const fichaApagada = {
  nota: undefined,
  notas: undefined,
  reacao: undefined,
  personagem: undefined,
  citacao: undefined,
  resenha: undefined,
  anotacao: undefined,
  sensacoes: undefined,
  recomendaria: undefined,
  releria: undefined,
  resenhaSpoiler: undefined,
  naoAplica: undefined,
  fichaEm: undefined,
  fichaEditadaEm: undefined,
} satisfies Partial<LivroSalvo>;

/** lidos em um ano (pela data em que terminou; sem data não entra) */
export function lidosNoAno(livros: LivroSalvo[], ano = new Date().getFullYear()) {
  return livros.filter(
    // mesma regra dos "seus números" (calcularNumeros)
    (l) => l.status === "lido" && !!l.lidoEm?.startsWith(String(ano)),
  ).length;
}

/**
 * Os números do topo do perfil, sem misturar o total com o ano:
 * o ano (contra a meta, quando tem), o total de lidos, lendo e quero ler.
 */
export function numerosDoPerfil(p: {
  livros: LivroSalvo[];
  meta: number | null;
}) {
  const ano = new Date().getFullYear();
  const noAno = lidosNoAno(p.livros, ano);
  const lidos = p.livros.filter((l) => l.status === "lido").length;
  return {
    ano,
    noAno,
    lidos,
    destaque: {
      n: p.meta ? `${noAno}/${p.meta}` : String(noAno),
      r: p.meta ? `meta ${ano}` : `lidos em ${ano}`,
    },
  };
}

/** do mais recente ao mais antigo, pela data em que terminou */
export const porDataDeLeitura = (a: LivroSalvo, b: LivroSalvo) =>
  (b.lidoEm ?? "").localeCompare(a.lidoEm ?? "");
