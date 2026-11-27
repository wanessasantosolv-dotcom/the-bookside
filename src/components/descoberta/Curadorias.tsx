"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { CURADORIAS } from "@/lib/curadorias";

/** pequenas curadorias: duas colunas no celular, mais no computador; cada uma abre na busca */
export function PequenasCuradorias({ explorar }: { explorar: (consulta: string) => void }) {
  const [todas, setTodas] = useState(false);
  const lista = todas ? CURADORIAS : CURADORIAS.slice(0, 6);
  return (
    <section aria-labelledby="d-curadorias">
      <h2 id="d-curadorias" className="font-revista text-[22px] leading-none text-ameixa">
        Pequenas curadorias
      </h2>
      <p className="mt-1 text-[13px] text-cinza">Histórias reunidas por aquilo que têm em comum.</p>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
        {lista.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => explorar(c.consulta)} className="group block w-full overflow-hidden rounded-[8px] border border-linha bg-creme-quente text-left hover:border-bege">
              <span className="relative block aspect-[4/3] overflow-hidden bg-papel">
                <img src={`/nas-entrelinhas/perguntas/${c.imagem}.png`} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-1" style={{ background: c.cor }} />
              </span>
              <span className="block px-3 pt-2.5 pb-3">
                <span className="block font-revista text-[16px] leading-tight text-ameixa">{c.nome}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-tinta-suave">{c.descricao}</span>
                <span className="mt-2 block text-[12px] font-semibold text-bordo">Explorar seleção</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!todas ? (
        <button type="button" onClick={() => setTodas(true)} className="mt-3 min-h-10 text-[13px] font-semibold text-bordo">
          Ver mais curadorias
        </button>
      ) : null}
    </section>
  );
}
