"use client";

import { Animacao } from "@/components/Animacao";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { Avatares } from "@/components/clube/Pecas";
import { ComConta, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { andamento, meusClubes, type ResumoClube } from "@/lib/clubes";
import { corDoLivro } from "@/lib/cores";
import { pessoasPorId, useConsulta, useMeuId } from "@/lib/social";

function Cartao({
  c,
  pessoas,
  eu,
}: {
  c: ResumoClube;
  pessoas: Awaited<ReturnType<typeof pessoasPorId>>;
  eu: string | null;
}) {
  const lista = c.membros.map((id) => pessoas.get(id)!).filter(Boolean);
  const nomes = lista.map((p) => (p.id === eu ? "você" : p.nome || p.usuario)).join(" · ");
  const and = c.lendo ? andamento(c.lendo) : null;
  const selo = c.lendo
    ? and
      ? `lendo agora · dia ${and.dia} de ${and.total}`
      : "lendo agora"
    : c.sugestoes
      ? "votação aberta"
      : "sem livro";

  return (
    <li>
      <Link
        href={`/clubes/${c.id}`}
        className={`flex gap-4 rounded-xl border p-4 transition-colors hover:border-bordo lg:rounded-[4px] lg:p-5 ${
          c.lendo ? "border-linha bg-creme-quente lg:border-fio lg:bg-transparent" : "border-dashed border-bege"
        }`}
      >
        <div className="min-w-0 flex-1">
          <span
            className={`inline-flex min-h-6 items-center rounded-pill px-2.5 text-[9px] font-semibold tracking-[.12em] uppercase ${
              c.lendo ? "bg-bordo text-creme" : c.sugestoes ? "bg-ouro/25 text-ameixa" : "bg-linha text-cinza"
            }`}
          >
            {selo}
          </span>
          <h2 className="mt-2.5 font-display text-[26px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
            {c.nome}
          </h2>
          <p className="mt-1 text-[13px] text-cinza">
            {c.lendo
              ? `${c.lendo.livro.titulo} · ${c.lendo.livro.autor}`
              : c.sugestoes
                ? `${c.votaram} de ${c.membros.length} já votaram ✦`
                : c.membros.length > 1
                  ? "ninguém sugeriu um livro ainda"
                  : "só você por enquanto · convide alguém"}
          </p>
          <div className="mt-3 flex items-center gap-2.5">
            <Avatares pessoas={lista} />
            <span className="truncate text-xs text-cinza">{nomes}</span>
          </div>
        </div>
        {c.lendo ? (
          <CapaLivro
            titulo={c.lendo.livro.titulo}
            capa={c.lendo.livro.capa}
            cor={corDoLivro(c.lendo.livro.id)}
            className="w-[64px] self-start [&>span:last-child]:hidden"
          />
        ) : null}
      </Link>
    </li>
  );
}

function Lista() {
  const eu = useMeuId();
  const consulta = useConsulta(async () => {
    const clubes = await meusClubes();
    const pessoas = await pessoasPorId(clubes.flatMap((c) => c.membros));
    return { clubes, pessoas };
  }, []);
  if (consulta.carregando && !consulta.dados)
    return <Animacao tipo="fita" titulo="colando as fotos do clube" sub="seus clubes já já ficam prontos" />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { clubes, pessoas } = consulta.dados!;
  const lendo = clubes.filter((c) => c.lendo).length;

  return (
    <>
      <p className="mt-1.5 px-6 font-accent text-sm italic text-cinza lg:px-0">
        {clubes.length
          ? `${clubes.length} ${clubes.length === 1 ? "grupo" : "grupos"} · ${lendo} ${lendo === 1 ? "leitura rolando" : "leituras rolando"} ✦`
          : "ler junto é melhor ✦"}
      </p>
      <div className="mt-6 px-6 lg:px-0">
        {clubes.length ? (
          <ul className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
            {clubes.map((c) => (
              <Cartao key={c.id} c={c} pessoas={pessoas} eu={eu} />
            ))}
          </ul>
        ) : (
          <Vazio
            titulo="você ainda não está em nenhum clube"
            texto="crie um clube e chame as amigas, ou entre com o código de convite que alguém te mandou."
            acao={{ href: "/clubes/novo", rotulo: "criar um clube" }}
          />
        )}
        <p className="mt-6 text-center lg:text-left">
          <Link
            href="/clubes/entrar"
            className="inline-flex min-h-11 items-center font-accent text-[15px] italic text-cinza underline underline-offset-4"
          >
            tenho um código de convite
          </Link>
        </p>
      </div>
    </>
  );
}

export default function ClubesPage() {
  return (
    <AppShell aba="clubes">
      <div className="flex flex-1 flex-col pb-8 lg:bg-jornal lg:px-12 lg:py-8">
        <header className="flex items-center justify-between px-6 pt-3 lg:px-0 lg:pt-0">
          <span className="text-[13px] font-semibold lg:hidden">clubes</span>
          <span className="hidden lg:block" />
          <Link
            href="/clubes/novo"
            className="-mr-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo"
          >
            + criar clube
          </Link>
        </header>
        <h1 className="mt-3 px-6 font-display text-[32px] leading-[1.1] font-semibold italic text-bordo lg:px-0 lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
          meus clubes
        </h1>
        <ComConta>
          <Lista />
        </ComConta>
      </div>
    </AppShell>
  );
}
