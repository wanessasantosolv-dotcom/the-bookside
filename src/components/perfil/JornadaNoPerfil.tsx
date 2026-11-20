"use client";

import Link from "next/link";
import { useState } from "react";
import { ExtremosDoAno } from "@/components/numeros/Extremos";
import { FormatosDoAno } from "@/components/numeros/Formatos";
import { MesAMes } from "@/components/numeros/MesAMes";
import { MesEmRevista } from "@/components/numeros/MesEmRevista";
import { Nacionalidades } from "@/components/numeros/Nacionalidades";
import { bloco } from "@/components/numeros/NumerosShell";
import { GraficoMeses } from "@/components/numeros/NumerosWeb";
import { calcularNumeros, mediaTexto, numero } from "@/lib/numeros";
import { usePerfil } from "@/lib/perfil-store";

type Parte = "ano" | "destaques" | "jeito";
const partes: { id: Parte; nome: string }[] = [
  { id: "ano", nome: "o ano" },
  { id: "destaques", nome: "destaques" },
  { id: "jeito", nome: "seu jeito de ler" },
];

/**
 * A jornada dentro do perfil, em partes (uma de cada vez):
 * o ano (números, meta, meses) · destaques (extremos, mês a mês) ·
 * seu jeito de ler (formatos, países). Calendário e desafios ficam nos atalhos.
 */
export function JornadaNoPerfil() {
  const livros = usePerfil((s) => s.livros);
  const meta = usePerfil((s) => s.meta);
  const [parte, setParte] = useState<Parte>("ano");
  const n = calcularNumeros(livros, meta);
  const pct = n.meta ? Math.min(100, (n.total / n.meta) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* o resumo, sempre à vista: a ficha "registro de leitura" */}
      <div className="space-y-2">
        <div className={`${bloco} pb-4`}>
          <div className="flex items-center justify-between border-b border-linha pb-2.5">
            <span className="font-maquina text-[9px] tracking-[.12em] text-rosa-antigo uppercase">
              registro de leitura · {n.ano}
            </span>
            <span className="font-maquina text-[9px] tracking-[.1em] text-cinza uppercase">
              {n.meta ? `${n.total} / ${n.meta}` : `${n.total} livros`}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-4">
            <span
              aria-hidden
              className="flex size-[62px] flex-none -rotate-6 items-center justify-center rounded-full border-[1.6px] border-dashed border-bordo text-center"
            >
              <span className="font-display text-base leading-none font-bold text-bordo italic">
                {n.meta ? `${Math.round(pct)}%` : "✦"}
              </span>
            </span>
            <div className="min-w-0">
              <p className="eyebrow text-bordo">meta de leitura</p>
              {n.meta ? (
                n.faltam ? (
                  <>
                    <p className="mt-2 font-accent text-[17px] leading-[1.3] italic">
                      faltam {n.faltam} {n.faltam === 1 ? "livro" : "livros"}{" "}
                      para fechar o ano
                    </p>
                    <p className="mt-1 text-[13px] text-cinza">
                      cerca de {n.porSemana.toLocaleString("pt-BR")} por semana ✧
                    </p>
                  </>
                ) : (
                  <p className="mt-2 font-accent text-[17px] leading-[1.3] italic">
                    meta batida! tudo agora é bônus ✦
                  </p>
                )
              ) : (
                <>
                  <p className="mt-2 font-accent text-[17px] leading-[1.3] italic">
                    sem meta este ano
                  </p>
                  <Link
                    href="/perfil/editar"
                    className="mt-1 inline-flex min-h-11 items-center text-[13px] font-semibold text-bordo"
                  >
                    definir uma meta →
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        {n.total ? (
          <div className={`${bloco} pt-3.5`}>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                {
                  v: n.paginasConhecidas ? numero(n.paginas) : "—",
                  r: "páginas",
                },
                { v: mediaTexto(n.media), r: "média" },
                {
                  v: n.paginasPorLivro ? numero(n.paginasPorLivro) : "—",
                  r: "págs/livro",
                },
              ].map((c) => (
                <div
                  key={c.r}
                  className="border-t border-dashed border-linha pt-2 text-center"
                >
                  <span className="block font-display text-[24px] leading-none font-bold italic text-bordo">
                    {c.v}
                  </span>
                  <span className="font-maquina mt-[7px] block text-[8.5px] leading-[1.2] tracking-[.06em] text-cinza uppercase">
                    {c.r}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <MesEmRevista />

      {/* atalho: desafios agora mora no início */}
      <Link
        href="/numeros/calendario"
        className={`${bloco} flex items-center justify-between gap-3 hover:border-bordo`}
      >
        <span className="min-w-0">
          <span className="font-maquina block text-[9px] tracking-[.12em] text-rosa-antigo uppercase">
            na sua jornada também
          </span>
          <span className="mt-1 block font-display text-[19px] leading-tight font-semibold italic text-ameixa">
            calendário de leitura
          </span>
          <span className="mt-0.5 block text-xs text-cinza">
            as capas de cada dia em que você leu
          </span>
        </span>
        <span
          aria-hidden
          className="font-maquina flex size-9 flex-none rotate-[6deg] items-center justify-center rounded-full border border-dashed border-ouro text-center text-[7px] leading-tight text-ouro"
        >
          ver
          <br />
          mais
        </span>
      </Link>

      {/* as partes */}
      <div
        role="tablist"
        aria-label="partes da jornada"
        className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]"
      >
        {partes.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={parte === p.id}
            onClick={() => setParte(p.id)}
            className={`flex h-9 flex-none items-center rounded-pill border px-4 text-xs font-semibold whitespace-nowrap ${
              parte === p.id
                ? "border-bordo bg-bordo text-creme"
                : "border-bege bg-creme-quente text-ameixa"
            }`}
          >
            {p.nome}
          </button>
        ))}
      </div>

      {parte === "ano" ? (
        <div className="space-y-6">
          <section className={`${bloco} pt-3.5`}>
            <p className="font-maquina mb-3 block text-[9.5px] tracking-[.12em] text-rosa-antigo uppercase">
              livros por mês
            </p>
            <GraficoMeses n={n} />
            {n.maisForte ? (
              <p className="mt-3 border-t border-dashed border-linha pt-2.5 font-accent text-[13px] italic text-cinza">
                {n.maisForte.mes} foi seu mês mais forte ✦
              </p>
            ) : null}
          </section>
        </div>
      ) : parte === "destaques" ? (
        <div className="space-y-2">
          <ExtremosDoAno n={n} />
          <MesAMes n={n} />
        </div>
      ) : (
        <div className="space-y-2">
          <FormatosDoAno n={n} />
          <Nacionalidades />
          <Link
            href="/numeros/generos"
            className="inline-flex min-h-10 items-center text-[13px] font-semibold text-bordo underline underline-offset-4"
          >
            ver gêneros e autoras que mais leu →
          </Link>
        </div>
      )}
    </div>
  );
}
