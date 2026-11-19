"use client";

export type AbaPerfil = "geral" | "jornada" | "resenhas";

const abas: { id: AbaPerfil; nome: string; icone: string }[] = [
  {
    id: "geral",
    nome: "visão geral",
    icone: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
  },
  {
    id: "jornada",
    nome: "jornada",
    icone: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  },
  {
    id: "resenhas",
    nome: "resenhas",
    icone: "M20 4C11 4 6 9 5 20 M5 20c6-1 10-4 11-9 M9 15c3-1 5-3 6-6",
  },
];

/** As abas do perfil: trocam o conteúdo sem sair da página. */
export function AbasPerfil({
  ativa,
  onChange,
  className = "",
}: {
  ativa: AbaPerfil;
  onChange: (a: AbaPerfil) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label="seções do perfil"
      className={`flex items-center gap-1 rounded-pill bg-linha/60 p-1 ${className}`}
    >
      {abas.map((a) => {
        const on = a.id === ativa;
        return (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => {
              onChange(a.id);
              const u = new URL(window.location.href);
              if (a.id === "geral") u.searchParams.delete("aba");
              else u.searchParams.set("aba", a.id);
              window.history.replaceState(null, "", u);
            }}
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
          </button>
        );
      })}
    </div>
  );
}
