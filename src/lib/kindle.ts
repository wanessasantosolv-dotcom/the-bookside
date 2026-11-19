/**
 * Lê o arquivo de destaques do Kindle ("My Clippings.txt", na pasta "documents"
 * do Kindle quando ligado no computador). Funciona com o Kindle em português e em inglês.
 *
 * Formato de cada marcação:
 *   Título do Livro (Autoria)
 *   - Seu destaque na página 12 | posição 180-182 | Adicionado: sábado, 1 de janeiro de 2022 10:00:00
 *   (linha em branco)
 *   o texto marcado
 *   ==========
 */
export type LivroKindle = {
  titulo: string;
  autor: string;
  trechos: { texto: string; em?: string }[];
};

const MESES: Record<string, number> = {
  janeiro: 0, fevereiro: 1, março: 2, marco: 2, abril: 3, maio: 4, junho: 5,
  julho: 6, agosto: 7, setembro: 8, outubro: 9, novembro: 10, dezembro: 11,
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5, july: 6,
  august: 7, september: 8, october: 9, november: 10, december: 11,
};

/** "sábado, 1 de janeiro de 2022 10:00:00" ou "Saturday, January 1, 2022 10:00:00 AM" → ISO */
function dataDaLinha(linha: string): string | undefined {
  const pt = linha.match(/(\d{1,2}) de ([a-zç]+) de (\d{4})/i);
  if (pt && MESES[pt[2].toLowerCase()] !== undefined)
    return new Date(Number(pt[3]), MESES[pt[2].toLowerCase()], Number(pt[1]), 12).toISOString();
  const en = linha.match(/([A-Za-z]+) (\d{1,2}), (\d{4})/);
  if (en && MESES[en[1].toLowerCase()] !== undefined)
    return new Date(Number(en[3]), MESES[en[1].toLowerCase()], Number(en[2]), 12).toISOString();
  return undefined;
}

export function lerClippings(texto: string): LivroKindle[] {
  const livros = new Map<string, LivroKindle>();
  const blocos = texto.replace(/\r/g, "").replace(/^﻿/, "").split(/^=+\s*$/m);
  for (const bloco of blocos) {
    const linhas = bloco.split("\n").map((l) => l.trim());
    while (linhas.length && !linhas[0]) linhas.shift();
    if (linhas.length < 3) continue;
    const [cabecalho, info, ...resto] = linhas;
    // só destaques e notas (marcadores não têm texto)
    if (!/destaque|highlight|nota|note/i.test(info)) continue;
    const corpo = resto.join("\n").trim();
    if (!corpo) continue;
    const m = cabecalho.replace(/^﻿/, "").match(/^(.*)\(([^()]*)\)\s*$/);
    const titulo = (m ? m[1] : cabecalho).trim();
    // "Weir, Andy" → "Andy Weir"
    const autor = (m ? m[2] : "")
      .trim()
      .replace(/^([^,;]+),\s*([^,;]+)$/, "$2 $1");
    if (!titulo) continue;
    const chave = `${titulo.toLowerCase()}|${autor.toLowerCase()}`;
    const livro = livros.get(chave) ?? { titulo, autor, trechos: [] };
    // o Kindle repete o destaque quando a pessoa aumenta a marcação: fica o mais completo
    const igual = livro.trechos.findIndex(
      (t) => t.texto.includes(corpo) || corpo.includes(t.texto),
    );
    const novo = { texto: corpo, em: dataDaLinha(info) };
    if (igual >= 0) {
      if (corpo.length > livro.trechos[igual].texto.length) livro.trechos[igual] = novo;
    } else livro.trechos.push(novo);
    livros.set(chave, livro);
  }
  return [...livros.values()].sort((a, b) => b.trechos.length - a.trechos.length);
}
