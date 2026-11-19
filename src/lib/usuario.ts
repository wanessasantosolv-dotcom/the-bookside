"use client";

import { supabase } from "@/lib/supabase";

/**
 * O @ da pessoa: serve para entrar no app, ser encontrada pelos amigos e é o
 * endereço do perfil (/u/usuario).
 * Regras: 3 a 24 caracteres; letras minúsculas, números, ponto e sublinhado;
 * começa e termina com letra ou número; sem ".." (as mesmas do banco).
 */
export const LIMITE_USUARIO = 24;

/** enquanto a pessoa digita: tira acento e o que não vale, sem apagar o ponto do fim (ela pode estar no meio) */
export function limparDigitando(t: string) {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9._]/g, "")
    .replace(/\.{2,}/g, ".")
    .slice(0, LIMITE_USUARIO);
}

export function usuarioValido(u: string) {
  return /^[a-z0-9][a-z0-9._]{1,22}[a-z0-9]$/.test(u) && !u.includes("..");
}

export type SituacaoUsuario =
  | "ok"
  | "invalido"
  | "reservado"
  | "em_uso"
  | "verificando"
  | "sem_internet";

/** pergunta ao banco se o @ está livre (o seu atual conta como livre) */
export async function situacaoDoUsuario(u: string): Promise<SituacaoUsuario> {
  if (!usuarioValido(u)) return "invalido";
  if (!supabase) return "ok";
  const { data, error } = await supabase.rpc("usuario_disponivel", {
    p_usuario: u,
  });
  // banco ainda sem a função (falta rodar o social.sql): não trava a pessoa
  if (error) return error.code === "PGRST202" ? "ok" : "sem_internet";
  return data as SituacaoUsuario;
}

/** outras ideias quando o @ já está em uso */
export function ideiasDeUsuario(u: string, nome: string) {
  const base = (usuarioValido(u) ? u : limparDigitando(nome)).replace(/[._]+$/, "");
  const ano = new Date().getFullYear() % 100;
  return [
    `${base}.le`,
    `${base}.livros`,
    `${base}${ano}`,
    `le.${base}`,
    `${base}_`,
  ]
    .map((x) => x.replace(/_$/, `_${Math.floor(Math.random() * 90 + 10)}`))
    .filter((x) => usuarioValido(x))
    .slice(0, 4);
}

export const textoDaSituacao: Record<SituacaoUsuario, string> = {
  ok: "✓ disponível",
  invalido:
    "use de 3 a 24 letras, números, ponto ou sublinhado (começando e terminando com letra ou número).",
  reservado: "esse @ é reservado. escolha outro.",
  em_uso: "esse @ já é de outra pessoa.",
  verificando: "conferindo…",
  sem_internet: "não deu para conferir agora (sem internet?).",
};
