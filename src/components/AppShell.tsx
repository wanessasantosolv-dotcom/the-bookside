import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { abas, NavInferior, type Aba } from "@/components/NavInferior";

/**
 * Casca das telas principais do app.
 * - celular: coluna de 390px com o menu inferior;
 * - computador (lg+): menu fixo na lateral e o conteúdo ocupando o resto da tela.
 */
export function AppShell({
  aba,
  children,
  className = "",
  style,
}: {
  aba: Aba;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div style={style} className={`min-h-dvh lg:flex lg:bg-jornal ${className}`}>
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-dvh lg:w-[236px] lg:flex-none lg:border-r lg:border-fio lg:px-7 lg:py-8">
        <Link href="/inicio" aria-label="the bookside · início" className="mb-10 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-principal-bordo.png" alt="" className="w-[148px]" />
        </Link>
        <nav aria-label="Principal" className="flex flex-col">
          {abas.map((a) => {
            const on = a.id === aba;
            return (
              <Link
                key={a.id}
                href={a.href}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-11 items-center gap-2.5 font-texto text-[13px] font-semibold ${on ? "text-vinho" : "text-grafite hover:text-tinta"}`}
              >
                <span aria-hidden className="size-1.5 rounded-full bg-current opacity-50" />
                {a.rotulo}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-creme text-ameixa sm:shadow-[0_0_60px_-30px_rgba(43,20,32,.35)] lg:mx-0 lg:max-w-none lg:min-w-0 lg:flex-1 lg:shadow-none">
        <div className="flex flex-1 flex-col">{children}</div>
        <div className="lg:hidden">
          <NavInferior ativa={aba} />
        </div>
      </main>
    </div>
  );
}
