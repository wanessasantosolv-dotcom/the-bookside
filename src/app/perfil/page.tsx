"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { AppShell } from "@/components/AppShell";
import { PerfilWeb } from "@/components/perfil/PerfilWeb";
import { useHidratado } from "@/components/PerfilHidratacao";
import { corDoLivro } from "@/lib/cores";
import { temas } from "@/lib/dados";
import { usePerfil } from "@/lib/perfil-store";
import { arquetipos, type ArquetipoId } from "@/lib/teste";
import { useTeste } from "@/lib/teste-store";

const iconeBotao = "flex size-11 items-center justify-center rounded-full";

export default function PerfilPage() {
  const router = useRouter();
  const hidratado = useHidratado();
  const p = usePerfil();
  const tema = temas.find((t) => t.id === p.tema) ?? temas[0];
  const escuro = "escuro" in tema;

  if (!hidratado) return <AppShell aba="perfil">{null}</AppShell>;

  const lidos = p.livros.filter((l) => l.status === "lido");
  const lendo = p.livros.filter((l) => !l.status || l.status === "lendo");
  const quero = p.livros.filter((l) => l.status === "quero");
  const escolhidos = p.favoritos.map((id) => p.livros.find((l) => l.id === id)).filter((l) => l !== undefined);
  const favoritos = (escolhidos.length ? escolhidos : [...lidos, ...lendo, ...quero]).slice(0, 4);
  const arquetipo = p.bookside ? arquetipos[p.bookside.principal as ArquetipoId] : null;

  function abrirResultado() {
    if (!p.bookside) return router.push("/teste");
    // recoloca as respostas salvas para reabrir a carta
    const { responder } = useTeste.getState();
    p.bookside.respostas.forEach((r, i) => r !== null && responder(i, r));
    router.push("/teste/resultado");
  }

  const estilo = {
    "--papel": escuro ? tema.papel : "#F9F5EE",
    "--tinta": escuro ? "#F5EFE6" : "#2B1420",
    "--acc": escuro ? tema.texto : tema.id === "biblioteca-classica" ? "#6B0D24" : tema.texto,
    "--suave": escuro ? "#CFC3B8" : "#7A6A6E",
    "--linha": escuro ? "rgba(245,239,230,.18)" : "#E6D5CE",
  } as CSSProperties;

  const estantes = [
    { id: "lidos", nome: "lidos", qtd: lidos.length, fundo: "#D8C3AA", titulo: "#2B1420", num: "#6B0D24", livro: lidos[0] },
    { id: "quero-ler", nome: "quero ler", qtd: quero.length, fundo: "#6B0D24", titulo: "#F9F5EE", num: "#E8B4BF", livro: quero[0] },
    { id: "lendo", nome: "lendo", qtd: lendo.length, fundo: "#E8B4BF", titulo: "#6B0D24", num: "#6B0D24", livro: lendo[0] },
  ];

  return (
    <AppShell aba="perfil" style={estilo} className="[&_main]:!bg-[var(--papel)] [&_main]:!text-[var(--tinta)]">
      <PerfilWeb
        perfil={p}
        tema={tema}
        arquetipo={arquetipo}
        lidos={lidos}
        lendo={lendo}
        quero={quero}
        favoritos={favoritos}
        abrirResultado={abrirResultado}
      />
      <div className="flex min-h-dvh flex-col bg-[var(--papel)] text-[var(--tinta)] lg:hidden">
        {/* barra do app */}
        <header className="flex items-center justify-between px-6 pt-3 pb-1">
          <span className="font-display text-[19px] font-semibold italic text-[var(--acc)]">
            the bookside <span className="text-ouro">✦</span>
          </span>
          <span className="-mr-3 flex">
            <Link href="/perfil/editar" aria-label="editar perfil" className={`${iconeBotao} text-[var(--acc)]`}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </Link>
            <Link href="/perfil/configuracoes" aria-label="configurações" className={`${iconeBotao} text-[var(--acc)]`}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.6.76 1 1.4 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </Link>
          </span>
        </header>

        {/* capa */}
        <div
          className={`relative h-[198px] bg-cover bg-[50%_40%] ${p.capaImagem ? "" : `pat-${p.capa}`}`}
          style={p.capaImagem ? { backgroundImage: `url(${p.capaImagem})` } : undefined}
        />

        <section className="relative -mt-8 rounded-t-[34px] bg-[var(--papel)] px-6 pb-8">
          {/* avatar */}
          <div className="relative mx-auto -mt-[52px] size-[104px] animate-subir">
            <div className="size-full overflow-hidden rounded-full border-4 border-[var(--papel)] bg-linha">
              {p.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.foto} alt="sua foto" className="size-full object-cover object-[50%_30%]" />
              ) : (
                <span className="flex size-full items-center justify-center font-display text-4xl font-semibold italic text-bordo">
                  {(p.nome || "?").slice(0, 1).toLowerCase()}
                </span>
              )}
            </div>
            <span
              aria-hidden
              className="absolute top-[74px] left-[76px] flex size-7 items-center justify-center rounded-full border-2 border-[var(--papel)] bg-bordo"
            >
              <svg width="12" height="12" viewBox="0 0 24 24">
                <path d="M12 2 L14.6 9.4 L22 12 L14.6 14.6 L12 22 L9.4 14.6 L2 12 L9.4 9.4 Z" fill="#F9F5EE" />
              </svg>
            </span>
          </div>

          <h1 className="mt-4 animate-subir text-center font-display text-[32px] leading-none font-semibold italic text-[var(--acc)] [animation-delay:.12s]">
            {p.nome || "sem nome"}
          </h1>
          <p className="mt-2.5 text-center text-xs font-medium text-[var(--suave)]">@{p.usuario || "seu.nome"}</p>
          {p.frase ? (
            <p className="mx-4 mt-3 animate-subir text-center font-accent text-[15px] leading-5 italic text-[var(--acc)] [animation-delay:.24s]">
              {p.frase}
            </p>
          ) : null}

          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={abrirResultado}
              className="flex min-h-7 items-center rounded-pill border border-[var(--acc)] px-4 py-1 text-[10px] font-semibold tracking-[.1em] text-[var(--acc)] uppercase"
            >
              {arquetipo ? `♡ ${arquetipo.nome.replace(/^a /, "")} · ${tema.nome}` : "✧ descobrir meu bookside"}
            </button>
          </div>

          {/* números */}
          <Link href="/numeros" aria-label="ver seus números" className="relative mt-5 flex border-y border-[var(--linha)]">
            {[
              { n: lidos.length, r: "lidos" },
              { n: lendo.length, r: "lendo" },
              { n: quero.length, r: "quero ler" },
              { n: p.meta ?? "—", r: `meta ${new Date().getFullYear()}` },
            ].map((s, i) => (
              <span key={s.r} className={`flex h-14 flex-1 flex-col items-center justify-center ${i ? "border-l border-[var(--linha)]" : ""}`}>
                <b className="font-display text-[23px] leading-none font-semibold italic text-[var(--acc)]">{s.n}</b>
                <i className="mt-1.5 text-[10px] leading-none font-medium not-italic text-[var(--suave)]">{s.r}</i>
              </span>
            ))}
          </Link>

          {/* favoritos */}
          <div className="mt-6 flex items-baseline justify-between">
            <h2 className="font-display text-[22px] leading-[1.15] font-semibold italic text-[var(--acc)]">favoritos</h2>
            <Link href="/estantes" className="py-2 text-[10px] font-semibold tracking-[.12em] text-[var(--acc)] uppercase">
              ver todos →
            </Link>
          </div>
          <ul className="mt-2 grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }, (_, i) => {
              const l = favoritos[i];
              return (
                <li key={l?.id ?? i}>
                  {l ? (
                    <Link href={`/livro/${l.id}`} className="block">
                      <CapaLivro titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className="w-full" />
                    </Link>
                  ) : (
                    <Link
                      href="/estantes"
                      aria-label="adicionar favorito"
                      className="flex aspect-[2/3] items-center justify-center rounded-[2px_5px_5px_2px] border border-dashed border-rosa-antigo text-xl text-rosa-antigo"
                    >
                      +
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>

          {/* estantes */}
          <div className="mt-6 flex items-baseline justify-between">
            <h2 className="font-display text-[22px] leading-[1.15] font-semibold italic text-[var(--acc)]">estantes</h2>
            <Link href="/estantes" className="py-2 text-[10px] font-semibold tracking-[.12em] text-[var(--acc)] uppercase">
              ver todas →
            </Link>
          </div>
          <ul className="mt-2 grid grid-cols-3 gap-[9px]">
            {estantes.map((e) => (
              <li key={e.nome}>
                <Link href={`/estantes/${e.id}`} className="block rounded-md px-2 py-2.5 text-center" style={{ background: e.fundo }}>
                  {e.livro ? (
                    <CapaLivro titulo={e.livro.titulo} capa={e.livro.capa} cor={corDoLivro(e.livro.id)} className="mx-auto w-[38px] [&>span:last-child]:hidden" />
                  ) : (
                    <span aria-hidden className="mx-auto block aspect-[2/3] w-[38px] rounded-[3px] border border-dashed opacity-60" style={{ borderColor: e.titulo }} />
                  )}
                  <b className="mt-[7px] block font-display text-sm leading-[1.1] font-semibold italic" style={{ color: e.titulo }}>
                    {e.nome}
                  </b>
                  <i className="mt-[3px] block text-[10px] leading-none font-semibold tracking-[.1em] not-italic" style={{ color: e.num }}>
                    {e.qtd}
                  </i>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
