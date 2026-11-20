"use client";

import { Voltar } from "@/components/Voltar";
import Link from "next/link";
import { SeletorFormato } from "@/components/SeletorFormato";
import { celebrar, celebrarTermino } from "@/lib/celebrar";
import { TrechosMarcados } from "@/components/TrechosMarcados";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { TrocarCapa } from "@/components/TrocarCapa";
import { lembrarRemovido } from "@/components/AvisoRemovido";
import { AmigasComLivro } from "@/components/social/AmigasComLivro";
import { PerguntaTermino } from "@/components/PerguntaTermino";
import { OpinioesDoLivro } from "@/components/OpinioesDoLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import { livroLembrado, sinopseDaObra } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { estrelas, infoDoLivro, todasAsEstantes } from "@/lib/estantes";
import { usePerfil, type StatusLivro } from "@/lib/perfil-store";

/** ícones de traço fino usados na ficha de leitura (sem emoji). */
const iconePausar = (
  <>
    <rect x="7" y="5" width="3.2" height="14" rx="1" />
    <rect x="13.8" y="5" width="3.2" height="14" rx="1" />
  </>
);
const iconeAbandonei = (
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M9.2 9.2l5.6 5.6M14.8 9.2l-5.6 5.6" />
  </>
);
const iconeCompartilhar = (
  <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
);
const iconeLerJunto = (
  <>
    <circle cx="8.5" cy="8.3" r="3" />
    <path d="M3 20c0-3 2.5-5.5 5.5-5.5S14 17 14 20" />
    <circle cx="16.5" cy="8" r="2.2" />
    <path d="M15 12.3c2.3.5 4 2.6 4 5.2" />
  </>
);
const iconeFoco = (
  <>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </>
);

function Linha({
  d,
  className = "",
}: {
  d: ReactNode;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {d}
    </svg>
  );
}

/** um "selo" quadrado com ícone + rótulo, para as ações da ficha de leitura. */
function AcaoFicha({
  href,
  icone,
  rotulo,
  extra,
  escura,
}: {
  href: string;
  icone: ReactNode;
  rotulo: string;
  extra?: string;
  escura?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-w-[88px] flex-1 flex-col items-center gap-1.5 rounded-[2px] border border-dashed px-2.5 py-3 text-center transition-colors ${
        escura
          ? "border-creme/30 bg-ameixa text-creme hover:border-creme/60"
          : "border-ouro/70 bg-creme text-bordo hover:border-bordo"
      }`}
    >
      <Linha d={icone} />
      <span className="text-[10.5px] leading-tight font-semibold">
        {rotulo}
      </span>
      {extra ? (
        <span
          className={`text-[9px] leading-none ${escura ? "text-rosa-claro" : "text-cinza"}`}
        >
          {extra}
        </span>
      ) : null}
    </Link>
  );
}

const acoes: { status: StatusLivro; rotulo: string; icone: ReactNode }[] = [
  {
    status: "lendo",
    rotulo: "lendo",
    icone: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M4 19.5V5.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v14" />
        <path d="M6.5 22a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2H19" />
      </svg>
    ),
  },
  {
    status: "lido",
    rotulo: "já li",
    icone: (
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    ),
  },
  {
    status: "quero",
    rotulo: "quero ler",
    icone: (
      <svg width="16" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 3a2 2 0 0 0-2 2v16l8-5.5L20 21V5a2 2 0 0 0-2-2Z" />
      </svg>
    ),
  },
];

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

  if (!hidratado || saindo) return <AppShell aba="estantes">{null}</AppShell>;
  const encontrado = infoDoLivro(id, livros, livroLembrado(id));
  if (!encontrado) notFound();
  const livro = { ...encontrado, sinopse: encontrado.sinopse ?? sinopseOL };
  const salvo = livros.some((l) => l.id === id);
  const status = salvo ? (livro.status ?? "lendo") : null;
  const base = {
    id: livro.id,
    titulo: livro.titulo,
    autor: livro.autor,
    capa: livro.capa,
    genero: livro.genero,
  };
  const estantesProprias = todasAsEstantes(proprias ?? []).filter(
    (e) => e.propria,
  );
  const progresso =
    livro.paginas && livro.paginaAtual
      ? Math.round((livro.paginaAtual / livro.paginas) * 100)
      : null;
  const voltar =
    status === "lido"
      ? { href: "/estantes/lidos", r: "lidos" }
      : status === "quero"
        ? { href: "/estantes/quero-ler", r: "quero ler" }
        : status === "lendo"
          ? { href: "/estantes/lendo", r: "lendo" }
          : { href: "/estantes", r: "estantes" };

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

  function marcar(s: StatusLivro, lidoEm?: string) {
    // "já li" sempre pergunta quando a pessoa terminou
    if (s === "lido" && !lidoEm) return setPerguntarTermino(true);
    const agora = new Date().toISOString();
    editarLivro(base, {
      status: s,
      paginas: livro!.paginas,
      ...(s === "lendo" ? { iniciadoEm: livro!.iniciadoEm ?? agora } : {}),
      ...(s === "lido" ? { lidoEm, paginaAtual: livro!.paginas } : {}),
    });
    // terminou agora (não era lido antes): comemora
    if (s === "lido" && livro!.status !== "lido")
      celebrarTermino(livro!, usePerfil.getState());
  }

  function alternarEstante(eid: string) {
    const atual = livro!.estantes ?? [];
    editarLivro(base, {
      status: livro!.status ?? "quero",
      estantes: atual.includes(eid)
        ? atual.filter((x) => x !== eid)
        : [...atual, eid],
    });
  }

  const titulo =
    "font-display text-[28px] leading-[1.08] font-semibold italic text-bordo lg:font-revista lg:text-[40px] lg:leading-[1.1] lg:font-normal lg:text-tinta";
  const secao =
    "eyebrow text-bordo lg:text-[10px] lg:tracking-[.18em] lg:text-grafite";

  return (
    <AppShell aba="estantes">
      <div className="flex flex-1 flex-col lg:bg-jornal">
        <header className="flex items-center justify-between px-6 pt-2 lg:bg-papel lg:px-14 lg:pt-6">
          {/* volta para a tela de onde a pessoa veio; aberto direto pelo link, vai para a estante */}
          <Voltar
            padrao={voltar.href}
            className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo"
          />
          <span className="eyebrow !text-[10px] text-cinza">o livro</span>
        </header>

        {/* topo: capa + dados */}
        <div className="flex animate-subir gap-[18px] px-6 pt-2 lg:gap-11 lg:border-b lg:border-fio lg:bg-papel lg:px-14 lg:pt-4 lg:pb-12">
          <div className="flex flex-none flex-col items-center">
            <CapaLivro
              key={livro.capa}
              titulo={livro.titulo}
              capa={livro.capa}
              cor={corDoLivro(livro.id)}
              className="w-[120px] [&>span:last-child]:text-sm lg:w-[200px] lg:shadow-[10px_10px_0_#C9A46A] lg:[&>span:last-child]:text-xl"
            />
            {salvo ? (
              <button
                type="button"
                onClick={() => setTrocandoCapa(true)}
                className="mt-1 min-h-11 px-2 text-xs font-semibold text-bordo underline underline-offset-4 lg:mt-4"
              >
                trocar capa
              </button>
            ) : null}
          </div>
          <div className="min-w-0 flex-1 lg:max-w-[920px] lg:pt-2">
            {livro.genero ? (
              <p className="hidden text-[10px] font-semibold tracking-[.18em] text-grafite uppercase lg:mb-2.5 lg:block">
                {livro.genero}
              </p>
            ) : null}
            <h1 className={titulo}>{livro.titulo}</h1>
            <p className="mt-[7px] font-accent text-sm italic text-cinza lg:font-texto lg:text-sm lg:not-italic">
              {livro.autor}
              <span className="hidden lg:inline">
                {livro.paginas ? ` · ${livro.paginas} páginas` : ""}
              </span>
            </p>
            <p className="mt-2.5 text-[13px] text-cinza lg:hidden">
              {[livro.paginas ? `${livro.paginas} páginas` : null, livro.ano]
                .filter(Boolean)
                .join(" · ")}
            </p>
            {livro.genero ? (
              <span className="mt-2.5 inline-block rounded-pill bg-linha/70 px-2 py-1 text-[9px] font-semibold text-bordo lg:hidden">
                {livro.genero}
              </span>
            ) : null}
            {livro.nota ? (
              <>
                <p className="eyebrow mt-3.5 mb-1 text-bordo lg:hidden">
                  sua nota
                </p>
                <p className="text-[15px] font-semibold tracking-[2px] text-bordo lg:mt-4 lg:text-lg">
                  {estrelas(livro.nota)}
                </p>
              </>
            ) : null}
            {livro.sinopse ? (
              <p className="mt-[18px] hidden max-w-[880px] text-[15px] leading-[1.65] text-tinta-suave lg:block">
                {livro.sinopse}
              </p>
            ) : null}

            <div className="mt-[22px] hidden gap-3.5 lg:flex">
              {!salvo ? (
                <button
                  type="button"
                  onClick={() => marcar("quero")}
                  className="rounded-pill bg-vinho px-[22px] py-3 text-[11px] font-bold tracking-[.1em] text-jornal uppercase"
                >
                  + adicionar à estante
                </button>
              ) : null}
              <Link
                href={`/livro/${livro.id}/avaliar`}
                className="rounded-pill border border-vinho px-[22px] py-3 text-[11px] font-bold tracking-[.1em] text-vinho uppercase"
              >
                avaliar
              </Link>
              {status === "lendo" ? (
                <Link
                  href={`/livro/${livro.id}/progresso`}
                  className="rounded-pill border border-vinho px-[22px] py-3 text-[11px] font-bold tracking-[.1em] text-vinho uppercase"
                >
                  atualizar progresso
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-11 lg:px-14 lg:pt-10 lg:pb-16">
          <div>
            {/* status */}
            <fieldset className="mt-5 px-6 lg:mt-0 lg:px-0">
              <legend className="sr-only">status do livro</legend>
              <div className="flex items-center gap-2.5">
                <div className="flex flex-1 overflow-hidden rounded-pill border-[1.5px] border-bordo">
                  {acoes.map((a, i) => {
                    const on = status === a.status;
                    return (
                      <button
                        key={a.status}
                        type="button"
                        aria-pressed={on}
                        onClick={() => marcar(a.status)}
                        className={`flex h-11 flex-1 items-center justify-center gap-1.5 text-[12.5px] font-semibold ${
                          i ? "border-l border-bordo/25" : ""
                        } ${on ? "bg-bordo text-creme" : "bg-transparent text-bordo"}`}
                      >
                        <span className="flex h-[16px] w-[16px] flex-none items-center justify-center [&_svg]:h-full [&_svg]:w-full">
                          {a.icone}
                        </span>
                        {a.rotulo}
                      </button>
                    );
                  })}
                </div>
                {/* o coraçãozinho de "amei" (não mexe nos favoritos do perfil) */}
                <button
                  type="button"
                  aria-pressed={!!livro.amei}
                  aria-label={livro.amei ? "tirar o amei" : "marcar que amei"}
                  title={livro.amei ? "você amou este livro" : "amei"}
                  onClick={() => {
                    editarLivro(base, {
                      status: livro.status ?? "lido",
                      amei: !livro.amei,
                    });
                    if (!livro.amei)
                      celebrar({ tipo: "amei", titulo: livro.titulo });
                  }}
                  key={livro.amei ? "amei" : "nao"}
                  className={`flex h-11 w-11 flex-none items-center justify-center rounded-full border-[1.5px] transition-transform active:scale-90 ${livro.amei ? "pulo-coracao" : ""} ${
                    livro.amei
                      ? "border-bordo bg-bordo text-creme"
                      : "border-bordo text-bordo"
                  }`}
                >
                  <svg
                    aria-hidden
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={livro.amei ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.9"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
                  </svg>
                </button>
              </div>
            </fieldset>

            {/* a ficha de leitura: formato, progresso/avaliação e as ações, tudo num só lugar */}
            {status ? (
              <div className="mx-6 mt-5 rounded-[2px] border border-linha bg-creme-quente p-4 lg:mx-0 lg:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-maquina text-[9px] tracking-[.12em] text-rosa-antigo uppercase">
                    sua ficha de leitura
                  </span>
                  {status === "pausado" || status === "abandonado" ? (
                    <span className="flex items-center gap-2 text-[11px] font-semibold text-ameixa">
                      {status === "pausado" ? "pausado" : "abandonado"}
                      {livro.paradoEm
                        ? ` desde ${new Date(livro.paradoEm).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}`
                        : ""}
                      <button
                        type="button"
                        onClick={() => marcar("lendo")}
                        className="min-h-6 text-bordo underline underline-offset-4"
                      >
                        voltar a ler
                      </button>
                    </span>
                  ) : status === "lendo" ? (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          editarLivro(base, {
                            status: "pausado",
                            paradoEm: new Date().toISOString(),
                          })
                        }
                        className="flex h-8 items-center gap-1 rounded-pill border border-linha px-3 text-[11px] font-semibold text-ameixa hover:border-bordo"
                      >
                        <Linha d={iconePausar} className="!size-3.5" />
                        pausar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (
                            !confirm(
                              "marcar como abandonado? ele sai do lendo agora e vai para os abandonados.",
                            )
                          )
                            return;
                          editarLivro(base, {
                            status: "abandonado",
                            reacao: "abandonei",
                            paradoEm: new Date().toISOString(),
                          });
                        }}
                        className="flex h-8 items-center gap-1 rounded-pill border border-linha px-3 text-[11px] font-semibold text-ameixa hover:border-bordo"
                      >
                        <Linha d={iconeAbandonei} className="!size-3.5" />
                        abandonei
                      </button>
                    </div>
                  ) : null}
                </div>

                <SeletorFormato
                  valor={livro.formato}
                  onChange={(formato) => editarLivro(base, { formato })}
                  className="mt-4"
                />

                {status === "lendo" ? (
                  <Link
                    href={`/livro/${livro.id}/progresso`}
                    className="mt-4 block border-t border-dashed border-linha pt-4"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="eyebrow text-bordo">lendo agora</span>
                      <span className="text-xs font-semibold text-bordo">
                        {progresso !== null ? `${progresso}%` : "atualizar →"}
                      </span>
                    </div>
                    <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-linha/70">
                      <i
                        className="block h-full rounded-full bg-bordo"
                        style={{ width: `${progresso ?? 0}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-cinza">
                      {livro.paginaAtual && livro.paginas
                        ? `página ${livro.paginaAtual} de ${livro.paginas}`
                        : "quantas páginas já foram? toque para atualizar"}
                    </p>
                  </Link>
                ) : null}
                {status === "lido" ? (
                  <Link
                    href={`/livro/${livro.id}/avaliar`}
                    className="mt-4 flex min-h-11 items-center justify-between border-t border-dashed border-linha pt-4"
                  >
                    <span className="text-[13px] font-semibold">
                      {livro.nota ? "editar sua avaliação" : "avaliar este livro"}
                    </span>
                    <span className="text-sm text-bordo">
                      {livro.nota ? estrelas(livro.nota) : "★ →"}
                    </span>
                  </Link>
                ) : null}

                {status === "lido" ||
                status === "lendo" ||
                status === "quero" ? (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-dashed border-linha pt-4">
                    {status === "lido" || status === "lendo" ? (
                      <AcaoFicha
                        href={`/story?tipo=${status === "lido" ? "terminei" : "lendo"}&livro=${livro.id}`}
                        icone={iconeCompartilhar}
                        rotulo="story"
                      />
                    ) : null}
                    {status === "lendo" || status === "quero" ? (
                      <AcaoFicha
                        href={`/ler-junto/novo?livro=${livro.id}`}
                        icone={iconeLerJunto}
                        rotulo="ler junto"
                      />
                    ) : null}
                    {status === "lendo" ? (
                      <AcaoFicha
                        href={`/foco?livro=${livro.id}`}
                        icone={iconeFoco}
                        rotulo="modo foco"
                        escura
                        extra={(() => {
                          const min = (livro.sessoes ?? []).reduce(
                            (t, x) => t + x.minutos,
                            0,
                          );
                          return min
                            ? `${min >= 60 ? `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}` : `${min} min`}`
                            : "cronômetro";
                        })()}
                      />
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}

            {livro.trechos?.length ? (
              <TrechosMarcados trechos={livro.trechos} />
            ) : null}

            {livro.sinopse ? (
              <section className="mt-6 px-6 lg:hidden">
                <p className={secao}>sinopse</p>
                <p className="mt-2 text-[13px] leading-normal">
                  {livro.sinopse}
                </p>
              </section>
            ) : null}

            {(livro.notas && Object.values(livro.notas).some(Boolean)) ||
            livro.personagem ||
            livro.citacao ||
            livro.resenha ||
            livro.anotacao ? (
              <section className="mx-6 mt-6 rounded-[2px] border border-dashed border-linha bg-creme-quente p-4 lg:mx-0 lg:mt-8 lg:p-5">
                <p className="font-maquina text-[9px] tracking-[.12em] text-rosa-antigo uppercase">
                  sua leitura
                </p>

                {livro.notas && Object.values(livro.notas).some(Boolean) ? (
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 lg:max-w-[420px]">
                    {(
                      ["personagens", "plot", "escrita", "final"] as const
                    ).map((c) =>
                      livro.notas![c] ? (
                        <div
                          key={c}
                          className="flex items-baseline justify-between border-b border-linha py-1 lg:border-fio"
                        >
                          <dt className="font-accent text-sm italic text-cinza">
                            {c}
                          </dt>
                          <dd className="text-xs text-bordo">
                            {estrelas(livro.notas![c])}
                          </dd>
                        </div>
                      ) : null,
                    )}
                  </dl>
                ) : null}

                {livro.personagem || livro.citacao ? (
                  <div className="mt-3 border-t border-dashed border-linha pt-3 first:mt-0 first:border-0 first:pt-0">
                    {livro.personagem ? (
                      <p className="eyebrow text-bordo">
                        personagem favorita · {livro.personagem} ♡
                      </p>
                    ) : null}
                    {livro.citacao ? (
                      <blockquote className="mt-2 border-l-2 border-rosa-claro pl-3 font-accent text-[15px] leading-[1.4] italic lg:font-revista">
                        “{livro.citacao}”
                      </blockquote>
                    ) : null}
                  </div>
                ) : null}

                {livro.resenha || livro.anotacao ? (
                  <div className="mt-3 border-t border-dashed border-linha pt-3 first:mt-0 first:border-0 first:pt-0">
                    <p className="eyebrow text-bordo">
                      {livro.resenha ? "sua resenha" : "sua anotação"}
                    </p>
                    <p className="mt-2 font-accent text-sm leading-[1.35] italic">
                      “{livro.resenha ?? livro.anotacao}”
                    </p>
                  </div>
                ) : null}
              </section>
            ) : null}

            {estantesProprias.length ? (
              <section className="mt-6 px-6 lg:px-0">
                <p className={secao}>suas estantes</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {estantesProprias.map((e) => {
                    const on = !!livro.estantes?.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => alternarEstante(e.id)}
                        className={`flex h-11 items-center gap-1.5 rounded-pill border px-3.5 text-xs font-semibold ${on ? "border-bordo bg-bordo text-creme" : "border-bege bg-creme-quente"}`}
                      >
                        <span
                          aria-hidden
                          className="size-2.5 rounded-full"
                          style={{ background: e.etiqueta.fundo }}
                        />
                        {e.nome}
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="mt-6 px-6 pb-8 lg:mt-0 lg:px-0 lg:pb-0">
            <div className="rounded-[2px] border border-dashed border-linha bg-creme-quente p-4 lg:p-5">
              <p className="font-maquina text-[9px] tracking-[.12em] text-rosa-antigo uppercase">
                entre seus amigos
              </p>
              <AmigasComLivro livroId={livro.id} />
            </div>
            <div className="mt-4">
              <OpinioesDoLivro livro={livro} />
            </div>
            {salvo ? (
              <button
                type="button"
                onClick={tirarDaEstante}
                className="mt-4 min-h-11 text-xs font-semibold text-cinza underline underline-offset-4 hover:text-bordo"
              >
                tirar da estante
              </button>
            ) : null}
          </aside>
        </div>
      </div>
      {trocandoCapa ? (
        <TrocarCapa
          titulo={livro.titulo}
          autor={livro.autor}
          atual={livro.capa}
          onFechar={() => setTrocandoCapa(false)}
          onEscolher={(capa) =>
            editarLivro(base, { capa, capaEscolhida: true })
          }
        />
      ) : null}
      {perguntarTermino ? (
        <PerguntaTermino
          titulo={livro.titulo}
          inicial={livro.lidoEm}
          onCancelar={() => setPerguntarTermino(false)}
          onConfirmar={(lidoEm) => {
            setPerguntarTermino(false);
            marcar("lido", lidoEm);
          }}
        />
      ) : null}
    </AppShell>
  );
}
