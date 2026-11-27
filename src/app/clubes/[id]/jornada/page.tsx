"use client";

import { Insignia } from "@/components/liga/Pecas";
import { DISTINCOES, type TipoDistincao } from "@/lib/liga";
import { historicoDaLiga } from "@/lib/liga-historico";
import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { CapaAuto } from "@/components/CapaAuto";
import { Animacao } from "@/components/Animacao";
import { useClube } from "@/components/clube/ClubeContexto";
import { Ornamento } from "@/components/clube/Ornamento";
import { MapaPaises } from "@/components/numeros/MapaPaises";
import { ErroOuFalta } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import {
  editarClube,
  encontrosDe,
  fichasComAntigas,
  fichasDoClube,
  livrosDoClube,
  organiza,
  type Encontro,
  type Ficha,
  type LivroDoClube,
} from "@/lib/clubes";
import { useGenerosRefinados } from "@/lib/generos";
import { MESES, autoresDoLivro } from "@/lib/jornada";
import { bandeira, paisesDasAutoras, type Pais } from "@/lib/nacionalidade";
import type { LivroSalvo } from "@/lib/perfil-store";
import { nomeDe, useConsulta, useMeuId } from "@/lib/social";

/*
 * our reading journey. — a história literária do clube.
 *
 * Regras das contas (todas determinísticas):
 * - livro lido pelo clube = leitura coletiva com estado "lido"; a data é a do
 *   encerramento coletivo (encerrado_em). Sem essa data, conta em "desde o início"
 *   mas não entra em mês/ano.
 * - páginas das obras = soma das páginas conhecidas, uma vez por leitura.
 * - média de páginas = só livros com páginas conhecidas.
 * - nota do clube = média de cada leitura (fichas publicadas), e depois a média
 *   dessas médias: cada leitura pesa igual.
 * - páginas lidas pelos participantes = páginas da obra × fichas publicadas
 *   (quem publicou a ficha concluiu a leitura).
 * - dispersão = desvio padrão das notas de uma leitura (mínimo 3 notas).
 */

type Periodo = number | "tudo";
type Leitura = {
  l: LivroDoClube;
  fim: Date | null;
  notas: { autor: string; nota: number }[];
  media: number | null;
  desvio: number | null;
  dias: number | null;
};

const virgula = (n: number, casas = 1) => n.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
const num = (n: number) => n.toLocaleString("pt-BR");
const plural = (n: number, um: string, varios: string) => `${num(n)} ${n === 1 ? um : varios}`;
const media = (xs: number[]) => (xs.length ? xs.reduce((t, x) => t + x, 0) / xs.length : null);
const desvioPadrao = (xs: number[]) => {
  const m = media(xs);
  return m === null ? null : Math.sqrt(xs.reduce((t, x) => t + (x - m) ** 2, 0) / xs.length);
};

const titulo = "font-revista text-[26px] leading-none text-bordo italic lg:text-[30px]";
const etiqueta = "font-mono text-[10px] tracking-[.16em] text-tinta-suave uppercase";

function Secao({ id, nome, extra, children, className = "" }: { id: string; nome: string; extra?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section aria-labelledby={id} className={className}>
      <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-linha pb-2 lg:border-fio">
        <h2 id={id} className={titulo}>
          {nome}
        </h2>
        <Ornamento className="mr-auto" />
        {extra}
      </div>
      {children}
    </section>
  );
}

function Barra({ pct, cor = "var(--club-progress-fill)", alta = 6 }: { pct: number; cor?: string; alta?: number }) {
  return (
    <span className="block rounded-full" style={{ height: alta, background: "var(--club-progress-track)" }} aria-hidden>
      <span className="block h-full rounded-full" style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: cor }} />
    </span>
  );
}

export default function JornadaDoClube() {
  const { clube, membros, papel } = useClube();
  const consulta = useConsulta(async () => {
    const [livros, encontros] = await Promise.all([livrosDoClube(clube.id), encontrosDe(clube.id).catch(() => [] as Encontro[])]);
    const lidos = livros.filter((l) => l.estado === "lido");
    const fichas = await fichasDoClube(lidos.map((l) => l.id)).catch(() => [] as Ficha[]);
    return { livros, encontros, fichas };
  }, [clube.id]);

  if (consulta.carregando && !consulta.dados) return <Animacao tipo="pilha" titulo="abrindo a jornada do clube" sub="leituras, notas e encontros" />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  return <Jornada {...consulta.dados!} membros={membros} clube={clube} podeEditar={organiza(papel) && papel === "moderadora"} recarregar={consulta.recarregar} />;
}

function Jornada({
  livros,
  encontros,
  fichas: fichasReais,
  membros,
  clube,
  podeEditar,
  recarregar,
}: {
  livros: LivroDoClube[];
  encontros: Encontro[];
  fichas: Ficha[];
  membros: ReturnType<typeof useClube>["membros"];
  clube: ReturnType<typeof useClube>["clube"];
  podeEditar: boolean;
  recarregar: () => void;
}) {
  const eu = useMeuId();
  const anoAtual = new Date().getFullYear();

  // todas as leituras concluídas, com notas e duração
  const todas: Leitura[] = useMemo(
    () =>
      livros
        .filter((l) => l.estado === "lido")
        .map((l) => {
          const fs = fichasComAntigas(l, fichasReais.filter((f) => f.clube_livro_id === l.id), membros);
          const notas = fs.filter((f) => typeof f.nota === "number" && f.nota > 0).map((f) => ({ autor: f.autor, nota: f.nota as number }));
          const fim = l.encerrado_em ? new Date(l.encerrado_em) : null;
          const ini = l.iniciado_em ? new Date(l.iniciado_em) : null;
          return {
            l,
            fim,
            notas,
            media: media(notas.map((n) => n.nota)),
            desvio: notas.length >= 3 ? desvioPadrao(notas.map((n) => n.nota)) : null,
            dias: ini && fim && fim > ini ? Math.max(1, Math.round((+fim - +ini) / 864e5)) : null,
          };
        })
        .sort((a, b) => (a.fim?.getTime() ?? 0) - (b.fim?.getTime() ?? 0)),
    [livros, fichasReais, membros],
  );

  const anos = useMemo(() => {
    const s = new Set<number>([anoAtual]);
    todas.forEach((x) => x.fim && s.add(x.fim.getFullYear()));
    return [...s].sort((a, b) => b - a);
  }, [todas, anoAtual]);
  const [periodo, setPeriodo] = useState<Periodo>(anoAtual);
  const doPeriodo = periodo === "tudo" ? todas : todas.filter((x) => x.fim?.getFullYear() === periodo);
  const semData = periodo === "tudo" ? todas.filter((x) => !x.fim).length : 0;

  if (!todas.length)
    return (
      <div className="px-5 pt-8 lg:px-0">
        <Cabecalho periodo={periodo} anos={anos} setPeriodo={setPeriodo} clubeId={clube.id} />
        <div className="mt-8 border-y border-linha py-12 text-center lg:border-fio">
          <p className="font-revista text-[28px] text-bordo italic">o primeiro capítulo.</p>
          <p className="mt-1.5 text-[14px] text-tinta-suave">a trajetória do clube começa com a primeira leitura concluída.</p>
        </div>
        <Meta clube={clube} ano={anoAtual} concluidos={0} podeEditar={podeEditar} recarregar={recarregar} />
      </div>
    );

  return (
    <div className="space-y-14 px-5 pt-6 pb-6 lg:px-0 lg:pt-8">
      <Cabecalho periodo={periodo} anos={anos} setPeriodo={setPeriodo} clubeId={clube.id} />
      {periodo !== "tudo" ? <Meta clube={clube} ano={periodo} concluidos={doPeriodo.length} podeEditar={podeEditar} recarregar={recarregar} /> : null}
      <Numeros leituras={doPeriodo} encontros={encontros} periodo={periodo} semData={semData} clube={clube} />
      <AnoEmLivros leituras={doPeriodo} todas={todas} periodo={periodo} anos={anos} />
      <Destaques leituras={doPeriodo} membros={membros} eu={eu} clubeId={clube.id} />
      <Gosto leituras={doPeriodo} />
      <Mundo leituras={doPeriodo} />
      <Turma leituras={doPeriodo} todas={todas} livros={livros} membros={membros} eu={eu} periodo={periodo} />
      <HistoricoDasGlorias clubeId={clube.id} membros={membros} eu={eu} periodo={periodo} />
      <Secao id="t-yearbook" nome="o anuário do clube.">
        <p className="text-[14px] text-tinta-suave">um ano de livros, encontros e diferentes perspectivas.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {anos.map((a) => (
            <Link key={a} href={`/clubes/${clube.id}/retrospectiva?ano=${a}`} className="inline-flex min-h-11 items-center rounded-pill border border-bordo/40 px-4 text-[13px] font-semibold text-bordo hover:border-bordo">
              retrospectiva {a}
              {a === anoAtual ? " · em andamento" : ""}
            </Link>
          ))}
        </div>
      </Secao>
    </div>
  );
}

/* ───────── cabeçalho com o período ───────── */
function Cabecalho({ periodo, anos, setPeriodo, clubeId }: { periodo: Periodo; anos: number[]; setPeriodo: (p: Periodo) => void; clubeId: string }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-revista text-[34px] leading-none text-bordo italic lg:text-[46px]">nossa jornada literária.</h1>
        <p className="mt-2 font-revista text-[16px] text-tinta-suave italic">um pouco mais que livros.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 overflow-x-auto rounded-pill border border-linha p-1 [scrollbar-width:none]" role="group" aria-label="período">
          {[...anos.map((a) => ({ v: a as Periodo, n: String(a) })), { v: "tudo" as Periodo, n: "desde o início" }].map((o) => (
            <button key={String(o.v)} type="button" aria-pressed={periodo === o.v} onClick={() => setPeriodo(o.v)} className={`min-h-9 flex-none rounded-pill px-3.5 text-[12px] font-semibold ${periodo === o.v ? "bg-bordo text-creme" : "text-tinta-suave hover:text-bordo"}`}>
              {o.n}
            </button>
          ))}
        </div>
        <Link href={`/clubes/${clubeId}/retrospectiva`} className="inline-flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo hover:underline">
          ver retrospectiva
        </Link>
      </div>
    </header>
  );
}

/* ───────── our reading goal. ───────── */
function Meta({ clube, ano, concluidos, podeEditar, recarregar }: { clube: ReturnType<typeof useClube>["clube"]; ano: number; concluidos: number; podeEditar: boolean; recarregar: () => void }) {
  const metas = (clube.metas && typeof clube.metas === "object" ? clube.metas : {}) as Record<string, number>;
  const meta = typeof metas[String(ano)] === "number" && metas[String(ano)] > 0 ? metas[String(ano)] : null;
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(meta ? String(meta) : "");
  const [erro, setErro] = useState<string | null>(null);
  const anoAtual = new Date().getFullYear();

  async function salvar(v: number | null) {
    setErro(null);
    const novas = { ...metas };
    if (v) novas[String(ano)] = v;
    else delete novas[String(ano)];
    try {
      await editarClube(clube.id, { metas: novas });
      setEditando(false);
      recarregar();
    } catch (x) {
      const c = (x as { code?: string })?.code;
      setErro(c === "PGRST204" || c === "42703" ? "o banco ainda não tem a meta do clube. rode no Supabase: alter table public.clubes add column if not exists metas jsonb;" : "não foi possível salvar agora.");
    }
  }

  const editor = (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <input
        inputMode="numeric"
        value={valor}
        onChange={(e) => setValor(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 3))}
        placeholder="quantos livros?"
        aria-label={`meta de livros para ${ano}`}
        className="h-11 w-[150px] rounded-pill border border-linha px-4 text-[14px] outline-none focus:border-bordo"
        style={{ background: "var(--club-input-bg)" }}
      />
      <button type="button" disabled={!Number(valor)} onClick={() => salvar(Number(valor))} className="inline-flex h-11 items-center rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme disabled:opacity-45">
        salvar meta
      </button>
      {meta ? (
        <button type="button" onClick={() => salvar(null)} className="min-h-11 px-2 text-[12px] text-cinza hover:text-bordo">
          remover meta
        </button>
      ) : null}
      <button type="button" onClick={() => setEditando(false)} className="min-h-11 px-2 text-[12px] text-cinza">
        cancelar
      </button>
      {erro ? <p className="w-full text-[12px] text-bordo">{erro}</p> : null}
    </div>
  );

  if (!meta)
    return (
      <section aria-labelledby="t-meta" className="cartao-clube p-6">
        <p className={etiqueta}>our reading goal. · {ano}</p>
        <h2 id="t-meta" className="mt-2 font-revista text-[24px] text-ameixa italic">
          what&apos;s our reading goal?
        </h2>
        <p className="mt-1 text-[14px] text-tinta-suave">
          {podeEditar ? "definam quantos livros querem ler juntos neste ano." : "quem organiza o clube pode definir quantos livros vocês querem ler juntos neste ano."}
        </p>
        {podeEditar ? editando ? editor : (
          <button type="button" onClick={() => setEditando(true)} className="mt-4 inline-flex h-11 items-center rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme">
            definir meta
          </button>
        ) : null}
      </section>
    );

  const pct = Math.round((concluidos / meta) * 100);
  const restam = Math.max(0, meta - concluidos);
  const fimDoAno = new Date(ano, 11, 31);
  const mesesRestantes = ano === anoAtual ? Math.max(0, 11 - new Date().getMonth()) + (new Date() < fimDoAno ? 1 : 0) : 0;
  const ritmo = restam && mesesRestantes ? restam / mesesRestantes : null;
  const alcancou = concluidos >= meta;
  return (
    <section aria-labelledby="t-meta" className="cartao-clube grid gap-6 p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-10">
      <div className="relative">
        <svg viewBox="0 0 120 120" width="132" height="132" aria-hidden>
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--club-progress-track)" strokeWidth="10" />
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--club-progress-fill)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${Math.min(1, concluidos / meta) * 314} 314`} transform="rotate(-90 60 60)" />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-revista text-[30px] leading-none text-bordo">{pct}%</span>
          <span className="text-[10px] text-tinta-suave">da meta</span>
        </span>
      </div>
      <div>
        <p className={etiqueta}>our reading goal. · {ano}</p>
        <h2 id="t-meta" className="mt-2 font-revista text-[26px] leading-tight text-ameixa italic">
          {alcancou ? "goal unlocked." : `${concluidos} de ${plural(meta, "livro", "livros")}`}
        </h2>
        <p className="mt-1 text-[14px] text-tinta-suave">
          {alcancou
            ? concluidos > meta
              ? `vocês alcançaram a meta coletiva e já leram ${plural(concluidos - meta, "livro", "livros")} além dela.`
              : "vocês alcançaram a meta coletiva."
            : `${plural(restam, "livro restante", "livros restantes")}${ritmo ? ` · cerca de ${virgula(ritmo)} por mês até dezembro` : ano < anoAtual ? " · o ano já terminou" : ""}.`}
        </p>
        <p className="mt-1 text-[11px] text-cinza">conta as leituras coletivas encerradas no ano, não a soma das leituras de cada membro.</p>
        {podeEditar ? (editando ? editor : (
          <button type="button" onClick={() => setEditando(true)} className="mt-3 min-h-10 text-[12px] font-semibold text-bordo hover:underline">
            editar meta
          </button>
        )) : null}
      </div>
    </section>
  );
}

/* ───────── the club in numbers. ───────── */
function Numeros({ leituras, encontros, periodo, semData, clube }: { leituras: Leitura[]; encontros: Encontro[]; periodo: Periodo; semData: number; clube: ReturnType<typeof useClube>["clube"] }) {
  const comPaginas = leituras.filter((x) => (x.l.livro.paginas ?? 0) > 0);
  const paginas = comPaginas.reduce((t, x) => t + (x.l.livro.paginas ?? 0), 0);
  const medias = leituras.map((x) => x.media).filter((m): m is number => m !== null);
  const notaClube = media(medias);
  const agora = Date.now();
  const encontrosFeitos = encontros.filter((e) => +new Date(e.quando) < agora && (periodo === "tudo" || new Date(e.quando).getFullYear() === periodo)).length;
  const fichas = leituras.reduce((t, x) => t + x.notas.length, 0);
  const autores = new Set(leituras.flatMap((x) => autoresDoLivro(x.l.livro.autor).map((a) => a.toLowerCase()))).size;
  const paginasParticipantes = comPaginas.reduce((t, x) => t + (x.l.livro.paginas ?? 0) * x.notas.length, 0);
  const dias = Math.max(1, Math.round((agora - +new Date(clube.criado_em)) / 864e5));
  const principais = [
    { v: num(leituras.length), r: leituras.length === 1 ? "livro lido pelo clube" : "livros lidos pelo clube" },
    { v: num(paginas), r: "páginas das obras" },
    { v: notaClube !== null ? virgula(notaClube) : "—", r: "nota média do clube" },
    { v: comPaginas.length ? num(Math.round(paginas / comPaginas.length)) : "—", r: "páginas por livro, em média" },
  ];
  const extras = [
    encontrosFeitos ? plural(encontrosFeitos, "encontro realizado", "encontros realizados") : null,
    fichas ? plural(fichas, "ficha publicada", "fichas publicadas") : null,
    autores ? plural(autores, "autor diferente", "autores diferentes") : null,
    paginasParticipantes ? `${num(paginasParticipantes)} páginas lidas pelos participantes` : null,
    periodo === "tudo" ? (dias >= 365 ? `${plural(Math.floor(dias / 365), "ano", "anos")} de clube` : plural(dias, "dia", "dias") + " de clube") : null,
  ].filter(Boolean);
  return (
    <Secao id="t-numeros" nome="o clube em números.">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-6 lg:grid-cols-4">
        {principais.map((p, i) => (
          <div key={p.r} className={i === 0 ? "" : ""}>
            <dt className="sr-only">{p.r}</dt>
            <dd>
              <span className="block font-revista text-[44px] leading-none text-bordo tabular-nums lg:text-[56px]">{p.v}</span>
              <span className="mt-1 block text-[13px] text-tinta-suave">{p.r}</span>
            </dd>
          </div>
        ))}
      </dl>
      {extras.length ? <p className="mt-6 border-t border-dashed border-linha pt-4 text-[13px] leading-relaxed text-ameixa">{extras.join(" · ")}</p> : null}
      <p className="mt-2 text-[11px] text-cinza">
        a nota do clube é a média das notas de cada leitura (cada leitura pesa igual). páginas lidas pelos participantes = páginas da obra × fichas publicadas.
        {semData ? ` ${plural(semData, "leitura antiga sem data de conclusão entra", "leituras antigas sem data de conclusão entram")} aqui, mas não nos meses.` : ""}
      </p>
    </Secao>
  );
}

/* ───────── a year in books. + calendário de capas ───────── */
function AnoEmLivros({ leituras, todas, periodo, anos }: { leituras: Leitura[]; todas: Leitura[]; periodo: Periodo; anos: number[] }) {
  const [medida, setMedida] = useState<"livros" | "paginas">("livros");
  const [aberto, setAberto] = useState<number | null>(null);
  const hoje = new Date();
  const colunas =
    periodo === "tudo"
      ? [...anos].reverse().map((a) => ({ nome: String(a), itens: todas.filter((x) => x.fim?.getFullYear() === a), futuro: false }))
      : MESES.map((m, i) => ({
          nome: m.slice(0, 3),
          itens: leituras.filter((x) => x.fim?.getMonth() === i),
          futuro: periodo === hoje.getFullYear() && i > hoje.getMonth(),
        }));
  const valor = (its: Leitura[]) => (medida === "livros" ? its.length : its.reduce((t, x) => t + (x.l.livro.paginas ?? 0), 0));
  const max = Math.max(1, ...colunas.map((c) => valor(c.itens)));
  const melhor = colunas.reduce((b, c, i) => (valor(c.itens) > valor(colunas[b].itens) ? i : b), 0);
  let acumulado = 0;
  return (
    <Secao
      id="t-ano"
      nome="um ano em livros."
      extra={
        <div className="flex rounded-pill border border-linha p-0.5" role="group" aria-label="medida">
          {(["livros", "paginas"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={medida === m} onClick={() => setMedida(m)} className={`min-h-9 rounded-pill px-3 text-[12px] font-semibold ${medida === m ? "bg-bordo text-creme" : "text-tinta-suave"}`}>
              {m === "livros" ? "livros" : "páginas"}
            </button>
          ))}
        </div>
      }
    >
      <div className="flex h-[170px] items-end gap-1.5 sm:gap-3">
        {colunas.map((c, i) => {
          const v = valor(c.itens);
          acumulado += v;
          return (
            <button
              key={c.nome}
              type="button"
              onClick={() => setAberto(aberto === i ? null : i)}
              aria-expanded={aberto === i}
              aria-label={`${c.nome}: ${medida === "livros" ? plural(v, "livro", "livros") : `${num(v)} páginas`}`}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              <span className="text-[10px] tabular-nums text-tinta-suave">{v ? num(v) : ""}</span>
              <span
                className="block w-full rounded-t-[3px]"
                style={{
                  height: v ? `${Math.max(6, (v / max) * 120)}px` : "3px",
                  background: c.futuro ? "transparent" : v ? (i === melhor ? "var(--club-chart-1)" : "color-mix(in srgb, var(--club-chart-1) 55%, var(--club-bg))") : "var(--club-progress-track)",
                  border: c.futuro ? "1px dashed var(--club-border)" : undefined,
                }}
              />
              <span className={`text-[10px] ${aberto === i ? "font-semibold text-bordo" : "text-cinza"}`}>{c.nome}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-cinza">
        {acumulado ? `${medida === "livros" ? plural(acumulado, "livro", "livros") : `${num(acumulado)} páginas`} no total · ` : ""}
        {periodo !== "tudo" && periodo === hoje.getFullYear() ? "meses tracejados ainda não chegaram · " : ""}toque numa coluna para ver os livros.
      </p>

      {/* calendário de capas */}
      <div className={`mt-6 grid gap-4 ${periodo === "tudo" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6"}`}>
        {colunas.map((c, i) =>
          aberto !== null && aberto !== i ? null : (
            <div key={c.nome} className={`border-t pt-2 ${c.itens.length ? "border-bordo/40" : "border-linha"} ${aberto === i ? "col-span-full" : ""}`}>
              <p className={etiqueta}>{periodo === "tudo" ? c.nome : MESES[i]}</p>
              {c.itens.length ? (
                <div className={`mt-2 flex gap-1.5 ${aberto === i ? "flex-wrap" : ""}`}>
                  {(aberto === i ? c.itens : c.itens.slice(0, 3)).map((x) => (
                    <span key={x.l.id} className={aberto === i ? "w-[64px]" : "w-[38px]"} title={x.l.livro.titulo}>
                      <CapaAuto livro={x.l.livro} className="w-full [&>span:last-child]:hidden" />
                      {aberto === i ? <span className="mt-1 line-clamp-2 block text-[10px] leading-tight text-ameixa">{x.l.livro.titulo}</span> : null}
                    </span>
                  ))}
                  {aberto !== i && c.itens.length > 3 ? <span className="self-end text-[10px] text-cinza">+{c.itens.length - 3}</span> : null}
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-cinza">{c.futuro ? "ainda não chegou" : "—"}</p>
              )}
            </div>
          ),
        )}
      </div>
      {aberto !== null ? (
        <button type="button" onClick={() => setAberto(null)} className="mt-3 min-h-10 text-[12px] font-semibold text-bordo hover:underline">
          ver todos os períodos
        </button>
      ) : null}
    </Secao>
  );
}

/* ───────── destaques: highs & lows, most divisive, unanimous favorite ───────── */
function Destaques({ leituras, membros, eu, clubeId }: { leituras: Leitura[]; membros: ReturnType<typeof useClube>["membros"]; eu: string | null; clubeId: string }) {
  const nome = (u: string) => (u === eu ? "você" : (membros.find((m) => m.usuario_id === u)?.pessoa ? nomeDe(membros.find((m) => m.usuario_id === u)!.pessoa) : "membro do clube"));
  // extremos com empate: devolve todos os empatados
  const extremo = (lista: Leitura[], val: (x: Leitura) => number | null, maior: boolean) => {
    const vs = lista.map((x) => ({ x, v: val(x) })).filter((y): y is { x: Leitura; v: number } => y.v !== null);
    if (!vs.length) return [];
    const alvo = maior ? Math.max(...vs.map((y) => y.v)) : Math.min(...vs.map((y) => y.v));
    return vs.filter((y) => y.v === alvo).map((y) => y.x);
  };
  const comNota = leituras.filter((x) => x.media !== null);
  const cards: { rotulo: string; itens: Leitura[]; valor: (x: Leitura) => string }[] = [];
  if (comNota.length >= 2) {
    cards.push({ rotulo: "mais bem avaliado", itens: extremo(comNota, (x) => x.media, true), valor: (x) => `${virgula(x.media!)} ★` });
    cards.push({ rotulo: "menor avaliação", itens: extremo(comNota, (x) => x.media, false), valor: (x) => `${virgula(x.media!)} ★` });
  }
  const comPag = leituras.filter((x) => (x.l.livro.paginas ?? 0) > 0);
  if (comPag.length >= 2) {
    cards.push({ rotulo: "mais longo", itens: extremo(comPag, (x) => x.l.livro.paginas ?? null, true), valor: (x) => `${num(x.l.livro.paginas!)} págs.` });
    cards.push({ rotulo: "mais curto", itens: extremo(comPag, (x) => x.l.livro.paginas ?? null, false), valor: (x) => `${num(x.l.livro.paginas!)} págs.` });
  }
  const comDias = leituras.filter((x) => x.dias !== null);
  if (comDias.length >= 2) {
    cards.push({ rotulo: "leitura mais rápida", itens: extremo(comDias, (x) => x.dias, false), valor: (x) => plural(x.dias!, "dia", "dias") });
    cards.push({ rotulo: "leitura mais demorada", itens: extremo(comDias, (x) => x.dias, true), valor: (x) => plural(x.dias!, "dia", "dias") });
  }
  const comDesvio = leituras.filter((x) => x.desvio !== null);
  const divisivo = comDesvio.length ? [...comDesvio].sort((a, b) => b.desvio! - a.desvio!)[0] : null;
  const favoritos = comDesvio.filter((x) => (x.media ?? 0) >= 4 && x !== divisivo).sort((a, b) => a.desvio! - b.desvio! || b.media! - a.media!);
  const unanime = favoritos[0] ?? null;

  if (!cards.length && !divisivo)
    return (
      <Secao id="t-destaques" nome="the highs & lows.">
        <p className="font-revista text-[19px] text-ameixa italic">o veredito ainda não saiu.</p>
        <p className="mt-1 text-[13px] text-tinta-suave">ainda não há leituras e avaliações suficientes para comparar.</p>
      </Secao>
    );

  return (
    <div className="space-y-12">
      {cards.length ? (
        <Secao id="t-destaques" nome="the highs & lows.">
          <ul className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3">
            {cards.map((c, i) => (
              <li key={c.rotulo} className={`flex gap-3 ${i % 3 === 1 ? "sm:translate-y-3" : ""}`}>
                <span className="w-[54px] flex-none">
                  <CapaAuto livro={c.itens[0].l.livro} className="w-full [&>span:last-child]:hidden" />
                </span>
                <span className="min-w-0">
                  <span className={etiqueta}>{c.rotulo}</span>
                  <span className="mt-1 line-clamp-2 block font-revista text-[16px] leading-tight text-ameixa italic">{c.itens.map((x) => x.l.livro.titulo).join(" · ")}</span>
                  <span className="mt-0.5 block text-[12px] text-bordo">{c.valor(c.itens[0])}</span>
                  {c.itens.length > 1 ? <span className="block text-[11px] text-cinza">empate entre {c.itens.length} leituras</span> : null}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[11px] text-cinza">a duração vai do início ao encerramento da leitura coletiva, não o tempo que cada um passou lendo.</p>
        </Secao>
      ) : null}

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-10">
        {divisivo ? (
          <Secao id="t-divisivo" nome="o que mais dividiu.">
            <div className="flex gap-4">
              <Link href={`/clubes/${clubeId}/livro/${divisivo.l.id}`} className="w-[86px] flex-none">
                <CapaAuto livro={divisivo.l.livro} className="w-full [&>span:last-child]:hidden" />
              </Link>
              <div className="min-w-0">
                <p className="font-revista text-[19px] leading-tight text-ameixa italic">{divisivo.l.livro.titulo}</p>
                <p className="mt-1 text-[13px] text-tinta-suave">esse foi o livro que mais dividiu opiniões no clube.</p>
                <p className="mt-2 text-[12px] text-tinta-suave">
                  média {virgula(divisivo.media!)} · {plural(divisivo.notas.length, "avaliação", "avaliações")} · desvio de {virgula(divisivo.desvio!)} ponto
                </p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {divisivo.notas.map((n, k) => (
                    <li key={k} className="rounded-pill border border-linha px-2.5 py-1 text-[11px] text-ameixa">
                      {nome(n.autor)} · {virgula(n.nota)}
                    </li>
                  ))}
                </ul>
                <Link href={`/clubes/${clubeId}/livro/${divisivo.l.id}`} className="mt-2 inline-flex min-h-9 items-center text-[12px] font-semibold text-bordo hover:underline">
                  ver fichas de leitura
                </Link>
              </div>
            </div>
          </Secao>
        ) : null}
        {unanime ? (
          <Secao id="t-unanime" nome="o favorito unânime.">
            <div className="flex gap-4">
              <Link href={`/clubes/${clubeId}/livro/${unanime.l.id}`} className="w-[86px] flex-none">
                <CapaAuto livro={unanime.l.livro} className="w-full [&>span:last-child]:hidden" />
              </Link>
              <div className="min-w-0">
                <p className="font-revista text-[19px] leading-tight text-ameixa italic">{unanime.l.livro.titulo}</p>
                <p className="mt-1 text-[13px] text-tinta-suave">o favorito entre as avaliações publicadas: notas altas e próximas umas das outras.</p>
                <p className="mt-2 text-[12px] text-tinta-suave">
                  média {virgula(unanime.media!)} · {plural(unanime.notas.length, "avaliação", "avaliações")} · desvio de {virgula(unanime.desvio!)} ponto
                </p>
                <Link href={`/clubes/${clubeId}/livro/${unanime.l.id}`} className="mt-2 inline-flex min-h-9 items-center text-[12px] font-semibold text-bordo hover:underline">
                  ver fichas de leitura
                </Link>
              </div>
            </div>
          </Secao>
        ) : null}
      </div>
    </div>
  );
}

/* ───────── our reading taste. (gêneros e autores) ───────── */
function Gosto({ leituras }: { leituras: Leitura[] }) {
  const [todosGeneros, setTodosGeneros] = useState(false);
  const [todosAutores, setTodosAutores] = useState(false);
  const comoLivro = useMemo(() => leituras.map((x) => ({ id: x.l.livro.id, titulo: x.l.livro.titulo, autor: x.l.livro.autor, capa: x.l.livro.capa }) as LivroSalvo), [leituras]);
  const generoDe = useGenerosRefinados(comoLivro, () => undefined);
  const porGenero = new Map<string, Leitura[]>();
  leituras.forEach((x, i) => {
    const g = generoDe(comoLivro[i]);
    if (!g) return;
    porGenero.set(g, [...(porGenero.get(g) ?? []), x]);
  });
  const generos = [...porGenero.entries()].sort((a, b) => b[1].length - a[1].length);
  const semGenero = leituras.length - generos.reduce((t, [, ls]) => t + ls.length, 0);
  const porAutor = new Map<string, Leitura[]>();
  leituras.forEach((x) => autoresDoLivro(x.l.livro.autor).forEach((a) => porAutor.set(a, [...(porAutor.get(a) ?? []), x])));
  const autores = [...porAutor.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  if (!leituras.length) return null;
  return (
    <div className="grid gap-12 lg:grid-cols-2 lg:gap-10">
      <Secao id="t-gosto" nome="nosso gosto literário.">
        {generos.length ? (
          <>
            <ul className="space-y-3.5">
              {(todosGeneros ? generos : generos.slice(0, 5)).map(([g, ls]) => {
                const m = media(ls.map((x) => x.media).filter((v): v is number => v !== null));
                return (
                  <li key={g}>
                    <p className="flex items-baseline justify-between gap-3 text-[14px]">
                      <span className="text-ameixa">{g}</span>
                      <span className="text-[12px] tabular-nums text-tinta-suave">
                        {plural(ls.length, "livro", "livros")} · {Math.round((ls.length / leituras.length) * 100)}%{m !== null ? ` · ${virgula(m)} ★` : ""}
                      </span>
                    </p>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="min-w-0 flex-1">
                        <Barra pct={(ls.length / generos[0][1].length) * 100} alta={5} />
                      </span>
                      <span className="flex flex-none gap-1">
                        {ls.slice(0, 3).map((x) => (
                          <span key={x.l.id} className="w-[20px]">
                            <CapaAuto livro={x.l.livro} className="w-full [&>span:last-child]:hidden" />
                          </span>
                        ))}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
            {generos.length > 5 ? (
              <button type="button" onClick={() => setTodosGeneros((t) => !t)} className="mt-3 min-h-10 text-[12px] font-semibold text-bordo hover:underline">
                {todosGeneros ? "ver menos" : `ver todos os ${generos.length} gêneros`}
              </button>
            ) : null}
            <p className="mt-2 text-[11px] text-cinza">cada livro conta em um gênero só, então as porcentagens somam 100%.{semGenero ? ` ${plural(semGenero, "livro ainda sem gênero identificado", "livros ainda sem gênero identificado")}.` : ""}</p>
          </>
        ) : (
          <p className="text-[13px] text-tinta-suave">identificando os gêneros dos livros…</p>
        )}
      </Secao>
      <Secao id="t-autores" nome="as autorias.">
        <ul className="space-y-3">
          {(todosAutores ? autores : autores.slice(0, 3)).map(([a, ls]) => {
            const m = media(ls.map((x) => x.media).filter((v): v is number => v !== null));
            return (
              <li key={a} className="flex items-center gap-3">
                <span className="flex flex-none gap-1">
                  {ls.slice(0, 2).map((x) => (
                    <span key={x.l.id} className="w-[30px]">
                      <CapaAuto livro={x.l.livro} className="w-full [&>span:last-child]:hidden" />
                    </span>
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <Link href={`/autor/${encodeURIComponent(a)}`} className="block truncate text-[14px] text-ameixa hover:text-bordo">
                    {a}
                  </Link>
                  <span className="block text-[12px] text-tinta-suave">
                    {plural(ls.length, "obra", "obras")}
                    {m !== null ? ` · ${virgula(m)} ★` : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
        {autores.length > 3 ? (
          <button type="button" onClick={() => setTodosAutores((t) => !t)} className="mt-3 min-h-10 text-[12px] font-semibold text-bordo hover:underline">
            {todosAutores ? "ver menos" : `ver todos os ${autores.length} autores`}
          </button>
        ) : null}
      </Secao>
    </div>
  );
}

/* ───────── around the world. ───────── */
function Mundo({ leituras }: { leituras: Leitura[] }) {
  const autores = useMemo(() => [...new Set(leituras.flatMap((x) => autoresDoLivro(x.l.livro.autor)))], [leituras]);
  const [paises, setPaises] = useState<Record<string, Pais | null> | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    paisesDasAutoras(autores)
      .then((c) => vivo && setPaises(c as Record<string, Pais | null>))
      .catch(() => vivo && setPaises({}));
    return () => {
      vivo = false;
    };
  }, [autores]);
  if (!leituras.length) return null;
  const porPais = new Map<string, { pais: Pais; livros: Leitura[] }>();
  let semOrigem = 0;
  leituras.forEach((x) => {
    const ps = autoresDoLivro(x.l.livro.autor)
      .map((a) => paises?.[a.toLowerCase()])
      .filter((p): p is Pais => !!p);
    if (!ps.length) semOrigem++;
    [...new Map(ps.map((p) => [p.nome, p])).values()].forEach((p) => {
      const atual = porPais.get(p.nome) ?? { pais: p, livros: [] };
      atual.livros.push(x);
      porPais.set(p.nome, atual);
    });
  });
  const lista = [...porPais.values()].sort((a, b) => b.livros.length - a.livros.length);
  const escolhido = sel ? porPais.get(sel) : null;
  return (
    <Secao id="t-mundo" nome="around the world." extra={lista.length ? <span className="text-[12px] text-tinta-suave">{plural(lista.length, "país", "países")}</span> : null}>
      {!paises ? (
        <p className="text-[13px] text-tinta-suave">procurando a nacionalidade dos autores…</p>
      ) : lista.length ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-10">
          <MapaPaises lista={lista.map((p) => ({ pais: p.pais, qtd: p.livros.length }))} selecionado={sel} onSelecionar={(p) => setSel(sel === p.nome ? null : p.nome)} />
          <div>
            <ul className="space-y-1">
              {lista.map((p) => (
                <li key={p.pais.nome}>
                  <button type="button" aria-pressed={sel === p.pais.nome} onClick={() => setSel(sel === p.pais.nome ? null : p.pais.nome)} className={`flex min-h-10 w-full items-center gap-2 rounded-[4px] px-2 text-left text-[14px] ${sel === p.pais.nome ? "bg-rosa-fundo text-bordo" : "text-ameixa hover:bg-rosa-fundo/60"}`}>
                    <span aria-hidden>{bandeira(p.pais.codigo)}</span>
                    <span className="min-w-0 flex-1 truncate">{p.pais.nome}</span>
                    <span className="text-[12px] tabular-nums text-tinta-suave">{p.livros.length}</span>
                  </button>
                </li>
              ))}
            </ul>
            {escolhido ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {escolhido.livros.map((x) => (
                  <span key={x.l.id} className="w-[50px]" title={`${x.l.livro.titulo} · ${x.l.livro.autor}`}>
                    <CapaAuto livro={x.l.livro} className="w-full [&>span:last-child]:hidden" />
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="text-[13px] text-tinta-suave">a origem dos autores destes livros ainda não foi encontrada.</p>
      )}
      <p className="mt-3 text-[11px] text-cinza">
        critério: país de cidadania declarado no Wikidata para cada autor.{semOrigem ? ` ${plural(semOrigem, "livro com origem não informada", "livros com origem não informada")}.` : ""}
      </p>
    </Secao>
  );
}

/* ───────── the reading crew. ───────── */
function Turma({
  leituras,
  todas,
  livros,
  membros,
  eu,
  periodo,
}: {
  leituras: Leitura[];
  todas: Leitura[];
  livros: LivroDoClube[];
  membros: ReturnType<typeof useClube>["membros"];
  eu: string | null;
  periodo: Periodo;
}) {
  if (!leituras.length) return null;
  const linhas = membros.map((m) => {
    // só conta as leituras encerradas depois que a pessoa entrou
    const elegiveis = leituras.filter((x) => !x.fim || x.fim >= new Date(m.entrou_em));
    const fichas = elegiveis.filter((x) => x.notas.some((n) => n.autor === m.usuario_id)).length;
    const escolhas = (periodo === "tudo" ? todas : leituras).filter((x) => x.l.sugerido_por === m.usuario_id && !x.l.livro.historico).length;
    const paginas = elegiveis.filter((x) => x.notas.some((n) => n.autor === m.usuario_id)).reduce((t, x) => t + (x.l.livro.paginas ?? 0), 0);
    return { m, elegiveis: elegiveis.length, fichas, escolhas, paginas };
  });
  void livros;
  return (
    <Secao id="t-turma" nome="quem lê com a gente.">
      <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
        {linhas.map((x) => (
          <li key={x.m.usuario_id} className="flex items-center gap-3">
            <Avatar pessoa={x.m.pessoa} tamanho={38} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] text-ameixa">{x.m.usuario_id === eu ? "você" : nomeDe(x.m.pessoa)}</span>
              <span className="block text-[12px] text-tinta-suave">
                {x.elegiveis ? `${x.fichas} de ${plural(x.elegiveis, "leitura", "leituras")} com ficha` : "entrou depois destas leituras"}
                {x.escolhas ? ` · ${plural(x.escolhas, "livro sugerido", "livros sugeridos")}` : ""}
                {x.paginas ? ` · ${num(x.paginas)} págs.` : ""}
              </span>
              {x.elegiveis ? (
                <span className="mt-1.5 block">
                  <Barra pct={(x.fichas / x.elegiveis) * 100} alta={4} />
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[11px] text-cinza">conta só as leituras encerradas depois que cada pessoa entrou no clube. a gestão dos membros fica na aba membros.</p>
    </Secao>
  );
}


/** pequenas glórias de cada mês encerrado (consolidadas; nunca recalculadas) */
function HistoricoDasGlorias({ clubeId, membros, eu, periodo }: { clubeId: string; membros: ReturnType<typeof useClube>["membros"]; eu: string | null; periodo: Periodo }) {
  const consulta = useConsulta(() => historicoDaLiga(clubeId), [clubeId]);
  const meses = (consulta.dados ?? []).filter((m) => periodo === "tudo" || m.periodo.startsWith(String(periodo)));
  if (!meses.length) return null;
  const nome = (id: string) => (id === eu ? "você" : nomeDe(membros.find((m) => m.usuario_id === id)?.pessoa));
  const cor = (id: string) => DISTINCOES.find((x) => x.id === id)?.cor ?? "meta";
  return (
    <Secao id="t-glorias-hist" nome="pequenas glórias de cada mês.">
      <ol className="divide-y divide-linha">
        {meses.map((m) => (
          <li key={m.periodo} className="grid gap-3 py-4 sm:grid-cols-[150px_minmax(0,1fr)]">
            <p className="font-revista text-[17px] text-ameixa italic">{m.nome}</p>
            <ul className="flex flex-wrap gap-x-6 gap-y-3">
              {m.distincoes.map((g) => (
                <li key={g.id} className="flex items-center gap-2">
                  <Insignia tipo={g.id as TipoDistincao} tamanho={34} cor={cor(g.id)} />
                  <span className="text-[13px]">
                    <span className="block font-semibold text-ameixa">{g.nome}</span>
                    <span className="block text-[12px] text-tinta-suave">{g.vencedores.map((v) => nome(v.usuario_id)).join(" e ")}</span>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </Secao>
  );
}
