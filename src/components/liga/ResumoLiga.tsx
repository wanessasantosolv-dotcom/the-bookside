"use client";

import Link from "next/link";
import { useClube } from "@/components/clube/ClubeContexto";
import { EmblemaLiga, posicaoTexto } from "@/components/liga/Pecas";
import { Avatar } from "@/components/social/Pessoas";
import { fichasDoClube, livrosDoClube, progressoDoClube } from "@/lib/clubes";
import { CATEGORIAS, classificacao, periodoAno } from "@/lib/liga";
import { estantesDe, nomeDe, useConsulta, useMeuId } from "@/lib/social";
import type { LivroSalvo } from "@/lib/perfil-store";

/** o resumo da liga no início do clube: até 3 nomes; sem dados, não ocupa espaço */
export function ResumoLiga() {
  const { clube, membros, identidade } = useClube();
  const eu = useMeuId();
  const consulta = useConsulta(async () => {
    const livros = await livrosDoClube(clube.id);
    const ids = livros.filter((l) => l.estado !== "sugerido").map((l) => l.id);
    const [fichas, progresso, pessoais] = await Promise.all([
      fichasDoClube(ids),
      progressoDoClube(ids).catch(() => []),
      estantesDe(membros.map((m) => m.usuario_id)).catch(() => new Map<string, LivroSalvo[] | null>()),
    ]);
    return { livros, fichas, progresso, pessoais };
  }, [clube.id, membros.length]);
  if (identidade?.semRanking || !consulta.dados) return null;
  const ano = periodoAno(new Date().getFullYear());
  const linhas = classificacao({ membros, ...consulta.dados }, "paginas", ano).filter((l) => (l.valor ?? 0) > 0).slice(0, 3);
  if (!linhas.length) return null;
  const info = CATEGORIAS[0];
  return (
    <section aria-labelledby="t-liga">
      <div className="flex items-baseline justify-between gap-3 border-b border-linha pb-2">
        <h2 id="t-liga" className="flex items-center gap-2 font-revista text-[19px] leading-none text-ameixa">
          the reading league. <span className="text-bordo"><EmblemaLiga tamanho={16} /></span>
        </h2>
        <span className="text-[11px] text-cinza">páginas · {ano.nome}</span>
      </div>
      <ol className="mt-1">
        {linhas.map((l) => (
          <li key={l.m.usuario_id} className="flex items-center gap-3 py-1.5 text-[13px]">
            <span className="w-6 text-tinta-suave tabular-nums">{posicaoTexto(l.posicao)}</span>
            <Avatar pessoa={l.m.pessoa} tamanho={26} />
            <span className="min-w-0 flex-1 truncate text-ameixa">{l.m.usuario_id === eu ? "você" : nomeDe(l.m.pessoa)}</span>
            <span className="font-semibold text-ameixa tabular-nums">{l.valor!.toLocaleString("pt-BR")}</span>
          </li>
        ))}
      </ol>
      <Link href={`/clubes/${clube.id}/membros#t-liga`} className="mt-1 inline-block min-h-9 py-2 text-[12px] font-semibold text-bordo">
        Ver classificação completa →
      </Link>
      <span className="sr-only">{info.nome}</span>
    </section>
  );
}
