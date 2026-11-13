import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * Teste "what's your bookside" no estilo revista: papel claro, filetes pretos,
 * Fraunces nos títulos, Manrope no texto e Space Mono nos números.
 */
export function PaginaRevista({
  voltar,
  rotulo,
  barra,
  children,
  rodape,
}: {
  voltar: { href: string; rotulo: string } | { onClick: () => void; rotulo: string };
  rotulo: ReactNode;
  /** progresso de 0 a 1: mostra a barrinha vinho no lugar do filete */
  barra?: number;
  children: ReactNode;
  rodape?: ReactNode;
}) {
  const classeVoltar =
    "-ml-2 flex min-h-11 items-center px-2 text-[9px] font-bold tracking-[.18em] text-tinta uppercase";
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-jornal px-6 pb-[max(24px,env(safe-area-inset-bottom))] font-texto text-tinta sm:shadow-[0_0_60px_-30px_rgba(43,20,32,.35)] lg:max-w-none lg:px-10 lg:shadow-none">
      <header className="pt-2.5 lg:pt-5">
        <div className="flex items-center justify-between lg:grid lg:grid-cols-[1fr_auto_1fr]">
          {"href" in voltar ? (
            <Link href={voltar.href} className={classeVoltar}>
              ‹ {voltar.rotulo}
            </Link>
          ) : (
            <button type="button" onClick={voltar.onClick} className={classeVoltar}>
              ‹ {voltar.rotulo}
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-bordo.png" alt="the bookside" className="hidden w-[92px] lg:block" />
          <span className="text-[9px] font-bold tracking-[.18em] text-tinta uppercase lg:flex lg:items-center lg:justify-end lg:gap-3">
            {barra !== undefined ? (
              <span aria-hidden className="hidden h-[3px] w-[180px] overflow-hidden bg-fio lg:block">
                <i
                  className="block h-full bg-vinho transition-[width] duration-500"
                  style={{ width: `${barra * 100}%` }}
                />
              </span>
            ) : null}
            {rotulo}
          </span>
        </div>
        {barra === undefined ? (
          <div className="mt-2 h-px bg-tinta lg:hidden" />
        ) : (
          <div
            className="mt-2 h-[3px] overflow-hidden bg-fio lg:hidden"
            role="progressbar"
            aria-label="progresso do teste"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(barra * 100)}
          >
            <i className="block h-full bg-vinho transition-[width] duration-500" style={{ width: `${barra * 100}%` }} />
          </div>
        )}
      </header>
      <div className="flex flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-[640px] lg:flex-none lg:pt-12 lg:text-center">
        {children}
      </div>
      {rodape ? <footer className="pt-6 lg:mx-auto lg:w-full lg:max-w-[420px]">{rodape}</footer> : null}
    </main>
  );
}

const classeBarra =
  "flex h-[52px] w-full items-center justify-center bg-tinta text-[11px] font-bold tracking-[.18em] text-jornal uppercase transition-colors hover:bg-vinho disabled:cursor-not-allowed disabled:opacity-35";

/** Botão-barra preto, com o texto em caixa alta espaçada. */
export function BarraLink(props: ComponentProps<typeof Link>) {
  return <Link {...props} className={`${classeBarra} ${props.className ?? ""}`} />;
}

export function BarraBotao(props: ComponentProps<"button">) {
  return <button type="button" {...props} className={`${classeBarra} ${props.className ?? ""}`} />;
}

/** Rótulo pequeno em caixa alta (8–9px). */
export function Rotulo({
  children,
  vinho,
  className = "",
}: {
  children: ReactNode;
  vinho?: boolean;
  className?: string;
}) {
  return (
    <p
      className={`text-[9px] leading-[1.2] font-semibold tracking-[.16em] uppercase ${vinho ? "text-vinho" : "text-grafite"} ${className}`}
    >
      {children}
    </p>
  );
}

export function Filete({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`h-px bg-tinta ${className}`} />;
}
