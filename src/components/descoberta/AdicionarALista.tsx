"use client";

import { useEffect, useRef, useState } from "react";
import type { LivroBusca } from "@/lib/catalogo";
import { adicionarNaLista, estaNaLista } from "@/lib/listas";
import { usePerfil } from "@/lib/perfil-store";

/** seletor compacto: põe o livro numa lista existente ou numa nova, sem sair da página */
export function AdicionarALista({ livro, onFeito }: { livro: LivroBusca; onFeito?: (msg: string) => void }) {
  const listas = usePerfil((s) => s.estantesProprias);
  const livros = usePerfil((s) => s.livros);
  const criarEstante = usePerfil((s) => s.criarEstante);
  const [aberto, setAberto] = useState(false);
  const [nova, setNova] = useState("");
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => !caixa.current?.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  function por(id: string, nome: string) {
    const n = adicionarNaLista(id, [livro]);
    onFeito?.(n ? `Adicionado à lista “${nome}”.` : `Já está na lista “${nome}”.`);
    setAberto(false);
  }

  return (
    <div ref={caixa} className="relative">
      <button type="button" aria-expanded={aberto} onClick={() => setAberto((v) => !v)} className="h-9 rounded-[6px] px-2.5 text-[13px] font-semibold text-tinta-suave hover:text-bordo">
        + lista
      </button>
      {aberto ? (
        <div role="menu" className="absolute right-0 z-30 mt-1 w-[240px] rounded-[8px] border border-linha bg-creme-quente p-1.5 shadow-[0_10px_28px_-14px_rgba(56,37,44,.45)]">
          <p className="px-2 pt-1 pb-1.5 text-[11px] font-semibold tracking-[.12em] text-cinza uppercase">Adicionar à lista</p>
          {listas.length ? (
            <ul className="max-h-[220px] overflow-y-auto">
              {listas.map((e) => {
                const ja = estaNaLista(e, livros, livro.titulo);
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={ja}
                      onClick={() => por(e.id, e.nome)}
                      className="flex min-h-10 w-full items-center justify-between gap-2 rounded-[5px] px-2 text-left text-[13px] text-ameixa hover:bg-papel disabled:text-cinza disabled:hover:bg-transparent"
                    >
                      <span className="truncate">{e.nome}</span>
                      {ja ? <span className="flex-none text-[11px]">já está</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-2 pb-2 text-[12px] text-cinza">Você ainda não tem listas.</p>
          )}
          <form
            onSubmit={(ev) => {
              ev.preventDefault();
              if (!nova.trim()) return;
              const id = criarEstante({ nome: nova.trim(), cor: "#692536", publica: false });
              por(id, nova.trim());
              setNova("");
            }}
            className="mt-1 flex gap-1 border-t border-linha pt-1.5"
          >
            <input value={nova} onChange={(e) => setNova(e.target.value)} maxLength={40} placeholder="Criar nova lista" aria-label="Nome da nova lista" className="h-9 min-w-0 flex-1 rounded-[5px] border border-linha bg-creme px-2 text-[13px] outline-none focus:border-bordo" />
            <button type="submit" disabled={!nova.trim()} className="h-9 rounded-[5px] bg-bordo px-2.5 text-[12px] font-semibold text-creme disabled:opacity-40">
              criar
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
