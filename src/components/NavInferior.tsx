import Link from "next/link";
import { PontoNovidades } from "@/components/social/AvisoNovidades";

export const abas = [
  {
    id: "inicio",
    href: "/inicio",
    rotulo: "início",
    icone: (
      <>
        <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      </>
    ),
  },
  {
    id: "estantes",
    href: "/estantes",
    rotulo: "estantes",
    icone: (
      <>
        <path d="m16 6 4 14" />
        <path d="M12 6v14" />
        <path d="M8 8v12" />
        <path d="M4 4v16" />
      </>
    ),
  },
  {
    id: "descobrir",
    href: "/descobrir",
    rotulo: "descobrir",
    icone: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m15.5 8.5-2 5-5 2 2-5z" />
      </>
    ),
  },
  {
    id: "clubes",
    href: "/comunidade",
    rotulo: "comunidade",
    icone: (
      <>
        {/* duas pessoas ligadas: comunidade (clubes e co-read) */}
        <circle cx="8" cy="8" r="3.2" />
        <circle cx="16.5" cy="9.5" r="2.7" />
        <path d="M2.5 20a5.5 5.5 0 0 1 11 0" />
        <path d="M13.2 15.2a4.6 4.6 0 0 1 8.3 3.3" />
      </>
    ),
  },
  {
    id: "perfil",
    href: "/perfil",
    rotulo: "perfil",
    icone: (
      <>
        <circle cx="12" cy="8" r="5" />
        <path d="M20 21a8 8 0 0 0-16 0" />
      </>
    ),
  },
] as const;

export type Aba = (typeof abas)[number]["id"];

/** Menu inferior do app: início · estantes · descobrir · comunidade · perfil (a jornada fica no perfil). */
export function NavInferior({ ativa }: { ativa: Aba }) {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full max-w-[430px] items-center justify-around border-t border-linha bg-creme-quente/95 px-2.5 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] backdrop-blur-md select-none"
    >
      {abas.map((a) => {
        const on = a.id === ativa;
        return (
          <Link
            key={a.id}
            href={a.href}
            data-tour={`aba-${a.id}`}
            aria-current={on ? "page" : undefined}
            className={`relative flex min-h-11 min-w-[52px] flex-col items-center justify-center gap-[5px] text-[10px] leading-none ${
              on ? "font-bold text-bordo" : "font-medium text-cinza"
            }`}
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {a.icone}
            </svg>
            {a.rotulo}
            {a.id === "inicio" ? (
              <PontoNovidades className="top-1 right-3" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
