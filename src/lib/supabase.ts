"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente do Supabase. Só existe quando as variáveis estão configuradas
 * (na Vercel ou no .env.local). Sem elas o app funciona no "modo local",
 * guardando tudo só no navegador.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && chave ? createClient(url, chave, { auth: { persistSession: true, autoRefreshToken: true } }) : null;

export const nuvemAtiva = supabase !== null;

/** Traduz os erros mais comuns do Supabase Auth. */
export function mensagemDeErro(e: unknown): string {
  const msg = (e as { message?: string })?.message?.toLowerCase() ?? "";
  if (msg.includes("invalid login credentials")) return "e-mail ou senha incorretos.";
  if (msg.includes("email not confirmed")) return "confirme seu e-mail antes de entrar.";
  if (msg.includes("already registered") || msg.includes("already been registered")) return "já existe uma conta com esse e-mail.";
  if (msg.includes("token has expired") || msg.includes("invalid") && msg.includes("otp")) return "código inválido ou expirado.";
  if (msg.includes("rate limit") || msg.includes("too many")) return "muitas tentativas. espere um pouco e tente de novo.";
  if (msg.includes("password should be")) return "a senha precisa ter pelo menos 8 caracteres.";
  if (msg.includes("failed to fetch") || msg.includes("network")) return "sem conexão. confira sua internet.";
  return "algo deu errado. tente de novo.";
}
