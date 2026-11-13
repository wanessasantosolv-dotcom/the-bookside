import type { CSSProperties, ReactNode } from "react";

/**
 * Coluna de celular: o app é desenhado em 390px.
 * No desktop ele aparece centralizado sobre a "mesa" bege.
 */
export function Tela({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <main
      style={style}
      className={`relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-x-hidden bg-creme text-ameixa sm:shadow-[0_0_60px_-30px_rgba(43,20,32,.35)] ${className}`}
    >
      {children}
    </main>
  );
}
