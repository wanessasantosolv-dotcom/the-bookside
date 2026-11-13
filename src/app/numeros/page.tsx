"use client";

import Link from "next/link";
import { bloco, NumerosShell, SemLeituras } from "@/components/numeros/NumerosShell";
import { GraficoMeses } from "@/components/numeros/NumerosWeb";
import { mediaTexto, numero, type Numeros } from "@/lib/numeros";

function subtitulo(n: Numeros) {
  if (!n.meta) return `${n.total} ${n.total === 1 ? "livro" : "livros"} até agora · sem meta, só leitura ✦`;
  if (n.ritmo === "meta batida") return `${n.total} de ${n.meta} livros · meta batida! ✦`;
  return `${n.total} de ${n.meta} livros · ${n.ritmo === "no ritmo" ? "você está no ritmo ✦" : "dá tempo de alcançar ✧"}`;
}

/** Anel da meta: quanto do ano já foi lido. */
function AnelMeta({ n }: { n: Numeros }) {
  const r = 54;
  const volta = 2 * Math.PI * r;
  const pct = n.meta ? Math.min(1, n.total / n.meta) : 0;
  return (
    <svg width="124" height="124" viewBox="0 0 124 124" className="flex-none" role="img" aria-label={n.meta ? `${n.total} de ${n.meta} livros` : `${n.total} livros`}>
      <circle cx="62" cy="62" r={r} fill="none" stroke="#F0E6DC" strokeWidth="12" />
      {n.meta ? (
        <circle
          cx="62"
          cy="62"
          r={r}
          fill="none"
          stroke="#6B0D24"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={volta}
          strokeDashoffset={volta * (1 - pct)}
          transform="rotate(-90 62 62)"
        />
      ) : null}
      <text x="62" y="60" textAnchor="middle" className="font-display" fontStyle="italic" fontWeight="700" fontSize="30" fill="#6B0D24">
        {n.total}
      </text>
      <text x="62" y="80" textAnchor="middle" fontWeight="500" fontSize="11" fill="#7A6A6E">
        {n.meta ? `de ${n.meta}` : "livros"}
      </text>
    </svg>
  );
}

export default function NumerosAnoPage() {
  return (
    <NumerosShell aba="ano" titulo="este ano" subtitulo={subtitulo}>
      {(n) => (
        <>
          <div className={`${bloco} flex animate-subir items-center gap-[18px]`}>
            <AnelMeta n={n} />
            <div>
              <p className="eyebrow text-bordo">meta de leitura</p>
              {n.meta ? (
                n.faltam ? (
                  <>
                    <p className="mt-2 font-accent text-[19px] leading-[1.3] italic">
                      faltam {n.faltam} {n.faltam === 1 ? "livro" : "livros"}
                      <br />
                      para fechar o ano
                    </p>
                    <p className="mt-2 text-[13px] text-cinza">cerca de {n.porSemana.toLocaleString("pt-BR")} por semana ✧</p>
                  </>
                ) : (
                  <p className="mt-2 font-accent text-[19px] leading-[1.3] italic">meta batida! tudo agora é bônus ✦</p>
                )
              ) : (
                <>
                  <p className="mt-2 font-accent text-[19px] leading-[1.3] italic">sem meta este ano</p>
                  <Link href="/perfil/editar" className="mt-1 inline-flex min-h-11 items-center text-[13px] font-semibold text-bordo">
                    definir uma meta →
                  </Link>
                </>
              )}
            </div>
          </div>

          {n.total ? (
            <>
              <div className={`${bloco} flex px-2.5 py-3.5`}>
                {[
                  { v: n.paginasConhecidas ? numero(n.paginas) : "—", r: "páginas" },
                  { v: mediaTexto(n.media), r: "média" },
                  { v: n.paginasPorLivro ? numero(n.paginasPorLivro) : "—", r: "págs/livro" },
                ].map((c, i) => (
                  <div key={c.r} className={`flex-1 text-center ${i ? "border-l border-linha" : ""}`}>
                    <span className="block font-display text-[26px] leading-none font-bold italic text-bordo">{c.v}</span>
                    <span className="mt-[7px] block text-[10px] leading-[1.2] font-medium text-cinza">{c.r}</span>
                  </div>
                ))}
              </div>

              <div className={`${bloco} pt-3.5`}>
                <p className="eyebrow mb-3 text-bordo">livros por mês</p>
                <GraficoMeses n={n} />
                {n.maisForte ? (
                  <p className="mt-3 font-accent text-[13px] italic text-cinza">
                    {n.maisForte.mes} foi seu mês mais forte, com {n.maisForte.livros} {n.maisForte.livros === 1 ? "livro" : "livros"} ✦
                  </p>
                ) : null}
              </div>

              <Link
                href="/numeros/retrospectiva"
                className="mt-auto flex h-[50px] items-center justify-between rounded-md bg-ameixa px-[18px] text-sm font-semibold text-creme hover:bg-bordo-escuro"
              >
                <span>ver sua retrospectiva de {n.ano}</span>
                <span aria-hidden>→</span>
              </Link>
            </>
          ) : (
            <SemLeituras ano={n.ano} />
          )}
        </>
      )}
    </NumerosShell>
  );
}
