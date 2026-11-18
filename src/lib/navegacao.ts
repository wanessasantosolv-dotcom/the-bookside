"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * O caminho que a pessoa fez dentro do app, guardado na sessão.
 * É ele que decide para onde o "‹ voltar" leva — não o histórico do
 * navegador (que guarda formulários já salvos, links abertos de fora, etc.).
 *
 * Regras: abrir uma tela nova empilha; voltar para uma tela que já está no
 * caminho corta tudo o que veio depois dela (assim, depois de salvar um
 * formulário e cair de volta no livro, o voltar do livro vai para onde a
 * pessoa estava antes dele, e não para o formulário).
 */
const CHAVE = "bookside-caminho";
const MAXIMO = 40;

function ler(): string[] {
  try {
    const v = JSON.parse(sessionStorage.getItem(CHAVE) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function gravar(c: string[]) {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(c.slice(-MAXIMO)));
  } catch {
    /* sem sessionStorage: o voltar usa o destino padrão */
  }
  avisar.forEach((f) => f());
}

const avisar = new Set<() => void>();

/** Chamado a cada troca de tela (ver RastroNavegacao). */
export function registrarTela(url: string) {
  const c = ler();
  if (c[c.length - 1] === url) return;
  const ja = c.lastIndexOf(url);
  gravar(ja >= 0 ? c.slice(0, ja + 1) : [...c, url]);
}

/** A tela anterior do caminho (ou null quando a pessoa chegou direto aqui). */
export function telaAnterior(atual: string): string | null {
  const c = ler();
  const i = c.lastIndexOf(atual);
  const ate = i >= 0 ? i : c.length;
  return ate > 0 ? c[ate - 1] : null;
}

const urlAtual = () => window.location.pathname + window.location.search;
const soCaminho = (u: string) => u.split(/[?#]/)[0];

/**
 * Para onde o "voltar" desta tela leva: a tela que trouxe a pessoa até aqui
 * ou, se ela abriu o link direto, o `padrao`.
 * `mesmaQueOPadrao` diz se o destino é o padrão (para manter o rótulo, ex. "‹ estantes").
 */
export function useVoltar(padrao: string) {
  const router = useRouter();
  const [anterior, setAnterior] = useState<string | null>(null);
  useEffect(() => {
    const ver = () => setAnterior(telaAnterior(urlAtual()));
    ver();
    avisar.add(ver);
    return () => {
      avisar.delete(ver);
    };
  }, []);
  const href = anterior ?? padrao;
  return {
    href,
    mesmaQueOPadrao: soCaminho(href) === soCaminho(padrao),
    ir: () => router.push(href),
  };
}
