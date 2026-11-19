"use client";

import Link from "next/link";
import { useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { corDoLivro } from "@/lib/cores";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";

/**
 * Todos os livros que a pessoa está lendo, com a página de agora — atualizável ali mesmo.
 * `tema="escura"` + `semCartao` são usados quando isso mora dentro de outro card (ex.: o
 * card "hoje" do início, que já tem fundo bordô) — aí a seção não desenha o próprio cartão
 * nem usa cores escuras de texto.
 */
export function LendoAgora({
  tema = "clara",
  semCartao = false,
}: {
  tema?: "clara" | "escura";
  semCartao?: boolean;
} = {}) {
  const livros = usePerfil((s) => s.livros);
  const lendo = livros
    .filter((l) => l.status === "lendo")
    .sort((a, b) =>
      (b.iniciadoEm ?? b.adicionadoEm ?? "").localeCompare(
        a.iniciadoEm ?? a.adicionadoEm ?? "",
      ),
    );
  if (!lendo.length) return null;
  const escura = tema === "escura";

  const conteudo = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h2
          className={
            escura
              ? "text-[10px] font-semibold tracking-[.18em] text-rosa-claro uppercase"
              : "relative pb-2 text-[10px] font-semibold tracking-[.18em] text-bordo uppercase after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-[22px] after:rounded-full after:bg-ouro after:content-[''] lg:pb-0 lg:text-grafite lg:after:hidden"
          }
        >
          {lendo.length === 1
            ? "você está lendo"
            : `você está lendo ${lendo.length} livros`}
        </h2>
        <Link
          href="/story?tipo=lendo"
          className={`mr-3 ml-auto text-[10px] font-bold tracking-[.1em] uppercase ${escura ? "text-rosa-claro" : "text-bordo"}`}
        >
          story ✦
        </Link>
        <Link
          href="/estantes"
          className={
            escura
              ? "text-[10px] font-bold tracking-[.1em] text-rosa-claro uppercase"
              : "inline-flex items-center gap-1 rounded-pill bg-rosa-fundo px-2.5 py-1.5 text-[10px] font-bold tracking-[.1em] text-bordo uppercase lg:bg-transparent lg:px-0 lg:py-0"
          }
        >
          estante <span aria-hidden>→</span>
        </Link>
      </div>
      <ul
        className={
          escura
            ? "mt-3 divide-y divide-creme/15"
            : "mt-3 divide-y divide-linha/70 lg:divide-fio"
        }
      >
        {lendo.map((l, i) => (
          <Linha key={l.id} l={l} indice={i} escura={escura} />
        ))}
      </ul>
    </>
  );

  if (semCartao) return conteudo;
  return (
    <section className="rounded-xl border border-linha bg-creme-quente p-4 lg:rounded-[4px] lg:border-fio lg:bg-transparent lg:p-5">
      {conteudo}
    </section>
  );
}

function Linha({
  l,
  indice,
  escura,
}: {
  l: LivroSalvo;
  indice: number;
  escura: boolean;
}) {
  const editarLivro = usePerfil((s) => s.editarLivro);
  const [editando, setEditando] = useState(false);
  const [pagina, setPagina] = useState(String(l.paginaAtual ?? ""));
  const [total, setTotal] = useState(String(l.paginas ?? ""));
  const pct =
    l.paginas && l.paginaAtual
      ? Math.min(100, Math.round((l.paginaAtual / l.paginas) * 100))
      : null;

  function salvar() {
    const p = Number(pagina);
    const t = Number(total) || l.paginas;
    if (!p || p < 0) return setEditando(false);
    editarLivro(l, {
      paginaAtual: t ? Math.min(p, t) : p,
      ...(t ? { paginas: t } : {}),
    });
    setEditando(false);
  }

  return (
    <li className="flex items-start gap-3.5 py-3 first:pt-1 last:pb-0">
      <Link
        href={`/livro/${l.id}`}
        className={`flex-none shadow-md shadow-ameixa/20 lg:rotate-0 lg:shadow-none ${indice % 2 === 0 ? "rotate-[-3deg]" : "rotate-[3deg]"}`}
      >
        <CapaLivro
          titulo={l.titulo}
          capa={l.capa}
          cor={corDoLivro(l.id)}
          className="w-12 rounded-[3px] [&>span:last-child]:hidden"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/livro/${l.id}`}
          className={`block truncate font-display text-[17px] leading-tight font-semibold italic lg:font-revista lg:font-normal ${escura ? "text-creme" : ""}`}
        >
          {l.titulo}
        </Link>
        <p className={`truncate text-xs ${escura ? "text-rosa-claro/80" : "text-cinza"}`}>
          {l.autor}
        </p>
        {editando ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              salvar();
            }}
            className={`mt-2 flex flex-wrap items-center gap-1.5 text-xs ${escura ? "text-rosa-claro/80" : "text-cinza"}`}
          >
            <label className="flex items-center gap-1.5">
              página
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={pagina}
                autoFocus
                onChange={(e) => setPagina(e.target.value)}
                className={
                  escura
                    ? "h-9 w-[72px] rounded-[8px] border border-creme/30 bg-creme/10 px-2 text-sm text-creme outline-none focus:border-rosa-claro"
                    : "h-9 w-[72px] rounded-[8px] border border-bege bg-creme px-2 text-sm text-ameixa outline-none focus:border-bordo"
                }
              />
            </label>
            <label className="flex items-center gap-1.5">
              de
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="?"
                className={
                  escura
                    ? "h-9 w-[72px] rounded-[8px] border border-creme/30 bg-creme/10 px-2 text-sm text-creme outline-none focus:border-rosa-claro"
                    : "h-9 w-[72px] rounded-[8px] border border-bege bg-creme px-2 text-sm text-ameixa outline-none focus:border-bordo"
                }
              />
            </label>
            <button
              type="submit"
              className={
                escura
                  ? "h-9 rounded-pill bg-creme px-4 text-xs font-semibold text-bordo"
                  : "h-9 rounded-pill bg-bordo px-4 text-xs font-semibold text-creme"
              }
            >
              salvar
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className={`h-9 px-2 text-xs font-semibold ${escura ? "text-rosa-claro/80" : "text-cinza"}`}
            >
              cancelar
            </button>
          </form>
        ) : (
          <>
            {pct !== null ? (
              <span className="mt-2.5 flex items-center gap-2">
                <span
                  className={`block h-2.5 flex-1 overflow-hidden rounded-full ${escura ? "bg-creme/20" : "bg-bege/60"}`}
                >
                  <span
                    className={`block h-full rounded-full ${escura ? "bg-rosa-claro" : "bg-gradient-to-r from-bordo-suave to-rosa-antigo"}`}
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span
                  className={
                    escura
                      ? "rounded-pill bg-creme/90 px-2 py-0.5 text-[10px] font-bold text-bordo"
                      : "rounded-pill bg-rosa-fundo px-2 py-0.5 text-[10px] font-bold text-bordo"
                  }
                >
                  {pct}%
                </span>
              </span>
            ) : null}
            <p
              className={`mt-1.5 flex flex-wrap items-center gap-x-3 text-[11px] ${escura ? "text-rosa-claro/80" : "text-cinza"}`}
            >
              <span>
                {pct !== null
                  ? `pág. ${l.paginaAtual} de ${l.paginas}`
                  : "em que página você está?"}
              </span>
              <button
                type="button"
                onClick={() => setEditando(true)}
                className={`min-h-8 font-semibold ${escura ? "text-rosa-claro" : "text-rosa-antigo"}`}
              >
                atualizar
              </button>
              <Link
                href={`/foco?livro=${l.id}`}
                className={`min-h-8 content-center font-semibold ${escura ? "text-rosa-claro" : "text-rosa-antigo"}`}
              >
                foco ⏱
              </Link>
              <Link
                href={`/livro/${l.id}`}
                className={
                  escura
                    ? "ml-auto flex min-h-8 items-center gap-1 rounded-pill bg-creme px-2.5 py-1 text-[10px] font-bold text-bordo"
                    : "ml-auto flex min-h-8 items-center gap-1 rounded-pill bg-bordo px-2.5 py-1 text-[10px] font-bold text-creme"
                }
              >
                terminei ✓
              </Link>
            </p>
          </>
        )}
      </div>
    </li>
  );
}
