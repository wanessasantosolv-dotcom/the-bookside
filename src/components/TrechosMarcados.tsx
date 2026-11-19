"use client";

import { useState } from "react";

/** Os trechos que a pessoa marcou (do Kindle ou do app), na página do livro. */
export function TrechosMarcados({
  trechos,
}: {
  trechos: { texto: string; em?: string; origem?: string }[];
}) {
  const [todos, setTodos] = useState(false);
  const lista = todos ? trechos : trechos.slice(0, 3);
  return (
    <section className="mx-6 mt-6 lg:mx-0">
      <p className="text-[10px] font-semibold tracking-[.16em] text-bordo uppercase lg:text-grafite">
        seus trechos marcados · {trechos.length}
        {trechos.some((t) => t.origem === "kindle") ? " · do kindle" : ""}
      </p>
      <ul className="mt-3 space-y-3">
        {lista.map((t, i) => (
          <li
            key={i}
            className="rounded-[12px] border border-linha bg-creme-quente px-4 py-3 lg:rounded-[4px]"
          >
            <p className="font-accent text-[15px] leading-snug italic text-ameixa">
              “{t.texto}”
            </p>
            {t.em ? (
              <p className="mt-1.5 text-[10px] font-semibold tracking-[.1em] text-cinza uppercase">
                marcado em{" "}
                {new Date(t.em).toLocaleDateString("pt-BR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {trechos.length > 3 ? (
        <button
          type="button"
          onClick={() => setTodos((x) => !x)}
          className="mt-2 min-h-9 text-xs font-semibold text-bordo underline underline-offset-4"
        >
          {todos ? "mostrar menos" : `ver todos os ${trechos.length}`}
        </button>
      ) : null}
    </section>
  );
}
