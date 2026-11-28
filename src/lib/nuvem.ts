"use client";

import type { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { perfilInicial, usePerfil, type Perfil } from "@/lib/perfil-store";
import { mesclarPerfis } from "@/lib/mesclar";
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
let revisaoCarga = 0;
/** o app está aplicando o perfil que veio da nuvem (não é mudança da pessoa) */
let aplicandoNuvem = false;

/**
 * Mudanças feitas aqui que ainda não chegaram à nuvem (quais campos e quando).
 * Assim, ao abrir de novo ou ao outro aparelho salvar, nada daqui se perde e
 * nada de lá é atropelado: os dois são juntados (ver mesclar.ts).
 */
const PENDENTE = "bookside-perfil-pendente";
const DONO = "bookside-perfil-dono";

function donoLocal() {
  try {
    return localStorage.getItem(DONO) ?? pendente()?.usuario ?? null;
  } catch {
    return null;
  }
}

function vincularPerfil(id: string) {
  try {
    localStorage.setItem(DONO, id);
  } catch {
    /* armazenamento indisponível */
  }
}

const contaAtual = (id: string) => useNuvem.getState().usuario?.id === id;
type Pendente = { usuario: string | null; em: string; campos: string[] };
function pendente(): Pendente | null {
  try {
    const p = JSON.parse(localStorage.getItem(PENDENTE) ?? "null");
    return p ? { campos: [], ...p } : null;
  } catch {
    return null;
  }
}
function marcarPendente(usuarioId: string | null, campos: string[]) {
  try {
    const antes = pendente();
    localStorage.setItem(
      PENDENTE,
      JSON.stringify({
        usuario: usuarioId,
        em: new Date().toISOString(),
        campos: [...new Set([...(antes?.campos ?? []), ...campos])],
      }),
    );
  } catch {
    /* sem armazenamento: segue sem a proteção */
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

/** a versão da nuvem que este aparelho viu por último */
let ultimaVersao: string | null = null;

/** O perfil da nuvem já foi carregado (antes disso, mudanças no store não são da pessoa). */
export function nuvemPronta() {
  return carregado;
}

function aplicar(dados: Partial<Perfil>) {
  aplicandoNuvem = true;
  try {
    usePerfil.setState(dados);
  } finally {
    aplicandoNuvem = false;
  }
}

/** junta a versão da nuvem com as mudanças daqui (se outro aparelho salvou no meio tempo) */
function juntarCom(remoto: Partial<Perfil>) {
  const p = pendente();
  const mudados = new Set(p?.campos ?? []);
  aplicar(mesclarPerfis(remoto, dadosDoStore(), mudados, CAMPOS));
}

/** Copia o perfil local para a nuvem (juntando antes, se outro aparelho mudou algo). */
let salvando: Promise<void> | null = null;
export async function salvarPerfil(id: string) {
  if (!supabase) return;
  // um salvamento de cada vez
  while (salvando) await salvando;
  if (!contaAtual(id) || (donoLocal() && donoLocal() !== id)) return;
  let fim!: () => void;
  salvando = new Promise((ok) => (fim = ok));
  try {
    useNuvem.setState({ estado: "salvando" });
    const marcado = pendente()?.em;
    const { data: atual, error: erroLeitura } = await supabase
      .from("perfis")
      .select("dados,atualizado_em")
      .eq("id", id)
      .maybeSingle();
    if (!contaAtual(id)) return;
    if (erroLeitura) {
      useNuvem.setState({ estado: "erro", erro: "não conseguimos conferir a versão na nuvem." });
      return;
    }
    if (
      atual?.dados &&
      Object.keys(atual.dados).length &&
      atual.atualizado_em !== ultimaVersao
    )
      juntarCom(atual.dados as Partial<Perfil>);
    const s = usePerfil.getState();
    const agora = new Date().toISOString();
    const perfil = {
      id,
      usuario: s.usuario || null,
      nome: s.nome || null,
      dados: dadosDoStore(),
      atualizado_em: agora,
    };
    const tabela = supabase.from("perfis");
    const { data: gravado, error } = atual
      ? await tabela.update(perfil).eq("id", id).eq("atualizado_em", atual.atualizado_em).select("id").maybeSingle()
      : await tabela.insert(perfil).select("id").maybeSingle();
    if (!contaAtual(id)) return;
    if (!error && !gravado) {
      useNuvem.setState({ estado: "erro", erro: "o perfil mudou em outro aparelho. vamos tentar sincronizar novamente." });
      return;
    }
    if (error) {
      const msg =
        error.code === "23505"
          ? "esse @usuário já está em uso. troque em editar perfil."
          : "não conseguimos salvar na nuvem agora.";
      useNuvem.setState({ estado: "erro", erro: msg });
    } else {
      ultimaVersao = agora;
      if (marcado) limparPendente(marcado);
      useNuvem.setState({ estado: "salvo", erro: null });
    }
  } finally {
    salvando = null;
    fim();
  }
}

/**
 * Traz o que outro aparelho salvou (ao voltar para o app, ao focar a janela e
 * de tempos em tempos). Com mudanças daqui ainda não salvas, junta e salva.
 */
export async function buscarDaNuvem() {
  const usuario = useNuvem.getState().usuario;
  if (!supabase || !carregado || !usuario || salvando) return;
  const { data } = await supabase
    .from("perfis")
    .select("dados,atualizado_em")
    .eq("id", usuario.id)
    .maybeSingle();
  if (!contaAtual(usuario.id) || salvando) return;
  const local = pendente();
  if (local && (local.usuario === usuario.id || local.usuario === null)) return salvarPerfil(usuario.id);
  if (!data?.dados || data.atualizado_em === ultimaVersao) return;
  aplicar(mesclarPerfis(data.dados as Partial<Perfil>, dadosDoStore(), new Set(), CAMPOS));
  ultimaVersao = data.atualizado_em;
}

/**
 * Depois do login: junta o perfil da nuvem com o que houver aqui ainda não salvo;
 * conta nova: o que já foi preenchido no navegador sobe.
 */
export async function carregarPerfil(user: User): Promise<Perfil> {
  if (!supabase) return usePerfil.getState();
  const revisao = ++revisaoCarga;
  carregado = false;
  ultimaVersao = null;
  useNuvem.setState({ estado: "carregando", usuario: user, erro: null });
  const dono = donoLocal();
  if (dono && dono !== user.id) {
    try {
      const local = pendente();
      if (local) localStorage.setItem(`bookside-perfil-anterior-${dono}`, JSON.stringify({
        dados: dadosDoStore(), pendente: local,
      }));
      localStorage.removeItem(PENDENTE);
    } catch {
      useNuvem.setState({ estado: "erro", erro: "não conseguimos preservar o perfil anterior neste navegador." });
      return usePerfil.getState();
    }
    aplicar({ ...perfilInicial });
  }
  vincularPerfil(user.id);
  try {
    const chave = `bookside-perfil-anterior-${user.id}`;
    const copia = JSON.parse(localStorage.getItem(chave) ?? "null");
    if (copia) {
      aplicar({ ...perfilInicial, ...copia.dados });
      if (copia.pendente) localStorage.setItem(PENDENTE, JSON.stringify(copia.pendente));
      localStorage.removeItem(chave);
    }
  } catch {
    /* a sincronização pode continuar com o estado atual */
  }
  const { data, error } = await supabase
    .from("perfis")
    .select("dados,atualizado_em")
    .eq("id", user.id)
    .maybeSingle();
  if (!contaAtual(user.id) || revisao !== revisaoCarga) return usePerfil.getState();
  const local = pendente();
  const tenhoMudancas = !!local && (local.usuario === user.id || local.usuario === null);
  if (error) {
    useNuvem.setState({ estado: "erro", erro: "não conseguimos abrir seu perfil na nuvem." });
    return usePerfil.getState();
  } else if (data?.dados && Object.keys(data.dados).length) {
    const remoto = { ...perfilInicial, ...(data.dados as Partial<Perfil>) };
    if (tenhoMudancas) {
      // mudanças daqui que não tinham subido: junta com a nuvem e sobe
      aplicar({
        ...mesclarPerfis(remoto, dadosDoStore(), new Set(local!.campos), CAMPOS),
        email: user.email ?? null,
      });
      ultimaVersao = data.atualizado_em;
      carregado = true;
      await salvarPerfil(user.id);
    } else {
      aplicar({ ...remoto, email: user.email ?? null });
      ultimaVersao = data.atualizado_em;
      useNuvem.setState({ estado: "salvo" });
    }
  } else {
    // conta nova (por e-mail, Google ou Apple): aproveita o nome que veio do login
    const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
    const nomeDoLogin = (meta?.full_name || meta?.name || "").split(" ")[0]?.toLowerCase();
    usePerfil.setState((s) => ({ email: user.email ?? null, nome: s.nome || nomeDoLogin || "" }));
    await salvarPerfil(user.id);
  }
  if (contaAtual(user.id) && revisao === revisaoCarga) carregado = true;
  return usePerfil.getState();
}

function limparSessaoLocal() {
  carregado = false;
  ultimaVersao = null;
  revisaoCarga++;
  const dono = donoLocal();
  const local = pendente();
  try {
    if (dono && local) {
      localStorage.setItem(`bookside-perfil-anterior-${dono}`, JSON.stringify({
        dados: dadosDoStore(), pendente: local,
      }));
    }
    localStorage.removeItem(PENDENTE);
    localStorage.removeItem(DONO);
    aplicar({ ...perfilInicial });
  } catch {
    // Mantém a cópia local pendente quando não há espaço para arquivá-la.
    useNuvem.setState({ estado: "erro", usuario: null, erro: "não conseguimos arquivar as mudanças deste navegador." });
    return;
  }
  useNuvem.setState({ estado: supabase ? "sem-conta" : "desligada", usuario: null, erro: null });
}

export async function sairDaConta() {
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      useNuvem.setState({ estado: "erro", erro: "não conseguimos encerrar sua sessão agora." });
      return;
    }
  }
  if (useNuvem.getState().usuario || !supabase) limparSessaoLocal();
}

/** Liga a sincronização (chamado uma vez, no layout). Devolve a função de desligar. */
export function iniciarNuvem() {
  if (!supabase) return () => {};
  let espera: ReturnType<typeof setTimeout> | undefined;
  let novaSessao: ReturnType<typeof setTimeout> | undefined;
  let ativo = true;

  supabase.auth.getSession().then(({ data }) => {
    if (!ativo) return;
    if (data.session && !contaAtual(data.session.user.id)) void carregarPerfil(data.session.user);
    else if (!data.session && !useNuvem.getState().usuario) useNuvem.setState({ estado: "sem-conta" });
  });

  const { data: assinatura } = supabase.auth.onAuthStateChange((evento, sessao) => {
    if (evento === "SIGNED_OUT") {
      clearTimeout(espera);
      clearTimeout(novaSessao);
      limparSessaoLocal();
    } else if (sessao && contaAtual(sessao.user.id)) {
      useNuvem.setState({ usuario: sessao.user });
    } else if (sessao && evento === "SIGNED_IN") {
      // Fora do callback do Supabase: a leitura do perfil também usa a sessão.
      clearTimeout(novaSessao);
      novaSessao = setTimeout(() => {
        if (useNuvem.getState().usuario?.id !== sessao.user.id) void carregarPerfil(sessao.user);
      }, 0);
    }
  });

  const pararStore = usePerfil.subscribe((novo, antigo) => {
    if (aplicandoNuvem) return;
    // só o que a nuvem guarda conta como mudança (ex.: não o e-mail)
    const mudados = CAMPOS.filter((k) => novo[k] !== antigo[k]);
    if (!mudados.length) return;
    const usuario = useNuvem.getState().usuario;
    if (!carregado || !usuario) return;
    marcarPendente(usuario.id, mudados);
    clearTimeout(espera);
    espera = setTimeout(() => void salvarPerfil(usuario.id), 1200);
  });

  // a internet voltou: manda o que mudou enquanto estava sem conexão
  const voltou = () => {
    const usuario = useNuvem.getState().usuario;
    if (carregado && usuario) void salvarPerfil(usuario.id);
  };
  window.addEventListener("online", voltou);

  // voltou para o app / para a aba: traz o que mudou no outro aparelho
  const visivel = () => {
    if (document.visibilityState === "visible") void buscarDaNuvem();
  };
  document.addEventListener("visibilitychange", visivel);
  window.addEventListener("focus", visivel);
  const periodico = setInterval(visivel, 45000);

  return () => {
    ativo = false;
    clearTimeout(novaSessao);
    document.removeEventListener("visibilitychange", visivel);
    window.removeEventListener("focus", visivel);
    clearInterval(periodico);
    clearTimeout(espera);
    assinatura.subscription.unsubscribe();
    pararStore();
    window.removeEventListener("online", voltou);
  };
}
