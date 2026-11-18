"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Provedor = "google" | "apple";

/**
 * "continuar com Google / Apple". Só mostra os botões das formas de login
 * que estão ativadas no Supabase (Authentication → Providers), para nunca
 * levar a pessoa a uma página de erro.
 */
export function LoginSocial({ texto = "continuar" }: { texto?: string }) {
  const [ativos, setAtivos] = useState<Provedor[]>([]);
  const [indo, setIndo] = useState<Provedor | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabase || !url || !chave) return;
    fetch(`${url}/auth/v1/settings`, { headers: { apikey: chave } })
      .then((r) => r.json())
      .then((s: { external?: Record<string, boolean> }) =>
        setAtivos((["apple", "google"] as Provedor[]).filter((p) => s.external?.[p])),
      )
      .catch(() => setAtivos([]));
  }, []);

  if (!ativos.length) return null;

  async function entrar(provider: Provedor) {
    if (!supabase) return;
    setIndo(provider);
    setErro(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/entrar/retorno` },
    });
    if (error) {
      setErro("não deu para abrir o login agora. tente de novo.");
      setIndo(null);
    }
  }

  const botao =
    "flex min-h-12 w-full items-center justify-center gap-2.5 rounded-pill border text-[15px] font-semibold transition-colors disabled:opacity-60";
  return (
    <div className="mt-5">
      <div className="flex items-center gap-3 text-[11px] text-cinza">
        <span className="h-px flex-1 bg-linha" />
        ou
        <span className="h-px flex-1 bg-linha" />
      </div>
      <div className="mt-4 space-y-2.5">
        {ativos.includes("apple") ? (
          <button
            type="button"
            onClick={() => entrar("apple")}
            disabled={!!indo}
            className={`${botao} border-ameixa bg-ameixa text-creme`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M16.37 12.6c-.02-2.3 1.88-3.4 1.96-3.45-1.07-1.56-2.73-1.78-3.32-1.8-1.41-.14-2.76.83-3.48.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.27-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.42-3.65zM14.1 5.86c.63-.77 1.06-1.83.94-2.89-.91.04-2.01.61-2.66 1.37-.58.67-1.09 1.76-.96 2.8 1.02.08 2.05-.52 2.68-1.28z" />
            </svg>
            {indo === "apple" ? "abrindo…" : `${texto} com Apple`}
          </button>
        ) : null}
        {ativos.includes("google") ? (
          <button
            type="button"
            onClick={() => entrar("google")}
            disabled={!!indo}
            className={`${botao} border-bege bg-creme-quente text-ameixa hover:border-bordo`}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="#4285F4"
                d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h5.9a5.05 5.05 0 0 1-2.19 3.31v2.75h3.54c2.07-1.91 3.25-4.72 3.25-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.96 0 5.45-.98 7.26-2.65l-3.54-2.75c-.98.66-2.24 1.05-3.72 1.05-2.86 0-5.28-1.93-6.15-4.52H2.2v2.84A10.99 10.99 0 0 0 12 23z"
              />
              <path fill="#FBBC05" d="M5.85 14.13a6.6 6.6 0 0 1 0-4.26V7.03H2.2a11 11 0 0 0 0 9.94l3.65-2.84z" />
              <path
                fill="#EA4335"
                d="M12 5.35c1.61 0 3.06.55 4.2 1.64l3.14-3.14C17.45 2.09 14.96 1 12 1A10.99 10.99 0 0 0 2.2 7.03l3.65 2.84C6.72 7.28 9.14 5.35 12 5.35z"
              />
            </svg>
            {indo === "google" ? "abrindo…" : `${texto} com Google`}
          </button>
        ) : null}
      </div>
      {erro ? (
        <p role="alert" className="mt-2 text-center text-xs text-bordo">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
