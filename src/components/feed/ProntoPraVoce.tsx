"use client";

import Link from "next/link";
import { CapaLivro } from "@/components/CapaLivro";
import { corDoLivro } from "@/lib/cores";
import { mesDoReview } from "@/lib/numeros";
import { usePerfil } from "@/lib/perfil-store";

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/**
 * No feed, um destaque quando algo fica pronto: a retrospectiva do ano
 * (penúltima semana do ano até janeiro) e o review do mês (penúltimo dia + uma semana).
 */
export function ProntoPraVoce() {
  const livros = usePerfil((s) => s.livros);
  const review = mesDoReview();
  if (!review) return null;

  const lidosDe = (prefixo: string) =>
    livros.filter((l) => l.status === "lido" && l.lidoEm?.startsWith(prefixo));
  const cartoes = [];

  if (review) {
    const chave = `${review.ano}-${String(review.mes + 1).padStart(2, "0")}`;
    const doMes = lidosDe(chave);
    cartoes.push(
      <Link
        key="mes"
        href={`/story?tipo=mes&mes=${chave}`}
        className="group block rounded-xl border border-bordo/30 bg-rosa-fundo p-5 lg:rounded-[6px]"
      >
        <span className="block text-[10px] font-semibold tracking-[.2em] text-bordo uppercase">
          pronto ✦ review do mês
        </span>
        <span className="mt-1 block font-display text-[22px] leading-tight font-semibold italic text-ameixa lg:font-revista lg:font-normal">
          seu {MESES[review.mes]} em revista
        </span>
        <span className="mt-0.5 block text-[13px] text-cinza">
          {doMes.length
            ? `${doMes.length} ${doMes.length === 1 ? "livro terminado" : "livros terminados"} · vire um story`
            : "nenhum livro terminado neste mês — ainda dá tempo ✦"}
        </span>
        <Capas livros={doMes} clara />
        <span className="mt-3 inline-block text-[12px] font-bold tracking-[.1em] text-bordo uppercase">
          ver e criar story →
        </span>
      </Link>,
    );
  }

  return <div className="space-y-3">{cartoes}</div>;
}

function Capas({
  livros,
  clara,
}: {
  livros: { id: string; titulo: string; capa?: string }[];
  clara?: boolean;
}) {
  if (!livros.length) return null;
  return (
    <span className="relative mt-3 flex gap-1.5">
      {livros.slice(0, 7).map((l, i) => (
        <CapaLivro
          key={l.id}
          titulo={l.titulo}
          capa={l.capa}
          cor={corDoLivro(l.id)}
          className={`w-9 flex-none [&>span:last-child]:hidden ${i % 2 ? "rotate-2" : "-rotate-2"} ${clara ? "" : "shadow-[0_6px_12px_-6px_rgba(0,0,0,.6)]"}`}
        />
      ))}
      {livros.length > 7 ? (
        <span
          className={`self-center text-xs font-semibold ${clara ? "text-bordo" : "text-rosa-claro"}`}
        >
          +{livros.length - 7}
        </span>
      ) : null}
    </span>
  );
}
