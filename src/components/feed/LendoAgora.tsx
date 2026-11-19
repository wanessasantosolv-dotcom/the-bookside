"use client";

import Link from "next/link";
import { useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { corDoLivro } from "@/lib/cores";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";

/** Todos os livros que a pessoa está lendo, com a página de agora — atualizável ali mesmo. */
export function LendoAgora() {
  const livros = usePerfil((s) => s.livros);
  const lendo = livros
    .filter((l) => l.status === "lendo")
    .sort((a, b) =>
      (b.iniciadoEm ?? b.adicionadoEm ?? "").localeCompare(
        a.iniciadoEm ?? a.adicionadoEm ?? "",
      ),
    );
  if (!lendo.length) return null;
  return (
    <section className="rounded-xl border border-linha bg-creme-quente p-4 lg:rounded-[4px] lg:border-fio lg:bg-transparent lg:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[10px] font-semibold tracking-[.18em] text-bordo uppercase lg:text-grafite">
          {lendo.length === 1
            ? "você está lendo"
            : `você está lendo ${lendo.length} livros`}
        </h2>
        <Link
          href="/estantes"
          className="text-[10px] font-bold tracking-[.1em] text-bordo uppercase"
        >
          estante →
        </Link>
      </div>
      <ul className="mt-3 divide-y divide-linha/70 lg:divide-fio">
        {lendo.map((l) => (
          <Linha key={l.id} l={l} />
        ))}
      </ul>
    </section>
  );
}

function Linha({ l }: { l: LivroSalvo }) {
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
    <li className="flex gap-3.5 py-3 first:pt-1 last:pb-0">
      <Link href={`/livro/${l.id}`} className="flex-none">
        <CapaLivro
          titulo={l.titulo}
          capa={l.capa}
          cor={corDoLivro(l.id)}
          className="w-12 [&>span:last-child]:hidden"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link
          href={`/livro/${l.id}`}
          className="block truncate font-display text-[17px] leading-tight font-semibold italic lg:font-revista lg:font-normal"
        >
          {l.titulo}
        </Link>
        <p className="truncate text-xs text-cinza">{l.autor}</p>
        {editando ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              salvar();
            }}
            className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-cinza"
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
                className="h-9 w-[72px] rounded-[8px] border border-bege bg-creme px-2 text-sm text-ameixa outline-none focus:border-bordo"
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
                className="h-9 w-[72px] rounded-[8px] border border-bege bg-creme px-2 text-sm text-ameixa outline-none focus:border-bordo"
              />
            </label>
            <button
              type="submit"
              className="h-9 rounded-pill bg-bordo px-4 text-xs font-semibold text-creme"
            >
              salvar
            </button>
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="h-9 px-2 text-xs font-semibold text-cinza"
            >
              cancelar
            </button>
          </form>
        ) : (
          <>
            {pct !== null ? (
              <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-bege/60">
                <span
                  className="block h-full rounded-full bg-bordo"
                  style={{ width: `${pct}%` }}
                />
              </span>
            ) : null}
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 text-[11px] text-cinza">
              <span>
                {pct !== null
                  ? `página ${l.paginaAtual} de ${l.paginas} · ${pct}%`
                  : "em que página você está?"}
              </span>
              <button
                type="button"
                onClick={() => setEditando(true)}
                className="min-h-8 font-semibold text-bordo"
              >
                atualizar página
              </button>
              <Link
                href={`/livro/${l.id}`}
                className="min-h-8 content-center font-semibold text-bordo"
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
