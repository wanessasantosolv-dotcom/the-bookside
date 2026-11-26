"use client";

import { FeedDoClube } from "@/components/clube/FeedDoClube";
import { CapaAuto } from "@/components/CapaAuto";
import { PrateleiraMadeira } from "@/components/estantes/Biblioteca";
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
  type Encontro,
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
import { usePerfil } from "@/lib/perfil-store";
import { nomeDe, useConsulta, useMeuId } from "@/lib/social";

const titulo = "font-revista text-[22px] leading-none text-bordo italic lg:text-[24px]";
const secao = "mb-4 flex items-baseline justify-between gap-3 border-b border-linha pb-2 lg:border-fio";
const linkSecao = "flex min-h-9 items-center text-[12px] font-semibold text-bordo hover:underline";
const dataLonga = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00` : iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

function Barra({ valor, suave }: { valor: number; suave?: boolean }) {
  return (
    <span className="block h-[5px] rounded-full bg-linha" aria-hidden>
      <span className={`block h-full rounded-full ${suave ? "bg-rosa-antigo" : "bg-bordo"}`} style={{ width: `${Math.max(2, Math.min(100, valor))}%` }} />
    </span>
  );
}

const rotuloAndamento = (a?: AndamentoMembro) =>
  !a || a.estado === "nao" ? "ainda não começou" : a.estado === "terminou" ? "concluiu" : a.pct !== undefined ? `${a.pct}%` : "lendo";

const pctDe = (a?: AndamentoMembro) => (!a || a.estado === "nao" ? 0 : a.estado === "terminou" ? 100 : (a.pct ?? 0));

/** a leitura da vez: capa grande, quem escolheu, prazo, meu progresso e o da turma (separados) */
function LeituraAtual({
  lendo,
  membros,
  turma,
  eu,
  clubeId,
}: {
  lendo: LivroDoClube;
  membros: Membro[];
  turma: Map<string, AndamentoMembro>;
  eu: string | null;
  clubeId: string;
}) {
  const meusLivros = usePerfil((s) => s.livros);
  const and = andamento(lendo);
  const quem = lendo.sugerido_por ? membros.find((m) => m.usuario_id === lendo.sugerido_por)?.pessoa : null;
  const meu = meusLivros.find((l) => l.id === lendo.livro.id || l.titulo.toLowerCase() === lendo.livro.titulo.toLowerCase());
  const meuPct =
    meu?.status === "lido" ? 100 : meu?.paginas && meu.paginaAtual ? Math.min(100, Math.round((meu.paginaAtual / meu.paginas) * 100)) : null;
  const coletivo = membros.length ? Math.round(membros.reduce((t, m) => t + pctDe(turma.get(m.usuario_id)), 0) / membros.length) : null;
  return (
    <article className="flex gap-5 lg:gap-8">
      <Link href={`/clubes/${clubeId}/leitura`} className="w-[108px] flex-none lg:w-[150px]">
        <CapaAuto livro={lendo.livro} className="w-full shadow-[0_18px_30px_-18px_rgba(43,20,32,.55)] [&>span:last-child]:text-xs" />
      </Link>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-cinza">
          leitura atual{lendo.rodada ? ` · nº ${lendo.rodada}` : ""}
          {quemTrouxe(lendo, membros, eu) ? ` · ${quemTrouxe(lendo, membros, eu)}` : ""}
        </p>
        <Link href={`/clubes/${clubeId}/leitura`} className="mt-1 block font-revista text-[24px] leading-[1.1] text-ameixa hover:text-bordo lg:text-[32px]">
          {lendo.livro.titulo}
        </Link>
        <p className="mt-1 text-[14px] text-tinta-suave">{lendo.livro.autor}</p>
        {and ? (
          <p className="mt-2 text-[12px] text-cinza">
            {dataLonga(lendo.iniciado_em!)} a {dataLonga(lendo.prazo!)} ·{" "}
            <b className="font-semibold text-bordo">{and.faltam ? `${and.faltam} ${and.faltam === 1 ? "dia restante" : "dias restantes"}` : "prazo de leitura hoje"}</b>
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-6">
          <div>
            <p className="flex items-baseline justify-between text-[12px]">
              <span className="font-semibold text-ameixa">minha leitura</span>
              <span className="text-bordo tabular-nums">{meuPct !== null ? `${meuPct}%` : "—"}</span>
            </p>
            <div className="mt-1.5">
              <Barra valor={meuPct ?? 0} />
            </div>
          </div>
          {coletivo !== null ? (
            <div>
              <p className="flex items-baseline justify-between text-[12px]">
                <span className="text-tinta-suave">média dos leitores</span>
                <span className="text-tinta-suave tabular-nums">{coletivo}%</span>
              </p>
              <div className="mt-1.5">
                <Barra valor={coletivo} suave />
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link
            href={`/livro/${meu?.id ?? lendo.livro.id}/progresso`}
            className="inline-flex min-h-11 items-center rounded-full bg-bordo px-5 text-[13px] font-semibold text-creme hover:bg-bordo-suave"
          >
            registrar leitura
          </Link>
          <Link href={`/clubes/${clubeId}/leitura`} className={linkSecao}>
            ver leitura →
          </Link>
        </div>
      </div>
    </article>
  );
}

/** como está a turma: uma linha por pessoa, sem virar corrida */
function Turma({ membros, turma, eu, clubeId }: { membros: Membro[]; turma: Map<string, AndamentoMembro>; eu: string | null; clubeId: string }) {
  const [todos, setTodos] = useState(false);
  const lista = [...membros].sort((a, b) =>
    (a.usuario_id === eu ? -1 : b.usuario_id === eu ? 1 : 0) || (a.pessoa.nome ?? "").localeCompare(b.pessoa.nome ?? ""),
  );
  const visiveis = todos ? lista : lista.slice(0, 8);
  const terminaram = membros.filter((m) => turma.get(m.usuario_id)?.estado === "terminou").length;
  return (
    <section aria-labelledby="t-turma">
      <div className={secao}>
        <h2 id="t-turma" className={titulo}>
          progresso dos leitores
        </h2>
        <span className="text-[12px] text-cinza">
          {terminaram} de {membros.length} {terminaram === 1 ? "concluiu" : "concluíram"}
        </span>
      </div>
      {/* discreto: avatar pequeno, nome e um fio fino de progresso, sem bordas entre as pessoas */}
      <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        {visiveis.map((m) => {
          const a = turma.get(m.usuario_id);
          return (
            <li key={m.usuario_id} className="flex min-w-0 items-center gap-2">
              <Link href={m.pessoa.usuario ? `/clubes/${clubeId}/membro/${m.pessoa.usuario}` : "#"} className="flex-none">
                <Avatar pessoa={m.pessoa} tamanho={22} />
              </Link>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-1.5 text-[12px] leading-tight">
                  <span className="truncate text-tinta-suave">{m.usuario_id === eu ? "você" : nomeDe(m.pessoa)}</span>
                  <span className={`flex-none text-[11px] ${a?.estado === "terminou" ? "text-bordo" : "text-cinza"}`}>
                    {!a || a.estado === "nao" ? "—" : rotuloAndamento(a)}
                  </span>
                </span>
                <span className="mt-1 block h-px bg-linha" aria-hidden>
                  <span className="block h-full bg-rosa-antigo" style={{ width: `${pctDe(a)}%` }} />
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      {lista.length > 8 && !todos ? (
        <button type="button" onClick={() => setTodos(true)} className={`${linkSecao} mt-2`}>
          ver mais {lista.length - 8} {lista.length - 8 === 1 ? "membro" : "membros"}
        </button>
      ) : null}
    </section>
  );
}

function ProximoEncontro({ encontro, clubeId }: { encontro: Encontro; clubeId: string }) {
  const d = new Date(encontro.quando);
  const link = encontro.local && /^https?:\/\//.test(encontro.local) ? encontro.local : null;
  return (
    <section aria-labelledby="t-encontro">
      <div className={secao}>
        <h2 id="t-encontro" className={titulo}>
          próximo encontro
        </h2>
        <Link href={`/clubes/${clubeId}/agenda`} className={linkSecao}>
          calendário do clube
        </Link>
      </div>
      <div className="flex gap-4">
        <span className="flex w-[64px] flex-none flex-col items-center rounded-[8px] bg-rosa-fundo py-2 text-bordo">
          <span className="font-revista text-[28px] leading-none">{d.getDate()}</span>
          <span className="text-[11px]">{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
        </span>
        <span className="min-w-0">
          <span className="block text-[15px] font-semibold text-ameixa">{encontro.titulo}</span>
          <span className="mt-0.5 block text-[13px] text-tinta-suave">
            {d.toLocaleDateString("pt-BR", { weekday: "long" })} · {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {encontro.local ? (
            link ? (
              <a href={link} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-9 items-center text-[13px] font-semibold text-bordo hover:underline">
                entrar no encontro →
              </a>
            ) : (
              <span className="mt-0.5 block text-[13px] text-cinza">{encontro.local}</span>
            )
          ) : null}
        </span>
      </div>
    </section>
  );
}

export default function ClubeInicioPage() {
  const { clube, membros, papel } = useClube();
  const eu = useMeuId();
  const [qual, setQual] = useState(0);
  const consulta = useConsulta(async () => {
    const [livros, encontros] = await Promise.all([livrosDoClube(clube.id), encontrosDe(clube.id)]);
    const fichas = await fichasDoClube(livros.filter((l) => l.estado !== "sugerido").map((l) => l.id));
    const ativos = livros.filter((l) => l.estado === "lendo");
    const turmas = await Promise.all(
      ativos.map((l) => andamentoDasMembros(l, membros, fichas).catch(() => new Map<string, AndamentoMembro>())),
    );
    return { livros, encontros, fichas, turmas };
  }, [clube.id, membros.length]);

  if (consulta.carregando && !consulta.dados) return <Carregando texto="abrindo o clube…" linhas={2} />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { livros, encontros, turmas } = consulta.dados!;
  const fichas = livros.flatMap((l) =>
    fichasComAntigas(l, consulta.dados!.fichas.filter((f) => f.clube_livro_id === l.id), membros),
  );
  const ativos = livros.filter((l) => l.estado === "lendo");
  const i = Math.min(qual, Math.max(0, ativos.length - 1));
  const lendo = ativos[i];
  const turma = turmas[i] ?? new Map<string, AndamentoMembro>();
  const sugestoes = livros.filter((l) => l.estado === "sugerido");
  const proximo = encontros.filter((e) => new Date(e.quando).getTime() > Date.now()).sort((a, b) => a.quando.localeCompare(b.quando))[0];

  // "o que a gente amou": os escolhidos (se houver) ou os de nota mais alta
  const comNota = livros
    .filter((l) => l.estado === "lido")
    .map((l) => {
      const fs = fichas.filter((f) => f.clube_livro_id === l.id && f.nota);
      return { l, m: media(fs.map((f) => f.nota)), n: fs.length };
    });
  const escolhidos = (clube.favoritos ?? []).map((id) => comNota.find((x) => x.l.id === id)).filter((x): x is (typeof comNota)[number] => !!x);
  const amados = (escolhidos.length ? escolhidos : comNota.filter((x) => x.m !== null).sort((a, b) => b.m! - a.m!)).slice(0, 5);

  const leitura = lendo ? (
    <section aria-label="leitura atual">
      {ativos.length > 1 ? (
        <div role="tablist" aria-label="leituras em andamento" className="mb-4 flex gap-4 text-[13px]">
          {ativos.map((l, k) => (
            <button
              key={l.id}
              role="tab"
              type="button"
              aria-selected={k === i}
              onClick={() => setQual(k)}
              className={`min-h-9 max-w-[220px] truncate border-b-2 ${k === i ? "border-bordo font-semibold text-bordo" : "border-transparent text-cinza"}`}
            >
              {l.livro.titulo}
            </button>
          ))}
        </div>
      ) : null}
      <LeituraAtual lendo={lendo} membros={membros} turma={turma} eu={eu} clubeId={clube.id} />
    </section>
  ) : (
    <section aria-label="leitura atual" className="rounded-[10px] bg-rosa-fundo px-5 py-6">
      <p className="font-revista text-[22px] text-ameixa italic">qual será a próxima leitura?</p>
      <p className="mt-1 text-[14px] text-tinta-suave">
        {sugestoes.length
          ? `${sugestoes.length} ${sugestoes.length === 1 ? "livro sugerido" : "livros sugeridos"} ${modoDe(clube) === "votacao" ? "em votação" : "na fila"}.`
          : organiza(papel)
            ? "escolham um livro para começar uma nova história juntos."
            : "compartilhe uma sugestão com o clube."}
      </p>
      <Link
        href={`/clubes/${clube.id}/${organiza(papel) ? "escolher" : sugestoes.length ? "sugestoes" : "sugerir"}`}
        className="mt-4 inline-flex min-h-11 items-center rounded-full bg-bordo px-5 text-[13px] font-semibold text-creme"
      >
        {organiza(papel) ? "definir próxima leitura" : sugestoes.length ? (modoDe(clube) === "votacao" ? "votar nos sugeridos" : "ver próximas leituras") : "sugerir livro"}
      </Link>
    </section>
  );

  const quemEsta = (
    <section aria-labelledby="t-quem">
      <div className={secao}>
        <h2 id="t-quem" className={titulo}>
          membros do clube
        </h2>
        <Link href={`/clubes/${clube.id}/membros`} className={linkSecao}>
          ver todos
        </Link>
      </div>
      <ul className="flex flex-wrap gap-3">
        {membros.slice(0, 12).map((m) => (
          <li key={m.usuario_id}>
            <Link
              href={m.pessoa.usuario ? `/clubes/${clube.id}/membro/${m.pessoa.usuario}` : "#"}
              title={m.usuario_id === eu ? "você" : nomeDe(m.pessoa)}
              aria-label={m.usuario_id === eu ? "você" : nomeDe(m.pessoa)}
            >
              <Avatar pessoa={m.pessoa} tamanho={40} />
            </Link>
          </li>
        ))}
        {membros.length > 12 ? (
          <li>
            <Link href={`/clubes/${clube.id}/membros`} className="flex size-10 items-center justify-center rounded-full bg-rosa-fundo text-[12px] font-semibold text-bordo">
              +{membros.length - 12}
            </Link>
          </li>
        ) : null}
        <li>
          <Link
            href={`/clubes/${clube.id}/convidar`}
            aria-label="convidar membros"
            className="flex size-10 items-center justify-center rounded-full border border-dashed border-rosa-antigo text-[18px] text-bordo"
          >
            +
          </Link>
        </li>
      </ul>
    </section>
  );

  const amamos = (
    <section aria-labelledby="t-amou">
      <div className={secao}>
        <h2 id="t-amou" className={titulo}>
          favoritos do clube
        </h2>
        <Link href={organiza(papel) ? `/clubes/${clube.id}/favoritos` : `/clubes/${clube.id}/biblioteca`} className={linkSecao}>
          {organiza(papel) ? "editar destaques" : "nossa estante"}
        </Link>
      </div>
      {amados.length ? (
        <>
          <p className="mb-2 text-[12px] text-cinza">{escolhidos.length ? "escolhidos pelo clube" : "mais bem avaliados nas fichas de leitura"}</p>
          <div className="flex items-end gap-4 overflow-x-auto px-3 pt-2 [scrollbar-width:none]">
            {amados.map(({ l }) => (
              <Link key={l.id} href={`/clubes/${clube.id}/livro/${l.id}`} className="w-[84px] flex-none transition-transform hover:-translate-y-1 lg:w-[104px]">
                <CapaAuto livro={l.livro} className="w-full [&>span:last-child]:hidden" />
              </Link>
            ))}
          </div>
          <PrateleiraMadeira className="relative -mt-[5px]" />
          <ul className="mt-2 flex gap-4 overflow-hidden px-3 text-[12px] text-tinta-suave">
            {amados.map(({ l, m, n }) => (
              <li key={l.id} className="w-[84px] flex-none text-center lg:w-[104px]" title={n ? `${n} ${n === 1 ? "ficha de leitura" : "fichas de leitura"}` : undefined}>
                {m !== null ? `${virgula(m)}★` : "—"}
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-[13px] text-cinza">os favoritos aparecem aqui quando o clube concluir uma leitura e preencher as fichas.</p>
      )}
    </section>
  );

  return (
    <div className="grid gap-10 px-5 pt-6 lg:grid-cols-[minmax(0,1.85fr)_minmax(300px,1fr)] lg:gap-14 lg:px-0 lg:pt-8">
      <div className="min-w-0 space-y-10">
        {leitura}
        {lendo ? <Turma membros={membros} turma={turma} eu={eu} clubeId={clube.id} /> : null}
        {amamos}
        {/* no celular, o encontro vem logo depois da turma */}
        {proximo ? (
          <div className="lg:hidden">
            <ProximoEncontro encontro={proximo} clubeId={clube.id} />
          </div>
        ) : null}
        <section id="novidades" aria-labelledby="t-rolando" className="scroll-mt-24">
          <div className={secao}>
            <h2 id="t-rolando" className={titulo}>
              atividade recente
            </h2>
          </div>
          <FeedDoClube limite={5} />
        </section>
      </div>
      <aside className="min-w-0 space-y-10">
        {proximo ? (
          <div className="hidden lg:block">
            <ProximoEncontro encontro={proximo} clubeId={clube.id} />
          </div>
        ) : null}
        {quemEsta}
        <SugerirRapido clubeId={clube.id} votacao={modoDe(clube) === "votacao"} fila={sugestoes} membros={membros} eu={eu} />
      </aside>
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
          {votacao ? "livros sugeridos" : "próximas leituras"}
        </p>
        {fila.length ? (
          <Link href={`/clubes/${clubeId}/sugestoes`} className={linkSecao}>
            {votacao ? "votar →" : "organizar fila →"}
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
            placeholder="buscar livro para sugerir"
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
