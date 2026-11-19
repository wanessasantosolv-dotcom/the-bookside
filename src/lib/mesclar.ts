import type { LivroSalvo, Perfil } from "@/lib/perfil-store";

/**
 * Junta o perfil de dois aparelhos (o da nuvem e o daqui) sem perder nada:
 * - livros: livro por livro, vale a versão mudada por último (atualizadoEm);
 *   um livro tirado da estante não volta se foi tirado depois da última mudança;
 * - o resto (nome, meta, tema, favoritos…): vale o daqui só no que foi mudado
 *   aqui desde a última sincronização; o resto vem da nuvem.
 */
const quando = (l: LivroSalvo) => l.atualizadoEm ?? l.adicionadoEm ?? "";

export function mesclarPerfis(
  remoto: Partial<Perfil>,
  local: Partial<Perfil>,
  mudadosAqui: Set<string>,
  campos: (keyof Perfil)[],
): Partial<Perfil> {
  const saida: Partial<Perfil> = {};
  for (const k of campos) {
    if (k === "livros" || k === "removidos") continue;
    const v = mudadosAqui.has(k) || !(k in remoto) ? local[k] : remoto[k];
    (saida as Record<string, unknown>)[k] = v;
  }

  // livros tirados: junta as duas listas, fica a data mais recente de cada um
  const removidos = new Map<string, string>();
  for (const r of [...(remoto.removidos ?? []), ...(local.removidos ?? [])])
    if (!removidos.has(r.id) || r.em > removidos.get(r.id)!) removidos.set(r.id, r.em);

  // livros: o mais recente de cada um
  const preferirLocal = mudadosAqui.has("livros");
  const livros = new Map<string, LivroSalvo>();
  for (const l of remoto.livros ?? []) livros.set(l.id, l);
  for (const l of local.livros ?? []) {
    const r = livros.get(l.id);
    if (!r || quando(l) > quando(r) || (quando(l) === quando(r) && preferirLocal)) livros.set(l.id, l);
  }
  saida.livros = [...livros.values()].filter((l) => {
    const tirado = removidos.get(l.id);
    return !tirado || tirado < quando(l);
  });
  saida.removidos = [...removidos].map(([id, em]) => ({ id, em })).slice(-800);
  // favoritos que sumiram da estante saem também
  if (saida.favoritos) {
    const ids = new Set(saida.livros.map((l) => l.id));
    saida.favoritos = saida.favoritos.filter((f) => ids.has(f));
  }
  return saida;
}
