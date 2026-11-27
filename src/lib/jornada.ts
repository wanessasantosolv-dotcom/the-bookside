/**
 * Contas da Jornada que não estão em `calcularNumeros`: os anos com leitura,
 * os destaques com empate, a faixa de dias recentes do calendário, os meses
 * com livros e os formatos com porcentagem.
 */
import {
  diasDeLeitura,
  generoDoLivro,
  paginasDoLivro,
  type Numeros,
} from "@/lib/numeros";
import type { GeneroAutoria } from "@/lib/nacionalidade";
import type { LivroSalvo } from "@/lib/perfil-store";

export const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** os anos em que a pessoa terminou algum livro (e o ano atual), do mais recente ao mais antigo */
export function anosComLeitura(livros: LivroSalvo[], hoje = new Date()) {
  const anos = new Set<number>([hoje.getFullYear()]);
  for (const l of livros)
    if (l.status === "lido" && l.lidoEm) {
      const a = Number(l.lidoEm.slice(0, 4));
      if (a > 1900 && a <= hoje.getFullYear()) anos.add(a);
    }
  return [...anos].sort((a, b) => b - a);
}

export type Destaque = {
  id: "amada" | "menos" | "rapida" | "longa";
  rotulo: string;
  /** o primeiro livro e os que empataram com ele */
  livros: LivroSalvo[];
  /** "5,0 ★", "2 dias"… */
  valor: string;
};

const virgula1 = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dias = (d: number) => (d === 1 ? "1 dia" : `${d} dias`);

/**
 * Os quatro destaques do ano, com empates: a leitura mais amada e a menos
 * amada (pela nota) e a mais rápida e a mais longa (pelos dias entre começar
 * e terminar — não pelo número de páginas).
 */
export function destaquesDoAno(lidos: LivroSalvo[]): Destaque[] {
  const recentes = (a: LivroSalvo, b: LivroSalvo) =>
    (b.lidoEm ?? "").localeCompare(a.lidoEm ?? "");
  const comNota = lidos.filter((l) => l.nota).sort(recentes);
  const saida: Destaque[] = [];
  if (comNota.length) {
    const max = Math.max(...comNota.map((l) => l.nota!));
    const min = Math.min(...comNota.map((l) => l.nota!));
    saida.push({
      id: "amada",
      rotulo: "a mais amada",
      livros: comNota.filter((l) => l.nota === max),
      valor: `${virgula1(max)} ★`,
    });
    // só faz sentido "a menos amada" se alguma nota for menor que a maior
    if (min < max)
      saida.push({
        id: "menos",
        rotulo: "a menos amada",
        livros: comNota.filter((l) => l.nota === min),
        valor: `${virgula1(min)} ★`,
      });
  }
  const comTempo = lidos
    .map((l) => ({ l, d: diasDeLeitura(l) }))
    .filter((x): x is { l: LivroSalvo; d: number } => x.d !== null);
  if (comTempo.length) {
    const rapida = Math.min(...comTempo.map((x) => x.d));
    const longa = Math.max(...comTempo.map((x) => x.d));
    saida.push({
      id: "rapida",
      rotulo: "a mais rápida",
      livros: comTempo.filter((x) => x.d === rapida).map((x) => x.l).sort(recentes),
      valor: dias(rapida),
    });
    if (longa > rapida)
      saida.push({
        id: "longa",
        rotulo: "a mais longa",
        livros: comTempo.filter((x) => x.d === longa).map((x) => x.l).sort(recentes),
        valor: dias(longa),
      });
  }
  return saida;
}

/** "AAAA-MM-DD" no fuso local */
export const chaveDia = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const diaDe = (iso?: string) => (iso ? chaveDia(new Date(iso)) : undefined);

export type DiaDeLeitura = {
  data: Date;
  chave: string;
  /** a capa que aparece no dia: o que terminou, senão o que estava lendo */
  livros: LivroSalvo[];
  terminou: boolean;
};

/**
 * Os dias do mês atual até hoje, com o que estava sendo lido em cada um
 * (mesma regra do calendário: do dia em que começou até o dia em que terminou).
 */
export function diasDoMes(livros: LivroSalvo[], hoje = new Date()) {
  const intervalos = livros
    .filter((l) => l.status === "lido" || l.status === "lendo")
    .map((l) => {
      const fim = l.status === "lido" ? diaDe(l.lidoEm) : chaveDia(hoje);
      const inicio = diaDe(l.iniciadoEm) ?? fim;
      return { l, inicio, fim };
    })
    .filter(
      (x): x is { l: LivroSalvo; inicio: string; fim: string } =>
        !!x.inicio && !!x.fim,
    );
  const lista: DiaDeLeitura[] = [];
  for (let d = 1; d <= hoje.getDate(); d++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth(), d);
    const chave = chaveDia(data);
    const terminados = intervalos.filter(
      (x) => x.l.status === "lido" && x.fim === chave,
    );
    const lendo = intervalos.filter(
      (x) => x.inicio <= chave && x.fim >= chave && !terminados.includes(x),
    );
    lista.push({
      data,
      chave,
      livros: [...terminados, ...lendo].map((x) => x.l),
      terminou: terminados.length > 0,
    });
  }
  return lista;
}

export type MesDoAno = {
  mes: string;
  indice: number;
  total: number;
  melhor: LivroSalvo | null;
  pior: LivroSalvo | null;
  /** todos os que empataram na maior nota do mês */
  melhores: LivroSalvo[];
  /** todos os que empataram na menor nota (só quando é menor que a maior) */
  piores: LivroSalvo[];
  /** livros do mês (para a capa quando ninguém tem nota) */
  livros: LivroSalvo[];
};

/** cada mês do ano que teve livro terminado: o melhor e o pior pela nota */
export function mesesDoAno(lidos: LivroSalvo[]): MesDoAno[] {
  return MESES.map((mes, i) => {
    const doMes = lidos.filter(
      (l) => l.lidoEm && !l.lidoSoAno && new Date(l.lidoEm).getMonth() === i,
    );
    const comNota = doMes
      .filter((l) => l.nota)
      .sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0));
    const max = comNota[0]?.nota;
    const min = comNota.at(-1)?.nota;
    return {
      mes,
      indice: i,
      total: doMes.length,
      melhores: max ? comNota.filter((l) => l.nota === max) : [],
      piores: min !== undefined && max !== undefined && min < max ? comNota.filter((l) => l.nota === min) : [],
      melhor: comNota[0] ?? null,
      pior:
        comNota.length > 1 && comNota.at(-1)!.nota! < comNota[0].nota!
          ? comNota.at(-1)!
          : null,
      livros: doMes,
    };
  }).filter((m) => m.total > 0);
}

/** um audiolivro leva, em média, 1 hora a cada ~35 páginas do livro impresso */
export const horasEstimadas = (paginas: number) => Math.round(paginas / 35);

/** os formatos com a parte de cada um nas leituras que têm formato marcado */
export function formatosComParte(n: Numeros) {
  const marcados = n.porFormato.reduce((t, f) => t + f.qtd, 0);
  return {
    marcados,
    semFormato: n.semFormato,
    lista: n.porFormato.map((f) => ({
      ...f,
      parte: marcados ? f.qtd / marcados : 0,
      // todos os livros do formato têm páginas? (senão, a soma é parcial)
      paginasConhecidas: n.lidos
        .filter((l) => l.formato === f.id)
        .every((l) => !!paginasDoLivro(l)),
      comPaginas: n.lidos.filter((l) => l.formato === f.id && !!paginasDoLivro(l)).length,
    })),
  };
}

// ───────── gêneros, autorias e diversidade ─────────


/**
 * As pessoas de um livro. O app guarda a autoria num texto só; quando há
 * coautoria ela vem separada por vírgula, "&" ou ";". Cada livro conta uma
 * vez para cada pessoa (e uma vez só no total).
 */
export function autoresDoLivro(autor: string): string[] {
  return [
    ...new Set(
      autor
        .split(/\s*(?:,|&|;)\s*/)
        .map((a) => a.trim())
        .filter((a) => a.length > 1 && !/^autoria|desconhecid/i.test(a)),
    ),
  ];
}

const mediaDe = (ls: LivroSalvo[]) => {
  const ns = ls.map((l) => l.nota).filter((n): n is number => !!n);
  return ns.length ? ns.reduce((t, n) => t + n, 0) / ns.length : null;
};

export type GeneroDoAno = {
  nome: string;
  qtd: number;
  parte: number;
  media: number | null;
  livros: LivroSalvo[];
};

/**
 * Os gêneros do ano. Cada livro tem um gênero só no app, então nenhum livro
 * conta duas vezes. Os sem gênero ficam de fora da conta (e são avisados).
 */
export function generosDoAno(
  lidos: LivroSalvo[],
  generoDe: (l: LivroSalvo) => string | undefined = generoDoLivro,
) {
  const por = new Map<string, LivroSalvo[]>();
  let semGenero = 0;
  for (const l of lidos) {
    const g = generoDe(l)?.trim().toLowerCase();
    if (!g) {
      semGenero++;
      continue;
    }
    por.set(g, [...(por.get(g) ?? []), l]);
  }
  const comGenero = lidos.length - semGenero;
  const lista: GeneroDoAno[] = [...por.entries()]
    .map(([nome, livros]) => ({
      nome,
      qtd: livros.length,
      parte: comGenero ? livros.length / comGenero : 0,
      media: mediaDe(livros),
      livros,
    }))
    .sort((a, b) => b.qtd - a.qtd || a.nome.localeCompare(b.nome));
  return { lista, semGenero, comGenero };
}

/** até 5 blocos no treemap; o resto (e quem tem menos de 6%) vira "outros" */
export function agruparGeneros(lista: GeneroDoAno[], max = 5) {
  const principais: GeneroDoAno[] = [];
  const outros: GeneroDoAno[] = [];
  for (const g of lista)
    if (principais.length < max && (g.parte >= 0.06 || principais.length < 2))
      principais.push(g);
    else outros.push(g);
  if (outros.length === 1) return { principais: [...principais, outros[0]], outros: [] };
  return { principais, outros };
}

export type Bloco<T> = { item: T; x: number; y: number; w: number; h: number };

/**
 * Treemap simples: divide a área em dois grupos de soma parecida, cortando
 * pelo lado mais comprido, e repete. Posições em % (0–100).
 */
export function treemap<T>(
  itens: { item: T; valor: number }[],
  x = 0,
  y = 0,
  w = 100,
  h = 100,
): Bloco<T>[] {
  if (!itens.length) return [];
  if (itens.length === 1) return [{ item: itens[0].item, x, y, w, h }];
  const total = itens.reduce((t, i) => t + i.valor, 0) || 1;
  let soma = 0;
  let corte = 1;
  for (let i = 0; i < itens.length - 1; i++) {
    soma += itens[i].valor;
    corte = i + 1;
    if (soma >= total / 2) break;
  }
  const a = itens.slice(0, corte);
  const b = itens.slice(corte);
  const pa = a.reduce((t, i) => t + i.valor, 0) / total;
  // o retângulo é mais largo que alto? (a área do treemap tem proporção ~2:1)
  return w * 2 >= h
    ? [...treemap(a, x, y, w * pa, h), ...treemap(b, x + w * pa, y, w * (1 - pa), h)]
    : [...treemap(a, x, y, w, h * pa), ...treemap(b, x, y + h * pa, w, h * (1 - pa))];
}

export type AutorDoAno = {
  nome: string;
  qtd: number;
  media: number | null;
  livros: LivroSalvo[];
};

/** o ranking de quem mais apareceu no ano (coautoria conta para cada pessoa) */
export function rankingDeAutores(lidos: LivroSalvo[]): AutorDoAno[] {
  const por = new Map<string, { nome: string; livros: LivroSalvo[] }>();
  for (const l of lidos)
    for (const nome of autoresDoLivro(l.autor)) {
      const k = nome.toLowerCase();
      const x = por.get(k) ?? { nome, livros: [] };
      x.livros.push(l);
      por.set(k, x);
    }
  return [...por.values()]
    .map((x) => ({ nome: x.nome, qtd: x.livros.length, media: mediaDe(x.livros), livros: x.livros }))
    .sort(
      (a, b) =>
        b.qtd - a.qtd ||
        (b.media ?? 0) - (a.media ?? 0) ||
        a.nome.localeCompare(b.nome),
    );
}

export type CategoriaAutoria = GeneroAutoria | "mista" | "desconhecida";

export const rotuloAutoria: Record<CategoriaAutoria, string> = {
  feminina: "autoria feminina",
  masculina: "autoria masculina",
  "nao-binaria": "autoria não binária",
  outra: "outras identidades",
  mista: "coautoria mista",
  desconhecida: "não informado",
};

/**
 * A autoria de cada livro do ano (um livro conta uma vez): pelo gênero
 * declarado de quem escreveu. Coautoria com gêneros diferentes = "mista";
 * se alguém do livro não tem dado, o livro fica como "não informado".
 */
export function diversidadeDeAutoria(
  lidos: LivroSalvo[],
  generoDe: (autor: string) => GeneroAutoria | null | undefined,
) {
  const conta = new Map<CategoriaAutoria, number>();
  for (const l of lidos) {
    const gs = autoresDoLivro(l.autor).map((a) => generoDe(a));
    const cat: CategoriaAutoria =
      !gs.length || gs.some((g) => !g)
        ? "desconhecida"
        : new Set(gs).size > 1
          ? "mista"
          : (gs[0] as GeneroAutoria);
    conta.set(cat, (conta.get(cat) ?? 0) + 1);
  }
  const ordem: CategoriaAutoria[] = ["feminina", "masculina", "nao-binaria", "outra", "mista", "desconhecida"];
  return ordem
    .map((c) => ({ categoria: c, qtd: conta.get(c) ?? 0, parte: lidos.length ? (conta.get(c) ?? 0) / lidos.length : 0 }))
    .filter((x) => x.qtd || x.categoria === "feminina" || x.categoria === "masculina" || x.categoria === "desconhecida");
}

/**
 * Quantos dias do ano tiveram livro aberto (de quando começou até quando
 * terminou cada leitura; o que está sendo lido conta até hoje).
 */
export function diasDeLeituraNoAno(livros: LivroSalvo[], ano: number, hoje = new Date()) {
  const inicioAno = new Date(ano, 0, 1);
  const fimAno = ano === hoje.getFullYear() ? hoje : new Date(ano, 11, 31);
  const dias = new Set<string>();
  for (const l of livros) {
    if (l.status !== "lido" && l.status !== "lendo") continue;
    const fim = l.status === "lido" ? (l.lidoEm ? new Date(l.lidoEm) : null) : hoje;
    if (!fim) continue;
    const ini = l.iniciadoEm ? new Date(l.iniciadoEm) : fim;
    const a = ini < inicioAno ? inicioAno : ini;
    const b = fim > fimAno ? fimAno : fim;
    for (let d = new Date(a.getFullYear(), a.getMonth(), a.getDate()); d <= b; d.setDate(d.getDate() + 1))
      dias.add(chaveDia(d));
  }
  return dias.size;
}
