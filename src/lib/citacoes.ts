/** Citação do dia no feed: muda uma vez por dia, igual para todo mundo. */
export const citacoes = [
  { texto: "Liberdade é pouco. O que eu desejo ainda não tem nome.", livro: "perto do coração selvagem", autor: "clarice lispector" },
  { texto: "Não há barreira, fechadura ou ferrolho que possas impor à liberdade da minha mente.", livro: "um teto todo seu", autor: "virginia woolf" },
  { texto: "Eu declaro, afinal, que não há prazer como o da leitura!", livro: "orgulho e preconceito", autor: "jane austen" },
  { texto: "Ao vencedor, as batatas.", livro: "quincas borba", autor: "machado de assis" },
  { texto: "Tudo no mundo começou com um sim.", livro: "a hora da estrela", autor: "clarice lispector" },
  { texto: "Somos feitos da mesma matéria dos sonhos.", livro: "a tempestade", autor: "william shakespeare" },
  { texto: "Viver é muito perigoso.", livro: "grande sertão: veredas", autor: "guimarães rosa" },
  { texto: "Todas as famílias felizes se parecem.", livro: "anna kariênina", autor: "liev tolstói" },
  { texto: "Não sou um pássaro, e nenhuma rede me prende.", livro: "jane eyre", autor: "charlotte brontë" },
  { texto: "O essencial é invisível aos olhos.", livro: "o pequeno príncipe", autor: "antoine de saint-exupéry" },
  { texto: "Tinha uma pedra no meio do caminho.", livro: "alguma poesia", autor: "carlos drummond de andrade" },
  { texto: "Era o melhor dos tempos, era o pior dos tempos.", livro: "um conto de duas cidades", autor: "charles dickens" },
];

export function citacaoDoDia(data = new Date()) {
  const dia = Math.floor(data.getTime() / 86_400_000);
  return citacoes[dia % citacoes.length];
}
