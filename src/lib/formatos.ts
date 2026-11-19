import type { FormatoLivro } from "@/lib/perfil-store";

/** os jeitos de ler um livro (com o desenho de cada um, em caminhos de SVG 24×24) */
export const formatos: {
  id: FormatoLivro;
  nome: string;
  curto: string;
  /** "no papel", "na tela", "nos ouvidos" */
  onde: string;
  icone: string;
}[] = [
  {
    id: "fisico",
    nome: "livro físico",
    curto: "físico",
    onde: "no papel",
    icone: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z M8 7h7",
  },
  {
    id: "ebook",
    nome: "e-book",
    curto: "e-book",
    onde: "na tela",
    icone: "M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z M9 6h6 M9 9h6 M9 12h4 M11 18.5h2",
  },
  {
    id: "audio",
    nome: "audiolivro",
    curto: "áudio",
    onde: "nos ouvidos",
    icone: "M4 14v-2a8 8 0 0 1 16 0v2 M4 14a2 2 0 0 1 2-2h1v7H6a2 2 0 0 1-2-2z M20 14a2 2 0 0 0-2-2h-1v7h1a2 2 0 0 0 2-2z",
  },
];

export const formatoDe = (id?: FormatoLivro) => formatos.find((f) => f.id === id);
