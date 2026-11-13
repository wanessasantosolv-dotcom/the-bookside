"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type WheelEvent } from "react";
import { Botao } from "@/components/ui/Botao";

const ZOOM_MAX = 4;

/** foto: círculo 1:1 · capa: faixa 2:1 · livro: capa de livro 2:3 */
const FORMATOS = {
  foto: { qw: 260, qh: 260, sw: 400, sh: 400, titulo: "ajuste sua foto", redondo: true },
  capa: { qw: 300, qh: 150, sw: 1200, sh: 600, titulo: "ajuste a capa", redondo: false },
  livro: { qw: 200, qh: 300, sw: 400, sh: 600, titulo: "ajuste a capa do livro", redondo: false },
} as const;

type Props = {
  /** endereço da imagem (object URL ou data URL) */
  src: string;
  formato?: keyof typeof FORMATOS;
  onCancelar: () => void;
  onPronto: (dataUrl: string) => void;
};

/**
 * Janela para ajustar a foto de perfil: arrastar para posicionar,
 * zoom pela barra, pelo gesto de pinça ou pela rodinha do mouse.
 */
export function AjustarFoto({ src, formato = "foto", onCancelar, onPronto }: Props) {
  const { qw: QW, qh: QH, sw: SW, sh: SH, titulo: textoTitulo, redondo } = FORMATOS[formato];
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const toques = useRef(new Map<number, { x: number; y: number }>());
  const pinca = useRef<{ dist: number; zoom: number } | null>(null);
  const titulo = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = src;
  }, [src]);

  useEffect(() => {
    titulo.current?.focus();
    const esc = (e: globalThis.KeyboardEvent) => e.key === "Escape" && onCancelar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onCancelar]);

  const base = img ? Math.max(QW / img.naturalWidth, QH / img.naturalHeight) : 1;
  const largura = img ? img.naturalWidth * base * zoom : QW;
  const altura = img ? img.naturalHeight * base * zoom : QH;

  /** a imagem sempre cobre o quadro inteiro */
  function limitar(p: { x: number; y: number }, l = largura, a = altura) {
    const mx = Math.max(0, (l - QW) / 2);
    const my = Math.max(0, (a - QH) / 2);
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) };
  }

  function mudarZoom(z: number) {
    const novo = Math.min(ZOOM_MAX, Math.max(1, z));
    if (!img) return setZoom(novo);
    const l = img.naturalWidth * base * novo;
    const a = img.naturalHeight * base * novo;
    setPos((p) => limitar({ x: (p.x * novo) / zoom, y: (p.y * novo) / zoom }, l, a));
    setZoom(novo);
  }

  function apertar(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    toques.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (toques.current.size === 2) {
      const [a, b] = [...toques.current.values()];
      pinca.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  }

  function mover(e: PointerEvent<HTMLDivElement>) {
    const antes = toques.current.get(e.pointerId);
    if (!antes) return;
    toques.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (toques.current.size === 2 && pinca.current) {
      const [a, b] = [...toques.current.values()];
      mudarZoom((pinca.current.zoom * Math.hypot(a.x - b.x, a.y - b.y)) / pinca.current.dist);
    } else if (toques.current.size === 1) {
      setPos((p) => limitar({ x: p.x + e.clientX - antes.x, y: p.y + e.clientY - antes.y }));
    }
  }

  function soltar(e: PointerEvent<HTMLDivElement>) {
    toques.current.delete(e.pointerId);
    if (toques.current.size < 2) pinca.current = null;
  }

  function teclado(e: KeyboardEvent<HTMLDivElement>) {
    const passo = e.shiftKey ? 30 : 10;
    const d = { ArrowLeft: [passo, 0], ArrowRight: [-passo, 0], ArrowUp: [0, passo], ArrowDown: [0, -passo] }[e.key];
    if (d) {
      e.preventDefault();
      setPos((p) => limitar({ x: p.x + d[0], y: p.y + d[1] }));
    } else if (e.key === "+" || e.key === "=") mudarZoom(zoom + 0.1);
    else if (e.key === "-") mudarZoom(zoom - 0.1);
  }

  function rodinha(e: WheelEvent<HTMLDivElement>) {
    mudarZoom(zoom - e.deltaY * 0.002);
  }

  function pronto() {
    if (!img) return;
    const k = largura / img.naturalWidth; // px na tela por px da imagem
    const esquerda = QW / 2 + pos.x - largura / 2;
    const topo = QH / 2 + pos.y - altura / 2;
    const canvas = document.createElement("canvas");
    canvas.width = SW;
    canvas.height = SH;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, -esquerda / k, -topo / k, QW / k, QH / k, 0, 0, SW, SH);
    onPronto(canvas.toDataURL("image/jpeg", formato === "capa" ? 0.78 : 0.85));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ameixa/70 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="titulo-ajustar">
      <div className="w-full max-w-[430px] animate-subir rounded-t-[28px] bg-creme px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] sm:rounded-[28px]">
        <h2 id="titulo-ajustar" ref={titulo} tabIndex={-1} style={{ outline: "none" }} className="font-display text-2xl font-semibold italic text-bordo">
          {textoTitulo}
        </h2>
        <p className="mt-1 text-[13px] text-cinza">arraste para posicionar e use o zoom para aproximar.</p>

        <div
          role="application"
          tabIndex={0}
          aria-label="área da foto: arraste ou use as setas para mover; + e − para zoom"
          onPointerDown={apertar}
          onPointerMove={mover}
          onPointerUp={soltar}
          onPointerCancel={soltar}
          onKeyDown={teclado}
          onWheel={rodinha}
          className={`relative mx-auto mt-5 max-w-full cursor-grab touch-none overflow-hidden bg-linha ${redondo ? "rounded-full" : "rounded-md"} outline-none select-none focus-visible:ring-2 focus-visible:ring-bordo focus-visible:ring-offset-4 focus-visible:ring-offset-creme active:cursor-grabbing`}
          style={{ width: QW, height: QH }}
        >
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute top-1/2 left-1/2 max-w-none"
              style={{ width: largura, height: altura, transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))` }}
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center font-accent text-sm italic text-cinza">abrindo…</span>
          )}
          <span aria-hidden className={`pointer-events-none absolute inset-0 ring-2 ring-creme/80 ring-inset ${redondo ? "rounded-full" : "rounded-md"}`} />
        </div>

        <label className="mt-6 flex items-center gap-3">
          <span aria-hidden className="text-sm text-cinza">−</span>
          <span className="sr-only">zoom</span>
          <input
            type="range"
            min={1}
            max={ZOOM_MAX}
            step={0.01}
            value={zoom}
            onChange={(e) => mudarZoom(Number(e.target.value))}
            className="h-11 flex-1 accent-bordo"
          />
          <span aria-hidden className="text-lg text-cinza">+</span>
        </label>

        <div className="mt-4 flex gap-2.5">
          <Botao variante="contorno" className="flex-1" onClick={onCancelar}>
            cancelar
          </Botao>
          <Botao className="flex-1" onClick={pronto} disabled={!img}>
            usar esta foto
          </Botao>
        </div>
      </div>
    </div>
  );
}
