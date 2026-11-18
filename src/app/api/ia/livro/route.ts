import {
  SemCota,
  contaValida,
  dentroDoLimite,
  iaConfigurada,
  perguntarComPesquisa,
  textoCurto,
} from "@/lib/ia-servidor";

export const maxDuration = 60;

const generos = [
  "romance",
  "suspense",
  "fantasia",
  "ficção científica",
  "não ficção",
  "poesia",
  "clássico",
  "drama",
  "terror",
  "biografia",
  "infantojuvenil",
  "quadrinhos",
];

const SISTEMA = `Você ajuda a cadastrar livros num app brasileiro de leitura.
Pesquise o livro pedido na internet e responda SÓ com um objeto JSON, sem mais nada:
{"encontrado": boolean, "titulo": string, "autor": string, "sinopse": string, "paginas": number|null, "ano": number|null, "genero": string|null}
Regras:
- "sinopse": escreva com suas palavras, em português do Brasil, 2 a 4 frases, sem spoilers do final. Não copie o texto da editora.
- "titulo" e "autor": como aparecem na edição brasileira, se existir; senão, como no original.
- "paginas" e "ano": da edição brasileira, se souber; senão do original; null se não achar.
- "genero": um destes: ${generos.join(", ")}; ou null.
- Se não tiver certeza de qual livro é, "encontrado": false e o resto vazio. Nunca invente.`;

export async function POST(req: Request) {
  if (!iaConfigurada()) return Response.json({ semIA: true }, { status: 503 });
  if (!(await contaValida(req)))
    return Response.json({ erro: "entre na sua conta" }, { status: 401 });
  if (!dentroDoLimite(req))
    return Response.json(
      { erro: "muitos pedidos, espere um pouco" },
      { status: 429 },
    );
  const corpo = (await req.json().catch(() => ({}))) as {
    titulo?: unknown;
    autor?: unknown;
  };
  const titulo = textoCurto(corpo.titulo, 200);
  const autor = textoCurto(corpo.autor, 200);
  if (titulo.length < 2)
    return Response.json({ erro: "falta o título" }, { status: 400 });
  try {
    const r = (await perguntarComPesquisa(
      `livro:${titulo.toLowerCase()}|${autor.toLowerCase()}`,
      SISTEMA,
      `Livro: "${titulo}"${autor ? `, de ${autor}` : ""}.`,
    )) as Record<string, unknown>;
    if (!r.encontrado) return Response.json({ encontrado: false });
    const num = (v: unknown, max: number) =>
      typeof v === "number" && v > 0 && v < max ? Math.round(v) : undefined;
    return Response.json({
      encontrado: true,
      titulo: textoCurto(r.titulo, 200) || titulo,
      autor: textoCurto(r.autor, 200) || autor,
      sinopse: textoCurto(r.sinopse, 1200),
      paginas: num(r.paginas, 20000),
      ano: num(r.ano, 2100),
      genero:
        typeof r.genero === "string" && generos.includes(r.genero)
          ? r.genero
          : undefined,
    });
  } catch (x) {
    if (x instanceof SemCota)
      return Response.json(
        { erro: "o limite grátis de hoje da IA acabou. tente amanhã." },
        { status: 503 },
      );
    return Response.json(
      { erro: "não deu para pesquisar agora" },
      { status: 502 },
    );
  }
}
