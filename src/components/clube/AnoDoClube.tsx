import Link from "next/link";

/** "o ano do clube": a retrospectiva e a revista em PDF, sempre à vista */
export function CartaoAnoDoClube({ clubeId }: { clubeId: string }) {
  const ano = new Date().getFullYear();
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-linha bg-creme-quente px-4 py-3.5 lg:rounded-[4px] lg:border-fio lg:bg-transparent">
      <span className="min-w-0 basis-full sm:basis-0 sm:flex-1">
        <span className="block text-[10px] font-semibold tracking-[.16em] text-bordo uppercase">
          o ano do clube ✦
        </span>
        <span className="mt-0.5 block font-accent text-sm italic text-cinza">
          a retrospectiva de {ano} e a revista em PDF
        </span>
      </span>
      <Link
        href={`/clubes/${clubeId}/retrospectiva`}
        className="flex min-h-10 items-center rounded-pill bg-bordo px-4 text-xs font-semibold text-creme"
      >
        retrospectiva
      </Link>
      <Link
        href={`/revista/${clubeId}`}
        className="flex min-h-10 items-center rounded-pill border border-bordo px-4 text-xs font-semibold text-bordo"
      >
        revista (PDF)
      </Link>
    </div>
  );
}
