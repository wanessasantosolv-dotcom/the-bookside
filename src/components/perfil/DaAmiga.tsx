"use client";

import Link from "next/link";
import { CapaDoLivro, PrateleiraMadeira } from "@/components/estantes/Biblioteca";
import { porDataDeLeitura } from "@/lib/estantes";
import { generoGenerico, traduzirGenero } from "@/lib/generos";
import type { LivroSalvo, Perfil } from "@/lib/perfil-store";

/*
 * No perfil de outra leitora: a jornada do ano em poucas linhas e as estantes
 * dela (as fixas e as que ela deixou públicas), sem nada pessoal como
 * resenhas ou anotações.
 */

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const num = (n: number) => n.toLocaleString("pt-BR");
const nota1 = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function maisFrequente(valores: (string | undefined)[]) {
  const conta = new Map<string, number>();
  for (const v of valores) if (v) conta.set(v, (conta.get(v) ?? 0) + 1);
  return [...conta.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
}

export function JornadaResumida({ p, nome }: { p: Perfil; nome: string }) {
  const ano = new Date().getFullYear();
  const lidos = p.livros.filter((l) => l.status === "lido" && l.lidoEm?.startsWith(String(ano)));
  const paginas = lidos.reduce((t, l) => t + (l.paginas ?? 0), 0);
  const notas = lidos.map((l) => l.nota).filter((n): n is number => !!n);
  const media = notas.length ? notas.reduce((t, n) => t + n, 0) / notas.length : null;
  const genero = maisFrequente(lidos.filter((l) => !generoGenerico(l.genero)).map((l) => traduzirGenero(l.genero)));
  const autoria = maisFrequente(lidos.map((l) => l.autor));
  const porMes = MESES.map((_, m) => lidos.filter((l) => new Date(l.lidoEm!).getMonth() === m).length);
  const maior = Math.max(1, ...porMes);
  const mesAtual = new Date().getMonth();
  const meta = p.meta || null;

  return (
    <section aria-labelledby="jornada-dela" className="mt-8">
      <div className="mb-4 flex items-baseline justify-between border-b border-[var(--linha,#E7DCD3)] pb-2">
        <h2 id="jornada-dela" className="font-revista text-[22px] leading-none italic">
          a jornada de {nome} em {ano}
        </h2>
      </div>
      {!lidos.length ? (
        <p className="text-[14px] opacity-75">nenhum livro terminado em {ano} ainda.</p>
      ) : (
        <>
          <dl className="grid grid-cols-3 border-y border-[var(--linha,#E7DCD3)] py-3 text-center">
            {[
              { v: meta ? `${lidos.length}/${meta}` : num(lidos.length), r: meta ? "da meta" : "livros lidos" },
              { v: paginas ? num(paginas) : "—", r: "páginas" },
              { v: media !== null ? nota1(media) : "—", r: "nota média" },
            ].map((x, i) => (
              <div key={x.r} className={i ? "border-l border-[var(--linha,#E7DCD3)]" : ""}>
                <dd className="font-revista text-[24px] leading-none tabular-nums">{x.v}</dd>
                <dt className="mt-1 text-[11px] opacity-70">{x.r}</dt>
              </div>
            ))}
          </dl>
          {/* livros por mês, só barras finas */}
          <div className="mt-5 flex items-end gap-1.5" aria-label="livros terminados por mês">
            {porMes.map((q, m) => (
              <div key={m} className="flex flex-1 flex-col items-center gap-1">
                <span
                  className="block w-full rounded-[2px]"
                  title={`${MESES[m]}: ${q}`}
                  style={{
                    height: Math.max(3, (q / maior) * 46),
                    background: m > mesAtual ? "transparent" : q ? "var(--acc, #6B0D24)" : "var(--linha, #E7DCD3)",
                    opacity: q ? 1 : 0.7,
                  }}
                />
                <span className="text-[9px] opacity-60">{MESES[m]}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[13px] leading-relaxed opacity-85">
            {genero ? (
              <>
                o que mais leu: <b className="font-semibold">{genero[0]}</b>
              </>
            ) : null}
            {genero && autoria && autoria[1] > 1 ? " · " : null}
            {autoria && autoria[1] > 1 ? (
              <>
                quem mais leu: <b className="font-semibold">{autoria[0]}</b> ({autoria[1]} livros)
              </>
            ) : null}
          </p>
        </>
      )}
    </section>
  );
}

type EstanteDela = { id: string; nome: string; livros: LivroSalvo[] };

export function estantesDela(p: Perfil): EstanteDela[] {
  const favoritos = (p.favoritos ?? []).map((id) => p.livros.find((l) => l.id === id)).filter((l): l is LivroSalvo => !!l);
  const de = (s: string) => p.livros.filter((l) => (l.status ?? "lendo") === s);
  return [
    { id: "lendo", nome: "lendo agora", livros: de("lendo") },
    { id: "favoritos", nome: "favoritos", livros: favoritos },
    { id: "lidos", nome: "lidos", livros: de("lido").sort(porDataDeLeitura) },
    { id: "quero-ler", nome: "quero ler", livros: de("quero") },
    // só as estantes que ela deixou públicas
    ...(p.estantesProprias ?? [])
      .filter((e) => e.publica)
      .map((e) => ({ id: e.id, nome: e.nome, livros: p.livros.filter((l) => l.estantes?.includes(e.id)) })),
  ].filter((e) => e.livros.length);
}

export function EstantesDela({ p, base, nome }: { p: Perfil; base: string; nome: string }) {
  const lista = estantesDela(p);
  if (!lista.length) return null;
  return (
    <section aria-labelledby="estantes-dela" className="mt-8">
      <div className="mb-3 flex items-baseline justify-between border-b border-[var(--linha,#E7DCD3)] pb-2">
        <h2 id="estantes-dela" className="font-revista text-[22px] leading-none italic">
          estantes de {nome}
        </h2>
      </div>
      <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {lista.map((e) => (
          <li key={e.id} className="group">
            <Link href={`${base}/estantes/${e.id}`} className="block">
              <div className="flex h-[86px] items-end gap-1.5 overflow-hidden px-2">
                {e.livros.slice(0, 6).map((l) => (
                  <span key={l.id} className="flex-none transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none">
                    <CapaDoLivro livro={l} altura={80} />
                  </span>
                ))}
              </div>
              <PrateleiraMadeira className="-mt-[5px]" />
              <span className="mt-1.5 flex items-baseline justify-between gap-2 px-1">
                <span className="truncate font-revista text-[18px] italic group-hover:underline">{e.nome}</span>
                <span className="flex-none text-[12px] opacity-70">
                  {e.livros.length} {e.livros.length === 1 ? "livro" : "livros"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
