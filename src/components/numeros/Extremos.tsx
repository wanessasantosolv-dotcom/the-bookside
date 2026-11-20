"use client";

import Link from "next/link";
import { CapaLivro } from "@/components/CapaLivro";
import { corDoLivro } from "@/lib/cores";
import { estrelas } from "@/lib/estantes";
import { textoDias, type Numeros } from "@/lib/numeros";
import type { LivroSalvo } from "@/lib/perfil-store";

type Cartao = {
  rot: string;
  icone: string;
  livros: LivroSalvo[];
  info: (l: LivroSalvo) => string;
};

/** "os extremos do ano": as notas mais altas e mais baixas, o livro mais rápido e o mais demorado,
 * como uma fita de selos — compacta, pra caber tudo numa olhada só. */
export function ExtremosDoAno({ n, web }: { n: Numeros; web?: boolean }) {
  const nota = (l: LivroSalvo) => estrelas(l.nota);
  const cartoes: Cartao[] = [
    { rot: "nota mais alta", icone: "★", livros: n.maisAmados, info: nota },
    { rot: "nota mais baixa", icone: "☆", livros: n.menosAmados, info: nota },
    n.maisRapido
      ? {
          rot: "mais rápido",
          icone: "⚡",
          livros: [n.maisRapido.l],
          info: () => textoDias(n.maisRapido!.dias),
        }
      : null,
    n.maisDemorado
      ? {
          rot: "mais demorou",
          icone: "⏳",
          livros: [n.maisDemorado.l],
          info: () => textoDias(n.maisDemorado!.dias),
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
          className={`grid gap-2.5 ${web ? "grid-cols-4 gap-3" : "grid-cols-2"}`}
        >
          {cartoes.map((c) => {
            const principal = c.livros[0];
            const resto = c.livros.slice(1);
            return (
              <div
                key={c.rot}
                className={`rounded-md bg-rosa-fundo p-3 text-center ${web ? "rounded-[4px] p-4" : ""}`}
              >
                <span aria-hidden className="block text-base text-bordo">
                  {c.icone}
                </span>
                <p className="font-maquina mt-1 text-[7.5px] leading-tight tracking-[.06em] text-bordo uppercase">
                  {c.rot}
                </p>
                <Link
                  href={`/livro/${principal.id}`}
                  className="mt-2.5 flex items-center gap-2 text-left"
                >
                  <CapaLivro
                    titulo={principal.titulo}
                    capa={principal.capa}
                    cor={corDoLivro(principal.id)}
                    className="w-7 flex-none [&>span:last-child]:hidden"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-[11.5px] font-semibold">
                      {principal.titulo}
                    </span>
                    <span className="block text-[10px] text-bordo">
                      {c.info(principal)}
                    </span>
                  </span>
                </Link>
                {resto.length ? (
                  <p className="mt-1.5 truncate text-[9.5px] text-cinza">
                    também: {resto.map((l) => l.titulo).join(", ")}
                  </p>
                ) : null}
              </div>
            );
          })}
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
