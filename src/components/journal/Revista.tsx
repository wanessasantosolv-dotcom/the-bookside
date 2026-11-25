"use client";

import Link from "next/link";
import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { capaSegura } from "@/components/story/Stories";
import { linkDaAutoria } from "@/lib/autores";
import { corDoLivro } from "@/lib/cores";
import { maiuscula, type Edicao, type Paleta } from "@/lib/journal";
import type { LivroDaEdicao, LivroSalvo, TextosEdicao } from "@/lib/perfil-store";

export const num = (n: number) => n.toLocaleString("pt-BR");
export const nota1 = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const plural = (n: number, um: string, varios: string) => `${num(n)} ${n === 1 ? um : varios}`;
const dataCurta = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "") : null;
const diasDe = (l: LivroDaEdicao) => {
  if (!l.iniciadoEm || !l.lidoEm) return null;
  const d = Math.round((new Date(l.lidoEm.slice(0, 10)).getTime() - new Date(l.iniciadoEm.slice(0, 10)).getTime()) / 864e5) + 1;
  return d >= 1 ? d : null;
};

/** dentro de uma exportação (PDF/imagem): as capas passam pela rota do app */
export const ImagemSegura = createContext(false);

/** a capa de um livro na revista (seguro = pela rota do app, para virar imagem) */
export function Capa({
  l,
  className,
  seguro,
}: {
  l: { id: string; titulo: string; capa?: string };
  className: string;
  seguro?: boolean;
}) {
  const exportando = useContext(ImagemSegura);
  return (
    <CapaLivro
      titulo={l.titulo}
      capa={seguro || exportando ? capaSegura(l.capa) : l.capa}
      cor={corDoLivro(l.id)}
      className={className}
    />
  );
}

/** a linha de números da capa: "4 livros · 1.276 páginas · nota média 4,4" */
export function linhaDaCapa(ed: Edicao) {
  const n = ed.numeros;
  if (!n.livros) return ed.andamento.length ? `${plural(ed.andamento.length, "leitura", "leituras")} em andamento` : "sem leituras registradas";
  return [
    plural(n.livros, "livro", "livros"),
    n.paginasConhecidas ? `${num(n.paginas)} páginas` : null,
    n.media !== null ? `nota média ${nota1(n.media)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * A capa da edição. A composição muda com a quantidade de livros: um livro
 * ocupa a capa; com mais, o mais bem avaliado fica na frente e os outros
 * entram como complemento. As capas dos livros nunca são alteradas.
 */
export function CapaJournal({
  ed,
  textos,
  paleta,
  previa,
  tamanho = "grande",
  seguro,
}: {
  ed: Edicao;
  textos: TextosEdicao;
  paleta: Paleta;
  previa?: boolean;
  tamanho?: "grande" | "media" | "mini";
  seguro?: boolean;
}) {
  const principal = ed.favoritos[0] ?? ed.andamento[0];
  const outros = [...ed.concluidos, ...ed.andamento].filter((l) => l !== principal).slice(0, tamanho === "mini" ? 2 : 5);
  const mini = tamanho === "mini";
  const grande = tamanho === "grande";
  const frase = textos.introducao.split(". ")[0].replace(/\.?$/, ".");
  return (
    <div
      className={`relative flex aspect-[3/4] w-full flex-col overflow-hidden ${mini ? "rounded-[6px] p-3" : grande ? "rounded-[6px] p-7 lg:p-9" : "rounded-[6px] p-5"}`}
      style={{ background: paleta.fundo, color: paleta.texto }}
    >
      {/* textura de papel, bem leve */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[.06]"
        style={{ backgroundImage: "radial-gradient(currentColor .5px, transparent .6px)", backgroundSize: "5px 5px" }}
      />
      <div className="relative flex items-start justify-between gap-2 border-b pb-2" style={{ borderColor: `${paleta.texto}33` }}>
        <p className={`font-semibold tracking-[.2em] uppercase ${mini ? "text-[6px]" : grande ? "text-[11px] lg:text-[12px]" : "text-[9px]"}`}>
          the bookside journal
        </p>
        <p className={`font-maquina tracking-[.08em] uppercase ${mini ? "text-[6px]" : grande ? "text-[10px]" : "text-[8px]"}`} style={{ color: paleta.destaque }}>
          vol. {String(ed.vol).padStart(2, "0")} · {ed.nome} {ed.ano}
        </p>
      </div>
      {previa ? (
        <span
          className={`relative mt-2 w-fit rounded-pill border px-2 font-semibold tracking-[.12em] uppercase ${mini ? "text-[5px]" : "py-0.5 text-[9px]"}`}
          style={{ borderColor: `${paleta.destaque}88`, color: paleta.destaque }}
        >
          prévia
        </span>
      ) : null}
      <h2
        className={`relative font-display leading-[.95] font-semibold lg:font-revista lg:font-normal ${mini ? "mt-2 text-[17px]" : grande ? "mt-5 text-[44px] lg:text-[64px]" : "mt-3 text-[28px]"}`}
      >
        {maiuscula(ed.nome)}
        <br />
        <i>em revista.</i>
      </h2>
      {!mini ? (
        <>
          <p className={`relative font-maquina ${grande ? "mt-3 text-[12px]" : "mt-2 text-[10px]"}`} style={{ color: paleta.destaque }}>
            {linhaDaCapa(ed)}
          </p>
          {grande && frase ? (
            <p className="relative mt-3 max-w-[30ch] text-[13px] leading-snug opacity-90 lg:text-[14px]">{frase}</p>
          ) : null}
        </>
      ) : null}
      {/* a montagem das capas */}
      <div className="relative mt-auto flex items-end justify-end">
        {outros.length ? (
          <div className="mr-[-6px] flex items-end">
            {outros.map((l, i) => (
              <div key={`${l.id}-${i}`} className="-ml-[8%]" style={{ transform: `rotate(${i % 2 ? 3 : -4}deg)`, zIndex: i }}>
                <Capa
                  l={l}
                  seguro={seguro}
                  className={`${mini ? "w-[22px]" : grande ? "w-[70px] lg:w-[88px]" : "w-[44px]"} shadow-[0_10px_18px_-10px_rgba(0,0,0,.6)] [&>span:last-child]:hidden`}
                />
              </div>
            ))}
          </div>
        ) : null}
        {principal ? (
          <div className="relative z-10" style={{ transform: "rotate(2deg)" }}>
            <Capa
              l={principal}
              seguro={seguro}
              className={`${mini ? "w-[46px]" : grande ? "w-[150px] lg:w-[190px]" : "w-[92px]"} shadow-[0_22px_36px_-16px_rgba(0,0,0,.7)] [&>span:last-child]:text-[10px]`}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ───────── capítulos ─────────

export function Capitulo({
  n,
  titulo,
  cor,
  children,
  className = "",
}: {
  n: string;
  titulo: string;
  cor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-t border-linha pt-6 lg:border-fio lg:pt-8 ${className}`}>
      <p className="font-maquina text-[10px] tracking-[.14em] uppercase" style={{ color: cor }}>
        capítulo {n}
      </p>
      <h2 className="mt-1 font-display text-[26px] leading-tight font-semibold text-ameixa lg:font-revista lg:text-[34px] lg:font-normal">
        {titulo}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Editorial({ textos, cor }: { textos: TextosEdicao; cor: string }) {
  return (
    <section className="lg:grid lg:grid-cols-[1fr_2fr] lg:gap-10">
      <p className="font-maquina text-[10px] tracking-[.14em] uppercase" style={{ color: cor }}>
        editorial · entre as páginas deste mês
      </p>
      <p className="mt-2 font-display text-[21px] leading-[1.45] text-ameixa first-letter:float-left first-letter:mr-2 first-letter:text-[56px] first-letter:leading-[.8] lg:mt-0 lg:font-revista lg:text-[24px]">
        {textos.introducao}
      </p>
    </section>
  );
}

export function MesEmNumeros({ ed, cor }: { ed: Edicao; cor: string }) {
  const n = ed.numeros;
  const itens = [
    { v: num(n.livros), r: n.livros === 1 ? "livro concluído" : "livros concluídos" },
    { v: n.paginasConhecidas ? num(n.paginas) : "—", r: "páginas dos livros concluídos" },
    { v: n.media !== null ? nota1(n.media) : "—", r: "nota média" },
    { v: ed.ritmo.confiavel && n.diasLeitura ? num(n.diasLeitura) : "—", r: "dias de leitura" },
    { v: n.paginasPorLivro ? num(n.paginasPorLivro) : "—", r: "páginas por livro" },
    { v: n.tempoMedio ? num(n.tempoMedio) : "—", r: "dias, em média, por livro" },
  ];
  const c = ed.comparacao;
  return (
    <Capitulo n="01" titulo="O mês em números" cor={cor}>
      <dl className="grid grid-cols-2 border-t border-linha sm:grid-cols-3 lg:border-fio">
        {itens.map((x) => (
          <div key={x.r} className="flex flex-col-reverse justify-end gap-1 border-b border-linha py-4 pr-3 lg:border-fio">
            <dt className="text-[12px] text-cinza">{x.r}</dt>
            <dd className="font-display text-[40px] leading-none font-semibold text-ameixa tabular-nums lg:font-revista lg:text-[52px] lg:font-normal">
              {x.v}
            </dd>
          </div>
        ))}
      </dl>
      {c?.temDados ? (
        <p className="mt-3 text-[13px] text-tinta-suave">
          em relação a {c.mes}:{" "}
          {c.livros === 0 ? "o mesmo número de livros" : `${c.livros > 0 ? "+" : "−"}${plural(Math.abs(c.livros), "livro", "livros")}`}
          {c.media !== null && Math.abs(c.media) >= 0.1 ? ` · nota média ${c.media > 0 ? "+" : "−"}${nota1(Math.abs(c.media))}` : ""}.
        </p>
      ) : null}
      {n.paginasRegistradas ? (
        <p className="mt-1 text-[12px] text-cinza">
          {num(n.paginasRegistradas)} páginas registradas no modo foco durante o mês.
        </p>
      ) : null}
    </Capitulo>
  );
}

export function AsHistorias({ ed, cor }: { ed: Edicao; cor: string }) {
  if (!ed.concluidos.length && !ed.andamento.length) return null;
  return (
    <Capitulo n="02" titulo={ed.concluidos.length ? "As histórias deste mês" : "Em andamento"} cor={cor}>
      <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {(ed.concluidos.length ? ed.concluidos : ed.andamento).map((l, i) => {
          const d = diasDe(l);
          return (
            <li key={`${l.id}-${i}`}>
              <Link href={`/livro/${l.id}`} className="group block">
                <Capa l={l} className="w-full !rounded-[3px] shadow-[0_16px_26px_-16px_rgba(43,20,32,.55)] transition-transform group-hover:-translate-y-1 [&>span:last-child]:text-[11px]" />
                <p className="mt-3 line-clamp-2 font-display text-[17px] leading-tight font-semibold text-ameixa lg:font-revista lg:font-normal">{l.titulo}</p>
              </Link>
              <Link href={linkDaAutoria(l.autor)} className="mt-0.5 block truncate text-[12px] text-cinza hover:text-bordo">{l.autor}</Link>
              <p className="mt-1.5 font-maquina text-[11px] text-tinta-suave">
                {[
                  l.nota ? `${nota1(l.nota)} ★` : null,
                  l.concluido ? dataCurta(l.lidoEm) : l.paginas && l.paginaAtual ? `pág. ${l.paginaAtual} de ${l.paginas}` : "lendo",
                  d ? `${d} ${d === 1 ? "dia" : "dias"}` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </li>
          );
        })}
      </ul>
    </Capitulo>
  );
}

export function HistoriaDoMes({ ed, cor, todos }: { ed: Edicao; cor: string; todos: LivroSalvo[] }) {
  const favs = ed.favoritos.filter((l) => l.concluido);
  if (!favs.length) return null;
  const empate = favs.length > 1;
  return (
    <Capitulo n="03" titulo={empate ? "As histórias do mês" : "A história do mês"} cor={cor}>
      <div className={empate ? "grid gap-8 sm:grid-cols-2" : "grid items-center gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-14"}>
        {favs.map((l, i) => {
          const salvo = todos.find((x) => x.id === l.id);
          const d = diasDe(l);
          return (
            <div key={`${l.id}-${i}`} className={empate ? "flex gap-5" : "contents"}>
              <Link href={`/livro/${l.id}`} className={empate ? "w-[130px] flex-none" : "mx-auto block w-[220px] lg:w-full lg:max-w-[320px]"}>
                <Capa l={l} className="w-full !rounded-[4px] shadow-[0_30px_50px_-26px_rgba(43,20,32,.6)] [&>span:last-child]:text-sm" />
              </Link>
              <div className="min-w-0">
                <p className="font-display text-[30px] leading-[1.05] font-semibold text-ameixa lg:font-revista lg:text-[44px] lg:font-normal">{l.titulo}</p>
                <Link href={linkDaAutoria(l.autor)} className="mt-1 block text-[15px] text-tinta-suave hover:text-bordo">{l.autor}</Link>
                <p className="mt-3 font-maquina text-[12px]" style={{ color: cor }}>
                  {[l.nota ? `${nota1(l.nota)} ★` : null, d ? `lido em ${d} ${d === 1 ? "dia" : "dias"}` : null, l.paginas ? `${num(l.paginas)} páginas` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {salvo?.resenha ? (
                  <blockquote className="mt-5 border-l-2 pl-4 font-accent text-[17px] leading-[1.55] text-ameixa italic lg:font-revista lg:text-[19px]" style={{ borderColor: cor }}>
                    “{salvo.resenha.length > 320 ? `${salvo.resenha.slice(0, 320).trim()}…` : salvo.resenha}”
                    <span className="mt-2 block font-texto text-[11px] text-cinza not-italic">da sua resenha</span>
                  </blockquote>
                ) : (
                  <p className="mt-4 text-[13px] text-cinza">
                    {empate ? "dividiu a nota mais alta do mês." : ed.numeros.livros > 1 ? "a leitura mais bem avaliada do mês." : "a leitura do mês."}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Capitulo>
  );
}

export function EntreExtremos({ ed, cor }: { ed: Edicao; cor: string }) {
  if (!ed.extremos.length) return null;
  return (
    <Capitulo n="04" titulo="Entre extremos" cor={cor}>
      <ul className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
        {ed.extremos.map((x) => {
          const l = x.livros[0];
          return (
            <li key={x.id}>
              <p className="text-[11px] text-cinza">{x.rotulo}</p>
              <Link href={`/livro/${l.id}`} className="mt-2 block w-[88px]">
                <Capa l={l} className="w-full !rounded-[3px] [&>span:last-child]:hidden" />
              </Link>
              <p className="mt-2 font-display text-[22px] leading-none font-semibold lg:font-revista lg:font-normal" style={{ color: cor }}>
                {x.valor}
              </p>
              <p className="mt-1 line-clamp-2 text-[12px] text-tinta-suave">
                {l.titulo}
                {x.livros.length > 1 ? ` e mais ${x.livros.length - 1}` : ""}
              </p>
            </li>
          );
        })}
      </ul>
    </Capitulo>
  );
}

export function SeuRitmo({ ed, textos, cor }: { ed: Edicao; textos: TextosEdicao; cor: string }) {
  const r = ed.ritmo;
  const maxPag = Math.max(1, ...r.dias.map((d) => d.paginas ?? 0));
  const temPaginas = r.dias.some((d) => d.paginas);
  return (
    <Capitulo n="05" titulo="Seu ritmo" cor={cor}>
      {r.confiavel ? (
        <>
          <div className="flex items-end gap-[3px]" role="img" aria-label={`${r.diasLeitura} dias com leitura no mês`}>
            {r.dias.map((d) => (
              <span key={d.chave} className="flex flex-1 flex-col items-center gap-1">
                {temPaginas ? (
                  <span
                    className="block w-full rounded-t-[2px]"
                    style={{ height: d.paginas ? 6 + (d.paginas / maxPag) * 40 : 0, background: cor, opacity: 0.35 }}
                  />
                ) : null}
                <span
                  className="block aspect-square w-full rounded-[2px]"
                  style={{ background: d.leitura ? cor : "var(--color-linha)", opacity: d.leitura ? 1 : 0.6 }}
                />
                <span className="hidden text-[8px] text-cinza tabular-nums sm:block">{d.dia}</span>
              </span>
            ))}
          </div>
          <dl className="mt-5 grid grid-cols-3 border-t border-linha pt-4 lg:border-fio">
            {[
              { v: num(r.diasLeitura), r: "dias de leitura" },
              { v: num(r.sequencia), r: "dias seguidos, no máximo" },
              { v: r.semanaForte !== null ? `${r.semanaForte + 1}ª` : "—", r: "semana mais intensa" },
            ].map((x) => (
              <div key={x.r} className="flex flex-col-reverse justify-end gap-1">
                <dt className="text-[11px] text-cinza">{x.r}</dt>
                <dd className="font-display text-[32px] leading-none font-semibold text-ameixa tabular-nums lg:font-revista lg:font-normal">{x.v}</dd>
              </div>
            ))}
          </dl>
          {textos.ritmo ? <p className="mt-4 max-w-[60ch] font-accent text-[16px] leading-snug text-tinta-suave italic">{textos.ritmo}</p> : null}
          {temPaginas ? <p className="mt-2 text-[11px] text-cinza">as barras mostram as páginas registradas no modo foco.</p> : null}
        </>
      ) : (
        <p className="font-accent text-sm italic text-cinza">
          o ritmo aparece quando os livros têm a data em que você começou a ler.
        </p>
      )}
    </Capitulo>
  );
}

export function OQueVoceLeu({ ed, textos, cor }: { ed: Edicao; textos: TextosEdicao; cor: string }) {
  if (!ed.generos.length) return null;
  return (
    <Capitulo n="06" titulo="O que você leu" cor={cor}>
      {textos.tendencias ? <p className="-mt-2 mb-4 text-[14px] text-tinta-suave">{textos.tendencias}</p> : null}
      <ul>
        {ed.generos.map((g) => (
          <li key={g.nome} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 border-t border-linha py-3.5 lg:border-fio">
            <span className="min-w-0">
              <span className="block truncate font-display text-[22px] leading-tight font-semibold text-ameixa lg:font-revista lg:font-normal">{maiuscula(g.nome)}</span>
              <span className="text-[12px] text-cinza">{plural(g.qtd, "livro", "livros")}</span>
            </span>
            <span className="font-display text-[26px] tabular-nums lg:font-revista" style={{ color: cor }}>{Math.round(g.parte * 100)}%</span>
            <span className="flex w-[96px] justify-end gap-1">
              {g.livros.slice(0, 3).map((l, i) => (
                <Link key={`${l.id}-${i}`} href={`/livro/${l.id}`} className="w-[28px]" title={l.titulo}>
                  <Capa l={l} className="w-full !rounded-[2px] [&>span:last-child]:hidden" />
                  <span className="sr-only">{l.titulo}</span>
                </Link>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </Capitulo>
  );
}

export function QuemEscreveu({ ed, cor }: { ed: Edicao; cor: string }) {
  if (!ed.autores.length) return null;
  const a = ed.autoria;
  const total = ed.concluidos.length;
  const novos = ed.autores.filter((x) => x.novo);
  const voltaram = ed.autores.filter((x) => !x.novo);
  return (
    <Capitulo n="07" titulo="Quem escreveu suas histórias" cor={cor}>
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          {a ? (
            <>
              <div className="flex h-[6px] overflow-hidden rounded-full bg-linha/60" aria-hidden>
                <span style={{ width: `${(a.feminina / total) * 100}%`, background: cor }} />
                <span style={{ width: `${(a.masculina / total) * 100}%`, background: "var(--color-oliva)" }} />
                <span style={{ width: `${(a.outras / total) * 100}%`, background: "var(--color-ouro)" }} />
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { v: a.feminina, r: "autoria feminina" },
                  { v: a.masculina, r: "autoria masculina" },
                  { v: a.desconhecida + a.outras, r: a.outras ? "outras / não informado" : "não informado" },
                ].map((x) => (
                  <div key={x.r} className="flex flex-col-reverse justify-end gap-1">
                    <dt className="text-[11px] text-cinza">{x.r}</dt>
                    <dd className="font-display text-[30px] leading-none font-semibold text-ameixa tabular-nums lg:font-revista lg:font-normal">
                      {x.v ? `${Math.round((x.v / total) * 100)}%` : "—"}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-[10px] text-cinza">pelo gênero declarado no Wikidata; nada é deduzido pelo nome.</p>
            </>
          ) : (
            <div aria-hidden className="h-[80px] animate-pulse rounded-[8px] bg-linha/50" />
          )}
          {ed.paises.length ? (
            <p className="mt-5 text-[13px] text-tinta-suave">
              <span className="text-cinza">de onde vieram: </span>
              {ed.paises.map((p) => `${p.pais.nome}${p.qtd > 1 ? ` (${p.qtd})` : ""}`).join(" · ")}
            </p>
          ) : null}
        </div>
        <div className="space-y-4 text-[14px]">
          {novos.length ? (
            <div>
              <p className="text-[11px] text-cinza">pela primeira vez na sua estante</p>
              <p className="mt-1 text-ameixa">
                {novos.map((x, i) => (
                  <span key={x.nome}>
                    {i ? " · " : ""}
                    <Link href={linkDaAutoria(x.nome)} className="hover:text-bordo hover:underline">{x.nome}</Link>
                  </span>
                ))}
              </p>
            </div>
          ) : null}
          {voltaram.length ? (
            <div>
              <p className="text-[11px] text-cinza">de volta à sua estante</p>
              <p className="mt-1 text-ameixa">
                {voltaram.map((x, i) => (
                  <span key={x.nome}>
                    {i ? " · " : ""}
                    <Link href={linkDaAutoria(x.nome)} className="hover:text-bordo hover:underline">{x.nome}</Link>
                  </span>
                ))}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </Capitulo>
  );
}

export function NasMargens({
  margens,
  cor,
}: {
  margens: { trechos: { texto: string; pagina?: number; livro: LivroSalvo }[]; resenhas: { texto: string; livro: LivroSalvo }[]; anotacoes: { texto: string; livro: LivroSalvo }[] };
  cor: string;
}) {
  const itens = [
    ...margens.trechos.slice(0, 4).map((t) => ({ tipo: "trecho", ...t })),
    ...margens.anotacoes.slice(0, 2).map((t) => ({ tipo: "anotação", pagina: undefined, ...t })),
  ];
  if (!itens.length) return null;
  return (
    <Capitulo n="08" titulo="Nas suas margens" cor={cor}>
      <p className="-mt-2 mb-5 text-[12px] text-cinza">só você vê esta parte — ela não entra nas imagens para compartilhar.</p>
      <ul className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {itens.map((t, i) => (
          <li key={i}>
            <p className="font-display text-[44px] leading-[.6]" style={{ color: cor }} aria-hidden>“</p>
            <blockquote className="mt-1 font-accent text-[19px] leading-[1.5] text-ameixa italic lg:font-revista lg:text-[21px]">
              {t.texto.length > 360 ? `${t.texto.slice(0, 360).trim()}…` : t.texto}
            </blockquote>
            <p className="mt-2 text-[11px] text-cinza">
              {t.tipo} · {t.livro.titulo}
              {t.pagina ? ` · página ${t.pagina}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </Capitulo>
  );
}

export function Mood({ textos, paleta, style }: { textos: TextosEdicao; paleta: Paleta; style?: CSSProperties }) {
  return (
    <section className="rounded-[8px] px-6 py-10 text-center lg:px-16 lg:py-16" style={{ background: paleta.fundo, color: paleta.texto, ...style }}>
      <p className="font-maquina text-[10px] tracking-[.16em] uppercase" style={{ color: paleta.destaque }}>
        capítulo 09 · seu mood de leitura
      </p>
      <h2 className="mx-auto mt-3 max-w-[18ch] font-display text-[36px] leading-[1.05] font-semibold lg:font-revista lg:text-[56px] lg:font-normal">
        {textos.titulo}
      </h2>
      <p className="mx-auto mt-4 max-w-[52ch] text-[15px] leading-[1.6] opacity-90">{textos.encerramento}</p>
      <p className="mt-6 text-[10px] tracking-[.2em] uppercase opacity-70">the bookside journal</p>
    </section>
  );
}
