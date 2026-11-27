/**
 * the reading league. — as metodologias da classificação dos clubes, num lugar só
 * (a página de ranking, o resumo do início e o hall of fame usam estas funções).
 *
 * Tudo sai dos registros reais do clube: livros do clube, fichas, progresso de
 * cada membro e data de entrada. Nada é estimado nem inventado.
 */
import type { Ficha, LivroDoClube, Membro, Progresso } from "@/lib/clubes";

export type Periodo = { id: string; nome: string; ini: string; fim: string; encerrado: boolean };
export type Categoria = "paginas" | "livros" | "fichas" | "indicacoes" | "prazo" | "constancia";

export const CATEGORIAS: { id: Categoria; nome: string; unidade: (n: number) => string; metodo: string }[] = [
  {
    id: "paginas",
    nome: "Páginas de livros concluídos",
    unidade: (n) => (n === 1 ? "página" : "páginas"),
    metodo:
      "Soma as páginas de cada leitura do clube que a pessoa concluiu no período. O app ainda não guarda o histórico de progresso dia a dia, então só entram livros concluídos (sem estimar páginas lidas por mês).",
  },
  {
    id: "livros",
    nome: "Livros concluídos",
    unidade: (n) => (n === 1 ? "livro" : "livros"),
    metodo:
      "Cada membro tem a própria conclusão: marcou \"concluí\" na leitura ou publicou a ficha. A leitura ser encerrada pela moderação não conta como conclusão de ninguém. A data é a do registro da pessoa (ou o encerramento da leitura, nos livros do histórico).",
  },
  {
    id: "fichas",
    nome: "Fichas publicadas",
    unidade: (n) => (n === 1 ? "ficha" : "fichas"),
    metodo: "Uma ficha por pessoa e por leitura do clube, pela data de publicação. Editar a ficha não conta de novo; fichas excluídas saem.",
  },
  {
    id: "indicacoes",
    nome: "Indicações mais bem avaliadas",
    unidade: () => "de média",
    metodo:
      "A nota de cada livro é a média das fichas do clube (só livros com pelo menos 2 notas). A média de quem indicou é a média dessas notas, cada livro com o mesmo peso. Para a classificação oficial são precisas pelo menos 2 indicações avaliadas; abaixo disso o resultado aparece como provisório. Livros vindos do histórico, sem registro de quem indicou, não entram. O período segue a data de encerramento da leitura.",
  },
  {
    id: "prazo",
    nome: "Leituras concluídas no prazo",
    unidade: (n) => (n === 1 ? "leitura" : "leituras"),
    metodo:
      "Entram só leituras com prazo definido, encerradas depois que a pessoa entrou no clube (ou que ela concluiu). Conta quantas a pessoa concluiu até o fim do dia do prazo. Leituras de antes da entrada não contam contra ninguém.",
  },
  {
    id: "constancia",
    nome: "Constância",
    unidade: (n) => (n === 1 ? "leitura seguida" : "leituras seguidas"),
    metodo:
      "Maior sequência de leituras do clube concluídas uma atrás da outra, na ordem oficial (VOL.). Leituras de antes da entrada da pessoa não interrompem a sequência. Não depende de abrir o app todo dia.",
  },
];

export type Linha = { m: Membro; valor: number | null; detalhe?: string; provisorio?: boolean; posicao: number };

const fimDoDia = (dia: string) => `${dia.slice(0, 10)}T23:59:59.999Z`;
const naoAntiga = (f: Ficha) => !f.autor.startsWith("antiga:");
const ordemOficial = (a: LivroDoClube, b: LivroDoClube) =>
  (a.rodada ?? 1e9) - (b.rodada ?? 1e9) || (a.encerrado_em ?? a.criado_em).localeCompare(b.encerrado_em ?? b.criado_em);

// ───────── períodos ─────────

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function periodoMes(ano: number, mes: number, hoje = new Date()): Periodo {
  const ini = new Date(Date.UTC(ano, mes, 1)).toISOString();
  const fim = new Date(Date.UTC(ano, mes + 1, 1)).toISOString();
  return { id: `${ano}-${String(mes + 1).padStart(2, "0")}`, nome: `${MESES[mes]} de ${ano}`, ini, fim, encerrado: new Date(fim) <= hoje };
}
export function periodoAno(ano: number, hoje = new Date()): Periodo {
  return { id: String(ano), nome: String(ano), ini: `${ano}-01-01T00:00:00.000Z`, fim: `${ano + 1}-01-01T00:00:00.000Z`, encerrado: ano < hoje.getFullYear() };
}
export const periodoGeral: Periodo = { id: "geral", nome: "desde a criação do clube", ini: "0000", fim: "9999", encerrado: false };

/** os períodos que têm algum registro (para o seletor e o hall of fame) */
export function periodosComDados(datas: string[], hoje = new Date()) {
  const meses = new Set<string>();
  const anos = new Set<number>();
  for (const d of datas) {
    if (!d) continue;
    meses.add(d.slice(0, 7));
    anos.add(Number(d.slice(0, 4)));
  }
  return {
    meses: [...meses].sort().reverse().map((k) => periodoMes(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, hoje)),
    anos: [...anos].sort((a, b) => b - a).map((a) => periodoAno(a, hoje)),
  };
}
const dentro = (d: string | null | undefined, p: Periodo) => !!d && d >= p.ini && d < p.fim;

// ───────── conclusões ─────────

export type Dados = { membros: Membro[]; livros: LivroDoClube[]; fichas: Ficha[]; progresso: Progresso[] };

/** a conclusão de cada membro em cada leitura do clube (com a data da própria pessoa) */
export function conclusoes(d: Dados) {
  const mapa = new Map<string, Map<string, string>>(); // membro → livro → data
  const elegiveis = d.livros.filter((l) => l.estado !== "sugerido");
  for (const m of d.membros) {
    const minhas = new Map<string, string>();
    for (const l of elegiveis) {
      const prog = d.progresso.find((p) => p.clube_livro_id === l.id && p.usuario_id === m.usuario_id && p.status === "terminei");
      const ficha = d.fichas.find((f) => f.clube_livro_id === l.id && f.autor === m.usuario_id);
      if (!prog && !ficha) continue;
      const data = prog?.atualizado_em ?? (l.livro.historico ? l.encerrado_em : null) ?? ficha?.criado_em ?? l.encerrado_em ?? l.criado_em;
      minhas.set(l.id, data);
    }
    mapa.set(m.usuario_id, minhas);
  }
  return mapa;
}

/** posições com empate: 1º, 1º, 3º (a ordem alfabética só organiza quem empatou) */
function classificar(itens: { m: Membro; valor: number | null; detalhe?: string; provisorio?: boolean }[]): Linha[] {
  const com = itens.filter((x) => x.valor !== null && x.valor > 0);
  const sem = itens.filter((x) => !(x.valor !== null && x.valor > 0));
  const nome = (x: { m: Membro }) => (x.m.pessoa.nome || x.m.pessoa.usuario || "").toLowerCase();
  com.sort((a, b) => Number(!!a.provisorio) - Number(!!b.provisorio) || (b.valor ?? 0) - (a.valor ?? 0) || nome(a).localeCompare(nome(b), "pt-BR"));
  const linhas: Linha[] = [];
  com.forEach((x, i) => {
    const anterior = linhas[i - 1];
    const empate = anterior && !anterior.provisorio === !x.provisorio && anterior.valor === x.valor;
    linhas.push({ ...x, posicao: empate ? anterior.posicao : i + 1 });
  });
  return [...linhas, ...sem.sort((a, b) => nome(a).localeCompare(nome(b), "pt-BR")).map((x) => ({ ...x, posicao: 0 }))];
}

// ───────── as categorias ─────────

export function notaColetiva(d: Dados, livroId: string) {
  const ns = d.fichas.filter((f) => f.clube_livro_id === livroId && f.nota).map((f) => Number(f.nota));
  if (ns.length < 2) return null;
  return { media: ns.reduce((t, n) => t + n, 0) / ns.length, n: ns.length, notas: ns };
}

export function classificacao(d: Dados, cat: Categoria, p: Periodo): Linha[] {
  const conc = conclusoes(d);
  const livro = (id: string) => d.livros.find((l) => l.id === id);
  if (cat === "paginas" || cat === "livros") {
    return classificar(
      d.membros.map((m) => {
        const minhas = [...(conc.get(m.usuario_id) ?? new Map()).entries()].filter(([, data]) => dentro(data, p));
        const valor = cat === "livros" ? minhas.length : minhas.reduce((t, [id]) => t + (livro(id)?.livro.paginas ?? 0), 0);
        return { m, valor };
      }),
    );
  }
  if (cat === "fichas") {
    return classificar(
      d.membros.map((m) => ({ m, valor: d.fichas.filter((f) => naoAntiga(f) && f.autor === m.usuario_id && dentro(f.criado_em, p)).length })),
    );
  }
  if (cat === "indicacoes") {
    return classificar(
      d.membros.map((m) => {
        const minhas = d.livros.filter((l) => l.sugerido_por === m.usuario_id && !l.livro.historico && l.estado === "lido" && dentro(l.encerrado_em, p));
        const notas = minhas.map((l) => notaColetiva(d, l.id)).filter((x): x is NonNullable<typeof x> => !!x);
        if (!notas.length) return { m, valor: null, detalhe: minhas.length ? `${minhas.length} indicação(ões), ainda sem notas suficientes` : undefined };
        const media = notas.reduce((t, x) => t + x.media, 0) / notas.length;
        return {
          m,
          valor: Math.round(media * 100) / 100,
          detalhe: `${notas.length} de ${minhas.length} ${minhas.length === 1 ? "indicação avaliada" : "indicações avaliadas"}`,
          provisorio: notas.length < 2,
        };
      }),
    );
  }
  if (cat === "prazo") {
    return classificar(
      d.membros.map((m) => {
        const minhas = conc.get(m.usuario_id) ?? new Map<string, string>();
        const elegiveis = d.livros.filter(
          (l) => l.estado === "lido" && l.prazo && dentro(l.encerrado_em, p) && ((l.encerrado_em ?? "") >= m.entrou_em || minhas.has(l.id)),
        );
        const noPrazo = elegiveis.filter((l) => {
          const data = minhas.get(l.id);
          return data && data <= fimDoDia(l.prazo!);
        }).length;
        return { m, valor: elegiveis.length ? noPrazo : null, detalhe: elegiveis.length ? `${noPrazo} de ${elegiveis.length} com prazo` : undefined };
      }),
    );
  }
  // constância: maior sequência na ordem oficial (dentro do período)
  const ordem = d.livros.filter((l) => l.estado === "lido" && dentro(l.encerrado_em, p)).sort(ordemOficial);
  return classificar(
    d.membros.map((m) => {
      const minhas = conc.get(m.usuario_id) ?? new Map<string, string>();
      let atual = 0;
      let melhor = 0;
      let elegiveis = 0;
      for (const l of ordem) {
        const antesDeEntrar = (l.encerrado_em ?? "") < m.entrou_em && !minhas.has(l.id);
        if (antesDeEntrar) continue;
        elegiveis++;
        if (minhas.has(l.id)) melhor = Math.max(melhor, ++atual);
        else atual = 0;
      }
      return { m, valor: elegiveis ? melhor : null, detalhe: elegiveis ? `sequência atual: ${atual}` : undefined };
    }),
  );
}

// ───────── distinções ─────────

export type TipoDistincao = "page-turner" | "critic" | "curator" | "constant";
export const DISTINCOES: { id: TipoDistincao; nome: string; categoria: Categoria; descricao: string }[] = [
  { id: "page-turner", nome: "the page turner.", categoria: "paginas", descricao: "mais páginas de livros concluídos" },
  { id: "critic", nome: "the critic.", categoria: "fichas", descricao: "mais fichas publicadas" },
  { id: "curator", nome: "the curator.", categoria: "indicacoes", descricao: "indicações mais bem avaliadas" },
  { id: "constant", nome: "the constant reader.", categoria: "constancia", descricao: "maior sequência de leituras" },
];

/** quem leva cada distinção num período (empate: todas as pessoas; tudo zero ou provisório: ninguém) */
export function distincoes(d: Dados, p: Periodo) {
  return DISTINCOES.map((x) => {
    const linhas = classificacao(d, x.categoria, p).filter((l) => l.posicao === 1 && !l.provisorio && (l.valor ?? 0) > 0);
    // constância só vale a partir de 2 leituras seguidas
    const validas = x.id === "constant" ? linhas.filter((l) => (l.valor ?? 0) >= 2) : linhas;
    return { ...x, vencedores: validas };
  }).filter((x) => x.vencedores.length);
}

// ───────── destaques das indicações ─────────

export function destaquesIndicacoes(d: Dados, p: Periodo) {
  const avaliados = d.livros
    .filter((l) => l.estado === "lido" && l.sugerido_por && !l.livro.historico && dentro(l.encerrado_em, p))
    .map((l) => ({ l, nc: notaColetiva(d, l.id) }))
    .filter((x): x is { l: LivroDoClube; nc: NonNullable<ReturnType<typeof notaColetiva>> } => !!x.nc);
  if (!avaliados.length) return null;
  const melhor = [...avaliados].sort((a, b) => b.nc.media - a.nc.media)[0];
  // divisiva: maior desvio padrão, com pelo menos 3 notas
  const desvio = (ns: number[]) => {
    const m = ns.reduce((t, n) => t + n, 0) / ns.length;
    return Math.sqrt(ns.reduce((t, n) => t + (n - m) ** 2, 0) / ns.length);
  };
  const divisivas = avaliados.filter((x) => x.nc.n >= 3).sort((a, b) => desvio(b.nc.notas) - desvio(a.nc.notas));
  const divisiva = divisivas[0] && desvio(divisivas[0].nc.notas) >= 0.75 ? divisivas[0] : null;
  return { melhor, divisiva, total: avaliados.length };
}

// ───────── reading together ─────────

export type EstadoCelula = "prazo" | "atrasado" | "concluido" | "lendo" | "nao" | "sem" | "inelegivel";
export function matriz(d: Dados, limite = 12) {
  const conc = conclusoes(d);
  const leituras = d.livros.filter((l) => l.estado !== "sugerido").sort(ordemOficial).slice(-limite);
  const linhas = d.membros.map((m) => ({
    m,
    celulas: leituras.map((l): EstadoCelula => {
      const data = conc.get(m.usuario_id)?.get(l.id);
      const antes = (l.encerrado_em ?? "9999") < m.entrou_em;
      if (data) return l.prazo ? (data <= fimDoDia(l.prazo) ? "prazo" : "atrasado") : "concluido";
      if (antes) return "inelegivel";
      const prog = d.progresso.find((p) => p.clube_livro_id === l.id && p.usuario_id === m.usuario_id);
      if (prog?.status === "lendo") return "lendo";
      if (prog?.status === "nao_comecei" && l.estado === "lido") return "nao";
      return "sem";
    }),
  }));
  return { leituras, linhas };
}
