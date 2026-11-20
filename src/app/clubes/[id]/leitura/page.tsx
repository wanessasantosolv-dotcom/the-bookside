"use client";

import { CapaAuto } from "@/components/CapaAuto";
import { Animacao } from "@/components/Animacao";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useClube } from "@/components/clube/ClubeContexto";
import { botaoContorno } from "@/components/clube/Pecas";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import {
  andamento,
  encerrarLeitura,
  fichasDe,
  livrosDoClube,
  marcarMarca,
  marcarProgresso,
  progressoDe,
  type StatusLeitura,
  type UnidadeMarca,
  organiza,
} from "@/lib/clubes";
import { nomeDe, useConsulta, useMeuId } from "@/lib/social";

export default function LeituraPage() {
  const { clube, membros, papel } = useClube();
  const eu = useMeuId();
  const router = useRouter();
  const [unidadeMarca, setUnidadeMarca] = useState<UnidadeMarca>("pagina");
  const [numeroMarca, setNumeroMarca] = useState<string>("");
  const [editandoMarca, setEditandoMarca] = useState(false);
  const consulta = useConsulta(async () => {
    const livros = await livrosDoClube(clube.id);
    const lendo = livros.find((l) => l.estado === "lendo") ?? null;
    const [fichas, progresso] = lendo
      ? await Promise.all([fichasDe(lendo.id), progressoDe(lendo.id)])
      : [[], []];
    return { livros, lendo, fichas, progresso };
  }, [clube.id]);

  if (consulta.carregando && !consulta.dados)
    return (
      <Animacao
        tipo="marcador"
        titulo="separando sua página"
        sub="onde vocês pararam no livro"
      />
    );
  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { livros, lendo, fichas, progresso } = consulta.dados!;
  const sugestoes = livros
    .filter((l) => l.estado === "sugerido")
    .sort((a, b) => b.votos.length - a.votos.length);
  const moderadora = organiza(papel);

  if (!lendo)
    return (
      <div className="px-6 pt-6 lg:max-w-[640px] lg:px-0">
        <h2 className="font-display text-[26px] font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
          nenhuma leitura rolando
        </h2>
        {moderadora ? (
          <Vazio
            className="mt-5"
            titulo="escolha o livro da vez"
            texto={
              sugestoes.length
                ? `pegue uma das ${sugestoes.length} sugestões do clube, sorteie, ou busque qualquer livro.`
                : "busque qualquer livro e marque o prazo. ninguém precisa sugerir antes."
            }
            acao={{
              href: `/clubes/${clube.id}/escolher`,
              rotulo: "escolher o livro",
            }}
          />
        ) : (
          <Vazio
            className="mt-5"
            titulo="a próxima leitura sai das sugestões"
            texto="vote nas sugestões do clube. quem modera escolhe a mais votada (ou sorteia)."
            acao={{
              href: `/clubes/${clube.id}/sugestoes`,
              rotulo: "ver e votar",
            }}
          />
        )}
      </div>
    );

  const and = andamento(lendo);
  const quem = lendo.sugerido_por
    ? membros.find((m) => m.usuario_id === lendo.sugerido_por)?.pessoa
    : null;
  const minha = fichas.find((f) => f.autor === eu);
  const marcas = and
    ? Array.from(
        new Set([
          1,
          ...[0.2, 0.4, 0.6, 0.8].map((x) =>
            Math.max(1, Math.round(and.total * x)),
          ),
          and.total,
        ]),
      )
    : [];

  // status de cada um: o que a pessoa marcou manda sempre (dá pra voltar atrás a qualquer momento);
  // só cai pra "terminei" sozinho quando ela já entregou a ficha antes de existir esse marcador.
  const statusDe = (usuarioId: string): StatusLeitura =>
    progresso.find((p) => p.usuario_id === usuarioId)?.status ??
    (fichas.some((f) => f.autor === usuarioId) ? "terminei" : "nao_comecei");
  const meuStatus = statusDe(eu ?? "");
  const grupos = {
    terminei: membros.filter((m) => statusDe(m.usuario_id) === "terminei"),
    lendo: membros.filter((m) => statusDe(m.usuario_id) === "lendo"),
    nao_comecei: membros.filter(
      (m) => statusDe(m.usuario_id) === "nao_comecei",
    ),
  };
  const PILLS: { v: StatusLeitura; rotulo: string; icone: ReactNode }[] = [
    {
      v: "nao_comecei",
      rotulo: "ainda não comecei",
      icone: (
        <svg width="16" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 3a2 2 0 0 0-2 2v16l8-5.5L20 21V5a2 2 0 0 0-2-2Z" />
        </svg>
      ),
    },
    {
      v: "lendo",
      rotulo: "estou lendo",
      icone: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 19.5V5.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v14" />
          <path d="M6.5 22a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2H19" />
        </svg>
      ),
    },
    {
      v: "terminei",
      rotulo: "terminei",
      icone: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ),
    },
  ];
  const meuProgresso = progresso.find((p) => p.usuario_id === eu);

  function abrirMarca() {
    setUnidadeMarca(meuProgresso?.unidade ?? "pagina");
    setNumeroMarca(
      meuProgresso?.numero != null ? String(meuProgresso.numero) : "",
    );
    setEditandoMarca(true);
  }

  async function salvarMarca() {
    const n = Number(numeroMarca);
    if (!numeroMarca || Number.isNaN(n) || n < 0 || !lendo) return;
    await marcarMarca(lendo.id, unidadeMarca, Math.round(n));
    setEditandoMarca(false);
    consulta.recarregar();
  }

  return (
    <div className="px-6 pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 lg:px-0">
      <div>
        <p className="text-[10px] font-semibold tracking-[.16em] text-rosa-antigo uppercase">
          lendo agora{lendo.rodada ? ` · rodada ${lendo.rodada}` : ""}
        </p>
        <div className="mt-3 flex gap-4">
          <CapaAuto
            livro={lendo.livro}
            className="w-[110px] -rotate-1 [&>span:last-child]:text-sm"
          />
          <div className="min-w-0 pt-1">
            <h2 className="font-display text-[26px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
              {lendo.livro.titulo}
            </h2>
            <p className="mt-1.5 text-[13px] text-cinza">
              {lendo.livro.autor}
              {lendo.livro.paginas ? ` · ${lendo.livro.paginas} páginas` : ""}
            </p>
            {quem ? (
              <p className="mt-2 font-accent text-sm italic text-cinza">
                sugerido {quem.id === eu ? "por você" : `pela ${nomeDe(quem)}`}
              </p>
            ) : null}
          </div>
        </div>

        {and ? (
          <section className="mt-7" aria-label="prazo da leitura">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-xl font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
                dia {and.dia} de {and.total}
              </p>
              <p className="text-[10px] font-semibold tracking-[.14em] text-cinza uppercase">
                prazo da leitura
              </p>
            </div>
            <div
              className="relative mt-3 h-2 rounded-full bg-rosa-fundo"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={and.total}
              aria-valuenow={and.dia}
            >
              <i
                className="absolute inset-y-0 left-0 rounded-full bg-bordo"
                style={{ width: `${(and.dia / and.total) * 100}%` }}
              />
            </div>
            <div className="relative mt-1.5 h-4 text-[10px] text-cinza">
              {marcas.map((m) => (
                <span
                  key={m}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${((m - 0.5) / and.total) * 100}%` }}
                >
                  {String(m).padStart(2, "0")}
                </span>
              ))}
            </div>
            <p className="mt-3 font-accent text-sm italic text-cinza">
              começou{" "}
              {and.inicio.toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
              })}{" "}
              · termina{" "}
              {and.fim.toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
              })}{" "}
              ✦
            </p>
          </section>
        ) : null}

        <section className="mt-9 rounded-[10px] border border-linha p-[26px]">
          <p className="text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
            sua leitura
          </p>
          <h3 className="mt-2 font-revista text-[21px] leading-[1.3] text-ameixa italic lg:font-display lg:font-semibold lg:not-italic lg:text-bordo">
            em que pé você está?
          </h3>
          <fieldset className="mt-5 flex gap-7">
            <legend className="sr-only">em que pé você está na leitura</legend>
            {PILLS.map((p) => {
              const on = meuStatus === p.v;
              return (
                <button
                  key={p.v}
                  type="button"
                  aria-pressed={on}
                  onClick={async () => {
                    await marcarProgresso(lendo.id, p.v);
                    consulta.recarregar();
                  }}
                  className={`flex flex-col items-center gap-1.5 ${on ? "font-semibold text-bordo" : "text-cinza"}`}
                >
                  <span
                    className={`flex h-[46px] w-[46px] items-center justify-center rounded-full border-[1.5px] ${
                      on
                        ? "border-bordo bg-bordo text-creme"
                        : "border-linha text-bordo"
                    }`}
                  >
                    {p.icone}
                  </span>
                  <span className="text-[10.5px] font-semibold tracking-[.02em]">
                    {p.rotulo}
                  </span>
                </button>
              );
            })}
          </fieldset>

          {meuStatus === "lendo" ? (
            <div className="mt-5 border-t border-linha pt-5">
              {!editandoMarca ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] text-cinza">
                    {meuProgresso?.numero != null
                      ? `você está n${meuProgresso.unidade === "capitulo" ? "o capítulo" : "a página"} ${meuProgresso.numero}`
                      : "ainda não marcou em que página ou capítulo está"}
                  </p>
                  <button
                    type="button"
                    onClick={abrirMarca}
                    className="shrink-0 text-xs font-semibold text-bordo underline underline-offset-4"
                  >
                    {meuProgresso?.numero != null ? "atualizar" : "marcar"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex rounded-full border border-linha p-0.5">
                    {(["pagina", "capitulo"] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnidadeMarca(u)}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          unidadeMarca === u
                            ? "bg-bordo text-creme"
                            : "text-cinza"
                        }`}
                      >
                        {u === "pagina" ? "página" : "capítulo"}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    autoFocus
                    value={numeroMarca}
                    onChange={(e) => setNumeroMarca(e.target.value)}
                    placeholder={
                      unidadeMarca === "pagina"
                        ? "nº da página"
                        : "nº do capítulo"
                    }
                    className="h-9 w-28 rounded-sm border border-bege bg-creme-quente px-2.5 text-sm outline-none focus:border-bordo focus:ring-1 focus:ring-bordo"
                  />
                  <button
                    type="button"
                    onClick={salvarMarca}
                    className="rounded-sm bg-bordo px-3.5 py-1.5 text-xs font-semibold text-creme"
                  >
                    salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditandoMarca(false)}
                    className="text-xs font-semibold text-cinza"
                  >
                    cancelar
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {meuStatus === "terminei" ? (
            <Link
              href={`/clubes/${clube.id}/ficha/${lendo.id}`}
              className="mt-6 flex h-[54px] items-center justify-between rounded-md bg-bordo px-[22px] text-[13px] font-semibold text-creme"
            >
              <span>
                {minha ? "editar minha ficha ✎" : "escrever minha ficha ✎"}
              </span>
              <span aria-hidden>→</span>
            </Link>
          ) : (
            <p className="mt-6 font-accent text-sm leading-[1.5] text-cinza italic">
              quando marcar{" "}
              <b className="font-semibold not-italic text-ameixa">terminei</b>,
              sua ficha desbloqueia aqui ✦
            </p>
          )}
        </section>

        {moderadora ? (
          <div className="mt-4">
            <Link
              href={`/clubes/${clube.id}/escolher`}
              className={botaoContorno}
            >
              trocar livro
            </Link>
          </div>
        ) : null}
        {moderadora ? (
          <button
            type="button"
            onClick={async () => {
              if (
                !confirm(
                  `encerrar a leitura de ${lendo.livro.titulo}? ela vai para os lidos do clube.`,
                )
              )
                return;
              await encerrarLeitura(lendo.id);
              router.push(`/clubes/${clube.id}/concluido/${lendo.id}`);
            }}
            className="mt-3 min-h-11 text-xs font-semibold text-cinza underline underline-offset-4 hover:text-bordo"
          >
            encerrar esta leitura
          </button>
        ) : null}
      </div>

      <aside className="mt-8 lg:mt-0">
        <div className="rounded-xl border border-linha p-4 lg:rounded-[10px] lg:p-[22px]">
          <div className="flex items-baseline justify-between">
            <p className="font-revista text-[19px] text-ameixa italic lg:font-display lg:font-semibold lg:not-italic lg:text-tinta">
              progresso do grupo
            </p>
            <span className="font-maquina text-[11px] font-bold text-cinza">
              {grupos.terminei.length} de {membros.length}
            </span>
          </div>

          <div className="mt-[18px] mb-[22px] flex items-center gap-4">
            <AnelProgresso
              pct={membros.length ? grupos.terminei.length / membros.length : 0}
            />
            <p className="text-[12.5px] leading-[1.4] text-cinza">
              <b className="text-ameixa">
                {grupos.terminei.length} de {membros.length}
              </b>{" "}
              já {grupos.terminei.length === 1 ? "terminou" : "terminaram"} a
              leitura
              {grupos.lendo.length || grupos.nao_comecei.length
                ? ` — falta ${[...grupos.lendo, ...grupos.nao_comecei].map((m) => (m.usuario_id === eu ? "você" : nomeDe(m.pessoa))).join(", ")} ✦`
                : " ✦"}
            </p>
          </div>

          {(
            [
              ["terminei", "terminaram", "#6B7A5E"],
              ["lendo", "lendo", "#B75A6B"],
              ["nao_comecei", "ainda não começaram", "#D8C3AA"],
            ] as const
          ).map(([chave, rotulo, cor]) => {
            const lista = grupos[chave];
            if (!lista.length) return null;
            return (
              <div
                key={chave}
                className="border-t border-linha pt-3 pb-1 first:border-t-0 first:pt-0"
              >
                <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[.1em] text-cinza uppercase">
                  <span
                    aria-hidden
                    className="h-[7px] w-[7px] rounded-full"
                    style={{ background: cor }}
                  />
                  {rotulo} · {lista.length}
                </p>
                <ul className="mt-2 space-y-2">
                  {lista.map((m) => {
                    const f = fichas.find((x) => x.autor === m.usuario_id);
                    const p = progresso.find(
                      (x) => x.usuario_id === m.usuario_id,
                    );
                    const marca =
                      chave === "lendo" && p?.numero != null
                        ? `${p.unidade === "capitulo" ? "cap." : "pág."} ${p.numero}`
                        : null;
                    return (
                      <li
                        key={m.usuario_id}
                        className="flex items-center gap-2.5 text-[13px]"
                      >
                        <Avatar pessoa={m.pessoa} tamanho={26} />
                        <span className="flex-1 truncate">
                          {m.usuario_id === eu ? "você" : nomeDe(m.pessoa)}
                        </span>
                        <span className="font-revista text-xs text-cinza italic">
                          {f
                            ? "escreveu a ficha"
                            : (marca ?? (chave === "lendo" ? "lendo…" : ""))}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {fichas.length ? (
            <Link
              href={`/clubes/${clube.id}/livro/${lendo.id}`}
              className="mt-4 inline-flex min-h-9 items-center text-xs font-semibold text-bordo underline underline-offset-4"
            >
              ler as fichas →
            </Link>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

/** Anelzinho com o % do clube que já terminou a leitura da vez. */
function AnelProgresso({ pct }: { pct: number }) {
  const r = 27;
  const volta = 2 * Math.PI * r;
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      className="flex-none"
      role="img"
      aria-label={`${Math.round(pct * 100)}% do clube terminou`}
    >
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="#F6E3E7"
        strokeWidth="7"
      />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="#8E1D3D"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={volta}
        strokeDashoffset={volta * (1 - pct)}
        transform="rotate(-90 32 32)"
      />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fontStyle="italic"
        fontWeight="700"
        fontSize="15"
        fill="#2B1420"
        fontFamily="var(--font-revista), serif"
      >
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}
