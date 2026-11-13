import type { LivroBusca } from "@/lib/catalogo";
import type { NotasDetalhe } from "@/lib/perfil-store";

/**
 * Importar livros lidos de uma vez: de uma lista colada (um livro por linha,
 * "título - 14/04 ★★★½") ou de um arquivo .json com fichas completas.
 */
export type ItemImport = {
  titulo: string;
  autor?: string;
  /** AAAA-MM-DD */
  lidoEm?: string;
  iniciadoEm?: string;
  paginas?: number;
  /** 0,5 a 5 */
  nota?: number;
  notas?: Partial<NotasDetalhe>;
  personagem?: string;
  citacao?: string;
  resenha?: string;
};

export function normalizar(t: string) {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(o|a|os|as|the|um|uma)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const dois = (n: number) => String(n).padStart(2, "0");

/** "14/04", "20.05", "21/08/2026" → AAAA-MM-DD (sem ano: o mais recente que não está no futuro). */
export function lerData(d: string, m: string, a?: string): string | undefined {
  const dia = Number(d);
  const mes = Number(m);
  if (!(dia >= 1 && dia <= 31 && mes >= 1 && mes <= 12)) return undefined;
  let ano = a ? Number(a.length === 2 ? `20${a}` : a) : new Date().getFullYear();
  if (!a && new Date(ano, mes - 1, dia) > new Date()) ano -= 1;
  return `${ano}-${dois(mes)}-${dois(dia)}`;
}

/** Estrelas escritas: ★★★½, "3,5", "3.5/5", "nota 4". */
function lerNota(t: string): number | undefined {
  const cheias = (t.match(/★/g) ?? []).length;
  const meia = /½/.test(t);
  if (cheias || meia) return Math.min(5, cheias + (meia ? 0.5 : 0));
  const n =
    t.match(/(?:nota\s*)?\b([0-5](?:[.,]5)?)\s*(?:\/\s*5|estrelas?)\b/i) ?? t.match(/\bnota\s*([0-5](?:[.,]5)?)\b/i);
  return n ? Number(n[1].replace(",", ".")) || undefined : undefined;
}

/** Uma linha por livro. Numeração no começo é ignorada. */
export function lerLista(texto: string): ItemImport[] {
  const itens: ItemImport[] = [];
  for (const bruta of texto.split(/\r?\n/)) {
    let linha = bruta.replace(/^\s*\d{1,3}\s*[.)\-–]\s+/, "").trim();
    if (!linha) continue;
    const nota = lerNota(linha);
    linha = linha.replace(/[★☆½]+/g, " ").replace(/\b[0-5](?:[.,]5)?\s*(?:\/\s*5|estrelas?)\b/gi, " ");
    const data = linha.match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/);
    const lidoEm = data ? lerData(data[1], data[2], data[3]) : undefined;
    if (data) linha = linha.replace(data[0], " ");
    let titulo = linha
      .replace(/\s[-–—|:]\s*$/, "")
      .replace(/\s+[-–—|]\s+/g, " · ")
      .trim();
    let autor: string | undefined;
    // "título · autor" ou "título por autor"
    const partes = titulo
      .split(" · ")
      .map((x) => x.trim())
      .filter(Boolean);
    if (partes.length > 1) {
      titulo = partes[0];
      autor = partes.slice(1).join(" ");
    }
    titulo = titulo.replace(/[-–—·|,]+$/, "").trim();
    if (titulo.length < 2) continue;
    itens.push({ titulo, autor, lidoEm, nota });
  }
  return itens;
}

function texto(v: unknown, max = 4000) {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;
}
function numero(v: unknown, min: number, max: number) {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(",", ".")) : NaN;
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}
function data(v: unknown) {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined;
}

/** Arquivo .json: uma lista de livros com os campos de ItemImport. */
export function lerArquivo(conteudo: string): ItemImport[] {
  const bruto = JSON.parse(conteudo) as unknown;
  const lista = Array.isArray(bruto) ? bruto : (bruto as { livros?: unknown[] })?.livros;
  if (!Array.isArray(lista)) throw new Error("formato");
  return lista
    .map((x): ItemImport | null => {
      const o = x as Record<string, unknown>;
      const titulo = texto(o.titulo, 200);
      if (!titulo) return null;
      const n = (o.notas ?? {}) as Record<string, unknown>;
      const notas = Object.fromEntries(
        (["personagens", "plot", "escrita", "final"] as const)
          .map((c) => [c, numero(n[c], 0.5, 5)])
          .filter(([, v]) => v !== undefined),
      ) as Partial<NotasDetalhe>;
      return {
        titulo,
        autor: texto(o.autor, 200),
        lidoEm: data(o.lidoEm),
        iniciadoEm: data(o.iniciadoEm),
        paginas: numero(o.paginas, 1, 20000),
        nota: numero(o.nota, 0.5, 5),
        notas: Object.keys(notas).length ? notas : undefined,
        personagem: texto(o.personagem, 120),
        citacao: texto(o.citacao, 1000),
        resenha: texto(o.resenha),
      };
    })
    .filter((x) => x !== null);
}

/** O resultado da busca que mais parece o livro pedido. */
export function melhorResultado(item: ItemImport, resultados: LivroBusca[]): LivroBusca | undefined {
  const alvo = normalizar(item.titulo);
  const autor = item.autor ? normalizar(item.autor).split(" ").pop() : undefined;
  const pontos = (l: LivroBusca) => {
    const t = normalizar(l.titulo);
    let p = 0;
    if (t === alvo) p += 10;
    else if (t.startsWith(alvo) || alvo.startsWith(t)) p += 6;
    else if (t.includes(alvo) || alvo.includes(t)) p += 4;
    else {
      const palavras = alvo.split(" ");
      p += (palavras.filter((w) => t.includes(w)).length / palavras.length) * 3;
    }
    if (autor && normalizar(l.autor).includes(autor)) p += 5;
    if (l.capa) p += 1;
    return p;
  };
  return [...resultados].sort((a, b) => pontos(b) - pontos(a))[0];
}
