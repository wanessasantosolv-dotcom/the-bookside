"use client";

import Link from "next/link";
import { useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { BotaoLink } from "@/components/ui/Botao";
import { Tela } from "@/components/ui/Tela";
import { useSugestoes } from "@/lib/catalogo";
import { usePerfil, type StatusLivro } from "@/lib/perfil-store";

/** "guardei esta pra você": um livro por vez — passar, quero ler ou já li. */
export default function DescobrirPage() {
  const guardarLivro = usePerfil((s) => s.guardarLivro);
  const livros = usePerfil((s) => s.livros);
  // começa pelo livro com sinopse (o destaque do design)
  const sugestoes = useSugestoes();
  const fila = [...sugestoes].sort((a, b) => Number(!!b.sinopse) - Number(!!a.sinopse));
  const [indice, setIndice] = useState(0);
  const livro = fila[indice];
  const queroLer = livros.filter((l) => l.status === "quero").length;

  function responder(status: StatusLivro | null) {
    if (status) guardarLivro({ id: livro.id, titulo: livro.titulo, autor: livro.autor, capa: livro.capa, status });
    setIndice((i) => i + 1);
  }

  const botao =
    "flex flex-col items-center gap-[9px] text-[9px] font-semibold tracking-[.14em] text-cinza uppercase";
  const selo =
    "flex size-[62px] items-center justify-center rounded-full border border-linha bg-creme-quente transition-transform active:scale-95";

  return (
    <Tela className="px-6 pb-[max(24px,env(safe-area-inset-bottom))]">
      <header className="flex items-center justify-between pt-[18px]">
        <Link href="/criar-perfil/estante" className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo">
          ‹ estante
        </Link>
        <span className="eyebrow !text-[10px] text-cinza">pra você ✦</span>
      </header>

      <div className="animate-subir pt-4">
        <p className="eyebrow !text-[10px] !tracking-[.14em] text-bordo">indicação do dia</p>
        <p className="mt-2 font-display text-[26px] leading-[1.15] font-semibold italic text-bordo">
          {livro ? "guardei esta pra você:" : "sua lista está começando"}
        </p>
      </div>

      {livro ? (
        <>
          <div key={livro.id} className="relative mt-6 flex animate-subir justify-center">
            <span aria-hidden className="absolute top-2 left-7 text-[15px] text-ouro">✧</span>
            <span aria-hidden className="absolute top-20 right-6 text-[11px] text-rosa-antigo">✦</span>
            <CapaLivro
              titulo={livro.titulo} capa={livro.capa}
              cor={livro.cor}
              className="w-[166px] rotate-[1.5deg] !rounded-[3px_7px_7px_3px] !p-3 shadow-[inset_7px_0_8px_-6px_rgba(43,20,32,.55),0_16px_28px_-12px_rgba(43,20,32,.5)] [&>span:last-child]:text-lg"
            />
          </div>

          <div className="mt-6 text-center">
            <p className="font-display text-[23px] leading-[1.15] font-semibold italic text-ameixa">{livro.titulo}</p>
            <p className="eyebrow mt-1.5 !text-[10px] text-cinza">
              {livro.autor}
              {livro.genero ? ` · ${livro.genero}` : ""}
            </p>
            {livro.sinopse ? <p className="mt-3 text-[13px] leading-normal text-cinza">{livro.sinopse}</p> : null}
          </div>

          <div className="mt-auto flex justify-center gap-[34px] pt-8">
            <button type="button" className={botao} onClick={() => responder(null)}>
              <span className={selo}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2B1420" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </span>
              passar
            </button>
            <button type="button" className={`${botao} text-bordo`} onClick={() => responder("quero")}>
              <span className={`${selo} border-bordo`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B0D24" strokeWidth="1.7" strokeLinejoin="round" aria-hidden>
                  <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
                </svg>
              </span>
              quero ler
            </button>
            <button type="button" className={botao} onClick={() => responder("lido")}>
              <span className={selo}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2B1420" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
              já li
            </button>
          </div>

          <p className="mt-6 text-center">
            <Link href="/criar-perfil/gostos" className="inline-block py-2 font-accent text-[15px] italic text-cinza underline underline-offset-4">
              {queroLer ? `continuar com ${queroLer} na lista` : "pular por agora"}
            </Link>
          </p>
        </>
      ) : (
        <div className="flex flex-1 flex-col">
          <p className="mt-4 font-accent text-[17px] leading-[1.35] italic text-cinza">
            {queroLer
              ? `${queroLer} ${queroLer === 1 ? "livro foi" : "livros foram"} para a sua lista de quero ler.`
              : "por hoje é isso. amanhã tem mais indicação."}
          </p>
          <BotaoLink href="/criar-perfil/gostos" className="mt-auto">
            continuar
          </BotaoLink>
        </div>
      )}
    </Tela>
  );
}
