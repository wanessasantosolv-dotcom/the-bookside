"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { MapaPaises } from "@/components/numeros/MapaPaises";
import { linkDaAutoria } from "@/lib/autores";
import { corDoLivro } from "@/lib/cores";
import {
  anosComLeitura,
  destaquesDoAno,
  diasDoMes,
  formatosComParte,
  horasEstimadas,
  mesesDoAno,
  MESES,
  type Destaque,
  type MesDoAno,
} from "@/lib/jornada";
import { bandeira, paisesDasAutoras, type Pais } from "@/lib/nacionalidade";
import { calcularNumeros, mesDoReview, type Numeros } from "@/lib/numeros";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";

/*
 * A Jornada: uma retrospectiva literária numa página só, em estilo de
 * revista. Dois blocos coloridos (a meta e o mês em revista); o resto fica
 * direto sobre o papel do app, separado por fios finos, números grandes e
 * as capas dos livros.
 */

const numero = (n: number) => n.toLocaleString("pt-BR");
const nota1 = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const plural = (n: number, um: string, varios: string) =>
  `${numero(n)} ${n === 1 ? um : varios}`;

/** títulos de seção: número em máquina de escrever + título editorial */
function Secao({
  n,
  titulo,
  acao,
  children,
  className = "",
}: {
  n: string;
  titulo: string;
  acao?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      data-secao={n}
      className={`border-t border-linha pt-5 [counter-increment:secao] lg:border-fio lg:pt-7 ${className}`}
    >
      <header className="mb-4 flex items-baseline justify-between gap-3 lg:mb-6">
        <h3 className="flex items-baseline gap-2.5">
          {/* numeração automática (01, 02…), na ordem em que as seções aparecem */}
          <span
            aria-hidden
            className="font-maquina text-[10px] text-rosa-antigo before:content-[counter(secao,decimal-leading-zero)]"
          />
          <span className="font-display text-[22px] leading-tight font-semibold italic text-ameixa lg:font-revista lg:text-[28px] lg:font-normal">
            {titulo}
          </span>
        </h3>
        {acao}
      </header>
      {children}
    </section>
  );
}

const linkAcao =
  "flex-none text-[11px] font-semibold tracking-[.08em] text-bordo uppercase hover:underline";

const capaDe = (l: LivroSalvo, className: string) => (
  <CapaLivro titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className={className} />
);

// ───────── cabeçalho ─────────

function Cabecalho({
  anos,
  ano,
  onAno,
}: {
  anos: number[];
  ano: number;
  onAno: (a: number) => void;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div>
        <h2 className="font-display text-[34px] leading-[1.02] font-semibold italic text-bordo lg:font-revista lg:text-[52px] lg:font-normal lg:text-tinta">
          sua jornada
        </h2>
        <p className="mt-1 font-accent text-[15px] italic text-cinza lg:text-base">
          uma vida entre páginas.
        </p>
      </div>
      {anos.length > 1 ? (
        <div
          role="radiogroup"
          aria-label="ano da jornada"
          className="flex max-w-full gap-1 overflow-x-auto [scrollbar-width:none]"
        >
          {anos.map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={a === ano}
              onClick={() => onAno(a)}
              className={`h-9 flex-none rounded-pill px-3.5 font-maquina text-[12px] ${
                a === ano
                  ? "bg-ameixa text-creme"
                  : "text-cinza hover:text-bordo"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      ) : (
        <span className="font-maquina text-[13px] text-cinza">{ano}</span>
      )}
    </header>
  );
}

// ───────── 01 · seu ano em números ─────────

function AnoEmNumeros({ n, atual }: { n: Numeros; atual: boolean }) {
  // a meta é do ano corrente; nos anos passados, só o total
  const meta = atual ? n.meta : null;
  const pct = meta ? Math.min(100, (n.total / meta) * 100) : 0;
  const indicadores: { valor: string; rotulo: string; nota?: string }[] = [
    {
      valor: n.paginasConhecidas ? numero(n.paginas) : "—",
      rotulo: "páginas lidas",
      nota:
        n.paginasConhecidas && n.paginasConhecidas < n.total
          ? `de ${plural(n.paginasConhecidas, "livro", "livros")} com páginas`
          : !n.paginasConhecidas && n.total
            ? "nenhum livro com páginas"
            : undefined,
    },
    {
      valor: n.media !== null ? nota1(n.media) : "—",
      rotulo: "nota média",
      nota: n.media === null && n.total ? "sem notas ainda" : undefined,
    },
    {
      valor: n.paginasPorLivro ? numero(n.paginasPorLivro) : "—",
      rotulo: "páginas por livro",
    },
  ];
  return (
    <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr] lg:gap-10">
      {/* a meta: o bloco colorido de maior peso da página */}
      <div className="inverso relative overflow-hidden rounded-[20px] bg-bordo px-6 pt-5 pb-6 text-creme lg:rounded-[6px] lg:px-9 lg:pt-8 lg:pb-9">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold tracking-[.2em] text-rosa-claro uppercase">
            {meta ? "meta de leitura" : `lidos em ${n.ano}`}
          </p>
          {atual ? (
            <Link
              href="/perfil/editar"
              className="text-[11px] font-semibold text-rosa-claro/90 underline-offset-4 hover:underline"
            >
              {meta ? "editar meta" : "definir uma meta"}
            </Link>
          ) : null}
        </div>
        <p className="mt-3 flex items-baseline gap-2">
          <b className="font-display text-[76px] leading-[.85] font-semibold italic tabular-nums lg:font-revista lg:text-[112px] lg:font-normal">
            {n.total}
          </b>
          <span className="font-display text-[22px] italic text-rosa-claro lg:font-revista lg:text-[30px]">
            {meta ? `/ ${meta} livros` : n.total === 1 ? "livro" : "livros"}
          </span>
        </p>
        {meta ? (
          <>
            <div
              className="mt-6 h-[6px] overflow-hidden rounded-full bg-creme/20"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={meta}
              aria-valuenow={n.total}
              aria-label="progresso da meta"
            >
              <span
                className="block h-full rounded-full bg-creme"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="font-maquina text-[13px]">
                {pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
              </span>
              <span className="text-[13px] text-rosa-claro">
                {n.faltam
                  ? `mais ${plural(n.faltam, "livro", "livros")} para a meta · cerca de ${n.porSemana.toLocaleString("pt-BR")} por semana`
                  : "meta batida! tudo agora é bônus."}
              </span>
            </div>
          </>
        ) : atual ? (
          <p className="mt-5 max-w-[360px] text-[13px] text-rosa-claro">
            sem meta este ano. defina um número e acompanhe o ritmo por aqui.
          </p>
        ) : (
          <p className="mt-5 text-[13px] text-rosa-claro">
            terminados entre janeiro e dezembro de {n.ano}.
          </p>
        )}
      </div>

      {/* os indicadores: direto no papel, só fios e números */}
      <dl className="grid grid-cols-3 lg:grid-cols-1 lg:content-center">
        {indicadores.map((x, i) => (
          <div
            key={x.rotulo}
            className={`flex flex-col-reverse justify-end gap-1.5 py-1 lg:py-4 ${i ? "border-l border-linha pl-4 lg:border-t lg:border-l-0 lg:pl-0" : ""} lg:border-fio`}
          >
            <dt className="text-[10px] font-semibold tracking-[.12em] text-cinza uppercase">
              {x.rotulo}
            </dt>
            <dd>
              <span className="block font-display text-[30px] leading-none font-semibold italic text-ameixa tabular-nums lg:font-revista lg:text-[44px] lg:font-normal">
                {x.valor}
              </span>
              {x.nota ? (
                <span className="mt-1 block text-[10px] leading-tight text-cinza">
                  {x.nota}
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ───────── 02 · mês em revista ─────────

function MesEmRevista({ livros, ano }: { livros: LivroSalvo[]; ano: number }) {
  // aparece do penúltimo dia do mês até o dia 5 do seguinte (ver mesDoReview)
  const aberto = mesDoReview();
  if (!aberto || aberto.ano !== ano) return null;
  const chave = `${aberto.ano}-${String(aberto.mes + 1).padStart(2, "0")}`;
  const doMes = livros.filter(
    (l) => l.status === "lido" && l.lidoEm?.startsWith(chave),
  );
  const comPaginas = doMes.filter((l) => l.paginas);
  const paginas = comPaginas.reduce((t, l) => t + (l.paginas ?? 0), 0);
  const notas = doMes.map((l) => l.nota).filter((x): x is number => !!x);
  const media = notas.length ? notas.reduce((t, x) => t + x, 0) / notas.length : null;
  const favorito = [...doMes].sort(
    (a, b) =>
      (b.nota ?? 0) - (a.nota ?? 0) ||
      (b.lidoEm ?? "").localeCompare(a.lidoEm ?? ""),
  )[0];
  const nome = MESES[aberto.mes];
  return (
    <article className="inverso relative overflow-hidden rounded-[20px] bg-ameixa text-creme lg:rounded-[6px]">
      <div className="grid gap-6 px-6 pt-5 pb-6 sm:grid-cols-[1fr_auto] lg:px-10 lg:pt-7 lg:pb-9">
        <div className="min-w-0">
          {/* o "cabeço" da revista */}
          <p className="flex items-center justify-between gap-3 border-b border-creme/20 pb-2.5 font-maquina text-[10px] tracking-[.14em] text-rosa-claro uppercase">
            <span>the bookside · edição {aberto.mes + 1}</span>
            <span>{aberto.ano}</span>
          </p>
          <h3 className="mt-4 font-display text-[44px] leading-[.95] font-semibold italic lg:font-revista lg:text-[72px] lg:font-normal">
            {nome}
            <span className="block text-[22px] text-rosa-claro lg:text-[30px]">
              em revista
            </span>
          </h3>
          {doMes.length ? (
            <p className="mt-4 font-maquina text-[12px] tracking-[.04em] text-creme/90">
              {plural(doMes.length, "livro", "livros")}
              {paginas ? ` · ${numero(paginas)} páginas` : ""}
              {media !== null ? ` · ${nota1(media)} estrelas` : ""}
            </p>
          ) : (
            <p className="mt-4 text-[13px] text-rosa-claro">
              nenhum livro terminado em {nome} ainda. termine um e ele vira capa.
            </p>
          )}
          {doMes.length ? (
            <Link
              href={`/story?tipo=mes&mes=${chave}`}
              className="mt-6 inline-flex h-11 items-center rounded-pill bg-creme px-5 text-[13px] font-semibold text-ameixa hover:bg-rosa-claro"
            >
              ver e compartilhar no story →
            </Link>
          ) : null}
        </div>
        {favorito ? (
          <Link
            href={`/livro/${favorito.id}`}
            className="group flex flex-col items-center self-center sm:w-[150px] lg:w-[190px]"
          >
            {capaDe(
              favorito,
              "w-[130px] rotate-[3deg] shadow-[0_22px_40px_-18px_rgba(0,0,0,.6)] transition-transform group-hover:rotate-0 lg:w-[170px]",
            )}
            <span className="mt-3 font-maquina text-[9px] tracking-[.14em] text-rosa-claro uppercase">
              favorito do mês
            </span>
            <span className="mt-0.5 line-clamp-2 text-center font-display text-[15px] leading-tight italic lg:font-revista">
              {favorito.titulo}
            </span>
          </Link>
        ) : null}
      </div>
    </article>
  );
}

// ───────── 03 · dias entre páginas ─────────

function DiasEntrePaginas({ livros }: { livros: LivroSalvo[] }) {
  const hoje = new Date();
  const dias = useMemo(() => diasDoMes(livros), [livros]);
  const faixa = useRef<HTMLUListElement>(null);
  // começa mostrando os dias mais recentes
  useEffect(() => {
    const el = faixa.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [dias.length]);
  const comLeitura = dias.filter((d) => d.livros.length).length;
  const mes = MESES[hoje.getMonth()];
  return (
    <Secao
      n="03"
      titulo="dias entre páginas"
      acao={
        <Link href="/numeros/calendario" className={linkAcao}>
          ver calendário completo ›
        </Link>
      }
    >
      <p className="-mt-2 mb-4 text-[13px] text-cinza lg:-mt-3">
        {comLeitura
          ? `${plural(comLeitura, "dia", "dias")} com livro aberto em ${mes}`
          : `nenhum dia de leitura marcado em ${mes} ainda`}
      </p>
      <ul
        ref={faixa}
        className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:thin] lg:mx-0 lg:px-0"
        aria-label={`dias de leitura em ${mes}`}
      >
        {dias.map((d) => {
          const l = d.livros[0];
          const mais = d.livros.length - 1;
          const eHoje = d.data.getDate() === hoje.getDate();
          return (
            <li key={d.chave} className="w-[46px] flex-none snap-end lg:w-[54px]">
              {l ? (
                <Link
                  href={`/livro/${l.id}`}
                  className="relative block"
                  aria-label={`dia ${d.data.getDate()}: ${d.livros.map((x) => x.titulo).join(", ")}`}
                >
                  {capaDe(l, "w-full [&>span:last-child]:hidden")}
                  {mais > 0 ? (
                    <span className="absolute -top-1.5 -right-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-ameixa px-1 text-[9px] font-bold text-creme ring-2 ring-creme">
                      +{mais}
                    </span>
                  ) : null}
                </Link>
              ) : (
                <span
                  aria-label={`dia ${d.data.getDate()}: sem leitura`}
                  className="block aspect-[2/3] rounded-[2px_4px_4px_2px] border border-dashed border-linha"
                />
              )}
              <span
                className={`mt-1.5 block text-center font-maquina text-[10px] ${eHoje ? "text-bordo" : "text-cinza"}`}
              >
                {d.data.getDate()}
                {d.terminou ? <span className="text-bordo"> ✓</span> : null}
              </span>
            </li>
          );
        })}
      </ul>
    </Secao>
  );
}

// ───────── 04 · o ritmo ─────────

function Ritmo({ n }: { n: Numeros }) {
  // o ano todo no gráfico (os meses que ainda não chegaram ficam vazios)
  const meses = MESES.map((mes, i) => ({
    mes,
    livros: n.porMes[i]?.livros ?? 0,
    futuro: i >= n.porMes.length,
  }));
  const max = Math.max(1, ...meses.map((m) => m.livros));
  const forte = n.maisForte;
  const alto = 132;
  return (
    <Secao n="04" titulo="o ritmo das suas leituras">
      <div className="grid gap-6 lg:grid-cols-[2.2fr_1fr] lg:items-end lg:gap-12">
        <figure>
          <div
            className="relative flex items-end gap-[6px] border-b border-ameixa/40 lg:gap-2"
            style={{ height: alto + 18 }}
            role="img"
            aria-label={`livros por mês: ${meses
              .filter((m) => !m.futuro)
              .map((m) => `${m.mes} ${m.livros}`)
              .join(", ")}`}
          >
            {/* uma linha de grade só, na metade */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-linha"
              style={{ bottom: alto / 2 }}
            />
            {meses.map((m) => {
              const destaque = forte && m.mes === forte.mes;
              return (
                <span key={m.mes} className="relative flex h-full flex-1 flex-col items-center justify-end">
                  <span
                    aria-hidden
                    className={`mb-1 font-maquina text-[10px] leading-none tabular-nums ${
                      m.livros ? (destaque ? "text-bordo" : "text-cinza") : "text-transparent"
                    }`}
                  >
                    {m.livros}
                  </span>
                  <i
                    className="block w-full max-w-[34px] rounded-t-[2px]"
                    style={{
                      height: m.livros ? Math.max(6, (m.livros / max) * alto) : 2,
                      background: m.futuro
                        ? "transparent"
                        : !m.livros
                          ? "var(--color-linha)"
                          : destaque
                            ? "var(--color-bordo)"
                            : "color-mix(in srgb, var(--color-rosa-antigo) 55%, transparent)",
                    }}
                  />
                </span>
              );
            })}
          </div>
          <div aria-hidden className="mt-2 flex gap-[6px] lg:gap-2">
            {meses.map((m) => (
              <span
                key={m.mes}
                className={`flex-1 text-center text-[9px] font-semibold uppercase lg:text-[10px] ${
                  forte && m.mes === forte.mes ? "text-bordo" : "text-cinza"
                }`}
              >
                <span className="lg:hidden">{m.mes[0]}</span>
                <span className="hidden lg:inline">{m.mes.slice(0, 3)}</span>
              </span>
            ))}
          </div>
        </figure>
        {forte ? (
          <div className="border-l-2 border-bordo pl-5 lg:pb-6">
            <p className="text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
              seu mês mais forte
            </p>
            <p className="mt-1 font-display text-[40px] leading-none font-semibold italic text-bordo lg:font-revista lg:text-[54px] lg:font-normal">
              {forte.mes}
            </p>
            <p className="mt-2 font-maquina text-[12px] text-ameixa">
              {plural(forte.livros, "livro lido", "livros lidos")}
            </p>
            <p className="mt-2 font-accent text-[14px] italic text-cinza">
              seu mês mais literário do ano.
            </p>
          </div>
        ) : null}
      </div>
    </Secao>
  );
}

// ───────── 05 · leituras que marcaram ─────────

function ItemDestaque({ d, grande }: { d: Destaque; grande?: boolean }) {
  const [abertos, setAbertos] = useState(false);
  const [l, ...empates] = d.livros;
  return (
    <li className={`flex flex-col ${grande ? "col-span-2 sm:col-span-1" : ""}`}>
      <p className="mb-2.5 text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
        {d.rotulo}
      </p>
      <Link href={`/livro/${l.id}`} className="group block">
        <div className="relative w-fit">
          {capaDe(
            l,
            `${grande ? "w-[150px] lg:w-[178px]" : "w-[118px] lg:w-[150px]"} shadow-[0_18px_30px_-18px_rgba(43,20,32,.55)] transition-transform group-hover:-translate-y-1 [&>span:last-child]:text-[11px]`,
          )}
        </div>
        <p className="mt-3 font-display text-[22px] leading-none font-semibold text-bordo italic lg:font-revista lg:text-[26px] lg:font-normal">
          {d.valor}
        </p>
        <p className="mt-1.5 line-clamp-2 font-display text-[15px] leading-tight font-semibold italic text-ameixa lg:font-revista lg:text-[17px] lg:font-normal">
          {l.titulo}
        </p>
      </Link>
      <Link
        href={linkDaAutoria(l.autor)}
        className="mt-0.5 truncate text-[12px] text-cinza hover:text-bordo"
      >
        {l.autor}
      </Link>
      {empates.length ? (
        <>
          <button
            type="button"
            aria-expanded={abertos}
            onClick={() => setAbertos((v) => !v)}
            className="mt-2 w-fit text-[11px] font-semibold text-bordo underline-offset-4 hover:underline"
          >
            {abertos
              ? "esconder empates"
              : `empatado com mais ${empates.length}`}
          </button>
          {abertos ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {empates.map((e) => (
                <li key={e.id} className="w-[40px]">
                  <Link href={`/livro/${e.id}`} title={e.titulo}>
                    {capaDe(e, "w-full [&>span:last-child]:hidden")}
                    <span className="sr-only">{e.titulo}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      ) : null}
    </li>
  );
}

function Marcaram({ lidos }: { lidos: LivroSalvo[] }) {
  const destaques = destaquesDoAno(lidos);
  return (
    <Secao n="05" titulo="leituras que marcaram seu ano">
      {destaques.length ? (
        <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-4 lg:gap-x-10">
          {destaques.map((d) => (
            <ItemDestaque key={d.id} d={d} />
          ))}
        </ul>
      ) : (
        <p className="font-accent text-sm italic text-cinza">
          dê notas e marque quando começou e terminou cada livro — os destaques do
          ano aparecem aqui.
        </p>
      )}
      {destaques.length && !destaques.some((d) => d.id === "rapida") ? (
        <p className="mt-5 text-[12px] text-cinza">
          a mais rápida e a mais longa aparecem quando os livros têm data de
          início e de fim.
        </p>
      ) : null}
    </Secao>
  );
}

// ───────── 06 · entre os meses ─────────

function LinhaMes({ rotulo, l }: { rotulo: string; l: LivroSalvo }) {
  return (
    <Link href={`/livro/${l.id}`} className="group flex items-center gap-3">
      {capaDe(l, "w-[40px] [&>span:last-child]:hidden")}
      <span className="min-w-0">
        <span className="block text-[9px] font-semibold tracking-[.14em] text-cinza uppercase">
          {rotulo}
        </span>
        <span className="mt-0.5 line-clamp-2 font-display text-[14px] leading-tight font-semibold italic text-ameixa group-hover:text-bordo lg:font-revista lg:font-normal">
          {l.titulo}
        </span>
        {l.nota ? (
          <span className="font-maquina text-[10px] text-bordo">{nota1(l.nota)} ★</span>
        ) : null}
      </span>
    </Link>
  );
}

function CartaoMes({ m }: { m: MesDoAno }) {
  return (
    <li className="w-[220px] flex-none snap-start border-l border-linha pr-2 pl-5 first:border-l-0 first:pl-0 lg:w-[250px] lg:border-fio">
      <p className="flex items-baseline justify-between gap-2">
        <span className="font-display text-[24px] leading-none font-semibold italic text-bordo lg:font-revista lg:text-[28px] lg:font-normal">
          {m.mes}
        </span>
        <span className="font-maquina text-[10px] text-cinza">
          {plural(m.total, "livro", "livros")}
        </span>
      </p>
      <div className="mt-4 space-y-3.5">
        {m.melhor ? (
          <LinhaMes rotulo={m.pior ? "mais amado" : "o destaque"} l={m.melhor} />
        ) : (
          <>
            <ul className="flex gap-1.5">
              {m.livros.slice(0, 4).map((l) => (
                <li key={l.id} className="w-[36px]">
                  <Link href={`/livro/${l.id}`}>
                    {capaDe(l, "w-full [&>span:last-child]:hidden")}
                    <span className="sr-only">{l.titulo}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-cinza">sem notas neste mês</p>
          </>
        )}
        {m.pior ? <LinhaMes rotulo="menos amado" l={m.pior} /> : null}
      </div>
    </li>
  );
}

function EntreOsMeses({ lidos }: { lidos: LivroSalvo[] }) {
  const meses = mesesDoAno(lidos);
  const faixa = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = faixa.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [meses.length]);
  const andar = (dir: number) =>
    faixa.current?.scrollBy({ left: dir * 260, behavior: "smooth" });
  if (!meses.length) return null;
  return (
    <Secao
      n="06"
      titulo="entre os meses"
      acao={
        meses.length > 1 ? (
          <span className="flex gap-1">
            {[
              { d: -1, r: "meses anteriores", s: "‹" },
              { d: 1, r: "próximos meses", s: "›" },
            ].map((b) => (
              <button
                key={b.d}
                type="button"
                aria-label={b.r}
                onClick={() => andar(b.d)}
                className="flex size-9 items-center justify-center rounded-full border border-bege text-bordo hover:border-bordo"
              >
                {b.s}
              </button>
            ))}
          </span>
        ) : undefined
      }
    >
      <ul
        ref={faixa}
        className="-mx-4 flex snap-x gap-0 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] lg:mx-0 lg:px-0"
      >
        {meses.map((m) => (
          <CartaoMes key={m.mes} m={m} />
        ))}
      </ul>
    </Secao>
  );
}

// ───────── 07 · seu jeito de ler ─────────

function Formatos({ n }: { n: Numeros }) {
  const f = formatosComParte(n);
  return (
    <div>
      <h4 className="mb-4 text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
        papel, tela ou ouvidos
      </h4>
      {!f.marcados ? (
        <p className="font-accent text-sm italic text-cinza">
          marque na página de cada livro se foi físico, e-book ou audiolivro — e
          descubra de que time você é.
        </p>
      ) : (
        <>
          <ul className="space-y-4">
            {f.lista.map((x) => (
              <li key={x.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-[19px] font-semibold italic text-ameixa lg:font-revista lg:text-[21px] lg:font-normal">
                    {x.nome}
                  </span>
                  <span className="font-maquina text-[12px] text-bordo tabular-nums">
                    {Math.round(x.parte * 100)}%
                  </span>
                </div>
                <div className="mt-1.5 h-[5px] overflow-hidden rounded-full bg-linha/70">
                  <span
                    className="block h-full rounded-full bg-bordo"
                    style={{ width: `${x.parte * 100}%`, opacity: x.qtd ? 1 : 0 }}
                  />
                </div>
                <p className="mt-1.5 text-[12px] text-cinza">
                  {x.qtd ? (
                    <>
                      {plural(x.qtd, "livro", "livros")}
                      {x.paginas && x.paginasConhecidas
                        ? ` · ${numero(x.paginas)} págs.`
                        : ""}
                      {x.media !== null ? ` · ${nota1(x.media)} ★` : ""}
                      {x.id === "audio" && x.paginas
                        ? ` · cerca de ${plural(horasEstimadas(x.paginas), "hora", "horas")} de audição (estimativa)`
                        : ""}
                    </>
                  ) : (
                    "nenhum este ano"
                  )}
                </p>
              </li>
            ))}
          </ul>
          {f.semFormato ? (
            <p className="mt-4 text-[11px] text-cinza">
              {plural(f.semFormato, "livro ficou", "livros ficaram")} sem formato
              marcado e não entram nessa conta.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

function Mundo({ lidos }: { lidos: LivroSalvo[] }) {
  const chave = [...new Set(lidos.map((l) => l.autor))].sort().join("|");
  const [paises, setPaises] = useState<Record<string, Pais | null> | null>(null);
  useEffect(() => {
    let vivo = true;
    setPaises(null);
    paisesDasAutoras(chave ? chave.split("|") : [])
      .then((c) => vivo && setPaises({ ...c }))
      .catch(() => vivo && setPaises({}));
    return () => {
      vivo = false;
    };
  }, [chave]);
  const conta = new Map<string, { pais: Pais; qtd: number }>();
  for (const l of lidos) {
    const p = paises?.[l.autor.toLowerCase()];
    if (!p) continue;
    const x = conta.get(p.nome) ?? { pais: p, qtd: 0 };
    x.qtd++;
    conta.set(p.nome, x);
  }
  const lista = [...conta.values()].sort((a, b) => b.qtd - a.qtd);
  const total = lista.reduce((t, x) => t + x.qtd, 0);
  return (
    <div>
      <h4 className="mb-4 text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
        um mundo entre páginas
      </h4>
      {paises === null ? (
        <div aria-hidden className="aspect-[800/380] animate-pulse rounded-[10px] bg-linha/50" />
      ) : !lista.length ? (
        <p className="font-accent text-sm italic text-cinza">
          ainda não achamos de onde são as autoras desses livros.
        </p>
      ) : (
        <>
          <MapaPaises lista={lista} />
          <ol className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5">
            {lista.slice(0, 6).map(({ pais, qtd }) => (
              <li
                key={pais.nome}
                className="flex items-baseline justify-between gap-2 border-b border-linha py-1 text-[13px] lg:border-fio"
              >
                <span className="truncate">
                  <span aria-hidden>{bandeira(pais.codigo)}</span> {pais.nome}
                </span>
                <span className="font-maquina text-[11px] text-cinza tabular-nums">
                  {Math.round((qtd / total) * 100)}%
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[10px] text-cinza">
            {plural(lista.length, "país", "países")} · pela nacionalidade das
            autoras · fonte: Wikidata
          </p>
        </>
      )}
    </div>
  );
}

// ───────── 08 · identidade ─────────

function Identidade({ n }: { n: Numeros }) {
  const generos = n.generos.filter((g) => g.nome !== "sem gênero").slice(0, 3);
  const maxG = Math.max(1, ...generos.map((g) => g.qtd));
  return (
    <Secao n="08" titulo="sua identidade literária">
      <div className="grid gap-8 sm:grid-cols-2 lg:gap-12">
        <div>
          <h4 className="mb-3 text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
            os gêneros que mais leu
          </h4>
          {generos.length ? (
            <ol className="space-y-2.5">
              {generos.map((g, i) => (
                <li key={g.nome} className="flex items-center gap-3">
                  <span className="w-5 font-maquina text-[11px] text-rosa-antigo">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-display text-[18px] font-semibold italic text-ameixa lg:font-revista lg:font-normal">
                        {g.nome}
                      </span>
                      <span className="font-maquina text-[11px] text-cinza">{g.qtd}</span>
                    </span>
                    <span className="mt-1 block h-[3px] rounded-full bg-linha/70">
                      <span
                        className="block h-full rounded-full bg-rosa-antigo"
                        style={{ width: `${(g.qtd / maxG) * 100}%` }}
                      />
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="font-accent text-sm italic text-cinza">
              os gêneros aparecem quando os livros têm gênero no catálogo.
            </p>
          )}
          <Link href="/numeros/generos" className={`${linkAcao} mt-4 inline-block`}>
            ver todos os gêneros ›
          </Link>
        </div>
        <div>
          <h4 className="mb-3 text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
            as autoras que mais leu
          </h4>
          {n.autores.length ? (
            <ol className="space-y-2.5">
              {n.autores.map((a, i) => (
                <li key={a.nome} className="flex items-baseline gap-3 border-b border-linha pb-2 lg:border-fio">
                  <span className="w-5 font-maquina text-[11px] text-rosa-antigo">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <Link
                    href={linkDaAutoria(a.nome)}
                    className="min-w-0 flex-1 truncate font-display text-[18px] font-semibold italic text-ameixa hover:text-bordo lg:font-revista lg:font-normal"
                  >
                    {a.nome}
                  </Link>
                  <span className="flex-none font-maquina text-[11px] text-cinza">
                    {plural(a.qtd, "livro", "livros")}
                    {a.media !== null ? ` · ${nota1(a.media)} ★` : ""}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
          <Link href="/numeros/generos" className={`${linkAcao} mt-4 inline-block`}>
            ver a análise completa ›
          </Link>
        </div>
      </div>
    </Secao>
  );
}

// ───────── a página ─────────

export function JornadaNoPerfil() {
  const livros = usePerfil((s) => s.livros);
  const meta = usePerfil((s) => s.meta);
  const anoAtual = new Date().getFullYear();
  const anos = useMemo(() => anosComLeitura(livros), [livros]);
  const [ano, setAno] = useState(anoAtual);
  const n = useMemo(() => calcularNumeros(livros, meta, ano), [livros, meta, ano]);
  const atual = ano === anoAtual;
  const semData = livros.filter((l) => l.status === "lido" && !l.lidoEm).length;

  return (
    <div className="space-y-9 pb-6 [counter-reset:secao] lg:space-y-14">
      <Cabecalho anos={anos} ano={ano} onAno={setAno} />

      <section aria-label="seu ano em números" className="space-y-5">
        <AnoEmNumeros n={n} atual={atual} />
      </section>

      <MesEmRevista livros={livros} ano={ano} />

      {atual ? <DiasEntrePaginas livros={livros} /> : null}

      {n.total ? (
        <>
          <Ritmo n={n} />
          <Marcaram lidos={n.lidos} />
          <EntreOsMeses lidos={n.lidos} />
          <Secao n="07" titulo="seu jeito de ler">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-14">
              <Formatos n={n} />
              <Mundo lidos={n.lidos} />
            </div>
          </Secao>
          <Identidade n={n} />
        </>
      ) : (
        <div className="border-t border-linha pt-8 text-center lg:border-fio">
          <p className="font-display text-[24px] font-semibold italic text-ameixa lg:font-revista lg:font-normal">
            {atual ? "a jornada deste ano começa no primeiro livro" : `nenhum livro terminado em ${ano}`}
          </p>
          <p className="mx-auto mt-2 max-w-[420px] text-[13px] text-cinza">
            quando você marca um livro como lido, com a data, ele entra aqui: ritmo,
            destaques, formatos e de onde vêm as autoras.
          </p>
          {atual ? (
            <Link
              href="/buscar"
              className="mt-5 inline-flex h-11 items-center rounded-pill bg-bordo px-6 text-[13px] font-semibold text-creme"
            >
              adicionar um livro
            </Link>
          ) : null}
        </div>
      )}

      {semData ? (
        <p className="border-t border-linha pt-4 text-[11px] text-cinza lg:border-fio">
          {plural(semData, "livro lido está", "livros lidos estão")} sem data e
          não entra{semData === 1 ? "" : "m"} nos números por ano.{" "}
          <Link href="/estantes/lidos" className="font-semibold text-bordo underline underline-offset-2">
            colocar datas
          </Link>
        </p>
      ) : null}
    </div>
  );
}
