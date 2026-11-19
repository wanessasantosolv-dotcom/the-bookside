"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { corDoLivro } from "@/lib/cores";

export type ItemFavorito = {
  id: string;
  titulo: string;
  capa?: string;
  href: string;
  /** embaixo da capa (ex.: estrelas) */
  legenda?: ReactNode;
};

/**
 * A vitrine dos favoritos: as capas em pé numa prateleira de madeira,
 * com luz por trás — o destaque do perfil e do clube.
 */
export function VitrineFavoritos({
  titulo,
  itens,
  acao,
  vazio,
  vagas = 4,
  grande,
  compacta,
}: {
  titulo: string;
  itens: ItemFavorito[];
  /** link no canto (ex.: "escolher →") */
  acao?: { href: string; rotulo: string };
  vazio?: ReactNode;
  /** quantos lugares mostrar (os vazios ficam pontilhados) */
  vagas?: number;
  grande?: boolean;
  /** capas menores (a prateleira não estica na tela toda) */
  compacta?: boolean;
}) {
  const largura = compacta ? "max-w-[440px]" : "";
  const lugares = Array.from(
    { length: Math.max(vagas, itens.length) },
    (_, i) => itens[i],
  );
  return (
    <section className="relative overflow-hidden rounded-xl bg-gradient-to-b from-rosa-fundo to-creme-quente px-5 pt-5 pb-4 lg:rounded-[6px] lg:px-7 lg:pt-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[22px] leading-none font-semibold italic text-bordo lg:font-revista lg:text-[24px] lg:font-normal">
          {titulo} <span className="text-ouro">✦</span>
        </h2>
        {acao ? (
          <Link
            href={acao.href}
            className="text-[10px] font-bold tracking-[.12em] text-bordo uppercase"
          >
            {acao.rotulo}
          </Link>
        ) : null}
      </div>
      {itens.length || !vazio ? (
        <>
          <ul
            className={`relative mt-5 grid grid-cols-4 items-end gap-3 px-1 ${largura} ${grande ? "lg:gap-6 lg:px-4" : "lg:gap-4"}`}
          >
            {lugares.map((l, i) => (
              <li key={l?.id ?? `vaga-${i}`} className="relative">
                {l ? (
                  <Link href={l.href} className="group block">
                    <CapaLivro
                      titulo={l.titulo}
                      capa={l.capa}
                      cor={corDoLivro(l.id)}
                      className={`w-full shadow-[0_14px_22px_-12px_rgba(43,20,32,.55)] transition-transform group-hover:-translate-y-1.5 [&>span:last-child]:text-[10px] ${
                        [
                          "-rotate-1",
                          "rotate-1",
                          "-rotate-[0.5deg]",
                          "rotate-[1.5deg]",
                        ][i % 4]
                      }`}
                    />
                  </Link>
                ) : (
                  <span className="block aspect-[2/3] w-full rounded-[3px] border-[1.5px] border-dashed border-rosa-antigo/50" />
                )}
              </li>
            ))}
          </ul>
          {/* a prateleira */}
          <span
            aria-hidden
            className={`relative -mx-2 mt-0 block h-3 rounded-[3px] bg-gradient-to-b from-ouro to-[#A9814E] shadow-[0_4px_0_#8C6B3E,0_8px_12px_-6px_rgba(43,20,32,.35)] ${compacta ? "max-w-[456px]" : ""}`}
          />
          {itens.some((l) => l.legenda) ? (
            <ul className={`mt-3 grid grid-cols-4 gap-3 px-1 lg:gap-4 ${largura}`}>
              {lugares.map((l, i) => (
                <li
                  key={l?.id ?? `leg-${i}`}
                  className="truncate text-center text-[11px] text-bordo"
                >
                  {l?.legenda ?? ""}
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : (
        <div className="mt-3 font-accent text-sm italic text-cinza">
          {vazio}
        </div>
      )}
    </section>
  );
}
