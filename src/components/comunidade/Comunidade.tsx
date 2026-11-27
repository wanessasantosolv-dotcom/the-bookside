"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaAuto } from "@/components/CapaAuto";
import { Emblema } from "@/components/clube/Emblema";
import { Avatares } from "@/components/clube/Pecas";
import { ComConta, ErroOuFalta } from "@/components/social/Estados";
import { andamento, encontrosDe, marcarMarca, marcarProgresso, meusClubes, modoDe, progressoDoClube, type Encontro, type Progresso, type ResumoClube } from "@/lib/clubes";
import { emblemaDe, lerIdentidade, paletaDe } from "@/lib/identidade";
import { aceitarConvite, minhasLeiturasJuntas, recusarConvite, sincronizarProgressoNosCoreads, type LeituraJunta, type PessoaNaLeitura } from "@/lib/lerjunto";
import { usePerfil } from "@/lib/perfil-store";
import { nomeDe, pessoasPorId, useConsulta, useMeuId } from "@/lib/social";

/*
 * Comunidade — entre leitores. Mistura das opções B e C:
 *  · os livros primeiro: o que você está lendo com outras pessoas (clubes e
 *    leituras a dois), com capa, progresso e atualização de página ali mesmo;
 *  · a semana entre leitores: convites, prazos e encontros dos próximos dias;
 *  · seus clubes e suas leituras compartilhadas, em listas enxutas.
 */

type LeituraComPessoas = LeituraJunta & { pessoas: PessoaNaLeitura[] };
type LivroDaLeitura = { id: string; titulo: string; autor: string; capa?: string; paginas?: number };
type Dados = {
  clubes: ResumoClube[];
  pessoas: Awaited<ReturnType<typeof pessoasPorId>>;
  encontros: (Encontro & { clube: ResumoClube })[];
  progresso: Progresso[];
  leituras: LeituraComPessoas[];
};

const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "");
const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");


export function Comunidade() {
  return (
    <AppShell aba="clubes">
      <div className="flex flex-1 flex-col px-5 pt-3 pb-12 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="mx-auto w-full max-w-[1120px]">
          <ComConta>
            <Conteudo />
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}

/** "semana de 24 a 30 de novembro" (de segunda a domingo) */
function semanaAtual() {
  const hoje = new Date();
  const ini = new Date(hoje);
  ini.setHours(0, 0, 0, 0);
  ini.setDate(ini.getDate() - ((ini.getDay() + 6) % 7));
  const fim = new Date(ini);
  fim.setDate(ini.getDate() + 6);
  fim.setHours(23, 59, 59, 999);
  const mes = (d: Date) => d.toLocaleDateString("pt-BR", { month: "long" });
  const rotulo = mes(ini) === mes(fim) ? `semana de ${ini.getDate()} a ${fim.getDate()} de ${mes(fim)}` : `semana de ${ini.getDate()} de ${mes(ini)} a ${fim.getDate()} de ${mes(fim)}`;
  return { ini, fim, rotulo };
}

const pctDe = (pagina: number | null | undefined, total: number | null | undefined, terminou?: boolean) =>
  terminou ? 100 : total && pagina ? Math.min(100, Math.round((pagina / total) * 100)) : 0;

function Conteudo() {
  const eu = useMeuId();
  const meusLivros = usePerfil((s) => s.livros);
  const consulta = useConsulta(async (): Promise<Dados> => {
    const [clubes, leituras] = await Promise.all([meusClubes(), minhasLeiturasJuntas().catch(() => [] as LeituraComPessoas[])]);
    const [pessoas, todos, progresso] = await Promise.all([
      pessoasPorId(clubes.flatMap((c) => c.membros)),
      Promise.all(clubes.map((c) => encontrosDe(c.id).catch(() => [] as Encontro[]))),
      progressoDoClube(clubes.map((c) => c.lendo?.id).filter((x): x is string => !!x)).catch(() => [] as Progresso[]),
    ]);
    const agora = new Date().toISOString();
    const encontros = clubes
      .flatMap((c, i) => todos[i].filter((e) => e.quando >= agora).map((e) => ({ ...e, clube: c })))
      .sort((a, b) => a.quando.localeCompare(b.quando));
    return { clubes, pessoas, encontros, progresso, leituras };
  }, [eu]);

  const d = consulta.dados;
  const convites = (d?.leituras ?? []).filter((l) => !l.encerrada_em && l.pessoas.some((p) => p.usuario_id === eu && p.estado === "convidada"));
  const leiturasAtivas = (d?.leituras ?? []).filter((l) => !l.encerrada_em && !convites.includes(l));
  const semana = semanaAtual();

  // o que estou lendo com outras pessoas: clubes com leitura + leituras a dois
  const meuDe = (livro: LivroDaLeitura) => meusLivros.find((l) => l.id === livro.id || l.titulo.toLowerCase() === livro.titulo.toLowerCase());
  const lendoJunto: LendoJunto[] = d
    ? [
        ...d.clubes
          .filter((c) => c.lendo)
          .map((c): LendoJunto => {
            const lendo = c.lendo!;
            const meu = meuDe(lendo.livro);
            const prog = d.progresso.filter((p) => p.clube_livro_id === lendo.id);
            const and = andamento(lendo);
            const concluiram = prog.filter((p) => p.status === "terminei").length;
            return {
              chave: `c-${c.id}`,
              livro: lendo.livro,
              href: `/clubes/${c.id}`,
              contexto: c.nome,
              tipo: "clube",
              meuPct: meu ? pctDe(meu.paginaAtual, meu.paginas, meu.status === "lido") : 0,
              detalhe: `${concluiram} de ${c.membros.length} concluíram${and ? ` · ${and.faltam > 1 ? `${and.faltam} dias restantes` : and.faltam === 1 ? "1 dia restante" : +and.fim >= Date.now() ? "prazo hoje" : "prazo encerrado"}` : ""}`,
              clubeLivroId: lendo.id,
            };
          }),
        ...leiturasAtivas.map((l): LendoJunto => {
          const minha = l.pessoas.find((p) => p.usuario_id === eu);
          const outras = l.pessoas.filter((p) => p.usuario_id !== eu && p.estado !== "convidada");
          const total = l.livro.paginas ?? 0;
          return {
            chave: `l-${l.id}`,
            livro: l.livro,
            href: `/co-read/${l.id}`,
            contexto: outras.length ? `${outras.length === 1 ? "em dupla" : "em grupo"} com ${outras.map((p) => nomeDe(p.pessoa)).join(", ")}` : "convite enviado",
            tipo: "dupla",
            meuPct: minha ? pctDe(minha.pagina, total, minha.terminou) : 0,
            pausa: minha?.estado === "pausou",
            outras: outras.slice(0, 2).map((p) => ({ nome: nomeDe(p.pessoa), pct: pctDe(p.pagina, total, p.terminou) })),
          };
        }),
      ]
    : [];

  // a semana: prazos de leitura e encontros até domingo
  const daSemana: ItemSemana[] = d
    ? [
        ...d.clubes.flatMap((c): ItemSemana[] => {
          const and = c.lendo ? andamento(c.lendo) : null;
          return and && +and.fim >= +semana.ini && +and.fim <= +semana.fim
            ? [{ chave: `p-${c.id}`, quando: and.fim, tipo: "prazo", titulo: "Prazo de leitura", linha: `${c.nome} · ${c.lendo!.livro.titulo}`, href: `/clubes/${c.id}` }]
            : [];
        }),
        ...d.encontros
          .filter((e) => +new Date(e.quando) <= +semana.fim)
          .map((e): ItemSemana => ({ chave: `e-${e.id}`, quando: new Date(e.quando), tipo: "encontro", titulo: e.titulo, linha: `${e.clube.nome}${e.local ? ` · ${e.local}` : ""}`, href: `/clubes/${e.clube_id}/agenda`, hora: hora(e.quando) })),
      ].sort((a, b) => +a.quando - +b.quando)
    : [];
  const depois = d ? d.encontros.filter((e) => +new Date(e.quando) > +semana.fim).slice(0, 3) : [];

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold tracking-[.08em] text-cinza uppercase">{semana.rotulo}</p>
          <h1 className="mt-1 font-revista text-[30px] leading-none text-bordo italic lg:text-[40px]">entre leitores.</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/co-read/novo" className="inline-flex h-10 items-center rounded-[6px] bg-bordo px-4 text-[13px] font-semibold text-creme hover:bg-bordo-suave">
            + Ler com alguém
          </Link>
          <Link href="/clubes/novo" className="inline-flex h-10 items-center rounded-[6px] border border-bege px-4 text-[13px] font-semibold text-ameixa hover:border-bordo">
            + Criar clube
          </Link>
          <Link href="/clubes/entrar" className="inline-flex min-h-10 items-center px-2 text-[13px] text-tinta-suave hover:text-bordo">
            Entrar com convite
          </Link>
        </div>
      </header>

      {convites.length ? <Convites convites={convites} depois={consulta.recarregar} /> : null}

      {consulta.carregando && !d ? (
        <div className="mt-8 flex gap-4 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[230px] w-[260px] flex-none animate-pulse rounded-[8px] bg-papel" />
          ))}
        </div>
      ) : consulta.erro ? (
        <div className="mt-6">
          <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />
        </div>
      ) : d ? (
        <>
          {/* B · os livros primeiro */}
          <section aria-labelledby="c-lendo" className="mt-8">
            <h2 id="c-lendo" className="mb-3 font-revista text-[22px] leading-none text-ameixa">
              Lendo agora com outras pessoas
            </h2>
            {lendoJunto.length ? (
              <ul className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0 xl:grid-cols-3">
                {lendoJunto.map((x) => (
                  <CartaoLendo key={x.chave} x={x} depois={consulta.recarregar} />
                ))}
              </ul>
            ) : (
              <div className="rounded-[8px] border border-dashed border-bege px-4 py-6">
                <p className="font-revista text-[18px] text-ameixa">Histórias também aproximam pessoas.</p>
                <p className="mt-1 text-[13px] text-tinta-suave">Convide alguém para ler junto ou crie um clube para dividir as próximas leituras.</p>
              </div>
            )}
          </section>

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
            {/* C · a semana entre leitores */}
            <section aria-labelledby="c-semana" className="min-w-0">
              <h2 id="c-semana" className="mb-3 font-revista text-[22px] leading-none text-ameixa">
                Esta semana
              </h2>
              {daSemana.length ? (
                <ol className="relative border-l border-linha pl-5">
                  {daSemana.map((i) => (
                    <li key={i.chave} className="relative pb-5 last:pb-0">
                      <span aria-hidden className={`absolute top-1.5 -left-[25px] size-[9px] rounded-full ring-4 ring-creme lg:ring-jornal ${i.tipo === "encontro" ? "bg-descoberta-tinta" : "bg-bordo"}`} />
                      <p className="text-[11px] font-semibold tracking-[.06em] text-cinza uppercase">
                        {ehHoje(i.quando) ? "hoje" : quando(i.quando.toISOString())}
                        {i.hora ? ` · ${i.hora}` : ""}
                      </p>
                      <Link href={i.href} className="mt-0.5 block text-[14px] font-semibold text-ameixa hover:text-bordo">
                        {i.titulo}
                      </Link>
                      <p className="truncate text-[12px] text-tinta-suave">{i.linha}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[13px] text-tinta-suave">Nenhum prazo ou encontro até domingo.</p>
              )}
              {depois.length ? (
                <div className="mt-6">
                  <p className="mb-2 text-[12px] font-semibold text-cinza">Mais adiante</p>
                  <ul className="divide-y divide-linha border-y border-linha">
                    {depois.map((e) => (
                      <li key={e.id}>
                        <Link href={`/clubes/${e.clube_id}/agenda`} className="flex items-baseline justify-between gap-3 py-2.5 hover:text-bordo">
                          <span className="min-w-0 truncate text-[13px] text-ameixa">
                            {e.titulo} <span className="text-cinza">· {e.clube.nome}</span>
                          </span>
                          <span className="flex-none text-[12px] text-tinta-suave">{quando(e.quando)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <div className="min-w-0 space-y-10">
              <SeusClubes clubes={d.clubes} dados={d} eu={eu} />
              <ResumoLeituras total={(d.leituras ?? []).length} ativas={leiturasAtivas.length} />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

const ehHoje = (d: Date) => d.toDateString() === new Date().toDateString();

type LendoJunto = {
  chave: string;
  livro: LivroDaLeitura;
  href: string;
  contexto: string;
  tipo: "clube" | "dupla";
  meuPct: number;
  detalhe?: string;
  pausa?: boolean;
  outras?: { nome: string; pct: number }[];
  clubeLivroId?: string;
};
type ItemSemana = { chave: string; quando: Date; tipo: "prazo" | "encontro"; titulo: string; linha: string; href: string; hora?: string };

/* ───────── convites: faixa no topo, responde ali mesmo ───────── */

function Convites({ convites, depois }: { convites: LeituraComPessoas[]; depois: () => void }) {
  const [ocupado, setOcupado] = useState<string | null>(null);
  async function responder(id: string, sim: boolean) {
    setOcupado(id);
    try {
      await (sim ? aceitarConvite(id) : recusarConvite(id));
      depois();
    } finally {
      setOcupado(null);
    }
  }
  return (
    <ul aria-label="convites" className="mt-5 space-y-2">
      {convites.map((l) => {
        const quem = l.pessoas.find((p) => p.usuario_id === l.criado_por)?.pessoa;
        return (
          <li key={l.id} className="flex flex-wrap items-center gap-3 rounded-[8px] bg-rosa-editorial/60 px-3.5 py-3">
            <CapaAuto livro={l.livro} className="w-[34px] flex-none [&>span:last-child]:hidden" />
            <p className="min-w-0 flex-1 text-[13px] text-ameixa">
              <strong className="font-semibold">{quem ? nomeDe(quem) : "Alguém"}</strong> convidou você para ler <em className="font-revista text-[15px]">{l.nome || l.livro.titulo}</em>
            </p>
            <span className="flex gap-2">
              <button type="button" disabled={ocupado === l.id} onClick={() => responder(l.id, true)} className="h-9 rounded-[6px] bg-bordo px-3 text-[12px] font-semibold text-creme disabled:opacity-50">
                Aceitar
              </button>
              <button type="button" disabled={ocupado === l.id} onClick={() => responder(l.id, false)} className="h-9 rounded-[6px] border border-bege bg-creme-quente px-3 text-[12px] font-semibold text-ameixa disabled:opacity-50">
                Recusar
              </button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/* ───────── cartão do livro lido junto ───────── */

function CartaoLendo({ x, depois }: { x: LendoJunto; depois: () => void }) {
  const [aberto, setAberto] = useState(false);
  return (
    <li className="w-[82%] max-w-[340px] flex-none snap-start sm:w-[300px] lg:w-auto lg:max-w-none">
      <div className="flex h-full flex-col rounded-[8px] border border-linha bg-creme-quente p-3.5">
        <div className="flex gap-3.5">
          <Link href={x.href} tabIndex={-1} aria-hidden className="flex-none">
            <CapaAuto livro={x.livro} className="w-[76px] shadow-[2px_6px_14px_-6px_rgba(43,20,32,.45)] [&>span:last-child]:hidden" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold tracking-[.06em] text-cinza uppercase">{x.tipo === "clube" ? `clube · ${x.contexto}` : x.contexto}</p>
            <Link href={x.href} className="mt-1 line-clamp-2 font-revista text-[18px] leading-tight text-ameixa hover:text-bordo">
              {x.livro.titulo}
            </Link>
            <p className="mt-0.5 truncate text-[12px] text-cinza">{x.livro.autor}</p>
          </div>
        </div>
        <div className="mt-3 space-y-1.5">
          <Barra rotulo="você" pct={x.meuPct} texto={x.pausa ? "em pausa" : x.meuPct === 100 ? "concluí" : `${x.meuPct}%`} />
          {x.outras?.map((o) => <Barra key={o.nome} rotulo={o.nome} pct={o.pct} texto={o.pct === 100 ? "concluiu" : `${o.pct}%`} suave />)}
          {x.detalhe ? <p className="pt-0.5 text-[11px] text-cinza">{x.detalhe}</p> : null}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          {x.meuPct < 100 ? (
            <button type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto} className="h-9 rounded-[6px] border border-bege px-3 text-[13px] font-semibold text-ameixa hover:border-bordo">
              {x.meuPct ? "Atualizar página" : "Começar a leitura"}
            </button>
          ) : (
            <span />
          )}
          <Link href={x.href} className="text-[12px] font-semibold text-bordo">
            Abrir
          </Link>
        </div>
        {aberto ? <AtualizarLeitura livro={x.livro} clubeLivroId={x.clubeLivroId} depois={() => (setAberto(false), depois())} /> : null}
      </div>
    </li>
  );
}

function Barra({ rotulo, pct, texto, suave }: { rotulo: string; pct: number; texto: string; suave?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 flex-none truncate text-[11px] text-tinta-suave">{rotulo}</span>
      <span aria-hidden className="block h-[4px] min-w-0 flex-1 rounded-full bg-linha">
        <span className={`block h-full rounded-full ${suave ? "bg-rosa-antigo" : "bg-progresso"}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="w-12 flex-none text-right text-[11px] tabular-nums text-tinta-suave">{texto}</span>
    </div>
  );
}

/* ───────── seus clubes: lista enxuta com a ação do momento ───────── */

function SeusClubes({ clubes, dados, eu }: { clubes: ResumoClube[]; dados: Dados; eu: string | null }) {
  return (
    <section aria-labelledby="c-clubes">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="c-clubes" className="font-revista text-[22px] leading-none text-ameixa">
          Seus clubes
        </h2>
        <Link href="/clubes/novo" className="text-[12px] font-semibold text-bordo">
          + Criar
        </Link>
      </div>
      {clubes.length ? (
        <ul className="divide-y divide-linha border-y border-linha">
          {clubes.map((c) => (
            <LinhaClube key={c.id} c={c} dados={dados} eu={eu} />
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-tinta-suave">
          Você ainda não está em nenhum clube.{" "}
          <Link href="/clubes/entrar" className="font-semibold text-bordo">
            Entrar com convite
          </Link>
        </p>
      )}
    </section>
  );
}

function LinhaClube({ c, dados, eu }: { c: ResumoClube; dados: Dados; eu: string | null }) {
  const ident = lerIdentidade(c.identidade);
  const usaEmblema = ident && (ident.emblema?.noAvatar || !c.foto);
  const pessoas = c.membros.map((id) => dados.pessoas.get(id)!).filter(Boolean);
  const base = `/clubes/${c.id}`;
  const lendo = c.lendo;
  const prog = lendo ? dados.progresso.filter((p) => p.clube_livro_id === lendo.id) : [];
  const terminei = prog.find((p) => p.usuario_id === eu)?.status === "terminei";
  const encontro = dados.encontros.find((e) => e.clube_id === c.id) ?? null;
  const encontroPerto = encontro && +new Date(encontro.quando) - Date.now() < 3 * 864e5;
  const votacao = !lendo && c.sugestoes && modoDe(c) === "votacao";
  const acao = encontroPerto
    ? { rotulo: "Encontro", href: `${base}/agenda` }
    : votacao
      ? { rotulo: "Votar", href: `${base}/escolher` }
      : lendo && terminei
        ? { rotulo: "Impressões", href: `${base}/ficha/${lendo.id}` }
        : null;
  const status = lendo
    ? `lendo ${lendo.livro.titulo}`
    : c.sugestoes
      ? `${votacao ? "votação aberta · " : ""}${c.sugestoes} ${c.sugestoes === 1 ? "livro sugerido" : "livros sugeridos"}`
      : "sem próxima leitura";
  return (
    <li className="flex items-center gap-3 py-3">
      <Link href={base} className="flex min-w-0 flex-1 items-center gap-3">
        {usaEmblema ? (
          <Emblema e={emblemaDe(ident!, c.nome)} paleta={paletaDe(ident!)} tamanho={40} className="flex-none" />
        ) : c.foto ? (
          <img src={c.foto} alt="" className="size-10 flex-none rounded-full object-cover" />
        ) : (
          <span className="grid size-10 flex-none place-items-center rounded-full bg-rosa-fundo font-revista text-[17px] text-bordo">{c.nome.charAt(0).toLowerCase()}</span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-semibold text-ameixa">{c.nome}</span>
          <span className="flex items-center gap-1.5 text-[12px] text-cinza">
            <Avatares pessoas={pessoas.slice(0, 3)} tamanho={14} />
            <span className="truncate">
              {c.membros.length} · {status}
            </span>
          </span>
        </span>
      </Link>
      {acao ? (
        <Link href={acao.href} className="inline-flex h-8 flex-none items-center rounded-[6px] bg-bordo px-3 text-[12px] font-semibold text-creme hover:bg-bordo-suave">
          {acao.rotulo}
        </Link>
      ) : (
        <Link href={base} aria-label={`Abrir ${c.nome}`} className="grid size-8 flex-none place-items-center text-tinta-suave hover:text-bordo">
          →
        </Link>
      )}
    </li>
  );
}

function ResumoLeituras({ total, ativas }: { total: number; ativas: number }) {
  return (
    <section aria-labelledby="c-leituras">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 id="c-leituras" className="font-revista text-[22px] leading-none text-ameixa">
          Leituras compartilhadas
        </h2>
        {total ? (
          <Link href="/co-read" className="text-[12px] font-semibold text-bordo">
            ver todas
          </Link>
        ) : null}
      </div>
      <p className="text-[13px] text-tinta-suave">
        {ativas ? `${ativas} em andamento — elas aparecem em “lendo agora”, lá em cima.` : "Nenhuma em andamento."}{" "}
        <Link href="/co-read/novo" className="font-semibold text-bordo">
          Ler com alguém
        </Link>
      </p>
    </section>
  );
}

/** atualizar a página sem sair da Comunidade: estante pessoal, clube e leituras compartilhadas juntos */
function AtualizarLeitura({ livro, clubeLivroId, depois }: { livro: LivroDaLeitura; clubeLivroId?: string; depois: () => void }) {
  const livros = usePerfil((s) => s.livros);
  const editarLivro = usePerfil((s) => s.editarLivro);
  const meu = livros.find((l) => l.id === livro.id || l.titulo.toLowerCase() === livro.titulo.toLowerCase());
  const total = meu?.paginas ?? livro.paginas ?? 0;
  const [pagina, setPagina] = useState<number>(meu?.paginaAtual ?? 0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(false);
  async function salvar(terminou: boolean) {
    setSalvando(true);
    setErro(false);
    const p = terminou ? total || pagina : pagina;
    const agora = new Date().toISOString();
    editarLivro(
      { id: meu?.id ?? livro.id, titulo: meu?.titulo ?? livro.titulo, autor: meu?.autor ?? livro.autor, capa: meu?.capa ?? livro.capa, genero: meu?.genero },
      { status: terminou ? "lido" : "lendo", paginaAtual: p, paginas: total || undefined, iniciadoEm: meu?.iniciadoEm ?? agora, ...(terminou ? { lidoEm: agora } : {}) },
    );
    try {
      if (clubeLivroId) await (terminou ? marcarProgresso(clubeLivroId, "terminei") : marcarMarca(clubeLivroId, "pagina", p));
      await sincronizarProgressoNosCoreads({ id: livro.id, titulo: livro.titulo, paginas: total || undefined }, p, terminou);
      depois();
    } catch {
      setErro(true);
    } finally {
      setSalvando(false);
    }
  }
  return (
    <div className="mt-3 rounded-[6px] border border-linha bg-creme p-3">
      <label className="block text-[12px] font-semibold text-ameixa">
        Em que página você está?
        <span className="mt-1.5 flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={total || undefined}
            value={pagina || ""}
            onChange={(e) => setPagina(Math.max(0, Math.min(total || 99999, Number(e.target.value) || 0)))}
            className="h-10 w-24 rounded-[6px] border border-bege bg-creme-quente px-2 text-[15px] outline-none focus:border-bordo"
          />
          <span className="text-[12px] font-normal text-cinza">{total ? `de ${total}` : ""}</span>
        </span>
      </label>
      {total ? <input type="range" min={0} max={total} value={pagina} onChange={(e) => setPagina(Number(e.target.value))} aria-label="Página atual" className="mt-2 w-full accent-[var(--color-bordo)]" /> : null}
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" disabled={salvando} onClick={() => salvar(false)} className="h-9 rounded-[6px] bg-bordo px-3 text-[13px] font-semibold text-creme disabled:opacity-50">
          {salvando ? "Salvando…" : "Salvar progresso"}
        </button>
        <button type="button" disabled={salvando} onClick={() => salvar(true)} className="h-9 rounded-[6px] border border-bege px-3 text-[13px] font-semibold text-ameixa disabled:opacity-50">
          Concluí o livro
        </button>
      </div>
      {erro ? <p className="mt-2 text-[12px] text-erro">Não foi possível salvar. Verifique sua conexão e tente novamente.</p> : null}
    </div>
  );
}

