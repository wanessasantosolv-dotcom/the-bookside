/*
 * Um PDF mínimo feito de imagens JPEG, uma por página: sem dependências.
 * Cada página tem a largura de um A4 (595 pt) e a altura na proporção da imagem.
 */

export type PaginaJpeg = { dataUrl: string; largura: number; altura: number };

function bytesDoDataUrl(dataUrl: string) {
  const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function pdfDeImagens(paginas: PaginaJpeg[]): Blob {
  const enc = new TextEncoder();
  const partes: Uint8Array[] = [];
  const offsets: number[] = [];
  let tamanho = 0;
  const escrever = (p: Uint8Array | string) => {
    const b = typeof p === "string" ? enc.encode(p) : p;
    partes.push(b);
    tamanho += b.length;
  };
  const objeto = (n: number, corpo: (string | Uint8Array)[]) => {
    offsets[n] = tamanho;
    escrever(`${n} 0 obj\n`);
    corpo.forEach(escrever);
    escrever("\nendobj\n");
  };

  // 1 = catálogo, 2 = páginas, depois 3 objetos por página (página, conteúdo, imagem)
  const idPagina = (i: number) => 3 + i * 3;
  escrever("%PDF-1.4\n%âãÏÓ\n");
  objeto(1, ["<< /Type /Catalog /Pages 2 0 R >>"]);
  objeto(2, [
    `<< /Type /Pages /Count ${paginas.length} /Kids [${paginas.map((_, i) => `${idPagina(i)} 0 R`).join(" ")}] >>`,
  ]);
  paginas.forEach((p, i) => {
    const W = 595.28;
    const H = Math.round(((W * p.altura) / p.largura) * 100) / 100;
    const img = bytesDoDataUrl(p.dataUrl);
    const conteudo = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`;
    objeto(idPagina(i), [
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${idPagina(i) + 2} 0 R >> >> /Contents ${idPagina(i) + 1} 0 R >>`,
    ]);
    objeto(idPagina(i) + 1, [`<< /Length ${conteudo.length} >>\nstream\n${conteudo}\nendstream`]);
    objeto(idPagina(i) + 2, [
      `<< /Type /XObject /Subtype /Image /Width ${p.largura} /Height ${p.altura} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`,
      img,
      "\nendstream",
    ]);
  });

  const total = 3 + paginas.length * 3;
  const inicioXref = tamanho;
  let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
  for (let n = 1; n < total; n++) xref += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  escrever(xref);
  escrever(`trailer\n<< /Size ${total} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`);
  return new Blob(partes as BlobPart[], { type: "application/pdf" });
}
