import Link from "next/link";
import type { ReactNode } from "react";

/** Página "envelope": fundo rosa listrado, aba, carta de papel e lacre de cera. */
export function Carta({
  voltar,
  rotulo,
  children,
  rodape,
}: {
  voltar: { href: string; rotulo: string };
  rotulo: string;
  children: ReactNode;
  rodape: ReactNode;
}) {
  return (
    <main className="envelope relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden text-ameixa">
      <div aria-hidden className="envelope-aba absolute inset-x-0 top-0 h-[148px]" />
      <header className="relative z-10 flex items-center justify-between px-6 pt-[18px]">
        <Link href={voltar.href} className="-ml-2 flex min-h-11 items-center px-2 text-xs font-semibold text-[#FFF1F3]">
          ‹ {voltar.rotulo}
        </Link>
        <span className="text-[11px] font-semibold tracking-[.14em] text-[#FFF1F3] uppercase">{rotulo}</span>
      </header>

      <span
        aria-hidden
        className="lacre absolute top-[88px] left-1/2 z-20 -ml-7 flex size-14 items-center justify-center rounded-full font-accent text-[26px] italic text-rosa-claro"
      >
        ✷
      </span>

      <article className="carta-papel relative mx-[22px] mt-[46px] flex-1 animate-subir px-7 pt-12 pb-8 [animation-delay:.15s]">
        {children}
      </article>

      <footer className="relative z-10 px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))]">{rodape}</footer>
    </main>
  );
}

export function TituloCarta({ children }: { children: ReactNode }) {
  return <h1 className="mt-2.5 font-display text-[32px] leading-[1.06] font-bold italic text-bordo">{children}</h1>;
}
