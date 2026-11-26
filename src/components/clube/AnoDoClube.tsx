import Link from "next/link";
import { CapaAuto } from "@/components/CapaAuto";

/** "o ano do clube": a retrospectiva coletiva como destaque editorial, na cor do clube */
export function CartaoAnoDoClube({
  clubeId,
  livros = [],
}: {
  clubeId: string;
  /** livros concluídos pelo clube neste ano (para as capas) */
  livros?: { id: string; titulo: string; autor: string; capa?: string }[];
}) {
  const ano = new Date().getFullYear();
  return (
    <Link
      href={`/clubes/${clubeId}/retrospectiva`}
      className="inverso group flex flex-wrap items-center gap-6 rounded-[12px] bg-bordo px-6 py-6 text-creme lg:flex-nowrap lg:px-8"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[12px] tracking-[.12em] opacity-80">o ano em livros</span>
        <span className="mt-1 block font-revista text-[28px] leading-tight italic lg:text-[34px]">retrospectiva {ano}</span>
        <span className="mt-2 block text-[13px] opacity-85">
          {livros.length
            ? `${livros.length} ${livros.length === 1 ? "livro lido" : "livros lidos"} juntos neste ano`
            : "as histórias, as avaliações e os momentos que vocês compartilharam neste ano."}
        </span>
        <span className="mt-3 inline-block text-[13px] font-semibold underline-offset-4 group-hover:underline">ver retrospectiva →</span>
      </span>
      {livros.length ? (
        <span aria-hidden className="flex items-end">
          {livros.slice(0, 5).map((l, i) => (
            <span key={l.id} className="-ml-4 w-[64px] first:ml-0 lg:w-[76px]" style={{ transform: `rotate(${(i - 2) * 3}deg)`, zIndex: 5 - Math.abs(i - 2) }}>
              <CapaAuto livro={l} className="w-full shadow-[0_14px_24px_-12px_rgba(0,0,0,.55)] [&>span:last-child]:hidden" />
            </span>
          ))}
        </span>
      ) : null}
    </Link>
  );
}
