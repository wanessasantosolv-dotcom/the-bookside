/**
 * Nas entrelinhas: perguntas e pontuação vêm de src/data/nas-entrelinhas-v2.json
 * (fonte oficial). A matriz foi validada nas 1.048.576 combinações possíveis
 * (4^10): 691.373 resultados únicos, 357.203 empates, 12,5% para cada arquétipo.
 * Não mude a pontuação do JSON sem refazer essa análise.
 */
import dados from "@/data/nas-entrelinhas-v2.json";

export type CartaId = "D" | "X" | "R" | "S" | "W" | "N" | "C" | "E";
export type Alternativa = { id: string; texto: string; pontos: Partial<Record<CartaId, number>>; imagem?: string };
export type PerguntaEntrelinhas = { id: string; titulo: string; enunciado: string; formato: "textual" | "ilustrada" | "editorial"; alternativas: Alternativa[] };

export const CARTAS = Object.keys(dados.arquetipos) as CartaId[];
export const NOMES = dados.arquetipos as Record<CartaId, string>;
export const PERGUNTAS = dados.perguntas as PerguntaEntrelinhas[];
export const DESEMPATE = dados.desempate as { pergunta: string; alternativas: Record<CartaId, string> };

/** embaralha as alternativas (texto, imagem e pontos andam juntos: só a ordem muda) */
export function embaralhar<T>(lista: T[], aleatorio: () => number = Math.random): T[] {
  const c = [...lista];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/** respostas: id da alternativa escolhida em cada pergunta */
export function pontuar(respostas: Record<string, string>): Record<CartaId, number> {
  const pontos = Object.fromEntries(CARTAS.map((c) => [c, 0])) as Record<CartaId, number>;
  for (const p of PERGUNTAS) {
    const alt = p.alternativas.find((a) => a.id === respostas[p.id]);
    if (!alt) continue;
    for (const [c, v] of Object.entries(alt.pontos)) pontos[c as CartaId] += v ?? 0;
  }
  return pontos;
}

/** a carta vencedora, ou os empatados (aí a pergunta de desempate mostra só eles, embaralhados) */
export function resultado(respostas: Record<string, string>): { carta: CartaId } | { empate: CartaId[] } {
  const pontos = pontuar(respostas);
  const max = Math.max(...Object.values(pontos));
  const topo = CARTAS.filter((c) => pontos[c] === max);
  return topo.length === 1 ? { carta: topo[0] } : { empate: embaralhar(topo) };
}
