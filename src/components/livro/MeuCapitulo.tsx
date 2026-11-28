"use client";
import { dataParcial } from "@/lib/estantes";

import Link from "next/link";
import { useState } from "react";
import { formatos } from "@/lib/formatos";
import { diasDeLeitura } from "@/lib/numeros";
import type {
  FormatoLivro,
  LivroSalvo,
  StatusLivro,
} from "@/lib/perfil-store";

const data = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
const nota1 = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const estrelas = (n: number) =>
  "★".repeat(Math.floor(n)) + (n % 1 >= 0.5 ? "½" : "");

/** um dado pequeno do bloco: rótulo em cima, valor embaixo */
function Dado({ r, v }: { r: string; v: string | null | undefined }) {
  if (!v) return null;
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-rosa-claro">{r}</dt>
      <dd className="mt-0.5 truncate text-[14px] font-semibold">{v}</dd>
    </div>
  );
}

/** o formato, para trocar ali mesmo (físico · e-book · áudio) */
function TrocaFormato({
  valor,
  onChange,
}: {
  valor?: FormatoLivro;
  onChange: (f: FormatoLivro | undefined) => void;
}) {
  return (
    <div role="radiogroup" aria-label="formato da leitura" className="flex flex-wrap gap-1.5">
      {formatos.map((f) => {
        const on = valor === f.id;
        return (
          <button
            key={f.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(on ? undefined : f.id)}
            className={`flex h-9 items-center gap-1.5 rounded-pill px-3.5 text-[12px] font-semibold ${
              on ? "bg-creme text-bordo" : "border border-creme/35 text-creme hover:border-creme/70"
            }`}
          >
            <svg
              aria-hidden
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="flex-none"
            >
              {f.icone.split(" M").map((d, i) => (
                <path key={i} d={i ? `M${d}` : d} />
              ))}
            </svg>
            {f.curto}
          </button>
        );
      })}
    </div>
  );
}

const botaoClaro =
  "flex h-12 w-full items-center justify-center rounded-[12px] bg-creme px-5 text-[14px] font-semibold text-bordo hover:bg-rosa-claro";
const linkPequeno =
  "text-[12px] font-semibold text-rosa-claro underline-offset-4 hover:text-creme hover:underline";

/**
 * "Meu capítulo": tudo o que é pessoal sobre a leitura, num bloco só, que
 * muda conforme o status (não está na estante, quero ler, lendo, lido,
 * pausado ou abandonado).
 */
export function MeuCapitulo({
  livro,
  status,
  onMarcar,
  onFormato,
  onPausar,
  onAbandonar,
  onReler,
}: {
  livro: LivroSalvo & { paginas?: number };
  status: StatusLivro | null;
  onMarcar: (s: StatusLivro) => void;
  onFormato: (f: FormatoLivro | undefined) => void;
  onPausar: () => void;
  onAbandonar: () => void;
  onReler: () => void;
}) {
  const [historico, setHistorico] = useState(false);
  const progresso =
    livro.paginas && livro.paginaAtual
      ? Math.min(100, Math.round((livro.paginaAtual / livro.paginas) * 100))
      : null;
  const formato = formatos.find((f) => f.id === livro.formato)?.nome;
  const releituras = livro.releituras ?? [];

  const titulo: Record<string, string> = {
    nenhum: "Esta história ainda não começou.",
    quero: "Uma história à sua espera.",
    lendo: "Entre páginas.",
    lido: "Última página virada.",
    pausado: "Uma pausa entre capítulos.",
    abandonado: "Nem toda história é para agora.",
  };

  return (
    <section
      aria-label="meu capítulo"
      className="inverso rounded-[18px] bg-bordo px-6 py-6 text-creme lg:rounded-[14px] lg:px-7 lg:py-7"
    >
      <p className="font-display text-[17px] font-semibold lg:font-revista lg:text-[19px] lg:font-normal">
        Meu capítulo
      </p>
      <h2 className="mt-1 font-display text-[26px] leading-tight font-semibold italic lg:font-revista lg:text-[30px] lg:font-normal">
        {titulo[status ?? "nenhum"]}
      </h2>

      {/* lendo, pausado e abandonado: o progresso */}
      {status === "lendo" || status === "pausado" || status === "abandonado" ? (
        <div className="mt-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="flex items-baseline gap-1.5">
              <b className="font-display text-[30px] leading-none font-semibold tabular-nums lg:font-revista lg:font-normal">
                {livro.paginaAtual ?? 0}
              </b>
              <span className="text-[14px] text-rosa-claro">
                {livro.paginas ? `/ ${livro.paginas} páginas` : "páginas"}
              </span>
            </p>
            {progresso !== null ? (
              <span className="text-[15px] font-semibold tabular-nums">{progresso}%</span>
            ) : null}
          </div>
          <div
            className="mt-3 h-[8px] overflow-hidden rounded-full bg-creme/20"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progresso ?? 0}
            aria-label="progresso da leitura"
          >
            <span
              className="block h-full rounded-full bg-rosa-claro"
              style={{ width: `${progresso ?? 0}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* lido: a nota */}
      {status === "lido" ? (
        <p className="mt-4 flex items-baseline gap-2">
          {livro.nota ? (
            <>
              <b className="font-display text-[34px] leading-none font-semibold tabular-nums lg:font-revista lg:font-normal">
                {nota1(livro.nota)}
              </b>
              <span className="text-[17px] tracking-[2px] text-rosa-claro" aria-label={`nota ${livro.nota} de 5`}>
                {estrelas(livro.nota)}
              </span>
            </>
          ) : (
            <span className="text-[14px] text-rosa-claro">sem nota ainda</span>
          )}
        </p>
      ) : null}

      {/* os dados de cada status */}
      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-creme/20 pt-4">
        {status === null ? (
          <div className="col-span-2 text-[13px] text-rosa-claro">
            guarde na estante para acompanhar a leitura, registrar trechos e
            escrever a sua ficha.
          </div>
        ) : null}
        {status === "quero" ? (
          <Dado r="na sua lista desde" v={data(livro.adicionadoEm) ?? "—"} />
        ) : null}
        {status === "lendo" ? (
          <>
            <Dado r="início da leitura" v={data(livro.iniciadoEm) ?? "—"} />
            <Dado r="formato" v={formato ?? "—"} />
          </>
        ) : null}
        {status === "lido" ? (
          <>
            <Dado r="começou" v={data(livro.iniciadoEm)} />
            <Dado r="terminou" v={dataParcial(livro) ?? data(livro.lidoEm) ?? "sem data"} />
            <Dado
              r="tempo de leitura"
              v={(() => {
                const d = diasDeLeitura(livro);
                return d ? (d === 1 ? "1 dia" : `${d} dias`) : null;
              })()}
            />
            <Dado r="formato" v={formato} />
          </>
        ) : null}
        {status === "pausado" || status === "abandonado" ? (
          <>
            <Dado r="status" v={status === "pausado" ? "pausado" : "abandonado"} />
            <Dado r="desde" v={data(livro.paradoEm ?? livro.atualizadoEm) ?? "—"} />
          </>
        ) : null}
      </dl>

      {status === "lendo" ? (
        <div className="mt-4">
          <TrocaFormato valor={livro.formato} onChange={onFormato} />
        </div>
      ) : null}

      {/* a ação principal de cada status */}
      <div className="mt-5 space-y-3">
        {status === null ? (
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onMarcar("quero")} className={botaoClaro}>
              quero ler
            </button>
            <button
              type="button"
              onClick={() => onMarcar("lendo")}
              className="flex h-12 items-center justify-center rounded-[12px] border border-creme/40 text-[14px] font-semibold hover:border-creme"
            >
              começar a ler
            </button>
          </div>
        ) : status === "quero" ? (
          <button type="button" onClick={() => onMarcar("lendo")} className={botaoClaro}>
            começar a leitura
          </button>
        ) : status === "lendo" ? (
          <>
            <Link href={`/livro/${livro.id}/progresso`} className={botaoClaro}>
              atualizar progresso
            </Link>
            <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              <button type="button" onClick={onPausar} className={`${linkPequeno} inline-flex items-center gap-1.5`}>
                <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5v14M15 5v14" /></svg>
                pausar
              </button>
              <button type="button" onClick={onAbandonar} className={`${linkPequeno} inline-flex items-center gap-1.5`}>
                <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                abandonei
              </button>
              <button type="button" onClick={() => onMarcar("lido")} className={`${linkPequeno} inline-flex items-center gap-1.5`}>
                <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                terminei
              </button>
            </p>
          </>
        ) : status === "lido" ? (
          <>
            <Link href={`/livro/${livro.id}/avaliar`} className={botaoClaro}>
              {livro.resenha || livro.nota ? "ver e editar minha ficha" : "escrever minha ficha"}
            </Link>
            <p className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              <button type="button" onClick={onReler} className={`${linkPequeno} inline-flex items-center gap-1.5`}>
                <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" /></svg>
                começar uma releitura
              </button>
              {releituras.length ? (
                <button
                  type="button"
                  aria-expanded={historico}
                  onClick={() => setHistorico((v) => !v)}
                  className={linkPequeno}
                >
                  {historico ? "esconder leituras anteriores" : `leituras anteriores (${releituras.length})`}
                </button>
              ) : null}
            </p>
          </>
        ) : (
          <button type="button" onClick={() => onMarcar("lendo")} className={botaoClaro}>
            retomar a leitura
          </button>
        )}
        {status === "lendo" && releituras.length ? (
          <p className="text-center">
            <button
              type="button"
              aria-expanded={historico}
              onClick={() => setHistorico((v) => !v)}
              className={linkPequeno}
            >
              {historico ? "esconder leituras anteriores" : `releitura · leituras anteriores (${releituras.length})`}
            </button>
          </p>
        ) : null}
      </div>

      {historico && releituras.length ? (
        <ol className="mt-4 space-y-2 border-t border-creme/20 pt-3 text-[12px]">
          {releituras.map((r, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span>
                {i + 1}ª leitura · {data(r.iniciadoEm) ?? "?"} → {dataParcial(r) ?? data(r.lidoEm) ?? "sem data"}
              </span>
              <span className="text-rosa-claro">{r.nota ? `${nota1(r.nota)} ★` : ""}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
