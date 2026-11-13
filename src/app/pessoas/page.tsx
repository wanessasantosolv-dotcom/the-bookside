"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Carregando, ComConta, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { BotaoSeguir, LinhaPessoa, Topo } from "@/components/social/Pessoas";
import { buscarPessoas, idsQueSigo, sugestoesDePessoas, useConsulta } from "@/lib/social";

function Resultados({ termo }: { termo: string }) {
  const [atraso, setAtraso] = useState(termo);
  useEffect(() => {
    const t = setTimeout(() => setAtraso(termo), 300);
    return () => clearTimeout(t);
  }, [termo]);
  const limpo = atraso.trim();

  const consulta = useConsulta(async () => {
    const [sigo, pessoas] = await Promise.all([
      idsQueSigo(),
      limpo.length >= 2 ? buscarPessoas(limpo).then((l) => l.map((p) => ({ ...p, motivo: "" }))) : sugestoesDePessoas(),
    ]);
    return { sigo, pessoas };
  }, [limpo]);

  if (consulta.carregando && !consulta.dados) return <Carregando texto="procurando pessoas…" linhas={2} />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { sigo, pessoas } = consulta.dados!;

  return (
    <section className="mt-6 px-6 lg:px-0" aria-live="polite">
      <h2 className="text-[11px] font-semibold tracking-[.16em] text-bordo uppercase">
        {limpo.length >= 2 ? "resultados" : "sugestões pra você"}
      </h2>
      {pessoas.length ? (
        <ul className={`mt-2 ${consulta.carregando ? "opacity-60" : ""}`}>
          {pessoas.map((p) => (
            <LinhaPessoa
              key={p.id}
              pessoa={p}
              detalhe={p.motivo || undefined}
              acao={<BotaoSeguir key={`${p.id}-${sigo.has(p.id)}`} id={p.id} seguindo={sigo.has(p.id)} />}
            />
          ))}
        </ul>
      ) : limpo.length >= 2 ? (
        <p className="py-8 text-center font-accent text-sm italic text-cinza">ninguém com esse nome ou @usuário ainda.</p>
      ) : (
        <div className="mt-3">
          <Vazio titulo="ainda não tem ninguém por aqui" texto="chame suas amigas para o the bookside e procure pelo @usuário delas." />
        </div>
      )}
      <p className="py-8 text-center font-accent text-[13px] italic text-cinza">procure pelo @usuário pra achar direto ✦</p>
    </section>
  );
}

export default function PessoasPage() {
  const [termo, setTermo] = useState("");
  return (
    <AppShell aba="inicio">
      <div className="flex flex-1 flex-col lg:bg-jornal lg:px-12 lg:py-8">
        <div className="lg:max-w-[720px]">
          <Topo voltar={{ href: "/inicio", r: "início" }} rotulo="buscar" />
          <h1 className="mt-4 px-6 font-display text-[32px] leading-[1.1] font-semibold italic text-bordo lg:px-0 lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
            buscar pessoas
          </h1>
          <nav aria-label="o que buscar" className="mt-4 flex gap-1.5 px-6 lg:px-0">
            <Link href="/buscar" className="flex min-h-9 items-center rounded-pill border border-bege px-3.5 text-[10px] font-semibold tracking-[.12em] text-cinza uppercase">
              livros
            </Link>
            <span aria-current="page" className="flex min-h-9 items-center rounded-pill bg-bordo px-3.5 text-[10px] font-semibold tracking-[.12em] text-creme uppercase">
              pessoas
            </span>
          </nav>
          <div className="mt-4 px-6 lg:px-0">
            <label className="flex h-[52px] items-center gap-3 rounded-pill border border-linha bg-creme-quente px-5 focus-within:border-bordo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7A6A6E" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <span className="sr-only">nome ou @usuário</span>
              <input
                type="search"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="nome ou @usuário"
                autoComplete="off"
                autoCapitalize="none"
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-cinza/70"
              />
            </label>
          </div>
          <ComConta>
            <Resultados termo={termo} />
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
