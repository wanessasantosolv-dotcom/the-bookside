import Link from "next/link";

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
    id: "clubes",
    href: "/clubes",
    rotulo: "clubes",
    icone: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  },
  {
    id: "numeros",
    href: "/numeros",
    rotulo: "números",
    icone: (
      <>
        <path d="M12 16v5" />
        <path d="M16 14v7" />
        <path d="M20 10v11" />
        <path d="m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15" />
        <path d="M4 18v3" />
        <path d="M8 14v7" />
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

/** Menu inferior do app: início · estantes · clubes · números · perfil. */
export function NavInferior({ ativa }: { ativa: Aba }) {
  return (
    <nav
      aria-label="Principal"
      className="sticky bottom-0 z-30 mt-auto flex items-center justify-around border-t border-linha bg-creme-quente px-2.5 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]"
    >
      {abas.map((a) => {
        const on = a.id === ativa;
        return (
          <Link
            key={a.id}
            href={a.href}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-11 min-w-14 flex-col items-center justify-center gap-[5px] text-[10px] leading-none ${
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
          </Link>
        );
      })}
    </nav>
  );
}
