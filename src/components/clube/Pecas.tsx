"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/social/Pessoas";
import type { PessoaResumo } from "@/lib/social";

/** Bolinhas sobrepostas com as fotos de quem está no clube. */
export function Avatares({ pessoas, max = 5, tamanho = 26 }: { pessoas: PessoaResumo[]; max?: number; tamanho?: number }) {
  const resto = pessoas.length - max;
  return (
    <span className="flex flex-none" aria-hidden>
      {pessoas.slice(0, max).map((p, i) => (
        <Avatar key={p.id} pessoa={p} tamanho={tamanho} className={`border-2 border-creme ${i ? "-ml-2" : ""}`} />
      ))}
      {resto > 0 ? (
        <span
          className="-ml-2 flex items-center justify-center rounded-full border-2 border-creme bg-linha text-[10px] font-semibold text-cinza"
          style={{ width: tamanho, height: tamanho }}
        >
          +{resto}
        </span>
      ) : null}
    </span>
  );
}

/** Topo das telas de formulário do clube: voltar, rótulo, título e frase. */
export function TopoForm({
  voltar,
  rotulo,
  titulo,
  frase,
}: {
  voltar: { href: string; r: string };
  rotulo: string;
  titulo: string;
  frase?: string;
}) {
  return (
    <>
      <header className="flex items-center justify-between px-6 pt-2 lg:px-0 lg:pt-0">
        <Link href={voltar.href} className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo">
          ‹ {voltar.r}
        </Link>
        <span className="text-[11px] font-semibold tracking-[.16em] text-bordo uppercase">{rotulo}</span>
      </header>
      {titulo ? (
        <h1 className="mt-4 px-6 font-display text-[32px] leading-[1.1] font-semibold italic text-bordo lg:px-0 lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
          {titulo}
        </h1>
      ) : null}
      {frase ? <p className="mt-1.5 px-6 font-accent text-sm italic text-cinza lg:px-0">{frase}</p> : null}
    </>
  );
}

/** Botão principal preso embaixo (no celular) / normal no computador. */
export function Rodape({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-[70px] z-10 mt-auto flex gap-2.5 bg-gradient-to-t from-creme via-creme to-creme/0 px-6 pt-6 pb-4 lg:static lg:bg-none lg:px-0">
      {children}
    </div>
  );
}

export const rotuloCampo = "text-[10px] font-semibold tracking-[.16em] text-bordo uppercase";
export const campo =
  "mt-2 w-full rounded-md border border-linha bg-creme-quente px-4 py-3 text-[15px] outline-none placeholder:text-cinza/60 focus:border-bordo";
export const botaoPrincipal =
  "flex min-h-[52px] flex-1 items-center justify-center rounded-pill bg-bordo px-6 text-[15px] font-semibold text-creme disabled:opacity-50";
export const botaoContorno =
  "flex min-h-[52px] items-center justify-center rounded-pill border border-bordo px-6 text-[15px] font-semibold text-bordo disabled:opacity-50";

/** Seletor de 1 a 5 estrelas (com teclado: setas). */
export function EstrelasInput({ valor, onMudar, rotulo, pequeno }: { valor: number; onMudar: (n: number) => void; rotulo: string; pequeno?: boolean }) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
          onClick={() => onMudar(valor === n ? 0 : n)}
          className={`flex items-center justify-center ${pequeno ? "size-8 text-base" : "size-10 text-2xl"} ${n <= valor ? "text-bordo" : "text-bege"}`}
        >
          {n <= valor ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
