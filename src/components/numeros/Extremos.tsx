"use client";

import Link from "next/link";
import { CapaLivro } from "@/components/CapaLivro";
import { corDoLivro } from "@/lib/cores";
import { estrelas } from "@/lib/estantes";
import { textoDias, type Numeros } from "@/lib/numeros";
import type { LivroSalvo } from "@/lib/perfil-store";

type Cartao = {
  rot: string;
  livros: LivroSalvo[];
  info: (l: LivroSalvo) => string;
};

/** "os extremos do ano": as notas mais altas e mais baixas, o livro mais rápido e o mais demorado. */
export function ExtremosDoAno({ n, web }: { n: Numeros; web?: boolean }) {
  const nota = (l: LivroSalvo) => estrelas(l.nota);
  const cartoes: Cartao[] = [
    { rot: "as notas mais altas", livros: n.maisAmados, info: nota },
    { rot: "as notas mais baixas", livros: n.menosAmados, info: nota },
    n.maisRapido
      ? {
          rot: "o mais rápido",
          livros: [n.maisRapido.l],
          info: () => `lido ${textoDias(n.maisRapido!.dias)}`,
        }
      : null,
    n.maisDemorado
      ? {
          rot: "o que mais demorou",
          livros: [n.maisDemorado.l],
          info: () => `lido ${textoDias(n.maisDemorado!.dias)}`,
        }
      : null,
  ].filter((c): c is Cartao => !!c && c.livros.length > 0);

  const dica =
    !n.maisRapido && n.total
      ? "marque quando começou e terminou cada livro para ver o mais rápido e o mais demorado."
      : !n.maisAmados.length && n.total
        ? "dê estrelas aos livros lidos para ver as notas mais altas e mais baixas."
        : null;

  if (!cartoes.length && !dica) return null;

  return (
    <section className={web ? "mb-14" : "mb-4"}>
      <h2
        className={
          web
            ? "mb-[18px] border-b border-ameixa pb-2 font-revista text-[22px] leading-none text-ameixa italic"
            : "eyebrow mb-3 text-bordo"
        }
      >
        os extremos do ano
      </h2>
      {cartoes.length ? (
        <div
          className={`grid gap-3 ${web ? "grid-cols-2 gap-[18px] xl:grid-cols-4" : "grid-cols-1 min-[480px]:grid-cols-2"}`}
        >
          {cartoes.map((c) => (
            <div
              key={c.rot}
              className={`rounded-md border border-linha bg-creme-quente p-3.5 ${web ? "rounded-[4px] bg-transparent p-5" : ""}`}
            >
              <p
                className={
                  web
                    ? "font-revista text-base text-ameixa italic"
                    : "font-display text-[15px] leading-tight font-semibold italic text-bordo"
                }
              >
                {c.rot}
              </p>
              <ul className="mt-3 space-y-2.5">
                {c.livros.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={`/livro/${l.id}`}
                      className="flex items-center gap-2.5"
                    >
                      <CapaLivro
                        titulo={l.titulo}
                        capa={l.capa}
                        cor={corDoLivro(l.id)}
                        className={`${c.livros.length === 1 ? "w-12" : "w-8"} flex-none [&>span:last-child]:hidden`}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold">
                          {l.titulo}
                        </span>
                        <span className="block text-[11px] text-bordo">
                          {c.info(l)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
      {dica ? (
        <p
          className={`mt-3 text-[13px] text-cinza italic ${web ? "font-revista" : "font-accent"}`}
        >
          {dica}
        </p>
      ) : null}
    </section>
  );
}
