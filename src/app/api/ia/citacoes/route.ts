import {
  contaValida,
  dentroDoLimite,
  iaConfigurada,
  perguntarComPesquisa,
  textoCurto,
} from "@/lib/ia-servidor";

export const maxDuration = 60;

const SISTEMA = `Você ajuda leitoras a escolher a citação favorita de um livro, num app brasileiro de leitura.
Pesquise na internet citações conhecidas do livro pedido (sites de citações, resenhas, Goodreads, Skoob etc.) e responda SÓ com um objeto JSON, sem mais nada:
{"citacoes": [{"texto": string, "spoiler": boolean}]}
Regras:
- Até 6 citações curtas (no máximo 2 frases cada), as mais conhecidas e queridas pelos leitores.
- Prefira a tradução brasileira; se só achar no original, traduza para o português e mantenha o sentido.
- Só citações que você encontrou atribuídas a esse livro. Nunca invente frases. Se não achar nenhuma, devolva a lista vazia.
- "spoiler": true quando a frase revela algo importante da história.`;

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
      `citacoes:${titulo.toLowerCase()}|${autor.toLowerCase()}`,
      SISTEMA,
      `Livro: "${titulo}"${autor ? `, de ${autor}` : ""}.`,
    )) as { citacoes?: unknown };
    const lista = Array.isArray(r.citacoes) ? r.citacoes : [];
    const citacoes = lista
      .map((c) => ({
        texto: textoCurto((c as { texto?: unknown })?.texto, 400),
        spoiler: !!(c as { spoiler?: unknown })?.spoiler,
      }))
      .filter((c) => c.texto)
      .slice(0, 6);
    return Response.json({ citacoes });
  } catch {
    return Response.json(
      { erro: "não deu para pesquisar agora" },
      { status: 502 },
    );
  }
}
