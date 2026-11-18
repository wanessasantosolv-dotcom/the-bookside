"use client";

import { CapaAuto } from "@/components/CapaAuto";
import { Animacao } from "@/components/Animacao";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useClube } from "@/components/clube/ClubeContexto";
import { botaoPrincipal, Rodape, TopoForm } from "@/components/clube/Pecas";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { criterios, fichasDe, livroDoClube, media, virgula, type Ficha } from "@/lib/clubes";
import { estrelas } from "@/lib/estantes";
import { nomeDe, useConsulta, useMeuId, type PessoaResumo } from "@/lib/social";

function CartaoFicha({ f, pessoa, eu, clubeId, n }: { f: Ficha; pessoa: PessoaResumo | null; eu: string | null; clubeId: string; n: number }) {
  const [revelar, setRevelar] = useState(!f.spoiler || f.autor === eu);
  return (
    <li className="relative overflow-hidden rounded-[3px] border border-fio bg-creme-quente p-5 shadow-[0_1px_0_rgba(43,20,32,.05)] lg:p-6">
      <span aria-hidden className="absolute inset-x-5 top-2 h-px bg-ouro/35 lg:inset-x-6" />
      <span aria-hidden className="absolute inset-x-5 bottom-2 h-px bg-ouro/35 lg:inset-x-6" />
      <p className="text-[9px] font-semibold tracking-[.18em] text-ouro/80 uppercase">
        ficha nº {String(n).padStart(4, "0")}
      </p>

      <div
        aria-hidden
        className="absolute top-4 right-4 flex size-[52px] -rotate-6 flex-col items-center justify-center rounded-full border border-dashed border-rosa-antigo/60 text-rosa-antigo lg:top-5 lg:right-5"
      >
        <span className="font-display text-base leading-none font-bold italic">{virgula(Number(f.nota))}</span>
        <span className="mt-0.5 text-[9px] leading-none">{estrelas(Number(f.nota))}</span>
      </div>

      <div className="mt-3 flex items-center gap-2.5 pr-14">
        <Link href={pessoa?.usuario ? `/clubes/${clubeId}/membro/${pessoa.usuario}` : "#"}>
          <Avatar pessoa={pessoa} tamanho={32} />
        </Link>
        <div className="min-w-0">
          <span className="block text-[13px] font-semibold">{f.autor === eu ? "você" : nomeDe(pessoa)}</span>
          <span className="block text-[9px] font-semibold tracking-[.12em] text-cinza uppercase">
            {new Date(f.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "")}
          </span>
        </div>
      </div>

      {f.personagem ? (
        <p className="mt-3.5 inline-flex items-center rounded-pill border border-rosa-antigo/40 px-2.5 py-1 text-[10px] font-semibold tracking-[.1em] text-rosa-antigo uppercase">
          personagem favorita · {f.personagem} ♡
        </p>
      ) : null}

      {revelar ? (
        <>
          {f.citacao ? (
            <blockquote className="relative mt-4 px-1">
              <span aria-hidden className="absolute -top-1 -left-0.5 font-display text-3xl text-ouro/50">
                “
              </span>
              <p className="font-display text-[17px] leading-[1.35] font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
                {f.citacao}
              </p>
            </blockquote>
          ) : null}
          {f.texto ? (
            <p className="mt-3 text-sm leading-[1.55] whitespace-pre-line text-tinta-suave">{f.texto}</p>
          ) : null}
        </>
      ) : (
        <button
          type="button"
          onClick={() => setRevelar(true)}
          className="mt-3 flex min-h-11 w-full items-center justify-center rounded-md border border-dashed border-bege text-xs font-semibold text-cinza"
        >
          tem spoiler · tocar para ler
        </button>
      )}
    </li>
  );
}

export default function FichasDoLivroPage() {
  const { livro } = useParams<{ livro: string }>();
  const { clube, membros } = useClube();
  const eu = useMeuId();
  const consulta = useConsulta(async () => {
    const [l, fichas] = await Promise.all([livroDoClube(livro), fichasDe(livro)]);
    return l ? { l, fichas } : null;
  }, [livro]);

  if (consulta.carregando && !consulta.dados)
    return <Animacao tipo="estrelas" titulo="calculando a média do clube" sub="cada ficha conta um pouquinho" />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  if (!consulta.dados) return <Vazio className="mx-6 mt-6 lg:mx-0" titulo="esse livro não está no clube" />;
  const { l, fichas } = consulta.dados;
  const m = media(fichas.map((f) => f.nota));
  const minha = fichas.find((f) => f.autor === eu);
  const pessoa = (id: string) => membros.find((x) => x.usuario_id === id)?.pessoa ?? null;

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <TopoForm voltar={{ href: `/clubes/${clube.id}/biblioteca`, r: "livros" }} rotulo={clube.nome} titulo="" />
      <div className="px-6 lg:grid lg:max-w-[1000px] lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10 lg:px-0">
        <div>
          <div className="mt-4 flex gap-4 rounded-xl border border-linha bg-creme-quente p-4 lg:rounded-[4px] lg:border-fio lg:bg-transparent">
            <CapaAuto livro={l.livro}
              className="w-[84px] [&>span:last-child]:hidden"
            />
            <div className="min-w-0">
              <p className="text-[9px] font-semibold tracking-[.14em] text-bordo uppercase">
                {l.rodada ? `rodada ${l.rodada} · ` : ""}
                {l.estado === "lido" ? "encerrada" : l.estado === "lendo" ? "lendo agora" : "sugestão"}
              </p>
              <h1 className="mt-1 font-display text-2xl leading-tight font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
                {l.livro.titulo}
              </h1>
              <p className="mt-1 text-[13px] text-cinza">
                {l.livro.autor}
                {l.livro.paginas ? ` · ${l.livro.paginas} páginas` : ""}
              </p>
              <p className="mt-2.5 flex items-baseline gap-2">
                <b className="font-display text-[28px] leading-none font-semibold text-bordo">{virgula(m)}</b>
                <span className="text-[9px] font-semibold tracking-[.14em] text-cinza uppercase">
                  média de {fichas.length} {fichas.length === 1 ? "ficha" : "fichas"}
                </span>
              </p>
            </div>
          </div>

          <h2 className="mt-7 text-[10px] font-semibold tracking-[.16em] text-bordo uppercase">as fichas do clube</h2>
          {fichas.length ? (
            <ul className="mt-3 space-y-3.5">
              {fichas.map((f, i) => (
                <CartaoFicha key={f.id} f={f} pessoa={pessoa(f.autor)} eu={eu} clubeId={clube.id} n={i + 1} />
              ))}
            </ul>
          ) : (
            <Vazio
              className="mt-3"
              titulo="ninguém escreveu ficha ainda"
              texto="seja a primeira a contar o que achou."
            />
          )}
        </div>

        {fichas.length ? (
          <aside className="mt-6 lg:mt-0">
            <div className="rounded-xl border border-linha p-4 lg:rounded-[4px] lg:border-fio lg:p-5">
              <p className="text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">média por critério</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-3">
                {criterios.map((c) => {
                  const v = media(fichas.map((f) => f.notas[c]));
                  return (
                    <div key={c}>
                      <dt className="flex justify-between text-xs text-cinza">
                        {c} <span>{virgula(v)}</span>
                      </dt>
                      <dd className="mt-1 h-1.5 rounded-full bg-rosa-fundo">
                        <i
                          className="block h-full rounded-full bg-rosa-antigo"
                          style={{ width: `${((v ?? 0) / 5) * 100}%` }}
                        />
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          </aside>
        ) : null}
      </div>
      {l.estado !== "sugerido" ? (
        <Rodape>
          <Link href={`/clubes/${clube.id}/ficha/${l.id}`} className={`${botaoPrincipal} lg:max-w-[560px]`}>
            {minha ? "editar a minha ficha ✎" : "escrever a minha ficha ✎"}
          </Link>
        </Rodape>
      ) : null}
    </div>
  );
}
