/** Descoberta literária no servidor (lógica em lib/descoberta-servidor.ts). */
import { createHash } from "node:crypto";
import { SEMANA, VERSAO_DESCOBERTA, contaDaDescoberta, executarDescoberta, type RespostaDescobrir } from "@/lib/descoberta-servidor";

export const maxDuration = 60;

const memoria = new Map<string, { em: number; valor: RespostaDescobrir }>();
const pedidos = new Map<string, number[]>();

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const quem = await contaDaDescoberta(token);
  if (!quem) return Response.json({ erro: "entre na sua conta" }, { status: 401 });

  const json: unknown = await req.json().catch(() => null);
  if (!json || typeof json !== "object" || Array.isArray(json))
    return Response.json({ erro: "pesquisa inválida" }, { status: 400 });
  const corpo = json as Record<string, unknown>;
  const agora = Date.now();
  const chave = createHash("sha256").update(JSON.stringify([VERSAO_DESCOBERTA, quem, corpo])).digest("hex");
  const pronto = memoria.get(chave);
  if (pronto && agora - pronto.em < SEMANA) return Response.json(pronto.valor);

  const recentes = (pedidos.get(quem) ?? []).filter((t) => agora - t < 36e5);
  if (recentes.length >= 40) return Response.json({ erro: "limite" }, { status: 429 });
  for (const [id, acessos] of pedidos) {
    if (agora - acessos[acessos.length - 1] >= 36e5) pedidos.delete(id);
  }
  pedidos.set(quem, [...recentes, agora]);

  const resposta = await executarDescoberta(corpo, req.signal);
  if (resposta.pesquisaExterna) {
    for (const [id, item] of memoria) if (agora - item.em >= SEMANA) memoria.delete(id);
    if (memoria.size >= 500) {
      const primeira = memoria.keys().next().value;
      if (primeira) memoria.delete(primeira);
    }
    memoria.set(chave, { em: agora, valor: resposta });
  }
  return Response.json(resposta);
}
