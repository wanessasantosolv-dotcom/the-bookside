"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Estado do perfil criado no onboarding.
 * Por enquanto fica salvo no navegador (localStorage).
 * Quando o Supabase entrar, este store passa a ler e gravar no banco.
 */

export type PadraoCapa = "linhas" | "bolinhas" | "ondas" | "estrelas";
export type EscolhaEstante = "lendo" | "quero" | "vazia";

export type StatusLivro = "lendo" | "quero" | "lido";
export type LivroSalvo = { id: string; titulo: string; autor: string; status?: StatusLivro };

export type Perfil = {
  email: string | null;
  nome: string;
  usuario: string;
  foto: string | null; // data URL reduzida
  capa: PadraoCapa;
  capaImagem: string | null; // data URL da galeria
  frase: string;
  meta: number | null; // null = sem meta
  tema: string;
  estante: EscolhaEstante;
  gostos: string[];
  livros: LivroSalvo[];
  /** resultado do teste, salvo só com consentimento */
  bookside: { principal: string; secundario: string; respostas: (number | null)[]; livros: string[]; salvoEm: string } | null;
  onboardingConcluido: boolean;
};

type Acoes = {
  atualizar: (dados: Partial<Perfil>) => void;
  alternarGosto: (gosto: string) => void;
  alternarLivro: (livro: LivroSalvo) => void;
  guardarLivro: (livro: LivroSalvo) => void;
  sair: () => void;
};

export const perfilInicial: Perfil = {
  email: null,
  nome: "",
  usuario: "",
  foto: null,
  capa: "linhas",
  capaImagem: null,
  frase: "gosto de finais que doem",
  meta: 40,
  tema: "biblioteca-classica",
  estante: "lendo",
  gostos: ["romance", "suspense", "fantasia"],
  livros: [],
  bookside: null,
  onboardingConcluido: false,
};

export const usePerfil = create<Perfil & Acoes>()(
  persist(
    (set) => ({
      ...perfilInicial,
      atualizar: (dados) => set(dados),
      alternarGosto: (gosto) =>
        set((s) => ({
          gostos: s.gostos.includes(gosto) ? s.gostos.filter((g) => g !== gosto) : [...s.gostos, gosto],
        })),
      alternarLivro: (livro) =>
        set((s) => ({
          livros: s.livros.some((l) => l.id === livro.id)
            ? s.livros.filter((l) => l.id !== livro.id)
            : [...s.livros, livro],
        })),
      guardarLivro: (livro) =>
        set((s) => ({ livros: [...s.livros.filter((l) => l.id !== livro.id), livro] })),
      sair: () => set({ ...perfilInicial }),
    }),
    {
      name: "bookside-perfil",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // carregado por <PerfilHidratacao /> depois de montar
    },
  ),
);

/** gera um @usuario a partir do nome: "Ana Clara" → "ana.clara" */
export function sugerirUsuario(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);
}
