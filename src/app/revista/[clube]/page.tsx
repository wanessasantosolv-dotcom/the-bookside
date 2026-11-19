"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { CapaAuto } from "@/components/CapaAuto";
import {
  anoDoClube,
  pessoaDaFicha,
  criterios,
  media,
  type AnoDoClube,
  type Ficha,
  type LivroDoClube,
} from "@/lib/clubes";
import { nomeDe, useConsulta, type PessoaResumo } from "@/lib/social";

/*
 * A revista do clube, no formato da revista em PDF do clube: capa, "Book Track",
 * um "Book Review" por livro (as fichas de cada pessoa) e "Enquanto isso, fora do clube…".
 * Cada página tem 1095 × 595,5 px (o tamanho do PDF original); "baixar PDF" usa a
 * impressão do navegador, que salva cada página do mesmo tamanho.
 */

const L = 1095;
const A = 595.5;
const verde = "#2E5339";
const rosa = "#EFA3B6";
const rosaClaro = "#F7CAD5";
const creme = "#FCF8EE";
const papel = "#EFEADF";

const fonte = {
  script: "'Pinyon Script', cursive",
  maquina: "'Special Elite', 'Courier New', monospace",
  mao: "'Caveat', cursive",
  titulo: "'Anton', Impact, sans-serif",
};

const dm = (iso?: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      })
    : "—";
const mesAno = (iso?: string | null) =>
  iso
    ? new Date(iso)
        .toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
        .replace(" de ", " ")
        .toUpperCase()
    : "";

/** estrelas com preenchimento parcial (meia estrela, médias) */
function Estrelas({
  valor,
  tamanho = 14,
  cor = verde,
}: {
  valor: number | null | undefined;
  tamanho?: number;
  cor?: string;
}) {
  const pct = Math.max(0, Math.min(100, ((valor ?? 0) / 5) * 100));
  return (
    <span
      className="relative inline-block leading-none whitespace-nowrap"
      style={{ fontSize: tamanho, color: cor, letterSpacing: tamanho * 0.12 }}
      aria-label={valor ? `${valor} de 5` : "sem nota"}
    >
      <span style={{ opacity: 0.55 }}>☆☆☆☆☆</span>
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pct}%` }}
      >
        ★★★★★
      </span>
    </span>
  );
}

function Pagina({
  children,
  fundo = creme,
}: {
  children: ReactNode;
  fundo?: string;
}) {
  return (
    <section
      className="pagina-revista relative overflow-hidden"
      style={{ width: L, height: A, background: fundo }}
    >
      {children}
    </section>
  );
}

/** a moldura rosa com o título em letra cursiva "cortando" a linha de cima */
function Moldura({
  titulo,
  sub,
  children,
}: {
  titulo: string;
  sub?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="absolute" style={{ inset: "34px 26px 0 26px" }}>
      <div
        className="absolute inset-0 rounded-t-[42px]"
        style={{ border: `2px solid ${rosa}`, borderBottom: "none" }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 px-5 text-center"
        style={{ top: -30, background: creme }}
      >
        <p
          style={{
            fontFamily: fonte.script,
            fontSize: titulo.length > 16 ? 34 : 44,
            color: rosa,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
          }}
        >
          {titulo}
        </p>
        {sub ? (
          <div
            className="absolute"
            style={{
              right: -30,
              top: 34,
              fontFamily: fonte.maquina,
              fontSize: 9,
              color: verde,
              lineHeight: 1.1,
              transform: "rotate(-4deg)",
            }}
          >
            {sub}
          </div>
        ) : null}
      </div>
      <div className="absolute" style={{ inset: "40px 28px 18px 28px" }}>
        {children}
      </div>
    </div>
  );
}

function Capa({
  livro,
  largura,
}: {
  livro:
    | LivroDoClube["livro"]
    | { id: string; titulo: string; autor: string; capa?: string };
  largura: number;
}) {
  return (
    <div style={{ width: largura }}>
      <CapaAuto
        livro={livro}
        className="w-full !rounded-[2px] [&>span:last-child]:hidden"
      />
    </div>
  );
}

// ───────── páginas ─────────

function PaginaCapa({ d }: { d: AnoDoClube }) {
  const listras = `repeating-linear-gradient(90deg, ${rosaClaro} 0 22px, ${creme} 22px 44px)`;
  return (
    <Pagina fundo={creme}>
      <div className="absolute inset-0" style={{ background: listras }} />
      {/* tira de fotos das leitoras */}
      <div
        className="absolute flex flex-col gap-3 p-3"
        style={{
          left: 150,
          top: 60,
          width: 150,
          background: rosa,
          transform: "rotate(-14deg)",
          boxShadow: "0 10px 24px -14px rgba(0,0,0,.4)",
        }}
      >
        {d.membros.slice(0, 4).map((m) => (
          <div
            key={m.usuario_id}
            className="flex items-center justify-center overflow-hidden"
            style={{ height: 104, background: creme }}
          >
            {m.pessoa?.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={m.pessoa.foto}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <span
                style={{ fontFamily: fonte.script, fontSize: 40, color: verde }}
              >
                {nomeDe(m.pessoa).slice(0, 1)}
              </span>
            )}
          </div>
        ))}
      </div>
      {/* a capa do clube como foto */}
      {d.clube.capa ? (
        <div
          className="absolute p-2.5"
          style={{
            right: 130,
            top: 110,
            width: 300,
            background: creme,
            transform: "rotate(8deg)",
            boxShadow: "0 12px 26px -14px rgba(0,0,0,.45)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={d.clube.capa}
            alt=""
            className="block w-full"
            style={{ aspectRatio: "3/1", objectFit: "cover" }}
          />
        </div>
      ) : null}
      {/* o "ingresso" verde com o nome */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{
          left: 330,
          top: 205,
          width: 420,
          height: 180,
          background: verde,
          borderRadius: 14,
          boxShadow: "0 14px 30px -16px rgba(0,0,0,.5)",
        }}
      >
        <p
          style={{
            fontFamily: fonte.titulo,
            fontSize: 70,
            whiteSpace: "nowrap",
            color: creme,
            letterSpacing: 2,
            lineHeight: 1,
          }}
        >
          BOOK CLUB
        </p>
        <p
          style={{
            fontFamily: fonte.script,
            fontSize: 48,
            color: rosa,
            lineHeight: 1,
            whiteSpace: "nowrap",
            marginTop: -6,
          }}
        >
          {d.clube.nome}
        </p>
      </div>
      <p
        className="absolute"
        style={{
          left: 480,
          top: 410,
          fontFamily: fonte.maquina,
          fontSize: 18,
          color: verde,
          background: creme,
          padding: "4px 14px",
          border: `1.5px solid ${rosa}`,
          borderRadius: 6,
        }}
      >
        {d.ano} ✦ {d.livros.filter((l) => l.estado === "lido").length} livros
      </p>
    </Pagina>
  );
}

function PaginasTrack({ d }: { d: AnoDoClube }) {
  const porPagina = 27;
  const grupos: LivroDoClube[][] = [];
  for (let i = 0; i < Math.max(1, d.livros.length); i += porPagina)
    grupos.push(d.livros.slice(i, i + porPagina));
  return grupos.map((g, k) => (
    <Pagina key={k}>
      <Moldura titulo="Book Track">
        <div className="grid h-full grid-cols-9 grid-rows-3 gap-x-4 gap-y-2">
          {Array.from({ length: porPagina }, (_, i) => {
            const l = g[i];
            const notas = l
              ? d.fichas
                  .filter((f) => f.clube_livro_id === l.id)
                  .map((f) => Number(f.nota))
              : [];
            return (
              <div key={i} className="flex flex-col items-center">
                {l ? (
                  <Capa livro={l.livro} largura={78} />
                ) : (
                  <div
                    style={{
                      width: 78,
                      aspectRatio: "2/3",
                      background: papel,
                      borderRadius: 2,
                    }}
                  />
                )}
                <div className="mt-1">
                  <Estrelas valor={media(notas)} tamanho={11} cor={rosa} />
                </div>
              </div>
            );
          })}
        </div>
      </Moldura>
    </Pagina>
  ));
}

function Campo({
  rotulo,
  valor,
  altura,
}: {
  rotulo: string;
  valor?: ReactNode;
  altura?: number;
}) {
  return (
    <div
      className="px-1.5 py-0.5"
      style={{
        border: `1px solid ${verde}`,
        borderRadius: 2,
        minHeight: altura,
        fontFamily: fonte.maquina,
        fontSize: 8.5,
        color: verde,
      }}
    >
      <span style={{ fontWeight: 700 }}>{rotulo}</span>{" "}
      <span style={{ fontFamily: fonte.mao, fontSize: 13, color: "#2B2B2B" }}>
        {valor}
      </span>
    </div>
  );
}

function CartaoFicha({
  l,
  f,
  pessoa,
}: {
  l: LivroDoClube;
  f: Ficha | null;
  pessoa: PessoaResumo | null;
}) {
  return (
    <div
      className="flex h-full flex-col"
      style={{
        background: papel,
        border: `1.5px solid ${verde}`,
        borderRadius: 3,
      }}
    >
      <div
        className="flex items-center justify-between px-2.5"
        style={{ background: verde, height: 30 }}
      >
        <span
          style={{
            fontFamily: fonte.script,
            fontSize: 24,
            color: creme,
            lineHeight: 1,
          }}
        >
          {nomeDe(pessoa)}
        </span>
        <Estrelas
          valor={f?.nota ? Number(f.nota) : null}
          tamanho={12}
          cor={creme}
        />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-1.5">
        <Campo rotulo="AUTOR:" valor={l.livro.autor} />
        <Campo rotulo="Nº PÁGINAS:" valor={l.livro.paginas} />
        <div className="grid grid-cols-2 gap-1">
          <Campo rotulo="INÍCIO:" valor={dm(l.iniciado_em)} />
          <Campo rotulo="FIM:" valor={dm(l.encerrado_em)} />
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 px-1 py-1">
          {criterios.map((c) => (
            <div key={c} className="text-center">
              <span
                className="inline-block px-2"
                style={{
                  background: rosaClaro,
                  fontFamily: fonte.maquina,
                  fontSize: 7.5,
                  color: verde,
                  textTransform: "uppercase",
                }}
              >
                {c}
              </span>
              <div>
                <Estrelas valor={f?.notas?.[c] ?? null} tamanho={11} />
              </div>
            </div>
          ))}
        </div>
        <Campo rotulo="PERSONAGEM FAV:" valor={f?.personagem} />
        <Campo
          rotulo="CITAÇÃO FAVORITA:"
          altura={70}
          valor={
            <span className="line-clamp-4 block leading-[1.05]">
              {f?.citacao ? `“${f.citacao}”` : ""}
            </span>
          }
        />
        <div className="flex-1">
          <Campo
            rotulo="COMENTÁRIOS:"
            altura={92}
            valor={
              <span className="line-clamp-6 block leading-[1.05]">
                {f?.texto}
              </span>
            }
          />
        </div>
      </div>
    </div>
  );
}

function PaginasReview({ d }: { d: AnoDoClube }) {
  return d.livros.flatMap((l, n) => {
    const fichas = d.fichas.filter((f) => f.clube_livro_id === l.id);
    // quem escreveu ficha; se ninguém escreveu ainda, um cartão em branco para cada pessoa
    const pessoas = fichas.length
      ? fichas.map((f) => ({
          f,
          p: pessoaDaFicha(f.autor, d.membros),
        }))
      : d.membros.map((m) => ({ f: null as Ficha | null, p: m.pessoa }));
    const paginas: (typeof pessoas)[] = [];
    for (let i = 0; i < pessoas.length; i += 4)
      paginas.push(pessoas.slice(i, i + 4));
    const quando = l.encerrado_em ?? l.iniciado_em;
    return paginas.map((grupo, k) => (
      <Pagina key={`${l.id}-${k}`}>
        <Moldura
          titulo="Book Review"
          sub={
            <>
              <b>{mesAno(quando)}</b>
              <br />
              No.{String(l.rodada ?? n + 1).padStart(2, "0")}
            </>
          }
        >
          <div
            className="absolute flex items-end gap-2.5"
            style={{ left: 0, top: -62 }}
          >
            <div
              style={{
                border: `2px solid ${verde}`,
                padding: 2,
                background: creme,
              }}
            >
              <Capa livro={l.livro} largura={44} />
            </div>
            <span
              className="mb-1 rounded-full px-3 py-0.5"
              style={{
                background: rosaClaro,
                fontFamily: fonte.maquina,
                fontSize: 11,
                color: verde,
                maxWidth: 360,
              }}
            >
              {l.livro.titulo.toUpperCase()}
            </span>
          </div>
          <div className="absolute" style={{ right: 0, top: -24 }}>
            <Estrelas
              valor={media(fichas.map((f) => Number(f.nota)))}
              tamanho={20}
            />
          </div>
          <div
            className="grid h-full gap-3 pt-3"
            style={{
              gridTemplateColumns: `repeat(${Math.max(3, grupo.length)}, minmax(0, 1fr))`,
            }}
          >
            {grupo.map(({ f, p }, i) => (
              <CartaoFicha key={i} l={l} f={f} pessoa={p} />
            ))}
          </div>
        </Moldura>
      </Pagina>
    ));
  });
}

function PaginasFora({ d }: { d: AnoDoClube }) {
  const pares: AnoDoClube["membros"][] = [];
  for (let i = 0; i < d.membros.length; i += 2)
    pares.push(d.membros.slice(i, i + 2));
  return pares.map((par, k) => (
    <Pagina key={k}>
      <Moldura titulo="Enquanto isso, fora do clube…">
        <div className="grid h-full grid-cols-2 gap-8 pt-2">
          {par.map((m) => {
            const livros = (d.foraDoClube.get(m.usuario_id) ?? []).slice(0, 24);
            return (
              <div
                key={m.usuario_id}
                className="relative rounded-t-[26px] px-4 pt-10 pb-2"
                style={{ border: `2px solid ${verde}`, borderBottom: "none" }}
              >
                <div
                  className="absolute flex items-center justify-center overflow-hidden rounded-full"
                  style={{
                    left: -12,
                    top: -26,
                    width: 64,
                    height: 64,
                    border: `3px solid ${verde}`,
                    background: rosaClaro,
                  }}
                >
                  {m.pessoa?.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.pessoa.foto}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <span
                      style={{
                        fontFamily: fonte.script,
                        fontSize: 30,
                        color: verde,
                      }}
                    >
                      {nomeDe(m.pessoa).slice(0, 1)}
                    </span>
                  )}
                </div>
                <p
                  className="absolute"
                  style={{
                    right: 16,
                    top: 2,
                    fontFamily: fonte.script,
                    fontSize: 30,
                    color: verde,
                  }}
                >
                  {nomeDe(m.pessoa)}
                </p>
                <div className="grid grid-cols-6 gap-x-2.5 gap-y-1.5">
                  {Array.from({ length: 24 }, (_, i) => {
                    const l = livros[i];
                    return (
                      <div key={i} className="flex flex-col items-center">
                        {l ? (
                          <Capa livro={l} largura={52} />
                        ) : (
                          <div
                            style={{
                              width: 52,
                              aspectRatio: "2/3",
                              background: papel,
                            }}
                          />
                        )}
                        <Estrelas valor={l?.nota} tamanho={8} />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Moldura>
    </Pagina>
  ));
}

// ───────── a tela ─────────

function Revista() {
  const { clube: clubeId } = useParams<{ clube: string }>();
  const ano = Number(useSearchParams().get("ano")) || new Date().getFullYear();
  const consulta = useConsulta(() => anoDoClube(clubeId, ano), [clubeId, ano]);
  const area = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(1);
  const [preparando, setPreparando] = useState(false);

  // na tela, as páginas encolhem para caber na largura
  useEffect(() => {
    const ajustar = () =>
      setEscala(Math.min(1, ((area.current?.clientWidth ?? L) - 2) / L));
    ajustar();
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, []);

  async function baixar() {
    setPreparando(true);
    // espera as capas carregarem (no máximo 8 s) antes de abrir a impressão
    const inicio = Date.now();
    while (
      Date.now() - inicio < 8000 &&
      [...document.images].some((i) => !i.complete)
    )
      await new Promise((ok) => setTimeout(ok, 300));
    setPreparando(false);
    window.print();
  }

  const d = consulta.dados;
  return (
    <div className="min-h-dvh bg-[#E9E2D6]">
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Anton&family=Caveat:wght@400;600&family=Pinyon+Script&family=Special+Elite&display=swap"
      />
      <style>{`
        @page { size: ${L}px ${A}px; margin: 0; }
        @media print {
          html, body { background: none !important; }
          .so-tela { display: none !important; }
          .area-revista { padding: 0 !important; }
          .folhas { zoom: 1 !important; gap: 0 !important; }
          .pagina-revista { break-after: page; box-shadow: none !important; }
          .pagina-revista:last-child { break-after: auto; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        .pagina-revista { box-shadow: 0 12px 30px -18px rgba(43,20,32,.45); }
      `}</style>
      <header className="so-tela sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-linha bg-creme/95 px-5 py-3 backdrop-blur">
        <Link
          href={`/clubes/${clubeId}/retrospectiva`}
          className="text-[13px] font-semibold text-bordo"
        >
          ‹ voltar ao clube
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-cinza sm:inline">
            no celular: compartilhar → imprimir → salvar como PDF
          </span>
          <button
            type="button"
            onClick={baixar}
            disabled={!d || preparando}
            className="flex min-h-10 items-center rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme disabled:opacity-60"
          >
            {preparando ? "preparando as capas…" : "baixar PDF"}
          </button>
        </div>
      </header>
      <div ref={area} className="area-revista px-4 py-6">
        {consulta.carregando && !d ? (
          <p className="so-tela py-20 text-center font-accent text-sm italic text-cinza">
            montando a revista do clube…
          </p>
        ) : !d ? (
          <p className="so-tela py-20 text-center font-accent text-sm italic text-cinza">
            não deu para abrir a revista. confira se você entrou na sua conta e
            se é do clube.
          </p>
        ) : (
          <div
            className="folhas mx-auto flex flex-col items-center gap-6"
            style={{ zoom: escala }}
          >
            <PaginaCapa d={d} />
            <PaginasTrack d={d} />
            <PaginasReview d={d} />
            <PaginasFora d={d} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function RevistaPage() {
  return (
    <Suspense>
      <Revista />
    </Suspense>
  );
}
