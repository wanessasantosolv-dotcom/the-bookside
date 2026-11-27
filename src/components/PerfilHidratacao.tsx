"use client";

import { useEffect, useSyncExternalStore } from "react";
import { iniciarCapas } from "@/lib/catalogo";
import { iniciarSincronizacaoClubes } from "@/lib/clubes";
import { preaquecerIndicacoes } from "@/lib/indicacoes";
import { iniciarNuvem } from "@/lib/nuvem";
import { iniciarAtividades } from "@/lib/social";
import { usePerfil } from "@/lib/perfil-store";
import { useTeste } from "@/lib/teste-store";
import { useEntrelinhas } from "@/lib/entrelinhas-store";

/**
 * O perfil fica salvo no navegador (e, com conta, também no Supabase). Ele só é lido depois que a página monta,
 * para o HTML do servidor e o do navegador começarem iguais.
 */
export function PerfilHidratacao() {
  useEffect(() => {
    let parar = () => {};
    let ativo = true;
    void useTeste.persist.rehydrate();
    void useEntrelinhas.persist.rehydrate();
    // primeiro o que está no navegador; depois a nuvem (se houver conta) por cima
    void Promise.resolve(usePerfil.persist.rehydrate()).then(() => {
      if (!ativo) return;
      const pararNuvem = iniciarNuvem();
      const pararCapas = iniciarCapas();
      const pararAtividades = iniciarAtividades();
      const pararClubes = iniciarSincronizacaoClubes();
      // as indicações do "descobrir" ficam prontas antes da pessoa abrir a aba
      const aquecer = setTimeout(preaquecerIndicacoes, 4000);
      parar = () => {
        clearTimeout(aquecer);
        pararClubes();
        pararNuvem();
        pararCapas();
        pararAtividades();
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
