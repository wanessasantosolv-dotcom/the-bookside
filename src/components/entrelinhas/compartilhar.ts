import { CATALOGO, imagemDaCarta, type CartaId } from "@/lib/entrelinhas";

export type FormatoPeca = "stories" | "quadrado" | "vertical";
const TAMANHOS: Record<FormatoPeca, [number, number]> = { stories: [1080, 1920], quadrado: [1080, 1080], vertical: [1080, 1350] };

function carregar(src: string) {
  return new Promise<HTMLImageElement>((ok, erro) => {
    const im = new Image();
    im.onload = () => ok(im);
    im.onerror = erro;
    im.src = src;
  });
}

/** a família real das fontes do app (o next/font dá nomes próprios) */
function familia(classe: string, reserva: string) {
  const el = document.createElement("span");
  el.className = classe;
  el.style.position = "absolute";
  el.style.visibility = "hidden";
  document.body.appendChild(el);
  const f = getComputedStyle(el).fontFamily || reserva;
  el.remove();
  return f;
}

/**
 * A carta como peça colecionável: arte original, nome em português,
 * assinatura e a marca. Nada pessoal (sem nome, @ ou respostas).
 */
export async function gerarPeca(carta: CartaId, formato: FormatoPeca): Promise<Blob> {
  const c = CATALOGO[carta];
  const [W, H] = TAMANHOS[formato];
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  await document.fonts?.ready;
  const revista = familia("font-revista", "Georgia, serif");
  const sans = familia("font-sans", "system-ui, sans-serif");
  const [arte, marca] = await Promise.all([carregar(imagemDaCarta(carta)), carregar("/brand/wordmark-bordo.png")]);

  // papel creme com um fio de moldura
  ctx.fillStyle = "#F6F0E5";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(105,37,54,.28)";
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 36, W - 72, H - 72);

  const alturaCarta = formato === "stories" ? 900 : formato === "vertical" ? 700 : 560;
  const larguraCarta = (alturaCarta * c.arte.w) / c.arte.h;
  const topoTexto = formato === "stories" ? 210 : formato === "vertical" ? 120 : 92;

  ctx.textAlign = "center";
  ctx.fillStyle = "#692536";
  ctx.font = `italic 400 ${formato === "quadrado" ? 40 : 48}px ${revista}`;
  ctx.fillText("nas entrelinhas.", W / 2, topoTexto);
  ctx.fillStyle = "#79686D";
  ctx.font = `600 ${formato === "quadrado" ? 20 : 24}px ${sans}`;
  ctx.fillText("SUA CARTA LITERÁRIA", W / 2, topoTexto + (formato === "quadrado" ? 38 : 50));

  const x = (W - larguraCarta) / 2;
  const y = topoTexto + (formato === "quadrado" ? 64 : 100);
  ctx.save();
  ctx.shadowColor = "rgba(56,37,44,.28)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 18;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(arte, x, y, larguraCarta, alturaCarta);
  ctx.restore();

  // o nome em português na faixa da carta
  const fonteNome = larguraCarta * (c.nome.length > 20 ? 0.036 : 0.042);
  ctx.fillStyle = "#fbe9ef";
  ctx.font = `600 ${fonteNome}px ${sans}`;
  ctx.letterSpacing = `${fonteNome * 0.14}px`;
  ctx.textBaseline = "middle";
  ctx.fillText(`✦  ${c.nome.toUpperCase()}  ✦`, W / 2, y + (alturaCarta * c.arte.faixaCentro) / 100);
  ctx.letterSpacing = "0px";
  ctx.textBaseline = "alphabetic";

  if (formato !== "quadrado") {
    ctx.fillStyle = "#38252C";
    ctx.font = `400 ${formato === "stories" ? 60 : 50}px ${revista}`;
    ctx.fillText(c.nome, W / 2, y + alturaCarta + (formato === "stories" ? 130 : 96));
    ctx.fillStyle = "#692536";
    ctx.font = `italic 400 ${formato === "stories" ? 34 : 30}px ${revista}`;
    ctx.fillText(c.assinatura, W / 2, y + alturaCarta + (formato === "stories" ? 190 : 146), W - 160);
  } else {
    ctx.fillStyle = "#692536";
    ctx.font = `italic 400 28px ${revista}`;
    ctx.fillText(c.assinatura, W / 2, y + alturaCarta + 62, W - 160);
  }

  const lm = formato === "quadrado" ? 150 : 190;
  ctx.drawImage(marca, (W - lm) / 2, H - 72 - (lm * marca.height) / marca.width - 20, lm, (lm * marca.height) / marca.width);

  return new Promise((ok, erro) => cv.toBlob((b) => (b ? ok(b) : erro(new Error("sem imagem"))), "image/png"));
}

/** compartilha pelo celular (quando dá) ou baixa a imagem */
export async function compartilharCarta(carta: CartaId, formato: FormatoPeca): Promise<"compartilhado" | "baixado" | "cancelado"> {
  const blob = await gerarPeca(carta, formato);
  const nome = `nas-entrelinhas-${CATALOGO[carta].slug}-${formato}.png`;
  const arquivo = new File([blob], nome, { type: "image/png" });
  if (navigator.canShare?.({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], title: CATALOGO[carta].nome, text: `${CATALOGO[carta].nome} · nas entrelinhas.` });
      return "compartilhado";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelado";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "baixado";
}
