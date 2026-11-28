"use client";

import { create } from "zustand";

/*
 * As celebrações do app, num mecanismo só (o componente <Celebracao/> fica no
 * layout raiz). Concluir um livro — em qualquer tela — passa por
 * celebrarTermino, chamado pela própria estante (perfil-store) quando um livro
 * vira "lido" por ação da pessoa. Sincronização da nuvem não passa por aqui.
 */

export type Conquista = { tipo: "meta" | "desafio" | "clube"; titulo: string; detalhe?: string };

export type Celebracao = {
  id: number;
  tipo: "livro" | "meta" | "desafio" | "amei" | "favorito" | "lote";
  titulo: string;
  texto?: string;
  capa?: string;
  autor?: string;
  /** id do livro (avaliar e compartilhar usam o registro já salvo) */
  livroId?: string;
  /** frase editorial principal, conforme o evento */
  chamada?: string;
  /** progresso da meta do ano vigente, calculado depois de salvar */
  meta?: { lidos: number; meta: number; ano: number } | null;
  conquistas?: Conquista[];
  /** "lote": quantos livros entraram de uma vez */
  quantos?: number;
};

type Estado = {
  atual: Celebracao | null;
  pendentes: Celebracao[];
  celebrar: (c: Omit<Celebracao, "id">) => void;
  fechar: () => void;
};

let sequencia = 0;
export const useCelebracao = create<Estado>((set) => ({
  atual: null,
  pendentes: [],
  celebrar: (c) => set((s) => {
    const evento = { ...c, id: ++sequencia };
    return s.atual ? { pendentes: [...s.pendentes, evento] } : { atual: evento };
  }),
  fechar: () => set((s) => ({
    atual: s.pendentes[0] ?? null,
    pendentes: s.pendentes.slice(1),
  })),
}));

// o mesmo evento nunca abre duas celebrações (ex.: duas telas reagindo à mesma conclusão)
const recentes = new Map<string, number>();
export const celebrar = (c: Omit<Celebracao, "id">) => {
  const chave = `${c.tipo}|${c.livroId ?? c.titulo}`;
  const agora = Date.now();
  if (agora - (recentes.get(chave) ?? 0) < 8000) return;
  for (const [k, em] of recentes) if (agora - em >= 8000) recentes.delete(k);
  recentes.set(chave, agora);
  useCelebracao.getState().celebrar(c);
};

type LivroLido = { id: string; titulo: string; autor?: string; capa?: string; lidoEm?: string; lidoSoAno?: boolean };
type EstadoEstante = { livros: { status?: string; lidoEm?: string }[]; meta: number | null };

// conclusões que chegam juntas (importação, cadastro em lote) viram uma celebração coletiva
let fila: { livro: LivroLido; estado: EstadoEstante; releitura: boolean }[] = [];
let espera: ReturnType<typeof setTimeout> | undefined;

/**
 * Terminei um livro. Chamar DEPOIS de salvar. A meta só aparece quando a
 * leitura tem data no ano vigente (sem data ou de outro ano não conta).
 */
export function celebrarTermino(livro: LivroLido, estado: EstadoEstante, opcoes: { releitura?: boolean } = {}) {
  fila.push({ livro, estado, releitura: !!opcoes.releitura });
  clearTimeout(espera);
  espera = setTimeout(() => {
    const itens = fila;
    fila = [];
    if (itens.length > 2) {
      celebrar({ tipo: "lote", titulo: `${itens.length} livros na estante`, chamada: "mais histórias na estante.", quantos: itens.length, texto: "registrados como lidos, com as datas que você informou." });
      return;
    }
    for (const { livro: l, estado: e, releitura } of itens) {
      const ano = new Date().getFullYear();
      const desteAno = !!l.lidoEm && l.lidoEm.startsWith(String(ano));
      const lidosNoAno = e.livros.filter((x) => x.status === "lido" && x.lidoEm?.startsWith(String(ano))).length;
      const totalLidos = e.livros.filter((x) => x.status === "lido").length;
      const meta = desteAno && e.meta ? { lidos: lidosNoAno, meta: e.meta, ano } : null;
      const bateu = !!meta && meta.lidos === meta.meta;
      const chamada = bateu ? "entre tantas histórias." : releitura ? "de volta às páginas." : totalLidos === 1 ? "era uma vez." : "mais uma última página.";
      celebrar({
        tipo: bateu ? "meta" : "livro",
        titulo: l.titulo,
        autor: l.autor,
        capa: l.capa ?? "",
        livroId: l.id,
        chamada,
        meta,
        conquistas: bateu ? [{ tipo: "meta", titulo: `Meta de ${ano} alcançada`, detalhe: `${meta!.meta} livros` }] : [],
        texto: !l.lidoEm ? "registrado nos lidos, sem data" : !desteAno ? `lido em ${l.lidoEm.slice(0, 4)}` : undefined,
      });
    }
  }, 350);
}
