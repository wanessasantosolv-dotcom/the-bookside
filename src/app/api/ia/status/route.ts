/** Mostra só SE a IA está ligada (nunca mostra a chave). */
export const dynamic = "force-dynamic";

export function GET() {
  const gemini = !!process.env.GEMINI_API_KEY;
  const claude = !!process.env.ANTHROPIC_API_KEY;
  return Response.json({
    ia: gemini ? "ligada (Gemini)" : claude ? "ligada (Claude)" : "desligada: falta a chave na Vercel",
  });
}
