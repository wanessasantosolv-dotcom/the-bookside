"use client";

import { FeedDoClube } from "@/components/clube/FeedDoClube";
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
  organiza,
} from "@/lib/clubes";
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
  // "o que a gente amou": os escolhidos (se houver) ou os de nota mais alta
  const comNota = livros
    .filter((l) => l.estado === "lido")
    .map((l) => ({
      l,
      m: media(
        fichas.filter((f) => f.clube_livro_id === l.id).map((f) => f.nota),
      ),
    }));
  const escolhidos = (clube.favoritos ?? [])
    .map((id) => comNota.find((x) => x.l.id === id))
    .filter((x): x is (typeof comNota)[number] => !!x);
  const amados = escolhidos.length
    ? escolhidos
    : comNota
        .filter((x) => x.m !== null)
        .sort((a, b) => b.m! - a.m!)
        .slice(0, 4);

  return (
    <div className="space-y-7 px-6 pt-6 lg:mx-auto lg:max-w-[760px] lg:space-y-7 lg:px-0">
      {/* ===== lendo agora + a turma, num card só ===== */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-bordo to-bordo-escuro px-5 py-5 text-creme lg:rounded-[4px] lg:px-7 lg:py-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold tracking-[.16em] text-rosa-claro uppercase">
            lendo agora{lendo?.rodada ? ` · nº ${lendo.rodada}` : ""}
          </span>
          {and ? (
            <span className="flex-none rounded-pill bg-creme/15 px-2.5 py-1 text-[10px] font-semibold text-rosa-claro">
              {and.faltam
                ? `faltam ${and.faltam} ${and.faltam === 1 ? "dia" : "dias"}`
                : "último dia!"}
            </span>
          ) : null}
        </div>

        {lendo ? (
          <>
            <Link
              href={`/clubes/${clube.id}/leitura`}
              className="mt-4 flex gap-4"
            >
              <CapaAuto
                livro={lendo.livro}
                className="w-[72px] -rotate-1 [&>span:last-child]:text-xs"
              />
              <span className="min-w-0 pt-1">
                <span className="block font-display text-xl leading-tight font-semibold italic lg:font-revista lg:font-normal">
                  {lendo.livro.titulo}
                </span>
                <span className="mt-1.5 block text-[10px] font-semibold tracking-[.16em] text-rosa-claro/80 uppercase">
                  {lendo.livro.autor}
                </span>
                {quemSugeriu ? (
                  <span className="mt-2.5 block font-accent text-sm italic text-rosa-claro/90">
                    {quemSugeriu.id === eu
                      ? "sugestão sua"
                      : `escolha da ${nomeDe(quemSugeriu)}`}
                  </span>
                ) : null}
              </span>
            </Link>
            <div className="mt-4 border-t border-creme/15 pt-4">
              <Turma
                membros={membros}
                turma={consulta.dados!.turma}
                eu={eu}
                escura
              />
            </div>
          </>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-creme/30 p-4">
            <p className="font-display text-lg font-semibold italic lg:font-revista lg:font-normal">
              nenhuma leitura rolando
            </p>
            <p className="mt-1 text-[13px] text-rosa-claro/80">
              {sugestoes.length
                ? `${sugestoes.length} ${sugestoes.length === 1 ? "sugestão esperando" : "sugestões esperando"} ${modoDe(clube) === "votacao" ? "a votação" : "a vez"}.`
                : organiza(papel)
                  ? "escolha qualquer livro para começar a primeira rodada."
                  : "sugira um livro para começar a primeira rodada."}
            </p>
            <Link
              href={`/clubes/${clube.id}/${organiza(papel) ? "escolher" : sugestoes.length ? "sugestoes" : "sugerir"}`}
              className="mt-3 inline-flex min-h-11 items-center rounded-pill bg-creme px-5 text-[13px] font-semibold text-bordo"
            >
              {organiza(papel)
                ? "escolher o livro da vez"
                : sugestoes.length
                  ? modoDe(clube) === "votacao"
                    ? "ver e votar"
                    : "ver a fila"
                  : "sugerir um livro"}
            </Link>
          </div>
        )}
      </div>

      {/* ===== quem tá no clube — rolagem horizontal, bem mais em cima ===== */}
      <section>
        <div className={secao}>
          <h2 className={tituloSecao}>quem tá no clube</h2>
          <span className="text-[10px] font-semibold tracking-[.12em] text-rosa-antigo uppercase">
            {membros.length} {membros.length === 1 ? "pessoa" : "pessoas"}
          </span>
        </div>
        <ul className="mt-4 flex gap-4 overflow-x-auto pb-1">
          {membros.map((m) => (
            <li key={m.usuario_id} className="flex-none">
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
          <li className="flex-none">
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

      {/* ===== o que a gente amou ===== */}
      <Link
        href={
          organiza(papel)
            ? `/clubes/${clube.id}/favoritos`
            : `/clubes/${clube.id}/biblioteca`
        }
        className="block rounded-xl border border-linha bg-creme-quente p-3.5 hover:border-bordo lg:rounded-[4px] lg:border-fio lg:bg-transparent"
      >
        <span className="block text-[9.5px] font-semibold tracking-[.14em] text-bordo uppercase">
          o que a gente amou
        </span>
        {amados.length ? (
          <span className="mt-1.5 flex items-center gap-3">
            <span className="flex -space-x-2">
              {amados.slice(0, 3).map(({ l }) => (
                <CapaAuto
                  key={l.id}
                  livro={l.livro}
                  className="w-7 rounded-[3px] ring-2 ring-creme-quente [&>span:last-child]:hidden"
                />
              ))}
            </span>
            {fichas.length ? (
              <span className="text-[11px] text-cinza">
                {virgula(media(fichas.map((f) => f.nota)))}★ em {fichas.length}{" "}
                {fichas.length === 1 ? "ficha" : "fichas"}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="mt-1.5 block font-accent text-[13px] italic text-cinza">
            ainda nada →
          </span>
        )}
      </Link>

      <SugerirRapido
        clubeId={clube.id}
        votacao={modoDe(clube) === "votacao"}
        fila={sugestoes}
        membros={membros}
        eu={eu}
      />

      <section id="novidades" className="scroll-mt-24">
        <div className={secao}>
          <h2 className={tituloSecao}>o que está rolando</h2>
        </div>
        <div className="mt-4">
          <FeedDoClube />
        </div>
      </section>
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
  escura = false,
}: {
  membros: Membro[];
  turma: Map<string, AndamentoMembro>;
  eu: string | null;
  escura?: boolean;
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
    <div>
      <p
        className={`text-[11px] font-semibold tracking-[.12em] uppercase ${escura ? "text-rosa-claro/80" : "text-cinza"}`}
      >
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
                : escura
                  ? "ring-creme/30"
                  : "ring-bege opacity-60";
          return (
            <li
              key={m.usuario_id}
              className="flex w-[64px] flex-col items-center gap-1.5 text-center"
            >
              <span
                className={`relative rounded-full ring-2 ring-offset-2 ${escura ? "ring-offset-bordo-escuro" : "ring-offset-creme"} ${cor}`}
              >
                <Avatar pessoa={m.pessoa} tamanho={44} />
                {a?.estado === "terminou" ? (
                  <span
                    aria-hidden
                    className={`absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 text-[10px] font-bold ${escura ? "border-bordo-escuro bg-creme text-bordo" : "border-creme bg-bordo text-creme"}`}
                  >
                    ✓
                  </span>
                ) : null}
              </span>
              <span
                className={`w-full truncate font-accent text-xs italic ${escura ? "text-creme" : ""}`}
              >
                {m.usuario_id === eu
                  ? "você"
                  : m.pessoa.nome || m.pessoa.usuario}
              </span>
              <span
                className={`-mt-1 text-[10px] leading-tight ${escura ? "text-rosa-claro/70" : "text-cinza"}`}
              >
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
      <div className="flex items-baseline justify-between">
        <p className="text-[10px] font-semibold tracking-[.16em] text-bordo uppercase">
          {votacao ? "sugestões" : "próximas leituras"}
        </p>
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
        className="mt-2.5 flex h-11 items-center gap-1.5 rounded-pill border border-linha pr-1.5 pl-4 lg:rounded-[4px] lg:border-fio"
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">que livro você quer sugerir?</span>
          <input
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="sugerir um livro…"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-cinza"
          />
        </label>
        <button
          type="submit"
          className="flex h-8 flex-none items-center rounded-pill bg-bordo px-3.5 text-[11px] font-semibold text-creme hover:bg-bordo-suave"
        >
          sugerir
        </button>
      </form>
      {fila.length ? (
        <ul className="mt-3 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
          {fila.slice(0, 6).map((l) => (
            <li key={l.id} className="w-[64px] flex-none">
              <Link href={`/clubes/${clubeId}/livro/${l.id}`}>
                <CapaAuto
                  livro={l.livro}
                  className="w-full [&>span:last-child]:text-[8px]"
                />
                <span className="mt-1 block truncate text-[10px] text-cinza">
                  {(quemTrouxe(l, membros, eu) ?? "").replace(
                    /^sugerido por /,
                    "",
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
