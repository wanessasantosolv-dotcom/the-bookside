"use client";

import { useEffect } from "react";

/**
 * O painel de filtros das estantes — o MESMO na estante pessoal, na de outra
 * pessoa e na do clube: folha de baixo no celular, caixa no computador.
 */
export type CampoFiltro = { rotulo: string; valor: string; opcoes: [string, string][]; onMudar: (v: string) => void };

export function BotaoFiltros({ ativos, onAbrir }: { ativos: number; onAbrir: () => void }) {
  return (
    <button
      type="button"
      aria-label={ativos ? `filtros (${ativos} ativos)` : "filtros"}
      onClick={onAbrir}
      className={`relative grid size-11 flex-none place-items-center rounded-[6px] border sm:size-10 ${ativos ? "border-bordo bg-rosa-fundo text-bordo" : "border-linha text-tinta-suave hover:text-ameixa"}`}
    >
      <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h10" />
        <path d="M18 7h2" />
        <path d="M4 17h4" />
        <path d="M12 17h8" />
        <path d="M16 5v4" />
        <path d="M10 15v4" />
      </svg>
      {ativos ? <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-bordo text-[9px] font-bold text-creme">{ativos}</span> : null}
    </button>
  );
}

export function PainelFiltros({ campos, ativos, onLimpar, onFechar }: { campos: CampoFiltro[]; ativos: number; onLimpar: () => void; onFechar: () => void }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onFechar]);
  return (
    <div role="dialog" aria-modal="true" aria-label="filtros" className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center" onClick={onFechar}>
      <div className="max-h-[85dvh] w-full max-w-[420px] overflow-y-auto rounded-t-[10px] bg-creme px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))] sm:rounded-[10px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-revista text-[20px] text-ameixa">Filtros</p>
          <button type="button" onClick={onFechar} className="min-h-11 px-2 text-[13px] font-semibold text-bordo">
            aplicar
          </button>
        </div>
        <div className="mt-3 space-y-4">
          {campos.map((c) => (
            <label key={c.rotulo} className="block">
              <span className="mb-1.5 block text-[12px] font-semibold text-tinta-suave">{c.rotulo}</span>
              <span className="relative block">
                <select value={c.valor} onChange={(e) => c.onMudar(e.target.value)} className="h-11 w-full appearance-none rounded-[6px] border border-linha bg-creme-quente pr-8 pl-3 text-[14px] text-ameixa outline-none focus:border-bordo">
                  {c.opcoes.map(([v, n]) => (
                    <option key={v} value={v}>
                      {n}
                    </option>
                  ))}
                </select>
                <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-cinza">
                  ▾
                </span>
              </span>
            </label>
          ))}
        </div>
        {ativos ? (
          <button type="button" onClick={onLimpar} className="mt-5 min-h-10 text-[13px] font-semibold text-tinta-suave underline-offset-4 hover:underline">
            Limpar filtros
          </button>
        ) : null}
      </div>
    </div>
  );
}
