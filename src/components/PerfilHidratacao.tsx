"use client";

import { useEffect, useSyncExternalStore } from "react";
import { usePerfil } from "@/lib/perfil-store";

/**
 * O perfil fica salvo no navegador. Ele só é lido depois que a página monta,
 * para o HTML do servidor e o do navegador começarem iguais.
 */
export function PerfilHidratacao() {
  useEffect(() => {
    void usePerfil.persist.rehydrate();
  }, []);
  return null;
}

function assinar(aviso: () => void) {
  return usePerfil.persist.onFinishHydration(aviso);
}

/** true quando o perfil salvo já foi carregado. */
export function useHidratado() {
  return useSyncExternalStore(
    assinar,
    () => usePerfil.persist.hasHydrated(),
    () => false,
  );
}
