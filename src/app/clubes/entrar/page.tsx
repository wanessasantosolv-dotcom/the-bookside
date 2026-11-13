"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState, type ClipboardEvent, type FormEvent, type KeyboardEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { botaoPrincipal, Rodape, TopoForm } from "@/components/clube/Pecas";
import { ComConta, faltaTabela } from "@/components/social/Estados";
import { ConviteInvalido, entrarNoClube } from "@/lib/clubes";

const TAM = 6;
const limpar = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

function Codigo() {
  const router = useRouter();
  const inicial = limpar(useSearchParams().get("codigo") ?? "").slice(0, TAM);
  const [letras, setLetras] = useState<string[]>(Array.from({ length: TAM }, (_, i) => inicial[i] ?? ""));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const caixas = useRef<(HTMLInputElement | null)[]>([]);
  const codigo = letras.join("");

  function preencher(texto: string, de = 0) {
    const c = limpar(texto)
      .slice(0, TAM - de)
      .split("");
    setLetras((l) => l.map((x, i) => (i >= de && i < de + c.length ? c[i - de] : x)));
    caixas.current[Math.min(TAM - 1, de + c.length)]?.focus();
  }

  function tecla(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !letras[i] && i > 0) caixas.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) caixas.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < TAM - 1) caixas.current[i + 1]?.focus();
  }

  async function entrar(e: FormEvent) {
    e.preventDefault();
    if (codigo.length < TAM) return setErro("o código tem 6 caracteres.");
    setEnviando(true);
    setErro(null);
    try {
      const id = await entrarNoClube(codigo);
      if (!id) {
        setErro("não achamos nenhum clube com esse código. confira com quem te convidou.");
        setEnviando(false);
      } else router.push(`/clubes/${id}`);
    } catch (x) {
      setErro(
        x instanceof ConviteInvalido
          ? x.message
          : faltaTabela(x)
            ? "falta criar as tabelas de clubes no Supabase (supabase/social.sql)."
            : "não deu para entrar agora. tente de novo.",
      );
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={entrar} className="flex flex-1 flex-col">
      <fieldset className="mt-8 px-6 lg:px-0">
        <legend className="sr-only">código de convite</legend>
        <div className="flex justify-between gap-2 lg:max-w-[420px]">
          {letras.map((l, i) => (
            <input
              key={i}
              ref={(el) => {
                caixas.current[i] = el;
              }}
              value={l}
              aria-label={`caractere ${i + 1}`}
              inputMode="text"
              autoCapitalize="characters"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={TAM}
              onChange={(e) => {
                let v = limpar(e.target.value);
                // digitou numa caixa já preenchida: fica a letra nova
                if (v.length === 2 && letras[i]) v = v.replace(letras[i], "") || v.slice(-1);
                if (v.length > 1) return preencher(v, i);
                setLetras((x) => x.map((y, k) => (k === i ? v : y)));
                if (v && i < TAM - 1) caixas.current[i + 1]?.focus();
              }}
              onKeyDown={(e) => tecla(i, e)}
              onPaste={(e: ClipboardEvent<HTMLInputElement>) => {
                e.preventDefault();
                preencher(e.clipboardData.getData("text"), 0);
              }}
              className="h-14 w-full max-w-[52px] rounded-md border border-linha bg-creme-quente text-center font-display text-2xl font-semibold text-bordo uppercase outline-none focus:border-bordo"
            />
          ))}
        </div>
      </fieldset>
      <div className="mx-6 mt-6 rounded-md border border-linha bg-creme-quente px-4 py-3 lg:mx-0 lg:max-w-[420px]">
        <p className="text-[10px] font-semibold tracking-[.16em] text-bordo uppercase">dica</p>
        <p className="mt-1 text-[13px] text-cinza">
          o código vem junto com o link de convite. se você abriu o link, ele já aparece preenchido.
        </p>
      </div>
      {erro ? (
        <p role="alert" className="mt-4 px-6 text-[13px] text-bordo lg:px-0">
          {erro}
        </p>
      ) : null}
      <Rodape>
        <button type="submit" disabled={enviando} className={`${botaoPrincipal} lg:max-w-[420px]`}>
          {enviando ? "entrando…" : "entrar no clube"}
        </button>
      </Rodape>
    </form>
  );
}

export default function EntrarNoClubePage() {
  return (
    <AppShell aba="clubes">
      <div className="flex flex-1 flex-col lg:bg-jornal lg:px-12 lg:py-8">
        <TopoForm
          voltar={{ href: "/clubes", r: "clubes" }}
          rotulo="entrar com código"
          titulo="tem um código?"
          frase="cole o convite de 6 caracteres que alguém te mandou."
        />
        <ComConta>
          <Suspense>
            <Codigo />
          </Suspense>
        </ComConta>
      </div>
    </AppShell>
  );
}
