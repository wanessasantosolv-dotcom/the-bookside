"use client";

import { useState } from "react";
import { abas, type Aba } from "@/components/NavInferior";
import { usePerfil } from "@/lib/perfil-store";

const descricoes: Record<Aba, string> = {
  inicio:
    "sua página inicial: a citação do dia, o que você está lendo e as novidades de quem você segue.",
  estantes:
    "suas estantes: lidos, lendo e quero ler — organize do seu jeito e crie estantes próprias.",
  descobrir:
    "descobrir: recomendações pensadas pra você e os lançamentos do momento.",
  clubes:
    "clubes: leia acompanhada, vote no próximo livro e troque fichas com a turma.",
  numeros:
    "jornada: acompanhe quantos livros você já leu e seus números ao longo do ano.",
  perfil: "perfil: sua estante em destaque, favoritos e configurações da conta.",
};

/**
 * Passo a passo mostrando onde fica cada coisa no app, exibido uma única vez,
 * assim que a pessoa termina o cadastro e entra no app pela primeira vez.
 * Controlado por `tourVisto` no perfil (local, por aparelho).
 */
export function TourApp() {
  const onboardingConcluido = usePerfil((s) => s.onboardingConcluido);
  const tourVisto = usePerfil((s) => s.tourVisto);
  const atualizar = usePerfil((s) => s.atualizar);
  const [passo, setPasso] = useState(0);

  if (!onboardingConcluido || tourVisto) return null;

  const total = abas.length + 1; // boas-vindas + uma por aba
  const ultimo = passo === total - 1;
  const aba = passo > 0 ? abas[passo - 1] : null;

  function encerrar() {
    atualizar({ tourVisto: true });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#2b1420]/55 backdrop-blur-[2px] lg:items-center lg:justify-center">
      <button
        type="button"
        onClick={encerrar}
        className="absolute top-[max(16px,env(safe-area-inset-top))] right-4 z-10 min-h-11 px-3 text-[11px] font-semibold tracking-[.08em] text-creme/80 uppercase"
      >
        pular
      </button>

      <div className="mt-auto w-full rounded-t-[22px] bg-creme px-6 pt-7 pb-[max(22px,env(safe-area-inset-bottom))] lg:mx-auto lg:mt-0 lg:max-w-[380px] lg:rounded-[14px] lg:pb-7">
        {/* pontinhos de progresso */}
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={`h-1.5 rounded-full transition-all ${
                i === passo ? "w-5 bg-bordo" : "w-1.5 bg-linha"
              }`}
            />
          ))}
        </div>

        {aba === null ? (
          <div className="mt-6 text-center">
            <span
              aria-hidden
              className="font-accent text-[26px] italic text-ouro"
            >
              ✦
            </span>
            <h1 className="mt-2 font-display text-[25px] leading-[1.15] font-bold italic text-bordo">
              deixa eu te mostrar
              <br />
              onde fica cada coisa
            </h1>
            <p className="mt-2.5 text-[13px] leading-[1.45] text-cinza">
              um passeio rápido pelo app, pra você já começar se sentindo em
              casa.
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-bordo to-bordo-escuro text-creme">
              <svg
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                {aba.icone}
              </svg>
            </span>
            <h1 className="mt-3.5 font-display text-[21px] font-bold italic text-bordo">
              {aba.rotulo}
            </h1>
            <p className="mt-2 text-[13px] leading-[1.45] text-cinza">
              {descricoes[aba.id]}
            </p>
          </div>
        )}

        <div className="mt-7 flex items-center gap-3">
          {passo > 0 ? (
            <button
              type="button"
              onClick={() => setPasso((p) => p - 1)}
              className="flex min-h-12 flex-none items-center justify-center rounded-pill border border-linha px-4 text-[13px] font-semibold text-cinza"
            >
              voltar
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => (ultimo ? encerrar() : setPasso((p) => p + 1))}
            className="flex min-h-12 flex-1 items-center justify-center rounded-pill bg-bordo text-[13px] font-semibold text-creme"
          >
            {ultimo ? "começar a usar" : "próximo"}
          </button>
        </div>
      </div>
    </div>
  );
}
