"use client";

import Link from "next/link";
import { CapaLivro } from "@/components/CapaLivro";
import { useClube } from "@/components/clube/ClubeContexto";
import { Carregando, ErroOuFalta } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { andamento, encontrosDe, fichasDoClube, livrosDoClube, media, virgula } from "@/lib/clubes";
import { corDoLivro } from "@/lib/cores";
import { estrelas } from "@/lib/estantes";
import { nomeDe, useConsulta, useMeuId } from "@/lib/social";

const secao = "flex items-baseline justify-between border-b border-linha pb-2 lg:border-tinta";
const tituloSecao =
  "font-display text-[22px] leading-none font-semibold italic text-bordo lg:font-revista lg:text-[19px] lg:font-normal lg:text-tinta";
const linkSecao = "text-[10px] font-semibold tracking-[.12em] text-bordo uppercase";

export default function ClubeInicioPage() {
  const { clube, membros, papel } = useClube();
  const eu = useMeuId();
  const consulta = useConsulta(async () => {
    const [livros, encontros] = await Promise.all([livrosDoClube(clube.id), encontrosDe(clube.id)]);
    const fichas = await fichasDoClube(livros.filter((l) => l.estado !== "sugerido").map((l) => l.id));
    return { livros, encontros, fichas };
  }, [clube.id]);

  if (consulta.carregando && !consulta.dados) return <Carregando texto="abrindo o clube…" linhas={2} />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { livros, encontros, fichas } = consulta.dados!;
  const lendo = livros.find((l) => l.estado === "lendo");
  const and = lendo ? andamento(lendo) : null;
  const sugestoes = livros.filter((l) => l.estado === "sugerido");
  const quemSugeriu = lendo?.sugerido_por ? membros.find((m) => m.usuario_id === lendo.sugerido_por)?.pessoa : null;
  const proximo = encontros.find((e) => new Date(e.quando).getTime() > Date.now());
  const amados = livros
    .filter((l) => l.estado === "lido")
    .map((l) => ({ l, m: media(fichas.filter((f) => f.clube_livro_id === l.id).map((f) => f.nota)) }))
    .filter((x) => x.m !== null)
    .sort((a, b) => b.m! - a.m!)
    .slice(0, 4);

  return (
    <div className="space-y-8 px-6 pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10 lg:space-y-0 lg:px-0">
      <div className="space-y-8">
        <section>
          <div className={secao}>
            <h2 className={tituloSecao}>lendo agora</h2>
            {lendo?.rodada ? (
              <span className="text-[10px] font-semibold tracking-[.12em] text-rosa-antigo uppercase">
                leitura nº {lendo.rodada}
              </span>
            ) : null}
          </div>
          {lendo ? (
            <Link href={`/clubes/${clube.id}/leitura`} className="mt-4 flex gap-4">
              <CapaLivro
                titulo={lendo.livro.titulo}
                capa={lendo.livro.capa}
                cor={corDoLivro(lendo.livro.id)}
                className="w-[92px] -rotate-1 [&>span:last-child]:text-xs"
              />
              <span className="min-w-0 pt-1">
                <span className="block font-display text-xl leading-tight font-semibold italic lg:font-revista lg:font-normal">
                  {lendo.livro.titulo}
                </span>
                <span className="mt-1.5 block text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
                  {lendo.livro.autor}
                </span>
                {quemSugeriu ? (
                  <span className="mt-2.5 block font-accent text-sm italic text-cinza">
                    {quemSugeriu.id === eu ? "sugestão sua" : `escolha da ${nomeDe(quemSugeriu)}`}
                  </span>
                ) : null}
                {and ? (
                  <span className="mt-2.5 inline-flex min-h-6 items-center rounded-pill bg-rosa-fundo px-2.5 text-[10px] font-semibold tracking-[.1em] text-bordo uppercase">
                    {and.faltam ? `faltam ${and.faltam} ${and.faltam === 1 ? "dia" : "dias"}` : "último dia!"}
                  </span>
                ) : null}
              </span>
            </Link>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-bege p-4 lg:rounded-[4px]">
              <p className="font-display text-lg font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
                nenhuma leitura rolando
              </p>
              <p className="mt-1 text-[13px] text-cinza">
                {sugestoes.length
                  ? `${sugestoes.length} ${sugestoes.length === 1 ? "sugestão esperando" : "sugestões esperando"} a votação.`
                  : papel === "moderadora"
                    ? "escolha qualquer livro para começar a primeira rodada."
                    : "sugira um livro para começar a primeira rodada."}
              </p>
              <Link
                href={`/clubes/${clube.id}/${papel === "moderadora" ? "escolher" : sugestoes.length ? "sugestoes" : "sugerir"}`}
                className="mt-3 inline-flex min-h-11 items-center rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme"
              >
                {papel === "moderadora"
                  ? "escolher o livro da vez"
                  : sugestoes.length
                    ? "ver e votar"
                    : "sugerir um livro"}
              </Link>
            </div>
          )}
        </section>

        <section>
          <div className={secao}>
            <h2 className={tituloSecao}>o que a gente amou</h2>
            <Link href={`/clubes/${clube.id}/biblioteca`} className={linkSecao}>
              ver todos →
            </Link>
          </div>
          {amados.length ? (
            <ul className="mt-4 grid grid-cols-4 gap-2.5 lg:max-w-[440px]">
              {amados.map(({ l, m }) => (
                <li key={l.id}>
                  <Link href={`/clubes/${clube.id}/livro/${l.id}`}>
                    <CapaLivro
                      titulo={l.livro.titulo}
                      capa={l.livro.capa}
                      cor={corDoLivro(l.livro.id)}
                      className="w-full"
                    />
                    <span className="mt-1.5 block text-center text-[10px] text-bordo">
                      {estrelas(Math.round(m! * 2) / 2)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 font-accent text-sm italic text-cinza">
              quando o clube terminar um livro e escrever as fichas, os preferidos aparecem aqui.
            </p>
          )}
        </section>
      </div>

      <div className="space-y-8">
        <section>
          <div className={secao}>
            <h2 className={tituloSecao}>quem tá no clube</h2>
            <span className="text-[10px] font-semibold tracking-[.12em] text-rosa-antigo uppercase">
              {membros.length} {membros.length === 1 ? "pessoa" : "pessoas"}
            </span>
          </div>
          <ul className="mt-4 flex flex-wrap gap-4">
            {membros.map((m) => (
              <li key={m.usuario_id}>
                <Link
                  href={m.pessoa.usuario ? `/clubes/${clube.id}/membro/${m.pessoa.usuario}` : "#"}
                  className="flex w-14 flex-col items-center gap-1.5 text-center"
                >
                  <Avatar pessoa={m.pessoa} tamanho={48} />
                  <span className="w-full truncate font-accent text-xs italic">
                    {m.usuario_id === eu ? "você" : m.pessoa.nome || m.pessoa.usuario}
                  </span>
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={`/clubes/${clube.id}/convidar`}
                className="flex w-14 flex-col items-center gap-1.5 text-center"
              >
                <span className="flex size-12 items-center justify-center rounded-full border border-dashed border-rosa-antigo text-xl text-rosa-antigo">
                  +
                </span>
                <span className="font-accent text-xs italic text-cinza">convidar</span>
              </Link>
            </li>
          </ul>
        </section>

        <section>
          <div className={secao}>
            <h2 className={tituloSecao}>próximo encontro</h2>
            <Link href={`/clubes/${clube.id}/agenda`} className={linkSecao}>
              agenda →
            </Link>
          </div>
          {proximo ? (
            <p className="mt-3 text-sm">
              <b className="font-display text-lg font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
                {proximo.titulo}
              </b>
              <span className="mt-1 block text-[13px] text-cinza">
                {new Date(proximo.quando).toLocaleString("pt-BR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {proximo.local ? ` · ${proximo.local}` : ""}
              </span>
            </p>
          ) : (
            <p className="mt-3 font-accent text-sm italic text-cinza">nada marcado ainda.</p>
          )}
          {lendo && and ? (
            <p className="mt-3 text-[13px] text-cinza">
              a leitura de <i>{lendo.livro.titulo}</i> termina em{" "}
              {and.fim.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}.
            </p>
          ) : null}
        </section>

        {fichas.length ? (
          <p className="text-[13px] text-cinza">
            média geral do clube: <b className="text-bordo">{virgula(media(fichas.map((f) => f.nota)))}★</b> em{" "}
            {fichas.length} {fichas.length === 1 ? "ficha" : "fichas"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
