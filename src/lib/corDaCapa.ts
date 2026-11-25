"use client";

import { useEffect, useState } from "react";
import { capaSegura } from "@/components/story/Stories";

/*
 * A cor principal de uma capa: a imagem passa pela rota do app (mesma origem),
 * é desenhada num canvas pequeno e as cores são agrupadas; ganha a mais
 * presente, com peso para as mais vivas (o branco do fundo não vence sozinho).
 * Guardada no aparelho para não refazer a conta.
 */

const CHAVE = "bookside-cores-capa-v1";
const memoria = new Map<string, string | null>();
const pendentes = new Map<string, Promise<string | null>>();

function lerGuardadas(): Record<string, string | null> {
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? "{}");
  } catch {
    return {};
  }
}

function guardar(capa: string, cor: string | null) {
  memoria.set(capa, cor);
  try {
    const todas = lerGuardadas();
    todas[capa] = cor;
    // não deixa crescer sem limite
    const chaves = Object.keys(todas);
    if (chaves.length > 600) for (const k of chaves.slice(0, chaves.length - 600)) delete todas[k];
    localStorage.setItem(CHAVE, JSON.stringify(todas));
  } catch {
    /* sem armazenamento */
  }
}

const hex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;

function corPrincipal(img: HTMLImageElement): string | null {
  const w = 24;
  const h = 36;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const grupos = new Map<number, { n: number; peso: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 200) continue;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max ? (max - min) / max : 0;
    const luz = (max + min) / 510;
    // quase branco e quase preto valem pouco (fundos e letras)
    const peso = 0.25 + sat * 1.5 - (luz > 0.92 || luz < 0.06 ? 0.2 : 0);
    const k = ((r >> 5) << 6) | ((g >> 5) << 3) | (b >> 5);
    const x = grupos.get(k) ?? { n: 0, peso: 0, r: 0, g: 0, b: 0 };
    x.n++;
    x.peso += Math.max(0.05, peso);
    x.r += r;
    x.g += g;
    x.b += b;
    grupos.set(k, x);
  }
  let melhor: { n: number; peso: number; r: number; g: number; b: number } | null = null;
  for (const x of grupos.values()) if (!melhor || x.peso > melhor.peso) melhor = x;
  return melhor ? hex(melhor.r / melhor.n, melhor.g / melhor.n, melhor.b / melhor.n) : null;
}

function calcular(capa: string): Promise<string | null> {
  const ja = pendentes.get(capa);
  if (ja) return ja;
  const p = new Promise<string | null>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      try {
        resolve(corPrincipal(img));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = capaSegura(capa) ?? capa;
  }).then((cor) => {
    guardar(capa, cor);
    pendentes.delete(capa);
    return cor;
  });
  pendentes.set(capa, p);
  return p;
}

/** a cor principal da capa (null enquanto calcula ou se não der) */
export function useCorDaCapa(capa?: string): string | null {
  const [cor, setCor] = useState<string | null>(() => (capa ? memoria.get(capa) ?? null : null));
  useEffect(() => {
    if (!capa) return;
    if (memoria.has(capa)) return setCor(memoria.get(capa) ?? null);
    const guardada = lerGuardadas()[capa];
    if (guardada !== undefined) {
      memoria.set(capa, guardada);
      return setCor(guardada);
    }
    let vivo = true;
    calcular(capa).then((c) => {
      if (vivo) setCor(c);
    });
    return () => {
      vivo = false;
    };
  }, [capa]);
  return cor;
}

/** a cor do texto que dá leitura sobre um fundo */
export function tintaSobre(fundo: string) {
  const n = parseInt(fundo.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.6 ? "#2B1420" : "#FBF6EF";
}

/** escurece (q < 0) ou clareia (q > 0) uma cor */
export function tom(cor: string, q: number) {
  const n = parseInt(cor.slice(1), 16);
  const ajusta = (v: number) => (q < 0 ? v * (1 + q) : v + (255 - v) * q);
  return hex(ajusta((n >> 16) & 255), ajusta((n >> 8) & 255), ajusta(n & 255));
}
