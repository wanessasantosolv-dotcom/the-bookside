"use client";

import Link from "next/link";
import { CapaLivro } from "@/components/CapaLivro";
import { corDoLivro } from "@/lib/cores";
import { estrelas } from "@/lib/estantes";
import type { Numeros } from "@/lib/numeros";
import type { LivroSalvo } from "@/lib/perfil-store";

/** "mês a mês": o melhor e o pior livro de cada mês (pela sua nota). */
export function MesAMes({ n, web }: { n: Numeros; web?: boolean }) {
  if (!n.mesAMes.length) return null;
  const titulo = web
    ? "mb-[18px] border-b border-ameixa pb-2 font-revista text-[22px] leading-none text-ameixa italic"
    : "eyebrow mb-3 text-bordo";

  const livro = (l: LivroSalvo, rot: string, cor: string) => (
    <Link href={`/livro/${l.id}`} className="flex min-w-0 items-center gap-2.5">
      <CapaLivro
        titulo={l.titulo}
        capa={l.capa}
        cor={corDoLivro(l.id)}
        className="w-9 flex-none [&>span:last-child]:hidden"
      />
      <span className="min-w-0">
        <span
          className={`block text-[9px] font-semibold tracking-[.12em] uppercase ${cor}`}
        >
          {rot}
        </span>
        <span className="block truncate text-[13px] font-semibold">
          {l.titulo}
        </span>
        <span className="block text-[11px] text-bordo">{estrelas(l.nota)}</span>
      </span>
    </Link>
  );

  return (
    <section className={web ? "mb-14" : "mb-4"}>
      <h2 className={titulo}>mês a mês</h2>
      <ol className={`grid gap-3 ${web ? "grid-cols-2 xl:grid-cols-3" : ""}`}>
        {[...n.mesAMes].reverse().map((m) => (
          <li
            key={m.mes}
            className={`rounded-md border border-linha p-3.5 ${web ? "rounded-[4px]" : "bg-creme-quente"}`}
          >
            <p className="flex items-baseline justify-between">
              <span
                className={`italic text-ameixa ${web ? "font-revista text-lg" : "font-display text-[17px] font-semibold"}`}
              >
                {m.mes}
              </span>
              <span className="text-[11px] text-cinza">
                {m.total} {m.total === 1 ? "livro" : "livros"}
              </span>
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-3">
              {livro(m.melhor!, "o melhor", "text-bordo")}
              {m.pior ? (
                livro(m.pior, "o menos amado", "text-cinza")
              ) : (
                <span className="self-center font-accent text-xs italic text-cinza">
                  {m.total > 1
                    ? "todos com a mesma nota ✦"
                    : "só um livro com nota"}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
