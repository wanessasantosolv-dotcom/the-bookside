"use client";

import { meuId, pessoasPorId, publicarAtividade, type PessoaResumo } from "@/lib/social";
import { supabase } from "@/lib/supabase";

/**
 * Clubes de leitura: o clube, membros, livros (sugestões → leitura da vez → lidos),
 * votos, fichas e agenda. Tabelas em supabase/social.sql.
 */

export type Clube = {
  id: string;
  nome: string;
  descricao: string | null;
  codigo: string;
  capa: string | null;
  criado_por: string;
  criado_em: string;
  /** sugestões por pessoa por mês (null = sem limite) */
  limite_sugestoes: number | null;
  /** máximo de pessoas no clube (null = sem limite) */
  max_membros: number | null;
  /** o código de convite vale até aqui */
  codigo_expira_em: string | null;
};
export type Papel = "moderadora" | "membro";
export type Membro = { usuario_id: string; papel: Papel; entrou_em: string; pessoa: PessoaResumo };

export type LivroDoClube = {
  id: string;
  clube_id: string;
  livro: { id: string; titulo: string; autor: string; capa?: string; paginas?: number; clima?: string[] };
  estado: "sugerido" | "lendo" | "lido";
  sugerido_por: string | null;
  motivo: string | null;
  rodada: number | null;
  prazo: string | null;
  iniciado_em: string | null;
  encerrado_em: string | null;
  criado_em: string;
  votos: { usuario_id: string }[];
};

export const criterios = ["personagens", "plot", "escrita", "final"] as const;
export type Criterio = (typeof criterios)[number];

export type Ficha = {
  id: string;
  clube_livro_id: string;
  autor: string;
  notas: Partial<Record<Criterio, number>>;
  nota: number | null;
  personagem: string | null;
  citacao: string | null;
  texto: string | null;
  spoiler: boolean;
  criado_em: string;
};

export type Encontro = {
  id: string;
  clube_id: string;
  titulo: string;
  quando: string;
  local: string | null;
  criado_por: string | null;
  criado_em: string;
};

function db() {
  if (!supabase) throw new Error("sem nuvem");
  return supabase;
}

const CAMPOS_LIVRO =
  "id,clube_id,livro,estado,sugerido_por,motivo,rodada,prazo,iniciado_em,encerrado_em,criado_em,votos(usuario_id)";

// ───────── clubes ─────────

export type ResumoClube = Clube & { membros: string[]; lendo: LivroDoClube | null; sugestoes: number; votaram: number };

export async function meusClubes(): Promise<ResumoClube[]> {
  const eu = meuId();
  if (!eu) return [];
  const { data: minhas, error } = await db().from("membros").select("clube_id").eq("usuario_id", eu);
  if (error) throw error;
  const ids = (minhas ?? []).map((m) => m.clube_id);
  if (!ids.length) return [];
  const [clubes, membros, livros] = await Promise.all([
    db().from("clubes").select("*").in("id", ids).order("criado_em", { ascending: false }),
    db().from("membros").select("clube_id,usuario_id").in("clube_id", ids),
    db().from("clube_livros").select(CAMPOS_LIVRO).in("clube_id", ids).in("estado", ["lendo", "sugerido"]),
  ]);
  for (const r of [clubes, membros, livros]) if (r.error) throw r.error;
  return (clubes.data as Clube[]).map((c) => {
    const ls = (livros.data as LivroDoClube[]).filter((l) => l.clube_id === c.id);
    const sug = ls.filter((l) => l.estado === "sugerido");
    return {
      ...c,
      membros: (membros.data ?? []).filter((m) => m.clube_id === c.id).map((m) => m.usuario_id),
      lendo: ls.find((l) => l.estado === "lendo") ?? null,
      sugestoes: sug.length,
      votaram: new Set(sug.flatMap((l) => l.votos.map((v) => v.usuario_id))).size,
    };
  });
}

export async function clube(id: string): Promise<Clube | null> {
  const { data, error } = await db().from("clubes").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data as Clube | null;
}

export async function membrosDe(clubeId: string): Promise<Membro[]> {
  const { data, error } = await db()
    .from("membros")
    .select("usuario_id,papel,entrou_em")
    .eq("clube_id", clubeId)
    .order("entrou_em");
  if (error) throw error;
  const pessoas = await pessoasPorId((data ?? []).map((m) => m.usuario_id));
  return (data ?? []).map((m) => ({ ...(m as Omit<Membro, "pessoa">), pessoa: pessoas.get(m.usuario_id)! }));
}

export async function criarClube(nome: string, descricao: string, capa: string | null): Promise<string> {
  const { data, error } = await db().rpc("criar_clube", { p_nome: nome, p_descricao: descricao });
  if (error) throw error;
  const id = data as string;
  if (capa) await db().from("clubes").update({ capa }).eq("id", id);
  return id;
}

export class ConviteInvalido extends Error {}

/** Entra pelo código. Convite vencido ou clube cheio viram ConviteInvalido com a explicação. */
export async function entrarNoClube(codigo: string): Promise<string | null> {
  const { data, error } = await db().rpc("entrar_no_clube", { p_codigo: codigo });
  if (error) {
    if (/expirado/i.test(error.message))
      throw new ConviteInvalido("esse convite venceu. peça um código novo para quem te chamou.");
    if (/cheio/i.test(error.message)) throw new ConviteInvalido("esse clube já está com todas as vagas preenchidas.");
    throw error;
  }
  return (data as string | null) ?? null;
}

/** Gera um código novo (o antigo para de valer) — só moderadora. */
export async function novoCodigo(clubeId: string): Promise<string> {
  const { data, error } = await db().rpc("novo_codigo", { p_clube: clubeId });
  if (error) throw error;
  return data as string;
}

export function conviteVencido(c: Clube) {
  return !!c.codigo_expira_em && new Date(c.codigo_expira_em).getTime() < Date.now();
}

/** Quantas sugestões você já fez neste clube no mês corrente. */
export async function minhasSugestoesNoMes(clubeId: string): Promise<number> {
  const eu = meuId();
  if (!eu) return 0;
  const inicio = new Date();
  inicio.setDate(1);
  inicio.setHours(0, 0, 0, 0);
  const { count, error } = await db()
    .from("clube_livros")
    .select("*", { count: "exact", head: true })
    .eq("clube_id", clubeId)
    .eq("sugerido_por", eu)
    .gte("criado_em", inicio.toISOString());
  if (error) throw error;
  return count ?? 0;
}

export async function editarClube(
  id: string,
  dados: Partial<Pick<Clube, "nome" | "descricao" | "capa" | "limite_sugestoes" | "max_membros">>,
) {
  const { error } = await db().from("clubes").update(dados).eq("id", id);
  if (error) throw error;
}

export async function apagarClube(id: string) {
  const { error } = await db().from("clubes").delete().eq("id", id);
  if (error) throw error;
}

export async function tirarMembro(clubeId: string, usuarioId: string) {
  const { error } = await db().from("membros").delete().eq("clube_id", clubeId).eq("usuario_id", usuarioId);
  if (error) throw error;
}

// ───────── livros do clube ─────────

export async function livrosDoClube(clubeId: string): Promise<LivroDoClube[]> {
  const { data, error } = await db()
    .from("clube_livros")
    .select(CAMPOS_LIVRO)
    .eq("clube_id", clubeId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as LivroDoClube[];
}

export async function livroDoClube(id: string): Promise<LivroDoClube | null> {
  const { data, error } = await db().from("clube_livros").select(CAMPOS_LIVRO).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as LivroDoClube | null;
}

export async function sugerir(clubeId: string, livro: LivroDoClube["livro"], motivo: string) {
  const eu = meuId();
  const { error } = await db()
    .from("clube_livros")
    .insert({ clube_id: clubeId, livro, motivo: motivo.trim() || null, sugerido_por: eu, estado: "sugerido" });
  if (error) throw error;
}

export async function apagarSugestao(id: string) {
  const { error } = await db().from("clube_livros").delete().eq("id", id);
  if (error) throw error;
}

export async function votar(livroId: string, sim: boolean) {
  const eu = meuId();
  if (!eu) return;
  const r = sim
    ? await db().from("votos").upsert({ clube_livro_id: livroId, usuario_id: eu })
    : await db().from("votos").delete().eq("clube_livro_id", livroId).eq("usuario_id", eu);
  if (r.error) throw r.error;
}

/** Começa a leitura da vez (só moderadora): encerra a anterior, numera a rodada e marca o prazo. */
export async function comecarLeitura(clubeId: string, livroId: string, prazo: string) {
  const livros = await livrosDoClube(clubeId);
  const atual = livros.find((l) => l.estado === "lendo");
  if (atual) await encerrarLeitura(atual.id);
  const rodada = Math.max(0, ...livros.map((l) => l.rodada ?? 0)) + 1;
  const { error } = await db()
    .from("clube_livros")
    .update({ estado: "lendo", rodada, prazo, iniciado_em: new Date().toISOString() })
    .eq("id", livroId);
  if (error) throw error;
}

export async function encerrarLeitura(livroId: string) {
  const { error } = await db()
    .from("clube_livros")
    .update({ estado: "lido", encerrado_em: new Date().toISOString() })
    .eq("id", livroId);
  if (error) throw error;
}

/** Dia da leitura: "dia 12 de 20" e quantos faltam. */
export function andamento(l: LivroDoClube) {
  if (!l.iniciado_em || !l.prazo) return null;
  const inicio = new Date(l.iniciado_em);
  inicio.setHours(0, 0, 0, 0);
  const fim = new Date(`${l.prazo}T23:59:59`);
  const dia = 864e5;
  const total = Math.max(1, Math.round((fim.getTime() - inicio.getTime()) / dia));
  const hoje = Math.min(total, Math.max(1, Math.ceil((Date.now() - inicio.getTime()) / dia)));
  const faltam = Math.max(0, Math.ceil((fim.getTime() - Date.now()) / dia));
  return { dia: hoje, total, faltam, inicio, fim };
}

// ───────── fichas ─────────

export async function fichasDe(livroId: string): Promise<Ficha[]> {
  const { data, error } = await db()
    .from("fichas")
    .select("id,clube_livro_id,autor,notas,nota,personagem,citacao,texto,spoiler,criado_em")
    .eq("clube_livro_id", livroId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Ficha[];
}

export async function fichasDoClube(livroIds: string[]): Promise<Ficha[]> {
  if (!livroIds.length) return [];
  const { data, error } = await db()
    .from("fichas")
    .select("id,clube_livro_id,autor,notas,nota,personagem,citacao,texto,spoiler,criado_em")
    .in("clube_livro_id", livroIds)
    .order("criado_em", { ascending: false })
    .limit(60);
  if (error) throw error;
  return (data ?? []) as Ficha[];
}

export async function salvarFicha(
  l: LivroDoClube,
  f: Omit<Ficha, "id" | "clube_livro_id" | "autor" | "criado_em">,
  jaExistia: boolean,
) {
  const eu = meuId();
  if (!eu) return;
  const { error } = await db()
    .from("fichas")
    .upsert({ ...f, clube_livro_id: l.id, autor: eu }, { onConflict: "clube_livro_id,autor" });
  if (error) throw error;
  if (!jaExistia) {
    try {
      await publicarAtividade({
        tipo: "ficha",
        livro: l.livro,
        nota: f.nota,
        texto: f.citacao || f.texto,
        clube_id: l.clube_id,
      });
    } catch {
      /* a ficha está salva; só o aviso no feed do clube falhou */
    }
  }
}

export function media(nums: (number | null | undefined)[]) {
  const v = nums.filter((n): n is number => typeof n === "number" && n > 0);
  return v.length ? v.reduce((a, b) => a + Number(b), 0) / v.length : null;
}

export const virgula = (n: number | null, casas = 1) => (n === null ? "—" : n.toFixed(casas).replace(".", ","));

// ───────── agenda ─────────

export async function encontrosDe(clubeId: string): Promise<Encontro[]> {
  const { data, error } = await db().from("encontros").select("*").eq("clube_id", clubeId).order("quando");
  if (error) throw error;
  return (data ?? []) as Encontro[];
}

export async function marcarEncontro(clubeId: string, e: { titulo: string; quando: string; local: string }) {
  const { error } = await db()
    .from("encontros")
    .insert({
      clube_id: clubeId,
      titulo: e.titulo.trim(),
      quando: e.quando,
      local: e.local.trim() || null,
      criado_por: meuId(),
    });
  if (error) throw error;
}

export async function desmarcarEncontro(id: string) {
  const { error } = await db().from("encontros").delete().eq("id", id);
  if (error) throw error;
}

/** Link de convite: abre a tela de entrar já com o código preenchido. */
export function linkDeConvite(codigo: string) {
  return `${window.location.origin}/clubes/entrar?codigo=${codigo}`;
}
