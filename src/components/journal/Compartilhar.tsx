"use client";

import { fotografarPng } from "@/lib/fotografar";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Capa, CapaJournal, linhaDaCapa, nota1, num, plural } from "@/components/journal/Revista";
import { maiuscula, type Edicao, type Paleta } from "@/lib/journal";
import type { TextosEdicao } from "@/lib/perfil-store";

/*
 * As peças para compartilhar, desenhadas em tamanho real (1080 px de largura)
 * e reduzidas só na prévia. Nada de botões nem de registros pessoais
 * (trechos, anotações, resenhas) nas imagens.
 */

type Props = { ed: Edicao; textos: TextosEdicao; paleta: Paleta; previa?: boolean };

function Marca({ ed, paleta }: { ed: Edicao; paleta: Paleta }) {
  return (
    <div className="flex items-end justify-between border-b pb-6" style={{ borderColor: `${paleta.texto}40` }}>
      <p className="text-[30px] font-semibold tracking-[.22em] uppercase">the bookside journal</p>
      <p className="font-maquina text-[26px] uppercase" style={{ color: paleta.destaque }}>
        vol. {String(ed.vol).padStart(2, "0")} · {ed.nome} {ed.ano}
      </p>
    </div>
  );
}

function Fundo({ paleta, w, h, children }: { paleta: Paleta; w: number; h: number; children: ReactNode }) {
  return (
    <div
      className="relative flex flex-col overflow-hidden font-texto"
      style={{ width: w, height: h, background: paleta.fundo, color: paleta.texto, padding: 80 }}
    >
      {children}
    </div>
  );
}

function Story({ ed, textos, paleta }: Props) {
  const fav = ed.favoritos[0] ?? ed.concluidos[0];
  const atras = ed.concluidos.filter((l) => l !== fav).slice(0, 2);
  const linha = `${paleta.fundo}33`;
  return (
    <div
      className="relative flex flex-col overflow-hidden font-texto"
      style={{ width: 1080, height: 1920, background: paleta.papel, color: paleta.fundo }}
    >
      {/* cabeçalho da revista */}
      <div className="px-[84px] pt-[96px]">
        <div className="flex items-center justify-between font-maquina text-[24px] tracking-[.16em]" style={{ color: `${paleta.fundo}b3` }}>
          <span>vol. {String(ed.vol).padStart(2, "0")}</span>
          <span>{ed.nome} · {ed.ano}</span>
        </div>
        <p className="mt-6 text-center font-revista text-[176px] leading-[.86] italic">the bookside</p>
        <div className="mt-5 flex items-center gap-6">
          <span className="h-px flex-1" style={{ background: linha }} />
          <span className="text-[26px] font-semibold tracking-[.42em]">journal</span>
          <span className="h-px flex-1" style={{ background: linha }} />
        </div>
      </div>

      {/* as capas em leque, o favorito na frente */}
      <div className="relative mx-auto mt-[92px] h-[720px] w-[880px]">
        {atras.map((l, i) => (
          <div
            key={`${l.id}-${i}`}
            className="absolute top-[70px]"
            style={{ left: i === 0 ? 40 : 520, transform: `rotate(${i === 0 ? -9 : 8}deg)` }}
          >
            <Capa l={l} seguro className="w-[320px] shadow-[0_30px_50px_-28px_rgba(0,0,0,.55)] [&>span:last-child]:hidden" />
          </div>
        ))}
        {fav ? (
          <div className="absolute top-0 left-1/2 -translate-x-1/2" style={{ transform: "translateX(-50%) rotate(-2deg)" }}>
            <Capa l={fav} seguro className="w-[440px] shadow-[0_50px_70px_-34px_rgba(0,0,0,.65)] [&>span:last-child]:text-[30px]" />
          </div>
        ) : null}
      </div>

      {/* manchete */}
      <div className="mt-[64px] px-[96px] text-center">
        <p className="font-maquina text-[24px] tracking-[.18em]" style={{ color: `${paleta.fundo}b3` }}>
          {fav && ed.favoritos[0] ? `favorito do mês: ${fav.titulo.toLowerCase()}` : "o mês em leituras"}
        </p>
        <p className="mx-auto mt-6 max-w-[880px] font-revista text-[76px] leading-[1.02] italic">{textos.titulo}</p>
      </div>

      {/* números com divisórias finas */}
      <div className="mt-auto grid grid-cols-3 border-t px-[60px] pt-10 pb-[84px]" style={{ borderColor: linha }}>
        {[
          { v: num(ed.numeros.livros), r: ed.numeros.livros === 1 ? "livro lido" : "livros lidos" },
          { v: ed.numeros.paginasConhecidas ? num(ed.numeros.paginas) : "—", r: "páginas" },
          { v: ed.numeros.media !== null ? nota1(ed.numeros.media) : "—", r: "nota média" },
        ].map((x, i) => (
          <div key={x.r} className="text-center" style={{ borderLeft: i ? `1px solid ${linha}` : undefined }}>
            <p className="font-revista text-[88px] leading-none">{x.v}</p>
            <p className="mt-3 text-[26px]" style={{ color: `${paleta.fundo}b3` }}>{x.r}</p>
          </div>
        ))}
      </div>
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-[22px]" style={{ background: paleta.fundo }} />
    </div>
  );
}

function Post({ ed, textos, paleta }: Props) {
  const fav = ed.favoritos[0];
  return (
    <Fundo paleta={paleta} w={1080} h={1350}>
      <Marca ed={ed} paleta={paleta} />
      <div className="mt-12 flex flex-1 gap-12">
        <div className="flex min-w-0 flex-1 flex-col">
          <h1 className="font-revista text-[110px] leading-[.92]">
            {maiuscula(ed.nome)}
            <br />
            <i>em revista.</i>
          </h1>
          <p className="mt-8 font-maquina text-[30px]" style={{ color: paleta.destaque }}>{linhaDaCapa(ed)}</p>
          <p className="mt-auto font-revista text-[50px] leading-[1.1]">{textos.titulo}</p>
        </div>
        {fav ? (
          <div className="flex w-[380px] flex-none flex-col justify-end">
            <Capa l={fav} seguro className="w-full shadow-[0_40px_60px_-30px_rgba(0,0,0,.7)] [&>span:last-child]:text-[28px]" />
            <p className="mt-5 text-[24px] tracking-[.12em] uppercase" style={{ color: paleta.destaque }}>favorito do mês</p>
            <p className="mt-1 font-revista text-[34px] leading-tight">{fav.titulo}</p>
          </div>
        ) : null}
      </div>
    </Fundo>
  );
}

function CapaPeca({ ed, textos, paleta, previa }: Props) {
  return (
    <div style={{ width: 1080, height: 1440 }}>
      <div className="origin-top-left" style={{ width: 360, transform: "scale(3)" }}>
        <CapaJournal ed={ed} textos={textos} paleta={paleta} tamanho="media" previa={previa} seguro />
      </div>
    </div>
  );
}

/** o carrossel: capa, números, livros, favorito, destaques e ritmo, mood */
function slides(p: Props): { nome: string; el: ReactNode }[] {
  const { ed, textos, paleta } = p;
  const fav = ed.favoritos[0];
  const titulo = (t: string, n: string) => (
    <>
      <Marca ed={ed} paleta={paleta} />
      <p className="mt-14 font-maquina text-[26px] tracking-[.14em] uppercase" style={{ color: paleta.destaque }}>{n}</p>
      <h2 className="mt-3 font-revista text-[84px] leading-[1]">{t}</h2>
    </>
  );
  return [
    { nome: "capa", el: <CapaPeca {...p} /> },
    {
      nome: "números",
      el: (
        <Fundo paleta={paleta} w={1080} h={1350}>
          {titulo("O mês em números", "01")}
          <div className="mt-14 grid grid-cols-2 gap-y-12">
            {[
              { v: num(ed.numeros.livros), r: "livros concluídos" },
              { v: ed.numeros.paginasConhecidas ? num(ed.numeros.paginas) : "—", r: "páginas" },
              { v: ed.numeros.media !== null ? nota1(ed.numeros.media) : "—", r: "nota média" },
              { v: ed.ritmo.confiavel ? num(ed.numeros.diasLeitura) : "—", r: "dias de leitura" },
            ].map((x) => (
              <div key={x.r}>
                <p className="font-revista text-[140px] leading-none">{x.v}</p>
                <p className="mt-3 text-[30px]" style={{ color: paleta.destaque }}>{x.r}</p>
              </div>
            ))}
          </div>
        </Fundo>
      ),
    },
    {
      nome: "livros",
      el: (
        <Fundo paleta={paleta} w={1080} h={1350}>
          {titulo("As histórias deste mês", "02")}
          <div className="mt-14 grid grid-cols-3 gap-8">
            {ed.concluidos.slice(0, 9).map((l, i) => (
              <Capa key={`${l.id}-${i}`} l={l} seguro className="w-full shadow-[0_24px_36px_-20px_rgba(0,0,0,.6)] [&>span:last-child]:text-[22px]" />
            ))}
          </div>
          {ed.concluidos.length > 9 ? <p className="mt-6 text-[28px]">e mais {ed.concluidos.length - 9}</p> : null}
        </Fundo>
      ),
    },
    ...(fav
      ? [
          {
            nome: "favorito",
            el: (
              <Fundo paleta={paleta} w={1080} h={1350}>
                {titulo("A história do mês", "03")}
                <div className="mt-12 flex flex-1 items-end gap-12">
                  <Capa l={fav} seguro className="w-[440px] flex-none shadow-[0_40px_60px_-30px_rgba(0,0,0,.7)] [&>span:last-child]:text-[30px]" />
                  <div className="min-w-0 pb-4">
                    <p className="font-revista text-[64px] leading-[1.02]">{fav.titulo}</p>
                    <p className="mt-4 text-[32px] opacity-90">{fav.autor}</p>
                    {fav.nota ? <p className="mt-6 font-maquina text-[40px]" style={{ color: paleta.destaque }}>{nota1(fav.nota)} ★</p> : null}
                  </div>
                </div>
              </Fundo>
            ),
          },
        ]
      : []),
    {
      nome: "destaques e ritmo",
      el: (
        <Fundo paleta={paleta} w={1080} h={1350}>
          {titulo("Destaques e ritmo", "04")}
          <div className="mt-12 grid grid-cols-2 gap-10">
            {ed.extremos.slice(0, 4).map((x) => (
              <div key={x.id} className="flex gap-6">
                <Capa l={x.livros[0]} seguro className="w-[130px] flex-none [&>span:last-child]:hidden" />
                <div>
                  <p className="text-[24px]" style={{ color: paleta.destaque }}>{x.rotulo}</p>
                  <p className="mt-2 font-revista text-[50px] leading-none">{x.valor}</p>
                </div>
              </div>
            ))}
          </div>
          {ed.ritmo.confiavel ? (
            <div className="mt-auto">
              <div className="flex gap-[6px]">
                {ed.ritmo.dias.map((d) => (
                  <span key={d.chave} className="block h-[44px] flex-1 rounded-[4px]" style={{ background: d.leitura ? paleta.destaque : `${paleta.texto}22` }} />
                ))}
              </div>
              <p className="mt-6 text-[32px]">{plural(ed.ritmo.diasLeitura, "dia", "dias")} com livro aberto</p>
            </div>
          ) : null}
        </Fundo>
      ),
    },
    {
      nome: "mood",
      el: (
        <Fundo paleta={paleta} w={1080} h={1350}>
          <Marca ed={ed} paleta={paleta} />
          <div className="my-auto text-center">
            <p className="font-maquina text-[26px] tracking-[.16em] uppercase" style={{ color: paleta.destaque }}>seu mood de leitura</p>
            <h2 className="mt-8 font-revista text-[110px] leading-[1]">{textos.titulo}</h2>
            <p className="mx-auto mt-10 max-w-[820px] text-[34px] leading-[1.45] opacity-90">{textos.encerramento}</p>
          </div>
        </Fundo>
      ),
    },
  ];
}

const PECAS = [
  { id: "story", nome: "story", w: 1080, h: 1920 },
  { id: "post", nome: "post", w: 1080, h: 1350 },
  { id: "capa", nome: "capa", w: 1080, h: 1440 },
  { id: "carrossel", nome: "carrossel", w: 1080, h: 1350 },
] as const;

async function paraArquivo(no: HTMLElement, w: number, h: number, nome: string) {
  const png = await fotografarPng(no, { width: w, height: h, pixelRatio: 1, includeQueryParams: true });
  const blob = await (await fetch(png)).blob();
  return { png, arquivo: new File([blob], nome, { type: "image/png" }) };
}

export function Compartilhar({ onFechar, ...p }: Props & { onFechar: () => void }) {
  const [peca, setPeca] = useState<(typeof PECAS)[number]["id"]>("story");
  const [slide, setSlide] = useState(0);
  const [gerando, setGerando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const quadros = useRef<(HTMLDivElement | null)[]>([]);
  const atual = PECAS.find((x) => x.id === peca)!;
  const lista =
    peca === "story"
      ? [{ nome: "story", el: <Story {...p} /> }]
      : peca === "post"
        ? [{ nome: "post", el: <Post {...p} /> }]
        : peca === "capa"
          ? [{ nome: "capa", el: <CapaPeca {...p} /> }]
          : slides(p);
  const largura = 300;
  const escala = largura / atual.w;

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onFechar]);

  async function exportar() {
    setGerando(true);
    setAviso(null);
    try {
      const arquivos: { png: string; arquivo: File }[] = [];
      for (let i = 0; i < lista.length; i++) {
        const no = quadros.current[i];
        if (no) arquivos.push(await paraArquivo(no, atual.w, atual.h, `the-bookside-journal-${p.ed.chave}-${peca}${lista.length > 1 ? `-${i + 1}` : ""}.png`));
      }
      const files = arquivos.map((a) => a.arquivo);
      if (navigator.canShare?.({ files })) await navigator.share({ files, title: "the bookside journal" });
      else {
        for (const a of arquivos) {
          const link = document.createElement("a");
          link.href = a.png;
          link.download = a.arquivo.name;
          link.click();
        }
        setAviso(arquivos.length > 1 ? `${arquivos.length} imagens baixadas ✓` : "imagem baixada ✓");
      }
    } catch (x) {
      if ((x as Error).name !== "AbortError") setAviso("não deu para gerar a imagem agora. tente de novo.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#2b1420]/50 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="compartilhar a edição"
        className="max-h-[94dvh] w-full max-w-[520px] overflow-y-auto rounded-t-[20px] bg-creme px-6 pt-5 pb-[max(24px,env(safe-area-inset-bottom))] sm:rounded-[20px]"
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-[22px] font-semibold text-ameixa lg:font-revista lg:font-normal">compartilhar a edição</p>
          <button type="button" onClick={onFechar} className="text-[13px] font-semibold text-cinza hover:text-bordo">
            fechar
          </button>
        </div>
        <div role="radiogroup" aria-label="formato" className="mt-4 flex flex-wrap gap-1.5">
          {PECAS.map((x) => (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={peca === x.id}
              onClick={() => {
                setPeca(x.id);
                setSlide(0);
              }}
              className={`h-9 rounded-pill px-3.5 text-[12px] font-semibold ${peca === x.id ? "bg-ameixa text-creme" : "border border-bege text-ameixa"}`}
            >
              {x.nome}
              <span className="ml-1 font-normal opacity-70">
                {x.w}×{x.h}
              </span>
            </button>
          ))}
        </div>

        {/* a prévia (as peças de verdade ficam em tamanho real, só reduzidas na tela) */}
        <div className="mt-5 flex justify-center">
          <div className="overflow-hidden rounded-[6px] shadow-[0_20px_40px_-24px_rgba(43,20,32,.6)]" style={{ width: largura, height: atual.h * escala }}>
            <div className="relative" style={{ width: atual.w, height: atual.h, transform: `scale(${escala})`, transformOrigin: "top left" }}>
              {lista.map((s, i) => (
                // a opacidade fica no invólucro (não passa para a imagem exportada)
                <div
                  key={s.nome}
                  className="absolute top-0 left-0"
                  style={{ opacity: i === slide ? 1 : 0, zIndex: i === slide ? 1 : 0 }}
                  aria-hidden={i !== slide}
                >
                  <div
                    ref={(el) => {
                      quadros.current[i] = el;
                    }}
                  >
                    {s.el}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {lista.length > 1 ? (
          <div className="mt-3 flex items-center justify-center gap-3 text-[12px] text-cinza">
            <button type="button" aria-label="anterior" onClick={() => setSlide((x) => Math.max(0, x - 1))} className="size-9 rounded-full hover:bg-rosa-fundo">
              ‹
            </button>
            <span>
              {slide + 1} de {lista.length} · {lista[slide].nome}
            </span>
            <button type="button" aria-label="próxima" onClick={() => setSlide((x) => Math.min(lista.length - 1, x + 1))} className="size-9 rounded-full hover:bg-rosa-fundo">
              ›
            </button>
          </div>
        ) : null}
        <button
          type="button"
          onClick={exportar}
          disabled={gerando}
          className="mt-5 flex h-12 w-full items-center justify-center rounded-pill bg-bordo text-[14px] font-semibold text-creme disabled:opacity-60"
        >
          {gerando ? "gerando…" : lista.length > 1 ? `compartilhar as ${lista.length} imagens` : "compartilhar imagem"}
        </button>
        {aviso ? <p role="status" className="mt-2 text-center text-[12px] text-cinza">{aviso}</p> : null}
        <p className="mt-3 text-center text-[11px] text-cinza">trechos, anotações e resenhas nunca entram nas imagens.</p>
      </div>
    </div>
  );
}
