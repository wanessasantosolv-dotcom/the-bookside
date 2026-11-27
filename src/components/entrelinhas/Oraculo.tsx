"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { VersoCarta } from "@/components/entrelinhas/Carta";
import { ResultadoCarta } from "@/components/entrelinhas/Resultado";
import { useHidratado } from "@/components/PerfilHidratacao";
import { DESEMPATE, EDITORIAIS, PERGUNTAS, imagemDaAlternativa, respondidas, type Alternativa, type CartaId } from "@/lib/entrelinhas";
import { retomarDaNuvem, useEntrelinhas } from "@/lib/entrelinhas-store";

/** o store só vale depois de ler o aparelho (o HTML do servidor não sabe da execução) */
function useProntoEntrelinhas() {
  return useSyncExternalStore(
    (cb) => useEntrelinhas.persist.onFinishHydration(cb),
    () => useEntrelinhas.persist.hasHydrated(),
    () => false,
  );
}

const dois = (n: number) => String(n).padStart(2, "0");

/**
 * nas entrelinhas — uma rota só, com estados: abertura → dez perguntas →
 * (desempate) → revelação → resultado.
 */
export function Oraculo() {
  const pronto = useProntoEntrelinhas();
  const perfilPronto = useHidratado();
  const params = useSearchParams();
  const router = useRouter();
  const execucao = useEntrelinhas((s) => s.execucao);
  const resultado = useEntrelinhas((s) => s.resultado);
  const iniciar = useEntrelinhas((s) => s.iniciar);
  const concluir = useEntrelinhas((s) => s.concluir);
  const descartar = useEntrelinhas((s) => s.descartar);
  // na abertura até a pessoa escolher começar ou continuar
  const [naAbertura, setNaAbertura] = useState(true);
  // a carta que acabou de ser revelada (anima só nesta visita)
  const [revelada, setRevelada] = useState<CartaId | null>(null);
  const verResultado = params.get("ver") === "carta";

  useEffect(() => {
    if (pronto && perfilPronto) void retomarDaNuvem();
  }, [pronto, perfilPronto]);

  // revelação: fecha a execução e mostra a carta virando
  useEffect(() => {
    if (execucao?.fase === "revelacao" && execucao.carta) {
      setRevelada(execucao.carta);
      concluir();
      window.scrollTo({ top: 0 });
    }
  }, [execucao?.fase, execucao?.carta, concluir]);

  if (!pronto || !perfilPronto) return <div className="min-h-dvh bg-creme" />;

  if (revelada || (verResultado && resultado && !execucao)) {
    const carta = revelada ?? resultado!.carta;
    return (
      <ResultadoCarta
        carta={carta}
        afinidade={resultado?.carta === carta ? resultado.afinidade : null}
        execucaoId={resultado?.execucaoId ?? ""}
        animar={!!revelada}
        refazer={() => {
          setRevelada(null);
          iniciar();
          setNaAbertura(false);
          router.replace("/nas-entrelinhas");
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  if (execucao && !naAbertura && (execucao.fase === "perguntas" || execucao.fase === "desempate")) return <Fluxo />;

  return (
    <Abertura
      emAndamento={execucao?.fase === "perguntas" || execucao?.fase === "desempate" ? Object.keys(execucao.respostas).length : null}
      temResultado={!!resultado}
      comecar={() => {
        iniciar();
        setNaAbertura(false);
      }}
      continuar={() => setNaAbertura(false)}
      recomecar={() => {
        descartar();
        iniciar();
        setNaAbertura(false);
      }}
    />
  );
}

/* ───────── abertura ───────── */

function Abertura({ emAndamento, temResultado, comecar, continuar, recomecar }: { emAndamento: number | null; temResultado: boolean; comecar: () => void; continuar: () => void; recomecar: () => void }) {
  return (
    <main className="relative flex min-h-dvh flex-col bg-creme text-ameixa">
      <header className="flex items-center justify-between px-4 pt-[max(12px,env(safe-area-inset-top))]">
        <Link href="/descobrir" className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo">
          Voltar ao The Bookside
        </Link>
      </header>
      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))] text-center lg:justify-center lg:pt-0">
        <p className="text-[11px] font-semibold tracking-[.18em] text-cinza uppercase">The Bookside apresenta</p>
        {/* três versos abertos em leque */}
        <div aria-hidden className="relative mt-6 h-[176px] w-[240px]">
          <VersoCarta largura={80} className="absolute top-3 left-[34px] origin-bottom -rotate-[12deg]" />
          <VersoCarta largura={80} className="absolute top-3 right-[34px] origin-bottom rotate-[12deg]" />
          <VersoCarta largura={80} className="absolute top-0 left-1/2 -translate-x-1/2" />
        </div>
        <h1 className="mt-6 font-revista text-[44px] leading-none text-bordo italic lg:text-[52px]">nas entrelinhas.</h1>
        <p className="mt-2 text-[15px] font-semibold text-ameixa">O oráculo dos leitores</p>
        <p className="mt-1 font-revista text-[15px] text-tinta-suave italic">Nem toda história está escrita nas páginas.</p>
        <p className="mt-5 max-w-[42ch] text-[14px] leading-relaxed text-tinta-suave">
          Entre escolhas inesperadas, pequenas memórias e diferentes maneiras de ler, descubra qual das oito cartas representa sua relação com as histórias.
        </p>
        <p className="mt-3 text-[12px] text-cinza">10 perguntas · 8 cartas · cerca de 3 minutos</p>

        <div className="mt-7 flex w-full max-w-[340px] flex-col gap-2">
          {emAndamento !== null ? (
            <>
              <button type="button" onClick={continuar} className="h-12 rounded-[6px] bg-bordo text-[15px] font-semibold text-creme hover:bg-bordo-suave">
                Continuar de onde parei
              </button>
              <p className="text-[12px] text-cinza">{emAndamento} de 10 respondidas</p>
              <button type="button" onClick={recomecar} className="min-h-11 text-[13px] font-semibold text-tinta-suave hover:text-bordo">
                Começar de novo
              </button>
            </>
          ) : (
            <button type="button" onClick={comecar} className="h-12 rounded-[6px] bg-bordo text-[15px] font-semibold text-creme hover:bg-bordo-suave">
              Descobrir minha carta
            </button>
          )}
          {temResultado ? (
            <Link href="/nas-entrelinhas?ver=carta" className="flex min-h-11 items-center justify-center text-[13px] font-semibold text-bordo">
              Ver minha carta
            </Link>
          ) : null}
        </div>
      </div>
    </main>
  );
}

/* ───────── perguntas e desempate ───────── */

function Fluxo() {
  const e = useEntrelinhas((s) => s.execucao)!;
  const responder = useEntrelinhas((s) => s.responder);
  const irPara = useEntrelinhas((s) => s.irPara);
  const finalizar = useEntrelinhas((s) => s.finalizarPerguntas);
  const escolherDesempate = useEntrelinhas((s) => s.escolherDesempate);
  const voltarDoDesempate = useEntrelinhas((s) => s.voltarDoDesempate);
  const [escolhaDesempate, setEscolhaDesempate] = useState<CartaId | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  const desempate = e.fase === "desempate";
  const p = PERGUNTAS[e.indice];
  const ultima = e.indice === PERGUNTAS.length - 1;
  const escolhida = e.respostas[p.id];
  // a ordem sorteada no começo da execução (estável ao voltar e ao recarregar)
  const alternativas = (e.ordem[p.id] ?? p.alternativas.map((a) => a.id)).map((id) => p.alternativas.find((a) => a.id === id)!).filter(Boolean);

  // o foco vai para o enunciado a cada pergunta (leitores de tela e teclado)
  useEffect(() => {
    titulo.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [e.indice, desempate]);

  function avancar() {
    if (desempate) {
      if (escolhaDesempate) escolherDesempate(escolhaDesempate);
      return;
    }
    if (!escolhida) return;
    if (ultima) {
      if (respondidas(e.respostas)) finalizar();
      else irPara(PERGUNTAS.findIndex((q) => !e.respostas[q.id]));
    } else irPara(e.indice + 1);
  }
  function voltar() {
    if (desempate) voltarDoDesempate();
    else if (e.indice > 0) irPara(e.indice - 1);
  }

  const podeAvancar = desempate ? !!escolhaDesempate : !!escolhida;
  const rotuloAvancar = desempate || ultima ? "Revelar minha carta" : "Continuar";
  const numero = desempate ? null : e.indice + 1;

  return (
    <main className="flex min-h-dvh flex-col bg-creme text-ameixa">
      {/* cabeçalho compacto */}
      <header className="sticky top-0 z-10 bg-creme/95 px-4 pt-[max(8px,env(safe-area-inset-top))] backdrop-blur-sm">
        <div className="mx-auto flex max-w-[640px] items-center justify-between gap-3">
          <Link href="/descobrir" aria-label="Voltar ao The Bookside" title="Voltar ao The Bookside" className="-ml-2 grid size-11 place-items-center text-tinta-suave hover:text-bordo">
            <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </Link>
          <span className="font-revista text-[16px] text-bordo italic">nas entrelinhas.</span>
          <span className="w-11 text-right text-[12px] text-cinza tabular-nums">{numero ? `${dois(numero)}/10` : ""}</span>
        </div>
        <div className="mx-auto max-w-[640px] pb-2">
          <div
            role="progressbar"
            aria-label={numero ? `Pergunta ${dois(numero)} de 10` : "Uma última escolha"}
            aria-valuemin={0}
            aria-valuemax={10}
            aria-valuenow={numero ?? 10}
            className="h-[3px] overflow-hidden rounded-full bg-linha"
          >
            <span className="block h-full rounded-full bg-bordo transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${((numero ?? 10) / 10) * 100}%` }} />
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[640px] flex-1 px-5 pt-4 pb-32 lg:pt-8">
        {desempate ? (
          <>
            <p className="text-[11px] font-semibold tracking-[.16em] text-bordo uppercase">Uma última escolha.</p>
            <h2 ref={titulo} tabIndex={-1} className="mt-2 font-revista text-[24px] leading-tight text-ameixa outline-none lg:text-[28px]">
              {DESEMPATE.pergunta}
            </h2>
            <fieldset className="mt-6">
              <legend className="sr-only">{DESEMPATE.pergunta}</legend>
              <div className="flex flex-col gap-2.5">
                {(e.empatados ?? []).map((c) => (
                  <OpcaoTexto key={c} nome="desempate" valor={c} texto={DESEMPATE.alternativas[c]} marcada={escolhaDesempate === c} onEscolher={() => setEscolhaDesempate(c)} />
                ))}
              </div>
            </fieldset>
          </>
        ) : (
          <>
            <p className="text-[11px] font-semibold tracking-[.16em] text-bordo uppercase">
              <span className="sr-only">Pergunta {dois(e.indice + 1)} de 10. </span>
              {p.titulo}
            </p>
            <h2 ref={titulo} tabIndex={-1} className="mt-2 font-revista text-[23px] leading-tight text-ameixa outline-none lg:text-[28px]">
              {p.enunciado}
            </h2>
            <fieldset className="mt-6">
              <legend className="sr-only">{p.enunciado}</legend>
              {p.formato === "ilustrada" ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {alternativas.map((a) => (
                    <OpcaoIlustrada key={a.id} pergunta={p.id} a={a} marcada={escolhida === a.id} onEscolher={() => responder(p.id, a.id)} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {alternativas.map((a) =>
                    EDITORIAIS.has(p.id) || p.formato === "editorial" ? (
                      <OpcaoEditorial key={a.id} pergunta={p.id} a={a} marcada={escolhida === a.id} onEscolher={() => responder(p.id, a.id)} depoimento={p.id === "q10"} />
                    ) : (
                      <OpcaoTexto key={a.id} nome={p.id} valor={a.id} texto={a.texto} marcada={escolhida === a.id} onEscolher={() => responder(p.id, a.id)} />
                    ),
                  )}
                </div>
              )}
            </fieldset>
          </>
        )}
      </div>

      {/* navegação: sempre à mão, sem avançar sozinha */}
      <nav aria-label="navegação do teste" className="fixed inset-x-0 bottom-0 z-10 border-t border-linha bg-creme/95 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-sm">
        <div className="mx-auto flex max-w-[640px] items-center gap-3">
          <button
            type="button"
            onClick={voltar}
            disabled={!desempate && e.indice === 0}
            className="h-12 rounded-[6px] border border-bege px-5 text-[14px] font-semibold text-ameixa disabled:opacity-35"
          >
            Voltar
          </button>
          <button type="button" onClick={avancar} disabled={!podeAvancar} className="h-12 flex-1 rounded-[6px] bg-bordo text-[15px] font-semibold text-creme hover:bg-bordo-suave disabled:opacity-40">
            {rotuloAvancar}
          </button>
        </div>
      </nav>
    </main>
  );
}

/* ───────── alternativas ───────── */

const marcador = (on: boolean) => (
  <span aria-hidden className={`mt-0.5 grid size-5 flex-none place-items-center rounded-full border-[1.5px] ${on ? "border-bordo bg-bordo text-creme" : "border-bege"}`}>
    {on ? (
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    ) : null}
  </span>
);

function OpcaoTexto({ nome, valor, texto, marcada, onEscolher }: { nome: string; valor: string; texto: string; marcada: boolean; onEscolher: () => void }) {
  return (
    <label
      className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-[8px] border px-4 py-3.5 text-[15px] leading-snug transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bordo ${
        marcada ? "border-bordo bg-rosa-fundo/70 text-ameixa" : "border-linha bg-creme-quente text-tinta-suave hover:border-bege"
      }`}
    >
      <input type="radio" name={nome} value={valor} checked={marcada} onChange={onEscolher} className="sr-only" />
      {marcador(marcada)}
      <span>{texto}</span>
    </label>
  );
}

function OpcaoEditorial({ pergunta, a, marcada, onEscolher, depoimento }: { pergunta: string; a: Alternativa; marcada: boolean; onEscolher: () => void; depoimento: boolean }) {
  return (
    <label
      className={`relative flex cursor-pointer items-start gap-3 rounded-[4px] border px-4 py-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bordo ${
        marcada ? "border-bordo bg-rosa-fundo/60" : "border-linha bg-creme-quente hover:border-bege"
      }`}
    >
      <input type="radio" name={pergunta} value={a.id} checked={marcada} onChange={onEscolher} className="sr-only" />
      {marcador(marcada)}
      <span className="min-w-0">
        <span aria-hidden className="block font-revista text-[30px] leading-[.6] text-bordo/60">“</span>
        <span className="block font-revista text-[17px] leading-snug text-ameixa italic">{a.texto.replace(/^[“"]|[”"]$/g, "")}</span>
        {depoimento ? <span className="mt-2 block text-[11px] tracking-[.12em] text-cinza uppercase">— um leitor</span> : null}
      </span>
    </label>
  );
}

function OpcaoIlustrada({ pergunta, a, marcada, onEscolher }: { pergunta: string; a: Alternativa; marcada: boolean; onEscolher: () => void }) {
  const [falhou, setFalhou] = useState(false);
  return (
    <label
      className={`flex cursor-pointer flex-col overflow-hidden rounded-[8px] border-[1.5px] bg-creme-quente transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bordo ${
        marcada ? "border-bordo" : "border-linha hover:border-bege"
      }`}
    >
      <input type="radio" name={pergunta} value={a.id} checked={marcada} onChange={onEscolher} className="sr-only" />
      <span className="relative block aspect-square bg-papel">
        {falhou ? (
          <span className="absolute inset-0 grid place-items-center px-3 text-center text-[11px] text-cinza">a ilustração não carregou</span>
        ) : (
          <img src={imagemDaAlternativa(a)} alt="" loading="eager" decoding="async" onError={() => setFalhou(true)} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
        )}
        {marcada ? (
          <span aria-hidden className="absolute top-2 right-2 grid size-6 place-items-center rounded-full bg-bordo text-creme shadow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </span>
        ) : null}
      </span>
      <span className={`flex min-h-[56px] items-start px-3 py-2.5 text-[13px] leading-snug ${marcada ? "font-semibold text-ameixa" : "text-tinta-suave"}`}>{a.texto}</span>
    </label>
  );
}

