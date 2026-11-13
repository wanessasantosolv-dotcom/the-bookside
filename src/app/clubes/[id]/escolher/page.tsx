"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Animacao } from "@/components/Animacao";
import { CapaLivro } from "@/components/CapaLivro";
import { useClube } from "@/components/clube/ClubeContexto";
import { botaoContorno, botaoPrincipal, campo, Rodape, rotuloCampo, TopoForm } from "@/components/clube/Pecas";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import { useBuscaLivros, type LivroBusca } from "@/lib/catalogo";
import { comecarLeitura, escolherLivroDaVez, livrosDoClube, type LivroDoClube } from "@/lib/clubes";
import { corDoLivro } from "@/lib/cores";
import { nomeDe, useConsulta } from "@/lib/social";

const emDias = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const prazos = [
  { r: "2 semanas", d: 14 },
  { r: "3 semanas", d: 21 },
  { r: "1 mês", d: 30 },
  { r: "2 meses", d: 60 },
];

type Escolha = { tipo: "sugestao"; l: LivroDoClube } | { tipo: "busca"; l: LivroBusca };

function Escolher() {
  const { clube, membros, papel } = useClube();
  const router = useRouter();
  const depoisDeEncerrar = useSearchParams().get("depois") === "encerrar";
  const consulta = useConsulta(() => livrosDoClube(clube.id), [clube.id]);
  const [aba, setAba] = useState<"sugestoes" | "busca" | null>(null);
  const [termo, setTermo] = useState("");
  const busca = useBuscaLivros(termo);
  const [escolha, setEscolha] = useState<Escolha | null>(null);
  const [prazo, setPrazo] = useState(emDias(21));
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (papel !== "moderadora")
    return (
      <div className="px-6 pt-6 lg:px-0">
        <Vazio
          titulo="quem modera escolhe o livro da vez"
          texto="você pode sugerir um livro e votar nas sugestões do clube."
          acao={{ href: `/clubes/${clube.id}/sugerir`, rotulo: "sugerir um livro" }}
        />
      </div>
    );
  if (consulta.carregando && !consulta.dados)
    return <Animacao tipo="pilha" titulo="procurando na estante" sub="trazendo as sugestões do clube" />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;

  const livros = consulta.dados!;
  const atual = livros.find((l) => l.estado === "lendo");
  const sugestoes = livros.filter((l) => l.estado === "sugerido").sort((a, b) => b.votos.length - a.votos.length);
  const abaAtiva = aba ?? (sugestoes.length ? "sugestoes" : "busca");
  const pessoa = (id: string | null) => (id ? (membros.find((m) => m.usuario_id === id)?.pessoa ?? null) : null);

  async function comecar(e: Escolha | null = escolha) {
    if (!e) return setErro("escolha um livro primeiro.");
    if (atual && !confirm(`isso encerra a leitura de ${atual.livro.titulo}. continuar?`)) return;
    setOcupado(true);
    setErro(null);
    try {
      if (e.tipo === "sugestao") await comecarLeitura(clube.id, e.l.id, prazo);
      else
        await escolherLivroDaVez(
          clube.id,
          {
            id: e.l.id,
            titulo: e.l.titulo,
            autor: e.l.autor,
            capa: e.l.capa?.startsWith("data:") ? undefined : e.l.capa,
            paginas: e.l.paginas,
          },
          prazo,
        );
      router.push(`/clubes/${clube.id}/leitura`);
    } catch {
      setErro("não deu para começar agora. tente de novo.");
      setOcupado(false);
    }
  }

  function sortear() {
    // cada voto vale um bilhete a mais no sorteio
    const bilhetes = sugestoes.flatMap((s) => Array(1 + s.votos.length).fill(s) as LivroDoClube[]);
    const sorteada = bilhetes[Math.floor(Math.random() * bilhetes.length)];
    setEscolha({ tipo: "sugestao", l: sorteada });
  }

  const escolhido = escolha
    ? escolha.tipo === "sugestao"
      ? {
          id: escolha.l.livro.id,
          titulo: escolha.l.livro.titulo,
          autor: escolha.l.livro.autor,
          capa: escolha.l.livro.capa,
        }
      : escolha.l
    : null;
  const pilula = (on: boolean) =>
    `flex min-h-9 items-center rounded-pill px-3.5 text-xs font-semibold ${on ? "bg-bordo text-creme" : "border border-bege text-ameixa"}`;

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <TopoForm
        voltar={{ href: `/clubes/${clube.id}/leitura`, r: "leitura" }}
        rotulo={clube.nome}
        titulo={depoisDeEncerrar ? "e a próxima?" : "o livro da vez"}
        frase={
          depoisDeEncerrar
            ? "leitura encerrada ✓ escolha o próximo livro do clube."
            : "escolha uma sugestão do clube ou qualquer outro livro ✦"
        }
      />
      <div className="mt-6 space-y-6 px-6 lg:max-w-[720px] lg:px-0">
        {atual ? (
          <p className="rounded-md border border-linha px-4 py-3 text-[13px] text-cinza lg:border-fio">
            o clube está lendo <i>{atual.livro.titulo}</i>. começar outro livro encerra essa leitura.
          </p>
        ) : null}

        <div role="group" aria-label="de onde vem o livro" className="flex gap-1.5">
          <button
            type="button"
            aria-pressed={abaAtiva === "sugestoes"}
            onClick={() => setAba("sugestoes")}
            className={pilula(abaAtiva === "sugestoes")}
          >
            das sugestões · {sugestoes.length}
          </button>
          <button
            type="button"
            aria-pressed={abaAtiva === "busca"}
            onClick={() => setAba("busca")}
            className={pilula(abaAtiva === "busca")}
          >
            buscar outro livro
          </button>
        </div>

        {abaAtiva === "sugestoes" ? (
          sugestoes.length ? (
            <div>
              <ul className="space-y-2">
                {sugestoes.map((s) => {
                  const on = escolha?.tipo === "sugestao" && escolha.l.id === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setEscolha({ tipo: "sugestao", l: s })}
                        className={`flex w-full items-center gap-3 rounded-md border p-2.5 text-left ${on ? "border-bordo bg-rosa-fundo/50" : "border-linha hover:border-bordo"}`}
                      >
                        <CapaLivro
                          titulo={s.livro.titulo}
                          capa={s.livro.capa}
                          cor={corDoLivro(s.livro.id)}
                          className="w-9 [&>span:last-child]:hidden"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-[15px] font-semibold italic lg:font-revista lg:font-normal">
                            {s.livro.titulo}
                          </span>
                          <span className="block truncate text-xs text-cinza">
                            {s.livro.autor} · {s.votos.length} {s.votos.length === 1 ? "voto" : "votos"} · sugestão{" "}
                            {s.sugerido_por ? `de ${nomeDe(pessoa(s.sugerido_por))}` : ""}
                          </span>
                        </span>
                        {on ? <span className="text-bordo">✓</span> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                onClick={sortear}
                className="mt-3 min-h-9 text-xs font-semibold text-bordo underline underline-offset-4"
              >
                ✦ sortear entre as sugestões (cada voto conta)
              </button>
            </div>
          ) : (
            <p className="font-accent text-sm italic text-cinza">
              ninguém sugeriu nada ainda. busque qualquer livro ao lado.
            </p>
          )
        ) : (
          <div>
            <label className="block">
              <span className="sr-only">buscar por título ou autoria</span>
              <input
                type="search"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="título ou autoria"
                autoComplete="off"
                className={campo}
              />
            </label>
            <ul className="mt-2 max-h-[320px] overflow-y-auto rounded-md border border-linha" aria-live="polite">
              {busca.estado === "carregando" ? (
                <li className="px-4 py-3 font-accent text-sm italic text-cinza">procurando…</li>
              ) : (
                busca.resultados.slice(0, 12).map((l) => {
                  const on = escolha?.tipo === "busca" && escolha.l.id === l.id;
                  return (
                    <li key={l.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setEscolha({ tipo: "busca", l })}
                        className={`flex w-full items-center gap-3 border-b border-linha/70 px-3 py-2 text-left ${on ? "bg-rosa-fundo/60" : "hover:bg-rosa-fundo/40"}`}
                      >
                        <CapaLivro
                          titulo={l.titulo}
                          capa={l.capa}
                          cor={l.cor}
                          className="w-8 [&>span:last-child]:hidden"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{l.titulo}</span>
                          <span className="block truncate text-xs text-cinza">{l.autor}</span>
                        </span>
                        {on ? <span className="text-bordo">✓</span> : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}

        {escolhido ? (
          <div className="flex items-center gap-3.5 rounded-xl border border-bordo bg-rosa-fundo/40 p-3.5 lg:rounded-[4px]">
            <CapaLivro
              titulo={escolhido.titulo}
              capa={escolhido.capa}
              cor={corDoLivro(escolhido.id)}
              className="w-12 [&>span:last-child]:hidden"
            />
            <span className="min-w-0">
              <span className="block text-[10px] font-semibold tracking-[.14em] text-bordo uppercase">
                livro da vez
              </span>
              <span className="block truncate font-display text-lg font-semibold italic lg:font-revista lg:font-normal">
                {escolhido.titulo}
              </span>
              <span className="block truncate text-xs text-cinza">{escolhido.autor}</span>
            </span>
          </div>
        ) : null}

        <fieldset>
          <legend className={rotuloCampo}>prazo da leitura</legend>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {prazos.map((p) => (
              <button
                key={p.d}
                type="button"
                aria-pressed={prazo === emDias(p.d)}
                onClick={() => setPrazo(emDias(p.d))}
                className={pilula(prazo === emDias(p.d))}
              >
                {p.r}
              </button>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="sr-only">data final da leitura</span>
            <input
              type="date"
              value={prazo}
              min={emDias(1)}
              onChange={(e) => setPrazo(e.target.value)}
              className={`${campo} max-w-[220px]`}
            />
          </label>
        </fieldset>
        {erro ? (
          <p role="alert" className="text-[13px] text-bordo">
            {erro}
          </p>
        ) : null}
      </div>
      <Rodape>
        <button
          type="button"
          onClick={() => comecar()}
          disabled={ocupado || !escolha}
          className={`${botaoPrincipal} lg:max-w-[460px]`}
        >
          {ocupado ? "começando…" : "começar leitura"}
        </button>
        {depoisDeEncerrar ? (
          <button type="button" onClick={() => router.push(`/clubes/${clube.id}`)} className={botaoContorno}>
            depois
          </button>
        ) : null}
      </Rodape>
    </div>
  );
}

export default function EscolherPage() {
  return (
    <Suspense>
      <Escolher />
    </Suspense>
  );
}
