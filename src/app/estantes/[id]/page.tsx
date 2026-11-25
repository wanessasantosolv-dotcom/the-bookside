"use client";

import { Voltar } from "@/components/Voltar";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AvisoRemovido } from "@/components/AvisoRemovido";
import { CapaLivro } from "@/components/CapaLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import { BotaoLink } from "@/components/ui/Botao";
import { corDoLivro } from "@/lib/cores";
import { sugestoesDeLivros } from "@/lib/dados";
import {
  dataCurta,
  estrelas,
  livrosDaEstante,
  mesDe,
  todasAsEstantes,
} from "@/lib/estantes";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";

/** "todos", um ano ("2025"), "sem-data", "4mais" ou "amei" */
type Filtro = string;

/** a data que vale para o livro nesta estante (nos lidos: só quando terminou) */
function dataDoLivro(l: LivroSalvo) {
  if (l.status === "lido") return l.lidoEm;
  return l.lidoEm ?? l.iniciadoEm ?? l.adicionadoEm;
}

function meta(l: LivroSalvo) {
  const data = dataDoLivro(l);
  const partes = [dataCurta(data)];
  if (l.status === "lido") partes.push(estrelas(l.nota));
  else if (l.status === "lendo" && l.paginas && l.paginaAtual)
    partes.push(`${Math.round((l.paginaAtual / l.paginas) * 100)}%`);
  return partes.filter(Boolean).join(" · ");
}

function generoDe(id: string) {
  return sugestoesDeLivros.find((l) => l.id === id)?.genero;
}

export default function EstanteAbertaPage() {
  const { id } = useParams<{ id: string }>();
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  const proprias = usePerfil((s) => s.estantesProprias);
  const [vista, setVista] = useState<"lista" | "grade">("lista");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");

  if (!hidratado) return <AppShell aba="estantes">{null}</AppShell>;
  const estante = todasAsEstantes(proprias ?? []).find((e) => e.id === id);
  if (!estante) notFound();

  const todos = livrosDaEstante(estante, livros);
  // os anos que aparecem na estante, do mais recente ao mais antigo
  const anos = [
    ...new Set(
      todos
        .map((l) => dataDoLivro(l)?.slice(0, 4))
        .filter((a): a is string => !!a && /^\d{4}$/.test(a)),
    ),
  ].sort((a, b) => b.localeCompare(a));
  if (!anos.length) anos.push(String(new Date().getFullYear()));
  const temSemData = todos.some((l) => !dataDoLivro(l));
  const termo = busca
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const lista = todos.filter((l) => {
    if (
      termo &&
      !`${l.titulo} ${l.autor}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(termo)
    )
      return false;
    if (/^\d{4}$/.test(filtro))
      return (dataDoLivro(l) ?? "").startsWith(filtro);
    if (filtro === "sem-data") return !dataDoLivro(l);
    if (filtro === "4mais") return (l.nota ?? 0) >= 4;
    if (filtro === "amei") return !!l.amei;
    return true;
  });
  const grupos = lista.reduce<{ mes: string; livros: LivroSalvo[] }[]>(
    (acc, l) => {
      const mes = mesDe(dataDoLivro(l));
      const g = acc.find((x) => x.mes === mes);
      if (g) g.livros.push(l);
      else acc.push({ mes, livros: [l] });
      return acc;
    },
    [],
  );
  // os sem data vão para o fim
  grupos.sort(
    (a, b) => Number(a.mes === "sem data") - Number(b.mes === "sem data"),
  );
  const subtitulo =
    estante.status === "lido"
      ? "do mais recente ao mais antigo"
      : estante.status === "quero"
        ? "na ordem em que entraram"
        : estante.status === "lendo"
          ? "leituras em andamento"
          : estante.propria?.publica
            ? "amigos também veem"
            : "só você vê";
  const pill = (on: boolean) =>
    `flex h-11 items-center rounded-pill border px-3 text-[11px] font-semibold whitespace-nowrap lg:h-9 ${on ? "border-bordo bg-bordo text-creme" : "border-bege bg-creme-quente text-ameixa"}`;

  return (
    <AppShell aba="estantes">
      <AvisoRemovido />
      <div className="flex flex-1 flex-col lg:bg-jornal lg:px-14 lg:pt-10">
        <header className="flex items-center justify-between px-6 pt-2 lg:px-0 lg:pt-0">
          <Voltar
            padrao="/estantes"
            rotulo="estantes"
            className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo"
          />
          <Link
            href={`/buscar?estante=${estante.id}`}
            aria-label={`adicionar livro em ${estante.nome}`}
            className="flex size-11 items-center justify-center rounded-full bg-bordo text-lg font-semibold text-creme hover:bg-bordo-suave"
          >
            +
          </Link>
        </header>

        <div className="animate-subir px-6 pt-2 lg:px-0">
          <h1 className="font-display text-[32px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[44px] lg:font-normal lg:text-tinta">
            {estante.nome}
          </h1>
          <p className="mt-2 font-accent text-sm italic text-cinza lg:font-texto lg:text-[13px] lg:not-italic">
            {todos.length} {todos.length === 1 ? "livro" : "livros"} ·{" "}
            {subtitulo}
          </p>
        </div>

        {todos.length > 4 ? (
          <label className="mx-6 mt-4 flex h-11 items-center gap-2 rounded-pill border border-bege bg-creme-quente px-4 focus-within:border-bordo lg:mx-0 lg:max-w-[420px]">
            <svg
              aria-hidden
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              className="flex-none text-cinza"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <span className="sr-only">buscar nesta estante</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="buscar nesta estante"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-cinza"
            />
          </label>
        ) : null}

        <div className="mt-5 flex items-center justify-between gap-2 px-6 lg:border-b lg:border-fio lg:px-0 lg:pb-6">
          <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
            <button
              type="button"
              aria-pressed={filtro === "todos"}
              onClick={() => setFiltro("todos")}
              className={pill(filtro === "todos")}
            >
              todos
            </button>
            {anos.map((a) => (
              <button
                key={a}
                type="button"
                aria-pressed={filtro === a}
                onClick={() => setFiltro(a)}
                className={pill(filtro === a)}
              >
                {a}
              </button>
            ))}
            {temSemData && estante.status === "lido" ? (
              <button
                type="button"
                aria-pressed={filtro === "sem-data"}
                onClick={() => setFiltro("sem-data")}
                className={pill(filtro === "sem-data")}
              >
                sem data
              </button>
            ) : null}
            {estante.status === "lido" ? (
              <button
                type="button"
                aria-pressed={filtro === "4mais"}
                onClick={() => setFiltro("4mais")}
                className={pill(filtro === "4mais")}
              >
                ★ 4+
              </button>
            ) : null}
            {todos.some((l) => l.amei) ? (
              <button
                type="button"
                aria-pressed={filtro === "amei"}
                onClick={() => setFiltro("amei")}
                className={pill(filtro === "amei")}
              >
                ♥ amei
              </button>
            ) : null}
          </div>
          <div
            role="group"
            aria-label="modo de ver"
            className="flex flex-none overflow-hidden rounded-pill border border-bege bg-creme-quente"
          >
            {(["lista", "grade"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={vista === v}
                onClick={() => setVista(v)}
                className={`min-h-11 rounded-pill px-3 text-[10px] font-semibold tracking-[.1em] uppercase lg:min-h-8 ${vista === v ? "bg-bordo text-creme" : "text-cinza"}`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 px-6 pt-4 pb-8 lg:px-0 lg:pt-8">
          {lista.length === 0 ? (
            <div className="pt-8 text-center">
              <p aria-hidden className="text-xl text-ouro">
                ✦
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold italic text-ameixa">
                {todos.length
                  ? "nenhum livro com esse filtro"
                  : "essa estante ainda está vazia"}
              </h2>
              {!todos.length ? (
                <BotaoLink
                  href={`/buscar?estante=${estante.id}`}
                  className="mx-auto mt-5 !h-11 max-w-[220px] !text-sm"
                >
                  buscar um livro
                </BotaoLink>
              ) : null}
            </div>
          ) : vista === "grade" ? (
            <ul className="grid grid-cols-3 gap-x-3 gap-y-5 lg:grid-cols-6 lg:gap-x-6 xl:grid-cols-8">
              {lista.map((l) => (
                <li key={l.id}>
                  <Link href={`/livro/${l.id}`} className="block">
                    <CapaLivro
                      titulo={l.titulo}
                      capa={l.capa}
                      cor={corDoLivro(l.id)}
                      className="w-full [&>span:last-child]:text-[10px]"
                    />
                    <h3 className="mt-2 font-display text-sm leading-[1.2] font-semibold italic">
                      {l.titulo}
                    </h3>
                    <p className="mt-1 text-[9px] font-semibold tracking-[.08em] text-cinza uppercase">
                      {meta(l)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            grupos.map((g, gi) => (
              <section key={g.mes} className={gi ? "mt-[18px]" : ""}>
                {estante.status === "lido" ? (
                  <h2 className="mb-0.5 font-display text-lg leading-[1.2] font-semibold italic text-bordo">
                    {g.mes}
                  </h2>
                ) : null}
                <ul className="lg:grid lg:grid-cols-2 lg:gap-x-10">
                  {g.livros.map((l, i) => {
                    const genero = generoDe(l.id);
                    return (
                      <li key={l.id}>
                        <Link
                          href={`/livro/${l.id}`}
                          className={`flex items-start gap-3.5 py-3 ${i ? "border-t border-linha" : ""} lg:border-t lg:border-linha`}
                        >
                          <CapaLivro
                            titulo={l.titulo}
                            capa={l.capa}
                            cor={corDoLivro(l.id)}
                            className="w-[54px] [&>span:last-child]:hidden"
                          />
                          <span className="min-w-0">
                            <span className="block text-[9px] font-semibold tracking-[.12em] text-cinza uppercase">
                              {meta(l)}
                            </span>
                            <h3 className="mt-1.5 font-display text-base leading-[1.2] font-semibold italic">
                              {l.titulo}
                            </h3>
                            <span className="mt-1 block font-accent text-xs italic text-cinza">
                              {l.autor}
                            </span>
                            {genero ? (
                              <span className="mt-[7px] inline-block rounded-pill bg-linha/70 px-2 py-1 text-[9px] font-semibold text-bordo">
                                {genero}
                              </span>
                            ) : null}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
