import Anthropic from "@anthropic-ai/sdk";

/**
 * IA do app (só no servidor). A chave ANTHROPIC_API_KEY fica nas variáveis
 * da Vercel e nunca chega ao navegador. Cada pedido pesquisa na internet
 * (web search) e devolve JSON.
 */
const MODELO = "claude-opus-5-5";
const cache = new Map<string, { quando: number; valor: unknown }>();
const UM_DIA = 864e5;

export const iaConfigurada = () => !!process.env.ANTHROPIC_API_KEY;

/** Só quem tem conta no app usa a IA (cada pedido custa): confere o login no Supabase. */
export async function contaValida(req: Request): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!url || !chave || !token) return false;
  try {
    const r = await fetch(`${url}/auth/v1/user`, {
      headers: { apikey: chave, Authorization: `Bearer ${token}` },
    });
    return r.ok;
  } catch {
    return false;
  }
}

/** Limite simples por instância: no máximo 20 pedidos por pessoa a cada 10 minutos. */
const pedidos = new Map<string, number[]>();
export function dentroDoLimite(req: Request) {
  const quem = req.headers.get("authorization")?.slice(-24) ?? "anon";
  const agora = Date.now();
  const lista = (pedidos.get(quem) ?? []).filter((t) => agora - t < 6e5);
  if (lista.length >= 20) return false;
  pedidos.set(quem, [...lista, agora]);
  return true;
}

function extrairJson(texto: string): unknown {
  const i = texto.indexOf("{");
  const j = texto.lastIndexOf("}");
  if (i < 0 || j <= i) throw new Error("resposta sem JSON");
  return JSON.parse(texto.slice(i, j + 1));
}

/** Pergunta com pesquisa na internet e devolve o JSON da resposta final. */
export async function perguntarComPesquisa(
  chaveCache: string,
  sistema: string,
  pergunta: string,
): Promise<unknown> {
  const guardado = cache.get(chaveCache);
  if (guardado && Date.now() - guardado.quando < UM_DIA) return guardado.valor;

  const client = new Anthropic();
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: pergunta },
  ];
  let resposta: Anthropic.Beta.BetaMessage | null = null;
  // pesquisas longas podem pausar (pause_turn): reenviamos para o servidor continuar
  for (let volta = 0; volta < 3; volta++) {
    resposta = await client.beta.messages.create({
      model: MODELO,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low" },
      system: sistema,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 4 }],
      messages,
    });
    if (resposta.stop_reason !== "pause_turn") break;
    messages.splice(1, messages.length - 1, {
      role: "assistant",
      content: resposta.content,
    });
  }
  if (!resposta || resposta.stop_reason === "refusal")
    throw new Error("sem resposta");
  // o texto final vem depois das pesquisas (pode estar em vários blocos, por causa das citações)
  let ultimo = -1;
  resposta.content.forEach((b, k) => {
    if (b.type !== "text") ultimo = k;
  });
  const texto = resposta.content
    .slice(ultimo + 1)
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
  const valor = extrairJson(texto);
  cache.set(chaveCache, { quando: Date.now(), valor });
  return valor;
}

export const textoCurto = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
