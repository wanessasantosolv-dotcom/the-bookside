"use client";

import { useEffect, useRef, useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { EstrelasInput } from "@/components/clube/Pecas";
import { corDoLivro } from "@/lib/cores";
import { dataDoDia, diaDaData, diaLocal, ontem } from "@/lib/datas";
import { formatos } from "@/lib/formatos";
import type { FormatoLivro, LivroSalvo } from "@/lib/perfil-store";

/** o que a pessoa responde ao registrar uma leitura concluída */
export type Termino = {
  /** ISO; sem data = a pessoa não lembra (ou não quer dizer) quando terminou */
  lidoEm?: string;
  /** a pessoa sabe só o ano (conta no ano, não nos meses) */
  lidoSoAno?: boolean;
  /** a pessoa sabe mês e ano (conta no mês e no ano, não em dias) */
  lidoSoMes?: boolean;
  nota?: number;
  formato?: FormatoLivro;
  iniciadoEm?: string;
  /** é uma nova leitura de um livro já lido: a anterior vai para o histórico */
  releituras?: LivroSalvo["releituras"];
};

/** o que vai para o livro da estante a partir da resposta (nada é inventado) */
export function dadosDoTermino(t: Termino): Partial<LivroSalvo> {
  return {
    lidoEm: t.lidoEm,
    lidoSoAno: t.lidoSoAno || undefined,
    lidoSoMes: t.lidoSoMes || undefined,
    ...(t.nota ? { nota: t.nota } : {}),
    ...(t.formato ? { formato: t.formato } : {}),
    ...(t.iniciadoEm ? { iniciadoEm: t.iniciadoEm } : {}),
    ...(t.releituras ? { releituras: t.releituras, iniciadoEm: t.iniciadoEm, nota: t.nota } : {}),
  };
}

type Precisao = "hoje" | "ontem" | "dia" | "mes" | "ano" | "nenhuma";
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/**
 * "mais uma história." — a ficha rápida de leitura concluída, a mesma em todo
 * o app. Data com a precisão que a pessoa lembra, nota e formato opcionais,
 * detalhes (início, releitura) recolhidos. Uma ação principal só.
 */
export function PerguntaTermino({
  titulo,
  autor,
  capa,
  inicial,
  notaInicial,
  formatoInicial,
  anterior,
  onConfirmar,
  onCancelar,
}: {
  titulo: string;
  autor?: string;
  capa?: string;
  /** data já salva (ISO), se o livro já tinha sido lido antes */
  inicial?: string;
  notaInicial?: number;
  formatoInicial?: FormatoLivro;
  /** o registro atual do livro na estante (reaproveita início; permite releitura) */
  anterior?: LivroSalvo;
  onConfirmar: (t: Termino) => void;
  onCancelar: () => void;
}) {
  const hoje = diaLocal();
  const anoHoje = Number(hoje.slice(0, 4));
  const jaLido = anterior?.status === "lido";
  const [precisao, setPrecisao] = useState<Precisao>(inicial ? (anterior?.lidoSoAno ? "ano" : anterior?.lidoSoMes ? "mes" : "dia") : "hoje");
  const [dia, setDia] = useState(diaDaData(inicial) ?? hoje);
  const [mes, setMes] = useState(() => Number((diaDaData(inicial) ?? hoje).slice(5, 7)));
  const [ano, setAno] = useState(() => Number((diaDaData(inicial) ?? hoje).slice(0, 4)));
  const [nota, setNota] = useState(jaLido ? 0 : (notaInicial ?? 0));
  const [formato, setFormato] = useState<FormatoLivro | undefined>(formatoInicial ?? anterior?.formato);
  const [detalhes, setDetalhes] = useState(false);
  const [inicio, setInicio] = useState(diaDaData(anterior?.status === "lendo" ? anterior.iniciadoEm : undefined) ?? "");
  const [releitura, setReleitura] = useState(jaLido);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    caixa.current?.querySelector<HTMLButtonElement>("[data-foco]")?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onCancelar();
    document.addEventListener("keydown", esc);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = antes;
    };
  }, [onCancelar]);

  /** o fim escolhido, como dia (AAAA-MM-DD) para comparar com o início */
  const fimDia = precisao === "hoje" ? hoje : precisao === "ontem" ? ontem() : precisao === "dia" ? dia : precisao === "mes" ? `${ano}-${String(mes).padStart(2, "0")}-01` : precisao === "ano" ? `${ano}-01-01` : null;

  function confirmar() {
    if (enviando) return;
    if (precisao === "dia" && !dia) return setErro("Escolha a data em que terminou.");
    if (fimDia && fimDia > hoje) return setErro("A data de conclusão não pode estar no futuro.");
    if ((precisao === "mes" || precisao === "ano") && (ano < 1900 || ano > anoHoje)) return setErro(`Informe um ano entre 1900 e ${anoHoje}.`);
    if (inicio && inicio > hoje) return setErro("A data de início não pode estar no futuro.");
    if (inicio && fimDia && precisao !== "mes" && precisao !== "ano" && inicio > fimDia) return setErro("O início precisa ser antes da conclusão.");
    setErro("");
    setEnviando(true);
    const lidoEm =
      precisao === "nenhuma"
        ? undefined
        : precisao === "ano"
          ? new Date(`${ano}-01-01T12:00:00`).toISOString()
          : precisao === "mes"
            ? new Date(`${ano}-${String(mes).padStart(2, "0")}-01T12:00:00`).toISOString()
            : dataDoDia(fimDia!);
    onConfirmar({
      lidoEm,
      lidoSoAno: precisao === "ano",
      lidoSoMes: precisao === "mes",
      nota: nota || undefined,
      formato,
      iniciadoEm: inicio ? dataDoDia(inicio) : undefined,
      // releitura: a leitura anterior vai para o histórico, sem apagar nota nem datas
      releituras:
        jaLido && releitura
          ? [...(anterior!.releituras ?? []), { iniciadoEm: anterior!.iniciadoEm, lidoEm: anterior!.lidoEm, lidoSoAno: anterior!.lidoSoAno, lidoSoMes: anterior!.lidoSoMes, nota: anterior!.nota, formato: anterior!.formato }]
          : undefined,
    });
  }

  const opcao = (id: Precisao, rotulo: string) => (
    <button
      key={id}
      type="button"
      aria-pressed={precisao === id}
      onClick={() => (setPrecisao(id), setErro(""))}
      className={`min-h-10 rounded-[6px] border px-3 text-[13px] ${precisao === id ? "border-[#692536] bg-[#E8D2D8] font-semibold text-[#692536]" : "border-[#DCCDC8] text-ameixa hover:border-bege"}`}
    >
      {rotulo}
    </button>
  );
  const campo = "h-11 min-w-0 rounded-[6px] border border-[#DCCDC8] bg-creme-quente px-3 text-[15px] text-ameixa outline-none focus:border-[#692536]";
  const rotulo = "mb-2 block text-[13px] font-semibold text-ameixa";

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#38252C]/50 backdrop-blur-[3px] sm:items-center sm:p-4" onClick={(e) => e.target === e.currentTarget && onCancelar()}>
      <div ref={caixa} role="dialog" aria-modal="true" aria-labelledby="pergunta-termino" className="relative flex max-h-[92dvh] w-full max-w-[440px] animate-subir flex-col rounded-t-[12px] bg-creme sm:rounded-[10px]">
        <div className="overflow-y-auto px-5 pt-5 pb-3 sm:px-6">
          <button type="button" onClick={onCancelar} aria-label="fechar" className="absolute top-2.5 right-2.5 grid size-10 place-items-center rounded-full text-cinza hover:bg-rosa-fundo">
            <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          <h2 id="pergunta-termino" className="font-revista text-[26px] leading-none text-bordo italic">
            mais uma história.
          </h2>

          <div className="mt-4 flex items-center gap-3.5">
            <CapaLivro titulo={titulo} capa={capa} cor={corDoLivro(titulo)} className="w-[58px] flex-none [&>span:last-child]:hidden" />
            <div className="min-w-0">
              <p className="line-clamp-2 font-revista text-[18px] leading-tight text-ameixa">{titulo}</p>
              {autor ? <p className="truncate text-[13px] text-cinza">{autor}</p> : null}
              <p className="mt-1 text-[12px] font-semibold text-[#667255]">✓ leitura concluída</p>
            </div>
          </div>

          <fieldset className="mt-5">
            <legend className={rotulo}>Quando você terminou?</legend>
            <div className="flex flex-wrap gap-2">
              {opcao("hoje", "Hoje")}
              {opcao("ontem", "Ontem")}
              {opcao("dia", "Data exata")}
              {opcao("mes", "Mês e ano")}
              {opcao("ano", "Só o ano")}
              {opcao("nenhuma", "Não lembro")}
            </div>
            {precisao === "dia" ? (
              <input type="date" value={dia} max={hoje} onChange={(e) => setDia(e.target.value)} aria-label="data de conclusão" className={`${campo} mt-3 block w-full appearance-none`} />
            ) : precisao === "mes" ? (
              <div className="mt-3 flex gap-2">
                <select value={mes} onChange={(e) => setMes(Number(e.target.value))} aria-label="mês" className={`${campo} flex-[3]`}>
                  {MESES.map((m, i) => (
                    <option key={m} value={i + 1} disabled={ano === anoHoje && i + 1 > Number(hoje.slice(5, 7))}>
                      {m}
                    </option>
                  ))}
                </select>
                <input type="number" inputMode="numeric" min={1900} max={anoHoje} value={ano} onChange={(e) => setAno(Number(e.target.value) || ano)} aria-label="ano" className={`${campo} flex-[2]`} />
              </div>
            ) : precisao === "ano" ? (
              <input type="number" inputMode="numeric" min={1900} max={anoHoje} value={ano} onChange={(e) => setAno(Number(e.target.value) || ano)} aria-label="ano" className={`${campo} mt-3 w-32`} />
            ) : null}
            <p className="mt-2 text-[12px] text-cinza">
              {precisao === "mes"
                ? "Conta no mês e no ano (e no diário daquele mês), sem um dia específico."
                : precisao === "ano"
                  ? "Conta no ano, sem mês nem dia."
                  : precisao === "nenhuma"
                    ? "Entra nos lidos e no histórico, mas em nenhum mês nem na meta de um ano. Dá para pôr a data depois."
                    : null}
            </p>
          </fieldset>

          <div className="mt-5">
            <div className="mb-1 flex items-baseline justify-between">
              <p className={rotulo.replace("mb-2 ", "")}>O que achou da leitura?</p>
              {nota ? (
                <button type="button" onClick={() => setNota(0)} className="text-[12px] text-cinza underline-offset-2 hover:text-bordo hover:underline">
                  tirar nota
                </button>
              ) : (
                <span className="text-[12px] text-cinza">opcional</span>
              )}
            </div>
            <EstrelasInput valor={nota} onMudar={setNota} rotulo="sua nota" />
          </div>

          <fieldset className="mt-5">
            <legend className={rotulo}>
              Formato <span className="font-normal text-cinza">· opcional</span>
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {formatos.map((f) => {
                const on = formato === f.id;
                return (
                  <button key={f.id} type="button" aria-pressed={on} onClick={() => setFormato(on ? undefined : f.id)} className={`flex min-h-[54px] flex-col items-center justify-center gap-1 rounded-[6px] border text-[12px] ${on ? "border-[#692536] bg-[#E8D2D8] font-semibold text-[#692536]" : "border-[#DCCDC8] text-ameixa hover:border-bege"}`}>
                    <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      {f.icone.split(" M").map((d, i) => (
                        <path key={i} d={i ? `M${d}` : d} />
                      ))}
                    </svg>
                    {f.nome}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-4 border-t border-[#DCCDC8]">
            <button type="button" aria-expanded={detalhes} onClick={() => setDetalhes((v) => !v)} className="flex min-h-11 w-full items-center justify-between text-[13px] font-semibold text-bordo">
              Adicionar detalhes da leitura
              <span aria-hidden className={`transition-transform ${detalhes ? "rotate-180" : ""}`}>▾</span>
            </button>
            {detalhes ? (
              <div className="space-y-3 pb-2">
                <label className="block">
                  <span className="mb-1 block text-[12px] text-tinta-suave">Data de início</span>
                  <input type="date" value={inicio} max={fimDia && precisao !== "mes" && precisao !== "ano" ? fimDia : hoje} onChange={(e) => setInicio(e.target.value)} className={`${campo} block w-full appearance-none`} />
                </label>
                {jaLido ? (
                  <label className="flex items-start gap-2.5 text-[13px] text-ameixa">
                    <input type="checkbox" checked={releitura} onChange={(e) => setReleitura(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-bordo)]" />
                    <span>
                      É uma releitura
                      <span className="block text-[12px] text-cinza">a leitura anterior{anterior?.lidoEm ? ` (${new Date(anterior.lidoEm).getFullYear()})` : ""} fica guardada no histórico, com nota e datas.</span>
                    </span>
                  </label>
                ) : null}
              </div>
            ) : null}
          </div>
          {erro ? (
            <p role="alert" className="mt-2 text-[13px] font-semibold text-bordo">
              {erro}
            </p>
          ) : null}
        </div>
        <div className="border-t border-[#DCCDC8] px-5 pt-3 pb-[max(14px,env(safe-area-inset-bottom))] sm:px-6">
          <button type="button" data-foco onClick={confirmar} disabled={enviando} className="flex h-12 w-full items-center justify-center rounded-[6px] bg-bordo text-[15px] font-semibold text-creme hover:bg-bordo-suave disabled:opacity-60">
            {enviando ? "Registrando…" : "Registrar leitura"}
          </button>
          <button type="button" onClick={onCancelar} className="mt-1 min-h-10 w-full text-[13px] text-cinza hover:text-bordo">
            cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
