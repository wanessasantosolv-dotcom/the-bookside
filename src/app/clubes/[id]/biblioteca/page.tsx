"use client";

import Link from "next/link";
import { useState } from "react";
import { Animacao } from "@/components/Animacao";
import { CartaoAnoDoClube } from "@/components/clube/AnoDoClube";
import { useClube } from "@/components/clube/ClubeContexto";
import {
  EstanteDeVerdadeFila,
  LequeLinhaWeb,
  PrateleiraCapas,
  SeletorVisualizacao,
  type ItemVitrine,
  type Visualizacao,
} from "@/components/estantes/Vitrine";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import {
  andamento,
  apagarLivroDoClube,
  livrosDoClube,
  modoDe,
  quemTrouxe,
  type LivroDoClube,
} from "@/lib/clubes";
import { useConsulta, useMeuId } from "@/lib/social";

type Linha = {
  id: string;
  nome: string;
  livros: LivroDoClube[];
  link?: string;
  mais?: string;
};

/** A estante do clube: o mesmo formato das estantes pessoais (prateleiras, leque, estante de pé). */
export default function BibliotecaPage() {
  const { clube, membros, papel } = useClube();
  const eu = useMeuId();
  const [filtro, setFiltro] = useState("todas");
  const [vis, setVis] = useState<Visualizacao>("prateleira");
  const consulta = useConsulta(() => livrosDoClube(clube.id), [clube.id]);
  if (consulta.carregando && !consulta.dados)
    return (
      <Animacao
        tipo="pilha"
        titulo="abrindo a estante"
        sub="isso pode levar um instante"
      />
    );
  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const livros = consulta.dados!;
  const moderadora = papel === "moderadora";
  const base = `/clubes/${clube.id}`;
  const votacao = modoDe(clube) === "votacao";

  async function excluir(l: LivroDoClube) {
    if (
      !confirm(
        `tirar "${l.livro.titulo}" da estante do clube? isso apaga também as fichas desse livro.`,
      )
    )
      return;
    await apagarLivroDoClube(l.id);
    consulta.recarregar();
  }

  const lendo = livros.filter((l) => l.estado === "lendo");
  const lidos = livros
    .filter((l) => l.estado === "lido")
    .sort((a, b) => (b.encerrado_em ?? "").localeCompare(a.encerrado_em ?? ""));
  const proximas = livros
    .filter((l) => l.estado === "sugerido")
    .sort((a, b) =>
      votacao
        ? b.votos.length - a.votos.length
        : a.criado_em.localeCompare(b.criado_em),
    );
  const ano = new Date().getFullYear();
  const desteAno = lidos.filter((l) =>
    l.encerrado_em?.startsWith(String(ano)),
  ).length;
  const paginas = lidos.reduce((t, l) => t + (l.livro.paginas ?? 0), 0);
  const and = lendo[0] ? andamento(lendo[0]) : null;

  const linhas: Linha[] = [
    {
      id: "lendo",
      nome: "lendo agora",
      livros: lendo,
      link: `${base}/leitura`,
      mais: moderadora ? `${base}/escolher` : undefined,
    },
    {
      id: "lidos",
      nome: "lidos",
      livros: lidos,
      mais: moderadora ? `${base}/adicionar-lido` : undefined,
    },
    {
      id: "proximas",
      nome: votacao ? "sugestões" : "próximas leituras",
      livros: proximas,
      link: `${base}/sugestoes`,
      mais: `${base}/sugerir`,
    },
  ];
  // em "todas", as prateleiras vazias somem (menos coisa na tela)
  const visiveis =
    filtro === "todas"
      ? linhas.filter((l) => l.livros.length)
      : linhas.filter((l) => l.id === filtro);

  const itens = (ls: LivroDoClube[]): ItemVitrine[] =>
    ls.map((l) => ({
      id: l.id,
      titulo: l.livro.titulo,
      autor: l.livro.autor,
      capa: l.livro.capa,
      paginas: l.livro.paginas,
      href: `${base}/livro/${l.id}`,
      legenda: quemTrouxe(l, membros, eu),
      acao: moderadora ? (
        <button
          type="button"
          aria-label={`tirar ${l.livro.titulo} da estante`}
          onClick={() => excluir(l)}
          className="flex size-6 items-center justify-center rounded-full border border-creme bg-bordo text-xs leading-none text-creme shadow-[0_2px_6px_rgba(43,20,32,.35)]"
        >
          ×
        </button>
      ) : undefined,
    }));

  const acao =
    "flex min-h-9 items-center rounded-pill border border-bordo px-4 text-xs font-semibold text-bordo hover:bg-bordo/5 lg:text-[11px] lg:font-bold lg:tracking-[.1em] lg:uppercase";

  return (
    <div className="px-6 pt-5 pb-6 lg:px-0">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[28px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[36px] lg:font-normal">
            estante do clube
          </h2>
          <p className="mt-1.5 text-[13px] text-cinza">
            {lidos.length} {lidos.length === 1 ? "livro lido" : "livros lidos"}
            {desteAno && desteAno !== lidos.length
              ? ` (${desteAno} este ano)`
              : ""}
            {paginas ? ` · ${paginas.toLocaleString("pt-BR")} páginas` : ""}
            {and && and.faltam
              ? ` · a leitura atual termina em ${and.faltam} ${and.faltam === 1 ? "dia" : "dias"}`
              : ""}
          </p>
        </div>
        <span className="flex flex-wrap gap-2">
          {moderadora ? (
            <Link href={`${base}/adicionar-lido`} className={acao}>
              + livro já lido
            </Link>
          ) : null}
          <Link
            href={`${base}/sugerir`}
            className={`${acao} border-bordo bg-bordo text-creme hover:bg-bordo`}
          >
            + sugerir
          </Link>
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="filtrar a estante"
          className="-mx-6 flex gap-[7px] overflow-x-auto px-6 [scrollbar-width:none] lg:mx-0 lg:px-0"
        >
          {[
            { id: "todas", nome: "todas" },
            ...linhas.map((l) => ({
              id: l.id,
              nome: l.livros.length ? `${l.nome} · ${l.livros.length}` : l.nome,
            })),
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filtro === f.id}
              onClick={() => setFiltro(f.id)}
              className={`flex h-9 flex-none items-center rounded-pill border px-[13px] text-xs font-semibold whitespace-nowrap ${
                filtro === f.id
                  ? "border-bordo bg-bordo text-creme"
                  : "border-bege bg-creme-quente text-ameixa"
              }`}
            >
              {f.nome}
            </button>
          ))}
        </nav>
        <SeletorVisualizacao
          vis={vis}
          onChange={setVis}
          className="hidden lg:inline"
        />
      </div>

      {!livros.length ? (
        <Vazio
          className="mt-6"
          titulo="a estante do clube está em branco"
          texto="sugira o primeiro livro, ou importe os livros que o clube já leu."
          acao={{ href: `${base}/sugerir`, rotulo: "sugerir um livro" }}
        />
      ) : (
        <div
          className={`mt-7 flex flex-col ${vis === "prateleira" ? "gap-10" : "gap-8"}`}
        >
          {visiveis.map((linha) => (
            <section key={linha.id} className="animate-subir">
              <div className="mb-3.5 flex items-baseline justify-between gap-3 border-b border-ameixa/70 pb-2">
                <h3 className="font-display text-xl leading-none font-semibold italic text-bordo lg:font-revista lg:text-2xl lg:font-normal lg:text-ameixa">
                  {linha.nome}
                </h3>
                {linha.link ? (
                  <Link
                    href={linha.link}
                    className="text-[10px] font-bold tracking-[.12em] text-bordo uppercase"
                  >
                    {linha.id === "lendo" ? "ver a leitura →" : votacao ? "votar →" : "ver a fila →"}
                  </Link>
                ) : null}
              </div>
              {!linha.livros.length ? (
                <p className="font-accent text-sm italic text-cinza">
                  {linha.id === "lendo"
                    ? "nenhuma leitura rolando."
                    : linha.id === "lidos"
                      ? "o clube ainda não terminou nenhum livro."
                      : "ninguém sugeriu nada ainda."}{" "}
                  {linha.mais ? (
                    <Link
                      href={linha.mais}
                      className="text-bordo underline underline-offset-4"
                    >
                      {linha.id === "lendo"
                        ? "escolher o livro da vez →"
                        : linha.id === "lidos"
                          ? "incluir um já lido →"
                          : "sugerir →"}
                    </Link>
                  ) : null}
                </p>
              ) : vis === "leque" ? (
                <LequeLinhaWeb livros={itens(linha.livros)} />
              ) : vis === "estante" ? (
                <EstanteDeVerdadeFila
                  livros={itens(linha.livros)}
                  alturaBase={150}
                />
              ) : (
                <PrateleiraCapas
                  livros={itens(linha.livros)}
                  maisHref={linha.mais}
                  maisRotulo={`adicionar em ${linha.nome}`}
                />
              )}
            </section>
          ))}
        </div>
      )}

      <div className="mt-12">
        <CartaoAnoDoClube clubeId={clube.id} />
      </div>

      <p className="pt-8 text-center lg:hidden">
        <SeletorVisualizacao vis={vis} onChange={setVis} className="!text-sm" />
      </p>
    </div>
  );
}
