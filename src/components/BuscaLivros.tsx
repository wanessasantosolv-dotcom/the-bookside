"use client";

import { useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { EstadoBusca } from "@/components/EstadoBusca";
import { useBuscaLivros } from "@/lib/catalogo";
import { usePerfil, type StatusLivro } from "@/lib/perfil-store";

/**
 * Campo de busca + lista de livros com botão "+ estante".
 * Busca no Google Books e na Open Library; sem termo, mostra as sugestões locais.
 */
export function BuscaLivros({ status, rotuloInicial = "sugestões para começar" }: { status: StatusLivro; rotuloInicial?: string }) {
  const livros = usePerfil((s) => s.livros);
  const alternarLivro = usePerfil((s) => s.alternarLivro);
  const [busca, setBusca] = useState("");

  const { estado, resultados } = useBuscaLivros(busca);

  return (
    <>
      <label className="relative block">
        <span className="sr-only">buscar um livro</span>
        <svg
          aria-hidden
          className="absolute top-1/2 left-4 -translate-y-1/2"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#7A6A6E"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input
          type="search"
          placeholder="título, autora ou isbn"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="h-12 w-full rounded-pill border border-bege bg-creme-quente pr-3.5 pl-[42px] text-[15px] text-ameixa outline-none placeholder:text-cinza focus:border-bordo focus:ring-1 focus:ring-bordo"
        />
      </label>

      <p className="eyebrow mt-6 mb-1.5 !text-[10px] text-cinza">{estado === "sugestoes" ? rotuloInicial : "resultados"}</p>
      <EstadoBusca estado={estado} vazio={!resultados.length} />
      <ul>
        {(estado === "carregando" ? [] : resultados).map((l) => {
          const naEstante = livros.some((x) => x.id === l.id);
          return (
            <li key={l.id} className="flex items-center gap-3.5 border-b border-linha py-3">
              <CapaLivro titulo={l.titulo} capa={l.capa} cor={l.cor} className="w-12" />
              <div className="min-w-0">
                <h3 className="font-display text-[17px] leading-[1.2] font-semibold italic text-ameixa">{l.titulo}</h3>
                <small className="mt-1 block text-xs text-cinza">
                  {l.autor}
                  {l.ano ? ` · ${l.ano}` : ""}
                </small>
              </div>
              <button
                type="button"
                aria-pressed={naEstante}
                onClick={() => alternarLivro({ id: l.id, titulo: l.titulo, autor: l.autor, capa: l.capa, genero: l.genero, paginas: l.paginas, status })}
                className={`ml-auto flex h-11 flex-none items-center rounded-pill border px-3 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  naEstante ? "border-linha bg-[#F1E4DC] text-cinza" : "border-bordo text-bordo hover:bg-rosa-fundo"
                }`}
              >
                {naEstante ? "na estante" : "+ estante"}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
