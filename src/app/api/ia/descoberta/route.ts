/**
 * Descoberta contextual (Google Gemini). Recebe a pesquisa já interpretada
 * pelo app (características da taxonomia, restrições, "parecido com") e
 * devolve candidatos: título, autoria, uma justificativa curta e quais
 * características da lista recebida cada livro tem. O app confere cada
 * candidato no catálogo antes de mostrar: nada é exibido sem registro real.
 * Vão para o Google só a pesquisa e títulos de livros — nada da pessoa.
 */
export const maxDuration = 30;

const pedidos = new Map<string, number[]>();
const cache = new Map<string, { em: number; valor: unknown }>();

async function contaValida(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !chave || !token) return false;
  const r = await fetch(`${url}/auth/v1/user`, { headers: { apikey: chave, Authorization: `Bearer ${token}` } }).catch(() => null);
  return !!r?.ok;
}

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const listaDe = (v: unknown, n: number, max = 120) =>
  (Array.isArray(v) ? v : [])
    .map((x) => texto(x, max))
    .filter(Boolean)
    .slice(0, n);

const SISTEMA = `Você é uma livreira brasileira experiente que ajuda leitores a descobrir livros reais.
Recebe uma pesquisa já interpretada: características desejadas (com ids), restrições ("sem"), talvez um livro de referência, e às vezes o contexto de uma lista.
Indique até 14 livros REAIS e conhecidos que combinem com a pesquisa. Nunca invente títulos ou autorias. Na dúvida, não indique.
Prefira obras com edição publicada no Brasil e use o título como saiu no Brasil (senão, o título original).
Regras:
- "origem literária" é a tradição literária da obra (país/língua em que foi escrita), não a ambientação nem só a nacionalidade de quem escreve.
- Restrições "sem" são obrigatórias: não indique livros em que aquilo é central.
- Não deduza gênero de quem escreve a partir do nome.
- Não indique os livros listados em "excluir".
Responda SÓ com JSON:
{"livros":[{"titulo":string,"autor":string,"porque":string,"caracteristicas":[string]}]}
"porque": uma frase (até 110 caracteres) concreta sobre ESTE livro, sem frases genéricas repetidas.
"caracteristicas": só ids da lista recebida que o livro realmente tem (no máximo 3).`;

const modelos = () => [process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-flash-lite-latest"].filter((m, i, a): m is string => !!m && a.indexOf(m) === i);

export async function POST(req: Request) {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) return Response.json({ semIA: true }, { status: 503 });
  if (!(await contaValida(req))) return Response.json({ erro: "entre na sua conta" }, { status: 401 });
  const quem = req.headers.get("authorization")?.slice(-24) ?? "anon";
  const agora = Date.now();
  const recentes = (pedidos.get(quem) ?? []).filter((t) => agora - t < 36e5);
  if (recentes.length >= 30) return Response.json({ erro: "limite" }, { status: 429 });
  pedidos.set(quem, [...recentes, agora]);

  const corpo = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const consulta = texto(corpo.consulta, 200);
  const criterios = listaDe(corpo.criterios, 10, 80);
  const sem = listaDe(corpo.sem, 5, 80);
  const parecido = texto(corpo.parecidoCom, 120);
  const contexto = texto(corpo.contexto, 300);
  const excluir = listaDe(corpo.excluir, 60);
  const ids = listaDe(corpo.ids, 80, 40);
  if (!consulta && !criterios.length && !contexto) return Response.json({ livros: [] });

  const pergunta = [
    consulta ? `Pesquisa: ${consulta}` : "",
    criterios.length ? `Características desejadas: ${criterios.join("; ")}` : "",
    sem.length ? `Sem: ${sem.join("; ")}` : "",
    parecido ? `Parecidos com: ${parecido}` : "",
    contexto ? `Contexto da lista: ${contexto}` : "",
    `Ids de características permitidos: ${ids.join(", ")}`,
    excluir.length ? `Excluir: ${excluir.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  const guardado = cache.get(pergunta);
  if (guardado && agora - guardado.em < 24 * 36e5) return Response.json(guardado.valor);

  for (const modelo of modelos()) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": chave },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SISTEMA }] },
        contents: [{ role: "user", parts: [{ text: pergunta }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      }),
    }).catch(() => null);
    if (!r) continue;
    if (r.status === 429) return Response.json({ semIA: true }, { status: 503 });
    if (!r.ok) continue;
    const dados = (await r.json().catch(() => ({}))) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const bruto = (dados.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    try {
      const json = JSON.parse(bruto.slice(bruto.indexOf("{"), bruto.lastIndexOf("}") + 1)) as { livros?: Record<string, unknown>[] };
      const permitidos = new Set(ids);
      const livros = (json.livros ?? [])
        .map((l) => ({
          titulo: texto(l.titulo, 160),
          autor: texto(l.autor, 120),
          porque: texto(l.porque, 130),
          caracteristicas: listaDe(l.caracteristicas, 3, 40).filter((c) => permitidos.has(c)),
        }))
        .filter((l) => l.titulo && l.autor)
        .slice(0, 14);
      const valor = { livros };
      cache.set(pergunta, { em: agora, valor });
      return Response.json(valor);
    } catch {
      continue;
    }
  }
  return Response.json({ semIA: true }, { status: 503 });
}
