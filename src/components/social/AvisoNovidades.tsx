"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { usePerfil } from "@/lib/perfil-store";
import { contarNovidades, useMeuId } from "@/lib/social";

/** quantas novidades ainda não vistas (um só contador para o app todo) */
const useContador = create<{ n: number }>(() => ({ n: 0 }));

let ultimaBusca = 0;
let buscando = false;

async function atualizarContador(desde: string | null, forcar = false) {
  if (buscando) return;
  if (!forcar && Date.now() - ultimaBusca < 20_000) return;
  buscando = true;
  try {
    const n = await contarNovidades(desde);
    ultimaBusca = Date.now();
    useContador.setState({ n });
  } catch {
    /* sem rede ou sem nuvem: o sininho só não acende */
  } finally {
    buscando = false;
  }
}

/**
 * Vigia as novidades: a cada minuto, quando o app volta a ficar visível e
 * quando a pessoa abre as novidades. Também põe "(3)" no título da aba do
 * navegador e o número no ícone do app instalado (quando o aparelho deixa).
 */
export function VigiaNovidades() {
  const eu = useMeuId();
  const vistasEm = usePerfil((s) => s.novidadesVistasEm);
  const n = useContador((s) => s.n);

  useEffect(() => {
    if (!eu) {
      useContador.setState({ n: 0 });
      return;
    }
    void atualizarContador(vistasEm, true);
    const id = setInterval(() => void atualizarContador(vistasEm), 60_000);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") void atualizarContador(vistasEm);
    };
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", aoVoltar);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", aoVoltar);
    };
  }, [eu, vistasEm]);

  useEffect(() => {
    const limpo = document.title.replace(/^\(\d+\+?\)\s*/, "");
    document.title = n ? `(${n > 99 ? "99+" : n}) ${limpo}` : limpo;
    const nav = navigator as Navigator & {
      setAppBadge?: (n?: number) => Promise<void>;
      clearAppBadge?: () => Promise<void>;
    };
    try {
      if (n) void nav.setAppBadge?.(n)?.catch(() => {});
      else void nav.clearAppBadge?.()?.catch(() => {});
    } catch {
      /* navegador sem suporte */
    }
  }, [n]);

  return null;
}

export function useNovidadesNovas() {
  return useContador((s) => s.n);
}

/** zera o contador na hora (ao abrir a tela de novidades) */
export function zerarNovidades() {
  useContador.setState({ n: 0 });
}

/** a bolinha com o número, por cima de um ícone */
export function SeloNovidades({ className = "" }: { className?: string }) {
  const n = useNovidadesNovas();
  if (!n) return null;
  return (
    <span
      className={`pointer-events-none absolute flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-bordo px-1 text-[10px] leading-none font-bold text-creme ring-2 ring-creme ${className}`}
    >
      {n > 99 ? "99+" : n}
      <span className="sr-only">
        {n === 1 ? " novidade nova" : " novidades novas"}
      </span>
    </span>
  );
}

/** um pontinho discreto, para o menu */
export function PontoNovidades({ className = "" }: { className?: string }) {
  const n = useNovidadesNovas();
  if (!n) return null;
  return (
    <span
      aria-label={`${n} ${n === 1 ? "novidade" : "novidades"}`}
      className={`pointer-events-none absolute size-2 rounded-full bg-bordo ring-2 ring-creme-quente ${className}`}
    />
  );
}
