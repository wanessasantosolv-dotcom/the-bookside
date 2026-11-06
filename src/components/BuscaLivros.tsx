"use client";

import { useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { sugestoesDeLivros } from "@/lib/dados";
import { usePerfil, type StatusLivro } from "@/lib/perfil-store";

function normalizar(t: string) {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/**
 * Campo de busca + lista de livros com botão "+ estante".
 * TODO(catálogo): trocar a lista fixa por uma busca na Open Library / Google Books.
 */
export function BuscaLivros({ status, rotuloInicial = "sugestões para começar" }: { status: StatusLivro; rotuloInicial?: string }) {
  const livros = usePerfil((s) => s.livros);
  const alternarLivro = usePerfil((s) => s.alternarLivro);
  const [busca, setBusca] = useState("");

  const resultados = sugestoesDeLivros.filter((l) =>
    normalizar(`${l.titulo} ${l.autor}`).includes(normalizar(busca.trim())),
  );

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

      <p className="eyebrow mt-6 mb-1.5 !text-[10px] text-cinza">{busca ? "resultados" : rotuloInicial}</p>
      <ul>
        {resultados.map((l) => {
          const naEstante = livros.some((x) => x.id === l.id);
          return (
            <li key={l.id} className="flex items-center gap-3.5 border-b border-linha py-3">
              <CapaLivro titulo={l.titulo} cor={l.cor} className="w-12" />
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
                onClick={() => alternarLivro({ id: l.id, titulo: l.titulo, autor: l.autor, status })}
                className={`ml-auto flex h-11 flex-none items-center rounded-pill border px-3 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  naEstante ? "border-linha bg-[#F1E4DC] text-cinza" : "border-bordo text-bordo hover:bg-rosa-fundo"
                }`}
              >
                {naEstante ? "na estante" : "+ estante"}
              </button>
            </li>
          );
        })}
        {resultados.length === 0 ? (
          <li className="py-8 text-center font-accent text-[15px] italic text-cinza">
            não achou? a busca completa chega em breve ✦
          </li>
        ) : null}
      </ul>
    </>
  );
}
