"use client";

import { CapaAuto } from "@/components/CapaAuto";
import { Animacao } from "@/components/Animacao";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Avatares } from "@/components/clube/Pecas";
import { ComConta, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { andamento, meusClubes, modoDe, type ResumoClube } from "@/lib/clubes";
import { temas } from "@/lib/dados";
import { coresDoTema } from "@/lib/tema";
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
      ? modoDe(c) === "votacao"
        ? "votação aberta"
        : "escolhendo o próximo"
      : "entre leituras";

  const tema = temas.find((t) => t.id === c.tema);
  return (
    <li style={coresDoTema(c.tema)}>
      <Link
        href={`/clubes/${c.id}`}
        className="group block overflow-hidden rounded-xl border border-linha bg-creme-quente transition-colors hover:border-bordo lg:rounded-[6px] lg:border-fio"
      >
        {/* a capa do clube (ou as cores do tema), como na página do clube */}
        <div
          className={`relative h-[92px] bg-cover bg-center lg:h-[110px] ${c.capa || tema ? "" : "pat-estrelas"}`}
          style={
            c.capa
              ? { backgroundImage: `url("${c.capa}")` }
              : tema
                ? { background: "escuro" in tema ? "#3A343B" : tema.fundo }
                : undefined
          }
        >
          <span
            className={`absolute top-3 left-4 inline-flex min-h-6 items-center rounded-pill px-2.5 text-[9px] font-semibold tracking-[.12em] uppercase shadow-sm ${
              c.lendo
                ? "bg-bordo text-creme"
                : "bg-creme/95 text-ameixa"
            }`}
          >
            {selo}
          </span>
        </div>
        <div className="flex gap-4 px-4 pt-3 pb-4 lg:px-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[24px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[26px] lg:font-normal">
              {c.nome}
            </h2>
            {c.descricao ? (
              <p className="mt-0.5 truncate font-accent text-[13px] italic text-cinza">
                {c.descricao}
              </p>
            ) : null}
            <p className="mt-2 text-[13px] text-ameixa">
              {c.lendo
                ? `${c.lendo.livro.titulo} · ${c.lendo.livro.autor}`
                : c.sugestoes
                  ? `${c.sugestoes} ${c.sugestoes === 1 ? "sugestão" : "sugestões"} na fila`
                  : c.membros.length > 1
                    ? "nenhuma leitura agora · sugira um livro"
                    : "só você por enquanto · convide alguém"}
            </p>
            {and ? (
              <span className="mt-2 block h-1 max-w-[220px] overflow-hidden rounded-full bg-rosa-fundo">
                <span
                  className="block h-full rounded-full bg-bordo"
                  style={{
                    width: `${Math.min(100, (and.dia / and.total) * 100)}%`,
                  }}
                />
              </span>
            ) : null}
            <div className="mt-3 flex items-center gap-2.5">
              <Avatares pessoas={lista} />
              <span className="truncate text-xs text-cinza">{nomes}</span>
            </div>
          </div>
          {c.lendo ? (
            <CapaAuto
              livro={c.lendo.livro}
              className="-mt-12 w-[68px] flex-none self-start shadow-[0_10px_20px_-10px_rgba(43,20,32,.6)] transition-transform group-hover:-translate-y-1 [&>span:last-child]:hidden"
            />
          ) : null}
        </div>
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
            texto="crie um clube e chame os amigos, ou entre com o código de convite que alguém te mandou."
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
