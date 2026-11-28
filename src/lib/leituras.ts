import type { LivroSalvo } from "@/lib/perfil-store";

export function registrosUnicos(livros: LivroSalvo[]): LivroSalvo[] {
  const registros = new Map<string, LivroSalvo>();
  const revisao = (livro: LivroSalvo) => livro.atualizadoEm ?? livro.adicionadoEm ?? "";
  for (const livro of livros) {
    const anterior = registros.get(livro.id);
    if (!anterior || revisao(livro) >= revisao(anterior)) registros.set(livro.id, livro);
  }
  return [...registros.values()];
}

export function leiturasConcluidas(livros: LivroSalvo[]): LivroSalvo[] {
  return registrosUnicos(livros).flatMap((livro) => [
    ...(livro.releituras ?? []).map((anterior) => ({
      ...livro,
      status: "lido" as const,
      iniciadoEm: anterior.iniciadoEm,
      lidoEm: anterior.lidoEm,
      lidoSoAno: anterior.lidoSoAno,
      lidoSoMes: anterior.lidoSoMes,
      nota: anterior.nota,
      formato: anterior.formato,
      sessoes: undefined,
      releituras: undefined,
    })),
    ...(livro.status === "lido" ? [livro] : []),
  ]);
}

export function concluidasNoAno(livros: LivroSalvo[], ano: number) {
  return leiturasConcluidas(livros).filter((l) => l.lidoEm?.startsWith(`${ano}-`));
}

/** A data conhecida precisa caber inteira no período do desafio. */
export function conclusaoNoPeriodo(livro: LivroSalvo, inicio: string, fim: string) {
  const dia = livro.lidoEm?.slice(0, 10);
  if (!dia || livro.status !== "lido") return false;
  const ano = dia.slice(0, 4);
  if (livro.lidoSoAno) return inicio <= `${ano}-01-01` && fim >= `${ano}-12-31`;
  if (livro.lidoSoMes) {
    const mes = dia.slice(0, 7);
    const ultimo = new Date(Date.UTC(Number(ano), Number(mes.slice(5)), 0)).getUTCDate();
    return inicio <= `${mes}-01` && fim >= `${mes}-${ultimo}`;
  }
  return inicio <= dia && dia <= fim;
}
