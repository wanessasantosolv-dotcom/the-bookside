"use client";

import { useContext } from "react";
import { ContextoClube } from "@/components/clube/ClubeContexto";
import { decoracaoDe, familiaDe, type Familia, type Identidade } from "@/lib/identidade";

/**
 * Pequeno elemento gráfico ao lado dos títulos, conforme a família visual do
 * club studio (botanical, celestial, vintage library, paper goods, retro
 * graphic, minimal editorial) e o nível de decoração. Em "minimal", nada.
 */
const DESENHOS: Record<Familia, React.ReactNode> = {
  botanical: (
    <>
      <path d="M2 10h44" />
      <path d="M14 10c2-5 7-7 10-6-1 4-6 6-10 6zM26 10c2 4 7 6 10 5-1-4-6-6-10-5zM34 10c1-3 5-5 8-4-1 3-5 4-8 4z" />
    </>
  ),
  celestial: (
    <>
      <path d="M2 10h14M32 10h14" />
      <path d="M27 6.5a4.5 4.5 0 1 0 0 7 3.6 3.6 0 0 1 0-7z" />
      <path d="M20 5.5v2M19 6.5h2M38 12.5v1.6M37.2 13.3h1.6" />
    </>
  ),
  vintage: (
    <>
      <path d="M2 10h15M31 10h15" />
      <path d="M24 4l3 6-3 6-3-6z" />
      <circle cx="17" cy="10" r="1.2" />
      <circle cx="31" cy="10" r="1.2" />
    </>
  ),
  paper: (
    <>
      <path d="M2 10h44" strokeDasharray="3 3" />
      <rect x="18" y="5" width="12" height="10" rx="1" transform="rotate(-6 24 10)" />
    </>
  ),
  retro: (
    <>
      <path d="M2 10h14M32 10h14" />
      <path d="M24 3v14M17 10h14M19 5l10 10M29 5 19 15" />
    </>
  ),
  minimal: <path d="M2 10h44" />,
};

export function Ornamento({ className = "", ident: dado }: { className?: string; ident?: Identidade | null }) {
  const ctx = useContext(ContextoClube);
  const ident = dado !== undefined ? dado : ctx?.identidade;
  if (!ident) return null;
  const nivel = decoracaoDe(ident);
  if (nivel === "minimal") return null;
  const f = familiaDe(ident);
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 20"
      width={nivel === "expressive" ? 64 : 44}
      height={nivel === "expressive" ? 26 : 18}
      fill="none"
      stroke="var(--club-decoration-color)"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block flex-none ${className}`}
    >
      {DESENHOS[f]}
    </svg>
  );
}
