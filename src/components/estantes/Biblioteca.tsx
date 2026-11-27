"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { corDoLivro } from "@/lib/cores";
import { tintaSobre, useCorDaCapa } from "@/lib/corDaCapa";
import { estrelas } from "@/lib/estantes";
import type { LivroSalvo, StatusLivro } from "@/lib/perfil-store";

// ───────── tipos e utilidades ─────────

export type Vista = "estante" | "grade" | "lista";
/** na estante: as capas de frente ou as lombadas, como numa estante de verdade */
export type Face = "capas" | "lombadas";
export type Escopo = "estantes" | "todos";
export type Ordem = "personalizada" | "recentes" | "titulo" | "autoria" | "nota" | "progresso";
export type FiltroStatus = "todos" | StatusLivro;

export const NOME_STATUS: Record<StatusLivro, string> = {
  lendo: "lendo",
  lido: "lido",
  quero: "quero ler",
  pausado: "pausado",
  abandonado: "abandonado",
};

export const OPCOES_ORDEM: { id: Ordem; nome: string }[] = [
  { id: "personalizada", nome: "personalizado" },
  { id: "recentes", nome: "mais recentes" },
  { id: "titulo", nome: "título (a–z)" },
  { id: "autoria", nome: "autoria (a–z)" },
  { id: "nota", nome: "maior nota" },
  { id: "progresso", nome: "progresso" },
];

export const statusDe = (l: LivroSalvo): StatusLivro => l.status ?? "lendo";

export function progressoDe(l: LivroSalvo): number | null {
  if (statusDe(l) === "lido") return 1;
  if (!l.paginas || !l.paginaAtual) return null;
  return Math.max(0, Math.min(1, l.paginaAtual / l.paginas));
}

const semAcento = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** busca por título e autoria, filtro de status e ordenação: a mesma para os três modos */
export function filtrarLivros(
  livros: LivroSalvo[],
  { busca, status, ordem }: { busca: string; status: FiltroStatus; ordem: Ordem },
) {
  const q = semAcento(busca.trim());
  const lista = livros.filter(
    (l) =>
      (status === "todos" || statusDe(l) === status) &&
      (!q || semAcento(`${l.titulo} ${l.autor}`).includes(q)),
  );
  if (ordem === "personalizada") return lista;
  const data = (l: LivroSalvo) => l.lidoEm ?? l.iniciadoEm ?? l.adicionadoEm ?? "";
  const ordenada = [...lista];
  ordenada.sort((a, b) => {
    if (ordem === "recentes") return data(b).localeCompare(data(a));
    if (ordem === "titulo") return a.titulo.localeCompare(b.titulo, "pt-BR");
    if (ordem === "autoria") return a.autor.localeCompare(b.autor, "pt-BR");
    if (ordem === "nota") return (b.nota ?? 0) - (a.nota ?? 0);
    return (progressoDe(b) ?? -1) - (progressoDe(a) ?? -1);
  });
  return ordenada;
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

// ───────── ícones finos ─────────

function Icone({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={`size-[18px] flex-none ${className}`}>
      <path d={d} />
    </svg>
  );
}
const ICONES = {
  estante: "M4 4v16M9 4v16M14 6l4 14M3 20h18",
  grade: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  lista: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  busca: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  mais: "M12 5v14M5 12h14",
  pontos: "M5 12h.01M12 12h.01M19 12h.01",
  esq: "M15 18l-6-6 6-6",
  dir: "M9 18l6-6-6-6",
};

// ───────── prateleira de madeira (ShelfSurface) ─────────

/** a tábua de madeira clara: superfície, face frontal, veios e sombra; acompanha a largura */
export function PrateleiraMadeira({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`prateleira-madeira pointer-events-none relative z-10 block h-[27px] bg-[url('/estantes/prateleira.svg')] bg-[length:100%_100%] bg-no-repeat ${className}`}
    />
  );
}

// ───────── capa (BookCover) ─────────

/** capa real na proporção original (altura fixa, largura natural); sem capa, um bloco tipográfico neutro */
export function CapaDoLivro({
  livro,
  altura,
  className = "",
}: {
  livro: LivroSalvo;
  altura: number;
  className?: string;
}) {
  const [falhou, setFalhou] = useState(false);
  if (livro.capa && !falhou) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={livro.capa}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFalhou(true)}
        style={{ height: altura, maxWidth: altura * 0.82, minWidth: altura * 0.5 }}
        className={`block w-auto rounded-[2px] object-contain object-bottom shadow-[2px_3px_6px_-2px_rgba(59,37,27,.35)] ${className}`}
      />
    );
  }
  return (
    <span
      style={{ height: altura, width: altura * 0.66, background: corDoLivro(livro.id) }}
      className={`flex flex-none flex-col justify-between overflow-hidden rounded-[2px] p-2 text-left text-creme shadow-[inset_3px_0_0_rgba(0,0,0,.12),2px_3px_6px_-2px_rgba(59,37,27,.35)] ${className}`}
    >
      <span className="line-clamp-5 font-display text-[clamp(10px,1.1vw,14px)] leading-tight font-semibold break-words">
        {livro.titulo}
      </span>
      <span className="line-clamp-2 text-[9px] leading-tight opacity-80">{livro.autor}</span>
    </span>
  );
}

function Detalhes({ l }: { l: LivroSalvo }) {
  const p = progressoDe(l);
  return (
    <>
      <span className="block line-clamp-2 text-[13px] leading-tight font-semibold text-ameixa">{l.titulo}</span>
      <span className="mt-0.5 block truncate text-[11px] text-cinza">{l.autor}</span>
      <span className="mt-1.5 flex items-center gap-2 text-[11px] text-tinta-suave">
        <span>{NOME_STATUS[statusDe(l)]}</span>
        {l.nota ? <span className="text-bordo" aria-label={`nota ${l.nota}`}>{estrelas(l.nota)}</span> : null}
      </span>
      {statusDe(l) === "lendo" && p !== null ? (
        <span className="mt-1.5 flex items-center gap-2 text-[10px] text-cinza">
          <span className="h-[3px] flex-1 rounded-full bg-linha">
            <span className="block h-full rounded-full bg-bordo" style={{ width: `${Math.round(p * 100)}%` }} />
          </span>
          {Math.round(p * 100)}%
        </span>
      ) : null}
    </>
  );
}

/** altura e largura da lombada (estáveis por livro) */
export function medidasDaLombada(livro: LivroSalvo, altura: number) {
  const pags = livro.paginas ?? 320;
  const semente = [...livro.id].reduce((t, c) => t + c.charCodeAt(0), 0);
  const h = Math.round(altura * (0.8 + ((semente % 17) / 17) * 0.2));
  const len = livro.titulo.length;
  const w = Math.round(Math.max(len > 26 ? 34 : len > 14 ? 28 : 24, Math.min(48, 16 + pags / 18)));
  return { semente, h, w, len };
}

/** a lombada: um detalhe ampliado da capa sob um véu da cor principal, com o título inteiro */
export function Lombada({ livro, altura }: { livro: LivroSalvo; altura: number }) {
  // títulos longos ganham uma lombada um pouco mais larga (ver medidasDaLombada)
  const { semente, h, w, len } = medidasDaLombada(livro, altura);
  // o título inteiro: até 3 linhas verticais, com a letra diminuindo conforme o tamanho
  const linhas = w >= 40 ? 3 : w >= 28 ? 2 : 1;
  const tamanhoLetra = Math.max(7, Math.min(13, (h * 0.62 * linhas) / (len * 0.82)));
  const daCapa = useCorDaCapa(livro.capa);
  const fundo = daCapa ?? corDoLivro(livro.id);
  const tinta = tintaSobre(fundo);
  const posX = (semente * 37) % 100;
  const posY = (semente * 53) % 100;
  return (
    <span
      style={{ height: h, width: w, background: fundo, color: tinta }}
      className="relative flex flex-none flex-col items-center overflow-hidden rounded-[2px] shadow-[inset_-3px_0_5px_rgba(0,0,0,.2),inset_2px_0_0_rgba(255,255,255,.14),1px_2px_4px_-1px_rgba(59,37,27,.35)] transition-colors duration-500"
    >
      {livro.capa ? (
        <>
          <span
            aria-hidden
            className="absolute inset-0 scale-110"
            style={{
              backgroundImage: `url("${livro.capa}")`,
              backgroundSize: "auto 420%",
              backgroundPosition: `${posX}% ${posY}%`,
              backgroundRepeat: "no-repeat",
            }}
          />
          <span
            aria-hidden
            className="absolute inset-0"
            style={{ background: `linear-gradient(to bottom, ${fundo}00 0%, ${fundo}cc 30%, ${fundo}cc 70%, ${fundo}00 100%)` }}
          />
        </>
      ) : null}
      <span className="relative flex min-h-0 flex-1 items-center py-[18%]">
        <span
          style={{ fontSize: tamanhoLetra, maxWidth: w - 6 }}
          className="block max-h-full overflow-hidden text-center font-texto leading-[1.12] font-semibold tracking-[.14em] break-words whitespace-normal uppercase [writing-mode:vertical-rl] rotate-180"
        >
          {livro.titulo}
        </span>
      </span>
    </span>
  );
}

/** um livro em pé na prateleira: abre a ficha; passar o mouse ou focar mostra os detalhes */
export function LivroNaPrateleira({
  livro,
  altura,
  face = "capas",
  ordem = 0,
}: {
  livro: LivroSalvo;
  altura: number;
  face?: Face;
  ordem?: number;
}) {
  const larguraCapa = Math.round(altura * 0.66);
  const abre = face === "lombadas" ? Math.max(0, larguraCapa - medidasDaLombada(livro, altura).w) : 0;
  return (
    <li
      className="group relative flex-none snap-start animate-subir transition-[padding] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] hover:z-30 hover:pr-[var(--abre)] focus-within:z-30 focus-within:pr-[var(--abre)] motion-reduce:animate-none motion-reduce:transition-none"
      style={{ animationDelay: `${Math.min(ordem, 12) * 45}ms`, ["--abre" as string]: `${abre}px` } as CSSProperties}
    >
      <Link
        href={`/livro/${livro.id}`}
        aria-label={`${livro.titulo}, de ${livro.autor} · ${NOME_STATUS[statusDe(livro)]}${livro.nota ? ` · nota ${livro.nota}` : ""}`}
        className={`block origin-bottom rounded-[2px] transition-[transform,filter] duration-300 ease-out group-hover:-translate-y-2 group-hover:drop-shadow-[0_10px_10px_rgba(59,37,27,.25)] focus-visible:-translate-y-2 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 ${
          face === "lombadas" ? "" : "group-hover:rotate-[-1.5deg]"
        }`}
      >
        {face === "lombadas" ? (
          <span className="relative block [perspective:900px]">
            <Lombada livro={livro} altura={altura} />
            {/* ao passar o mouse, o livro gira a partir da lombada e mostra a capa inteira */}
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-0 left-0 origin-left opacity-0 transition-[transform,opacity] duration-300 ease-[cubic-bezier(.2,.8,.2,1)] [transform:rotateY(88deg)] group-hover:opacity-100 group-hover:[transform:rotateY(0deg)] group-focus-within:opacity-100 group-focus-within:[transform:rotateY(0deg)] motion-reduce:transition-none"
            >
              <span className="block overflow-hidden rounded-[2px] shadow-[6px_10px_22px_-8px_rgba(43,20,32,.55)]" style={{ width: larguraCapa, height: altura }}>
                <CapaDoLivro livro={livro} altura={altura} className="!max-w-none !min-w-full !object-cover !shadow-none" />
              </span>
            </span>
          </span>
        ) : (
          <CapaDoLivro livro={livro} altura={altura} />
        )}
      </Link>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-[190px] rounded-[8px] border border-linha bg-papel px-3 py-2.5 shadow-[0_8px_24px_-12px_rgba(43,20,32,.35)] group-focus-within:block lg:group-hover:block"
      >
        <Detalhes l={livro} />
      </span>
    </li>
  );
}

// ───────── linha da estante (ShelfRow) ─────────

export type LinhaEstante = {
  id: string;
  nome: string;
  livros: LivroSalvo[];
  link: string;
  /** só quando a pessoa escreveu (o app ainda não guarda descrição de estante) */
  descricao?: string;
  /** a coluna da direita: progresso, contagem do ano etc. (dados reais) */
  lateral?: ReactNode;
  menu?: ReactNode;
  vazio?: ReactNode;
};

const LIMITE_NA_LINHA = 24;

export function FilaDaPrateleira({
  livros,
  link,
  altura,
  face = "capas",
}: {
  livros: LivroSalvo[];
  link?: string;
  altura: number;
  face?: Face;
}) {
  const trilho = useRef<HTMLUListElement>(null);
  const [setas, setSetas] = useState({ esq: false, dir: false });
  const visiveis = livros.slice(0, face === "lombadas" ? LIMITE_NA_LINHA * 2 : LIMITE_NA_LINHA);
  const resto = livros.length - visiveis.length;

  useEffect(() => {
    const el = trilho.current;
    if (!el) return;
    const medir = () =>
      setSetas({ esq: el.scrollLeft > 4, dir: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
    medir();
    el.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      el.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, [livros.length]);

  const rolar = (lado: 1 | -1) => {
    const el = trilho.current;
    if (!el) return;
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: lado * el.clientWidth * 0.8, behavior: reduzir ? "auto" : "smooth" });
  };

  return (
    <div className="relative min-w-0">
      <ul
        ref={trilho}
        className={`pointer-events-none flex snap-x snap-proximity items-end overflow-x-auto [&>li]:pointer-events-auto ${face === "lombadas" ? "gap-[3px] sm:gap-1" : "gap-3 sm:gap-4"} overscroll-x-contain px-3 pt-24 -mt-20 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {visiveis.map((l, i) => (
          <LivroNaPrateleira key={l.id} livro={l} altura={altura} face={face} ordem={i} />
        ))}
        {resto > 0 && link ? (
          <li className="flex-none snap-start">
            <Link
              href={link}
              style={{ height: altura * 0.7 }}
              className="flex w-[72px] flex-col items-center justify-center rounded-[2px] border border-dashed border-rosa-antigo text-center text-bordo hover:bg-bordo/5"
            >
              <span className="font-display text-xl">+{resto}</span>
              <span className="text-[10px]">ver todos</span>
            </Link>
          </li>
        ) : null}
      </ul>
      <PrateleiraMadeira className="-mt-[5px]" />
      {setas.esq ? (
        <button type="button" onClick={() => rolar(-1)} aria-label="ver livros anteriores" className="absolute top-1/2 left-0 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-linha bg-papel/95 text-bordo shadow-sm hover:bg-papel">
          <Icone d={ICONES.esq} />
        </button>
      ) : null}
      {setas.dir ? (
        <button type="button" onClick={() => rolar(1)} aria-label="ver mais livros" className="absolute top-1/2 right-0 grid size-8 -translate-y-1/2 place-items-center rounded-full border border-linha bg-papel/95 text-bordo shadow-sm hover:bg-papel">
          <Icone d={ICONES.dir} />
        </button>
      ) : null}
    </div>
  );
}

export function LinhaDaEstante({ linha, destaque, face = "capas" }: { linha: LinhaEstante; destaque?: boolean; face?: Face }) {
  const titulo = (
    <div className="min-w-0">
      <h2 className={`font-revista leading-[1.05] text-bordo italic ${destaque ? "text-[30px] lg:text-[36px]" : "text-[26px] lg:text-[32px]"}`}>
        <Link href={linha.link} className="hover:underline decoration-1 underline-offset-4">
          {linha.nome}
        </Link>
      </h2>
      <p className="mt-1.5 text-[13px] text-tinta-suave">{plural(linha.livros.length, "livro", "livros")}</p>
      {linha.descricao ? <p className="mt-2 max-w-[24ch] font-accent text-[13px] text-cinza italic">{linha.descricao}</p> : null}
    </div>
  );
  return (
    <section
      aria-label={linha.nome}
      className="grid gap-x-6 gap-y-3 border-b border-linha py-7 lg:grid-cols-[minmax(150px,200px)_minmax(0,1fr)_minmax(150px,190px)] lg:items-end lg:border-fio"
    >
      <div className="flex items-start justify-between gap-3 lg:block lg:self-center">
        {titulo}
        <div className="lg:mt-3">{linha.menu}</div>
      </div>
      <div className="min-w-0">
        {linha.livros.length ? (
          <FilaDaPrateleira livros={linha.livros} link={linha.link} altura={destaque ? 168 : 150} face={face} />
        ) : (
          <div>
            <div className="flex h-[110px] items-end px-3 pb-3 font-accent text-sm text-cinza italic">
              {linha.vazio ?? "nenhum livro aqui ainda."}
            </div>
            <PrateleiraMadeira className="-mt-[5px] opacity-80" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 text-[13px] text-tinta-suave lg:self-center">
        <div className="min-w-0 flex-1">{linha.lateral}</div>
        <Link href={linha.link} aria-label={`ver todos de ${linha.nome}`} className="grid size-9 flex-none place-items-center rounded-full text-bordo hover:bg-bordo/5">
          <Icone d={ICONES.dir} />
        </Link>
      </div>
    </section>
  );
}

// ───────── menu de ações (ShelfActions) ─────────

export type AcaoDoMenu =
  | { tipo: "link"; nome: string; href: string }
  | { tipo: "botao"; nome: string; onClick: () => void; perigo?: boolean };

export function MenuDeAcoes({
  rotulo,
  acoes,
  semTexto,
}: {
  rotulo: string;
  acoes: AcaoDoMenu[];
  /** só os três pontos, sem a palavra "gerenciar" */
  semTexto?: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);
  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={rotulo}
        onClick={() => setAberto((v) => !v)}
        className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold text-cinza hover:bg-bordo/5 hover:text-bordo"
      >
        <Icone d={ICONES.pontos} />
        {semTexto ? null : <span className="hidden lg:inline">gerenciar</span>}
      </button>
      {aberto ? (
        <ul role="menu" className={`absolute top-full right-0 z-30 mt-1 min-w-[200px] rounded-[8px] border border-linha bg-papel py-1.5 shadow-[0_10px_28px_-14px_rgba(43,20,32,.4)] ${semTexto ? "" : "lg:right-auto lg:left-0"}`}>
          {acoes.map((a) => (
            <li key={a.nome} role="none">
              {a.tipo === "link" ? (
                <Link role="menuitem" href={a.href} className="block px-3.5 py-2 text-[13px] text-ameixa hover:bg-linha/50">
                  {a.nome}
                </Link>
              ) : (
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setAberto(false);
                    a.onClick();
                  }}
                  className={`block w-full px-3.5 py-2 text-left text-[13px] hover:bg-linha/50 ${a.perigo ? "text-bordo" : "text-ameixa"}`}
                >
                  {a.nome}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// ───────── grade (BookGrid) ─────────

export function GradeDeLivros({ livros }: { livros: LivroSalvo[] }) {
  return (
    <ul className="grid grid-cols-3 gap-x-3 gap-y-6 sm:grid-cols-[repeat(auto-fill,minmax(128px,1fr))] sm:gap-x-4 sm:gap-y-7">
      {livros.map((l) => (
        <li key={l.id}>
          <Link href={`/livro/${l.id}`} title={`${l.titulo} · ${l.autor}`} className="group block">
            <span className="flex h-[150px] items-end justify-center sm:h-[200px]">
              <CapaDoLivro livro={l} altura={200} className="!h-[150px] !max-w-full !min-w-0 transition-transform group-hover:-translate-y-1 motion-reduce:transition-none sm:!h-[200px]" />
            </span>
            {/* só a capa; a leitura em andamento ganha a barrinha de progresso */}
            {statusDe(l) === "lendo" && progressoDe(l) !== null ? (
              <span aria-label={`${Math.round((progressoDe(l) ?? 0) * 100)}% lido`} className="mx-auto mt-2 block h-[3px] w-3/4 rounded-full bg-linha">
                <span className="block h-full rounded-full bg-bordo" style={{ width: `${Math.round((progressoDe(l) ?? 0) * 100)}%` }} />
              </span>
            ) : null}
            <span className="sr-only">{l.titulo}, {l.autor}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ───────── lista (BookList) ─────────

export function ListaDeLivros({
  livros,
  acoesDoLivro,
  estantesDoLivro,
}: {
  livros: LivroSalvo[];
  acoesDoLivro: (l: LivroSalvo) => AcaoDoMenu[];
  estantesDoLivro: (l: LivroSalvo) => string[];
}) {
  return (
    <ul className="border-t border-linha lg:border-fio">
      {livros.map((l) => {
        const p = progressoDe(l);
        const extras = estantesDoLivro(l);
        return (
          <li key={l.id} className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 border-b border-linha py-3 sm:grid-cols-[48px_minmax(0,2fr)_110px_100px_120px_auto] sm:gap-4 lg:border-fio">
            <Link href={`/livro/${l.id}`} className="flex justify-center" tabIndex={-1} aria-hidden>
              <CapaDoLivro livro={l} altura={68} className="!min-w-0" />
            </Link>
            <div className="min-w-0">
              <Link href={`/livro/${l.id}`} className="block truncate text-[14px] font-semibold text-ameixa hover:text-bordo">
                {l.titulo}
              </Link>
              <span className="block truncate text-[12px] text-cinza">{l.autor}</span>
              <span className="mt-0.5 block truncate text-[11px] text-cinza sm:hidden">
                {NOME_STATUS[statusDe(l)]}
                {l.nota ? ` · ${estrelas(l.nota)}` : ""}
                {statusDe(l) === "lendo" && p !== null ? ` · ${Math.round(p * 100)}%` : ""}
              </span>
              {extras.length ? <span className="mt-0.5 hidden truncate text-[11px] text-cinza sm:block">em {extras.join(", ")}</span> : null}
            </div>
            <span className="hidden text-[12px] text-tinta-suave sm:block">{NOME_STATUS[statusDe(l)]}</span>
            <span className="hidden text-[12px] text-bordo sm:block" aria-label={l.nota ? `nota ${l.nota}` : "sem nota"}>
              {l.nota ? estrelas(l.nota) : <span className="text-cinza">—</span>}
            </span>
            <span className="hidden items-center gap-2 text-[11px] text-cinza sm:flex">
              {p !== null && statusDe(l) !== "lido" ? (
                <>
                  <span className="h-[3px] flex-1 rounded-full bg-linha">
                    <span className="block h-full rounded-full bg-bordo" style={{ width: `${Math.round(p * 100)}%` }} />
                  </span>
                  {Math.round(p * 100)}%
                </>
              ) : statusDe(l) === "lido" ? (
                l.lidoEm ? (l.lidoSoAno ? String(new Date(l.lidoEm).getFullYear()) : new Date(l.lidoEm).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "")) : "lido"
              ) : (
                "—"
              )}
            </span>
            <MenuDeAcoes rotulo={`ações de ${l.titulo}`} acoes={acoesDoLivro(l)} />
          </li>
        );
      })}
    </ul>
  );
}

// ───────── barra (LibraryToolbar + ViewSwitcher) ─────────

export function SeletorDeVista({ vista, onChange }: { vista: Vista; onChange: (v: Vista) => void }) {
  const opcoes: { id: Vista; nome: string }[] = [
    { id: "estante", nome: "estante" },
    { id: "grade", nome: "grade" },
    { id: "lista", nome: "lista" },
  ];
  return (
    <div role="group" aria-label="modo de visualização" className="flex gap-1 sm:gap-1.5">
      {opcoes.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={vista === o.id}
          onClick={() => onChange(o.id)}
          className={`flex h-10 items-center justify-center gap-1.5 rounded-[10px] border px-3 text-[12px] font-medium sm:h-[52px] sm:w-[68px] sm:flex-col sm:gap-0.5 sm:px-0 sm:text-[11px] ${
            vista === o.id ? "border-bordo bg-bordo text-creme" : "border-linha text-ameixa hover:border-bordo"
          }`}
        >
          <Icone d={ICONES[o.id]} />
          {o.nome}
        </button>
      ))}
    </div>
  );
}

const campo = "h-10 rounded-[8px] border border-linha bg-transparent px-3 text-[13px] text-ameixa focus:border-bordo focus:outline-none";

export function BarraDaBiblioteca({
  escopo,
  onEscopo,
  busca,
  onBusca,
  status,
  onStatus,
  statusDisponiveis,
  ordem,
  onOrdem,
  vista,
  onVista,
  face,
  onFace,
}: {
  face: Face;
  onFace: (f: Face) => void;
  escopo: Escopo;
  onEscopo: (e: Escopo) => void;
  busca: string;
  onBusca: (s: string) => void;
  status: FiltroStatus;
  onStatus: (s: FiltroStatus) => void;
  statusDisponiveis: StatusLivro[];
  ordem: Ordem;
  onOrdem: (o: Ordem) => void;
  vista: Vista;
  onVista: (v: Vista) => void;
}) {
  return (
    <div className="grid gap-3 py-5">
      <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap lg:gap-5">
        <div role="group" aria-label="o que mostrar" className="flex flex-none gap-1 border-b border-linha lg:border-fio">
          {(
            [
              { id: "estantes", nome: "minhas estantes" },
              { id: "todos", nome: "todos os livros" },
            ] as { id: Escopo; nome: string }[]
          ).map((o) => (
            <button
              key={o.id}
              type="button"
              aria-pressed={escopo === o.id}
              onClick={() => onEscopo(o.id)}
              className={`h-10 rounded-full px-4 text-[14px] font-medium ${escopo === o.id ? "bg-bordo text-creme" : "text-ameixa hover:text-bordo"}`}
            >
              {o.nome}
            </button>
          ))}
        </div>
        <label className="relative order-last min-w-0 basis-full lg:order-none lg:basis-auto lg:flex-1">
          <span className="sr-only">Buscar na biblioteca por título ou autoria</span>
          <Icone d={ICONES.busca} className="absolute top-1/2 left-3 -translate-y-1/2 text-cinza" />
          <input
            type="search"
            value={busca}
            onChange={(e) => onBusca(e.target.value)}
            placeholder="buscar por título ou autoria"
            className={`${campo} w-full !pl-10`}
          />
        </label>
        <div className="ml-auto lg:ml-0">
          <SeletorDeVista vista={vista} onChange={onVista} />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-[13px] text-ameixa">
        {vista === "estante" ? (
          <div className="mr-auto">
            <SeletorDeFace face={face} onChange={onFace} />
          </div>
        ) : null}
        <label className="flex items-center gap-2">
          <span className="text-cinza">status</span>
          <select value={status} onChange={(e) => onStatus(e.target.value as FiltroStatus)} className={`${campo} h-9 pr-8`}>
            <option value="todos">todos</option>
            {statusDisponiveis.map((s) => (
              <option key={s} value={s}>
                {NOME_STATUS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-cinza">ordenar por</span>
          <select value={ordem} onChange={(e) => onOrdem(e.target.value as Ordem)} className={`${campo} h-9 pr-8`}>
            {OPCOES_ORDEM.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

export function SeletorDeFace({ face, onChange }: { face: Face; onChange: (f: Face) => void }) {
  return (
    <div role="group" aria-label="como ver os livros na estante" className="relative z-30 flex items-center gap-1 text-[13px]">
      {(["capas", "lombadas"] as const).map((f, i) => (
        <span key={f} className="flex items-center gap-1">
          {i ? <span aria-hidden className="text-bege">·</span> : null}
          <button
            type="button"
            aria-pressed={face === f}
            onClick={() => onChange(f)}
            className={`flex min-h-10 items-center rounded px-2 ${face === f ? "font-semibold text-bordo underline decoration-1 underline-offset-4" : "text-cinza hover:text-ameixa"}`}
          >
            {f}
          </button>
        </span>
      ))}
    </div>
  );
}

export function useFaceSalva(): [Face, (f: Face) => void] {
  const [face, setFace] = useState<Face>("capas");
  useEffect(() => {
    try {
      if (localStorage.getItem("bookside-estantes-face") === "lombadas") setFace("lombadas");
    } catch {
      /* sem armazenamento */
    }
  }, []);
  const mudar = (f: Face) => {
    setFace(f);
    try {
      localStorage.setItem("bookside-estantes-face", f);
    } catch {
      /* sem armazenamento */
    }
  };
  return [face, mudar];
}

/** preferência de vista guardada no aparelho (a mesma em todas as visitas) */
export function useVistaSalva(): [Vista, (v: Vista) => void] {
  const [vista, setVista] = useState<Vista>("estante");
  useEffect(() => {
    try {
      const v = localStorage.getItem("bookside-estantes-vista");
      if (v === "estante" || v === "grade" || v === "lista") setVista(v);
    } catch {
      /* sem armazenamento: fica a estante */
    }
  }, []);
  const mudar = (v: Vista) => {
    setVista(v);
    try {
      localStorage.setItem("bookside-estantes-vista", v);
    } catch {
      /* sem armazenamento */
    }
  };
  return [vista, mudar];
}

export const ICONE_MAIS = ICONES.mais;
export { Icone };
