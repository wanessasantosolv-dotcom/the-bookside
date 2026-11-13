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
export type NotasDetalhe = { personagens: number; plot: number; escrita: number; final: number };

export type LivroSalvo = {
  id: string;
  titulo: string;
  autor: string;
  status?: StatusLivro;
  /** URL da capa (Open Library) */
  capa?: string;
  /** a pessoa escolheu ou enviou esta capa: o app não troca sozinho */
  capaEscolhida?: boolean;
  genero?: string;
  /** quando entrou na estante (ISO) */
  adicionadoEm?: string;
  paginas?: number;
  paginaAtual?: number;
  iniciadoEm?: string;
  lidoEm?: string;
  /** 0,5 a 5 */
  nota?: number;
  notas?: NotasDetalhe;
  resenha?: string;
  anotacao?: string;
  /** ids das estantes criadas pela pessoa onde o livro está */
  estantes?: string[];
};

export type EstantePropria = { id: string; nome: string; cor: string; publica: boolean; criadaEm: string };

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
  /** ids dos até 4 livros em destaque no perfil */
  favoritos: string[];
  /** estantes criadas pela pessoa (além de lidos, lendo e quero ler) */
  estantesProprias: EstantePropria[];
  /** resultado do teste, salvo só com consentimento */
  bookside: { principal: string; secundario: string; respostas: (number | null)[]; livros: string[]; salvoEm: string } | null;
  onboardingConcluido: boolean;
};

type Acoes = {
  atualizar: (dados: Partial<Perfil>) => void;
  alternarGosto: (gosto: string) => void;
  alternarLivro: (livro: LivroSalvo) => void;
  guardarLivro: (livro: LivroSalvo) => void;
  /** junta dados num livro da estante (cria se não existir) */
  editarLivro: (base: Pick<LivroSalvo, "id" | "titulo" | "autor" | "capa" | "genero">, dados: Partial<LivroSalvo>) => void;
  removerLivro: (id: string) => void;
  criarEstante: (e: Omit<EstantePropria, "id" | "criadaEm">) => string;
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
  gostos: [],
  livros: [],
  favoritos: [],
  estantesProprias: [],
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
            : [...s.livros, { adicionadoEm: new Date().toISOString(), ...livro }],
        })),
      guardarLivro: (livro) =>
        set((s) => {
          const antigo = s.livros.find((l) => l.id === livro.id);
          return {
            livros: [
              ...s.livros.filter((l) => l.id !== livro.id),
              { ...antigo, adicionadoEm: antigo?.adicionadoEm ?? new Date().toISOString(), ...livro },
            ],
          };
        }),
      editarLivro: (base, dados) =>
        set((s) => {
          const antigo = s.livros.find((l) => l.id === base.id);
          const novo: LivroSalvo = { adicionadoEm: new Date().toISOString(), ...base, ...antigo, ...dados };
          return { livros: antigo ? s.livros.map((l) => (l.id === base.id ? novo : l)) : [...s.livros, novo] };
        }),
      removerLivro: (id) =>
        set((s) => ({ livros: s.livros.filter((l) => l.id !== id), favoritos: s.favoritos.filter((f) => f !== id) })),
      criarEstante: (e) => {
        const id = `${sugerirUsuario(e.nome).replace(/\./g, "-") || "estante"}-${Date.now().toString(36)}`;
        set((s) => ({ estantesProprias: [...s.estantesProprias, { ...e, id, criadaEm: new Date().toISOString() }] }));
        return id;
      },
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
