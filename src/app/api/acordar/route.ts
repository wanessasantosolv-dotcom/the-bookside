/**
 * "Despertador" do Supabase: o plano grátis pausa o projeto depois de 7 dias
 * sem nenhum acesso. A Vercel chama esta rota todo dia (vercel.json → crons),
 * ela faz uma consulta minúscula no banco e o projeto nunca fica parado.
 * Não lê nem devolve dado nenhum de ninguém.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // com CRON_SECRET na Vercel, só a própria Vercel consegue chamar
  const segredo = process.env.CRON_SECRET;
  if (segredo && req.headers.get("authorization") !== `Bearer ${segredo}`)
    return Response.json({ ok: false }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !chave)
    return Response.json({ ok: false, motivo: "supabase não configurado" });
  try {
    // consulta mínima: sem login, as regras de acesso devolvem lista vazia, mas o banco é acionado
    const r = await fetch(`${url}/rest/v1/clubes?select=id&limit=1`, {
      headers: { apikey: chave, Authorization: `Bearer ${chave}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    return Response.json({
      ok: r.status < 500,
      status: r.status,
      quando: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      { ok: false, motivo: "sem resposta do supabase" },
      { status: 502 },
    );
  }
}
