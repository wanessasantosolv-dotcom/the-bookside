import { sugestoesDeLivros } from "@/lib/dados";
import { formatos } from "@/lib/formatos";
import type { LivroSalvo } from "@/lib/perfil-store";

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export function generoDoLivro(l: LivroSalvo) {
  return l.genero ?? sugestoesDeLivros.find((c) => c.id === l.id)?.genero;
}

export function paginasDoLivro(l: LivroSalvo) {
  return l.paginas ?? sugestoesDeLivros.find((c) => c.id === l.id)?.paginas;
}

/** dias entre o começo e o fim da leitura (contando os dois), se as datas existem */
export function diasDeLeitura(l: LivroSalvo): number | null {
  if (!l.iniciadoEm || !l.lidoEm) return null;
  const dia = (iso: string) => {
    const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
    return Date.UTC(a, m - 1, d);
  };
  const dias = Math.round((dia(l.lidoEm) - dia(l.iniciadoEm)) / 864e5) + 1;
  return dias >= 1 ? dias : null;
}

export const textoDias = (d: number) => (d === 1 ? "em 1 dia" : `em ${d} dias`);

export type Numeros = ReturnType<typeof calcularNumeros>;

/** Tudo o que as telas de números mostram, calculado a partir dos livros lidos no ano. */
/** O wrapped pessoal (retrospectiva do ano) só aparece em dezembro. */
/**
 * A retrospectiva do ano abre sozinha no primeiro dia (segunda-feira) da
 * penúltima semana do ano e fica até o fim de janeiro do ano seguinte.
 * (a última semana é a que tem o dia 31 de dezembro)
 */
export function inicioDaRetrospectiva(ano: number) {
  const d31 = new Date(ano, 11, 31);
  const segundaDaUltima = new Date(ano, 11, 31 - ((d31.getDay() + 6) % 7));
  return new Date(ano, 11, segundaDaUltima.getDate() - 7);
}
/** o ano da retrospectiva aberta agora (ou null se ainda não é época) */
export function anoDaRetrospectiva(hoje = new Date()): number | null {
  const ano = hoje.getFullYear();
  if (hoje >= inicioDaRetrospectiva(ano)) return ano;
  if (hoje.getMonth() === 0) return ano - 1;
  return null;
}
export const wrappedLiberado = (hoje = new Date()) => anoDaRetrospectiva(hoje) !== null;

/**
 * O review do mês abre sozinho no penúltimo dia do mês e fica uma semana
 * (até o dia 5 do mês seguinte). Devolve o mês do review aberto agora, ou null.
 */
export function mesDoReview(hoje = new Date()): { ano: number; mes: number } | null {
  const dia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  for (const delta of [0, -1]) {
    const ref = new Date(hoje.getFullYear(), hoje.getMonth() + delta, 1);
    const ultimo = new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
    const inicio = new Date(ref.getFullYear(), ref.getMonth(), ultimo - 1);
    const fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
    if (dia(hoje) >= dia(inicio) && dia(hoje) <= dia(fim))
      return { ano: ref.getFullYear(), mes: ref.getMonth() };
  }
  return null;
}

export function calcularNumeros(
  livros: LivroSalvo[],
  meta: number | null,
  ano = new Date().getFullYear(),
  hoje = new Date(),
) {
  const lidos = livros.filter(
    (l) => l.status === "lido" && l.lidoEm?.startsWith(String(ano)),
  );
  const comPaginas = lidos.map(paginasDoLivro).filter((p): p is number => !!p);
  const paginas = comPaginas.reduce((t, p) => t + p, 0);
  const notas = lidos.map((l) => l.nota).filter((n): n is number => !!n);
  const media = notas.length
    ? notas.reduce((t, n) => t + n, 0) / notas.length
    : null;

  const ultimoMes = ano === hoje.getFullYear() ? hoje.getMonth() : 11;
  const porMes = Array.from({ length: ultimoMes + 1 }, (_, m) => ({
    mes: MESES[m],
    livros: lidos.filter((l) => new Date(l.lidoEm!).getMonth() === m).length,
  }));
  const maisForte = porMes.reduce<(typeof porMes)[number] | null>(
    (a, b) => (b.livros > (a?.livros ?? 0) ? b : a),
    null,
  );

  const contaGenero = new Map<string, number>();
  for (const l of lidos) {
    const g = generoDoLivro(l) ?? "sem gênero";
    contaGenero.set(g, (contaGenero.get(g) ?? 0) + 1);
  }
  const generos = [...contaGenero.entries()]
    .map(([nome, qtd]) => ({ nome, qtd }))
    .sort((a, b) => b.qtd - a.qtd);

  const porAutor = new Map<string, LivroSalvo[]>();
  for (const l of lidos)
    porAutor.set(l.autor, [...(porAutor.get(l.autor) ?? []), l]);
  const autores = [...porAutor.entries()]
    .map(([nome, ls]) => {
      const ns = ls.map((l) => l.nota).filter((n): n is number => !!n);
      return {
        nome,
        qtd: ls.length,
        media: ns.length ? ns.reduce((t, n) => t + n, 0) / ns.length : null,
      };
    })
    .sort((a, b) => b.qtd - a.qtd || (b.media ?? 0) - (a.media ?? 0))
    .slice(0, 3);

  const livroDoAno = [...lidos]
    .filter((l) => l.nota)
    .sort(
      (a, b) =>
        (b.nota ?? 0) - (a.nota ?? 0) ||
        (b.lidoEm ?? "").localeCompare(a.lidoEm ?? ""),
    )[0];
  const maisLongo = [...lidos]
    .filter(paginasDoLivro)
    .sort((a, b) => (paginasDoLivro(b) ?? 0) - (paginasDoLivro(a) ?? 0))[0];

  // os extremos do ano: notas e tempo de leitura (só quando a pessoa preencheu)
  const comNota = lidos.filter((l) => l.nota);
  const porNota = [...comNota].sort(
    (a, b) =>
      (b.nota ?? 0) - (a.nota ?? 0) ||
      (b.lidoEm ?? "").localeCompare(a.lidoEm ?? ""),
  );
  const maisAmados = porNota.slice(0, 3);
  const menosAmados =
    porNota.length >= 2 && porNota.at(-1)!.nota! < porNota[0].nota!
      ? [...porNota]
          .reverse()
          .filter((l) => l.nota! < porNota[0].nota!)
          .slice(0, 3)
      : [];
  const comTempo = lidos
    .map((l) => ({ l, dias: diasDeLeitura(l) }))
    .filter((x): x is { l: LivroSalvo; dias: number } => x.dias !== null)
    .sort((a, b) => a.dias - b.dias);
  const maisRapido = comTempo[0] ?? null;
  const maisDemorado =
    comTempo.length >= 2 && comTempo.at(-1)!.dias > comTempo[0].dias
      ? comTempo.at(-1)!
      : null;

  // mês a mês: o melhor e o pior livro (pela nota), dos meses que tiveram livros com nota
  const mesAMes = MESES.slice(0, ultimoMes + 1)
    .map((mes, m) => {
      const doMes = lidos
        .filter((l) => l.nota && new Date(l.lidoEm!).getMonth() === m)
        .sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0));
      return {
        mes,
        total: lidos.filter((l) => new Date(l.lidoEm!).getMonth() === m).length,
        melhor: doMes[0] ?? null,
        pior:
          doMes.length > 1 && doMes.at(-1)!.nota! < doMes[0].nota!
            ? doMes.at(-1)!
            : null,
      };
    })
    .filter((x) => x.melhor);

  // como a pessoa leu: papel, tela ou ouvidos
  const porFormato = formatos.map((f) => {
    const ls = lidos.filter((l) => l.formato === f.id);
    const ns = ls.map((l) => l.nota).filter((x): x is number => !!x);
    return {
      ...f,
      qtd: ls.length,
      paginas: ls.reduce((t, l) => t + (paginasDoLivro(l) ?? 0), 0),
      media: ns.length ? ns.reduce((t, x) => t + x, 0) / ns.length : null,
    };
  });
  const semFormato = lidos.filter((l) => !l.formato).length;

  // ritmo: quantos livros "deveriam" estar lidos até hoje para bater a meta
  const inicio = new Date(ano, 0, 1).getTime();
  const fracao =
    ano === hoje.getFullYear()
      ? (hoje.getTime() - inicio) / (new Date(ano + 1, 0, 1).getTime() - inicio)
      : 1;
  const esperado = meta ? meta * fracao : 0;
  const ritmo = !meta
    ? null
    : lidos.length >= meta
      ? "meta batida"
      : lidos.length >= Math.floor(esperado)
        ? "no ritmo"
        : "um pouco atrás";
  const semanasRestantes = Math.max(1, Math.round(((1 - fracao) * 365) / 7));
  const faltam = meta ? Math.max(0, meta - lidos.length) : 0;

  return {
    ano,
    lidos,
    total: lidos.length,
    paginas,
    paginasConhecidas: comPaginas.length,
    media,
    paginasPorLivro: comPaginas.length
      ? Math.round(paginas / comPaginas.length)
      : null,
    porMes,
    maisForte: maisForte && maisForte.livros > 0 ? maisForte : null,
    generos,
    autores,
    livroDoAno,
    maisLongo,
    maisAmados,
    porFormato,
    mesAMes,
    semFormato,
    menosAmados,
    maisRapido,
    maisDemorado,
    maisLongoPaginas: maisLongo ? paginasDoLivro(maisLongo) : undefined,
    meta,
    ritmo,
    faltam,
    porSemana: faltam ? Math.round((faltam / semanasRestantes) * 10) / 10 : 0,
  };
}

export const numero = (n: number) => n.toLocaleString("pt-BR");
export const mediaTexto = (m: number | null) =>
  m === null
    ? "—"
    : `${m.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}★`;
