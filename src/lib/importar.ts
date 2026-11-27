import { buscarLivros, buscarPorAutoria, traducoesDoTitulo, type LivroBusca } from "@/lib/catalogo";
import type { FormatoLivro, NotasDetalhe, Reacao } from "@/lib/perfil-store";

/**
 * Importar livros lidos de uma vez: de uma lista colada (um livro por linha,
 * "título - 14/04 ★★★½") ou de um arquivo .json com fichas completas.
 */
export type ItemImport = {
  titulo: string;
  autor?: string;
  /** AAAA-MM-DD */
  lidoEm?: string;
  /** só o ano da leitura (sem dia e mês) */
  lidoAno?: number;
  iniciadoEm?: string;
  paginas?: number;
  /** 0,5 a 5 */
  nota?: number;
  notas?: Partial<NotasDetalhe>;
  personagem?: string;
  citacao?: string;
  resenha?: string;
  /** o veredito: favoritado, adorei, gostei… */
  reacao?: Reacao;
  formato?: FormatoLivro;
  /** clube: número da leitura */
  rodada?: number;
  /** clube: as fichas de cada pessoa (da revista do clube) */
  fichas?: FichaImport[];
};

export type FichaImport = {
  pessoa: string;
  nota?: number;
  notas?: Partial<NotasDetalhe>;
  personagem?: string;
  citacao?: string;
  resenha?: string;
  iniciadoEm?: string;
  lidoEm?: string;
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
  let ano: number;
  if (!a) {
    ano = new Date().getFullYear();
    if (new Date(ano, mes - 1, dia) > new Date()) ano -= 1;
  } else if (a.length === 2) {
    // "98" é 1998; "24" é 2024 (o que passar do ano que vem vira século passado)
    const yy = Number(a);
    ano = 2000 + yy > new Date().getFullYear() + 1 ? 1900 + yy : 2000 + yy;
  } else ano = Number(a);
  if (!(ano >= 1000 && ano <= 2200)) return undefined;
  // 31/02 não existe: recusa em vez de inventar outro dia
  const teste = new Date(Date.UTC(ano, mes - 1, dia));
  if (teste.getUTCMonth() !== mes - 1) return undefined;
  return `${ano}-${dois(mes)}-${dois(dia)}`;
}

/** número de série do Excel (dias desde 30/12/1899) → AAAA-MM-DD */
export function dataDoExcel(n: number) {
  if (!Number.isFinite(n) || n < 1 || n > 80_000) return undefined;
  const d = new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86_400_000);
  return d.toISOString().slice(0, 10);
}

const semAcento = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const MESES_NOME: Record<string, number> = {
  jan: 1, janeiro: 1, january: 1, fev: 2, fevereiro: 2, feb: 2, february: 2, mar: 3, marco: 3, march: 3,
  abr: 4, abril: 4, apr: 4, april: 4, mai: 5, maio: 5, may: 5, jun: 6, junho: 6, june: 6, jul: 7, julho: 7, july: 7,
  ago: 8, agosto: 8, aug: 8, august: 8, set: 9, setembro: 9, sep: 9, sept: 9, september: 9, out: 10, outubro: 10, oct: 10, october: 10,
  nov: 11, novembro: 11, november: 11, dez: 12, dezembro: 12, dec: 12, december: 12,
};
const DIAS_SEMANA = /^(seg|ter|qua|qui|sex|sab|dom|mon|tue|wed|thu|fri|sat|sun)[a-z]*\s+/;

/** dia/mês ("dm") ou mês/dia ("md") para datas tipo 05/03/2024 */
export type OrdemData = "dm" | "md";

/**
 * Datas escritas de vários jeitos → AAAA-MM-DD, sempre o dia escrito no
 * arquivo (sem converter fuso). Só aceita o que é claramente uma data:
 * um ano sozinho ("2016"), um número solto ou "sim" não viram 1º de janeiro.
 */
export function lerDataSolta(v: string | number | undefined | null, ordem: OrdemData = "dm"): string | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "number") return dataDeNumero(v);
  const bruto = v.trim();
  if (!bruto) return undefined;
  // "2024/03/01-2024/03/20" ou "2023/01/02, 2024/03/04" (storygraph): fica com a última data
  const iso = bruto.match(/\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/g);
  if (iso && iso.length > 1) return lerDataSolta(iso[iso.length - 1], ordem);
  const partes = bruto.split(/\s+[-–]\s+|\s*,\s*(?=\d{1,2}[-/.]\d{1,2}[-/.]\d)/);
  const t = partes[partes.length - 1]
    .trim()
    .replace(/^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2})[T\s].*$/, "$1")
    .replace(/^(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})[T\s,]+\d{1,2}:\d{2}.*$/, "$1");
  let m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) return lerData(m[3], m[2], m[1]);
  m = t.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) return lerData(m[3], m[2], m[1]);
  m = t.match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2}|\d{4}))?$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    // quando um dos números passa de 12 não há dúvida; senão vale a ordem da coluna
    if (b > 12 && a <= 12) return lerData(m[2], m[1], m[3]);
    if (a > 12) return lerData(m[1], m[2], m[3]);
    return ordem === "md" ? lerData(m[2], m[1], m[3]) : lerData(m[1], m[2], m[3]);
  }
  if (/^\d+(\.\d+)?$/.test(t)) return dataDeNumero(Number(t));
  // "14 de maio de 2024", "14 mai 2024", "May 14, 2024", "maio de 2024", "Tue May 14 2024"
  const n = semAcento(t).replace(DIAS_SEMANA, "").replace(/\b(\d{1,2})(st|nd|rd|th|o)\b/g, "$1");
  m = n.match(/^(\d{1,2}) (?:de )?([a-z]+)\.?(?: (?:de )?(\d{4}))?$/);
  if (m && MESES_NOME[m[2]]) return lerData(m[1], String(MESES_NOME[m[2]]), m[3]);
  m = n.match(/^([a-z]+) (\d{1,2})(?: (\d{4}))?(?: \d{1,2} \d{2}.*)?$/);
  if (m && MESES_NOME[m[1]]) return lerData(m[2], String(MESES_NOME[m[1]]), m[3]);
  m = n.match(/^([a-z]+) (?:de )?(\d{4})$/);
  if (m && MESES_NOME[m[1]]) return lerData("1", String(MESES_NOME[m[1]]), m[2]);
  return undefined;
}

/** número: série do Excel (5 dígitos) ou timestamp em segundos/milissegundos */
function dataDeNumero(n: number) {
  if (!Number.isFinite(n)) return undefined;
  if (n >= 10_000 && n <= 80_000) return dataDoExcel(n);
  const ms = n > 1e11 && n < 1e14 ? n : n > 1e8 && n < 1e11 ? n * 1000 : NaN;
  if (Number.isNaN(ms)) return undefined;
  return new Date(ms).toISOString().slice(0, 10);
}

/** "2016" sozinho: o ano da leitura, sem dia nem mês */
export function lerAnoSolto(v: string | number | undefined | null): number | undefined {
  const t = typeof v === "number" ? String(v) : v?.trim();
  if (!t || !/^\d{4}$/.test(t)) return undefined;
  const ano = Number(t);
  return ano >= 1900 && ano <= new Date().getFullYear() ? ano : undefined;
}

/** a ordem das datas de uma coluna inteira (05/03 é 5 de março ou 3 de maio?) */
export function ordemDaColuna(valores: (string | undefined)[], padrao: OrdemData = "dm"): OrdemData {
  let dm = 0;
  let md = 0;
  for (const v of valores) {
    const m = v?.trim().match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.]\d{2,4})?(?:[T\s,].*)?$/);
    if (!m) continue;
    if (Number(m[1]) > 12) dm++;
    else if (Number(m[2]) > 12) md++;
  }
  if (dm || md) return md > dm ? "md" : "dm";
  return padrao;
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
  return typeof v === "string" || typeof v === "number" ? lerDataSolta(v) : undefined;
}

const reacoesValidas: Reacao[] = ["favoritado", "adorei", "gostei", "neutro", "nao", "abandonei"];
const formatosValidos: FormatoLivro[] = ["fisico", "ebook", "audio"];

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
      const lerNotas = (bruto: unknown) => {
        const n = (bruto ?? {}) as Record<string, unknown>;
        const r = Object.fromEntries(
          (["personagens", "plot", "escrita", "final"] as const)
            .map((c) => [c, numero(n[c], 0.5, 5)])
            .filter(([, v]) => v !== undefined),
        ) as Partial<NotasDetalhe>;
        return Object.keys(r).length ? r : undefined;
      };
      const notas = lerNotas(o.notas) ?? {};
      const fichas = Array.isArray(o.fichas)
        ? (o.fichas as Record<string, unknown>[])
            .map((f): FichaImport | null => {
              const pessoa = texto(f?.pessoa, 60);
              if (!pessoa) return null;
              return {
                pessoa,
                nota: numero(f.nota, 0.5, 5),
                notas: lerNotas(f.notas),
                personagem: texto(f.personagem, 120),
                citacao: texto(f.citacao, 1000),
                resenha: texto(f.resenha),
                iniciadoEm: data(f.iniciadoEm),
                lidoEm: data(f.lidoEm),
              };
            })
            .filter((f): f is FichaImport => f !== null)
        : undefined;
      return {
        titulo,
        autor: texto(o.autor, 200),
        lidoEm: data(o.lidoEm),
        lidoAno: data(o.lidoEm) ? undefined : (numero(o.lidoAno, 1900, 2200) ?? lerAnoSolto(o.lidoEm as string | number | undefined)),
        iniciadoEm: data(o.iniciadoEm),
        paginas: numero(o.paginas, 1, 20000),
        nota: numero(o.nota, 0.5, 5),
        notas: Object.keys(notas).length ? notas : undefined,
        personagem: texto(o.personagem, 120),
        citacao: texto(o.citacao, 1000),
        resenha: texto(o.resenha),
        reacao: reacoesValidas.includes(o.reacao as Reacao)
          ? (o.reacao as Reacao)
          : undefined,
        formato: formatosValidos.includes(o.formato as FormatoLivro)
          ? (o.formato as FormatoLivro)
          : undefined,
        rodada: numero(o.rodada, 1, 999),
        fichas: fichas?.length ? fichas : undefined,
      };
    })
    .filter((x) => x !== null);
}

/** Quanto um resultado parece o livro pedido (título e autoria; aceita títulos traduzidos). */
export function pontuar(item: ItemImport, l: LivroBusca, outrosTitulos: string[] = [], outraAutoria?: string) {
  const t = normalizar(l.titulo);
  let melhor = 0;
  for (const titulo of [item.titulo, ...outrosTitulos]) {
    const alvo = normalizar(titulo);
    if (!alvo) continue;
    let p = 0;
    if (t === alvo) p = 10;
    else if (t.startsWith(alvo) || alvo.startsWith(t)) p = 7;
    else if (t.includes(alvo) || alvo.includes(t)) p = 5;
    else {
      const palavras = alvo.split(" ").filter((w) => w.length > 2);
      p = palavras.length ? (palavras.filter((w) => t.includes(w)).length / palavras.length) * 4 : 0;
    }
    melhor = Math.max(melhor, p);
  }
  const autorias = [item.autor, outraAutoria].filter((a): a is string => !!a).map((a) => normalizar(a).split(" ").pop()!);
  if (autorias.some((a) => a && normalizar(l.autor).includes(a))) melhor += 5;
  if (l.capa) melhor += 0.5;
  return melhor;
}

const pausa = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

/** Faz a busca de novo uma vez se ela falhar (muitos pedidos seguidos). */
async function comNovaTentativa<T>(fazer: () => Promise<T>, vazio: T): Promise<T> {
  for (let vez = 0; vez < 2; vez++) {
    try {
      return await fazer();
    } catch {
      await pausa(1500);
    }
  }
  return vazio;
}

/**
 * Busca esperta para achar um livro específico:
 * 1. título + autoria; 2. só o título; 3. todos os livros da autoria;
 * 4. o título traduzido/original pelo Wikidata (ex.: em inglês).
 * Junta tudo e ordena pelo que mais parece o livro pedido.
 */
export async function acharLivro(item: ItemImport): Promise<LivroBusca[]> {
  const achados = new Map<string, LivroBusca>();
  const juntar = (ls: LivroBusca[]) => ls.forEach((l) => !achados.has(l.id) && achados.set(l.id, l));
  const outros: string[] = [];
  let outraAutoria: string | undefined;
  const melhorNota = () => Math.max(0, ...[...achados.values()].map((l) => pontuar(item, l, outros, outraAutoria)));
  const bomBastante = () => melhorNota() >= (item.autor ? 15 : 10);

  juntar(await comNovaTentativa(() => buscarLivros(`${item.titulo} ${item.autor ?? ""}`.trim()), []));
  if (!bomBastante() && item.autor) juntar(await comNovaTentativa(() => buscarPorAutoria(item.autor!), []));
  if (!bomBastante()) juntar(await comNovaTentativa(() => buscarLivros(item.titulo), []));
  if (!bomBastante()) {
    const traducoes = await comNovaTentativa(() => traducoesDoTitulo(item.titulo), []);
    for (const t of traducoes.slice(0, 2)) {
      outros.push(t.titulo);
      outraAutoria ??= t.autor;
      juntar(await comNovaTentativa(() => buscarLivros(`${t.titulo} ${t.autor ?? item.autor ?? ""}`.trim()), []));
      if (bomBastante()) break;
    }
  }
  return [...achados.values()]
    .map((l) => ({ l, p: pontuar(item, l, outros, outraAutoria) }))
    .filter((x) => x.p > 1)
    .sort((a, b) => b.p - a.p)
    .slice(0, 8)
    .map((x) => x.l);
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
