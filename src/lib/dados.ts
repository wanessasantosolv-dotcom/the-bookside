/** Conteúdo fixo do onboarding, tirado das telas do canvas "Perfil — Opções". */

export const temas = [
  { id: "biblioteca-classica", nome: "biblioteca clássica", papel: "#F5EFE6", destaque: "#692536", texto: "#692536" },
  { id: "romance-de-epoca", nome: "romance de época", papel: "#ECEBE9", destaque: "#55514F", texto: "#55514F" },
  { id: "madrugada-de-leitura", nome: "madrugada de leitura", papel: "#E7E5EE", destaque: "#464052", texto: "#464052" },
  { id: "jardim-de-livros", nome: "jardim de livros", papel: "#E8E7DC", destaque: "#79806B", texto: "#5E6553" },
  { id: "noite-de-tinta", nome: "noite de tinta", papel: "#29252A", destaque: "#A88B64", texto: "#F5EFE6" },
  { id: "orelha-rosa", nome: "orelha rosa", papel: "#F9D9E2", destaque: "#C0506F", texto: "#9E3A57" },
  { id: "capa-kraft", nome: "capa kraft", papel: "#D9C3A0", destaque: "#692536", texto: "#692536" },
  { id: "poesia-de-bolso", nome: "poesia de bolso", papel: "#CFDDEB", destaque: "#2B4C7E", texto: "#2B4C7E" },
] as const;

export const conjuntosDeFrases: string[][] = [
  ["gosto de finais que doem", "always one more chapter", "lendo com a luz baixa", "books are small cities"],
  ["leio com café e chuva lá fora", "characters who live with me", "um livro por vez, com calma", "collecting dog-eared pages"],
  ["se não for um pouco triste, não é de verdade", "my shelf is my biography", "releio para sentir de novo", "no spoilers, please"],
];

export const metas = [
  { valor: 12, legenda: "um livro a cada mês, no seu tempo" },
  { valor: 24, legenda: "dois livros por mês, sem pressa" },
  { valor: 40, legenda: "quase um livro a cada dez dias" },
  { valor: 52, legenda: "um livro por semana, respirando" },
  { valor: null, legenda: "sem números, só leitura" },
] as const;

export const pilhasDeGostos = [
  [
    { nome: "romance", cor: "#6B0D24" },
    { nome: "suspense", cor: "#4B0D1B" },
    { nome: "ficção científica", cor: "#2B1420" },
    { nome: "não ficção", cor: "#6B7A5E" },
    { nome: "poesia", cor: "#B75A6B" },
    { nome: "fantasia", cor: "#8E1D3D" },
  ],
  [
    { nome: "drama", cor: "#6B7A5E" },
    { nome: "clássicos", cor: "#2B1420" },
    { nome: "humor", cor: "#B75A6B" },
    { nome: "histórias de família", cor: "#8E1D3D" },
    { nome: "biografia", cor: "#6B7A5E" },
    { nome: "terror", cor: "#4B0D1B" },
  ],
];

/**
 * Sugestões de primeiro livro. As capas reais vão vir de um catálogo
 * autorizado (ex.: Open Library / Google Books) quando a busca for ligada.
 */
export const sugestoesDeLivros = [
  { id: "recursao", titulo: "Recursão", autor: "blake crouch", cor: "#2B1420" },
  { id: "daisy-jones", titulo: "Daisy Jones & the Six", autor: "taylor jenkins reid", cor: "#B75A6B" },
  { id: "aguas-frescas", titulo: "Águas frescas para as flores", autor: "valérie perrin", cor: "#6B7A5E" },
  { id: "o-morro-dos-ventos-uivantes", titulo: "O morro dos ventos uivantes", autor: "emily brontë", cor: "#4B0D1B" },
  { id: "orgulho-e-preconceito", titulo: "Orgulho e preconceito", autor: "jane austen", cor: "#8E1D3D" },
];

export const PASSOS_PERFIL = 8;
