"use client";

import { useEffect, useRef, useState } from "react";
import {
  botaoContorno,
  botaoPrincipal,
  campo,
  EstrelasInput,
  rotuloCampo,
} from "@/components/clube/Pecas";
import { SeletorFormato } from "@/components/SeletorFormato";
import { dataDoDia, diaDaData, diaLocal, ontem } from "@/lib/datas";
import type { FormatoLivro, LivroSalvo } from "@/lib/perfil-store";

/** o que a pessoa responde ao marcar como lido */
export type Termino = {
  /** ISO; sem data = a pessoa não lembra (ou não quer dizer) quando terminou */
  lidoEm?: string;
  /** a pessoa sabe só o ano */
  lidoSoAno?: boolean;
  nota?: number;
  formato?: FormatoLivro;
};

/** o que vai para o livro da estante a partir da resposta */
export function dadosDoTermino(t: Termino): Partial<LivroSalvo> {
  return {
    lidoEm: t.lidoEm,
    lidoSoAno: t.lidoSoAno || undefined,
    ...(t.nota ? { nota: t.nota } : {}),
    ...(t.formato ? { formato: t.formato } : {}),
  };
}

/**
 * "quando você terminou?" — a pergunta que aparece em todo lugar do app em
 * que a pessoa marca um livro como lido. Também pede (se quiser) a nota e
 * como leu (físico, e-book ou áudio). A data pode ficar em branco.
 */
export function PerguntaTermino({
  titulo,
  inicial,
  notaInicial,
  formatoInicial,
  onConfirmar,
  onCancelar,
}: {
  titulo: string;
  /** data já salva (ISO), se o livro já tinha sido lido antes */
  inicial?: string;
  notaInicial?: number;
  formatoInicial?: FormatoLivro;
  onConfirmar: (t: Termino) => void;
  onCancelar: () => void;
}) {
  const hoje = diaLocal();
  const [dia, setDia] = useState(diaDaData(inicial) ?? hoje);
  const [semData, setSemData] = useState(false);
  const [soAno, setSoAno] = useState(false);
  const [ano, setAno] = useState(() => Number((diaDaData(inicial) ?? hoje).slice(0, 4)));
  const [nota, setNota] = useState(notaInicial ?? 0);
  const [formato, setFormato] = useState<FormatoLivro | undefined>(
    formatoInicial,
  );
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    caixa.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCancelar();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onCancelar]);

  const chip = (on: boolean, rotulo: string, aoTocar: () => void) => (
    <button
      type="button"
      aria-pressed={on}
      onClick={aoTocar}
      className={`flex min-h-9 items-center rounded-pill px-3.5 text-xs font-semibold ${
        on ? "bg-bordo text-creme" : "border border-bege text-ameixa"
      }`}
    >
      {rotulo}
    </button>
  );
  const atalho = (valor: string, rotulo: string) =>
    chip(!semData && !soAno && dia === valor, rotulo, () => {
      setSemData(false);
      setSoAno(false);
      setDia(valor);
    });

  function confirmar() {
    onConfirmar({
      lidoEm: semData ? undefined : soAno ? new Date(`${ano}-01-01T12:00:00`).toISOString() : !dia ? undefined : dataDoDia(dia > hoje ? hoje : dia),
      lidoSoAno: !semData && soAno,
      nota: nota || undefined,
      formato,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#2b1420]/40 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onCancelar()}
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pergunta-termino"
        className="max-h-[92dvh] w-full max-w-[430px] animate-subir overflow-y-auto rounded-t-[20px] bg-creme px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] sm:rounded-[20px]"
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
          {chip(soAno && !semData, "só sei o ano", () => {
            setSemData(false);
            setSoAno((v) => !v);
          })}
          {chip(semData, "sem data", () => {
            setSoAno(false);
            setSemData((v) => !v);
          })}
        </div>
        {semData ? (
          <p className="mt-3 text-[12px] text-cinza">
            o livro entra nos lidos, mas não conta em nenhum mês nem na meta do
            ano. dá para pôr a data depois.
          </p>
        ) : soAno ? (
          <label className="mt-4 block">
            <span className={rotuloCampo}>li em (ano)</span>
            <input
              type="number"
              inputMode="numeric"
              min={1900}
              max={Number(hoje.slice(0, 4))}
              value={ano}
              onChange={(e) => setAno(Number(e.target.value) || ano)}
              className={`${campo} min-w-0`}
            />
            <span className="mt-1.5 block text-[12px] text-cinza">conta no ano, mas não em nenhum mês.</span>
          </label>
        ) : (
          <label className="mt-4 block min-w-0">
            <span className={rotuloCampo}>terminei em</span>
            <input
              type="date"
              value={dia}
              max={hoje}
              onChange={(e) => setDia(e.target.value)}
              className={`${campo} block w-full max-w-full min-w-0 appearance-none`}
            />
          </label>
        )}

        <div className="mt-5">
          <p className={rotuloCampo}>sua nota (se quiser)</p>
          <EstrelasInput valor={nota} onMudar={setNota} rotulo="sua nota" />
        </div>

        <SeletorFormato
          valor={formato}
          onChange={setFormato}
          rotulo="como você leu?"
          className="mt-5"
        />

        <div className="mt-6 flex gap-2.5">
          <button
            type="button"
            disabled={!semData && !dia}
            onClick={confirmar}
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
