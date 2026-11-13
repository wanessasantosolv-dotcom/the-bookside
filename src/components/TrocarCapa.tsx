"use client";

import { useEffect, useRef, useState } from "react";
import { AjustarFoto } from "@/components/AjustarFoto";
import { Botao } from "@/components/ui/Botao";
import { opcoesDeCapa } from "@/lib/catalogo";
import { reduzirImagem } from "@/lib/imagem";

/**
 * Trocar a capa de um livro: escolher entre as edições encontradas
 * (Google Books + Open Library) ou enviar uma imagem e ajustar o corte.
 */
export function TrocarCapa({
  titulo,
  autor,
  atual,
  onFechar,
  onEscolher,
}: {
  titulo: string;
  autor: string;
  atual?: string;
  onFechar: () => void;
  onEscolher: (capa: string) => void;
}) {
  const [opcoes, setOpcoes] = useState<string[] | null>(null);
  const [quebradas, setQuebradas] = useState<string[]>([]);
  const [paraAjustar, setParaAjustar] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const arquivo = useRef<HTMLInputElement>(null);
  const cabecalho = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const c = new AbortController();
    opcoesDeCapa(titulo, autor, c.signal).then(setOpcoes);
    return () => c.abort();
  }, [titulo, autor]);

  useEffect(() => {
    cabecalho.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !paraAjustar && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar, paraAjustar]);

  async function enviar(f: File | undefined) {
    if (!f) return;
    setErro(null);
    try {
      setParaAjustar(await reduzirImagem(f, 1600, 0.9));
    } catch {
      setErro("não deu para abrir essa imagem. tente outra.");
    }
  }

  if (paraAjustar) {
    return (
      <AjustarFoto
        src={paraAjustar}
        formato="livro"
        onCancelar={() => setParaAjustar(null)}
        onPronto={(capa) => {
          onEscolher(capa);
          onFechar();
        }}
      />
    );
  }

  const visiveis = (opcoes ?? []).filter((u) => !quebradas.includes(u));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ameixa/70 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-trocar-capa"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div className="flex max-h-[90dvh] w-full max-w-[560px] animate-subir flex-col rounded-t-[28px] bg-creme px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] sm:rounded-[28px]">
        <h2
          id="titulo-trocar-capa"
          ref={cabecalho}
          tabIndex={-1}
          style={{ outline: "none" }}
          className="font-display text-2xl font-semibold italic text-bordo"
        >
          trocar a capa
        </h2>
        <p className="mt-1 text-[13px] text-cinza">escolha uma edição ou envie uma foto da sua capa.</p>

        <div className="mt-4 min-h-[120px] flex-1 overflow-y-auto">
          {opcoes === null ? (
            <p className="py-8 text-center font-accent text-sm italic text-cinza">procurando edições…</p>
          ) : visiveis.length ? (
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {visiveis.map((u) => {
                const marcada = u === atual;
                return (
                  <li key={u}>
                    <button
                      type="button"
                      aria-pressed={marcada}
                      aria-label={marcada ? "capa atual" : "usar esta capa"}
                      onClick={() => {
                        onEscolher(u);
                        onFechar();
                      }}
                      className={`relative block aspect-[2/3] w-full overflow-hidden rounded-[2px_4px_4px_2px] bg-linha shadow-[2px_4px_8px_-3px_rgba(43,20,32,.45)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bordo ${marcada ? "ring-2 ring-bordo ring-offset-2 ring-offset-creme" : ""}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u}
                        alt=""
                        loading="lazy"
                        onError={() => setQuebradas((q) => [...q, u])}
                        className="absolute inset-0 size-full object-cover"
                      />
                      {marcada ? (
                        <span className="absolute top-1 right-1 size-5 rounded-full bg-bordo text-center text-[11px] leading-5 font-bold text-creme">
                          ✓
                        </span>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-8 text-center font-accent text-sm italic text-cinza">
              não encontramos edições deste livro. envie uma foto da capa.
            </p>
          )}
        </div>

        {erro ? (
          <p role="alert" className="mt-3 text-[13px] text-bordo">
            {erro}
          </p>
        ) : null}
        <input
          ref={arquivo}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            void enviar(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div className="mt-4 flex gap-2.5">
          <Botao variante="contorno" className="flex-1" onClick={onFechar}>
            cancelar
          </Botao>
          <Botao className="flex-1" onClick={() => arquivo.current?.click()}>
            enviar imagem
          </Botao>
        </div>
      </div>
    </div>
  );
}
