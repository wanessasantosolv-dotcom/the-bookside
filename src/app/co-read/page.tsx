"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CabecalhoTogether } from "@/components/comunidade/Together";
import { CapaLivro } from "@/components/CapaLivro";
import { ComConta, ErroOuFalta } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { botaoPrincipal } from "@/components/coread/Convite";
import { ConviteEnviado, ConviteRecebido } from "@/components/coread/Convites";
import {
  COR,
  Carimbo,
  ESTILOS,
  Envelope,
  MarcadorLeitora,
  Marcadores,
  coresDasLeitoras,
  estiloDe,
  ordemDasLeitoras,
} from "@/components/coread/Marca";
import {
  type Coread,
  dataCurta,
  diasAte,
  emComum,
  encerrada,
  concluidaPorTodas,
  fimDe,
  naLeitura,
  pctDe,
  totalDe,
  ultimaAtividade,
} from "@/components/coread/calculos";
import { corDoLivro } from "@/lib/cores";
import {
  aceitarConvite,
  entrarComCodigo,
  minhasLeiturasJuntas,
  recadosGuardados,
  recadosRecentes,
  recusarConvite,
  vistoEm,
} from "@/lib/lerjunto";
import { nomeDe, pessoasPorId, quandoFoi, useConsulta, useMeuId, type PessoaResumo } from "@/lib/social";

type Aba = "andamento" | "convites" | "nossas";
const ABAS: { id: Aba; nome: string }[] = [
  { id: "andamento", nome: "em andamento" },
  { id: "convites", nome: "convites" },
  { id: "nossas", nome: "nossas leituras" },
];

/* ───────── cartão de uma leitura em andamento ───────── */
function CartaoLeitura({
  l,
  eu,
  mensagens,
  novas,
  destaque,
}: {
  l: Coread;
  eu: string | null;
  mensagens: { criado_em: string }[];
  novas: number;
  destaque?: boolean;
}) {
  const e = ESTILOS[estiloDe(l)];
  const total = totalDe(l);
  const cores = coresDasLeitoras(l.pessoas);
  const gente = ordemDasLeitoras(naLeitura(l));
  const mostrar = gente.slice(0, destaque ? 6 : 4);
  const comum = emComum(l);
  const prazo = l.prazo ? diasAte(l.prazo) : null;
  return (
    <li className={destaque ? "lg:col-span-2" : ""}>
      <Link
        href={`/co-read/${l.id}`}
        className={`group relative grid gap-4 overflow-hidden rounded-[4px] p-4 transition-shadow hover:shadow-[0_14px_28px_-22px_rgba(80,25,39,.55)] sm:p-5 ${
          destaque ? "grid-cols-[96px_minmax(0,1fr)] sm:grid-cols-[150px_minmax(0,1fr)] lg:gap-8 lg:p-7" : "grid-cols-[76px_minmax(0,1fr)] sm:grid-cols-[88px_minmax(0,1fr)]"
        }`}
        style={{ background: e.fundo }}
      >
        <Marcadores
          tamanho={destaque ? 110 : 76}
          cores={[e.tinta, e.destaque]}
          linha={false}
          className="pointer-events-none absolute -right-3 -bottom-4 opacity-[.18] transition-transform duration-500 group-hover:-translate-y-1 motion-reduce:transition-none"
        />
        <CapaLivro titulo={l.livro.titulo} capa={l.livro.capa} cor={corDoLivro(l.livro.id)} className="w-full -rotate-[1.5deg] [&>span:last-child]:hidden" />
        <div className="relative min-w-0">
          <p className="font-texto text-[11px] font-medium tracking-[.06em] uppercase" style={{ color: e.tinta, opacity: 0.7 }}>
            {l.nome ? l.nome : "co-read"}
          </p>
          <h3 className={`mt-1 font-revista leading-[1.1] ${destaque ? "text-[26px] sm:text-[34px]" : "text-[21px]"}`} style={{ color: e.tinta }}>
            {l.livro.titulo}
          </h3>
          <p className="mt-0.5 truncate text-[12px] text-tinta-suave">{l.livro.autor}</p>

          {/* uma barrinha para cada leitora — nunca uma barra só somando todo mundo */}
          <ul className="mt-3.5 space-y-1.5">
            {mostrar.map((p) => {
              const cor = cores.get(p.usuario_id)!;
              const pct = pctDe(p, total);
              return (
                <li key={p.usuario_id} className="flex items-center gap-2 text-[12px]">
                  <MarcadorLeitora cor={cor} tamanho={13} />
                  <span className="w-[74px] flex-none truncate text-ameixa sm:w-[96px]">{p.usuario_id === eu ? "você" : nomeDe(p.pessoa)}</span>
                  <span className="block h-[5px] min-w-0 flex-1 rounded-full bg-white/70" aria-hidden>
                    <span className="block h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: cor }} />
                  </span>
                  <span className="w-[54px] flex-none text-right tabular-nums text-tinta-suave">
                    {p.terminou ? "concluiu" : p.estado === "pausou" ? "pausou" : total ? `${pct}%` : p.pagina ? `p. ${p.pagina}` : "—"}
                  </span>
                </li>
              );
            })}
            {gente.length > mostrar.length ? <li className="pl-5 text-[11px] text-cinza">+ {gente.length - mostrar.length} pessoas</li> : null}
          </ul>

          <p className="mt-3.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-tinta-suave">
            {comum && gente.length > 1 ? <span>juntas até {comum.pct}%</span> : null}
            {prazo !== null ? <span>{prazo > 0 ? `faltam ${prazo} ${prazo === 1 ? "dia" : "dias"}` : prazo === 0 ? "termina hoje" : "prazo passou"}</span> : <span>ritmo livre</span>}
            <span>mexeu {quandoFoi(ultimaAtividade(l, mensagens))}</span>
            {mensagens.length ? (
              <span>
                {mensagens.length} {mensagens.length === 1 ? "mensagem" : "mensagens"}
                {novas ? (
                  <b className="ml-1 font-semibold" style={{ color: COR.vinho }}>
                    · {novas} {novas === 1 ? "nova" : "novas"}
                  </b>
                ) : null}
              </span>
            ) : null}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold" style={{ color: e.tinta }}>
            continuar a leitura <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </Link>
    </li>
  );
}

/* ───────── nossas leituras: o acervo ───────── */
function Acervo({ lista, eu }: { lista: Coread[]; eu: string | null }) {
  const anos = useMemo(() => [...new Set(lista.map((l) => (fimDe(l) ?? l.criado_em).slice(0, 4)))].sort().reverse(), [lista]);
  const companhias = useMemo(() => {
    const m = new Map<string, PessoaResumo | null>();
    lista.forEach((l) => naLeitura(l).forEach((p) => p.usuario_id !== eu && m.set(p.usuario_id, p.pessoa)));
    return [...m.entries()];
  }, [lista, eu]);
  const [ano, setAno] = useState("");
  const [quem, setQuem] = useState("");
  const [estado, setEstado] = useState<"" | "concluidas" | "encerradas">("");
  const filtrada = lista.filter(
    (l) =>
      (!ano || (fimDe(l) ?? l.criado_em).startsWith(ano)) &&
      (!quem || l.pessoas.some((p) => p.usuario_id === quem)) &&
      (!estado || (estado === "concluidas" ? concluidaPorTodas(l) : !concluidaPorTodas(l))),
  );
  if (!lista.length)
    return (
      <Vazio frase="nossas histórias começam aqui." texto="as leituras que vocês terminarem ou encerrarem ficam guardadas aqui." />
    );
  const sel = "h-10 rounded-pill border border-linha bg-transparent px-3 text-[13px] text-ameixa focus:border-bordo focus:outline-none";
  return (
    <section aria-labelledby="t-acervo">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="t-acervo" className="font-revista text-[24px] text-bordo italic">
          histórias que compartilhamos
        </h2>
        {lista.length > 3 ? (
          <div className="flex flex-wrap gap-2">
            {anos.length > 1 ? (
              <select aria-label="ano" value={ano} onChange={(e) => setAno(e.target.value)} className={sel}>
                <option value="">todos os anos</option>
                {anos.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            ) : null}
            {companhias.length > 1 ? (
              <select aria-label="com quem" value={quem} onChange={(e) => setQuem(e.target.value)} className={sel}>
                <option value="">com todo mundo</option>
                {companhias.map(([id, p]) => (
                  <option key={id} value={id}>
                    com {nomeDe(p)}
                  </option>
                ))}
              </select>
            ) : null}
            <select aria-label="estado" value={estado} onChange={(e) => setEstado(e.target.value as typeof estado)} className={sel}>
              <option value="">concluídas e encerradas</option>
              <option value="concluidas">concluídas</option>
              <option value="encerradas">encerradas</option>
            </select>
          </div>
        ) : null}
      </div>
      <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-5">
        {filtrada.map((l, i) => {
          const juntas = concluidaPorTodas(l);
          const fim = fimDe(l);
          const gente = naLeitura(l);
          return (
            <li key={l.id}>
              <Link href={`/co-read/${l.id}`} className="group block">
                <div className="relative px-2 pt-2">
                  <CapaLivro
                    titulo={l.livro.titulo}
                    capa={l.livro.capa}
                    cor={corDoLivro(l.livro.id)}
                    className={`w-full transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none ${i % 2 ? "rotate-[1.2deg]" : "-rotate-[1.2deg]"} ${juntas ? "" : "saturate-[.55]"} [&>span:last-child]:hidden`}
                  />
                  {juntas ? (
                    <Carimbo texto="we read it together" sub="juntas" tamanho={70} className="absolute -right-2 -bottom-3 rotate-[-14deg] drop-shadow-[0_1px_0_rgba(248,243,233,.9)]" />
                  ) : null}
                </div>
                <p className="mt-3 line-clamp-2 font-revista text-[16px] leading-tight text-ameixa italic group-hover:underline">{l.livro.titulo}</p>
                <p className="mt-1 flex items-center gap-1">
                  {gente.slice(0, 4).map((p) => (
                    <Avatar key={p.usuario_id} pessoa={p.pessoa} tamanho={18} />
                  ))}
                </p>
                <p className="mt-1 text-[11px] text-tinta-suave">
                  {dataCurta(l.inicio ?? l.criado_em)}
                  {fim ? ` – ${dataCurta(fim)}` : ""} · {juntas ? "concluída" : "encerrada"}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
      {!filtrada.length ? <p className="mt-6 font-accent text-sm text-cinza italic">nada com esses filtros.</p> : null}
    </section>
  );
}

function Vazio({ frase, texto, acao = false }: { frase: string; texto: string; acao?: boolean }) {
  return (
    <div className="flex flex-col items-center border-y border-linha px-6 py-12 text-center lg:border-fio">
      <Envelope tamanho={76} />
      <p className="mt-4 font-revista text-[24px] text-bordo italic">{frase}</p>
      <p className="mt-1.5 max-w-[380px] text-[14px] text-tinta-suave">{texto}</p>
      {acao ? (
        <Link href="/co-read/novo" className={`${botaoPrincipal} mt-5`}>
          + novo co-read
        </Link>
      ) : null}
    </div>
  );
}

/* ───────── a página ───────── */
function Conteudo() {
  const eu = useMeuId();
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("andamento");
  const [codigo, setCodigo] = useState("");
  const [erroCodigo, setErroCodigo] = useState<string | null>(null);

  useEffect(() => {
    const ler = () => {
      const q = new URLSearchParams(window.location.search);
      const a = q.get("aba");
      const c = q.get("codigo");
      if (c) {
        setCodigo(c.toUpperCase().slice(0, 6));
        setAba("convites");
      } else setAba(a === "convites" || a === "nossas" ? a : "andamento");
    };
    ler();
    window.addEventListener("popstate", ler);
    return () => window.removeEventListener("popstate", ler);
  }, []);
  function irPara(a: Aba) {
    setAba(a);
    const u = new URL(window.location.href);
    if (a === "andamento") u.searchParams.delete("aba");
    else u.searchParams.set("aba", a);
    u.searchParams.delete("codigo");
    window.history.pushState(null, "", u);
  }

  const consulta = useConsulta(async () => {
    const lista = (await minhasLeiturasJuntas()) as Coread[];
    const ids = lista.map((l) => l.id);
    const [msgs, convidantes] = await Promise.all([
      recadosRecentes(ids).catch(() => []),
      pessoasPorId(lista.flatMap((l) => [l.criado_por, ...l.pessoas.map((p) => p.convidada_por ?? "")]).filter(Boolean)),
    ]);
    return { lista, msgs, convidantes };
  }, []);

  const dados = consulta.dados;
  const lista = dados?.lista ?? [];
  const minha = (l: Coread) => l.pessoas.find((p) => p.usuario_id === eu);
  const recebidos = lista.filter((l) => minha(l)?.estado === "convidada" && !l.encerrada_em);
  const doGrupo = lista.filter((l) => minha(l) && minha(l)!.estado !== "convidada");
  const andamento = doGrupo.filter((l) => !encerrada(l));
  const nossas = doGrupo.filter((l) => encerrada(l));
  const enviados = andamento.filter((l) => l.pessoas.some((p) => p.estado === "convidada"));

  // mensagens esperando (só o número) nas leituras em andamento
  const guardadas = useConsulta(
    async () => {
      const r = await Promise.all(andamento.map(async (l) => [l.id, (await recadosGuardados(l.id)).reduce((s, x) => s + x.quantas, 0)] as const));
      return new Map(r);
    },
    [andamento.map((l) => l.id).join(",")],
  );

  async function entrar() {
    setErroCodigo(null);
    try {
      const id = await entrarComCodigo(codigo);
      if (!id) return setErroCodigo("esse código não existe ou a leitura já foi encerrada.");
      router.push(`/co-read/${id}`);
    } catch {
      setErroCodigo("não deu para entrar agora. tente de novo.");
    }
  }

  const msgsDe = (id: string) => (dados?.msgs ?? []).filter((m) => m.leitura_id === id);
  const novasDe = (id: string) => {
    const visto = vistoEm(id);
    return msgsDe(id).filter((m) => m.autor !== eu && (!visto || m.criado_em > visto)).length;
  };

  // prévia do que aconteceu (sem revelar nada protegido)
  const avisos: { id: string; texto: string; quando: string }[] = [];
  andamento.forEach((l) => {
    const n = novasDe(l.id);
    if (n) avisos.push({ id: l.id, texto: `${n === 1 ? "nova mensagem" : `${n} novas mensagens`} em ${l.livro.titulo}`, quando: msgsDe(l.id)[0].criado_em });
    const g = guardadas.dados?.get(l.id) ?? 0;
    if (g) avisos.push({ id: l.id, texto: `${g === 1 ? "uma mensagem está esperando" : `${g} mensagens estão esperando`} por você em ${l.livro.titulo}`, quando: "" });
    l.pessoas
      .filter((p) => p.usuario_id !== eu && p.terminou && p.terminou_em && Date.now() - +new Date(p.terminou_em) < 14 * 86400000)
      .forEach((p) => avisos.push({ id: l.id, texto: `${nomeDe(p.pessoa)} concluiu ${l.livro.titulo}`, quando: p.terminou_em! }));
  });

  return (
    <>
      <div role="tablist" aria-label="co-read" className="flex gap-6 overflow-x-auto border-b border-linha [scrollbar-width:none] lg:border-fio">
        {ABAS.map((a) => {
          const n = a.id === "convites" ? recebidos.length : 0;
          return (
            <button
              key={a.id}
              role="tab"
              type="button"
              aria-selected={aba === a.id}
              onClick={() => irPara(a.id)}
              className={`-mb-px flex min-h-10 flex-none items-center gap-1.5 border-b-2 font-texto text-[13px] ${aba === a.id ? "border-bordo font-semibold text-ameixa" : "border-transparent font-medium text-cinza hover:text-ameixa"}`}
            >
              {a.nome}
              {n ? <span className="grid size-5 place-items-center rounded-full bg-bordo text-[10px] text-creme">{n}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-7">
        {consulta.erro ? (
          <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />
        ) : !dados ? (
          <p className="font-accent text-sm text-cinza italic">abrindo as leituras…</p>
        ) : aba === "andamento" ? (
          <div className="space-y-10">
            {recebidos.length ? (
              <button type="button" onClick={() => irPara("convites")} className="flex w-full items-center gap-3 border-y border-dashed border-bordo/40 py-3 text-left">
                <Envelope tamanho={34} />
                <span className="text-[14px] text-ameixa">
                  {recebidos.length === 1 ? "você tem um convite para um co-read" : `você tem ${recebidos.length} convites para co-read`}
                </span>
                <span className="ml-auto text-[13px] font-semibold text-bordo">ver →</span>
              </button>
            ) : null}
            {andamento.length ? (
              <ul className="grid gap-5 lg:grid-cols-2">
                {andamento.map((l) => (
                  <CartaoLeitura key={l.id} l={l} eu={eu} mensagens={msgsDe(l.id)} novas={novasDe(l.id)} destaque={andamento.length === 1} />
                ))}
              </ul>
            ) : (
              <Vazio frase="good books, better company." texto="escolha um livro e convide alguém para ler com você." acao />
            )}
            {avisos.length ? (
              <section aria-labelledby="t-avisos">
                <h2 id="t-avisos" className="border-b border-linha pb-2 font-revista text-[19px] text-ameixa lg:border-fio">
                  enquanto você estava fora
                </h2>
                <ul>
                  {avisos.slice(0, 5).map((a, i) => (
                    <li key={i} className="border-b border-linha lg:border-fio">
                      <Link href={`/co-read/${a.id}?aba=conversa`} className="flex min-h-12 items-center gap-3 py-2 text-[14px] text-ameixa hover:text-bordo">
                        <MarcadorLeitora cor={COR.rosa} tamanho={14} />
                        <span className="min-w-0 flex-1">{a.texto}</span>
                        {a.quando ? <span className="flex-none text-[11px] text-cinza">{quandoFoi(a.quando)}</span> : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {nossas.length ? (
              <section aria-labelledby="t-nossas-previa">
                <div className="flex items-baseline justify-between border-b border-linha pb-2 lg:border-fio">
                  <h2 id="t-nossas-previa" className="font-revista text-[19px] text-ameixa">
                    nossas leituras
                  </h2>
                  <button type="button" onClick={() => irPara("nossas")} className="text-[13px] font-semibold text-bordo hover:underline">
                    ver todas
                  </button>
                </div>
                <ul className="mt-4 flex gap-5 overflow-x-auto pb-2 [scrollbar-width:none]">
                  {nossas.slice(0, 6).map((l, i) => (
                    <li key={l.id} className="w-[92px] flex-none sm:w-[110px]">
                      <Link href={`/co-read/${l.id}`} className="group block">
                        <span className="relative block">
                          <CapaLivro titulo={l.livro.titulo} capa={l.livro.capa} cor={corDoLivro(l.livro.id)} className={`w-full ${i % 2 ? "rotate-1" : "-rotate-1"} ${concluidaPorTodas(l) ? "" : "saturate-[.55]"} [&>span:last-child]:hidden`} />
                          {concluidaPorTodas(l) ? <Carimbo texto="we read it together" tamanho={46} className="absolute -right-2 -bottom-2 rotate-[-14deg]" /> : null}
                        </span>
                        <span className="mt-2 line-clamp-2 block text-[12px] leading-tight text-ameixa group-hover:underline">{l.livro.titulo}</span>
                        <span className="block text-[11px] text-cinza">{dataCurta(fimDe(l) ?? l.criado_em)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : aba === "convites" ? (
          <div className="space-y-10">
            <section aria-labelledby="t-recebidos">
              <h2 id="t-recebidos" className="mb-4 font-revista text-[19px] text-ameixa">
                recebidos
              </h2>
              {recebidos.length ? (
                <ul className="grid gap-8 lg:grid-cols-2">
                  {recebidos.map((l) => {
                    const m = minha(l);
                    const quem = dados.convidantes.get(m?.convidada_por ?? l.criado_por) ?? null;
                    return <ConviteRecebido key={l.id} l={l} deQuem={quem} onMudou={consulta.recarregar} />;
                  })}
                </ul>
              ) : (
                <p className="font-accent text-[15px] text-cinza italic">nenhum convite por enquanto.</p>
              )}
            </section>
            {enviados.length ? (
              <section aria-labelledby="t-enviados">
                <h2 id="t-enviados" className="mb-4 font-revista text-[19px] text-ameixa">
                  enviados · aguardando resposta
                </h2>
                <ul className="grid gap-8 lg:grid-cols-2">
                  {enviados.map((l) => (
                    <ConviteEnviado key={l.id} l={l} eu={eu} />
                  ))}
                </ul>
              </section>
            ) : null}
            <section aria-labelledby="t-codigo" className="max-w-[460px]">
              <h2 id="t-codigo" className="font-revista text-[19px] text-ameixa">
                recebeu um código?
              </h2>
              <p className="mt-1 text-[13px] text-tinta-suave">entrar pelo código já vale como aceitar o convite.</p>
              <div className="mt-3 flex gap-2">
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="código"
                  aria-label="código do convite"
                  className="h-12 min-w-0 flex-1 rounded-[4px] border border-linha bg-transparent px-4 font-mono text-lg tracking-[.2em] uppercase outline-none focus:border-bordo"
                />
                <button type="button" onClick={entrar} disabled={codigo.length < 6} className={botaoPrincipal}>
                  entrar
                </button>
              </div>
              {erroCodigo ? <p className="mt-2 text-[13px] text-bordo">{erroCodigo}</p> : null}
            </section>
          </div>
        ) : (
          <Acervo lista={nossas} eu={eu} />
        )}
      </div>
    </>
  );
}

export default function CoreadPage() {
  return (
    <AppShell aba="clubes">
      <div className="flex flex-1 flex-col px-5 pt-2 pb-10 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="mx-auto w-full max-w-[1200px] lg:mx-0">
          <CabecalhoTogether ativo="coread" />
          {/* cabeçalho da experiência: o seletor acima já diz que é o co-read */}
          <div className="mb-3 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-revista text-[22px] leading-none text-ameixa lg:text-[26px]">lendo juntos</h2>
              <p className="mt-1 font-texto text-[12px] text-cinza">different bookmarks, same story.</p>
            </div>
            <Link href="/co-read/novo" className={botaoPrincipal}>
              + novo co-read
            </Link>
          </div>
          <ComConta>
            <Conteudo />
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
