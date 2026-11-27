"use client";

import { useState } from "react";
import { useClube } from "@/components/clube/ClubeContexto";
import { EmblemaLiga, Insignia, posicaoTexto } from "@/components/liga/Pecas";
import { Avatar } from "@/components/social/Pessoas";
import { fichasComAntigas, fichasDoClube, livrosDoClube, progressoDoClube, virgula } from "@/lib/clubes";
import { CATEGORIAS, DISTINCOES, classificacao, distincoes, periodoAno, periodoGeral, periodoMes, periodosComDados, type Categoria, type Dados, type Periodo } from "@/lib/liga";
import { estantesDe, nomeDe, useConsulta, useMeuId } from "@/lib/social";
import type { LivroSalvo } from "@/lib/perfil-store";

const num = (n: number) => n.toLocaleString("pt-BR");

/**
 * the reading league. dentro de membros: dois controles (categoria e período),
 * a classificação e os destaques logo abaixo. Categorias individuais usam a
 * estante pública de cada pessoa; as do clube, só o que aconteceu aqui.
 */
export function LigaDoClube() {
  const { clube, membros, identidade } = useClube();
  const eu = useMeuId();
  const hoje = new Date();
  const [cat, setCat] = useState<Categoria>("paginas");
  const [periodoId, setPeriodoId] = useState("ano");
  const [metodo, setMetodo] = useState(false);
  const [todos, setTodos] = useState(false);

  const consulta = useConsulta(async () => {
    const livros = await livrosDoClube(clube.id);
    const ids = livros.filter((l) => l.estado !== "sugerido").map((l) => l.id);
    const [reais, progresso, pessoais] = await Promise.all([
      fichasDoClube(ids),
      progressoDoClube(ids).catch(() => []),
      estantesDe(membros.map((m) => m.usuario_id)).catch(() => new Map<string, LivroSalvo[] | null>()),
    ]);
    return { livros, reais, progresso, pessoais };
  }, [clube.id, membros.length]);

  if (identidade?.semRanking) return null;

  const cabecalho = (
    <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-linha pb-2">
      <h2 id="t-liga" className="flex items-center gap-2 font-revista text-[22px] leading-none text-ameixa">
        liga dos leitores.
        <span className="text-bordo">
          <EmblemaLiga tamanho={18} />
        </span>
      </h2>
    </div>
  );
  if (!consulta.dados)
    return (
      <section aria-labelledby="t-liga">
        {cabecalho}
        <p className="text-[13px] text-cinza">{consulta.erro ? "não foi possível calcular a classificação agora." : "calculando a classificação…"}</p>
      </section>
    );

  const { livros, reais, progresso, pessoais } = consulta.dados;
  const fichas = livros.filter((l) => l.estado !== "sugerido").flatMap((l) => fichasComAntigas(l, reais.filter((f) => f.clube_livro_id === l.id), membros));
  const d: Dados = { membros, livros, fichas, progresso, pessoais };

  const datas = [
    ...livros.map((l) => l.encerrado_em ?? ""),
    ...[...pessoais.values()].flatMap((ls) => (ls ?? []).filter((l) => l.status === "lido" && l.lidoEm).map((l) => l.lidoEm!)),
  ];
  const anteriores = periodosComDados(datas, hoje);
  const esteMes = periodoMes(hoje.getFullYear(), hoje.getMonth(), hoje);
  const esteAno = periodoAno(hoje.getFullYear(), hoje);
  const outros: Periodo[] = [...anteriores.meses.filter((p) => p.id !== esteMes.id).slice(0, 12), ...anteriores.anos.filter((p) => p.id !== esteAno.id)];
  const periodo = periodoId === "mes" ? esteMes : periodoId === "ano" ? esteAno : periodoId === "geral" ? periodoGeral : (outros.find((p) => p.id === periodoId) ?? esteAno);

  const info = CATEGORIAS.find((c) => c.id === cat)!;
  const linhas = classificacao(d, cat, periodo);
  const comValor = linhas.filter((l) => l.valor !== null && l.valor > 0);
  const mostrados = todos ? comValor : comValor.slice(0, 5);
  const maior = Math.max(1, ...comValor.map((l) => l.valor ?? 0));
  const minha = comValor.find((l) => l.m.usuario_id === eu);
  const nome = (id: string) => (id === eu ? "você" : nomeDe(membros.find((m) => m.usuario_id === id)?.pessoa));
  const destaques = distincoes(d, periodo);
  const semGenero = cat === "generos" && !comValor.length;

  const select = "h-11 w-full appearance-none rounded-[6px] border border-linha bg-transparent pr-8 pl-3 text-[14px] text-ameixa outline-none focus:border-bordo sm:h-10";
  const seta = <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-cinza">▾</span>;

  return (
    <>
      <section aria-labelledby="t-liga">
        {cabecalho}
        <div className="flex gap-2">
          <label className="relative min-w-0 flex-[3]">
            <span className="sr-only">Categoria</span>
            <select value={cat} onChange={(e) => setCat(e.target.value as Categoria)} className={`${select} font-semibold`}>
              <optgroup label="Trajetória de cada um">
                {CATEGORIAS.filter((c) => c.escopo === "individual").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Neste clube">
                {CATEGORIAS.filter((c) => c.escopo === "clube").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </optgroup>
            </select>
            {seta}
          </label>
          <label className="relative min-w-0 flex-[2]">
            <span className="sr-only">Período</span>
            <select value={periodoId} onChange={(e) => setPeriodoId(e.target.value)} className={select}>
              <option value="mes">Este mês</option>
              <option value="ano">Este ano</option>
              <option value="geral">Histórico</option>
              {outros.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            {seta}
          </label>
        </div>
        <p className="mt-2 text-[12px] text-cinza">
          {info.escopo === "clube" ? "só neste clube" : "todas as leituras de cada pessoa"} · {periodo.id === "geral" ? "histórico" : periodo.nome}
          {!periodo.encerrado && periodo.id !== "geral" ? " · em andamento" : ""}
        </p>

        {comValor.length ? (
          <ol className="mt-2">
            {mostrados.map((l) => {
              const lider = l.posicao === 1 && !l.provisorio;
              return (
                <li key={l.m.usuario_id} className={`grid grid-cols-[30px_32px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-linha py-2 ${l.m.usuario_id === eu ? "bg-rosa-fundo/60" : ""}`}>
                  <span aria-label={`${l.posicao}º lugar`} className={`text-center tabular-nums ${lider ? "font-revista text-[19px] text-bordo" : "text-[13px] text-tinta-suave"}`}>
                    {posicaoTexto(l.posicao)}
                  </span>
                  <Avatar pessoa={l.m.pessoa} tamanho={32} />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-semibold text-ameixa">{nome(l.m.usuario_id)}</span>
                      {l.provisorio ? <span className="flex-none rounded-[3px] border border-linha px-1 text-[10px] text-cinza">provisório</span> : null}
                    </span>
                    {l.detalhe ? <span className="block truncate text-[11px] text-cinza">{l.detalhe}</span> : null}
                    {cat !== "indicacoes" && comValor.length > 1 ? (
                      <span aria-hidden className="mt-1 block h-[3px] overflow-hidden rounded-full bg-linha">
                        <span className="block h-full rounded-full bg-bordo/70" style={{ width: `${((l.valor ?? 0) / maior) * 100}%` }} />
                      </span>
                    ) : null}
                  </span>
                  <span className="text-right">
                    <span className="block text-[15px] font-semibold text-ameixa tabular-nums">{cat === "indicacoes" ? virgula(l.valor!) : num(l.valor!)}</span>
                    <span className="block text-[11px] text-cinza">{info.unidade(l.valor!)}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-3 rounded-[6px] border border-dashed border-bege px-4 py-4 text-[13px] text-tinta-suave">
            {semGenero ? "Os livros ainda não têm gênero informado para esta categoria." : "A classificação ficará disponível conforme as leituras forem registradas neste período."}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-4">
          {comValor.length > 5 ? (
            <button type="button" onClick={() => setTodos((v) => !v)} className="min-h-10 text-[13px] font-semibold text-bordo">
              {todos ? "ver menos" : `ver todos (${comValor.length})`}
            </button>
          ) : null}
          {minha && !mostrados.includes(minha) ? <span className="text-[12px] text-cinza">Sua posição: {minha.posicao}º</span> : null}
          <button type="button" aria-expanded={metodo} onClick={() => setMetodo((v) => !v)} className="min-h-10 text-[13px] font-semibold text-tinta-suave hover:text-bordo">
            {metodo ? "fechar" : "Como calculamos"}
          </button>
        </div>
        {metodo ? <p className="max-w-[60ch] border-l-2 border-linha pl-3 text-[12px] leading-relaxed text-tinta-suave">{info.metodo}</p> : null}
      </section>

      <section aria-labelledby="t-destaques">
        <div className="mb-3 border-b border-linha pb-2">
          <h2 id="t-destaques" className="font-revista text-[22px] leading-none text-ameixa">
            Destaques e distinções
          </h2>
        </div>
        <p className="mb-3 text-[12px] text-cinza">
          {periodo.id === "geral" ? "histórico" : periodo.nome} · {periodo.encerrado ? "distinções conquistadas" : "destaques atuais"}
        </p>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
          {DISTINCOES.map((x) => {
            const ganhou = destaques.find((y) => y.id === x.id);
            if (!ganhou) return null;
            return (
              <li key={x.id} className="flex items-center gap-2.5">
                <Insignia tipo={x.id} tamanho={40} />
                <span className="min-w-0">
                  <span className="block font-revista text-[15px] leading-tight text-ameixa">{x.nome}</span>
                  <span className="block truncate text-[12px] text-tinta-suave">{ganhou.vencedores.map((v) => nome(v.m.usuario_id)).join(", ")}</span>
                  <span className="block text-[10px] text-cinza">{x.descricao}</span>
                </span>
              </li>
            );
          })}
        </ul>
        {!destaques.length ? <p className="text-[13px] text-cinza">Ainda sem destaques neste período.</p> : null}
      </section>
    </>
  );
}
