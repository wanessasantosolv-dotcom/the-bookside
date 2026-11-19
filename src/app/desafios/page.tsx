"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
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

/** Os ícones de cada modelo de desafio — traço fino, sem emoji, no estilo dos ícones do app. */
const iconesModelo: Record<string, ReactNode> = {
  maratona: (
    <path d="M4 6c3-1.5 6-1.5 8 0v12c-2-1.5-5-1.5-8 0V6ZM20 6c-3-1.5-6-1.5-8 0v12c2-1.5 5-1.5 8 0V6Z" />
  ),
  "um-por-semana": (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
      <circle cx="15" cy="15" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  "zerar-pilha": (
    <>
      <rect x="4" y="15.3" width="16" height="3.4" rx="1" />
      <rect x="5.4" y="10.8" width="13.2" height="3.4" rx="1" />
      <rect x="4" y="6.3" width="16" height="3.4" rx="1" />
    </>
  ),
  bingo: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16" />
    </>
  ),
  habito: (
    <path d="M6.5 3h11M6.5 21h11M7 3c0 4.5 4 5.8 5 7 1-1.2 5-2.5 5-7M7 21c0-4.5 4-5.8 5-7 1 1.2 5 2.5 5 7" />
  ),
  "dez-horas": (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
};

function IconeModelo({ id, className }: { id?: string; className?: string }) {
  if (!id || !iconesModelo[id]) {
    return (
      <span className={className} aria-hidden>
        ✦
      </span>
    );
  }
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {iconesModelo[id]}
    </svg>
  );
}

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
          className="relative block rounded-[2px] border border-linha bg-creme-quente p-4 pr-20 hover:border-bordo lg:rounded-[4px] lg:p-5 lg:pr-24"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-[5px] rounded-[1px] border border-dashed border-linha/50"
          />
          <span
            aria-hidden
            className="absolute top-3 right-3 flex size-11 rotate-3 items-center justify-center rounded-[1px] border border-dashed bg-creme text-lg shadow-[0_3px_6px_rgba(43,20,32,.12)] lg:top-4 lg:right-4"
            style={{
              borderColor: modelo?.cor ?? "#C9A46A",
              color: modelo?.cor ?? "#6B0D24",
            }}
          >
            <IconeModelo id={modelo?.id} />
          </span>
          <span
            aria-hidden
            className="font-maquina absolute top-9 right-6 flex size-11 -rotate-[12deg] items-center justify-center rounded-full border border-bordo/45 text-center text-[6.5px] leading-tight text-bordo/55 lg:top-11 lg:right-7"
          >
            {meu?.concluido_em
              ? "feito"
              : resta >= 0
                ? resta === 0
                  ? (
                    <>
                      último
                      <br />
                      dia
                    </>
                  )
                  : (
                    <>
                      {resta}
                      <br />
                      dias
                    </>
                  )
                : (
                  <>
                    encer
                    <br />
                    rado
                  </>
                )}
          </span>
          <p className="font-maquina text-[9px] tracking-[.12em] text-rosa-antigo uppercase">
            {modelo?.titulo ?? "desafio criado por você"}
          </p>
          <span className="mt-2 block">
            <span className="block font-display text-lg leading-tight font-semibold italic text-ameixa lg:font-revista lg:font-normal">
              {d.titulo}
            </span>
            <span className="mt-0.5 block text-xs text-cinza">
              {meu
                ? `${(meu.progresso ?? 0).toLocaleString("pt-BR")} de ${d.meta.toLocaleString("pt-BR")} ${unidade[d.tipo][1]}`
                : "você ainda não entrou"}
            </span>
          </span>
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
        <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {modelos.map((m) => (
            <li key={m.id}>
              <Link
                href={`/desafios/novo?modelo=${m.id}`}
                className="flex h-full items-center gap-3.5 rounded-[2px] border border-linha bg-creme-quente p-4 transition-transform hover:-translate-y-0.5 hover:border-bordo lg:rounded-[4px] lg:p-5"
              >
                <span
                  className="flex size-11 flex-none rotate-2 items-center justify-center rounded-[1px] border border-dashed bg-creme text-lg shadow-[0_3px_6px_rgba(43,20,32,.12)]"
                  style={{ borderColor: m.cor, color: m.cor }}
                >
                  <IconeModelo id={m.id} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[16px] leading-tight font-semibold italic text-ameixa lg:font-revista lg:text-[17px] lg:font-normal">
                    {m.titulo}
                  </span>
                  <span className="mt-1 block text-[12px] leading-snug text-cinza">
                    {m.descricao}
                  </span>
                </span>
              </Link>
            </li>
          ))}
          <li>
            <Link
              href="/desafios/novo"
              className="flex h-full items-center gap-3.5 rounded-[2px] border-[1.5px] border-dashed border-bordo/40 bg-creme-quente p-4 text-bordo hover:border-bordo lg:rounded-[4px] lg:p-5"
            >
              <span className="flex size-11 flex-none rotate-2 items-center justify-center rounded-[1px] border border-dashed border-bordo/50 bg-creme text-xl">
                ＋
              </span>
              <span>
                <span className="block font-display text-[16px] font-semibold italic lg:font-revista lg:text-[17px] lg:font-normal">
                  criar o meu
                </span>
                <span className="mt-1 block text-[12px] text-cinza">
                  você escolhe a meta e o prazo
                </span>
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
