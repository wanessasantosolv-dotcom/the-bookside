/**
 * Saúde da descoberta (sem dados de ninguém): diz se as chaves existem e como
 * o Gemini (com e sem busca do Google) e o Google Books estão respondendo.
 * Só códigos de status e mensagens de erro curtas. Resultado guardado por 1 min.
 */
export const maxDuration = 60;
let guardado: { em: number; valor: unknown } | null = null;

async function gemini(modelo: string, comBusca: boolean) {
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) return { ok: false, motivo: "sem GEMINI_API_KEY" };
  const t = Date.now();
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": chave },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Cite 3 romances de autores coreanos publicados no Brasil, só os títulos." }] }], ...(comBusca ? { tools: [{ google_search: {} }] } : {}) }),
    signal: AbortSignal.timeout(25000),
  }).catch((e: Error) => ({ ok: false, status: 0, text: async () => e.message }) as unknown as Response);
  const corpo = await r.text().catch(() => "");
  let paginas = 0;
  let texto = "";
  try {
    const j = JSON.parse(corpo);
    paginas = j.candidates?.[0]?.groundingMetadata?.groundingChunks?.length ?? 0;
    texto = (j.candidates?.[0]?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? "").join("").slice(0, 160);
  } catch {
    /* sem json */
  }
  return { ok: r.ok, status: r.status, ms: Date.now() - t, paginas, amostra: r.ok ? texto : corpo.slice(0, 220) };
}

export async function GET() {
  if (guardado && Date.now() - guardado.em < 60000) return Response.json(guardado.valor);
  const livros = await (async () => {
    const u = new URL("https://www.googleapis.com/books/v1/volumes");
    u.searchParams.set("q", 'intitle:"a vegetariana" inauthor:"kang"');
    u.searchParams.set("langRestrict", "pt");
    if (process.env.GOOGLE_BOOKS_API_KEY) u.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
    const r = await fetch(u, { cache: "no-store" }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    return { ok: !!r?.ok, status: r?.status ?? 0, chave: !!process.env.GOOGLE_BOOKS_API_KEY, itens: (j as { items?: unknown[] }).items?.length ?? 0, erro: (j as { error?: { message?: string } }).error?.message?.slice(0, 160) };
  })();
  const modelo = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const [comBusca, semBusca] = await Promise.all([gemini(modelo, true), gemini(modelo, false)]);
  const valor = { modelo, geminiComBusca: comBusca, geminiSemBusca: semBusca, googleBooks: livros };
  guardado = { em: Date.now(), valor };
  return Response.json(valor);
}
