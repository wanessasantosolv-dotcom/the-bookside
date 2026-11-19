"use client";

import { CapaAuto } from "@/components/CapaAuto";
import { Animacao } from "@/components/Animacao";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useClube } from "@/components/clube/ClubeContexto";
import { botaoContorno, Rodape, TopoForm } from "@/components/clube/Pecas";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import {
  criterios,
  fichasComAntigas,
  fichasDe,
  pessoaDaFicha,
  livroDoClube,
  media,
  virgula,
  type Ficha,
} from "@/lib/clubes";
import { estrelas } from "@/lib/estantes";
import { nomeDe, useConsulta, useMeuId, type PessoaResumo } from "@/lib/social";

const rotuloFicha =
  "font-maquina text-[9px] font-semibold tracking-[.1em] text-bordo-suave uppercase";
const campoFicha = "rounded-[3px] border border-linha px-3 py-2";

/** selo circular com o nome do clube em curva, tipo carimbo de biblioteca */
function SeloFicha({ nota, nomeClube }: { nota: number; nomeClube: string }) {
  const id = "selo-curva";
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-[66px] shrink-0 -rotate-[8deg]"
      aria-hidden
    >
      <defs>
        <path id={id} d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
      </defs>
      <circle
        cx="50"
        cy="50"
        r="37"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeDasharray="2.5 3.2"
      />
      <circle
        cx="50"
        cy="50"
        r="31"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.6"
        opacity={0.5}
      />
      <text
        fontFamily="var(--font-maquina)"
        fontSize="6.4"
        letterSpacing="2"
        fill="currentColor"
      >
        <textPath href={`#${id}`} startOffset="4">
          ★ {nomeClube.toUpperCase()} ★
        </textPath>
      </text>
      <text
        x="50"
        y="47"
        textAnchor="middle"
        fontFamily="var(--font-sans)"
        fontWeight="700"
        fontSize="21"
        fill="currentColor"
      >
        {virgula(nota)}
      </text>
      <text
        x="50"
        y="61"
        textAnchor="middle"
        fontFamily="var(--font-maquina)"
        fontSize="6.2"
        letterSpacing="1.5"
        fill="currentColor"
      >
        ESTRELAS
      </text>
    </svg>
  );
}

function CartaoFicha({
  f,
  pessoa,
  eu,
  clubeId,
  nomeClube,
}: {
  f: Ficha;
  pessoa: PessoaResumo | null;
  eu: string | null;
  clubeId: string;
  nomeClube: string;
}) {
  const [revelar, setRevelar] = useState(!f.spoiler || f.autor === eu);
  return (
    <li className="relative overflow-hidden rounded-[6px] border border-linha bg-creme-quente shadow-[0_14px_30px_-20px_rgba(43,20,32,.35)]">
      {/* marquinhas de "furo", tipo bilhete de biblioteca */}
      <span
        aria-hidden
        className="absolute top-[46px] -left-[9px] size-[18px] rounded-full bg-mesa"
      />
      <span
        aria-hidden
        className="absolute top-[46px] -right-[9px] size-[18px] rounded-full bg-mesa"
      />

      <div className="relative flex items-center justify-between gap-3 bg-gradient-to-br from-bordo to-bordo-escuro px-4 pt-3 pb-3">
        <span className="font-maquina absolute top-1.5 left-4 text-[8px] tracking-[.06em] text-creme/55">
          ficha nº {f.id.slice(0, 4)}
        </span>
        <Link
          href={
            pessoa?.usuario
              ? `/clubes/${clubeId}/membro/${pessoa.usuario}`
              : "#"
          }
          className="mt-2.5 flex min-w-0 items-center gap-2"
        >
          <Avatar
            pessoa={pessoa}
            tamanho={24}
            className="border border-creme/40"
          />
          <span className="truncate font-display text-lg italic text-creme lg:font-revista">
            {f.autor === eu ? "você" : nomeDe(pessoa)}
            {f.autor.startsWith("antiga:") ? (
              <span className="ml-1.5 font-sans text-[9px] font-semibold tracking-[.1em] not-italic uppercase opacity-80">
                · da revista
              </span>
            ) : null}
          </span>
        </Link>
        <span className="text-creme">
          <SeloFicha nota={Number(f.nota)} nomeClube={nomeClube} />
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-2.5 border-b border-dashed border-bege pb-3.5">
          {criterios.map((c) => (
            <div key={c}>
              <span className="font-maquina inline-flex items-center rounded-pill bg-rosa-fundo px-2.5 py-0.5 text-[9px] text-rosa-antigo uppercase">
                {c}
              </span>
              <p className="mt-1 text-sm text-bordo">{estrelas(f.notas[c])}</p>
            </div>
          ))}
        </div>

        {f.personagem ? (
          <p className={campoFicha}>
            <span className={rotuloFicha}>personagem fav: </span>
            <span className="text-sm">{f.personagem} ♡</span>
          </p>
        ) : null}

        {revelar ? (
          <>
            {f.citacao ? (
              <blockquote className="relative border-t border-dashed border-bege px-1 pt-3.5 pb-0.5">
                <span
                  aria-hidden
                  className="absolute top-2 -left-0.5 font-display text-3xl text-rosa-claro"
                >
                  “
                </span>
                <p className="pl-3 font-display text-[16px] leading-[1.35] font-semibold italic text-bordo-escuro lg:font-revista lg:font-normal">
                  {f.citacao}
                </p>
              </blockquote>
            ) : null}
            {f.texto ? (
              <div className="rounded-md bg-rosa-fundo px-3 py-2.5">
                <p className={rotuloFicha}>comentários:</p>
                <p className="mt-1 text-sm leading-[1.5] whitespace-pre-line text-tinta-suave">
                  {f.texto}
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <button
            type="button"
            onClick={() => setRevelar(true)}
            className="flex min-h-11 w-full items-center justify-center rounded-md border border-dashed border-bege text-xs font-semibold text-cinza"
          >
            tem spoiler · tocar para ler
          </button>
        )}

        <p className="font-maquina text-right text-[10px] tracking-[.06em] text-cinza">
          registrada em{" "}
          {new Date(f.criado_em).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </p>
      </div>
    </li>
  );
}

export default function FichasDoLivroPage() {
  const { livro } = useParams<{ livro: string }>();
  const { clube, membros } = useClube();
  const eu = useMeuId();
  const consulta = useConsulta(async () => {
    const [l, fichas] = await Promise.all([
      livroDoClube(livro),
      fichasDe(livro),
    ]);
    return l ? { l, fichas } : null;
  }, [livro]);

  if (consulta.carregando && !consulta.dados)
    return (
      <Animacao
        tipo="estrelas"
        titulo="calculando a média do clube"
        sub="cada ficha conta um pouquinho"
      />
    );
  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  if (!consulta.dados)
    return (
      <Vazio
        className="mx-6 mt-6 lg:mx-0"
        titulo="esse livro não está no clube"
      />
    );
  // as fichas do app + as antigas (da revista) de quem ainda não escreveu aqui
  const fichas = fichasComAntigas(
    consulta.dados.l,
    consulta.dados.fichas,
    membros,
  );
  const { l } = consulta.dados;
  const m = media(fichas.map((f) => f.nota));
  const minha = fichas.find((f) => f.autor === eu);
  const pessoa = (id: string) => pessoaDaFicha(id, membros);

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <TopoForm
        voltar={{ href: `/clubes/${clube.id}/biblioteca`, r: "livros" }}
        rotulo={clube.nome}
        titulo=""
      />
      <div className="px-6 lg:grid lg:max-w-[1000px] lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10 lg:px-0">
        <div>
          <div className="mt-4 flex gap-4 rounded-xl border border-linha bg-creme-quente p-4 lg:rounded-[4px] lg:border-fio lg:bg-transparent">
            <CapaAuto
              livro={l.livro}
              className="w-[84px] [&>span:last-child]:hidden"
            />
            <div className="min-w-0">
              <p className="text-[9px] font-semibold tracking-[.14em] text-bordo uppercase">
                {l.rodada ? `rodada ${l.rodada} · ` : ""}
                {l.estado === "lido"
                  ? "encerrada"
                  : l.estado === "lendo"
                    ? "lendo agora"
                    : "sugestão"}
              </p>
              <h1 className="mt-1 font-display text-2xl leading-tight font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
                {l.livro.titulo}
              </h1>
              <p className="mt-1 text-[13px] text-cinza">
                {l.livro.autor}
                {l.livro.paginas ? ` · ${l.livro.paginas} páginas` : ""}
              </p>
              <p className="mt-2.5 flex items-baseline gap-2">
                <b className="font-display text-[28px] leading-none font-semibold text-bordo">
                  {virgula(m)}
                </b>
                <span className="text-[9px] font-semibold tracking-[.14em] text-cinza uppercase">
                  média de {fichas.length}{" "}
                  {fichas.length === 1 ? "ficha" : "fichas"}
                </span>
              </p>
            </div>
          </div>

          <h2 className="mt-7 text-[10px] font-semibold tracking-[.16em] text-bordo uppercase">
            as fichas do clube
          </h2>
          {fichas.length ? (
            <ul className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fichas.map((f) => (
                <CartaoFicha
                  key={f.id}
                  f={f}
                  pessoa={pessoa(f.autor)}
                  eu={eu}
                  clubeId={clube.id}
                  nomeClube={clube.nome}
                />
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
              <p className="text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
                média por critério
              </p>
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
          <Link
            href={`/clubes/${clube.id}/ficha/${l.id}`}
            className={`${botaoContorno} flex-1 lg:max-w-[560px]`}
          >
            {minha ? "editar a minha ficha ✎" : "escrever a minha ficha ✎"}
          </Link>
        </Rodape>
      ) : null}
    </div>
  );
}
