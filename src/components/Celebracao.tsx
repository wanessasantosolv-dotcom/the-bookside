"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { corDoLivro } from "@/lib/cores";
import { useCelebracao } from "@/lib/celebrar";

const PECAS = {
  livro: ["✦", "★", "📖", "✧", "♥"],
  meta: ["✦", "★", "🎉", "✧", "📚", "♥"],
  desafio: ["✦", "🏆", "★", "✧", "♥"],
  amei: ["♥", "♥", "♡", "✦"],
  favorito: ["✦", "★", "✧"],
};
const CORES = ["#6B0D24", "#B75A6B", "#C9A46A", "#E8B4BF", "#6B7A5E"];
const EYEBROW = {
  livro: "terminei! ✦",
  meta: "meta do ano batida",
  desafio: "desafio concluído",
  amei: "amei",
  favorito: "novo favorito",
};

/**
 * A celebração por cima da tela: confete de estrelinhas, livros e corações
 * caindo + um cartão. "amei" e "favorito" são só um estouro rápido, sem cartão.
 */
export function Celebracao() {
  const atual = useCelebracao((s) => s.atual);
  const fechar = useCelebracao((s) => s.fechar);
  const pequeno = atual?.tipo === "amei" || atual?.tipo === "favorito";

  // com botões de ação (terminou um livro), dá mais tempo antes de fechar sozinho
  const comAcoes =
    (atual?.tipo === "livro" || atual?.tipo === "meta") && !!atual?.livroId;
  useEffect(() => {
    if (!atual) return;
    navigator.vibrate?.(pequeno ? 30 : [40, 60, 40]);
    const t = setTimeout(fechar, pequeno ? 1400 : comAcoes ? 6500 : 4200);
    return () => clearTimeout(t);
  }, [atual, fechar, pequeno, comAcoes]);

  const confete = useMemo(() => {
    if (!atual) return [];
    const n = pequeno ? 14 : atual.tipo === "meta" ? 60 : 40;
    const pecas = PECAS[atual.tipo];
    return Array.from({ length: n }, (_, i) => ({
      i,
      peca: pecas[i % pecas.length],
      cor: CORES[i % CORES.length],
      x: Math.random() * 100,
      atraso: Math.random() * (pequeno ? 0.2 : 0.9),
      duracao: 1.6 + Math.random() * 1.8,
      giro: (Math.random() - 0.5) * 540,
      tamanho: 12 + Math.random() * 16,
      deriva: (Math.random() - 0.5) * 120,
    }));
  }, [atual, pequeno]);

  if (!atual) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[80] overflow-hidden"
      aria-live="polite"
    >
      {pequeno ? (
        // estouro: sai do meio da tela para todos os lados
        confete.map((c) => (
          <span
            key={`${atual.id}-${c.i}`}
            className="celebra-estouro absolute top-1/2 left-1/2"
            style={
              {
                color: c.cor,
                fontSize: c.tamanho + 4,
                "--dx": `${Math.cos((c.i / confete.length) * Math.PI * 2) * 140}px`,
                "--dy": `${Math.sin((c.i / confete.length) * Math.PI * 2) * 140}px`,
                animationDelay: `${c.atraso}s`,
              } as React.CSSProperties
            }
          >
            {c.peca}
          </span>
        ))
      ) : (
        <>
          {confete.map((c) => (
            <span
              key={`${atual.id}-${c.i}`}
              className="celebra-cai absolute -top-10"
              style={
                {
                  left: `${c.x}%`,
                  color: c.cor,
                  fontSize: c.tamanho,
                  animationDuration: `${c.duracao}s`,
                  animationDelay: `${c.atraso}s`,
                  "--giro": `${c.giro}deg`,
                  "--deriva": `${c.deriva}px`,
                } as React.CSSProperties
              }
            >
              {c.peca}
            </span>
          ))}
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div
              role="button"
              tabIndex={0}
              onClick={fechar}
              onKeyDown={(e) => e.key === "Enter" && fechar()}
              className="celebra-cartao pointer-events-auto w-full max-w-[340px] rounded-[20px] bg-creme px-6 pt-6 pb-5 text-center shadow-[0_30px_60px_-20px_rgba(43,20,32,.55)]"
            >
              <span className="block text-[10px] font-semibold tracking-[.22em] text-bordo uppercase">
                {EYEBROW[atual.tipo]}
              </span>
              {atual.capa !== undefined ? (
                <span className="mx-auto mt-4 block w-[92px] -rotate-2">
                  <CapaLivro
                    titulo={atual.titulo}
                    capa={atual.capa}
                    cor={corDoLivro(atual.titulo)}
                    className="w-full [&>span:last-child]:text-[10px]"
                  />
                </span>
              ) : (
                <span className="mt-3 block text-4xl">
                  {atual.tipo === "meta"
                    ? "📚"
                    : atual.tipo === "desafio"
                      ? "🏆"
                      : "✦"}
                </span>
              )}
              <span className="mt-3 block font-display text-[24px] leading-tight font-semibold italic text-ameixa">
                {atual.titulo}
              </span>
              {atual.texto ? (
                <span className="mt-1.5 block font-accent text-sm italic text-cinza">
                  {atual.texto}
                </span>
              ) : null}
              {(atual.tipo === "livro" || atual.tipo === "meta") &&
              atual.livroId ? (
                <div className="mt-4 flex flex-col gap-2">
                  <Link
                    href={`/livro/${atual.livroId}/avaliar`}
                    onClick={(e) => {
                      e.stopPropagation();
                      fechar();
                    }}
                    className="flex min-h-11 items-center justify-center gap-1.5 rounded-pill bg-bordo text-[13px] font-semibold text-creme"
                  >
                    fazer a ficha ✎
                  </Link>
                  <Link
                    href={`/story?tipo=terminei&livro=${atual.livroId}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      fechar();
                    }}
                    className="flex min-h-11 items-center justify-center gap-1.5 rounded-pill border border-bordo text-[13px] font-semibold text-bordo"
                  >
                    compartilhar no story ✦
                  </Link>
                </div>
              ) : null}
              <span className="mt-3 block text-[11px] font-semibold text-bordo">
                toque para fechar
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
