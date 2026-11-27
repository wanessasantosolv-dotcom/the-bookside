"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TelaAviso } from "@/components/ui/TelaAviso";

/** Quando uma tela quebra: aviso em tela cheia (celular e computador), com tentar de novo. */
export default function ErroGlobal({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  return (
    <TelaAviso
      selo="algo deu errado"
      titulo={offline ? "sem conexão agora." : "uma página ficou pelo caminho."}
      texto={offline ? "confira a internet e tente de novo. nada do que você registrou se perdeu." : "não conseguimos abrir esta tela agora. pode ser um problema nosso: tente de novo daqui a pouco."}
    >
      <button type="button" onClick={reset} className="flex h-12 items-center rounded-[6px] bg-bordo px-6 text-[14px] font-semibold text-creme hover:bg-bordo-suave">
        Tentar de novo
      </button>
      <Link href="/inicio" className="flex h-12 items-center rounded-[6px] border border-bege px-6 text-[14px] font-semibold text-ameixa hover:border-bordo">
        Voltar ao início
      </Link>
    </TelaAviso>
  );
}
