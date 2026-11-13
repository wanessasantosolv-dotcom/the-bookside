import Link from "next/link";
import type { ReactNode } from "react";

/** Topo bordô com a logo + folha creme: criar conta, confirmar e-mail e esqueci a senha. */
export function ContaShell({
  voltar,
  titulo,
  descricao,
  children,
}: {
  voltar: { href: string; rotulo: string };
  titulo: string;
  descricao: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-bordo-escuro">
      <header className="relative h-[150px] flex-none">
        <Link href={voltar.href} className="absolute top-2 left-4 flex min-h-11 items-center px-2 text-[13px] font-semibold text-rosa-claro">
          ‹ {voltar.rotulo}
        </Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-base.png"
          alt="the bookside"
          className="absolute top-11 left-1/2 w-[118px] -translate-x-1/2"
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <p className="absolute inset-x-0 top-[110px] text-center font-accent text-[13px] italic text-rosa-claro">
          a estante ao lado da cama
        </p>
      </header>
      <section className="flex-1 rounded-t-[36px] bg-creme px-7 pt-[34px] pb-[max(28px,env(safe-area-inset-bottom))]">
        <h1 className="animate-subir font-display text-[28px] leading-8 font-semibold italic text-bordo">{titulo}</h1>
        <p className="mt-2.5 animate-subir text-sm leading-normal text-cinza [animation-delay:.18s]">{descricao}</p>
        <div className="animate-subir [animation-delay:.3s]">{children}</div>
      </section>
    </main>
  );
}

export const campoConta =
  "h-12 w-full rounded-sm border border-bege bg-creme-quente px-3.5 text-[15px] text-ameixa outline-none placeholder:text-[#8A7E7A] focus:border-bordo focus:ring-1 focus:ring-bordo";
export const rotuloConta = "eyebrow mb-1.5 block text-bordo";
