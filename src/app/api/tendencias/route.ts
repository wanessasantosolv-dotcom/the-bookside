import { NextResponse, type NextRequest } from "next/server";

/**
 * Os livros mais lidos/em alta no mundo (Open Library: trending do ano ou do mês),
 * com a edição em português de cada um achada no Google Books.
 * Fica em cache por 1 dia na Vercel: a lista é igual para todo mundo.
 * Open Library: https://openlibrary.org/dev/docs/api — gratuita, sem chave.
 */
export const revalidate = 86400;

type DocOL = {
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
};
type VolumeGB = {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    language?: string;
    pageCount?: number;
    publishedDate?: string;
    description?: string;
    imageLinks?: { thumbnail?: string };
  };
};

const sobrenome = (a: string) => a.trim().split(/\s+/).at(-1) ?? a;
const limpar = (t?: string) =>
  t
    ?.replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

async function edicaoEmPortugues(d: DocOL, chave?: string) {
  if (!d.title || !d.author_name?.[0]) return null;
  const url = new URL("https://www.googleapis.com/books/v1/volumes");
  url.searchParams.set(
    "q",
    `inauthor:"${sobrenome(d.author_name[0])}" ${d.title.split(/[:(]/)[0]}`,
  );
  url.searchParams.set("langRestrict", "pt");
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("printType", "books");
  if (chave) url.searchParams.set("key", chave);
  try {
    const r = await fetch(url, { next: { revalidate: 86400 } });
    if (!r.ok) return null;
    const { items = [] } = (await r.json()) as { items?: VolumeGB[] };
    const v = items.find(
      (x) =>
        x.volumeInfo?.language === "pt" &&
        x.volumeInfo.imageLinks?.thumbnail &&
        x.volumeInfo.authors?.some((a) =>
          a.toLowerCase().includes(sobrenome(d.author_name![0]).toLowerCase()),
        ),
    );
    if (!v?.volumeInfo) return null;
    const i = v.volumeInfo;
    return {
      id: `gb-${v.id}`,
      titulo: i.title!,
      autor: (i.authors?.[0] ?? d.author_name[0]).toLowerCase(),
      capa: i
        .imageLinks!.thumbnail!.replace(/^http:/, "https:")
        .replace("&edge=curl", ""),
      paginas: i.pageCount || undefined,
      ano: Number(i.publishedDate?.slice(0, 4)) || d.first_publish_year,
      sinopse: limpar(i.description)?.slice(0, 900),
    };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const periodo =
    req.nextUrl.searchParams.get("periodo") === "mes" ? "monthly" : "yearly";
  try {
    const r = await fetch(
      `https://openlibrary.org/trending/${periodo}.json?limit=60`,
      {
        next: { revalidate: 86400 },
        headers: { "User-Agent": "the-bookside (app de leitura)" },
      },
    );
    if (!r.ok) return NextResponse.json({ livros: [] });
    const { works = [] } = (await r.json()) as { works?: DocOL[] };
    const chave = process.env.GOOGLE_BOOKS_API_KEY;
    // de 6 em 6 para não abrir dezenas de pedidos de uma vez
    const achados = [];
    for (let i = 0; i < Math.min(works.length, 36); i += 6) {
      const lote = await Promise.all(
        works.slice(i, i + 6).map((d) => edicaoEmPortugues(d, chave)),
      );
      achados.push(...lote);
    }
    const vistos = new Set<string>();
    const livros = achados.filter((l): l is NonNullable<typeof l> => {
      if (!l) return false;
      const k = l.titulo.toLowerCase();
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
    return NextResponse.json(
      { livros },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch {
    return NextResponse.json({ livros: [] });
  }
}
