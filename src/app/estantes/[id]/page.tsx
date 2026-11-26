"use client";

import { Voltar } from "@/components/Voltar";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FilaDaPrateleira,
  GradeDeLivros,
  ListaDeLivros,
  SeletorDeFace,
  SeletorDeVista,
  useFaceSalva,
  useVistaSalva,
} from "@/components/estantes/Biblioteca";
import { useAcoesDoLivro } from "@/components/estantes/AcoesDoLivro";
import { AppShell } from "@/components/AppShell";
import { AvisoRemovido } from "@/components/AvisoRemovido";
import { useHidratado } from "@/components/PerfilHidratacao";
import { BotaoLink } from "@/components/ui/Botao";
import {
  livrosDaEstante,
  mesDe,
  todasAsEstantes,
  type EstanteInfo,
} from "@/lib/estantes";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";

/** "todos", um ano ("2025"), "sem-data", "4mais" ou "amei" */
type Filtro = string;

/** a data que vale para o livro nesta estante (nos lidos: só quando terminou) */
function dataDoLivro(l: LivroSalvo) {
  if (l.status === "lido") return l.lidoEm;
  return l.lidoEm ?? l.iniciadoEm ?? l.adicionadoEm;
}

/** quantos livros cabem em cada andar da estante, pela largura da tela */
function usePorAndar(face: "capas" | "lombadas") {
  const [largura, setLargura] = useState(1200);
  useEffect(() => {
    const medir = () => setLargura(window.innerWidth);
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);
  const celular = largura < 640;
  const util = largura >= 1024 ? largura - 380 : largura - 40;
  const porLivro = face === "lombadas" ? 36 : celular ? 96 : 118;
  return { porAndar: Math.max(3, Math.floor(util / porLivro)), alturaCapa: celular ? 118 : 150 };
}

export default function EstanteAbertaPage() {
  const { id } = useParams<{ id: string }>();
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  const proprias = usePerfil((s) => s.estantesProprias);
  const idsFavoritos = usePerfil((s) => s.favoritos);
  const [vista, setVista] = useVistaSalva();
  const [face, setFace] = useFaceSalva();
  const { acoesDoLivro, estantesDoLivro, janela } = useAcoesDoLivro();
  const { porAndar, alturaCapa } = usePorAndar(face);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");

  if (!hidratado) return <AppShell aba="estantes">{null}</AppShell>;
  // além das estantes, "todos os livros" e "meus favoritos" também abrem aqui
  const etiqueta = { fundo: "#6B0D24", texto: "#F9F5EE" };
  const estante: EstanteInfo | undefined =
    id === "todos"
      ? { id: "todos", nome: "todos os livros", etiqueta }
      : id === "favoritos"
        ? { id: "favoritos", nome: "meus favoritos", etiqueta }
        : todasAsEstantes(proprias ?? []).find((e) => e.id === id);
  if (!estante) notFound();
  const ehLidos = estante.status === "lido";

  const todos =
    estante.id === "todos"
      ? [...livros].sort((a, b) => (b.adicionadoEm ?? "").localeCompare(a.adicionadoEm ?? ""))
      : estante.id === "favoritos"
        ? (idsFavoritos ?? []).map((f) => livros.find((l) => l.id === f)).filter((l): l is LivroSalvo => !!l)
        : livrosDaEstante(estante, livros);
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
    estante.id === "todos"
      ? "sua biblioteca inteira"
      : estante.id === "favoritos"
        ? "em destaque no seu perfil"
        :
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
            href={estante.id === "favoritos" ? "/perfil/favoritos" : estante.id === "todos" ? "/buscar" : `/buscar?estante=${estante.id}`}
            aria-label={estante.id === "favoritos" ? "escolher favoritos" : `adicionar livro em ${estante.nome}`}
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

        <div className="mt-5 flex flex-col gap-3 px-6 lg:flex-row lg:items-center lg:justify-between lg:gap-2 lg:border-b lg:border-fio lg:px-0 lg:pb-6">
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
          <div className="relative z-30 flex items-center justify-between gap-3 lg:flex-none">
            {/* no celular, capas/lombadas fica na mesma linha do modo */}
            <span className="lg:hidden">{vista === "estante" && lista.length ? <SeletorDeFace face={face} onChange={setFace} /> : null}</span>
            <SeletorDeVista vista={vista} onChange={setVista} />
          </div>
        </div>

        {vista === "estante" && lista.length ? (
          <div className="relative z-30 mt-4 hidden lg:block">
            <SeletorDeFace face={face} onChange={setFace} />
          </div>
        ) : null}
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
          ) : vista === "estante" ? (
            <div className="space-y-10">
              {Array.from({ length: Math.ceil(lista.length / porAndar) }, (_, k) => (
                <FilaDaPrateleira key={k} livros={lista.slice(k * porAndar, (k + 1) * porAndar)} altura={alturaCapa} face={face} />
              ))}
            </div>
          ) : vista === "grade" ? (
            <GradeDeLivros livros={lista} />
          ) : (
            grupos.map((g, gi) => (
              <section key={g.mes} className={gi ? "mt-8" : ""}>
                {ehLidos ? <h2 className="mb-2 font-revista text-[20px] leading-[1.2] text-bordo italic">{g.mes}</h2> : null}
                <ListaDeLivros livros={g.livros} acoesDoLivro={acoesDoLivro} estantesDoLivro={estantesDoLivro} />
              </section>
            ))
          )}
        </div>
      </div>
      {janela}
    </AppShell>
  );
}
