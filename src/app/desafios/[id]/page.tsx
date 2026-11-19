"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
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

  const raio = 64;
  const volta = 2 * Math.PI * raio;

  return (
    <div>
      {/* topo */}
      <div
        className="inverso rounded-xl p-6 text-creme lg:rounded-[6px] lg:p-8"
        style={{
          background: `linear-gradient(150deg, ${modelo?.cor ?? "#6B0D24"}, #2b1420)`,
        }}
      >
        <p className="text-[10px] font-semibold tracking-[.2em] text-rosa-claro uppercase">
          {modelo?.emoji ?? "✦"} desafio · {dataCurta(d.inicio)} a{" "}
          {dataCurta(d.fim)}
        </p>
        <h1 className="mt-2 font-display text-[30px] leading-[1.05] font-semibold italic lg:font-revista lg:text-[40px] lg:font-normal">
          {d.titulo}
        </h1>
        <div className="mt-6 flex items-center gap-6">
          <div className="relative size-[150px] flex-none">
            <svg
              viewBox="0 0 150 150"
              className="absolute inset-0 -rotate-90"
              aria-hidden
            >
              <circle
                cx="75"
                cy="75"
                r={raio}
                fill="none"
                stroke="rgba(249,245,238,.18)"
                strokeWidth="10"
              />
              <circle
                cx="75"
                cy="75"
                r={raio}
                fill="none"
                stroke={pct >= 1 ? "#C9A46A" : "#F2C9D2"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={volta}
                strokeDashoffset={volta * (1 - pct)}
                style={{ transition: "stroke-dashoffset .8s ease" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-revista text-[34px] leading-none">
                {meu.progresso.toLocaleString("pt-BR")}
              </span>
              <span className="mt-1 text-[11px] text-rosa-claro">
                de {d.meta.toLocaleString("pt-BR")}
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-revista text-xl italic">
              {pct >= 1
                ? "desafio completo 🏆"
                : `faltam ${(d.meta - meu.progresso).toLocaleString("pt-BR")} ${unidade[d.tipo][d.meta - meu.progresso === 1 ? 0 : 1]}`}
            </p>
            <p className="mt-1 text-[13px] text-rosa-claro">
              {resta > 0
                ? `${resta} ${resta === 1 ? "dia" : "dias"} pela frente`
                : resta === 0
                  ? "último dia!"
                  : "o desafio acabou"}
            </p>
            {!participo ? (
              <button
                type="button"
                onClick={async () => {
                  await entrarNoDesafio(d.id);
                  consulta.recarregar();
                }}
                className="mt-4 h-11 rounded-pill bg-creme px-6 text-sm font-semibold text-bordo"
              >
                entrar no desafio
              </button>
            ) : null}
          </div>
        </div>
      </div>

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
                      {p.concluido_em ? " 🏆" : ""}
                    </b>
                    <span className="flex-none text-xs text-cinza">
                      {(p.progresso ?? 0).toLocaleString("pt-BR")}/
                      {d.meta.toLocaleString("pt-BR")}
                    </span>
                  </span>
                  <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-linha/70">
                    <span
                      className="block h-full rounded-full bg-bordo"
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
