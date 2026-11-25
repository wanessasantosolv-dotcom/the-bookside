"use client";

/** o anel com a porcentagem */
export function AnelMatch({
  pontos,
  tamanho = 64,
}: {
  pontos: number;
  tamanho?: number;
}) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <span
      className="relative flex flex-none items-center justify-center"
      style={{ width: tamanho, height: tamanho }}
      aria-label={`${pontos}% de match`}
    >
      <svg viewBox="0 0 60 60" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="30" cy="30" r={r} fill="none" stroke="var(--color-linha)" strokeWidth="5" />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke="var(--color-bordo)"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(pontos / 100) * c} ${c}`}
        />
      </svg>
      <b className="font-display text-[17px] leading-none font-semibold text-bordo">
        {pontos}
        <span className="text-[10px]">%</span>
      </b>
    </span>
  );
}
