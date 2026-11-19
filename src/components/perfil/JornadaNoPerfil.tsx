"use client";

import Link from "next/link";
import { ExtremosDoAno } from "@/components/numeros/Extremos";
import { FormatosDoAno } from "@/components/numeros/Formatos";
import { MesAMes } from "@/components/numeros/MesAMes";
import { MesEmRevista } from "@/components/numeros/MesEmRevista";
import { GraficoMeses } from "@/components/numeros/NumerosWeb";
import { Nacionalidades } from "@/components/numeros/Nacionalidades";
import { calcularNumeros, mediaTexto, numero } from "@/lib/numeros";
import { usePerfil } from "@/lib/perfil-store";

/** A jornada dentro do perfil (aba "jornada"). */
export function JornadaNoPerfil() {
  const livros = usePerfil((s) => s.livros);
  const meta = usePerfil((s) => s.meta);
  const n = calcularNumeros(livros, meta);
  const cartoes = [
    { v: numero(n.total), r: n.total === 1 ? "livro lido" : "livros lidos" },
    { v: n.paginasConhecidas ? numero(n.paginas) : "—", r: "páginas" },
    { v: mediaTexto(n.media), r: "nota média" },
    {
      v: n.meta ? `${n.total}/${n.meta}` : "—",
      r: n.meta ? "da meta" : "sem meta",
    },
  ];
  const atalho =
    "flex flex-1 items-center justify-center gap-1.5 rounded-pill border border-bege bg-creme-quente px-3 py-2.5 text-xs font-semibold text-ameixa hover:border-bordo";
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cartoes.map((c) => (
          <div
            key={c.r}
            className="rounded-md border border-linha bg-creme-quente p-4 text-center lg:rounded-[4px]"
          >
            <b className="block font-display text-[26px] leading-none font-semibold italic text-[var(--acc,var(--color-bordo))] lg:font-revista lg:font-normal">
              {c.v}
            </b>
            <span className="mt-1.5 block text-[10px] font-semibold tracking-[.1em] text-cinza uppercase">
              {c.r}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/numeros/calendario" className={atalho}>
          📅 calendário
        </Link>
        <Link href="/desafios" className={atalho}>
          🏆 desafios
        </Link>
        <Link href="/numeros/generos" className={atalho}>
          📚 gêneros
        </Link>
      </div>
      <section className="rounded-md border border-linha bg-creme-quente p-4 lg:rounded-[4px]">
        <p className="eyebrow mb-3 text-bordo">livros por mês</p>
        <GraficoMeses n={n} />
      </section>
      <MesEmRevista />
      <Nacionalidades />
      <ExtremosDoAno n={n} />
      <FormatosDoAno n={n} />
      <MesAMes n={n} />
    </div>
  );
}
