"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import { BotaoLink } from "@/components/ui/Botao";
import { corDoLivro } from "@/lib/cores";
import { livrosDaEstante, todasAsEstantes, type EstanteInfo } from "@/lib/estantes";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";

type Filtro = "todos" | string;

function Etiqueta({ e, qtd }: { e: EstanteInfo; qtd: number }) {
  return (
    <span
      className="inline-flex h-[22px] items-center rounded-pill px-2.5 text-[9px] font-semibold tracking-[.1em] uppercase"
      style={{ background: e.etiqueta.fundo, color: e.etiqueta.texto }}
    >
      {qtd} {qtd === 1 ? "livro" : "livros"}
    </span>
  );
}

function Prateleira({ e, livros }: { e: EstanteInfo; livros: LivroSalvo[] }) {
  return (
    <section className="animate-subir">
      <Link href={`/estantes/${e.id}`} className="block">
        <div className="relative flex h-[126px] gap-3 px-0.5">
          {livros.slice(0, 4).map((l) => (
            <CapaLivro key={l.id} titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className="w-[74px] self-start" />
          ))}
          {livros.length === 0 ? (
            <span className="flex aspect-[2/3] w-[74px] items-center justify-center self-start rounded-[2px_5px_5px_2px] border border-dashed border-rosa-antigo text-xl text-rosa-antigo">
              +
            </span>
          ) : null}
          <div aria-hidden className="absolute inset-x-[-8px] top-[110px] h-[9px] rounded-[3px] bg-gradient-to-b from-linha to-bege shadow-[0_2px_0_#C4AC93]" />
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="flex items-center gap-2">
            <Etiqueta e={e} qtd={livros.length} />
            <span className="font-display text-xl leading-none font-semibold italic text-bordo">{e.nome}</span>
          </span>
          <span className="eyebrow !text-[10px] text-cinza">abrir →</span>
        </div>
      </Link>
    </section>
  );
}

function Leque({ e, livros }: { e: EstanteInfo; livros: LivroSalvo[] }) {
  const giros = ["-10deg", "0deg", "10deg"];
  return (
    <Link href={`/estantes/${e.id}`} className="block animate-subir rounded-md border border-linha bg-creme-quente px-4 py-3.5">
      <div className="flex items-center justify-between">
        <span className="font-display text-xl leading-none font-semibold italic text-bordo">{e.nome}</span>
        <Etiqueta e={e} qtd={livros.length} />
      </div>
      <div className="relative mt-1 flex h-[124px] justify-center">
        {livros.length ? (
          livros.slice(0, 3).map((l, i) => (
            <div key={l.id} className="-mx-1.5 mt-2 w-20" style={{ transform: `rotate(${giros[i]})`, marginTop: i === 1 ? 2 : 10 }}>
              <CapaLivro titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className="w-full" />
            </div>
          ))
        ) : (
          <p className="self-center font-accent text-sm italic text-cinza">ainda sem livros ✦</p>
        )}
      </div>
    </Link>
  );
}

function EstantesWeb({ estantes, livros, favoritos }: { estantes: EstanteInfo[]; livros: LivroSalvo[]; favoritos: LivroSalvo[] }) {
  const [aba, setAba] = useState<Filtro>("todas");
  const lidos = livros.filter((l) => l.status === "lido");
  const paginas = lidos.reduce((t, l) => t + (l.paginas ?? 0), 0);
  const linhas = [
    ...estantes.map((e) => ({ id: e.id, nome: e.nome, livros: livrosDaEstante(e, livros), link: `/estantes/${e.id}` })),
    { id: "favoritos", nome: "favoritos", livros: favoritos, link: "/perfil/favoritos" },
  ];
  const ordem = ["lendo", "favoritos", "lidos", "quero-ler"];
  linhas.sort((a, b) => (ordem.indexOf(a.id) + 1 || 99) - (ordem.indexOf(b.id) + 1 || 99));
  const visiveis = aba === "todas" ? linhas.filter((l) => l.livros.length || (l.id !== "lendo" && l.id !== "favoritos")) : linhas.filter((l) => l.id === aba);

  return (
    <div className="hidden min-h-dvh bg-jornal font-texto text-tinta lg:block">
      <div className="flex items-end justify-between border-b border-fio px-14 pt-12 pb-8">
        <div>
          <h1 className="font-revista text-[44px] leading-none italic">minhas estantes</h1>
          <p className="mt-2.5 text-[13px] font-medium text-grafite">
            {lidos.length} {lidos.length === 1 ? "livro lido" : "livros lidos"}
            {paginas ? ` · ${paginas.toLocaleString("pt-BR")} páginas` : ""} · {livros.length} na estante
          </p>
        </div>
        <div className="flex items-end gap-7">
          <nav aria-label="filtrar estantes" className="flex gap-7">
            {[{ id: "todas", nome: "todas" }, ...linhas.map((l) => ({ id: l.id, nome: l.nome === "lendo agora" ? "lendo" : l.nome }))].map((t) => (
              <button
                key={t.id}
                type="button"
                aria-pressed={aba === t.id}
                onClick={() => setAba(t.id)}
                className={`border-b-2 pb-2.5 text-[11px] font-bold tracking-[.1em] uppercase ${aba === t.id ? "border-vinho text-vinho" : "border-transparent text-grafite hover:text-tinta"}`}
              >
                {t.nome}
              </button>
            ))}
          </nav>
          <Link href="/estantes/nova" className="mb-1.5 rounded-pill border border-vinho px-4 py-2.5 text-[11px] font-bold tracking-[.1em] text-vinho uppercase hover:bg-vinho/5">
            + nova estante
          </Link>
        </div>
      </div>
      <div className="px-14 pt-10 pb-16">
        {visiveis.map((linha) => (
          <section key={linha.id} className="mb-12">
            <div className="mb-[18px] flex items-baseline justify-between border-b border-tinta pb-2">
              <h2 className="font-revista text-2xl leading-none italic">
                {linha.nome}
                <span className="ml-2.5 font-texto text-[11px] font-semibold text-grafite not-italic">· {linha.livros.length}</span>
              </h2>
              <Link href={linha.link} className="border-b border-vinho pb-0.5 text-[10px] font-bold tracking-[.12em] text-vinho uppercase">
                {linha.id === "favoritos" ? "escolher →" : "ver todos →"}
              </Link>
            </div>
            {linha.id === "favoritos" && !linha.livros.length ? (
              <p className="font-revista text-sm italic text-grafite">escolha até 4 livros para ficarem em destaque no seu perfil.</p>
            ) : null}
            <ul className="grid grid-cols-8 gap-4">
              {linha.livros.slice(0, linha.id === "favoritos" ? 8 : 7).map((l) => (
                <li key={l.id}>
                  <Link href={`/livro/${l.id}`} className="block">
                    <CapaLivro titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className="w-full [&>span:last-child]:text-[11px]" />
                    <i className="mt-2 block text-center text-[11px] leading-[1.3] text-grafite not-italic">{l.titulo}</i>
                  </Link>
                </li>
              ))}
              {linha.id !== "favoritos" ? (
                <li>
                  <Link
                    href={`/buscar?estante=${linha.id}`}
                    aria-label={`adicionar livro em ${linha.nome}`}
                    className="flex aspect-[2/3] items-center justify-center rounded-[2px] border-[1.5px] border-dashed border-ouro text-2xl font-semibold text-vinho hover:bg-vinho/5"
                  >
                    +
                  </Link>
                </li>
              ) : null}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export default function EstantesPage() {
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  const proprias = usePerfil((s) => s.estantesProprias);
  const idsFavoritos = usePerfil((s) => s.favoritos);
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [leque, setLeque] = useState(false);

  if (!hidratado) return <AppShell aba="estantes">{null}</AppShell>;

  const estantes = todasAsEstantes(proprias ?? []);
  const favoritos = (idsFavoritos ?? []).map((id) => livros.find((l) => l.id === id)).filter((l) => l !== undefined);
  const comLivros = estantes.filter((e) => e.propria || livrosDaEstante(e, livros).length || e.id !== "lendo");
  const visiveis = filtro === "todos" ? comLivros : comLivros.filter((e) => e.id === filtro);

  return (
    <AppShell aba="estantes">
      <EstantesWeb estantes={estantes} livros={livros} favoritos={favoritos} />

      <div className="flex flex-1 flex-col lg:hidden">
        <header className="flex items-center justify-between px-6 pt-2">
          {leque ? (
            <button type="button" onClick={() => setLeque(false)} className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo">
              ‹ prateleiras
            </button>
          ) : (
            <span className="text-[13px] font-semibold">estantes</span>
          )}
          <Link href="/estantes/nova" className="-mr-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo">
            + nova estante
          </Link>
        </header>

        <div className="animate-subir px-6 pt-3">
          <h1 className="font-display text-[32px] leading-[1.1] font-semibold italic text-bordo">minhas estantes</h1>
          <p className="mt-2 font-accent text-sm italic text-cinza">
            {livros.length} {livros.length === 1 ? "livro" : "livros"} em {comLivros.length} estantes ✦
          </p>
        </div>

        {livros.length === 0 ? (
          <div className="mx-6 mt-8 rounded-md border border-linha bg-creme-quente px-6 py-8 text-center">
            <p aria-hidden className="text-xl text-ouro">✦</p>
            <p className="eyebrow mt-2 text-bordo">estante vazia</p>
            <h2 className="mt-2 font-display text-2xl leading-[1.15] font-semibold italic text-ameixa">
              sua estante ainda
              <br />
              está em branco
            </h2>
            <p className="mt-2 text-[13px] text-cinza">adicione o primeiro livro que você quer ler.</p>
            <BotaoLink href="/buscar" className="mx-auto mt-5 !h-11 max-w-[220px] !text-sm">
              buscar um livro
            </BotaoLink>
          </div>
        ) : (
          <>
            {!leque ? (
              <div className="mt-5 flex gap-[7px] overflow-x-auto px-6 pb-1 [scrollbar-width:none]">
                {[{ id: "todos", nome: `todos · ${livros.length}` }, ...comLivros.map((e) => ({ id: e.id, nome: `${e.nome} · ${livrosDaEstante(e, livros).length}` }))].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={filtro === f.id}
                    onClick={() => setFiltro(f.id)}
                    className={`flex h-9 flex-none items-center rounded-pill border px-[13px] text-xs font-semibold whitespace-nowrap ${
                      filtro === f.id ? "border-bordo bg-bordo text-creme" : "border-bege bg-creme-quente text-ameixa"
                    }`}
                  >
                    {f.nome}
                  </button>
                ))}
              </div>
            ) : null}

            <div className={`flex flex-col px-6 pt-6 pb-6 ${leque ? "gap-4" : "gap-10"}`}>
              {visiveis.map((e) =>
                leque ? <Leque key={e.id} e={e} livros={livrosDaEstante(e, livros)} /> : <Prateleira key={e.id} e={e} livros={livrosDaEstante(e, livros)} />,
              )}
            </div>

            {!leque ? (
              <p className="pb-6 text-center">
                <button
                  type="button"
                  onClick={() => setLeque(true)}
                  className="py-2 font-accent text-sm italic text-cinza underline decoration-bege underline-offset-4"
                >
                  ver como leque de capas ✧
                </button>
              </p>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}
