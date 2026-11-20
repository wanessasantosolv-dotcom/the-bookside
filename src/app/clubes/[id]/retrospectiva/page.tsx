"use client";

import Link from "next/link";
import { useState } from "react";
import { Animacao } from "@/components/Animacao";
import { CapaAuto } from "@/components/CapaAuto";
import { useClube } from "@/components/clube/ClubeContexto";
import { TopoForm } from "@/components/clube/Pecas";
import { ErroOuFalta } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { anoDoClube, virgula } from "@/lib/clubes";
import { useConsulta, nomeDe } from "@/lib/social";
import { calcularWrapped } from "@/lib/wrapped-clube";

const cartao =
  "rounded-[14px] border border-rosa-claro/30 bg-creme/5 p-[18px] lg:p-6";
const etiqueta =
  "text-[9px] leading-none font-semibold tracking-[.2em] text-ouro uppercase";
const grande = "font-display text-2xl leading-[1.15] font-semibold italic";
const detalhe =
  "mt-2 font-accent text-[15px] leading-[1.35] italic text-rosa-claro";

/** O "wrapped" do clube: o ano de leituras juntas. */
export default function RetrospectivaDoClube() {
  const { clube } = useClube();
  const [ano, setAno] = useState(new Date().getFullYear());
  const [aviso, setAviso] = useState<string | null>(null);
  const consulta = useConsulta(
    () => anoDoClube(clube.id, ano),
    [clube.id, ano],
  );

  if (consulta.carregando && !consulta.dados)
    return (
      <Animacao
        tipo="estrelas"
        titulo="juntando o ano do clube"
        sub="fichas, notas, encontros e personagens"
      />
    );
  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const d = consulta.dados;
  if (!d) return null;
  const w = calcularWrapped(d);

  async function compartilhar() {
    const texto = [
      `${clube.nome} · nosso ${ano} em livros ✦`,
      `${w.lidos} ${w.lidos === 1 ? "livro" : "livros"}${w.paginas ? ` · ${w.paginas.toLocaleString("pt-BR")} páginas` : ""}`,
      w.maisAmado
        ? `o mais amado: ${w.maisAmado.l.livro.titulo} (${virgula(w.maisAmado.m)}★)`
        : null,
      w.personagem ? `personagem do ano: ${w.personagem.nome}` : null,
      "— the bookside",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      if (navigator.share) await navigator.share({ text: texto });
      else {
        await navigator.clipboard.writeText(texto);
        setAviso("copiado! é só colar no grupo do clube ✦");
      }
    } catch {
      /* cancelou */
    }
  }

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <TopoForm
        voltar={{ href: `/clubes/${clube.id}`, r: clube.nome }}
        rotulo="retrospectiva"
        titulo=""
      />
      <div className="papel-noite mx-6 mt-3 flex flex-col rounded-[20px] px-5 pt-6 pb-6 text-creme lg:mx-0 lg:px-10 lg:pt-10">
        <div className="flex items-start justify-between gap-4">
          <div className="animate-subir">
            <p className={etiqueta}>retrospectiva do clube</p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] font-bold italic lg:text-5xl">
              {clube.nome}
              <br />
              em {ano}
            </h1>
          </div>
          <span className="flex gap-1">
            {[ano - 1, ano].map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={a === ano}
                onClick={() => setAno(a)}
                className={`min-h-9 rounded-pill px-3 text-xs font-semibold ${a === ano ? "bg-creme text-ameixa" : "border border-rosa-claro/40 text-rosa-claro"}`}
              >
                {a}
              </button>
            ))}
          </span>
        </div>

        {!w.lidos ? (
          <p className="mt-8 font-accent text-[17px] italic text-rosa-claro">
            a retrospectiva começa quando o clube terminar o primeiro livro de{" "}
            {ano} ✦
          </p>
        ) : (
          <div className="mt-7 grid gap-3.5 lg:grid-cols-2">
            <div className={`${cartao} lg:col-span-2`}>
              <p className={etiqueta}>juntos, vocês leram</p>
              <p className="mt-2.5 font-display text-[70px] leading-[.95] font-bold italic">
                {w.lidos}
              </p>
              <p className={detalhe}>
                {w.lidos === 1 ? "livro" : "livros"}
                {w.paginas
                  ? ` · ${w.paginas.toLocaleString("pt-BR")} páginas`
                  : ""}
                {w.fichas ? ` · ${w.fichas} fichas` : ""}
                {w.encontros
                  ? ` · ${w.encontros} ${w.encontros === 1 ? "encontro" : "encontros"}`
                  : ""}
              </p>
              <ul className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {d.livros
                  .filter((l) => l.estado === "lido")
                  .map((l) => (
                    <li key={l.id} className="w-11 flex-none">
                      <CapaAuto
                        livro={l.livro}
                        className="w-full [&>span:last-child]:hidden"
                      />
                    </li>
                  ))}
              </ul>
            </div>

            {w.maisAmado ? (
              <Link
                href={`/clubes/${clube.id}/livro/${w.maisAmado.l.id}`}
                className={`${cartao} block`}
              >
                <p className={etiqueta}>o mais amado</p>
                <p className={`${grande} mt-2`}>{w.maisAmado.l.livro.titulo}</p>
                <p className={detalhe}>
                  média {virgula(w.maisAmado.m)}★ entre as fichas ♡
                </p>
              </Link>
            ) : null}

            {w.polemico ? (
              <Link
                href={`/clubes/${clube.id}/livro/${w.polemico.l.id}`}
                className={`${cartao} block`}
              >
                <p className={etiqueta}>o que mais dividiu o clube</p>
                <p className={`${grande} mt-2`}>{w.polemico.l.livro.titulo}</p>
                <p className={detalhe}>
                  notas de {Math.min(...w.polemico.notas)}★ a{" "}
                  {Math.max(...w.polemico.notas)}★ — rendeu conversa
                </p>
              </Link>
            ) : w.menosAmado ? (
              <div className={cartao}>
                <p className={etiqueta}>o que ficou para trás</p>
                <p className={`${grande} mt-2`}>
                  {w.menosAmado.l.livro.titulo}
                </p>
                <p className={detalhe}>
                  média {virgula(w.menosAmado.m)}★ — nem todo livro é para todo
                  clube
                </p>
              </div>
            ) : null}

            {w.personagem ? (
              <div className={cartao}>
                <p className={etiqueta}>personagem do ano</p>
                <p className={`${grande} mt-2`}>{w.personagem.nome}</p>
                <p className={detalhe}>
                  favorita em {w.personagem.vezes} fichas
                </p>
              </div>
            ) : null}

            {w.criterio ? (
              <div className={cartao}>
                <p className={etiqueta}>o que o clube mais valorizou</p>
                <p className={`${grande} mt-2`}>{w.criterio.c}</p>
                <p className={detalhe}>
                  média {virgula(w.criterio.m)}★ nesse critério · média geral{" "}
                  {virgula(w.media)}★
                </p>
              </div>
            ) : null}

            {w.citacao ? (
              <div className={`${cartao} lg:col-span-2`}>
                <p className={etiqueta}>o trecho do ano</p>
                <blockquote className="mt-3 font-display text-[22px] leading-[1.3] italic">
                  “{w.citacao.texto}”
                </blockquote>
                <p className={detalhe}>
                  {w.citacao.livro} · guardado por {w.citacao.quem}
                </p>
              </div>
            ) : null}

            <div className={`${cartao} lg:col-span-2`}>
              <p className={etiqueta}>quem leu</p>
              <ul className="mt-3 space-y-2.5">
                {w.dedicada ? (
                  <li className="flex items-center gap-3 text-sm">
                    <Avatar pessoa={w.dedicada.pessoa} tamanho={30} />
                    <span>
                      <b className="font-semibold">
                        {nomeDe(w.dedicada.pessoa)}
                      </b>{" "}
                      escreveu mais fichas ({w.dedicada.fichas})
                    </span>
                  </li>
                ) : null}
                {w.generosa ? (
                  <li className="flex items-center gap-3 text-sm">
                    <Avatar pessoa={w.generosa.pessoa} tamanho={30} />
                    <span>
                      <b className="font-semibold">
                        {nomeDe(w.generosa.pessoa)}
                      </b>{" "}
                      foi a mais generosa nas notas ({virgula(w.generosa.media)}
                      ★)
                    </span>
                  </li>
                ) : null}
                {w.exigente ? (
                  <li className="flex items-center gap-3 text-sm">
                    <Avatar pessoa={w.exigente.pessoa} tamanho={30} />
                    <span>
                      <b className="font-semibold">
                        {nomeDe(w.exigente.pessoa)}
                      </b>{" "}
                      foi a mais exigente ({virgula(w.exigente.media)}★)
                    </span>
                  </li>
                ) : null}
                {w.leitoraVoraz ? (
                  <li className="flex items-center gap-3 text-sm">
                    <Avatar pessoa={w.leitoraVoraz.pessoa} tamanho={30} />
                    <span>
                      <b className="font-semibold">
                        {nomeDe(w.leitoraVoraz.pessoa)}
                      </b>{" "}
                      ainda leu {w.leitoraVoraz.n} livros fora do clube
                    </span>
                  </li>
                ) : null}
              </ul>
              {w.fora ? (
                <p className={detalhe}>
                  fora do clube, vocês leram mais {w.fora} livros ✦
                </p>
              ) : null}
            </div>
          </div>
        )}

        <div className="mt-8">
          <button
            type="button"
            onClick={compartilhar}
            disabled={!w.lidos}
            className="flex min-h-12 w-full items-center justify-center rounded-pill bg-creme text-sm font-semibold text-ameixa disabled:opacity-50"
          >
            compartilhar ✧
          </button>
        </div>
        <p
          role="status"
          className="mt-2 min-h-4 text-center text-xs text-rosa-claro"
        >
          {aviso}
        </p>
      </div>
    </div>
  );
}
