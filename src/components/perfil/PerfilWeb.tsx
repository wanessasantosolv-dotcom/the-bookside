"use client";

import { Voltar } from "@/components/Voltar";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { ConviteTeste } from "@/components/ConviteTeste";
import { corDoLivro } from "@/lib/cores";
import type { Tema } from "@/lib/dados";
import type { LivroSalvo, Perfil } from "@/lib/perfil-store";
import type { Arquetipo } from "@/lib/teste";

/** Escurece uma cor hex (para o degradê do topo). */
function escurecer(hex: string, fator = 0.45, alfa = 1) {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(v * fator),
  );
  return `rgba(${c.join(",")},${alfa})`;
}

const rotulo =
  "text-[9px] leading-[1.2] font-semibold tracking-[.14em] uppercase text-grafite";

function Coluna({
  titulo,
  href,
  livros,
  vazio,
}: {
  titulo: string;
  href: string;
  livros: LivroSalvo[];
  vazio: string;
}) {
  return (
    <section>
      <div className="mb-3.5 flex items-baseline justify-between border-b border-tinta pb-2">
        <h2 className="font-revista text-[19px] leading-none italic">
          {titulo}
        </h2>
        <Link
          href={href}
          className="text-[9px] font-bold tracking-[.1em] text-[var(--acc-web)] uppercase"
        >
          ver todos →
        </Link>
      </div>
      {livros.length ? (
        <ul className="flex gap-2.5">
          {livros.slice(0, 3).map((l) => (
            <li key={l.id} className="w-[84px]">
              <Link href={`/livro/${l.id}`} className="block">
                <CapaLivro
                  titulo={l.titulo}
                  capa={l.capa}
                  cor={corDoLivro(l.id)}
                  className="w-full"
                />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-revista text-[13px] leading-[1.4] italic text-grafite">
          {vazio}
        </p>
      )}
    </section>
  );
}

/** Perfil na versão web — opção C do canvas: topo cheio + números + 3 colunas. */
export function PerfilWeb({
  perfil: p,
  tema,
  arquetipo,
  lidos,
  lendo,
  quero,
  favoritos,
  abrirResultado,
  acoes,
  detalhe,
  links = {},
}: {
  perfil: Perfil;
  tema: Tema;
  arquetipo: Arquetipo | null;
  lidos: LivroSalvo[];
  lendo: LivroSalvo[];
  quero: LivroSalvo[];
  favoritos: LivroSalvo[];
  abrirResultado?: () => void;
  /** troca os botões do topo (ex.: "seguir" no perfil de outra pessoa) */
  acoes?: ReactNode;
  /** linha extra embaixo do @usuário (ex.: seguidores) */
  detalhe?: ReactNode;
  links?: {
    numeros?: string;
    favoritos?: string;
    lidos?: string;
    quero?: string;
  };
}) {
  const href = {
    numeros: "/numeros",
    favoritos: "/perfil/favoritos",
    lidos: "/estantes/lidos",
    quero: "/estantes/quero-ler",
    ...links,
  };
  const outra = !!acoes;
  const [copiado, setCopiado] = useState(false);
  const base = tema.id === "biblioteca-classica" ? "#692536" : tema.destaque;
  const acc = tema.id === "noite-de-tinta" ? "#692536" : base;

  async function compartilhar() {
    const url = `${window.location.origin}/perfil`;
    try {
      if (navigator.share)
        await navigator.share({ title: `${p.nome} · the bookside`, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }
    } catch {
      /* a pessoa cancelou */
    }
  }

  const botaoHero =
    "flex min-h-10 items-center rounded-pill border border-white/50 bg-black/25 px-4 text-[11px] font-bold tracking-[.1em] text-jornal uppercase backdrop-blur-sm hover:bg-black/35";

  return (
    <div
      className="hidden min-h-dvh bg-jornal font-texto text-tinta lg:block"
      style={{ ["--acc-web" as string]: acc }}
    >
      {/* topo */}
      <div
        className="relative flex h-[280px] items-end bg-cover bg-center px-14"
        style={{
          backgroundImage: p.capaImagem
            ? `url("${p.capaImagem}")` // a foto com as cores originais, sem camada por cima
            : `linear-gradient(135deg, ${base}, ${escurecer(base)})`,
        }}
      >
        {outra ? (
          <Voltar
            padrao="/inicio"
            className="absolute top-5 left-14 z-10 flex min-h-10 items-center rounded-pill bg-black/25 px-4 text-[11px] font-bold tracking-[.1em] text-jornal uppercase hover:bg-black/35"
          />
        ) : null}
        {p.capaImagem ? null : (
          <div
            aria-hidden
            className="absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent,transparent_38px,rgba(255,255,255,.03)_38px,rgba(255,255,255,.03)_76px)]"
          />
        )}
        <div className="relative flex w-full translate-y-14 items-end gap-7">
          <div className="size-32 flex-none overflow-hidden rounded-full border-[5px] border-jornal bg-rosa-fundo">
            {p.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.foto}
                alt="sua foto"
                className="size-full object-cover object-[50%_30%]"
              />
            ) : (
              <span className="flex size-full items-center justify-center font-revista text-5xl italic text-vinho">
                {(p.nome || "?").slice(0, 1).toLowerCase()}
              </span>
            )}
          </div>
          <div className="ml-auto flex gap-3.5 pb-[70px]">
            {acoes ?? (
              <>
                <Link href="/perfil/editar" className={botaoHero}>
                  editar perfil
                </Link>
                <Link href="/perfil/configuracoes" className={botaoHero}>
                  configurações
                </Link>
                <button
                  type="button"
                  onClick={compartilhar}
                  className={botaoHero}
                >
                  {copiado ? "link copiado ✓" : "compartilhar"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* o nome fica fora da capa: sempre fácil de ler, qualquer que seja a foto */}
      <div className="px-14">
        <div className="ml-[156px] pt-4">
          <div className="min-w-0">
            <h1 className="mb-1.5 font-revista text-4xl leading-none text-tinta italic">
              {p.nome || "sem nome"}
            </h1>
            <p className="text-xs font-semibold text-[var(--acc-web)]">
              @{p.usuario || "seu.nome"}
            </p>
            {detalhe ? (
              <div className="mt-1.5 text-xs text-grafite">{detalhe}</div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-14 pt-10 pb-16">
        {p.frase ? (
          <p className="mb-4 text-center font-revista text-xl leading-[1.4] italic text-[var(--acc-web)]">
            “{p.frase}”
          </p>
        ) : null}
        {!arquetipo && !outra ? (
          <div className="mx-auto mb-8 max-w-[760px]">
            <ConviteTeste />
          </div>
        ) : null}
        <div
          className={`mb-7 justify-center ${!arquetipo && !outra ? "hidden" : "flex"}`}
        >
          <button
            type="button"
            onClick={abrirResultado}
            disabled={!abrirResultado}
            className="min-h-8 rounded-pill border border-[var(--acc-web)] px-4 text-[10px] font-bold tracking-[.12em] text-[var(--acc-web)] uppercase hover:bg-[var(--acc-web)]/5"
          >
            {arquetipo
              ? `♡ ${arquetipo.nome.replace(/^a /, "")} · ${tema.nome}`
              : outra
                ? `✧ ${tema.nome}`
                : "✧ descobrir meu bookside"}
          </button>
        </div>

        <Link
          href={href.numeros}
          aria-label={outra ? "ver os lidos" : "ver sua jornada"}
          className="mb-10 grid grid-cols-4 border-y border-fio"
        >
          {[
            { n: lidos.length, r: "lidos" },
            { n: lendo.length, r: "lendo" },
            { n: quero.length, r: "quero ler" },
            { n: p.meta ?? "—", r: `meta ${new Date().getFullYear()}` },
          ].map((s, i) => (
            <span
              key={s.r}
              className={`py-4 text-center ${i ? "border-l border-fio" : ""}`}
            >
              <b className="block font-revista text-[28px] leading-none font-normal">
                {s.n}
              </b>
              <span className={rotulo}>{s.r}</span>
            </span>
          ))}
        </Link>

        <div className="grid grid-cols-3 gap-8">
          <section>
            <div className="mb-3.5 flex items-baseline justify-between border-b border-tinta pb-2">
              <h2 className="font-revista text-[19px] leading-none italic">
                favoritos
              </h2>
              <Link
                href={href.favoritos}
                className="text-[9px] font-bold tracking-[.1em] text-[var(--acc-web)] uppercase"
              >
                {outra ? "" : "escolher →"}
              </Link>
            </div>
            {favoritos.length ? (
              <ul className="grid grid-cols-4 gap-2">
                {favoritos.slice(0, 4).map((l) => (
                  <li key={l.id}>
                    <Link href={`/livro/${l.id}`} className="block">
                      <CapaLivro
                        titulo={l.titulo}
                        capa={l.capa}
                        cor={corDoLivro(l.id)}
                        className="w-full"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-revista text-[13px] leading-[1.4] italic text-grafite">
                {outra
                  ? "nenhum favorito escolhido ainda."
                  : "escolha até 4 livros para ficarem em destaque."}
              </p>
            )}
          </section>
          <Coluna
            titulo={`lidos · ${lidos.length}`}
            href={href.lidos}
            livros={lidos}
            vazio="nenhum livro lido por aqui ainda."
          />
          <Coluna
            titulo="quero ler"
            href={href.quero}
            livros={quero}
            vazio={
              outra
                ? "a lista de quero ler está vazia."
                : "sua lista de quero ler está vazia."
            }
          />
        </div>

        <section className="mt-9 border-t border-fio pt-7">
          <h2 className="mb-4 border-b border-tinta pb-2 font-revista text-[19px] leading-none italic">
            lendo agora
          </h2>
          {lendo.length ? (
            <ul className="grid grid-cols-2 gap-x-8 gap-y-6 xl:grid-cols-3">
              {lendo.map((l) => {
                const total = l.paginas;
                const pct =
                  total && l.paginaAtual
                    ? Math.min(100, Math.round((l.paginaAtual / total) * 100))
                    : null;
                return (
                  <li key={l.id}>
                    <Link
                      href={
                        outra ? `/livro/${l.id}` : `/livro/${l.id}/progresso`
                      }
                      className="group flex gap-4"
                    >
                      <CapaLivro
                        titulo={l.titulo}
                        capa={l.capa}
                        cor={corDoLivro(l.id)}
                        className="w-[72px] flex-none transition-transform group-hover:-translate-y-1 [&>span:last-child]:text-[9px]"
                      />
                      <div className="min-w-0 flex-1 pt-1">
                        <h3 className="line-clamp-2 font-revista text-[17px] leading-[1.15] italic">
                          {l.titulo}
                        </h3>
                        <p className="mt-1 truncate text-[11px] text-grafite">
                          {l.autor}
                        </p>
                        {pct !== null ? (
                          <>
                            <span className="mt-3 block h-1 overflow-hidden rounded-full bg-fio">
                              <span
                                className="block h-full rounded-full bg-[var(--acc-web)]"
                                style={{ width: `${pct}%` }}
                              />
                            </span>
                            <p className="mt-1.5 text-[10px] font-semibold tracking-[.08em] text-grafite uppercase">
                              pág. {l.paginaAtual} de {total} · {pct}%
                            </p>
                          </>
                        ) : (
                          <p className="mt-3 text-[10px] font-semibold tracking-[.08em] text-grafite uppercase">
                            {l.iniciadoEm
                              ? `desde ${new Date(l.iniciadoEm).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}`
                              : "começou a ler"}
                            {outra ? "" : " · marcar página →"}
                          </p>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="font-revista text-[13px] italic text-grafite">
              nenhuma leitura em andamento.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
