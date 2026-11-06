/**
 * Teste "what's your bookside": 15 perguntas e 8 arquétipos.
 *
 * As perguntas, os selos (washi) e o arquétipo "a coruja da madrugada" vêm do
 * canvas "Perfil — Opções". Os nomes "detetive dos plot twists", "leitora de
 * coração partido" e "viajante de universos" também vêm do canvas.
 *
 * ⚠️ RASCUNHO: os textos, livros e frases dos outros arquétipos (e os 4
 * arquétipos novos) foram escritos para o app funcionar. Revise e troque à vontade
 * — é só editar este arquivo.
 */

export type ArquetipoId =
  | "coruja"
  | "detetive"
  | "coracao"
  | "viajante"
  | "guardia"
  | "curiosa"
  | "aconchego"
  | "entrelinhas";

export type Arquetipo = {
  id: ArquetipoId;
  nome: string;
  clube: string;
  descricao: string;
  revela: string;
  explorar: string;
  livros: { titulo: string; autor: string; porque: string; cor: string }[];
  frase: { texto: string; autor: string; obra: string };
  rascunho?: boolean;
};

export const arquetipos: Record<ArquetipoId, Arquetipo> = {
  coruja: {
    id: "coruja",
    nome: "a coruja da madrugada",
    clube: "one more chapter club",
    descricao:
      "Você adora ficar completamente imersa em uma narrativa. Se o capítulo termina com suspense, o sono que lute: mais cinco minutinhos facilmente viram duas horas.",
    revela: "Imersão, entusiasmo e facilidade de se envolver com tramas envolventes.",
    explorar:
      "Thrillers curtos e aventuras de ritmo acelerado são ótimos caminhos, mas vale testar histórias mais contemplativas.",
    livros: [
      { titulo: "Recursão", autor: "Blake Crouch", porque: "pra quem não consegue parar no capítulo", cor: "#6B0D24" },
      { titulo: "Jogos Vorazes", autor: "Suzanne Collins", porque: "ritmo que não dá trégua", cor: "#2B1420" },
      { titulo: "A Empregada", autor: "Freida McFadden", porque: "uma virada atrás da outra", cor: "#B75A6B" },
    ],
    frase: { texto: "We are such stuff as dreams are made on.", autor: "William Shakespeare", obra: "A Tempestade" },
  },
  detetive: {
    id: "detetive",
    nome: "a detetive dos plot twists",
    clube: "trust no narrator club",
    descricao:
      "Você lê com uma lupa invisível. Desconfia de todo mundo, anota pistas mentalmente e sente um prazer especial quando o final te pega de surpresa — ou quando você acerta antes.",
    revela: "Atenção aos detalhes, curiosidade e gosto por desafios.",
    explorar: "Mistérios clássicos e thrillers psicológicos são seu lar, mas um romance lento pode te surpreender.",
    livros: [
      { titulo: "E não sobrou nenhum", autor: "Agatha Christie", porque: "o clássico que ensinou a desconfiar", cor: "#2B1420" },
      { titulo: "Garota exemplar", autor: "Gillian Flynn", porque: "ninguém é quem parece", cor: "#4B0D1B" },
      { titulo: "A paciente silenciosa", autor: "Alex Michaelides", porque: "um final pra reler o livro todo", cor: "#6B7A5E" },
    ],
    frase: {
      texto: "Quando você elimina o impossível, o que restar, por mais improvável que seja, deve ser a verdade.",
      autor: "Arthur Conan Doyle",
      obra: "O Signo dos Quatro",
    },
    rascunho: true,
  },
  coracao: {
    id: "coracao",
    nome: "a leitora de coração partido",
    clube: "sad endings society",
    descricao:
      "Você lê para sentir tudo. Se apega aos personagens como se fossem gente de verdade, sofre junto e guarda as melhores frases como quem guarda cartas de amor.",
    revela: "Empatia, intensidade e uma memória afetiva enorme para histórias.",
    explorar: "Romances e dramas são sua casa, mas uma boa aventura também pode partir seu coração do jeito certo.",
    livros: [
      { titulo: "Orgulho e preconceito", autor: "Jane Austen", porque: "a tensão que atravessa séculos", cor: "#8E1D3D" },
      { titulo: "Pessoas normais", autor: "Sally Rooney", porque: "um amor cheio de quase", cor: "#B75A6B" },
      { titulo: "Como eu era antes de você", autor: "Jojo Moyes", porque: "pra chorar com gosto", cor: "#6B0D24" },
    ],
    frase: {
      texto: "Seja qual for a matéria de que nossas almas são feitas, a dele e a minha são iguais.",
      autor: "Emily Brontë",
      obra: "O Morro dos Ventos Uivantes",
    },
    rascunho: true,
  },
  viajante: {
    id: "viajante",
    nome: "a viajante de universos",
    clube: "map lovers club",
    descricao:
      "Você não lê histórias, você se muda para elas. Mapas, magia, reinos inteiros: quando o livro acaba, a saudade é do mundo todo, não só dos personagens.",
    revela: "Imaginação, coragem e vontade de ir longe.",
    explorar: "Fantasia é seu passaporte, mas realismo mágico pode ser uma viagem tão boa quanto.",
    livros: [
      { titulo: "O Hobbit", autor: "J. R. R. Tolkien", porque: "a primeira viagem de muitas", cor: "#6B7A5E" },
      { titulo: "O nome do vento", autor: "Patrick Rothfuss", porque: "um mundo pra morar", cor: "#4B0D1B" },
      { titulo: "A vida invisível de Addie LaRue", autor: "V. E. Schwab", porque: "trezentos anos de aventura", cor: "#2B1420" },
    ],
    frase: { texto: "Nem todos os que vagueiam estão perdidos.", autor: "J. R. R. Tolkien", obra: "O Senhor dos Anéis" },
    rascunho: true,
  },
  guardia: {
    id: "guardia",
    nome: "a guardiã da estante",
    clube: "tbr tower club",
    descricao:
      "Você ama o livro como objeto: a capa, a edição especial, o cheiro de página nova. Sua pilha de quero-ler é uma torre — e você não tem a menor intenção de diminuir.",
    revela: "Carinho pelos detalhes, estética apurada e paixão por colecionar histórias.",
    explorar: "Que tal tirar da pilha aquele livro esquecido há mais tempo? Ele está esperando por você.",
    livros: [
      { titulo: "A sombra do vento", autor: "Carlos Ruiz Zafón", porque: "um cemitério de livros esquecidos", cor: "#4B0D1B" },
      { titulo: "A biblioteca da meia-noite", autor: "Matt Haig", porque: "cada livro, uma vida possível", cor: "#2B1420" },
      { titulo: "A livraria mágica de Paris", autor: "Nina George", porque: "livros como remédio", cor: "#B75A6B" },
    ],
    frase: {
      texto: "Sempre imaginei que o paraíso fosse uma espécie de biblioteca.",
      autor: "Jorge Luis Borges",
      obra: "Poema dos Dons",
    },
    rascunho: true,
  },
  curiosa: {
    id: "curiosa",
    nome: "a curiosa sem rótulo",
    clube: "any genre club",
    descricao:
      "Você não cabe em um gênero só. Pula da poesia para a ficção científica sem pedir licença e adora quando uma recomendação inesperada vira favorita.",
    revela: "Abertura, curiosidade e um gosto que está sempre se reinventando.",
    explorar: "Seu desafio é o oposto: escolher um autor e mergulhar fundo na obra inteira.",
    livros: [
      { titulo: "Torto arado", autor: "Itamar Vieira Junior", porque: "uma voz que fica com você", cor: "#6B7A5E" },
      { titulo: "10 minutos e 38 segundos", autor: "Elif Shafak", porque: "uma vida inteira em minutos", cor: "#8E1D3D" },
      { titulo: "Cem anos de solidão", autor: "Gabriel García Márquez", porque: "realismo mágico pra se perder", cor: "#4B0D1B" },
    ],
    frase: { texto: "Sou vasto, contenho multidões.", autor: "Walt Whitman", obra: "Canção de Mim Mesmo" },
    rascunho: true,
  },
  aconchego: {
    id: "aconchego",
    nome: "a leitora de chá e manta",
    clube: "cozy corner club",
    descricao:
      "Para você, ler é voltar para casa. Chá quente, manta, um capítulo por noite e histórias que abraçam. Você marca a página, guarda o livro e dorme em paz.",
    revela: "Constância, calma e uma relação muito afetuosa com a leitura.",
    explorar: "Um suspense curto pode trazer um friozinho na barriga sem tirar seu sono.",
    livros: [
      { titulo: "Águas frescas para as flores", autor: "Valérie Perrin", porque: "delicado do começo ao fim", cor: "#6B7A5E" },
      { titulo: "Anne de Green Gables", autor: "L. M. Montgomery", porque: "um abraço em forma de livro", cor: "#B75A6B" },
      { titulo: "Mulherzinhas", autor: "Louisa May Alcott", porque: "irmãs, cartas e lareira", cor: "#8E1D3D" },
    ],
    frase: {
      texto: "Declaro, afinal, que não há prazer como a leitura!",
      autor: "Jane Austen",
      obra: "Orgulho e Preconceito",
    },
    rascunho: true,
  },
  entrelinhas: {
    id: "entrelinhas",
    nome: "a poeta das entrelinhas",
    clube: "underlined pages club",
    descricao:
      "Você lê devagar, sublinhando. Gosta de personagens imperfeitos, de silêncios que dizem muito e de frases que pedem para ser relidas em voz alta.",
    revela: "Sensibilidade, olhar atento e intimidade com as palavras.",
    explorar: "Uma aventura cheia de ação pode ser um ótimo contraste para o seu ritmo contemplativo.",
    livros: [
      { titulo: "A hora da estrela", autor: "Clarice Lispector", porque: "pequeno e imenso", cor: "#2B1420" },
      { titulo: "A redoma de vidro", autor: "Sylvia Plath", porque: "pra sublinhar quase tudo", cor: "#6B0D24" },
      { titulo: "O ano do pensamento mágico", autor: "Joan Didion", porque: "a beleza no luto", cor: "#6B7A5E" },
    ],
    frase: { texto: "Tenho em mim todos os sonhos do mundo.", autor: "Fernando Pessoa (Álvaro de Campos)", obra: "Tabacaria" },
    rascunho: true,
  },
};

type Opcao = { texto: string; pontos: Partial<Record<ArquetipoId, number>> };
export type Pergunta = { selo: string; titulo: string; opcoes: [Opcao, Opcao, Opcao, Opcao] };

/** Pontuação: 2 pontos para o arquétipo principal da resposta, 1 para o secundário. (rascunho) */
export const perguntas: Pergunta[] = [
  {
    selo: "o primeiro instinto diz muito ♡",
    titulo: "você entra numa livraria. qual é a primeira coisa que faz?",
    opcoes: [
      { texto: "procuro uma história de amor inesquecível", pontos: { coracao: 2 } },
      { texto: "vou direto aos mistérios", pontos: { detetive: 2, coruja: 1 } },
      { texto: "exploro universos fantásticos", pontos: { viajante: 2 } },
      { texto: "olho todas as mesas de novidades", pontos: { guardia: 2, curiosa: 1 } },
    ],
  },
  {
    selo: "confissões de leitora",
    titulo: "qual dessas situações parece mais com você?",
    opcoes: [
      { texto: "me apego aos personagens como se fossem reais", pontos: { coracao: 2, entrelinhas: 1 } },
      { texto: "invento teorias antes do final", pontos: { detetive: 2 } },
      { texto: "prometo dormir cedo e falho", pontos: { coruja: 2 } },
      { texto: "leio dependendo do meu humor", pontos: { curiosa: 2, aconchego: 1 } },
    ],
  },
  {
    selo: "your reading sanctuary",
    titulo: "escolha o lugar perfeito para ler",
    opcoes: [
      { texto: "um café antigo em Paris", pontos: { coracao: 2, entrelinhas: 1 } },
      { texto: "uma biblioteca cheia de passagens secretas", pontos: { detetive: 1, viajante: 1, guardia: 1 } },
      { texto: "meu quarto de madrugada, só com a luminária", pontos: { coruja: 2 } },
      { texto: "um sebo com poltronas e pilhas de livros", pontos: { guardia: 2, aconchego: 1 } },
    ],
  },
  {
    selo: "post-reading crisis",
    titulo: "um livro acabou. qual reação combina mais com você?",
    opcoes: [
      { texto: "fico dias pensando no relacionamento dos protagonistas", pontos: { coracao: 2 } },
      { texto: "preciso discutir todas as reviravoltas", pontos: { detetive: 2 } },
      { texto: "tenho saudade do universo inteiro", pontos: { viajante: 2, coruja: 1 } },
      { texto: "já estou escolhendo cinco novas leituras", pontos: { guardia: 2, curiosa: 1 } },
    ],
  },
  {
    selo: "five-star feelings ★",
    titulo: "o que mais te faz dar cinco estrelas?",
    opcoes: [
      { texto: "química entre personagens e diálogos incríveis", pontos: { coracao: 2 } },
      { texto: "um final que me deixa sem palavras", pontos: { detetive: 2, coruja: 1 } },
      { texto: "um mundo que parece existir de verdade", pontos: { viajante: 2 } },
      { texto: "uma história que me faz chorar de verdade", pontos: { entrelinhas: 2, coracao: 1 } },
    ],
  },
  {
    selo: "sem julgamentos, prometo",
    titulo: "qual dessas é sua red flag literária?",
    opcoes: [
      { texto: "amar personagens problemáticos", pontos: { coracao: 1, entrelinhas: 2 } },
      { texto: "desconfiar até do personagem principal", pontos: { detetive: 2 } },
      { texto: "comprar livros mesmo com a estante lotada", pontos: { guardia: 2 } },
      { texto: "abandonar um gênero por outro completamente diferente", pontos: { curiosa: 2 } },
    ],
  },
  {
    selo: "main character energy",
    titulo: "se sua vida fosse um livro, qual seria o cenário?",
    opcoes: [
      { texto: "uma pequena cidade cheia de amizades", pontos: { aconchego: 2 } },
      { texto: "uma academia antiga com sociedades secretas", pontos: { detetive: 1, coruja: 2 } },
      { texto: "um reino distante com magia esquecida", pontos: { viajante: 2 } },
      { texto: "uma viagem cheia de encontros inesperados", pontos: { curiosa: 2, coracao: 1 } },
    ],
  },
  {
    selo: "trope obsession",
    titulo: "escolha uma dessas tropes",
    opcoes: [
      { texto: "enemies to lovers", pontos: { coracao: 2, coruja: 1 } },
      { texto: "narrador não confiável", pontos: { detetive: 2 } },
      { texto: "found family", pontos: { aconchego: 2, viajante: 1 } },
      { texto: "second chances e reencontros", pontos: { entrelinhas: 2, coracao: 1 } },
    ],
  },
  {
    selo: "don't judge a book... or do",
    titulo: "o que costuma te fazer começar um livro?",
    opcoes: [
      { texto: "uma frase romântica que vi na internet", pontos: { coracao: 1, entrelinhas: 2 } },
      { texto: "uma sinopse que não revela quase nada", pontos: { detetive: 2 } },
      { texto: "uma capa linda e uma edição especial", pontos: { guardia: 2 } },
      { texto: "uma recomendação completamente fora do meu gosto habitual", pontos: { curiosa: 2 } },
    ],
  },
  {
    selo: "the midnight dilemma",
    titulo: "são 2h da manhã e faltam 100 páginas. você...",
    opcoes: [
      { texto: "continuo se meu casal favorito estiver em perigo", pontos: { coruja: 2, coracao: 1 } },
      { texto: "preciso descobrir quem é o culpado", pontos: { coruja: 2, detetive: 1 } },
      { texto: "fico lendo até saber como termina a aventura", pontos: { coruja: 2, viajante: 1 } },
      { texto: "marco onde parei e guardo para amanhã", pontos: { aconchego: 2 } },
    ],
  },
  {
    selo: "fictional crushes & friendships",
    titulo: "que tipo de personagem conquista seu coração?",
    opcoes: [
      { texto: "alguém sarcástico que esconde um coração enorme", pontos: { coracao: 2 } },
      { texto: "alguém moralmente ambíguo e misterioso", pontos: { detetive: 2, coruja: 1 } },
      { texto: "alguém que luta por sua família escolhida", pontos: { viajante: 2, aconchego: 1 } },
      { texto: "alguém sensível, imperfeito e muito humano", pontos: { entrelinhas: 2 } },
    ],
  },
  {
    selo: "bookish wishlist",
    titulo: "qual seria seu presente literário perfeito?",
    opcoes: [
      { texto: "uma edição anotada de meu romance favorito", pontos: { guardia: 2, coracao: 1 } },
      { texto: "um jogo investigativo inspirado em um thriller", pontos: { detetive: 2 } },
      { texto: "um mapa ilustrado de um mundo fantástico", pontos: { viajante: 2 } },
      { texto: "um kit com chá, manta e livros-surpresa", pontos: { aconchego: 2, curiosa: 1 } },
    ],
  },
  {
    selo: "unlock a new chapter",
    titulo: "você quer experimentar um estilo novo. qual escolhe?",
    opcoes: [
      { texto: "romance histórico cheio de tensão", pontos: { coracao: 2 } },
      { texto: "ficção científica com mistério", pontos: { coruja: 2, detetive: 1 } },
      { texto: "realismo mágico", pontos: { curiosa: 2, viajante: 1 } },
      { texto: "contos intimistas sobre pessoas comuns", pontos: { entrelinhas: 2 } },
    ],
  },
  {
    selo: "a little too personal",
    titulo: "qual frase representa sua relação com os livros?",
    opcoes: [
      { texto: "eu leio para sentir tudo", pontos: { coracao: 2, entrelinhas: 1 } },
      { texto: "eu leio para descobrir o inesperado", pontos: { detetive: 2, curiosa: 1 } },
      { texto: "eu leio para viver outras vidas", pontos: { viajante: 2, coruja: 1 } },
      { texto: "eu leio para me sentir em casa", pontos: { aconchego: 2 } },
    ],
  },
  {
    selo: "the final page ✦",
    titulo: "última pergunta: que história você gostaria de encontrar amanhã?",
    opcoes: [
      { texto: "uma paixão impossível que vale a pena", pontos: { coracao: 2 } },
      { texto: "uma investigação que muda tudo", pontos: { detetive: 2, coruja: 1 } },
      { texto: "uma jornada fantástica cheia de descobertas", pontos: { viajante: 2 } },
      { texto: "um livro-surpresa que nunca escolheria normalmente", pontos: { curiosa: 2 } },
    ],
  },
];

export const ORDEM_DESEMPATE: ArquetipoId[] = [
  "coruja",
  "detetive",
  "coracao",
  "viajante",
  "guardia",
  "curiosa",
  "aconchego",
  "entrelinhas",
];

export type Resultado = {
  principal: Arquetipo;
  secundario: Arquetipo;
  /** afinidade de 0 a 100 com cada arquétipo, do maior para o menor */
  dna: { arquetipo: Arquetipo; afinidade: number }[];
};

/** Soma os pontos das respostas (índices 0–3, null = sem resposta). */
export function calcularResultado(respostas: (number | null)[]): Resultado {
  const pontos = Object.fromEntries(ORDEM_DESEMPATE.map((id) => [id, 0])) as Record<ArquetipoId, number>;
  respostas.forEach((r, i) => {
    if (r === null || !perguntas[i]) return;
    for (const [id, p] of Object.entries(perguntas[i].opcoes[r].pontos)) pontos[id as ArquetipoId] += p ?? 0;
  });
  const ordem = [...ORDEM_DESEMPATE].sort((a, b) => pontos[b] - pontos[a]);
  const maximo = Math.max(1, pontos[ordem[0]]);
  return {
    principal: arquetipos[ordem[0]],
    secundario: arquetipos[ordem[1]],
    dna: ordem.map((id) => ({ arquetipo: arquetipos[id], afinidade: Math.round((pontos[id] / maximo) * 100) })),
  };
}
