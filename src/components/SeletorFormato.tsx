"use client";

import { formatos } from "@/lib/formatos";
import type { FormatoLivro } from "@/lib/perfil-store";

/** "como você está lendo?" — físico, kindle/e-book ou audiolivro (toque de novo para desmarcar) */
export function SeletorFormato({
  valor,
  onChange,
  className = "",
  rotulo = "como você lê esse livro?",
}: {
  rotulo?: string;
  valor?: FormatoLivro;
  onChange: (f: FormatoLivro | undefined) => void;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className="text-[10px] font-semibold tracking-[.16em] text-bordo uppercase lg:text-grafite">
        {rotulo}
      </legend>
      <div className="mt-2 flex overflow-hidden rounded-pill border-[1.5px] border-bordo">
        {formatos.map((f, i) => {
          const on = valor === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? undefined : f.id)}
              className={`flex h-10 flex-1 items-center justify-center gap-1.5 text-[12px] font-semibold ${
                i ? "border-l border-bordo/25" : ""
              } ${on ? "bg-bordo text-creme" : "bg-transparent text-bordo"}`}
            >
              <svg
                aria-hidden
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="flex-none"
              >
                {f.icone.split(" M").map((d, i) => (
                  <path key={i} d={i ? `M${d}` : d} />
                ))}
              </svg>
              {f.curto}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
