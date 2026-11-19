"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import { AbasPerfil } from "@/components/perfil/AbasPerfil";
import { corDoLivro } from "@/lib/cores";
import { estrelas } from "@/lib/estantes";
import { criterios } from "@/lib/clubes";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";

type Filtro = "todas" | "resenha" | "trecho";

const temFicha = (l: LivroSalvo) =>
  !!(l.nota || l.resenha || l.citacao || l.personagem);

/** As fichas de leitura da pessoa, juntas: nota, critérios, resenha, trecho e personagem. */
export default function ResenhasPage() {
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  if (!hidratado) return <AppShell aba="perfil">{null}</AppShell>;

  const fichas = livros
    .filter(temFicha)
    .sort((a, b) =>
      (b.lidoEm ?? b.adicionadoEm ?? "").localeCompare(
        a.lidoEm ?? a.adicionadoEm ?? "",
      ),
    );
  const lista = fichas.filter((l) =>
    filtro === "resenha"
      ? !!l.resenha
      : filtro === "trecho"
        ? !!l.citacao
        : true,
  );
  const pilula = (on: boolean) =>
    `flex h-9 items-center rounded-pill border px-[13px] text-xs font-semibold whitespace-nowrap ${
      on
        ? "border-bordo bg-bordo text-creme"
        : "border-bege bg-creme-quente text-ameixa"
    }`;

  return (
    <AppShell aba="perfil">
      <div className="flex flex-1 flex-col px-6 pt-4 pb-10 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="lg:mx-auto lg:w-full lg:max-w-[900px]">
          <AbasPerfil ativa="resenhas" className="lg:max-w-[640px]" />
          <h1 className="mt-6 font-display text-[32px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
            minhas resenhas
          </h1>
          <p className="mt-1.5 font-accent text-sm italic text-cinza">
            {fichas.length
              ? `${fichas.length} ${fichas.length === 1 ? "ficha de leitura" : "fichas de leitura"} ✦`
              : "as fichas que você escrever aparecem aqui ✦"}
          </p>

          <div className="mt-5 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
            {(
              [
                ["todas", `todas · ${fichas.length}`],
                [
                  "resenha",
                  `com resenha · ${fichas.filter((l) => l.resenha).length}`,
                ],
                [
                  "trecho",
                  `com trecho · ${fichas.filter((l) => l.citacao).length}`,
                ],
              ] as const
            ).map(([id, r]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filtro === id}
                onClick={() => setFiltro(id)}
                className={pilula(filtro === id)}
              >
                {r}
              </button>
            ))}
          </div>

          {!lista.length ? (
            <p className="mt-8 font-accent text-[15px] italic text-cinza">
              {fichas.length
                ? "nenhuma ficha com isso ainda."
                : "avalie um livro que você leu: a ficha dele aparece aqui."}
            </p>
          ) : (
            <ul className="mt-6 grid gap-4 lg:grid-cols-2">
              {lista.map((l) => (
                <li
                  key={l.id}
                  className="rounded-xl border border-linha bg-creme-quente p-4 lg:rounded-[6px] lg:p-5"
                >
                  <div className="flex gap-4">
                    <Link href={`/livro/${l.id}`} className="flex-none">
                      <CapaLivro
                        titulo={l.titulo}
                        capa={l.capa}
                        cor={corDoLivro(l.id)}
                        className="w-[64px] [&>span:last-child]:hidden"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/livro/${l.id}`}
                        className="block font-display text-lg leading-tight font-semibold italic text-ameixa lg:font-revista lg:font-normal"
                      >
                        {l.titulo}
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-cinza">
                        {l.autor}
                        {l.lidoEm
                          ? ` · ${new Date(l.lidoEm).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}`
                          : ""}
                      </p>
                      {l.nota ? (
                        <p className="mt-1.5 text-sm text-bordo">
                          {estrelas(l.nota)}
                        </p>
                      ) : null}
                      {l.notas && Object.values(l.notas).some(Boolean) ? (
                        <p className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-cinza">
                          {criterios.map((c) =>
                            l.notas?.[c] ? (
                              <span key={c}>
                                {c} {String(l.notas[c]).replace(".", ",")}★
                              </span>
                            ) : null,
                          )}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {l.resenha ? (
                    <p className="mt-3 line-clamp-5 text-[13px] leading-relaxed text-ameixa">
                      {l.resenha}
                    </p>
                  ) : null}
                  {l.citacao ? (
                    <blockquote className="mt-3 border-l-2 border-bordo/40 pl-3 font-accent text-[14px] italic text-bordo">
                      “{l.citacao}”
                    </blockquote>
                  ) : null}
                  {l.personagem ? (
                    <p className="mt-2 text-[12px] text-cinza">
                      personagem favorita:{" "}
                      <b className="font-semibold text-ameixa">
                        {l.personagem}
                      </b>
                    </p>
                  ) : null}
                  <Link
                    href={`/livro/${l.id}/avaliar`}
                    className="mt-3 inline-flex min-h-9 items-center text-xs font-semibold text-bordo underline underline-offset-4"
                  >
                    editar ficha
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AppShell>
  );
}
