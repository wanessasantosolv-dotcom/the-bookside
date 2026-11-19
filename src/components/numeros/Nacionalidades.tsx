"use client";

import { useEffect, useState } from "react";
import { bandeira, paisesDasAutoras, type Pais } from "@/lib/nacionalidade";
import { usePerfil } from "@/lib/perfil-store";

/** "de onde vêm suas leituras": os países das autoras dos livros lidos. */
export function Nacionalidades({ web }: { web?: boolean }) {
  const livros = usePerfil((s) => s.livros);
  const lidos = livros.filter((l) => l.status === "lido");
  const autores = lidos.map((l) => l.autor);
  const chave = [...new Set(autores)].sort().join("|");
  const [paises, setPaises] = useState<Record<string, Pais | null> | null>(
    null,
  );

  useEffect(() => {
    let vivo = true;
    paisesDasAutoras(chave ? chave.split("|") : []).then(
      (c) => vivo && setPaises({ ...c }),
    );
    return () => {
      vivo = false;
    };
  }, [chave]);

  if (!lidos.length) return null;
  const conta = new Map<string, { pais: Pais; qtd: number }>();
  for (const l of lidos) {
    const p = paises?.[l.autor.toLowerCase()];
    if (!p) continue;
    const x = conta.get(p.nome) ?? { pais: p, qtd: 0 };
    x.qtd++;
    conta.set(p.nome, x);
  }
  const lista = [...conta.values()].sort((a, b) => b.qtd - a.qtd);
  const total = lista.reduce((t, x) => t + x.qtd, 0);
  const titulo = web
    ? "mb-[18px] border-b border-ameixa pb-2 font-revista text-[22px] leading-none text-ameixa italic"
    : "eyebrow mb-3 text-bordo";

  return (
    <section className={web ? "mb-14" : "mb-4"}>
      <h2 className={titulo}>de onde vêm suas leituras</h2>
      {!paises ? (
        <p className="font-accent text-sm italic text-cinza">
          procurando de onde são as autoras…
        </p>
      ) : !lista.length ? (
        <p className="font-accent text-sm italic text-cinza">
          não achei a nacionalidade das autoras ainda.
        </p>
      ) : (
        <div className="rounded-md border border-linha bg-creme-quente p-4 lg:rounded-[4px] lg:p-5">
          <p
            className={`text-bordo italic ${web ? "font-revista text-2xl" : "font-display text-xl font-semibold"}`}
          >
            {lista.length} {lista.length === 1 ? "país" : "países"} ✦{" "}
            <span className="text-[15px] text-cinza">
              mais lido: {bandeira(lista[0].pais.codigo)} {lista[0].pais.nome}
            </span>
          </p>
          <ul className={`mt-4 grid gap-2.5 ${web ? "grid-cols-2" : ""}`}>
            {lista.slice(0, 10).map(({ pais, qtd }) => (
              <li key={pais.nome} className="flex items-center gap-3">
                <span className="w-7 text-center text-xl">
                  {bandeira(pais.codigo)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between text-[13px]">
                    <b className="truncate font-semibold">{pais.nome}</b>
                    <span className="text-cinza">
                      {qtd} {qtd === 1 ? "livro" : "livros"}
                    </span>
                  </span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-linha/70">
                    <span
                      className="block h-full rounded-full bg-bordo"
                      style={{ width: `${(qtd / total) * 100}%` }}
                    />
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-cinza">
            pela nacionalidade das autoras · fonte: Wikidata
          </p>
        </div>
      )}
    </section>
  );
}
