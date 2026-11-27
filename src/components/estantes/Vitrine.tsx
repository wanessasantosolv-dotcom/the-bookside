"use client";

/**
 * As formas de ver uma estante — as MESMAS na estante pessoal e na biblioteca do
 * clube: prateleiras, leque de capas e estante de pé (lombadas).
 */
import { PrateleiraMadeira } from "@/components/estantes/Biblioteca";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { CapaAuto } from "@/components/CapaAuto";
import { corDoLivro } from "@/lib/cores";

export type Visualizacao = "prateleira" | "leque" | "estante";

export const OPCOES_VISUALIZACAO: { id: Visualizacao; nome: string }[] = [
  { id: "prateleira", nome: "prateleiras" },
  { id: "leque", nome: "leque de capas ✧" },
  { id: "estante", nome: "estante de pé ✦" },
];

/** um livro numa vitrine: o essencial para mostrar a capa e levar à página certa */
export type ItemVitrine = {
  id: string;
  titulo: string;
  autor: string;
  capa?: string;
  paginas?: number;
  /** para onde o livro leva (padrão: a página do livro) */
  href?: string;
  /** linha embaixo da capa (ex.: "sugerido por irla") */
  legenda?: ReactNode;
  /** botãozinho no canto da capa (ex.: tirar do clube) */
  acao?: ReactNode;
  /** atalho: segurar a capa por um instante (ex.: remover sem precisar abrir o modo de editar) */
  segurar?: () => void;
};

/** mostra as 3 opções de visualização de uma vez, com a ativa destacada em bordô. */
export function SeletorVisualizacao({
  vis,
  onChange,
  className,
}: {
  vis: Visualizacao;
  onChange: (v: Visualizacao) => void;
  className?: string;
}) {
  return (
    <span
      className={`font-accent text-[13px] text-cinza italic ${className ?? ""}`}
    >
      ver como{" "}
      {OPCOES_VISUALIZACAO.map((o, i) => (
        <span key={o.id}>
          {i > 0 ? " · " : " "}
          <button
            type="button"
            onClick={() => onChange(o.id)}
            className={
              vis === o.id
                ? "not-italic font-semibold text-bordo"
                : "underline decoration-bege underline-offset-4 hover:text-bordo"
            }
          >
            {o.nome}
          </button>
        </span>
      ))}
    </span>
  );
}

/** fileira de capas numa prateleira (com a tábua embaixo), como nas estantes */
export function PrateleiraCapas({
  livros,
  maisHref,
  maisRotulo,
}: {
  livros: ItemVitrine[];
  maisHref?: string;
  maisRotulo?: string;
}) {
  // atalho de segurar a capa: um temporizador por livro, cancelado se soltar/arrastar antes da hora
  const temporizadores = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const segurou = useRef<Record<string, boolean>>({});

  function iniciarToque(item: ItemVitrine) {
    if (!item.segurar) return;
    segurou.current[item.id] = false;
    temporizadores.current[item.id] = setTimeout(() => {
      segurou.current[item.id] = true;
      item.segurar?.();
    }, 480);
  }
  function cancelarToque(id: string) {
    clearTimeout(temporizadores.current[id]);
  }

  return (
    <div className="relative">
      <ul className="flex items-end gap-3 overflow-x-auto px-3 pt-2 [scrollbar-width:none] lg:gap-4">
        {livros.map((l) => (
          <li key={l.id} className="relative w-[74px] flex-none lg:w-[104px]">
            <Link
              href={l.href ?? `/livro/${l.id}`}
              className={`block select-none ${l.segurar ? "transition-transform active:scale-[.94]" : ""}`}
              title={l.titulo}
              onPointerDown={() => iniciarToque(l)}
              onPointerUp={() => cancelarToque(l.id)}
              onPointerLeave={() => cancelarToque(l.id)}
              onPointerCancel={() => cancelarToque(l.id)}
              onContextMenu={(e) => {
                if (l.segurar) e.preventDefault();
              }}
              onClick={(e) => {
                if (segurou.current[l.id]) {
                  e.preventDefault();
                  segurou.current[l.id] = false;
                }
              }}
            >
              <CapaAuto livro={l} className="w-full" />
            </Link>
            {l.acao ? (
              <span className="absolute -top-1.5 -right-1.5">{l.acao}</span>
            ) : null}
          </li>
        ))}
        {maisHref ? (
          <li className="w-[74px] flex-none lg:w-[104px]">
            <Link
              href={maisHref}
              aria-label={maisRotulo ?? "adicionar livro"}
              className="flex aspect-[2/3] items-center justify-center rounded-[2px] border-[1.5px] border-dashed border-ouro text-2xl font-semibold text-bordo hover:bg-bordo/5"
            >
              +
            </Link>
          </li>
        ) : null}
      </ul>
      {/* a mesma prateleira de madeira das estantes pessoais */}
      <PrateleiraMadeira className="-mt-[5px]" />
      {livros.some((l) => l.legenda) ? (
        <ul className="mt-1.5 flex gap-3 overflow-hidden px-3 lg:gap-4">
          {livros.map((l) => (
            <li
              key={l.id}
              className="w-[74px] flex-none text-[10px] leading-tight text-cinza lg:w-[104px] lg:text-[11px]"
            >
              {l.legenda}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/**
 * Leque de capas: os livros bagunçados numa pilha, como capas largadas na mesa.
 * Cada capa tem giro, deslocamento e sobreposição próprios (fixos por livro,
 * então a pilha não muda a cada visita); passar o mouse traz a capa para cima.
 */
export function LequeLinhaWeb({ livros }: { livros: ItemVitrine[] }) {
  return <PilhaDeCapas livros={livros} />;
}

export function PilhaDeCapas({ livros, largura = 104 }: { livros: ItemVitrine[]; largura?: number }) {
  if (!livros.length) return <p className="font-accent text-sm italic text-cinza">ainda sem livros ✦</p>;
  return (
    <ul className="flex flex-wrap items-start justify-center px-3 pt-4 pb-6 sm:justify-start" style={{ rowGap: 4 }}>
      {livros.map((l, i) => {
        const h = hashLombada(l.id, 3);
        const giro = ((h % 25) - 12) * 0.9; // -11° a 11°
        const desce = (h >> 5) % 22; // 0 a 21px
        const encaixe = 18 + ((h >> 9) % 18); // quanto encosta na vizinha
        return (
          <li
            key={l.id}
            className="group relative flex-none transition-transform duration-200 hover:z-50 hover:-translate-y-2 hover:rotate-0 focus-within:z-50 motion-reduce:transition-none"
            style={{ width: largura, marginLeft: i ? -encaixe : 0, marginTop: desce, transform: `rotate(${giro}deg)`, zIndex: (h >> 3) % 20 }}
          >
            <Link href={l.href ?? `/livro/${l.id}`} title={`${l.titulo} · ${l.autor}`} className="block">
              <CapaAuto livro={l} className="w-full shadow-[3px_8px_16px_-6px_rgba(43,20,32,.45)] [&>span:last-child]:hidden" />
              <span className="sr-only">
                {l.titulo}, {l.autor}
              </span>
            </Link>
            {l.acao ? <span className="absolute top-1 right-1">{l.acao}</span> : null}
          </li>
        );
      })}
    </ul>
  );
}

function hashLombada(id: string, semente: number) {
  let h = semente;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function larguraLombada(l: ItemVitrine) {
  if (l.paginas)
    return Math.max(26, Math.min(42, Math.round(26 + (l.paginas / 500) * 16)));
  return 28 + (hashLombada(l.id, 7) % 12);
}

function alturaLombada(l: ItemVitrine, base: number) {
  return base + (hashLombada(l.id, 13) % 20);
}

/** lombada de verdade: fatia da capa real recortada, ou um bloco colorido com o título na vertical quando não tem capa. */
function LombadaLivro({
  l,
  alturaBase,
}: {
  l: ItemVitrine;
  alturaBase: number;
}) {
  const [falhou, setFalhou] = useState(false);
  const largura = larguraLombada(l);
  const altura = alturaLombada(l, alturaBase);
  const cor = corDoLivro(l.id);
  const comImagem = !!l.capa && !falhou;
  return (
    <Link
      href={l.href ?? `/livro/${l.id}`}
      title={l.titulo}
      className="relative flex-none self-end overflow-hidden rounded-t-[2px] transition-transform hover:-translate-y-1.5"
      style={{ width: largura, height: altura, background: cor }}
    >
      {comImagem ? (
        <>
          {/* a arte da capa vira a lombada, com o título em pé por cima */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={l.capa}
            alt=""
            loading="lazy"
            onError={() => setFalhou(true)}
            className="absolute inset-0 h-full w-full scale-[1.6] object-cover"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-black/35 via-black/10 to-black/35"
          />
          <span
            className="absolute inset-x-0 top-2.5 bottom-2.5 flex justify-center overflow-hidden"
          >
            <span
              className="font-texto text-[10px] font-bold whitespace-nowrap text-white [text-shadow:0_1px_3px_rgba(0,0,0,.7)]"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              {l.titulo}
            </span>
          </span>
        </>
      ) : (
        <span
          className="absolute inset-x-0 bottom-2.5 flex justify-center overflow-hidden"
          style={{ maxHeight: "85%" }}
        >
          <span
            className="font-revista text-[10px] font-semibold whitespace-nowrap text-creme italic"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {l.titulo}
          </span>
        </span>
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 shadow-[inset_2px_0_0_rgba(0,0,0,.12),2px_0_6px_-2px_rgba(43,20,32,.3)]"
      />
    </Link>
  );
}

/** fileira de lombadas em pé numa tábua de madeira — a "estante de verdade". */
export function EstanteDeVerdadeFila({
  livros,
  alturaBase,
}: {
  livros: ItemVitrine[];
  alturaBase: number;
}) {
  if (!livros.length)
    return (
      <p className="font-accent text-sm italic text-cinza">
        ainda sem livros ✦
      </p>
    );
  return (
    <div className="relative overflow-x-auto rounded-md bg-gradient-to-b from-[#F3ECE1] to-[#EFE6D8] px-5 pt-6 pb-4 [scrollbar-width:none]">
      <div
        className="relative flex items-end gap-[3px]"
        style={{ minHeight: alturaBase + 20 }}
      >
        {livros.map((l) => (
          <LombadaLivro key={l.id} l={l} alturaBase={alturaBase} />
        ))}
      </div>
      <span
        aria-hidden
        className="mt-3 block h-4 rounded-[3px] bg-gradient-to-b from-ouro to-[#A9814E] shadow-[0_5px_0_#8C6B3E,0_9px_14px_-6px_rgba(43,20,32,.35)]"
      />
    </div>
  );
}
