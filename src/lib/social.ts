"use client";

import { useCallback, useEffect, useState } from "react";
import { nuvemPronta, useNuvem } from "@/lib/nuvem";
import { usePerfil, type LivroSalvo, type Perfil } from "@/lib/perfil-store";
import { supabase } from "@/lib/supabase";

/**
 * Parte social: perfis públicos, seguir, feed, curtidas, comentários e novidades.
 * Tudo depende do Supabase com as tabelas de supabase/social.sql.
 */

export type PessoaResumo = {
  id: string;
  usuario: string | null;
  nome: string | null;
  foto: string | null;
};
export type PerfilPublico = PessoaResumo & { dados: Partial<Perfil> };

export type LivroAtividade = Pick<
  LivroSalvo,
  "id" | "titulo" | "autor" | "capa"
>;
export type TipoAtividade =
  | "comecou"
  | "terminou"
  | "avaliou"
  | "quer"
  | "ficha"
  /** progresso de leitura: texto = "página/total" */
  | "progresso"
  /** um trecho que ficou: texto = a citação */
  | "trecho"
  /** movimento de um clube: texto = o que aconteceu */
  | "clube"
  /** um comentário publicado pela pessoa sobre um livro */
  | "post";
export type Atividade = {
  id: string;
  autor: string;
  tipo: TipoAtividade;
  livro: LivroAtividade;
  nota: number | null;
  texto: string | null;
  clube_id: string | null;
  /** nome do clube, nas atualizações de clube */
  clube?: { id: string; nome: string } | null;
  criado_em: string;
  curtidas: { autor: string }[];
  comentarios: { count: number }[];
};
export type Comentario = {
  id: string;
  atividade_id: string;
  autor: string;
  texto: string;
  criado_em: string;
};

export const verbo: Record<TipoAtividade, string> = {
  comecou: "começou a ler",
  terminou: "terminou",
  avaliou: "avaliou",
  quer: "quer ler",
  ficha: "escreveu uma ficha de",
  progresso: "está lendo",
  trecho: "guardou um trecho de",
  clube: "",
  post: "escreveu sobre",
};

function db() {
  if (!supabase) throw new Error("sem nuvem");
  return supabase;
}

export function meuId() {
  return useNuvem.getState().usuario?.id ?? null;
}

/** Quem está logada agora (re-renderiza quando muda). */
export function useMeuId() {
  return useNuvem((s) => s.usuario?.id ?? null);
}

// ───────── perfis ─────────

const cachePessoas = new Map<string, PessoaResumo>();

export async function pessoasPorId(
  ids: string[],
): Promise<Map<string, PessoaResumo>> {
  const faltam = [...new Set(ids)].filter((id) => !cachePessoas.has(id));
  if (faltam.length) {
    const { data, error } = await db()
      .from("perfis_publicos")
      .select("id,usuario,nome,foto")
      .in("id", faltam);
    if (error) throw error;
    for (const p of data ?? []) cachePessoas.set(p.id, p);
  }
  return new Map(
    ids.map((id) => [
      id,
      cachePessoas.get(id) ?? { id, usuario: null, nome: null, foto: null },
    ]),
  );
}

export async function perfilPorUsuario(
  usuario: string,
): Promise<PerfilPublico | null> {
  const { data, error } = await db()
    .from("perfis_publicos")
    .select("id,usuario,nome,foto,dados")
    .eq("usuario", usuario)
    .maybeSingle();
  if (error) throw error;
  return data as PerfilPublico | null;
}

/** Limpa o termo para usar no filtro do PostgREST. */
function termoSeguro(t: string) {
  return t
    .replace(/^@/, "")
    .replace(/[,()%*\\]/g, " ")
    .trim();
}

export async function buscarPessoas(termo: string): Promise<PessoaResumo[]> {
  const t = termoSeguro(termo);
  if (t.length < 2) return [];
  const { data, error } = await db()
    .from("perfis_publicos")
    .select("id,usuario,nome,foto")
    .or(`usuario.ilike.%${t}%,nome.ilike.%${t}%`)
    .neq("id", meuId() ?? "")
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

/** Sugestões: quem segue você e você ainda não segue, depois perfis recentes. */
export async function sugestoesDePessoas(): Promise<
  (PessoaResumo & { motivo: string })[]
> {
  const eu = meuId();
  if (!eu) return [];
  const [sigo, meSeguem, recentes] = await Promise.all([
    idsQueSigo(),
    db().from("seguidores").select("seguidor").eq("seguido", eu).limit(30),
    db()
      .from("perfis_publicos")
      .select("id,usuario,nome,foto")
      .neq("id", eu)
      .not("usuario", "is", null)
      .order("atualizado_em", { ascending: false })
      .limit(20),
  ]);
  const deVolta = (meSeguem.data ?? [])
    .map((s) => s.seguidor)
    .filter((id) => !sigo.has(id));
  const pessoas = await pessoasPorId(deVolta);
  const lista = deVolta.map((id) => ({
    ...pessoas.get(id)!,
    motivo: "segue você",
  }));
  for (const p of recentes.data ?? []) {
    if (!sigo.has(p.id) && !lista.some((x) => x.id === p.id))
      lista.push({ ...p, motivo: "chegou há pouco" });
  }
  return lista.slice(0, 12);
}

// ───────── seguir ─────────

export async function idsQueSigo(): Promise<Set<string>> {
  const eu = meuId();
  if (!eu) return new Set();
  const { data, error } = await db()
    .from("seguidores")
    .select("seguido")
    .eq("seguidor", eu);
  if (error) throw error;
  return new Set((data ?? []).map((s) => s.seguido));
}

export async function seguir(id: string, sim: boolean) {
  const eu = meuId();
  if (!eu) return;
  const r = sim
    ? await db().from("seguidores").upsert({ seguidor: eu, seguido: id })
    : await db()
        .from("seguidores")
        .delete()
        .eq("seguidor", eu)
        .eq("seguido", id);
  if (r.error) throw r.error;
}

export async function contagemSeguidores(id: string) {
  const [a, b] = await Promise.all([
    db()
      .from("seguidores")
      .select("*", { count: "exact", head: true })
      .eq("seguido", id),
    db()
      .from("seguidores")
      .select("*", { count: "exact", head: true })
      .eq("seguidor", id),
  ]);
  return { seguidores: a.count ?? 0, seguindo: b.count ?? 0 };
}

export async function listaDeSeguidores(
  id: string,
  tipo: "seguidores" | "seguindo",
): Promise<PessoaResumo[]> {
  const coluna = tipo === "seguidores" ? "seguidor" : "seguido";
  const filtro = tipo === "seguidores" ? "seguido" : "seguidor";
  const { data, error } = await db()
    .from("seguidores")
    .select(coluna)
    .eq(filtro, id)
    .order("criado_em", { ascending: false })
    .limit(200);
  if (error) throw error;
  const ids = (data ?? []).map((r) => (r as Record<string, string>)[coluna]);
  const pessoas = await pessoasPorId(ids);
  return ids.map((i) => pessoas.get(i)!);
}

// ───────── feed ─────────

const CAMPOS_ATIVIDADE =
  "id,autor,tipo,livro,nota,texto,clube_id,criado_em,clube:clubes(id,nome),curtidas(autor),comentarios(count)";

/** O feed: o que as amigas e você mesma andam lendo. */
export async function feedDeAmigas(): Promise<Atividade[]> {
  const eu = meuId();
  const [sigoIds, meusClubes] = await Promise.all([
    idsQueSigo(),
    eu
      ? db()
          .from("membros")
          .select("clube_id")
          .eq("usuario_id", eu)
          .then((r) => (r.data ?? []).map((m) => m.clube_id as string))
      : Promise.resolve([] as string[]),
  ]);
  const sigo = [...sigoIds, ...(eu ? [eu] : [])];
  if (!sigo.length && !meusClubes.length) return [];
  // quem eu sigo (fora dos clubes) + tudo o que acontece nos meus clubes
  const filtros = [
    ...(sigo.length
      ? [`and(autor.in.(${sigo.join(",")}),clube_id.is.null)`]
      : []),
    ...(meusClubes.length ? [`clube_id.in.(${meusClubes.join(",")})`] : []),
  ];
  const { data, error } = await db()
    .from("atividades")
    .select(CAMPOS_ATIVIDADE)
    .or(filtros.join(","))
    .order("criado_em", { ascending: false })
    .limit(60);
  if (error) throw error;
  return semLivrosTirados((data ?? []) as unknown as Atividade[]);
}

/**
 * Minhas atualizações de livros que já tirei da estante não aparecem mais
 * (e são apagadas da nuvem). Só confere quando a estante já carregou da nuvem,
 * para nunca apagar nada por engano.
 */
function semLivrosTirados(lista: Atividade[]): Atividade[] {
  const eu = meuId();
  const livros = usePerfil.getState().livros;
  if (!eu || !nuvemPronta() || !livros.length) return lista;
  const tirados = lista.filter(
    (a) =>
      a.autor === eu &&
      !a.clube_id &&
      !livros.some((l) => l.id === a.livro?.id),
  );
  if (tirados.length)
    void db()
      .from("atividades")
      .delete()
      .in(
        "id",
        tirados.map((a) => a.id),
      )
      .then(
        () => {},
        () => {},
      );
  return lista.filter((a) => !tirados.includes(a));
}

/** Apaga da nuvem todas as minhas atualizações fora dos clubes (ao esvaziar a estante). */
export async function apagarMinhasAtividades() {
  const eu = meuId();
  if (!eu) return;
  await db()
    .from("atividades")
    .delete()
    .eq("autor", eu)
    .is("clube_id", null)
    .neq("tipo", "ficha");
}

/** Apaga da nuvem minhas atualizações (fora dos clubes) sobre um livro que saiu da estante. */
async function apagarAtividadesDoLivro(livroId: string) {
  const eu = meuId();
  if (!eu) return;
  await db()
    .from("atividades")
    .delete()
    .eq("autor", eu)
    .is("clube_id", null)
    .eq("livro->>id", livroId);
}

export async function atividadesDe(
  autor: string,
  limite = 30,
): Promise<Atividade[]> {
  const { data, error } = await db()
    .from("atividades")
    .select(CAMPOS_ATIVIDADE)
    .eq("autor", autor)
    .is("clube_id", null)
    .order("criado_em", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return semLivrosTirados((data ?? []) as unknown as Atividade[]);
}

export async function atividadesDoClube(clube: string): Promise<Atividade[]> {
  const { data, error } = await db()
    .from("atividades")
    .select(CAMPOS_ATIVIDADE)
    .eq("clube_id", clube)
    .order("criado_em", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as unknown as Atividade[];
}

export async function atividade(id: string): Promise<Atividade | null> {
  const { data, error } = await db()
    .from("atividades")
    .select(CAMPOS_ATIVIDADE)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Atividade | null;
}

/** Amigas lendo agora: o livro "lendo" mais recente de cada pessoa que você segue. */
/** Quem eu sigo e está lendo um dos livros que eu estou lendo agora (mesmo id ou mesmo título). */
export async function lendoOMesmo(
  meus: { id: string; titulo: string }[],
): Promise<{ pessoa: PessoaResumo; livro: LivroSalvo }[]> {
  if (!meus.length) return [];
  const sigo = [...(await idsQueSigo())];
  if (!sigo.length) return [];
  const { data, error } = await db()
    .from("perfis_publicos")
    .select("id,usuario,nome,foto,livros:dados->livros")
    .in("id", sigo);
  if (error) throw error;
  const chave = (t: string) =>
    t
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const resultado: { pessoa: PessoaResumo; livro: LivroSalvo }[] = [];
  for (const p of data ?? []) {
    const livros = (p as unknown as { livros?: LivroSalvo[] }).livros ?? [];
    const igual = livros.find(
      (l) =>
        l.status === "lendo" &&
        meus.some(
          (m) => m.id === l.id || chave(m.titulo) === chave(l.titulo ?? ""),
        ),
    );
    if (igual)
      resultado.push({
        pessoa: { id: p.id, usuario: p.usuario, nome: p.nome, foto: p.foto },
        livro: igual,
      });
  }
  return resultado;
}

export async function lendoEntreAmigas(): Promise<
  { pessoa: PessoaResumo; livro: LivroSalvo }[]
> {
  const sigo = [...(await idsQueSigo())];
  if (!sigo.length) return [];
  const { data, error } = await db()
    .from("perfis_publicos")
    .select("id,usuario,nome,foto,livros:dados->livros")
    .in("id", sigo);
  if (error) throw error;
  return (data ?? [])
    .map((p) => {
      const livros = (
        (p as unknown as { livros?: LivroSalvo[] }).livros ?? []
      ).filter((l) => l.status === "lendo");
      livros.sort((a, b) =>
        (b.iniciadoEm ?? b.adicionadoEm ?? "").localeCompare(
          a.iniciadoEm ?? a.adicionadoEm ?? "",
        ),
      );
      return livros[0]
        ? {
            pessoa: {
              id: p.id,
              usuario: p.usuario,
              nome: p.nome,
              foto: p.foto,
            },
            livro: livros[0],
          }
        : null;
    })
    .filter((x) => x !== null);
}

/** Quem você segue e tem este livro na estante (para a página do livro). */
export async function amigasComLivro(
  livroId: string,
): Promise<{ pessoa: PessoaResumo; livro: LivroSalvo }[]> {
  const sigo = [...(await idsQueSigo())];
  if (!sigo.length) return [];
  const { data, error } = await db()
    .from("perfis_publicos")
    .select("id,usuario,nome,foto,livros:dados->livros")
    .in("id", sigo);
  if (error) throw error;
  return (data ?? [])
    .map((p) => {
      const livro = (
        (p as unknown as { livros?: LivroSalvo[] }).livros ?? []
      ).find((l) => l.id === livroId);
      return livro
        ? {
            pessoa: {
              id: p.id,
              usuario: p.usuario,
              nome: p.nome,
              foto: p.foto,
            },
            livro,
          }
        : null;
    })
    .filter((x) => x !== null);
}

export async function curtir(atividadeId: string, sim: boolean) {
  const eu = meuId();
  if (!eu) return;
  const r = sim
    ? await db()
        .from("curtidas")
        .upsert({ atividade_id: atividadeId, autor: eu })
    : await db()
        .from("curtidas")
        .delete()
        .eq("atividade_id", atividadeId)
        .eq("autor", eu);
  if (r.error) throw r.error;
}

export async function comentariosDe(
  atividadeId: string,
): Promise<Comentario[]> {
  const { data, error } = await db()
    .from("comentarios")
    .select("id,atividade_id,autor,texto,criado_em")
    .eq("atividade_id", atividadeId)
    .order("criado_em");
  if (error) throw error;
  return data ?? [];
}

export async function comentar(atividadeId: string, texto: string) {
  const eu = meuId();
  if (!eu) return;
  const { error } = await db()
    .from("comentarios")
    .insert({ atividade_id: atividadeId, autor: eu, texto: texto.trim() });
  if (error) throw error;
}

export async function apagarComentario(id: string) {
  const { error } = await db().from("comentarios").delete().eq("id", id);
  if (error) throw error;
}

/** Publica uma atividade no feed (usado pela estante e pelo clube). */
export async function publicarAtividade(a: {
  tipo: TipoAtividade;
  livro: LivroAtividade;
  nota?: number | null;
  texto?: string | null;
  clube_id?: string | null;
}) {
  const eu = meuId();
  if (!supabase || !eu) return null;
  // capas enviadas pela pessoa (data URL) ficam só no perfil, não no feed
  const capa = a.livro.capa?.startsWith("data:") ? undefined : a.livro.capa;
  const { data, error } = await supabase
    .from("atividades")
    .insert({
      autor: eu,
      tipo: a.tipo,
      livro: {
        id: a.livro.id,
        titulo: a.livro.titulo,
        autor: a.livro.autor,
        capa,
      },
      nota: a.nota ?? null,
      texto: a.texto?.trim() || null,
      clube_id: a.clube_id ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

const prioridade: Record<TipoAtividade, number> = {
  quer: 1,
  comecou: 2,
  terminou: 3,
  avaliou: 4,
  ficha: 5,
  progresso: 0,
  trecho: 0,
  clube: 0,
  post: 0,
};

/**
 * Observa a estante e publica no feed o que a pessoa faz: começou, terminou,
 * quer ler, avaliou. Junta mudanças seguidas do mesmo livro (ex.: terminou e
 * já avaliou) e publica só a mais importante. Devolve a função de desligar.
 */
let silencio = false;

/** Faz mudanças na estante sem publicar no feed (ex.: importar uma lista antiga). */
export function semPublicar(fazer: () => void) {
  silencio = true;
  try {
    fazer();
  } finally {
    silencio = false;
  }
}

export function iniciarAtividades() {
  if (!supabase) return () => {};
  const pendentes = new Map<string, TipoAtividade>();
  /** livros com progresso novo e com trecho novo (publicados à parte) */
  const progresso = new Set<string>();
  const trechos = new Set<string>();
  let espera: ReturnType<typeof setTimeout> | undefined;

  /** um só cartão de progresso/trecho por livro: o novo substitui o anterior */
  async function trocar(tipo: "progresso" | "trecho", livroId: string) {
    const eu = meuId();
    if (!eu) return;
    await db()
      .from("atividades")
      .delete()
      .eq("autor", eu)
      .eq("tipo", tipo)
      .is("clube_id", null)
      .eq("livro->>id", livroId);
  }

  async function enviar() {
    const livros = usePerfil.getState().livros;
    for (const id of [...progresso]) {
      progresso.delete(id);
      const l = livros.find((x) => x.id === id);
      // terminou junto: o "terminou" já conta a história
      if (
        !l ||
        l.status !== "lendo" ||
        !l.paginas ||
        !l.paginaAtual ||
        pendentes.has(id)
      )
        continue;
      try {
        await trocar("progresso", id);
        await publicarAtividade({
          tipo: "progresso",
          livro: l,
          texto: `${l.paginaAtual}/${l.paginas}`,
        });
      } catch {
        /* sem internet: o feed só não recebe esta */
      }
    }
    for (const id of [...trechos]) {
      trechos.delete(id);
      const l = livros.find((x) => x.id === id);
      if (!l?.citacao?.trim()) continue;
      try {
        await trocar("trecho", id);
        await publicarAtividade({ tipo: "trecho", livro: l, texto: l.citacao });
      } catch {
        /* sem internet */
      }
    }
    const lote = [...pendentes];
    pendentes.clear();
    for (const [id, tipo] of lote) {
      const l = livros.find((x) => x.id === id);
      if (!l) continue;
      try {
        await publicarAtividade({
          tipo,
          livro: l,
          nota: tipo === "avaliou" ? (l.nota ?? null) : null,
          texto: tipo === "avaliou" ? (l.resenha ?? l.anotacao ?? null) : null,
        });
      } catch {
        /* sem tabela social ou sem internet: o feed só não recebe esta */
      }
    }
  }

  const apagar = new Map<string, ReturnType<typeof setTimeout>>();

  return usePerfil.subscribe((s, antes) => {
    if (
      silencio ||
      !nuvemPronta() ||
      !meuId() ||
      !s.onboardingConcluido ||
      s.livros === antes.livros
    )
      return;
    // livro tirado da estante: some do feed. Espera 15s por causa do "desfazer".
    for (const a of antes.livros) {
      if (s.livros.some((l) => l.id === a.id) || apagar.has(a.id)) continue;
      apagar.set(
        a.id,
        setTimeout(() => {
          apagar.delete(a.id);
          if (!usePerfil.getState().livros.some((l) => l.id === a.id))
            void apagarAtividadesDoLivro(a.id).catch(() => {});
        }, 15000),
      );
    }
    for (const l of s.livros) {
      const a = antes.livros.find((x) => x.id === l.id);
      // andou no livro (de pelo menos 5% ou 20 páginas desde a última vez)
      if (
        a &&
        l.status === "lendo" &&
        l.paginas &&
        l.paginaAtual &&
        l.paginaAtual !== a.paginaAtual
      ) {
        const andou = l.paginaAtual - (a.paginaAtual ?? 0);
        if (Math.abs(andou) >= Math.min(20, l.paginas * 0.05))
          progresso.add(l.id);
      }
      if ((l.citacao ?? "").trim() && (l.citacao ?? "") !== (a?.citacao ?? ""))
        trechos.add(l.id);
      let tipo: TipoAtividade | null = null;
      if (
        l.nota &&
        (a?.nota !== l.nota || (a?.resenha ?? "") !== (l.resenha ?? ""))
      )
        tipo = "avaliou";
      else if (l.status !== a?.status)
        tipo =
          l.status === "lido"
            ? "terminou"
            : l.status === "lendo"
              ? "comecou"
              : l.status === "quero"
                ? "quer"
                : null;
      if (!tipo) continue;
      const atual = pendentes.get(l.id);
      if (!atual || prioridade[tipo] >= prioridade[atual])
        pendentes.set(l.id, tipo);
    }
    if (!pendentes.size && !progresso.size && !trechos.size) return;
    clearTimeout(espera);
    espera = setTimeout(() => void enviar(), 4000);
  });
}

// ───────── novidades ─────────

export type Novidade = {
  id: string;
  quando: string;
  pessoa: PessoaResumo | null;
  texto: string;
  citacao?: string;
  etiqueta: string;
  href: string;
};

export async function novidades(): Promise<Novidade[]> {
  const eu = meuId();
  if (!eu) return [];
  const [curt, coment, seg, enc] = await Promise.all([
    db()
      .from("curtidas")
      .select(
        "criado_em,autor,atividade:atividades!inner(id,livro,autor,clube_id)",
      )
      .eq("atividade.autor", eu)
      .neq("autor", eu)
      .order("criado_em", { ascending: false })
      .limit(30),
    db()
      .from("comentarios")
      .select(
        "id,criado_em,autor,texto,atividade:atividades!inner(id,livro,autor)",
      )
      .eq("atividade.autor", eu)
      .neq("autor", eu)
      .order("criado_em", { ascending: false })
      .limit(30),
    db()
      .from("seguidores")
      .select("seguidor,criado_em")
      .eq("seguido", eu)
      .order("criado_em", { ascending: false })
      .limit(30),
    db()
      .from("encontros")
      .select(
        "id,clube_id,titulo,quando,criado_por,criado_em,clube:clubes(nome)",
      )
      .neq("criado_por", eu)
      .order("criado_em", { ascending: false })
      .limit(20),
  ]);
  for (const r of [curt, coment, seg, enc]) if (r.error) throw r.error;

  type AtivMin = {
    id: string;
    livro: LivroAtividade;
    clube_id?: string | null;
  };
  const um = <T>(v: T | T[]) => (Array.isArray(v) ? v[0] : v);
  const lista: (Omit<Novidade, "pessoa"> & { autor: string | null })[] = [];
  for (const c of curt.data ?? []) {
    const a = um(c.atividade) as AtivMin;
    lista.push({
      id: `c-${a.id}-${c.autor}`,
      quando: c.criado_em,
      autor: c.autor,
      texto: `curtiu sua ${a.clube_id ? "ficha" : "leitura"} de ${a.livro.titulo}`,
      etiqueta: "curtida",
      href: `/atividade/${a.id}`,
    });
  }
  for (const c of coment.data ?? []) {
    const a = um(c.atividade) as AtivMin;
    lista.push({
      id: `m-${c.id}`,
      quando: c.criado_em,
      autor: c.autor,
      texto: `comentou em ${a.livro.titulo}:`,
      citacao: c.texto,
      etiqueta: "comentário",
      href: `/atividade/${a.id}`,
    });
  }
  for (const s of seg.data ?? []) {
    lista.push({
      id: `s-${s.seguidor}`,
      quando: s.criado_em,
      autor: s.seguidor,
      texto: "começou a seguir você",
      etiqueta: "pessoas",
      href: "",
    });
  }
  for (const e of enc.data ?? []) {
    const clube = um(e.clube) as { nome: string } | null;
    lista.push({
      id: `e-${e.id}`,
      quando: e.criado_em,
      autor: e.criado_por,
      texto: `marcou "${e.titulo}" para ${new Date(e.quando).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}`,
      etiqueta: clube?.nome ?? "clube",
      href: `/clubes/${e.clube_id}/agenda`,
    });
  }
  const pessoas = await pessoasPorId(
    lista.map((n) => n.autor).filter((a): a is string => !!a),
  );
  return lista
    .map(({ autor, ...n }) => {
      const pessoa = autor ? (pessoas.get(autor) ?? null) : null;
      return {
        ...n,
        pessoa,
        href: n.href || (pessoa?.usuario ? `/u/${pessoa.usuario}` : ""),
      };
    })
    .sort((a, b) => b.quando.localeCompare(a.quando));
}

// ───────── utilidades de tela ─────────

/** Carrega dados assíncronos com estados de carregando/erro e um "tentar de novo". */
/**
 * O que já foi carregado nesta visita (por pessoa, consulta e parâmetros).
 * Voltar a uma tela mostra na hora o que ela tinha e atualiza por trás,
 * sem tela de carregamento.
 */
const consultas = new Map<string, unknown>();
const chaveDaConsulta = (buscar: () => unknown, deps: unknown[]) => {
  try {
    return `${meuId() ?? ""}|${buscar.toString()}|${JSON.stringify(deps)}`;
  } catch {
    return null;
  }
};

export function useConsulta<T>(buscar: () => Promise<T>, deps: unknown[]) {
  const chave = chaveDaConsulta(buscar, deps);
  const [estado, setEstado] = useState<{
    dados?: T;
    carregando: boolean;
    erro: unknown;
  }>(() =>
    chave && consultas.has(chave)
      ? { dados: consultas.get(chave) as T, carregando: true, erro: null }
      : { carregando: true, erro: null },
  );
  const [versao, setVersao] = useState(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fn = useCallback(buscar, deps);
  useEffect(() => {
    let vivo = true;
    // troca de parâmetros: mostra o que já tinha guardado para eles (se tiver)
    setEstado((e) =>
      chave && consultas.has(chave)
        ? { dados: consultas.get(chave) as T, carregando: true, erro: null }
        : { ...e, carregando: true, erro: null },
    );
    fn()
      .then((dados) => {
        if (chave) consultas.set(chave, dados);
        if (vivo) setEstado({ dados, carregando: false, erro: null });
      })
      .catch(
        (erro: unknown) =>
          vivo && setEstado((e) => ({ ...e, carregando: false, erro })),
      );
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fn, versao]);
  return {
    ...estado,
    recarregar: () => setVersao((v) => v + 1),
    /** troca os dados na hora (para respostas otimistas) */
    definir: (d: T) => {
      if (chave) consultas.set(chave, d);
      setEstado({ dados: d, carregando: false, erro: null });
    },
  };
}

/** "há 2 horas", "ontem", "12 out" */
export function quandoFoi(iso: string) {
  const d = new Date(iso);
  const min = Math.round((Date.now() - d.getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} ${h === 1 ? "hora" : "horas"}`;
  const dias = Math.round(h / 24);
  if (dias === 1) return "ontem";
  if (dias < 7)
    return d
      .toLocaleDateString("pt-BR", { weekday: "long" })
      .replace("-feira", "");
  return d
    .toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
    .replace(".", "");
}

export function nomeDe(p: PessoaResumo | null | undefined) {
  return p?.nome || (p?.usuario ? `@${p.usuario}` : "alguém");
}
