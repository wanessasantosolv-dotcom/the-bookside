"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import Link from "next/link";
import { Selo } from "@/components/desafios/Selo";
import { CapaDoLivro, PrateleiraMadeira } from "@/components/estantes/Biblioteca";
import { ComConta, ErroOuFalta } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { Voltar } from "@/components/Voltar";
import { celebrar } from "@/lib/celebrar";
import {
  apagarDesafio,
  calcularProgresso,
  casasDoBingo,
  concluidosVistos,
  diasRestantes,
  entrarNoDesafio,
  marcarConcluidos,
  meusDesafios,
  modelos,
  sairDoDesafio,
  sincronizarMeuProgresso,
  unidade,
} from "@/lib/desafios";
import { usePerfil } from "@/lib/perfil-store";
import { nomeDe, useConsulta, useMeuId } from "@/lib/social";

const dataCurta = (d: string) =>
  new Date(`${d}T12:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
  });

function Detalhe() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const eu = useMeuId();
  const livros = usePerfil((s) => s.livros);
  const [copiado, setCopiado] = useState(false);
  const consulta = useConsulta(async () => {
    const r = await meusDesafios();
    const novos = await sincronizarMeuProgresso(
      r.desafios.filter((d) => d.id === id),
      r.participo,
      usePerfil.getState().livros,
      concluidosVistos(),
    ).catch(() => []);
    return { ...(await meusDesafios()), novos };
  }, [id, livros.length]);

  useEffect(() => {
    const d = consulta.dados?.novos?.[0];
    if (!d) return;
    marcarConcluidos([d.id]);
    celebrar({
      tipo: "desafio",
      titulo: d.titulo,
      texto: "você completou o desafio ✦",
    });
  }, [consulta.dados]);

  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  if (!consulta.dados)
    return <p className="font-accent text-sm italic text-cinza">abrindo…</p>;
  const d = consulta.dados.desafios.find((x) => x.id === id);
  if (!d)
    return (
      <p className="font-accent text-[15px] italic text-cinza">
        esse desafio não existe mais ou você não tem acesso a ele.
      </p>
    );
  const modelo = modelos.find((m) => m.id === d.modelo);
  const ps = consulta.dados.participantes
    .filter((p) => p.desafio_id === d.id)
    .sort((a, b) => (b.progresso ?? 0) - (a.progresso ?? 0));
  const participo = consulta.dados.participo.has(d.id);
  const meu = calcularProgresso(d, livros);
  const pct = Math.min(1, meu.progresso / d.meta);
  const resta = diasRestantes(d.fim);
  const link =
    typeof window !== "undefined" && d.codigo
      ? `${window.location.origin}/desafios?codigo=${d.codigo}`
      : "";

  async function convidar() {
    const texto = `bora fazer o desafio "${d!.titulo}" comigo no the bookside? o código é ${d!.codigo}`;
    try {
      if (navigator.share)
        await navigator.share({ title: d!.titulo, text: texto, url: link });
      else {
        await navigator.clipboard.writeText(`${texto}\n${link}`);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }
    } catch {
      /* cancelou */
    }
  }


  return (
    <div>
      {/* topo: o selo, o nome e o meu progresso, no papel */}
      <div className="grid gap-6 rounded-[10px] bg-creme-quente px-5 py-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-8 lg:px-8 lg:py-8">
        <span className="flex justify-center sm:justify-start">
          <Selo
            tipo={d.tipo}
            numero={d.meta}
            rotulo={modelo?.titulo ?? (d.clube_id ? "clube" : "desafio")}
            cor={modelo?.cor}
            tamanho={120}
            girar={-2}
            estado={pct >= 1 ? "concluido" : resta < 0 ? "encerrado" : "andamento"}
            data={pct >= 1 ? String(new Date().getFullYear()) : undefined}
          />
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap gap-1.5 text-[11px] text-tinta-suave">
            <span className="rounded-full border border-linha px-2.5 py-0.5">{d.clube_id ? "do clube" : ps.length > 1 ? "com amigas" : "pessoal"}</span>
            <span className="rounded-full border border-linha px-2.5 py-0.5">
              {dataCurta(d.inicio)} a {dataCurta(d.fim)}
            </span>
            <span className="rounded-full border border-linha px-2.5 py-0.5">
              {pct >= 1 ? "concluído" : resta < 0 ? "encerrado" : resta === 0 ? "último dia" : `${resta} ${resta === 1 ? "dia" : "dias"} pela frente`}
            </span>
          </p>
          <h1 className="mt-2 font-revista text-[30px] leading-[1.05] text-ameixa lg:text-[40px]">{d.titulo}</h1>
          {modelo?.descricao ? <p className="mt-1.5 text-[14px] text-tinta-suave">{modelo.descricao}</p> : null}
          <div className="mt-5">
            <p className="flex flex-wrap items-baseline gap-x-3">
              <span className="font-revista text-[34px] leading-none text-bordo tabular-nums">{meu.progresso.toLocaleString("pt-BR")}</span>
              <span className="text-[14px] text-tinta-suave">
                de {d.meta.toLocaleString("pt-BR")} {unidade[d.tipo][1]} · {Math.round(pct * 100)}%
              </span>
            </p>
            <span className="mt-2 block h-[6px] max-w-[560px] rounded-full bg-meta-suave" aria-hidden>
              <span className="block h-full rounded-full bg-meta-tinta transition-[width] duration-700" style={{ width: `${Math.max(2, pct * 100)}%` }} />
            </span>
            <p className="mt-2 text-[13px] text-cinza">
              {pct >= 1
                ? "meta alcançada ✦"
                : `faltam ${(d.meta - meu.progresso).toLocaleString("pt-BR")} ${unidade[d.tipo][d.meta - meu.progresso === 1 ? 0 : 1]}`}
            </p>
          </div>
          {!participo ? (
            <button
              type="button"
              onClick={async () => {
                await entrarNoDesafio(d.id);
                consulta.recarregar();
              }}
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-bordo px-6 text-sm font-semibold text-creme"
            >
              entrar no desafio
            </button>
          ) : null}
        </div>
      </div>

      {/* como conta: as regras de verdade do cálculo, por tipo */}
      <section className="mt-8" aria-labelledby="t-regras">
        <h2 id="t-regras" className="border-b border-linha pb-2 font-revista text-[22px] text-bordo italic">
          como conta
        </h2>
        <ul className="mt-3 space-y-1.5 text-[14px] text-tinta-suave">
          <li>período: de {dataCurta(d.inicio)} a {dataCurta(d.fim)}, pela data em que você marcou cada leitura.</li>
          {d.tipo === "livros" ? <li>vale cada livro marcado como lido dentro do período.</li> : null}
          {d.tipo === "paginas" ? (
            <li>vale o total de páginas dos livros terminados no período, mais as páginas lidas no modo foco em livros ainda não terminados.</li>
          ) : null}
          {d.tipo === "pilha" ? <li>vale cada livro terminado no período que já estava na sua estante antes do início do desafio.</li> : null}
          {d.tipo === "minutos" ? <li>vale o tempo das sessões no modo foco dentro do período.</li> : null}
          {d.tipo === "dias" ? <li>vale cada dia diferente em que você leu no modo foco dentro do período.</li> : null}
          {d.tipo === "bingo" ? <li>cada casa se marca sozinha quando um livro terminado no período atende a ela.</li> : null}
          {ps.length > 1 ? <li>cada pessoa tem a sua própria meta; o progresso de uma não soma no da outra.</li> : null}
        </ul>
      </section>

      {/* os livros que contaram (só nos tipos que contam livros) */}
      {["livros", "paginas", "pilha", "bingo"].includes(d.tipo)
        ? (() => {
            const contaram = livros.filter(
              (l) =>
                l.status === "lido" &&
                l.lidoEm &&
                l.lidoEm.slice(0, 10) >= d.inicio &&
                l.lidoEm.slice(0, 10) <= d.fim &&
                (d.tipo !== "pilha" || (l.adicionadoEm && l.adicionadoEm.slice(0, 10) < d.inicio)),
            );
            if (!contaram.length) return null;
            return (
              <section className="mt-8" aria-labelledby="t-contaram">
                <h2 id="t-contaram" className="border-b border-linha pb-2 font-revista text-[22px] text-bordo italic">
                  livros que contaram
                </h2>
                <div className="mt-3">
                  <div className="flex items-end gap-3 overflow-x-auto px-3 pt-2 [scrollbar-width:none]">
                    {contaram.map((l) => (
                      <Link key={l.id} href={`/livro/${l.id}`} title={`${l.titulo}${d.tipo === "paginas" && l.paginas ? ` · ${l.paginas} págs.` : ""}`} className="flex-none transition-transform hover:-translate-y-1">
                        <CapaDoLivro livro={l} altura={110} />
                      </Link>
                    ))}
                  </div>
                  <PrateleiraMadeira className="-mt-[5px]" />
                </div>
              </section>
            );
          })()
        : null}

      {/* o bingo */}
      {d.tipo === "bingo" ? (
        <section className="mt-8">
          <h2 className="font-display text-[22px] font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
            sua cartela
          </h2>
          <ul className="mt-3 grid max-w-[520px] grid-cols-3 gap-2">
            {casasDoBingo.map((c) => {
              const ok = meu.bingo?.includes(c.id);
              return (
                <li
                  key={c.id}
                  className={`flex aspect-square flex-col items-center justify-center rounded-[12px] border p-2 text-center text-[12px] leading-tight font-semibold transition-colors ${
                    ok
                      ? "border-bordo bg-bordo text-creme"
                      : "border-linha bg-creme-quente text-ameixa"
                  }`}
                >
                  <span className="text-lg">{ok ? "✓" : "○"}</span>
                  <span className="mt-1">{c.texto}</span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-cinza">
            vale qualquer livro terminado entre {dataCurta(d.inicio)} e{" "}
            {dataCurta(d.fim)}.
          </p>
        </section>
      ) : null}

      {/* quem está no desafio */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between border-b border-linha pb-2">
          <h2 className="font-display text-[22px] font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
            {ps.length > 1 ? "o ranking" : "quem está no desafio"}
          </h2>
          {d.codigo && participo ? (
            <button
              type="button"
              onClick={convidar}
              className="text-[11px] font-bold tracking-[.1em] text-bordo uppercase"
            >
              {copiado ? "convite copiado ✓" : "convidar →"}
            </button>
          ) : null}
        </div>
        <ol className="mt-3 space-y-3">
          {ps.map((p, i) => {
            const pp = Math.min(100, Math.round(((p.progresso ?? 0) / d.meta) * 100));
            return (
              <li key={p.usuario_id} className="flex items-center gap-3">
                <span className="w-5 text-center font-revista text-lg text-bordo italic">
                  {i + 1}
                </span>
                <Avatar
                  pessoa={
                    p.pessoa ?? {
                      id: p.usuario_id,
                      usuario: null,
                      nome: "?",
                      foto: null,
                    }
                  }
                  tamanho={36}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2 text-sm">
                    <b className="truncate font-semibold">
                      {p.usuario_id === eu ? "você" : nomeDe(p.pessoa)}
                      {p.concluido_em ? " · concluiu ✦" : ""}
                    </b>
                    <span className="flex-none text-xs text-cinza">
                      {(p.progresso ?? 0).toLocaleString("pt-BR")}/
                      {d.meta.toLocaleString("pt-BR")}
                    </span>
                  </span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-meta-suave">
                    <span
                      className="block h-full rounded-full bg-meta-tinta"
                      style={{ width: `${pp}%` }}
                    />
                  </span>
                </span>
              </li>
            );
          })}
        </ol>
        {d.codigo && participo ? (
          <p className="mt-4 text-xs text-cinza">
            código de convite:{" "}
            <b className="font-mono text-sm tracking-[.2em] text-ameixa">
              {d.codigo}
            </b>
          </p>
        ) : null}
      </section>

      {participo ? (
        <div className="mt-10 flex flex-wrap gap-4 text-xs">
          <button
            type="button"
            onClick={async () => {
              if (!confirm("sair deste desafio?")) return;
              await sairDoDesafio(d.id);
              router.push("/desafios");
            }}
            className="min-h-9 font-semibold text-cinza underline underline-offset-4"
          >
            sair do desafio
          </button>
          {d.criado_por === eu ? (
            <button
              type="button"
              onClick={async () => {
                if (!confirm("apagar o desafio para todo mundo?")) return;
                await apagarDesafio(d.id);
                router.push("/desafios");
              }}
              className="min-h-9 font-semibold text-bordo underline underline-offset-4"
            >
              apagar o desafio
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default function DesafioPage() {
  return (
    <AppShell aba="perfil">
      <div className="flex flex-1 flex-col px-6 pt-2 pb-10 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="w-full max-w-[760px]">
          <Voltar
            padrao="/desafios"
            rotulo="desafios"
            className="-ml-2 mb-3 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo"
          />
          <ComConta>
            <Detalhe />
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
