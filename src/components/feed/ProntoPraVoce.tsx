"use client";

import Link from "next/link";
import { CapaLivro } from "@/components/CapaLivro";
import { corDoLivro } from "@/lib/cores";
import { anoDaRetrospectiva, mesDoReview } from "@/lib/numeros";
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
  const anoRetro = anoDaRetrospectiva();
  const review = mesDoReview();
  if (!anoRetro && !review) return null;

  const lidosDe = (prefixo: string) =>
    livros.filter((l) => l.status === "lido" && l.lidoEm?.startsWith(prefixo));
  const cartoes = [];

  if (anoRetro) {
    const doAno = lidosDe(String(anoRetro));
    cartoes.push(
      <Link
        key="retro"
        href="/numeros/retrospectiva"
        className="inverso group relative block overflow-hidden rounded-xl bg-gradient-to-br from-ameixa via-bordo-escuro to-bordo p-5 text-creme lg:rounded-[6px] lg:p-6"
      >
        <span
          aria-hidden
          className="absolute -top-3 right-4 text-[64px] leading-none text-ouro/30"
        >
          ✦
        </span>
        <span className="relative block text-[10px] font-semibold tracking-[.2em] text-rosa-claro uppercase">
          chegou ✦ retrospectiva do ano
        </span>
        <span className="relative mt-1.5 block font-display text-[26px] leading-tight font-semibold italic lg:font-revista lg:text-[30px] lg:font-normal">
          seu {anoRetro} em livros
        </span>
        <span className="relative mt-1 block text-[13px] text-rosa-claro/90">
          {doAno.length} {doAno.length === 1 ? "livro" : "livros"} — veja o seu
          ano inteiro
        </span>
        <Capas livros={doAno} />
        <span className="relative mt-4 inline-flex h-10 items-center rounded-pill bg-creme px-5 text-[13px] font-semibold text-bordo transition-transform group-hover:-translate-y-0.5">
          abrir a retrospectiva →
        </span>
      </Link>,
    );
  }

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
