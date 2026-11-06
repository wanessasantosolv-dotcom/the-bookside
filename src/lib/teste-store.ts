"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { perguntas } from "@/lib/teste";

/**
 * Respostas do teste enquanto ele está sendo feito.
 * Ficam só nesta aba do navegador (sessionStorage) e só vão para o perfil
 * se a pessoa permitir na tela "posso guardar isso?".
 */
type EstadoTeste = {
  respostas: (number | null)[];
  responder: (pergunta: number, opcao: number) => void;
  recomecar: () => void;
};

const vazio = () => perguntas.map(() => null);

export const useTeste = create<EstadoTeste>()(
  persist(
    (set) => ({
      respostas: vazio(),
      responder: (pergunta, opcao) =>
        set((s) => {
          const respostas = [...s.respostas];
          respostas[pergunta] = opcao;
          return { respostas };
        }),
      recomecar: () => set({ respostas: vazio() }),
    }),
    {
      name: "bookside-teste",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
    },
  ),
);
