"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CapaAuto } from "@/components/CapaAuto";
import { useClube } from "@/components/clube/ClubeContexto";
import { EmblemaLiga, Insignia } from "@/components/liga/Pecas";
import { Avatar } from "@/components/social/Pessoas";
import { cargos, fichasComAntigas, fichasDoClube, livrosDoClube, progressoDoClube, virgula, type Membro } from "@/lib/clubes";
import { CATALOGO, ehCarta } from "@/lib/entrelinhas";
import { CATEGORIAS, DISTINCOES, afinidades, classificacao, distincoes, periodoAno, periodoGeral, periodoMes, type Categoria, type Dados, type Linha, type Periodo } from "@/lib/liga";
import { consolidarMeses } from "@/lib/liga-historico";
import type { LivroSalvo } from "@/lib/perfil-store";
import { dadosDaLiga, nomeDe, useConsulta, useMeuId } from "@/lib/social";

/*
 * Membros do clube numa página só:
 *  quem lê com a gente · liga dos leitores · pequenas glórias · na mesma página.
 * Os cálculos ficam todos em lib/liga.ts (os mesmos da jornada e do resumo).
 */

const num = (n: number) => n.toLocaleString("pt-BR");
const titulo = "font-revista text-[22px] leading-none text-ameixa";
const linhaTitulo = "mb-3 flex items-baseline justify-between gap-3 border-b border-linha pb-2";
const perfil = (m: Membro) => (m.pessoa.usuario ? `/u/${m.pessoa.usuario}` : "#");

/** os dados da liga do clube (reais: livros, fichas, progresso, estantes públicas autorizadas) */
export function useDadosDaLiga() {
  const { clube, membros } = useClube();
  return useConsulta(async () => {
    const livros = await livrosDoClube(clube.id);
    const ids = livros.filter((l) => l.estado !== "sugerido").map((l) => l.id);
    const [reais, progresso, extra] = await Promise.all([
      fichasDoClube(ids),
      progressoDoClube(ids).catch(() => []),
      dadosDaLiga(membros.map((m) => m.usuario_id)).catch(() => new Map<string, { livros: LivroSalvo[] | null; carta: string | null }>()),
    ]);
    const pessoais = new Map([...extra].map(([id, x]) => [id, x.livros]));
    const cartas = new Map([...extra].map(([id, x]) => [id, x.carta]));
    const fichas = livros.filter((l) => l.estado !== "sugerido").flatMap((l) => fichasComAntigas(l, reais.filter((f) => f.clube_livro_id === l.id), membros));
    const d: Dados = { membros, livros, fichas, progresso, pessoais };
    const datas = [
      ...livros.map((l) => l.encerrado_em ?? ""),
      ...[...pessoais.values()].flatMap((ls) => (ls ?? []).filter((l) => l.status === "lido" && l.lidoEm).map((l) => l.lidoEm!)),
    ];
    return { d, cartas, datas };
  }, [clube.id, membros.length]);
}

/* ───────── quem lê com a gente ───────── */

export function QuemLeComAGente({ cartas, acoes }: { cartas: Map<string, string | null>; acoes: React.ReactNode }) {
  const { membros } = useClube();
  const eu = useMeuId();
  const nomeCargo = (p: string) => cargos.find((c) => c.id === p)?.nome ?? p;
  return (
    <section aria-labelledby="t-quem">
      <div className={linhaTitulo}>
        <h2 id="t-quem" className={titulo}>
          quem lê com a gente.
        </h2>
        <span className="text-[12px] text-cinza">
          {membros.length} {membros.length === 1 ? "pessoa" : "pessoas"}
        </span>
      </div>
      {/* retrato coletivo: avatares em grade, só o essencial embaixo */}
      <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 xl:grid-cols-5">
        {membros.map((m) => {
          const carta = cartas.get(m.usuario_id);
          return (
            <li key={m.usuario_id} className="min-w-0 text-center">
              <Link href={perfil(m)} className="group block">
                <Avatar pessoa={m.pessoa} tamanho={64} className="mx-auto ring-2 ring-transparent transition group-hover:ring-rosa-antigo" />
                <span className="mt-2 block truncate text-[13px] font-semibold text-ameixa group-hover:text-bordo">{m.usuario_id === eu ? "você" : nomeDe(m.pessoa)}</span>
              </Link>
              {m.papel !== "membro" ? <span className="block text-[11px] text-bordo">{nomeCargo(m.papel)}</span> : null}
              {carta && ehCarta(carta) ? <span className="block truncate font-revista text-[12px] text-tinta-suave italic">✧ {CATALOGO[carta].nome}</span> : null}
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 text-[13px]">{acoes}</div>
    </section>
  );
}

/* ───────── liga dos leitores ───────── */

const PERIODOS = [
  { id: "mes", nome: "Este mês" },
  { id: "ano", nome: "Este ano" },
  { id: "geral", nome: "Todo o período" },
] as const;
type IdPeriodo = (typeof PERIODOS)[number]["id"];
const MEMO = "bookside-liga";

function periodoDe(id: IdPeriodo, hoje = new Date()): Periodo {
  return id === "mes" ? periodoMes(hoje.getFullYear(), hoje.getMonth(), hoje) : id === "ano" ? periodoAno(hoje.getFullYear(), hoje) : periodoGeral;
}

/** a seleção (categoria e período) fica guardada enquanto se navega pelo clube */
export function useSelecaoDaLiga() {
  const [cat, setCat] = useState<Categoria>("paginas");
  const [per, setPer] = useState<IdPeriodo>("ano");
  useEffect(() => {
    try {
      const v = JSON.parse(sessionStorage.getItem(MEMO) ?? "{}") as { cat?: Categoria; per?: IdPeriodo };
      if (v.cat && CATEGORIAS.some((c) => c.id === v.cat)) setCat(v.cat);
      if (v.per && PERIODOS.some((p) => p.id === v.per)) setPer(v.per);
    } catch {
      /* sem armazenamento */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(MEMO, JSON.stringify({ cat, per }));
    } catch {
      /* sem armazenamento */
    }
  }, [cat, per]);
  return { cat, setCat, per, setPer, periodo: periodoDe(per) };
}

const CORES_PODIO = [
  { fundo: "bg-bordo", texto: "text-creme", altura: "h-[92px]" },
  { fundo: "bg-rosa-antigo", texto: "text-ameixa", altura: "h-[68px]" },
  { fundo: "bg-descoberta", texto: "text-ameixa", altura: "h-[52px]" },
];

export function LigaDosLeitores({ d, selecao }: { d: Dados; selecao: ReturnType<typeof useSelecaoDaLiga> }) {
  const eu = useMeuId();
  const { cat, setCat, per, setPer, periodo } = selecao;
  const [metodo, setMetodo] = useState(false);
  const info = CATEGORIAS.find((c) => c.id === cat)!;
  const linhas = classificacao(d, cat, periodo);
  const comValor = linhas.filter((l) => l.valor !== null && l.valor > 0);
  const nome = (m: Membro) => (m.usuario_id === eu ? "você" : nomeDe(m.pessoa));
  const valor = (l: Linha) => (cat === "indicacoes" ? virgula(l.valor!) : num(l.valor!));
  const podio = comValor.slice(0, 3);
  const resto = comValor.slice(3);
  // a ordem visual: 2º à esquerda, 1º ao centro, 3º à direita (com menos gente, o pódio se ajusta)
  const ordem = podio.length === 3 ? [podio[1], podio[0], podio[2]] : podio.length === 2 ? [podio[1], podio[0]] : podio;
  const empate = new Set(comValor.filter((l, _, a) => a.filter((x) => x.posicao === l.posicao).length > 1).map((l) => l.posicao));

  const select = "h-11 w-full appearance-none rounded-[6px] border border-linha bg-transparent pr-8 pl-3 text-[14px] text-ameixa outline-none focus:border-bordo sm:h-10";
  const seta = <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-cinza">▾</span>;

  return (
    <section aria-labelledby="t-liga">
      <div className={linhaTitulo}>
        <h2 id="t-liga" className={`${titulo} flex items-center gap-2`}>
          liga dos leitores.
          <span className="text-bordo">
            <EmblemaLiga tamanho={18} />
          </span>
        </h2>
      </div>
      <p className="-mt-1 mb-3 font-revista text-[14px] text-tinta-suave italic">Diferentes ritmos, uma paixão em comum.</p>
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-[3]">
          <span className="sr-only">Categoria</span>
          <select value={cat} onChange={(e) => setCat(e.target.value as Categoria)} className={`${select} font-semibold`}>
            <optgroup label="Leituras de cada pessoa">
              {CATEGORIAS.filter((c) => c.escopo === "individual").map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </optgroup>
            <optgroup label="Neste clube">
              {CATEGORIAS.filter((c) => c.escopo === "clube").map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </optgroup>
          </select>
          {seta}
        </label>
        <label className="relative min-w-0 flex-[2]">
          <span className="sr-only">Período</span>
          <select value={per} onChange={(e) => setPer(e.target.value as IdPeriodo)} className={select}>
            {PERIODOS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          {seta}
        </label>
      </div>
      <p className="mt-2 text-[12px] text-cinza">
        {info.escopo === "clube" ? "Considera exclusivamente as atividades deste clube." : "Considera os registros pessoais de leitura compartilhados pelos membros."}
        {per !== "geral" && !periodo.encerrado ? " Período em andamento: resultado provisório." : ""}
      </p>

      {comValor.length ? (
        <>
          {/* pódio editorial: alturas marcam a posição, não o tamanho do número */}
          <ol aria-label="pódio" className="mt-6 flex items-end justify-center gap-2 sm:gap-3">
            {ordem.map((l) => {
              const cor = CORES_PODIO[Math.min(2, l.posicao - 1)];
              const lider = l.posicao === 1;
              return (
                <li key={l.m.usuario_id} className="flex w-[31%] max-w-[150px] min-w-0 flex-col items-center">
                  {lider ? (
                    <span aria-hidden className="mb-1 text-bordo">
                      <EmblemaLiga tamanho={22} />
                    </span>
                  ) : null}
                  <Link href={perfil(l.m)} className="flex flex-col items-center">
                    <Avatar pessoa={l.m.pessoa} tamanho={lider ? 64 : 52} className={lider ? "ring-2 ring-bordo ring-offset-2 ring-offset-creme" : ""} />
                    <span className="mt-1.5 max-w-full truncate text-[13px] font-semibold text-ameixa">{nome(l.m)}</span>
                  </Link>
                  <span className="text-[12px] text-tinta-suave tabular-nums">
                    {valor(l)} <span className="text-cinza">{info.unidade(l.valor!)}</span>
                  </span>
                  <span className={`mt-2 flex w-full items-start justify-center rounded-t-[4px] pt-2 font-revista text-[22px] ${cor.fundo} ${cor.texto} ${cor.altura}`}>
                    {l.posicao}º{empate.has(l.posicao) ? <span className="ml-1 self-center font-sans text-[10px] font-semibold">empate</span> : null}
                  </span>
                </li>
              );
            })}
          </ol>
          <span aria-hidden className="block h-px bg-linha" />

          {resto.length ? (
            <ol className="mt-1">
              {resto.map((l) => (
                <li key={l.m.usuario_id} className="grid grid-cols-[30px_32px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-linha py-2.5">
                  <span className="text-center text-[13px] text-tinta-suave tabular-nums">{l.posicao}º</span>
                  <Link href={perfil(l.m)}>
                    <Avatar pessoa={l.m.pessoa} tamanho={32} />
                  </Link>
                  <span className="min-w-0">
                    <Link href={perfil(l.m)} className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-semibold text-ameixa hover:text-bordo">{nome(l.m)}</span>
                      {l.m.usuario_id === eu ? <span aria-label="você" className="size-1.5 flex-none rounded-full bg-bordo" /> : null}
                      {l.provisorio ? <span className="flex-none rounded-[3px] border border-linha px-1 text-[10px] text-cinza">provisório</span> : null}
                    </Link>
                    {l.detalhe ? <span className="block truncate text-[11px] text-cinza">{l.detalhe}</span> : null}
                  </span>
                  <span className="text-right text-[14px] font-semibold text-ameixa tabular-nums">
                    {valor(l)} <span className="block text-[11px] font-normal text-cinza">{info.unidade(l.valor!)}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : null}
          {linhas.some((l) => l.valor === null) ? (
            <p className="mt-2 text-[11px] text-cinza">
              Sem dados nesta categoria: {linhas.filter((l) => l.valor === null).map((l) => nome(l.m)).join(", ")}.
            </p>
          ) : null}
        </>
      ) : (
        <p className="mt-4 border-y border-linha py-5 text-center text-[13px] text-tinta-suave">Ainda não há registros suficientes para esta categoria.</p>
      )}
      <button type="button" aria-expanded={metodo} onClick={() => setMetodo((v) => !v)} className="mt-2 min-h-10 text-[13px] font-semibold text-tinta-suave hover:text-bordo">
        {metodo ? "fechar" : "Como calculamos"}
      </button>
      {metodo ? <p className="max-w-[60ch] border-l-2 border-linha pl-3 text-[12px] leading-relaxed text-tinta-suave">{info.metodo}</p> : null}
    </section>
  );
}

/* ───────── pequenas glórias ───────── */

export function PequenasGlorias({ d, periodo }: { d: Dados; periodo: Periodo }) {
  const eu = useMeuId();
  const [todas, setTodas] = useState(false);
  const ganhas = distincoes(d, periodo);
  const lista = todas ? ganhas : ganhas.slice(0, 4);
  const nome = (m: Membro) => (m.usuario_id === eu ? "você" : nomeDe(m.pessoa));
  return (
    <section aria-labelledby="t-glorias">
      <div className={linhaTitulo}>
        <h2 id="t-glorias" className={titulo}>
          pequenas glórias.
        </h2>
        <span className="text-[12px] text-cinza">{periodo.id === "geral" ? "todo o período" : periodo.nome}</span>
      </div>
      <p className="-mt-1 mb-4 text-[13px] text-tinta-suave">Diferentes maneiras de viver a literatura merecem ser celebradas.</p>
      {lista.length ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
          {lista.map((x) => (
            <li key={x.id} className="flex flex-col items-center text-center">
              <Insignia tipo={x.id} tamanho={68} cor={x.cor} />
              <span className="mt-2 font-revista text-[16px] leading-tight text-ameixa">{x.nome}</span>
              <span className="mt-0.5 text-[12px] font-semibold text-bordo">{x.vencedores.map((v) => nome(v.m)).join(" e ")}</span>
              <span className="mt-1 text-[11px] leading-snug text-cinza">{x.descricao}</span>
              <span className="mt-0.5 text-[10px] tracking-[.06em] text-cinza uppercase">{periodo.encerrado ? "consolidado" : "provisório"}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-cinza">As primeiras distinções serão reveladas à medida que a história do clube avançar.</p>
      )}
      {ganhas.length > 4 ? (
        <button type="button" onClick={() => setTodas((v) => !v)} className="mt-3 min-h-10 text-[13px] font-semibold text-bordo">
          {todas ? "mostrar menos" : `mostrar todas (${ganhas.length})`}
        </button>
      ) : null}
      {DISTINCOES.length > ganhas.length && ganhas.length ? (
        <p className="mt-2 text-[11px] text-cinza">As demais ainda não foram conquistadas neste período.</p>
      ) : null}
    </section>
  );
}

/* ───────── na mesma página ───────── */

export function NaMesmaPagina({ d }: { d: Dados }) {
  const a = afinidades(d);
  if (!a.lidos.length && !a.quero.length && !a.autores.length) return null;
  const membros = (s: Set<string>) => `${s.size} membros`;
  return (
    <section aria-labelledby="t-mesma">
      <div className={linhaTitulo}>
        <h2 id="t-mesma" className={titulo}>
          na mesma página.
        </h2>
      </div>
      {a.lidos.length ? (
        <>
          <p className="mb-2 text-[12px] font-semibold text-cinza">Lidos por vários de vocês</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {a.lidos.map((x) => (
              <li key={x.livro.id} className="min-w-0">
                <Link href={`/livro/${x.livro.id}`} title={x.livro.titulo}>
                  <CapaAuto livro={x.livro} className="w-full [&>span:last-child]:hidden" />
                </Link>
                <span className="mt-1 block text-[11px] text-tinta-suave">{membros(x.quem)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {a.quero.length ? (
        <div className="mt-5">
          <p className="mb-1 text-[12px] font-semibold text-cinza">No quero ler de mais de uma pessoa · boas candidatas à próxima leitura</p>
          <ul className="divide-y divide-linha">
            {a.quero.map((x) => (
              <li key={x.livro.id} className="flex items-baseline justify-between gap-3 py-2 text-[13px]">
                <Link href={`/livro/${x.livro.id}`} className="min-w-0 truncate text-ameixa hover:text-bordo">
                  <span className="font-revista text-[15px] italic">{x.livro.titulo}</span> <span className="text-cinza">· {x.livro.autor}</span>
                </Link>
                <span className="flex-none text-[12px] text-tinta-suave">{membros(x.quem)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {a.autores.length ? (
        <p className="mt-4 text-[13px] text-tinta-suave">
          <span className="font-semibold text-cinza">Autores em comum: </span>
          {a.autores.map((x) => `${x.nome} (${x.quem.size})`).join(" · ")}
        </p>
      ) : null}
      <p className="mt-3 text-[11px] text-cinza">Só entram estantes públicas de quem compartilha as leituras com a liga.</p>
    </section>
  );
}

/** grava no histórico os meses encerrados (uma vez por visita, sem bloquear a página) */
export function useConsolidar(d: Dados | undefined, datas: string[] | undefined) {
  const { clube } = useClube();
  useEffect(() => {
    if (!d || !datas) return;
    void consolidarMeses(clube.id, d, datas).catch(() => null);
  }, [clube.id, d, datas]);
}
