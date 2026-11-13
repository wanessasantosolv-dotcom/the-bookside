import { sugestoesDeLivros } from "@/lib/dados";
import type { LivroSalvo } from "@/lib/perfil-store";

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function generoDoLivro(l: LivroSalvo) {
  return l.genero ?? sugestoesDeLivros.find((c) => c.id === l.id)?.genero;
}

function paginasDoLivro(l: LivroSalvo) {
  return l.paginas ?? sugestoesDeLivros.find((c) => c.id === l.id)?.paginas;
}

export type Numeros = ReturnType<typeof calcularNumeros>;

/** Tudo o que as telas de números mostram, calculado a partir dos livros lidos no ano. */
export function calcularNumeros(livros: LivroSalvo[], meta: number | null, ano = new Date().getFullYear(), hoje = new Date()) {
  const lidos = livros.filter((l) => l.status === "lido" && l.lidoEm?.startsWith(String(ano)));
  const comPaginas = lidos.map(paginasDoLivro).filter((p): p is number => !!p);
  const paginas = comPaginas.reduce((t, p) => t + p, 0);
  const notas = lidos.map((l) => l.nota).filter((n): n is number => !!n);
  const media = notas.length ? notas.reduce((t, n) => t + n, 0) / notas.length : null;

  const ultimoMes = ano === hoje.getFullYear() ? hoje.getMonth() : 11;
  const porMes = Array.from({ length: ultimoMes + 1 }, (_, m) => ({
    mes: MESES[m],
    livros: lidos.filter((l) => new Date(l.lidoEm!).getMonth() === m).length,
  }));
  const maisForte = porMes.reduce<(typeof porMes)[number] | null>((a, b) => (b.livros > (a?.livros ?? 0) ? b : a), null);

  const contaGenero = new Map<string, number>();
  for (const l of lidos) {
    const g = generoDoLivro(l) ?? "sem gênero";
    contaGenero.set(g, (contaGenero.get(g) ?? 0) + 1);
  }
  const generos = [...contaGenero.entries()].map(([nome, qtd]) => ({ nome, qtd })).sort((a, b) => b.qtd - a.qtd);

  const porAutor = new Map<string, LivroSalvo[]>();
  for (const l of lidos) porAutor.set(l.autor, [...(porAutor.get(l.autor) ?? []), l]);
  const autores = [...porAutor.entries()]
    .map(([nome, ls]) => {
      const ns = ls.map((l) => l.nota).filter((n): n is number => !!n);
      return { nome, qtd: ls.length, media: ns.length ? ns.reduce((t, n) => t + n, 0) / ns.length : null };
    })
    .sort((a, b) => b.qtd - a.qtd || (b.media ?? 0) - (a.media ?? 0))
    .slice(0, 3);

  const livroDoAno = [...lidos].filter((l) => l.nota).sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0) || (b.lidoEm ?? "").localeCompare(a.lidoEm ?? ""))[0];
  const maisLongo = [...lidos].filter(paginasDoLivro).sort((a, b) => (paginasDoLivro(b) ?? 0) - (paginasDoLivro(a) ?? 0))[0];

  // ritmo: quantos livros "deveriam" estar lidos até hoje para bater a meta
  const inicio = new Date(ano, 0, 1).getTime();
  const fracao = ano === hoje.getFullYear() ? (hoje.getTime() - inicio) / (new Date(ano + 1, 0, 1).getTime() - inicio) : 1;
  const esperado = meta ? meta * fracao : 0;
  const ritmo = !meta ? null : lidos.length >= meta ? "meta batida" : lidos.length >= Math.floor(esperado) ? "no ritmo" : "um pouco atrás";
  const semanasRestantes = Math.max(1, Math.round(((1 - fracao) * 365) / 7));
  const faltam = meta ? Math.max(0, meta - lidos.length) : 0;

  return {
    ano,
    lidos,
    total: lidos.length,
    paginas,
    paginasConhecidas: comPaginas.length,
    media,
    paginasPorLivro: comPaginas.length ? Math.round(paginas / comPaginas.length) : null,
    porMes,
    maisForte: maisForte && maisForte.livros > 0 ? maisForte : null,
    generos,
    autores,
    livroDoAno,
    maisLongo,
    maisLongoPaginas: maisLongo ? paginasDoLivro(maisLongo) : undefined,
    meta,
    ritmo,
    faltam,
    porSemana: faltam ? Math.round((faltam / semanasRestantes) * 10) / 10 : 0,
  };
}

export const numero = (n: number) => n.toLocaleString("pt-BR");
export const mediaTexto = (m: number | null) => (m === null ? "—" : `${m.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}★`);
