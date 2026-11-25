"use client";

import { CapaAuto } from "@/components/CapaAuto";
import Link from "next/link";
import { useState } from "react";
import { useClube } from "@/components/clube/ClubeContexto";
import { Carregando, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { Avatar, CartaoAtividade } from "@/components/social/Pessoas";
import { encontrosDe, livrosDoClube } from "@/lib/clubes";
import {
  atividadesDoClube,
  nomeDe,
  pessoasPorId,
  quandoFoi,
  useConsulta,
  type Atividade,
  type PessoaResumo,
} from "@/lib/social";

type Item =
  | { tipo: "atividade"; quando: string; a: Atividade }
  | {
      tipo: "evento";
      quando: string;
      id: string;
      quem: string | null;
      texto: string;
      livro?: { id: string; titulo: string; autor: string; capa?: string };
      detalhe?: string;
      href?: string;
    };

/** O feed do clube (atividades, leituras e encontros) — mostrado no início do clube. */
export function FeedDoClube({ limite }: { limite?: number } = {}) {
  const { clube, membros } = useClube();
  const [todas, setTodas] = useState(false);
  const consulta = useConsulta(async () => {
    const [atividades, livros, encontros] = await Promise.all([
      atividadesDoClube(clube.id),
      livrosDoClube(clube.id),
      encontrosDe(clube.id),
    ]);
    const pessoas = await pessoasPorId(atividades.map((a) => a.autor));
    return { atividades, livros, encontros, pessoas };
  }, [clube.id]);

  if (consulta.carregando && !consulta.dados)
    return <Carregando texto="trazendo as novidades do clube…" />;
  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { atividades, livros, encontros, pessoas } = consulta.dados!;
  const pessoa = (id: string | null): PessoaResumo | null =>
    id
      ? (membros.find((m) => m.usuario_id === id)?.pessoa ??
        pessoas.get(id) ??
        null)
      : null;

  const itens: Item[] = [
    ...atividades.map((a) => ({
      tipo: "atividade" as const,
      quando: a.criado_em,
      a,
    })),
    ...livros
      .filter((l) => l.iniciado_em)
      .map((l) => ({
        tipo: "evento" as const,
        quando: l.iniciado_em!,
        id: `l-${l.id}`,
        quem: l.sugerido_por,
        texto: `rodada ${l.rodada ?? ""}: começou a leitura`,
        livro: l.livro,
        detalhe: l.prazo
          ? `até ${new Date(`${l.prazo}T12:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}`
          : undefined,
        href: `/clubes/${clube.id}/leitura`,
      })),
    ...encontros.map((e) => ({
      tipo: "evento" as const,
      quando: e.criado_em,
      id: `e-${e.id}`,
      quem: e.criado_por,
      texto: `marcou "${e.titulo}"`,
      detalhe: `${new Date(e.quando).toLocaleString("pt-BR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}${e.local ? ` · ${e.local}` : ""}`,
      href: `/clubes/${clube.id}/agenda`,
    })),
  ].sort((a, b) => b.quando.localeCompare(a.quando));
  const visiveis = limite && !todas ? itens.slice(0, limite) : itens;

  return (
    <div>
      <div className="space-y-3">
        {itens.length ? (
          visiveis.map((i) =>
            i.tipo === "atividade" ? (
              <CartaoAtividade
                key={i.a.id}
                a={i.a}
                pessoa={pessoa(i.a.autor)}
              />
            ) : (
              <Link
                key={i.id}
                href={i.href ?? "#"}
                className="flex gap-3.5 rounded-xl border border-dashed border-bege p-4 lg:rounded-[4px]"
              >
                <Avatar pessoa={pessoa(i.quem)} tamanho={30} />
                <span className="min-w-0 flex-1">
                  <span className="block text-xs">
                    <b className="font-semibold">{nomeDe(pessoa(i.quem))}</b>{" "}
                    <span className="text-cinza">{i.texto}</span>
                  </span>
                  {i.livro ? (
                    <span className="mt-1.5 block font-display text-[17px] font-semibold italic lg:font-revista lg:font-normal">
                      {i.livro.titulo}
                    </span>
                  ) : null}
                  {i.detalhe ? (
                    <span className="mt-1 block text-xs text-cinza">
                      {i.detalhe}
                    </span>
                  ) : null}
                  <span className="mt-1.5 block text-[10px] font-semibold tracking-[.12em] text-cinza uppercase">
                    {quandoFoi(i.quando)}
                  </span>
                </span>
                {i.livro ? (
                  <CapaAuto
                    livro={i.livro}
                    className="w-11 self-start [&>span:last-child]:hidden"
                  />
                ) : null}
              </Link>
            ),
          )
        ) : (
          <Vazio
            titulo="nada de novo por aqui ainda"
            texto="quando alguém escrever uma ficha, começar uma leitura ou marcar um encontro, aparece aqui."
            acao={{
              href: `/clubes/${clube.id}/leitura`,
              rotulo: "ver a leitura",
            }}
          />
        )}
      </div>
      {visiveis.length < itens.length ? (
        <button
          type="button"
          onClick={() => setTodas(true)}
          className="mt-4 flex min-h-10 items-center text-[13px] font-semibold text-bordo hover:underline"
        >
          ver as outras {itens.length - visiveis.length} atividades
        </button>
      ) : itens.length ? (
        <p className="py-8 text-center font-accent text-[13px] italic text-cinza">
          isso é tudo por enquanto ✦
        </p>
      ) : null}
    </div>
  );
}
