"use client";

import { useEffect, useRef, useState } from "react";
import {
  botaoContorno,
  botaoPrincipal,
  campo,
  rotuloCampo,
} from "@/components/clube/Pecas";
import { dataDoDia, diaDaData, diaLocal, ontem } from "@/lib/datas";

/**
 * "quando você terminou?" — a pergunta que aparece em todo lugar do app em
 * que a pessoa marca um livro como lido. Devolve a data escolhida (ISO).
 */
export function PerguntaTermino({
  titulo,
  inicial,
  onConfirmar,
  onCancelar,
}: {
  titulo: string;
  /** data já salva (ISO), se o livro já tinha sido lido antes */
  inicial?: string;
  onConfirmar: (lidoEm: string) => void;
  onCancelar: () => void;
}) {
  const hoje = diaLocal();
  const [dia, setDia] = useState(diaDaData(inicial) ?? hoje);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    caixa.current?.querySelector<HTMLInputElement>("input")?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCancelar();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onCancelar]);

  const atalho = (valor: string, rotulo: string) => (
    <button
      type="button"
      aria-pressed={dia === valor}
      onClick={() => setDia(valor)}
      className={`flex min-h-9 items-center rounded-pill px-3.5 text-xs font-semibold ${
        dia === valor ? "bg-bordo text-creme" : "border border-bege text-ameixa"
      }`}
    >
      {rotulo}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ameixa/40 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onCancelar()}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pergunta-termino"
        className="w-full max-w-[430px] animate-subir rounded-t-[20px] bg-creme px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] sm:rounded-[20px]"
      >
        <p className="text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
          já li ✓
        </p>
        <h2
          id="pergunta-termino"
          className="mt-1 font-display text-[26px] leading-[1.1] font-semibold italic text-bordo"
        >
          quando você terminou?
        </h2>
        <p className="mt-1 truncate font-accent text-sm italic text-cinza">
          {titulo}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {atalho(hoje, "hoje")}
          {atalho(ontem(), "ontem")}
        </div>
        <label className="mt-4 block">
          <span className={rotuloCampo}>terminei em</span>
          <input
            type="date"
            value={dia}
            max={hoje}
            onChange={(e) => setDia(e.target.value)}
            className={campo}
          />
        </label>
        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            disabled={!dia}
            onClick={() => onConfirmar(dataDoDia(dia > hoje ? hoje : dia))}
            className={`${botaoPrincipal} flex-1`}
          >
            marcar como lido
          </button>
          <button type="button" onClick={onCancelar} className={botaoContorno}>
            cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
