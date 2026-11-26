import type { LeituraJunta, PessoaNaLeitura } from "@/lib/lerjunto";

export type Coread = LeituraJunta & { pessoas: PessoaNaLeitura[] };

export const totalDe = (l: Coread) => l.livro.paginas ?? 0;

export const pctDe = (p: Pick<PessoaNaLeitura, "pagina" | "terminou">, total: number) =>
  p.terminou ? 100 : total ? Math.max(0, Math.min(100, Math.round((p.pagina / total) * 100))) : 0;

/** quem aceitou o convite (convidadas ainda não contam) */
export const naLeitura = (l: Coread) => l.pessoas.filter((p) => (p.estado ?? "lendo") !== "convidada");
/** quem está lendo de fato: aceitou e não pausou */
export const ativas = (l: Coread) => naLeitura(l).filter((p) => p.estado !== "pausou");

/** todo mundo que aceitou terminou: a leitura acabou para o grupo */
export const concluidaPorTodas = (l: Coread) => {
  const n = naLeitura(l);
  return n.length > 0 && n.every((p) => p.terminou);
};
export const encerrada = (l: Coread) => !!l.encerrada_em || concluidaPorTodas(l);

/** até onde chegamos juntas: o menor progresso entre quem está lendo */
export function emComum(l: Coread) {
  const total = totalDe(l);
  const a = ativas(l);
  if (!a.length || !total) return null;
  const pagina = Math.min(...a.map((p) => (p.terminou ? total : p.pagina)));
  return { pagina, pct: Math.round((pagina / total) * 100) };
}

export type EstadoLeitora = "convidada" | "nao-comecou" | "lendo" | "pausou" | "concluiu";
export function estadoDe(p: PessoaNaLeitura): EstadoLeitora {
  if (p.estado === "convidada") return "convidada";
  if (p.terminou) return "concluiu";
  if (p.estado === "pausou") return "pausou";
  return p.pagina > 0 ? "lendo" : "nao-comecou";
}
export const ROTULO_ESTADO: Record<EstadoLeitora, string> = {
  convidada: "convite enviado",
  "nao-comecou": "ainda não começou",
  lendo: "lendo",
  pausou: "pausou",
  concluiu: "concluiu",
};

/** os trechos da linha do tempo: por porcentagem (o app não tem capítulos confiáveis) */
export const TRECHOS = [
  { de: 0, ate: 20, nome: "início" },
  { de: 20, ate: 40, nome: "20–40%" },
  { de: 40, ate: 60, nome: "metade" },
  { de: 60, ate: 80, nome: "60–80%" },
  { de: 80, ate: 100, nome: "final" },
];
export function trechoDaPagina(pagina: number | null, total: number) {
  if (pagina === null || !total) return 0;
  const pct = (pagina / total) * 100;
  const i = TRECHOS.findIndex((t) => pct < t.ate);
  return i === -1 ? TRECHOS.length - 1 : i;
}
export const paginasDoTrecho = (i: number, total: number) =>
  total ? [Math.max(1, Math.floor((TRECHOS[i].de / 100) * total) + (i ? 1 : 0)), Math.round((TRECHOS[i].ate / 100) * total)] : null;

/** a última vez que alguém mexeu na leitura */
export function ultimaAtividade(l: Coread, mensagens: { criado_em: string }[] = []) {
  return [l.criado_em, ...l.pessoas.map((p) => p.atualizado_em), ...mensagens.map((m) => m.criado_em)]
    .filter(Boolean)
    .sort()
    .reverse()[0];
}

export const dataCurta = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T12:00` : iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");
export const dataLonga = (iso: string) =>
  new Date(iso.length === 10 ? `${iso}T12:00` : iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

export function diasAte(iso: string) {
  const fim = new Date(`${iso}T23:59`);
  return Math.ceil((fim.getTime() - Date.now()) / 86400000);
}

/** quando a leitura terminou para o grupo (ou foi encerrada) */
export function fimDe(l: Coread) {
  if (l.encerrada_em) return l.encerrada_em;
  const fins = naLeitura(l)
    .map((p) => p.terminou_em ?? (p.terminou ? p.atualizado_em : null))
    .filter((x): x is string => !!x)
    .sort();
  return fins.length ? fins[fins.length - 1] : null;
}
