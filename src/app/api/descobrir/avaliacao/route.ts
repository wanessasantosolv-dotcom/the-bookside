/**
 * Avaliação da descoberta: roda as consultas de referência no mesmo motor do
 * app e devolve as medidas automáticas (edições em português, materiais não
 * literários barrados, duplicatas, cobertura de fontes, tempo). A relevância
 * dos dez primeiros continua exigindo leitura humana: os títulos vêm na resposta.
 * Uso (logada): /api/descobrir/avaliacao?de=0&ate=6  (lotes, para caber no tempo)
 */
import { contaDaDescoberta, executarDescoberta } from "@/lib/descoberta-servidor";
import { ehEdicaoPt, naoLiterario } from "@/lib/descoberta-qualidade";

export const maxDuration = 60;

const CONSULTAS = [
  "Melhores livros brasileiros",
  "Literatura brasileira contemporânea",
  "Literatura coreana",
  "Livros coreanos acolhedores",
  "Livros japoneses",
  "Livros calmos",
  "Livros sobre solidão",
  "Melhores romances contemporâneos",
  "Literatura africana",
  "Clássicos para iniciantes",
  "Suspenses psicológicos",
  "Livros parecidos com Recursão",
  "Livros semelhantes a Piranesi",
  "Histórias ambientadas em livrarias",
  "Livros recomendados por críticos literários",
  "Livros cozy",
  "Fantasia sem romance",
  "Narradores não confiáveis",
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const segredo = process.env.CRON_SECRET && req.headers.get("x-cron-secret") === process.env.CRON_SECRET;
  if (!segredo && !(await contaDaDescoberta(token))) return Response.json({ erro: "entre na sua conta" }, { status: 401 });
  const de = Math.max(0, Number(url.searchParams.get("de")) || 0);
  const ate = Math.min(CONSULTAS.length, de + 6, Number(url.searchParams.get("ate")) || de + 6);
  const lote = CONSULTAS.slice(de, ate);
  const rodadas = await Promise.all(
    lote.map(async (consulta) => {
      const r = await executarDescoberta({ consulta }, req.signal);
      const dez = r.resultados.slice(0, 10);
      return {
        consulta,
        resultados: r.resultados.length,
        pesquisaExterna: r.pesquisaExterna,
        edicoesPt: dez.filter((x) => ehEdicaoPt(x.livro)).length,
        naoLiterariosNaTela: dez.filter((x) => naoLiterario(x.livro)).length,
        comFontes: dez.filter((x) => x.fontes.length).length,
        medidas: r.medidas,
        diagnostico: r.diagnostico,
        dezPrimeiros: dez.map((x, i) => ({
          posicao: i + 1,
          titulo: x.livro.titulo,
          autor: x.livro.autor,
          edicao: [x.livro.editora, x.livro.idioma, x.livro.isbn].filter(Boolean).join(" · "),
          tipo: x.livro.genero ?? null,
          porque: x.porque ?? null,
          fontes: x.fontes.map((f) => `${f.dominio} (${f.tipo})`),
        })),
        avisos: r.avisos,
      };
    }),
  );
  const soma = (f: (x: (typeof rodadas)[number]) => number) => rodadas.reduce((s, x) => s + f(x), 0);
  const mostrados = soma((x) => Math.min(10, x.resultados));
  return Response.json({
    lote: [de, ate],
    resumo: {
      consultas: rodadas.length,
      semResultado: rodadas.filter((x) => !x.resultados).length,
      percentualEdicoesPt: mostrados ? Math.round((soma((x) => x.edicoesPt) / mostrados) * 100) : null,
      naoLiterariosNaTela: soma((x) => x.naoLiterariosNaTela),
      barradosNaoLiterarios: soma((x) => x.medidas.naoLiterarios),
      barradosSemEdicaoPt: soma((x) => x.medidas.semEdicaoPt),
      barradosSemEvidencia: soma((x) => x.medidas.semEvidencia),
      barradosMetadadosFracos: soma((x) => x.medidas.metadadosFracos),
      duplicatasRemovidas: soma((x) => x.medidas.duplicados),
      coberturaDeFontes: mostrados ? Math.round((soma((x) => x.comFontes) / mostrados) * 100) : null,
      tempoMedioMs: Math.round(soma((x) => x.medidas.ms) / Math.max(1, rodadas.length)),
    },
    rodadas,
  });
}
