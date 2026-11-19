"use client";

/**
 * As formas de ver uma estante — as MESMAS na estante pessoal e na biblioteca do
 * clube: prateleiras, leque de capas e estante de pé (lombadas).
 */
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
      <ul className="flex items-end gap-3 overflow-x-auto px-0.5 pb-[3px] [scrollbar-width:none] lg:gap-4">
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
      <span
        aria-hidden
        className="block h-[9px] w-full rounded-[3px] bg-gradient-to-b from-linha to-bege shadow-[0_2px_0_#c4ac93]"
      />
      {livros.some((l) => l.legenda) ? (
        <ul className="mt-1.5 flex gap-3 overflow-hidden px-0.5 lg:gap-4">
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

/** livros fanados tipo leque, pro computador — mesma ideia da versão celular, só que maior. */
export function LequeLinhaWeb({ livros }: { livros: ItemVitrine[] }) {
  const mostrados = livros.slice(0, 6);
  const giros = ["-9deg", "-5deg", "-1deg", "3deg", "7deg", "11deg"];
  if (!mostrados.length)
    return (
      <p className="font-accent text-sm italic text-cinza">
        ainda sem livros ✦
      </p>
    );
  return (
    <div className="flex h-[186px] items-end pl-2">
      {mostrados.map((l, i) => (
        <Link
          key={l.id}
          href={l.href ?? `/livro/${l.id}`}
          className="-ml-6 w-[108px] flex-none transition-transform first:ml-0 hover:z-10 hover:-translate-y-2"
          style={{ transform: `rotate(${giros[i]})`, zIndex: i }}
        >
          <CapaAuto
            livro={l}
            className="w-full shadow-[2px_6px_14px_-4px_rgba(43,20,32,.4)]"
          />
        </Link>
      ))}
    </div>
  );
}

function hashLombada(id: string, semente: number) {
  let h = semente;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

function larguraLombada(l: ItemVitrine) {
  if (l.paginas)
    return Math.max(20, Math.min(36, Math.round(20 + (l.paginas / 500) * 16)));
  return 22 + (hashLombada(l.id, 7) % 14);
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
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={l.capa}
          alt=""
          loading="lazy"
          onError={() => setFalhou(true)}
          className="absolute top-0 left-0 h-full w-auto max-w-none"
        />
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
