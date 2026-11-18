import { diagnosticoGemini } from "@/lib/ia-servidor";

/** Mostra só SE a IA está ligada (nunca mostra a chave). Com ?teste=1, testa cada modelo do Gemini. */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

let ultimoTeste: { quando: number; resultado: unknown } | null = null;

export async function GET(req: Request) {
  const gemini = !!process.env.GEMINI_API_KEY;
  const claude = !!process.env.ANTHROPIC_API_KEY;
  const ia = gemini
    ? "ligada (Gemini)"
    : claude
      ? "ligada (Claude)"
      : "desligada: falta a chave na Vercel";
  if (!gemini || new URL(req.url).searchParams.get("teste") !== "1")
    return Response.json({ ia });
  // no máximo um teste a cada 2 minutos, para não gastar a cota
  if (!ultimoTeste || Date.now() - ultimoTeste.quando > 12e4)
    ultimoTeste = { quando: Date.now(), resultado: await diagnosticoGemini() };
  return Response.json({ ia, modelos: ultimoTeste.resultado });
}
