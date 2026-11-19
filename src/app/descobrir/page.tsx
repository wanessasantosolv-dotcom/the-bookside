"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import { PerguntaTermino } from "@/components/PerguntaTermino";
import { naEstante } from "@/lib/catalogo";
import {
  lembrarPassado,
  limparSecao,
  migrarPassados,
  secoesDoDescobrir,
  useIndicacoes,
  type Indicacao,
  type Secao,
} from "@/lib/indicacoes";
import { nuvemPronta } from "@/lib/nuvem";
import { usePerfil, type StatusLivro } from "@/lib/perfil-store";
import { useConsulta } from "@/lib/social";
import { arquetipos, type ArquetipoId } from "@/lib/teste";

/**
 * Descobrir livros: um lugar fixo no menu.
 * - "uma por vez": passar, quero ler ou já li (o que passou não volta, em nenhum aparelho);
 * - prateleiras: pelo tipo de leitora, mais lidos do ano, em alta, autoras e lançamentos.
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
              indicações pelo que você lê, pelo seu tipo de leitora e pelo que
              está em alta ✦
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
            <Prateleiras />
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
        <p className="py-10 text-center font-accent text-[15px] italic text-cinza">
          escolhendo livros pra você…
        </p>
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
              className="w-[130px] rotate-[1.5deg] shadow-[0_16px_28px_-12px_rgba(43,20,32,.5)] lg:w-[190px] [&>span:last-child]:text-sm"
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
              <p className="mt-3 line-clamp-4 text-[13px] leading-normal text-cinza lg:line-clamp-5 lg:text-[14px] lg:leading-[1.6]">
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
                    "#6B0D24",
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
            você viu todas desta leva ✦
          </p>
          <p className="mt-1.5 font-accent text-sm italic text-cinza">
            os que você passou não voltam. quer mais?
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

/* ───────── prateleiras ───────── */

function Prateleiras() {
  const livros = usePerfil((s) => s.livros);
  const favoritos = usePerfil((s) => s.favoritos);
  const gostos = usePerfil((s) => s.gostos);
  const bookside = usePerfil((s) => s.bookside);
  const tipo = bookside
    ? (arquetipos[bookside.principal as ArquetipoId] ?? null)
    : null;
  // só refaz quando a pessoa avalia/adiciona livros ou muda o tipo
  const assinatura =
    livros.map((l) => `${l.id}:${l.nota ?? ""}`).join("|") +
    favoritos.join(",") +
    gostos.join(",") +
    (tipo?.id ?? "");
  const consulta = useConsulta(
    () =>
      secoesDoDescobrir({
        livros: usePerfil.getState().livros,
        favoritos: usePerfil.getState().favoritos,
        gostos: usePerfil.getState().gostos,
        tipo,
      }),
    [assinatura],
  );
  const tenho = useMemo(() => naEstante(livros), [livros]);

  return (
    <div className="mt-10 space-y-10">
      {!tipo ? (
        <Link
          href="/teste"
          className="mx-6 flex items-center justify-between gap-4 rounded-xl border border-dashed border-bordo/40 px-5 py-4 hover:border-bordo lg:mx-0 lg:rounded-[6px]"
        >
          <span>
            <span className="block text-[11px] font-semibold tracking-[.14em] text-bordo uppercase">
              indicações pelo seu tipo de leitora
            </span>
            <span className="mt-1 block font-accent text-[15px] italic text-cinza">
              faça o teste (3 minutinhos) e ganhe uma prateleira só sua.
            </span>
          </span>
          <span className="flex-none text-xs font-semibold text-bordo">
            fazer o teste →
          </span>
        </Link>
      ) : null}

      {consulta.carregando && !consulta.dados ? (
        <p className="px-6 font-accent text-[15px] italic text-cinza lg:px-0">
          arrumando as prateleiras…
        </p>
      ) : (
        (consulta.dados ?? []).map((s) => (
          <Prateleira key={s.id} s={s} tenho={tenho} />
        ))
      )}
    </div>
  );
}

function Prateleira({
  s,
  tenho,
}: {
  s: Secao;
  tenho: (l: { id?: string; titulo: string }) => boolean;
}) {
  const guardarLivro = usePerfil((st) => st.guardarLivro);
  // os que a pessoa guardou nesta visita continuam na prateleira, marcados
  const [guardados, setGuardados] = useState<string[]>([]);
  const lista = limparSecao(s.livros, (l) =>
    guardados.includes(l.id ?? "") ? false : tenho(l),
  ).slice(0, 14);
  if (!lista.length) return null;

  return (
    <section>
      <div className="mx-6 border-b border-linha pb-2 lg:mx-0 lg:border-tinta">
        <h2 className="font-display text-[22px] leading-tight font-semibold italic text-bordo lg:font-revista lg:text-[24px] lg:font-normal lg:text-tinta">
          {s.titulo}
        </h2>
        {s.sub ? (
          <p className="mt-0.5 text-xs text-cinza">{s.sub}</p>
        ) : null}
      </div>
      <ul className="mt-4 flex gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:thin] lg:px-0">
        {lista.map((l) => {
          const naLista = guardados.includes(l.id);
          return (
            <li key={l.id} className="w-[112px] flex-none lg:w-[128px]">
              <Link href={`/livro/${l.id}`} className="group block">
                <CapaLivro
                  titulo={l.titulo}
                  capa={l.capa}
                  cor={l.cor}
                  className="w-full transition-transform group-hover:-translate-y-1 [&>span:last-child]:text-[10px]"
                />
                <span className="mt-2 line-clamp-2 text-[13px] leading-tight font-semibold">
                  {l.titulo}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-cinza">
                  {l.autor}
                </span>
              </Link>
              <button
                type="button"
                disabled={naLista}
                onClick={() => {
                  guardarLivro({
                    id: l.id,
                    titulo: l.titulo,
                    autor: l.autor,
                    capa: l.capa,
                    status: "quero",
                  });
                  setGuardados((g) => [...g, l.id]);
                }}
                className={`mt-2 h-8 w-full rounded-pill text-[11px] font-semibold ${
                  naLista
                    ? "bg-rosa-fundo text-bordo"
                    : "border border-bordo text-bordo hover:bg-bordo/5"
                }`}
              >
                {naLista ? "na lista ✓" : "+ quero ler"}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
