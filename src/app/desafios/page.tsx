"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Selo } from "@/components/desafios/Selo";
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
import { lidosNoAno } from "@/lib/estantes";
import { usePerfil } from "@/lib/perfil-store";
import { useConsulta, useMeuId } from "@/lib/social";

/*
 * Desafios de leitura: meus desafios (com a meta do ano em destaque),
 * explorar (os modelos e o convite por código) e concluídos (o álbum de selos).
 * Cada desafio é um selo da mesma família gráfica.
 */

type Aba = "meus" | "explorar" | "concluidos";
type Modalidade = "pessoal" | "amigas" | "clube";
type Filtro = "todos" | Modalidade;
type Ordem = "prazo" | "recentes" | "perto";

const ABAS: { id: Aba; nome: string }[] = [
  { id: "meus", nome: "meus desafios" },
  { id: "explorar", nome: "explorar" },
  { id: "concluidos", nome: "concluídos" },
];
const NOME_MODALIDADE: Record<Modalidade, string> = { pessoal: "pessoal", amigas: "com amigas", clube: "do clube" };
const num = (n: number) => n.toLocaleString("pt-BR");
const mesAno = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "");
const dataLonga = (dia: string) => new Date(`${dia}T12:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
const tituloSecao = "font-revista text-[22px] leading-none text-bordo italic lg:text-[24px]";
const linhaSecao = "mb-4 flex items-baseline justify-between gap-3 border-b border-linha pb-2 lg:border-fio";

const abaDaUrl = (): Aba => {
  const a = new URLSearchParams(window.location.search).get("aba");
  return a === "explorar" || a === "concluidos" ? a : "meus";
};

function Barra({ valor }: { valor: number }) {
  return (
    <span className="block h-[5px] rounded-full bg-linha" aria-hidden>
      <span className="block h-full rounded-full bg-bordo transition-[width] duration-500" style={{ width: `${Math.max(2, Math.min(100, valor))}%` }} />
    </span>
  );
}

/** quanto falta, na unidade da meta (nunca "porcentagem de livros" num desafio de páginas) */
function Restante({ d, progresso }: { d: Desafio; progresso: number }) {
  const falta = Math.max(0, d.meta - progresso);
  const [um, varios] = unidade[d.tipo];
  return <>{falta ? `${num(falta)} ${falta === 1 ? um : varios} restantes` : "meta alcançada"}</>;
}

function Lista() {
  const eu = useMeuId();
  const router = useRouter();
  const livros = usePerfil((s) => s.livros);
  const meta = usePerfil((s) => s.meta);
  const [aba, setAba] = useState<Aba>("meus");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [ordem, setOrdem] = useState<Ordem>("prazo");
  const [anoAlbum, setAnoAlbum] = useState<string>("todos");
  const [codigo, setCodigo] = useState("");
  const [erroCodigo, setErroCodigo] = useState<string | null>(null);

  useEffect(() => {
    setAba(abaDaUrl());
    const c = new URLSearchParams(window.location.search).get("codigo");
    // veio pelo link de convite: o código já chega preenchido, na aba explorar
    if (c) {
      setCodigo(c.toUpperCase().slice(0, 6));
      setAba("explorar");
    }
    const voltar = () => setAba(abaDaUrl());
    window.addEventListener("popstate", voltar);
    return () => window.removeEventListener("popstate", voltar);
  }, []);
  function mudarAba(a: Aba) {
    setAba(a);
    window.history.pushState(null, "", a === "meus" ? "/desafios" : `/desafios?aba=${a}`);
  }

  const consulta = useConsulta(async () => {
    const r = await meusDesafios();
    // o meu progresso é calculado aqui (regras do app) e guardado no banco
    const novos = await sincronizarMeuProgresso(r.desafios, r.participo, usePerfil.getState().livros, concluidosVistos()).catch(
      () => [] as Desafio[],
    );
    return { ...(await meusDesafios()), novos };
  }, [livros.length]);

  // desafio recém-concluído: comemora uma vez só
  useEffect(() => {
    const d = consulta.dados?.novos?.[0];
    if (!d) return;
    marcarConcluidos(consulta.dados!.novos.map((x) => x.id));
    celebrar({ tipo: "desafio", titulo: d.titulo, texto: "você completou o desafio ✦" });
  }, [consulta.dados]);

  async function entrar() {
    setErroCodigo(null);
    try {
      const id = await entrarComCodigo(codigo);
      if (!id) return setErroCodigo("esse código não existe ou o desafio já acabou.");
      router.push(`/desafios/${id}`);
    } catch {
      setErroCodigo("não deu para entrar agora. tente de novo em instantes.");
    }
  }

  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const dados = consulta.dados;
  const carregando = consulta.carregando && !dados;
  const todos = dados?.desafios ?? [];
  const participantes = dados?.participantes ?? [];
  const psDe = (d: Desafio) => participantes.filter((p) => p.desafio_id === d.id);
  const meuDe = (d: Desafio) => psDe(d).find((p) => p.usuario_id === eu);
  const modalidadeDe = (d: Desafio): Modalidade => (d.clube_id ? "clube" : psDe(d).length > 1 ? "amigas" : "pessoal");
  const modeloDe = (d: Desafio) => modelos.find((m) => m.id === d.modelo);

  const participo = dados?.participo ?? new Set<string>();
  const ativos = todos.filter((d) => participo.has(d.id) && !meuDe(d)?.concluido_em && diasRestantes(d.fim) >= 0);
  const doClubeParaEntrar = todos.filter((d) => !participo.has(d.id) && d.clube_id && diasRestantes(d.fim) >= 0);
  const concluidos = todos
    .filter((d) => meuDe(d)?.concluido_em)
    .sort((a, b) => (meuDe(b)!.concluido_em ?? "").localeCompare(meuDe(a)!.concluido_em ?? ""));
  const encerrados = todos.filter((d) => participo.has(d.id) && !meuDe(d)?.concluido_em && diasRestantes(d.fim) < 0);

  const pctDe = (d: Desafio) => Math.min(100, Math.round(((meuDe(d)?.progresso ?? 0) / d.meta) * 100));
  const ativosVisiveis = ativos
    .filter((d) => filtro === "todos" || modalidadeDe(d) === filtro)
    .sort((a, b) =>
      ordem === "prazo" ? a.fim.localeCompare(b.fim) : ordem === "recentes" ? b.criado_em.localeCompare(a.criado_em) : pctDe(b) - pctDe(a),
    );
  const modalidadesPresentes = (["pessoal", "amigas", "clube"] as Modalidade[]).filter((m) => ativos.some((d) => modalidadeDe(d) === m));

  const ano = new Date().getFullYear();
  const lidosAno = lidosNoAno(livros, ano);

  // ───── peças ─────

  const seloDe = (d: Desafio, tamanho: number, estado: "andamento" | "concluido" | "encerrado" | "disponivel" = "andamento") => {
    const m = modeloDe(d);
    const meu = meuDe(d);
    return (
      <Selo
        tipo={d.tipo}
        numero={d.meta}
        rotulo={m?.titulo ?? (d.clube_id ? "clube" : "desafio")}
        cor={m?.cor}
        estado={estado}
        tamanho={tamanho}
        data={meu?.concluido_em ? mesAno(meu.concluido_em) : undefined}
      />
    );
  };

  const etiqueta = (texto: string) => (
    <span className="inline-flex items-center rounded-full border border-linha px-2.5 py-0.5 text-[11px] text-tinta-suave lg:border-fio">{texto}</span>
  );

  const avatares = (ps: Participante[]) =>
    ps.length > 1 ? (
      <span className="flex items-center gap-2">
        <span className="flex -space-x-2">
          {ps.slice(0, 5).map((p) => (
            <span key={p.usuario_id} className="rounded-full ring-2 ring-creme">
              <Avatar pessoa={p.pessoa ?? { id: p.usuario_id, usuario: null, nome: "?", foto: null }} tamanho={22} />
            </span>
          ))}
        </span>
        <span className="text-[11px] text-cinza">{ps.length} pessoas · cada uma com a sua meta</span>
      </span>
    ) : null;

  /** um desafio ativo: selo à esquerda, informações à direita (celular e computador) */
  const cartao = (d: Desafio) => {
    const meu = meuDe(d);
    const progresso = meu?.progresso ?? 0;
    const resta = diasRestantes(d.fim);
    const fundo = ["bg-creme-quente", "bg-rosa-fundo/70", "bg-[#59634F]/[.07]", "bg-[#C6AA70]/[.10]"][
      [...d.id].reduce((t, c) => t + c.charCodeAt(0), 0) % 4
    ];
    return (
      <li key={d.id}>
        <Link href={`/desafios/${d.id}`} className={`group flex h-full gap-4 rounded-[8px] p-4 transition-colors hover:bg-linha/40 lg:p-5 ${fundo}`}>
          <span className="flex-none transition-transform group-hover:-rotate-2 motion-reduce:transition-none">{seloDe(d, 78)}</span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="flex flex-wrap gap-1.5">{etiqueta(NOME_MODALIDADE[modalidadeDe(d)])}</span>
            <span className="mt-1.5 line-clamp-2 font-revista text-[19px] leading-[1.15] text-ameixa">{d.titulo}</span>
            <span className="mt-auto pt-3">
              <span className="flex items-baseline justify-between text-[12px]">
                <span className="text-ameixa tabular-nums">
                  <b className="font-semibold">{num(progresso)}</b> de {num(d.meta)} {unidade[d.tipo][1]}
                </span>
                <span className="text-cinza">{resta === 0 ? "último dia" : `${resta} ${resta === 1 ? "dia" : "dias"}`}</span>
              </span>
              <span className="mt-1.5 block">
                <Barra valor={(progresso / d.meta) * 100} />
              </span>
              <span className="mt-2 block">{avatares(psDe(d))}</span>
            </span>
          </span>
        </Link>
      </li>
    );
  };

  // ───── abas ─────

  const meus = (
    <div className="space-y-10">
      {/* destaque: a meta do ano, a mesma da jornada */}
      {meta ? (
        <section aria-label="desafio em destaque" className="grid items-center gap-5 rounded-[10px] bg-creme-quente px-5 py-5 sm:grid-cols-[auto_minmax(0,1fr)] lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-10 lg:px-8 lg:py-7">
          <span className="flex justify-center sm:justify-start">
            <Selo tipo="anual" numero={meta} rotulo={`meta ${ano}`} tamanho={110} girar={-2} estado={lidosAno >= meta ? "concluido" : "andamento"} data={String(ano)} />
          </span>
          <div className="min-w-0">
            <p className="flex flex-wrap gap-1.5">{etiqueta("pessoal")}{etiqueta("a mesma meta da jornada")}</p>
            <h2 className="mt-2 font-revista text-[28px] leading-[1.05] text-ameixa lg:text-[34px]">
              {meta} livros em {ano}
            </h2>
            <p className="mt-2 text-[14px] text-tinta-suave">
              <b className="font-semibold text-ameixa tabular-nums">{lidosAno} de {meta} livros</b> ·{" "}
              {lidosAno >= meta ? "meta alcançada" : `${meta - lidosAno} ${meta - lidosAno === 1 ? "livro restante" : "livros restantes"}`} · até 31 de dezembro de {ano}
            </p>
            <div className="mt-3 max-w-[520px]">
              <Barra valor={(lidosAno / meta) * 100} />
            </div>
          </div>
          <Link href="/perfil?aba=jornada" className="inline-flex min-h-11 items-center justify-center rounded-full border border-bordo px-5 text-[13px] font-semibold text-bordo hover:bg-bordo/5">
            ver na jornada →
          </Link>
        </section>
      ) : null}

      <section aria-labelledby="t-ativos">
        <div className={linhaSecao}>
          <h2 id="t-ativos" className={tituloSecao}>
            em andamento
          </h2>
          {ativos.length > 2 ? (
            <label className="flex items-center gap-2 text-[12px] text-cinza">
              <span className="sr-only sm:not-sr-only">ordenar</span>
              <select
                value={ordem}
                onChange={(e) => setOrdem(e.target.value as Ordem)}
                className="h-9 rounded-[8px] border border-linha bg-transparent px-2 text-[13px] text-ameixa focus:border-bordo focus:outline-none"
              >
                <option value="prazo">prazo mais próximo</option>
                <option value="recentes">mais recentes</option>
                <option value="perto">mais perto do fim</option>
              </select>
            </label>
          ) : null}
        </div>
        {modalidadesPresentes.length > 1 ? (
          <div role="group" aria-label="modalidade" className="mb-4 flex flex-wrap gap-2">
            {(["todos", ...modalidadesPresentes] as Filtro[]).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filtro === f}
                onClick={() => setFiltro(f)}
                className={`min-h-9 rounded-full border px-3.5 text-[13px] ${filtro === f ? "border-bordo bg-bordo text-creme" : "border-linha text-ameixa"}`}
              >
                {f === "todos" ? "todos" : NOME_MODALIDADE[f]}
              </button>
            ))}
          </div>
        ) : null}
        {carregando ? (
          <div aria-busy className="grid gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-36 animate-pulse rounded-[8px] bg-linha/40" />
            ))}
          </div>
        ) : ativosVisiveis.length ? (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{ativosVisiveis.map(cartao)}</ul>
        ) : (
          <div className="py-4">
            <p className="font-revista text-[20px] text-ameixa italic">nenhum desafio em andamento.</p>
            <p className="mt-1 text-[14px] text-tinta-suave">explore os desafios disponíveis e encontre uma nova leitura para sua lista.</p>
            <button type="button" onClick={() => mudarAba("explorar")} className="mt-3 inline-flex min-h-11 items-center rounded-full bg-bordo px-5 text-[13px] font-semibold text-creme">
              explorar desafios
            </button>
          </div>
        )}
      </section>

      {doClubeParaEntrar.length ? (
        <section aria-labelledby="t-clube">
          <div className={linhaSecao}>
            <h2 id="t-clube" className={tituloSecao}>
              dos seus clubes
            </h2>
          </div>
          <ul className="space-y-3">
            {doClubeParaEntrar.map((d) => (
              <li key={d.id}>
                <Link href={`/desafios/${d.id}`} className="flex items-center gap-4 border-b border-linha pb-3 lg:border-fio">
                  {seloDe(d, 52, "disponivel")}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-revista text-[17px] text-ameixa">{d.titulo}</span>
                    <span className="block text-[12px] text-cinza">
                      {num(d.meta)} {unidade[d.tipo][1]} · até {dataLonga(d.fim)}
                    </span>
                  </span>
                  <span className="text-[13px] font-semibold text-bordo">ver e entrar →</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {concluidos.length ? (
        <section aria-labelledby="t-conquistas">
          <div className={linhaSecao}>
            <h2 id="t-conquistas" className={tituloSecao}>
              concluídos há pouco
            </h2>
            <button type="button" onClick={() => mudarAba("concluidos")} className="min-h-9 text-[12px] font-semibold text-bordo hover:underline">
              ver todos →
            </button>
          </div>
          <ul className="flex gap-6 overflow-x-auto pb-2 [scrollbar-width:none]">
            {concluidos.slice(0, 5).map((d) => (
              <li key={d.id} className="w-[112px] flex-none">
                <Link href={`/desafios/${d.id}`} className="block">
                  {seloDe(d, 88, "concluido")}
                  <span className="mt-2 block line-clamp-2 text-[13px] leading-tight text-ameixa">{d.titulo}</span>
                  <span className="text-[11px] text-cinza">{mesAno(meuDe(d)!.concluido_em!)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );

  const explorar = (
    <div className="space-y-10">
      <section aria-labelledby="t-catalogo">
        <div className={linhaSecao}>
          <h2 id="t-catalogo" className={tituloSecao}>
            para começar
          </h2>
          <span className="text-[12px] text-cinza">você escolhe o prazo e convida quem quiser</span>
        </div>
        <ul className="grid gap-x-8 gap-y-2 md:grid-cols-2">
          {modelos.map((m) => {
            const jaAtivo = ativos.find((d) => d.modelo === m.id);
            return (
              <li key={m.id} className="flex items-center gap-4 border-b border-linha py-4 lg:border-fio">
                <Selo tipo={m.tipo} numero={m.meta} rotulo={m.titulo} cor={m.cor} tamanho={72} girar={[-3, 2, -1, 3][modelos.indexOf(m) % 4]} />
                <span className="min-w-0 flex-1">
                  <span className="block font-revista text-[19px] leading-tight text-ameixa">{m.titulo}</span>
                  <span className="mt-1 block text-[13px] leading-snug text-tinta-suave">{m.descricao}</span>
                  <span className="mt-1.5 block text-[11px] text-cinza">
                    {num(m.meta)} {unidade[m.tipo][1]} · {m.dias} dias · sozinha, com amigas ou com o clube
                  </span>
                </span>
                {jaAtivo ? (
                  <Link href={`/desafios/${jaAtivo.id}`} className="flex-none text-[12px] font-semibold text-oliva hover:underline">
                    participando →
                  </Link>
                ) : (
                  <Link
                    href={`/desafios/novo?modelo=${m.id}`}
                    className="inline-flex min-h-10 flex-none items-center rounded-full border border-bordo px-4 text-[13px] font-semibold text-bordo hover:bg-bordo/5"
                  >
                    participar
                  </Link>
                )}
              </li>
            );
          })}
          <li className="flex items-center gap-4 border-b border-linha py-4 lg:border-fio">
            <span className="flex h-[86px] w-[72px] flex-none items-center justify-center rounded-[2px] border-[1.5px] border-dashed border-bordo/40 font-revista text-[30px] text-bordo">
              +
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-revista text-[19px] leading-tight text-ameixa">criar o meu</span>
              <span className="mt-1 block text-[13px] text-tinta-suave">você escolhe o tipo de meta, a quantidade e o prazo.</span>
            </span>
            <Link href="/desafios/novo" className="inline-flex min-h-10 flex-none items-center rounded-full bg-bordo px-4 text-[13px] font-semibold text-creme">
              criar
            </Link>
          </li>
        </ul>
      </section>

      <section aria-labelledby="t-convite">
        <div className={linhaSecao}>
          <h2 id="t-convite" className={tituloSecao}>
            recebeu um convite?
          </h2>
        </div>
        <div className="flex max-w-[420px] gap-2">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase().slice(0, 6))}
            placeholder="código do desafio"
            aria-label="código do desafio"
            className="h-12 min-w-0 flex-1 rounded-[8px] border border-bege bg-creme-quente px-4 font-mono text-lg tracking-[.2em] uppercase outline-none focus:border-bordo"
          />
          <button type="button" onClick={entrar} disabled={codigo.length < 6} className="h-12 rounded-full bg-bordo px-5 text-[14px] font-semibold text-creme disabled:opacity-50">
            entrar
          </button>
        </div>
        {erroCodigo ? <p className="mt-2 text-[13px] text-bordo">{erroCodigo}</p> : null}
      </section>
    </div>
  );

  const anosAlbum = [...new Set(concluidos.map((d) => meuDe(d)!.concluido_em!.slice(0, 4)))].sort().reverse();
  const album = concluidos.filter((d) => anoAlbum === "todos" || meuDe(d)!.concluido_em!.startsWith(anoAlbum));
  const concluidosAno = concluidos.filter((d) => meuDe(d)!.concluido_em!.startsWith(String(ano))).length;

  const colecao = (
    <div className="space-y-10">
      {concluidos.length ? (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-linha pb-4 lg:border-fio">
            <p className="flex items-baseline gap-6">
              <span>
                <b className="block font-revista text-[34px] leading-none font-normal text-bordo tabular-nums">{concluidos.length}</b>
                <span className="text-[12px] text-tinta-suave">{concluidos.length === 1 ? "selo na coleção" : "selos na coleção"}</span>
              </span>
              <span>
                <b className="block font-revista text-[34px] leading-none font-normal text-bordo tabular-nums">{concluidosAno}</b>
                <span className="text-[12px] text-tinta-suave">em {ano}</span>
              </span>
            </p>
            {anosAlbum.length > 1 ? (
              <select
                value={anoAlbum}
                onChange={(e) => setAnoAlbum(e.target.value)}
                aria-label="ano da coleção"
                className="h-9 rounded-[8px] border border-linha bg-transparent px-2 text-[13px] text-ameixa focus:border-bordo focus:outline-none"
              >
                <option value="todos">todos os anos</option>
                {anosAlbum.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          {/* o álbum: selos direto sobre o papel, sem caixas */}
          <ul className="grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-5">
            {album.map((d, i) => {
              const meu = meuDe(d)!;
              return (
                <li key={d.id} className="text-center">
                  <Link href={`/desafios/${d.id}`} className="group inline-block">
                    <span className="inline-block transition-transform group-hover:-translate-y-1 motion-reduce:transition-none" style={{ transform: `rotate(${[-2, 1.5, -1, 2.5, 0][i % 5]}deg)` }}>
                      {seloDe(d, 104, "concluido")}
                    </span>
                    <span className="mt-3 block line-clamp-2 font-revista text-[15px] leading-tight text-ameixa">{d.titulo}</span>
                    <span className="mt-0.5 block text-[12px] text-tinta-suave">
                      {num(meu.progresso)} {unidade[d.tipo][1]} · {mesAno(meu.concluido_em!)}
                    </span>
                    <span className="block text-[11px] text-cinza">{NOME_MODALIDADE[modalidadeDe(d)]}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="py-4">
          <p className="font-revista text-[20px] text-ameixa italic">sua coleção começa aqui.</p>
          <p className="mt-1 text-[14px] text-tinta-suave">cada desafio que você completar vira um selo nesta página.</p>
        </div>
      )}

      {encerrados.length ? (
        <section aria-labelledby="t-encerrados">
          <div className={linhaSecao}>
            <h2 id="t-encerrados" className={tituloSecao}>
              edições encerradas
            </h2>
          </div>
          <ul className="grid grid-cols-3 gap-x-6 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
            {encerrados.map((d) => (
              <li key={d.id} className="text-center">
                <Link href={`/desafios/${d.id}`} className="inline-block opacity-90">
                  {seloDe(d, 72, "encerrado")}
                  <span className="mt-2 block line-clamp-2 text-[12px] leading-tight text-tinta-suave">{d.titulo}</span>
                  <span className="text-[11px] text-cinza">
                    {num(meuDe(d)?.progresso ?? 0)} de {num(d.meta)} <Restante d={d} progresso={meuDe(d)?.progresso ?? 0} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-20 -mx-5 bg-creme px-5 lg:mx-0 lg:bg-jornal lg:px-0">
        <nav role="tablist" aria-label="desafios" className="grid grid-cols-3 border-y border-linha lg:border-fio">
          {ABAS.map((a) => (
            <button
              key={a.id}
              role="tab"
              type="button"
              aria-selected={aba === a.id}
              onClick={() => mudarAba(a.id)}
              className={`-mb-px min-h-12 border-b-2 text-[14px] whitespace-nowrap lg:text-[15px] ${
                aba === a.id ? "border-bordo font-semibold text-bordo" : "border-transparent text-cinza hover:text-ameixa"
              }`}
            >
              {a.nome}
              {a.id === "concluidos" && concluidos.length ? <span className="ml-1 text-[12px] font-normal text-cinza">({concluidos.length})</span> : null}
            </button>
          ))}
        </nav>
      </div>
      <div className="pt-7 lg:pt-9">{aba === "meus" ? meus : aba === "explorar" ? explorar : colecao}</div>
    </>
  );
}

export default function DesafiosPage() {
  return (
    <AppShell aba="perfil">
      <div className="flex flex-1 flex-col px-5 pt-2 pb-12 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="mx-auto w-full max-w-[1200px]">
          <Voltar padrao="/perfil?aba=jornada" rotulo="jornada" className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo" />
          <header className="mt-1 mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-revista text-[32px] leading-[1.05] text-bordo italic lg:text-[44px]">desafios de leitura</h1>
              <p className="mt-1.5 text-[14px] text-tinta-suave">sozinha, com amigos ou com o clube. o progresso conta sozinho.</p>
            </div>
            <Link href="/desafios/novo" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-bordo px-5 text-[14px] font-semibold text-creme hover:bg-bordo/90">
              <span aria-hidden>+</span> criar desafio
            </Link>
          </header>
          <ComConta>
            <Lista />
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
