"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/social/Pessoas";
import {
  linksDeResenhas,
  notasDosLeitores,
  opinioesNoApp,
  type NotaMedia,
  type OpiniaoNoApp,
} from "@/lib/opinioes";
import type { LivroSalvo } from "@/lib/perfil-store";
import { amigasComLivro, nomeDe, useMeuId, type PessoaResumo } from "@/lib/social";

export type Amiga = { pessoa: PessoaResumo; livro: LivroSalvo };

export type Comunidade = {
  /** quem você segue e tem o livro (com status, nota, datas e resenha) */
  amigas: Amiga[] | null;
  /** notas e resenhas de quem usa o the bookside (perfis públicos) */
  opinioes: OpiniaoNoApp[] | null;
  /** notas médias de fora (Google Books, Open Library) */
  externas: NotaMedia[] | null;
};

/** carrega uma vez tudo o que a página do livro mostra sobre outras pessoas */
export function useComunidade(livro: { id: string; titulo: string; autor: string }): Comunidade {
  const eu = useMeuId();
  const [amigas, setAmigas] = useState<Amiga[] | null>(null);
  const [opinioes, setOpinioes] = useState<OpiniaoNoApp[] | null>(null);
  const [externas, setExternas] = useState<NotaMedia[] | null>(null);
  useEffect(() => {
    let vivo = true;
    if (!eu) {
      setAmigas([]);
      setOpinioes([]);
    } else {
      amigasComLivro(livro.id)
        .then((a) => vivo && setAmigas(a))
        .catch(() => vivo && setAmigas([]));
      opinioesNoApp(livro.id, livro.titulo)
        .then((o) => vivo && setOpinioes(o))
        .catch(() => vivo && setOpinioes([]));
    }
    notasDosLeitores(livro.titulo, livro.autor)
      .then((n) => vivo && setExternas(n))
      .catch(() => vivo && setExternas([]));
    return () => {
      vivo = false;
    };
  }, [eu, livro.id, livro.titulo, livro.autor]);
  return { amigas, opinioes, externas };
}

const nota1 = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const numero = (n: number) => n.toLocaleString("pt-BR");
const estrelas = (n: number) => {
  const cheias = Math.floor(n);
  const meia = n - cheias >= 0.5;
  return "★".repeat(cheias) + (meia ? "½" : "") + "☆".repeat(5 - cheias - (meia ? 1 : 0));
};

/** as notas do the bookside (sem repetir quem você segue) */
export function notasDoApp(c: Comunidade) {
  const porPessoa = new Map<string, number>();
  for (const o of c.opinioes ?? []) if (o.nota) porPessoa.set(o.id, Number(o.nota));
  for (const a of c.amigas ?? []) if (a.livro.nota) porPessoa.set(a.pessoa.id, a.livro.nota);
  return [...porPessoa.values()];
}

const titulo2 =
  "font-display text-[24px] leading-tight font-semibold text-bordo lg:font-revista lg:text-[30px] lg:font-normal lg:text-tinta";

// ───────── entre leitores ─────────

export function EntreLeitores({ c }: { c: Comunidade }) {
  const carregando = c.opinioes === null || c.amigas === null;
  const notas = notasDoApp(c);
  const media = notas.length ? notas.reduce((t, n) => t + n, 0) / notas.length : null;
  // cada faixa junta a nota inteira e a meia acima dela (4 e 4,5 → "4")
  const faixas = [5, 4, 3, 2, 1].map((f) => {
    const qtd = notas.filter((n) => Math.floor(n) === f || (f === 1 && n < 1)).length;
    return { f, qtd, parte: notas.length ? qtd / notas.length : 0 };
  });
  const externa = (c.externas ?? []).filter((x) => x.total > 0).sort((a, b) => b.total - a.total)[0];
  return (
    <div>
      <h2 className={titulo2}>Entre leitores</h2>
      {carregando ? (
        <div aria-hidden className="mt-4 h-[120px] animate-pulse rounded-[10px] bg-linha/50" />
      ) : notas.length ? (
        <div className="mt-4 grid items-center gap-6 sm:grid-cols-[auto_1fr] sm:gap-10">
          <div>
            <p className="font-display text-[58px] leading-none font-semibold text-bordo tabular-nums lg:font-revista lg:text-[64px] lg:font-normal">
              {nota1(media!)}
            </p>
            <p className="mt-1.5 text-[18px] tracking-[2px] text-ouro" aria-label={`média ${nota1(media!)} de 5`}>
              {estrelas(media!)}
            </p>
            <p className="mt-1 text-[13px] text-tinta-suave">
              {notas.length} {notas.length === 1 ? "avaliação" : "avaliações"} no the bookside
            </p>
          </div>
          <ul className="space-y-1.5" aria-label="distribuição das notas">
            {faixas.map((x) => (
              <li key={x.f} className="flex items-center gap-2.5 text-[12px]">
                <span className="w-7 flex-none text-tinta-suave tabular-nums">
                  {x.f} <span className="text-ouro">★</span>
                </span>
                <span className="h-[6px] flex-1 overflow-hidden rounded-full bg-linha/60">
                  <span className="block h-full rounded-full bg-progresso" style={{ width: `${x.parte * 100}%` }} />
                </span>
                <span className="w-9 flex-none text-right text-cinza tabular-nums">
                  {Math.round(x.parte * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 font-accent text-sm italic text-cinza">
          ninguém do the bookside avaliou este livro ainda. seja a primeira.
        </p>
      )}
      {externa ? (
        <p className="mt-4 text-[12px] text-cinza">
          fora daqui: {nota1(externa.media)} ★ no {externa.fonte} ({numero(externa.total)}{" "}
          {externa.total === 1 ? "avaliação" : "avaliações"})
        </p>
      ) : null}
    </div>
  );
}

// ───────── na sua rede ─────────

const verbo: Record<string, string> = {
  lido: "leu",
  lendo: "está lendo",
  quero: "quer ler",
  pausado: "pausou",
  abandonado: "abandonou",
};

export function NaSuaRede({ c }: { c: Comunidade }) {
  const [aberta, setAberta] = useState(false);
  const lista = c.amigas;
  const leram = (lista ?? []).filter((a) => a.livro.status === "lido").length;
  const lendo = (lista ?? []).filter((a) => !a.livro.status || a.livro.status === "lendo").length;
  return (
    <div>
      <h3 className="font-display text-[20px] leading-tight font-semibold text-bordo lg:font-revista lg:text-[24px] lg:font-normal lg:text-tinta">
        Na sua rede
      </h3>
      {lista === null ? (
        <div aria-hidden className="mt-4 h-[60px] animate-pulse rounded-[10px] bg-linha/50" />
      ) : !lista.length ? (
        <p className="mt-3 font-accent text-sm italic text-cinza">
          ninguém que você segue tem este livro ainda.
        </p>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-4">
            <span className="flex flex-none -space-x-3">
              {lista.slice(0, 4).map((a) => (
                <Avatar key={a.pessoa.id} pessoa={a.pessoa} tamanho={44} className="ring-2 ring-creme" />
              ))}
            </span>
            <p className="text-[13px] leading-snug text-tinta-suave">
              {[
                leram ? `${leram} ${leram === 1 ? "pessoa que você segue leu" : "pessoas que você segue leram"}` : null,
                lendo ? `${lendo} ${lendo === 1 ? "está lendo" : "estão lendo"}` : null,
                !leram && !lendo ? `${lista.length} ${lista.length === 1 ? "pessoa que você segue tem" : "pessoas que você segue têm"} na estante` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              .
            </p>
          </div>
          <button
            type="button"
            aria-expanded={aberta}
            onClick={() => setAberta((v) => !v)}
            className="mt-4 flex h-11 w-full items-center justify-center rounded-pill bg-rosa-fundo text-[13px] font-semibold text-bordo hover:bg-rosa-claro/60"
          >
            {aberta ? "esconder" : "ver quem leu"}
          </button>
          {aberta ? (
            <ul className="mt-3 divide-y divide-linha">
              {lista.map(({ pessoa, livro }) => (
                <li key={pessoa.id}>
                  <Link href={pessoa.usuario ? `/u/${pessoa.usuario}` : "#"} className="flex items-center gap-3 py-2.5">
                    <Avatar pessoa={pessoa} tamanho={32} />
                    <span className="min-w-0 flex-1 text-[13px]">
                      <b className="font-semibold text-ameixa">{nomeDe(pessoa)}</b>{" "}
                      <span className="text-cinza">{verbo[livro.status ?? "lendo"] ?? "tem na estante"}</span>
                    </span>
                    {livro.nota ? (
                      <span className="flex-none text-[12px] text-bordo tabular-nums">{nota1(livro.nota)} ★</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </div>
  );
}

// ───────── o que disseram ─────────

type Resenha = {
  id: string;
  pessoa: PessoaResumo;
  nota: number | null;
  texto: string;
  quando?: string;
  segue: boolean;
};

export function OQueDisseram({
  c,
  livro,
}: {
  c: Comunidade;
  livro: { titulo: string; autor: string };
}) {
  const [todas, setTodas] = useState(false);
  const [abertas, setAbertas] = useState<Set<string>>(new Set());
  const daRede: Resenha[] = (c.amigas ?? [])
    .filter((a) => a.livro.resenha?.trim())
    .map((a) => ({
      id: a.pessoa.id,
      pessoa: a.pessoa,
      nota: a.livro.nota ?? null,
      texto: a.livro.resenha!.trim(),
      quando: a.livro.lidoEm,
      segue: true,
    }));
  const ids = new Set(daRede.map((r) => r.id));
  const outras: Resenha[] = (c.opinioes ?? [])
    .filter((o) => o.resenha && !ids.has(o.id))
    .map((o) => ({
      id: o.id,
      pessoa: { id: o.id, usuario: o.usuario, nome: o.nome, foto: o.foto },
      nota: o.nota ? Number(o.nota) : null,
      texto: o.resenha!,
      segue: false,
    }));
  // primeiro quem você segue
  const lista = [...daRede, ...outras];
  const visiveis = todas ? lista : lista.slice(0, 2);
  const carregando = c.amigas === null || c.opinioes === null;
  return (
    <div>
      <h2 className={titulo2}>O que disseram sobre ele</h2>
      {carregando ? (
        <div aria-hidden className="mt-4 h-[130px] animate-pulse rounded-[10px] bg-linha/50" />
      ) : lista.length ? (
        <>
          <ul className="mt-4 divide-y divide-linha lg:divide-fio">
            {visiveis.map((r) => {
              const aberta = abertas.has(r.id);
              return (
                <li key={r.id} className="py-4 first:pt-0">
                  <div className="flex items-start gap-3">
                    <Link href={r.pessoa.usuario ? `/u/${r.pessoa.usuario}` : "#"}>
                      <Avatar pessoa={r.pessoa} tamanho={40} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <Link
                          href={r.pessoa.usuario ? `/u/${r.pessoa.usuario}` : "#"}
                          className="text-[14px] font-semibold text-ameixa hover:text-bordo"
                        >
                          {nomeDe(r.pessoa)}
                        </Link>
                        {r.nota ? (
                          <span className="text-[14px] tracking-[1px] text-ouro" aria-label={`nota ${r.nota} de 5`}>
                            {estrelas(r.nota)}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[12px] text-cinza">
                        {[
                          r.segue ? "você segue" : null,
                          r.quando
                            ? `terminou em ${new Date(r.quando).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p
                        className={`mt-2 text-[14px] leading-[1.6] break-words whitespace-pre-line text-tinta-suave ${aberta ? "" : "line-clamp-4"}`}
                      >
                        {r.texto}
                      </p>
                      {r.texto.length > 260 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setAbertas((s) => {
                              const n = new Set(s);
                              if (n.has(r.id)) n.delete(r.id);
                              else n.add(r.id);
                              return n;
                            })
                          }
                          className="mt-1 text-[12px] font-semibold text-bordo hover:underline"
                        >
                          {aberta ? "mostrar menos" : "ler tudo"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {lista.length > 2 ? (
            <button
              type="button"
              onClick={() => setTodas((v) => !v)}
              className="mt-1 text-[13px] font-semibold text-bordo hover:underline"
            >
              {todas ? "mostrar menos" : `ver as ${lista.length} resenhas da comunidade →`}
            </button>
          ) : null}
        </>
      ) : (
        <p className="mt-3 font-accent text-sm italic text-cinza">
          ninguém do the bookside escreveu sobre ele ainda.
        </p>
      )}
      <p className="mt-4 flex flex-wrap gap-x-3 text-[12px] text-cinza">
        mais resenhas:
        {linksDeResenhas(livro.titulo, livro.autor).map((l) => (
          <a
            key={l.nome}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-ameixa underline underline-offset-2 hover:text-bordo"
          >
            {l.nome} ↗
          </a>
        ))}
      </p>
    </div>
  );
}
