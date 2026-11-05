/**
 * Capa provisória: lombada colorida com o título.
 * Será trocada pela capa real vinda do catálogo (fonte autorizada).
 */
export function CapaLivro({ titulo, cor, className = "" }: { titulo: string; cor: string; className?: string }) {
  return (
    <div
      aria-hidden
      className={`relative flex aspect-[2/3] flex-none items-end overflow-hidden rounded-[2px_4px_4px_2px] p-1.5 shadow-[inset_3px_0_0_rgba(0,0,0,.18),2px_4px_8px_-3px_rgba(43,20,32,.45)] ${className}`}
      style={{ background: cor }}
    >
      <span className="absolute inset-x-1.5 top-2 h-px bg-ouro/70" />
      <span className="line-clamp-3 font-display text-[8px] leading-[1.15] font-semibold italic text-creme">{titulo}</span>
    </div>
  );
}
