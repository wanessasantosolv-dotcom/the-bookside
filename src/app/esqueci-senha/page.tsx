"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { campoConta, ContaShell, rotuloConta } from "@/components/conta/ContaShell";
import { mensagemDeErro, supabase } from "@/lib/supabase";
import { Botao } from "@/components/ui/Botao";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErro("confira o e-mail.");
    setErro(null);
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/nova-senha` });
      if (error) return setErro(mensagemDeErro(error));
    }
    setEnviado(true);
  }

  return (
    <ContaShell
      voltar={{ href: "/entrar", rotulo: "entrar" }}
      titulo={enviado ? "confira seu e-mail" : "esqueceu a senha?"}
      descricao={
        enviado ? (
          <>
            se existir uma conta com <b className="text-ameixa">{email}</b>, o link para criar uma nova senha chega em
            instantes.
          </>
        ) : (
          "sem problema. te mandamos um link pra criar uma nova."
        )
      }
    >
      {enviado ? (
        <Botao variante="contorno" className="mt-[22px]" onClick={() => setEnviado(false)}>
          usar outro e-mail
        </Botao>
      ) : (
        <form onSubmit={enviar} noValidate>
          <label className="mt-[22px] block">
            <span className={rotuloConta}>e-mail</span>
            <input type="email" autoComplete="email" inputMode="email" placeholder="seu@email.com" className={campoConta} value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <p role="alert" className="mt-2 min-h-4 text-xs font-medium text-bordo-suave">
            {erro}
          </p>
          <Botao type="submit" className="mt-2">
            enviar link
          </Botao>
        </form>
      )}
      <p className="mt-4 text-center text-[13px] font-medium">
        lembrou a senha?{" "}
        <Link href="/entrar" className="inline-block py-2 font-bold text-bordo">
          entrar
        </Link>
      </p>
    </ContaShell>
  );
}
