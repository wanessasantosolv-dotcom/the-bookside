"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/Botao";
import { useTeste } from "@/lib/teste-store";

const estrelas = [
  { c: "left-11 top-[110px] text-ouro text-xs", d: "0s", t: "✦" },
  { c: "right-[52px] top-[140px] text-rosa-claro text-[15px]", d: "1.1s", t: "✧" },
  { c: "left-[70px] bottom-[240px] text-ouro text-[9px]", d: "2s", t: "✦" },
  { c: "right-10 bottom-[260px] text-rosa-claro text-xs", d: "0s", t: "✧" },
  { c: "right-[90px] top-[250px] text-ouro text-[9px]", d: "1.1s", t: "✦" },
];

export default function TesteIntroPage() {
  const router = useRouter();
  const recomecar = useTeste((s) => s.recomecar);

  return (
    <main className="papel-noite relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden px-6 pb-[max(24px,env(safe-area-inset-bottom))] text-creme">
      <header className="pt-[18px]">
        <Link href="/criar-perfil/gostos" className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-rosa-claro">
          ‹ gostos
        </Link>
      </header>
      {estrelas.map((e, i) => (
        <span key={i} aria-hidden className={`estrela-pisca absolute ${e.c}`} style={{ animationDelay: e.d }}>
          {e.t}
        </span>
      ))}

      <section className="flex flex-1 flex-col items-center justify-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-base.png" alt="the bookside" className="w-[200px]" style={{ filter: "brightness(0) invert(1)" }} />
        <h1 className="aparece mt-10 font-accent text-[38px] leading-[1.05] italic text-rosa-claro">what&apos;s your bookside?</h1>
        <p className="aparece mx-5 mt-4 text-sm leading-normal text-bege [animation-delay:.15s]">
          15 perguntas, 8 arquétipos e um universo literário que é só seu.
        </p>
        <span className="washi aparece mt-9 -rotate-2 [animation-delay:.3s]">✧ 2 minutos · sem respostas erradas ✧</span>
      </section>

      <p className="mb-6 text-center">
        <Link
          href="/bem-vinda/clube"
          className="inline-block py-2 font-accent text-[15px] italic text-bege underline decoration-bege underline-offset-4"
        >
          deixar para depois
        </Link>
      </p>
      <Botao
        variante="creme"
        onClick={() => {
          recomecar();
          router.push("/teste/pergunta/1");
        }}
      >
        descobrir meu bookside ✧
      </Botao>
    </main>
  );
}
