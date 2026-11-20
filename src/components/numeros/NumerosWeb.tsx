"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { temas } from "@/lib/dados";
import { usePerfil } from "@/lib/perfil-store";
import { ExtremosDoAno } from "@/components/numeros/Extremos";
import { FormatosDoAno } from "@/components/numeros/Formatos";
import { MesAMes } from "@/components/numeros/MesAMes";
import { Nacionalidades } from "@/components/numeros/Nacionalidades";
import { MesEmRevista } from "@/components/numeros/MesEmRevista";
import { corDoLivro } from "@/lib/cores";
import { mediaTexto, numero, type Numeros } from "@/lib/numeros";

const CORES_GENERO = [
  "var(--color-bordo)",
  "var(--color-bordo-suave)",
  "var(--color-rosa-antigo)",
  "#A88B64",
  "#6B7A5E",
  "#464052",
];

/** Números na versão web: banner bordô + tudo numa tela só. */
export function NumerosWeb({
  n,
  nome,
  frase,
  aba,
  totalVidaToda,
  anoInicio,
}: {
  n: Numeros;
  nome: string;
  frase: string;
  aba: "ano" | "generos" | "retro";
  totalVidaToda?: number;
  anoInicio?: number | null;
}) {
  const temaId = usePerfil((s) => s.tema);
  const retro = aba === "retro";
  const eyebrow = retro ? `wrapped · ${n.ano}` : `sua jornada · ${n.ano}`;
  const h1 = retro ? `seu wrapped de ${n.ano}` : `sua leitura em ${n.ano}`;
  void nome;

  return (
    <div
      className="jornada-tema hidden min-h-dvh bg-creme font-sans text-ameixa lg:block"
      style={coresDaJornada(temaId)}
    >
      <Cabecalho eyebrow={eyebrow} h1={h1} frase={frase} />

      <div className="px-14 pt-12 pb-16">
        {retro ? (
          <ConteudoRetro n={n} frase={frase} />
        ) : (
          <ConteudoUnificado
            n={n}
            frase={frase}
            totalVidaToda={totalVidaToda}
            anoInicio={anoInicio}
          />
        )}
      </div>
    </div>
  );
}

/** Tudo numa tela só: cartões, gêneros, meses, destaques (com capa) e autores — com um único botão pro wrapped. */
function ConteudoUnificado({
  n,
  frase,
  totalVidaToda,
  anoInicio,
}: {
  n: Numeros;
  frase: string;
  totalVidaToda?: number;
  anoInicio?: number | null;
}) {
  // o mais recente: o último terminado (a lista não vem garantida em ordem)
  const recente = [...n.lidos]
    .filter((l) => l.lidoEm)
    .sort((a, b) => b.lidoEm!.localeCompare(a.lidoEm!))[0];
  const destaques = [
    n.livroDoAno
      ? {
          l: n.livroDoAno,
          rot: "mais amado",
          info: "★".repeat(Math.round(n.livroDoAno.nota ?? 0)),
        }
      : null,
    n.maisLongo
      ? {
          l: n.maisLongo,
          rot: "mais longo",
          info: `${n.maisLongoPaginas} pág.`,
        }
      : null,
    recente
      ? {
          l: recente,
          rot: "mais recente",
          info: new Date(recente.lidoEm!).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          }),
        }
      : null,
  ].filter((d) => d !== null);

  if (!n.total) {
    return (
      <p className="font-revista text-sm text-cinza italic">
        sua jornada aparece aqui quando você terminar o primeiro livro do ano.
      </p>
    );
  }

  return (
    <>
      <div className="mb-14 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Cartao
          icone={ICONE.livro}
          valor={numero(n.total)}
          rotulo={n.total === 1 ? "livro lido" : "livros lidos"}
          extra={
            totalVidaToda && totalVidaToda > n.total
              ? `${numero(totalVidaToda)} ${anoInicio ? `desde ${anoInicio}` : "no total"}`
              : undefined
          }
        />
        <Cartao
          icone={ICONE.paginas}
          valor={n.paginasConhecidas ? numero(n.paginas) : "—"}
          rotulo="páginas"
          extra={
            n.paginasPorLivro
              ? `${numero(n.paginasPorLivro)} por livro, em média`
              : undefined
          }
        />
        <Cartao
          icone={ICONE.estrela}
          valor={mediaTexto(n.media)}
          rotulo="sua nota média"
          extra={n.livroDoAno ? `a maior: ${n.livroDoAno.titulo}` : undefined}
        />
        <div className="rounded-[6px] border border-linha bg-[var(--acc-fundo)] p-5">
          <span className="flex size-9 items-center justify-center rounded-full bg-[var(--acc)] text-creme">
            <Icone d={ICONE.alvo} />
          </span>
          {n.meta ? (
            <>
              <b className="mt-3 block font-revista text-[34px] leading-none font-normal text-[var(--acc)] italic">
                {n.total}
                <span className="text-[20px] text-cinza"> de {n.meta}</span>
              </b>
              <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-[var(--acc-claro)]">
                <span
                  className="block h-full rounded-full bg-[var(--acc)]"
                  style={{
                    width: `${Math.min(100, (n.total / n.meta) * 100)}%`,
                  }}
                />
              </span>
              <span className="mt-2 block text-[11px] leading-snug text-cinza">
                {n.faltam
                  ? `faltam ${n.faltam} · uns ${n.porSemana.toLocaleString("pt-BR")} por semana`
                  : "meta batida ✦ tudo agora é bônus"}
              </span>
            </>
          ) : (
            <>
              <b className="mt-3 block font-revista text-[26px] leading-none font-normal text-[var(--acc)] italic">
                sem meta
              </b>
              <Link
                href="/perfil/editar"
                className="mt-3 block text-[11px] font-semibold text-[var(--acc)]"
              >
                definir uma meta →
              </Link>
            </>
          )}
        </div>
      </div>{" "}
      <section className="mb-14">
        <h2 className="mb-[18px] border-b border-ameixa pb-2 font-revista text-[22px] leading-none text-ameixa italic">
          destaques do ano
        </h2>
        {destaques.length ? (
          <div className="grid grid-cols-3 gap-[18px]">
            {destaques.map(({ l, rot, info }) => (
              <Link
                key={rot}
                href={`/livro/${l.id}`}
                className="rounded-[4px] border border-linha p-5 text-center hover:bg-rosa-fundo"
              >
                <CapaLivro
                  titulo={l.titulo}
                  capa={l.capa}
                  cor={corDoLivro(l.id)}
                  className="mx-auto w-[128px] [&>span:last-child]:text-[11px]"
                />
                <p className="mt-3 font-revista text-base text-ameixa italic">
                  {rot}
                </p>
                <span className="mt-1 block text-[11px] text-cinza">
                  {info}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="font-revista text-sm text-cinza italic">
            seus destaques aparecem aqui ao longo do ano.
          </p>
        )}
      </section>
      <Link
        href="/numeros/calendario"
        className="mb-8 flex items-center justify-between rounded-[4px] border border-linha px-6 py-4 hover:border-bordo"
      >
        <span>
          <span className="block font-revista text-xl text-ameixa italic">
            calendário de leitura
          </span>
          <span className="block text-xs text-cinza">
            as capas dos livros em cada dia do mês
          </span>
        </span>
        <span className="text-sm font-semibold text-bordo">ver →</span>
      </Link>
      <MesEmRevista web />
      <ExtremosDoAno n={n} web />
      <FormatosDoAno n={n} web />
      <Nacionalidades web />
      <MesAMes n={n} web />
      <section className="mb-14">
        <h2 className="mb-[18px] border-b border-ameixa pb-2 font-revista text-[22px] leading-none text-ameixa italic">
          gêneros
        </h2>
        {n.generos.length ? (
          n.generos.map((g, i) => {
            const pct = Math.round((g.qtd / n.generos[0].qtd) * 100);
            return (
              <div key={g.nome} className="mb-3 flex items-center gap-3.5">
                <span className="w-[150px] flex-none truncate text-xs font-semibold">
                  {g.nome}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-linha/70">
                  <i
                    className="block h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      background: CORES_GENERO[i % CORES_GENERO.length],
                    }}
                  />
                </div>
                <span className="w-14 text-right font-maquina text-[11px] font-semibold text-cinza">
                  {g.qtd} {g.qtd === 1 ? "livro" : "livros"}
                </span>
              </div>
            );
          })
        ) : (
          <p className="font-revista text-sm text-cinza italic">
            os gêneros aparecem quando você terminar o primeiro livro do ano.
          </p>
        )}
      </section>
      <div className="mb-14 grid grid-cols-2 gap-12">
        <section>
          <h2 className="mb-[18px] border-b border-ameixa pb-2 font-revista text-[22px] leading-none text-ameixa italic">
            livros por mês
          </h2>
          <GraficoMeses n={n} alto={110} />
        </section>

        <section>
          <h2 className="mb-[18px] border-b border-ameixa pb-2 font-revista text-[22px] leading-none text-ameixa italic">
            quem você mais leu
          </h2>
          <ol>
            {n.autores.map((a, i) => (
              <li
                key={a.nome}
                className="flex items-center gap-3 border-t border-linha py-2.5 first:border-t-0"
              >
                <span className="font-maquina text-xs font-bold text-bordo">
                  {String(i + 1).padStart(2, "0")}—
                </span>
                <span className="font-revista text-base text-ameixa italic">
                  {a.nome}
                </span>
                <span className="ml-auto text-xs text-cinza">
                  {a.qtd} {a.qtd === 1 ? "livro" : "livros"}
                  {a.media ? ` · ${mediaTexto(a.media)}` : ""}
                </span>
              </li>
            ))}
            {!n.autores.length ? (
              <p className="font-revista text-sm text-cinza italic">
                seus autores aparecem aqui ao longo do ano.
              </p>
            ) : null}
          </ol>
        </section>
      </div>
    </>
  );
}

function ConteudoRetro({ n, frase }: { n: Numeros; frase: string }) {
  const genero = n.generos[0];
  const [aviso, setAviso] = useState<string | null>(null);

  async function compartilhar() {
    const texto = [
      `meu ${n.ano} em livros ✦`,
      `${n.total} ${n.total === 1 ? "livro" : "livros"}${n.paginasConhecidas ? ` · ${numero(n.paginas)} páginas` : ""}`,
      genero ? `gênero do ano: ${genero.nome}` : null,
      n.livroDoAno ? `livro do ano: ${n.livroDoAno.titulo}` : null,
      "— the bookside",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(texto);
      setAviso("copiado! é só colar onde quiser ✦");
    } catch {
      /* sem permissão de clipboard */
    }
  }

  if (!n.total) {
    return (
      <p className="font-revista text-sm text-cinza italic">
        seu wrapped começa no primeiro &ldquo;já li&rdquo; do ano ✦
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="rounded-md bg-gradient-to-br from-ameixa to-bordo-escuro px-10 py-12 text-center text-creme">
        <p className="text-[10px] font-semibold tracking-[.2em] text-rosa-claro uppercase">
          você leu
        </p>
        <p className="mt-3 font-revista text-[86px] leading-none font-normal text-creme italic">
          {n.total}
        </p>
        <p className="mt-3 font-revista text-base text-rosa-claro italic">
          {n.total === 1 ? "livro" : "livros"}
          {n.paginasConhecidas ? ` · ${numero(n.paginas)} páginas` : ""}
          {n.paginasPorLivro ? ` · ${numero(n.paginasPorLivro)} por livro` : ""}
        </p>

        <div className="mt-10 grid grid-cols-2 gap-4 text-left">
          {genero ? (
            <div className="rounded-[10px] border border-creme/20 bg-creme/5 p-5">
              <p className="text-[9px] font-semibold tracking-[.18em] text-ouro uppercase">
                seu gênero do ano
              </p>
              <p className="mt-2 font-revista text-xl text-creme italic">
                {genero.nome}
              </p>
              <p className="mt-1.5 text-[13px] text-rosa-claro">
                {genero.qtd} dos seus {n.total} livros ✦
              </p>
            </div>
          ) : null}

          {n.livroDoAno ? (
            <Link
              href={`/livro/${n.livroDoAno.id}`}
              className="flex items-center gap-3.5 rounded-[10px] border border-creme/20 bg-creme/5 p-5 hover:bg-creme/10"
            >
              <CapaLivro
                titulo={n.livroDoAno.titulo}
                capa={n.livroDoAno.capa}
                cor={corDoLivro(n.livroDoAno.id)}
                className="w-[52px] flex-none [&>span:last-child]:text-[9px]"
              />
              <span>
                <p className="text-[9px] font-semibold tracking-[.18em] text-ouro uppercase">
                  o livro do ano
                </p>
                <p className="mt-1.5 font-revista text-lg leading-[1.2] text-creme italic">
                  {n.livroDoAno.titulo}
                </p>
                <p className="mt-1 text-[12px] text-rosa-claro">
                  {n.livroDoAno.nota === 5
                    ? "cinco estrelas ♡"
                    : `${n.livroDoAno.nota} estrelas, a maior nota do ano ♡`}
                </p>
              </span>
            </Link>
          ) : null}
        </div>

        {n.maisForte ? (
          <div className="mt-4 rounded-[10px] border border-creme/20 bg-creme/5 px-5 py-3.5 text-left">
            <p className="text-[9px] font-semibold tracking-[.18em] text-ouro uppercase">
              e ainda
            </p>
            <p className="mt-1.5 font-revista text-sm text-creme italic">
              {n.maisForte.mes} foi seu mês mais forte, com {n.maisForte.livros}{" "}
              {n.maisForte.livros === 1 ? "livro" : "livros"}.
            </p>
          </div>
        ) : null}

        {frase ? (
          <p className="mt-8 font-revista text-lg text-creme italic">
            &ldquo;{frase}&rdquo;
          </p>
        ) : null}

        <button
          type="button"
          onClick={compartilhar}
          className="mt-10 inline-flex h-11 items-center rounded-pill bg-creme px-7 text-xs font-bold tracking-[.1em] text-bordo uppercase hover:bg-rosa-claro"
        >
          compartilhar ✧
        </button>
        <p role="status" className="mt-2.5 min-h-4 text-xs text-rosa-claro">
          {aviso}
        </p>
      </div>
    </div>
  );
}

/** Barras de livros por mês; o mês mais forte fica em bordô. */
export function GraficoMeses({ n, alto = 88 }: { n: Numeros; alto?: number }) {
  const max = Math.max(1, ...n.porMes.map((m) => m.livros));
  return (
    <figure>
      <div
        className="flex items-end gap-[5px]"
        style={{ height: alto + 16 }}
        role="img"
        aria-label={`livros por mês: ${n.porMes.map((m) => `${m.mes} ${m.livros}`).join(", ")}`}
      >
        {n.porMes.map((m) => (
          <span
            key={m.mes}
            className="flex h-full flex-1 flex-col items-center justify-end"
          >
            {/* a quantidade em cima da barra */}
            <span
              aria-hidden
              className={`mb-1 text-[11px] leading-none font-semibold tabular-nums ${
                m.livros
                  ? m === n.maisForte
                    ? "text-bordo"
                    : "text-ameixa"
                  : "text-transparent"
              }`}
            >
              {m.livros || 0}
            </span>
            <i
              className="block w-full rounded-t-[3px]"
              style={{
                height: m.livros ? Math.max(8, (m.livros / max) * alto) : 4,
                background: !m.livros
                  ? "#E6D5CE"
                  : m === n.maisForte
                    ? "var(--color-bordo)"
                    : "var(--color-rosa-antigo)",
              }}
            />
          </span>
        ))}
      </div>
      <div aria-hidden className="mt-2 flex gap-[5px]">
        {n.porMes.map((m) => (
          <span
            key={m.mes}
            className="flex-1 text-center text-[9px] font-semibold text-cinza uppercase"
          >
            {m.mes[0]}
          </span>
        ))}
      </div>
    </figure>
  );
}

const ICONE = {
  livro: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z M8 7h7",
  paginas: "M6 3h9l4 4v14H6z M14 3v5h5 M9 13h7 M9 17h5",
  estrela:
    "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
  alvo: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 12h.01",
};

function Icone({ d }: { d: string }) {
  return (
    <svg
      aria-hidden
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d.split(" M").map((p, i) => (
        <path key={i} d={i ? `M${p}` : p} />
      ))}
    </svg>
  );
}

function Cartao({
  icone,
  valor,
  rotulo,
  extra,
}: {
  icone: string;
  valor: string;
  rotulo: string;
  extra?: string;
}) {
  return (
    <div className="rounded-[6px] border border-linha bg-[var(--acc-fundo)] p-5">
      <span className="flex size-9 items-center justify-center rounded-full bg-[var(--acc)] text-creme">
        <Icone d={icone} />
      </span>
      <b className="mt-3 block font-revista text-[34px] leading-none font-normal text-[var(--acc)] italic">
        {valor}
      </b>
      <span className="mt-2 block text-[10px] font-semibold tracking-[.1em] text-cinza uppercase">
        {rotulo}
      </span>
      {extra ? (
        <span className="mt-1.5 block truncate text-[11px] text-cinza">
          {extra}
        </span>
      ) : null}
    </div>
  );
}

/** O topo da jornada com a cara do perfil: a capa, a foto e a cor do tema. */
function Cabecalho({
  eyebrow,
  h1,
  frase,
}: {
  eyebrow: string;
  h1: string;
  frase: string;
}) {
  const p = usePerfil();
  return (
    <div>
      {/* só a imagem na capa; o texto fica embaixo, sempre legível */}
      <div
        className={`h-[170px] bg-cover bg-center ${p.capaImagem ? "" : `pat-${p.capa}`}`}
        style={
          p.capaImagem
            ? { backgroundImage: `url("${p.capaImagem}")` }
            : undefined
        }
      />
      <div className="px-14">
        <div className="min-w-0 pt-6">
          <p className="text-[10px] font-semibold tracking-[.2em] text-[var(--acc)] uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-1.5 font-revista text-[40px] leading-none text-ameixa italic">
            {h1}
          </h1>
          {frase || p.frase ? (
            <p className="mt-1.5 truncate font-revista text-[15px] text-cinza italic">
              “{frase || p.frase}”
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** as cores dos cartões vêm do tema do perfil */
function coresDaJornada(id: string): CSSProperties {
  const t = temas.find((x) => x.id === id) ?? temas[0];
  const acc =
    "escuro" in t
      ? `color-mix(in srgb, ${t.destaque} 60%, #2B1420)`
      : t.destaque;
  return {
    ["--acc-base" as string]: acc,
  };
}
