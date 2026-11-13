"use client";

import { Animacao } from "@/components/Animacao";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CapaLivro } from "@/components/CapaLivro";
import { useClube } from "@/components/clube/ClubeContexto";
import { botaoContorno, botaoPrincipal } from "@/components/clube/Pecas";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { andamento, encerrarLeitura, fichasDe, livrosDoClube } from "@/lib/clubes";
import { corDoLivro } from "@/lib/cores";
import { nomeDe, useConsulta, useMeuId } from "@/lib/social";

export default function LeituraPage() {
  const { clube, membros, papel } = useClube();
  const eu = useMeuId();
  const router = useRouter();
  const consulta = useConsulta(async () => {
    const livros = await livrosDoClube(clube.id);
    const lendo = livros.find((l) => l.estado === "lendo") ?? null;
    const fichas = lendo ? await fichasDe(lendo.id) : [];
    return { livros, lendo, fichas };
  }, [clube.id]);

  if (consulta.carregando && !consulta.dados)
    return <Animacao tipo="marcador" titulo="separando sua página" sub="onde vocês pararam no livro" />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { livros, lendo, fichas } = consulta.dados!;
  const sugestoes = livros.filter((l) => l.estado === "sugerido").sort((a, b) => b.votos.length - a.votos.length);
  const moderadora = papel === "moderadora";

  if (!lendo)
    return (
      <div className="px-6 pt-6 lg:max-w-[640px] lg:px-0">
        <h2 className="font-display text-[26px] font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
          nenhuma leitura rolando
        </h2>
        {moderadora ? (
          <Vazio
            className="mt-5"
            titulo="escolha o livro da vez"
            texto={
              sugestoes.length
                ? `pegue uma das ${sugestoes.length} sugestões do clube, sorteie, ou busque qualquer livro.`
                : "busque qualquer livro e marque o prazo. ninguém precisa sugerir antes."
            }
            acao={{ href: `/clubes/${clube.id}/escolher`, rotulo: "escolher o livro" }}
          />
        ) : (
          <Vazio
            className="mt-5"
            titulo="a próxima leitura sai das sugestões"
            texto="vote nas sugestões do clube. quem modera escolhe a mais votada (ou sorteia)."
            acao={{ href: `/clubes/${clube.id}/sugestoes`, rotulo: "ver e votar" }}
          />
        )}
      </div>
    );

  const and = andamento(lendo);
  const quem = lendo.sugerido_por ? membros.find((m) => m.usuario_id === lendo.sugerido_por)?.pessoa : null;
  const minha = fichas.find((f) => f.autor === eu);
  const marcas = and
    ? Array.from(new Set([1, ...[0.2, 0.4, 0.6, 0.8].map((x) => Math.max(1, Math.round(and.total * x))), and.total]))
    : [];

  return (
    <div className="px-6 pt-6 lg:grid lg:max-w-[1000px] lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10 lg:px-0">
      <div>
        <p className="text-[10px] font-semibold tracking-[.16em] text-rosa-antigo uppercase">
          lendo agora{lendo.rodada ? ` · rodada ${lendo.rodada}` : ""}
        </p>
        <div className="mt-3 flex gap-4">
          <CapaLivro
            titulo={lendo.livro.titulo}
            capa={lendo.livro.capa}
            cor={corDoLivro(lendo.livro.id)}
            className="w-[110px] -rotate-1 [&>span:last-child]:text-sm"
          />
          <div className="min-w-0 pt-1">
            <h2 className="font-display text-[26px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
              {lendo.livro.titulo}
            </h2>
            <p className="mt-1.5 text-[13px] text-cinza">
              {lendo.livro.autor}
              {lendo.livro.paginas ? ` · ${lendo.livro.paginas} páginas` : ""}
            </p>
            {quem ? (
              <p className="mt-2 font-accent text-sm italic text-cinza">
                sugerido {quem.id === eu ? "por você" : `pela ${nomeDe(quem)}`}
              </p>
            ) : null}
          </div>
        </div>

        {and ? (
          <section className="mt-7" aria-label="prazo da leitura">
            <div className="flex items-baseline justify-between">
              <p className="font-display text-xl font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
                dia {and.dia} de {and.total}
              </p>
              <p className="text-[10px] font-semibold tracking-[.14em] text-cinza uppercase">prazo da leitura</p>
            </div>
            <div
              className="relative mt-3 h-2 rounded-full bg-rosa-fundo"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={and.total}
              aria-valuenow={and.dia}
            >
              <i
                className="absolute inset-y-0 left-0 rounded-full bg-bordo"
                style={{ width: `${(and.dia / and.total) * 100}%` }}
              />
            </div>
            <div className="relative mt-1.5 h-4 text-[10px] text-cinza">
              {marcas.map((m) => (
                <span
                  key={m}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${((m - 0.5) / and.total) * 100}%` }}
                >
                  {String(m).padStart(2, "0")}
                </span>
              ))}
            </div>
            <p className="mt-3 font-accent text-sm italic text-cinza">
              começou {and.inicio.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })} · termina{" "}
              {and.fim.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })} ✦
            </p>
          </section>
        ) : null}

        <section className="mt-7">
          <p className="text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">envelopes da próxima rodada</p>
          <div className="mt-3 flex gap-3">
            {(sugestoes.length ? sugestoes.slice(0, 3) : [null, null, null]).map((s, i) => (
              <Link
                key={s?.id ?? i}
                href={`/clubes/${clube.id}/${s ? "sugestoes" : "sugerir"}`}
                aria-label={s ? "sugestão lacrada: ver sugestões" : "envelope vazio: sugerir um livro"}
                className={`relative flex h-[62px] w-[92px] items-center justify-center rounded-[4px] border ${
                  s ? "border-bege bg-[#F3E6D3]" : "border-dashed border-bege"
                }`}
                style={{ transform: `rotate(${[-3, 2, -1][i]}deg)` }}
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1/2 border-b border-bege/80 [clip-path:polygon(0_0,100%_0,50%_100%)] bg-[#EBDAC2]"
                />
                <span
                  aria-hidden
                  className={`relative mt-3 font-display text-xl italic ${s ? "text-bordo" : "text-bege"}`}
                >
                  ?
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-2 text-xs text-cinza">
            {sugestoes.length
              ? `${sugestoes.length} ${sugestoes.length === 1 ? "sugestão lacrada" : "sugestões lacradas"} esperando a vez.`
              : "nenhuma sugestão ainda."}
          </p>
        </section>

        <div className="mt-7 flex gap-2.5 lg:max-w-[520px]">
          <Link href={`/clubes/${clube.id}/ficha/${lendo.id}`} className={botaoPrincipal}>
            {minha ? "editar minha ficha ✎" : "escrever ficha ✎"}
          </Link>
          {moderadora ? (
            <Link href={`/clubes/${clube.id}/escolher`} className={botaoContorno}>
              trocar livro
            </Link>
          ) : null}
        </div>
        {moderadora ? (
          <button
            type="button"
            onClick={async () => {
              if (!confirm(`encerrar a leitura de ${lendo.livro.titulo}? ela vai para os lidos do clube.`)) return;
              await encerrarLeitura(lendo.id);
              router.push(`/clubes/${clube.id}/escolher?depois=encerrar`);
            }}
            className="mt-3 min-h-11 text-xs font-semibold text-cinza underline underline-offset-4 hover:text-bordo"
          >
            encerrar esta leitura
          </button>
        ) : null}
      </div>

      <aside className="mt-8 lg:mt-0">
        <div className="rounded-xl border border-linha p-4 lg:rounded-[4px] lg:border-fio lg:p-5">
          <p className="text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
            fichas entregues · {fichas.length} de {membros.length}
          </p>
          <ul className="mt-3 space-y-2.5">
            {membros.map((m) => {
              const f = fichas.find((x) => x.autor === m.usuario_id);
              return (
                <li key={m.usuario_id} className="flex items-center gap-2.5 text-[13px]">
                  <Avatar pessoa={m.pessoa} tamanho={26} />
                  <span className="flex-1 truncate">{m.usuario_id === eu ? "você" : nomeDe(m.pessoa)}</span>
                  <span className={`text-xs ${f ? "text-bordo" : "text-cinza"}`}>{f ? "entregou ✓" : "lendo…"}</span>
                </li>
              );
            })}
          </ul>
          {fichas.length ? (
            <Link
              href={`/clubes/${clube.id}/livro/${lendo.id}`}
              className="mt-4 inline-flex min-h-9 items-center text-xs font-semibold text-bordo underline underline-offset-4"
            >
              ler as fichas →
            </Link>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
