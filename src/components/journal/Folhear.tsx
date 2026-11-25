"use client";

import { toJpeg } from "html-to-image";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode, type TouchEvent } from "react";
import { ImagemSegura } from "@/components/journal/Revista";
import type { Paleta } from "@/lib/journal";
import { pdfDeImagens, type PaginaJpeg } from "@/lib/pdf";

/*
 * A revista em folhas: no computador, páginas duplas que viram em 3D;
 * no celular, uma página por vez. Setas, teclado (← →) e deslizar.
 * O mesmo conjunto de folhas vira PDF.
 */

export type Folha = {
  id: string;
  /** conteúdo da página */
  el: ReactNode;
  /** a capa ocupa a folha toda, sem margens nem cabeçalho */
  sangrada?: boolean;
};

function useTelaGrande() {
  const [grande, setGrande] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const ver = () => setGrande(mq.matches);
    ver();
    mq.addEventListener("change", ver);
    return () => mq.removeEventListener("change", ver);
  }, []);
  return grande;
}

function Pagina({
  folha,
  numero,
  rotulo,
  paleta,
  lado,
}: {
  folha?: Folha;
  numero: number;
  rotulo: string;
  paleta: Paleta;
  lado: "esq" | "dir" | "unica";
}) {
  const sombra =
    lado === "esq"
      ? "linear-gradient(to left, rgba(43,20,32,.12), transparent 7%)"
      : lado === "dir"
        ? "linear-gradient(to right, rgba(43,20,32,.14), transparent 7%)"
        : "none";
  if (!folha) return <div className="h-full w-full" style={{ background: paleta.papel }} />;
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden" style={{ background: paleta.papel }}>
      {folha.sangrada ? (
        <div className="h-full w-full">{folha.el}</div>
      ) : (
        <>
          <p className="flex flex-none justify-between px-7 pt-5 font-maquina text-[9px] tracking-[.14em] text-cinza uppercase">
            <span>the bookside journal</span>
            <span>{rotulo}</span>
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-7 pt-3 pb-4 [scrollbar-width:thin]">{folha.el}</div>
          <p className={`flex-none px-7 pb-4 font-maquina text-[10px] text-cinza ${lado === "esq" ? "text-left" : "text-right"}`}>
            {numero}
          </p>
        </>
      )}
      <span aria-hidden className="pointer-events-none absolute inset-0" style={{ background: sombra }} />
    </div>
  );
}

type Virada = { dir: "prox" | "ant"; fim: boolean } | null;

export function Folhear({ folhas, rotulo, paleta }: { folhas: Folha[]; rotulo: string; paleta: Paleta }) {
  const grande = useTelaGrande();
  const n = folhas.length;
  // computador: página dupla s mostra as folhas 2s-1 (esq) e 2s (dir); a capa abre sozinha à direita
  const [dupla, setDupla] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [virada, setVirada] = useState<Virada>(null);
  const [sentido, setSentido] = useState<"prox" | "ant">("prox");
  const toque = useRef<number | null>(null);
  const ultimaDupla = Math.floor(n / 2);
  const reduzir = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const avancar = useCallback(
    (dir: "prox" | "ant") => {
      if (virada) return;
      if (grande) {
        const alvo = dupla + (dir === "prox" ? 1 : -1);
        if (alvo < 0 || alvo > ultimaDupla) return;
        if (reduzir()) return setDupla(alvo);
        setVirada({ dir, fim: false });
        requestAnimationFrame(() => requestAnimationFrame(() => setVirada({ dir, fim: true })));
      } else {
        const alvo = pagina + (dir === "prox" ? 1 : -1);
        if (alvo < 0 || alvo >= n) return;
        setSentido(dir);
        setPagina(alvo);
      }
    },
    [virada, grande, dupla, ultimaDupla, pagina, n],
  );

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (alvo.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") avancar("prox");
      if (e.key === "ArrowLeft") avancar("ant");
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [avancar]);

  const terminarVirada = () => {
    if (!virada) return;
    setDupla((d) => d + (virada.dir === "prox" ? 1 : -1));
    setVirada(null);
  };

  const folha = (i: number) => (i >= 0 && i < n ? folhas[i] : undefined);
  const pag = (i: number, lado: "esq" | "dir" | "unica") => (
    <Pagina folha={folha(i)} numero={i + 1} rotulo={rotulo} paleta={paleta} lado={lado} />
  );

  const controles = (posicao: string, total: number) => (
    <div className="mt-5 flex items-center justify-center gap-5 text-[12px] text-cinza">
      <button
        type="button"
        onClick={() => avancar("ant")}
        aria-label="página anterior"
        className="grid size-10 place-items-center rounded-full border border-linha text-[18px] text-ameixa hover:border-bordo disabled:opacity-30"
        disabled={grande ? dupla === 0 : pagina === 0}
      >
        ‹
      </button>
      <span aria-live="polite" className="min-w-[110px] text-center tabular-nums">
        {posicao} de {total}
      </span>
      <button
        type="button"
        onClick={() => avancar("prox")}
        aria-label="próxima página"
        className="grid size-10 place-items-center rounded-full border border-linha text-[18px] text-ameixa hover:border-bordo disabled:opacity-30"
        disabled={grande ? dupla === ultimaDupla : pagina === n - 1}
      >
        ›
      </button>
    </div>
  );

  const gestos = {
    onTouchStart: (e: TouchEvent) => {
      toque.current = e.touches[0].clientX;
    },
    onTouchEnd: (e: TouchEvent) => {
      if (toque.current === null) return;
      const dx = e.changedTouches[0].clientX - toque.current;
      toque.current = null;
      if (Math.abs(dx) > 50) avancar(dx < 0 ? "prox" : "ant");
    },
  };

  if (!grande) {
    return (
      <div {...gestos}>
        <div className="mx-auto aspect-[3/4.3] w-full max-w-[460px] overflow-hidden rounded-[4px] shadow-[0_24px_40px_-26px_rgba(43,20,32,.55)] [perspective:1600px]">
          <div
            key={pagina}
            className="h-full w-full motion-safe:animate-[folha_.55s_cubic-bezier(.2,.7,.2,1)]"
            style={{ transformOrigin: sentido === "prox" ? "left center" : "right center", "--giro": sentido === "prox" ? "-75deg" : "75deg" } as CSSProperties}
          >
            {pag(pagina, "unica")}
          </div>
        </div>
        {controles(`página ${pagina + 1}`, n)}
      </div>
    );
  }

  // durante a virada, embaixo já aparece o destino; a folha que gira mostra frente e verso
  const s = dupla;
  const esqBaixo = virada?.dir === "ant" ? 2 * s - 3 : 2 * s - 1;
  const dirBaixo = virada?.dir === "prox" ? 2 * s + 2 : 2 * s;
  const frente = virada?.dir === "prox" ? 2 * s : 2 * s - 1;
  const verso = virada?.dir === "prox" ? 2 * s + 1 : 2 * s - 2;
  const giro = virada?.fim ? (virada.dir === "prox" ? "rotateY(-180deg)" : "rotateY(180deg)") : "rotateY(0deg)";
  const primeira = Math.max(1, 2 * s);
  const ultima = Math.min(n, 2 * s + 1);

  return (
    <div {...gestos}>
      <div className="mx-auto grid w-full max-w-[1120px] grid-cols-2 [perspective:2400px]">
        <div className="relative aspect-[3/4] shadow-[-10px_24px_40px_-28px_rgba(43,20,32,.5)]">
          {esqBaixo >= 0 ? pag(esqBaixo, "esq") : <div className="h-full" />}
        </div>
        <div className="relative aspect-[3/4] shadow-[10px_24px_40px_-28px_rgba(43,20,32,.5)]">
          {dirBaixo < n ? pag(dirBaixo, "dir") : <div className="h-full" />}
        </div>
        {virada ? (
          <div
            onTransitionEnd={terminarVirada}
            className="absolute aspect-[3/4] w-1/2 transition-transform duration-[800ms] ease-[cubic-bezier(.45,.05,.35,1)] [transform-style:preserve-3d]"
            style={{
              left: virada.dir === "prox" ? "50%" : 0,
              transformOrigin: virada.dir === "prox" ? "left center" : "right center",
              transform: giro,
            }}
          >
            <div className="absolute inset-0 [backface-visibility:hidden]">{pag(frente, virada.dir === "prox" ? "dir" : "esq")}</div>
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
              {pag(verso, virada.dir === "prox" ? "esq" : "dir")}
            </div>
          </div>
        ) : null}
      </div>
      {controles(s === 0 ? "capa" : `páginas ${primeira}–${ultima}`, n)}
    </div>
  );
}

// ───────── PDF ─────────

const LARGURA_PDF = 900;
const ALTURA_MIN_PDF = 1200;

/** monta as folhas fora da tela, fotografa cada uma e junta num PDF */
export function ExportarPdf({
  folhas,
  paleta,
  nomeArquivo,
  onFim,
}: {
  folhas: Folha[];
  paleta: Paleta;
  nomeArquivo: string;
  onFim: (erro?: string) => void;
}) {
  const nos = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        // espera as capas carregarem
        await new Promise((r) => setTimeout(r, 700));
        const paginas: PaginaJpeg[] = [];
        for (const no of nos.current) {
          if (!no || cancelado) continue;
          const altura = Math.max(ALTURA_MIN_PDF, no.offsetHeight);
          const dataUrl = await toJpeg(no, {
            width: LARGURA_PDF,
            height: altura,
            pixelRatio: 2,
            quality: 0.9,
            backgroundColor: paleta.papel,
            cacheBust: true,
            includeQueryParams: true,
            imagePlaceholder:
              "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          });
          paginas.push({ dataUrl, largura: LARGURA_PDF * 2, altura: altura * 2 });
        }
        if (cancelado) return;
        const blob = pdfDeImagens(paginas);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nomeArquivo;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        onFim();
      } catch {
        if (!cancelado) onFim("não deu para gerar o PDF agora. tente de novo.");
      }
    })();
    return () => {
      cancelado = true;
    };
    // roda uma vez por exportação
  }, []);

  return (
    <ImagemSegura.Provider value>
      <div aria-hidden className="pointer-events-none fixed top-0 left-[-20000px]">
        {folhas.map((f, i) => (
          <div
            key={f.id}
            ref={(el) => {
              nos.current[i] = el;
            }}
            style={{ width: LARGURA_PDF, minHeight: ALTURA_MIN_PDF, height: f.sangrada ? ALTURA_MIN_PDF : undefined, background: paleta.papel }}
            className={f.sangrada ? "" : "px-14 py-12"}
          >
            {f.el}
          </div>
        ))}
      </div>
    </ImagemSegura.Provider>
  );
}
