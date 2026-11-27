/**
 * Histórico das pequenas glórias: cada mês encerrado é consolidado uma única vez
 * (tabela liga_historico, sem update) e aparece na jornada do clube. O mês em
 * andamento é sempre provisório e calculado na hora.
 */
import { distincoes, periodoMes, periodosComDados, type Dados } from "@/lib/liga";
import { supabase } from "@/lib/supabase";

export type GloriaGuardada = { id: string; nome: string; vencedores: { usuario_id: string; valor: number | null }[] };
export type MesConsolidado = { periodo: string; nome: string; distincoes: GloriaGuardada[]; consolidado_em: string };

export async function historicoDaLiga(clubeId: string): Promise<MesConsolidado[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("liga_historico").select("periodo,nome,distincoes,consolidado_em").eq("clube_id", clubeId).order("periodo", { ascending: false });
  if (error) return [];
  return (data ?? []) as MesConsolidado[];
}

/** grava os meses encerrados que ainda não foram consolidados (nunca reescreve os que existem) */
export async function consolidarMeses(clubeId: string, d: Dados, datas: string[], hoje = new Date()) {
  if (!supabase) return;
  const ja = new Set((await historicoDaLiga(clubeId)).map((m) => m.periodo));
  const atual = periodoMes(hoje.getFullYear(), hoje.getMonth(), hoje).id;
  const faltam = periodosComDados(datas, hoje)
    .meses.filter((p) => p.encerrado && p.id !== atual && !ja.has(p.id))
    .slice(0, 12);
  if (!faltam.length) return;
  const linhas = faltam
    .map((p) => ({
      clube_id: clubeId,
      periodo: p.id,
      nome: p.nome,
      distincoes: distincoes(d, p).map((x) => ({ id: x.id, nome: x.nome, vencedores: x.vencedores.map((v) => ({ usuario_id: v.m.usuario_id, valor: v.valor })) })),
    }))
    .filter((l) => l.distincoes.length);
  if (!linhas.length) return;
  await supabase.from("liga_historico").upsert(linhas, { onConflict: "clube_id,periodo", ignoreDuplicates: true });
}
