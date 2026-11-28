/**
 * Caderno de leitura — dados e paginação (puro, sem React).
 *
 * Tudo vem da estante (perfil-store): leituras concluídas (com releituras
 * legítimas como entradas próprias), resenhas e citações da Marginalia.
 * Nada é inventado: sem data, sem nota ou sem texto, o campo fica em branco.
 * As folhas têm capacidade fixa (formato A5), então a mesma paginação vale
 * no computador (duas folhas lado a lado) e no celular (uma por vez).
 */
import type { FormatoLivro, LivroSalvo } from "@/lib/perfil-store";

export const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
export const FORMATO_NOME: Record<FormatoLivro, string> = { fisico: "Físico", ebook: "E-book", audio: "Audiolivro" };

/** uma leitura concluída: o livro + a execução (a atual ou uma releitura guardada) */
export type Leitura = {
  chave: string;
  livro: LivroSalvo;
  numero: number;
  iniciadoEm?: string;
  lidoEm?: string;
  soAno?: boolean;
  soMes?: boolean;
  nota?: number;
  formato?: FormatoLivro;
  releitura: boolean;
};

export type Secao = "rosto" | "indice" | "ano" | "registro" | "resenhas" | "favoritos" | "proximas" | "notas";
export const SECOES: { id: Exclude<Secao, "rosto" | "indice">; nome: string }[] = [
  { id: "ano", nome: "Meu ano em livros" },
  { id: "registro", nome: "Registro de leituras" },
  { id: "resenhas", nome: "Resenhas" },
  { id: "favoritos", nome: "Favoritos do mês" },
  { id: "proximas", nome: "Próximas leituras" },
  { id: "notas", nome: "Citações e anotações" },
];

export type Nota = { chave: string; livro: LivroSalvo; tipo: "citação" | "trecho" | "anotação"; texto: string; pagina?: number; capitulo?: string; comentario?: string; spoiler?: boolean };

export type Folha =
  | { secao: "rosto" }
  | { secao: "indice" }
  | { secao: "ano"; leituras: Leitura[]; primeira: boolean }
  | { secao: "registro"; leituras: Leitura[]; primeira: boolean }
  | { secao: "resenhas"; leituras: Leitura[]; primeira: boolean; continua?: { chave: string; de: number; ate?: number } }
  | { secao: "favoritos"; meses: number[]; primeira: boolean }
  | { secao: "proximas"; livros: LivroSalvo[]; primeira: boolean }
  | { secao: "notas"; notas: Nota[]; primeira: boolean };

/** capacidades por folha (A5, com cabeçalho na primeira folha da seção) */
export const CAPACIDADE = { ano: 25, anoPrimeira: 20, registro: 10, registroPrimeira: 8, proximas: 9, proximasPrimeira: 6, resenhaChars: 1500, notasChars: 1100 };

function dataLeitura(lidoEm: string | undefined) {
  return lidoEm ? lidoEm.slice(0, 10) : "";
}

/** as leituras concluídas num ano, em ordem cronológica, numeradas (#1, #2…) */
export function leiturasDoAno(livros: LivroSalvo[], ano: string): Leitura[] {
  const todas: Omit<Leitura, "numero">[] = [];
  for (const l of livros) {
    for (const [i, r] of (l.releituras ?? []).entries()) {
      if (r.lidoEm?.startsWith(ano)) todas.push({ chave: `${l.id}#r${i}`, livro: l, iniciadoEm: r.iniciadoEm, lidoEm: r.lidoEm, soAno: r.lidoSoAno, soMes: r.lidoSoMes, nota: r.nota, formato: r.formato, releitura: false });
    }
    if (l.status === "lido" && l.lidoEm?.startsWith(ano)) {
      todas.push({ chave: l.id, livro: l, iniciadoEm: l.iniciadoEm, lidoEm: l.lidoEm, soAno: l.lidoSoAno, soMes: l.lidoSoMes, nota: l.nota, formato: l.formato, releitura: (l.releituras?.length ?? 0) > 0 });
    }
  }
  // datas só com ano vão para o fim do ano; só com mês, para o fim do mês
  const ordem = (x: Omit<Leitura, "numero">) => (x.soAno ? `${ano}-12-32` : x.soMes ? `${dataLeitura(x.lidoEm).slice(0, 7)}-32` : dataLeitura(x.lidoEm));
  return todas.sort((a, b) => ordem(a).localeCompare(ordem(b))).map((x, i) => ({ ...x, numero: i + 1 }));
}

/** anos com alguma leitura registrada (mais o atual), do mais recente ao mais antigo */
export function anosDoCaderno(livros: LivroSalvo[]): string[] {
  const s = new Set<string>([String(new Date().getFullYear())]);
  for (const l of livros) {
    if (l.status === "lido" && l.lidoEm) s.add(l.lidoEm.slice(0, 4));
    for (const r of l.releituras ?? []) if (r.lidoEm) s.add(r.lidoEm.slice(0, 4));
  }
  return [...s].sort().reverse();
}

export function notasDoAno(livros: LivroSalvo[], leituras: Leitura[]): Nota[] {
  const ids = new Set(leituras.map((l) => l.livro.id));
  const out: Nota[] = [];
  for (const l of livros) {
    if (!ids.has(l.id)) continue;
    if (l.citacao?.trim()) out.push({ chave: `${l.id}:c`, livro: l, tipo: "citação", texto: l.citacao.trim() });
    for (const [i, t] of (l.trechos ?? []).entries()) if (t.texto?.trim()) out.push({ chave: `${l.id}:t${i}`, livro: l, tipo: "trecho", texto: t.texto.trim(), pagina: t.pagina, capitulo: t.capitulo, comentario: t.nota, spoiler: (t as { spoiler?: boolean }).spoiler });
    if (l.anotacao?.trim()) out.push({ chave: `${l.id}:a`, livro: l, tipo: "anotação", texto: l.anotacao.trim() });
  }
  return out;
}

function fatiar<T>(lista: T[], primeira: number, demais: number): T[][] {
  if (!lista.length) return [[]];
  const out: T[][] = [lista.slice(0, primeira)];
  for (let i = primeira; i < lista.length; i += demais) out.push(lista.slice(i, i + demais));
  return out;
}

/** por tamanho de texto (resenhas, notas): enche a folha até a capacidade */
function porTexto<T>(lista: T[], tamanho: (x: T) => number, limite: number, primeiraLimite: number): T[][] {
  if (!lista.length) return [[]];
  const out: T[][] = [[]];
  let usado = 0;
  for (const x of lista) {
    const t = tamanho(x);
    const cap = out.length === 1 ? primeiraLimite : limite;
    if (out[out.length - 1].length && usado + t > cap) {
      out.push([]);
      usado = 0;
    }
    out[out.length - 1].push(x);
    usado += t;
  }
  return out;
}

export type DadosCaderno = { leituras: Leitura[]; notas: Nota[]; proximas: LivroSalvo[] };

/** todas as folhas do caderno de um ano, já paginadas */
export function montarFolhas(d: DadosCaderno): Folha[] {
  const f: Folha[] = [{ secao: "rosto" }, { secao: "indice" }];
  fatiar(d.leituras, CAPACIDADE.anoPrimeira, CAPACIDADE.ano).forEach((leituras, i) => f.push({ secao: "ano", leituras, primeira: i === 0 }));
  fatiar(d.leituras, CAPACIDADE.registroPrimeira, CAPACIDADE.registro).forEach((leituras, i) => f.push({ secao: "registro", leituras, primeira: i === 0 }));
  const comResenha = d.leituras.filter((l) => l.livro.resenha?.trim() && !l.chave.includes("#r"));
  // resenha muito longa ocupa a folha inteira e continua na próxima
  const blocos: { l: Leitura; de: number; ate?: number }[] = [];
  for (const l of comResenha) {
    const t = l.livro.resenha!.trim();
    if (t.length <= CAPACIDADE.resenhaChars) blocos.push({ l, de: 0 });
    else for (let de = 0; de < t.length; de += CAPACIDADE.resenhaChars) blocos.push({ l, de, ate: Math.min(t.length, de + CAPACIDADE.resenhaChars) });
  }
  porTexto(blocos, (b) => (b.ate ?? b.l.livro.resenha!.trim().length) - b.de + 260, CAPACIDADE.resenhaChars + 300, CAPACIDADE.resenhaChars).forEach((grupo, i) => {
    const corte = grupo.find((b) => b.ate !== undefined);
    f.push({ secao: "resenhas", leituras: grupo.map((b) => b.l), primeira: i === 0, continua: corte ? { chave: corte.l.chave, de: corte.de, ate: corte.ate } : undefined });
  });
  f.push({ secao: "favoritos", meses: [0, 1, 2, 3, 4, 5], primeira: true }, { secao: "favoritos", meses: [6, 7, 8, 9, 10, 11], primeira: false });
  fatiar(d.proximas, CAPACIDADE.proximasPrimeira, CAPACIDADE.proximas).forEach((livros, i) => f.push({ secao: "proximas", livros, primeira: i === 0 }));
  porTexto(d.notas, (n) => n.texto.length + 160, CAPACIDADE.notasChars, CAPACIDADE.notasChars - 150).forEach((notas, i) => f.push({ secao: "notas", notas, primeira: i === 0 }));
  return f;
}

/** página (1-based) em que cada seção começa — o índice segue a paginação real */
export function inicioDasSecoes(folhas: Folha[]): Record<string, number> {
  const out: Record<string, number> = {};
  folhas.forEach((x, i) => {
    if (!(x.secao in out)) out[x.secao] = i + 1;
  });
  return out;
}

/** sugestão de favorito do mês: a leitura mais bem avaliada (só sugestão, nunca escolha) */
export function sugestaoDoMes(leituras: Leitura[], mes: number): Leitura | undefined {
  return leiturasDoMes(leituras, mes)
    .filter((l) => (l.nota ?? 0) > 0)
    .sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0))[0];
}

export function leiturasDoMes(leituras: Leitura[], mes: number): Leitura[] {
  return leituras.filter((l) => !l.soAno && l.lidoEm && Number(l.lidoEm.slice(5, 7)) === mes + 1);
}

/** data curta para as fichas (dd/mm/aaaa, mm/aaaa ou aaaa, conforme o que a pessoa informou) */
export function dataCurta(iso?: string, soAno?: boolean, soMes?: boolean) {
  if (!iso) return "";
  if (soAno) return iso.slice(0, 4);
  if (soMes) return `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/* ───────── personalização (salva no perfil, sincroniza entre aparelhos) ───────── */

export type CapaCaderno = { id: string; nome: string; fundo: string; tinta: string; padrao?: "xadrez" | "listras" | "estrelas" | "poas" };
export const CAPAS: CapaCaderno[] = [
  { id: "bordo", nome: "Bordô", fundo: "#692536", tinta: "#F6F0E5" },
  { id: "rosa", nome: "Rosa", fundo: "#ECAABB", tinta: "#38252C" },
  { id: "azul", nome: "Azul vintage", fundo: "#8297D1", tinta: "#1F2340" },
  { id: "verde", nome: "Verde", fundo: "#59634F", tinta: "#F6F0E5" },
  { id: "ameixa", nome: "Ameixa", fundo: "#38252C", tinta: "#F1DFA0" },
  { id: "bordo-estrelas", nome: "Bordô estrelado", fundo: "#692536", tinta: "#F6F0E5", padrao: "estrelas" },
  { id: "rosa-xadrez", nome: "Xadrez rosa", fundo: "#ECAABB", tinta: "#38252C", padrao: "xadrez" },
  { id: "azul-listras", nome: "Listras azuis", fundo: "#8297D1", tinta: "#1F2340", padrao: "listras" },
];

export type Papel = "liso" | "pontilhado" | "quadriculado" | "pautado" | "xadrez";
export const PAPEIS: { id: Papel; nome: string }[] = [
  { id: "liso", nome: "Liso" },
  { id: "pontilhado", nome: "Pontilhado" },
  { id: "quadriculado", nome: "Quadriculado" },
  { id: "pautado", nome: "Pautado" },
  { id: "xadrez", nome: "Xadrez delicado" },
];

/** papel padrão de cada seção (como num journal de verdade, cada parte tem o seu) */
export const PAPEL_PADRAO: Record<Secao, Papel> = { rosto: "liso", indice: "pautado", ano: "pontilhado", registro: "liso", resenhas: "pautado", favoritos: "liso", proximas: "pontilhado", notas: "quadriculado" };

export type PreferenciasCaderno = {
  nome?: string;
  capa?: string;
  fita?: boolean;
  papeis?: Partial<Record<Secao, Papel>>;
  /** "2026-03" → id do livro escolhido como favorito do mês */
  favoritos?: Record<string, string>;
  /** livros escolhidos para próximas leituras, na ordem de prioridade (ids da estante) */
  prioridades?: string[];
};
