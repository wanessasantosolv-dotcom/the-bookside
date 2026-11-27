"use client";

import { CapaAuto } from "@/components/CapaAuto";
import { Animacao } from "@/components/Animacao";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Avatares } from "@/components/clube/Pecas";
import { CabecalhoTogether, EmblemaClubes } from "@/components/comunidade/Together";
import { ComConta, ErroOuFalta } from "@/components/social/Estados";
import { andamento, encontrosDe, meusClubes, modoDe, type Encontro, type ResumoClube } from "@/lib/clubes";
import { usePerfil } from "@/lib/perfil-store";
import { temas } from "@/lib/dados";
import { coresDoTema } from "@/lib/tema";
import { TIPOGRAFIAS, ajustarContraste, ehEscura, emblemaDe, estiloDaIdentidade, lerIdentidade, misturar, paletaDe, temaDoId } from "@/lib/identidade";
import { Emblema } from "@/components/clube/Emblema";
import type { CSSProperties } from "react";
import { useModoEscuro } from "@/components/Aparencia";
import { nomeDe, pessoasPorId, useConsulta, useMeuId } from "@/lib/social";

/**
 * Um clube como um pequeno espaço literário: capa panorâmica, avatar e nome numa
 * composição editorial, os membros, a leitura atual com o meu progresso e uma
 * informação de contexto. Cada cartão usa as cores, a capa, o emblema e o pattern
 * do próprio clube; no modo escuro do app, só a cor de destaque vem do clube.
 */
function estiloDoCartao(ident: ReturnType<typeof lerIdentidade>, tema: string | null, escuro: boolean): CSSProperties {
  if (!ident) return coresDoTema(tema, escuro) as CSSProperties;
  const p = paletaDe(ident);
  const completo = estiloDaIdentidade(ident);
  if (!escuro || ehEscura(p)) return completo;
  // app escuro + clube claro: mantém as superfícies escuras do app, leva só o destaque e a capa
  const destaque = ajustarContraste(p.primaria, "#1D1517", 4.5);
  return {
    "--color-bordo": destaque,
    "--color-bordo-suave": destaque,
    "--color-rosa-fundo": misturar(p.complementar, "#1D1517", 0.18),
    "--club-banner": completo["--club-banner" as keyof CSSProperties],
    "--club-progress-fill": destaque,
    "--club-heading-font": completo["--club-heading-font" as keyof CSSProperties],
    "--font-revista": completo["--font-revista" as keyof CSSProperties],
    "--club-card-radius": completo["--club-card-radius" as keyof CSSProperties],
  } as CSSProperties;
}

function Cartao({
  c,
  pessoas,
  eu,
  encontro,
}: {
  c: ResumoClube;
  pessoas: Awaited<ReturnType<typeof pessoasPorId>>;
  eu: string | null;
  encontro: Encontro | null;
}) {
  const modoEscuro = useModoEscuro();
  const meusLivros = usePerfil((s) => s.livros);
  const lista = c.membros.map((id) => pessoas.get(id)!).filter(Boolean);
  const and = c.lendo ? andamento(c.lendo) : null;
  const tema = temas.find((t) => t.id === c.tema);
  const ident = lerIdentidade(c.identidade);
  const usaEmblema = ident && (ident.emblema?.noAvatar || !c.foto);
  const meu = c.lendo ? meusLivros.find((l) => l.id === c.lendo!.livro.id || l.titulo.toLowerCase() === c.lendo!.livro.titulo.toLowerCase()) : undefined;
  const meuPct = meu ? (meu.status === "lido" ? 100 : meu.paginas && meu.paginaAtual ? Math.min(100, Math.round((meu.paginaAtual / meu.paginas) * 100)) : 0) : null;
  const restam = and ? (and.faltam > 1 ? `${and.faltam} dias restantes` : and.faltam === 1 ? "1 dia restante" : +and.fim >= Date.now() ? "prazo hoje" : "prazo encerrado") : null;
  const contexto = encontro
    ? `book date · ${new Date(encontro.quando).toLocaleString("pt-BR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).replace(".", "")}`
    : !c.lendo && c.sugestoes
      ? `${c.sugestoes} ${c.sugestoes === 1 ? "livro sugerido" : "livros sugeridos"}${modoDe(c) === "votacao" ? " · votação aberta" : ""}`
      : null;
  const fundoCapa: CSSProperties = c.capa
    ? { backgroundImage: `url("${c.capa}")` }
    : ident
      ? { background: "var(--club-banner)" }
      : tema
        ? { background: tema.fundo }
        : {};

  return (
    <li
      style={estiloDoCartao(ident, c.tema, modoEscuro)}
      data-titulo={ident && !TIPOGRAFIAS.find((t) => t.id === (ident.tipografia ?? temaDoId(ident.tema).tipografia))?.italico ? "reto" : undefined}
      className={`min-w-0 ${ident ? "clube-tokens clube-identidade" : "clube-tokens"}`}
    >
      <Link
        href={`/clubes/${c.id}`}
        aria-label={`abrir o clube ${c.nome}`}
        className="group relative flex h-full flex-col overflow-hidden border border-linha/70 bg-creme-quente transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-24px_rgba(20,10,14,.55)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:border-fio"
        style={{ borderRadius: "var(--club-card-radius, 8px)" }}
      >
        {/* capa panorâmica */}
        <div className={`relative aspect-[16/7] bg-cover bg-center ${c.capa || ident || tema ? "" : "pat-estrelas"}`} style={fundoCapa}>
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent" />
          <span
            aria-hidden
            className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-creme/85 text-bordo backdrop-blur transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M7 17 17 7M9 7h8v8" />
            </svg>
          </span>
        </div>

        {/* identidade */}
        <div className="relative px-4 pb-3">
          <div className="-mt-7 flex items-end gap-3">
            {usaEmblema ? (
              <Emblema e={emblemaDe(ident!, c.nome)} paleta={paletaDe(ident!)} tamanho={56} className="flex-none drop-shadow-[0_4px_8px_rgba(0,0,0,.18)]" />
            ) : c.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.foto} alt="" className="size-14 flex-none rounded-full border-[3px] border-creme-quente object-cover" />
            ) : (
              <span className="grid size-14 flex-none place-items-center rounded-full border-[3px] border-creme-quente bg-rosa-fundo font-revista text-[22px] text-bordo">{c.nome.charAt(0).toLowerCase()}</span>
            )}
            <span className="mb-0.5 flex min-w-0 items-center gap-1.5">
              <Avatares pessoas={lista.slice(0, 4)} tamanho={20} />
              <span className="text-[11px] whitespace-nowrap text-tinta-suave">
                {c.membros.length} {c.membros.length === 1 ? "membro" : "membros"}
              </span>
            </span>
          </div>
          <h3 className="mt-2.5 line-clamp-2 font-revista text-[21px] leading-[1.1] text-bordo">{c.nome}</h3>
          {c.descricao ? <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-tinta-suave">{c.descricao}</p> : null}
        </div>

        {/* leitura atual */}
        <div className="mx-3 mt-auto mb-3 rounded-[calc(var(--club-card-radius,8px)*.75)] bg-rosa-fundo/70 px-3 py-3">
          {c.lendo ? (
            <div className="flex gap-3">
              <CapaAuto livro={c.lendo.livro} className="w-[42px] flex-none shadow-[0_6px_12px_-8px_rgba(0,0,0,.5)] [&>span:last-child]:hidden" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium tracking-[.08em] text-tinta-suave uppercase">leitura atual</p>
                <p className="mt-0.5 truncate font-revista text-[15px] leading-tight text-ameixa">{c.lendo.livro.titulo}</p>
                <p className="truncate text-[11px] text-tinta-suave">{c.lendo.livro.autor}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="block h-[3px] min-w-0 flex-1 rounded-full bg-linha/80" aria-hidden>
                    <span className="block h-full rounded-full bg-bordo" style={{ width: `${Math.max(meuPct ?? 0, meuPct ? 3 : 0)}%` }} />
                  </span>
                  <span className="flex-none text-[10px] tabular-nums text-tinta-suave">
                    {meuPct === null ? "—" : meuPct === 100 ? "concluí" : `${meuPct}%`}
                    {restam ? ` · ${restam}` : ""}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-ameixa">
              <span className="font-revista text-[15px]">qual será a próxima leitura?</span>
              <span className="mt-0.5 block text-[11px] text-tinta-suave">{c.membros.length > 1 ? "sugiram um livro para o clube." : "convide membros e sugira o primeiro livro."}</span>
            </p>
          )}
        </div>
        {contexto ? <p className="px-4 pb-3 text-[11px] text-tinta-suave">{contexto}</p> : null}
      </Link>
    </li>
  );
}

function Lista() {
  const eu = useMeuId();
  const consulta = useConsulta(async () => {
    const clubes = await meusClubes();
    const [pessoas, encontros] = await Promise.all([
      pessoasPorId(clubes.flatMap((c) => c.membros.concat(c.lendo?.sugerido_por ?? []))),
      Promise.all(clubes.map((c) => encontrosDe(c.id).catch(() => [] as Encontro[]))),
    ]);
    const agora = new Date().toISOString();
    const proximo = new Map(clubes.map((c, i) => [c.id, encontros[i].find((e) => e.quando >= agora) ?? null]));
    return { clubes, pessoas, proximo };
  }, []);
  if (consulta.carregando && !consulta.dados)
    return <Animacao tipo="fita" titulo="colando as fotos do clube" sub="seus clubes já já ficam prontos" />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { clubes, pessoas, proximo } = consulta.dados!;

  return clubes.length ? (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {clubes.map((c) => (
        <Cartao key={c.id} c={c} pessoas={pessoas} eu={eu} encontro={proximo.get(c.id) ?? null} />
      ))}
    </ul>
  ) : (
    <div className="flex flex-col items-center border-y border-linha px-6 py-12 text-center lg:border-fio">
      <EmblemaClubes tamanho={64} />
      <p className="mt-4 font-revista text-[24px] text-oliva italic">find your kind of club.</p>
      <p className="mt-1.5 max-w-[380px] text-[14px] text-tinta-suave">crie um clube ou entre por convite para compartilhar suas leituras.</p>
      <Link href="/clubes/novo" className="mt-5 inline-flex h-11 items-center rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme hover:bg-bordo-suave">
        + criar clube
      </Link>
    </div>
  );
}

export default function ClubesPage() {
  return (
    <AppShell aba="clubes">
      <div className="flex flex-1 flex-col px-5 pt-2 pb-10 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="mx-auto w-full max-w-[1200px] lg:mx-0">
          <CabecalhoTogether ativo="clubes" />
          <div className="mb-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <div>
              <h2 className="font-revista text-[22px] leading-none text-ameixa lg:text-[26px]">meus clubes</h2>
              <p className="mt-1 font-texto text-[12px] text-cinza">our kind of club.</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/clubes/entrar" className="min-h-10 content-center font-texto text-[13px] font-medium text-tinta-suave hover:text-bordo">
                entrar por convite
              </Link>
              <Link href="/clubes/novo" className="inline-flex h-10 items-center rounded-[6px] bg-bordo px-4 font-texto text-[13px] font-semibold text-creme hover:bg-bordo-suave">
                + criar clube
              </Link>
            </div>
          </div>
          <ComConta>
            <Lista />
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
