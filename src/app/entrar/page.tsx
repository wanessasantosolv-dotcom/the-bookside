"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Botao } from "@/components/ui/Botao";
import { usePerfil } from "@/lib/perfil-store";

const estrelas = [
  { src: "/brand/logo-estrela-1.png", origem: "10.07% 14.07%", atraso: "0s" },
  { src: "/brand/logo-estrela-2.png", origem: "91.5% 20.1%", atraso: ".9s" },
  { src: "/brand/logo-estrela-3.png", origem: "45.55% 86.6%", atraso: "1.6s" },
  { src: "/brand/logo-estrela-4.png", origem: "64.2% 86.6%", atraso: "2.3s" },
];

const branco = { filter: "brightness(0) invert(1)" };

function LogoAnimada() {
  return (
    <div className="login-logo relative w-[200px]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-base.png" alt="the bookside" width={200} height={104} className="block h-auto w-[200px]" style={branco} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-arco.png" alt="" aria-hidden className="absolute inset-0 h-auto w-[200px] opacity-55" style={branco} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-arco.png" alt="" aria-hidden className="login-arco-luz absolute inset-0 h-auto w-[200px]" style={branco} />
      {estrelas.map((e) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={e.src}
          src={e.src}
          alt=""
          aria-hidden
          className="login-estrela absolute inset-0 h-auto w-[200px]"
          style={{ ...branco, transformOrigin: e.origem, animationDelay: e.atraso }}
        />
      ))}
    </div>
  );
}

const campo =
  "h-12 w-full rounded-sm border border-bege bg-creme-quente px-3.5 text-[15px] text-ameixa placeholder:text-cinza outline-none focus:border-bordo focus:ring-1 focus:ring-bordo";

export default function EntrarPage() {
  const router = useRouter();
  const atualizar = usePerfil((s) => s.atualizar);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function entrar(e: FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErro("confira o e-mail.");
    if (senha.length < 6) return setErro("a senha tem pelo menos 6 caracteres.");
    setErro(null);
    setEnviando(true);
    // TODO(supabase): trocar por supabase.auth.signInWithPassword({ email, password: senha })
    atualizar({ email });
    const concluido = usePerfil.getState().onboardingConcluido;
    router.push(concluido ? "/inicio" : "/criar-perfil/nome");
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-bordo-escuro">
      <section className="flex flex-1 flex-col items-center justify-center pt-10 pb-8">
        <LogoAnimada />
        <p className="login-frase mt-7 text-center font-accent text-[17px] leading-[22px] italic text-rosa-claro">
          a estante ao lado da cama
        </p>
      </section>

      <section className="login-folha rounded-t-[36px] bg-creme px-8 pt-[34px] pb-[max(28px,env(safe-area-inset-bottom))]">
        <h1 className="font-display text-[28px] leading-8 font-semibold italic text-bordo">hi, reader</h1>

        <form onSubmit={entrar} noValidate className="login-campos">
          <label className="mt-[18px] block">
            <span className="eyebrow mb-1.5 block text-bordo">e-mail</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="seu@email.com"
              className={campo}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="mt-3.5 block">
            <span className="eyebrow mb-1.5 block text-bordo">senha</span>
            <input
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={campo}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </label>
          <div className="mt-1 flex min-h-11 items-center justify-between gap-3">
            <p role="alert" className="text-xs font-medium text-bordo-suave">
              {erro}
            </p>
            <Link href="/esqueci-senha" className="shrink-0 py-2 text-xs font-semibold text-bordo">
              esqueci a senha
            </Link>
          </div>
          <Botao type="submit" className="mt-2" disabled={enviando}>
            {enviando ? "entrando…" : "entrar"}
          </Botao>
        </form>

        <p className="mt-4 text-center text-[13px] font-medium text-ameixa">
          ainda não tem conta?{" "}
          <Link href="/criar-conta" className="inline-block py-2 font-bold text-bordo">
            criar conta
          </Link>
        </p>
      </section>
    </main>
  );
}
