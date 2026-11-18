/**
 * Citação do dia no início: frases poéticas e reflexivas, de livros e poemas.
 * Muda uma vez por dia, igual para todo mundo. Trechos curtos, com a obra e a autoria.
 */
export const citacoes = [
  {
    texto: "A vida só é possível reinventada.",
    livro: "reinvenção",
    autor: "cecília meireles",
  },
  {
    texto: "Tudo vale a pena se a alma não é pequena.",
    livro: "mensagem",
    autor: "fernando pessoa",
  },
  {
    texto: "O que a vida quer da gente é coragem.",
    livro: "grande sertão: veredas",
    autor: "guimarães rosa",
  },
  {
    texto: "Liberdade é pouco. O que eu desejo ainda não tem nome.",
    livro: "perto do coração selvagem",
    autor: "clarice lispector",
  },
  {
    texto:
      "Respirei fundo e ouvi o velho alarde do meu coração: eu sou, eu sou, eu sou.",
    livro: "a redoma de vidro",
    autor: "sylvia plath",
  },
  {
    texto: "Tudo que não invento é falso.",
    livro: "memórias inventadas",
    autor: "manoel de barros",
  },
  {
    texto:
      "Seja paciente com tudo o que não está resolvido em seu coração e tente amar as próprias perguntas.",
    livro: "cartas a um jovem poeta",
    autor: "rainer maria rilke",
  },
  {
    texto: "À parte isso, tenho em mim todos os sonhos do mundo.",
    livro: "tabacaria",
    autor: "álvaro de campos",
  },
  {
    texto:
      "Diga-me, o que você planeja fazer com a sua única vida, selvagem e preciosa?",
    livro: "o dia de verão",
    autor: "mary oliver",
  },
  {
    texto: "O essencial é invisível aos olhos.",
    livro: "o pequeno príncipe",
    autor: "antoine de saint-exupéry",
  },
  {
    texto: "Tudo no mundo começou com um sim.",
    livro: "a hora da estrela",
    autor: "clarice lispector",
  },
  {
    texto:
      "Que não seja imortal, posto que é chama, mas que seja infinito enquanto dure.",
    livro: "soneto de fidelidade",
    autor: "vinicius de moraes",
  },
  {
    texto: "Felicidade se acha é em horinhas de descuido.",
    livro: "tutaméia",
    autor: "guimarães rosa",
  },
  {
    texto:
      "Não há barreira, fechadura ou ferrolho que possas impor à liberdade da minha mente.",
    livro: "um teto todo seu",
    autor: "virginia woolf",
  },
  {
    texto: "Ai, palavras, ai, palavras, que estranha potência a vossa!",
    livro: "romanceiro da inconfidência",
    autor: "cecília meireles",
  },
  {
    texto:
      "Mundo mundo vasto mundo, se eu me chamasse Raimundo seria uma rima, não seria uma solução.",
    livro: "poema de sete faces",
    autor: "carlos drummond de andrade",
  },
  {
    texto: "A esperança é a coisa com penas que pousa na alma.",
    livro: "poemas",
    autor: "emily dickinson",
  },
  {
    texto: "Somos feitos da mesma matéria dos sonhos.",
    livro: "a tempestade",
    autor: "william shakespeare",
  },
  {
    texto:
      "Já que se há de escrever, que ao menos não se esmaguem com palavras as entrelinhas.",
    livro: "a descoberta do mundo",
    autor: "clarice lispector",
  },
  {
    texto: "Não sou um pássaro, e nenhuma rede me prende.",
    livro: "jane eyre",
    autor: "charlotte brontë",
  },
  {
    texto: "Posso escrever os versos mais tristes esta noite.",
    livro: "vinte poemas de amor",
    autor: "pablo neruda",
  },
  {
    texto: "Eu sou trezentos, sou trezentos-e-cinquenta.",
    livro: "remate de males",
    autor: "mário de andrade",
  },
  {
    texto:
      "O poeta é um fingidor. Finge tão completamente que chega a fingir que é dor a dor que deveras sente.",
    livro: "autopsicografia",
    autor: "fernando pessoa",
  },
  {
    texto: "No meio do caminho tinha uma pedra.",
    livro: "alguma poesia",
    autor: "carlos drummond de andrade",
  },
];

export function citacaoDoDia(data = new Date()) {
  const dia = Math.floor(data.getTime() / 86_400_000);
  return citacoes[dia % citacoes.length];
}
