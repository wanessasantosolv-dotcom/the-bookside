"use client";

import { formatos } from "@/lib/formatos";
import type { FormatoLivro } from "@/lib/perfil-store";

/** "como você está lendo?" — físico, kindle/e-book ou audiolivro (toque de novo para desmarcar) */
export function SeletorFormato({
  valor,
  onChange,
  className = "",
}: {
  valor?: FormatoLivro;
  onChange: (f: FormatoLivro | undefined) => void;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className="text-[10px] font-semibold tracking-[.16em] text-bordo uppercase lg:text-grafite">
        como você lê esse livro?
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {formatos.map((f) => {
          const on = valor === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? undefined : f.id)}
              className={`flex h-10 items-center gap-2 rounded-pill border px-4 text-[13px] font-semibold ${
                on
                  ? "border-bordo bg-bordo text-creme"
                  : "border-bege bg-creme-quente text-ameixa hover:border-bordo"
              }`}
            >
              <svg
                aria-hidden
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {f.icone.split(" M").map((d, i) => (
                  <path key={i} d={i ? `M${d}` : d} />
                ))}
              </svg>
              {f.nome}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
