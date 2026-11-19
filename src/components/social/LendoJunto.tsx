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
    <section className="mx-6 mt-5 rounded-xl border border-linha bg-creme-quente p-4 lg:mx-0 lg:rounded-[6px] lg:p-5">
      <h2 className="flex items-center gap-2 text-[11px] font-semibold tracking-[.16em] text-bordo uppercase">
        <svg
          aria-hidden
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        lendo junto
      </h2>
      <ul className="mt-3 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none]">
        {juntos.map((l) => {
          const pessoas = mapa!.get(l.id)!;
          return (
            <li key={l.id} className="w-[86px] flex-none">
              <Link href={`/livro/${l.id}`} className="block">
                <CapaLivro
                  titulo={l.titulo}
                  capa={l.capa}
                  cor={corDoLivro(l.id)}
                  className="w-full [&>span:last-child]:text-[9px]"
                />
              </Link>
              <div
                className="mt-2 flex -space-x-2"
                title={`com ${pessoas.map(nomeDe).join(", ")}`}
              >
                {pessoas.slice(0, 4).map((p) => (
                  <Link
                    key={p.id}
                    href={p.usuario ? `/u/${p.usuario}` : "#"}
                    className="rounded-full ring-2 ring-creme-quente"
                    aria-label={`${nomeDe(p)} também está lendo`}
                  >
                    <Avatar pessoa={p} tamanho={24} />
                  </Link>
                ))}
                {pessoas.length > 4 ? (
                  <span className="flex size-6 items-center justify-center rounded-full bg-rosa-fundo text-[9px] font-bold text-bordo ring-2 ring-creme-quente">
                    +{pessoas.length - 4}
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
