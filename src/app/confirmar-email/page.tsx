"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ContaShell } from "@/components/conta/ContaShell";
import { Botao } from "@/components/ui/Botao";
import { usePerfil } from "@/lib/perfil-store";
import { mensagemDeErro, supabase } from "@/lib/supabase";
import { carregarPerfil } from "@/lib/nuvem";

const DIGITOS = 6;

export default function ConfirmarEmailPage() {
  const router = useRouter();
  const email = usePerfil((s) => s.email);
  const [codigo, setCodigo] = useState<string[]>(Array(DIGITOS).fill(""));
  const [aviso, setAviso] = useState<string | null>(null);
  const caixas = useRef<(HTMLInputElement | null)[]>([]);
  const completo = codigo.every((d) => d !== "");

  function digitar(i: number, valor: string) {
    const limpos = valor.replace(/\D/g, "");
    if (!limpos) {
      setCodigo((c) => c.map((d, j) => (j === i ? "" : d)));
      return;
    }
    // aceita colar o código inteiro
    setCodigo((c) => {
      const novo = [...c];
      limpos.split("").forEach((d, k) => {
        if (i + k < DIGITOS) novo[i + k] = d;
      });
      return novo;
    });
    caixas.current[Math.min(i + limpos.length, DIGITOS - 1)]?.focus();
  }

  return (
    <ContaShell eyebrow="quase lá"
      voltar={{ href: "/criar-conta", rotulo: "criar conta" }}
      titulo="confirme seu e-mail"
      descricao={
        <>
          enviamos um e-mail para <b className="text-ameixa">{email ?? "seu@email.com"}</b>. toque no link de confirmação — ou, se
          vier um código de 6 dígitos, digite aqui.
        </>
      }
    >
      <fieldset className="mt-[26px] flex justify-between gap-1.5">
        <legend className="sr-only">código de confirmação</legend>
        {codigo.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              caixas.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`dígito ${i + 1}`}
            onChange={(e) => digitar(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !d && i > 0) caixas.current[i - 1]?.focus();
            }}
            className={`h-[54px] w-11 rounded-[8px] bg-creme-quente text-center text-[22px] font-semibold text-ameixa outline-none focus:border-[1.5px] focus:border-bordo ${
              d ? "border-[1.5px] border-bordo" : "border border-bege"
            }`}
          />
        ))}
      </fieldset>
      <p className="mt-4 text-center text-[13px] font-medium text-cinza">
        não chegou?{" "}
        <button type="button" onClick={async () => {
            if (supabase && email) {
              const { error } = await supabase.auth.resend({ type: "signup", email });
              if (error) return setAviso(mensagemDeErro(error));
            }
            setAviso("enviamos um novo código ✦");
          }} className="py-2 font-bold text-bordo">
          reenviar código
        </button>
      </p>
      <p role="status" className="min-h-4 text-center text-xs text-bordo">
        {aviso}
      </p>
      <Botao
        className="mt-3"
        disabled={!completo}
        onClick={async () => {
          if (supabase && email) {
            const { data, error } = await supabase.auth.verifyOtp({ email, token: codigo.join(""), type: "email" });
            if (error || !data.user) return setAviso(mensagemDeErro(error));
            await carregarPerfil(data.user);
          }
          router.push("/criar-perfil/nome");
        }}
      >
        confirmar
      </Botao>
    </ContaShell>
  );
}
