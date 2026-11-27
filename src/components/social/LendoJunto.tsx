"use client";

import Link from "next/link";
import { CapaLivro } from "@/components/CapaLivro";
import { Avatar } from "@/components/social/Pessoas";
import { corDoLivro } from "@/lib/cores";
import { usePerfil } from "@/lib/perfil-store";
import { lendoJunto, nomeDe, useConsulta } from "@/lib/social";

/** "lendo junto": os livros que estou lendo ao mesmo tempo que alguém que eu sigo. */
export function LendoJunto() {
  const lendo = usePerfil((s) => s.livros).filter((l) => l.status === "lendo");
  const ids = lendo.map((l) => l.id).join(",");
  const consulta = useConsulta(
    () => lendoJunto(lendo.map((l) => ({ id: l.id, titulo: l.titulo }))),
    [ids],
  );
  const mapa = consulta.dados;
  const juntos = lendo.filter((l) => mapa?.get(l.id)?.length);
  if (!juntos.length) return null;

  return (
    <section
      aria-label="lendo junto"
      className="mx-6 mt-4 flex items-center gap-4 overflow-x-auto border-b border-linha py-3 [scrollbar-width:none] lg:mx-0 lg:border-fio"
    >
      <h2 className="flex flex-none items-center gap-1.5 text-[12px] font-semibold text-bordo">
        <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        lendo junto
      </h2>
      <ul className="flex gap-6">
        {juntos.map((l) => {
          const pessoas = mapa!.get(l.id)!;
          return (
            <li key={l.id} className="flex flex-none items-center gap-2.5">
              <Link href={`/livro/${l.id}`} className="w-[26px] flex-none" aria-label={l.titulo}>
                <CapaLivro titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className="w-full [&>span:last-child]:hidden" />
              </Link>
              <span className="max-w-[160px] truncate text-[12px] text-ameixa">
                <Link href={`/livro/${l.id}`} className="font-semibold hover:text-bordo">
                  {l.titulo}
                </Link>
                <span className="block truncate text-[11px] text-cinza">com {pessoas.map(nomeDe).join(", ")}</span>
              </span>
              <span className="flex -space-x-1.5">
                {pessoas.slice(0, 3).map((p) => (
                  <Link
                    key={p.id}
                    href={p.usuario ? `/u/${p.usuario}` : "#"}
                    className="rounded-full ring-2 ring-[var(--papel,#F6F0E5)]"
                    aria-label={`${nomeDe(p)} também está lendo`}
                  >
                    <Avatar pessoa={p} tamanho={20} />
                  </Link>
                ))}
                {pessoas.length > 3 ? (
                  <span className="flex size-5 items-center justify-center rounded-full bg-rosa-fundo text-[8px] font-bold text-bordo">
                    +{pessoas.length - 3}
                  </span>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
