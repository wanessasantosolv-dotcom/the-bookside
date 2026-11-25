"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { Avatar } from "@/components/social/Pessoas";
import { livrosDaAutoria, linkDaAutoria } from "@/lib/autores";
import { chaveTitulo, livrosDoGoogle, type LivroBusca } from "@/lib/catalogo";
import { clubesComLivro, type ClubeDoLivro } from "@/lib/clubes";
import { corDoLivro } from "@/lib/cores";
import { useMeuId } from "@/lib/social";
import { emPortugues } from "@/lib/indicacoes";

const nota1 = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// ───────── clubes ─────────

/** os meus clubes que leram (ou estão lendo) este livro; sem nenhum, não aparece nada */
export function useClubesDoLivro(id: string, titulo: string) {
  const eu = useMeuId();
  const [lista, setLista] = useState<ClubeDoLivro[] | null>(null);
  useEffect(() => {
    if (!eu) return setLista([]);
    let vivo = true;
    clubesComLivro(id, titulo)
      .then((l) => vivo && setLista(l))
      .catch(() => vivo && setLista([]));
    return () => {
      vivo = false;
    };
  }, [eu, id, titulo]);
  return lista;
}

export function ClubesDoLivro({ lista }: { lista: ClubeDoLivro[] }) {
  const [i, setI] = useState(0);
  if (!lista.length) return null;
  const atual = lista[Math.min(i, lista.length - 1)];
  const { clube, livro, membros, media, avaliacoes } = atual;
  const estado = livro.estado === "lendo" ? "leitura coletiva · em andamento" : "leitura coletiva · concluída";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-[24px] leading-tight font-semibold text-bordo lg:font-revista lg:text-[30px] lg:font-normal lg:text-tinta">
          Clubes de leitura
        </h2>
        {lista.length > 1 ? (
          <span className="flex items-center gap-1 text-[12px] text-cinza">
            <button
              type="button"
              aria-label="clube anterior"
              onClick={() => setI((x) => (x - 1 + lista.length) % lista.length)}
              className="flex size-8 items-center justify-center rounded-full hover:bg-rosa-fundo hover:text-bordo"
            >
              ‹
            </button>
            {i + 1}/{lista.length}
            <button
              type="button"
              aria-label="próximo clube"
              onClick={() => setI((x) => (x + 1) % lista.length)}
              className="flex size-8 items-center justify-center rounded-full hover:bg-rosa-fundo hover:text-bordo"
            >
              ›
            </button>
          </span>
        ) : null}
      </div>
      <Link
        href={`/clubes/${clube.id}/livro/${livro.id}`}
        className="group mt-4 flex items-center gap-4 border-y border-linha py-4 lg:border-fio"
      >
        <span className="flex size-[68px] flex-none items-center justify-center overflow-hidden rounded-[10px] bg-bordo text-center font-display text-[13px] leading-tight text-creme italic">
          {clube.foto || clube.capa ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={(clube.foto || clube.capa)!} alt="" className="size-full object-cover" />
          ) : (
            clube.nome
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ameixa group-hover:text-bordo">
            {clube.nome}
          </span>
          <span className="block text-[12px] text-cinza">{estado}</span>
          <span className="mt-1 block text-[13px] text-tinta-suave">
            {media !== null ? (
              <>
                <span className="text-ouro">★</span> <b className="font-semibold text-ameixa">{nota1(media)}</b>{" "}
                ({avaliacoes} {avaliacoes === 1 ? "ficha" : "fichas"})
              </>
            ) : (
              "sem fichas ainda"
            )}
          </span>
          <span className="mt-2 flex items-center -space-x-2">
            {membros.slice(0, 5).map((m) => (
              <Avatar key={m.usuario_id} pessoa={m.pessoa} tamanho={26} className="ring-2 ring-creme" />
            ))}
            {membros.length > 5 ? (
              <span className="flex size-[26px] items-center justify-center rounded-full bg-rosa-fundo text-[10px] font-semibold text-bordo ring-2 ring-creme">
                +{membros.length - 5}
              </span>
            ) : null}
          </span>
        </span>
        <span aria-hidden className="text-[20px] text-cinza group-hover:text-bordo">
          ›
        </span>
      </Link>
      <p className="mt-2 text-[12px] text-cinza">as discussões e as fichas do clube ficam na página do livro no clube.</p>
    </div>
  );
}

// ───────── para além deste livro ─────────

function Estante({
  titulo,
  livros,
  acao,
}: {
  titulo: string;
  livros: LivroBusca[] | null;
  acao?: { href: string; rotulo: string };
}) {
  const faixa = useRef<HTMLUListElement>(null);
  if (livros && !livros.length) return null;
  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-[18px] font-semibold text-ameixa lg:font-revista lg:text-[21px] lg:font-normal">
          {titulo}
        </h3>
        <span className="flex items-center gap-2">
          {acao ? (
            <Link href={acao.href} className="text-[12px] font-semibold text-cinza hover:text-bordo">
              {acao.rotulo}
            </Link>
          ) : null}
          <button
            type="button"
            aria-label="ver mais"
            onClick={() => faixa.current?.scrollBy({ left: 300, behavior: "smooth" })}
            className="hidden size-8 items-center justify-center rounded-full text-[18px] text-cinza hover:bg-rosa-fundo hover:text-bordo sm:flex"
          >
            ›
          </button>
        </span>
      </div>
      {livros === null ? (
        <ul aria-hidden className="flex gap-4">
          {[0, 1, 2].map((i) => (
            <li key={i} className="aspect-[2/3] w-[110px] animate-pulse rounded-[6px] bg-linha/60" />
          ))}
        </ul>
      ) : (
        <ul ref={faixa} className="-mx-6 flex snap-x gap-4 overflow-x-auto scroll-smooth px-6 pb-1 [scrollbar-width:none] lg:mx-0 lg:px-0">
          {livros.map((l) => (
            <li key={l.id} className="w-[112px] flex-none snap-start lg:w-[124px]">
              <Link href={`/livro/${l.id}`} className="group block">
                <CapaLivro
                  titulo={l.titulo}
                  capa={l.capa}
                  cor={l.cor ?? corDoLivro(l.id)}
                  className="w-full !rounded-[4px] shadow-[0_12px_20px_-14px_rgba(43,20,32,.5)] transition-transform group-hover:-translate-y-1 [&>span:last-child]:text-[10px]"
                />
                <p className="mt-2 line-clamp-2 font-display text-[14px] leading-tight font-semibold text-ameixa lg:font-revista lg:font-normal">
                  {l.titulo}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[12px] text-cinza">{l.autor}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * "Para além deste livro": outras obras de quem escreveu e livros do mesmo
 * gênero no catálogo (em português e com capa). Sem gênero, só a autoria —
 * o app não inventa associação entre livros.
 */
export function AlemDoLivro({
  livro,
  naEstante,
}: {
  livro: { id: string; titulo: string; autor: string; genero?: string };
  /** os títulos que a pessoa já tem (para não indicar de novo) */
  naEstante: Set<string>;
}) {
  const [doAutor, setDoAutor] = useState<LivroBusca[] | null>(null);
  const [parecidos, setParecidos] = useState<LivroBusca[] | null>(null);
  const autorConhecido = livro.autor && !/^autoria|desconhecid/i.test(livro.autor);
  const daqui = chaveTitulo(livro.titulo);
  useEffect(() => {
    let vivo = true;
    if (!autorConhecido) setDoAutor([]);
    else
      livrosDaAutoria(livro.autor)
        .then((l) => vivo && setDoAutor(l.filter((x) => chaveTitulo(x.titulo) !== daqui).slice(0, 12)))
        .catch(() => vivo && setDoAutor([]));
    if (!livro.genero) setParecidos([]);
    else
      // só edições em português: pelo assunto e pelo nome do gênero, juntos
      Promise.all([
        livrosDoGoogle(`subject:"${livro.genero}"`, "pt").catch(() => [] as LivroBusca[]),
        livrosDoGoogle(livro.genero, "pt").catch(() => [] as LivroBusca[]),
      ])
        .then(([a, b]) => {
          if (!vivo) return;
          const vistos = new Set<string>();
          setParecidos(
            [...a, ...b]
              .filter((x) => {
                const k = chaveTitulo(x.titulo);
                if (vistos.has(k)) return false;
                vistos.add(k);
                return (
                  !!x.capa &&
                  emPortugues(x) &&
                  k !== daqui &&
                  !naEstante.has(k) &&
                  chaveTitulo(x.autor) !== chaveTitulo(livro.autor)
                );
              })
              .slice(0, 12),
          );
        })
        .catch(() => vivo && setParecidos([]));
    return () => {
      vivo = false;
    };
    // naEstante muda a cada render; o que importa é o livro
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livro.id, livro.autor, livro.genero, daqui, autorConhecido]);
  if (doAutor && !doAutor.length && parecidos && !parecidos.length) return null;
  return (
    <section className="border-t border-linha pt-6 lg:border-fio lg:pt-8">
      <h2 className="font-display text-[26px] leading-tight font-semibold text-bordo lg:font-revista lg:text-[34px] lg:font-normal lg:text-tinta">
        Para além deste livro
      </h2>
      <div className="mt-5 grid gap-8 lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-fio">
        <div className="lg:pr-8">
          <Estante
            titulo="Do mesmo autor"
            livros={doAutor}
            acao={autorConhecido ? { href: linkDaAutoria(livro.autor), rotulo: "página do autor" } : undefined}
          />
        </div>
        <div className="lg:pl-8">
          <Estante
            titulo="Se esta história te encontrou…"
            livros={parecidos}
          />
          {parecidos?.length ? (
            <p className="mt-2 text-[11px] text-cinza">edições em português do mesmo gênero.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
