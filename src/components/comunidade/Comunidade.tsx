"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useModoEscuro } from "@/components/Aparencia";
import { AppShell } from "@/components/AppShell";
import { CapaAuto } from "@/components/CapaAuto";
import { Emblema } from "@/components/clube/Emblema";
import { Avatares } from "@/components/clube/Pecas";
import { ComConta, ErroOuFalta } from "@/components/social/Estados";
import { andamento, encontrosDe, marcarMarca, marcarProgresso, meusClubes, modoDe, progressoDoClube, type Encontro, type Progresso, type ResumoClube } from "@/lib/clubes";
import { temas } from "@/lib/dados";
import { TIPOGRAFIAS, ajustarContraste, ehEscura, emblemaDe, estiloDaIdentidade, lerIdentidade, misturar, paletaDe, temaDoId } from "@/lib/identidade";
import { aceitarConvite, minhasLeiturasJuntas, recusarConvite, sincronizarProgressoNosCoreads, type LeituraJunta, type PessoaNaLeitura } from "@/lib/lerjunto";
import { usePerfil } from "@/lib/perfil-store";
import { nomeDe, pessoasPorId, useConsulta, useMeuId } from "@/lib/social";
import { coresDoTema } from "@/lib/tema";

/*
 * Comunidade — entre leitores. Uma página só: seus clubes (com a ação que faz
 * sentido agora, inclusive atualizar a leitura sem entrar no clube), as
 * leituras compartilhadas, os próximos encontros e os convites num painel.
 */

type LeituraComPessoas = LeituraJunta & { pessoas: PessoaNaLeitura[] };
type Dados = {
  clubes: ResumoClube[];
  pessoas: Awaited<ReturnType<typeof pessoasPorId>>;
  encontros: (Encontro & { clube: ResumoClube })[];
  progresso: Progresso[];
  leituras: LeituraComPessoas[];
};

const quando = (iso: string) => new Date(iso).toLocaleString("pt-BR", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "");
const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }).replace(":", "h");

function estiloDoCartao(ident: ReturnType<typeof lerIdentidade>, tema: string | null, escuro: boolean): CSSProperties {
  if (!ident) return coresDoTema(tema, escuro) as CSSProperties;
  const p = paletaDe(ident);
  const completo = estiloDaIdentidade(ident);
  if (!escuro || ehEscura(p)) return completo;
  // app escuro + clube claro: superfícies do app, destaque e capa do clube
  const destaque = ajustarContraste(p.primaria, "#21191D", 4.5);
  return {
    "--color-bordo": destaque,
    "--color-bordo-suave": destaque,
    "--color-rosa-fundo": misturar(p.complementar, "#21191D", 0.18),
    "--club-banner": completo["--club-banner" as keyof CSSProperties],
    "--club-heading-font": completo["--club-heading-font" as keyof CSSProperties],
    "--font-revista": completo["--font-revista" as keyof CSSProperties],
  } as CSSProperties;
}

export function Comunidade() {
  return (
    <AppShell aba="clubes">
      <div className="flex flex-1 flex-col px-5 pt-3 pb-10 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="mx-auto w-full max-w-[1180px]">
          <ComConta>
            <Conteudo />
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}

function Conteudo() {
  const eu = useMeuId();
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

  const convites = (consulta.dados?.leituras ?? []).filter((l) => !l.encerrada_em && l.pessoas.some((p) => p.usuario_id === eu && p.estado === "convidada"));

  return (
    <>
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-revista text-[28px] leading-none text-bordo italic lg:text-[34px]">entre leitores.</h1>
          <p className="mt-1 text-[13px] text-cinza">Boas histórias, melhores companhias.</p>
        </div>
        <Convites convites={convites} eu={eu} depois={consulta.recarregar} />
      </header>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href="/clubes/novo" className="inline-flex h-10 items-center rounded-[6px] bg-bordo px-4 text-[13px] font-semibold text-creme hover:bg-bordo-suave">
          Criar clube
        </Link>
        <Link href="/co-read/novo" className="inline-flex h-10 items-center rounded-[6px] border border-bege px-4 text-[13px] font-semibold text-ameixa hover:border-bordo">
          Ler com alguém
        </Link>
        <Link href="/clubes/entrar" className="inline-flex min-h-10 items-center px-2 text-[13px] text-tinta-suave hover:text-bordo">
          Entrar com convite
        </Link>
      </div>

      {consulta.carregando && !consulta.dados ? (
        <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
          {[0, 1].map((i) => (
            <div key={i} className="h-[150px] animate-pulse rounded-[8px] bg-papel" />
          ))}
        </div>
      ) : consulta.erro ? (
        <div className="mt-6">
          <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />
        </div>
      ) : consulta.dados ? (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)] lg:gap-12">
          <section aria-labelledby="c-clubes" className="min-w-0">
            <h2 id="c-clubes" className="mb-3 font-revista text-[22px] leading-none text-ameixa">
              Seus clubes
            </h2>
            {consulta.dados.clubes.length ? (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {consulta.dados.clubes.map((c) => (
                  <CartaoClube key={c.id} c={c} dados={consulta.dados!} eu={eu} depois={consulta.recarregar} />
                ))}
              </ul>
            ) : (
              <div className="rounded-[8px] border border-dashed border-bege px-4 py-6">
                <p className="font-revista text-[18px] text-ameixa">Histórias também aproximam pessoas.</p>
                <p className="mt-1 text-[13px] text-tinta-suave">Crie um clube ou entre com um convite para compartilhar suas próximas leituras.</p>
              </div>
            )}
          </section>

          <div className="min-w-0 space-y-10">
            <LeiturasCompartilhadas leituras={consulta.dados.leituras.filter((l) => !convites.includes(l))} eu={eu} />
            <ProximosEncontros encontros={consulta.dados.encontros} />
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ───────── convites (painel, sem página própria) ───────── */

function Convites({ convites, eu, depois }: { convites: LeituraComPessoas[]; eu: string | null; depois: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => !caixa.current?.contains(e.target as Node) && setAberto(false);
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);
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
    <div ref={caixa} className="relative flex-none">
      <button
        type="button"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        aria-label={convites.length ? `Convites, ${convites.length} pendentes` : "Convites"}
        className="flex min-h-10 items-center gap-1.5 px-1 text-[13px] font-medium text-tinta-suave hover:text-bordo"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="5" width="18" height="14" rx="1.5" />
          <path d="m3.5 6 8.5 7 8.5-7" />
        </svg>
        Convites
        {convites.length ? <span className="grid min-w-[18px] place-items-center rounded-full bg-bordo px-1 text-[10px] leading-[18px] text-creme">{convites.length}</span> : null}
      </button>
      {aberto ? (
        <div className="absolute right-0 z-30 mt-1 w-[300px] rounded-[8px] border border-linha bg-creme-quente p-3 shadow-[0_12px_30px_-16px_rgba(56,37,44,.5)]">
          {convites.length ? (
            <ul className="space-y-3">
              {convites.map((l) => {
                const quem = l.pessoas.find((p) => p.usuario_id === l.criado_por)?.pessoa;
                return (
                  <li key={l.id} className="flex gap-3">
                    <CapaAuto livro={l.livro} className="w-[40px] flex-none [&>span:last-child]:hidden" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-ameixa">{l.nome || l.livro.titulo}</p>
                      <p className="truncate text-[12px] text-cinza">{quem ? `${nomeDe(quem)} convidou você para ler junto` : "Convite para ler junto"}</p>
                      <div className="mt-2 flex gap-2">
                        <button type="button" disabled={ocupado === l.id} onClick={() => responder(l.id, true)} className="h-9 rounded-[6px] bg-bordo px-3 text-[12px] font-semibold text-creme disabled:opacity-50">
                          Aceitar
                        </button>
                        <button type="button" disabled={ocupado === l.id} onClick={() => responder(l.id, false)} className="h-9 rounded-[6px] border border-bege px-3 text-[12px] font-semibold text-ameixa disabled:opacity-50">
                          Recusar
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[13px] text-tinta-suave">Nenhum convite pendente. Convites de clube chegam por código: use “Entrar com convite”.</p>
          )}
          {eu ? null : null}
        </div>
      ) : null}
    </div>
  );
}

/* ───────── clube: cartão compacto com a ação do momento ───────── */

function CartaoClube({ c, dados, eu, depois }: { c: ResumoClube; dados: Dados; eu: string | null; depois: () => void }) {
  const escuro = useModoEscuro();
  const meusLivros = usePerfil((s) => s.livros);
  const [atualizando, setAtualizando] = useState(false);
  const ident = lerIdentidade(c.identidade);
  const tema = temas.find((t) => t.id === c.tema);
  const usaEmblema = ident && (ident.emblema?.noAvatar || !c.foto);
  const pessoas = c.membros.map((id) => dados.pessoas.get(id)!).filter(Boolean);
  const lendo = c.lendo;
  const progresso = lendo ? dados.progresso.filter((p) => p.clube_livro_id === lendo.id) : [];
  const meuProg = progresso.find((p) => p.usuario_id === eu);
  const meu = lendo ? meusLivros.find((l) => l.id === lendo.livro.id || l.titulo.toLowerCase() === lendo.livro.titulo.toLowerCase()) : undefined;
  const meuPct = meu ? (meu.status === "lido" ? 100 : meu.paginas && meu.paginaAtual ? Math.min(100, Math.round((meu.paginaAtual / meu.paginas) * 100)) : 0) : null;
  const concluiram = progresso.filter((p) => p.status === "terminei").length;
  const and = lendo ? andamento(lendo) : null;
  const encontro = dados.encontros.find((e) => e.clube_id === c.id) ?? null;
  const encontroPerto = encontro && +new Date(encontro.quando) - Date.now() < 3 * 864e5;
  const base = `/clubes/${c.id}`;

  // a ação mais útil agora (uma só)
  const terminei = meuProg?.status === "terminei" || meu?.status === "lido";
  const comecei = meuProg?.status === "lendo" || (meuPct ?? 0) > 0;
  const acao: { rotulo: string; href?: string; abrir?: true } = encontroPerto
    ? { rotulo: "Ver encontro", href: `${base}/agenda` }
    : !lendo
      ? c.sugestoes && modoDe(c) === "votacao"
        ? { rotulo: "Participar da votação", href: `${base}/escolher` }
        : { rotulo: "Ver próximas leituras", href: `${base}/sugestoes` }
      : terminei
        ? { rotulo: "Registrar minhas impressões", href: `${base}/ficha/${lendo.id}` }
        : comecei
          ? { rotulo: "Atualizar minha leitura", abrir: true }
          : { rotulo: "Começar a leitura", abrir: true };

  const fundoCapa: CSSProperties = c.capa ? { backgroundImage: `url("${c.capa}")` } : ident ? { background: "var(--club-banner)" } : tema ? { background: tema.fundo } : {};
  return (
    <li
      style={estiloDoCartao(ident, c.tema, escuro)}
      data-titulo={ident && !TIPOGRAFIAS.find((t) => t.id === (ident.tipografia ?? temaDoId(ident.tema).tipografia))?.italico ? "reto" : undefined}
      className={`clube-tokens min-w-0 ${ident ? "clube-identidade" : ""}`}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[8px] border border-linha bg-creme-quente">
        {/* faixa com a identidade do clube */}
        <Link href={base} aria-label={`Abrir ${c.nome}`} className={`block h-14 bg-cover bg-center ${c.capa || ident || tema ? "" : "pat-estrelas"}`} style={fundoCapa} />
        <div className="flex flex-1 flex-col px-3.5 pb-3.5">
          <div className="-mt-6 flex items-end gap-2.5">
            {usaEmblema ? (
              <Emblema e={emblemaDe(ident!, c.nome)} paleta={paletaDe(ident!)} tamanho={44} className="flex-none drop-shadow-[0_3px_6px_rgba(0,0,0,.18)]" />
            ) : c.foto ? (
              <img src={c.foto} alt="" className="size-11 flex-none rounded-full border-[3px] border-creme-quente object-cover" />
            ) : (
              <span className="grid size-11 flex-none place-items-center rounded-full border-[3px] border-creme-quente bg-rosa-fundo font-revista text-[18px] text-bordo">{c.nome.charAt(0).toLowerCase()}</span>
            )}
            <span className="mb-0.5 flex min-w-0 items-center gap-1.5">
              <Avatares pessoas={pessoas.slice(0, 3)} tamanho={18} />
              <span className="text-[11px] whitespace-nowrap text-tinta-suave">
                {c.membros.length} {c.membros.length === 1 ? "membro" : "membros"}
              </span>
            </span>
          </div>
          <Link href={base} className="mt-2 line-clamp-1 font-revista text-[19px] leading-tight text-bordo hover:underline">
            {c.nome}
          </Link>

          {lendo ? (
            <div className="mt-2.5 flex gap-3">
              <CapaAuto livro={lendo.livro} className="w-[38px] flex-none [&>span:last-child]:hidden" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-ameixa">{lendo.livro.titulo}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span aria-hidden className="block h-[3px] min-w-0 flex-1 rounded-full bg-linha">
                    <span className="block h-full rounded-full bg-progresso" style={{ width: `${meuPct ?? 0}%` }} />
                  </span>
                  <span className="flex-none text-[11px] tabular-nums text-tinta-suave">{meuPct === null ? "—" : meuPct === 100 ? "concluí" : `${meuPct}%`}</span>
                </div>
                <p className="mt-1 text-[11px] text-cinza">
                  {concluiram} de {c.membros.length} concluíram
                  {and ? ` · ${and.faltam > 1 ? `${and.faltam} dias restantes` : and.faltam === 1 ? "1 dia restante" : +and.fim >= Date.now() ? "prazo hoje" : "prazo encerrado"}` : ""}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-tinta-suave">
              {c.sugestoes ? `${c.sugestoes} ${c.sugestoes === 1 ? "livro sugerido" : "livros sugeridos"}${modoDe(c) === "votacao" ? " · votação aberta" : ""}` : "Ainda sem próxima leitura."}
            </p>
          )}
          {encontro ? (
            <p className="mt-2 text-[11px] text-tinta-suave">
              Próximo encontro: {quando(encontro.quando)}, {hora(encontro.quando)}
            </p>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            {acao.abrir ? (
              <button type="button" onClick={() => setAtualizando((v) => !v)} aria-expanded={atualizando} className="h-9 rounded-[6px] bg-bordo px-3 text-[13px] font-semibold text-creme hover:bg-bordo-suave">
                {acao.rotulo}
              </button>
            ) : (
              <Link href={acao.href!} className="inline-flex h-9 items-center rounded-[6px] bg-bordo px-3 text-[13px] font-semibold text-creme hover:bg-bordo-suave">
                {acao.rotulo}
              </Link>
            )}
            <Link href={base} className="text-[12px] font-semibold text-tinta-suave hover:text-bordo">
              Visão geral
            </Link>
          </div>
          {atualizando && lendo ? <AtualizarLeitura lendo={lendo} depois={() => { setAtualizando(false); depois(); }} /> : null}
        </div>
      </div>
    </li>
  );
}

/** atualizar a página sem sair da Comunidade: estante pessoal, clube e leituras compartilhadas juntos */
function AtualizarLeitura({ lendo, depois }: { lendo: NonNullable<ResumoClube["lendo"]>; depois: () => void }) {
  const livros = usePerfil((s) => s.livros);
  const editarLivro = usePerfil((s) => s.editarLivro);
  const meu = livros.find((l) => l.id === lendo.livro.id || l.titulo.toLowerCase() === lendo.livro.titulo.toLowerCase());
  const total = meu?.paginas ?? lendo.livro.paginas ?? 0;
  const [pagina, setPagina] = useState<number>(meu?.paginaAtual ?? 0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState(false);
  async function salvar(terminou: boolean) {
    setSalvando(true);
    setErro(false);
    const p = terminou ? total || pagina : pagina;
    const agora = new Date().toISOString();
    editarLivro(
      { id: meu?.id ?? lendo.livro.id, titulo: meu?.titulo ?? lendo.livro.titulo, autor: meu?.autor ?? lendo.livro.autor, capa: meu?.capa ?? lendo.livro.capa, genero: meu?.genero },
      { status: terminou ? "lido" : "lendo", paginaAtual: p, paginas: total || undefined, iniciadoEm: meu?.iniciadoEm ?? agora, ...(terminou ? { lidoEm: agora } : {}) },
    );
    try {
      await (terminou ? marcarProgresso(lendo.id, "terminei") : marcarMarca(lendo.id, "pagina", p));
      void sincronizarProgressoNosCoreads({ id: lendo.livro.id, titulo: lendo.livro.titulo, paginas: total || undefined }, p, terminou);
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
      {erro ? <p className="mt-2 text-[12px] text-erro">Não foi possível salvar no clube. Verifique sua conexão e tente novamente.</p> : null}
    </div>
  );
}

/* ───────── leituras compartilhadas ───────── */

function LeiturasCompartilhadas({ leituras, eu }: { leituras: LeituraComPessoas[]; eu: string | null }) {
  const ativas = leituras.filter((l) => !l.encerrada_em);
  return (
    <section aria-labelledby="c-leituras">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="c-leituras" className="font-revista text-[22px] leading-none text-ameixa">
          Leituras compartilhadas
        </h2>
        {leituras.length ? (
          <Link href="/co-read" className="text-[12px] font-semibold text-bordo">
            ver todas
          </Link>
        ) : null}
      </div>
      {ativas.length ? (
        <ul className="divide-y divide-linha">
          {ativas.slice(0, 4).map((l) => {
            const minha = l.pessoas.find((p) => p.usuario_id === eu);
            const outras = l.pessoas.filter((p) => p.usuario_id !== eu && p.estado !== "convidada");
            const total = l.livro.paginas ?? 0;
            const pct = minha ? (minha.terminou ? 100 : total ? Math.min(100, Math.round((minha.pagina / total) * 100)) : 0) : 0;
            return (
              <li key={l.id} className="flex gap-3 py-3">
                <CapaAuto livro={l.livro} className="w-[40px] flex-none [&>span:last-child]:hidden" />
                <div className="min-w-0 flex-1">
                  <Link href={`/co-read/${l.id}`} className="block truncate text-[14px] font-semibold text-ameixa hover:text-bordo">
                    {l.nome || l.livro.titulo}
                  </Link>
                  <p className="truncate text-[12px] text-cinza">com {outras.map((p) => nomeDe(p.pessoa)).join(", ") || "convite enviado"}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span aria-hidden className="block h-[3px] min-w-0 flex-1 rounded-full bg-linha">
                      <span className="block h-full rounded-full bg-progresso" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="text-[11px] tabular-nums text-tinta-suave">{minha?.estado === "pausou" ? "em pausa" : pct === 100 ? "concluí" : `${pct}%`}</span>
                  </div>
                </div>
                <Link href={`/co-read/${l.id}`} className="self-center text-[12px] font-semibold text-bordo">
                  Abrir
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[13px] text-tinta-suave">
          Nenhuma leitura compartilhada em andamento.{" "}
          <Link href="/co-read/novo" className="font-semibold text-bordo">
            Ler com alguém
          </Link>
        </p>
      )}
    </section>
  );
}

/* ───────── próximos encontros ───────── */

function ProximosEncontros({ encontros }: { encontros: Dados["encontros"] }) {
  if (!encontros.length) return null;
  return (
    <section aria-labelledby="c-encontros">
      <h2 id="c-encontros" className="mb-3 font-revista text-[22px] leading-none text-ameixa">
        Próximos encontros
      </h2>
      <ul className="divide-y divide-linha">
        {encontros.slice(0, 5).map((e) => (
          <li key={e.id}>
            <Link href={`/clubes/${e.clube_id}/agenda`} className="flex gap-3 py-3 hover:text-bordo">
              <span className="w-14 flex-none text-center">
                <span className="block text-[11px] text-cinza uppercase">{new Date(e.quando).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
                <span className="block font-revista text-[24px] leading-none text-descoberta-tinta">{new Date(e.quando).getDate()}</span>
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-semibold text-ameixa">{e.titulo}</span>
                <span className="block truncate text-[12px] text-cinza">
                  {e.clube.nome} · {quando(e.quando)}, {hora(e.quando)}
                  {e.local ? ` · ${e.local}` : ""}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
