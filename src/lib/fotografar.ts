"use client";

import { toJpeg, toPng } from "html-to-image";

type Opcoes = Parameters<typeof toPng>[1];

/**
 * Troca cada <img> do bloco por uma cópia embutida (data:) antes de virar
 * imagem. No Safari do iPhone, sem isso as capas saem em branco: a primeira
 * "foto" acontece antes de as imagens entrarem.
 */
async function embutirImagens(no: HTMLElement) {
  const trocadas: [HTMLImageElement, string | null, string | null][] = [];
  await Promise.all(
    Array.from(no.querySelectorAll("img")).map(async (img) => {
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith("data:")) return;
      try {
        const resposta = await fetch(src, { cache: "force-cache", signal: AbortSignal.timeout(8000) });
        if (!resposta.ok) return;
        const blob = await resposta.blob();
        const dados = await new Promise<string>((ok, erro) => {
          const leitor = new FileReader();
          leitor.onload = () => ok(String(leitor.result));
          leitor.onerror = erro;
          leitor.readAsDataURL(blob);
        });
        trocadas.push([img, img.getAttribute("src"), img.getAttribute("srcset")]);
        img.removeAttribute("srcset");
        img.src = dados;
        await img.decode().catch(() => undefined);
      } catch {
        /* sem a capa: segue com a cor do livro */
      }
    }),
  );
  return () => trocadas.forEach(([img, src, srcset]) => {
    if (src === null) img.removeAttribute("src");
    else img.setAttribute("src", src);
    if (srcset === null) img.removeAttribute("srcset");
    else img.setAttribute("srcset", srcset);
  });
}

/** PNG de um bloco da página, com as capas garantidas (inclusive no iPhone) */
export async function fotografarPng(no: HTMLElement, opcoes: Opcoes = {}) {
  const desfazer = await embutirImagens(no);
  try {
    // a primeira passada "aquece" o Safari; a segunda sai completa
    await toPng(no, opcoes).catch(() => undefined);
    return await toPng(no, opcoes);
  } finally {
    desfazer();
  }
}

/** JPEG de um bloco (para o PDF), com o mesmo cuidado */
export async function fotografarJpeg(no: HTMLElement, opcoes: Opcoes = {}) {
  const desfazer = await embutirImagens(no);
  try {
    await toJpeg(no, opcoes).catch(() => undefined);
    return await toJpeg(no, opcoes);
  } finally {
    desfazer();
  }
}
