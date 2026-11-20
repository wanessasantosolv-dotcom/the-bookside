"use client";

import { useEffect, useState } from "react";
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
    // aparencia: o papel claro do tema sai/volta quando muda o modo escuro
  }, [tema, temaNoApp, aparencia]);
  return null;
}

/**
 * Um toque pra trocar entre claro e escuro — sem precisar entrar em
 * configurações. Se a pessoa estava em "sistema", o toque assume o controle.
 */
export function AlternarAparencia({
  className = "flex size-11 items-center justify-center rounded-pill text-bordo hover:bg-rosa-fundo",
}: {
  className?: string;
}) {
  const aparencia = usePerfil((s) => s.aparencia ?? "claro");
  const atualizar = usePerfil((s) => s.atualizar);
  const [escuroDoSistema, setEscuroDoSistema] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const ler = () => setEscuroDoSistema(mq.matches);
    ler();
    mq.addEventListener("change", ler);
    return () => mq.removeEventListener("change", ler);
  }, []);
  const escuro =
    aparencia === "escuro" || (aparencia === "sistema" && escuroDoSistema);

  return (
    <button
      type="button"
      aria-label={escuro ? "trocar para o modo claro" : "trocar para o modo escuro"}
      onClick={() => atualizar({ aparencia: escuro ? "claro" : "escuro" })}
      className={className}
    >
      {escuro ? (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v2.5M12 19v2.5M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.5M19 12h2.5M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8" />
        </svg>
      ) : (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
        </svg>
      )}
    </button>
  );
}
