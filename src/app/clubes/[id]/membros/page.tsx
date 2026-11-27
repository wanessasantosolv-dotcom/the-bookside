"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClube } from "@/components/clube/ClubeContexto";
import { LigaDosLeitores, NaMesmaPagina, PequenasGlorias, QuemLeComAGente, useConsolidar, useDadosDaLiga, useSelecaoDaLiga } from "@/components/liga/Liga";
import { Carregando, ErroOuFalta } from "@/components/social/Estados";
import { tirarMembro } from "@/lib/clubes";
import { useMeuId } from "@/lib/social";

/*
 * Membros, numa página contínua:
 *  celular: quem lê com a gente → liga dos leitores → pequenas glórias → na mesma página;
 *  computador: coluna principal (60%) com participantes, glórias e afinidades,
 *  coluna complementar (40%) com a liga.
 */
export default function MembrosPage() {
  const { clube, papel, identidade } = useClube();
  const eu = useMeuId();
  const router = useRouter();
  const consulta = useDadosDaLiga();
  const selecao = useSelecaoDaLiga();
  useConsolidar(consulta.dados?.d, consulta.dados?.datas);

  async function sair() {
    if (!eu || !confirm(`sair do clube ${clube.nome}?`)) return;
    await tirarMembro(clube.id, eu);
    router.push("/clubes");
  }

  const acoes = (
    <>
      <Link href={`/clubes/${clube.id}/convidar`} className="flex min-h-10 items-center font-semibold text-bordo hover:underline">
        + convidar
      </Link>
      {papel === "moderadora" ? (
        <Link href={`/clubes/${clube.id}/convidar`} className="flex min-h-10 items-center text-ameixa hover:text-bordo">
          gerenciar membros
        </Link>
      ) : null}
      <button type="button" onClick={sair} className="flex min-h-10 items-center text-cinza hover:text-bordo">
        sair do clube
      </button>
    </>
  );

  if (consulta.carregando && !consulta.dados) return <Carregando texto="reunindo os leitores…" linhas={3} />;
  if (consulta.erro && !consulta.dados) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { d, cartas } = consulta.dados!;
  const comLiga = !identidade?.semRanking;
  const temRegistro = d.livros.some((l) => l.estado !== "sugerido") || [...(d.pessoais?.values() ?? [])].some((ls) => ls?.some((l) => l.status === "lido"));

  return (
    <div className="grid gap-10 px-5 pt-6 pb-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-x-14 lg:px-0 lg:pt-8">
      <div className="min-w-0 lg:col-start-1">
        <QuemLeComAGente cartas={cartas} acoes={acoes} />
      </div>
      {comLiga ? (
        <div className="min-w-0 lg:col-start-2 lg:row-span-4 lg:row-start-1">
          <div className="lg:sticky lg:top-[120px]">
            {temRegistro ? (
              <LigaDosLeitores d={d} selecao={selecao} />
            ) : (
              <section>
                <h2 className="font-revista text-[22px] text-ameixa">Toda jornada tem um começo.</h2>
                <p className="mt-1 text-[13px] text-tinta-suave">Os destaques literários aparecerão conforme as leituras forem registradas.</p>
              </section>
            )}
          </div>
        </div>
      ) : null}
      {comLiga && temRegistro ? (
        <div className="min-w-0 lg:col-start-1">
          <PequenasGlorias d={d} periodo={selecao.periodo} />
        </div>
      ) : null}
      <div className="min-w-0 lg:col-start-1">
        <NaMesmaPagina d={d} />
      </div>
    </div>
  );
}
