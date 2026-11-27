import type { ReactNode } from "react";

/**
 * Telas de aviso (erro, página não encontrada): ocupam a janela inteira em
 * qualquer tamanho, com o conteúdo centralizado (sem a moldura de celular).
 */
export function TelaAviso({ selo, titulo, texto, children }: { selo: string; titulo: string; texto: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-creme px-6 py-12 text-ameixa">
      <div className="w-full max-w-[520px] text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/simbolo-rosa.png" alt="" className="mx-auto h-10 w-auto" />
        <p className="mt-6 text-[12px] font-semibold text-bordo">{selo}</p>
        <h1 className="mt-2 font-revista text-[34px] leading-[1.1] text-bordo italic sm:text-[44px]">{titulo}</h1>
        <p className="mx-auto mt-3 max-w-[40ch] text-[15px] text-tinta-suave">{texto}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">{children}</div>
      </div>
    </main>
  );
}
