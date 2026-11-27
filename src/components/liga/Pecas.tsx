"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { TipoDistincao } from "@/lib/liga";

/** Participantes / Ranking, dentro de membros */
export function AbasMembros({ base }: { base: string }) {
  const pathname = usePathname();
  const ranking = pathname.endsWith("/membros/ranking");
  const aba = (on: boolean) => `flex min-h-10 items-center rounded-[5px] px-3.5 text-[13px] font-semibold ${on ? "bg-creme text-ameixa shadow-[0_1px_2px_rgba(0,0,0,.1)]" : "text-tinta-suave hover:text-ameixa"}`;
  return (
    <nav aria-label="membros" className="inline-flex rounded-[7px] bg-papel p-1">
      <Link href={`${base}/membros`} aria-current={!ranking ? "page" : undefined} className={aba(!ranking)}>
        Participantes
      </Link>
      <Link href={`${base}/membros/ranking`} aria-current={ranking ? "page" : undefined} className={aba(ranking)}>
        Ranking
      </Link>
    </nav>
  );
}

/** o emblema da liga: livro com ramos de louro */
export function EmblemaLiga({ tamanho = 22 }: { tamanho?: number }) {
  return (
    <svg aria-hidden width={tamanho} height={tamanho} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 11c-1.6-1.1-3.6-1.5-6-1.3v10c2.4-.2 4.4.2 6 1.3 1.6-1.1 3.6-1.5 6-1.3v-10c-2.4-.2-4.4.2-6 1.3zM16 11v10" />
      <path d="M7 24c-2.6-2.4-3.6-5.6-3-9M25 24c2.6-2.4 3.6-5.6 3-9" />
      <path d="M4.6 18.5l-1.8.8M5.4 21.4l-1.6 1.2M4.2 15.6l-1.9.2M27.4 18.5l1.8.8M26.6 21.4l1.6 1.2M27.8 15.6l1.9.2" />
      <path d="M13 26.5h6" />
    </svg>
  );
}

/** os desenhos de cada distinção (traço fino, cabem do miniatura ao destaque) */
const DESENHOS: Record<TipoDistincao, React.ReactNode> = {
  // livro aberto, marcador e linhas
  "page-turner": (
    <>
      <path d="M24 17.5c-2.2-1.5-5-2-8.5-1.8v13.6c3.5-.2 6.3.3 8.5 1.8 2.2-1.5 5-2 8.5-1.8V15.7c-3.5-.2-6.3.3-8.5 1.8zM24 17.5v13.6" />
      <path d="M27.5 16.4v6l1.6-1.3 1.6 1.3v-6.4" />
      <path d="M18 20.5h3.5M18 23.5h3.5M18 26.5h3.5" />
    </>
  ),
  // pena e aspas
  critic: (
    <>
      <path d="M31 14c-6 2-10 7-12.5 16M31 14c.4 5-2.4 9.6-8 11.6M23.2 20.6l3.6.6" />
      <path d="M15.5 17.5c-1.4.4-2 1.5-2 2.8h2v2.2h-2.4v-2.4M20 17.5c-1.4.4-2 1.5-2 2.8h2v2.2h-2.4v-2.4" />
    </>
  ),
  // lombadas com um livro escolhido e uma estrela
  curator: (
    <>
      <path d="M15 31V18h3v13M19 31V16h3.4v15M23.6 31l3-13.6 3 .7-3 13.4" />
      <path d="M14 31h18" />
      <path d="M20.7 12.4l.6 1.3 1.4.2-1 1 .2 1.4-1.2-.7-1.3.7.3-1.4-1-1 1.4-.2z" fill="currentColor" />
    </>
  ),
  // marcador com linhas contínuas
  constant: (
    <>
      <path d="M20 13h8v19l-4-3.2-4 3.2z" />
      <path d="M14 18c3 0 3 3 6 3M28 21c3 0 3-3 6-3M14 24c3 0 3 3 6 3M28 27c3 0 3-3 6-3" />
    </>
  ),
};

/**
 * Uma distinção: selo oval com o desenho e o nome em volta (ex-libris).
 * As cores vêm do clube (tokens), então combinam com qualquer identidade.
 */
export function Insignia({ tipo, tamanho = 64, apagada }: { tipo: TipoDistincao; tamanho?: number; apagada?: boolean }) {
  return (
    <svg role="img" aria-hidden width={tamanho} height={tamanho * 1.12} viewBox="0 0 48 54" className={apagada ? "opacity-40" : ""}>
      <ellipse cx="24" cy="27" rx="22" ry="25" fill="var(--color-rosa-fundo)" stroke="var(--color-bordo)" strokeWidth="1.2" />
      <ellipse cx="24" cy="27" rx="18.5" ry="21.5" fill="none" stroke="var(--color-bordo)" strokeWidth=".6" strokeDasharray="1.4 1.6" />
      <g fill="none" stroke="var(--color-bordo)" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" transform="translate(0 2)">
        {DESENHOS[tipo]}
      </g>
      <path d="M17 44.5h14" stroke="var(--color-bordo)" strokeWidth=".8" />
    </svg>
  );
}

export const posicaoTexto = (n: number) => (n ? String(n).padStart(2, "0") : "—");
