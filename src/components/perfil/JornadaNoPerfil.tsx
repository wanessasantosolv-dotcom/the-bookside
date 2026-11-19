"use client";

import Link from "next/link";
import { useState } from "react";
import { ExtremosDoAno } from "@/components/numeros/Extremos";
import { FormatosDoAno } from "@/components/numeros/Formatos";
import { MesAMes } from "@/components/numeros/MesAMes";
import { MesEmRevista } from "@/components/numeros/MesEmRevista";
import { Nacionalidades } from "@/components/numeros/Nacionalidades";
import { GraficoMeses } from "@/components/numeros/NumerosWeb";
import {
  anoDaRetrospectiva,
  calcularNumeros,
  mediaTexto,
  numero,
} from "@/lib/numeros";
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
  const anoRetro = anoDaRetrospectiva();
  const n = calcularNumeros(livros, meta);
  const pct = n.meta ? Math.min(100, (n.total / n.meta) * 100) : 0;

  const atalho =
    "flex flex-1 items-center gap-3 rounded-xl border border-linha bg-creme-quente p-3.5 hover:border-bordo lg:rounded-[6px]";

  return (
    <div className="space-y-6">
      {/* o resumo, sempre à vista */}
      <div className="rounded-xl border border-linha bg-creme-quente p-5 lg:rounded-[6px] lg:p-6">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <p className="font-display text-[44px] leading-none font-semibold italic text-[var(--acc,var(--color-bordo))] lg:font-revista lg:font-normal">
            {numero(n.total)}
            <span className="ml-2 font-sans text-sm font-semibold text-cinza not-italic">
              {n.total === 1 ? "livro" : "livros"} em {n.ano}
            </span>
          </p>
          <p className="flex gap-5 text-[13px] text-cinza">
            <span>
              <b className="text-ameixa">
                {n.paginasConhecidas ? numero(n.paginas) : "—"}
              </b>{" "}
              páginas
            </span>
            <span>
              <b className="text-ameixa">{mediaTexto(n.media)}</b> de média
            </span>
          </p>
        </div>
        {n.meta ? (
          <>
            <span className="mt-4 block h-2 overflow-hidden rounded-full bg-linha/70">
              <span
                className="block h-full rounded-full bg-[var(--acc,var(--color-bordo))]"
                style={{ width: `${pct}%` }}
              />
            </span>
            <p className="mt-1.5 text-xs text-cinza">
              {n.faltam
                ? `${n.total} de ${n.meta} · faltam ${n.faltam}`
                : "meta batida ✦"}
            </p>
          </>
        ) : null}
      </div>

      {/* a retrospectiva do ano: aparece sozinha na penúltima semana do ano */}
      {anoRetro ? (
        <Link
          href="/numeros/retrospectiva"
          className="inverso block rounded-xl bg-gradient-to-br from-ameixa to-bordo p-6 text-creme lg:rounded-[6px]"
        >
          <span className="block text-[10px] font-semibold tracking-[.2em] text-rosa-claro uppercase">
            chegou ✦ retrospectiva
          </span>
          <span className="mt-1.5 block font-display text-[30px] leading-tight font-semibold italic lg:font-revista lg:font-normal">
            seu {anoRetro} em livros
          </span>
          <span className="mt-4 inline-flex h-10 items-center rounded-pill bg-creme px-5 text-[13px] font-semibold text-bordo">
            abrir a retrospectiva →
          </span>
        </Link>
      ) : null}

      <MesEmRevista />

      {/* atalhos */}
      <div className="flex gap-3">
        <Link href="/numeros/calendario" className={atalho}>
          <span className="text-xl">📅</span>
          <span className="text-[13px] font-semibold">calendário</span>
        </Link>
        <Link href="/desafios" className={atalho}>
          <span className="text-xl">🏆</span>
          <span className="text-[13px] font-semibold">desafios</span>
        </Link>
      </div>

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
          <section className="rounded-xl border border-linha bg-creme-quente p-5 lg:rounded-[6px]">
            <p className="eyebrow mb-3 text-bordo">livros por mês</p>
            <GraficoMeses n={n} />
            {n.maisForte ? (
              <p className="mt-3 font-accent text-[13px] italic text-cinza">
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
