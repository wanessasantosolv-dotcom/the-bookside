"use client";

import Link from "next/link";
import { CapaLivro } from "@/components/CapaLivro";
import { corDoLivro } from "@/lib/cores";
import { mediaTexto, numero, type Numeros } from "@/lib/numeros";

/** Números na versão web: topo bordô + 4 números grandes + gêneros e destaques. */
export function NumerosWeb({ n, nome, frase }: { n: Numeros; nome: string; frase: string }) {
  const destaques = [
    n.livroDoAno ? { l: n.livroDoAno, rot: "mais amado", info: "★".repeat(Math.round(n.livroDoAno.nota ?? 0)) } : null,
    n.maisLongo ? { l: n.maisLongo, rot: "mais longo", info: `${n.maisLongoPaginas} pág.` } : null,
    n.lidos[0] ? { l: n.lidos[0], rot: "mais recente", info: new Date(n.lidos[0].lidoEm!).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) } : null,
  ].filter((d) => d !== null);

  return (
    <div className="hidden min-h-dvh bg-jornal font-texto text-tinta lg:block">
      <div className="relative flex h-[200px] flex-col justify-center bg-[linear-gradient(135deg,#692536,#3C1420)] px-14">
        <div aria-hidden className="absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent,transparent_38px,rgba(255,255,255,.03)_38px,rgba(255,255,255,.03)_76px)]" />
        <p className="relative text-[10px] font-semibold tracking-[.2em] text-[#D9A9B4] uppercase">retrospectiva {n.ano}</p>
        <h1 className="relative mt-2.5 font-revista text-[44px] leading-none text-jornal italic">o ano de {nome || "você"} em livros</h1>
      </div>

      <div className="px-14 pt-12 pb-16">
        <div className="mb-14 grid grid-cols-4 gap-6">
          {[
            { v: numero(n.total), r: n.total === 1 ? "livro lido" : "livros lidos" },
            { v: numero(n.paginas), r: "páginas" },
            { v: mediaTexto(n.media), r: "média de avaliação" },
            { v: n.meta ? `${n.total}/${n.meta}` : "—", r: n.ritmo ?? "sem meta" },
          ].map((c) => (
            <div key={c.r} className="rounded-md border border-fio px-6 py-7 text-center">
              <b className="block font-revista text-5xl leading-none font-normal text-vinho">{c.v}</b>
              <span className="mt-2.5 block text-[10px] leading-[1.3] font-semibold tracking-[.14em] text-grafite uppercase">{c.r}</span>
            </div>
          ))}
        </div>

        <div className="mb-14 grid grid-cols-2 gap-12">
          <section>
            <h2 className="mb-[18px] border-b border-tinta pb-2 font-revista text-[22px] leading-none italic">gêneros</h2>
            {n.generos.length ? (
              n.generos.slice(0, 6).map((g) => {
                const pct = Math.round((g.qtd / n.total) * 100);
                return (
                  <div key={g.nome} className="mb-3 flex items-center gap-3.5">
                    <span className="w-[140px] flex-none truncate text-xs font-semibold">{g.nome}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#F3ECDF]">
                      <i className="block h-full rounded-full bg-vinho" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right font-mono text-[11px] font-semibold text-grafite">{pct}%</span>
                  </div>
                );
              })
            ) : (
              <p className="font-revista text-sm italic text-grafite">os gêneros aparecem quando você terminar o primeiro livro do ano.</p>
            )}

            <h2 className="mt-10 mb-[18px] border-b border-tinta pb-2 font-revista text-[22px] leading-none italic">livros por mês</h2>
            <GraficoMeses n={n} alto={110} />
          </section>

          <section>
            <h2 className="mb-[18px] border-b border-tinta pb-2 font-revista text-[22px] leading-none italic">destaques do ano</h2>
            {destaques.length ? (
              <div className="flex gap-[18px]">
                {destaques.map(({ l, rot, info }) => (
                  <Link key={rot} href={`/livro/${l.id}`} className="flex-1 rounded-[4px] border border-fio p-4 text-center hover:bg-[#F3ECDF]">
                    <CapaLivro titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className="mx-auto w-[84px] [&>span:last-child]:text-[10px]" />
                    <p className="mt-2.5 font-revista text-[15px] italic">{rot}</p>
                    <span className="mt-1 block text-[11px] text-grafite">{info}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="font-revista text-sm italic text-grafite">seus destaques aparecem aqui ao longo do ano.</p>
            )}

            <h2 className="mt-10 mb-[18px] border-b border-tinta pb-2 font-revista text-[22px] leading-none italic">quem você mais leu</h2>
            <ol>
              {n.autores.map((a, i) => (
                <li key={a.nome} className="flex items-center gap-3 border-t border-fio py-2.5 first:border-t-0">
                  <span className="font-mono text-xs font-bold text-vinho">{String(i + 1).padStart(2, "0")}—</span>
                  <span className="font-revista text-base italic">{a.nome}</span>
                  <span className="ml-auto text-xs text-grafite">
                    {a.qtd} {a.qtd === 1 ? "livro" : "livros"}
                    {a.media ? ` · ${mediaTexto(a.media)}` : ""}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {frase ? (
          <div className="border-y border-tinta py-6 text-center">
            <p className="font-revista text-[22px] italic text-vinho">“{frase}”</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Barras de livros por mês; o mês mais forte fica em bordô. */
export function GraficoMeses({ n, alto = 88 }: { n: Numeros; alto?: number }) {
  const max = Math.max(1, ...n.porMes.map((m) => m.livros));
  return (
    <figure>
      <div className="flex items-end gap-[5px]" style={{ height: alto }} role="img" aria-label={`livros por mês: ${n.porMes.map((m) => `${m.mes} ${m.livros}`).join(", ")}`}>
        {n.porMes.map((m) => (
          <i
            key={m.mes}
            className="flex-1 rounded-t-[3px]"
            style={{
              height: m.livros ? Math.max(8, (m.livros / max) * alto) : 4,
              background: !m.livros ? "#E6D5CE" : m === n.maisForte ? "#6B0D24" : "#B75A6B",
            }}
          />
        ))}
      </div>
      <div aria-hidden className="mt-2 flex gap-[5px]">
        {n.porMes.map((m) => (
          <span key={m.mes} className="flex-1 text-center text-[9px] font-semibold text-cinza uppercase">
            {m.mes[0]}
          </span>
        ))}
      </div>
    </figure>
  );
}
