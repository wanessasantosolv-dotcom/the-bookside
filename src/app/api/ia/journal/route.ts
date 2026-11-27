import { groqJson } from "@/lib/ia-groq";
/**
 * Textos editoriais do The Bookside Journal (Google Gemini, como nas indicações).
 * Recebe só números e nomes já calculados pelo app (livros, páginas, gêneros,
 * autorias, ritmo) — nada de resenhas, trechos ou dados da pessoa — e devolve
 * cinco textos curtos. A IA não calcula nada: só escreve a partir dos dados.
 * Sem chave ou com erro, o app usa os textos por regras.
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

const SISTEMA = `Você é editora de uma revista literária brasileira chamada The Bookside Journal.
Recebe, em JSON, os dados já calculados do mês de leitura de uma leitora.
Escreva em português do Brasil, com linguagem de revista: curta, elegante, específica e concreta.
Regras:
- Use SOMENTE os dados recebidos. Não invente livros, números, temas, sentimentos ou opiniões.
- Não calcule nada novo: use os números exatamente como vieram (pode escrevê-los por extenso).
- Não atribua emoções, traços psicológicos ou experiências pessoais à leitora.
- Nada de frases motivacionais, clichês, exclamações ou emojis.
- Campos com dados ausentes (null) devem ser ignorados; se não houver base para um texto, devolva "".
Responda SÓ com JSON:
{"titulo":string,"introducao":string,"ritmo":string,"tendencias":string,"encerramento":string}
- "titulo": título do mood do mês, até 45 caracteres, terminando em ponto (ex.: "Um mês de outros mundos.").
- "introducao": 1 a 2 frases (até 240 caracteres) resumindo o mês.
- "ritmo": 1 frase (até 160 caracteres) sobre os dias de leitura, só se houver diasDeLeitura.
- "tendencias": 1 frase (até 160 caracteres) sobre os gêneros e autorias.
- "encerramento": 1 a 2 frases (até 220 caracteres) que fecham a edição.`;

const modelos = () =>
  [process.env.GEMINI_MODEL, "gemini-flash-latest", "gemini-flash-lite-latest"].filter(
    (m, i, a): m is string => !!m && a.indexOf(m) === i,
  );

export async function POST(req: Request) {
  const chave = process.env.GEMINI_API_KEY ?? "";
  if (!chave && !process.env.GROQ_API_KEY) return Response.json({ semIA: true }, { status: 503 });
  if (!(await contaValida(req)))
    return Response.json({ erro: "entre na sua conta" }, { status: 401 });
  const quem = req.headers.get("authorization")?.slice(-24) ?? "anon";
  const agora = Date.now();
  const lista = (pedidos.get(quem) ?? []).filter((t) => agora - t < 36e5);
  if (lista.length >= 12)
    return Response.json({ erro: "muitos pedidos" }, { status: 429 });
  pedidos.set(quem, [...lista, agora]);

  const corpo = (await req.json().catch(() => ({}))) as { dados?: unknown };
  const dados = JSON.stringify(corpo.dados ?? {}).slice(0, 4000);
  const guardado = cache.get(dados);
  if (guardado && agora - guardado.em < 24 * 36e5) return Response.json(guardado.valor);

  for (const modelo of chave ? modelos() : []) {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": chave },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SISTEMA }] },
          contents: [{ role: "user", parts: [{ text: dados }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.6 },
        }),
      },
    ).catch(() => null);
    if (!r) continue;
    if (r.status === 429) break; // sem cota no Gemini: tenta o Groq
    if (!r.ok) continue;
    const resposta = (await r.json().catch(() => ({}))) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const bruto = (resposta.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    try {
      const j = JSON.parse(bruto.slice(bruto.indexOf("{"), bruto.lastIndexOf("}") + 1)) as Record<string, unknown>;
      const valor = {
        titulo: texto(j.titulo, 60),
        introducao: texto(j.introducao, 300),
        ritmo: texto(j.ritmo, 200),
        tendencias: texto(j.tendencias, 200),
        encerramento: texto(j.encerramento, 280),
      };
      if (!valor.titulo || !valor.introducao || !valor.encerramento) continue;
      cache.set(dados, { em: agora, valor });
      return Response.json(valor);
    } catch {
      continue;
    }
  }
  // reserva gratuita: Groq
  const bruto = await groqJson(SISTEMA, dados, 0.6);
  if (bruto) {
    try {
      const j = JSON.parse(bruto.slice(bruto.indexOf("{"), bruto.lastIndexOf("}") + 1)) as Record<string, unknown>;
      const valor = { titulo: texto(j.titulo, 60), introducao: texto(j.introducao, 300), ritmo: texto(j.ritmo, 200), tendencias: texto(j.tendencias, 200), encerramento: texto(j.encerramento, 280) };
      if (valor.titulo && valor.introducao && valor.encerramento) {
        cache.set(dados, { em: agora, valor });
        return Response.json(valor);
      }
    } catch {
      /* sem resposta válida */
    }
  }
  return Response.json({ erro: "a IA não respondeu" }, { status: 502 });
}
