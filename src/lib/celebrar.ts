"use client";

import { create } from "zustand";

/** as celebrações do app: um momento especial vira uma animação por cima da tela */
export type Celebracao = {
  id: number;
  tipo: "livro" | "meta" | "desafio" | "amei" | "favorito";
  titulo: string;
  texto?: string;
  capa?: string;
};

type Estado = {
  atual: Celebracao | null;
  celebrar: (c: Omit<Celebracao, "id">) => void;
  fechar: () => void;
};

export const useCelebracao = create<Estado>((set) => ({
  atual: null,
  celebrar: (c) => set({ atual: { ...c, id: Date.now() } }),
  fechar: () => set({ atual: null }),
}));

export const celebrar = (c: Omit<Celebracao, "id">) =>
  useCelebracao.getState().celebrar(c);

/**
 * Terminei um livro: comemora; se ele fechou a meta do ano, a comemoração é da meta.
 * (chamar depois de salvar o livro como lido)
 */
export function celebrarTermino(
  livro: { titulo: string; capa?: string },
  estado: { livros: { status?: string; lidoEm?: string }[]; meta: number | null },
) {
  const ano = String(new Date().getFullYear());
  const lidosNoAno = estado.livros.filter(
    (l) => l.status === "lido" && l.lidoEm?.startsWith(ano),
  ).length;
  if (estado.meta && lidosNoAno === estado.meta)
    return celebrar({
      tipo: "meta",
      titulo: `${estado.meta} livros em ${ano}!`,
      texto: "você bateu a sua meta do ano. tudo agora é bônus ✦",
    });
  celebrar({
    tipo: "livro",
    titulo: livro.titulo,
    capa: livro.capa ?? "",
    texto: estado.meta
      ? `livro nº ${lidosNoAno} de ${estado.meta} em ${ano}`
      : `livro nº ${lidosNoAno} em ${ano}`,
  });
}
