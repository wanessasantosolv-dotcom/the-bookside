/**
 * Contas da Jornada que não estão em `calcularNumeros`: os anos com leitura,
 * os destaques com empate, a faixa de dias recentes do calendário, os meses
 * com livros e os formatos com porcentagem.
 */
import {
  diasDeLeitura,
  paginasDoLivro,
  type Numeros,
} from "@/lib/numeros";
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
  /** livros do mês (para a capa quando ninguém tem nota) */
  livros: LivroSalvo[];
};

/** cada mês do ano que teve livro terminado: o melhor e o pior pela nota */
export function mesesDoAno(lidos: LivroSalvo[]): MesDoAno[] {
  return MESES.map((mes, i) => {
    const doMes = lidos.filter(
      (l) => l.lidoEm && new Date(l.lidoEm).getMonth() === i,
    );
    const comNota = doMes
      .filter((l) => l.nota)
      .sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0));
    return {
      mes,
      indice: i,
      total: doMes.length,
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
      // páginas só contam quando todos os livros do formato têm páginas
      paginasConhecidas: n.lidos
        .filter((l) => l.formato === f.id)
        .every((l) => !!paginasDoLivro(l)),
    })),
  };
}
