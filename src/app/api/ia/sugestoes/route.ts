import { groqJson } from "@/lib/ia-groq";
/**
 * Indicações por IA (Google Gemini, plano grátis) no "descobrir".
 * A chave fica só na Vercel (GEMINI_API_KEY, sem NEXT_PUBLIC). Vão para o Google
 * só títulos e autorias de livros — nada da pessoa (nem nome, nem e-mail).
 * Só quem tem conta no app pode pedir, com limite por pessoa.
 */
export const maxDuration = 30;

const pedidos = new Map<string, number[]>();
const cache = new Map<string, { em: number; valor: unknown }>();

async function contaValida(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !chave || !token) return false;
  const r = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: chave, Authorization: `Bearer ${token}` },
  }).catch(() => null);
  return !!r?.ok;
}

const texto = (v: unknown, max: number) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

const SISTEMA = `Você é uma livreira brasileira que indica livros.
Recebe livros que a pessoa amou, livros que ela não curtiu e o tipo de leitora dela.
Indique 12 livros que ela provavelmente vai amar e que NÃO estejam nas listas recebidas.
Prefira livros com edição publicada no Brasil, e dê o título como saiu no Brasil.
Misture: alguns parecidos com os que ela ama, alguns de autoras brasileiras ou latino-americanas, e um ou dois "fora da caixa".
Responda SÓ com JSON, sem mais nada:
{"livros":[{"titulo":string,"autor":string,"motivo":string}]}
"motivo": uma frase curta (até 70 caracteres), em minúsculas, dizendo por que combina com ela. Não invente livros.`;

const modelos = () =>
  [
    process.env.GEMINI_MODEL,
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
  ].filter((m, i, a): m is string => !!m && a.indexOf(m) === i);

export async function POST(req: Request) {
  const chave = process.env.GEMINI_API_KEY ?? "";
  if (!chave && !process.env.GROQ_API_KEY) return Response.json({ semIA: true }, { status: 503 });
  if (!(await contaValida(req)))
    return Response.json({ erro: "entre na sua conta" }, { status: 401 });
  const quem = req.headers.get("authorization")?.slice(-24) ?? "anon";
  const agora = Date.now();
  const lista = (pedidos.get(quem) ?? []).filter((t) => agora - t < 36e5);
  if (lista.length >= 6)
    return Response.json(
      { erro: "muitos pedidos, tente daqui a pouco" },
      { status: 429 },
    );
  pedidos.set(quem, [...lista, agora]);

  const corpo = (await req.json().catch(() => ({}))) as {
    amados?: unknown;
    naoCurtiu?: unknown;
    tenho?: unknown;
    tipo?: unknown;
    generos?: unknown;
  };
  const listaDe = (v: unknown, n: number) =>
    (Array.isArray(v) ? v : [])
      .map((x) => texto(x, 120))
      .filter(Boolean)
      .slice(0, n);
  const amados = listaDe(corpo.amados, 15);
  const naoCurtiu = listaDe(corpo.naoCurtiu, 8);
  const tenho = listaDe(corpo.tenho, 60);
  const generos = listaDe(corpo.generos, 6);
  const tipo = texto(corpo.tipo, 60);
  const pergunta = [
    `Amou: ${amados.join("; ") || "(ainda não avaliou)"}`,
    `Não curtiu: ${naoCurtiu.join("; ") || "-"}`,
    `Gêneros que lê: ${generos.join(", ") || "-"}`,
    tipo ? `Tipo de leitora: ${tipo}` : "",
    `Já tem na estante (não indique): ${tenho.join("; ") || "-"}`,
  ]
    .filter(Boolean)
    .join("\n");
  const chaveCache = pergunta;
  const guardado = cache.get(chaveCache);
  if (guardado && agora - guardado.em < 6 * 36e5)
    return Response.json(guardado.valor);

  for (const modelo of chave ? modelos() : []) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": chave,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SISTEMA }] },
          contents: [{ role: "user", parts: [{ text: pergunta }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.9,
          },
        }),
      },
    ).catch(() => null);
    if (!r) continue;
    if (r.status === 429) break; // sem cota no Gemini: tenta o Groq
    if (!r.ok) continue;
    const dados = (await r.json().catch(() => ({}))) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const bruto = (dados.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p.text ?? "")
      .join("");
    try {
      const json = JSON.parse(
        bruto.slice(bruto.indexOf("{"), bruto.lastIndexOf("}") + 1),
      ) as {
        livros?: { titulo?: unknown; autor?: unknown; motivo?: unknown }[];
      };
      const livros = (json.livros ?? [])
        .map((l) => ({
          titulo: texto(l.titulo, 160),
          autor: texto(l.autor, 120),
          motivo: texto(l.motivo, 90),
        }))
        .filter((l) => l.titulo && l.autor)
        .slice(0, 12);
      const valor = { livros };
      cache.set(chaveCache, { em: agora, valor });
      return Response.json(valor);
    } catch {
      continue;
    }
  }
  // reserva gratuita: Groq
  const bruto = await groqJson(SISTEMA, pergunta, 0.9);
  if (bruto) {
    try {
      const json = JSON.parse(bruto.slice(bruto.indexOf("{"), bruto.lastIndexOf("}") + 1)) as { livros?: { titulo?: unknown; autor?: unknown; motivo?: unknown }[] };
      const livros = (json.livros ?? [])
        .map((l) => ({ titulo: texto(l.titulo, 160), autor: texto(l.autor, 120), motivo: texto(l.motivo, 90) }))
        .filter((l) => l.titulo && l.autor)
        .slice(0, 12);
      if (livros.length) {
        const valor = { livros };
        cache.set(chaveCache, { em: agora, valor });
        return Response.json(valor);
      }
    } catch {
      /* sem resposta válida */
    }
  }
  return Response.json({ erro: "a IA não respondeu agora" }, { status: 502 });
}
