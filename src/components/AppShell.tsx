import { VigiaGeneros } from "@/components/VigiaGeneros";
import Link from "next/link";
import { BotaoMais } from "@/components/BotaoMais";
import type { CSSProperties, ReactNode } from "react";
import { ExigeConta } from "@/components/ExigeConta";
import { abas, NavInferior, type Aba } from "@/components/NavInferior";
import { TourApp } from "@/components/TourApp";
import { PontoNovidades, VigiaNovidades } from "@/components/social/AvisoNovidades";

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
  menuCelular = true,
}: {
  aba: Aba;
  /** false: telas com botão fixo embaixo não mostram o menu inferior no celular */
  menuCelular?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
      className={`min-h-dvh lg:flex lg:bg-jornal ${
        menuCelular ? "[--altura-menu:calc(52px+max(10px,env(safe-area-inset-bottom)))] lg:[--altura-menu:0px]" : ""
      } ${className}`}
    >
      <ExigeConta />
      <TourApp />
      <VigiaNovidades />
      <VigiaGeneros />
      {/* menu lateral global: bordô da marca em todas as páginas (fixo, não muda com temas) */}
      <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-dvh lg:w-[236px] lg:flex-none lg:bg-[#692536] lg:px-7 lg:py-8">
        <Link href="/inicio" aria-label="the bookside · início" className="mb-10 block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/wordmark-creme.png" alt="" width={150} height={34} className="h-auto w-[150px]" />
        </Link>
        <nav aria-label="Principal" className="flex flex-col">
          {abas.map((a) => {
            const on = a.id === aba;
            return (
              <Link
                key={a.id}
                href={a.href}
                data-tour={`aba-${a.id}`}
                aria-current={on ? "page" : undefined}
                className={`relative flex min-h-11 items-center gap-2.5 font-texto text-[14px] ${on ? "font-semibold text-[#FCFAF6]" : "text-[#E8D2D8]/75 hover:text-[#FCFAF6]"}`}
              >
                {/* indicador discreto da página ativa */}
                <span aria-hidden className={`h-[14px] w-[2px] rounded-full ${on ? "bg-[#ECAABB]" : "bg-transparent"}`} />
                <span className="relative">
                  {a.rotulo}
                  {a.id === "inicio" ? <PontoNovidades className="-top-0.5 -right-3" /> : null}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-creme text-ameixa sm:shadow-[0_0_60px_-30px_rgba(43,20,32,.35)] lg:mx-0 lg:max-w-none lg:min-w-0 lg:flex-1 lg:shadow-none">
        <div className="flex flex-1 flex-col">{children}</div>
        {menuCelular ? (
          <>
            {/* respiro do tamanho do menu, para o fim da página não ficar escondido atrás dele */}
            <div aria-hidden className="h-[var(--altura-menu)] flex-none lg:hidden" />
            <div className="lg:hidden">
              <NavInferior ativa={aba} />
            </div>
            <BotaoMais />
          </>
        ) : null}
      </main>
    </div>
  );
}

/**
 * Telas de formulário do app (avaliar, progresso, editar perfil…): no celular,
 * a coluna de sempre sem o menu inferior; no computador, menu lateral e uma
 * coluna de até 720px alinhada à esquerda, como as outras telas do app.
 */
export function TelaApp({ aba, children }: { aba: Aba; children: ReactNode }) {
  return (
    <AppShell aba={aba} menuCelular={false}>
      <div className="flex flex-1 flex-col lg:bg-jornal lg:px-12 lg:py-8">
        <div className="flex flex-1 flex-col lg:w-full lg:max-w-[720px] lg:flex-none">{children}</div>
      </div>
    </AppShell>
  );
}
