"use client";

import { Voltar } from "@/components/Voltar";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { EntreLeitores } from "@/components/descobrir/Secoes";
import { AdicionarALista } from "@/components/descoberta/AdicionarALista";
import { AlemDosFavoritos } from "@/components/descoberta/AlemDosFavoritos";
import { Busca, type BuscaControle } from "@/components/descoberta/Busca";
import { SelecaoDoMomento, SelecoesEditoriais } from "@/components/descoberta/Selecoes";
import { SUGESTOES_INICIAIS } from "@/lib/descoberta";
import { ChamadaEntrelinhas } from "@/components/entrelinhas/Chamada";
import { useHidratado } from "@/components/PerfilHidratacao";
import {
  dadosDoTermino,
  PerguntaTermino,
  type Termino,
} from "@/components/PerguntaTermino";
import { buscarLivros, chaveTitulo, sinopseDaObra } from "@/lib/catalogo";
import { estrelas } from "@/lib/estantes";
import {
  lembrarPassado,
  migrarPassados,
  useIndicacoes,
  type Indicacao,
} from "@/lib/indicacoes";
import { nuvemPronta } from "@/lib/nuvem";
import { estantesDasAmigas, nomeDe, type PessoaResumo } from "@/lib/social";
import { usePerfil, type StatusLivro } from "@/lib/perfil-store";

/**
 * Descobrir livros: um lugar fixo no menu, com uma indicação por vez —
 * passar, quero ler ou já li. O que passou não volta, em nenhum aparelho.
 */
export default function DescobrirPage() {
  const hidratado = useHidratado();
  useEffect(() => {
    // os "passar" antigos, guardados só neste navegador, vão para o perfil
    const t = setInterval(() => {
      if (nuvemPronta()) {
        migrarPassados();
        clearInterval(t);
      }
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const controle = useRef<BuscaControle | null>(null);
  const [buscando, setBuscando] = useState(false);
  const definirControle = useCallback((c: BuscaControle) => {
    controle.current = c;
  }, []);
  const explorar = useCallback((q: string) => {
    controle.current?.pesquisar(q);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  // quatro a seis sugestões por visita, variando (sempre com "me surpreenda")
  const [sugestoes] = useState(() => [...SUGESTOES_INICIAIS].sort(() => Math.random() - 0.5).slice(0, 3).concat("Me surpreenda"));

  return (
    <AppShell aba="descobrir">
      <div className="flex flex-1 flex-col pb-10 lg:px-12 lg:py-10">
        <div className="mx-auto w-full max-w-[1140px]">
          {hidratado ? (
            <div className="lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(280px,2fr)] lg:gap-14">
              {/* coluna principal */}
              <div className="min-w-0">
                <header className="px-6 pt-3 lg:px-0 lg:pt-0">
                  {buscando ? (
                    <button type="button" onClick={() => controle.current?.limpar()} className="-ml-2 mb-1 flex min-h-11 items-center gap-1 px-2 text-[13px] font-semibold text-bordo">
                      ← voltar ao descobrir
                    </button>
                  ) : (
                    <Voltar padrao="/" rotulo="início" className="-ml-2 mb-1 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo lg:hidden" />
                  )}
                  <h1 className="font-revista text-[36px] leading-none text-bordo italic lg:text-[56px]">descobrir.</h1>
                  <p className="mt-1.5 text-[13px] text-cinza lg:text-[14px]">Sempre há outra história.</p>
                </header>
                <div className="mt-5 px-6 lg:px-0">
                  <Busca
                    modo={{ tipo: "descobrir" }}
                    chaveSessao="bookside-busca-descobrir"
                    placeholder="Livros, autores, temas ou sensações"
                    sugestoes={sugestoes}
                    sugestoesEmLinks
                    onAtiva={setBuscando}
                    controle={definirControle}
                  />
                </div>
                {/* com uma pesquisa ativa, os resultados tomam o lugar da composição editorial */}
                {!buscando ? (
                  <>
                    <UmaPorVez />
                    <div className="mt-8">
                      <SelecaoDoMomento explorar={explorar} />
                    </div>
                  </>
                ) : null}
              </div>

              {/* coluna complementar (no celular, vem depois, na mesma ordem) */}
              {!buscando ? (
                <aside className="mt-10 min-w-0 space-y-10 px-6 lg:mt-[118px] lg:px-0">
                  <SelecoesEditoriais explorar={explorar} />
                  <AlemDosFavoritos explorar={explorar} />
                  <EntreLeitores />
                  <ChamadaEntrelinhas />
                </aside>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

/**
 * A sinopse da indicação: a que veio junto ou, se não veio (como nos livros
 * em alta no the bookside), a do catálogo, buscada na hora.
 */
function useSinopse(livro: Indicacao | undefined) {
  const [buscadas, setBuscadas] = useState<Record<string, string | null>>({});
  const id = livro?.id;
  const titulo = livro?.titulo ?? "";
  const autor = livro?.autor ?? "";
  const precisa = !!livro && !livro.sinopse && !(livro.id in buscadas);
  useEffect(() => {
    if (!precisa || !id) return;
    const ctrl = new AbortController();
    (async () => {
      // pelo código do catálogo; se não for de lá, pelo título e autoria
      const daObra = await sinopseDaObra(id, ctrl.signal).catch(() => undefined);
      if (daObra) return daObra;
      const achados = await buscarLivros(`${titulo} ${autor}`.trim()).catch(
        () => [],
      );
      return achados.find(
        (l) => l.sinopse && chaveTitulo(l.titulo) === chaveTitulo(titulo),
      )?.sinopse;
    })()
      .then((s) => !ctrl.signal.aborted && setBuscadas((b) => ({ ...b, [id]: s ?? null })))
      .catch(() => setBuscadas((b) => ({ ...b, [id]: null })));
    return () => ctrl.abort();
  }, [precisa, id, titulo, autor]);
  if (!livro) return undefined;
  return livro.sinopse ?? buscadas[livro.id] ?? undefined;
}

/** a nota de quem leu no the bookside (e um pedacinho de resenha) */
function OQueAcharam({ livro }: { livro: Indicacao }) {
  if (!livro.notaApp && !livro.resenhaApp) return null;
  return (
    <div className="mt-3 rounded-[10px] border border-linha bg-creme px-3.5 py-2.5 text-left lg:border-fio">
      {livro.notaApp ? (
        <p className="flex flex-wrap items-baseline gap-x-2 text-[12px]">
          <b className="font-display text-[18px] leading-none font-semibold text-bordo">
            {livro.notaApp.toLocaleString("pt-BR", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </b>
          <span className="tracking-[1px] text-bordo">
            {estrelas(Math.round(livro.notaApp * 2) / 2)}
          </span>
          <span className="text-cinza">
            {livro.avaliacoesApp === 1
              ? "nota de 1 leitora do the bookside"
              : `média de ${livro.avaliacoesApp ?? "várias"} leitoras do the bookside`}
          </span>
        </p>
      ) : null}
      {livro.resenhaApp ? (
        <p className="mt-1.5 line-clamp-3 text-[13px] leading-[1.5] text-tinta-suave">
          <b className="font-semibold text-ameixa">{livro.resenhaApp.de}:</b>{" "}
          {livro.resenhaApp.texto}
        </p>
      ) : null}
    </div>
  );
}

/* ───────── uma por vez ───────── */

/** quem eu sigo e já leu cada livro (pelo título), carregado uma vez */
function useAmigasQueLeram() {
  const [mapa, setMapa] = useState<Map<string, PessoaResumo[]>>(new Map());
  useEffect(() => {
    let vivo = true;
    estantesDasAmigas()
      .then((lista) => {
        const m = new Map<string, PessoaResumo[]>();
        for (const { pessoa, livros } of lista)
          for (const l of livros)
            if (l.status === "lido") {
              const k = chaveTitulo(l.titulo);
              m.set(k, [...(m.get(k) ?? []), pessoa]);
            }
        if (vivo) setMapa(m);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);
  return mapa;
}

function UmaPorVez() {
  const guardarLivro = usePerfil((s) => s.guardarLivro);
  const queroLer = usePerfil(
    (s) => s.livros.filter((l) => l.status === "quero").length,
  );
  const indicacoes = useIndicacoes();
  // livro pedido de fora (ex.: a recomendação do início) — essa é a leitura
  // que a pessoa clicou, então ela tem que ser a primeira da fila
  const pedido = useSearchParams().get("livro");
  // a fila fica parada durante a visita (os livros guardados não somem do meio dela)
  const [fila, setFila] = useState<Indicacao[] | null>(null);
  const [indice, setIndice] = useState(0);
  const [perguntarTermino, setPerguntarTermino] = useState(false);
  useEffect(() => {
    if (fila === null && !indicacoes.carregando) {
      const ordenada = [...indicacoes.lista].sort(
        (a, b) => Number(!!b.sinopse) - Number(!!a.sinopse),
      );
      const i = pedido ? ordenada.findIndex((l) => l.id === pedido) : -1;
      setFila(
        i > 0
          ? [ordenada[i], ...ordenada.slice(0, i), ...ordenada.slice(i + 1)]
          : ordenada,
      );
    }
  }, [fila, indicacoes.carregando, indicacoes.lista, pedido]);
  // a versão mais nova do livro (a reserva ganha capa e sinopse depois que chega)
  const naFila = fila?.[indice];
  const livro =
    naFila &&
    (indicacoes.lista.find(
      (l) => chaveTitulo(l.titulo) === chaveTitulo(naFila.titulo),
    ) ??
      naFila);
  const sinopse = useSinopse(livro);
  const amigas = useAmigasQueLeram();
  const leram = livro ? (amigas.get(chaveTitulo(livro.titulo)) ?? []) : [];
  const [sinopseAberta, setSinopseAberta] = useState(false);
  useEffect(() => setSinopseAberta(false), [livro?.id]);

  // infinita: perto do fim da fila já busca outra leva e junta no fim (sem repetir)
  const pedindo = useRef(false);
  const levasVazias = useRef(0);
  useEffect(() => {
    if (!fila || pedindo.current || indicacoes.carregando) return;
    if (indice >= fila.length - 2 && levasVazias.current < 3) {
      pedindo.current = true;
      indicacoes.maisUmaRodada();
    }
  }, [indice, fila, indicacoes]);
  useEffect(() => {
    if (!pedindo.current || indicacoes.carregando || !fila) return;
    pedindo.current = false;
    const vistos = new Set(fila.map((l) => chaveTitulo(l.titulo)));
    const novos = indicacoes.lista.filter((l) => !vistos.has(chaveTitulo(l.titulo)));
    levasVazias.current = novos.length ? 0 : levasVazias.current + 1;
    if (novos.length) setFila((f) => [...(f ?? []), ...novos]);
  }, [indicacoes.carregando, indicacoes.lista, fila]);

  function responder(status: StatusLivro | null, termino?: Termino) {
    if (!livro) return;
    if (status === "lido" && !termino) return setPerguntarTermino(true);
    if (!status) lembrarPassado(livro.titulo);
    else
      guardarLivro({
        id: livro.id,
        titulo: livro.titulo,
        autor: livro.autor,
        capa: livro.capa,
        status,
        ...(termino ? dadosDoTermino(termino) : {}),
      });
    setIndice((i) => i + 1);
  }

  function maisUmaRodada() {
    levasVazias.current = 0;
    pedindo.current = true;
    indicacoes.maisUmaRodada();
  }

  const botao =
    "flex flex-col items-center gap-2 text-[9px] font-semibold tracking-[.14em] text-cinza uppercase";
  const selo =
    "flex size-14 items-center justify-center rounded-full border border-linha bg-creme transition-transform active:scale-95 lg:size-[60px]";
  const icone = (d: string, cor = "currentColor") => (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke={cor}
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );

  return (
    <section className="grao relative mx-6 mt-8 overflow-hidden rounded-[4px] bg-citacao-suave p-5 lg:mx-0 lg:p-7">
      {/* um recorte de papel no canto: só decoração, longe dos controles */}
      <span aria-hidden className="pointer-events-none absolute -top-3 -right-6 h-16 w-28 rotate-[8deg] bg-rosa-editorial/80 [clip-path:polygon(0_12%,8%_0,20%_10%,34%_2%,48%_12%,62%_0,76%_9%,90%_1%,100%_10%,100%_100%,0_100%)]" />
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="relative font-revista text-[20px] text-ameixa italic lg:text-[24px]">
          Uma escolha para você
        </h2>
        {queroLer ? (
          <Link
            href="/estantes"
            className="text-[11px] font-semibold text-cinza underline underline-offset-4"
          >
            {queroLer} na sua lista de quero ler
          </Link>
        ) : null}
      </div>

      {fila === null ? (
        <div className="mt-4 flex animate-pulse flex-col items-center gap-5 sm:flex-row sm:items-start lg:gap-10">
          <span className="block aspect-[2/3] w-[160px] rounded-[4px] bg-linha lg:w-[260px]" />
          <span className="w-full flex-1 space-y-3 pt-2">
            <span className="block h-3 w-40 rounded bg-linha" />
            <span className="block h-7 w-64 rounded bg-linha" />
            <span className="block h-3 w-48 rounded bg-linha" />
            <span className="block h-16 w-full rounded bg-linha/70" />
          </span>
        </div>
      ) : livro ? (
        <div
          key={livro.id}
          className="mt-4 flex animate-subir flex-col items-center gap-5 sm:flex-row sm:items-start lg:gap-10"
        >
          <Link href={`/livro/${livro.id}`} className="flex-none">
            <CapaLivro
              titulo={livro.titulo}
              capa={livro.capa}
              cor={livro.cor}
              className="w-[120px] rotate-[1.5deg] shadow-[0_16px_28px_-12px_rgba(43,20,32,.5)] lg:w-[180px] [&>span:last-child]:text-sm"
            />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col text-center sm:text-left">
            <p className="text-[10px] font-semibold tracking-[.14em] text-bordo uppercase">
              {livro.motivo}
            </p>
            <p className="mt-1.5 font-revista text-[22px] leading-[1.15] text-ameixa lg:text-[26px]">
              {livro.titulo}
            </p>
            <p className="mt-1 text-[11px] font-semibold tracking-[.1em] text-cinza uppercase">
              <Link href={`/autor/${encodeURIComponent(livro.autor)}`} className="underline-offset-4 hover:text-bordo hover:underline">
                {livro.autor}
              </Link>
              {livro.ano ? ` · ${livro.ano}` : ""}
              {livro.paginas ? ` · ${livro.paginas} páginas` : ""}
            </p>
            {leram.length ? (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-tinta-suave sm:justify-start">
                <span className="flex -space-x-1.5">
                  {leram.slice(0, 3).map((p) =>
                    p.foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={p.id} src={p.foto} alt="" className="size-4 rounded-full border border-creme object-cover" />
                    ) : (
                      <span key={p.id} className="size-4 rounded-full border border-creme bg-rosa-claro" />
                    ),
                  )}
                </span>
                {leram.length === 1 ? `${nomeDe(leram[0])} leu` : `${nomeDe(leram[0])} e mais ${leram.length - 1} leram`}
              </p>
            ) : null}
            <OQueAcharam livro={livro} />
            {sinopse ? (
              <>
                <p className={`mt-3 text-[13px] leading-normal text-tinta-suave lg:text-[15px] lg:leading-[1.6] ${sinopseAberta ? "" : "line-clamp-4 lg:line-clamp-6"}`}>
                  {sinopse}
                </p>
                {sinopse.length > 280 ? (
                  <button type="button" onClick={() => setSinopseAberta((v) => !v)} className="mt-1 min-h-9 self-center text-[12px] font-semibold text-bordo sm:self-start">
                    {sinopseAberta ? "ver menos" : "ver mais"}
                  </button>
                ) : null}
              </>
            ) : null}
            <div className="mt-1 flex items-center justify-center gap-3 sm:justify-start">
              <Link href={`/livro/${livro.id}`} className="text-[12px] font-semibold text-cinza underline underline-offset-4">
                ver a página do livro
              </Link>
              <AdicionarALista livro={livro} />
            </div>
            <div className="mt-5 flex items-center justify-center gap-6 sm:justify-start">
              <button
                type="button"
                className={botao}
                onClick={() => responder(null)}
              >
                <span className={selo}>{icone("M6 6l12 12M18 6L6 18")}</span>
                passar
              </button>
              {/* quero ler é a ação principal */}
              <button type="button" onClick={() => responder("quero")} className="inline-flex h-11 items-center gap-2 self-center rounded-[6px] bg-bordo px-5 text-[14px] font-semibold text-creme hover:bg-bordo-suave">
                <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
                </svg>
                Quero ler
              </button>
              <button
                type="button"
                className={botao}
                onClick={() => responder("lido")}
              >
                <span className={selo}>{icone("M5 12.5l4.5 4.5L19 7.5")}</span>
                já li
              </button>
            </div>
          </div>
        </div>
      ) : pedindo.current || indicacoes.carregando ? (
        <div className="mt-4 flex animate-pulse flex-col items-center gap-5 sm:flex-row sm:items-start lg:gap-10">
          <span className="block aspect-[2/3] w-[160px] rounded-[4px] bg-linha lg:w-[260px]" />
          <span className="w-full flex-1 space-y-3 pt-2">
            <span className="block h-3 w-40 rounded bg-linha" />
            <span className="block h-7 w-64 rounded bg-linha" />
          </span>
        </div>
      ) : (
        <div className="py-6 text-center sm:text-left">
          <p className="font-display text-[22px] leading-tight font-semibold italic text-bordo lg:font-revista lg:font-normal">
            {fila.length
              ? "você viu todas desta leva ✦"
              : "não achei indicações novas agora"}
          </p>
          <p className="mt-1.5 font-accent text-sm italic text-cinza">
            {fila.length
              ? "os que você passou não voltam. quer mais?"
              : "pode ser a internet ou o limite de buscas do dia. tente outra leva daqui a pouco."}
          </p>
          <button
            type="button"
            onClick={maisUmaRodada}
            className="mt-4 h-11 rounded-pill bg-bordo px-6 text-[13px] font-semibold text-creme hover:bg-bordo-suave"
          >
            mais indicações
          </button>
        </div>
      )}

      {perguntarTermino && livro ? (
        <PerguntaTermino
          titulo={livro.titulo}
          autor={livro.autor}
          capa={livro.capa}
          onCancelar={() => setPerguntarTermino(false)}
          onConfirmar={(t) => {
            setPerguntarTermino(false);
            responder("lido", t);
          }}
        />
      ) : null}
    </section>
  );
}
