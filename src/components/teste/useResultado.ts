"use client";

import { useSyncExternalStore } from "react";
import { calcularResultado } from "@/lib/teste";
import { useTeste } from "@/lib/teste-store";

function assinar(aviso: () => void) {
  return useTeste.persist.onFinishHydration(aviso);
}

/** Resultado do teste a partir das respostas desta sessão. */
export function useResultado() {
  const pronto = useSyncExternalStore(assinar, () => useTeste.persist.hasHydrated(), () => false);
  const respostas = useTeste((s) => s.respostas);
  const respondidas = respostas.filter((r) => r !== null).length;
  return { pronto, resultado: calcularResultado(respostas), respostas, respondidas };
}
