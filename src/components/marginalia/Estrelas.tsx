"use client";

import { useId } from "react";

/** uma estrela em SVG, cheia, meia ou vazia (nas cores do tema) */
export function Estrela({ cheio, tamanho }: { cheio: 0 | 0.5 | 1; tamanho: number }) {
  const id = useId();
  return (
    <svg aria-hidden width={tamanho} height={tamanho} viewBox="0 0 24 24">
      <defs>
        <clipPath id={id}>
          <rect x="0" y="0" width={24 * cheio} height="24" />
        </clipPath>
      </defs>
      <path
        d="M12 2.8l2.75 5.9 6.45.75-4.78 4.4 1.28 6.37L12 17.05 6.3 20.22l1.28-6.37L2.8 9.45l6.45-.75z"
        fill="none"
        stroke="var(--color-bege)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        clipPath={`url(#${id})`}
        d="M12 2.8l2.75 5.9 6.45.75-4.78 4.4 1.28 6.37L12 17.05 6.3 20.22l1.28-6.37L2.8 9.45l6.45-.75z"
        fill="var(--color-citacao-tinta)"
        stroke="var(--color-citacao-tinta)"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EstrelasFixas({ valor, tamanho = 14 }: { valor: number; tamanho?: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${String(valor).replace(".", ",")} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Estrela key={n} tamanho={tamanho} cheio={valor >= n ? 1 : valor >= n - 0.5 ? 0.5 : 0} />
      ))}
    </span>
  );
}

/**
 * Escolher a nota em meias estrelas: cada estrela tem duas metades clicáveis
 * (a esquerda vale meia). Setas mudam de meia em meia; Home/End vão aos extremos.
 * Tocar de novo na mesma nota não apaga: para limpar há um botão próprio.
 */
export function EstrelasEscolha({
  valor,
  onMudar,
  rotulo,
  tamanho = 30,
}: {
  valor: number;
  onMudar: (n: number) => void;
  rotulo: string;
  tamanho?: number;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={rotulo}
      className="inline-flex"
      onKeyDown={(e) => {
        const mapa: Record<string, number> = {
          ArrowRight: Math.min(5, valor + 0.5),
          ArrowUp: Math.min(5, valor + 0.5),
          ArrowLeft: Math.max(0.5, valor - 0.5),
          ArrowDown: Math.max(0.5, valor - 0.5),
          Home: 0.5,
          End: 5,
        };
        if (e.key in mapa) {
          e.preventDefault();
          onMudar(mapa[e.key]);
          const alvo = e.currentTarget.querySelector<HTMLButtonElement>(`[data-valor="${mapa[e.key]}"]`);
          alvo?.focus();
        }
      }}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="relative flex items-center justify-center" style={{ width: tamanho + 6, height: Math.max(44, tamanho + 6) }}>
          <Estrela tamanho={tamanho} cheio={valor >= n ? 1 : valor >= n - 0.5 ? 0.5 : 0} />
          {[n - 0.5, n].map((v, i) => (
            <button
              key={v}
              type="button"
              role="radio"
              data-valor={v}
              aria-checked={valor === v}
              aria-label={`${String(v).replace(".", ",")} ${v <= 1 ? "estrela" : "estrelas"}`}
              tabIndex={valor === v || (!valor && v === 0.5) ? 0 : -1}
              onClick={() => onMudar(v)}
              className={`absolute inset-y-0 ${i ? "right-0" : "left-0"} w-1/2 rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-[-2px]`}
            />
          ))}
        </span>
      ))}
    </div>
  );
}
