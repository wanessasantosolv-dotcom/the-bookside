/**
 * The Bookside Journal — a revista mensal de cada leitora.
 *
 * Tudo aqui é cálculo (sem tela): quais livros entram numa edição, os
 * números do mês, os extremos, o ritmo, os gêneros, a autoria, as margens
 * e os textos editoriais por regras (a IA, quando existe, só reescreve os
 * textos a partir destes números — nunca calcula nada).
 *
 * Os meses seguem o fuso do aparelho (datas locais).
 */
import { autoresDoLivro, chaveDia } from "@/lib/jornada";
import type { GeneroAutoria, Pais } from "@/lib/nacionalidade";
import { generoDoLivro, mesDoReview } from "@/lib/numeros";
import type {
  EdicaoSalva,
  LivroDaEdicao,
  LivroSalvo,
  TextosEdicao,
} from "@/lib/perfil-store";

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
export const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

// ───────── a edição: chave, volume, estado ─────────

export const chaveDoMes = (ano: number, mes: number) =>
  `${ano}-${String(mes + 1).padStart(2, "0")}`;

export function lerChave(chave: string) {
  const m = chave.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const ano = Number(m[1]);
  const mes = Number(m[2]) - 1;
  if (mes < 0 || mes > 11) return null;
  return { ano, mes, nome: MESES[mes], vol: mes + 1 };
}

const chaveLocal = (iso?: string) => (iso ? chaveDia(new Date(iso)) : undefined);
const mesDe = (iso?: string) => chaveLocal(iso)?.slice(0, 7);

/**
 * O estado de uma edição:
 * - "fechada": o mês já acabou (pode ser colecionada);
 * - "previa": é o mês atual e já estamos na janela da revista (do penúltimo
 *   dia em diante) — ainda podem entrar leituras;
 * - "futura": ainda não é hora.
 */
export function estadoDaEdicao(chave: string, hoje = new Date()) {
  const e = lerChave(chave);
  if (!e) return "futura" as const;
  const atual = chaveDoMes(hoje.getFullYear(), hoje.getMonth());
  if (chave < atual) return "fechada" as const;
  if (chave > atual) return "futura" as const;
  const ultimo = new Date(e.ano, e.mes + 1, 0).getDate();
  return hoje.getDate() >= ultimo - 1 ? ("previa" as const) : ("futura" as const);
}

/** a edição em destaque na Jornada agora (penúltimo dia do mês até o dia 5 do seguinte) */
export function edicaoEmDestaque(hoje = new Date()) {
  const r = mesDoReview(hoje);
  return r ? chaveDoMes(r.ano, r.mes) : null;
}

// ───────── quais livros entram ─────────

/**
 * Os livros de um mês: os concluídos nele (contando releituras: cada leitura
 * terminada no mês entra com a sua nota) e os que estiveram em andamento.
 */
export function livrosDoMes(livros: LivroSalvo[], chave: string): LivroDaEdicao[] {
  const e = lerChave(chave);
  if (!e) return [];
  const inicioMes = `${chave}-01`;
  const fimMes = `${chave}-${String(new Date(e.ano, e.mes + 1, 0).getDate()).padStart(2, "0")}`;
  const saida: LivroDaEdicao[] = [];
  for (const l of livros) {
    const base = {
      id: l.id,
      titulo: l.titulo,
      autor: l.autor,
      capa: l.capa,
      genero: generoDoLivro(l),
      paginas: l.paginas,
    };
    const sessoes = (l.sessoes ?? []).filter((s) => mesDe(s.em) === chave);
    // leituras anteriores (releituras) terminadas no mês
    for (const r of l.releituras ?? [])
      if (mesDe(r.lidoEm) === chave)
        saida.push({
          ...base,
          nota: r.nota,
          iniciadoEm: r.iniciadoEm,
          lidoEm: r.lidoEm,
          formato: r.formato,
          concluido: true,
        });
    if (l.status === "lido" && mesDe(l.lidoEm) === chave) {
      saida.push({
        ...base,
        nota: l.nota,
        iniciadoEm: l.iniciadoEm,
        lidoEm: l.lidoEm,
        formato: l.formato,
        concluido: true,
        ...(sessoes.length ? { sessoes } : {}),
      });
      continue;
    }
    // em andamento no mês: começou até o fim do mês e não terminou antes dele
    const ini = chaveLocal(l.iniciadoEm);
    const andando =
      (l.status === "lendo" || l.status === "pausado" || l.status === "abandonado" ||
        (l.status === "lido" && (chaveLocal(l.lidoEm) ?? "") > fimMes)) &&
      !!ini &&
      ini <= fimMes &&
      (l.status !== "lido" || (chaveLocal(l.lidoEm) ?? "") >= inicioMes);
    if (andando || sessoes.length)
      saida.push({
        ...base,
        iniciadoEm: l.iniciadoEm,
        formato: l.formato,
        concluido: false,
        paginaAtual: l.paginaAtual,
        ...(sessoes.length ? { sessoes } : {}),
      });
  }
  return saida;
}

/** um texto curto que muda quando os registros do mês mudam */
export function assinaturaDe(livros: LivroDaEdicao[]) {
  const texto = livros
    .map((l) =>
      [l.id, l.concluido ? 1 : 0, l.nota ?? "", l.lidoEm?.slice(0, 10) ?? "", l.iniciadoEm?.slice(0, 10) ?? "", l.paginas ?? "", l.capa ?? ""].join(":"),
    )
    .sort()
    .join("|");
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) | 0;
  return `${livros.length}-${(h >>> 0).toString(36)}`;
}

/** os meses que têm alguma leitura (concluída ou em andamento) até hoje */
export function mesesComLeitura(livros: LivroSalvo[], hoje = new Date()) {
  const meses = new Set<string>();
  const atual = chaveDoMes(hoje.getFullYear(), hoje.getMonth());
  for (const l of livros) {
    for (const r of l.releituras ?? []) {
      const m = mesDe(r.lidoEm);
      if (m) meses.add(m);
    }
    if (l.status === "lido" && l.lidoEm) meses.add(mesDe(l.lidoEm)!);
    const ini = l.iniciadoEm ? new Date(l.iniciadoEm) : null;
    const fim = l.status === "lido" ? (l.lidoEm ? new Date(l.lidoEm) : null) : l.status === "lendo" ? hoje : null;
    if (ini && fim)
      for (let d = new Date(ini.getFullYear(), ini.getMonth(), 1); d <= fim; d.setMonth(d.getMonth() + 1))
        meses.add(chaveDoMes(d.getFullYear(), d.getMonth()));
  }
  return [...meses].filter((m) => m <= atual && estadoDaEdicao(m, hoje) !== "futura").sort().reverse();
}

// ───────── números, extremos, ritmo ─────────

const diasEntre = (a?: string, b?: string) => {
  if (!a || !b) return null;
  const [x, y] = [chaveLocal(a)!, chaveLocal(b)!].map((k) => {
    const [ano, m, d] = k.split("-").map(Number);
    return Date.UTC(ano, m - 1, d);
  });
  const n = Math.round((y - x) / 864e5) + 1;
  return n >= 1 ? n : null;
};
const media = (ns: number[]) => (ns.length ? ns.reduce((t, n) => t + n, 0) / ns.length : null);

export type Extremo = {
  id: "menos" | "rapido" | "demorado" | "maior" | "menor";
  rotulo: string;
  livros: LivroDaEdicao[];
  valor: string;
};

export type DiaDoMes = { dia: number; chave: string; leitura: boolean; paginas: number | null };

export type Edicao = ReturnType<typeof montarEdicao>;

export function montarEdicao(
  chave: string,
  doMes: LivroDaEdicao[],
  contexto: {
    /** todos os livros (para comparar com o mês anterior e achar autorias novas) */
    todos: LivroSalvo[];
    generoDe?: (l: { id: string; genero?: string }) => string | undefined;
    paises?: Record<string, Pais | null> | null;
    generosAutoria?: Record<string, GeneroAutoria | null> | null;
    hoje?: Date;
  },
) {
  const e = lerChave(chave)!;
  const hoje = contexto.hoje ?? new Date();
  const concluidos = doMes
    .filter((l) => l.concluido)
    .sort((a, b) => (a.lidoEm ?? "").localeCompare(b.lidoEm ?? ""));
  const andamento = doMes.filter((l) => !l.concluido);
  const comPaginas = concluidos.filter((l) => l.paginas);
  const paginas = comPaginas.reduce((t, l) => t + (l.paginas ?? 0), 0);
  const notas = concluidos.map((l) => l.nota).filter((n): n is number => !!n);
  const mediaNotas = media(notas);
  const tempos = concluidos.map((l) => diasEntre(l.iniciadoEm, l.lidoEm)).filter((n): n is number => n !== null);
  const tempoMedio = media(tempos);

  // ritmo: os dias do mês com livro aberto (até hoje, se o mês é o atual)
  const ultimoDia = new Date(e.ano, e.mes + 1, 0).getDate();
  const ateDia = chave === chaveDoMes(hoje.getFullYear(), hoje.getMonth()) ? hoje.getDate() : ultimoDia;
  const leituras = doMes
    .map((l) => ({
      ini: chaveLocal(l.iniciadoEm) ?? chaveLocal(l.lidoEm),
      fim: l.concluido ? chaveLocal(l.lidoEm) : chaveDia(hoje),
    }))
    .filter((x): x is { ini: string; fim: string } => !!x.ini && !!x.fim);
  const paginasPorDia = new Map<string, number>();
  for (const l of doMes)
    for (const s of l.sessoes ?? [])
      if (s.paginas) {
        const k = chaveLocal(s.em)!;
        paginasPorDia.set(k, (paginasPorDia.get(k) ?? 0) + s.paginas);
      }
  const dias: DiaDoMes[] = Array.from({ length: ultimoDia }, (_, i) => {
    const k = `${chave}-${String(i + 1).padStart(2, "0")}`;
    return {
      dia: i + 1,
      chave: k,
      leitura: i + 1 <= ateDia && leituras.some((x) => x.ini <= k && x.fim >= k),
      paginas: paginasPorDia.get(k) ?? null,
    };
  });
  const diasLeitura = dias.filter((d) => d.leitura).length;
  let sequencia = 0;
  let atualSeq = 0;
  for (const d of dias) {
    atualSeq = d.leitura ? atualSeq + 1 : 0;
    sequencia = Math.max(sequencia, atualSeq);
  }
  // semanas do mês (1–7, 8–14, 15–21, 22–28, 29+)
  const semanas = [0, 1, 2, 3, 4].map((s) => dias.slice(s * 7, s * 7 + 7).filter((d) => d.leitura).length);
  const maxSemana = Math.max(...semanas);
  const semanaForte =
    diasLeitura >= 6 && semanas.filter((x) => x === maxSemana).length === 1 ? semanas.indexOf(maxSemana) : null;
  // só tira conclusões sobre ritmo quando a maioria das leituras tem data de início
  const ritmoConfiavel = doMes.length > 0 && doMes.filter((l) => l.iniciadoEm).length >= Math.ceil(doMes.length * 0.6);

  // comparação com o mês anterior
  const anterior = chaveDoMes(e.mes ? e.ano : e.ano - 1, e.mes ? e.mes - 1 : 11);
  const doAnterior = livrosDoMes(contexto.todos, anterior).filter((l) => l.concluido);
  const notasAnt = doAnterior.map((l) => l.nota).filter((n): n is number => !!n);
  const comparacao = doAnterior.length || concluidos.length
    ? {
        mes: MESES[lerChave(anterior)!.mes],
        livros: concluidos.length - doAnterior.length,
        media: mediaNotas !== null && notasAnt.length ? mediaNotas - media(notasAnt)! : null,
        temDados: doAnterior.length > 0,
      }
    : null;

  // o mês com mais dias de leitura no ano?
  const melhorDoAno = (() => {
    if (!ritmoConfiavel || !diasLeitura) return false;
    for (let m = 0; m < 12; m++) {
      const k = chaveDoMes(e.ano, m);
      if (k === chave || k > chaveDoMes(hoje.getFullYear(), hoje.getMonth())) continue;
      const outros = montarDias(livrosDoMes(contexto.todos, k), k, hoje);
      if (outros >= diasLeitura) return false;
    }
    return true;
  })();

  // a história do mês (com empate) e os extremos
  const maxNota = notas.length ? Math.max(...notas) : null;
  const favoritos = maxNota ? concluidos.filter((l) => l.nota === maxNota) : concluidos.slice(-1);
  const extremos: Extremo[] = [];
  const nota1 = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (notas.length >= 2) {
    const min = Math.min(...notas);
    if (min < maxNota!)
      extremos.push({ id: "menos", rotulo: "a menos amada", livros: concluidos.filter((l) => l.nota === min), valor: `${nota1(min)} ★` });
  }
  const comTempo = concluidos.map((l) => ({ l, d: diasEntre(l.iniciadoEm, l.lidoEm) })).filter((x): x is { l: LivroDaEdicao; d: number } => x.d !== null);
  if (comTempo.length >= 2) {
    const r = Math.min(...comTempo.map((x) => x.d));
    const d = Math.max(...comTempo.map((x) => x.d));
    if (d > r) {
      extremos.push({ id: "rapido", rotulo: "a mais rápida", livros: comTempo.filter((x) => x.d === r).map((x) => x.l), valor: r === 1 ? "1 dia" : `${r} dias` });
      extremos.push({ id: "demorado", rotulo: "a mais demorada", livros: comTempo.filter((x) => x.d === d).map((x) => x.l), valor: `${d} dias` });
    }
  }
  if (comPaginas.length >= 3) {
    const ps = comPaginas.map((l) => l.paginas!);
    const ma = Math.max(...ps);
    const me = Math.min(...ps);
    if (ma > me) {
      extremos.push({ id: "maior", rotulo: "a mais longa", livros: comPaginas.filter((l) => l.paginas === ma), valor: `${ma.toLocaleString("pt-BR")} páginas` });
      extremos.push({ id: "menor", rotulo: "a mais curta", livros: comPaginas.filter((l) => l.paginas === me), valor: `${me.toLocaleString("pt-BR")} páginas` });
    }
  }

  // gêneros (cada livro tem um gênero; quem não tem fica de fora)
  const generoDe = contexto.generoDe ?? ((l: { genero?: string }) => l.genero);
  const porGenero = new Map<string, LivroDaEdicao[]>();
  for (const l of concluidos) {
    const g = generoDe(l)?.toLowerCase();
    if (g) porGenero.set(g, [...(porGenero.get(g) ?? []), l]);
  }
  const comGenero = [...porGenero.values()].reduce((t, ls) => t + ls.length, 0);
  const generos = [...porGenero.entries()]
    .map(([nome, ls]) => ({ nome, qtd: ls.length, parte: comGenero ? ls.length / comGenero : 0, livros: ls }))
    .sort((a, b) => b.qtd - a.qtd);

  // autoria: quem escreveu, primeira vez ou de volta, gênero declarado e país
  const antes = new Set<string>();
  for (const l of contexto.todos) {
    const leituras = [
      ...(l.releituras ?? []).map((r) => r.lidoEm),
      l.status === "lido" ? l.lidoEm : undefined,
    ];
    if (leituras.some((d) => d && (mesDe(d) ?? "") < chave))
      for (const a of autoresDoLivro(l.autor)) antes.add(a.toLowerCase());
  }
  const porAutor = new Map<string, { nome: string; livros: LivroDaEdicao[] }>();
  for (const l of concluidos)
    for (const nome of autoresDoLivro(l.autor)) {
      const k = nome.toLowerCase();
      const x = porAutor.get(k) ?? { nome, livros: [] };
      x.livros.push(l);
      porAutor.set(k, x);
    }
  const autores = [...porAutor.values()]
    .map((a) => ({
      ...a,
      novo: !antes.has(a.nome.toLowerCase()),
      pais: contexto.paises?.[a.nome.toLowerCase()] ?? null,
      genero: contexto.generosAutoria?.[a.nome.toLowerCase()] ?? null,
    }))
    .sort((a, b) => b.livros.length - a.livros.length);
  const conhecidos = contexto.generosAutoria !== undefined && contexto.generosAutoria !== null;
  const autoria = conhecidos
    ? (() => {
        const conta = { feminina: 0, masculina: 0, outras: 0, desconhecida: 0 };
        for (const l of concluidos) {
          const gs = autoresDoLivro(l.autor).map((a) => contexto.generosAutoria![a.toLowerCase()]);
          if (!gs.length || gs.some((g) => !g)) conta.desconhecida++;
          else if (gs.every((g) => g === "feminina")) conta.feminina++;
          else if (gs.every((g) => g === "masculina")) conta.masculina++;
          else conta.outras++;
        }
        return conta;
      })()
    : null;
  const paises = new Map<string, { pais: Pais; qtd: number }>();
  for (const l of concluidos) {
    const p = contexto.paises?.[l.autor.toLowerCase()];
    if (p) paises.set(p.nome, { pais: p, qtd: (paises.get(p.nome)?.qtd ?? 0) + 1 });
  }

  return {
    chave,
    ...e,
    concluidos,
    andamento,
    numeros: {
      livros: concluidos.length,
      paginas,
      paginasConhecidas: comPaginas.length,
      media: mediaNotas,
      diasLeitura,
      paginasPorLivro: comPaginas.length ? Math.round(paginas / comPaginas.length) : null,
      tempoMedio: tempoMedio !== null ? Math.round(tempoMedio) : null,
      paginasRegistradas: [...paginasPorDia.values()].reduce((t, n) => t + n, 0) || null,
    },
    comparacao,
    favoritos,
    extremos,
    ritmo: { dias, diasLeitura, sequencia, semanaForte, confiavel: ritmoConfiavel, melhorDoAno },
    generos,
    autores,
    autoria,
    paises: [...paises.values()].sort((a, b) => b.qtd - a.qtd),
  };
}

/** só os dias de leitura de um mês (para comparar meses sem montar a edição toda) */
function montarDias(doMes: LivroDaEdicao[], chave: string, hoje: Date) {
  const e = lerChave(chave)!;
  const ultimo = new Date(e.ano, e.mes + 1, 0).getDate();
  const leituras = doMes
    .map((l) => ({ ini: chaveLocal(l.iniciadoEm) ?? chaveLocal(l.lidoEm), fim: l.concluido ? chaveLocal(l.lidoEm) : chaveDia(hoje) }))
    .filter((x): x is { ini: string; fim: string } => !!x.ini && !!x.fim);
  let n = 0;
  for (let d = 1; d <= ultimo; d++) {
    const k = `${chave}-${String(d).padStart(2, "0")}`;
    if (leituras.some((x) => x.ini <= k && x.fim >= k)) n++;
  }
  return n;
}

// ───────── as margens (registros pessoais do mês) ─────────

export function margensDoMes(todos: LivroSalvo[], edicao: Edicao) {
  const ids = new Set(edicao.concluidos.map((l) => l.id));
  const trechos = todos.flatMap((l) =>
    (l.trechos ?? [])
      .filter((t) => (t.em && mesDe(t.em) === edicao.chave) || (!t.em && ids.has(l.id)))
      .map((t) => ({ texto: t.texto, pagina: t.pagina, livro: l })),
  );
  const resenhas = todos
    .filter((l) => ids.has(l.id) && l.resenha?.trim())
    .map((l) => ({ texto: l.resenha!.trim(), livro: l }));
  const anotacoes = todos
    .filter((l) => ids.has(l.id) && l.anotacao?.trim())
    .map((l) => ({ texto: l.anotacao!.trim(), livro: l }));
  const citacoes = todos
    .filter((l) => ids.has(l.id) && l.citacao?.trim())
    .map((l) => ({ texto: l.citacao!.trim(), livro: l }));
  return { trechos: [...citacoes.map((c) => ({ ...c, pagina: undefined })), ...trechos], resenhas, anotacoes };
}

// ───────── paleta da edição ─────────

/** uma paleta aprovada por mês (as mesmas cores dos temas do app) */
export const PALETAS = [
  { nome: "vinho", fundo: "#692536", texto: "#F7EEE6", destaque: "#E8B4BF", papel: "#F7EFE8" },
  { nome: "ameixa", fundo: "#2B1420", texto: "#F5EFE6", destaque: "#C9A46A", papel: "#F5EFE6" },
  { nome: "oliva", fundo: "#5E6553", texto: "#F3F1E7", destaque: "#D7DCC1", papel: "#F2F1E8" },
  { nome: "terracota", fundo: "#8E3E1E", texto: "#FBEFE6", destaque: "#F1D2C1", papel: "#F9EEE6" },
  { nome: "mar aberto", fundo: "#17524F", texto: "#EEF7F5", destaque: "#CDE6E3", papel: "#EEF5F3" },
  { nome: "lavanda", fundo: "#563F85", texto: "#F4F0FA", destaque: "#E3DAF0", papel: "#F3F0F8" },
  { nome: "mostarda", fundo: "#6E5106", texto: "#FBF5E2", destaque: "#F2E1A8", papel: "#FAF5E4" },
  { nome: "poesia", fundo: "#2B4C7E", texto: "#F0F4FA", destaque: "#CFDDEB", papel: "#EFF3F8" },
  { nome: "orelha rosa", fundo: "#9E3A57", texto: "#FDF0F3", destaque: "#F9D9E2", papel: "#FBF0F3" },
  { nome: "kraft", fundo: "#6E4520", texto: "#F8EFE3", destaque: "#D9C3A0", papel: "#F6EEE2" },
  { nome: "floresta", fundo: "#14211B", texto: "#E6EFE8", destaque: "#8FB89A", papel: "#EEF2EE" },
  { nome: "noite de tinta", fundo: "#29252A", texto: "#F5EFE6", destaque: "#A88B64", papel: "#F4EFE8" },
] as const;
export type Paleta = (typeof PALETAS)[number];

/** cada mês do ano tem a sua cor (a coleção do ano fica com 12 capas diferentes) */
export const paletaDoMes = (mes: number) => PALETAS[mes % PALETAS.length];

// ───────── textos editoriais por regras ─────────

const plural = (n: number, um: string, varios: string) => `${n.toLocaleString("pt-BR")} ${n === 1 ? um : varios}`;
const extensoMin = ["nenhum", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];
const numeroTexto = (n: number) => extensoMin[n] ?? n.toLocaleString("pt-BR");
const ordinalSemana = ["primeira", "segunda", "terceira", "quarta", "última"];

const MOODS: [RegExp, string][] = [
  [/fantasia|distopia|ficção científica/, "Um mês de outros mundos."],
  [/suspense|policial|terror/, "Entre mistérios e reviravoltas."],
  [/romance histórico|drama familiar|clássicos/, "Histórias que atravessam gerações."],
  [/literatura brasileira/, "Um mês de literatura brasileira."],
  [/romance/, "Entre afetos e descobertas."],
  [/poesia|contos/, "Pequenas formas, grandes histórias."],
  [/biografia|história|não ficção/, "Vidas e fatos em revista."],
];

/** os textos da edição, montados só com o que os dados mostram */
export function textosPorRegras(ed: Edicao): TextosEdicao {
  const n = ed.numeros;
  const mes = ed.nome;
  const g0 = ed.generos[0];
  const brasileiros = ed.paises.find((p) => p.pais.codigo === "BR");
  const mood =
    !n.livros
      ? "Um mês entre capítulos."
      : brasileiros && brasileiros.qtd >= Math.max(2, Math.ceil(n.livros / 2))
        ? "Um mês de literatura brasileira."
        : n.paginasPorLivro && n.paginasPorLivro < 200 && n.livros >= 2
          ? "Pequenos livros, grandes histórias."
          : (g0 && g0.parte >= 0.4 && MOODS.find(([re]) => re.test(g0.nome))?.[1]) ||
            (ed.generos.length >= 3 ? "Um mês de muitos territórios." : `${maiuscula(mes)}, página a página.`);

  const intro: string[] = [];
  if (n.livros) {
    intro.push(
      `Em ${mes}, você terminou ${plural(n.livros, "livro", "livros")}${n.paginasConhecidas ? ` — ${n.paginas.toLocaleString("pt-BR")} páginas no total` : ""}.`,
    );
    if (g0 && ed.generos.length > 1) intro.push(`${maiuscula(g0.nome)} apareceu mais do que qualquer outro gênero.`);
    else if (g0) intro.push(`Foi um mês de ${g0.nome}.`);
    const novos = ed.autores.filter((a) => a.novo);
    if (novos.length) intro.push(`${novos.length === 1 ? "Uma autoria nova chegou" : `${maiuscula(numeroTexto(novos.length))} autorias novas chegaram`} à sua estante.`);
    if (ed.comparacao?.temDados && ed.comparacao.livros)
      intro.push(
        ed.comparacao.livros > 0
          ? `${maiuscula(numeroTexto(ed.comparacao.livros))} a mais do que em ${ed.comparacao.mes}.`
          : `${maiuscula(numeroTexto(-ed.comparacao.livros))} a menos do que em ${ed.comparacao.mes}.`,
      );
  } else if (ed.andamento.length) {
    intro.push(
      `Nenhum livro chegou à última página em ${mes}, mas ${plural(ed.andamento.length, "leitura seguiu", "leituras seguiram")} abertas${n.diasLeitura ? ` em ${plural(n.diasLeitura, "dia", "dias")}` : ""}.`,
    );
  }

  let ritmo: string | undefined;
  if (ed.ritmo.confiavel && n.diasLeitura) {
    const partes = [`Você encontrou espaço para a leitura em ${plural(n.diasLeitura, "dia", "dias")} deste mês.`];
    if (ed.ritmo.semanaForte !== null)
      partes.push(`A ${ordinalSemana[ed.ritmo.semanaForte]} semana concentrou a maior parte das suas leituras.`);
    if (ed.ritmo.melhorDoAno) partes.push("Foi o seu mês com mais dias de leitura no ano.");
    ritmo = partes.join(" ");
  }

  const tendencias = ed.generos.length
    ? ed.generos.length === 1
      ? `Todas as leituras com gênero conhecido foram de ${ed.generos[0].nome}.`
      : `${ed.generos.slice(0, 3).map((g) => g.nome).join(", ").replace(/, ([^,]*)$/, " e $1")} dividiram o mês.`
    : undefined;

  const fecho: string[] = [];
  if (n.media !== null) fecho.push(`A média das suas notas ficou em ${n.media.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}.`);
  if (ed.favoritos.length === 1 && ed.favoritos[0].nota) fecho.push(`${ed.favoritos[0].titulo} foi a leitura mais bem avaliada.`);
  else if (ed.favoritos.length > 1 && ed.favoritos[0].nota) fecho.push(`${plural(ed.favoritos.length, "livro dividiu", "livros dividiram")} a nota mais alta.`);
  if (ed.paises.length >= 2) fecho.push(`As histórias vieram de ${plural(ed.paises.length, "país", "países")}.`);

  return {
    titulo: mood,
    introducao: intro.join(" ") || `${maiuscula(mes)} ainda não tem leituras registradas.`,
    ritmo,
    tendencias,
    encerramento: fecho.join(" ") || "Uma edição curta — mas toda edição conta.",
    fonte: "regras",
  };
}

/** o que vai para a IA: só números e nomes (nada de resenhas, trechos ou dados da pessoa) */
export function contextoParaIA(ed: Edicao) {
  return {
    mes: ed.nome,
    ano: ed.ano,
    livros: ed.numeros.livros,
    paginas: ed.numeros.paginasConhecidas ? ed.numeros.paginas : null,
    mediaNotas: ed.numeros.media !== null ? Number(ed.numeros.media.toFixed(1)) : null,
    diasDeLeitura: ed.ritmo.confiavel ? ed.numeros.diasLeitura : null,
    maiorSequencia: ed.ritmo.confiavel ? ed.ritmo.sequencia : null,
    semanaMaisForte: ed.ritmo.semanaForte !== null ? ordinalSemana[ed.ritmo.semanaForte] : null,
    mesComMaisDiasNoAno: ed.ritmo.melhorDoAno,
    tempoMedioDias: ed.numeros.tempoMedio,
    generos: ed.generos.slice(0, 5).map((g) => ({ nome: g.nome, livros: g.qtd })),
    autorias: ed.autores.slice(0, 6).map((a) => ({ nome: a.nome, livros: a.livros.length, primeiraVez: a.novo })),
    paises: ed.paises.slice(0, 5).map((p) => p.pais.nome),
    favorito: ed.favoritos[0] ? { titulo: ed.favoritos[0].titulo, autor: ed.favoritos[0].autor, nota: ed.favoritos[0].nota ?? null } : null,
    comparacaoMesAnterior: ed.comparacao?.temDados ? { mes: ed.comparacao.mes, diferencaLivros: ed.comparacao.livros } : null,
    emAndamento: ed.andamento.length,
  };
}

export const edicaoSalvaDe = (chave: string, livros: LivroDaEdicao[], textos?: TextosEdicao): EdicaoSalva => ({
  chave,
  finalizadaEm: new Date().toISOString(),
  assinatura: assinaturaDe(livros),
  livros,
  textos,
});
