"use client";

import { useEntrelinhas } from "@/lib/entrelinhas-store";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CapaAuto } from "@/components/CapaAuto";
import { CapaLivro } from "@/components/CapaLivro";
import { CapaJournal } from "@/components/journal/Revista";
import { useEdicao } from "@/components/journal/useEdicao";
import { Avatar } from "@/components/social/Pessoas";
import { lembrarLivros } from "@/lib/catalogo";
import { sincronizarProgressoNosCoreads, minhasLeiturasJuntas } from "@/lib/lerjunto";
import { andamento, encontrosDe, meusClubes, type Encontro, type ResumoClube } from "@/lib/clubes";
import { corDoLivro } from "@/lib/cores";
import { estrelas, lidosNoAno } from "@/lib/estantes";
import { useIndicacoes } from "@/lib/indicacoes";
import { edicaoEmDestaque, paletaDoMes } from "@/lib/journal";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";
import {
  feedDeAmigas,
  nomeDe,
  pessoasPorId,
  quandoFoi,
  useConsulta,
  useMeuId,
  verbo,
  type Atividade,
  type PessoaResumo,
} from "@/lib/social";

/*
 * As seções do início. Web e celular usam os mesmos componentes e os mesmos
 * dados; muda só a composição (breakpoint lg).
 */

// ───────── peças comuns ─────────

export function Cabecalho({ titulo, acao, id }: { titulo: string; acao?: { href: string; rotulo: string; tour?: string }; id?: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-linha pb-2 lg:border-fio">
      <h2 id={id} className="font-revista text-[22px] leading-none text-ameixa italic lg:text-[24px]">
        {titulo}
      </h2>
      {acao ? (
        <Link href={acao.href} data-tour={acao.tour} className="flex min-h-9 items-center text-[12px] font-semibold text-bordo hover:underline">
          {acao.rotulo} <span aria-hidden className="ml-1">→</span>
        </Link>
      ) : null}
    </div>
  );
}

const pct = (l: LivroSalvo) =>
  l.paginas && l.paginaAtual ? Math.min(100, Math.round((l.paginaAtual / l.paginas) * 100)) : null;

function Barra({ valor, className = "" }: { valor: number; className?: string }) {
  return (
    <span className={`block h-[4px] rounded-full bg-linha ${className}`} aria-hidden>
      <span className="block h-full rounded-full bg-progresso" style={{ width: `${Math.max(2, Math.min(100, valor))}%` }} />
    </span>
  );
}

// ───────── saudação ─────────

export function saudacao(hora = new Date().getHours()) {
  if (hora < 5) return "boa noite";
  if (hora < 12) return "bom dia";
  if (hora < 18) return "boa tarde";
  return "boa noite";
}

// ───────── quote do dia ─────────

// ───────── lendo agora ─────────

function CartaoLeitura({ l, junto, grande }: { l: LivroSalvo; junto?: { nomes: string; id: string }; grande?: boolean }) {
  const p = pct(l);
  return (
    <article className="flex gap-4">
      <Link href={`/livro/${l.id}`} className={`flex-none ${grande ? "w-[96px]" : "w-[68px]"}`}>
        <CapaLivro titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className="w-full [&>span:last-child]:hidden" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link href={`/livro/${l.id}`} className="line-clamp-2 font-revista text-[18px] leading-[1.15] text-ameixa hover:text-bordo">
          {l.titulo}
        </Link>
        <span className="mt-0.5 truncate text-[12px] text-cinza">{l.autor}</span>
        {junto ? (
          <Link href={`/co-read/${junto.id}`} className="mt-1 truncate text-[11px] text-bordo hover:underline">
            co-read com {junto.nomes} →
          </Link>
        ) : null}
        <div className="mt-auto pt-2.5">
          {p !== null ? (
            <>
              <span className="flex items-baseline justify-between text-[11px] text-tinta-suave tabular-nums">
                <span>
                  {l.paginaAtual} de {l.paginas} págs.
                </span>
                <b className="font-semibold text-bordo">{p}%</b>
              </span>
              <Barra valor={p} className="mt-1.5" />
            </>
          ) : (
            <span className="text-[11px] text-cinza">sem progresso registrado</span>
          )}
          <RegistrarAqui l={l} />
        </div>
      </div>
    </article>
  );
}

/** registrar a página ali mesmo, sem sair do início (estante, co-reads e clubes acompanham pela sincronização de sempre) */
function RegistrarAqui({ l }: { l: LivroSalvo }) {
  const editarLivro = usePerfil((s) => s.editarLivro);
  const [aberto, setAberto] = useState(false);
  const [pagina, setPagina] = useState(l.paginaAtual ?? 0);
  const [total, setTotal] = useState(l.paginas ?? 0);
  const [feito, setFeito] = useState(false);
  function salvar(terminou: boolean) {
    const p = terminou ? total || pagina : pagina;
    const agora = new Date().toISOString();
    editarLivro(
      { id: l.id, titulo: l.titulo, autor: l.autor, capa: l.capa, genero: l.genero },
      { status: terminou ? "lido" : "lendo", paginaAtual: p, paginas: total || undefined, ...(terminou ? { lidoEm: agora } : {}) },
    );
    void sincronizarProgressoNosCoreads({ id: l.id, titulo: l.titulo, paginas: total || undefined }, p, terminou).catch(() => null);
    setAberto(false);
    setFeito(true);
    setTimeout(() => setFeito(false), 2200);
  }
  if (!aberto)
    return (
      <span className="mt-3 flex items-center gap-3">
        <button type="button" onClick={() => setAberto(true)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-bordo px-3.5 text-[12px] font-semibold text-bordo hover:bg-bordo/5">
          <svg aria-hidden width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          registrar leitura
        </button>
        {feito ? <span role="status" className="text-[11px] text-progresso-tinta">salvo ✓</span> : null}
      </span>
    );
  return (
    <div className="mt-3 rounded-[6px] border border-linha bg-creme-quente p-3">
      <label className="flex flex-wrap items-center gap-2 text-[12px] text-tinta-suave">
        página
        <input type="number" inputMode="numeric" min={0} max={total || undefined} value={pagina || ""} onChange={(e) => setPagina(Math.max(0, Math.min(total || 99999, Number(e.target.value) || 0)))} className="h-10 w-20 rounded-[6px] border border-bege bg-creme px-2 text-[15px] text-ameixa outline-none focus:border-bordo" autoFocus />
        de
        {l.paginas ? (
          <b className="font-semibold text-ameixa">{l.paginas}</b>
        ) : (
          <input type="number" inputMode="numeric" min={1} placeholder="total" value={total || ""} onChange={(e) => setTotal(Math.max(0, Number(e.target.value) || 0))} className="h-10 w-20 rounded-[6px] border border-bege bg-creme px-2 text-[15px] text-ameixa outline-none focus:border-bordo" />
        )}
      </label>
      {total ? <input type="range" min={0} max={total} value={pagina} onChange={(e) => setPagina(Number(e.target.value))} aria-label="página atual" className="mt-2 w-full accent-[var(--color-bordo)]" /> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" onClick={() => salvar(false)} className="h-9 rounded-[6px] bg-bordo px-3 text-[12px] font-semibold text-creme">
          Salvar
        </button>
        <button type="button" onClick={() => salvar(true)} className="h-9 rounded-[6px] border border-bege px-3 text-[12px] font-semibold text-ameixa">
          Terminei
        </button>
        <button type="button" onClick={() => setAberto(false)} className="h-9 px-2 text-[12px] text-cinza">
          cancelar
        </button>
      </div>
    </div>
  );
}

export function LendoAgoraHome() {
  const livros = usePerfil((s) => s.livros);
  const eu = useMeuId();
  const juntas = useConsulta(() => minhasLeiturasJuntas().catch(() => []), []);
  const trilho = useRef<HTMLUListElement>(null);
  const [atual, setAtual] = useState(0);
  const lendo = livros
    .filter((l) => l.status === "lendo")
    .sort((a, b) => (b.iniciadoEm ?? b.adicionadoEm ?? "").localeCompare(a.iniciadoEm ?? a.adicionadoEm ?? ""));
  // lendo em companhia: o co-read do mesmo livro (só quem já aceitou o convite)
  const junto = new Map<string, { nomes: string; id: string }>();
  for (const j of juntas.dados ?? []) {
    if (j.encerrada_em || j.pessoas.find((p) => p.usuario_id === eu)?.estado === "convidada") continue;
    const outras = j.pessoas.filter((p) => p.usuario_id !== eu && p.estado !== "convidada");
    if (outras.length) junto.set(j.livro.id, { nomes: outras.map((p) => nomeDe(p.pessoa)).join(", "), id: j.id });
  }
  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const medir = () => setAtual(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
    el.addEventListener("scroll", medir, { passive: true });
    return () => el.removeEventListener("scroll", medir);
  }, [lendo.length]);

  return (
    <section aria-labelledby="titulo-lendo" data-tour="lendo">
      <Cabecalho id="titulo-lendo" titulo="lendo agora" acao={lendo.length ? { href: "/estantes/lendo", rotulo: "todas" } : undefined} />
      {!lendo.length ? (
        <p className="text-[14px] text-tinta-suave">
          nenhuma leitura em andamento.{" "}
          <Link href="/buscar" className="font-semibold text-bordo hover:underline">
            começar um livro
          </Link>
        </p>
      ) : (
        <>
          {/* computador: dois ou três lado a lado; mais que isso, rolagem */}
          <ul className="hidden snap-x gap-8 overflow-x-auto pb-1 [scrollbar-width:thin] lg:flex">
            {lendo.map((l) => (
              <li key={l.id} className={`flex-none snap-start ${lendo.length === 1 ? "w-full max-w-[520px]" : "w-[calc(50%-16px)] min-w-[300px]"}`}>
                <CartaoLeitura l={l} junto={junto.get(l.id)} grande={lendo.length === 1} />
              </li>
            ))}
          </ul>
          {/* celular: um por vez, com gesto e paginação discreta */}
          <ul
            ref={trilho}
            className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
          >
            {lendo.map((l) => (
              <li key={l.id} className="w-full flex-none snap-start pr-1">
                <CartaoLeitura l={l} junto={junto.get(l.id)} grande />
              </li>
            ))}
          </ul>
          {lendo.length > 1 ? (
            <div className="mt-3 flex justify-center gap-1.5 lg:hidden" aria-hidden>
              {lendo.map((l, i) => (
                <span key={l.id} className={`h-1.5 rounded-full transition-all ${i === atual ? "w-4 bg-bordo" : "w-1.5 bg-linha"}`} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

// ───────── meta de leitura ─────────

export function MetaDeLeitura({ faixa }: { faixa?: boolean }) {
  const livros = usePerfil((s) => s.livros);
  const meta = usePerfil((s) => s.meta);
  const ano = new Date().getFullYear();
  const lidos = lidosNoAno(livros, ano);
  if (!meta) {
    return (
      <Link href="/perfil/editar" className="flex items-center justify-between gap-3 border-y border-linha py-3 text-[13px] lg:border-fio">
        <span className="text-tinta-suave">meta de leitura de {ano}</span>
        <span className="font-semibold text-bordo">definir meta →</span>
      </Link>
    );
  }
  const p = Math.round((lidos / meta) * 100);
  const faltam = Math.max(0, meta - lidos);
  if (faixa) {
    // um anel pequeno, e não uma barra: assim não se confunde com o progresso do livro
    const r = 15;
    const volta = 2 * Math.PI * r;
    return (
      <Link
        href="/perfil?aba=jornada"
        className="flex min-h-[60px] items-center gap-3.5 border-y border-linha py-3"
        aria-label={`meta de ${ano}: ${lidos} de ${meta} livros. ver jornada`}
      >
        <svg aria-hidden width="38" height="38" viewBox="0 0 38 38" className="flex-none -rotate-90">
          <circle cx="19" cy="19" r={r} fill="none" stroke="var(--color-progresso-suave)" strokeWidth="3.5" />
          <circle
            cx="19"
            cy="19"
            r={r}
            fill="none"
            stroke="var(--color-progresso)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${(Math.min(100, p) / 100) * volta} ${volta}`}
          />
        </svg>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] text-ameixa">
            <b className="font-semibold tabular-nums">{lidos} de {meta}</b> livros na meta de {ano}
          </span>
          <span className="block text-[12px] text-cinza">{faltam ? `faltam ${faltam}` : "meta atingida ✦"}</span>
        </span>
        <span className="flex-none text-[12px] font-semibold text-bordo">jornada →</span>
      </Link>
    );
  }
  return (
    <section aria-labelledby="titulo-meta">
      <Cabecalho id="titulo-meta" titulo="meta de leitura" acao={{ href: "/perfil?aba=jornada", rotulo: "jornada" }} />
      <p className="flex items-baseline gap-2">
        <span className="font-revista text-[34px] leading-none text-bordo tabular-nums">
          {lidos}/{meta}
        </span>
        <span className="text-[13px] text-tinta-suave">livros · {p}%</span>
      </p>
      <span className="mt-3 block h-[5px] rounded-full bg-progresso-suave" aria-hidden>
        <span className="block h-full rounded-full bg-progresso" style={{ width: `${Math.max(2, Math.min(100, p))}%` }} />
      </span>
      <p className="mt-2 text-[12px] text-cinza">{faltam ? `faltam ${faltam} para a meta de ${ano}` : `meta de ${ano} atingida ✦`}</p>
    </section>
  );
}

// ───────── entre leitores ─────────

function Atividade1({ a, pessoa, eu, comCapa }: { a: Atividade; pessoa: PessoaResumo | null; eu: string | null; comCapa: boolean }) {
  const perfil = pessoa?.usuario ? `/u/${pessoa.usuario}` : "#";
  const ehEncontro = a.livro.id.startsWith("encontro-");
  const livroHref = a.tipo === "clube" && a.clube ? `/clubes/${a.clube.id}` : `/livro/${a.livro.id}`;
  const curtidas = a.curtidas.length;
  const comentarios = a.comentarios[0]?.count ?? 0;
  const mostraTexto = a.texto && (a.tipo === "ficha" || a.tipo === "post" || a.tipo === "trecho" || a.tipo === "clube");
  return (
    <li className="flex gap-3 border-b border-linha py-3.5 last:border-b-0 lg:border-fio">
      <Link href={perfil} className="flex-none" aria-label={`perfil de ${nomeDe(pessoa)}`}>
        <Avatar pessoa={pessoa} tamanho={34} />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-tinta-suave">
          <Link href={perfil} className="font-semibold text-ameixa hover:text-bordo">
            {a.autor === eu ? "você" : nomeDe(pessoa)}
          </Link>{" "}
          {a.tipo === "clube" && a.clube ? <>no {a.clube.nome}: </> : <>{verbo[a.tipo]} </>}
          {!ehEncontro ? (
            <Link href={livroHref} onClick={() => lembrarLivros([a.livro])} className="font-revista text-[14px] text-ameixa italic hover:text-bordo">
              {a.livro.titulo}
            </Link>
          ) : null}
        </p>
        {mostraTexto ? (
          <p className={`mt-1 line-clamp-2 text-[13px] leading-snug text-cinza ${a.tipo === "trecho" ? "font-accent italic" : ""}`}>{a.texto}</p>
        ) : null}
        <p className="mt-1 flex flex-wrap items-center gap-x-2.5 text-[11px] text-cinza">
          <span>{quandoFoi(a.criado_em)}</span>
          {a.nota ? (
            <span className="text-bordo" aria-label={`nota ${a.nota}`}>
              {estrelas(Number(a.nota))}
            </span>
          ) : null}
          <Link href={`/atividade/${a.id}`} className="hover:text-bordo">
            {curtidas ? `♥ ${curtidas}` : "♡"}
            {comentarios ? ` · ${comentarios} ${comentarios === 1 ? "comentário" : "comentários"}` : " · comentar"}
          </Link>
        </p>
      </div>
      {comCapa && !ehEncontro ? (
        <Link href={livroHref} onClick={() => lembrarLivros([a.livro])} className="hidden w-[36px] flex-none lg:block" tabIndex={-1} aria-hidden>
          <CapaAuto livro={a.livro} className="w-full [&>span:last-child]:hidden" />
        </Link>
      ) : null}
    </li>
  );
}

export function EntreLeitores() {
  const eu = useMeuId();
  const feed = useConsulta(async () => {
    const atividades = (await feedDeAmigas()).slice(0, 5);
    const pessoas = await pessoasPorId(atividades.map((a) => a.autor));
    lembrarLivros(atividades.map((a) => a.livro));
    return { atividades, pessoas };
  }, []);
  const lista = feed.dados?.atividades ?? [];
  return (
    <section aria-labelledby="titulo-leitores">
      <Cabecalho id="titulo-leitores" titulo="entre leitores" acao={{ href: "/atividade", rotulo: "ver atividades" }} />
      {feed.carregando && !feed.dados ? (
        <div aria-busy className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-[6px] bg-linha/40" />
          ))}
        </div>
      ) : feed.erro ? (
        <p className="text-[13px] text-cinza">
          não deu para carregar as atividades.{" "}
          <button type="button" onClick={feed.recarregar} className="font-semibold text-bordo hover:underline">
            tentar de novo
          </button>
        </p>
      ) : !lista.length ? (
        <p className="text-[14px] text-tinta-suave">
          quando você seguir outras leitoras, as leituras delas aparecem aqui.{" "}
          <Link href="/pessoas" className="font-semibold text-bordo hover:underline">
            encontrar pessoas
          </Link>
        </p>
      ) : (
        <ul>
          {lista.map((a, i) => (
            <span key={a.id} className={i >= 3 ? "hidden lg:contents" : "contents"}>
              <Atividade1 a={a} pessoa={feed.dados!.pessoas.get(a.autor) ?? null} eu={eu} comCapa />
            </span>
          ))}
        </ul>
      )}
      <Link href="/atividade#publicar" data-tour="publicar" className="mt-3 inline-flex min-h-9 items-center text-[12px] font-semibold text-cinza hover:text-bordo">
        + publicar uma atualização
      </Link>
    </section>
  );
}

// ───────── seus clubes ─────────

type ClubeComEncontro = ResumoClube & { proximo: Encontro | null };

function dataDoEncontro(iso: string) {
  return new Date(iso)
    .toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
    .replace(/\./g, "");
}

export function SeusClubes({ limite }: { limite: number }) {
  const consulta = useConsulta(async (): Promise<ClubeComEncontro[]> => {
    const clubes = await meusClubes();
    const comEncontro = await Promise.all(
      clubes.slice(0, 4).map(async (c) => {
        const encontros = await encontrosDe(c.id).catch(() => []);
        const futuros = encontros.filter((e) => new Date(e.quando).getTime() > Date.now()).sort((a, b) => a.quando.localeCompare(b.quando));
        return { ...c, proximo: futuros[0] ?? null };
      }),
    );
    // o encontro mais próximo primeiro
    return comEncontro.sort((a, b) => (a.proximo?.quando ?? "9999").localeCompare(b.proximo?.quando ?? "9999"));
  }, []);
  const clubes = consulta.dados ?? [];
  if (consulta.carregando && !consulta.dados) return null;
  if (consulta.erro || !clubes.length) {
    return (
      <Link href="/clubes" className="flex items-center justify-between gap-3 border-y border-linha py-3 text-[13px] lg:border-fio">
        <span className="text-tinta-suave">clubes de leitura</span>
        <span className="font-semibold text-bordo">criar ou entrar →</span>
      </Link>
    );
  }
  return (
    <section aria-labelledby="titulo-clubes">
      <Cabecalho id="titulo-clubes" titulo="seus clubes" acao={{ href: "/clubes", rotulo: clubes.length > limite ? `todos (${clubes.length})` : "clubes" }} />
      <ul className="space-y-4">
        {clubes.slice(0, limite).map((c) => {
          const prazo = c.lendo ? andamento(c.lendo) : null;
          return (
            <li key={c.id}>
              <Link href={`/clubes/${c.id}`} className="group flex gap-3.5">
                <span className="w-[52px] flex-none">
                  {c.lendo ? (
                    <CapaAuto livro={c.lendo.livro} className="w-full [&>span:last-child]:hidden" />
                  ) : (
                    <span className="flex aspect-[2/3] items-center justify-center rounded-[2px] bg-rosa-fundo font-revista text-[18px] text-bordo italic">
                      {c.nome.charAt(0).toLowerCase()}
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-ameixa group-hover:text-bordo">{c.nome}</span>
                  <span className="mt-0.5 block truncate font-revista text-[15px] text-ameixa italic">
                    {c.lendo ? c.lendo.livro.titulo : "sem leitura da vez"}
                  </span>
                  <span className="mt-1 block text-[11px] text-cinza">
                    {c.proximo
                      ? `próximo encontro: ${dataDoEncontro(c.proximo.quando)}`
                      : prazo
                        ? prazo.faltam
                          ? `faltam ${prazo.faltam} dias para o prazo`
                          : "o prazo da leitura é hoje"
                        : null}
                  </span>
                  {c.sugestoes ? <span className="mt-0.5 block text-[11px] font-semibold text-bordo">votação aberta · {c.sugestoes} sugestões</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ───────── para você ─────────

export function ParaVoce() {
  const { lista, carregando } = useIndicacoes();
  const guardarLivro = usePerfil((s) => s.guardarLivro);
  const [guardados, setGuardados] = useState<Set<string>>(new Set());
  const itens = lista.slice(0, 6);
  if (carregando && !itens.length) return null;
  if (!itens.length) return null;
  return (
    <section aria-labelledby="titulo-para-voce">
      <Cabecalho id="titulo-para-voce" titulo="para você" acao={{ href: "/descobrir", rotulo: "descobrir" }} />
      <span aria-hidden className="-mt-2 mb-3 block h-[3px] w-10 rounded-full bg-descoberta" />
      <ul className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-1 [scrollbar-width:none] lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0 [&::-webkit-scrollbar]:hidden">
        {itens.map((l) => {
          const ja = guardados.has(l.id);
          return (
            <li key={l.id} className="w-[30%] min-w-[104px] flex-none snap-start lg:w-auto lg:min-w-0">
              <div className="relative">
                <Link href={`/descobrir?livro=${encodeURIComponent(l.id)}`} className="block">
                  <CapaLivro titulo={l.titulo} capa={l.capa} cor={l.cor} className="w-full [&>span:last-child]:hidden" />
                </Link>
                <button
                  type="button"
                  disabled={ja}
                  onClick={() => {
                    guardarLivro({ id: l.id, titulo: l.titulo, autor: l.autor, capa: l.capa, status: "quero" });
                    setGuardados((s) => new Set(s).add(l.id));
                  }}
                  aria-label={ja ? `${l.titulo} está no quero ler` : `adicionar ${l.titulo} ao quero ler`}
                  className="absolute right-1.5 bottom-1.5 grid size-9 place-items-center rounded-full bg-papel/95 text-descoberta-tinta shadow-sm hover:bg-papel disabled:text-progresso"
                >
                  <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={ja ? "M20 6 9 17l-5-5" : "M12 5v14M5 12h14"} />
                  </svg>
                </button>
              </div>
              <Link href={`/descobrir?livro=${encodeURIComponent(l.id)}`} className="mt-2 block">
                <span className="line-clamp-2 font-revista text-[14px] leading-tight text-ameixa">{l.titulo}</span>
                <span className="mt-0.5 block truncate text-[11px] text-cinza">{l.autor}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ───────── the bookside journal (temporário) ─────────

function JournalCartao({ chave }: { chave: string }) {
  const { edicao, textos, estado } = useEdicao(chave);
  const paleta = paletaDoMes(edicao.mes);
  return (
    // card neutro: a cor do mês fica só na capinha da edição
    <Link href={`/journal/${chave}`} className="group flex items-center gap-4 rounded-[10px] border border-linha bg-creme-quente px-4 py-4 text-ameixa hover:border-rosa-antigo">
      <span className="w-[72px] flex-none transition-transform group-hover:-rotate-1">
        <CapaJournal ed={edicao} textos={textos} paleta={paleta} tamanho="mini" previa={estado === "previa"} />
      </span>
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold tracking-[.18em] text-bordo uppercase">diário literário</span>
        <span className="mt-0.5 block font-maquina text-[10px] tracking-[.1em] text-cinza">
          vol. {String(edicao.vol).padStart(2, "0")} · {edicao.nome} {edicao.ano}
          {estado === "previa" ? " · prévia" : ""}
        </span>
        <span className="mt-2 block text-[13px] font-semibold text-bordo">abrir edição →</span>
      </span>
    </Link>
  );
}

export function JournalTemporario() {
  // só do penúltimo dia do mês até o dia 5 do seguinte
  const chave = edicaoEmDestaque();
  if (!chave) return null;
  return <JournalCartao chave={chave} />;
}

/** os atalhos que antes eram banners: discretos, no fim */
export function Atalhos({ children }: { children?: ReactNode }) {
  const carta = useEntrelinhas((s) => s.resultado);
  return (
    <nav aria-label="atalhos" className="flex flex-wrap gap-x-5 gap-y-1 text-[12px]">
      <Link href="/desafios" data-tour="desafios" className="flex min-h-9 items-center font-semibold text-cinza hover:text-bordo">
        desafios de leitura →
      </Link>
      {!carta ? (
        <Link href="/nas-entrelinhas" className="flex min-h-9 items-center font-semibold text-cinza hover:text-bordo">
          nas entrelinhas: descubra sua carta literária →
        </Link>
      ) : null}
      {children}
    </nav>
  );
}
