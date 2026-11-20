"use client";

import Link from "next/link";
import { ExtremosDoAno } from "@/components/numeros/Extremos";
import { FormatosDoAno } from "@/components/numeros/Formatos";
import { MesAMes } from "@/components/numeros/MesAMes";
import { Nacionalidades } from "@/components/numeros/Nacionalidades";
import { MesEmRevista } from "@/components/numeros/MesEmRevista";
import {
  bloco,
  NumerosShell,
  SemLeituras,
} from "@/components/numeros/NumerosShell";
import { GraficoMeses } from "@/components/numeros/NumerosWeb";
import {
  mediaTexto,
  numero,
  type Numeros,
  wrappedLiberado,
} from "@/lib/numeros";

function subtitulo(n: Numeros) {
  if (!n.meta)
    return `${n.total} ${n.total === 1 ? "livro" : "livros"} até agora · sem meta, só leitura ✦`;
  if (n.ritmo === "meta batida")
    return `${n.total} de ${n.meta} livros · meta batida! ✦`;
  return `${n.total} de ${n.meta} livros · ${n.ritmo === "no ritmo" ? "você está no ritmo ✦" : "dá tempo de alcançar ✧"}`;
}

export default function NumerosAnoPage() {
  return (
    <NumerosShell aba="ano" titulo="este ano" subtitulo={subtitulo}>
      {(n) => (
        <>
          <div className={`${bloco} animate-subir pb-4`}>
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
                  {n.meta
                    ? `${Math.round(Math.min(1, n.total / n.meta) * 100)}%`
                    : "✦"}
                </span>
              </span>
              <div className="min-w-0">
                <p className="eyebrow text-bordo">meta de leitura</p>
                {n.meta ? (
                  n.faltam ? (
                    <>
                      <p className="mt-2 font-accent text-[17px] leading-[1.3] italic">
                        faltam {n.faltam} {n.faltam === 1 ? "livro" : "livros"}
                        <br />
                        para fechar o ano
                      </p>
                      <p className="mt-2 text-[13px] text-cinza">
                        cerca de {n.porSemana.toLocaleString("pt-BR")} por semana
                        ✧
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
            <>
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

              <div className={`${bloco} pt-3.5`}>
                <p className="font-maquina mb-3 block text-[9.5px] tracking-[.12em] text-rosa-antigo uppercase">
                  livros por mês
                </p>
                <GraficoMeses n={n} />
                {n.maisForte ? (
                  <p className="mt-3 border-t border-dashed border-linha pt-2.5 font-accent text-[13px] italic text-cinza">
                    {n.maisForte.mes} foi seu mês mais forte, com{" "}
                    {n.maisForte.livros}{" "}
                    {n.maisForte.livros === 1 ? "livro" : "livros"} ✦
                  </p>
                ) : null}
              </div>

              <MesEmRevista />
              <Link
                href="/desafios"
                className={`${bloco} mb-4 flex items-center justify-between gap-3 hover:border-bordo`}
              >
                <span className="min-w-0">
                  <span className="font-maquina block text-[9px] tracking-[.12em] text-rosa-antigo uppercase">
                    na sua jornada também
                  </span>
                  <span className="mt-1 block font-display text-[19px] leading-tight font-semibold italic text-ameixa">
                    desafios de leitura
                  </span>
                  <span className="mt-0.5 block text-xs text-cinza">
                    sozinha, com amigos ou com o clube
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
              <ExtremosDoAno n={n} />
              <FormatosDoAno n={n} />
              <Nacionalidades />
              <MesAMes n={n} />

              {wrappedLiberado() ? (
                <Link
                  href="/numeros/retrospectiva"
                  className="inverso mt-auto flex h-[50px] items-center justify-between rounded-md bg-ameixa px-[18px] text-sm font-semibold text-creme hover:bg-bordo-escuro"
                >
                  <span>ver sua retrospectiva de {n.ano}</span>
                  <span aria-hidden>→</span>
                </Link>
              ) : null}
            </>
          ) : (
            <SemLeituras ano={n.ano} />
          )}
        </>
      )}
    </NumerosShell>
  );
}
