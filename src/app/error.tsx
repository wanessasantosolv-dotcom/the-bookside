"use client";

import { useEffect } from "react";
import { Erro } from "@/components/social/Estados";
import { Tela } from "@/components/ui/Tela";

/** Quando uma tela quebra: "não carregou" (ou "sem conexão") com tentar de novo. */
export default function ErroGlobal({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <Tela className="justify-center px-0 py-12">
      <p className="px-6 text-[11px] font-semibold tracking-[.16em] text-bordo uppercase">algo deu errado</p>
      <h1 className="mt-2 px-6 font-display text-[32px] font-semibold italic text-bordo">quando falha</h1>
      <Erro onTentar={reset} />
    </Tela>
  );
}
