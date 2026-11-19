"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import { Voltar } from "@/components/Voltar";
import { corDoLivro } from "@/lib/cores";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];
const SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

/** "AAAA-MM-DD" do jeito local (sem fuso bagunçar o dia) */
const dia = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const diaDe = (iso?: string) => (iso ? dia(new Date(iso)) : undefined);

/**
 * O calendário de leitura: em cada dia, as capas do que você estava lendo
 * (do dia em que começou até o dia em que terminou). O dia em que terminou
 * fica com a capa inteira e um ✓.
 */
export default function CalendarioPage() {
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  const hoje = new Date();
  const [ref, setRef] = useState(
    () => new Date(hoje.getFullYear(), hoje.getMonth(), 1),
  );

  // para cada livro: o intervalo de dias em que esteve sendo lido
  const intervalos = useMemo(
    () =>
      livros
        .filter((l) => l.status === "lido" || l.status === "lendo")
        .map((l) => {
          const fim = l.status === "lido" ? diaDe(l.lidoEm) : dia(new Date());
          const inicio = diaDe(l.iniciadoEm) ?? fim;
          return { l, inicio, fim };
        })
        .filter(
          (x): x is { l: LivroSalvo; inicio: string; fim: string } =>
            !!x.inicio && !!x.fim,
        ),
    [livros],
  );

  if (!hidratado) return <AppShell aba="perfil">{null}</AppShell>;

  const ano = ref.getFullYear();
  const mes = ref.getMonth();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const celulas: (number | null)[] = [
    ...Array.from({ length: primeiroDiaSemana }, () => null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];
  while (celulas.length % 7) celulas.push(null);

  const doDia = (d: number) => {
    const chave = dia(new Date(ano, mes, d));
    const terminou = intervalos.filter(
      (x) => x.l.status === "lido" && x.fim === chave,
    );
    const lendo = intervalos.filter(
      (x) => x.inicio <= chave && x.fim >= chave && !terminou.includes(x),
    );
    return {
      chave,
      terminou: terminou.map((x) => x.l),
      lendo: lendo.map((x) => x.l),
    };
  };

  const prefixo = `${ano}-${String(mes + 1).padStart(2, "0")}`;
  const terminadosNoMes = intervalos.filter(
    (x) => x.l.status === "lido" && x.fim.startsWith(prefixo),
  ).length;
  const diasLendo = celulas.filter(
    (d) => d && (doDia(d).lendo.length || doDia(d).terminou.length),
  ).length;
  const ehHoje = (d: number) =>
    ano === hoje.getFullYear() &&
    mes === hoje.getMonth() &&
    d === hoje.getDate();
  const futuro = (d: number) => new Date(ano, mes, d) > hoje;

  const mudarMes = (delta: number) =>
    setRef((r) => new Date(r.getFullYear(), r.getMonth() + delta, 1));

  return (
    <AppShell aba="perfil">
      <div className="flex flex-1 flex-col px-4 pt-2 pb-10 sm:px-6 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="mx-auto w-full max-w-[760px]">
          <Voltar
            padrao="/numeros"
            rotulo="jornada"
            className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo"
          />
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[.2em] text-bordo uppercase lg:text-grafite">
                calendário de leitura
              </p>
              <h1 className="mt-1 font-display text-[34px] leading-none font-semibold italic text-bordo lg:font-revista lg:text-[44px] lg:font-normal lg:text-tinta">
                {MESES[mes]} <span className="text-cinza">{ano}</span>
              </h1>
              <p className="mt-2 font-accent text-sm italic text-cinza">
                {terminadosNoMes
                  ? `${terminadosNoMes} ${terminadosNoMes === 1 ? "livro terminado" : "livros terminados"} · ${diasLendo} ${diasLendo === 1 ? "dia" : "dias"} com livro aberto`
                  : diasLendo
                    ? `${diasLendo} ${diasLendo === 1 ? "dia" : "dias"} com livro aberto`
                    : "nenhuma leitura marcada neste mês"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => mudarMes(-1)}
                aria-label="mês anterior"
                className="flex size-11 items-center justify-center rounded-full border border-bege text-bordo hover:border-bordo"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() =>
                  setRef(new Date(hoje.getFullYear(), hoje.getMonth(), 1))
                }
                className="h-11 rounded-pill border border-bege px-4 text-xs font-semibold text-ameixa hover:border-bordo"
              >
                hoje
              </button>
              <button
                type="button"
                onClick={() => mudarMes(1)}
                aria-label="próximo mês"
                className="flex size-11 items-center justify-center rounded-full border border-bege text-bordo hover:border-bordo"
              >
                ›
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-1 sm:gap-2">
            {SEMANA.map((s) => (
              <span
                key={s}
                className="pb-1 text-center text-[10px] font-semibold tracking-[.12em] text-cinza uppercase"
              >
                {s}
              </span>
            ))}
            {celulas.map((d, i) => {
              if (!d) return <span key={`v${i}`} />;
              const { terminou, lendo } = doDia(d);
              const principal = terminou[0];
              return (
                <div
                  key={d}
                  className={`relative aspect-[2/3] overflow-hidden rounded-[6px] border ${
                    ehHoje(d)
                      ? "border-bordo ring-1 ring-bordo"
                      : "border-linha"
                  } ${futuro(d) ? "opacity-40" : ""} ${principal ? "" : "bg-creme-quente"}`}
                >
                  {principal ? (
                    <Link
                      href={`/livro/${principal.id}`}
                      title={`terminou ${principal.titulo}`}
                      className="absolute inset-0"
                    >
                      <CapaLivro
                        titulo={principal.titulo}
                        capa={principal.capa}
                        cor={corDoLivro(principal.id)}
                        className="h-full w-full !rounded-none !shadow-none [&>span:last-child]:text-[7px]"
                      />
                      <span className="absolute right-0.5 bottom-0.5 flex size-4 items-center justify-center rounded-full bg-bordo text-[9px] font-bold text-creme sm:size-5 sm:text-[10px]">
                        ✓
                      </span>
                      {terminou.length > 1 ? (
                        <span className="absolute bottom-0.5 left-0.5 rounded-pill bg-creme/90 px-1 text-[9px] font-bold text-bordo">
                          +{terminou.length - 1}
                        </span>
                      ) : null}
                    </Link>
                  ) : lendo.length ? (
                    <div className="absolute inset-x-1 bottom-1 flex justify-center -space-x-2.5">
                      {lendo.slice(0, 2).map((l) => (
                        <Link
                          key={l.id}
                          href={`/livro/${l.id}`}
                          title={`lendo ${l.titulo}`}
                          className="w-[46%] max-w-[38px]"
                        >
                          <CapaLivro
                            titulo={l.titulo}
                            capa={l.capa}
                            cor={corDoLivro(l.id)}
                            className="w-full opacity-80 [&>span:last-child]:hidden"
                          />
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  <span
                    className={`absolute top-0.5 left-1 text-[10px] font-semibold sm:top-1 sm:left-1.5 sm:text-xs ${
                      principal
                        ? "rounded bg-creme/85 px-1 text-bordo"
                        : ehHoje(d)
                          ? "text-bordo"
                          : "text-cinza"
                    }`}
                  >
                    {d}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-cinza">
            <span className="flex items-center gap-1.5">
              <span className="flex size-4 items-center justify-center rounded-full bg-bordo text-[9px] font-bold text-creme">
                ✓
              </span>
              dia em que terminou
            </span>
            <span>
              capinhas pequenas: livros que estavam abertos naquele dia
            </span>
          </p>
        </div>
      </div>
    </AppShell>
  );
}
