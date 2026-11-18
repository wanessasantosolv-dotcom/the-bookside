"use client";

import { useState } from "react";
import { ErroIA, sugerirCitacoes, type Citacao } from "@/lib/ia";

/** "✦ sugerir com IA": busca na internet citações conhecidas do livro para a pessoa escolher. */
export function SugerirCitacoes({
  titulo,
  autor,
  onEscolher,
}: {
  titulo: string;
  autor: string;
  onEscolher: (c: Citacao) => void;
}) {
  const [estado, setEstado] = useState<"pensando" | "pronto" | "erro" | null>(
    null,
  );
  const [lista, setLista] = useState<Citacao[]>([]);
  const [msg, setMsg] = useState("");

  async function buscar() {
    setEstado("pensando");
    try {
      const c = await sugerirCitacoes(titulo, autor);
      setLista(c);
      setEstado("pronto");
    } catch (x) {
      setMsg(x instanceof ErroIA ? x.message : "não deu para pesquisar agora.");
      setEstado("erro");
    }
  }

  return (
    <div className="mt-1.5">
      {estado !== "pronto" ? (
        <button
          type="button"
          onClick={buscar}
          disabled={estado === "pensando"}
          className="min-h-9 text-xs font-semibold text-bordo underline underline-offset-4 disabled:opacity-60"
        >
          {estado === "pensando"
            ? "✦ procurando citações na internet…"
            : "✦ sugerir citações com IA"}
        </button>
      ) : null}
      {estado === "erro" ? <p className="text-xs text-cinza">{msg}</p> : null}
      {estado === "pronto" ? (
        lista.length ? (
          <div className="mt-1 space-y-1.5">
            <p className="text-[11px] text-cinza">
              toque numa para usar (confira com o seu livro ✦)
            </p>
            <ul className="space-y-1.5">
              {lista.map((c) => (
                <li key={c.texto}>
                  <button
                    type="button"
                    onClick={() => {
                      onEscolher(c);
                      setEstado(null);
                    }}
                    className="w-full rounded-md border border-linha bg-creme-quente px-3 py-2 text-left font-accent text-[13px] leading-snug italic hover:border-bordo"
                  >
                    “{c.texto}”
                    {c.spoiler ? (
                      <span className="ml-1.5 not-italic text-[10px] font-semibold tracking-[.08em] text-bordo uppercase">
                        spoiler
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setEstado(null)}
              className="min-h-9 text-xs text-cinza underline"
            >
              fechar
            </button>
          </div>
        ) : (
          <p className="text-xs text-cinza">
            não achei citações conhecidas desse livro.{" "}
            <button
              type="button"
              onClick={() => setEstado(null)}
              className="underline"
            >
              ok
            </button>
          </p>
        )
      ) : null}
    </div>
  );
}
