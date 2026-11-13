"use client";

import Link from "next/link";
import { CapaLivro } from "@/components/CapaLivro";
import { useClube } from "@/components/clube/ClubeContexto";
import { Avatares, botaoPrincipal, Rodape, TopoForm } from "@/components/clube/Pecas";
import { Carregando, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { apagarSugestao, livrosDoClube, votar, type LivroDoClube } from "@/lib/clubes";
import { corDoLivro } from "@/lib/cores";
import { nomeDe, useConsulta, useMeuId } from "@/lib/social";

export default function SugestoesPage() {
  const { clube, membros, papel } = useClube();
  const eu = useMeuId();
  const consulta = useConsulta(async () => (await livrosDoClube(clube.id)).filter((l) => l.estado === "sugerido"), [clube.id]);

  async function alternarVoto(l: LivroDoClube) {
    if (!eu || !consulta.dados) return;
    const antes = consulta.dados;
    const sim = !l.votos.some((v) => v.usuario_id === eu);
    consulta.definir(
      antes.map((x) =>
        x.id === l.id ? { ...x, votos: sim ? [...x.votos, { usuario_id: eu }] : x.votos.filter((v) => v.usuario_id !== eu) } : x,
      ),
    );
    try {
      await votar(l.id, sim);
    } catch {
      consulta.definir(antes);
    }
  }

  async function tirar(l: LivroDoClube) {
    if (!confirm(`tirar ${l.livro.titulo} das sugestões?`)) return;
    await apagarSugestao(l.id);
    consulta.recarregar();
  }

  const lista = [...(consulta.dados ?? [])].sort((a, b) => b.votos.length - a.votos.length);
  const pessoa = (id: string) => membros.find((m) => m.usuario_id === id)?.pessoa ?? null;

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <TopoForm
        voltar={{ href: `/clubes/${clube.id}/biblioteca`, r: "livros" }}
        rotulo={clube.nome}
        titulo="sugestões"
        frase={
          consulta.dados
            ? `${lista.length} ${lista.length === 1 ? "livro esperando" : "livros esperando"} a vez · votação aberta ✦`
            : undefined
        }
      />
      <div className="mt-6 px-6 lg:max-w-[720px] lg:px-0">
        {consulta.carregando && !consulta.dados ? (
          <Carregando texto="trazendo as sugestões…" linhas={2} />
        ) : consulta.erro ? (
          <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />
        ) : lista.length ? (
          <ul className="space-y-3">
            {lista.map((l) => {
              const votei = l.votos.some((v) => v.usuario_id === eu);
              const quem = l.sugerido_por ? pessoa(l.sugerido_por) : null;
              return (
                <li key={l.id} className="flex gap-3.5 rounded-xl border border-linha bg-creme-quente p-3.5 lg:rounded-[4px] lg:border-fio lg:bg-transparent">
                  <CapaLivro titulo={l.livro.titulo} capa={l.livro.capa} cor={corDoLivro(l.livro.id)} className="w-[64px] self-start [&>span:last-child]:hidden" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold tracking-[.14em] text-rosa-antigo uppercase">
                      sugerido {l.sugerido_por === eu ? "por você" : `pela ${nomeDe(quem)}`}
                    </p>
                    <h2 className="mt-1 font-display text-lg leading-tight font-semibold italic text-ameixa lg:font-revista lg:font-normal">{l.livro.titulo}</h2>
                    <p className="text-xs text-cinza">{l.livro.autor}</p>
                    {l.motivo ? <p className="mt-1.5 font-accent text-[13px] italic text-cinza">“{l.motivo}”</p> : null}
                    {l.livro.clima?.length ? (
                      <p className="mt-1.5 flex flex-wrap gap-1">
                        {l.livro.clima.map((c) => (
                          <span key={c} className="rounded-pill bg-rosa-fundo px-2 py-0.5 text-[10px] font-semibold text-bordo">
                            {c}
                          </span>
                        ))}
                      </p>
                    ) : null}
                    <div className="mt-2.5 flex items-center gap-2">
                      <Avatares pessoas={l.votos.map((v) => pessoa(v.usuario_id)).filter((p) => p !== null)} tamanho={22} />
                      <span className="text-[10px] font-semibold tracking-[.1em] text-cinza uppercase">
                        {l.votos.length} {l.votos.length === 1 ? "voto" : "votos"}
                      </span>
                      <button
                        type="button"
                        aria-pressed={votei}
                        onClick={() => alternarVoto(l)}
                        className={`ml-auto flex min-h-9 items-center rounded-pill px-3.5 text-xs font-semibold ${
                          votei ? "bg-bordo text-creme" : "border border-bordo text-bordo"
                        }`}
                      >
                        {votei ? "votei ♥" : "votar ♡"}
                      </button>
                    </div>
                    {papel === "moderadora" || l.sugerido_por === eu ? (
                      <button type="button" onClick={() => tirar(l)} className="mt-1 min-h-8 text-[11px] text-cinza underline underline-offset-2 hover:text-bordo">
                        tirar da lista
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Vazio titulo="ninguém sugeriu nada ainda" texto="seja a primeira a sugerir o próximo livro do clube." />
        )}
        <div className="mt-6 rounded-md border border-linha px-4 py-3 lg:border-fio">
          <p className="text-[10px] font-semibold tracking-[.16em] text-bordo uppercase">como funciona</p>
          <p className="mt-1 text-[13px] text-cinza">
            cada pessoa sugere livros e vota nos que quer ler. quem modera escolhe a mais votada (ou sorteia) e ela vira a{" "}
            <Link href={`/clubes/${clube.id}/leitura`} className="underline underline-offset-2">
              leitura da vez
            </Link>
            .
          </p>
        </div>
      </div>
      <Rodape>
        <Link href={`/clubes/${clube.id}/sugerir`} className={`${botaoPrincipal} lg:max-w-[720px]`}>
          + sugerir um livro
        </Link>
      </Rodape>
    </div>
  );
}
