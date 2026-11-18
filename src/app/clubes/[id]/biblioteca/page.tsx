"use client";

import { CapaAuto } from "@/components/CapaAuto";
import { Animacao } from "@/components/Animacao";
import Link from "next/link";
import type { ReactNode } from "react";
import { useClube } from "@/components/clube/ClubeContexto";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import { andamento, apagarLivroDoClube, livrosDoClube, type LivroDoClube } from "@/lib/clubes";
import { useConsulta } from "@/lib/social";

function Prateleira({
  selo,
  seloEscuro,
  titulo,
  abrir,
  livros,
  link,
  vazio,
  podeExcluir,
  aoExcluir,
}: {
  selo: string;
  seloEscuro?: boolean;
  titulo: string;
  abrir: string;
  livros: LivroDoClube[];
  link: (l: LivroDoClube) => string;
  vazio: ReactNode;
  podeExcluir?: boolean;
  aoExcluir?: (l: LivroDoClube) => void;
}) {
  return (
    <section className="mt-7">
      <div className="flex items-center gap-2.5">
        <span
          className={`inline-flex min-h-6 items-center rounded-pill px-2.5 text-[9px] font-semibold tracking-[.12em] uppercase ${
            seloEscuro ? "bg-bordo text-creme" : "bg-bege/60 text-ameixa"
          }`}
        >
          {selo}
        </span>
        <h2 className="font-display text-xl font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
          {titulo}
        </h2>
        <Link
          href={abrir}
          className="ml-auto text-[10px] font-semibold tracking-[.12em] text-cinza uppercase hover:text-bordo"
        >
          abrir →
        </Link>
      </div>
      {livros.length ? (
        <ul className="mt-3 flex gap-3 overflow-x-auto px-1 pb-0">
          {livros.map((l) => (
            <li key={l.id} className="relative w-[72px] flex-none lg:w-[84px]">
              <Link href={link(l)} aria-label={l.livro.titulo}>
                <CapaAuto livro={l.livro}
                  className="w-full"
                />
              </Link>
              {podeExcluir ? (
                <button
                  type="button"
                  aria-label={`excluir ${l.livro.titulo} da estante`}
                  onClick={() => aoExcluir?.(l)}
                  className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full border border-creme bg-bordo text-xs leading-none text-creme shadow-[0_2px_6px_rgba(43,20,32,.35)]"
                >
                  ×
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-3 pb-2 font-accent text-sm italic text-cinza">{vazio}</div>
      )}
      <div aria-hidden className="h-2.5 rounded-[3px] bg-gradient-to-b from-linha to-bege shadow-[0_2px_0_#C4AC93]" />
    </section>
  );
}

export default function BibliotecaPage() {
  const { clube, papel } = useClube();
  const consulta = useConsulta(() => livrosDoClube(clube.id), [clube.id]);
  if (consulta.carregando && !consulta.dados)
    return <Animacao tipo="pilha" titulo="procurando na estante" sub="isso pode levar um instante" />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const livros = consulta.dados!;
  const moderadora = papel === "moderadora";

  async function excluir(l: LivroDoClube) {
    if (!confirm(`tirar "${l.livro.titulo}" da estante do clube? isso apaga também as fichas desse livro.`)) return;
    await apagarLivroDoClube(l.id);
    consulta.recarregar();
  }
  const lendo = livros.filter((l) => l.estado === "lendo");
  const lidos = livros
    .filter((l) => l.estado === "lido")
    .sort((a, b) => (b.encerrado_em ?? "").localeCompare(a.encerrado_em ?? ""));
  const sugeridos = livros.filter((l) => l.estado === "sugerido").sort((a, b) => b.votos.length - a.votos.length);
  const ano = new Date().getFullYear();
  const desteAno = lidos.filter((l) => l.encerrado_em?.startsWith(String(ano))).length;
  const and = lendo[0] ? andamento(lendo[0]) : null;
  const base = `/clubes/${clube.id}`;

  return (
    <div className="px-6 pt-5 pb-4 lg:max-w-[900px] lg:px-0">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
          todos · {livros.length} &nbsp; lidos · {lidos.length}
        </p>
        <Link
          href={`${base}/sugerir`}
          className="flex min-h-9 items-center rounded-pill bg-bordo px-4 text-xs font-semibold text-creme"
        >
          + sugerir
        </Link>
      </div>
      {!livros.length ? (
        <Vazio
          className="mt-5"
          titulo="a biblioteca do clube está em branco"
          texto="sugira o primeiro livro. o mais votado vira a leitura da vez."
          acao={{ href: `${base}/sugerir`, rotulo: "sugerir um livro" }}
        />
      ) : (
        <>
          <Prateleira
            selo={and ? (and.faltam ? `faltam ${and.faltam} dias` : "último dia") : "agora"}
            seloEscuro
            titulo="lendo agora"
            abrir={`${base}/leitura`}
            livros={lendo}
            link={() => `${base}/leitura`}
            vazio="nenhuma leitura rolando."
            podeExcluir={moderadora}
            aoExcluir={excluir}
          />
          <Prateleira
            selo={`${desteAno} este ano`}
            titulo="lidos"
            abrir={lidos[0] ? `${base}/livro/${lidos[0].id}` : `${base}/leitura`}
            livros={lidos}
            link={(l) => `${base}/livro/${l.id}`}
            vazio="o clube ainda não terminou nenhum livro."
            podeExcluir={moderadora}
            aoExcluir={excluir}
          />
          <Prateleira
            selo="votação aberta"
            titulo="sugestões"
            abrir={`${base}/sugestoes`}
            livros={sugeridos}
            link={() => `${base}/sugestoes`}
            vazio={
              <Link href={`${base}/sugerir`} className="underline underline-offset-4">
                ninguém sugeriu nada. sugira o próximo →
              </Link>
            }
            podeExcluir={moderadora}
            aoExcluir={excluir}
          />
        </>
      )}
    </div>
  );
}
