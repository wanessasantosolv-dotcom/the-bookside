"use client";

import { useEffect } from "react";
import { useHidratado } from "@/components/PerfilHidratacao";
import { generoGenerico, generoRefinadoDe, traduzirGenero } from "@/lib/generos";
import { usePerfil } from "@/lib/perfil-store";

/** livros já olhados nesta visita (para não repetir) */
const vistos = new Set<string>();

/**
 * Troca o gênero genérico dos livros ("fiction", "ficção", "literatura"…)
 * pelo mais específico que a Open Library conhece (romance, suspense,
 * fantasia…), uma vez por livro. Vale para o app inteiro.
 */
export function VigiaGeneros() {
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  const editarLivro = usePerfil((s) => s.editarLivro);
  const chave = livros
    .filter((l) => generoGenerico(l.genero) && !vistos.has(l.id))
    .map((l) => l.id)
    .join("|");

  useEffect(() => {
    if (!hidratado || !chave) return;
    const faltam = usePerfil
      .getState()
      .livros.filter((l) => generoGenerico(l.genero) && !vistos.has(l.id));
    faltam.forEach((l) => vistos.add(l.id));
    (async () => {
      for (let i = 0; i < faltam.length; i += 4) {
        const lote = faltam.slice(i, i + 4);
        const achados = await Promise.all(lote.map(generoRefinadoDe));
        lote.forEach((l, k) => {
          const g = achados[k];
          if (g && g !== traduzirGenero(l.genero)) {
            editarLivro({ id: l.id, titulo: l.titulo, autor: l.autor, capa: l.capa, genero: l.genero }, { genero: g });
          }
        });
      }
    })();
    // a busca continua mesmo se a lista mudar (os livros já ficaram marcados como vistos)
  }, [hidratado, chave, editarLivro]);

  return null;
}
