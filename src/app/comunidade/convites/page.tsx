"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CabecalhoTogether } from "@/components/comunidade/Together";
import { botaoPrincipal } from "@/components/coread/Convite";
import { ConviteEnviado, ConviteRecebido } from "@/components/coread/Convites";
import type { Coread } from "@/components/coread/calculos";
import { ComConta, ErroOuFalta } from "@/components/social/Estados";
import { minhasLeiturasJuntas } from "@/lib/lerjunto";
import { pessoasPorId, useConsulta, useMeuId } from "@/lib/social";

type Filtro = "todos" | "clubes" | "coread";

function Convites() {
  const eu = useMeuId();
  const router = useRouter();
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [codigo, setCodigo] = useState("");
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get("de");
    if (f === "clubes" || f === "coread") setFiltro(f);
  }, []);
  const consulta = useConsulta(async () => {
    const lista = (await minhasLeiturasJuntas()) as Coread[];
    const ids = lista.flatMap((l) => [l.criado_por, ...l.pessoas.map((p) => p.convidada_por ?? "")]).filter(Boolean);
    return { lista, pessoas: await pessoasPorId(ids) };
  }, []);
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const lista = consulta.dados?.lista ?? [];
  const minha = (l: Coread) => l.pessoas.find((p) => p.usuario_id === eu);
  const recebidos = lista.filter((l) => minha(l)?.estado === "convidada" && !l.encerrada_em);
  const enviados = lista.filter((l) => !l.encerrada_em && minha(l) && minha(l)!.estado !== "convidada" && l.pessoas.some((p) => p.estado === "convidada"));
  const chip = (on: boolean) =>
    `inline-flex h-10 items-center rounded-pill border px-4 text-[13px] font-semibold ${on ? "border-bordo bg-bordo text-creme" : "border-linha text-ameixa hover:border-bordo"}`;
  const titulo = "mb-4 font-revista text-[21px] text-bordo italic";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-revista text-[22px] leading-none text-ameixa lg:text-[26px]">you&apos;re invited.</h2>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="filtrar convites">
        {(
          [
            ["todos", "todos"],
            ["clubes", "clubes"],
            ["coread", "co-read"],
          ] as const
        ).map(([id, n]) => (
          <button key={id} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)} className={chip(filtro === id)}>
            {n}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-12">
        {filtro !== "clubes" ? (
          <>
            <section aria-labelledby="t-rec">
              <h3 id="t-rec" className={titulo}>
                co-read · recebidos
              </h3>
              {!consulta.dados ? (
                <p className="font-accent text-sm text-cinza italic">abrindo os convites…</p>
              ) : recebidos.length ? (
                <ul className="grid gap-8 lg:grid-cols-2">
                  {recebidos.map((l) => (
                    <ConviteRecebido
                      key={l.id}
                      l={l}
                      deQuem={consulta.dados!.pessoas.get(minha(l)?.convidada_por ?? l.criado_por) ?? null}
                      onMudou={consulta.recarregar}
                    />
                  ))}
                </ul>
              ) : (
                <p className="font-accent text-[15px] text-cinza italic">nenhum convite por enquanto.</p>
              )}
            </section>
            {enviados.length ? (
              <section aria-labelledby="t-env">
                <h3 id="t-env" className={titulo}>
                  co-read · enviados, aguardando resposta
                </h3>
                <ul className="grid gap-8 lg:grid-cols-2">
                  {enviados.map((l) => (
                    <ConviteEnviado key={l.id} l={l} eu={eu} />
                  ))}
                </ul>
              </section>
            ) : null}
          </>
        ) : null}

        {filtro !== "coread" ? (
          <section aria-labelledby="t-clubes" className="max-w-[520px]">
            <h3 id="t-clubes" className={titulo}>
              clubes
            </h3>
            <p className="text-[14px] text-tinta-suave">
              os convites de clube chegam como código ou link, mandados por quem organiza. recebeu um? digite aqui.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase().slice(0, 12))}
                placeholder="código do clube"
                aria-label="código do clube"
                className="h-12 min-w-0 flex-1 rounded-[4px] border border-linha bg-transparent px-4 font-mono text-lg tracking-[.15em] uppercase outline-none focus:border-bordo"
              />
              <button type="button" disabled={!codigo} onClick={() => router.push(`/clubes/entrar?codigo=${encodeURIComponent(codigo)}`)} className={botaoPrincipal}>
                entrar
              </button>
            </div>
            <p className="mt-3 text-[13px]">
              <Link href="/co-read?aba=convites" className="font-semibold text-bordo hover:underline">
                tem um código de co-read? entre por aqui
              </Link>
            </p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export default function ConvitesComunidadePage() {
  return (
    <AppShell aba="clubes">
      <div className="flex flex-1 flex-col px-5 pt-2 pb-10 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="w-full max-w-[1200px]">
          <CabecalhoTogether ativo={null} />
          <ComConta>
            <Convites />
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
