"use client";

import { nuvemPronta } from "@/lib/nuvem";
import { usePerfil } from "@/lib/perfil-store";
import {
  meuId,
  pessoasPorId,
  publicarAtividade,
  semPublicar,
  type PessoaResumo,
} from "@/lib/social";
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
  /** a foto redonda do clube */
  foto?: string | null;
  criado_por: string;
  criado_em: string;
  /** sugestões por pessoa por mês (null = sem limite) */
  limite_sugestoes: number | null;
  /** "o que a gente amou" escolhido à mão (ids dos livros do clube); vazio = automático */
  favoritos?: string[] | null;
  /** máximo de pessoas no clube (null = sem limite) */
  max_membros: number | null;
  /** o código de convite vale até aqui */
  codigo_expira_em: string | null;
  /** id do tema (mesmas opções de @/lib/dados → temas) */
  tema: string | null;
  /** como o clube escolhe os livros (ver modosDeEscolha) */
  escolha?: ModoEscolha | null;
  /** club studio: identidade visual completa (ver @/lib/identidade); null = só o tema antigo */
  identidade?: unknown;
};

export type ModoEscolha = "fila" | "votacao" | "rodizio" | "moderadora" | "sorteio";

/** os jeitos de um clube escolher o próximo livro (o app se adapta a cada um) */
export const modosDeEscolha: { id: ModoEscolha; nome: string; descricao: string }[] = [
  { id: "fila", nome: "fila de sugestões", descricao: "cada pessoa sugere e todos os livros são lidos, na ordem em que foram sugeridos" },
  { id: "votacao", nome: "votação", descricao: "cada pessoa sugere e o clube vota: a mais votada vira a próxima leitura" },
  { id: "rodizio", nome: "rodízio", descricao: "cada vez uma pessoa escolhe o livro, na ordem de quem entrou no clube" },
  { id: "moderadora", nome: "quem modera escolhe", descricao: "a moderação escolhe a próxima leitura (as sugestões são ideias)" },
  { id: "sorteio", nome: "sorteio", descricao: "o app sorteia a próxima leitura entre as sugestões" },
];

/** "sugerido por irla" / "escolhido por wane" (nada para livros do histórico) */
export function quemTrouxe(l: LivroDoClube, membros: Membro[], eu: string | null): string | null {
  if (!l.sugerido_por || l.livro.historico) return null;
  const nome =
    l.sugerido_por === eu
      ? "você"
      : (membros.find((m) => m.usuario_id === l.sugerido_por)?.pessoa?.nome ??
        membros.find((m) => m.usuario_id === l.sugerido_por)?.pessoa?.usuario ??
        "alguém");
  // escolhido direto como leitura da vez (entrou e começou na mesma hora) ou sugerido antes
  const direto =
    l.estado !== "sugerido" &&
    !!l.iniciado_em &&
    Math.abs(new Date(l.iniciado_em).getTime() - new Date(l.criado_em).getTime()) < 15 * 60e3;
  return `${direto ? "escolhido" : "sugerido"} por ${nome}`;
}

export const modoDe = (c: Pick<Clube, "escolha">): ModoEscolha => c.escolha ?? "fila";

/** rodízio: de quem é a vez de escolher (a pessoa seguinte a quem escolheu a última leitura) */
export function vezDe(livros: LivroDoClube[], membros: Membro[]): Membro | null {
  if (!membros.length) return null;
  const ultima = [...livros]
    .filter((l) => l.estado !== "sugerido")
    .sort((a, b) => (b.iniciado_em ?? b.criado_em).localeCompare(a.iniciado_em ?? a.criado_em))[0];
  const i = ultima ? membros.findIndex((m) => m.usuario_id === ultima.sugerido_por) : -1;
  return membros[(i + 1) % membros.length];
}
export type Papel = "moderadora" | "organizadora" | "membro";

/** os cargos do clube e o que cada um pode */
export const cargos: { id: Papel; nome: string; descricao: string }[] = [
  { id: "moderadora", nome: "moderadora", descricao: "cuida de tudo: informações do clube, cargos, leituras e membros" },
  { id: "organizadora", nome: "organizadora", descricao: "escolhe e encerra leituras, marca encontros, convida e tira membros" },
  { id: "membro", nome: "membro", descricao: "lê, sugere, vota e escreve fichas" },
];

/** pode cuidar da leitura, da agenda, dos convites e das membros */
export const organiza = (p: Papel | null | undefined) =>
  p === "moderadora" || p === "organizadora";

/** escolhe os favoritos do clube ("o que a gente amou"); [] volta ao automático */
export async function definirFavoritosDoClube(clubeId: string, ids: string[]) {
  const { error } = await db().rpc("definir_favoritos_do_clube", {
    p_clube: clubeId,
    p_ids: ids,
  });
  if (error) throw error;
}

/** muda o cargo de alguém (só quem modera; o clube nunca fica sem moderadora) */
export async function mudarPapel(clubeId: string, usuarioId: string, papel: Papel) {
  const { error } = await db().rpc("mudar_papel", {
    p_clube: clubeId,
    p_usuario: usuarioId,
    p_papel: papel,
  });
  if (error) throw error;
}
export type Membro = {
  usuario_id: string;
  papel: Papel;
  entrou_em: string;
  pessoa: PessoaResumo;
};

export type LivroDoClube = {
  id: string;
  clube_id: string;
  livro: {
    id: string;
    titulo: string;
    autor: string;
    capa?: string;
    paginas?: number;
    clima?: string[];
    /** entrou pelo histórico (importado/“já lido”): não dá para saber quem sugeriu */
    historico?: boolean;
  };
  estado: "sugerido" | "lendo" | "lido";
  sugerido_por: string | null;
  motivo: string | null;
  rodada: number | null;
  prazo: string | null;
  iniciado_em: string | null;
  encerrado_em: string | null;
  criado_em: string;
  votos: { usuario_id: string }[];
  /** fichas de antes do app (da revista do clube), de quem ainda não escreveu a ficha aqui */
  fichas_antigas?: FichaAntiga[] | null;
};

/** uma ficha que veio de fora (ex.: a revista em PDF), com o nome da pessoa no lugar da conta */
export type FichaAntiga = {
  pessoa: string;
  nota?: number | null;
  notas?: Partial<Record<Criterio, number>>;
  personagem?: string | null;
  citacao?: string | null;
  resenha?: string | null;
  iniciadoEm?: string | null;
  lidoEm?: string | null;
};

export const primeiroNome = (t?: string | null) =>
  (t ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .split(/\s+/)[0];

/**
 * As fichas de um livro do clube: as escritas no app + as antigas de quem ainda não
 * escreveu aqui (a ficha nova de alguém substitui a antiga com o mesmo nome).
 * As antigas viram fichas com autor "antiga:<nome>".
 */
export function fichasComAntigas(
  l: LivroDoClube,
  reais: Ficha[],
  membros: Membro[],
): Ficha[] {
  // nomes parecidos são a mesma pessoa ("wane" no app e "Wanessa" na revista)
  const nomesComFicha = reais.flatMap((f) => {
    const p = membros.find((m) => m.usuario_id === f.autor)?.pessoa;
    return [primeiroNome(p?.nome), primeiroNome(p?.usuario)].filter((n) => n.length >= 3);
  });
  const mesmaPessoa = (nome: string) => {
    const n = primeiroNome(nome);
    return nomesComFicha.some(
      (x) => x === n || (x.length >= 4 && n.startsWith(x)) || (n.length >= 4 && x.startsWith(n)),
    );
  };
  const antigas = (l.fichas_antigas ?? [])
    .filter((a) => a.pessoa && !mesmaPessoa(a.pessoa))
    .map(
      (a, i): Ficha => ({
        id: `antiga-${l.id}-${i}`,
        clube_livro_id: l.id,
        autor: `antiga:${a.pessoa}`,
        notas: a.notas ?? {},
        nota: a.nota ?? null,
        personagem: a.personagem ?? null,
        citacao: a.citacao ?? null,
        texto: a.resenha ?? null,
        spoiler: false,
        criado_em: a.lidoEm ?? l.encerrado_em ?? l.criado_em,
      }),
    );
  return [...reais, ...antigas];
}

/** a pessoa de uma ficha: da conta, ou só o nome (fichas antigas) */
export function pessoaDaFicha(
  autor: string,
  membros: Membro[],
): PessoaResumo | null {
  if (autor.startsWith("antiga:"))
    return {
      id: autor,
      usuario: null,
      nome: autor.slice(7),
      foto: null,
    } as PessoaResumo;
  return membros.find((m) => m.usuario_id === autor)?.pessoa ?? null;
}

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

export const statusLeitura = ["nao_comecei", "lendo", "terminei"] as const;
export type StatusLeitura = (typeof statusLeitura)[number];
export const unidadesMarca = ["pagina", "capitulo"] as const;
export type UnidadeMarca = (typeof unidadesMarca)[number];
export type Progresso = {
  clube_livro_id: string;
  usuario_id: string;
  status: StatusLeitura;
  unidade: UnidadeMarca | null;
  numero: number | null;
  atualizado_em: string;
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

// "*": colunas novas (ex.: fichas_antigas) aparecem quando o banco for atualizado, sem quebrar antes
const CAMPOS_LIVRO = "*,votos(usuario_id)";

// ───────── clubes ─────────

export type ResumoClube = Clube & {
  membros: string[];
  lendo: LivroDoClube | null;
  sugestoes: number;
  votaram: number;
};

export async function meusClubes(): Promise<ResumoClube[]> {
  const eu = meuId();
  if (!eu) return [];
  const { data: minhas, error } = await db()
    .from("membros")
    .select("clube_id")
    .eq("usuario_id", eu);
  if (error) throw error;
  const ids = (minhas ?? []).map((m) => m.clube_id);
  if (!ids.length) return [];
  const [clubes, membros, livros] = await Promise.all([
    db()
      .from("clubes")
      .select("*")
      .in("id", ids)
      .order("criado_em", { ascending: false }),
    db().from("membros").select("clube_id,usuario_id").in("clube_id", ids),
    db()
      .from("clube_livros")
      .select(CAMPOS_LIVRO)
      .in("clube_id", ids)
      .in("estado", ["lendo", "sugerido"]),
  ]);
  for (const r of [clubes, membros, livros]) if (r.error) throw r.error;
  return (clubes.data as Clube[]).map((c) => {
    const ls = (livros.data as LivroDoClube[]).filter(
      (l) => l.clube_id === c.id,
    );
    const sug = ls.filter((l) => l.estado === "sugerido");
    return {
      ...c,
      membros: (membros.data ?? [])
        .filter((m) => m.clube_id === c.id)
        .map((m) => m.usuario_id),
      lendo: ls.find((l) => l.estado === "lendo") ?? null,
      sugestoes: sug.length,
      votaram: new Set(sug.flatMap((l) => l.votos.map((v) => v.usuario_id)))
        .size,
    };
  });
}

export async function clube(id: string): Promise<Clube | null> {
  const { data, error } = await db()
    .from("clubes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
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
  return (data ?? []).map((m) => ({
    ...(m as Omit<Membro, "pessoa">),
    pessoa: pessoas.get(m.usuario_id)!,
  }));
}

export async function criarClube(
  nome: string,
  descricao: string,
  capa: string | null,
): Promise<string> {
  const { data, error } = await db().rpc("criar_clube", {
    p_nome: nome,
    p_descricao: descricao,
  });
  if (error) throw error;
  const id = data as string;
  if (capa) await db().from("clubes").update({ capa }).eq("id", id);
  return id;
}

export class ConviteInvalido extends Error {}

/** Entra pelo código. Convite vencido ou clube cheio viram ConviteInvalido com a explicação. */
export async function entrarNoClube(codigo: string): Promise<string | null> {
  const { data, error } = await db().rpc("entrar_no_clube", {
    p_codigo: codigo,
  });
  if (error) {
    if (/expirado/i.test(error.message))
      throw new ConviteInvalido(
        "esse convite venceu. peça um código novo para quem te chamou.",
      );
    if (/cheio/i.test(error.message))
      throw new ConviteInvalido(
        "esse clube já está com todas as vagas preenchidas.",
      );
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
  return (
    !!c.codigo_expira_em && new Date(c.codigo_expira_em).getTime() < Date.now()
  );
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
  dados: Partial<
    Pick<
      Clube,
      | "nome"
      | "descricao"
      | "capa"
      | "foto"
      | "limite_sugestoes"
      | "max_membros"
      | "tema"
      | "escolha"
      | "identidade"
    >
  >,
) {
  const { error } = await db().from("clubes").update(dados).eq("id", id);
  if (error) throw error;
}

export async function apagarClube(id: string) {
  const { error } = await db().from("clubes").delete().eq("id", id);
  if (error) throw error;
}

export async function tirarMembro(clubeId: string, usuarioId: string) {
  const { error } = await db()
    .from("membros")
    .delete()
    .eq("clube_id", clubeId)
    .eq("usuario_id", usuarioId);
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
  const { data, error } = await db()
    .from("clube_livros")
    .select(CAMPOS_LIVRO)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as LivroDoClube | null;
}

export async function sugerir(
  clubeId: string,
  livro: LivroDoClube["livro"],
  motivo: string,
) {
  const eu = meuId();
  const { error } = await db()
    .from("clube_livros")
    .insert({
      clube_id: clubeId,
      livro,
      motivo: motivo.trim() || null,
      sugerido_por: eu,
      estado: "sugerido",
    });
  if (error) throw error;
}

/** Moderadora escolhe um livro direto (sem passar pela votação) e já começa a leitura. */
export async function escolherLivroDaVez(
  clubeId: string,
  livro: LivroDoClube["livro"],
  prazo: string,
  inicio?: string,
) {
  const eu = meuId();
  const { data, error } = await db()
    .from("clube_livros")
    .insert({
      clube_id: clubeId,
      livro,
      sugerido_por: eu,
      estado: "sugerido",
      motivo: null,
    })
    .select("id")
    .single();
  if (error) throw error;
  await comecarLeitura(clubeId, data.id as string, prazo, inicio);
}

/** Tira um livro da estante do clube, seja sugestão, leitura da vez ou já lido. */
export async function apagarLivroDoClube(id: string) {
  const { error } = await db().from("clube_livros").delete().eq("id", id);
  if (error) throw error;
}

export async function votar(livroId: string, sim: boolean) {
  const eu = meuId();
  if (!eu) return;
  const r = sim
    ? await db()
        .from("votos")
        .upsert({ clube_livro_id: livroId, usuario_id: eu })
    : await db()
        .from("votos")
        .delete()
        .eq("clube_livro_id", livroId)
        .eq("usuario_id", eu);
  if (r.error) throw r.error;
}

/** Começa a leitura da vez (só moderadora): encerra a anterior, numera a rodada e marca o prazo. */
export async function comecarLeitura(
  clubeId: string,
  livroId: string,
  prazo: string,
  inicio?: string,
) {
  const livros = await livrosDoClube(clubeId);
  const atual = livros.find((l) => l.estado === "lendo");
  if (atual) await encerrarLeitura(atual.id);
  const rodada = Math.max(0, ...livros.map((l) => l.rodada ?? 0)) + 1;
  const iniciado_em = inicio
    ? new Date(`${inicio}T12:00:00`).toISOString()
    : new Date().toISOString();
  const { error } = await db()
    .from("clube_livros")
    .update({ estado: "lendo", rodada, prazo, iniciado_em })
    .eq("id", livroId);
  if (error) throw error;
  // quem começou a leitura já vê o livro na própria estante
  void sincronizarMinhaEstante(true);
  // aparece no feed de quem é do clube
  const livro = livros.find((l) => l.id === livroId)?.livro;
  if (livro)
    await publicarAtividade({
      tipo: "clube",
      livro,
      texto: `começou a leitura nº ${rodada}`,
      clube_id: clubeId,
    }).catch(() => {});
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
  const total = Math.max(
    1,
    Math.round((fim.getTime() - inicio.getTime()) / dia),
  );
  const hoje = Math.min(
    total,
    Math.max(1, Math.ceil((Date.now() - inicio.getTime()) / dia)),
  );
  const faltam = Math.max(0, Math.ceil((fim.getTime() - Date.now()) / dia));
  return { dia: hoje, total, faltam, inicio, fim };
}

// ───────── fichas ─────────

export async function fichasDe(livroId: string): Promise<Ficha[]> {
  const { data, error } = await db()
    .from("fichas")
    .select(
      "id,clube_livro_id,autor,notas,nota,personagem,citacao,texto,spoiler,criado_em",
    )
    .eq("clube_livro_id", livroId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Ficha[];
}

// ───────── progresso de leitura ─────────

export async function progressoDe(livroId: string): Promise<Progresso[]> {
  const { data, error } = await db()
    .from("progresso_leitura")
    .select("clube_livro_id,usuario_id,status,unidade,numero,atualizado_em")
    .eq("clube_livro_id", livroId);
  if (error) throw error;
  return (data ?? []) as Progresso[];
}

export async function marcarProgresso(livroId: string, status: StatusLeitura) {
  const eu = meuId();
  if (!eu) return;
  const { error } = await db().from("progresso_leitura").upsert(
    {
      clube_livro_id: livroId,
      usuario_id: eu,
      status,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "clube_livro_id,usuario_id" },
  );
  if (error) throw error;
}

/** Marca em que página ou capítulo a pessoa está (e deixa o status como "lendo"). */
export async function marcarMarca(livroId: string, unidade: UnidadeMarca, numero: number) {
  const eu = meuId();
  if (!eu) return;
  const { error } = await db()
    .from("progresso_leitura")
    .upsert(
      { clube_livro_id: livroId, usuario_id: eu, status: "lendo", unidade, numero, atualizado_em: new Date().toISOString() },
      { onConflict: "clube_livro_id,usuario_id" },
    );
  if (error) throw error;
}

/**
 * O progresso é um só: quando a pessoa atualiza a página (ou termina) um livro
 * na estante dela, a leitura do mesmo livro nos clubes acompanha.
 */
export async function sincronizarProgressoNosClubes(livro: { id: string; titulo: string }, pagina: number, terminou: boolean) {
  try {
    const clubes = await meusClubes();
    const chave = chaveLivro(livro.titulo);
    await Promise.all(
      clubes
        .map((c) => c.lendo)
        .filter((l): l is LivroDoClube => !!l && (l.livro.id === livro.id || chaveLivro(l.livro.titulo) === chave))
        .map((l) => (terminou ? marcarProgresso(l.id, "terminei") : pagina > 0 ? marcarMarca(l.id, "pagina", pagina) : null)),
    );
  } catch {
    /* sem conta ou sem rede: fica só na estante pessoal */
  }
}

export async function fichasDoClube(livroIds: string[]): Promise<Ficha[]> {
  if (!livroIds.length) return [];
  const { data, error } = await db()
    .from("fichas")
    .select(
      "id,clube_livro_id,autor,notas,nota,personagem,citacao,texto,spoiler,criado_em",
    )
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
    .upsert(
      { ...f, clube_livro_id: l.id, autor: eu },
      { onConflict: "clube_livro_id,autor" },
    );
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

/** Apaga a minha ficha de um livro do clube (e o aviso dela no feed do clube). */
export async function apagarFicha(l: LivroDoClube) {
  const eu = meuId();
  if (!eu) return;
  const { error } = await db()
    .from("fichas")
    .delete()
    .eq("clube_livro_id", l.id)
    .eq("autor", eu);
  if (error) throw error;
  await db()
    .from("atividades")
    .delete()
    .eq("autor", eu)
    .eq("tipo", "ficha")
    .eq("clube_id", l.clube_id)
    .eq("livro->>id", l.livro.id)
    .then(
      () => {},
      () => {},
    );
}

export function media(nums: (number | null | undefined)[]) {
  const v = nums.filter((n): n is number => typeof n === "number" && n > 0);
  return v.length ? v.reduce((a, b) => a + Number(b), 0) / v.length : null;
}

export const virgula = (n: number | null, casas = 1) =>
  n === null ? "—" : n.toFixed(casas).replace(".", ",");

// ───────── agenda ─────────

export async function encontrosDe(clubeId: string): Promise<Encontro[]> {
  const { data, error } = await db()
    .from("encontros")
    .select("*")
    .eq("clube_id", clubeId)
    .order("quando");
  if (error) throw error;
  return (data ?? []) as Encontro[];
}

export async function marcarEncontro(
  clubeId: string,
  e: { titulo: string; quando: string; local: string },
) {
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
  // aparece no feed de quem é do clube, com o livro da vez (se tiver)
  const lendo = (await livrosDoClube(clubeId).catch(() => [])).find(
    (l) => l.estado === "lendo",
  );
  const dia = new Date(e.quando).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hora = new Date(e.quando).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  await publicarAtividade({
    tipo: "clube",
    livro: lendo?.livro ?? {
      id: `encontro-${clubeId}`,
      titulo: e.titulo.trim(),
      autor: "",
    },
    texto: `marcou um encontro: ${e.titulo.trim()} · ${dia} às ${hora}${e.local.trim() ? ` · ${e.local.trim()}` : ""}`,
    clube_id: clubeId,
  }).catch(() => {});
}

export async function desmarcarEncontro(id: string) {
  const { error } = await db().from("encontros").delete().eq("id", id);
  if (error) throw error;
}

/** Link de convite: abre a tela de entrar já com o código preenchido. */
export function linkDeConvite(codigo: string) {
  return `${window.location.origin}/clubes/entrar?codigo=${codigo}`;
}

// ───────── histórico e estante pessoal ─────────

/** Inclui no clube um livro que ele já leu (só quem modera): monta o histórico. */
export async function adicionarLidoAoClube(
  clubeId: string,
  livro: LivroDoClube["livro"],
  terminouEm: string,
  extra: { iniciadoEm?: string; rodada?: number; fichasAntigas?: FichaAntiga[] } = {},
) {
  const eu = meuId();
  const { data, error } = await db()
    .from("clube_livros")
    .insert({
      clube_id: clubeId,
      livro: { ...livro, historico: true },
      sugerido_por: eu,
      estado: "lido",
      motivo: null,
      encerrado_em: terminouEm,
      ...(extra.iniciadoEm ? { iniciado_em: extra.iniciadoEm } : {}),
      ...(extra.rodada ? { rodada: extra.rodada } : {}),
      // só manda quando tem (bancos sem a coluna nova continuam importando o resto)
      ...(extra.fichasAntigas?.length ? { fichas_antigas: extra.fichasAntigas } : {}),
    })
    .select("id")
    .single();
  if (error) throw semColunaNova(error);
  return data.id as string;
}

export type AndamentoMembro = {
  estado: "terminou" | "lendo" | "nao";
  /** 0–100, quando a pessoa marcou a página */
  pct?: number;
};

/**
 * Como cada pessoa do clube está na leitura da vez: quem terminou (ficha ou
 * marcou como lido na estante), quem está lendo (e em que página) e quem não começou.
 */
export async function andamentoDasMembros(
  l: LivroDoClube,
  membros: Membro[],
  fichas: Ficha[],
): Promise<Map<string, AndamentoMembro>> {
  const res = new Map<string, AndamentoMembro>();
  const { data } = membros.length
    ? await db()
        .from("perfis_publicos")
        .select("id,livros:dados->livros")
        .in(
          "id",
          membros.map((m) => m.usuario_id),
        )
    : { data: [] };
  const chave = chaveLivro(l.livro.titulo);
  for (const m of membros) {
    if (fichas.some((f) => f.clube_livro_id === l.id && f.autor === m.usuario_id)) {
      res.set(m.usuario_id, { estado: "terminou" });
      continue;
    }
    const p = (data ?? []).find((x: { id: string }) => x.id === m.usuario_id) as
      | {
          livros?: {
            id: string;
            titulo?: string;
            status?: string;
            paginas?: number;
            paginaAtual?: number;
          }[];
        }
      | undefined;
    const meu = (p?.livros ?? []).find(
      (x) => x.id === l.livro.id || chaveLivro(x.titulo ?? "") === chave,
    );
    if (meu?.status === "lido") res.set(m.usuario_id, { estado: "terminou" });
    else if (meu?.status === "lendo" || meu?.paginaAtual) {
      const total = meu.paginas ?? l.livro.paginas;
      res.set(m.usuario_id, {
        estado: meu.paginaAtual ? "lendo" : "nao",
        pct:
          total && meu.paginaAtual
            ? Math.min(100, Math.round((meu.paginaAtual / total) * 100))
            : undefined,
      });
    } else res.set(m.usuario_id, { estado: "nao" });
  }
  return res;
}

/** o banco ainda não tem as colunas novas (falta rodar o social.sql de novo) */
export class FaltaAtualizarBanco extends Error {}
function semColunaNova(e: { code?: string; message?: string }) {
  return e?.code === "PGRST204" ||
    e?.code === "42703" ||
    /fichas_antigas|escolha|schema cache/i.test(e?.message ?? "")
    ? new FaltaAtualizarBanco(e.message)
    : e;
}

/**
 * Um livro que já estava no clube: o importador completa o que faltava
 * (as fichas da revista, a rodada e as datas) em vez de pular.
 */
export async function completarLivroDoClube(
  id: string,
  dados: {
    fichasAntigas?: FichaAntiga[];
    rodada?: number;
    iniciadoEm?: string;
    encerradoEm?: string;
  },
) {
  const mudar: Record<string, unknown> = {};
  if (dados.fichasAntigas?.length) mudar.fichas_antigas = dados.fichasAntigas;
  if (dados.rodada) mudar.rodada = dados.rodada;
  if (dados.iniciadoEm) mudar.iniciado_em = dados.iniciadoEm;
  if (dados.encerradoEm) mudar.encerrado_em = dados.encerradoEm;
  if (!Object.keys(mudar).length) return;
  const { error } = await db().from("clube_livros").update(mudar).eq("id", id);
  if (error) throw semColunaNova(error);
}

const SINCRONIZADOS = "bookside-clube-na-estante";
const chaveLivro = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
let ultimaSincronizacao = 0;

/**
 * O que a pessoa lê no clube aparece na estante e nos números dela:
 * - a leitura da vez entra como "lendo" (se ainda não estiver lá);
 * - um livro que o clube terminou e em que ela escreveu ficha entra como "lido",
 *   com a data em que o clube terminou e a nota da ficha.
 * Cada livro do clube é levado uma vez só: se a pessoa tirar da estante depois, ele não volta.
 */
export async function sincronizarEstanteComClubes(
  estante: {
    livros: { id: string; titulo: string; status?: string; nota?: number }[];
    editar: (
      base: { id: string; titulo: string; autor: string; capa?: string },
      dados: Record<string, unknown>,
    ) => void;
  },
  forcar = false,
) {
  const eu = meuId();
  if (!supabase || !eu) return;
  if (!forcar && Date.now() - ultimaSincronizacao < 60_000) return;
  ultimaSincronizacao = Date.now();

  const { data: minhas } = await db()
    .from("membros")
    .select("clube_id")
    .eq("usuario_id", eu);
  const clubes = (minhas ?? []).map((m) => m.clube_id as string);
  if (!clubes.length) return;
  const [livros, fichas] = await Promise.all([
    db()
      .from("clube_livros")
      .select(CAMPOS_LIVRO)
      .in("clube_id", clubes)
      .in("estado", ["lendo", "lido"]),
    db().from("fichas").select("clube_livro_id,nota,criado_em").eq("autor", eu),
  ]);
  if (livros.error || fichas.error) return;

  let feitos: string[] = [];
  try {
    feitos = JSON.parse(localStorage.getItem(SINCRONIZADOS) ?? "[]");
  } catch {
    /* sem localStorage */
  }
  const minhaFicha = new Map(
    (fichas.data ?? []).map((f) => [f.clube_livro_id as string, f]),
  );
  const novos: string[] = [];

  for (const l of (livros.data ?? []) as LivroDoClube[]) {
    const ficha = minhaFicha.get(l.id);
    const chave = `${l.id}:${l.estado === "lido" && ficha ? "lido" : "lendo"}`;
    if (feitos.includes(chave)) continue;
    // só leva o "lido" de quem escreveu ficha (não dá para saber se as outras terminaram)
    if (l.estado === "lido" && !ficha) continue;
    const meu = estante.livros.find(
      (x) =>
        x.id === l.livro.id ||
        chaveLivro(x.titulo) === chaveLivro(l.livro.titulo),
    );
    const base = {
      id: meu?.id ?? l.livro.id,
      titulo: meu?.titulo ?? l.livro.titulo,
      autor: l.livro.autor,
      capa: l.livro.capa,
    };
    if (l.estado === "lendo") {
      if (!meu || meu.status === "quero")
        estante.editar(base, {
          status: "lendo",
          iniciadoEm: l.iniciado_em ?? new Date().toISOString(),
          paginas: l.livro.paginas,
        });
    } else if (ficha && meu?.status !== "lido") {
      estante.editar(base, {
        status: "lido",
        lidoEm: l.encerrado_em ?? (ficha.criado_em as string),
        nota: meu?.nota ?? (ficha.nota ? Number(ficha.nota) : undefined),
        paginas: l.livro.paginas,
        paginaAtual: l.livro.paginas,
      });
    }
    novos.push(chave);
  }
  if (novos.length)
    try {
      localStorage.setItem(
        SINCRONIZADOS,
        JSON.stringify([...feitos, ...novos].slice(-500)),
      );
    } catch {
      /* sem localStorage */
    }
}

/** Sincroniza a estante com os clubes usando o perfil local (sem publicar no feed: o clube já avisou). */
export function sincronizarMinhaEstante(forcar = false) {
  const estado = usePerfil.getState();
  return sincronizarEstanteComClubes(
    {
      livros: estado.livros,
      editar: (base, dados) =>
        semPublicar(() => usePerfil.getState().editarLivro(base, dados)),
    },
    forcar,
  ).catch(() => {});
}

/** Começa quando a conta e a nuvem estão prontas (o app acabou de abrir). */
export function iniciarSincronizacaoClubes() {
  let tentativas = 0;
  const t = setInterval(() => {
    tentativas++;
    if (nuvemPronta() && meuId()) {
      clearInterval(t);
      void sincronizarMinhaEstante(true);
    } else if (tentativas > 30) clearInterval(t);
  }, 2000);
  return () => clearInterval(t);
}

// ───────── o ano do clube (wrapped e revista) ─────────

export type AnoDoClube = {
  ano: number;
  clube: Clube;
  membros: Membro[];
  /** livros lidos no ano (e a leitura da vez), do mais antigo ao mais novo */
  livros: LivroDoClube[];
  fichas: Ficha[];
  encontros: Encontro[];
  /** o que cada pessoa leu no ano fora do clube (da estante dela) */
  foraDoClube: Map<
    string,
    {
      id: string;
      titulo: string;
      autor: string;
      capa?: string;
      nota?: number;
      lidoEm?: string;
    }[]
  >;
};

export async function anoDoClube(
  clubeId: string,
  ano = new Date().getFullYear(),
): Promise<AnoDoClube | null> {
  const c = await clube(clubeId);
  if (!c) return null;
  const [membros, todos, encontros] = await Promise.all([
    membrosDe(clubeId),
    livrosDoClube(clubeId),
    encontrosDe(clubeId).catch(() => [] as Encontro[]),
  ]);
  const doAno = (iso?: string | null) =>
    !!iso && new Date(iso).getFullYear() === ano;
  const livros = todos
    .filter(
      (l) =>
        (l.estado === "lido" && doAno(l.encerrado_em)) ||
        (l.estado === "lendo" &&
          (doAno(l.iniciado_em) || ano === new Date().getFullYear())),
    )
    .sort((a, b) =>
      (a.encerrado_em ?? a.iniciado_em ?? a.criado_em).localeCompare(
        b.encerrado_em ?? b.iniciado_em ?? b.criado_em,
      ),
    );
  const ids = livros.map((l) => l.id);
  const fichas = ids.length
    ? (((
        await db()
          .from("fichas")
          .select(
            "id,clube_livro_id,autor,notas,nota,personagem,citacao,texto,spoiler,criado_em",
          )
          .in("clube_livro_id", ids)
      ).data ?? []) as Ficha[])
    : [];

  // fora do clube: os lidos do ano na estante de cada uma que não são livros do clube
  const doClube = new Set(todos.map((l) => chaveLivro(l.livro.titulo)));
  const perfis = membros.length
    ? ((
        await db()
          .from("perfis_publicos")
          .select("id,livros:dados->livros")
          .in(
            "id",
            membros.map((m) => m.usuario_id),
          )
      ).data ?? [])
    : [];
  const foraDoClube: AnoDoClube["foraDoClube"] = new Map();
  for (const p of perfis as {
    id: string;
    livros?: {
      id: string;
      titulo: string;
      autor: string;
      capa?: string;
      status?: string;
      nota?: number;
      lidoEm?: string;
    }[];
  }[]) {
    foraDoClube.set(
      p.id,
      (p.livros ?? [])
        .filter(
          (l) =>
            l.status === "lido" &&
            doAno(l.lidoEm) &&
            !doClube.has(chaveLivro(l.titulo ?? "")),
        )
        .sort((a, b) => (a.lidoEm ?? "").localeCompare(b.lidoEm ?? ""))
        .map((l) => ({
          id: l.id,
          titulo: l.titulo,
          autor: l.autor,
          capa: l.capa?.startsWith("data:") ? undefined : l.capa,
          nota: l.nota,
          lidoEm: l.lidoEm,
        })),
    );
  }
  return {
    ano,
    clube: c,
    membros,
    livros,
    // as fichas do app + as antigas (da revista) de quem ainda não escreveu aqui
    fichas: livros.flatMap((l) =>
      fichasComAntigas(
        l,
        fichas.filter((f) => f.clube_livro_id === l.id),
        membros,
      ),
    ),
    encontros: encontros.filter((e) => doAno(e.quando)),
    foraDoClube,
  };
}

export type ClubeDoLivro = {
  clube: Clube;
  livro: LivroDoClube;
  membros: Membro[];
  /** média das fichas do clube para este livro (null = sem fichas) */
  media: number | null;
  avaliacoes: number;
};

/**
 * Os meus clubes que têm este livro (pelo código ou pelo mesmo título),
 * com as fichas e as pessoas — para a página do livro.
 */
export async function clubesComLivro(
  livroId: string,
  titulo: string,
): Promise<ClubeDoLivro[]> {
  const eu = meuId();
  if (!eu) return [];
  const { data: minhas, error } = await db()
    .from("membros")
    .select("clube_id")
    .eq("usuario_id", eu);
  if (error) throw error;
  const ids = (minhas ?? []).map((m) => m.clube_id as string);
  if (!ids.length) return [];
  const chave = (t: string) =>
    t
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const { data: livros, error: e2 } = await db()
    .from("clube_livros")
    .select(CAMPOS_LIVRO)
    .in("clube_id", ids)
    .in("estado", ["lendo", "lido"]);
  if (e2) throw e2;
  const doLivro = ((livros ?? []) as LivroDoClube[]).filter(
    (l) => l.livro.id === livroId || chave(l.livro.titulo) === chave(titulo),
  );
  if (!doLivro.length) return [];
  const saida = await Promise.all(
    doLivro.map(async (l) => {
      const [c, membros, fichas] = await Promise.all([
        clube(l.clube_id),
        membrosDe(l.clube_id),
        fichasDe(l.id).catch(() => [] as Ficha[]),
      ]);
      const notas = fichas.map((f) => f.nota).filter((n): n is number => !!n);
      return c
        ? {
            clube: c,
            livro: l,
            membros,
            media: media(notas),
            avaliacoes: notas.length,
          }
        : null;
    }),
  );
  return saida.filter((x): x is ClubeDoLivro => x !== null);
}
