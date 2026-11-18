"use client";

import { Voltar } from "@/components/Voltar";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { PerguntaTermino } from "@/components/PerguntaTermino";
import { CapaLivro } from "@/components/CapaLivro";
import { BotaoLink } from "@/components/ui/Botao";
import { Tela } from "@/components/ui/Tela";
import { AppShell } from "@/components/AppShell";
import { Animacao } from "@/components/Animacao";
import {
  lembrarPassado,
  useIndicacoes,
  type Indicacao,
} from "@/lib/indicacoes";
import { usePerfil, type StatusLivro } from "@/lib/perfil-store";

/** "guardei esta pra você": um livro por vez — passar, quero ler ou já li. */
type Destino = { href: string; r: string };

export function Descobrir({
  voltar,
  continuar,
  comMenu,
}: {
  voltar: Destino;
  continuar: Destino;
  /** dentro do app (com menu lateral no computador); no cadastro do perfil fica sem */
  comMenu?: boolean;
}) {
  const guardarLivro = usePerfil((s) => s.guardarLivro);
  const livros = usePerfil((s) => s.livros);
  const indicacoes = useIndicacoes();
  // a fila fica parada durante a visita (os livros guardados não somem do meio dela)
  const [fila, setFila] = useState<Indicacao[] | null>(null);
  useEffect(() => {
    if (fila === null && !indicacoes.carregando)
      // começa pelos que têm sinopse (o destaque do design)
      setFila(
        [...indicacoes.lista].sort(
          (a, b) => Number(!!b.sinopse) - Number(!!a.sinopse),
        ),
      );
  }, [fila, indicacoes.carregando, indicacoes.lista]);
  const [indice, setIndice] = useState(0);
  const [perguntarTermino, setPerguntarTermino] = useState(false);
  const livro = fila?.[indice];
  const queroLer = livros.filter((l) => l.status === "quero").length;

  function responder(status: StatusLivro | null, lidoEm?: string) {
    // "já li" pergunta quando a pessoa terminou
    if (!livro) return;
    if (status === "lido" && !lidoEm) return setPerguntarTermino(true);
    if (!status) lembrarPassado(livro.titulo);
    if (status)
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

  const botao =
    "flex flex-col items-center gap-[9px] text-[9px] font-semibold tracking-[.14em] text-cinza uppercase";
  const selo =
    "flex size-[62px] items-center justify-center rounded-full border border-linha bg-creme-quente transition-transform active:scale-95";

  const moldura = (conteudo: ReactNode) =>
    comMenu ? (
      <AppShell aba="inicio">
        <div className="flex flex-1 flex-col px-6 pb-8 lg:mx-auto lg:w-full lg:max-w-[1000px] lg:px-12 lg:pb-12">
          {conteudo}
        </div>
      </AppShell>
    ) : (
      <Tela className="px-6 pb-[max(24px,env(safe-area-inset-bottom))]">
        {conteudo}
      </Tela>
    );

  const icone = (d: string, cor = "#2B1420") => (
    <svg
      width="24"
      height="24"
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

  return moldura(
    <>
      <header className="flex items-center justify-between pt-[18px] lg:pt-8">
        <Voltar
          padrao={voltar.href}
          rotulo={voltar.r}
          className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo"
        />
        <span className="eyebrow !text-[10px] text-cinza">pra você ✦</span>
      </header>

      {fila === null ? (
        <div className="flex flex-1 items-center justify-center">
          <Animacao
            tipo="pilha"
            titulo="escolhendo livros pra você"
            sub="pelo que você lê e pelo que está em alta"
          />
        </div>
      ) : livro ? (
        <div
          key={livro.id}
          className="flex flex-1 flex-col lg:mt-8 lg:grid lg:flex-none lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center lg:gap-16"
        >
          <div className="relative mt-6 flex animate-subir justify-center lg:order-1 lg:mt-0">
            <span
              aria-hidden
              className="absolute top-2 left-7 text-[15px] text-ouro lg:-left-2"
            >
              ✧
            </span>
            <span
              aria-hidden
              className="absolute top-20 right-6 text-[11px] text-rosa-antigo lg:-right-4"
            >
              ✦
            </span>
            <CapaLivro
              titulo={livro.titulo}
              capa={livro.capa}
              cor={livro.cor}
              className="w-[166px] rotate-[1.5deg] !rounded-[3px_7px_7px_3px] !p-3 shadow-[inset_7px_0_8px_-6px_rgba(43,20,32,.55),0_16px_28px_-12px_rgba(43,20,32,.5)] lg:w-[280px] [&>span:last-child]:text-lg"
            />
          </div>

          <div className="flex flex-1 flex-col lg:order-2 lg:flex-none">
            <div className="mt-6 animate-subir text-center lg:mt-0 lg:text-left">
              <p className="eyebrow !text-[10px] !tracking-[.14em] text-bordo">
                {livro.motivo}
              </p>
              <p className="mt-2 font-display text-[23px] leading-[1.15] font-semibold italic text-ameixa lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
                {livro.titulo}
              </p>
              <p className="eyebrow mt-1.5 !text-[10px] text-cinza">
                {livro.autor}
                {livro.ano ? ` · ${livro.ano}` : ""}
                {livro.paginas ? ` · ${livro.paginas} páginas` : ""}
              </p>
              {livro.sinopse ? (
                <p className="mt-3 line-clamp-6 text-[13px] leading-normal text-cinza lg:mt-5 lg:line-clamp-[10] lg:text-[15px] lg:leading-[1.6]">
                  {livro.sinopse}
                </p>
              ) : null}
            </div>

            <div className="mt-auto flex justify-center gap-[34px] pt-8 lg:mt-8 lg:justify-start">
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
                className={`${botao} text-bordo`}
                onClick={() => responder("quero")}
              >
                <span className={`${selo} border-bordo`}>
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

            <p className="mt-6 text-center lg:text-left">
              <Link
                href={continuar.href}
                className="inline-block py-2 font-accent text-[15px] italic text-cinza underline underline-offset-4"
              >
                {queroLer ? `continuar com ${queroLer} na lista` : continuar.r}
              </Link>
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col lg:max-w-[520px]">
          <p className="mt-6 font-display text-[26px] leading-[1.15] font-semibold italic text-bordo">
            por hoje é isso ✦
          </p>
          <p className="mt-2 font-accent text-[17px] leading-[1.35] italic text-cinza">
            {queroLer
              ? `${queroLer} ${queroLer === 1 ? "livro está" : "livros estão"} na sua lista de quero ler. amanhã tem mais indicação.`
              : "amanhã tem mais indicação. avalie os livros que você leu para as próximas ficarem mais a sua cara."}
          </p>
          <BotaoLink href={continuar.href} className="mt-auto lg:mt-8">
            continuar
          </BotaoLink>
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
    </>,
  );
}
