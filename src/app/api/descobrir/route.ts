/** Descoberta literária no servidor (lógica em lib/descoberta-servidor.ts). */
import { SEMANA, contaValida, executarDescoberta, gravarCache, lerCache, norm, texto, type RespostaDescobrir } from "@/lib/descoberta-servidor";

export const maxDuration = 60;

const memoria = new Map<string, { em: number; valor: RespostaDescobrir }>();
const pedidos = new Map<string, number[]>();

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!(await contaValida(token))) return Response.json({ erro: "entre na sua conta" }, { status: 401 });
  const quem = token!.slice(-24);
  const agora = Date.now();
  const recentes = (pedidos.get(quem) ?? []).filter((t) => agora - t < 36e5);
  if (recentes.length >= 40) return Response.json({ erro: "limite" }, { status: 429 });

  const corpo = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const chave = norm(JSON.stringify([corpo.consulta, corpo.criterios, corpo.sem, corpo.parecidoCom, corpo.contexto, (corpo.sementes as unknown[] | undefined)?.length ?? 0]));
  const m = memoria.get(chave);
  if (m && agora - m.em < SEMANA) return Response.json(m.valor);
  const guardada = await lerCache(chave, token!);
  if (guardada) {
    memoria.set(chave, { em: agora, valor: guardada });
    return Response.json(guardada);
  }
  pedidos.set(quem, [...recentes, agora]);
  const resposta = await executarDescoberta(corpo);
  if (resposta.resultados.length) {
    memoria.set(chave, { em: agora, valor: resposta });
    void gravarCache(chave, texto(corpo.consulta, 200), resposta, token!);
  }
  return Response.json(resposta);
}
