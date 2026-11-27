"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A barra de controles das estantes (a mesma linguagem da estante do clube):
 * no celular, uma linha — filtro, busca, visualização; no computador, a busca
 * fica sempre aberta e os modos viram um grupo de ícones.
 */
export type OpcaoFiltro = { id: string; nome: string };
export type ModoVis = { id: string; nome: string; icone: string };

const Ic = ({ d, t = 18 }: { d: string; t?: number }) => (
  <svg aria-hidden width={t} height={t} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {d.split(" M").map((p, i) => (
      <path key={i} d={i ? `M${p}` : p} />
    ))}
  </svg>
);
const BUSCA = "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-3.5-3.5";

export function BarraCompacta({
  filtros,
  filtro,
  onFiltro,
  busca,
  onBusca,
  placeholder = "Buscar livro ou autor",
  modos,
  modo,
  onModo,
  extra,
}: {
  filtros: OpcaoFiltro[];
  filtro: string;
  onFiltro: (id: string) => void;
  busca?: string;
  onBusca?: (s: string) => void;
  placeholder?: string;
  modos: ModoVis[];
  modo: string;
  onModo: (id: string) => void;
  /** controle a mais ao lado dos modos (ex.: capas/lombadas) */
  extra?: React.ReactNode;
}) {
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [menu, setMenu] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (buscaAberta) ref.current?.focus();
  }, [buscaAberta]);
  const atual = modos.find((m) => m.id === modo) ?? modos[0];
  const icone = (on: boolean) => `relative grid size-11 flex-none place-items-center rounded-[6px] border sm:size-10 ${on ? "border-bordo bg-rosa-fundo text-bordo" : "border-linha text-tinta-suave hover:text-ameixa"}`;
  return (
    <div>
      <div className="flex items-center gap-2">
        <label className="relative min-w-0 flex-1 sm:flex-none">
          <span className="sr-only">mostrar</span>
          <select value={filtro} onChange={(e) => onFiltro(e.target.value)} className="h-11 w-full appearance-none rounded-[6px] border border-linha bg-transparent pr-8 pl-3 text-[14px] font-semibold text-ameixa outline-none focus:border-bordo sm:h-10 sm:w-auto">
            {filtros.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
          <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-cinza">
            ▾
          </span>
        </label>
        {onBusca ? (
          <label className="hidden h-10 min-w-0 flex-1 items-center gap-2 rounded-[6px] border border-linha px-3 focus-within:border-bordo sm:flex lg:max-w-[340px]">
            <span className="text-cinza">
              <Ic d={BUSCA} t={15} />
            </span>
            <span className="sr-only">{placeholder}</span>
            <input type="search" value={busca} onChange={(e) => onBusca(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-cinza" />
          </label>
        ) : null}
        <span className="ml-auto flex items-center gap-1.5">
          {extra}
          {onBusca ? (
            <button type="button" aria-label="buscar" aria-expanded={buscaAberta} onClick={() => setBuscaAberta((v) => !v)} className={`${icone(buscaAberta || !!busca)} sm:hidden`}>
              <Ic d={BUSCA} />
            </button>
          ) : null}
          <span className="relative sm:hidden">
            <button type="button" aria-label={`visualização: ${atual.nome}`} aria-expanded={menu} onClick={() => setMenu((v) => !v)} className={icone(false)}>
              <Ic d={atual.icone} />
            </button>
            {menu ? (
              <>
                <div aria-hidden className="fixed inset-0 z-20" onClick={() => setMenu(false)} />
                <div role="menu" aria-label="visualização" className="absolute top-12 right-0 z-30 w-48 overflow-hidden rounded-[6px] border border-linha bg-papel py-1 shadow-[0_14px_30px_-16px_rgba(0,0,0,.45)]">
                  {modos.map((m) => (
                    <button key={m.id} type="button" role="menuitemradio" aria-checked={modo === m.id} onClick={() => (onModo(m.id), setMenu(false))} className={`flex min-h-11 w-full items-center gap-3 px-4 text-left text-[14px] hover:bg-rosa-fundo ${modo === m.id ? "font-semibold text-bordo" : "text-ameixa"}`}>
                      <Ic d={m.icone} />
                      {m.nome}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </span>
          <span role="radiogroup" aria-label="visualização" className="hidden rounded-[6px] border border-linha p-0.5 sm:flex">
            {modos.map((m) => (
              <button key={m.id} type="button" role="radio" aria-checked={modo === m.id} aria-label={m.nome} title={m.nome} onClick={() => onModo(m.id)} className={`grid size-9 place-items-center rounded-[4px] ${modo === m.id ? "bg-rosa-fundo text-bordo" : "text-tinta-suave hover:text-ameixa"}`}>
                <Ic d={m.icone} t={17} />
              </button>
            ))}
          </span>
        </span>
      </div>
      {buscaAberta && onBusca ? (
        <div className="mt-2 flex h-11 items-center gap-2 rounded-[6px] border border-bordo px-3 sm:hidden">
          <span className="text-cinza">
            <Ic d={BUSCA} t={15} />
          </span>
          <input ref={ref} type="search" value={busca} onChange={(e) => onBusca(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-cinza" />
          {busca ? (
            <button type="button" onClick={() => onBusca("")} className="min-h-9 px-1 text-[12px] font-semibold text-tinta-suave">
              limpar
            </button>
          ) : null}
          <button type="button" aria-label="fechar busca" onClick={() => (setBuscaAberta(false), onBusca(""))} className="grid size-9 place-items-center text-tinta-suave">
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** capas / lombadas como um único ícone que alterna */
export function AlternarFace({ face, onChange }: { face: "capas" | "lombadas"; onChange: (f: "capas" | "lombadas") => void }) {
  const lombadas = face === "lombadas";
  return (
    <button
      type="button"
      aria-pressed={lombadas}
      aria-label={lombadas ? "mostrando lombadas (tocar para capas)" : "mostrando capas (tocar para lombadas)"}
      title={lombadas ? "lombadas" : "capas"}
      onClick={() => onChange(lombadas ? "capas" : "lombadas")}
      className={`grid size-11 flex-none place-items-center rounded-[6px] border sm:size-10 ${lombadas ? "border-bordo bg-rosa-fundo text-bordo" : "border-linha text-tinta-suave hover:text-ameixa"}`}
    >
      <Ic d={lombadas ? "M5 4h3v16H5z M10 4h3v16h-3z M15 5l3-1 3 15-3 1z" : "M5 4h10v16H5z M15 6h4v14h-4"} />
    </button>
  );
}
