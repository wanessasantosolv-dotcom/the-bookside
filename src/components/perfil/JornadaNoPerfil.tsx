"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { MapaPaises } from "@/components/numeros/MapaPaises";
import { linkDaAutoria } from "@/lib/autores";
import { corDoLivro } from "@/lib/cores";
import {
  anosComLeitura,
  autoresDoLivro,
  destaquesDoAno,
  diversidadeDeAutoria,
  generosDoAno,
  rankingDeAutores,
  rotuloAutoria,
  diasDeLeituraNoAno,
  type CategoriaAutoria,
  type GeneroDoAno,
  diasDoMes,
  formatosComParte,
  horasEstimadas,
  mesesDoAno,
  MESES,
  type Destaque,
  type MesDoAno,
} from "@/lib/jornada";
import {
  generosDasAutoras,
  paisesDasAutoras,
  type GeneroAutoria,
  type Pais,
} from "@/lib/nacionalidade";
import { calcularNumeros, mesDoReview, type Numeros } from "@/lib/numeros";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";

/*
 * A Jornada: uma retrospectiva literária numa página só, em estilo de
 * revista. Dois blocos com fundo (a meta e o mês em revista); o resto fica
 * direto sobre o papel do app, separado por fios finos, números e capas.
 */

const numero = (n: number) => n.toLocaleString("pt-BR");
const nota1 = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const plural = (n: number, um: string, varios: string) =>
  `${numero(n)} ${n === 1 ? um : varios}`;
const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** uma seção sobre o papel: fio em cima, título e (às vezes) uma ação à direita */
function Secao({
  titulo,
  acao,
  children,
}: {
  titulo: string;
  acao?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-linha pt-5 lg:border-fio lg:pt-6">
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-[20px] leading-tight font-semibold italic text-ameixa lg:font-revista lg:text-[24px] lg:font-normal">
          {titulo}
        </h3>
        {acao}
      </header>
      {children}
    </section>
  );
}

const linkAcao =
  "flex-none text-[12px] font-semibold text-cinza hover:text-bordo";
const rotulo =
  "text-[10px] font-semibold tracking-[.14em] text-cinza uppercase";

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
    <header className="flex items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
          jornada de leitura
        </p>
        <h2 className="mt-1 font-display text-[30px] leading-[1.05] font-semibold text-bordo lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
          Um ano entre páginas.
        </h2>
        <p className="mt-1 font-accent text-[14px] italic text-cinza">
          sua trajetória, hábitos e descobertas literárias em um só lugar.
        </p>
      </div>
      <label className="relative flex-none">
        <span className="sr-only">ano da jornada</span>
        <select
          value={ano}
          onChange={(e) => onAno(Number(e.target.value))}
          disabled={anos.length < 2}
          className="h-11 appearance-none rounded-[10px] border border-linha bg-creme-quente pr-9 pl-3.5 font-maquina text-[13px] text-ameixa outline-none focus:border-bordo disabled:opacity-100 lg:border-fio"
        >
          {anos.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        {anos.length > 1 ? (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-cinza"
          >
            ▾
          </span>
        ) : null}
      </label>
    </header>
  );
}

// ───────── seu ano em números ─────────

function AnoEmNumeros({ n, atual, dias }: { n: Numeros; atual: boolean; dias: number }) {
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
    {
      valor: dias ? numero(dias) : "—",
      rotulo: "dias de leitura",
      nota: !dias && n.total ? "marque quando começou cada livro" : undefined,
    },
  ];
  return (
    <div className="grid gap-3 lg:grid-cols-[1.45fr_1fr] lg:gap-4">
      {/* a meta: o bloco de maior peso da página */}
      <div className="inverso flex flex-col justify-between rounded-[14px] bg-bordo px-5 py-5 text-creme lg:rounded-[10px] lg:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold tracking-[.18em] text-rosa-claro uppercase">
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
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <p className="flex items-baseline gap-1.5">
            <b className="font-display text-[44px] leading-none font-semibold tabular-nums lg:font-revista lg:text-[52px] lg:font-normal">
              {n.total}
            </b>
            <span className="text-[14px] text-rosa-claro">
              {meta ? `/ ${meta} livros` : n.total === 1 ? "livro" : "livros"}
            </span>
          </p>
          {meta ? (
            <span className="font-display text-[22px] font-semibold tabular-nums lg:font-revista lg:font-normal">
              {pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
            </span>
          ) : null}
        </div>
        {meta ? (
          <>
            <div
              className="mt-3 h-[5px] overflow-hidden rounded-full bg-creme/25"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={meta}
              aria-valuenow={n.total}
              aria-label="progresso da meta"
            >
              <span className="block h-full rounded-full bg-rosa-claro" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-3 text-[12px] text-rosa-claro">
              {n.faltam
                ? `mais ${plural(n.faltam, "livro", "livros")} para a sua meta · cerca de ${n.porSemana.toLocaleString("pt-BR")} por semana.`
                : "meta batida! tudo agora é bônus."}
            </p>
          </>
        ) : (
          <p className="mt-3 text-[12px] text-rosa-claro">
            {atual
              ? "sem meta este ano. defina um número e acompanhe o ritmo por aqui."
              : `terminados entre janeiro e dezembro de ${n.ano}.`}
          </p>
        )}
      </div>

      {/* os indicadores: uma lista fina, número à esquerda e nome à direita */}
      <dl className="rounded-[14px] border border-linha px-4 lg:rounded-[10px] lg:border-fio">
        {indicadores.map((x, i) => (
          <div
            key={x.rotulo}
            className={`flex items-center justify-between gap-3 py-3.5 ${i ? "border-t border-linha lg:border-fio" : ""}`}
          >
            <dd className="font-display text-[22px] leading-none font-semibold text-ameixa tabular-nums lg:font-revista lg:text-[24px] lg:font-normal">
              {x.valor}
            </dd>
            <dt className="text-right text-[12px] text-cinza">
              {x.rotulo}
              {x.nota ? <span className="block text-[10px]">{x.nota}</span> : null}
            </dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ───────── mês em revista ─────────

function MesEmRevista({ livros, ano }: { livros: LivroSalvo[]; ano: number }) {
  // aparece do penúltimo dia do mês até o dia 5 do seguinte (ver mesDoReview)
  const aberto = mesDoReview();
  if (!aberto || aberto.ano !== ano) return null;
  const chave = `${aberto.ano}-${String(aberto.mes + 1).padStart(2, "0")}`;
  const doMes = livros
    .filter((l) => l.status === "lido" && l.lidoEm?.startsWith(chave))
    .sort(
      (a, b) =>
        (b.nota ?? 0) - (a.nota ?? 0) ||
        (b.lidoEm ?? "").localeCompare(a.lidoEm ?? ""),
    );
  const paginas = doMes.reduce((t, l) => t + (l.paginas ?? 0), 0);
  const nome = MESES[aberto.mes];
  // as capas empilhadas: o favorito na frente
  const capas = doMes.slice(0, 3).reverse();
  return (
    <article className="inverso relative overflow-hidden rounded-[14px] bg-bordo text-creme lg:rounded-[10px]">
      <div className="flex items-center gap-5 px-5 py-5 lg:px-7 lg:py-6">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[.18em] text-creme uppercase">
            the bookside journal
          </p>
          <p className="mt-0.5 font-maquina text-[10px] tracking-[.1em] text-rosa-claro uppercase">
            vol. {aberto.mes + 1} / {aberto.ano}
          </p>
          <h3 className="mt-3 font-display text-[30px] leading-[1.02] font-semibold lg:font-revista lg:text-[40px] lg:font-normal">
            {maiuscula(nome)}
            <br />
            em revista.
          </h3>
          <p className="mt-2 text-[13px] leading-snug text-rosa-claro">
            {doMes.length ? (
              <>
                {plural(doMes.length, "história", "histórias")}
                {paginas ? `. ${numero(paginas)} páginas.` : "."}
                <br />
                um mês inteiro de descobertas.
              </>
            ) : (
              `nenhum livro terminado em ${nome} ainda — termine um e ele vira capa.`
            )}
          </p>
          {doMes.length ? (
            <Link
              href={`/story?tipo=mes&mes=${chave}`}
              className="mt-4 inline-flex min-h-10 items-center text-[11px] font-bold tracking-[.14em] text-creme uppercase hover:underline"
            >
              abrir edição →
            </Link>
          ) : null}
        </div>
        {capas.length ? (
          <div aria-hidden className="relative h-[132px] w-[110px] flex-none lg:h-[168px] lg:w-[150px]">
            {capas.map((l, i) => {
              const frente = i === capas.length - 1;
              return (
                <div
                  key={l.id}
                  className="absolute bottom-0"
                  style={{
                    left: `${(capas.length - 1 - i) * -14 + 26}%`,
                    transform: `rotate(${frente ? 3 : -6 + i * 4}deg)`,
                    zIndex: i,
                  }}
                >
                  {capaDe(
                    l,
                    `${frente ? "w-[78px] lg:w-[104px]" : "w-[66px] lg:w-[88px]"} shadow-[0_14px_24px_-12px_rgba(0,0,0,.55)] [&>span:last-child]:hidden`,
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </article>
  );
}

// ───────── dias entre páginas ─────────

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
      titulo="dias entre páginas"
      acao={
        <Link href="/numeros/calendario" className={linkAcao}>
          ver calendário ›
        </Link>
      }
    >
      <ul
        ref={faixa}
        className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] lg:mx-0 lg:gap-3 lg:px-0"
        aria-label={`dias de leitura em ${mes}`}
      >
        {dias.map((d) => {
          const l = d.livros[0];
          const mais = d.livros.length - 1;
          const eHoje = d.data.getDate() === hoje.getDate();
          return (
            <li key={d.chave} className="w-[64px] flex-none snap-end lg:w-[104px]">
              {l ? (
                <Link
                  href={`/livro/${l.id}`}
                  className="relative block"
                  aria-label={`dia ${d.data.getDate()}: ${d.livros.map((x) => x.titulo).join(", ")}`}
                >
                  {capaDe(l, "w-full !rounded-[8px] [&>span:last-child]:hidden")}
                  {mais > 0 ? (
                    <span className="absolute top-1.5 right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-ameixa/85 px-1 text-[9px] font-bold text-creme">
                      +{mais}
                    </span>
                  ) : null}
                </Link>
              ) : (
                <span
                  aria-label={`dia ${d.data.getDate()}: sem leitura`}
                  className="block aspect-[2/3] rounded-[8px] bg-linha/45"
                />
              )}
              <span
                className={`mt-1.5 block text-center text-[11px] tabular-nums ${eHoje ? "font-semibold text-bordo" : "text-cinza"}`}
              >
                {d.data.getDate()}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[12px] text-cinza">
        {comLeitura
          ? `${plural(comLeitura, "dia", "dias")} com livro aberto em ${mes}.`
          : `nenhum dia de leitura marcado em ${mes} ainda.`}
      </p>
    </Secao>
  );
}

// ───────── o ritmo ─────────

function Ritmo({ n }: { n: Numeros }) {
  // o ano todo no gráfico (os meses que ainda não chegaram ficam vazios)
  const meses = MESES.map((mes, i) => ({
    mes,
    livros: n.porMes[i]?.livros ?? 0,
    futuro: i >= n.porMes.length,
  }));
  const max = Math.max(1, ...meses.map((m) => m.livros));
  const forte = n.maisForte;
  const alto = 150;
  return (
    <Secao titulo="o ritmo das suas leituras">
      <div className="grid gap-6 sm:grid-cols-[1fr_180px] sm:items-end lg:grid-cols-[1fr_220px] lg:gap-10">
        <figure>
          <div
            className="flex items-end gap-[5px] lg:gap-3"
            style={{ height: alto }}
            role="img"
            aria-label={`livros por mês: ${meses
              .filter((m) => !m.futuro)
              .map((m) => `${m.mes} ${m.livros}`)
              .join(", ")}`}
          >
            {meses.map((m) => {
              const destaque = forte && m.mes === forte.mes;
              return (
                <span
                  key={m.mes}
                  className="block flex-1 rounded-t-[3px]"
                  title={m.futuro ? undefined : `${m.mes}: ${m.livros}`}
                  style={{
                    height: m.futuro ? 0 : m.livros ? Math.max(8, (m.livros / max) * alto) : 3,
                    background: !m.livros
                      ? "var(--color-linha)"
                      : destaque
                        ? "var(--color-ameixa)"
                        : "color-mix(in srgb, var(--color-rosa-antigo) 50%, var(--color-creme))",
                  }}
                />
              );
            })}
          </div>
          <div aria-hidden className="mt-2 flex gap-[5px] lg:gap-3">
            {meses.map((m) => (
              <span
                key={m.mes}
                className={`flex-1 text-center text-[9px] uppercase lg:text-[10px] ${
                  forte && m.mes === forte.mes ? "font-semibold text-ameixa" : "text-cinza"
                }`}
              >
                <span className="lg:hidden">{m.mes[0]}</span>
                <span className="hidden lg:inline">{m.mes.slice(0, 3)}</span>
              </span>
            ))}
          </div>
        </figure>
        {forte ? (
          <div className="sm:pb-8">
            <p className={rotulo}>seu mês mais forte</p>
            <p className="mt-1.5 font-display text-[30px] leading-none font-semibold italic text-ameixa lg:font-revista lg:text-[36px] lg:font-normal">
              {maiuscula(forte.mes)}
            </p>
            <p className="mt-1.5 text-[13px] text-tinta-suave">
              {plural(forte.livros, "livro lido", "livros lidos")}
            </p>
            <p className="mt-1 font-accent text-[13px] italic text-cinza">
              seu mês mais literário do ano.
            </p>
          </div>
        ) : null}
      </div>
    </Secao>
  );
}

// ───────── leituras que marcaram ─────────

function ItemDestaque({ d }: { d: Destaque }) {
  const [abertos, setAbertos] = useState(false);
  const [l, ...empates] = d.livros;
  return (
    <li className="flex min-w-0 flex-col">
      <p className="mb-2 text-[12px] text-cinza">{maiuscula(d.rotulo.replace(/^a /, ""))}</p>
      <Link href={`/livro/${l.id}`} className="group block">
        {capaDe(
          l,
          "w-full !rounded-[8px] shadow-[0_14px_26px_-16px_rgba(43,20,32,.5)] transition-transform group-hover:-translate-y-1 [&>span:last-child]:text-[11px]",
        )}
        <p className="mt-3 line-clamp-2 font-display text-[18px] leading-[1.15] font-semibold text-ameixa group-hover:text-bordo lg:font-revista lg:text-[21px] lg:font-normal">
          {l.titulo}
        </p>
      </Link>
      <Link href={linkDaAutoria(l.autor)} className="mt-0.5 truncate text-[12px] text-cinza hover:text-bordo">
        {l.autor}
      </Link>
      <p className="mt-1.5 text-[13px] font-semibold text-bordo tabular-nums">{d.valor}</p>
      {empates.length ? (
        <>
          <button
            type="button"
            aria-expanded={abertos}
            onClick={() => setAbertos((v) => !v)}
            className="mt-2 w-fit text-[11px] font-semibold text-bordo underline-offset-4 hover:underline"
          >
            {abertos ? "esconder empates" : `empatado com mais ${empates.length}`}
          </button>
          {abertos ? (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {empates.map((e) => (
                <li key={e.id} className="w-[38px]">
                  <Link href={`/livro/${e.id}`} title={e.titulo}>
                    {capaDe(e, "w-full !rounded-[4px] [&>span:last-child]:hidden")}
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
    <Secao titulo="histórias que deixaram marcas">
      {destaques.length ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-4 lg:gap-x-6">
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
          a mais rápida e a mais demorada aparecem quando os livros têm data de
          início e de fim.
        </p>
      ) : null}
    </Secao>
  );
}

// ───────── entre os meses ─────────

function LinhaMes({ rotulo, l }: { rotulo: string; l: LivroSalvo }) {
  return (
    <Link href={`/livro/${l.id}`} className="group flex items-center gap-2.5">
      {capaDe(l, "w-[30px] !rounded-[3px] [&>span:last-child]:hidden")}
      <span className="min-w-0">
        <span className="block text-[11px] text-cinza">{rotulo}</span>
        <span className="block truncate text-[13px] font-semibold text-ameixa group-hover:text-bordo">
          {l.titulo}
        </span>
      </span>
      {l.nota ? (
        <span className="ml-auto flex-none text-[11px] text-bordo tabular-nums">{nota1(l.nota)} ★</span>
      ) : null}
    </Link>
  );
}

function CartaoMes({ m }: { m: MesDoAno }) {
  const [aberto, setAberto] = useState(false);
  const outros = m.livros.filter((l) => l !== m.melhor && l !== m.pior);
  return (
    <li className="w-[78%] flex-none snap-start rounded-[12px] border border-linha p-3.5 sm:w-[calc((100%-24px)/3)] lg:rounded-[10px] lg:border-fio">
      <p className="flex items-baseline justify-between gap-2">
        <span className="text-[15px] font-semibold text-ameixa">{maiuscula(m.mes)}</span>
        <span className="text-[11px] text-cinza">{plural(m.total, "livro", "livros")}</span>
      </p>
      <div className="mt-3 space-y-2.5">
        {m.melhor ? (
          <LinhaMes rotulo={m.pior ? "mais amado" : "destaque do mês"} l={m.melhor} />
        ) : (
          <p className="text-[11px] text-cinza">sem notas neste mês</p>
        )}
        {aberto && m.pior ? <LinhaMes rotulo="menos amado" l={m.pior} /> : null}
        {aberto && (outros.length || !m.melhor) ? (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {(m.melhor ? outros : m.livros).map((l) => (
              <li key={l.id} className="w-[30px]">
                <Link href={`/livro/${l.id}`} title={l.titulo}>
                  {capaDe(l, "w-full !rounded-[3px] [&>span:last-child]:hidden")}
                  <span className="sr-only">{l.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {m.pior || outros.length || !m.melhor ? (
        <button
          type="button"
          aria-expanded={aberto}
          onClick={() => setAberto((v) => !v)}
          className="mt-2.5 text-[11px] font-semibold text-bordo hover:underline"
        >
          {aberto ? "mostrar menos" : "ver o mês inteiro"}
        </button>
      ) : null}
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
  const andar = (dir: number) => {
    const el = faixa.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };
  if (!meses.length) return null;
  return (
    <Secao
      titulo="doze meses, muitas histórias"
      acao={
        meses.length > 3 ? (
          <span className="flex items-center gap-1">
            <span className="mr-1 hidden text-[12px] text-cinza sm:inline">explorar meses</span>
            {[
              { d: -1, r: "meses anteriores", s: "‹" },
              { d: 1, r: "próximos meses", s: "›" },
            ].map((b) => (
              <button
                key={b.d}
                type="button"
                aria-label={b.r}
                onClick={() => andar(b.d)}
                className="flex size-8 items-center justify-center rounded-full text-[15px] text-cinza hover:bg-rosa-fundo hover:text-bordo"
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
        className="-mx-4 flex snap-x gap-3 overflow-x-auto scroll-smooth px-4 [scrollbar-width:none] lg:mx-0 lg:px-0"
      >
        {meses.map((m) => (
          <CartaoMes key={m.mes} m={m} />
        ))}
      </ul>
    </Secao>
  );
}

// ───────── seu jeito de ler ─────────

/** fundo suave de cada formato (como fichas coloridas) */
const fundoDoFormato: Record<string, string> = {
  fisico: "color-mix(in srgb, var(--color-rosa-antigo) 16%, var(--color-creme))",
  ebook: "color-mix(in srgb, var(--color-oliva) 15%, var(--color-creme))",
  audio: "color-mix(in srgb, var(--color-rosa-antigo) 12%, var(--color-creme))",
};

function Icone({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg
      aria-hidden
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {d.split(" M").map((p, i) => (
        <path key={i} d={i ? `M${p}` : p} />
      ))}
    </svg>
  );
}

const ICONE_GLOBO =
  "M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18z M3 12h18 M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9 M12 3c-2.5 2.6-3.8 5.6-3.8 9s1.3 6.4 3.8 9";
const ICONE_RELOGIO = "M12 4a8 8 0 1 0 0 16 8 8 0 1 0 0-16z M12 8v4l2.5 2";

function Formatos({ n }: { n: Numeros }) {
  const f = formatosComParte(n);
  if (!f.marcados)
    return (
      <p className="font-accent text-sm italic text-cinza">
        marque na página de cada livro se foi físico, e-book ou audiolivro — e
        descubra de que time você é.
      </p>
    );
  return (
    <div>
      <ul className="space-y-2.5">
        {f.lista.map((x) => (
          <li
            key={x.id}
            className="flex items-center gap-3 rounded-[14px] px-4 py-3.5 lg:rounded-[12px]"
            style={{ background: fundoDoFormato[x.id] }}
          >
            <Icone d={x.icone} className="flex-none text-ameixa" />
            <span className="w-[68px] flex-none font-display text-[17px] font-semibold text-ameixa lg:font-revista lg:font-normal">
              {maiuscula(x.curto)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-tinta-suave">
                <span>{x.qtd ? plural(x.qtd, "livro", "livros") : "nenhum"}</span>
                {x.qtd && x.paginas && x.paginasConhecidas ? (
                  <>
                    <span aria-hidden className="h-4 w-px bg-ameixa/20" />
                    <span>{numero(x.paginas)} pág.</span>
                  </>
                ) : null}
              </span>
              {x.id === "audio" && x.qtd && x.paginas ? (
                <span className="mt-1 flex items-center gap-1 text-[11px] text-cinza">
                  <Icone d={ICONE_RELOGIO} className="!size-3.5" />≈{" "}
                  {numero(horasEstimadas(x.paginas))} h de audição
                  <span className="sr-only"> (estimativa pelas páginas)</span>
                </span>
              ) : null}
            </span>
            {x.media !== null ? (
              <span className="flex-none text-[14px] font-semibold text-ameixa tabular-nums">
                <span aria-hidden className="mr-1 text-rosa-antigo">☆</span>
                {nota1(x.media)}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] text-cinza">
        {f.lista.some((x) => x.id === "audio" && x.qtd)
          ? "as horas de áudio são uma estimativa pelas páginas. "
          : ""}
        {f.semFormato
          ? `${plural(f.semFormato, "livro ficou", "livros ficaram")} sem formato marcado.`
          : ""}
      </p>
    </div>
  );
}

/** cores dos países mais lidos (as mesmas no mapa e na legenda); o resto vai em "outros" */
const CORES_PAISES = [
  "var(--color-ameixa)",
  "color-mix(in srgb, var(--color-bordo) 60%, #c8796a)",
  "color-mix(in srgb, var(--color-oliva) 55%, var(--color-creme))",
  "var(--color-oliva)",
];
const COR_OUTROS = "color-mix(in srgb, var(--color-rosa-antigo) 60%, var(--color-creme))";

/** países e gênero declarado de quem escreveu (Wikidata), buscados uma vez para a seção toda */
function useAutorias(lidos: LivroSalvo[]) {
  const nomes = [...new Set(lidos.flatMap((l) => [l.autor, ...autoresDoLivro(l.autor)]))]
    .sort()
    .join("|");
  const [paises, setPaises] = useState<Record<string, Pais | null> | null>(null);
  const [generos, setGeneros] = useState<Record<string, GeneroAutoria | null> | null>(null);
  useEffect(() => {
    let vivo = true;
    setPaises(null);
    setGeneros(null);
    const lista = nomes ? nomes.split("|") : [];
    paisesDasAutoras(lista)
      .then((c) => vivo && setPaises({ ...c }))
      .catch(() => vivo && setPaises({}))
      // depois dos países (para não disparar pedidos demais de uma vez)
      .then(() => generosDasAutoras(lista))
      .then((g) => vivo && g && setGeneros({ ...g }))
      .catch(() => vivo && setGeneros({}));
    return () => {
      vivo = false;
    };
  }, [nomes]);
  return { paises, generos };
}

function Mundo({
  lidos,
  paises,
}: {
  lidos: LivroSalvo[];
  paises: Record<string, Pais | null> | null;
}) {
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
  const principais = lista.slice(0, CORES_PAISES.length);
  const outros = lista.slice(CORES_PAISES.length);
  const corDe = new Map(principais.map((x, i) => [x.pais.nome, CORES_PAISES[i]]));
  const pct = (q: number) => `${Math.round((q / total) * 100)}%`;
  const legenda = [
    ...principais.map((x) => ({ nome: x.pais.nome, qtd: x.qtd, cor: corDe.get(x.pais.nome)! })),
    ...(outros.length
      ? [{ nome: "outros", qtd: outros.reduce((t, x) => t + x.qtd, 0), cor: COR_OUTROS }]
      : []),
  ];
  return (
    <div className="rounded-[16px] border border-linha px-4 py-4 lg:rounded-[12px] lg:border-fio lg:px-5">
      <h4 className="flex items-center gap-2 font-display text-[17px] font-semibold text-ameixa lg:font-revista lg:font-normal">
        <Icone d={ICONE_GLOBO} className="text-ameixa" />
        de onde vieram suas histórias
      </h4>
      {paises === null ? (
        <div aria-hidden className="mt-3 aspect-[800/380] animate-pulse rounded-[8px] bg-linha/50" />
      ) : !lista.length ? (
        <p className="py-6 text-center font-accent text-sm italic text-cinza">
          ainda não achamos de onde são as autoras desses livros.
        </p>
      ) : (
        <div className="mt-2 grid items-center gap-4 sm:grid-cols-[1fr_auto]">
          <MapaPaises
            lista={lista}
            semMoldura
            corDoPais={(p) => corDe.get(p.nome) ?? COR_OUTROS}
          />
          <ul className="grid min-w-[150px] gap-2 text-[13px]">
            {legenda.map((x) => (
              <li key={x.nome} className="flex items-center gap-2.5">
                <span aria-hidden className="size-2.5 flex-none rounded-full" style={{ background: x.cor }} />
                <span className="min-w-0 flex-1 truncate text-ameixa">{maiuscula(x.nome)}</span>
                <span className="text-tinta-suave tabular-nums">{pct(x.qtd)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {lista.length ? (
        <p className="mt-2 text-[10px] text-cinza">
          {plural(lista.length, "país", "países")} · pela nacionalidade das autoras · fonte: Wikidata
        </p>
      ) : null}
    </div>
  );
}

// ───────── o que você mais leu (gêneros) ─────────

function LinhaGenero({ g }: { g: GeneroDoAno }) {
  const [aberto, setAberto] = useState(false);
  return (
    <li className="border-t border-linha first:border-t-0 lg:border-fio">
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 py-3 text-left"
      >
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-ameixa">{maiuscula(g.nome)}</span>
          <span className="block text-[11px] text-cinza">{plural(g.qtd, "livro", "livros")}</span>
        </span>
        <span className="font-display text-[20px] text-bordo tabular-nums lg:font-revista">
          {Math.round(g.parte * 100)}%
        </span>
        <span aria-hidden className="flex w-[84px] justify-end gap-1">
          {g.livros.slice(0, 3).map((l) => (
            <span key={l.id} className="w-[24px]">
              {capaDe(l, "w-full !rounded-[2px] [&>span:last-child]:hidden")}
            </span>
          ))}
        </span>
      </button>
      {aberto ? (
        <div className="pb-3.5">
          <p className="text-[12px] text-cinza">
            {g.media !== null ? `média ${nota1(g.media)} ★` : "sem notas neste gênero"}
          </p>
          <ul className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {g.livros.map((l) => (
              <li key={l.id} className="w-[46px] flex-none">
                <Link href={`/livro/${l.id}`} title={l.titulo}>
                  {capaDe(l, "w-full !rounded-[4px] [&>span:last-child]:hidden")}
                  <span className="sr-only">{l.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </li>
  );
}

function OQueMaisLeu({ lidos }: { lidos: LivroSalvo[] }) {
  const { lista, semGenero, comGenero } = generosDoAno(lidos);
  const [todos, setTodos] = useState(false);
  return (
    <div>
      <h4 className="font-display text-[18px] font-semibold text-ameixa lg:font-revista lg:text-[20px] lg:font-normal">
        o que você mais leu
      </h4>
      <p className="mt-0.5 text-[12px] text-cinza">toque num gênero para ver os livros.</p>
      {!comGenero ? (
        <p className="mt-4 font-accent text-sm italic text-cinza">
          nenhum livro deste ano tem gênero no catálogo ainda.
        </p>
      ) : (
        <>
          <ul className="mt-2">
            {(todos ? lista : lista.slice(0, 4)).map((g) => (
              <LinhaGenero key={g.nome} g={g} />
            ))}
          </ul>
          {lista.length > 4 ? (
            <button
              type="button"
              aria-expanded={todos}
              onClick={() => setTodos((v) => !v)}
              className="mt-1 text-[12px] font-semibold text-bordo hover:underline"
            >
              {todos ? "mostrar menos" : `ver todos os gêneros (${lista.length})`}
            </button>
          ) : null}
          {semGenero ? (
            <p className="mt-2 text-[11px] text-cinza">
              {plural(semGenero, "livro está", "livros estão")} sem gênero e não entra
              {semGenero === 1 ? "" : "m"} na conta.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

// ───────── seu retrato literário (abertura) ─────────

const nomeFormato: Record<string, string> = {
  fisico: "livros físicos",
  ebook: "e-books",
  audio: "audiolivros",
};

/**
 * O retrato: um título e um parágrafo montados só com o que os dados
 * sustentam (países, gênero principal, autoria e formato), e quatro números.
 */
function Retrato({
  n,
  paises,
  generos,
}: {
  n: Numeros;
  paises: Record<string, Pais | null> | null;
  generos: Record<string, GeneroAutoria | null> | null;
}) {
  const lidos = n.lidos;
  const nPaises = paises
    ? new Set(lidos.map((l) => paises[l.autor.toLowerCase()]?.nome).filter(Boolean)).size
    : null;
  const { lista } = generosDoAno(lidos);
  const principal = lista[0] && (lista.length === 1 || lista[0].qtd > lista[1].qtd) ? lista[0] : null;
  const f = formatosComParte(n);
  const formatoTop = [...f.lista].sort((a, b) => b.qtd - a.qtd)[0];
  const formatoPrincipal =
    f.marcados && formatoTop.qtd && f.lista.filter((x) => x.qtd === formatoTop.qtd).length === 1
      ? formatoTop
      : null;
  const autoria = generos ? diversidadeDeAutoria(lidos, (a) => generos[a.toLowerCase()]) : null;
  const feminina = autoria?.find((x) => x.categoria === "feminina");
  const conhecidas = autoria ? autoria.filter((x) => x.categoria !== "desconhecida").reduce((t, x) => t + x.qtd, 0) : 0;

  const titulo =
    nPaises !== null && nPaises >= 5
      ? "Uma leitora de muitos mundos."
      : principal && principal.parte >= 0.4
        ? `Uma leitora de ${principal.nome}.`
        : lista.length >= 4
          ? "Uma leitora de muitos gêneros."
          : `Seu ano em ${plural(n.total, "livro", "livros")}.`;
  const partes = [
    nPaises ? `suas leituras atravessaram ${plural(nPaises, "país", "países")}` : null,
    principal ? `com preferência por ${principal.nome}` : null,
    feminina && conhecidas && feminina.qtd ? `${Math.round(feminina.parte * 100)}% de autoria feminina` : null,
    formatoPrincipal ? `predominância de ${nomeFormato[formatoPrincipal.id]}` : null,
  ].filter((x): x is string => !!x);
  const frase = partes.length
    ? maiuscula(
        partes.length > 1
          ? `${partes.slice(0, -1).join(", ")} e ${partes.at(-1)}.`
          : `${partes[0]}.`,
      )
    : null;

  const indicadores = [
    { v: feminina && conhecidas ? `${Math.round(feminina.parte * 100)}%` : "—", r: "autoria feminina" },
    { v: nPaises === null ? "…" : nPaises ? String(nPaises) : "—", r: nPaises === 1 ? "país" : "países" },
    { v: principal ? maiuscula(principal.nome) : "—", r: "gênero principal" },
    { v: formatoPrincipal ? maiuscula(formatoPrincipal.curto) : "—", r: "formato principal" },
  ];
  return (
    <section
      aria-label="seu retrato literário"
      className="rounded-[14px] bg-[color-mix(in_srgb,var(--color-oliva)_16%,var(--color-creme))] px-5 py-5 lg:rounded-[10px] lg:px-7 lg:py-6"
    >
      <p className="text-[10px] font-semibold tracking-[.16em] text-ameixa/70 uppercase">
        seu retrato literário / {n.ano}
      </p>
      <h3 className="mt-2 font-display text-[26px] leading-tight font-semibold text-ameixa lg:font-revista lg:text-[34px] lg:font-normal">
        {titulo}
      </h3>
      {frase ? <p className="mt-2 max-w-[70ch] text-[14px] leading-[1.6] text-tinta-suave">{frase}</p> : null}
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {indicadores.map((x) => (
          <div key={x.r} className="flex min-w-0 flex-col-reverse justify-end gap-1">
            <dt className="text-[11px] text-cinza">{x.r}</dt>
            <dd className="truncate font-display text-[24px] leading-none font-semibold text-ameixa lg:font-revista lg:text-[28px] lg:font-normal">
              {x.v}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ───────── quem escreveu suas leituras ─────────

const pct0 = (p: number) => `${Math.round(p * 100)}%`;

const COR_AUTORIA: Record<CategoriaAutoria, string> = {
  feminina: "var(--color-bordo)",
  masculina: "color-mix(in srgb, var(--color-oliva) 60%, var(--color-creme))",
  "nao-binaria": "var(--color-ouro)",
  outra: "var(--color-rosa-antigo)",
  mista: "color-mix(in srgb, var(--color-rosa-antigo) 55%, var(--color-creme))",
  desconhecida: "var(--color-linha)",
};

function QuemEscreveu({
  lidos,
  generos,
}: {
  lidos: LivroSalvo[];
  generos: Record<string, GeneroAutoria | null> | null;
}) {
  const dados = generos
    ? diversidadeDeAutoria(lidos, (a) => generos[a.toLowerCase()])
    : null;
  return (
    <div>
      <h4 className="font-display text-[18px] font-semibold text-ameixa lg:font-revista lg:text-[20px] lg:font-normal">
        quem escreveu suas leituras?
      </h4>
      <p className="mt-0.5 text-[12px] text-cinza">pelo gênero declarado de quem escreveu cada livro.</p>
      {!dados ? (
        <div aria-hidden className="mt-4 h-[90px] animate-pulse rounded-[8px] bg-linha/50" />
      ) : (
        <>
          <div
            className="mt-4 flex h-[8px] overflow-hidden rounded-full bg-linha/60"
            role="img"
            aria-label={dados.map((d) => `${rotuloAutoria[d.categoria]}: ${pct0(d.parte)}`).join(", ")}
          >
            {dados
              .filter((d) => d.qtd)
              .map((d) => (
                <span key={d.categoria} style={{ width: `${d.parte * 100}%`, background: COR_AUTORIA[d.categoria] }} />
              ))}
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-y-4">
            {dados.map((d, i) => (
              <div
                key={d.categoria}
                className={`flex flex-col-reverse justify-end gap-1 ${i % 3 ? "border-l border-linha pl-3 lg:border-fio" : ""}`}
              >
                <dt className="text-[11px] leading-tight text-tinta-suave">
                  <span aria-hidden className="mr-1 inline-block size-2 rounded-full align-middle" style={{ background: COR_AUTORIA[d.categoria] }} />
                  {maiuscula(rotuloAutoria[d.categoria])}
                  <span className="block text-cinza">{plural(d.qtd, "livro", "livros")}</span>
                </dt>
                <dd className="font-display text-[26px] leading-none font-semibold text-ameixa tabular-nums lg:font-revista lg:text-[30px] lg:font-normal">
                  {d.qtd ? pct0(d.parte) : "—"}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[10px] text-cinza">
            fonte: Wikidata. sem dado declarado, o livro fica como “não informado” — nada é deduzido pelo nome.
          </p>
        </>
      )}
    </div>
  );
}

// ───────── nomes que voltam à sua estante ─────────

type FiltroAutoria = "todos" | GeneroAutoria;
const FILTROS: { id: FiltroAutoria; rotulo: string }[] = [
  { id: "todos", rotulo: "todos" },
  { id: "feminina", rotulo: "autoras" },
  { id: "masculina", rotulo: "autores" },
  { id: "nao-binaria", rotulo: "não binárias" },
];

function NomesQueVoltam({
  lidos,
  paises,
  generos,
}: {
  lidos: LivroSalvo[];
  paises: Record<string, Pais | null> | null;
  generos: Record<string, GeneroAutoria | null> | null;
}) {
  const ranking = rankingDeAutores(lidos);
  const [filtro, setFiltro] = useState<FiltroAutoria>("todos");
  const [todos, setTodos] = useState(false);
  const generoDe = (nome: string) => generos?.[nome.toLowerCase()] ?? null;
  // só mostra os filtros que têm alguém
  const filtros = FILTROS.filter(
    (f) => f.id === "todos" || ranking.some((a) => generoDe(a.nome) === f.id),
  );
  const lista = ranking.filter((a) => filtro === "todos" || generoDe(a.nome) === filtro);
  const visiveis = todos ? lista : lista.slice(0, 5);
  if (!ranking.length) return null;
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h4 className="font-display text-[18px] font-semibold text-ameixa lg:font-revista lg:text-[20px] lg:font-normal">
            nomes que voltam à sua estante
          </h4>
          <p className="mt-0.5 text-[12px] text-cinza">autoras e autores que você mais leu neste ano.</p>
        </div>
        {filtros.length > 1 ? (
          <div role="radiogroup" aria-label="filtrar autoria" className="flex gap-1">
            {filtros.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={filtro === f.id}
                onClick={() => {
                  setFiltro(f.id);
                  setTodos(false);
                }}
                className={`h-8 rounded-pill px-3.5 text-[12px] font-semibold ${filtro === f.id ? "bg-bordo text-creme" : "border border-bege text-ameixa hover:border-bordo"}`}
              >
                {f.rotulo}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <ol className="mt-4 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
        {visiveis.map((a) => {
          const pais = paises?.[a.nome.toLowerCase()];
          const posicao = lista.indexOf(a) + 1;
          return (
            <li key={a.nome} className="flex items-center gap-3 border-t border-linha py-3 lg:border-fio">
              <span className="w-7 flex-none font-display text-[22px] leading-none text-cinza tabular-nums lg:font-revista">
                {String(posicao).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <Link
                  href={linkDaAutoria(a.nome)}
                  className="block truncate text-[14px] font-semibold text-ameixa hover:text-bordo"
                >
                  {a.nome}
                </Link>
                <span className="block truncate text-[11px] text-cinza">
                  {[
                    pais ? pais.nome : null,
                    plural(a.qtd, "livro", "livros"),
                    a.media !== null ? `${nota1(a.media)} ★` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <span className="flex flex-none -space-x-2.5">
                {a.livros.slice(0, 3).map((l) => (
                  <Link key={l.id} href={`/livro/${l.id}`} title={l.titulo} className="w-[26px]">
                    {capaDe(l, "w-full !rounded-[3px] ring-2 ring-creme [&>span:last-child]:hidden")}
                    <span className="sr-only">{l.titulo}</span>
                  </Link>
                ))}
              </span>
            </li>
          );
        })}
      </ol>
      {!visiveis.length ? (
        <p className="mt-3 font-accent text-sm italic text-cinza">ninguém com esse filtro neste ano.</p>
      ) : null}
      {lista.length > 5 ? (
        <button
          type="button"
          onClick={() => setTodos((v) => !v)}
          aria-expanded={todos}
          className="mt-2 text-[12px] font-semibold text-bordo hover:underline"
        >
          {todos ? "mostrar só os 5 primeiros" : `ver o ranking completo (${lista.length})`}
        </button>
      ) : null}
    </div>
  );
}

function RetratoLiterario({ n }: { n: Numeros }) {
  const { paises, generos } = useAutorias(n.lidos);
  return (
    <>
      <Retrato n={n} paises={paises} generos={generos} />
      <Secao titulo="o que suas leituras revelam">
        <div className="space-y-8 lg:space-y-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <OQueMaisLeu lidos={n.lidos} />
            <QuemEscreveu lidos={n.lidos} generos={generos} />
          </div>
          <div className="grid gap-6 border-t border-linha pt-6 lg:grid-cols-[1.35fr_1fr] lg:items-start lg:gap-8 lg:border-fio">
            <Mundo lidos={n.lidos} paises={paises} />
            <div>
              <h4 className="mb-3 font-display text-[18px] font-semibold text-ameixa lg:font-revista lg:text-[20px] lg:font-normal">
                papel, tela ou ouvidos
              </h4>
              <Formatos n={n} />
            </div>
          </div>
          <div className="border-t border-linha pt-6 lg:border-fio">
            <NomesQueVoltam lidos={n.lidos} paises={paises} generos={generos} />
          </div>
        </div>
      </Secao>
    </>
  );
}

export function JornadaNoPerfil() {
  const livros = usePerfil((s) => s.livros);
  const meta = usePerfil((s) => s.meta);
  const anoAtual = new Date().getFullYear();
  const anos = useMemo(() => anosComLeitura(livros), [livros]);
  const [ano, setAno] = useState(anoAtual);
  const n = useMemo(() => calcularNumeros(livros, meta, ano), [livros, meta, ano]);
  const atual = ano === anoAtual;
  const semData = livros.filter((l) => l.status === "lido" && !l.lidoEm).length;
  const diasNoAno = useMemo(() => diasDeLeituraNoAno(livros, ano), [livros, ano]);

  return (
    <div className="space-y-6 pb-6 lg:space-y-8">
      <Cabecalho anos={anos} ano={ano} onAno={setAno} />

      <div className="space-y-3 lg:space-y-4">
        <AnoEmNumeros n={n} atual={atual} dias={diasNoAno} />
        <MesEmRevista livros={livros} ano={ano} />
      </div>

      {atual ? <DiasEntrePaginas livros={livros} /> : null}

      {n.total ? (
        <>
          <Ritmo n={n} />
          <Marcaram lidos={n.lidos} />
          <EntreOsMeses lidos={n.lidos} />
          <RetratoLiterario n={n} />
        </>
      ) : (
        <div className="border-t border-linha pt-8 text-center lg:border-fio">
          <p className="font-display text-[22px] font-semibold italic text-ameixa lg:font-revista lg:font-normal">
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
