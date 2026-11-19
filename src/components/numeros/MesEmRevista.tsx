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
 * "seu mês em revista": o mini wrapped do mês, pronto para o story.
 * Aparece sozinho no penúltimo dia do mês e fica uma semana (até o dia 5 do mês seguinte),
 * com o resumo do mês que está fechando.
 */
export function MesEmRevista({ web }: { web?: boolean }) {
  const livros = usePerfil((s) => s.livros);
  // aparece sozinho no penúltimo dia do mês e fica uma semana (ver mesDoReview)
  const aberto = mesDoReview();
  if (!aberto) return null;
  const ref = new Date(aberto.ano, aberto.mes, 1);
  const chave = `${ref.getFullYear()}-${String(ref.getMonth() + 1).padStart(2, "0")}`;
  const doMes = livros.filter(
    (l) => l.status === "lido" && l.lidoEm?.startsWith(chave),
  );
  const paginas = doMes.reduce((t, l) => t + (l.paginas ?? 0), 0);
  const nome = MESES[ref.getMonth()];

  return (
    <Link
      href={`/story?tipo=mes&mes=${chave}`}
      className={`inverso group relative block overflow-hidden rounded-xl bg-gradient-to-br from-bordo to-bordo-escuro p-5 text-creme ${web ? "mb-14 rounded-[4px] p-7" : "mb-4"}`}
    >
      <span className="block text-[10px] font-semibold tracking-[.2em] text-rosa-claro uppercase">
        {`o review de ${nome} está pronto ✦`}
      </span>
      <span
        className={`mt-1.5 block italic ${web ? "font-revista text-[34px]" : "font-display text-[28px] font-semibold"}`}
      >
        seu mês em revista
      </span>
      <span className="mt-1 block text-[13px] text-rosa-claro/90">
        {doMes.length
          ? `${doMes.length} ${doMes.length === 1 ? "livro" : "livros"}${paginas ? ` · ${paginas.toLocaleString("pt-BR")} páginas` : ""} — vire um story chique`
          : "termine um livro este mês e ele vira um story ✦"}
      </span>
      {doMes.length ? (
        <span className="mt-4 flex gap-2">
          {doMes.slice(0, 5).map((l, i) => (
            <CapaLivro
              key={l.id}
              titulo={l.titulo}
              capa={l.capa}
              cor={corDoLivro(l.id)}
              className={`w-11 flex-none [&>span:last-child]:hidden ${i % 2 ? "rotate-2" : "-rotate-2"}`}
            />
          ))}
        </span>
      ) : null}
      <span className="mt-4 inline-flex h-10 items-center rounded-pill bg-creme px-5 text-[13px] font-semibold text-bordo transition-transform group-hover:-translate-y-0.5">
        criar story →
      </span>
    </Link>
  );
}
