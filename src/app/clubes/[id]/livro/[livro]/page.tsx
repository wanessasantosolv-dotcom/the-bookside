"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { useClube } from "@/components/clube/ClubeContexto";
import { botaoPrincipal, Rodape, TopoForm } from "@/components/clube/Pecas";
import { Carregando, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { criterios, fichasDe, livroDoClube, media, virgula, type Ficha } from "@/lib/clubes";
import { corDoLivro } from "@/lib/cores";
import { estrelas } from "@/lib/estantes";
import { nomeDe, useConsulta, useMeuId, type PessoaResumo } from "@/lib/social";

function CartaoFicha({ f, pessoa, eu }: { f: Ficha; pessoa: PessoaResumo | null; eu: string | null }) {
  const [revelar, setRevelar] = useState(!f.spoiler || f.autor === eu);
  return (
    <li className="border-t border-linha py-4 lg:border-fio">
      <div className="flex items-center gap-2.5">
        <Link href={pessoa?.usuario ? `/u/${pessoa.usuario}` : "#"}>
          <Avatar pessoa={pessoa} tamanho={30} />
        </Link>
        <span className="text-[13px] font-semibold">{f.autor === eu ? "você" : nomeDe(pessoa)}</span>
        <span className="text-xs text-bordo" aria-label={`nota ${f.nota} de 5`}>
          {estrelas(Number(f.nota))}
        </span>
        <span className="ml-auto text-[10px] font-semibold tracking-[.1em] text-cinza uppercase">
          {new Date(f.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "")}
        </span>
      </div>
      {f.personagem ? (
        <p className="mt-2 text-[10px] font-semibold tracking-[.14em] text-rosa-antigo uppercase">personagem favorita · {f.personagem} ♡</p>
      ) : null}
      {revelar ? (
        <>
          {f.citacao ? <blockquote className="mt-2 font-accent text-[15px] leading-[1.4] italic lg:font-revista">“{f.citacao}”</blockquote> : null}
          {f.texto ? <p className="mt-2 text-sm leading-normal whitespace-pre-line text-tinta-suave">{f.texto}</p> : null}
        </>
      ) : (
        <button
          type="button"
          onClick={() => setRevelar(true)}
          className="mt-2 flex min-h-11 w-full items-center justify-center rounded-md border border-dashed border-bege text-xs font-semibold text-cinza"
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

  if (consulta.carregando && !consulta.dados) return <Carregando texto="trazendo as fichas…" linhas={2} />;
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
            <CapaLivro titulo={l.livro.titulo} capa={l.livro.capa} cor={corDoLivro(l.livro.id)} className="w-[84px] [&>span:last-child]:hidden" />
            <div className="min-w-0">
              <p className="text-[9px] font-semibold tracking-[.14em] text-bordo uppercase">
                {l.rodada ? `rodada ${l.rodada} · ` : ""}
                {l.estado === "lido" ? "encerrada" : l.estado === "lendo" ? "lendo agora" : "sugestão"}
              </p>
              <h1 className="mt-1 font-display text-2xl leading-tight font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">{l.livro.titulo}</h1>
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
            <ul className="mt-2">
              {fichas.map((f) => (
                <CartaoFicha key={f.id} f={f} pessoa={pessoa(f.autor)} eu={eu} />
              ))}
            </ul>
          ) : (
            <Vazio className="mt-3" titulo="ninguém escreveu ficha ainda" texto="seja a primeira a contar o que achou." />
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
                        <i className="block h-full rounded-full bg-rosa-antigo" style={{ width: `${((v ?? 0) / 5) * 100}%` }} />
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
