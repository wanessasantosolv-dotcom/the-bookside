"use client";

import { useEffect, useState } from "react";
import { usePerfil } from "@/lib/perfil-store";
import { temas } from "@/lib/dados";
import { coresDoTema } from "@/lib/tema";
import { atributosDoTema, corDaEstanteApp, estanteClareia, temaApp } from "@/lib/temas";

/** o app está no modo escuro? (a escolha da pessoa ou o sistema, no "automático") */
export function useModoEscuro() {
  const aparencia = usePerfil((s) => s.aparencia ?? "claro");
  const [doSistema, setDoSistema] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const ler = () => setDoSistema(mq.matches);
    ler();
    mq.addEventListener("change", ler);
    return () => mq.removeEventListener("change", ler);
  }, []);
  return aparencia === "escuro" || (aparencia === "sistema" && doSistema);
}

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
      const s = usePerfil.getState();
      const t = s.temaSoNoPerfil ? undefined : temaApp(s.tema);
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", t ? (escuro ? t.escuro.fundo : t.claro.fundo) : escuro ? "#1a1416" : "#6b0d24");
    };
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, [aparencia]);
  // o tema do perfil no app todo (se a pessoa ligou em configurações)
  const tema = usePerfil((s) => s.tema);
  const temaNoApp = usePerfil((s) => !s.temaSoNoPerfil);
  const modoEscuro = useModoEscuro();
  const estiloEstante = usePerfil((s) => s.estiloEstante ?? "auto");
  const decoracao = usePerfil((s) => s.decoracao ?? null);
  // atributos do tema (cantos, decoração, estante) e a cor da estante
  useEffect(() => {
    aplicarExtrasDoTema(temaNoApp ? tema : undefined, modoEscuro, estiloEstante, decoracao);
  }, [tema, temaNoApp, modoEscuro, estiloEstante, decoracao]);
  useEffect(() => {
    const raiz = document.documentElement;
    const t = temas.find((x) => x.id === tema);
    if (temaNoApp && t && "escuro" in t && modoEscuro)
      raiz.dataset.temaEscuro = "1";
    else delete raiz.dataset.temaEscuro;
    const cores = (temaNoApp ? coresDoTema(tema, modoEscuro) : undefined) ?? {};
    const nomes = Object.keys(cores);
    // guarda as duas variantes para o script do <head> pintar o tema certo antes de carregar (sem piscar)
    try {
      const variante = (esc: boolean) => {
        const c = (temaNoApp ? coresDoTema(tema, esc) : undefined) ?? {};
        const t = temaNoApp ? temaApp(tema) : undefined;
        const d: Record<string, string> = {};
        if (t?.reto) d.cantosApp = "retos";
        return { p: Object.fromEntries(Object.entries(c).filter(([k]) => k.startsWith("--"))), d };
      };
      localStorage.setItem("bookside-tema-cache", JSON.stringify({ claro: variante(false), escuro: variante(true) }));
    } catch {
      /* sem armazenamento */
    }
    // o que o script do <head> pintou e não vale mais sai
    for (const k of Array.from(raiz.style)) if (k.startsWith("--") && k !== "--app-estante" && !(k in cores)) raiz.style.removeProperty(k);
    for (const [k, v] of Object.entries(cores))
      if (k.startsWith("--")) raiz.style.setProperty(k, String(v));
    return () => {
      for (const k of nomes) raiz.style.removeProperty(k);
    };
    // aparencia: o papel claro do tema sai/volta quando muda o modo escuro
  }, [tema, temaNoApp, modoEscuro]);
  return null;
}

/** os atributos do tema no <html> (usado também pela prévia da edição de perfil) */
export function aplicarExtrasDoTema(
  tema: string | undefined,
  modoEscuro: boolean,
  estiloEstante: "auto" | "clara" | "escura" | "tema" | "minimalista",
  decoracao: "minimal" | "editorial" | "expressive" | null,
) {
  const raiz = document.documentElement;
  const t = temaApp(tema);
  for (const [k, v] of Object.entries(atributosDoTema(t))) {
    const nome = k.replace(/^data-/, "").replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    if (v) raiz.dataset[nome] = v;
    else delete raiz.dataset[nome];
  }
  raiz.dataset.decoracao = decoracao ?? t?.decoracao ?? "editorial";
  raiz.dataset.estanteApp = estiloEstante;
  const cor = corDaEstanteApp(estiloEstante, t, modoEscuro);
  if (cor && (estiloEstante !== "auto" || t)) raiz.style.setProperty("--app-estante", cor);
  else raiz.style.removeProperty("--app-estante");
  if (estanteClareia(estiloEstante, t, modoEscuro)) raiz.dataset.estanteClara = "1";
  else delete raiz.dataset.estanteClara;
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
      aria-label={
        escuro ? "trocar para o modo claro" : "trocar para o modo escuro"
      }
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
