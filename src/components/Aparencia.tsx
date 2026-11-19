"use client";

import { useEffect } from "react";
import { usePerfil } from "@/lib/perfil-store";
import { temas } from "@/lib/dados";
import { coresDoTema } from "@/lib/tema";

/** Mantém o modo escuro/claro do app em dia com a escolha da pessoa (e com o sistema, no "automático"). */
export function Aparencia() {
  const aparencia = usePerfil((s) => s.aparencia ?? "claro");
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const aplicar = () => {
      const escuro =
        aparencia === "escuro" || (aparencia === "sistema" && mq.matches);
      if (escuro) document.documentElement.dataset.modo = "escuro";
      else delete document.documentElement.dataset.modo;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", escuro ? "#1a1416" : "#6b0d24");
    };
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, [aparencia]);
  // o tema do perfil no app todo (se a pessoa ligou em configurações)
  const tema = usePerfil((s) => s.tema);
  const temaNoApp = usePerfil((s) => !s.temaSoNoPerfil);
  useEffect(() => {
    const raiz = document.documentElement;
    const t = temas.find((x) => x.id === tema);
    if (temaNoApp && t && "escuro" in t) raiz.dataset.temaEscuro = "1";
    else delete raiz.dataset.temaEscuro;
    const cores = (temaNoApp ? coresDoTema(tema) : undefined) ?? {};
    const nomes = Object.keys(cores);
    for (const [k, v] of Object.entries(cores))
      if (k.startsWith("--")) raiz.style.setProperty(k, String(v));
    return () => {
      for (const k of nomes) raiz.style.removeProperty(k);
    };
  }, [tema, temaNoApp]);
  return null;
}
