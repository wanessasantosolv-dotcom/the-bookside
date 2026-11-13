"use client";

import { Animacao } from "@/components/Animacao";
import Link from "next/link";
import { useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { useClube } from "@/components/clube/ClubeContexto";
import { botaoContorno, botaoPrincipal, campo, rotuloCampo } from "@/components/clube/Pecas";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { andamento, comecarLeitura, encerrarLeitura, fichasDe, livrosDoClube, type LivroDoClube } from "@/lib/clubes";
import { corDoLivro } from "@/lib/cores";
import { nomeDe, useConsulta, useMeuId } from "@/lib/social";

function emDias(n: number) {
  const d = new Date(Date.now() + n * 864e5);
  return d.toISOString().slice(0, 10);
}

/** Moderadora escolhe (ou sorteia) a próxima leitura e o prazo. */
function Escolher({
  sugestoes,
  aoComecar,
  temAtual,
}: {
  sugestoes: LivroDoClube[];
  aoComecar: () => void;
  temAtual: boolean;
}) {
  const { clube } = useClube();
  const [escolhido, setEscolhido] = useState(sugestoes[0]?.id ?? "");
  const [prazo, setPrazo] = useState(emDias(20));
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function comecar(id: string) {
    if (temAtual && !confirm("isso encerra a leitura atual e começa a próxima. continuar?")) return;
    setOcupado(true);
    setErro(null);
    try {
      await comecarLeitura(clube.id, id, prazo);
      aoComecar();
    } catch {
      setErro("não deu para começar. tente de novo.");
      setOcupado(false);
    }
  }

  function sortear() {
    // cada voto é um bilhete a mais no sorteio
    const bilhetes = sugestoes.flatMap((s) => Array(1 + s.votos.length).fill(s.id) as string[]);
    void comecar(bilhetes[Math.floor(Math.random() * bilhetes.length)]);
  }

  if (!sugestoes.length)
    return (
      <Vazio
        className="mt-5"
        titulo="não tem sugestão para escolher"
        texto="peça para o clube sugerir livros. o mais votado vira a próxima leitura."
        acao={{ href: `/clubes/${clube.id}/sugerir`, rotulo: "sugerir um livro" }}
      />
    );

  return (
    <div className="mt-5 rounded-xl border border-linha bg-creme-quente p-4 lg:rounded-[4px] lg:border-fio lg:bg-transparent lg:p-5">
      <p className={rotuloCampo}>{temAtual ? "próxima leitura" : "escolher a leitura"}</p>
      <ul className="mt-3 space-y-2">
        {sugestoes.map((s) => (
          <li key={s.id}>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-md border p-2.5 ${escolhido === s.id ? "border-bordo bg-rosa-fundo/50" : "border-linha"}`}
            >
              <input
                type="radio"
                name="proxima"
                checked={escolhido === s.id}
                onChange={() => setEscolhido(s.id)}
                className="accent-bordo"
              />
              <CapaLivro
                titulo={s.livro.titulo}
                capa={s.livro.capa}
                cor={corDoLivro(s.livro.id)}
                className="w-8 [&>span:last-child]:hidden"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-[15px] font-semibold italic lg:font-revista lg:font-normal">
                  {s.livro.titulo}
                </span>
                <span className="block text-xs text-cinza">
                  {s.votos.length} {s.votos.length === 1 ? "voto" : "votos"}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
      <label className="mt-4 block">
        <span className={rotuloCampo}>prazo da leitura</span>
        <input type="date" value={prazo} min={emDias(1)} onChange={(e) => setPrazo(e.target.value)} className={campo} />
      </label>
      {erro ? (
        <p role="alert" className="mt-3 text-[13px] text-bordo">
          {erro}
        </p>
      ) : null}
      <div className="mt-4 flex gap-2.5">
        <button
          type="button"
          disabled={ocupado || !escolhido}
          onClick={() => comecar(escolhido)}
          className={botaoPrincipal}
        >
          começar leitura
        </button>
        <button type="button" disabled={ocupado} onClick={sortear} className={botaoContorno}>
          sortear
        </button>
      </div>
    </div>
  );
}

export default function LeituraPage() {
  const { clube, membros, papel } = useClube();
  const eu = useMeuId();
  const [escolhendo, setEscolhendo] = useState(false);
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
  const recarregar = () => {
    setEscolhendo(false);
    consulta.recarregar();
  };

  if (!lendo)
    return (
      <div className="px-6 pt-6 lg:max-w-[640px] lg:px-0">
        <h2 className="font-display text-[26px] font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
          nenhuma leitura rolando
        </h2>
        {moderadora ? (
          <Escolher sugestoes={sugestoes} aoComecar={recarregar} temAtual={false} />
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

        {moderadora && escolhendo ? <Escolher sugestoes={sugestoes} aoComecar={recarregar} temAtual /> : null}

        <div className="mt-7 flex gap-2.5 lg:max-w-[520px]">
          <Link href={`/clubes/${clube.id}/ficha/${lendo.id}`} className={botaoPrincipal}>
            {minha ? "editar minha ficha ✎" : "escrever ficha ✎"}
          </Link>
          {moderadora && !escolhendo ? (
            <button type="button" onClick={() => setEscolhendo(true)} className={botaoContorno}>
              sortear
            </button>
          ) : null}
        </div>
        {moderadora ? (
          <button
            type="button"
            onClick={async () => {
              if (!confirm(`encerrar a leitura de ${lendo.livro.titulo}? ela vai para os lidos do clube.`)) return;
              await encerrarLeitura(lendo.id);
              consulta.recarregar();
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
