import { NextResponse, type NextRequest } from "next/server";

/**
 * Capas de livro pelo próprio app: para montar a imagem do story, o navegador
 * só consegue "fotografar" imagens do mesmo endereço do app.
 * Só aceita os sites de capas que o app usa.
 */
const PERMITIDOS = [
  "books.google.com",
  "books.googleusercontent.com",
  "covers.openlibrary.org",
  "archive.org",
];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  let alvo: URL;
  try {
    alvo = new URL(url ?? "");
  } catch {
    return new NextResponse("endereço inválido", { status: 400 });
  }
  if (
    (alvo.protocol !== "https:" && alvo.protocol !== "http:") ||
    !PERMITIDOS.some(
      (h) => alvo.hostname === h || alvo.hostname.endsWith(`.${h}`),
    )
  )
    return new NextResponse("site não permitido", { status: 400 });
  alvo.protocol = "https:";
  try {
    const r = await fetch(alvo, { next: { revalidate: 604800 } });
    const tipo = r.headers.get("content-type") ?? "";
    if (!r.ok || !tipo.startsWith("image/"))
      return new NextResponse("sem imagem", { status: 404 });
    return new NextResponse(await r.arrayBuffer(), {
      headers: {
        "Content-Type": tipo,
        "Cache-Control": "public, max-age=604800, s-maxage=604800",
      },
    });
  } catch {
    return new NextResponse("sem imagem", { status: 502 });
  }
}
