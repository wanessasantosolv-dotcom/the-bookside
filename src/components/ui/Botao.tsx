import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variante = "primario" | "contorno" | "creme";

const base =
  "inline-flex h-[52px] w-full items-center justify-center rounded-pill px-6 text-[15px] font-semibold leading-none transition-colors duration-150 select-none disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45";

const variantes: Record<Variante, string> = {
  primario: "bg-bordo text-creme hover:bg-bordo-suave active:bg-bordo-escuro",
  contorno: "border border-bordo bg-transparent text-bordo hover:bg-rosa-fundo active:bg-rosa-claro/50",
  creme: "bg-creme text-bordo hover:bg-creme-quente",
};

type Comum = { variante?: Variante; className?: string; children: ReactNode };

export function Botao({ variante = "primario", className = "", ...props }: Comum & ComponentProps<"button">) {
  return <button className={`${base} ${variantes[variante]} ${className}`} {...props} />;
}

export function BotaoLink({
  variante = "primario",
  className = "",
  desabilitado,
  ...props
}: Comum & ComponentProps<typeof Link> & { desabilitado?: boolean }) {
  return (
    <Link
      className={`${base} ${variantes[variante]} ${className}`}
      aria-disabled={desabilitado || undefined}
      tabIndex={desabilitado ? -1 : undefined}
      {...props}
    />
  );
}
