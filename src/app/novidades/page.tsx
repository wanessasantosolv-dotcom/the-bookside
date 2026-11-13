"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { Carregando, ComConta, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { Avatar, Topo } from "@/components/social/Pessoas";
import { usePerfil } from "@/lib/perfil-store";
import { nomeDe, novidades, quandoFoi, useConsulta, type Novidade } from "@/lib/social";

function grupo(iso: string) {
  const d = new Date(iso);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (d >= hoje) return "hoje";
  if (Date.now() - d.getTime() < 7 * 86_400_000) return "esta semana";
  return "antes";
}

function Lista() {
  const vistasEm = usePerfil((s) => s.novidadesVistasEm);
  const atualizar = usePerfil((s) => s.atualizar);
  // guarda o "visto até" de quando a tela abriu, para os pontinhos não sumirem na hora
  const desde = useRef(vistasEm);
  const lista = useConsulta(() => novidades(), []);

  useEffect(() => {
    if (lista.dados) atualizar({ novidadesVistasEm: new Date().toISOString() });
  }, [lista.dados, atualizar]);

  if (lista.carregando && !lista.dados) return <Carregando texto="procurando novidades…" />;
  if (lista.erro) return <ErroOuFalta erro={lista.erro} onTentar={lista.recarregar} />;
  const itens = lista.dados!;
  if (!itens.length)
    return (
      <div className="px-6 pt-4 lg:px-0">
        <Vazio
          titulo="nada de novo por aqui ainda"
          texto="quando suas amigas curtirem, comentarem, seguirem você ou seu clube agendar algo, aparece aqui."
          acao={{ href: "/clubes", rotulo: "ver os clubes ♡" }}
        />
      </div>
    );

  const novas = itens.filter((n) => !desde.current || n.quando > desde.current).length;
  const grupos = ["hoje", "esta semana", "antes"]
    .map((g) => ({ g, itens: itens.filter((n) => grupo(n.quando) === g) }))
    .filter((x) => x.itens.length);

  return (
    <>
      <p className="mt-1.5 px-6 font-accent text-sm italic text-cinza lg:px-0">
        {novas ? `${novas} ${novas === 1 ? "nova" : "novas"} desde a última visita ✦` : "você já viu tudo ✦"}
      </p>
      {grupos.map(({ g, itens }) => (
        <section key={g} className="mt-7 px-6 lg:px-0">
          <h2 className="text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">{g}</h2>
          <ul className="mt-1">
            {itens.map((n) => (
              <Item key={n.id} n={n} nova={!desde.current || n.quando > desde.current} />
            ))}
          </ul>
        </section>
      ))}
      <p className="py-10 text-center font-accent text-[13px] italic text-cinza">você está em dia ✧</p>
    </>
  );
}

function Item({ n, nova }: { n: Novidade; nova: boolean }) {
  const conteudo = (
    <>
      <span aria-hidden className={`mt-4 size-1.5 flex-none rounded-full ${nova ? "bg-rosa-antigo" : "bg-transparent"}`} />
      <Avatar pessoa={n.pessoa} tamanho={34} className="mt-1" />
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] leading-[1.45]">
          <b className="font-semibold">{nomeDe(n.pessoa)}</b> <span className="text-tinta-suave">{n.texto}</span>
          {n.citacao ? <span className="font-accent italic"> “{n.citacao}”</span> : null}
        </span>
        <span className="mt-1 block text-[10px] font-semibold tracking-[.12em] text-cinza uppercase">{quandoFoi(n.quando)}</span>
      </span>
      <span className="mt-1.5 max-w-[84px] flex-none truncate text-[9px] font-semibold tracking-[.12em] text-cinza uppercase">{n.etiqueta}</span>
    </>
  );
  return (
    <li className="border-b border-linha/70 lg:border-fio">
      {n.href ? (
        <Link href={n.href} className="flex gap-2.5 py-3.5 hover:bg-rosa-fundo/40">
          {nova ? <span className="sr-only">nova: </span> : null}
          {conteudo}
        </Link>
      ) : (
        <div className="flex gap-2.5 py-3.5">{conteudo}</div>
      )}
    </li>
  );
}

export default function NovidadesPage() {
  return (
    <AppShell aba="inicio">
      <div className="flex flex-1 flex-col lg:bg-jornal lg:px-12 lg:py-8">
        <div className="lg:max-w-[720px]">
          <Topo voltar={{ href: "/inicio", r: "início" }} />
          <h1 className="mt-4 px-6 font-display text-[32px] leading-[1.1] font-semibold italic text-bordo lg:px-0 lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
            novidades
          </h1>
          <ComConta>
            <Lista />
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
