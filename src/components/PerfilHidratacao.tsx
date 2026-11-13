"use client";

import { useEffect, useSyncExternalStore } from "react";
import { iniciarCapas } from "@/lib/catalogo";
import { iniciarNuvem } from "@/lib/nuvem";
import { usePerfil } from "@/lib/perfil-store";
import { useTeste } from "@/lib/teste-store";

/**
 * O perfil fica salvo no navegador (e, com conta, também no Supabase). Ele só é lido depois que a página monta,
 * para o HTML do servidor e o do navegador começarem iguais.
 */
export function PerfilHidratacao() {
  useEffect(() => {
    let parar = () => {};
    let ativo = true;
    void useTeste.persist.rehydrate();
    // primeiro o que está no navegador; depois a nuvem (se houver conta) por cima
    void Promise.resolve(usePerfil.persist.rehydrate()).then(() => {
      if (!ativo) return;
      const pararNuvem = iniciarNuvem();
      const pararCapas = iniciarCapas();
      parar = () => {
        pararNuvem();
        pararCapas();
      };
    });
    return () => {
      ativo = false;
      parar();
    };
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
