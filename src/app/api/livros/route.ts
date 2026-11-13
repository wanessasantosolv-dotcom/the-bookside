import { NextResponse, type NextRequest } from "next/server";

/**
 * Busca no Google Books pelo servidor, com a chave do projeto.
 * A chave fica só na Vercel (GOOGLE_BOOKS_API_KEY, sem NEXT_PUBLIC) e nunca
 * vai para o navegador. Resultados ficam em cache por 1 dia na Vercel, então
 * a mesma busca volta na hora para todo mundo.
 * Sem chave, responde 503 e o app busca direto do navegador, como antes.
 */
const CAMPOS =
  "items(id,volumeInfo(title,subtitle,authors,publishedDate,pageCount,categories,description,imageLinks/thumbnail,language))";

export async function GET(req: NextRequest) {
  const chave = process.env.GOOGLE_BOOKS_API_KEY;
  if (!chave) return NextResponse.json({ erro: "sem chave" }, { status: 503 });

  const q = req.nextUrl.searchParams.get("q")?.trim().slice(0, 300);
  if (!q) return NextResponse.json({ items: [] });
  const max = Math.min(40, Math.max(1, Number(req.nextUrl.searchParams.get("max")) || 20));

  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set("q", q);
  url.searchParams.set("maxResults", String(max));
  url.searchParams.set("printType", "books");
  url.searchParams.set("fields", CAMPOS);
  url.searchParams.set("key", chave);

  const r = await fetch(url, { next: { revalidate: 86400 } });
  if (!r.ok) return NextResponse.json({ erro: `google ${r.status}` }, { status: r.status === 429 ? 429 : 502 });
  const dados = await r.json();
  return NextResponse.json(dados, {
    headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
  });
}
