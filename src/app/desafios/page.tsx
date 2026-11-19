"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ComConta, ErroOuFalta } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { Voltar } from "@/components/Voltar";
import { celebrar } from "@/lib/celebrar";
import {
  concluidosVistos,
  diasRestantes,
  entrarComCodigo,
  marcarConcluidos,
  meusDesafios,
  modelos,
  sincronizarMeuProgresso,
  unidade,
  type Desafio,
  type Participante,
} from "@/lib/desafios";
import { usePerfil } from "@/lib/perfil-store";
import { useConsulta, useMeuId } from "@/lib/social";

/** Os desafios de leitura: os meus (com o progresso de todo mundo) e os modelos para começar. */
function Lista() {
  const eu = useMeuId();
  const router = useRouter();
  const livros = usePerfil((s) => s.livros);
  const consulta = useConsulta(async () => {
    const r = await meusDesafios();
    // o meu progresso é calculado aqui e guardado no banco (os outros veem)
    const novos = await sincronizarMeuProgresso(
      r.desafios,
      r.participo,
      usePerfil.getState().livros,
      concluidosVistos(),
    ).catch(() => [] as Desafio[]);
    return { ...(await meusDesafios()), novos };
  }, [livros.length]);
  const [codigo, setCodigo] = useState("");
  // veio pelo link de convite: o código já chega preenchido
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("codigo");
    if (c) setCodigo(c.toUpperCase().slice(0, 6));
  }, []);
  const [erroCodigo, setErroCodigo] = useState<string | null>(null);

  // desafio que acabou de ser concluído: comemora (uma vez só)
  useEffect(() => {
    const d = consulta.dados?.novos?.[0];
    if (!d) return;
    marcarConcluidos(consulta.dados!.novos.map((x) => x.id));
    celebrar({
      tipo: "desafio",
      titulo: d.titulo,
      texto: "você completou o desafio ✦",
    });
  }, [consulta.dados]);

  async function entrar() {
    setErroCodigo(null);
    try {
      const id = await entrarComCodigo(codigo);
      if (!id)
        return setErroCodigo("esse código não existe ou o desafio já acabou.");
      router.push(`/desafios/${id}`);
    } catch {
      setErroCodigo(
        "não deu para entrar agora. rode o social.sql de novo no Supabase se o erro continuar.",
      );
    }
  }

  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const dados = consulta.dados;
  const ativos = (dados?.desafios ?? []).filter(
    (d) => diasRestantes(d.fim) >= 0,
  );
  const antigos = (dados?.desafios ?? []).filter(
    (d) => diasRestantes(d.fim) < 0,
  );

  const cartao = (d: Desafio) => {
    const ps = (dados?.participantes ?? []).filter(
      (p) => p.desafio_id === d.id,
    );
    const meu = ps.find((p) => p.usuario_id === eu);
    const pct = meu
      ? Math.min(100, Math.round(((meu.progresso ?? 0) / d.meta) * 100))
      : 0;
    const resta = diasRestantes(d.fim);
    const modelo = modelos.find((m) => m.id === d.modelo);
    return (
      <li key={d.id}>
        <Link
          href={`/desafios/${d.id}`}
          className="relative block rounded-[2px] border border-dashed border-linha bg-creme-quente p-4 hover:border-bordo lg:rounded-[4px] lg:p-5"
        >
          <p className="font-maquina text-[9px] tracking-[.12em] text-rosa-antigo uppercase">
            {modelo?.titulo ?? "desafio criado por você"}
          </p>
          <div className="mt-2 flex items-start gap-3">
            <span
              className="flex size-11 flex-none items-center justify-center rounded-full border text-xl"
              style={{
                borderColor: modelo?.cor ?? "#6B0D24",
                background: `${modelo?.cor ?? "#6B0D24"}14`,
              }}
            >
              {modelo?.emoji ?? "✦"}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-lg leading-tight font-semibold italic text-ameixa lg:font-revista lg:font-normal">
                {d.titulo}
              </span>
              <span className="mt-0.5 block text-xs text-cinza">
                {meu
                  ? `${(meu.progresso ?? 0).toLocaleString("pt-BR")} de ${d.meta.toLocaleString("pt-BR")} ${unidade[d.tipo][1]}`
                  : "você ainda não entrou"}
                {resta >= 0
                  ? ` · ${resta === 0 ? "último dia" : `faltam ${resta} ${resta === 1 ? "dia" : "dias"}`}`
                  : " · encerrado"}
              </span>
            </span>
            {meu?.concluido_em ? (
              <span
                aria-hidden
                className="font-maquina flex size-9 flex-none rotate-[8deg] items-center justify-center rounded-full border border-dashed border-ouro text-center text-[7px] leading-tight text-ouro"
              >
                feito
              </span>
            ) : null}
          </div>
          <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-linha/70">
            <span
              className="block h-full rounded-full bg-bordo transition-all"
              style={{ width: `${pct}%` }}
            />
          </span>
          {ps.length > 1 ? (
            <span className="mt-3 flex items-center gap-2">
              <span className="flex -space-x-2">
                {ps.slice(0, 5).map((p: Participante) => (
                  <span
                    key={p.usuario_id}
                    className="rounded-full ring-2 ring-creme-quente"
                  >
                    <Avatar
                      pessoa={
                        p.pessoa ?? {
                          id: p.usuario_id,
                          usuario: null,
                          nome: "?",
                          foto: null,
                        }
                      }
                      tamanho={22}
                    />
                  </span>
                ))}
              </span>
              <span className="text-[11px] text-cinza">
                {ps.length} {ps.length === 1 ? "pessoa" : "pessoas"}
              </span>
            </span>
          ) : null}
        </Link>
      </li>
    );
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="border-b border-linha pb-2 font-display text-[22px] leading-none font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
          meus desafios
        </h2>
        {consulta.carregando && !dados ? (
          <p className="mt-4 font-accent text-sm italic text-cinza">abrindo…</p>
        ) : ativos.length ? (
          <ul className="mt-4 grid gap-3 lg:grid-cols-2">
            {ativos.map(cartao)}
          </ul>
        ) : (
          <p className="mt-4 font-accent text-[15px] italic text-cinza">
            nenhum desafio rolando. escolha um aqui embaixo ✦
          </p>
        )}
      </section>

      <section>
        <h2 className="border-b border-linha pb-2 font-display text-[22px] leading-none font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
          começar um desafio
        </h2>
        <ul className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {modelos.map((m) => (
            <li key={m.id}>
              <Link
                href={`/desafios/novo?modelo=${m.id}`}
                className="flex h-full flex-col rounded-[2px] border border-dashed bg-creme-quente p-4 transition-transform hover:-translate-y-0.5 lg:rounded-[4px] lg:p-5"
                style={{ borderColor: `${m.cor}66` }}
              >
                <span
                  className="flex size-10 flex-none items-center justify-center rounded-full border text-lg"
                  style={{ borderColor: m.cor, background: `${m.cor}14` }}
                >
                  {m.emoji}
                </span>
                <span
                  className="font-maquina mt-3 block text-[9px] tracking-[.12em] uppercase"
                  style={{ color: m.cor }}
                >
                  desafio
                </span>
                <span className="mt-1 block font-display text-[17px] leading-tight font-semibold italic text-ameixa lg:font-revista lg:text-xl lg:font-normal">
                  {m.titulo}
                </span>
                <span className="mt-1.5 block text-[12px] leading-snug text-cinza">
                  {m.descricao}
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/desafios/novo"
              className="flex h-full min-h-[140px] flex-col items-center justify-center rounded-[2px] border-[1.5px] border-dashed border-bordo/40 bg-creme-quente p-4 text-center text-bordo hover:border-bordo lg:rounded-[4px]"
            >
              <span className="text-2xl">＋</span>
              <span className="mt-1 font-display text-[17px] font-semibold italic lg:font-revista lg:font-normal">
                criar o meu
              </span>
              <span className="mt-1 text-[12px] text-cinza">
                você escolhe a meta e o prazo
              </span>
            </Link>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="border-b border-linha pb-2 font-display text-[22px] leading-none font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
          recebeu um convite?
        </h2>
        <div className="mt-4 flex max-w-[420px] gap-2">
          <input
            value={codigo}
            onChange={(e) =>
              setCodigo(e.target.value.toUpperCase().slice(0, 6))
            }
            placeholder="código do desafio"
            className="h-12 min-w-0 flex-1 rounded-[12px] border border-bege bg-creme-quente px-4 font-mono text-lg tracking-[.2em] uppercase outline-none focus:border-bordo lg:rounded-[4px]"
          />
          <button
            type="button"
            onClick={entrar}
            disabled={codigo.length < 6}
            className="h-12 rounded-pill bg-bordo px-6 text-sm font-semibold text-creme disabled:opacity-45"
          >
            entrar
          </button>
        </div>
        {erroCodigo ? (
          <p className="mt-2 text-[13px] text-bordo">{erroCodigo}</p>
        ) : null}
      </section>

      {antigos.length ? (
        <section>
          <h2 className="border-b border-linha pb-2 font-display text-[22px] leading-none font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
            encerrados
          </h2>
          <ul className="mt-4 grid gap-3 opacity-80 lg:grid-cols-2">
            {antigos.map(cartao)}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export default function DesafiosPage() {
  return (
    <AppShell aba="perfil">
      <div className="flex flex-1 flex-col px-6 pt-2 pb-10 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="mx-auto w-full max-w-[1000px]">
          <Voltar
            padrao="/numeros"
            rotulo="jornada"
            className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo"
          />
          <h1 className="mt-1 font-display text-[32px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[44px] lg:font-normal lg:text-tinta">
            desafios de leitura
          </h1>
          <p className="mt-1.5 mb-8 font-accent text-sm italic text-cinza">
            sozinha, com amigos ou com o clube. o progresso conta sozinho ✦
          </p>
          <ComConta>
            <Lista />
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
