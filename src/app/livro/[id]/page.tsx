"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import { livroLembrado, sinopseDaObra } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { estrelas, infoDoLivro, todasAsEstantes } from "@/lib/estantes";
import { usePerfil, type StatusLivro } from "@/lib/perfil-store";

const acoes: { status: StatusLivro; rotulo: string }[] = [
  { status: "lendo", rotulo: "lendo" },
  { status: "lido", rotulo: "já li ✓" },
  { status: "quero", rotulo: "quero ler ♡" },
];

export default function LivroPage() {
  const { id } = useParams<{ id: string }>();
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  const proprias = usePerfil((s) => s.estantesProprias);
  const editarLivro = usePerfil((s) => s.editarLivro);
  const removerLivro = usePerfil((s) => s.removerLivro);
  const [sinopseOL, setSinopseOL] = useState<string>();

  useEffect(() => {
    const c = new AbortController();
    sinopseDaObra(id, c.signal)
      .then(setSinopseOL)
      .catch(() => {});
    return () => c.abort();
  }, [id]);

  if (!hidratado) return <AppShell aba="estantes">{null}</AppShell>;
  const encontrado = infoDoLivro(id, livros, livroLembrado(id));
  if (!encontrado) notFound();
  const livro = { ...encontrado, sinopse: encontrado.sinopse ?? sinopseOL };
  const salvo = livros.some((l) => l.id === id);
  const status = salvo ? (livro.status ?? "lendo") : null;
  const base = { id: livro.id, titulo: livro.titulo, autor: livro.autor, capa: livro.capa };
  const estantesProprias = todasAsEstantes(proprias ?? []).filter((e) => e.propria);
  const progresso = livro.paginas && livro.paginaAtual ? Math.round((livro.paginaAtual / livro.paginas) * 100) : null;
  const voltar = status === "lido" ? { href: "/estantes/lidos", r: "lidos" } : status === "quero" ? { href: "/estantes/quero-ler", r: "quero ler" } : status === "lendo" ? { href: "/estantes/lendo", r: "lendo" } : { href: "/estantes", r: "estantes" };

  function marcar(s: StatusLivro) {
    const agora = new Date().toISOString();
    editarLivro(base, {
      status: s,
      paginas: livro!.paginas,
      ...(s === "lendo" ? { iniciadoEm: livro!.iniciadoEm ?? agora } : {}),
      ...(s === "lido" ? { lidoEm: livro!.lidoEm ?? agora, paginaAtual: livro!.paginas } : {}),
    });
  }

  function alternarEstante(eid: string) {
    const atual = livro!.estantes ?? [];
    editarLivro(base, {
      status: livro!.status ?? "quero",
      estantes: atual.includes(eid) ? atual.filter((x) => x !== eid) : [...atual, eid],
    });
  }

  const titulo = "font-display text-[28px] leading-[1.08] font-semibold italic text-bordo lg:font-revista lg:text-[40px] lg:leading-[1.1] lg:font-normal lg:text-tinta";
  const secao = "eyebrow text-bordo lg:text-[10px] lg:tracking-[.18em] lg:text-grafite";

  return (
    <AppShell aba="estantes">
      <div className="flex flex-1 flex-col lg:bg-jornal">
        <header className="flex items-center justify-between px-6 pt-2 lg:hidden">
          <Link href={voltar.href} className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo">
            ‹ {voltar.r}
          </Link>
          <span className="eyebrow !text-[10px] text-cinza">o livro</span>
        </header>

        {/* topo: capa + dados */}
        <div className="flex animate-subir gap-[18px] px-6 pt-2 lg:gap-11 lg:border-b lg:border-fio lg:bg-[#F3ECDF] lg:px-14 lg:py-12">
          <CapaLivro
            titulo={livro.titulo} capa={livro.capa}
            cor={corDoLivro(livro.id)}
            className="w-[120px] [&>span:last-child]:text-sm lg:w-[200px] lg:shadow-[10px_10px_0_#C9A46A] lg:[&>span:last-child]:text-xl"
          />
          <div className="min-w-0 flex-1 lg:max-w-[560px] lg:pt-2">
            {livro.genero ? <p className="hidden text-[10px] font-semibold tracking-[.18em] text-grafite uppercase lg:mb-2.5 lg:block">{livro.genero}</p> : null}
            <h1 className={titulo}>{livro.titulo}</h1>
            <p className="mt-[7px] font-accent text-sm italic text-cinza lg:font-texto lg:text-sm lg:not-italic">
              {livro.autor}
              <span className="hidden lg:inline">{livro.paginas ? ` · ${livro.paginas} páginas` : ""}</span>
            </p>
            <p className="mt-2.5 text-[13px] text-cinza lg:hidden">{[livro.paginas ? `${livro.paginas} páginas` : null, livro.ano].filter(Boolean).join(" · ")}</p>
            {livro.genero ? (
              <span className="mt-2.5 inline-block rounded-pill bg-[#F1E4DC] px-2 py-1 text-[9px] font-semibold text-bordo lg:hidden">{livro.genero}</span>
            ) : null}
            {livro.nota ? (
              <>
                <p className="eyebrow mt-3.5 mb-1 text-bordo lg:hidden">sua nota</p>
                <p className="text-[15px] font-semibold tracking-[2px] text-bordo lg:mt-4 lg:text-lg">{estrelas(livro.nota)}</p>
              </>
            ) : null}
            {livro.sinopse ? <p className="mt-[18px] hidden max-w-[520px] text-sm leading-[1.6] text-tinta-suave lg:block">{livro.sinopse}</p> : null}

            <div className="mt-[22px] hidden gap-3.5 lg:flex">
              {!salvo ? (
                <button type="button" onClick={() => marcar("quero")} className="rounded-pill bg-vinho px-[22px] py-3 text-[11px] font-bold tracking-[.1em] text-jornal uppercase">
                  + adicionar à estante
                </button>
              ) : null}
              <Link href={`/livro/${livro.id}/avaliar`} className="rounded-pill border border-vinho px-[22px] py-3 text-[11px] font-bold tracking-[.1em] text-vinho uppercase">
                avaliar
              </Link>
              {status === "lendo" ? (
                <Link href={`/livro/${livro.id}/progresso`} className="rounded-pill border border-vinho px-[22px] py-3 text-[11px] font-bold tracking-[.1em] text-vinho uppercase">
                  atualizar progresso
                </Link>
              ) : null}
            </div>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-11 lg:px-14 lg:pt-10 lg:pb-16">
          <div>
            {/* status */}
            <fieldset className="mt-5 flex gap-2 px-6 lg:mt-0 lg:px-0">
              <legend className="sr-only">status do livro</legend>
              {acoes.map((a) => {
                const on = status === a.status;
                return (
                  <button
                    key={a.status}
                    type="button"
                    aria-pressed={on}
                    onClick={() => marcar(a.status)}
                    className={`flex h-11 flex-1 items-center justify-center rounded-pill border border-bordo text-[13px] font-semibold ${on ? "bg-bordo text-creme" : "text-bordo hover:bg-rosa-fundo"}`}
                  >
                    {a.rotulo}
                  </button>
                );
              })}
            </fieldset>

            {status === "lendo" ? (
              <Link href={`/livro/${livro.id}/progresso`} className="mx-6 mt-4 block rounded-md border border-linha bg-creme-quente p-4 lg:mx-0">
                <div className="flex items-baseline justify-between">
                  <span className="eyebrow text-bordo">lendo agora</span>
                  <span className="text-xs font-semibold text-bordo">{progresso !== null ? `${progresso}%` : "atualizar →"}</span>
                </div>
                <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-[#F1E4DC]">
                  <i className="block h-full rounded-full bg-bordo" style={{ width: `${progresso ?? 0}%` }} />
                </div>
                <p className="mt-2 text-xs text-cinza">
                  {livro.paginaAtual && livro.paginas ? `página ${livro.paginaAtual} de ${livro.paginas}` : "quantas páginas já foram? toque para atualizar"}
                </p>
              </Link>
            ) : null}
            {status === "lido" ? (
              <Link href={`/livro/${livro.id}/avaliar`} className="mx-6 mt-4 flex min-h-11 items-center justify-between rounded-md border border-linha bg-creme-quente px-4 lg:mx-0">
                <span className="text-[13px] font-semibold">{livro.nota ? "editar sua avaliação" : "avaliar este livro"}</span>
                <span className="text-sm text-bordo">{livro.nota ? estrelas(livro.nota) : "★ →"}</span>
              </Link>
            ) : null}

            {livro.sinopse ? (
              <section className="mt-6 px-6 lg:hidden">
                <p className={secao}>sinopse</p>
                <p className="mt-2 text-[13px] leading-normal">{livro.sinopse}</p>
              </section>
            ) : null}

            {livro.resenha || livro.anotacao ? (
              <section className="mx-6 mt-6 rounded-md border border-linha bg-creme-quente px-4 py-3.5 lg:mx-0 lg:mt-8">
                <p className={secao}>{livro.resenha ? "sua resenha" : "sua anotação"}</p>
                <p className="mt-2 font-accent text-sm leading-[1.35] italic">“{livro.resenha ?? livro.anotacao}”</p>
              </section>
            ) : null}

            {estantesProprias.length ? (
              <section className="mt-6 px-6 lg:px-0">
                <p className={secao}>suas estantes</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {estantesProprias.map((e) => {
                    const on = !!livro.estantes?.includes(e.id);
                    return (
                      <button
                        key={e.id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => alternarEstante(e.id)}
                        className={`flex h-11 items-center gap-1.5 rounded-pill border px-3.5 text-xs font-semibold ${on ? "border-bordo bg-bordo text-creme" : "border-bege bg-creme-quente"}`}
                      >
                        <span aria-hidden className="size-2.5 rounded-full" style={{ background: e.etiqueta.fundo }} />
                        {e.nome}
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="mt-6 px-6 pb-8 lg:mt-0 lg:px-0 lg:pb-0">
            <div className="rounded-md border border-linha p-4 lg:rounded-[4px] lg:border-fio lg:p-5">
              <p className={secao}>entre suas amigas</p>
              <p className="mt-2 font-accent text-sm italic text-cinza">quando suas amigas lerem este livro, elas aparecem aqui.</p>
            </div>
            {salvo ? (
              <button
                type="button"
                onClick={() => removerLivro(livro.id)}
                className="mt-4 min-h-11 text-xs font-semibold text-cinza underline underline-offset-4 hover:text-bordo"
              >
                tirar da estante
              </button>
            ) : null}
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
