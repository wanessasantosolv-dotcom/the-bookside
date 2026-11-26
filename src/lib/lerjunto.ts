"use client";

import { supabase } from "@/lib/supabase";
import { meuId, pessoasPorId, type PessoaResumo } from "@/lib/social";

/**
 * co-read (o antigo "ler junto"): a mesma leitura com uma ou mais pessoas, sem
 * precisar de clube. As tabelas continuam com os nomes antigos (leituras_juntas…).
 */
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
  /* do co-read (ficam vazios enquanto o banco não for atualizado) */
  nome?: string | null;
  estilo?: string | null;
  inicio?: string | null;
  sem_spoiler?: boolean;
  encerrada_em?: string | null;
};
export type EstadoNaLeitura = "convidada" | "lendo" | "pausou";
export type PessoaNaLeitura = {
  usuario_id: string;
  pagina: number;
  terminou: boolean;
  atualizado_em: string;
  entrou_em?: string;
  estado?: EstadoNaLeitura;
  convidada_por?: string | null;
  terminou_em?: string | null;
  pessoa: PessoaResumo | null;
};
export type Recado = {
  id: string;
  autor: string;
  texto: string;
  pagina: number | null;
  criado_em: string;
};
export type TipoReacao = "amei" | "nao-acredito" | "triste" | "conversar" | "reviravolta" | "favorito" | "confusa";
export type Reacao = {
  id: string;
  autor: string;
  tipo: TipoReacao;
  pagina: number | null;
  recado_id: string | null;
  criado_em: string;
};

/** o banco ainda não tem uma coluna ou tabela nova do co-read */
export const faltaNoBanco = (e: unknown) => {
  const c = (e as { code?: string })?.code;
  return c === "PGRST204" || c === "42703" || c === "42P01" || c === "PGRST205" || c === "PGRST202" || c === "42883";
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

export type Combinados = {
  prazo: string | null;
  inicio?: string | null;
  nome?: string | null;
  estilo?: string | null;
  sem_spoiler?: boolean;
};

export async function criarLeituraJunta(
  livro: LivroJunto,
  combinados: Combinados | string | null,
  amigos: string[],
): Promise<string> {
  const eu = meuId();
  if (!eu) throw new Error("sem conta");
  const c: Combinados = typeof combinados === "object" && combinados ? combinados : { prazo: combinados };
  const base = {
    livro: { ...livro, capa: livro.capa?.startsWith("data:") ? undefined : livro.capa },
    prazo: c.prazo,
    codigo: codigoNovo(),
  };
  const extra = {
    nome: c.nome?.trim() || null,
    estilo: c.estilo ?? null,
    inicio: c.inicio || null,
    sem_spoiler: c.sem_spoiler ?? true,
  };
  let r = await db().from("leituras_juntas").insert({ ...base, ...extra }).select("id").single();
  // banco ainda sem as colunas do co-read: cria do jeito antigo
  if (r.error && faltaNoBanco(r.error)) r = await db().from("leituras_juntas").insert(base).select("id").single();
  if (r.error) throw r.error;
  const id = r.data.id as string;
  const { error: e1 } = await db().from("leitura_junta_pessoas").insert({ leitura_id: id, usuario_id: eu });
  if (e1) throw e1;
  if (amigos.length) await convidar(id, amigos);
  return id;
}

/** chama pessoas que eu sigo: elas entram como convidadas e aceitam (ou recusam) */
export async function convidar(id: string, pessoas: string[]) {
  const eu = meuId();
  const linhas = pessoas.map((u) => ({ leitura_id: id, usuario_id: u, estado: "convidada", convidada_por: eu }));
  let { error } = await db().from("leitura_junta_pessoas").insert(linhas);
  if (error && faltaNoBanco(error))
    ({ error } = await db().from("leitura_junta_pessoas").insert(pessoas.map((u) => ({ leitura_id: id, usuario_id: u }))));
  if (error) throw error;
}

export async function aceitarConvite(id: string) {
  const eu = meuId();
  if (!eu) return;
  const { error } = await db()
    .from("leitura_junta_pessoas")
    .update({ estado: "lendo", entrou_em: new Date().toISOString() })
    .eq("leitura_id", id)
    .eq("usuario_id", eu);
  if (error) throw error;
}

export async function recusarConvite(id: string) {
  await sairDaLeitura(id);
}

/** quem criou desfaz um convite que ainda não foi aceito */
export async function desfazerConvite(id: string, usuarioId: string) {
  const { error } = await db().from("leitura_junta_pessoas").delete().eq("leitura_id", id).eq("usuario_id", usuarioId);
  if (error) throw error;
}

export async function pausar(id: string, sim: boolean) {
  const eu = meuId();
  if (!eu) return;
  const { error } = await db()
    .from("leitura_junta_pessoas")
    .update({ estado: sim ? "pausou" : "lendo" })
    .eq("leitura_id", id)
    .eq("usuario_id", eu);
  if (error) throw error;
}

export async function encerrarLeitura(id: string, sim = true) {
  const { error } = await db()
    .from("leituras_juntas")
    .update({ encerrada_em: sim ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) throw error;
}

export async function editarLeitura(id: string, campos: { nome?: string | null; estilo?: string | null; prazo?: string | null }) {
  const { error } = await db().from("leituras_juntas").update(campos).eq("id", id);
  if (error) throw error;
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
  const agora = new Date().toISOString();
  const base = { pagina, terminou, atualizado_em: agora };
  let { error } = await db()
    .from("leitura_junta_pessoas")
    .update(terminou ? { ...base, terminou_em: agora, estado: "lendo" } : base)
    .eq("leitura_id", id)
    .eq("usuario_id", eu);
  if (error && faltaNoBanco(error))
    ({ error } = await db().from("leitura_junta_pessoas").update(base).eq("leitura_id", id).eq("usuario_id", eu));
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

/** mensagens que ainda estão guardadas para mim: só quantas e de que página (nunca o texto) */
export async function recadosGuardados(id: string): Promise<{ pagina: number; quantas: number }[]> {
  const { data, error } = await db().rpc("recados_guardados", { l: id });
  if (error) return [];
  return ((data ?? []) as { pagina: number; quantas: number | string }[]).map((x) => ({ pagina: x.pagina, quantas: Number(x.quantas) }));
}

export async function reacoesDe(id: string): Promise<Reacao[]> {
  const { data, error } = await db()
    .from("leitura_junta_reacoes")
    .select("id,autor,tipo,pagina,recado_id,criado_em")
    .eq("leitura_id", id)
    .order("criado_em", { ascending: true });
  if (error) {
    if (faltaNoBanco(error)) return [];
    throw error;
  }
  return (data ?? []) as Reacao[];
}

export async function reagir(id: string, tipo: TipoReacao, pagina: number | null, recadoId: string | null = null) {
  const { error } = await db()
    .from("leitura_junta_reacoes")
    .insert({ leitura_id: id, tipo, pagina, recado_id: recadoId });
  if (error) throw error;
}

export async function desfazerReacao(reacaoId: string) {
  await db().from("leitura_junta_reacoes").delete().eq("id", reacaoId);
}

/** última vez que abri cada co-read (para saber o que é novo) */
const VISTO = "bookside-coread-visto-v1";
export function vistoEm(id: string): string | null {
  try {
    return (JSON.parse(localStorage.getItem(VISTO) ?? "{}") as Record<string, string>)[id] ?? null;
  } catch {
    return null;
  }
}
export function marcarVisto(id: string) {
  try {
    const t = JSON.parse(localStorage.getItem(VISTO) ?? "{}") as Record<string, string>;
    t[id] = new Date().toISOString();
    localStorage.setItem(VISTO, JSON.stringify(t));
  } catch {
    /* sem armazenamento */
  }
}

/** mensagens visíveis para mim em várias leituras (para contar o que é novo) */
export async function recadosRecentes(ids: string[]): Promise<{ leitura_id: string; autor: string; criado_em: string }[]> {
  if (!ids.length) return [];
  const { data } = await db()
    .from("leitura_junta_recados")
    .select("leitura_id,autor,criado_em")
    .in("leitura_id", ids)
    .order("criado_em", { ascending: false })
    .limit(300);
  return (data ?? []) as { leitura_id: string; autor: string; criado_em: string }[];
}

/**
 * Leva o progresso da estante pessoal para os co-reads do mesmo livro. Se a
 * minha edição tem outro número de páginas, converte pela porcentagem.
 */
export async function sincronizarProgressoNosCoreads(
  livro: { id: string; titulo: string; paginas?: number },
  pagina: number,
  terminou: boolean,
) {
  try {
    const eu = meuId();
    if (!eu) return;
    const chave = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const todas = await minhasLeiturasJuntas();
    await Promise.all(
      todas
        .filter((l) => !l.encerrada_em && (l.livro.id === livro.id || chave(l.livro.titulo) === chave(livro.titulo)))
        .map((l) => {
          const minha = l.pessoas.find((p) => p.usuario_id === eu);
          if (!minha || minha.estado === "convidada" || minha.terminou) return null;
          const total = l.livro.paginas ?? 0;
          const conv = total && livro.paginas && livro.paginas !== total ? Math.round((pagina / livro.paginas) * total) : pagina;
          if (!terminou && conv <= minha.pagina) return null;
          return atualizarMinhaPagina(l.id, terminou ? total || conv : conv, terminou);
        }),
    );
  } catch {
    /* sem conta ou sem rede: fica só na estante pessoal */
  }
}
