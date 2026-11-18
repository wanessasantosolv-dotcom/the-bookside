import { NextResponse } from "next/server";

/**
 * Dados de uma edição pelo ISBN na BrasilAPI (gratuita), que junta o Mercado
 * Editorial, a CBL, o Open Library e o Google Books — boa para edições
 * brasileiras, com sinopse em português. Cache de 7 dias na Vercel.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ isbn: string }> },
) {
  const isbn = (await params).isbn.replace(/[^0-9Xx]/g, "");
  if (isbn.length !== 10 && isbn.length !== 13)
    return NextResponse.json({ erro: "isbn inválido" }, { status: 400 });
  try {
    const r = await fetch(`https://brasilapi.com.br/api/isbn/v1/${isbn}`, {
      next: { revalidate: 604800 },
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok)
      return NextResponse.json({}, { status: r.status === 404 ? 404 : 502 });
    const d = (await r.json()) as {
      title?: string;
      authors?: string[];
      synopsis?: string | null;
      page_count?: number | null;
      year?: number | null;
      cover_url?: string | null;
    };
    return NextResponse.json(
      {
        titulo: d.title,
        autores: d.authors ?? [],
        sinopse: d.synopsis?.trim() || undefined,
        paginas: d.page_count || undefined,
        ano: d.year || undefined,
        capa: d.cover_url || undefined,
      },
      { headers: { "Cache-Control": "public, s-maxage=604800" } },
    );
  } catch {
    return NextResponse.json({}, { status: 502 });
  }
}
