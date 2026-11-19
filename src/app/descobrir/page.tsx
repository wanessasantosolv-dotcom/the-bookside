"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import { PerguntaTermino } from "@/components/PerguntaTermino";
import {
  lembrarPassado,
  migrarPassados,
  useIndicacoes,
  type Indicacao,
} from "@/lib/indicacoes";
import { nuvemPronta } from "@/lib/nuvem";
import { usePerfil, type StatusLivro } from "@/lib/perfil-store";

/**
 * Descobrir livros: um lugar fixo no menu, com uma indicação por vez —
 * passar, quero ler ou já li. O que passou não volta, em nenhum aparelho.
 */
export default function DescobrirPage() {
  const hidratado = useHidratado();
  useEffect(() => {
    // os "passar" antigos, guardados só neste navegador, vão para o perfil
    const t = setInterval(() => {
      if (nuvemPronta()) {
        migrarPassados();
        clearInterval(t);
      }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <AppShell aba="descobrir">
      <div className="flex flex-1 flex-col pb-10 lg:bg-jornal lg:px-12 lg:py-8">
        <header className="flex items-end justify-between gap-4 px-6 pt-4 lg:px-0 lg:pt-0">
          <div>
            <h1 className="font-display text-[32px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
              descobrir livros
            </h1>
            <p className="mt-1.5 font-accent text-sm italic text-cinza">
              uma indicação por vez: passe, guarde ou marque como lido ✦
            </p>
          </div>
          <Link
            href="/buscar"
            className="flex min-h-11 flex-none items-center gap-1.5 rounded-pill border border-bordo px-4 text-xs font-semibold text-bordo hover:bg-bordo/5"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="hidden sm:inline">buscar um livro</span>
            <span className="sm:hidden">buscar</span>
          </Link>
        </header>

        {hidratado ? (
          <>
            <UmaPorVez />
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

/* ───────── uma por vez ───────── */

function UmaPorVez() {
  const guardarLivro = usePerfil((s) => s.guardarLivro);
  const queroLer = usePerfil(
    (s) => s.livros.filter((l) => l.status === "quero").length,
  );
  const indicacoes = useIndicacoes();
  // a fila fica parada durante a visita (os livros guardados não somem do meio dela)
  const [fila, setFila] = useState<Indicacao[] | null>(null);
  const [indice, setIndice] = useState(0);
  const [perguntarTermino, setPerguntarTermino] = useState(false);
  useEffect(() => {
    if (fila === null && !indicacoes.carregando)
      setFila(
        [...indicacoes.lista].sort(
          (a, b) => Number(!!b.sinopse) - Number(!!a.sinopse),
        ),
      );
  }, [fila, indicacoes.carregando, indicacoes.lista]);
  const livro = fila?.[indice];

  function responder(status: StatusLivro | null, lidoEm?: string) {
    if (!livro) return;
    if (status === "lido" && !lidoEm) return setPerguntarTermino(true);
    if (!status) lembrarPassado(livro.titulo);
    else
      guardarLivro({
        id: livro.id,
        titulo: livro.titulo,
        autor: livro.autor,
        capa: livro.capa,
        status,
        ...(lidoEm ? { lidoEm } : {}),
      });
    setIndice((i) => i + 1);
  }

  function maisUmaRodada() {
    setFila(null);
    setIndice(0);
    indicacoes.maisUmaRodada();
  }

  const botao =
    "flex flex-col items-center gap-2 text-[9px] font-semibold tracking-[.14em] text-cinza uppercase";
  const selo =
    "flex size-14 items-center justify-center rounded-full border border-linha bg-creme transition-transform active:scale-95 lg:size-[60px]";
  const icone = (d: string, cor = "currentColor") => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={cor}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );

  return (
    <section className="mx-6 mt-6 rounded-xl border border-linha bg-creme-quente p-5 lg:mx-0 lg:rounded-[6px] lg:border-fio lg:p-8">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[11px] font-semibold tracking-[.16em] text-bordo uppercase">
          uma por vez ✦
        </h2>
        {queroLer ? (
          <Link
            href="/estantes"
            className="text-[11px] font-semibold text-cinza underline underline-offset-4"
          >
            {queroLer} na sua lista de quero ler
          </Link>
        ) : null}
      </div>

      {fila === null ? (
        <div className="mt-4 flex animate-pulse flex-col items-center gap-5 sm:flex-row sm:items-start lg:gap-10">
          <span className="block aspect-[2/3] w-[160px] rounded-[4px] bg-linha lg:w-[260px]" />
          <span className="w-full flex-1 space-y-3 pt-2">
            <span className="block h-3 w-40 rounded bg-linha" />
            <span className="block h-7 w-64 rounded bg-linha" />
            <span className="block h-3 w-48 rounded bg-linha" />
            <span className="block h-16 w-full rounded bg-linha/70" />
          </span>
        </div>
      ) : livro ? (
        <div
          key={livro.id}
          className="mt-4 flex animate-subir flex-col items-center gap-5 sm:flex-row sm:items-start lg:gap-10"
        >
          <Link href={`/livro/${livro.id}`} className="flex-none">
            <CapaLivro
              titulo={livro.titulo}
              capa={livro.capa}
              cor={livro.cor}
              className="w-[160px] rotate-[1.5deg] shadow-[0_16px_28px_-12px_rgba(43,20,32,.5)] lg:w-[260px] [&>span:last-child]:text-sm"
            />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col text-center sm:text-left">
            <p className="text-[10px] font-semibold tracking-[.14em] text-bordo uppercase">
              {livro.motivo}
            </p>
            <p className="mt-1.5 font-display text-[23px] leading-[1.15] font-semibold italic text-ameixa lg:font-revista lg:text-[32px] lg:font-normal lg:text-tinta">
              {livro.titulo}
            </p>
            <p className="mt-1 text-[11px] font-semibold tracking-[.1em] text-cinza uppercase">
              {livro.autor}
              {livro.ano ? ` · ${livro.ano}` : ""}
              {livro.paginas ? ` · ${livro.paginas} páginas` : ""}
            </p>
            {livro.sinopse ? (
              <p className="mt-3 line-clamp-6 text-[13px] leading-normal text-cinza lg:line-clamp-[9] lg:text-[15px] lg:leading-[1.6]">
                {livro.sinopse}
              </p>
            ) : null}
            <div className="mt-5 flex justify-center gap-7 sm:justify-start">
              <button
                type="button"
                className={botao}
                onClick={() => responder(null)}
              >
                <span className={selo}>{icone("M6 6l12 12M18 6L6 18")}</span>
                passar
              </button>
              <button
                type="button"
                className={`${botao} !text-bordo`}
                onClick={() => responder("quero")}
              >
                <span className={`${selo} !border-bordo`}>
                  {icone(
                    "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
                    "var(--color-bordo)",
                  )}
                </span>
                quero ler
              </button>
              <button
                type="button"
                className={botao}
                onClick={() => responder("lido")}
              >
                <span className={selo}>{icone("M5 12.5l4.5 4.5L19 7.5")}</span>
                já li
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 text-center sm:text-left">
          <p className="font-display text-[22px] leading-tight font-semibold italic text-bordo lg:font-revista lg:font-normal">
            {fila.length
              ? "você viu todas desta leva ✦"
              : "não achei indicações novas agora"}
          </p>
          <p className="mt-1.5 font-accent text-sm italic text-cinza">
            {fila.length
              ? "os que você passou não voltam. quer mais?"
              : "pode ser a internet ou o limite de buscas do dia. tente outra leva daqui a pouco."}
          </p>
          <button
            type="button"
            onClick={maisUmaRodada}
            className="mt-4 h-11 rounded-pill bg-bordo px-6 text-[13px] font-semibold text-creme hover:bg-bordo-suave"
          >
            mais indicações
          </button>
        </div>
      )}

      {perguntarTermino && livro ? (
        <PerguntaTermino
          titulo={livro.titulo}
          onCancelar={() => setPerguntarTermino(false)}
          onConfirmar={(lidoEm) => {
            setPerguntarTermino(false);
            responder("lido", lidoEm);
          }}
        />
      ) : null}
    </section>
  );
}
