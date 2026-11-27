import { modelosDoGroq } from "@/lib/descoberta-servidor";

/** texto (JSON) do Groq, a IA gratuita de reserva quando o Gemini está sem cota */
export async function groqJson(sistema: string, pergunta: string, temperatura = 0.6): Promise<string | null> {
  const chave = process.env.GROQ_API_KEY;
  if (!chave) return null;
  for (const modelo of [process.env.GROQ_MODEL, ...(await modelosDoGroq(chave))].filter((m, i, a): m is string => !!m && a.indexOf(m) === i)) {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${chave}` },
      body: JSON.stringify({ model: modelo, temperature: temperatura, response_format: { type: "json_object" }, messages: [{ role: "system", content: sistema }, { role: "user", content: pergunta }] }),
      signal: AbortSignal.timeout(25000),
    }).catch(() => null);
    if (!r?.ok) continue;
    const d = (await r.json().catch(() => ({}))) as { choices?: { message?: { content?: string } }[] };
    const t = d.choices?.[0]?.message?.content;
    if (t) return t;
  }
  return null;
}
