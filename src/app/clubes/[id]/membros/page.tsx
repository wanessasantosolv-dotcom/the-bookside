"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClube } from "@/components/clube/ClubeContexto";
import { LigaDoClube } from "@/components/liga/Liga";
import { Carregando, ErroOuFalta } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import {
  cargos,
  fichasComAntigas,
  fichasDoClube,
  livrosDoClube,
  media,
  tirarMembro,
  virgula,
  type Membro,
} from "@/lib/clubes";
import { nomeDe, useConsulta, useMeuId } from "@/lib/social";

/*
 * Membros: participantes, números de cada um dentro do clube, ranking,
 * participação nas fichas e o gerenciamento (convites, cargos, sair).
 * Só conta o que é do clube: as leituras pessoais não entram aqui.
 */

type Numeros = {
  m: Membro;
  livros: number;
  paginas: number;
  media: number | null;
  fichas: number;
  pendentes: number;
  sugeridos: number;
};

const titulo = "font-revista text-[24px] leading-none text-bordo italic";
const secao = "mb-4 flex items-baseline justify-between gap-3 border-b border-linha pb-2 lg:border-fio";
const num = (n: number) => n.toLocaleString("pt-BR");

export default function MembrosPage() {
  const { clube, membros, papel } = useClube();
  const eu = useMeuId();
  const router = useRouter();
  const consulta = useConsulta(async () => {
    const livros = await livrosDoClube(clube.id);
    const reais = await fichasDoClube(livros.filter((l) => l.estado !== "sugerido").map((l) => l.id));
    return { livros, reais };
  }, [clube.id, membros.length]);

  if (consulta.carregando && !consulta.dados) return <Carregando texto="carregando os membros…" linhas={2} />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { livros, reais } = consulta.dados!;
  const lidos = livros.filter((l) => l.estado === "lido");
  // as fichas do app + as antigas (importadas) de quem ainda não escreveu aqui
  const fichas = livros
    .filter((l) => l.estado !== "sugerido")
    .flatMap((l) => fichasComAntigas(l, reais.filter((f) => f.clube_livro_id === l.id), membros));

  const numeros: Numeros[] = membros.map((m) => {
    const minhas = fichas.filter((f) => f.autor === m.usuario_id);
    const concluidos = lidos.filter((l) => minhas.some((f) => f.clube_livro_id === l.id));
    // pendente: livro concluído pelo clube depois que a pessoa entrou e sem ficha dela
    const pendentes = lidos.filter(
      (l) => !minhas.some((f) => f.clube_livro_id === l.id) && (l.encerrado_em ?? l.criado_em) >= m.entrou_em,
    ).length;
    return {
      m,
      livros: concluidos.length,
      paginas: concluidos.reduce((t, l) => t + (l.livro.paginas ?? 0), 0),
      media: media(minhas.map((f) => f.nota)),
      fichas: minhas.length,
      pendentes,
      sugeridos: livros.filter((l) => l.sugerido_por === m.usuario_id && l.estado !== "sugerido").length,
    };
  });

  const totalPendentes = numeros.reduce((t, x) => t + x.pendentes, 0);
  const emDia = numeros.filter((x) => !x.pendentes).length;
  const nomeCargo = (p: string) => cargos.find((c) => c.id === p)?.nome ?? p;

  async function sair() {
    if (!eu || !confirm(`sair do clube ${clube.nome}?`)) return;
    await tirarMembro(clube.id, eu);
    router.push("/clubes");
  }

  return (
    <>
    <div className="grid gap-10 px-5 pt-6 lg:grid-cols-[minmax(0,1.9fr)_minmax(300px,1fr)] lg:gap-14 lg:px-0 lg:pt-8">
      <div className="min-w-0 space-y-10">
        {/* participantes e números dentro do clube */}
        <section aria-labelledby="t-participantes">
          <div className={secao}>
            <h2 id="t-participantes" className={titulo}>
              participantes
            </h2>
            <span className="text-[12px] text-cinza">
              {membros.length} {membros.length === 1 ? "membro" : "membros"}
            </span>
          </div>
          <ul>
            {numeros.map((x) => (
              <li key={x.m.usuario_id} className="border-b border-linha py-4 last:border-b-0 lg:border-fio">
                <div className="flex items-start gap-3.5">
                  <Link href={x.m.pessoa.usuario ? `/clubes/${clube.id}/membro/${x.m.pessoa.usuario}` : "#"} className="flex-none">
                    <Avatar pessoa={x.m.pessoa} tamanho={44} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <Link
                        href={x.m.pessoa.usuario ? `/clubes/${clube.id}/membro/${x.m.pessoa.usuario}` : "#"}
                        className="text-[15px] font-semibold text-ameixa hover:text-bordo"
                      >
                        {x.m.usuario_id === eu ? "você" : nomeDe(x.m.pessoa)}
                      </Link>
                      {x.m.pessoa.usuario ? <span className="text-[12px] text-cinza">@{x.m.pessoa.usuario}</span> : null}
                      {x.m.papel !== "membro" ? (
                        <span className="rounded-full bg-rosa-fundo px-2 py-0.5 text-[11px] font-semibold text-bordo">{nomeCargo(x.m.papel)}</span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[12px] text-cinza">
                      no clube desde {new Date(x.m.entrou_em).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                    </p>
                    <dl className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-tinta-suave">
                      <div>
                        <dt className="inline">livros lidos: </dt>
                        <dd className="inline font-semibold text-ameixa">{x.livros}</dd>
                      </div>
                      <div>
                        <dt className="inline">páginas: </dt>
                        <dd className="inline font-semibold text-ameixa">{num(x.paginas)}</dd>
                      </div>
                      <div>
                        <dt className="inline">média: </dt>
                        <dd className="inline font-semibold text-ameixa">{x.media !== null ? `${virgula(x.media)}★` : "—"}</dd>
                      </div>
                      <div>
                        <dt className="inline">fichas publicadas: </dt>
                        <dd className="inline font-semibold text-ameixa">{x.fichas}</dd>
                      </div>
                      {x.pendentes ? (
                        <div>
                          <dt className="inline">fichas pendentes: </dt>
                          <dd className="inline font-semibold text-bordo">{x.pendentes}</dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="inline">sugestões lidas: </dt>
                        <dd className="inline font-semibold text-ameixa">{x.sugeridos}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* the reading league + destaques, na mesma página */}
        <LigaDoClube />
      </div>

      <aside className="min-w-0 space-y-10">


        {/* participação nas fichas */}
        {lidos.length ? (
          <section aria-labelledby="t-fichas">
            <div className={secao}>
              <h2 id="t-fichas" className={titulo}>
                participação nas fichas
              </h2>
            </div>
            <p className="text-[14px] text-tinta-suave">
              <b className="font-semibold text-ameixa">
                {emDia} de {membros.length}
              </b>{" "}
              {emDia === 1 ? "membro está" : "membros estão"} com as fichas em dia
              {totalPendentes ? (
                <>
                  {" "}
                  · <b className="font-semibold text-bordo">{totalPendentes}</b> {totalPendentes === 1 ? "ficha pendente" : "fichas pendentes"}
                </>
              ) : null}
              .
            </p>
            <Link href={`/clubes/${clube.id}/biblioteca`} className="mt-2 inline-flex min-h-9 items-center text-[13px] font-semibold text-bordo hover:underline">
              ver fichas de leitura →
            </Link>
          </section>
        ) : null}

        {/* convites e gerenciamento */}
        <section aria-labelledby="t-gerenciar">
          <div className={secao}>
            <h2 id="t-gerenciar" className={titulo}>
              convites e membros
            </h2>
          </div>
          <div className="flex flex-col items-start gap-1 text-[14px]">
            <Link href={`/clubes/${clube.id}/convidar`} className="flex min-h-10 items-center font-semibold text-bordo hover:underline">
              convidar membros →
            </Link>
            {papel === "moderadora" ? (
              <Link href={`/clubes/${clube.id}/convidar`} className="flex min-h-10 items-center text-ameixa hover:text-bordo">
                gerenciar membros
              </Link>
            ) : null}
            <button type="button" onClick={sair} className="flex min-h-10 items-center text-cinza hover:text-bordo">
              sair do clube
            </button>
          </div>
        </section>
      </aside>
    </div>
    </>
  );
}
