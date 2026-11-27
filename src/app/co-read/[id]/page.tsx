"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { ComConta, ErroOuFalta } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { Voltar } from "@/components/Voltar";
import { CartaoConvite, botaoPrincipal, botaoSecundario, botaoTexto, useCompartilharConvite } from "@/components/coread/Convite";
import {
  COR,
  Carimbo,
  ESTILOS,
  Envelope,
  Etiqueta,
  Fita,
  IconeReacao,
  MarcadorLeitora,
  Marcadores,
  REACOES,
  Wordmark,
  coresDasLeitoras,
  estiloDe,
  nomeDaReacao,
  ordemDasLeitoras,
} from "@/components/coread/Marca";
import {
  type Coread,
  ROTULO_ESTADO,
  TRECHOS,
  concluidaPorTodas,
  dataCurta,
  dataLonga,
  diasAte,
  emComum,
  encerrada,
  estadoDe,
  naLeitura,
  paginasDoTrecho,
  pctDe,
  totalDe,
  trechoDaPagina,
} from "@/components/coread/calculos";
import { celebrar } from "@/lib/celebrar";
import { corDoLivro } from "@/lib/cores";
import {
  aceitarConvite,
  apagarLeitura,
  apagarRecado,
  atualizarMinhaPagina,
  definirPaginasDaLeitura,
  desfazerConvite,
  desfazerReacao,
  encerrarLeitura,
  mandarRecado,
  marcarVisto,
  minhasLeiturasJuntas,
  pausar,
  reacoesDe,
  reagir,
  recadosDe,
  recadosGuardados,
  recusarConvite,
  sairDaLeitura,
  type Reacao,
  type Recado,
  type TipoReacao,
} from "@/lib/lerjunto";
import { usePerfil } from "@/lib/perfil-store";
import { nomeDe, pessoasPorId, quandoFoi, useConsulta, useMeuId, type PessoaResumo } from "@/lib/social";

type Aba = "leitura" | "conversa" | "scrapbook" | "avaliacoes";
const ABAS: { id: Aba; nome: string }[] = [
  { id: "leitura", nome: "nossa leitura" },
  { id: "conversa", nome: "conversa" },
  { id: "scrapbook", nome: "scrapbook" },
  { id: "avaliacoes", nome: "avaliações" },
];

const tituloSecao = "font-revista text-[21px] leading-tight text-bordo italic";
const linhaSecao = "mb-4 flex items-baseline justify-between gap-3 border-b border-linha pb-2 lg:border-fio";

/* ───────── pequenos pedaços ───────── */
function Barrinha({ pct, cor }: { pct: number; cor: string }) {
  return (
    <span className="block h-[5px] rounded-full bg-linha/80" aria-hidden>
      <span className="block h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${Math.max(pct, 2)}%`, background: cor }} />
    </span>
  );
}

function SeletorReacao({ onEscolher, fechar }: { onEscolher: (t: TipoReacao) => void; fechar: () => void }) {
  return (
    <div role="menu" className="absolute z-30 mt-2 w-[250px] rounded-[6px] border border-linha bg-papel p-1.5 shadow-[0_12px_30px_-14px_rgba(43,20,32,.4)]">
      {REACOES.map((r) => (
        <button
          key={r.id}
          role="menuitem"
          type="button"
          onClick={() => {
            onEscolher(r.id);
            fechar();
          }}
          className="flex w-full items-center gap-2.5 rounded-[4px] px-2.5 py-2 text-left text-[13px] text-ameixa hover:bg-linha/50"
        >
          <IconeReacao tipo={r.id} tamanho={20} />
          {r.nome}
        </button>
      ))}
    </div>
  );
}

/* ───────── a leitura ───────── */
function Leitura() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const eu = useMeuId();
  const editarLivro = usePerfil((s) => s.editarLivro);
  const meusLivros = usePerfil((s) => s.livros);
  const [aba, setAba] = useState<Aba>("leitura");

  useEffect(() => {
    const ler = () => {
      const a = new URLSearchParams(window.location.search).get("aba");
      setAba(a === "conversa" || a === "scrapbook" || a === "avaliacoes" ? a : "leitura");
    };
    ler();
    window.addEventListener("popstate", ler);
    return () => window.removeEventListener("popstate", ler);
  }, []);
  function irPara(a: Aba) {
    setAba(a);
    const u = new URL(window.location.href);
    if (a === "leitura") u.searchParams.delete("aba");
    else u.searchParams.set("aba", a);
    window.history.pushState(null, "", u);
  }

  const consulta = useConsulta(async () => {
    const todas = (await minhasLeiturasJuntas()) as Coread[];
    const l = todas.find((x) => x.id === id) ?? null;
    if (!l) return { l: null, recados: [] as Recado[], reacoes: [] as Reacao[], guardados: [] as { pagina: number; quantas: number }[], convidante: null as PessoaResumo | null };
    const minha = l.pessoas.find((p) => p.usuario_id === eu);
    if (minha?.estado === "convidada") {
      const c = await pessoasPorId([minha.convidada_por ?? l.criado_por]);
      return { l, recados: [], reacoes: [], guardados: [], convidante: c.get(minha.convidada_por ?? l.criado_por) ?? null };
    }
    const [recados, reacoes, guardados] = await Promise.all([recadosDe(id), reacoesDe(id), recadosGuardados(id)]);
    return { l, recados, reacoes, guardados, convidante: null };
  }, [id, eu]);

  const l = consulta.dados?.l ?? null;
  const minha = l?.pessoas.find((p) => p.usuario_id === eu);
  const daEstante = l ? meusLivros.find((x) => x.id === l.livro.id) : undefined;
  const sincronizou = useRef(false);

  useEffect(() => {
    if (l) marcarVisto(l.id);
  }, [l]);

  // a estante pessoal entra sozinha aqui (sem segundo registro de leitura)
  useEffect(() => {
    if (!l || !minha || minha.estado === "convidada" || sincronizou.current || encerrada(l)) return;
    sincronizou.current = true;
    const total = l.livro.paginas ?? 0;
    if (!daEstante && !minha.terminou)
      editarLivro(
        { id: l.livro.id, titulo: l.livro.titulo, autor: l.livro.autor, capa: l.livro.capa },
        { status: "lendo", iniciadoEm: new Date().toISOString(), paginaAtual: minha.pagina, paginas: l.livro.paginas },
      );
    if (!daEstante) return;
    const lido = daEstante.status === "lido";
    const minhaEd = daEstante.paginas;
    const pag = daEstante.paginaAtual ?? 0;
    const conv = total && minhaEd && minhaEd !== total ? Math.round((pag / minhaEd) * total) : pag;
    if ((lido && !minha.terminou) || conv > minha.pagina)
      atualizarMinhaPagina(l.id, lido ? total || conv : conv, lido)
        .then(() => consulta.recarregar())
        .catch(() => {});
  }, [l, minha, daEstante, consulta, editarLivro]);

  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  if (!consulta.dados) return <p className="font-accent text-sm text-cinza italic">abrindo a leitura…</p>;
  if (!l || !minha)
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <Envelope tamanho={70} />
        <p className="mt-4 font-revista text-[22px] text-bordo italic">essa leitura não está disponível.</p>
        <p className="mt-1 text-[14px] text-tinta-suave">ela pode ter sido apagada, ou você não faz parte dela.</p>
        <Link href="/co-read" className={`${botaoSecundario} mt-5`}>
          voltar à leitura compartilhada
        </Link>
      </div>
    );

  if (minha.estado === "convidada")
    return <ConvitePendente l={l} deQuem={consulta.dados.convidante} onAceitou={consulta.recarregar} onRecusou={() => router.push("/co-read?aba=convites")} />;

  const { recados, reacoes, guardados } = consulta.dados;
  return (
    <>
      <Cabecalho l={l} eu={eu} recarregar={consulta.recarregar} />
      <MeuProgresso l={l} eu={eu} recarregar={consulta.recarregar} edicao={daEstante?.paginas} />
      <div role="tablist" aria-label="seções da leitura" className="sticky top-0 z-20 -mx-5 mt-7 flex gap-5 overflow-x-auto border-b border-linha bg-creme/95 px-5 backdrop-blur [scrollbar-width:none] lg:static lg:mx-0 lg:gap-7 lg:border-fio lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
        {ABAS.map((a) => (
          <button
            key={a.id}
            role="tab"
            type="button"
            aria-selected={aba === a.id}
            onClick={() => irPara(a.id)}
            className={`-mb-px min-h-11 flex-none border-b-2 text-[14px] font-semibold ${aba === a.id ? "border-bordo text-bordo" : "border-transparent text-cinza hover:text-ameixa"}`}
          >
            {a.nome}
            {a.id === "conversa" && guardados.length ? <span className="ml-1 text-[11px] font-normal text-cinza">· {guardados.reduce((s, g) => s + g.quantas, 0)} guardadas</span> : null}
          </button>
        ))}
      </div>
      <div className="mt-7">
        {aba === "leitura" ? (
          <NossaLeitura l={l} eu={eu} recados={recados} reacoes={reacoes} guardados={guardados} irPara={irPara} recarregar={consulta.recarregar} />
        ) : aba === "conversa" ? (
          <Conversa l={l} eu={eu} recados={recados} reacoes={reacoes} guardados={guardados} recarregar={consulta.recarregar} />
        ) : aba === "scrapbook" ? (
          <Scrapbook l={l} eu={eu} reacoes={reacoes} />
        ) : (
          <Avaliacoes l={l} eu={eu} />
        )}
      </div>
    </>
  );
}

/* ───────── convite ainda não aceito ───────── */
function ConvitePendente({ l, deQuem, onAceitou, onRecusou }: { l: Coread; deQuem: PessoaResumo | null; onAceitou: () => void; onRecusou: () => void }) {
  const [ocupado, setOcupado] = useState(false);
  const gente = naLeitura(l);
  return (
    <div className="mx-auto max-w-[560px] py-4">
      <CartaoConvite l={l} deQuem={deQuem}>
        <button
          type="button"
          disabled={ocupado}
          onClick={async () => {
            setOcupado(true);
            await aceitarConvite(l.id).catch(() => {});
            onAceitou();
          }}
          className={botaoPrincipal}
        >
          aceitar e começar
        </button>
        <button
          type="button"
          disabled={ocupado}
          onClick={async () => {
            setOcupado(true);
            await recusarConvite(l.id).catch(() => {});
            onRecusou();
          }}
          className={botaoSecundario}
        >
          recusar
        </button>
      </CartaoConvite>
      <p className="mt-6 flex items-center gap-1.5 text-[13px] text-tinta-suave">
        {gente.slice(0, 5).map((p) => (
          <Avatar key={p.usuario_id} pessoa={p.pessoa} tamanho={22} />
        ))}
        <span className="ml-1">
          {gente.length} {gente.length === 1 ? "pessoa já está lendo" : "pessoas já estão lendo"}. a conversa abre quando você aceitar.
        </span>
      </p>
    </div>
  );
}

/* ───────── cabeçalho compartilhado ───────── */
function Cabecalho({ l, eu, recarregar }: { l: Coread; eu: string | null; recarregar: () => void }) {
  const router = useRouter();
  const e = ESTILOS[estiloDe(l)];
  const cores = coresDasLeitoras(l.pessoas);
  const gente = ordemDasLeitoras(naLeitura(l));
  const minha = l.pessoas.find((p) => p.usuario_id === eu)!;
  const sou = l.criado_por === eu;
  const juntas = concluidaPorTodas(l);
  const fechada = encerrada(l);
  const [menu, setMenu] = useState(false);
  const convite = useCompartilharConvite(l);
  const prazo = l.prazo ? diasAte(l.prazo) : null;

  const item = "block w-full px-3.5 py-2.5 text-left text-[13px] text-ameixa hover:bg-linha/50";
  return (
    <header className="relative overflow-hidden rounded-[4px] p-5 sm:p-6 lg:p-8" style={{ background: e.fundo }}>
      <Marcadores
        tamanho={150}
        cores={[e.tinta, e.destaque]}
        className="pointer-events-none absolute -right-6 -bottom-8 hidden opacity-25 sm:block lg:right-28 lg:bottom-auto lg:-top-2 lg:opacity-40"
      />
      <div className="relative grid grid-cols-[88px_minmax(0,1fr)] gap-4 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[150px_minmax(0,1fr)] lg:gap-8">
        <Link href={`/livro/${l.livro.id}`} className="relative block">
          <CapaLivro titulo={l.livro.titulo} capa={l.livro.capa} cor={corDoLivro(l.livro.id)} className="w-full -rotate-[1.5deg] [&>span:last-child]:hidden" />
          <Fita cor={e.destaque} className="-top-2 left-1/2 -translate-x-1/2 rotate-2" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <Etiqueta cor={e.tinta} fundo="transparent">
              {juntas ? "lemos juntas" : fechada ? "encerrada" : "lendo junto agora"}
            </Etiqueta>
            <div className="relative -mt-2 -mr-2">
              <button type="button" aria-label="mais opções" aria-expanded={menu} onClick={() => setMenu((m) => !m)} className="grid size-11 place-items-center rounded-full text-bordo hover:bg-white/50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <circle cx="5" cy="12" r="1.7" />
                  <circle cx="12" cy="12" r="1.7" />
                  <circle cx="19" cy="12" r="1.7" />
                </svg>
              </button>
              {menu ? (
                <div role="menu" className="absolute right-0 z-30 mt-1 w-[230px] overflow-hidden rounded-[6px] border border-linha bg-papel py-1 shadow-[0_12px_30px_-14px_rgba(43,20,32,.4)]">
                  {!fechada && l.codigo ? (
                    <>
                      <button role="menuitem" type="button" className={item} onClick={() => (convite.compartilhar(), setMenu(false))}>
                        compartilhar convite
                      </button>
                      <button role="menuitem" type="button" className={item} onClick={() => convite.copiarLink()}>
                        {convite.copiado === "link" ? "link copiado" : `copiar link · código ${l.codigo}`}
                      </button>
                    </>
                  ) : null}
                  {!fechada && !minha.terminou ? (
                    <button
                      role="menuitem"
                      type="button"
                      className={item}
                      onClick={async () => {
                        setMenu(false);
                        await pausar(l.id, minha.estado !== "pausou").catch(() => {});
                        recarregar();
                      }}
                    >
                      {minha.estado === "pausou" ? "voltar a ler" : "pausar minha leitura"}
                    </button>
                  ) : null}
                  {sou ? (
                    <button
                      role="menuitem"
                      type="button"
                      className={item}
                      onClick={async () => {
                        setMenu(false);
                        if (!l.encerrada_em && !confirm("encerrar esta leitura compartilhada? o histórico continua guardado em nossas leituras.")) return;
                        await encerrarLeitura(l.id, !l.encerrada_em).catch(() => alert("o banco ainda não tem essa opção: rode o arquivo supabase/atualizacao-2026-11-coread.sql."));
                        recarregar();
                      }}
                    >
                      {l.encerrada_em ? "reabrir leitura" : "encerrar leitura"}
                    </button>
                  ) : null}
                  <button
                    role="menuitem"
                    type="button"
                    className={item}
                    onClick={async () => {
                      setMenu(false);
                      if (!confirm("sair desta leitura compartilhada? suas mensagens continuam na conversa.")) return;
                      await sairDaLeitura(l.id);
                      router.push("/co-read");
                    }}
                  >
                    sair da leitura compartilhada
                  </button>
                  {sou ? (
                    <button
                      role="menuitem"
                      type="button"
                      className={`${item} text-bordo`}
                      onClick={async () => {
                        setMenu(false);
                        if (!confirm("apagar a leitura compartilhada para todo mundo? a conversa e as reações somem e não dá para desfazer.")) return;
                        await apagarLeitura(l.id);
                        router.push("/co-read");
                      }}
                    >
                      apagar para todo mundo
                    </button>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
          {l.nome ? <p className="mt-2 font-mono text-[11px] tracking-[.1em] uppercase" style={{ color: e.tinta, opacity: 0.8 }}>{l.nome}</p> : null}
          <h1 className="mt-2 font-revista text-[26px] leading-[1.05] italic sm:text-[34px] lg:text-[44px]" style={{ color: e.tinta }}>
            {l.livro.titulo}
          </h1>
          <p className="mt-1 text-[13px] text-tinta-suave">{l.livro.autor}</p>
          <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="quem está lendo">
            {gente.map((p) => (
              <li key={p.usuario_id} className="flex items-center gap-1.5 text-[12px] text-ameixa">
                <span className="relative">
                  <Avatar pessoa={p.pessoa} tamanho={26} />
                  <MarcadorLeitora cor={cores.get(p.usuario_id)!} tamanho={11} className="absolute -right-1 -bottom-1" />
                </span>
                {p.usuario_id === eu ? "você" : nomeDe(p.pessoa)}
              </li>
            ))}
          </ul>
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-tinta-suave">
            <span>desde {dataLonga(l.inicio ?? l.criado_em)}</span>
            {l.prazo ? (
              <span>
                até {dataLonga(l.prazo)}
                {!fechada && prazo !== null ? ` · ${prazo > 0 ? `${prazo} ${prazo === 1 ? "dia restante" : "dias restantes"}` : prazo === 0 ? "prazo hoje" : "prazo encerrado"}` : ""}
              </span>
            ) : (
              <span>ritmo livre</span>
            )}
            {l.sem_spoiler !== false ? <span>conversa sem spoiler</span> : null}
          </p>
        </div>
      </div>
      {juntas ? <Carimbo texto="lemos juntas" sub="juntas" tamanho={92} className="absolute right-4 bottom-3 rotate-[-12deg]" /> : null}
    </header>
  );
}

/* ───────── meu progresso (o mesmo registro da estante) ───────── */
function MeuProgresso({ l, eu, recarregar, edicao }: { l: Coread; eu: string | null; recarregar: () => void; edicao?: number }) {
  const editarLivro = usePerfil((s) => s.editarLivro);
  const minha = l.pessoas.find((p) => p.usuario_id === eu)!;
  const total = totalDe(l);
  const cor = coresDasLeitoras(l.pessoas).get(minha.usuario_id)!;
  const [pagina, setPagina] = useState("");
  const [paginasTotal, setPaginasTotal] = useState("");
  const [salvando, setSalvando] = useState(false);
  const pct = pctDe(minha, total);
  if (encerrada(l) && !minha.terminou) return null;

  async function salvar(terminou = false) {
    setSalvando(true);
    let t = total;
    if (!t && Number(paginasTotal) > 0) {
      t = Math.round(Number(paginasTotal));
      await definirPaginasDaLeitura(l.id, l.livro, t).catch(() => {});
    }
    const p = terminou ? t || Number(pagina) || minha.pagina : Math.max(0, Math.min(t || Infinity, Math.round(Number(pagina) || 0)));
    try {
      await atualizarMinhaPagina(l.id, p, terminou);
      // a estante pessoal acompanha (na minha edição, se for outra)
      const naMinha = edicao && t && edicao !== t ? Math.round((p / t) * edicao) : p;
      editarLivro(
        { id: l.livro.id, titulo: l.livro.titulo, autor: l.livro.autor, capa: l.livro.capa },
        terminou
          ? { status: "lido", lidoEm: new Date().toISOString(), paginaAtual: edicao || t || undefined, paginas: edicao || t || undefined }
          : { status: "lendo", paginaAtual: naMinha, paginas: edicao || t || undefined },
      );
      if (terminou)
        celebrar({ tipo: "livro", titulo: l.livro.titulo, capa: l.livro.capa ?? "", texto: "você terminou a leitura compartilhada. as outras pessoas continuam no ritmo delas.", livroId: l.livro.id });
      setPagina("");
      recarregar();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section aria-labelledby="t-meu" className="mt-5 grid gap-4 border-b border-linha pb-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-10 lg:border-fio">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="t-meu" className="flex items-center gap-2 text-[14px] font-semibold text-ameixa">
            <MarcadorLeitora cor={cor} tamanho={15} />
            minha leitura
          </h2>
          <span className="text-[13px] tabular-nums text-tinta-suave">
            {minha.terminou ? "concluída" : total ? `pág. ${minha.pagina} de ${total} · ${pct}%` : minha.pagina ? `pág. ${minha.pagina}` : "ainda não começou"}
          </span>
        </div>
        <div className="mt-2">
          <Barrinha pct={pct} cor={cor} />
        </div>
        {edicao && total && edicao !== total ? (
          <p className="mt-2 text-[11px] text-cinza">
            sua edição tem {edicao} páginas; aqui a referência é a de {total}. a página é convertida pela porcentagem, então é aproximada.
          </p>
        ) : null}
      </div>
      {!minha.terminou ? (
        <div className="flex flex-wrap items-center gap-2">
          {!total ? (
            <input
              inputMode="numeric"
              value={paginasTotal}
              onChange={(e) => setPaginasTotal(e.target.value.replace(/\D/g, "").slice(0, 5))}
              placeholder="total de páginas"
              aria-label="quantas páginas tem o livro"
              className="h-11 w-[150px] rounded-pill border border-linha bg-transparent px-4 text-[14px] outline-none focus:border-bordo"
            />
          ) : null}
          <input
            inputMode="numeric"
            value={pagina}
            onChange={(e) => setPagina(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 5))}
            placeholder={minha.pagina ? `estou na pág. ${minha.pagina}` : "em que página você está?"}
            aria-label="página atual"
            className="h-11 w-[190px] rounded-pill border border-linha bg-transparent px-4 text-[14px] outline-none focus:border-bordo"
          />
          <button type="button" disabled={!pagina || salvando} onClick={() => salvar()} className={botaoPrincipal}>
            registrar leitura
          </button>
          <button type="button" disabled={salvando} onClick={() => salvar(true)} className={botaoSecundario}>
            terminei
          </button>
        </div>
      ) : null}
    </section>
  );
}

/* ───────── aba: nossa leitura ───────── */
function NossaLeitura({
  l,
  eu,
  recados,
  reacoes,
  guardados,
  irPara,
  recarregar,
}: {
  l: Coread;
  eu: string | null;
  recados: Recado[];
  reacoes: Reacao[];
  guardados: { pagina: number; quantas: number }[];
  irPara: (a: Aba) => void;
  recarregar: () => void;
}) {
  const total = totalDe(l);
  const cores = coresDasLeitoras(l.pessoas);
  const pessoas = ordemDasLeitoras(l.pessoas);
  const comum = emComum(l);
  const minha = l.pessoas.find((p) => p.usuario_id === eu)!;
  const minhaPag = minha.terminou ? Infinity : minha.pagina;
  const [reagindo, setReagindo] = useState(false);
  const sou = l.criado_por === eu;
  const convite = useCompartilharConvite(l);

  const meuTrecho = minha.terminou ? TRECHOS.length : trechoDaPagina(minha.pagina, total);
  const proxima = guardados.length ? Math.min(...guardados.map((g) => g.pagina)) : null;
  const totalGuardadas = guardados.reduce((s, g) => s + g.quantas, 0);

  // atividade recente: só o que eu já posso ver
  const atividade = [
    ...recados.map((r) => ({ quando: r.criado_em, quem: r.autor, texto: "escreveu na conversa", pagina: r.pagina })),
    ...reacoes.filter((r) => !r.recado_id).map((r) => ({ quando: r.criado_em, quem: r.autor, texto: `reagiu: ${nomeDaReacao(r.tipo)}`, pagina: r.pagina })),
    ...l.pessoas.filter((p) => p.terminou).map((p) => ({ quando: p.terminou_em ?? p.atualizado_em, quem: p.usuario_id, texto: "concluiu a leitura", pagina: null as number | null })),
  ]
    .sort((a, b) => b.quando.localeCompare(a.quando))
    .slice(0, 6);
  const nome = (u: string) => (u === eu ? "você" : nomeDe(l.pessoas.find((p) => p.usuario_id === u)?.pessoa));

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] lg:gap-12">
      <div className="space-y-10">
        <section aria-labelledby="t-companhia">
          <div className={linhaSecao}>
            <h2 id="t-companhia" className={tituloSecao}>
              progresso da companhia
            </h2>
            {sou && l.codigo && !encerrada(l) ? (
              <button type="button" onClick={convite.compartilhar} className="text-[13px] font-semibold text-bordo hover:underline">
                {convite.copiado ? "convite copiado" : "convidar"}
              </button>
            ) : null}
          </div>
          <ul className="space-y-4">
            {pessoas.map((p) => {
              const est = estadoDe(p);
              const pct = pctDe(p, total);
              const cor = cores.get(p.usuario_id)!;
              return (
                <li key={p.usuario_id} className="flex items-center gap-3">
                  <span className="relative flex-none">
                    <Avatar pessoa={p.pessoa} tamanho={34} />
                    <MarcadorLeitora cor={cor} tamanho={12} className="absolute -right-1 -bottom-1" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2 text-[13px]">
                      <span className="truncate text-ameixa">{p.usuario_id === eu ? "você" : nomeDe(p.pessoa)}</span>
                      <span className="flex-none text-[12px] tabular-nums text-tinta-suave">
                        {est === "lendo" ? (total ? `pág. ${p.pagina} · ${pct}%` : `pág. ${p.pagina}`) : ROTULO_ESTADO[est]}
                        {est === "pausou" && p.pagina ? ` · pág. ${p.pagina}` : ""}
                      </span>
                    </span>
                    {est !== "convidada" ? (
                      <span className="mt-1.5 block">
                        <Barrinha pct={pct} cor={cor} />
                      </span>
                    ) : sou ? (
                      <button
                        type="button"
                        onClick={async () => {
                          await desfazerConvite(l.id, p.usuario_id).catch(() => {});
                          recarregar();
                        }}
                        className="mt-0.5 text-[11px] text-cinza underline-offset-2 hover:underline"
                      >
                        desfazer convite
                      </button>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
          {!total ? <p className="mt-3 text-[12px] text-cinza">sem o total de páginas, o progresso aparece só pela página. preencha acima, em minha leitura.</p> : null}
        </section>

        {comum && naLeitura(l).length > 1 ? (
          <section aria-labelledby="t-comum" className="relative border-y border-dashed py-5" style={{ borderColor: `${COR.vinho}55` }}>
            <h2 id="t-comum" className="font-mono text-[10px] tracking-[.16em] text-bordo uppercase">
              até onde chegamos juntas
            </h2>
            <p className="mt-2 font-revista text-[22px] leading-snug text-ameixa italic sm:text-[26px]">
              {comum.pct >= 100 ? "vocês terminaram a história juntas." : comum.pct ? `vocês chegaram juntas até ${comum.pct}% da história.` : "ainda não há um trecho em comum."}
            </p>
            <p className="mt-1.5 text-[13px] text-tinta-suave">
              {comum.pct && comum.pct < 100
                ? `tudo o que foi escrito até a pág. ${comum.pagina} já está aberto para todo mundo. o resto chega para cada uma quando ela passar da página.`
                : comum.pct >= 100
                  ? "a conversa inteira está aberta para todas."
                  : "as mensagens chegam para cada uma conforme ela avança; ninguém fica esperando a outra."}
            </p>
          </section>
        ) : null}

        <section aria-labelledby="t-linha">
          <div className={linhaSecao}>
            <h2 id="t-linha" className={tituloSecao}>
              linha do tempo
            </h2>
            <span className="text-[11px] text-cinza">por trechos do livro</span>
          </div>
          <LinhaDoTempo l={l} recados={recados} reacoes={reacoes} guardados={guardados} meuTrecho={meuTrecho} />
        </section>

        <section aria-labelledby="t-atividade">
          <div className={linhaSecao}>
            <h2 id="t-atividade" className={tituloSecao}>
              atividade recente
            </h2>
          </div>
          {atividade.length ? (
            <ul>
              {atividade.map((a, i) => (
                <li key={i} className="flex items-center gap-2.5 border-b border-linha py-2.5 text-[13px] last:border-0 lg:border-fio">
                  <MarcadorLeitora cor={cores.get(a.quem) ?? COR.vinho} tamanho={13} />
                  <span className="min-w-0 flex-1 text-ameixa">
                    <b className="font-semibold">{nome(a.quem)}</b> {a.texto}
                    {a.pagina !== null && a.pagina !== undefined ? <span className="text-tinta-suave"> · pág. {a.pagina}</span> : null}
                  </span>
                  <span className="flex-none text-[11px] text-cinza">{quandoFoi(a.quando)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="font-accent text-sm text-cinza italic">nada por aqui ainda. que tal deixar a primeira reação?</p>
          )}
        </section>
      </div>

      <aside className="mt-10 space-y-8 lg:mt-0">
        {totalGuardadas ? (
          <button type="button" onClick={() => irPara("conversa")} className="flex w-full items-center gap-3 rounded-[4px] border border-dashed p-4 text-left" style={{ borderColor: `${COR.vinho}66`, background: `${COR.rosa}22` }}>
            <Envelope tamanho={46} fundo={COR.creme} />
            <span>
              <span className="block font-revista text-[17px] text-bordo italic">
                {totalGuardadas === 1 ? "uma mensagem está esperando por você." : `${totalGuardadas} mensagens estão esperando por você.`}
              </span>
              <span className="mt-0.5 block text-[12px] text-tinta-suave">a próxima abre quando você passar da pág. {proxima}.</span>
            </span>
          </button>
        ) : null}

        {!encerrada(l) ? (
          <section aria-labelledby="t-atalhos">
            <h2 id="t-atalhos" className="mb-3 font-mono text-[10px] tracking-[.16em] text-bordo uppercase">
              atalhos
            </h2>
            <div className="relative flex flex-wrap gap-2">
              <button type="button" onClick={() => setReagindo((r) => !r)} aria-expanded={reagindo} className="inline-flex h-10 items-center gap-2 rounded-pill border border-linha px-3.5 text-[13px] font-semibold text-ameixa hover:border-bordo">
                <IconeReacao tipo="amei" tamanho={17} /> reagir à leitura
              </button>
              <button type="button" onClick={() => irPara("conversa")} className="inline-flex h-10 items-center gap-2 rounded-pill border border-linha px-3.5 text-[13px] font-semibold text-ameixa hover:border-bordo">
                <IconeReacao tipo="conversar" tamanho={17} cor={COR.vinho} /> escrever na conversa
              </button>
              {reagindo ? (
                <div className="absolute top-10 left-0">
                  <SeletorReacao
                    fechar={() => setReagindo(false)}
                    onEscolher={async (t) => {
                      await reagir(l.id, t, minha.terminou ? total || minha.pagina : minha.pagina).catch(() => alert("o banco ainda não tem as reações: rode o arquivo supabase/atualizacao-2026-11-coread.sql."));
                      recarregar();
                    }}
                  />
                </div>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] text-cinza">a reação fica presa à sua página atual e só aparece para quem já chegou nela.</p>
          </section>
        ) : null}

        {l.prazo || total ? (
          <section aria-labelledby="t-marcos" className="space-y-3 text-[13px]">
            <h2 id="t-marcos" className="font-mono text-[10px] tracking-[.16em] text-bordo uppercase">
              marcos
            </h2>
            {l.prazo ? (
              <p className="flex justify-between gap-3 border-b border-linha pb-2 lg:border-fio">
                <span className="text-tinta-suave">prazo</span>
                <span className="text-ameixa">{dataLonga(l.prazo)}</span>
              </p>
            ) : null}
            {total && !minha.terminou && meuTrecho < TRECHOS.length - 1 ? (
              <p className="flex justify-between gap-3 border-b border-linha pb-2 lg:border-fio">
                <span className="text-tinta-suave">próximo trecho</span>
                <span className="text-ameixa">
                  {TRECHOS[meuTrecho + 1].nome} · pág. {paginasDoTrecho(meuTrecho + 1, total)?.[0]}
                </span>
              </p>
            ) : null}
            {minhaPag !== Infinity && total ? (
              <p className="flex justify-between gap-3">
                <span className="text-tinta-suave">faltam para você</span>
                <span className="text-ameixa">
                  {Math.max(0, total - minha.pagina)} {total - minha.pagina === 1 ? "página" : "páginas"}
                </span>
              </p>
            ) : null}
          </section>
        ) : null}

        {reacoes.filter((r) => !r.recado_id).length ? (
          <section aria-labelledby="t-reacoes">
            <h2 id="t-reacoes" className="mb-3 font-mono text-[10px] tracking-[.16em] text-bordo uppercase">
              reações recentes
            </h2>
            <ul className="space-y-2">
              {reacoes
                .filter((r) => !r.recado_id)
                .slice(-5)
                .reverse()
                .map((r) => (
                  <li key={r.id} className="flex items-center gap-2 text-[13px] text-ameixa">
                    <IconeReacao tipo={r.tipo} tamanho={18} />
                    <span className="min-w-0 flex-1 truncate">
                      {nome(r.autor)} · {nomeDaReacao(r.tipo)}
                    </span>
                    {r.pagina !== null ? <span className="text-[11px] text-cinza">pág. {r.pagina}</span> : null}
                    {r.autor === eu ? (
                      <button type="button" onClick={async () => (await desfazerReacao(r.id), recarregar())} aria-label="desfazer reação" className="text-[11px] text-cinza hover:text-bordo">
                        desfazer
                      </button>
                    ) : null}
                  </li>
                ))}
            </ul>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

/* a linha do tempo: trechos alcançados, em leitura e ainda não alcançados */
function LinhaDoTempo({
  l,
  recados,
  reacoes,
  guardados,
  meuTrecho,
}: {
  l: Coread;
  recados: Recado[];
  reacoes: Reacao[];
  guardados: { pagina: number; quantas: number }[];
  meuTrecho: number;
}) {
  const total = totalDe(l);
  const cores = coresDasLeitoras(l.pessoas);
  const gente = ordemDasLeitoras(naLeitura(l));
  if (!total)
    return <p className="text-[13px] text-tinta-suave">a linha do tempo aparece quando o livro tiver o total de páginas.</p>;
  return (
    <ol className="relative grid gap-0 lg:grid-cols-5">
      {TRECHOS.map((t, i) => {
        const estado = i < meuTrecho ? "lido" : i === meuTrecho ? "lendo" : "depois";
        const pags = paginasDoTrecho(i, total)!;
        const msgs = recados.filter((r) => r.pagina !== null && trechoDaPagina(r.pagina, total) === i).length;
        const reac = reacoes.filter((r) => !r.recado_id && r.pagina !== null && trechoDaPagina(r.pagina, total) === i).length;
        const presas = guardados.filter((g) => trechoDaPagina(g.pagina, total) === i).reduce((s, g) => s + g.quantas, 0);
        const aqui = gente.filter((p) => (p.terminou ? TRECHOS.length - 1 : trechoDaPagina(p.pagina, total)) === i);
        return (
          <li key={t.nome} className="relative flex gap-4 pb-6 last:pb-0 lg:block lg:pr-3 lg:pb-0">
            {/* o fio que liga os trechos */}
            <span
              aria-hidden
              className="absolute top-3 bottom-0 left-[9px] w-0 border-l-2 lg:top-[9px] lg:right-0 lg:bottom-auto lg:left-[9px] lg:h-0 lg:w-auto lg:border-t-2 lg:border-l-0"
              style={{ borderColor: estado === "lido" ? COR.vinho : `${COR.vinho}55`, borderStyle: estado === "lido" ? "solid" : "dashed" }}
            />
            <span
              aria-hidden
              className="relative z-10 grid size-5 flex-none place-items-center rounded-full border-2"
              style={{
                borderColor: COR.vinho,
                background: estado === "lido" ? COR.vinho : estado === "lendo" ? COR.rosa : COR.creme,
              }}
            >
              {estado === "lendo" ? <span className="size-1.5 rounded-full" style={{ background: COR.vinho }} /> : null}
            </span>
            <div className="min-w-0 lg:mt-3">
              <p className={`text-[14px] ${estado === "depois" ? "text-cinza" : "font-semibold text-ameixa"}`}>
                {t.nome}
                <span className="ml-1.5 text-[11px] font-normal text-cinza">
                  pág. {pags[0]}–{pags[1]}
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-tinta-suave">
                {estado === "lido" ? "trecho alcançado" : estado === "lendo" ? "você está aqui" : "ainda não alcançado"}
              </p>
              {aqui.length ? (
                <p className="mt-1.5 flex items-center gap-1">
                  {aqui.map((p) => (
                    <MarcadorLeitora key={p.usuario_id} cor={cores.get(p.usuario_id)!} tamanho={13} />
                  ))}
                </p>
              ) : null}
              {msgs || reac || presas ? (
                <p className="mt-1 text-[11px] text-tinta-suave">
                  {[msgs ? `${msgs} ${msgs === 1 ? "mensagem" : "mensagens"}` : "", reac ? `${reac} ${reac === 1 ? "reação" : "reações"}` : "", presas ? `${presas} ${presas === 1 ? "guardada" : "guardadas"}` : ""]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ───────── aba: conversa (same page) ───────── */
function Conversa({
  l,
  eu,
  recados,
  reacoes,
  guardados,
  recarregar,
}: {
  l: Coread;
  eu: string | null;
  recados: Recado[];
  reacoes: Reacao[];
  guardados: { pagina: number; quantas: number }[];
  recarregar: () => void;
}) {
  const total = totalDe(l);
  const cores = coresDasLeitoras(l.pessoas);
  const minha = l.pessoas.find((p) => p.usuario_id === eu)!;
  const protegida = l.sem_spoiler !== false;
  const [trecho, setTrecho] = useState<number | null>(null);
  const [texto, setTexto] = useState("");
  const [paginaRef, setPaginaRef] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [reagindoEm, setReagindoEm] = useState<string | null>(null);
  const fim = useRef<HTMLDivElement>(null);
  const totalGuardadas = guardados.reduce((s, g) => s + g.quantas, 0);
  const fechada = encerrada(l);

  const minhaPag = minha.terminou ? total || minha.pagina : minha.pagina;
  const visiveis = trecho === null ? recados : recados.filter((r) => r.pagina !== null && trechoDaPagina(r.pagina, total) === trecho);
  const reacoesDe = (rid: string) => reacoes.filter((r) => r.recado_id === rid);

  // separa por dia
  const porDia = useMemo(() => {
    const g: { dia: string; itens: Recado[] }[] = [];
    visiveis.forEach((r) => {
      const d = r.criado_em.slice(0, 10);
      if (g.length && g[g.length - 1].dia === d) g[g.length - 1].itens.push(r);
      else g.push({ dia: d, itens: [r] });
    });
    return g;
  }, [visiveis]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "nearest" });
  }, [recados.length]);

  async function enviar() {
    if (!texto.trim()) return;
    setEnviando(true);
    const ref = paginaRef ? Math.max(minhaPag, Number(paginaRef)) : protegida ? minhaPag : null;
    try {
      await mandarRecado(l.id, texto, ref);
      setTexto("");
      setPaginaRef("");
      recarregar();
    } finally {
      setEnviando(false);
    }
  }
  async function alternarReacao(r: Recado, t: TipoReacao) {
    const minhaR = reacoes.find((x) => x.recado_id === r.id && x.autor === eu && x.tipo === t);
    try {
      if (minhaR) await desfazerReacao(minhaR.id);
      else await reagir(l.id, t, r.pagina, r.id);
    } catch {
      alert("o banco ainda não tem as reações: rode o arquivo supabase/atualizacao-2026-11-coread.sql.");
    }
    recarregar();
  }
  const nome = (u: string) => (u === eu ? "você" : nomeDe(l.pessoas.find((p) => p.usuario_id === u)?.pessoa));

  return (
    <div className="lg:grid lg:grid-cols-[170px_minmax(0,1fr)_220px] lg:gap-10">
      {/* trechos */}
      <nav aria-label="trechos" className="-mx-5 mb-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:mb-0 lg:block lg:space-y-1 lg:px-0">
        {[{ i: null as number | null, nome: "tudo" }, ...TRECHOS.map((t, i) => ({ i: i as number | null, nome: t.nome }))].map((t) => {
          const on = trecho === t.i;
          const n = t.i === null ? recados.length : recados.filter((r) => r.pagina !== null && trechoDaPagina(r.pagina, total) === t.i).length;
          return (
            <button
              key={t.nome}
              type="button"
              aria-pressed={on}
              onClick={() => setTrecho(t.i)}
              disabled={!total && t.i !== null}
              className={`flex h-9 flex-none items-center justify-between gap-2 rounded-pill border px-3.5 text-[13px] lg:w-full lg:rounded-[4px] lg:border-0 lg:px-2.5 ${on ? "border-bordo bg-bordo/[.06] font-semibold text-bordo" : "border-linha text-ameixa hover:text-bordo"} disabled:opacity-40`}
            >
              {t.nome}
              {n ? <span className="text-[11px] font-normal text-cinza">{n}</span> : null}
            </button>
          );
        })}
      </nav>

      {/* mensagens */}
      <div className="min-w-0">
        {totalGuardadas ? (
          <div className="mb-6 flex items-center gap-3 border-y border-dashed py-3" style={{ borderColor: `${COR.vinho}55` }}>
            <Envelope tamanho={38} />
            <p className="text-[14px] text-ameixa">
              <span className="font-revista text-[17px] text-bordo italic">
                {totalGuardadas === 1 ? "uma mensagem está esperando por você." : `${totalGuardadas} mensagens estão esperando por você.`}
              </span>
              <span className="block text-[12px] text-tinta-suave">elas chegam quando você passar das páginas em que foram escritas. nada do conteúdo aparece antes disso.</span>
            </p>
          </div>
        ) : null}

        {porDia.length ? (
          <div className="space-y-6">
            {porDia.map((g) => (
              <section key={g.dia} aria-label={dataLonga(g.dia)}>
                <p className="mb-3 flex items-center gap-3 font-mono text-[10px] tracking-[.14em] text-cinza uppercase">
                  <span className="h-px flex-1 bg-linha" />
                  {dataLonga(g.dia)}
                  <span className="h-px flex-1 bg-linha" />
                </p>
                <ul className="space-y-4">
                  {g.itens.map((r) => {
                    const cor = cores.get(r.autor) ?? COR.vinho;
                    const autor = l.pessoas.find((p) => p.usuario_id === r.autor)?.pessoa ?? null;
                    const rs = reacoesDe(r.id);
                    const tipos = [...new Set(rs.map((x) => x.tipo))];
                    return (
                      <li key={r.id} className="flex gap-3">
                        <Avatar pessoa={autor} tamanho={32} />
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-baseline gap-x-2 text-[12px]">
                            <b className="font-semibold" style={{ color: cor }}>
                              {nome(r.autor)}
                            </b>
                            {r.pagina !== null ? (
                              <span className="rounded-[3px] px-1.5 py-px font-mono text-[10px] tracking-[.06em]" style={{ background: `${cor}18`, color: cor }}>
                                pág. {r.pagina}
                                {total ? ` · ${TRECHOS[trechoDaPagina(r.pagina, total)].nome}` : ""}
                              </span>
                            ) : null}
                            <span className="text-cinza">{new Date(r.criado_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                          </p>
                          <div className="mt-1 border-l-2 py-1 pl-3" style={{ borderColor: cor }}>
                            <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-ameixa">{r.texto}</p>
                          </div>
                          <div className="relative mt-1.5 flex flex-wrap items-center gap-1.5">
                            {tipos.map((t) => {
                              const meu = rs.some((x) => x.tipo === t && x.autor === eu);
                              const n = rs.filter((x) => x.tipo === t).length;
                              return (
                                <button
                                  key={t}
                                  type="button"
                                  title={nomeDaReacao(t)}
                                  aria-pressed={meu}
                                  onClick={() => alternarReacao(r, t)}
                                  className={`inline-flex h-7 items-center gap-1 rounded-pill border px-2 text-[11px] ${meu ? "border-bordo/50 bg-bordo/[.06] text-bordo" : "border-linha text-tinta-suave"}`}
                                >
                                  <IconeReacao tipo={t} tamanho={14} />
                                  {n}
                                  <span className="sr-only">{nomeDaReacao(t)}</span>
                                </button>
                              );
                            })}
                            {!fechada ? (
                              <button type="button" onClick={() => setReagindoEm(reagindoEm === r.id ? null : r.id)} className="inline-flex h-7 items-center rounded-pill px-1.5 text-[11px] text-cinza hover:text-bordo">
                                reagir
                              </button>
                            ) : null}
                            {r.autor === eu ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm("apagar esta mensagem?")) return;
                                  await apagarRecado(r.id);
                                  recarregar();
                                }}
                                className="inline-flex h-7 items-center px-1.5 text-[11px] text-cinza hover:text-bordo"
                              >
                                apagar
                              </button>
                            ) : null}
                            {reagindoEm === r.id ? (
                              <div className="absolute top-6 left-0">
                                <SeletorReacao fechar={() => setReagindoEm(null)} onEscolher={(t) => alternarReacao(r, t)} />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <Marcadores tamanho={70} className="mx-auto" />
            <p className="mt-3 font-revista text-[20px] text-bordo italic">{trecho === null ? "same book, different minds." : "nada neste trecho ainda."}</p>
            <p className="mt-1 text-[13px] text-tinta-suave">{trecho === null ? "comece a conversa sobre o que você já leu." : "as mensagens aparecem aqui conforme vocês avançam."}</p>
          </div>
        )}
        <div ref={fim} />

        {/* escrever: fica acessível acima do menu do celular e do teclado */}
        {!fechada ? (
          <div className="sticky bottom-[var(--altura-menu,0px)] z-10 -mx-5 mt-6 border-t border-linha bg-creme/95 px-5 pt-3 pb-3 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
            <label className="sr-only" htmlFor="msg">
              mensagem
            </label>
            <textarea
              id="msg"
              value={texto}
              onChange={(e) => setTexto(e.target.value.slice(0, 1000))}
              rows={2}
              placeholder="o que você está achando até aqui?"
              className="w-full resize-none rounded-[4px] border border-linha bg-papel px-3.5 py-2.5 text-[15px] outline-none focus:border-bordo"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {protegida ? (
                <label className="flex items-center gap-2 text-[12px] text-tinta-suave">
                  sobre a pág.
                  <input
                    inputMode="numeric"
                    value={paginaRef}
                    onChange={(e) => setPaginaRef(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder={String(minhaPag)}
                    aria-describedby="dica-pagina"
                    className="h-9 w-[78px] rounded-pill border border-linha bg-transparent px-3 text-[13px] outline-none focus:border-bordo"
                  />
                </label>
              ) : null}
              <button type="button" onClick={enviar} disabled={!texto.trim() || enviando} className={`${botaoPrincipal} ml-auto h-10`}>
                {enviando ? "enviando…" : "enviar"}
              </button>
              {protegida ? (
                <p id="dica-pagina" className="w-full text-[11px] text-cinza">
                  {paginaRef && Number(paginaRef) > minhaPag
                    ? `guardada para depois: só chega para quem passar da pág. ${paginaRef}.`
                    : `chega para quem já passou da pág. ${minhaPag}. para guardar para depois, escolha uma página mais à frente.`}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* painel de contexto */}
      <aside className="hidden lg:block">
        <h2 className="mb-3 font-mono text-[10px] tracking-[.16em] text-bordo uppercase">onde cada uma está</h2>
        <ul className="space-y-3">
          {ordemDasLeitoras(naLeitura(l)).map((p) => (
            <li key={p.usuario_id} className="text-[12px]">
              <span className="flex items-center gap-1.5 text-ameixa">
                <MarcadorLeitora cor={cores.get(p.usuario_id)!} tamanho={12} />
                <span className="min-w-0 flex-1 truncate">{nome(p.usuario_id)}</span>
                <span className="text-tinta-suave">{p.terminou ? "concluiu" : total ? `${pctDe(p, total)}%` : `p. ${p.pagina}`}</span>
              </span>
              <span className="mt-1 block">
                <Barrinha pct={pctDe(p, total)} cor={cores.get(p.usuario_id)!} />
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[11px] leading-relaxed text-cinza">
          {protegida
            ? "cada mensagem fica presa à página em que foi escrita. a proteção vale no banco de dados, não só na tela. se vocês leem edições diferentes, as páginas são uma referência aproximada."
            : "esta conversa está aberta: as mensagens aparecem para todo mundo."}
        </p>
      </aside>
    </div>
  );
}

/* ───────── aba: scrapbook ───────── */
function Scrapbook({ l, eu, reacoes }: { l: Coread; eu: string | null; reacoes: Reacao[] }) {
  const total = totalDe(l);
  const cores = coresDasLeitoras(l.pessoas);
  const soltas = reacoes.filter((r) => !r.recado_id);
  const e = ESTILOS[estiloDe(l)];
  const nome = (u: string) => (u === eu ? "você" : nomeDe(l.pessoas.find((p) => p.usuario_id === u)?.pessoa));
  if (!soltas.length)
    return (
      <div className="flex flex-col items-center border-y border-linha px-6 py-12 text-center lg:border-fio">
        <Envelope tamanho={70} />
        <p className="mt-4 font-revista text-[24px] text-bordo italic">nossa história começa aqui.</p>
        <p className="mt-1.5 max-w-[420px] text-[14px] text-tinta-suave">
          as reações que vocês deixam pela leitura ficam guardadas aqui, trecho por trecho. citações, cartinhas e teorias entram nas próximas etapas do co-read.
        </p>
      </div>
    );
  const porTrecho = TRECHOS.map((t, i) => ({ t, itens: soltas.filter((r) => trechoDaPagina(r.pagina, total) === i) })).filter((x) => x.itens.length);
  return (
    <div className="columns-1 gap-6 sm:columns-2 lg:columns-3">
      {porTrecho.map(({ t, itens }, k) => (
        <article
          key={t.nome}
          className={`relative mb-6 break-inside-avoid border px-5 pt-6 pb-5 ${k % 2 ? "rotate-[.6deg]" : "-rotate-[.5deg]"}`}
          style={{ background: k % 3 === 1 ? e.fundo : COR.creme, borderColor: `${COR.vinho}22` }}
        >
          <Fita cor={k % 2 ? COR.chartreuse : e.destaque} className="-top-2 left-6 -rotate-2" />
          <p className="font-mono text-[10px] tracking-[.16em] text-bordo uppercase">{t.nome}</p>
          <ul className="mt-3 space-y-2.5">
            {itens.map((r) => (
              <li key={r.id} className="flex items-center gap-2.5 text-[13px] text-ameixa">
                <IconeReacao tipo={r.tipo} tamanho={22} />
                <span className="min-w-0 flex-1">
                  <span className="font-revista text-[15px] italic">{nomeDaReacao(r.tipo)}</span>
                  <span className="block text-[11px] text-tinta-suave">
                    <MarcadorLeitora cor={cores.get(r.autor) ?? COR.vinho} tamanho={10} className="mr-1 inline" />
                    {nome(r.autor)}
                    {r.pagina !== null ? ` · pág. ${r.pagina}` : ""} · {dataCurta(r.criado_em)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

/* ───────── aba: avaliações ───────── */
function Avaliacoes({ l, eu }: { l: Coread; eu: string | null }) {
  const gente = ordemDasLeitoras(naLeitura(l));
  const cores = coresDasLeitoras(l.pessoas);
  const prontas = gente.filter((p) => p.terminou).length;
  const minha = l.pessoas.find((p) => p.usuario_id === eu)!;
  return (
    <div className="max-w-[720px]">
      <p className="font-revista text-[22px] leading-snug text-ameixa italic">
        {prontas === gente.length ? "todo mundo terminou." : `${prontas} de ${gente.length} ${gente.length === 1 ? "pessoa terminou" : "pessoas terminaram"}.`}
      </p>
      <p className="mt-1.5 text-[14px] text-tinta-suave">
        a revelação das notas, em que cada uma avalia sem ver a nota da outra e todas aparecem juntas, chega na próxima etapa do co-read. por enquanto, cada uma avalia o livro na própria página dele.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {gente.map((p) => (
          <li key={p.usuario_id} className="flex items-center gap-3 border-b border-linha pb-4 lg:border-fio">
            <span className="relative flex-none">
              <Avatar pessoa={p.pessoa} tamanho={38} />
              <MarcadorLeitora cor={cores.get(p.usuario_id)!} tamanho={12} className="absolute -right-1 -bottom-1" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[14px] text-ameixa">{p.usuario_id === eu ? "você" : nomeDe(p.pessoa)}</span>
              <span className="block text-[12px] text-tinta-suave">{p.terminou ? `concluiu${p.terminou_em ? ` em ${dataCurta(p.terminou_em)}` : ""}` : ROTULO_ESTADO[estadoDe(p)]}</span>
            </span>
          </li>
        ))}
      </ul>
      {minha.terminou ? (
        <Link href={`/livro/${l.livro.id}`} className={`${botaoSecundario} mt-6`}>
          avaliar o livro
        </Link>
      ) : null}
    </div>
  );
}

export default function CoreadLeituraPage() {
  return (
    <AppShell aba="clubes">
      <div className="flex flex-1 flex-col px-5 pt-2 pb-10 lg:bg-jornal lg:px-12 lg:pt-6">
        <div className="w-full max-w-[1180px]">
          <div className="mb-3 flex items-center justify-between">
            <Voltar padrao="/co-read" rotulo="leituras compartilhadas" className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo" />
            <Wordmark tamanho={22} assinatura={false} />
          </div>
          <ComConta>
            <Leitura />
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
