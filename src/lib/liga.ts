/**
 * the reading league. — as metodologias da classificação dos clubes, num lugar só
 * (a página de ranking, o resumo do início e o hall of fame usam estas funções).
 *
 * Tudo sai dos registros reais do clube: livros do clube, fichas, progresso de
 * cada membro e data de entrada. Nada é estimado nem inventado.
 */
import type { Ficha, LivroDoClube, Membro, Progresso } from "@/lib/clubes";
import type { LivroSalvo } from "@/lib/perfil-store";

export type Periodo = { id: string; nome: string; ini: string; fim: string; encerrado: boolean };
export type Categoria = "paginas" | "livros" | "resenhas" | "autores" | "generos" | "constancia" | "indicacoes" | "coletivas" | "prazo";

export type InfoCategoria = { id: Categoria; nome: string; escopo: "individual" | "clube"; unidade: (n: number) => string; metodo: string };
export const CATEGORIAS: InfoCategoria[] = [
  {
    id: "paginas",
    nome: "Páginas lidas",
    escopo: "individual",
    unidade: (n) => (n === 1 ? "página" : "páginas"),
    metodo: "Soma das páginas dos livros que cada pessoa concluiu no período, em todas as leituras (pessoais, de clubes e co-read), contadas uma vez só por livro. Vem da estante pública de cada pessoa; o app ainda não guarda o progresso dia a dia, então só entram livros concluídos.",
  },
  {
    id: "livros",
    nome: "Livros concluídos",
    escopo: "individual",
    unidade: (n) => (n === 1 ? "livro" : "livros"),
    metodo: "Livros que cada pessoa marcou como lidos no período, em todas as leituras, cada livro uma vez. Leituras com só o ano entram no ano e no histórico, não nos meses.",
  },
  {
    id: "resenhas",
    nome: "Resenhas publicadas",
    escopo: "individual",
    unidade: (n) => (n === 1 ? "resenha" : "resenhas"),
    metodo: "Livros com resenha escrita na ficha, pela data da ficha (ou da leitura). Resenhas de estantes privadas não contam.",
  },
  {
    id: "autores",
    nome: "Autores explorados",
    escopo: "individual",
    unidade: (n) => (n === 1 ? "autor" : "autores diferentes"),
    metodo: "Quantos autores diferentes cada pessoa leu no período (livros concluídos). É a métrica do the explorer.",
  },
  {
    id: "generos",
    nome: "Gêneros explorados",
    escopo: "individual",
    unidade: (n) => (n === 1 ? "gênero" : "gêneros diferentes"),
    metodo: "Quantos gêneros diferentes aparecem nos livros concluídos no período (só livros com gênero informado).",
  },
  {
    id: "constancia",
    nome: "Constância de leitura",
    escopo: "individual",
    unidade: (n) => (n === 1 ? "mês" : "meses"),
    metodo: "Meses do período com pelo menos um livro concluído. No histórico, a maior sequência de meses seguidos. Não depende de abrir o app todo dia.",
  },
  {
    id: "indicacoes",
    nome: "Melhores indicações",
    escopo: "clube",
    unidade: () => "de média",
    metodo: "Só neste clube. A nota de cada livro é a média das fichas do clube (livros com pelo menos 2 notas); a média de quem indicou dá o mesmo peso a cada livro. Com menos de 2 indicações avaliadas, o resultado é provisório. Livros do histórico sem registro de quem indicou não entram. O período segue o encerramento da leitura.",
  },
  {
    id: "coletivas",
    nome: "Leituras coletivas concluídas",
    escopo: "clube",
    unidade: (n) => (n === 1 ? "leitura" : "leituras"),
    metodo: "Só neste clube. Cada membro tem a própria conclusão (marcou \"concluí\" ou publicou a ficha); a leitura ser encerrada pela moderação não conta como conclusão de ninguém.",
  },
  {
    id: "prazo",
    nome: "Leituras concluídas no prazo",
    escopo: "clube",
    unidade: (n) => (n === 1 ? "leitura" : "leituras"),
    metodo: "Só neste clube e só leituras com prazo, encerradas depois que a pessoa entrou (ou que ela concluiu). Conta as concluídas até o fim do dia do prazo.",
  },
];

export type Linha = { m: Membro; valor: number | null; detalhe?: string; provisorio?: boolean; posicao: number };

const fimDoDia = (dia: string) => `${dia.slice(0, 10)}T23:59:59.999Z`;
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

/** pessoais: a estante pública de cada membro (null = indisponível ou privada) */
export type Dados = { membros: Membro[]; livros: LivroDoClube[]; fichas: Ficha[]; progresso: Progresso[]; pessoais?: Map<string, LivroSalvo[] | null> };

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

const mensal = (p: Periodo) => p.id.length === 7;

/** os livros concluídos de uma pessoa no período (só-ano não entra nos meses), sem repetir o mesmo livro */
function concluidosPessoais(ls: LivroSalvo[], p: Periodo) {
  const vistos = new Set<string>();
  return ls.filter((l) => {
    if (l.status !== "lido" || !dentro(l.lidoEm, p) || (l.lidoSoAno && mensal(p))) return false;
    const k = `${l.titulo.toLowerCase().trim()}|${(l.autor ?? "").toLowerCase().trim()}`;
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

export function classificacao(d: Dados, cat: Categoria, p: Periodo): Linha[] {
  const conc = conclusoes(d);
  const info = CATEGORIAS.find((c) => c.id === cat)!;
  if (info.escopo === "individual") {
    return classificar(
      d.membros.map((m) => {
        const ls = d.pessoais?.get(m.usuario_id);
        if (!ls) return { m, valor: null, detalhe: "estante indisponível" };
        const lidos = concluidosPessoais(ls, p);
        if (cat === "paginas") return { m, valor: lidos.reduce((t, l) => t + (l.paginas ?? 0), 0) };
        if (cat === "livros") return { m, valor: lidos.length };
        if (cat === "resenhas") return { m, valor: ls.filter((l) => l.resenha?.trim() && dentro(l.fichaEm ?? l.lidoEm, p)).length };
        if (cat === "autores") return { m, valor: new Set(lidos.map((l) => (l.autor ?? "").toLowerCase().trim()).filter(Boolean)).size };
        if (cat === "generos") return { m, valor: new Set(lidos.map((l) => (l as { genero?: string }).genero?.toLowerCase().trim()).filter(Boolean)).size };
        // constância: meses com leitura concluída; no histórico, a maior sequência de meses seguidos
        const meses = [...new Set(lidos.filter((l) => !l.lidoSoAno).map((l) => l.lidoEm!.slice(0, 7)))].sort();
        if (p.id !== "geral") return { m, valor: meses.length };
        let melhor = 0;
        let atual = 0;
        let antes = "";
        for (const mm of meses) {
          const [a, b] = antes.split("-").map(Number);
          const seguido = antes && (Number(mm.slice(0, 4)) * 12 + Number(mm.slice(5, 7))) - (a * 12 + b) === 1;
          atual = seguido ? atual + 1 : 1;
          melhor = Math.max(melhor, atual);
          antes = mm;
        }
        return { m, valor: melhor, detalhe: meses.length ? `${meses.length} meses com leitura no total` : undefined };
      }),
    );
  }
  if (cat === "coletivas") {
    return classificar(
      d.membros.map((m) => ({ m, valor: [...(conc.get(m.usuario_id) ?? new Map()).values()].filter((data) => dentro(data, p)).length })),
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
  return [];
}

// ───────── distinções ─────────

export type TipoDistincao = "page-turner" | "critic" | "explorer" | "curator" | "constant";
export const DISTINCOES: { id: TipoDistincao; nome: string; categoria: Categoria; descricao: string }[] = [
  { id: "page-turner", nome: "the page turner.", categoria: "paginas", descricao: "mais páginas lidas" },
  { id: "critic", nome: "the critic.", categoria: "resenhas", descricao: "mais resenhas publicadas" },
  { id: "explorer", nome: "the explorer.", categoria: "autores", descricao: "mais autores diferentes" },
  { id: "curator", nome: "the curator.", categoria: "indicacoes", descricao: "melhores indicações ao clube" },
  { id: "constant", nome: "the constant reader.", categoria: "constancia", descricao: "mais meses com leitura" },
];

/** quem leva cada distinção num período (empate: todas as pessoas; tudo zero ou provisório: ninguém) */
export function distincoes(d: Dados, p: Periodo) {
  return DISTINCOES.map((x) => {
    const linhas = classificacao(d, x.categoria, p).filter((l) => l.posicao === 1 && !l.provisorio && (l.valor ?? 0) > 0);
    // constância só vale a partir de 2 meses
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
