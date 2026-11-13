/** Conteúdo fixo do onboarding, tirado das telas do canvas "Perfil — Opções". */

export const temas = [
  { id: "biblioteca-classica", fundo: "#EFDFC4", nome: "biblioteca clássica", papel: "#F5EFE6", destaque: "#692536", texto: "#692536" },
  { id: "romance-de-epoca", fundo: "#DBD9D5", nome: "romance de época", papel: "#ECEBE9", destaque: "#55514F", texto: "#55514F" },
  { id: "madrugada-de-leitura", fundo: "#D6D1E6", nome: "madrugada de leitura", papel: "#E7E5EE", destaque: "#464052", texto: "#464052" },
  { id: "jardim-de-livros", fundo: "#D7DCC1", nome: "jardim de livros", papel: "#E8E7DC", destaque: "#79806B", texto: "#5E6553" },
  { id: "noite-de-tinta", fundo: "#29252A", nome: "noite de tinta", papel: "#29252A", destaque: "#A88B64", texto: "#F5EFE6", escuro: true },
  { id: "orelha-rosa", fundo: "#F9D9E2", nome: "orelha rosa", papel: "#F9D9E2", destaque: "#C0506F", texto: "#9E3A57" },
  { id: "capa-kraft", fundo: "#D9C3A0", nome: "capa kraft", papel: "#D9C3A0", destaque: "#692536", texto: "#692536" },
  { id: "poesia-de-bolso", fundo: "#CFDDEB", nome: "poesia de bolso", papel: "#CFDDEB", destaque: "#2B4C7E", texto: "#2B4C7E" },
] as const;

export type Tema = (typeof temas)[number];

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
export type LivroCatalogo = {
  id: string;
  titulo: string;
  autor: string;
  ano?: number;
  paginas?: number;
  genero?: string;
  sinopse?: string;
  cor: string;
  /** URL da capa (Open Library) */
  capa?: string;
};

export const sugestoesDeLivros: LivroCatalogo[] = [
  {
    id: "recursao",
    titulo: "Recursão",
    autor: "blake crouch",
    ano: 2019,
    paginas: 336,
    genero: "ficção científica",
    sinopse:
      "Um estranho problema de memória começa a se espalhar por Nova York. Quem esquece o passado, tudo o que é, deixa de existir.",
    cor: "#2B1420",
  },
  {
    id: "10-minutos",
    titulo: "10 minutos e 38 segundos",
    autor: "elif shafak",
    ano: 2019,
    genero: "romance",
    sinopse:
      "Tequila Leila morre em Istambul. Nos dez minutos que seguem sua morte, sua mente revive as lembranças da vida que teve.",
    cor: "#8E1D3D",
  },
  { id: "aguas-frescas", titulo: "Águas frescas para as flores", autor: "valérie perrin", ano: 2025, cor: "#6B7A5E" },
  { id: "daisy-jones", titulo: "Daisy Jones & the Six", autor: "taylor jenkins reid", ano: 2019, cor: "#B75A6B" },
  {
    id: "torto-arado",
    titulo: "Torto arado",
    autor: "itamar vieira junior",
    ano: 2019,
    paginas: 274,
    genero: "romance",
    sinopse:
      "Entre o sertão e as plantações de cacau da Bahia, duas irmãs guardam um segredo que atravessa gerações — uma faca enterrada, um silêncio herdado e a força de mulheres que resistem.",
    cor: "#4B0D1B",
  },
];

export const PASSOS_PERFIL = 8;
