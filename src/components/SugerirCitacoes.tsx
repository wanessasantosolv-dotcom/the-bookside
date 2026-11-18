"use client";

import { useState } from "react";
import { citacoesDoLivro, type Citacao } from "@/lib/fontes";

/** "✦ procurar citações": busca no Wikiquote (página do livro ou da autora) frases do livro para a pessoa escolher. */
export function SugerirCitacoes({
  titulo,
  autor,
  onEscolher,
}: {
  titulo: string;
  autor?: string;
  onEscolher: (c: Citacao) => void;
}) {
  const [estado, setEstado] = useState<"procurando" | "pronto" | "erro" | null>(
    null,
  );
  const [lista, setLista] = useState<Citacao[]>([]);

  async function buscar() {
    setEstado("procurando");
    try {
      setLista(await citacoesDoLivro(titulo, autor));
      setEstado("pronto");
    } catch {
      setEstado("erro");
    }
  }

  const fechar = (
    <button
      type="button"
      onClick={() => setEstado(null)}
      className="min-h-9 text-xs text-cinza underline"
    >
      fechar
    </button>
  );

  return (
    <div className="mt-1.5">
      {estado !== "pronto" ? (
        <button
          type="button"
          onClick={buscar}
          disabled={estado === "procurando"}
          className="min-h-9 text-xs font-semibold text-bordo underline underline-offset-4 disabled:opacity-60"
        >
          {estado === "procurando"
            ? "✦ procurando citações…"
            : "✦ procurar citações conhecidas"}
        </button>
      ) : null}
      {estado === "erro" ? (
        <p className="text-xs text-cinza">sem conexão agora. tente de novo.</p>
      ) : null}
      {estado === "pronto" ? (
        lista.length ? (
          <div className="mt-1 space-y-1.5">
            <p className="text-[11px] text-cinza">
              do {lista[0].fonte}
              {lista[0].idioma === "en"
                ? " (em inglês: não achei em português)"
                : ""}
              . toque numa para usar.
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
                  </button>
                </li>
              ))}
            </ul>
            {fechar}
          </div>
        ) : (
          <p className="text-xs text-cinza">
            não achei citações desse livro no Wikiquote. escreva a sua favorita
            ✦ {fechar}
          </p>
        )
      ) : null}
    </div>
  );
}
