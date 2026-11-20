"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/social/Pessoas";
import { estrelas } from "@/lib/estantes";
import {
  criticaNaWikipedia,
  linksDeResenhas,
  notasDosLeitores,
  opinioesNoApp,
  type Critica,
  type NotaMedia,
  type OpiniaoNoApp,
} from "@/lib/opinioes";
import { nomeDe, useMeuId } from "@/lib/social";

const virgula = (n: number) =>
  n.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
const rotuloSecao =
  "font-maquina text-[9px] tracking-[.12em] text-rosa-antigo uppercase";

/** "o que os leitores acham": notas médias, opiniões do app, a crítica e onde ler mais resenhas. */
export function OpinioesDoLivro({
  livro,
}: {
  livro: { id: string; titulo: string; autor: string };
}) {
  const eu = useMeuId();
  const [notas, setNotas] = useState<NotaMedia[] | null>(null);
  const [critica, setCritica] = useState<Critica | null | undefined>(undefined);
  const [doApp, setDoApp] = useState<OpiniaoNoApp[] | null>(null);
  const [abertas, setAbertas] = useState(false);

  useEffect(() => {
    let vivo = true;
    notasDosLeitores(livro.titulo, livro.autor)
      .then((n) => vivo && setNotas(n))
      .catch(() => vivo && setNotas([]));
    criticaNaWikipedia(livro.titulo, livro.autor)
      .then((c) => vivo && setCritica(c))
      .catch(() => vivo && setCritica(null));
    return () => {
      vivo = false;
    };
  }, [livro.titulo, livro.autor]);

  useEffect(() => {
    if (!eu) return setDoApp([]);
    let vivo = true;
    opinioesNoApp(livro.id, livro.titulo)
      .then((o) => vivo && setDoApp(o))
      .catch(() => vivo && setDoApp([]));
    return () => {
      vivo = false;
    };
  }, [eu, livro.id, livro.titulo]);

  const visiveis = abertas ? (doApp ?? []) : (doApp ?? []).slice(0, 3);
  const mediaApp = doApp?.filter((o) => o.nota).map((o) => Number(o.nota));

  return (
    <div className="rounded-[2px] border border-dashed border-linha bg-creme-quente p-4 lg:p-5">
      <p className="font-maquina text-[9px] tracking-[.12em] text-rosa-antigo uppercase">
        o que os leitores acham
      </p>

      {/* notas médias */}
      <div className="mt-3 space-y-1">
        {mediaApp?.length ? (
          <p className="text-[13px]">
            <b className="font-display text-lg font-semibold text-bordo">
              ★ {virgula(mediaApp.reduce((a, b) => a + b, 0) / mediaApp.length)}
            </b>{" "}
            <span className="text-cinza">
              · {mediaApp.length}{" "}
              {mediaApp.length === 1 ? "avaliação" : "avaliações"} no the
              bookside
            </span>
          </p>
        ) : null}
        {notas === null ? (
          <p className="font-accent text-[13px] italic text-cinza">
            procurando as notas…
          </p>
        ) : (
          notas.map((n) => (
            <p key={n.fonte} className="text-[13px]">
              <b className="font-display text-lg font-semibold text-bordo">
                ★ {virgula(n.media)}
              </b>{" "}
              <span className="text-cinza">
                · {n.total.toLocaleString("pt-BR")}{" "}
                {n.total === 1 ? "avaliação" : "avaliações"} no {n.fonte}
              </span>
            </p>
          ))
        )}
        {notas?.length === 0 && !mediaApp?.length ? (
          <p className="font-accent text-[13px] italic text-cinza">
            ainda sem nota média dos leitores.
          </p>
        ) : null}
      </div>

      {/* opiniões de quem usa o app */}
      <div className="mt-5">
        <p className={rotuloSecao}>no the bookside</p>
        {doApp === null ? (
          <p className="mt-2 font-accent text-[13px] italic text-cinza">
            carregando…
          </p>
        ) : doApp.length ? (
          <>
            <ul className="mt-3 space-y-3.5">
              {visiveis.map((o) => (
                <li key={o.id}>
                  <Link
                    href={o.usuario ? `/u/${o.usuario}` : "#"}
                    className="flex items-start gap-2.5"
                  >
                    <Avatar pessoa={o} tamanho={30} />
                    <span className="min-w-0 text-[13px]">
                      <b className="font-semibold">{nomeDe(o)}</b>
                      {o.nota ? (
                        <span className="ml-1.5 text-xs text-bordo">
                          {estrelas(Number(o.nota))}
                        </span>
                      ) : null}
                      {o.resenha ? (
                        <span className="mt-0.5 line-clamp-4 block font-accent text-[13px] italic text-cinza">
                          “{o.resenha}”
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            {doApp.length > 3 ? (
              <button
                type="button"
                onClick={() => setAbertas((v) => !v)}
                className="mt-2 min-h-9 text-xs font-semibold text-bordo underline underline-offset-4"
              >
                {abertas ? "mostrar menos" : `ver todas (${doApp.length})`}
              </button>
            ) : null}
          </>
        ) : (
          <p className="mt-2 font-accent text-[13px] italic text-cinza">
            ninguém do the bookside avaliou ainda. seja a primeira ✦
          </p>
        )}
      </div>

      {/* a crítica (Wikipédia) */}
      {critica ? (
        <div className="mt-5">
          <p className={rotuloSecao}>o que a crítica disse</p>
          <blockquote className="mt-2 font-accent text-[13px] leading-[1.55] italic text-tinta-suave">
            {critica.texto}
          </blockquote>
          <p className="mt-1.5 text-[11px] text-cinza">
            trecho da{" "}
            <a
              href={critica.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Wikipédia{critica.idioma === "en" ? " em inglês" : ""} ↗
            </a>{" "}
            (CC BY-SA)
          </p>
        </div>
      ) : null}

      {/* onde ler mais resenhas */}
      <div className="mt-5">
        <p className={rotuloSecao}>mais resenhas de leitores</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {linksDeResenhas(livro.titulo, livro.autor).map((l) => (
            <a
              key={l.nome}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-10 items-center rounded-pill border border-bege px-4 text-xs font-semibold text-ameixa hover:border-bordo hover:text-bordo"
            >
              ler no {l.nome} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
