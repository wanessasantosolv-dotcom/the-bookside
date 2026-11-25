"use client";

import { Voltar } from "@/components/Voltar";
import Link from "next/link";
import { celebrar, celebrarTermino } from "@/lib/celebrar";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { TrocarCapa } from "@/components/TrocarCapa";
import { lembrarRemovido } from "@/components/AvisoRemovido";
import {
  dadosDoTermino,
  PerguntaTermino,
  type Termino,
} from "@/components/PerguntaTermino";
import { useHidratado } from "@/components/PerfilHidratacao";
import { AcoesDoLivro } from "@/components/livro/AcoesDoLivro";
import { MeuCapitulo } from "@/components/livro/MeuCapitulo";
import { Margens } from "@/components/livro/Margens";
import {
  EntreLeitores,
  NaSuaRede,
  notasDoApp,
  OQueDisseram,
  useComunidade,
} from "@/components/livro/Comunidade";
import {
  AlemDoLivro,
  ClubesDoLivro,
  useClubesDoLivro,
} from "@/components/livro/ClubesEAlem";
import { chaveTitulo, livroLembrado, sinopseDaObra } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import {
  estrelas,
  fichaApagada,
  infoDoLivro,
  todasAsEstantes,
} from "@/lib/estantes";
import { bandeira, paisesDasAutoras, type Pais } from "@/lib/nacionalidade";
import { criticaNaWikipedia, type Critica } from "@/lib/opinioes";
import { reacaoDe } from "@/lib/reacoes";
import { autoriaConhecida, linkDaAutoria } from "@/lib/autores";
import {
  usePerfil,
  type LivroSalvo,
  type StatusLivro,
} from "@/lib/perfil-store";

/**
 * A ficha de leitura já preenchida, na página do livro: nota e veredito no
 * topo, os quatro critérios em blocos, personagem, trecho e resenha em
 * texto de leitura (sem itálico miúdo). Editar e excluir ficam no rodapé.
 */
function FichaNoLivro({
  livro,
  onExcluir,
}: {
  livro: LivroSalvo;
  onExcluir: () => void;
}) {
  const reacao = reacaoDe(livro.reacao);
  const criterios = (["personagens", "plot", "escrita", "final"] as const).filter(
    (c) => livro.notas?.[c],
  );
  const texto = livro.resenha ?? livro.anotacao;
  const quando = livro.lidoEm
    ? new Date(livro.lidoEm).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;
  return (
    <section className="mx-6 mt-6 overflow-hidden rounded-[14px] border border-linha bg-creme-quente lg:mx-0 lg:mt-8 lg:rounded-[6px] lg:border-fio">
      <header className="flex items-start justify-between gap-3 border-b border-linha px-4 pt-4 pb-3.5 lg:border-fio lg:px-5">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
            sua ficha
          </p>
          {livro.nota ? (
            <p className="mt-1 flex items-baseline gap-2">
              <b className="font-display text-[30px] leading-none font-semibold text-bordo lg:font-revista lg:font-normal">
                {livro.nota.toLocaleString("pt-BR")}
              </b>
              <span className="text-[15px] tracking-[1px] text-bordo">
                {estrelas(livro.nota)}
              </span>
            </p>
          ) : (
            <p className="mt-1 text-[13px] text-cinza">sem nota</p>
          )}
          {quando ? (
            <p className="mt-1.5 text-[11px] text-cinza">
              {livro.status === "abandonado" ? "parou em" : "terminou em"}{" "}
              {quando}
            </p>
          ) : null}
        </div>
        {reacao ? (
          <span
            className="flex h-8 flex-none items-center gap-1.5 rounded-pill px-3 text-[12px] font-semibold text-white"
            style={{ background: reacao.cor }}
          >
            <span aria-hidden>{reacao.emoji}</span>
            {reacao.nome}
          </span>
        ) : null}
      </header>

      {criterios.length ? (
        <dl className="grid grid-cols-2 gap-px bg-linha lg:grid-cols-4 lg:bg-fio">
          {criterios.map((c) => (
            <div key={c} className="bg-creme-quente px-4 py-3">
              <dt className="text-[10px] font-semibold tracking-[.14em] text-cinza uppercase">
                {c}
              </dt>
              <dd className="mt-1 text-[13px] tracking-[1px] text-bordo">
                {estrelas(livro.notas![c])}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="space-y-4 px-4 py-4 lg:px-5">
        {livro.personagem ? (
          <p className="text-[13px]">
            <span className="text-[10px] font-semibold tracking-[.14em] text-cinza uppercase">
              personagem favorita
            </span>
            <span className="mt-0.5 block font-semibold text-ameixa">
              {livro.personagem} <span className="text-bordo">♡</span>
            </span>
          </p>
        ) : null}
        {livro.citacao ? (
          <blockquote className="rounded-[10px] bg-rosa-fundo/60 px-4 py-3 font-accent text-[16px] leading-[1.45] text-ameixa italic lg:font-revista">
            “{livro.citacao}”
          </blockquote>
        ) : null}
        {texto ? (
          <div>
            <p className="text-[10px] font-semibold tracking-[.14em] text-cinza uppercase">
              {livro.resenha ? "o que eu achei" : "anotação"}
            </p>
            <p className="mt-1 text-[14px] leading-[1.6] break-words whitespace-pre-line text-ameixa">
              {texto}
            </p>
          </div>
        ) : null}
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-linha px-4 py-2 lg:border-fio lg:px-5">
        <Link
          href={`/livro/${livro.id}/avaliar`}
          className="flex min-h-10 items-center text-[12px] font-semibold text-bordo hover:underline"
        >
          editar ficha ✎
        </Link>
        <button
          type="button"
          onClick={onExcluir}
          className="flex min-h-10 items-center text-[12px] font-semibold text-cinza hover:text-bordo"
        >
          excluir ficha
        </button>
      </footer>
    </section>
  );
}

const idiomas: Record<string, string> = {
  pt: "português",
  "pt-BR": "português",
  en: "inglês",
  es: "espanhol",
  fr: "francês",
  it: "italiano",
  de: "alemão",
};

const nota1 = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** de onde é quem escreveu (Wikidata, guardado no aparelho) */
function usePaisDoAutor(autor: string) {
  const [pais, setPais] = useState<Pais | null>(null);
  useEffect(() => {
    let vivo = true;
    if (!autoriaConhecida(autor)) return;
    paisesDasAutoras([autor])
      .then((c) => vivo && setPais(c[autor.toLowerCase()] ?? null))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [autor]);
  return pais;
}

/** "Sobre a obra": a sinopse sobre o papel, com "continuar lendo" e o resto numa expansão */
function SobreAObra({
  livro,
}: {
  livro: { titulo: string; autor: string; sinopse?: string; ano?: number; isbn?: string; idioma?: string; paginas?: number };
}) {
  const [aberta, setAberta] = useState(false);
  const [mais, setMais] = useState(false);
  const [critica, setCritica] = useState<Critica | null | undefined>(undefined);
  useEffect(() => {
    if (!mais || critica !== undefined) return;
    criticaNaWikipedia(livro.titulo, livro.autor)
      .then((c) => setCritica(c))
      .catch(() => setCritica(null));
  }, [mais, critica, livro.titulo, livro.autor]);
  const longa = (livro.sinopse?.length ?? 0) > 360;
  const ficha = [
    livro.ano ? ["publicação", String(livro.ano)] : null,
    livro.paginas ? ["páginas", String(livro.paginas)] : null,
    livro.idioma ? ["idioma da edição", idiomas[livro.idioma] ?? livro.idioma] : null,
    livro.isbn ? ["ISBN", livro.isbn] : null,
  ].filter((x): x is string[] => !!x);
  return (
    <div>
      <h2 className="font-display text-[24px] leading-tight font-semibold text-bordo lg:font-revista lg:text-[30px] lg:font-normal lg:text-tinta">
        Sobre a obra
      </h2>
      {livro.sinopse ? (
        <>
          <p
            className={`mt-3 max-w-[62ch] text-[15px] leading-[1.7] text-tinta-suave ${aberta ? "" : "line-clamp-5"}`}
          >
            {livro.sinopse}
          </p>
          {longa ? (
            <button
              type="button"
              aria-expanded={aberta}
              onClick={() => setAberta((v) => !v)}
              className="mt-2 text-[13px] font-semibold text-bordo hover:underline"
            >
              {aberta ? "mostrar menos ⌃" : "continuar lendo ⌄"}
            </button>
          ) : null}
        </>
      ) : (
        <p className="mt-3 font-accent text-sm italic text-cinza">
          ainda não temos a sinopse deste livro.
        </p>
      )}
      <div className="mt-4">
        <button
          type="button"
          aria-expanded={mais}
          onClick={() => setMais((v) => !v)}
          className="text-[12px] font-semibold text-cinza hover:text-bordo"
        >
          {mais ? "menos detalhes" : "detalhes da edição e da crítica"} {mais ? "⌃" : "⌄"}
        </button>
        {mais ? (
          <div className="mt-3 space-y-4 border-t border-linha pt-3 lg:border-fio">
            {ficha.length ? (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
                {ficha.map(([r, v]) => (
                  <div key={r}>
                    <dt className="text-[11px] text-cinza">{r}</dt>
                    <dd className="text-ameixa">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            {critica === undefined ? (
              <p className="text-[12px] text-cinza">procurando o que a crítica disse…</p>
            ) : critica ? (
              <div>
                <p className="text-[11px] text-cinza">o que a crítica disse</p>
                <p className="mt-1 text-[14px] leading-[1.6] text-tinta-suave">{critica.texto}</p>
                <a href={critica.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-[12px] font-semibold text-bordo underline underline-offset-2">
                  na Wikipédia{critica.idioma === "en" ? " (em inglês)" : ""} ↗
                </a>
              </div>
            ) : (
              <p className="text-[12px] text-cinza">não achamos texto da crítica sobre este livro.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function LivroPage() {
  const { id } = useParams<{ id: string }>();
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  const proprias = usePerfil((s) => s.estantesProprias);
  const editarLivro = usePerfil((s) => s.editarLivro);
  const removerLivro = usePerfil((s) => s.removerLivro);
  const favoritos = usePerfil((s) => s.favoritos);
  const router = useRouter();
  const [sinopseOL, setSinopseOL] = useState<string>();
  const [trocandoCapa, setTrocandoCapa] = useState(false);
  // saindo da página depois de tirar o livro: não mostra "não encontrado" no meio do caminho
  const [saindo, setSaindo] = useState(false);
  const [perguntarTermino, setPerguntarTermino] = useState(false);

  useEffect(() => {
    const c = new AbortController();
    sinopseDaObra(id, c.signal)
      .then(setSinopseOL)
      .catch(() => {});
    return () => c.abort();
  }, [id]);

  const encontrado = hidratado ? infoDoLivro(id, livros, livroLembrado(id)) : null;
  const ref = encontrado
    ? { id: encontrado.id, titulo: encontrado.titulo, autor: encontrado.autor }
    : { id, titulo: "", autor: "" };
  const comunidade = useComunidade(ref);
  const clubes = useClubesDoLivro(ref.id, ref.titulo);
  const pais = usePaisDoAutor(ref.autor);
  const tenho = useMemo(() => new Set(livros.map((l) => chaveTitulo(l.titulo))), [livros]);

  if (!hidratado || saindo) return <AppShell aba="estantes">{null}</AppShell>;
  if (!encontrado) notFound();
  // o que veio da busca pode trazer idioma e ISBN da edição
  const daBusca = encontrado as typeof encontrado & { idioma?: string; isbn?: string };
  const livro = {
    ...encontrado,
    idioma: daBusca.idioma,
    isbn: daBusca.isbn,
    sinopse: encontrado.sinopse ?? sinopseOL,
  };
  const salvo = livros.some((l) => l.id === id);
  const status: StatusLivro | null = salvo ? (livro.status ?? "lendo") : null;
  const base = {
    id: livro.id,
    titulo: livro.titulo,
    autor: livro.autor,
    capa: livro.capa,
    genero: livro.genero,
  };
  const estantesProprias = todasAsEstantes(proprias ?? []).filter((e) => e.propria);
  const temFicha = !!(
    livro.nota ||
    livro.reacao ||
    livro.personagem ||
    livro.citacao ||
    livro.resenha ||
    (livro.notas && Object.values(livro.notas).some(Boolean))
  );
  const voltar =
    status === "lido"
      ? { href: "/estantes/lidos", r: "lidos" }
      : status === "quero"
        ? { href: "/estantes/quero-ler", r: "quero ler" }
        : status === "lendo"
          ? { href: "/estantes/lendo", r: "lendo" }
          : { href: "/estantes", r: "estantes" };

  // a nota da comunidade (the bookside) para a linha de cima
  const notas = notasDoApp(comunidade);
  const mediaApp = notas.length ? notas.reduce((t, n) => t + n, 0) / notas.length : null;

  function tirarDaEstante() {
    const salvoAgora = livros.find((l) => l.id === id);
    if (!salvoAgora) return;
    if (
      !confirm(
        `tirar "${livro!.titulo}" da sua estante? a nota, a resenha e o progresso saem junto.`,
      )
    )
      return;
    lembrarRemovido(salvoAgora, favoritos.includes(id));
    setSaindo(true);
    router.push(`${voltar.href}?removido=${encodeURIComponent(livro!.titulo)}`);
    removerLivro(id);
  }

  function marcar(s: StatusLivro, termino?: Termino) {
    // "já li" sempre pergunta quando a pessoa terminou
    if (s === "lido" && !termino) return setPerguntarTermino(true);
    if (s === "abandonado" && !confirm("marcar como abandonado? ele sai do lendo agora e vai para os abandonados."))
      return;
    const agora = new Date().toISOString();
    editarLivro(base, {
      status: s,
      paginas: livro!.paginas,
      ...(s === "lendo" ? { iniciadoEm: livro!.iniciadoEm ?? agora } : {}),
      ...(s === "pausado" ? { paradoEm: agora } : {}),
      ...(s === "abandonado" ? { paradoEm: agora, reacao: "abandonei" as const } : {}),
      ...(s === "lido" && termino
        ? { ...dadosDoTermino(termino), paginaAtual: livro!.paginas }
        : {}),
    });
    // terminou agora (não era lido antes): comemora — a própria celebração
    // oferece "fazer a ficha" e "compartilhar", sem brigar com a animação
    if (s === "lido" && livro!.status !== "lido") {
      celebrarTermino(livro!, usePerfil.getState());
    }
  }

  /** começa de novo: a leitura anterior vai para o histórico */
  function reler() {
    if (!confirm("começar uma releitura? a leitura anterior fica guardada no histórico.")) return;
    editarLivro(base, {
      releituras: [
        ...(livro!.releituras ?? []),
        {
          iniciadoEm: livro!.iniciadoEm,
          lidoEm: livro!.lidoEm,
          nota: livro!.nota,
          formato: livro!.formato,
        },
      ],
      status: "lendo",
      iniciadoEm: new Date().toISOString(),
      lidoEm: undefined,
      paginaAtual: 0,
      paginas: livro!.paginas,
    });
  }

  function alternarEstante(eid: string) {
    const atual = livro!.estantes ?? [];
    editarLivro(base, {
      status: livro!.status ?? "quero",
      estantes: atual.includes(eid) ? atual.filter((x) => x !== eid) : [...atual, eid],
    });
  }

  function alternarAmei() {
    editarLivro(base, { status: livro!.status ?? "lido", amei: !livro!.amei });
    if (!livro!.amei) celebrar({ tipo: "amei", titulo: livro!.titulo });
  }

  const editorial = [livro.genero, livro.ano].filter(Boolean).join(" · ");
  const biblio = [
    livro.paginas ? `${livro.paginas} páginas` : null,
    livro.idioma ? (idiomas[livro.idioma] ?? livro.idioma) : null,
    pais ? `${pais.nome} ${bandeira(pais.codigo)}` : null,
  ].filter(Boolean);

  const acoes = (
    <AcoesDoLivro
      id={livro.id}
      titulo={livro.titulo}
      status={status}
      amei={!!livro.amei}
      estantes={estantesProprias}
      naEstante={livro.estantes ?? []}
      salvo={salvo}
      onMarcar={(s) => marcar(s)}
      onAmei={alternarAmei}
      onEstante={alternarEstante}
      onTrocarCapa={() => setTrocandoCapa(true)}
      onTirar={tirarDaEstante}
    />
  );

  return (
    <AppShell aba="estantes">
      <div className="flex flex-1 flex-col lg:bg-jornal">
        <div className="mx-auto w-full max-w-[1180px] px-6 pb-12 lg:px-12 lg:pt-6">
          <header className="flex items-center justify-between pt-2 lg:pt-0">
            {/* volta para a tela de onde a pessoa veio; aberto direto pelo link, vai para a estante */}
            <Voltar
              padrao={voltar.href}
              className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo"
            />
          </header>

          {/* ───── linha 1: capa · o livro · meu capítulo ───── */}
          <div className="mt-2 grid animate-subir gap-6 lg:mt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,2fr)] lg:gap-10">
            <div className="flex gap-4 lg:contents">
              <div className="w-[116px] flex-none sm:w-[140px] lg:w-full">
                {salvo ? (
                  <button
                    type="button"
                    onClick={() => setTrocandoCapa(true)}
                    aria-label="trocar a capa"
                    className="group relative block w-full"
                  >
                    <CapaLivro
                      key={livro.capa}
                      titulo={livro.titulo}
                      capa={livro.capa}
                      cor={corDoLivro(livro.id)}
                      className="w-full shadow-[0_22px_40px_-22px_rgba(43,20,32,.55)] [&>span:last-child]:text-sm lg:[&>span:last-child]:text-lg"
                    />
                    {/* no computador, aparece ao passar o mouse */}
                    <span className="pointer-events-none absolute inset-x-2 bottom-2 hidden items-center justify-center rounded-pill bg-creme/95 py-2 text-[12px] font-semibold text-bordo opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 lg:flex">
                      trocar capa
                    </span>
                  </button>
                ) : (
                  <CapaLivro
                    key={livro.capa}
                    titulo={livro.titulo}
                    capa={livro.capa}
                    cor={corDoLivro(livro.id)}
                    className="w-full shadow-[0_22px_40px_-22px_rgba(43,20,32,.55)] [&>span:last-child]:text-sm lg:[&>span:last-child]:text-lg"
                  />
                )}
                {salvo ? (
                  <button
                    type="button"
                    onClick={() => setTrocandoCapa(true)}
                    className="mt-2 flex min-h-10 w-full items-center justify-center gap-1.5 rounded-pill border border-bege text-[12px] font-semibold text-bordo hover:border-bordo"
                  >
                    <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7h3l2-3h6l2 3h3v13H4z" />
                      <circle cx="12" cy="13" r="3.5" />
                    </svg>
                    trocar capa
                  </button>
                ) : null}
              </div>
              <div className="min-w-0 flex-1 lg:pt-1">
                {editorial ? (
                  <p className="text-[10px] font-semibold tracking-[.14em] text-bordo uppercase lg:text-[11px]">
                    {editorial}
                  </p>
                ) : null}
                <h1
                  className={`mt-1 font-display leading-[1.05] font-semibold text-bordo lg:font-revista lg:font-normal lg:text-tinta ${
                    livro.titulo.length > 50 ? "text-[22px] lg:text-[34px]" : "text-[28px] lg:text-[44px]"
                  }`}
                >
                  {livro.titulo}
                </h1>
                <p className="mt-1.5 text-[14px] text-tinta-suave lg:text-[15px]">
                  {autoriaConhecida(livro.autor) ? (
                    <Link href={linkDaAutoria(livro.autor)} className="hover:text-bordo hover:underline">
                      {livro.autor} →
                    </Link>
                  ) : (
                    livro.autor
                  )}
                </p>
                {mediaApp !== null ? (
                  <p className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-[18px] text-ouro">★</span>
                    <b className="text-[18px] font-semibold text-ameixa tabular-nums">{nota1(mediaApp)}</b>
                    <span className="text-[13px] text-cinza">
                      ({notas.length} {notas.length === 1 ? "avaliação" : "avaliações"})
                    </span>
                  </p>
                ) : null}
                {biblio.length ? (
                  <p className="mt-2.5 text-[13px] text-tinta-suave">{biblio.join(" · ")}</p>
                ) : null}
                {livro.genero ? (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    <li className="rounded-pill bg-rosa-fundo px-3 py-1 text-[12px] text-ameixa">
                      {livro.genero}
                    </li>
                  </ul>
                ) : null}
                <div className="mt-5 hidden lg:block">{acoes}</div>
              </div>
            </div>
            <div className="lg:hidden">{acoes}</div>
            <MeuCapitulo
              livro={livro}
              status={status}
              onMarcar={(s) => marcar(s)}
              onFormato={(formato) => editarLivro(base, { formato })}
              onPausar={() => marcar("pausado")}
              onAbandonar={() => marcar("abandonado")}
              onReler={reler}
            />
          </div>

          {/* ───── linha 2: sobre a obra · nas suas margens ───── */}
          <div className="mt-9 grid gap-9 border-t border-linha pt-7 lg:mt-12 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-fio lg:border-fio lg:pt-9">
            <div className="lg:pr-10">
              <SobreAObra livro={livro} />
            </div>
            <div className="lg:pl-10">
              <Margens
                key={livro.id}
                livro={livro}
                salvo={salvo}
                onTrechos={(trechos) => editarLivro(base, { status: status ?? "lendo", trechos })}
                onAnotacao={(anotacao) => editarLivro(base, { status: status ?? "lendo", anotacao })}
                ficha={
                  temFicha ? (
                    <FichaNoLivro
                      livro={livro}
                      onExcluir={() => {
                        if (
                          !confirm(
                            "excluir a sua ficha? a nota, os critérios, a personagem, o trecho e a resenha somem. o livro continua na estante.",
                          )
                        )
                          return;
                        editarLivro(base, fichaApagada);
                      }}
                    />
                  ) : null
                }
              />
            </div>
          </div>

          {/* ───── linhas 3 e 4: entre leitores · rede · resenhas · clubes ───── */}
          <div className="mt-9 flex flex-col gap-9 border-t border-linha pt-7 lg:mt-12 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-x-12 lg:gap-y-12 lg:border-fio lg:pt-9">
            <div className="order-1 lg:col-start-1 lg:row-start-1">
              <EntreLeitores c={comunidade} />
            </div>
            <div className="order-2 lg:col-start-2 lg:row-start-1 lg:border-l lg:border-fio lg:pl-12">
              <NaSuaRede c={comunidade} />
            </div>
            {clubes?.length ? (
              <div className="order-3 lg:col-start-2 lg:row-start-2 lg:border-l lg:border-fio lg:pl-12">
                <ClubesDoLivro lista={clubes} />
              </div>
            ) : null}
            <div
              className={`order-4 lg:row-start-2 ${clubes?.length ? "lg:col-start-1" : "lg:col-span-2"}`}
            >
              <OQueDisseram c={comunidade} livro={livro} />
            </div>
          </div>

          {/* ───── linha 5: para além deste livro ───── */}
          <div className="mt-9 lg:mt-12">
            <AlemDoLivro livro={livro} naEstante={tenho} />
          </div>
        </div>
      </div>
      {trocandoCapa ? (
        <TrocarCapa
          titulo={livro.titulo}
          autor={livro.autor}
          atual={livro.capa}
          onFechar={() => setTrocandoCapa(false)}
          onEscolher={(capa) => editarLivro(base, { capa, capaEscolhida: true })}
        />
      ) : null}
      {perguntarTermino ? (
        <PerguntaTermino
          titulo={livro.titulo}
          inicial={livro.lidoEm}
          notaInicial={livro.nota}
          formatoInicial={livro.formato}
          onCancelar={() => setPerguntarTermino(false)}
          onConfirmar={(t) => {
            setPerguntarTermino(false);
            marcar("lido", t);
          }}
        />
      ) : null}
    </AppShell>
  );
}
