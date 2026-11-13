import { sugestoesDeLivros, type LivroCatalogo } from "@/lib/dados";
import type { EstantePropria, LivroSalvo, StatusLivro } from "@/lib/perfil-store";

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
  { id: "lendo", nome: "lendo agora", status: "lendo", etiqueta: { fundo: "#B75A6B", texto: "#FFFFFF" } },
  { id: "lidos", nome: "lidos", status: "lido", etiqueta: { fundo: "#6B0D24", texto: "#F9F5EE" } },
  { id: "quero-ler", nome: "quero ler", status: "quero", etiqueta: { fundo: "#E8B4BF", texto: "#6B0D24" } },
];

export function todasAsEstantes(proprias: EstantePropria[]): EstanteInfo[] {
  return [
    ...ESTANTES_FIXAS,
    ...proprias.map((p) => ({ id: p.id, nome: p.nome, propria: p, etiqueta: { fundo: p.cor, texto: "#F9F5EE" } })),
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
  const data = (l: LivroSalvo) => l.lidoEm ?? l.iniciadoEm ?? l.adicionadoEm ?? "";
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
  return { ...catalogo, ...(salvo ?? { id, titulo: catalogo!.titulo, autor: catalogo!.autor }), paginas: salvo?.paginas ?? catalogo?.paginas, capa: salvo?.capa ?? catalogo?.capa };
}

export function estrelas(nota?: number) {
  if (!nota) return "☆☆☆☆☆";
  const cheias = Math.floor(nota);
  const meia = nota - cheias >= 0.5;
  return "★".repeat(cheias) + (meia ? "½" : "") + "☆".repeat(5 - cheias - (meia ? 1 : 0));
}

export function dataCurta(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

export function mesDe(iso?: string) {
  if (!iso) return "sem data";
  return new Date(iso).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}
