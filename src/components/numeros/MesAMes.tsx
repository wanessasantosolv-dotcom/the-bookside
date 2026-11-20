"use client";

import Link from "next/link";
import { CapaLivro } from "@/components/CapaLivro";
import { corDoLivro } from "@/lib/cores";
import type { Numeros } from "@/lib/numeros";

/** "mês a mês": o melhor livro de cada mês (e o menos amado, quando houve um), numa
 * linha do tempo vertical — compacta, pra ver o ano inteiro de uma vez. */
export function MesAMes({ n, web }: { n: Numeros; web?: boolean }) {
  if (!n.mesAMes.length) return null;
  const titulo = web
    ? "mb-[18px] border-b border-ameixa pb-2 font-revista text-[22px] leading-none text-ameixa italic"
    : "eyebrow mb-3 text-bordo";

  return (
    <section className={web ? "mb-14" : "mb-4"}>
      <h2 className={titulo}>mês a mês</h2>
      <ol className="relative pl-[18px]">
        <span
          aria-hidden
          className="absolute top-1 bottom-1 left-[5px] w-[1.5px]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to bottom, var(--color-ouro) 0 4px, transparent 4px 8px)",
          }}
        />
        {[...n.mesAMes].reverse().map((m) => (
          <li
            key={m.mes}
            className="relative flex items-center gap-3 border-b border-linha/70 py-2.5 last:border-0"
          >
            <span
              aria-hidden
              className="absolute top-1/2 -left-[17px] size-[9px] -translate-y-1/2 rounded-full border-2 border-creme bg-bordo lg:border-[var(--color-creme)]"
            />
            <span
              className={`w-[62px] flex-none truncate text-[13px] font-semibold italic text-ameixa ${web ? "font-revista" : "font-display"}`}
            >
              {m.mes}
            </span>
            <Link
              href={`/livro/${m.melhor!.id}`}
              className="flex min-w-0 flex-1 items-center gap-2.5"
            >
              <CapaLivro
                titulo={m.melhor!.titulo}
                capa={m.melhor!.capa}
                cor={corDoLivro(m.melhor!.id)}
                className="w-6 flex-none [&>span:last-child]:hidden"
              />
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-semibold">
                  {m.melhor!.titulo}
                </span>
                {m.pior ? (
                  <span className="block truncate text-[10px] text-cinza">
                    menos amado: {m.pior.titulo}
                  </span>
                ) : (
                  <span className="block text-[10px] text-bordo">
                    o melhor do mês
                  </span>
                )}
              </span>
            </Link>
            <span className="flex-none text-[10px] text-rosa-antigo">
              {m.total} {m.total === 1 ? "livro" : "livros"}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
