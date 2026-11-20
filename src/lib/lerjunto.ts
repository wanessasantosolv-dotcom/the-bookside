"use client";

import { supabase } from "@/lib/supabase";
import { meuId, pessoasPorId, type PessoaResumo } from "@/lib/social";

/** "ler junto": a mesma leitura com um ou mais amigos, sem precisar de clube. */
export type LivroJunto = {
  id: string;
  titulo: string;
  autor: string;
  capa?: string;
  paginas?: number;
};
export type LeituraJunta = {
  id: string;
  livro: LivroJunto;
  prazo: string | null;
  codigo: string | null;
  criado_por: string;
  criado_em: string;
};
export type PessoaNaLeitura = {
  usuario_id: string;
  pagina: number;
  terminou: boolean;
  atualizado_em: string;
  pessoa: PessoaResumo | null;
};
export type Recado = {
  id: string;
  autor: string;
  texto: string;
  pagina: number | null;
  criado_em: string;
};

function db() {
  if (!supabase) throw new Error("sem nuvem");
  return supabase;
}
const codigoNovo = () =>
  Array.from(
    { length: 6 },
    () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)],
  ).join("");

export async function criarLeituraJunta(
  livro: LivroJunto,
  prazo: string | null,
  amigos: string[],
): Promise<string> {
  const eu = meuId();
  if (!eu) throw new Error("sem conta");
  const { data, error } = await db()
    .from("leituras_juntas")
    .insert({
      livro: {
        ...livro,
        capa: livro.capa?.startsWith("data:") ? undefined : livro.capa,
      },
      prazo,
      codigo: codigoNovo(),
    })
    .select("id")
    .single();
  if (error) throw error;
  const { error: e2 } = await db()
    .from("leitura_junta_pessoas")
    .insert(
      [eu, ...amigos].map((u) => ({ leitura_id: data.id, usuario_id: u })),
    );
  if (e2) throw e2;
  return data.id as string;
}

export async function entrarComCodigo(codigo: string) {
  const { data, error } = await db().rpc("entrar_na_leitura_junta", {
    p_codigo: codigo,
  });
  if (error) throw error;
  return (data as string | null) ?? null;
}

/** as leituras juntas em que estou, com quem está em cada uma */
export async function minhasLeiturasJuntas(): Promise<
  (LeituraJunta & { pessoas: PessoaNaLeitura[] })[]
> {
  const { data, error } = await db()
    .from("leituras_juntas")
    .select("*")
    .order("criado_em", { ascending: false });
  if (error) throw error;
  const leituras = (data ?? []) as LeituraJunta[];
  if (!leituras.length) return [];
  const { data: ps } = await db()
    .from("leitura_junta_pessoas")
    .select("*")
    .in(
      "leitura_id",
      leituras.map((l) => l.id),
    );
  const lista = (ps ?? []) as (PessoaNaLeitura & { leitura_id: string })[];
  const pessoas = await pessoasPorId(lista.map((p) => p.usuario_id));
  return leituras.map((l) => ({
    ...l,
    pessoas: lista
      .filter((p) => p.leitura_id === l.id)
      .map((p) => ({ ...p, pessoa: pessoas.get(p.usuario_id) ?? null })),
  }));
}

export async function recadosDe(id: string): Promise<Recado[]> {
  const { data, error } = await db()
    .from("leitura_junta_recados")
    .select("*")
    .eq("leitura_id", id)
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Recado[];
}

export async function mandarRecado(
  id: string,
  texto: string,
  pagina: number | null,
) {
  const { error } = await db()
    .from("leitura_junta_recados")
    .insert({ leitura_id: id, texto: texto.trim(), pagina });
  if (error) throw error;
}

export async function apagarRecado(id: string) {
  await db().from("leitura_junta_recados").delete().eq("id", id);
}

export async function atualizarMinhaPagina(
  id: string,
  pagina: number,
  terminou: boolean,
) {
  const eu = meuId();
  if (!eu) return;
  const { error } = await db()
    .from("leitura_junta_pessoas")
    .update({ pagina, terminou, atualizado_em: new Date().toISOString() })
    .eq("leitura_id", id)
    .eq("usuario_id", eu);
  if (error) throw error;
}

/**
 * Registra quantas páginas o livro tem (quando ele entrou na leitura junta sem
 * esse dado) — sem isso a barra de progresso de todo mundo fica sempre em 0%.
 */
export async function definirPaginasDaLeitura(
  id: string,
  livro: LivroJunto,
  paginas: number,
) {
  const { error } = await db()
    .from("leituras_juntas")
    .update({ livro: { ...livro, paginas } })
    .eq("id", id);
  if (error) throw error;
}

export async function chamarAmigo(id: string, usuarioId: string) {
  const { error } = await db()
    .from("leitura_junta_pessoas")
    .insert({ leitura_id: id, usuario_id: usuarioId });
  if (error) throw error;
}

export async function sairDaLeitura(id: string) {
  const eu = meuId();
  if (!eu) return;
  await db()
    .from("leitura_junta_pessoas")
    .delete()
    .eq("leitura_id", id)
    .eq("usuario_id", eu);
}

export async function apagarLeitura(id: string) {
  await db().from("leituras_juntas").delete().eq("id", id);
}
