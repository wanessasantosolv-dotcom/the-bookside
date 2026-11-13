"use client";

import { useState } from "react";

/**
 * Capa do livro. Com `capa` (URL da Open Library) mostra a capa real;
 * sem capa, ou se a imagem falhar, mostra a lombada colorida com o título.
 */
export function CapaLivro({
  titulo,
  cor,
  capa,
  className = "",
}: {
  titulo: string;
  cor: string;
  capa?: string;
  className?: string;
}) {
  const [falhou, setFalhou] = useState(false);
  const comImagem = !!capa && !falhou;
  return (
    <div
      aria-hidden
      className={`relative flex aspect-[2/3] flex-none items-end overflow-hidden rounded-[2px_4px_4px_2px] p-1.5 shadow-[inset_3px_0_0_rgba(0,0,0,.18),2px_4px_8px_-3px_rgba(43,20,32,.45)] ${className}`}
      style={{ background: cor }}
    >
      {comImagem ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={capa}
          alt=""
          loading="lazy"
          onError={() => setFalhou(true)}
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
      {comImagem ? (
        <span className="absolute inset-y-0 left-0 w-[5%] bg-gradient-to-r from-black/25 to-transparent" />
      ) : (
        <span className="absolute inset-x-1.5 top-2 h-px bg-ouro/70" />
      )}
      <span className={`line-clamp-3 font-display text-[8px] leading-[1.15] font-semibold italic text-creme ${comImagem ? "sr-only" : ""}`}>
        {titulo}
      </span>
    </div>
  );
}
