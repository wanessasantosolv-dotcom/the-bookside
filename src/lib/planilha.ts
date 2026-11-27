/**
 * Ler planilhas no navegador, sem biblioteca: Excel (.xlsx), .csv e .tsv
 * (inclusive o export do Goodreads e do Skoob). Devolve as linhas como
 * texto; `planilhaParaItens` transforma em livros para importar.
 *
 * O .xlsx é um zip com XML dentro: lemos o índice do zip, abrimos as partes
 * com o DecompressionStream do navegador e o XML com o DOMParser.
 */
import { dataDoExcel, lerArquivo, lerDataSolta, lerLista, ordemDaColuna, type ItemImport, type OrdemData } from "@/lib/importar";
import type { FormatoLivro, Reacao } from "@/lib/perfil-store";

// ───────── zip mínimo ─────────

async function inflar(dados: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined")
    throw new Error("navegador sem suporte a .xlsx");
  const fluxo = new Blob([dados as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(fluxo).arrayBuffer());
}

/** os arquivos de dentro do zip (nome → conteúdo), só os que `queremos` */
async function abrirZip(
  buffer: ArrayBuffer,
  queremos: (nome: string) => boolean,
): Promise<Map<string, string>> {
  const b = new Uint8Array(buffer);
  const v = new DataView(buffer);
  // fim do diretório central: assinatura 0x06054b50, procurando de trás para frente
  let fim = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 66_000); i--)
    if (v.getUint32(i, true) === 0x06054b50) {
      fim = i;
      break;
    }
  if (fim < 0) throw new Error("não é um zip");
  const total = v.getUint16(fim + 10, true);
  let p = v.getUint32(fim + 16, true);
  const texto = new TextDecoder();
  const saida = new Map<string, string>();
  for (let n = 0; n < total; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const metodo = v.getUint16(p + 10, true);
    const comprimido = v.getUint32(p + 20, true);
    const tamNome = v.getUint16(p + 28, true);
    const tamExtra = v.getUint16(p + 30, true);
    const tamComent = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const nome = texto.decode(b.subarray(p + 46, p + 46 + tamNome));
    p += 46 + tamNome + tamExtra + tamComent;
    if (!queremos(nome)) continue;
    const inicio =
      local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
    const bruto = b.subarray(inicio, inicio + comprimido);
    const conteudo =
      metodo === 0 ? bruto : metodo === 8 ? await inflar(bruto) : null;
    if (conteudo) saida.set(nome, texto.decode(conteudo));
  }
  return saida;
}

// ───────── xlsx ─────────

/** "C12" → 2 (índice da coluna, começando em 0) */
function colunaDe(ref: string) {
  const letras = ref.replace(/\d+$/, "");
  let n = 0;
  for (const c of letras) n = n * 26 + (c.charCodeAt(0) - 64);
  return n - 1;
}

/** As linhas da primeira aba de um .xlsx, como texto. */
export async function lerXlsx(buffer: ArrayBuffer): Promise<string[][]> {
  const partes = await abrirZip(
    buffer,
    (n) =>
      n === "xl/sharedStrings.xml" ||
      n === "xl/workbook.xml" ||
      n === "xl/_rels/workbook.xml.rels" ||
      n === "xl/styles.xml" ||
      /^xl\/worksheets\/sheet\d+\.xml$/.test(n),
  );
  const xml = (s: string) => new DOMParser().parseFromString(s, "application/xml");
  const porTag = (d: Document | Element, tag: string) =>
    Array.from(d.getElementsByTagName(tag));

  const textos = partes.get("xl/sharedStrings.xml")
    ? porTag(xml(partes.get("xl/sharedStrings.xml")!), "si").map((si) =>
        porTag(si, "t")
          .map((t) => t.textContent ?? "")
          .join(""),
      )
    : [];

  // a primeira aba (pela ordem do workbook), ou a sheet1
  let caminho = "xl/worksheets/sheet1.xml";
  const wb = partes.get("xl/workbook.xml");
  const rels = partes.get("xl/_rels/workbook.xml.rels");
  if (wb && rels) {
    const primeira = porTag(xml(wb), "sheet")[0];
    const rid =
      primeira?.getAttribute("r:id") ??
      primeira?.getAttributeNS(
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
        "id",
      );
    const alvo = porTag(xml(rels), "Relationship")
      .find((r) => r.getAttribute("Id") === rid)
      ?.getAttribute("Target");
    if (alvo) caminho = `xl/${alvo.replace(/^\/?xl\//, "")}`;
  }
  const aba = partes.get(caminho) ?? [...partes.entries()].find(([n]) => n.startsWith("xl/worksheets/"))?.[1];
  if (!aba) throw new Error("planilha vazia");

  // estilos de data (para saber quando um número é uma data)
  const estilosDeData = new Set<number>();
  const estilos = partes.get("xl/styles.xml");
  if (estilos) {
    const d = xml(estilos);
    const formatosData = new Set([14, 15, 16, 17, 22, 27, 30, 36, 50, 57]);
    for (const f of porTag(d, "numFmt"))
      if (/[dy]/i.test(f.getAttribute("formatCode") ?? "") && !/\[h|\bh/i.test(f.getAttribute("formatCode") ?? ""))
        formatosData.add(Number(f.getAttribute("numFmtId")));
    const xfs = porTag(d, "cellXfs")[0];
    if (xfs)
      porTag(xfs, "xf").forEach((xf, i) => {
        if (formatosData.has(Number(xf.getAttribute("numFmtId"))))
          estilosDeData.add(i);
      });
  }

  const linhas: string[][] = [];
  for (const row of porTag(xml(aba), "row")) {
    const linha: string[] = [];
    for (const c of porTag(row, "c")) {
      const col = colunaDe(c.getAttribute("r") ?? "A1");
      const tipo = c.getAttribute("t");
      const valor = porTag(c, "v")[0]?.textContent ?? "";
      let t = "";
      if (tipo === "s") t = textos[Number(valor)] ?? "";
      else if (tipo === "inlineStr")
        t = porTag(c, "t").map((x) => x.textContent ?? "").join("");
      else if (tipo === "b") t = valor === "1" ? "sim" : "";
      else if (valor && estilosDeData.has(Number(c.getAttribute("s"))))
        t = dataDoExcel(Number(valor)) ?? valor;
      else t = valor;
      linha[col] = t.trim();
    }
    linhas.push(Array.from(linha, (x) => x ?? ""));
  }
  return linhas;
}

// ───────── csv ─────────

/** CSV/TSV com aspas (o separador é adivinhado: vírgula, ponto e vírgula ou tab). */
export function lerCsv(texto: string): string[][] {
  const limpo = texto.replace(/^﻿/, "");
  const primeira = limpo.split(/\r?\n/, 1)[0] ?? "";
  const sep = [";", "\t", ","]
    .map((s) => ({ s, n: primeira.split(s).length }))
    .sort((a, b) => b.n - a.n)[0].s;
  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = "";
  let aspas = false;
  for (let i = 0; i < limpo.length; i++) {
    const ch = limpo[i];
    if (aspas) {
      if (ch === '"' && limpo[i + 1] === '"') {
        campo += '"';
        i++;
      } else if (ch === '"') aspas = false;
      else campo += ch;
    } else if (ch === '"') aspas = true;
    else if (ch === sep) {
      linha.push(campo.trim());
      campo = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && limpo[i + 1] === "\n") i++;
      linha.push(campo.trim());
      linhas.push(linha);
      linha = [];
      campo = "";
    } else campo += ch;
  }
  if (campo || linha.length) {
    linha.push(campo.trim());
    linhas.push(linha);
  }
  return linhas.filter((l) => l.some(Boolean));
}

// ───────── colunas → livros ─────────

const sem = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** nomes de coluna aceitos (em português, inglês, Goodreads e Skoob) */
const colunas: Record<string, string[]> = {
  titulo: ["titulo", "title", "livro", "nome", "obra", "book", "book title", "nome do livro", "titulo do livro", "name"],
  autor: ["autor", "autora", "autoria", "author", "autores", "authors", "escritor", "escritora", "author name", "nome do autor", "creator"],
  lidoEm: ["data", "lido em", "lidoem", "lida em", "read date", "data da leitura", "finished on", "finished at", "date completed", "completed", "terminei", "terminei em", "data de leitura", "date read", "data lido", "data de termino", "fim", "termino", "lido", "last date read", "dates read", "data leitura", "dt leitura", "date finished", "finished", "read at", "data fim", "data de conclusao", "concluido em"],
  iniciadoEm: ["comecei", "comecei em", "iniciadoem", "iniciado", "started on", "started at", "start date", "data de inicio da leitura", "inicio", "data de inicio", "date started", "iniciado em", "started", "data inicio", "dt inicio"],
  nota: ["nota", "my rating", "rating", "estrelas", "avaliacao", "minha nota", "star rating", "stars", "minha avaliacao", "ranking", "score"],
  paginas: ["paginas", "pages", "number of pages", "n paginas", "num paginas", "qtd paginas", "page count", "num pages", "numero de paginas"],
  resenha: ["resenha", "my review", "review", "comentario", "o que achei", "opiniao", "notes", "anotacoes"],
  personagem: ["personagem", "personagem favorita", "personagem favorito"],
  citacao: ["citacao", "trecho", "frase", "quote"],
  reacao: ["veredito", "reacao", "tag", "tags", "gostei"],
  formato: ["formato", "como li", "format", "binding", "midia"],
  estante: ["exclusive shelf", "estante", "status", "situacao", "read status", "shelf", "reading status"],
};

function acharColunas(cabecalho: string[]) {
  const idx: Partial<Record<keyof typeof colunas, number>> = {};
  cabecalho.forEach((h, i) => {
    const n = sem(h);
    for (const [campo, nomes] of Object.entries(colunas))
      if (idx[campo] === undefined && nomes.includes(n)) idx[campo] = i;
  });
  // o Goodreads tem "Author" e "Author l-f": "author" exato já pegou o certo
  // sem nome exato para a data de leitura, aceita um parecido ("data em que terminei", "finished on"…)
  if (idx.lidoEm === undefined) {
    const i = cabecalho.findIndex((h, k) => {
      const n = sem(h);
      return !Object.values(idx).includes(k) && /\b(data|date|termin|lido|lida|read|finish|conclu|fim)\b|termin|conclu/.test(n) && !naoEhLeitura.test(n);
    });
    if (i >= 0) idx.lidoEm = i;
  }
  return idx;
}

/** colunas de data que NÃO são a data de leitura (adicionado, publicado, nascimento…) */
const naoEhLeitura = /inicio|inicia|start|comec|added|adicion|public|lancamento|nasc|criad|creat|edic|modif|updat|atualiz|import|compr|purchas|birth|year|ano|due|prazo/;

/** quantos valores da coluna são datas de verdade */
function taxaDeDatas(corpo: string[][], i: number) {
  const vals = corpo.slice(0, 60).map((l) => l[i]?.trim()).filter(Boolean) as string[];
  if (!vals.length) return { vals: 0, datas: 0 };
  return { vals: vals.length, datas: vals.filter((v) => lerDataSolta(v)).length };
}

/** sem coluna de data reconhecida: usa a coluna em que quase todos os valores são datas (e cujo nome não é de outra data) */
function colunaDeDatas(cabecalho: string[], corpo: string[][], usadas: number[]) {
  if (!corpo.length) return undefined;
  const largura = Math.max(cabecalho.length, ...corpo.slice(0, 60).map((l) => l.length));
  let melhor: { i: number; n: number } | undefined;
  for (let i = 0; i < largura; i++) {
    if (usadas.includes(i) || naoEhLeitura.test(sem(cabecalho[i] ?? ""))) continue;
    const { vals, datas } = taxaDeDatas(corpo, i);
    if (vals < Math.max(1, Math.min(60, corpo.length) * 0.3)) continue;
    if (datas >= vals * 0.7 && (!melhor || datas > melhor.n)) melhor = { i, n: datas };
  }
  return melhor?.i;
}

/** a escala das notas da coluna: 5, 10 ou 100 (uma nota 4 numa coluna de 0 a 10 é 2 estrelas) */
function escalaDaColuna(valores: (string | undefined)[]) {
  let max = 0;
  for (const v of valores) {
    if (!v || /★/.test(v)) continue;
    const m = v.replace(",", ".").match(/^\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+))?\s*$/);
    if (!m) continue;
    if (m[2]) return Number(m[2]);
    max = Math.max(max, Number(m[1]));
  }
  return max > 10 ? 100 : max > 5 ? 10 : 5;
}

function lerNotaSolta(v: string | undefined, escala = 5) {
  if (!v) return undefined;
  const cheias = (v.match(/★/g) ?? []).length;
  if (cheias) return Math.min(5, cheias + (/½/.test(v) ? 0.5 : 0));
  const m = v.replace(",", ".").match(/^\s*(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+))?\s*$/);
  if (!m) return undefined;
  const n = Number(m[1]);
  const base = m[2] ? Number(m[2]) : escala;
  if (!Number.isFinite(n) || n <= 0 || !base || n > base) return undefined;
  const em5 = (n / base) * 5;
  // meia estrela mais próxima (4,25 do storygraph vira 4,5; nunca 0)
  return Math.max(0.5, Math.round(em5 * 2) / 2);
}

// a ordem importa: "não gostei" antes de "gostei"
const reacoesPorNome: [RegExp, Reacao][] = [
  [/abandon|dnf|🍂/, "abandonei"],
  [/nao foi|nao gostei|ruim|☹/, "nao"],
  [/favorit|amei|♥/, "favoritado"],
  [/adorei|✦/, "adorei"],
  [/gostei|bom|☺/, "gostei"],
  [/neutro|\bok\b|mais ou menos|≈/, "neutro"],
];

export function lerReacao(v: string | undefined): Reacao | undefined {
  if (!v) return undefined;
  const n = sem(v) || v;
  return reacoesPorNome.find(([re]) => re.test(n) || re.test(v))?.[1];
}

export function lerFormato(v: string | undefined): FormatoLivro | undefined {
  if (!v) return undefined;
  const n = sem(v);
  if (/audio|audible|ouvi/.test(n)) return "audio";
  if (/kindle|ebook|e book|digital|kobo|tela/.test(n)) return "ebook";
  if (/fisico|papel|brochura|capa|paperback|hardcover|livro/.test(n)) return "fisico";
  return undefined;
}

/**
 * As linhas da planilha viram livros para importar. A primeira linha com
 * "título" (ou "title", "livro"…) é o cabeçalho; sem cabeçalho, a 1ª coluna
 * é o título, a 2ª a autoria e a 3ª a data.
 */
export function planilhaParaItens(linhas: string[][]): ItemImport[] {
  const iCab = linhas.findIndex((l) => {
    const c = acharColunas(l);
    return c.titulo !== undefined;
  });
  const cabecalho = iCab >= 0 ? linhas[iCab] : [];
  const idx =
    iCab >= 0
      ? acharColunas(cabecalho)
      : { titulo: 0, autor: 1, lidoEm: 2, nota: 3 };
  const corpo = iCab >= 0 ? linhas.slice(iCab + 1) : linhas;
  if (iCab >= 0) {
    // a coluna de leitura achada pelo nome precisa ter datas de verdade ("lido: sim" não serve)
    if (idx.lidoEm !== undefined) {
      const { vals, datas } = taxaDeDatas(corpo, idx.lidoEm);
      if (vals && datas < vals * 0.3) idx.lidoEm = undefined;
    }
    if (idx.lidoEm === undefined) {
      const i = colunaDeDatas(cabecalho, corpo, Object.values(idx).filter((x): x is number => x !== undefined));
      if (i !== undefined) idx.lidoEm = i;
    }
  }
  const de = (l: string[], c: keyof typeof colunas) =>
    idx[c] !== undefined ? l[idx[c]!]?.trim() || undefined : undefined;

  // decisões por coluna inteira, não linha a linha: a ordem dia/mês e a escala das notas
  const ingles = cabecalho.some((h) => /\b(date|read|title|rating)\b/.test(sem(h)));
  const padrao: OrdemData = ingles ? "md" : "dm";
  const ordemLido = ordemDaColuna(corpo.map((l) => de(l, "lidoEm")), padrao);
  const ordemInicio = ordemDaColuna(corpo.map((l) => de(l, "iniciadoEm")), ordemLido);
  const escala = escalaDaColuna(corpo.map((l) => de(l, "nota")));

  const itens: ItemImport[] = [];
  for (const l of corpo) {
    const titulo = de(l, "titulo");
    if (!titulo || titulo.length < 2) continue;
    // Goodreads/Skoob: só o que foi lido (to-read e "quero ler" ficam de fora)
    const estante = sem(de(l, "estante") ?? "");
    if (/to read|currently reading|quero ler|lendo|desejad|want to read|wishlist|tbr|reading now/.test(estante)) continue;
    const paginas = Number(de(l, "paginas")?.replace(/\D/g, ""));
    itens.push({
      titulo: titulo.replace(/\s*\(([^)]*#\d+[^)]*)\)\s*$/, "").slice(0, 200),
      autor: de(l, "autor")?.slice(0, 200),
      lidoEm: lerDataSolta(de(l, "lidoEm"), ordemLido),
      iniciadoEm: lerDataSolta(de(l, "iniciadoEm"), ordemInicio),
      paginas: paginas > 0 && paginas < 20000 ? paginas : undefined,
      nota: lerNotaSolta(de(l, "nota"), escala),
      resenha: de(l, "resenha")?.replace(/<br\s*\/?>/gi, "\n").slice(0, 4000),
      personagem: de(l, "personagem")?.slice(0, 120),
      citacao: de(l, "citacao")?.slice(0, 1000),
      reacao: lerReacao(de(l, "reacao")),
      formato: lerFormato(de(l, "formato")),
    });
  }
  return itens;
}

// ───────── qualquer arquivo de texto (json de outros apps, csv sem extensão, lista) ─────────

/** a maior lista de objetos dentro de um json (ex.: {"books": [...]}, {"data": {"items": [...]}}) */
function maiorLista(x: unknown, fundo = 0): Record<string, unknown>[] | null {
  if (fundo > 5 || !x || typeof x !== "object") return null;
  if (Array.isArray(x)) {
    const objs = x.filter((y) => y && typeof y === "object" && !Array.isArray(y)) as Record<string, unknown>[];
    if (objs.length && objs.length >= x.length / 2) return objs;
  }
  let melhor: Record<string, unknown>[] | null = null;
  for (const v of Object.values(x as Record<string, unknown>)) {
    const l = maiorLista(v, fundo + 1);
    if (l && (!melhor || l.length > melhor.length)) melhor = l;
  }
  return melhor;
}

/** achata um objeto: {edicao: {titulo, autor}} → {titulo, autor} (o nome mais próximo ganha) */
function achatar(o: Record<string, unknown>, saida: Record<string, string> = {}, fundo = 0) {
  for (const [k, v] of Object.entries(o)) {
    if (v === null || v === undefined) continue;
    if (Array.isArray(v)) {
      // listas de autores: ["Fulana", "Ciclana"] ou [{name: "Fulana"}]
      const nomes = v.map((y) => (typeof y === "string" ? y : y && typeof y === "object" ? ((y as Record<string, unknown>).name ?? (y as Record<string, unknown>).nome) : null)).filter((y): y is string => typeof y === "string");
      if (nomes.length && !(k in saida)) saida[k] = nomes.join(", ");
    } else if (typeof v === "object") {
      if (fundo < 3) achatar(v as Record<string, unknown>, saida, fundo + 1);
    } else if (!(k in saida) || fundo === 0) saida[k] = String(v);
  }
  return saida;
}

/** json de outros apps (Skoob, StoryGraph, Goodreads convertido…) → linhas de planilha */
function jsonParaLinhas(bruto: unknown): string[][] {
  const lista = maiorLista(bruto);
  if (!lista) return [];
  const planos = lista.map((o) => achatar(o));
  const chaves = [...new Set(planos.flatMap((o) => Object.keys(o)))];
  return [chaves.map((c) => c.replace(/[_-]+/g, " ")), ...planos.map((o) => chaves.map((c) => o[c] ?? ""))];
}

/**
 * Lê qualquer conteúdo de texto: o json do próprio app, json de outros apps,
 * csv/tsv (mesmo sem extensão) ou a lista "um livro por linha".
 */
export function lerTextoQualquer(conteudo: string): ItemImport[] {
  const t = conteudo.replace(/^\uFEFF/, "").trim();
  if (t.startsWith("[") || t.startsWith("{")) {
    let bruto: unknown;
    try {
      bruto = JSON.parse(t);
    } catch {
      bruto = undefined;
    }
    if (bruto !== undefined) {
      let nossos: ItemImport[] = [];
      try {
        nossos = lerArquivo(t);
      } catch {
        nossos = [];
      }
      const genericos = planilhaParaItens(jsonParaLinhas(bruto));
      if (!nossos.length) return genericos;
      // json no nosso formato, mas com datas/notas escritas de outro jeito ou em outros campos:
      // completa o que faltou com a leitura genérica do mesmo livro
      const porTitulo = new Map(genericos.map((g) => [sem(g.titulo), g]));
      return nossos.map((n) => {
        const g = porTitulo.get(sem(n.titulo));
        if (!g) return n;
        return {
          ...n,
          autor: n.autor ?? g.autor,
          // a leitura genérica decide dia/mês olhando a coluna inteira
          lidoEm: g.lidoEm ?? n.lidoEm,
          iniciadoEm: g.iniciadoEm ?? n.iniciadoEm,
          nota: n.nota ?? g.nota,
          paginas: n.paginas ?? g.paginas,
          resenha: n.resenha ?? g.resenha,
        };
      });
    }
  }
  // parece planilha? (cabeçalho com título reconhecido)
  const linhas = lerCsv(t);
  if (linhas.length > 1 && linhas.slice(0, 5).some((l) => l.length > 1 && acharColunas(l).titulo !== undefined)) return planilhaParaItens(linhas);
  return lerLista(t);
}

/** texto do arquivo em UTF-8; se vier com acentos quebrados (csv do excel no windows), tenta latin-1 */
export async function lerComoTexto(f: Blob): Promise<string> {
  const buf = await f.arrayBuffer();
  const utf = new TextDecoder("utf-8").decode(buf);
  if (!utf.includes("\uFFFD")) return utf;
  try {
    return new TextDecoder("windows-1252").decode(buf);
  } catch {
    return utf;
  }
}
