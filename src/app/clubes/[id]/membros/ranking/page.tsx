"use client";

import Link from "next/link";
import { useState } from "react";
import { useClube } from "@/components/clube/ClubeContexto";
import { CapaAuto } from "@/components/CapaAuto";
import { AbasMembros, EmblemaLiga, Insignia, posicaoTexto } from "@/components/liga/Pecas";
import { Carregando, ErroOuFalta } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { fichasComAntigas, fichasDoClube, livrosDoClube, progressoDoClube, virgula } from "@/lib/clubes";
import {
  CATEGORIAS,
  DISTINCOES,
  classificacao,
  destaquesIndicacoes,
  distincoes,
  matriz,
  periodoAno,
  periodoGeral,
  periodoMes,
  periodosComDados,
  type Categoria,
  type Dados,
  type EstadoCelula,
  type Periodo,
} from "@/lib/liga";
import { nomeDe, useConsulta, useMeuId } from "@/lib/social";

type Secao = "classificacao" | "curators" | "distincoes" | "hall" | "together";
const SECOES: [Secao, string][] = [
  ["classificacao", "Classificação"],
  ["curators", "the curators."],
  ["distincoes", "Distinções"],
  ["hall", "hall of fame."],
  ["together", "reading together."],
];
const num = (n: number) => n.toLocaleString("pt-BR");
const valorTexto = (cat: Categoria, v: number) => (cat === "indicacoes" ? virgula(v) : num(v));

/**
 * the reading league. — classificação e participação dos membros, só com os
 * registros reais do clube. Cada categoria tem a própria metodologia (lib/liga).
 */
export default function RankingPage() {
  const { clube, membros, identidade } = useClube();
  const eu = useMeuId();
  const hoje = new Date();
  const [secao, setSecao] = useState<Secao>("classificacao");
  const [cat, setCat] = useState<Categoria>("paginas");
  const [periodoId, setPeriodoId] = useState("ano");
  const [metodo, setMetodo] = useState(false);
  const [celula, setCelula] = useState<{ m: string; l: string } | null>(null);
  const base = `/clubes/${clube.id}`;

  const consulta = useConsulta(async () => {
    const livros = await livrosDoClube(clube.id);
    const ids = livros.filter((l) => l.estado !== "sugerido").map((l) => l.id);
    const [reais, progresso] = await Promise.all([fichasDoClube(ids), progressoDoClube(ids).catch(() => [])]);
    return { livros, reais, progresso };
  }, [clube.id, membros.length]);

  const cabecalho = (
    <div className="px-4 pt-4 lg:px-0 lg:pt-6">
      <AbasMembros base={base} />
      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-revista text-[26px] leading-none text-ameixa lg:text-[32px]">
            the reading league.
            <span className="text-bordo">
              <EmblemaLiga />
            </span>
          </p>
          <p className="mt-1.5 text-[13px] text-cinza">Classificação e participação dos membros.</p>
        </div>
      </div>
    </div>
  );

  if (identidade?.semRanking)
    return (
      <>
        {cabecalho}
        <p className="mx-4 mt-6 rounded-[6px] border border-dashed border-bege px-4 py-4 text-[14px] text-tinta-suave lg:mx-0">O ranking está desligado neste clube. Quem organiza pode reativar no Club Studio, em layout.</p>
      </>
    );
  if (consulta.carregando && !consulta.dados)
    return (
      <>
        {cabecalho}
        <Carregando texto="calculando a classificação…" linhas={4} />
      </>
    );
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { livros, reais, progresso } = consulta.dados!;
  // as fichas antigas (da revista do clube) entram só na nota coletiva dos livros
  const fichas = livros.filter((l) => l.estado !== "sugerido").flatMap((l) => fichasComAntigas(l, reais.filter((f) => f.clube_livro_id === l.id), membros));
  const d: Dados = { membros, livros, fichas, progresso };

  // períodos: este mês, este ano, geral e os anteriores com registros
  const datas = [...livros.map((l) => l.encerrado_em ?? ""), ...reais.map((f) => f.criado_em), ...progresso.filter((p) => p.status === "terminei").map((p) => p.atualizado_em)];
  const anteriores = periodosComDados(datas, hoje);
  const esteMes = periodoMes(hoje.getFullYear(), hoje.getMonth(), hoje);
  const esteAno = periodoAno(hoje.getFullYear(), hoje);
  const periodos: Periodo[] = [esteMes, esteAno, periodoGeral, ...anteriores.meses.filter((p) => p.id !== esteMes.id), ...anteriores.anos.filter((p) => p.id !== esteAno.id)];
  const periodo = periodoId === "mes" ? esteMes : periodoId === "ano" ? esteAno : (periodos.find((p) => p.id === periodoId) ?? periodoGeral);

  const info = CATEGORIAS.find((c) => c.id === cat)!;
  const linhas = classificacao(d, cat, periodo);
  const comValor = linhas.filter((l) => l.valor !== null && l.valor > 0);
  const maior = Math.max(1, ...comValor.map((l) => l.valor ?? 0));
  const minhaLinha = linhas.find((l) => l.m.usuario_id === eu);
  const nome = (id: string) => (id === eu ? "você" : nomeDe(membros.find((m) => m.usuario_id === id)?.pessoa));
  const destaquesAtuais = distincoes(d, periodo);

  const controle = "h-11 w-full appearance-none rounded-[6px] border border-linha bg-transparent pr-8 pl-3 text-[14px] text-ameixa outline-none focus:border-bordo sm:h-10";

  const seletorPeriodo = (
    <label className="relative block min-w-0 flex-1 sm:flex-none">
      <span className="sr-only">Selecionar período</span>
      <select value={periodoId} onChange={(e) => setPeriodoId(e.target.value)} className={controle}>
        <option value="mes">Este mês</option>
        <option value="ano">Este ano</option>
        <option value="geral">Geral</option>
        {periodos.slice(3).map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>
      <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-cinza">
        ▾
      </span>
    </label>
  );

  return (
    <>
      {cabecalho}
      <div className="px-4 pb-8 lg:px-0">
        {/* seções da liga */}
        <nav aria-label="the reading league" className="-mx-4 mt-4 flex gap-5 overflow-x-auto border-b border-linha px-4 [scrollbar-width:none] lg:mx-0 lg:px-0">
          {SECOES.map(([id, n]) => (
            <button key={id} type="button" aria-current={secao === id ? "page" : undefined} onClick={() => setSecao(id)} className={`min-h-11 flex-none border-b-2 text-[13.5px] whitespace-nowrap ${secao === id ? "border-bordo font-semibold text-bordo" : "border-transparent text-tinta-suave hover:text-ameixa"}`}>
              {n}
            </button>
          ))}
        </nav>

        {secao === "classificacao" ? (
          <div className="mt-5 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-12">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <label className="relative block min-w-0 flex-[2] sm:flex-none">
                  <span className="sr-only">Alterar categoria</span>
                  <select value={cat} onChange={(e) => setCat(e.target.value as Categoria)} className={`${controle} font-semibold`}>
                    {CATEGORIAS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </select>
                  <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-cinza">
                    ▾
                  </span>
                </label>
                {cat === "constancia" ? null : seletorPeriodo}
              </div>
              <p className="mt-3 text-[12px] text-cinza">
                {info.nome} · {cat === "constancia" ? "toda a história do clube" : periodo.nome}
                {!periodo.encerrado && cat !== "constancia" && periodo.id !== "geral" ? " · em andamento" : ""}
              </p>

              {comValor.length ? (
                <ol className="mt-3 border-t border-linha">
                  {linhas
                    .filter((l) => l.valor !== null && l.valor > 0)
                    .map((l) => {
                      const lider = l.posicao === 1 && !l.provisorio;
                      const sou = l.m.usuario_id === eu;
                      return (
                        <li key={l.m.usuario_id} className={`grid grid-cols-[34px_36px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-linha py-2.5 ${sou ? "bg-rosa-fundo/60" : ""}`}>
                          <span className={`text-center tabular-nums ${lider ? "font-revista text-[20px] text-bordo" : "text-[14px] text-tinta-suave"}`} aria-label={`${l.posicao}º lugar`}>
                            {posicaoTexto(l.posicao)}
                          </span>
                          <Avatar pessoa={l.m.pessoa} tamanho={36} />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-[14px] font-semibold text-ameixa">{nome(l.m.usuario_id)}</span>
                              {lider ? (
                                <span className="flex-none text-bordo" title="destaque do período">
                                  <EmblemaLiga tamanho={15} />
                                </span>
                              ) : null}
                              {l.provisorio ? <span className="flex-none rounded-[3px] border border-linha px-1 text-[10px] text-cinza">provisório</span> : null}
                            </span>
                            {l.detalhe ? <span className="block truncate text-[11px] text-cinza">{l.detalhe}</span> : null}
                            {cat !== "indicacoes" && comValor.length > 1 ? (
                              <span aria-hidden className="mt-1.5 block h-[3px] overflow-hidden rounded-full bg-linha">
                                <span className="block h-full rounded-full bg-bordo/70" style={{ width: `${((l.valor ?? 0) / maior) * 100}%` }} />
                              </span>
                            ) : null}
                          </span>
                          <span className="text-right">
                            <span className="block text-[15px] font-semibold text-ameixa tabular-nums">{valorTexto(cat, l.valor!)}</span>
                            <span className="block text-[11px] text-cinza">{info.unidade(l.valor!)}</span>
                          </span>
                        </li>
                      );
                    })}
                </ol>
              ) : (
                <p className="mt-4 rounded-[6px] border border-dashed border-bege px-4 py-5 text-[14px] text-tinta-suave">
                  A classificação ficará disponível conforme as leituras do clube forem registradas{cat !== "constancia" ? " neste período" : ""}.
                </p>
              )}
              {minhaLinha && !(minhaLinha.valor && minhaLinha.valor > 0) && comValor.length ? (
                <p className="mt-3 text-[12px] text-cinza">Sua posição: ainda sem registros nesta categoria{cat !== "constancia" ? " no período" : ""}.</p>
              ) : null}

              <button type="button" aria-expanded={metodo} onClick={() => setMetodo((v) => !v)} className="mt-4 min-h-10 text-[13px] font-semibold text-bordo">
                {metodo ? "fechar" : "Como calculamos"}
              </button>
              {metodo ? <p className="max-w-[60ch] border-l-2 border-linha pl-3 text-[13px] leading-relaxed text-tinta-suave">{info.metodo}</p> : null}
            </div>

            {/* destaques do período */}
            <aside className="mt-8 lg:mt-0">
              <p className="text-[12px] font-semibold tracking-[.12em] text-cinza uppercase">Destaques do período</p>
              {destaquesAtuais.length ? (
                <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-1">
                  {destaquesAtuais.map((x) => (
                    <li key={x.id} className="flex items-center gap-3 border-b border-linha pb-3">
                      <Insignia tipo={x.id} tamanho={42} />
                      <span className="min-w-0">
                        <span className="block font-revista text-[15px] leading-tight text-ameixa">{x.nome}</span>
                        <span className="block truncate text-[12px] text-tinta-suave">{x.vencedores.map((v) => nome(v.m.usuario_id)).join(", ")}</span>
                        <span className="block text-[10px] text-cinza">{periodo.encerrado ? "distinção conquistada" : "destaque atual"}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[13px] text-cinza">Ainda sem destaques neste período.</p>
              )}
            </aside>
          </div>
        ) : null}

        {secao === "curators" ? <Curadoria d={d} periodo={periodo} seletor={seletorPeriodo} nome={nome} base={base} /> : null}

        {secao === "distincoes" ? (
          <div className="mt-5">
            <div className="flex flex-wrap gap-2">{seletorPeriodo}</div>
            <p className="mt-3 text-[12px] text-cinza">{periodo.nome}</p>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4">
              {DISTINCOES.map((x) => {
                const ganhou = destaquesAtuais.find((y) => y.id === x.id);
                return (
                  <li key={x.id} className="flex flex-col items-center text-center">
                    <Insignia tipo={x.id} tamanho={70} apagada={!ganhou} />
                    <span className="mt-2 font-revista text-[16px] leading-tight text-ameixa">{x.nome}</span>
                    <span className="text-[11px] text-cinza">{x.descricao}</span>
                    <span className="mt-1 text-[12px] font-semibold text-bordo">{ganhou ? ganhou.vencedores.map((v) => nome(v.m.usuario_id)).join(", ") : "sem destaque ainda"}</span>
                    {ganhou ? <span className="text-[10px] text-cinza">{periodo.encerrado ? "conquistada" : "destaque atual"}{ganhou.vencedores.length > 1 ? " · compartilhada" : ""}</span> : null}
                  </li>
                );
              })}
            </ul>
            <p className="mt-6 max-w-[60ch] text-[12px] text-cinza">
              The familiar face (encontros) e the wild card (expectativas) chegam quando a agenda registrar presença de verdade e as fichas tiverem expectativa antes da leitura. Não mostramos distinções sem dados.
            </p>
          </div>
        ) : null}

        {secao === "hall" ? <HallOfFame d={d} anteriores={anteriores} nome={nome} membros={membros} /> : null}

        {secao === "together" ? (
          <Together d={d} nome={nome} celula={celula} setCelula={setCelula} />
        ) : null}
      </div>
    </>
  );
}

/* ───────── the curators ───────── */
function Curadoria({ d, periodo, seletor, nome, base }: { d: Dados; periodo: Periodo; seletor: React.ReactNode; nome: (id: string) => string; base: string }) {
  const linhas = classificacao(d, "indicacoes", periodo).filter((l) => l.valor !== null);
  const destaques = destaquesIndicacoes(d, periodo);
  const escolhidas = d.livros.filter((l) => l.sugerido_por && !l.livro.historico && l.estado !== "sugerido").length;
  return (
    <div className="mt-5">
      <p className="font-revista text-[21px] text-ameixa">the curators.</p>
      <p className="mt-1 text-[13px] text-cinza">Indicações mais bem avaliadas pelo clube.</p>
      <div className="mt-3 flex flex-wrap gap-2">{seletor}</div>
      {linhas.length ? (
        <ol className="mt-4 border-t border-linha">
          {linhas.map((l) => (
            <li key={l.m.usuario_id} className="grid grid-cols-[34px_36px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-linha py-2.5">
              <span className="text-center text-[14px] text-tinta-suave tabular-nums">{posicaoTexto(l.posicao)}</span>
              <Avatar pessoa={l.m.pessoa} tamanho={36} />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[14px] font-semibold text-ameixa">{nome(l.m.usuario_id)}</span>
                  {l.provisorio ? <span className="rounded-[3px] border border-linha px-1 text-[10px] text-cinza">provisório</span> : null}
                </span>
                <span className="block truncate text-[11px] text-cinza">{l.detalhe}</span>
              </span>
              <span className="text-right">
                <span className="block text-[15px] font-semibold text-ameixa tabular-nums">{virgula(l.valor!)}</span>
                <span className="block text-[11px] text-cinza">média</span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 rounded-[6px] border border-dashed border-bege px-4 py-5 text-[14px] text-tinta-suave">
          Ainda não há indicações com notas suficientes neste período. Cada livro precisa de pelo menos 2 notas do clube.
        </p>
      )}
      {destaques ? (
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex gap-3">
            <Link href={`${base}/livro/${destaques.melhor.l.id}`} className="w-12 flex-none">
              <CapaAuto livro={destaques.melhor.l.livro} className="w-full [&>span:last-child]:hidden" />
            </Link>
            <div className="min-w-0">
              <dt className="text-[11px] font-semibold tracking-[.12em] text-cinza uppercase">Indicação mais bem avaliada</dt>
              <dd className="mt-0.5 truncate font-revista text-[16px] text-ameixa">{destaques.melhor.l.livro.titulo}</dd>
              <dd className="text-[12px] text-tinta-suave">
                {virgula(destaques.melhor.nc.media)} de média ({destaques.melhor.nc.n} notas) · indicada por {nome(destaques.melhor.l.sugerido_por!)}
              </dd>
            </div>
          </div>
          {destaques.divisiva ? (
            <div className="flex gap-3">
              <Link href={`${base}/livro/${destaques.divisiva.l.id}`} className="w-12 flex-none">
                <CapaAuto livro={destaques.divisiva.l.livro} className="w-full [&>span:last-child]:hidden" />
              </Link>
              <div className="min-w-0">
                <dt className="text-[11px] font-semibold tracking-[.12em] text-cinza uppercase">Indicação mais divisiva</dt>
                <dd className="mt-0.5 truncate font-revista text-[16px] text-ameixa">{destaques.divisiva.l.livro.titulo}</dd>
                <dd className="text-[12px] text-tinta-suave">notas de {virgula(Math.min(...destaques.divisiva.nc.notas))} a {virgula(Math.max(...destaques.divisiva.nc.notas))}: opiniões bem diferentes</dd>
              </div>
            </div>
          ) : null}
          <div>
            <dt className="text-[11px] font-semibold tracking-[.12em] text-cinza uppercase">Indicações escolhidas</dt>
            <dd className="mt-0.5 font-revista text-[22px] text-ameixa">{escolhidas}</dd>
            <dd className="text-[12px] text-cinza">em toda a história do clube, com registro de quem indicou</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}

/* ───────── hall of fame ───────── */
function HallOfFame({ d, anteriores, nome, membros }: { d: Dados; anteriores: ReturnType<typeof periodosComDados>; nome: (id: string) => string; membros: Dados["membros"] }) {
  // só períodos encerrados viram distinção conquistada (sempre calculada dos registros: não duplica)
  const anos = anteriores.anos.filter((p) => p.encerrado);
  const meses = anteriores.meses.filter((p) => p.encerrado);
  const blocos = [...anos.map((p) => ({ p, tipo: "ano" as const })), ...meses.map((p) => ({ p, tipo: "mês" as const }))]
    .map((x) => ({ ...x, ds: distincoes(d, x.p) }))
    .filter((x) => x.ds.length);
  if (!blocos.length)
    return (
      <div className="mt-5">
        <p className="font-revista text-[21px] text-ameixa">hall of fame.</p>
        <p className="mt-3 rounded-[6px] border border-dashed border-bege px-4 py-5 text-[14px] text-tinta-suave">As distinções entram aqui quando um mês ou um ano termina com destaques do clube.</p>
      </div>
    );
  return (
    <div className="mt-5">
      <p className="font-revista text-[21px] text-ameixa">hall of fame.</p>
      <p className="mt-1 text-[13px] text-cinza">As distinções conquistadas ao longo da história do clube.</p>
      <div className="mt-4 space-y-6">
        {blocos.map(({ p, tipo, ds }) => (
          <section key={p.id}>
            <h3 className="border-b border-linha pb-1.5 text-[13px] font-semibold text-tinta-suave">
              {p.nome} <span className="font-normal text-cinza">· {tipo}</span>
            </h3>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {ds.map((x) =>
                x.vencedores.map((v) => (
                  <li key={`${x.id}-${v.m.usuario_id}`} className="flex items-center gap-3">
                    <Insignia tipo={x.id} tamanho={40} />
                    <Avatar pessoa={membros.find((m) => m.usuario_id === v.m.usuario_id)?.pessoa ?? v.m.pessoa} tamanho={28} />
                    <span className="min-w-0">
                      <span className="block font-revista text-[15px] leading-tight text-ameixa">{x.nome}</span>
                      <span className="block truncate text-[12px] text-tinta-suave">
                        {nome(v.m.usuario_id)} · {valorTexto(x.categoria, v.valor!)} {CATEGORIAS.find((c) => c.id === x.categoria)!.unidade(v.valor!)}
                      </span>
                    </span>
                  </li>
                )),
              )}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

/* ───────── reading together ───────── */
const ESTADOS: Record<EstadoCelula, { simbolo: string; nome: string; classe: string }> = {
  prazo: { simbolo: "✓", nome: "concluído no prazo", classe: "bg-bordo text-creme" },
  concluido: { simbolo: "✓", nome: "concluído", classe: "bg-bordo/80 text-creme" },
  atrasado: { simbolo: "◐", nome: "concluído após o prazo", classe: "bg-rosa-claro text-ameixa" },
  lendo: { simbolo: "…", nome: "em andamento", classe: "border border-bordo text-bordo" },
  nao: { simbolo: "–", nome: "não participou", classe: "bg-linha text-tinta-suave" },
  sem: { simbolo: "", nome: "sem registro", classe: "border border-dashed border-bege" },
  inelegivel: { simbolo: "·", nome: "antes de entrar no clube", classe: "text-cinza" },
};

function Together({ d, nome, celula, setCelula }: { d: Dados; nome: (id: string) => string; celula: { m: string; l: string } | null; setCelula: (c: { m: string; l: string } | null) => void }) {
  const { leituras, linhas } = matriz(d);
  if (!leituras.length) return <p className="mt-5 text-[14px] text-cinza">As leituras do clube aparecem aqui quando a primeira começar.</p>;
  const sel = celula ? { m: d.membros.find((m) => m.usuario_id === celula.m), l: leituras.find((l) => l.id === celula.l) } : null;
  const estadoSel = sel?.m && sel.l ? linhas.find((x) => x.m.usuario_id === sel.m!.usuario_id)?.celulas[leituras.indexOf(sel.l)] : null;
  return (
    <div className="mt-5">
      <p className="font-revista text-[21px] text-ameixa">reading together.</p>
      <p className="mt-1 text-[13px] text-cinza">Quem acompanhou cada leitura do clube (as {leituras.length} mais recentes).</p>
      {/* a rolagem horizontal fica só dentro da matriz */}
      <div className="mt-4 max-w-full overflow-x-auto pb-2">
        <table className="border-separate border-spacing-1 text-[12px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-creme" />
              {leituras.map((l) => (
                <th key={l.id} scope="col" className="w-9 align-bottom font-normal" title={l.livro.titulo}>
                  <span className="block w-9">
                    <CapaAuto livro={l.livro} className="w-full [&>span:last-child]:hidden" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((x) => (
              <tr key={x.m.usuario_id}>
                <th scope="row" className="sticky left-0 z-10 max-w-[110px] truncate bg-creme pr-2 text-left font-semibold text-ameixa">
                  {nome(x.m.usuario_id)}
                </th>
                {x.celulas.map((c, i) => (
                  <td key={leituras[i].id}>
                    <button
                      type="button"
                      onClick={() => setCelula({ m: x.m.usuario_id, l: leituras[i].id })}
                      aria-label={`${nome(x.m.usuario_id)}, ${leituras[i].livro.titulo}: ${ESTADOS[c].nome}`}
                      className={`grid size-9 place-items-center rounded-[4px] text-[13px] font-semibold ${ESTADOS[c].classe}`}
                    >
                      {ESTADOS[c].simbolo}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sel?.m && sel.l && estadoSel ? (
        <p role="status" className="mt-2 text-[13px] text-tinta-suave">
          <b className="font-semibold text-ameixa">{nome(sel.m.usuario_id)}</b> · {sel.l.livro.titulo} · {ESTADOS[estadoSel].nome}
          {sel.l.prazo ? ` · prazo ${new Date(sel.l.prazo).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")}` : ""}
        </p>
      ) : null}
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-tinta-suave">
        {(Object.keys(ESTADOS) as EstadoCelula[]).map((k) => (
          <li key={k} className="flex items-center gap-1.5">
            <span className={`grid size-5 place-items-center rounded-[3px] text-[10px] font-semibold ${ESTADOS[k].classe}`}>{ESTADOS[k].simbolo}</span>
            {ESTADOS[k].nome}
          </li>
        ))}
      </ul>
    </div>
  );
}
