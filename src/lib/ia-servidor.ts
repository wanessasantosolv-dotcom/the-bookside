import Anthropic from "@anthropic-ai/sdk";

/**
 * IA do app (só no servidor). As chaves ficam nas variáveis da Vercel e nunca
 * chegam ao navegador. Cada pedido pesquisa na internet e devolve JSON.
 *
 * Duas opções (a primeira que tiver chave é usada):
 * - GEMINI_API_KEY: Google Gemini, com cota grátis diária (pesquisa no Google).
 *   No plano grátis o Google pode usar o que é enviado para melhorar os produtos
 *   dele — aqui só vão título e autoria do livro, nada da pessoa.
 * - ANTHROPIC_API_KEY: Claude (pago por uso).
 */
const MODELO = "claude-opus-5-5";
const cache = new Map<string, { quando: number; valor: unknown }>();
const UM_DIA = 864e5;

export const iaConfigurada = () =>
  !!(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY);

/** a cota grátis do dia acabou (Gemini) ou a conta está sem crédito */
export class SemCota extends Error {}

/** Só quem tem conta no app usa a IA (cada pedido custa): confere o login no Supabase. */
export async function contaValida(req: Request): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // aceita os dois nomes que o Supabase usa para a chave pública (igual a src/lib/supabase.ts)
  const chave =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
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

  const texto = process.env.GEMINI_API_KEY
    ? await comGemini(sistema, pergunta)
    : await comClaude(sistema, pergunta);
  const valor = extrairJson(texto);
  cache.set(chaveCache, { quando: Date.now(), valor });
  return valor;
}

/**
 * Modelos do Gemini tentados em ordem (GEMINI_MODEL na Vercel entra primeiro).
 * O Google aposenta nomes antigos de tempos em tempos: os "-latest" seguem sempre o atual.
 */
const modelosGemini = () =>
  [
    process.env.GEMINI_MODEL,
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
  ].filter((m, i, a): m is string => !!m && a.indexOf(m) === i);

/**
 * O que não funcionou recentemente (sem cota, aposentado, sem pesquisa no plano):
 * pula por 1 hora, para responder mais rápido e não gastar a cota à toa.
 */
const bloqueado = new Map<string, number>();
const chaveBloqueio = (modelo: string, pesquisa: boolean) =>
  `${modelo}|${pesquisa}`;
const estaBloqueado = (modelo: string, pesquisa: boolean) =>
  (bloqueado.get(chaveBloqueio(modelo, pesquisa)) ?? 0) > Date.now();

type TentativaGemini = {
  modelo: string;
  pesquisa: boolean;
  status: number;
  mensagem?: string;
  texto?: string;
};

/** Um pedido ao Gemini; devolve o status e a mensagem de erro do Google (sem a chave). */
async function pedirAoGemini(
  modelo: string,
  sistema: string,
  pergunta: string,
  pesquisa: boolean,
): Promise<TentativaGemini> {
  const r = await fetch(
    `${process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com"}/v1beta/models/${modelo}:generateContent`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY!,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: sistema }] },
        contents: [{ role: "user", parts: [{ text: pergunta }] }],
        // pesquisa no Google (grounding)
        ...(pesquisa ? { tools: [{ google_search: {} }] } : {}),
      }),
    },
  ).catch(() => null);
  if (!r) return { modelo, pesquisa, status: 0, mensagem: "sem conexão" };
  const dados = (await r.json().catch(() => ({}))) as {
    error?: { message?: string };
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  if (!r.ok)
    return {
      modelo,
      pesquisa,
      status: r.status,
      mensagem: dados.error?.message?.slice(0, 300),
    };
  const texto = (dados.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("");
  return {
    modelo,
    pesquisa,
    status: r.status,
    texto,
    mensagem: texto ? undefined : "resposta vazia",
  };
}

/**
 * Tenta os modelos em ordem, primeiro com pesquisa no Google. Se a pesquisa não
 * tiver cota grátis em nenhum, tenta sem pesquisa (o modelo responde com o que sabe).
 */
/** quando o plano não deixa pesquisar: responde só com o que sabe, sem inventar */
const SEM_INTERNET = `
IMPORTANTE: agora você está SEM acesso à internet. Use só o que você sabe com segurança sobre esse livro.
Na dúvida, é melhor devolver menos (ou nada: "encontrado": false, ou a lista vazia) do que inventar.`;

async function comGemini(sistema: string, pergunta: string): Promise<string> {
  const tentativas: TentativaGemini[] = [];
  for (const pesquisa of [true, false]) {
    for (const modelo of modelosGemini()) {
      if (estaBloqueado(modelo, pesquisa)) continue;
      const t = await pedirAoGemini(
        modelo,
        pesquisa ? sistema : sistema + SEM_INTERNET,
        pergunta,
        pesquisa,
      );
      tentativas.push(t);
      if (t.texto) return t.texto;
      // sem cota, aposentado ou recurso fora do plano: esquece esse caminho por 1 hora
      if ([400, 403, 404, 429].includes(t.status))
        bloqueado.set(chaveBloqueio(modelo, pesquisa), Date.now() + 36e5);
      // 500/503 (Google ocupado) e o resto: só passa para o próximo
    }
  }
  console.error(
    "gemini falhou:",
    tentativas
      .map(
        (t) =>
          `${t.modelo}${t.pesquisa ? "+busca" : ""} ${t.status} ${t.mensagem ?? ""}`,
      )
      .join(" | "),
  );
  if (
    tentativas.length &&
    tentativas.every((t) => t.status === 429 || t.status === 404)
  )
    throw new SemCota("cota do Gemini");
  throw new Error("gemini indisponível");
}

/** Diagnóstico (rota /api/ia/status?teste=1): um pedido curtinho em cada modelo. */
export async function diagnosticoGemini() {
  const lista = [];
  for (const modelo of modelosGemini()) {
    for (const pesquisa of [true, false]) {
      const t = await pedirAoGemini(
        modelo,
        "Responda só: ok",
        "teste",
        pesquisa,
      );
      lista.push({
        modelo,
        pesquisa,
        ok: !!t.texto,
        status: t.status,
        erro: t.mensagem,
      });
    }
  }
  return lista;
}

async function comClaude(sistema: string, pergunta: string): Promise<string> {
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
  return resposta.content
    .slice(ultimo + 1)
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
}

export const textoCurto = (v: unknown, max: number) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
