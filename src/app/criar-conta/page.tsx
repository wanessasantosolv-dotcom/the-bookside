"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { campoConta, ContaShell, rotuloConta } from "@/components/conta/ContaShell";
import { Botao } from "@/components/ui/Botao";
import { usePerfil } from "@/lib/perfil-store";
import { mensagemDeErro, supabase } from "@/lib/supabase";
import { carregarPerfil } from "@/lib/nuvem";

export default function CriarContaPage() {
  const router = useRouter();
  const atualizar = usePerfil((s) => s.atualizar);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [aceito, setAceito] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [enviando, setEnviando] = useState(false);

  async function criar(e: FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErro("confira o e-mail.");
    if (senha.length < 8) return setErro("a senha precisa ter pelo menos 8 caracteres.");
    if (senha !== confirmar) return setErro("as senhas não são iguais.");
    if (!aceito) return setErro("é preciso aceitar os termos para continuar.");
    setErro(null);
    if (supabase) {
      setEnviando(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: { emailRedirectTo: `${window.location.origin}/criar-perfil/nome` },
      });
      setEnviando(false);
      if (error) return setErro(mensagemDeErro(error));
      atualizar({ email, onboardingConcluido: false });
      // sem confirmação de e-mail ligada no Supabase, a sessão já vem pronta
      if (data.session) {
        await carregarPerfil(data.session.user);
        return router.push("/criar-perfil/nome");
      }
      return router.push("/confirmar-email");
    }
    atualizar({ email, onboardingConcluido: false });
    router.push("/confirmar-email");
  }

  return (
    <ContaShell
      voltar={{ href: "/entrar", rotulo: "entrar" }}
      titulo="crie sua conta"
      descricao="é rápido — só precisamos do seu e-mail e de uma senha."
    >
      <form onSubmit={criar} noValidate>
        <label className="mt-[22px] block">
          <span className={rotuloConta}>e-mail</span>
          <input type="email" autoComplete="email" inputMode="email" placeholder="seu@email.com" className={campoConta} value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="mt-3.5 block">
          <span className={rotuloConta}>senha</span>
          <input type="password" autoComplete="new-password" placeholder="mínimo 8 caracteres" className={campoConta} value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>
        <label className="mt-3.5 block">
          <span className={rotuloConta}>confirmar senha</span>
          <input type="password" autoComplete="new-password" placeholder="repita a senha" className={campoConta} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
        </label>

        <label className="mt-[18px] flex cursor-pointer items-start gap-2.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordo">
          <input type="checkbox" className="peer sr-only" checked={aceito} onChange={(e) => setAceito(e.target.checked)} />
          <span
            aria-hidden
            className={`mt-px flex size-[19px] flex-none items-center justify-center rounded-[5px] border-[1.5px] text-[11px] font-bold ${
              aceito ? "border-bordo bg-bordo text-creme" : "border-bege text-transparent"
            }`}
          >
            ✓
          </span>
          <span className="text-[13px] leading-[1.4]">
            li e aceito os <span className="font-semibold text-bordo">termos de uso</span> e a{" "}
            <span className="font-semibold text-bordo">política de privacidade</span>
          </span>
        </label>

        <p role="alert" className="mt-3 min-h-4 text-xs font-medium text-bordo-suave">
          {erro}
        </p>
        <Botao type="submit" className="mt-2" disabled={enviando}>
          {enviando ? "criando…" : "criar conta"}
        </Botao>
      </form>
      <p className="mt-4 text-center text-[13px] font-medium">
        já tem conta?{" "}
        <Link href="/entrar" className="inline-block py-2 font-bold text-bordo">
          entrar
        </Link>
      </p>
    </ContaShell>
  );
}
