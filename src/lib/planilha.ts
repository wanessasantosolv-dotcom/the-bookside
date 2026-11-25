/**
 * Ler planilhas no navegador, sem biblioteca: Excel (.xlsx), .csv e .tsv
 * (inclusive o export do Goodreads e do Skoob). Devolve as linhas como
 * texto; `planilhaParaItens` transforma em livros para importar.
 *
 * O .xlsx é um zip com XML dentro: lemos o índice do zip, abrimos as partes
 * com o DecompressionStream do navegador e o XML com o DOMParser.
 */
import { lerData, type ItemImport } from "@/lib/importar";
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

/** número de série do Excel (dias desde 30/12/1899) → AAAA-MM-DD */
function dataDoExcel(n: number) {
  if (!Number.isFinite(n) || n < 1 || n > 80_000) return undefined;
  const d = new Date(Date.UTC(1899, 11, 30) + Math.round(n) * 86_400_000);
  return d.toISOString().slice(0, 10);
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
  titulo: ["titulo", "title", "livro", "nome", "obra", "book"],
  autor: ["autor", "autora", "autoria", "author", "autores", "escritor", "escritora"],
  lidoEm: ["data", "lido em", "terminei", "terminei em", "data de leitura", "date read", "data lido", "data de termino", "fim", "termino", "lido"],
  iniciadoEm: ["comecei", "comecei em", "inicio", "data de inicio", "date started", "iniciado em"],
  nota: ["nota", "my rating", "rating", "estrelas", "avaliacao", "minha nota"],
  paginas: ["paginas", "pages", "number of pages", "n paginas", "num paginas", "qtd paginas"],
  resenha: ["resenha", "my review", "review", "comentario", "o que achei", "opiniao"],
  personagem: ["personagem", "personagem favorita", "personagem favorito"],
  citacao: ["citacao", "trecho", "frase", "quote"],
  reacao: ["veredito", "reacao", "tag", "tags", "gostei"],
  formato: ["formato", "como li", "format", "binding", "midia"],
  estante: ["exclusive shelf", "estante", "status", "situacao"],
};

function acharColunas(cabecalho: string[]) {
  const idx: Partial<Record<keyof typeof colunas, number>> = {};
  cabecalho.forEach((h, i) => {
    const n = sem(h);
    for (const [campo, nomes] of Object.entries(colunas))
      if (idx[campo] === undefined && nomes.includes(n)) idx[campo] = i;
  });
  // o Goodreads tem "Author" e "Author l-f": "author" exato já pegou o certo
  return idx;
}

/** datas escritas de vários jeitos → AAAA-MM-DD */
export function lerDataSolta(v: string | undefined): string | undefined {
  if (!v) return undefined;
  const t = v.trim();
  let m = t.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return lerData(m[3], m[2], m[1]);
  m = t.match(/^(\d{1,2})[-/.](\d{1,2})(?:[-/.](\d{2,4}))?$/);
  if (m) return lerData(m[1], m[2], m[3]);
  if (/^\d{5}(\.\d+)?$/.test(t)) return dataDoExcel(Number(t));
  return undefined;
}

function lerNotaSolta(v: string | undefined) {
  if (!v) return undefined;
  const cheias = (v.match(/★/g) ?? []).length;
  if (cheias) return Math.min(5, cheias + (/½/.test(v) ? 0.5 : 0));
  const n = Number(v.replace(",", ".").replace(/\/\s*5$/, ""));
  if (!Number.isFinite(n) || n <= 0) return undefined;
  // notas de 0 a 10 viram 0 a 5
  const em5 = n > 5 && n <= 10 ? n / 2 : n;
  return em5 <= 5 ? Math.round(em5 * 2) / 2 : undefined;
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
  const idx =
    iCab >= 0
      ? acharColunas(linhas[iCab])
      : { titulo: 0, autor: 1, lidoEm: 2, nota: 3 };
  const corpo = iCab >= 0 ? linhas.slice(iCab + 1) : linhas;
  const de = (l: string[], c: keyof typeof colunas) =>
    idx[c] !== undefined ? l[idx[c]!]?.trim() || undefined : undefined;

  const itens: ItemImport[] = [];
  for (const l of corpo) {
    const titulo = de(l, "titulo");
    if (!titulo || titulo.length < 2) continue;
    // Goodreads/Skoob: só o que foi lido (to-read e "quero ler" ficam de fora)
    const estante = sem(de(l, "estante") ?? "");
    if (/to read|currently reading|quero ler|lendo|desejad/.test(estante)) continue;
    const paginas = Number(de(l, "paginas")?.replace(/\D/g, ""));
    itens.push({
      titulo: titulo.replace(/\s*\(([^)]*#\d+[^)]*)\)\s*$/, "").slice(0, 200),
      autor: de(l, "autor")?.slice(0, 200),
      lidoEm: lerDataSolta(de(l, "lidoEm")),
      iniciadoEm: lerDataSolta(de(l, "iniciadoEm")),
      paginas: paginas > 0 && paginas < 20000 ? paginas : undefined,
      nota: lerNotaSolta(de(l, "nota")),
      resenha: de(l, "resenha")?.replace(/<br\s*\/?>/gi, "\n").slice(0, 4000),
      personagem: de(l, "personagem")?.slice(0, 120),
      citacao: de(l, "citacao")?.slice(0, 1000),
      reacao: lerReacao(de(l, "reacao")),
      formato: lerFormato(de(l, "formato")),
    });
  }
  return itens;
}
