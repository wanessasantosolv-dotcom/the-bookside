"use client";

import type { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { perfilInicial, usePerfil, type Perfil } from "@/lib/perfil-store";
import { supabase } from "@/lib/supabase";

/**
 * Sincronização do perfil com o Supabase.
 * O app continua lendo e escrevendo no store local (rápido e funciona offline);
 * com uma conta, cada mudança é copiada para a tabela `perfis` (campo `dados`).
 */

export type EstadoNuvem = "desligada" | "sem-conta" | "carregando" | "salvando" | "salvo" | "erro";

type Nuvem = { estado: EstadoNuvem; usuario: User | null; erro: string | null };
export const useNuvem = create<Nuvem>(() => ({
  estado: supabase ? "carregando" : "desligada",
  usuario: null,
  erro: null,
}));

const CAMPOS = Object.keys(perfilInicial).filter((k) => k !== "email") as (keyof Perfil)[];

function dadosDoStore(): Partial<Perfil> {
  const s = usePerfil.getState();
  return Object.fromEntries(CAMPOS.map((k) => [k, s[k]])) as Partial<Perfil>;
}

let carregado = false;
/** o app está aplicando o perfil que veio da nuvem (não é mudança da pessoa) */
let aplicandoNuvem = false;

/**
 * Mudanças feitas aqui que ainda não chegaram à nuvem (ex.: trocou a capa e
 * fechou o app antes de salvar). Assim, ao abrir de novo, a versão antiga da
 * nuvem não passa por cima do que a pessoa acabou de escolher.
 */
const PENDENTE = "bookside-perfil-pendente";
function marcarPendente(usuarioId: string | null) {
  try {
    localStorage.setItem(
      PENDENTE,
      JSON.stringify({ usuario: usuarioId, em: new Date().toISOString() }),
    );
  } catch {
    /* sem armazenamento: segue sem a proteção */
  }
}
function pendente(): { usuario: string | null; em: string } | null {
  try {
    return JSON.parse(localStorage.getItem(PENDENTE) ?? "null");
  } catch {
    return null;
  }
}
function limparPendente(desde: string) {
  try {
    // só limpa se nada mudou enquanto salvava
    if (pendente()?.em === desde) localStorage.removeItem(PENDENTE);
  } catch {
    /* nada */
  }
}

/** O perfil da nuvem já foi carregado (antes disso, mudanças no store não são da pessoa). */
export function nuvemPronta() {
  return carregado;
}

/** Copia o perfil local para a nuvem. */
export async function salvarPerfil(id: string) {
  if (!supabase) return;
  useNuvem.setState({ estado: "salvando" });
  const marcado = pendente()?.em;
  const s = usePerfil.getState();
  const { error } = await supabase.from("perfis").upsert({
    id,
    usuario: s.usuario || null,
    nome: s.nome || null,
    dados: dadosDoStore(),
    atualizado_em: new Date().toISOString(),
  });
  if (error) {
    const msg =
      error.code === "23505"
        ? "esse @usuário já está em uso. troque em editar perfil."
        : "não conseguimos salvar na nuvem agora.";
    useNuvem.setState({ estado: "erro", erro: msg });
  } else {
    if (marcado) limparPendente(marcado);
    useNuvem.setState({ estado: "salvo", erro: null });
  }
}

/**
 * Depois do login: se já existe perfil na nuvem, ele vale (troca o local);
 * se não existe (conta nova), o que já foi preenchido no navegador sobe.
 */
export async function carregarPerfil(user: User): Promise<Perfil> {
  if (!supabase) return usePerfil.getState();
  useNuvem.setState({ estado: "carregando", usuario: user });
  const { data, error } = await supabase
    .from("perfis")
    .select("dados,atualizado_em")
    .eq("id", user.id)
    .maybeSingle();
  const local = pendente();
  const localMaisNovo =
    !!local &&
    (local.usuario === user.id || local.usuario === null) &&
    (!data?.atualizado_em || local.em > data.atualizado_em);
  if (error) {
    useNuvem.setState({ estado: "erro", erro: "não conseguimos abrir seu perfil na nuvem." });
  } else if (data?.dados && Object.keys(data.dados).length && localMaisNovo) {
    // o que está aqui é mais novo que a nuvem (não tinha dado tempo de salvar): sobe
    usePerfil.setState({ email: user.email ?? null });
    carregado = true;
    await salvarPerfil(user.id);
  } else if (data?.dados && Object.keys(data.dados).length) {
    aplicandoNuvem = true;
    usePerfil.setState({ ...perfilInicial, ...(data.dados as Partial<Perfil>), email: user.email ?? null });
    aplicandoNuvem = false;
    useNuvem.setState({ estado: "salvo" });
  } else {
    // conta nova (por e-mail, Google ou Apple): aproveita o nome que veio do login
    const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
    const nomeDoLogin = (meta?.full_name || meta?.name || "").split(" ")[0]?.toLowerCase();
    usePerfil.setState((s) => ({ email: user.email ?? null, nome: s.nome || nomeDoLogin || "" }));
    await salvarPerfil(user.id);
  }
  carregado = true;
  return usePerfil.getState();
}

export async function sairDaConta() {
  carregado = false;
  try {
    localStorage.removeItem(PENDENTE);
  } catch {
    /* nada */
  }
  if (supabase) await supabase.auth.signOut();
  usePerfil.getState().sair();
  useNuvem.setState({ estado: supabase ? "sem-conta" : "desligada", usuario: null, erro: null });
}

/** Liga a sincronização (chamado uma vez, no layout). Devolve a função de desligar. */
export function iniciarNuvem() {
  if (!supabase) return () => {};
  let espera: ReturnType<typeof setTimeout> | undefined;

  supabase.auth.getSession().then(({ data }) => {
    if (data.session) void carregarPerfil(data.session.user);
    else useNuvem.setState({ estado: "sem-conta" });
  });

  const { data: assinatura } = supabase.auth.onAuthStateChange((evento, sessao) => {
    if (evento === "SIGNED_OUT") {
      carregado = false;
      useNuvem.setState({ estado: "sem-conta", usuario: null });
    } else if (sessao) {
      useNuvem.setState({ usuario: sessao.user });
    }
  });

  const pararStore = usePerfil.subscribe((novo, antigo) => {
    if (aplicandoNuvem) return;
    // só o que a nuvem guarda conta como mudança (ex.: não o e-mail)
    if (CAMPOS.every((k) => novo[k] === antigo[k])) return;
    const usuario = useNuvem.getState().usuario;
    if (!carregado || !usuario) return;
    marcarPendente(usuario.id);
    clearTimeout(espera);
    espera = setTimeout(() => void salvarPerfil(usuario.id), 1200);
  });

  // a internet voltou: manda o que mudou enquanto estava sem conexão
  const voltou = () => {
    const usuario = useNuvem.getState().usuario;
    if (carregado && usuario) void salvarPerfil(usuario.id);
  };
  window.addEventListener("online", voltou);

  return () => {
    clearTimeout(espera);
    assinatura.subscription.unsubscribe();
    pararStore();
    window.removeEventListener("online", voltou);
  };
}
