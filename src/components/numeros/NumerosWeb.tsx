"use client";

import Link from "next/link";
import { useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { corDoLivro } from "@/lib/cores";
import { mediaTexto, numero, type Numeros } from "@/lib/numeros";

const CORES_GENERO = ["#6B0D24", "#8E1D3D", "#B75A6B", "#A88B64", "#6B7A5E", "#464052"];


/** Números na versão web: banner bordô + tudo numa tela só (exceto a retrospectiva, que vira um "wrapped" à parte). */
export function NumerosWeb({
  n,
  nome,
  frase,
  aba,
  totalVidaToda,
  anoInicio,
}: {
  n: Numeros;
  nome: string;
  frase: string;
  aba: "ano" | "generos" | "retro";
  totalVidaToda?: number;
  anoInicio?: number | null;
}) {
  const retro = aba === "retro";
  const eyebrow = retro ? `wrapped · ${n.ano}` : `seus números · ${n.ano}`;
  const h1 = retro ? `seu wrapped de ${n.ano}` : `sua leitura em ${n.ano}`;
  void nome;

  return (
    <div className="hidden min-h-dvh bg-creme font-sans text-ameixa lg:block">
      <div className="relative flex h-[200px] flex-col justify-center bg-gradient-to-br from-bordo to-bordo-escuro px-14">
        <div aria-hidden className="absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent,transparent_38px,rgba(255,255,255,.03)_38px,rgba(255,255,255,.03)_76px)]" />
        <p className="relative text-[10px] font-semibold tracking-[.2em] text-rosa-claro uppercase">{eyebrow}</p>
        <h1 className="relative mt-2.5 font-revista text-[44px] leading-none text-creme italic">{h1}</h1>
      </div>

      <div className="px-14 pt-12 pb-16">
        {retro ? (
          <ConteudoRetro n={n} frase={frase} />
        ) : (
          <ConteudoUnificado n={n} frase={frase} totalVidaToda={totalVidaToda} anoInicio={anoInicio} />
        )}
      </div>
    </div>
  );
}

/** Tudo numa tela só: cartões, gêneros, meses, destaques (com capa) e autores — com um único botão pro wrapped. */
function ConteudoUnificado({
  n,
  frase,
  totalVidaToda,
  anoInicio,
}: {
  n: Numeros;
  frase: string;
  totalVidaToda?: number;
  anoInicio?: number | null;
}) {
  // o mais recente: o último terminado (a lista não vem garantida em ordem)
  const recente = [...n.lidos].filter((l) => l.lidoEm).sort((a, b) => b.lidoEm!.localeCompare(a.lidoEm!))[0];
  const destaques = [
    n.livroDoAno ? { l: n.livroDoAno, rot: "mais amado", info: "★".repeat(Math.round(n.livroDoAno.nota ?? 0)) } : null,
    n.maisLongo ? { l: n.maisLongo, rot: "mais longo", info: `${n.maisLongoPaginas} pág.` } : null,
    recente ? { l: recente, rot: "mais recente", info: new Date(recente.lidoEm!).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) } : null,
  ].filter((d) => d !== null);

  if (!n.total) {
    return <p className="font-revista text-sm text-cinza italic">seus números aparecem aqui quando você terminar o primeiro livro do ano.</p>;
  }

  return (
    <>
      <div className="mb-14 flex items-center gap-10 rounded-md border border-linha px-8 py-7">
        {totalVidaToda && totalVidaToda > n.total ? (
          <div className="flex h-[132px] w-[132px] flex-none flex-col items-center justify-center rounded-full bg-gradient-to-br from-rosa-antigo to-bordo text-center shadow-[0_14px_26px_-12px_rgba(107,13,36,0.3)]">
            <b className="font-revista text-[34px] leading-none font-normal text-creme italic">{numero(totalVidaToda)}</b>
            <span className="mt-1.5 px-3 text-[8.5px] leading-[1.3] font-semibold tracking-[.1em] text-rosa-claro uppercase">
              livros{anoInicio ? ` desde ${anoInicio}` : " no total"}
            </span>
          </div>
        ) : null}
        <div className="grid flex-1 grid-cols-4">
          {[
            { v: numero(n.total), r: n.total === 1 ? "livro lido" : "livros lidos" },
            { v: numero(n.paginas), r: "páginas" },
            { v: mediaTexto(n.media), r: "média de avaliação" },
            { v: n.meta ? `${n.total}/${n.meta}` : "—", r: n.ritmo ?? "sem meta" },
          ].map((c, i) => (
            <div key={c.r} className={`px-5 text-center ${i > 0 ? "border-l border-linha" : ""}`}>
              <b className="block font-revista text-[34px] leading-none font-normal text-bordo italic">{c.v}</b>
              <span className="mt-2.5 block text-[9.5px] leading-[1.3] font-semibold tracking-[.1em] text-cinza uppercase">{c.r}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="mb-14">
        <h2 className="mb-[18px] border-b border-ameixa pb-2 font-revista text-[22px] leading-none text-ameixa italic">destaques do ano</h2>
        {destaques.length ? (
          <div className="grid grid-cols-3 gap-[18px]">
            {destaques.map(({ l, rot, info }) => (
              <Link key={rot} href={`/livro/${l.id}`} className="rounded-[4px] border border-linha p-5 text-center hover:bg-rosa-fundo">
                <CapaLivro titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className="mx-auto w-[128px] [&>span:last-child]:text-[11px]" />
                <p className="mt-3 font-revista text-base text-ameixa italic">{rot}</p>
                <span className="mt-1 block text-[11px] text-cinza">{info}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="font-revista text-sm text-cinza italic">seus destaques aparecem aqui ao longo do ano.</p>
        )}
      </section>

      <section className="mb-14">
        <h2 className="mb-[18px] border-b border-ameixa pb-2 font-revista text-[22px] leading-none text-ameixa italic">gêneros</h2>
        {n.generos.length ? (
          n.generos.map((g, i) => {
            const pct = Math.round((g.qtd / n.generos[0].qtd) * 100);
            return (
              <div key={g.nome} className="mb-3 flex items-center gap-3.5">
                <span className="w-[150px] flex-none truncate text-xs font-semibold">{g.nome}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#F0E6DC]">
                  <i className="block h-full rounded-full" style={{ width: `${pct}%`, background: CORES_GENERO[i % CORES_GENERO.length] }} />
                </div>
                <span className="w-14 text-right font-maquina text-[11px] font-semibold text-cinza">
                  {g.qtd} {g.qtd === 1 ? "livro" : "livros"}
                </span>
              </div>
            );
          })
        ) : (
          <p className="font-revista text-sm text-cinza italic">os gêneros aparecem quando você terminar o primeiro livro do ano.</p>
        )}
      </section>


      <div className="mb-14 grid grid-cols-2 gap-12">
        <section>
          <h2 className="mb-[18px] border-b border-ameixa pb-2 font-revista text-[22px] leading-none text-ameixa italic">livros por mês</h2>
          <GraficoMeses n={n} alto={110} />
        </section>

        <section>
          <h2 className="mb-[18px] border-b border-ameixa pb-2 font-revista text-[22px] leading-none text-ameixa italic">quem você mais leu</h2>
          <ol>
            {n.autores.map((a, i) => (
              <li key={a.nome} className="flex items-center gap-3 border-t border-linha py-2.5 first:border-t-0">
                <span className="font-maquina text-xs font-bold text-bordo">{String(i + 1).padStart(2, "0")}—</span>
                <span className="font-revista text-base text-ameixa italic">{a.nome}</span>
                <span className="ml-auto text-xs text-cinza">
                  {a.qtd} {a.qtd === 1 ? "livro" : "livros"}
                  {a.media ? ` · ${mediaTexto(a.media)}` : ""}
                </span>
              </li>
            ))}
            {!n.autores.length ? <p className="font-revista text-sm text-cinza italic">seus autores aparecem aqui ao longo do ano.</p> : null}
          </ol>
        </section>
      </div>

      <Link
        href="/numeros/retrospectiva"
        className="flex h-[58px] items-center justify-between rounded-md bg-ameixa px-7 text-sm font-semibold text-creme hover:bg-bordo-escuro"
      >
        <span>gerar o wrapped de {n.ano} ✦</span>
        <span aria-hidden>→</span>
      </Link>
    </>
  );
}

function ConteudoRetro({ n, frase }: { n: Numeros; frase: string }) {
  const genero = n.generos[0];
  const [aviso, setAviso] = useState<string | null>(null);

  async function compartilhar() {
    const texto = [
      `meu ${n.ano} em livros ✦`,
      `${n.total} ${n.total === 1 ? "livro" : "livros"}${n.paginasConhecidas ? ` · ${numero(n.paginas)} páginas` : ""}`,
      genero ? `gênero do ano: ${genero.nome}` : null,
      n.livroDoAno ? `livro do ano: ${n.livroDoAno.titulo}` : null,
      "— the bookside",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      setAviso("copiado! é só colar onde quiser ✦");
    } catch {
      /* sem permissão de clipboard */
    }
  }

  if (!n.total) {
    return <p className="font-revista text-sm text-cinza italic">seu wrapped começa no primeiro &ldquo;já li&rdquo; do ano ✦</p>;
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="rounded-md bg-gradient-to-br from-ameixa to-bordo-escuro px-10 py-12 text-center text-creme">
        <p className="text-[10px] font-semibold tracking-[.2em] text-rosa-claro uppercase">você leu</p>
        <p className="mt-3 font-revista text-[86px] leading-none font-normal text-creme italic">{n.total}</p>
        <p className="mt-3 font-revista text-base text-rosa-claro italic">
          {n.total === 1 ? "livro" : "livros"}
          {n.paginasConhecidas ? ` · ${numero(n.paginas)} páginas` : ""}
          {n.paginasPorLivro ? ` · ${numero(n.paginasPorLivro)} por livro` : ""}
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4 text-left">
          {genero ? (
            <div className="rounded-[10px] border border-creme/20 bg-creme/5 p-5">
              <p className="text-[9px] font-semibold tracking-[.18em] text-ouro uppercase">seu gênero do ano</p>
              <p className="mt-2 font-revista text-xl text-creme italic">{genero.nome}</p>
              <p className="mt-1.5 text-[13px] text-rosa-claro">
                {genero.qtd} dos seus {n.total} livros ✦
              </p>
            </div>
          ) : null}

          {n.livroDoAno ? (
            <Link href={`/livro/${n.livroDoAno.id}`} className="flex items-center gap-3.5 rounded-[10px] border border-creme/20 bg-creme/5 p-5 hover:bg-creme/10">
              <CapaLivro titulo={n.livroDoAno.titulo} capa={n.livroDoAno.capa} cor={corDoLivro(n.livroDoAno.id)} className="w-[52px] flex-none [&>span:last-child]:text-[9px]" />
              <span>
                <p className="text-[9px] font-semibold tracking-[.18em] text-ouro uppercase">o livro do ano</p>
                <p className="mt-1.5 font-revista text-lg leading-[1.2] text-creme italic">{n.livroDoAno.titulo}</p>
                <p className="mt-1 text-[12px] text-rosa-claro">
                  {n.livroDoAno.nota === 5 ? "cinco estrelas ♡" : `${n.livroDoAno.nota} estrelas, a maior nota do ano ♡`}
                </p>
              </span>
            </Link>
          ) : null}
        </div>

        {n.maisForte ? (
          <div className="mt-4 rounded-[10px] border border-creme/20 bg-creme/5 px-5 py-3.5 text-left">
            <p className="text-[9px] font-semibold tracking-[.18em] text-ouro uppercase">e ainda</p>
            <p className="mt-1.5 font-revista text-sm text-creme italic">
              {n.maisForte.mes} foi seu mês mais forte, com {n.maisForte.livros} {n.maisForte.livros === 1 ? "livro" : "livros"}.
            </p>
          </div>
        ) : null}

        {frase ? <p className="mt-8 font-revista text-lg text-creme italic">&ldquo;{frase}&rdquo;</p> : null}

        <button
          type="button"
          onClick={compartilhar}
          className="mt-10 inline-flex h-11 items-center rounded-pill bg-creme px-7 text-xs font-bold tracking-[.1em] text-bordo uppercase hover:bg-rosa-claro"
        >
          compartilhar ✧
        </button>
        <p role="status" className="mt-2.5 min-h-4 text-xs text-rosa-claro">
          {aviso}
        </p>
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
