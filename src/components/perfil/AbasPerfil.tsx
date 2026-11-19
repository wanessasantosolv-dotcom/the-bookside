"use client";

import Link from "next/link";

const abas = [
  {
    id: "geral",
    href: "/perfil",
    nome: "visão geral",
    icone: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
  },
  {
    id: "jornada",
    href: "/numeros",
    nome: "jornada",
    icone: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  },
  {
    id: "estantes",
    href: "/estantes",
    nome: "estantes",
    icone: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  },
  {
    id: "resenhas",
    href: "/perfil/resenhas",
    nome: "resenhas",
    icone: "M20 4C11 4 6 9 5 20 M5 20c6-1 10-4 11-9 M9 15c3-1 5-3 6-6",
  },
] as const;

/** As abas do perfil: a visão geral e os outros cantos (jornada, estantes, resenhas). */
export function AbasPerfil({
  ativa,
  className = "",
}: {
  ativa: (typeof abas)[number]["id"];
  className?: string;
}) {
  return (
    <nav
      aria-label="seções do perfil"
      className={`flex items-center gap-1 rounded-pill bg-linha/60 p-1 ${className}`}
    >
      {abas.map((a) => {
        const on = a.id === ativa;
        return (
          <Link
            key={a.id}
            href={a.href}
            aria-current={on ? "page" : undefined}
            aria-label={a.nome}
            className={`flex h-10 items-center justify-center gap-2 rounded-pill px-3 text-[13px] font-semibold whitespace-nowrap transition-colors ${on ? "flex-[2]" : "flex-1"} ${
              on
                ? "bg-creme text-[var(--acc,var(--color-bordo))] shadow-sm"
                : "text-cinza hover:text-ameixa"
            }`}
          >
            <svg
              aria-hidden
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {a.icone.split(" M").map((d, i) => (
                <path key={i} d={i ? `M${d}` : d} />
              ))}
            </svg>
            <span className={on ? "" : "hidden sm:inline"}>{a.nome}</span>
          </Link>
        );
      })}
    </nav>
  );
}
