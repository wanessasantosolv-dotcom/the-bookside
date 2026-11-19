"use client";

import { useSyncExternalStore } from "react";
import { usePerfil } from "@/lib/perfil-store";
import { calcularResultado } from "@/lib/teste";
import { useTeste } from "@/lib/teste-store";

function assinar(aviso: () => void) {
  return useTeste.persist.onFinishHydration(aviso);
}

/**
 * Resultado do teste a partir das respostas desta sessão — ou, se a pessoa
 * não está fazendo o teste agora, das respostas guardadas no perfil.
 */
export function useResultado() {
  const testePronto = useSyncExternalStore(assinar, () => useTeste.persist.hasHydrated(), () => false);
  const perfilPronto = useSyncExternalStore(
    (aviso) => usePerfil.persist.onFinishHydration(aviso),
    () => usePerfil.persist.hasHydrated(),
    () => false,
  );
  const pronto = testePronto && perfilPronto;
  const daSessao = useTeste((s) => s.respostas);
  const salvas = usePerfil((s) => s.bookside?.respostas);
  const respostas =
    daSessao.some((r) => r !== null) || !salvas?.length ? daSessao : salvas;
  const respondidas = respostas.filter((r) => r !== null).length;
  return { pronto, resultado: calcularResultado(respostas), respostas, respondidas };
}
