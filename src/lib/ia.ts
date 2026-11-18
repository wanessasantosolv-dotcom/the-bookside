"use client";

import { supabase } from "@/lib/supabase";

/** Respostas da IA do app (as rotas ficam em /api/ia). */
export type FichaDoLivro = {
  encontrado: boolean;
  titulo?: string;
  autor?: string;
  sinopse?: string;
  paginas?: number;
  ano?: number;
  genero?: string;
};
export type Citacao = { texto: string; spoiler: boolean };

export class ErroIA extends Error {}

async function chamar<T>(rota: string, corpo: object): Promise<T> {
  const token = (await supabase?.auth.getSession())?.data.session?.access_token;
  if (!token) throw new ErroIA("entre na sua conta para usar a IA.");
  const r = await fetch(`/api/ia/${rota}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(corpo),
  }).catch(() => null);
  if (!r) throw new ErroIA("sem conexão agora. tente de novo.");
  const dados = await r.json().catch(() => ({}));
  if (dados.semIA) throw new ErroIA("a IA ainda não foi ligada no app.");
  if (r.status === 429)
    throw new ErroIA("muitos pedidos seguidos. espere uns minutinhos.");
  if (!r.ok)
    throw new ErroIA(
      dados.erro ?? "não deu para pesquisar agora. tente de novo.",
    );
  return dados as T;
}

export const completarLivro = (titulo: string, autor: string) =>
  chamar<FichaDoLivro>("livro", { titulo, autor });
export const sugerirCitacoes = (titulo: string, autor: string) =>
  chamar<{ citacoes: Citacao[] }>("citacoes", { titulo, autor }).then(
    (r) => r.citacoes,
  );
