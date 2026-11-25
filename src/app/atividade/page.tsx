"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { FeedCompleto } from "@/components/feed/FeedCompleto";
import { Publicar } from "@/components/feed/Publicar";
import { ComConta } from "@/components/social/Estados";
import { Voltar } from "@/components/Voltar";

/** todas as atividades de quem você segue, com o publicar (o início mostra só as mais recentes) */
export default function AtividadesPage() {
  const [versao, setVersao] = useState(0);
  useEffect(() => {
    if (window.location.hash === "#publicar")
      document.getElementById("publicar")?.scrollIntoView({ block: "center" });
  }, []);
  return (
    <AppShell aba="inicio">
      <div className="mx-auto flex w-full max-w-[760px] flex-1 flex-col pb-10 lg:px-12 lg:py-8">
        <header className="flex items-center justify-between px-5 pt-2 lg:px-0 lg:pt-0">
          <Voltar padrao="/inicio" rotulo="início" className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo" />
        </header>
        <h1 className="mt-2 px-5 font-revista text-[30px] leading-none text-bordo italic lg:px-0 lg:text-[38px]">entre leitores</h1>
        <p className="mt-2 mb-6 px-5 text-[14px] text-tinta-suave lg:px-0">o que as pessoas que você segue andam lendo.</p>
        <ComConta>
          <div id="publicar" className="mx-5 mb-5 lg:mx-0">
            <Publicar onPublicado={() => setVersao((v) => v + 1)} />
          </div>
          <FeedCompleto key={versao} />
        </ComConta>
      </div>
    </AppShell>
  );
}
