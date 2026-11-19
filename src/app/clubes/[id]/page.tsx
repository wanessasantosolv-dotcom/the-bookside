"use client";

import { CartaoAnoDoClube } from "@/components/clube/AnoDoClube";
import { CapaAuto } from "@/components/CapaAuto";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useClube } from "@/components/clube/ClubeContexto";
import { Carregando, ErroOuFalta } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import {
  andamento,
  andamentoDasMembros,
  quemTrouxe,
  type AndamentoMembro,
  type LivroDoClube,
  type Membro,
  encontrosDe,
  fichasComAntigas,
  fichasDoClube,
  livrosDoClube,
  media,
  modoDe,
  virgula,
} from "@/lib/clubes";
import { estrelas } from "@/lib/estantes";
import { nomeDe, useConsulta, useMeuId } from "@/lib/social";

const secao =
  "flex items-baseline justify-between border-b border-linha pb-2 lg:border-tinta";
const tituloSecao =
  "font-display text-[22px] leading-none font-semibold italic text-bordo lg:font-revista lg:text-[19px] lg:font-normal lg:text-tinta";
const linkSecao =
  "text-[10px] font-semibold tracking-[.12em] text-bordo uppercase";

export default function ClubeInicioPage() {
  const { clube, membros, papel } = useClube();
  const eu = useMeuId();
  const consulta = useConsulta(async () => {
    const [livros, encontros] = await Promise.all([
      livrosDoClube(clube.id),
      encontrosDe(clube.id),
    ]);
    const fichas = await fichasDoClube(
      livros.filter((l) => l.estado !== "sugerido").map((l) => l.id),
    );
    const daVez = livros.find((l) => l.estado === "lendo");
    const turma = daVez
      ? await andamentoDasMembros(daVez, membros, fichas).catch(
          () => new Map<string, AndamentoMembro>(),
        )
      : new Map<string, AndamentoMembro>();
    return { livros, encontros, fichas, turma };
  }, [clube.id, membros.length]);

  if (consulta.carregando && !consulta.dados)
    return <Carregando texto="abrindo o clube…" linhas={2} />;
  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { livros, encontros } = consulta.dados!;
  // as fichas do app + as antigas (da revista) de quem ainda não escreveu aqui
  const fichas = livros.flatMap((l) =>
    fichasComAntigas(
      l,
      consulta.dados!.fichas.filter((f) => f.clube_livro_id === l.id),
      membros,
    ),
  );
  const lendo = livros.find((l) => l.estado === "lendo");
  const and = lendo ? andamento(lendo) : null;
  const sugestoes = livros.filter((l) => l.estado === "sugerido");
  const quemSugeriu = lendo?.sugerido_por
    ? membros.find((m) => m.usuario_id === lendo.sugerido_por)?.pessoa
    : null;
  const proximo = encontros.find(
    (e) => new Date(e.quando).getTime() > Date.now(),
  );
  const amados = livros
    .filter((l) => l.estado === "lido")
    .map((l) => ({
      l,
      m: media(
        fichas.filter((f) => f.clube_livro_id === l.id).map((f) => f.nota),
      ),
    }))
    .filter((x) => x.m !== null)
    .sort((a, b) => b.m! - a.m!)
    .slice(0, 4);

  return (
    <div className="space-y-8 px-6 pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_380px] lg:space-y-0 lg:px-0">
      <div className="space-y-8">
        {/* a retrospectiva e a revista do clube, à vista */}
        <CartaoAnoDoClube clubeId={clube.id} />
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
            <Link
              href={`/clubes/${clube.id}/leitura`}
              className="mt-4 flex gap-4"
            >
              <CapaAuto
                livro={lendo.livro}
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
                    {quemSugeriu.id === eu
                      ? "sugestão sua"
                      : `escolha da ${nomeDe(quemSugeriu)}`}
                  </span>
                ) : null}
                {and ? (
                  <span className="mt-2.5 inline-flex min-h-6 items-center rounded-pill bg-rosa-fundo px-2.5 text-[10px] font-semibold tracking-[.1em] text-bordo uppercase">
                    {and.faltam
                      ? `faltam ${and.faltam} ${and.faltam === 1 ? "dia" : "dias"}`
                      : "último dia!"}
                  </span>
                ) : null}
              </span>
            </Link>
          ) : null}
          {lendo ? (
            <Turma membros={membros} turma={consulta.dados!.turma} eu={eu} />
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-bege p-4 lg:rounded-[4px]">
              <p className="font-display text-lg font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
                nenhuma leitura rolando
              </p>
              <p className="mt-1 text-[13px] text-cinza">
                {sugestoes.length
                  ? `${sugestoes.length} ${sugestoes.length === 1 ? "sugestão esperando" : "sugestões esperando"} ${modoDe(clube) === "votacao" ? "a votação" : "a vez"}.`
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
                    ? modoDe(clube) === "votacao"
                      ? "ver e votar"
                      : "ver a fila"
                    : "sugerir um livro"}
              </Link>
            </div>
          )}
        </section>

        <SugerirRapido
          clubeId={clube.id}
          votacao={modoDe(clube) === "votacao"}
          fila={sugestoes}
          membros={membros}
          eu={eu}
        />

        <section>
          <div className={secao}>
            <h2 className={tituloSecao}>o que a gente amou</h2>
            <Link href={`/clubes/${clube.id}/biblioteca`} className={linkSecao}>
              ver a estante →
            </Link>
          </div>
          {amados.length ? (
            <ul className="mt-4 grid grid-cols-4 gap-2.5 lg:max-w-[440px]">
              {amados.map(({ l, m }) => (
                <li key={l.id}>
                  <Link href={`/clubes/${clube.id}/livro/${l.id}`}>
                    <CapaAuto livro={l.livro} className="w-full" />
                    <span className="mt-1.5 block text-center text-[10px] text-bordo">
                      {estrelas(Math.round(m! * 2) / 2)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 font-accent text-sm italic text-cinza">
              quando o clube terminar um livro e escrever as fichas, os
              preferidos aparecem aqui.
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
                  href={
                    m.pessoa.usuario
                      ? `/clubes/${clube.id}/membro/${m.pessoa.usuario}`
                      : "#"
                  }
                  className="flex w-14 flex-col items-center gap-1.5 text-center"
                >
                  <Avatar pessoa={m.pessoa} tamanho={48} />
                  <span className="w-full truncate font-accent text-xs italic">
                    {m.usuario_id === eu
                      ? "você"
                      : m.pessoa.nome || m.pessoa.usuario}
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
                <span className="font-accent text-xs italic text-cinza">
                  convidar
                </span>
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
            <p className="mt-3 font-accent text-sm italic text-cinza">
              nada marcado ainda.
            </p>
          )}
          {lendo && and ? (
            <p className="mt-3 text-[13px] text-cinza">
              a leitura de <i>{lendo.livro.titulo}</i> termina em{" "}
              {and.fim.toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
              })}
              .
            </p>
          ) : null}
        </section>

        {fichas.length ? (
          <p className="text-[13px] text-cinza">
            média geral do clube:{" "}
            <b className="text-bordo">
              {virgula(media(fichas.map((f) => f.nota)))}★
            </b>{" "}
            em {fichas.length} {fichas.length === 1 ? "ficha" : "fichas"}
          </p>
        ) : null}
      </div>
    </div>
  );
}

const rotuloAndamento = (a?: AndamentoMembro) =>
  !a || a.estado === "nao"
    ? "ainda não começou"
    : a.estado === "terminou"
      ? "terminou ✓"
      : a.pct !== undefined
        ? `${a.pct}%`
        : "lendo";

/** As fotinhas de quem já terminou, de quem está lendo e de quem ainda não começou. */
function Turma({
  membros,
  turma,
  eu,
}: {
  membros: Membro[];
  turma: Map<string, AndamentoMembro>;
  eu: string | null;
}) {
  const ordem = { terminou: 0, lendo: 1, nao: 2 } as const;
  const lista = [...membros].sort(
    (a, b) =>
      ordem[turma.get(a.usuario_id)?.estado ?? "nao"] -
        ordem[turma.get(b.usuario_id)?.estado ?? "nao"] ||
      (turma.get(b.usuario_id)?.pct ?? 0) - (turma.get(a.usuario_id)?.pct ?? 0),
  );
  const terminaram = lista.filter(
    (m) => turma.get(m.usuario_id)?.estado === "terminou",
  ).length;
  return (
    <div className="mt-5">
      <p className="text-[11px] font-semibold tracking-[.12em] text-cinza uppercase">
        {terminaram === membros.length
          ? "todo mundo terminou ✦"
          : terminaram
            ? `${terminaram} de ${membros.length} já terminaram`
            : "como está a turma"}
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-3">
        {lista.map((m) => {
          const a = turma.get(m.usuario_id);
          const cor =
            a?.estado === "terminou"
              ? "ring-bordo"
              : a?.estado === "lendo"
                ? "ring-rosa-antigo"
                : "ring-bege opacity-60";
          return (
            <li
              key={m.usuario_id}
              className="flex w-[64px] flex-col items-center gap-1.5 text-center"
            >
              <span
                className={`relative rounded-full ring-2 ring-offset-2 ring-offset-creme ${cor}`}
              >
                <Avatar pessoa={m.pessoa} tamanho={44} />
                {a?.estado === "terminou" ? (
                  <span
                    aria-hidden
                    className="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-creme bg-bordo text-[10px] font-bold text-creme"
                  >
                    ✓
                  </span>
                ) : null}
              </span>
              <span className="w-full truncate font-accent text-xs italic">
                {m.usuario_id === eu ? "você" : m.pessoa.nome || m.pessoa.usuario}
              </span>
              <span className="-mt-1 text-[10px] leading-tight text-cinza">
                {rotuloAndamento(a)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Sugerir sem caçar botão: um campo direto no início do clube + a fila. */
function SugerirRapido({
  clubeId,
  votacao,
  fila,
  membros,
  eu,
}: {
  clubeId: string;
  votacao: boolean;
  fila: LivroDoClube[];
  membros: Membro[];
  eu: string | null;
}) {
  const router = useRouter();
  const [termo, setTermo] = useState("");
  const ir = () =>
    router.push(
      `/clubes/${clubeId}/sugerir${termo.trim() ? `?q=${encodeURIComponent(termo.trim())}` : ""}`,
    );
  return (
    <section>
      <div className={secao}>
        <h2 className={tituloSecao}>
          {votacao ? "sugestões" : "próximas leituras"}
        </h2>
        {fila.length ? (
          <Link href={`/clubes/${clubeId}/sugestoes`} className={linkSecao}>
            {votacao ? "votar →" : "ver a fila →"}
          </Link>
        ) : null}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ir();
        }}
        className="mt-4 flex gap-2"
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">que livro você quer sugerir?</span>
          <input
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="que livro você quer sugerir?"
            className="h-12 w-full rounded-[12px] border border-bege bg-creme-quente px-4 text-[15px] outline-none focus:border-bordo focus:ring-1 focus:ring-bordo lg:rounded-[4px]"
          />
        </label>
        <button
          type="submit"
          className="h-12 flex-none rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme hover:bg-bordo-suave"
        >
          sugerir
        </button>
      </form>
      {fila.length ? (
        <ul className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
          {fila.slice(0, 6).map((l) => (
            <li key={l.id} className="w-[64px] flex-none">
              <Link href={`/clubes/${clubeId}/livro/${l.id}`}>
                <CapaAuto livro={l.livro} className="w-full [&>span:last-child]:text-[8px]" />
                <span className="mt-1 block truncate text-[10px] text-cinza">
                  {(quemTrouxe(l, membros, eu) ?? "").replace(/^sugerido por /, "")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 font-accent text-[13px] italic text-cinza">
          ninguém sugeriu nada ainda. que tal começar?
        </p>
      )}
    </section>
  );
}
