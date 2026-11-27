"use client";

import { useState, type ReactNode } from "react";

/** esconde um texto marcado com spoiler até a pessoa pedir para ler */
export function ComSpoiler({ spoiler, children }: { spoiler?: boolean; children: ReactNode }) {
  const [aberto, setAberto] = useState(false);
  if (!spoiler || aberto) return <>{children}</>;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setAberto(true);
      }}
      className="flex min-h-11 w-full items-center gap-2 rounded-[4px] border border-dashed border-bege px-3 text-left text-[13px] text-tinta-suave"
    >
      <span className="font-semibold text-bordo">contém spoilers</span> · toque para ler
    </button>
  );
}
