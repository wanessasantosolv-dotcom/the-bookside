/**
 * Lê uma imagem escolhida pela pessoa e devolve uma versão reduzida (JPEG)
 * em data URL, pequena o bastante para guardar no navegador.
 * Quando o Supabase entrar, o arquivo vai para o Storage no lugar disso.
 */
export async function reduzirImagem(arquivo: File, ladoMaximo: number, qualidade = 0.82): Promise<string> {
  const url = URL.createObjectURL(arquivo);
  try {
    const img = await new Promise<HTMLImageElement>((ok, falha) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => falha(new Error("não foi possível abrir a imagem"));
      i.src = url;
    });
    const escala = Math.min(1, ladoMaximo / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * escala);
    canvas.height = Math.round(img.height * escala);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", qualidade);
  } finally {
    URL.revokeObjectURL(url);
  }
}
