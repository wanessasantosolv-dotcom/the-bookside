/**
 * entre palavras. — o banco de citações do início.
 *
 * Regras do banco:
 *  · só obras em domínio público no Brasil (autoria morta há mais de 70 anos),
 *    escritas originalmente em português: nada de tradução sem tradutor
 *    identificado, nada de frase de site de frases;
 *  · texto exato da obra, sem "melhorar" nem juntar trechos;
 *  · cada citação traz obra e localização no texto, para conferência;
 *  · inativa = não aparece (para retirar uma citação sem apagar o histórico).
 * A IA não escreve nem escolhe citações aqui. Novas entradas passam pela mesma
 * revisão (texto conferido na obra) antes de virar `verificada`.
 */
export type Citacao = {
  id: string;
  texto: string;
  autor: string;
  obra: string;
  /** onde está no texto (capítulo, poema, estrofe) */
  local: string;
  ano?: number;
  temas: string[];
  atmosfera: "contemplativa" | "melancólica" | "irônica" | "inquietante" | "luminosa" | "provocativa";
  origem: "Brasil" | "Portugal";
  idioma: "português (original)";
  reproducao: "domínio público";
  verificacao: "verificada";
  incluida: string;
  revisada: string;
  ativa: boolean;
};

const base = { idioma: "português (original)", reproducao: "domínio público", verificacao: "verificada", incluida: "2026-11-27", revisada: "2026-11-27", ativa: true } as const;

export const CITACOES: Citacao[] = [
  { ...base, id: "pessoa-tabacaria", texto: "Não sou nada. Nunca serei nada. Não posso querer ser nada. À parte isso, tenho em mim todos os sonhos do mundo.", autor: "Álvaro de Campos (Fernando Pessoa)", obra: "Tabacaria", local: "primeira estrofe", ano: 1928, temas: ["existência", "sonhos", "identidade"], atmosfera: "melancólica", origem: "Portugal" },
  { ...base, id: "pessoa-mar-portugues", texto: "Tudo vale a pena / Se a alma não é pequena.", autor: "Fernando Pessoa", obra: "Mensagem", local: "“Mar Português”", ano: 1934, temas: ["esperança", "coragem"], atmosfera: "luminosa", origem: "Portugal" },
  { ...base, id: "pessoa-autopsicografia", texto: "O poeta é um fingidor. / Finge tão completamente / Que chega a fingir que é dor / A dor que deveras sente.", autor: "Fernando Pessoa", obra: "Autopsicografia", local: "primeira estrofe", ano: 1932, temas: ["identidade", "imaginação", "contradições humanas"], atmosfera: "provocativa", origem: "Portugal" },
  { ...base, id: "reis-inteiro", texto: "Para ser grande, sê inteiro: nada / Teu exagera ou exclui.", autor: "Ricardo Reis (Fernando Pessoa)", obra: "Odes", local: "ode de 14/02/1933", ano: 1933, temas: ["identidade", "filosofia"], atmosfera: "contemplativa", origem: "Portugal" },
  { ...base, id: "reis-lidia", texto: "Vem sentar-te comigo, Lídia, à beira do rio.", autor: "Ricardo Reis (Fernando Pessoa)", obra: "Odes", local: "primeiro verso da ode", temas: ["tempo", "amor", "natureza"], atmosfera: "contemplativa", origem: "Portugal" },
  { ...base, id: "caeiro-tamanho", texto: "Porque eu sou do tamanho do que vejo / E não do tamanho da minha altura...", autor: "Alberto Caeiro (Fernando Pessoa)", obra: "O Guardador de Rebanhos", local: "poema VII", temas: ["natureza", "imaginação", "existência"], atmosfera: "luminosa", origem: "Portugal" },
  { ...base, id: "caeiro-pensar", texto: "Pensar incomoda como andar à chuva / Quando o vento cresce e parece que chove mais.", autor: "Alberto Caeiro (Fernando Pessoa)", obra: "O Guardador de Rebanhos", local: "poema I", temas: ["filosofia", "natureza", "cotidiano"], atmosfera: "irônica", origem: "Portugal" },
  { ...base, id: "pessoa-ceifeira", texto: "O que em mim sente 'stá pensando.", autor: "Fernando Pessoa", obra: "Ela canta, pobre ceifeira", local: "quarta estrofe", temas: ["contradições humanas", "identidade"], atmosfera: "inquietante", origem: "Portugal" },
  { ...base, id: "machado-negativas", texto: "Não tive filhos, não transmiti a nenhuma criatura o legado da nossa miséria.", autor: "Machado de Assis", obra: "Memórias Póstumas de Brás Cubas", local: "cap. CLX, “Das negativas”", ano: 1881, temas: ["existência", "humor e ironia"], atmosfera: "irônica", origem: "Brasil" },
  { ...base, id: "machado-tempo", texto: "Matamos o tempo; o tempo nos enterra.", autor: "Machado de Assis", obra: "Memórias Póstumas de Brás Cubas", local: "cap. CXIX, “Parêntesis”", ano: 1881, temas: ["tempo", "existência"], atmosfera: "inquietante", origem: "Brasil" },
  { ...base, id: "machado-colica", texto: "Suporta-se com paciência a cólica do próximo.", autor: "Machado de Assis", obra: "Memórias Póstumas de Brás Cubas", local: "cap. CXIX, “Parêntesis”", ano: 1881, temas: ["relações humanas", "humor e ironia"], atmosfera: "irônica", origem: "Brasil" },
  { ...base, id: "machado-marcela", texto: "Marcela amou-me durante quinze meses e onze contos de réis; nada menos.", autor: "Machado de Assis", obra: "Memórias Póstumas de Brás Cubas", local: "cap. XVII", ano: 1881, temas: ["amor", "humor e ironia"], atmosfera: "irônica", origem: "Brasil" },
  { ...base, id: "machado-batatas", texto: "Ao vencedor, as batatas!", autor: "Machado de Assis", obra: "Quincas Borba", local: "cap. VI", ano: 1891, temas: ["questionamentos sociais", "humor e ironia"], atmosfera: "provocativa", origem: "Brasil" },
  { ...base, id: "machado-cigana", texto: "Olhos de cigana oblíqua e dissimulada.", autor: "Machado de Assis", obra: "Dom Casmurro", local: "cap. XXV", ano: 1899, temas: ["amor", "contradições humanas"], atmosfera: "inquietante", origem: "Brasil" },
  { ...base, id: "camoes-amor", texto: "Amor é fogo que arde sem se ver; / É ferida que dói, e não se sente;", autor: "Luís de Camões", obra: "Rimas", local: "soneto “Amor é fogo que arde sem se ver”", temas: ["amor", "contradições humanas"], atmosfera: "melancólica", origem: "Portugal" },
  { ...base, id: "florbela-poeta", texto: "Ser poeta é ser mais alto, é ser maior / Do que os homens!", autor: "Florbela Espanca", obra: "Charneca em Flor", local: "soneto “Ser Poeta”", ano: 1931, temas: ["imaginação", "identidade"], atmosfera: "luminosa", origem: "Portugal" },
  { ...base, id: "augusto-versos", texto: "O beijo, amigo, é a véspera do escarro, / A mão que afaga é a mesma que apedreja.", autor: "Augusto dos Anjos", obra: "Eu", local: "“Versos Íntimos”", ano: 1912, temas: ["relações humanas", "contradições humanas"], atmosfera: "inquietante", origem: "Brasil" },
  { ...base, id: "bilac-estrelas", texto: "Ora (direis) ouvir estrelas! Certo / Perdeste o senso!", autor: "Olavo Bilac", obra: "Via Láctea", local: "soneto XIII", ano: 1888, temas: ["amor", "imaginação"], atmosfera: "luminosa", origem: "Brasil" },
  { ...base, id: "eca-reliquia", texto: "Sobre a nudez forte da verdade — o manto diáfano da fantasia.", autor: "Eça de Queirós", obra: "A Relíquia", local: "epígrafe", ano: 1887, temas: ["imaginação", "filosofia"], atmosfera: "contemplativa", origem: "Portugal" },
  { ...base, id: "cesario-ocidental", texto: "Nas nossas ruas, ao anoitecer, / Há tal soturnidade, há tal melancolia,", autor: "Cesário Verde", obra: "O Sentimento dum Ocidental", local: "primeiros versos", ano: 1880, temas: ["cotidiano", "nostalgia"], atmosfera: "melancólica", origem: "Portugal" },
  { ...base, id: "pompeia-ateneu", texto: "Vais encontrar o mundo, disse-me meu pai, à porta do Ateneu. Coragem para a luta.", autor: "Raul Pompeia", obra: "O Ateneu", local: "primeiras linhas", ano: 1888, temas: ["transformações", "memória"], atmosfera: "contemplativa", origem: "Brasil" },
  { ...base, id: "alvares-amanha", texto: "Se eu morresse amanhã, viria ao menos / Fechar meus olhos minha triste irmã;", autor: "Álvares de Azevedo", obra: "Lira dos Vinte Anos", local: "“Se eu morresse amanhã”", temas: ["tempo", "memória"], atmosfera: "melancólica", origem: "Brasil" },
  { ...base, id: "castro-navio", texto: "Senhor Deus dos desgraçados! / Dizei-me vós, Senhor Deus!", autor: "Castro Alves", obra: "O Navio Negreiro", local: "parte V", ano: 1869, temas: ["questionamentos sociais", "liberdade"], atmosfera: "provocativa", origem: "Brasil" },
  { ...base, id: "cruz-antifona", texto: "Ó Formas alvas, brancas, Formas claras / De luares, de neves, de neblinas!", autor: "Cruz e Sousa", obra: "Broquéis", local: "“Antífona”", ano: 1893, temas: ["imaginação", "natureza"], atmosfera: "contemplativa", origem: "Brasil" },
  { ...base, id: "alencar-iracema", texto: "Além, muito além daquela serra, que ainda azula no horizonte, nasceu Iracema.", autor: "José de Alencar", obra: "Iracema", local: "cap. II", ano: 1865, temas: ["natureza", "pertencimento"], atmosfera: "luminosa", origem: "Brasil" },
  { ...base, id: "goncalves-exilio", texto: "Minha terra tem palmeiras, / Onde canta o Sabiá;", autor: "Gonçalves Dias", obra: "Primeiros Cantos", local: "“Canção do Exílio”", ano: 1846, temas: ["pertencimento", "nostalgia"], atmosfera: "melancólica", origem: "Brasil" },
];

export const citacoesAtivas = () => CITACOES.filter((c) => c.ativa && c.verificacao === "verificada");

/* ───────── seleção diária ───────── */

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h;
}

/** dia no fuso da pessoa (o navegador já está no fuso dela) */
export function diaLocal(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * A ordem de citações de uma pessoa: um embaralhamento fixo (semente = conta),
 * sem a mesma autoria em dias seguidos. O dia aponta uma posição nessa ordem,
 * então a citação é a mesma o dia todo, em qualquer aparelho, e só se repete
 * depois de todo o banco passar. Autores favoritos ganham um pouco mais de vez
 * (cerca de 40% das posições, quando há correspondência), sem exclusividade.
 */
export function ordemDaPessoa(semente: string, favoritos: string[] = []): Citacao[] {
  const lista = citacoesAtivas()
    .map((c) => ({ c, k: hash(`${semente}|${c.id}`) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.c);
  const fav = new Set(favoritos.map((a) => a.toLowerCase()));
  const queridas = lista.filter((c) => [...fav].some((f) => c.autor.toLowerCase().includes(f)));
  const outras = lista.filter((c) => !queridas.includes(c));
  // intercala: 2 em cada 5 posições para o universo da pessoa, enquanto houver
  const ordem: Citacao[] = [];
  while (queridas.length || outras.length) {
    for (const vez of [0, 1, 0, 1, 1]) {
      const fonte = vez === 0 && queridas.length ? queridas : outras.length ? outras : queridas;
      const c = fonte.shift();
      if (c) ordem.push(c);
    }
  }
  // sem a mesma autoria em posições vizinhas (troca com a próxima diferente)
  const autor = (c: Citacao) => c.autor.replace(/\s*\(.*\)/, "").replace(/^.* \(/, "");
  const raiz = (c: Citacao) => (c.autor.includes("Pessoa") ? "Pessoa" : autor(c));
  for (let i = 1; i < ordem.length; i++) {
    if (raiz(ordem[i]) !== raiz(ordem[i - 1])) continue;
    const j = ordem.findIndex((c, k) => k > i && raiz(c) !== raiz(ordem[i - 1]));
    if (j > 0) [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
  }
  return ordem;
}

/** posição do dia na ordem (dias desde uma data fixa) */
export function posicaoDoDia(dia = diaLocal()) {
  const [a, m, d] = dia.split("-").map(Number);
  return Math.floor(Date.UTC(a, m - 1, d) / 864e5);
}
