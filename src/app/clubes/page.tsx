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
import { useModoEscuro } from "@/components/Aparencia";
import { nomeDe, pessoasPorId, useConsulta, useMeuId } from "@/lib/social";

/** um clube: identidade à esquerda, a leitura atual e uma pendência à direita */
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
  const meu = c.lendo ? meusLivros.find((l) => l.id === c.lendo!.livro.id) : undefined;
  const meuPct = meu
    ? meu.status === "lido"
      ? 100
      : meu.paginas && meu.paginaAtual
        ? Math.min(100, Math.round((meu.paginaAtual / meu.paginas) * 100))
        : 0
    : null;
  const quemEscolheu = c.lendo?.sugerido_por ? (c.lendo.sugerido_por === eu ? "sugerido por você" : `sugerido por ${nomeDe(pessoas.get(c.lendo.sugerido_por))}`) : null;

  // uma informação de contexto, a mais relevante agora
  const contexto = encontro
    ? { rotulo: "next book date.", texto: new Date(encontro.quando).toLocaleString("pt-BR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) }
    : !c.lendo && c.sugestoes
      ? { rotulo: modoDe(c) === "votacao" ? "votação aberta" : "próxima escolha", texto: `${c.sugestoes} ${c.sugestoes === 1 ? "livro sugerido" : "livros sugeridos"}` }
      : null;

  return (
    <li style={coresDoTema(c.tema, modoEscuro)}>
      <Link
        href={`/clubes/${c.id}`}
        aria-label={`ver clube ${c.nome}`}
        className="group grid overflow-hidden rounded-[4px] border border-linha bg-creme-quente transition-colors hover:border-bordo sm:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:border-fio"
      >
        {/* identidade do clube */}
        <div className="relative">
          <div
            className={`relative h-[84px] bg-cover bg-center sm:h-[96px] ${c.capa || tema ? "" : "pat-estrelas"}`}
            style={c.capa ? { backgroundImage: `url("${c.capa}")` } : tema ? { background: tema.fundo } : undefined}
          />
          <div className="relative flex gap-3 px-4 pt-2 pb-4">
            {c.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.foto} alt="" className="-mt-9 size-14 flex-none rounded-full border-[3px] border-creme-quente object-cover" />
            ) : null}
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-revista text-[22px] leading-tight text-bordo italic">{c.nome}</h3>
              {c.descricao ? <p className="truncate text-[12px] text-cinza">{c.descricao}</p> : null}
              <div className="mt-2 flex items-center gap-2">
                <Avatares pessoas={lista} tamanho={22} />
                <span className="text-[12px] text-tinta-suave">
                  {c.membros.length} {c.membros.length === 1 ? "membro" : "membros"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* leitura atual + uma pendência */}
        <div className="flex flex-col border-t border-linha px-4 py-4 sm:border-t-0 sm:border-l lg:border-fio lg:px-5">
          {c.lendo ? (
            <div className="flex gap-3.5">
              <CapaAuto livro={c.lendo.livro} className="w-[54px] flex-none transition-transform group-hover:-translate-y-0.5 [&>span:last-child]:hidden" />
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] tracking-[.14em] text-bordo uppercase">the current read.</p>
                <p className="mt-1 line-clamp-2 font-revista text-[16px] leading-tight text-ameixa italic">{c.lendo.livro.titulo}</p>
                <p className="truncate text-[12px] text-cinza">{c.lendo.livro.autor}</p>
                {meuPct !== null ? (
                  <div className="mt-2">
                    <span className="flex justify-between text-[11px] text-tinta-suave">
                      <span>minha leitura</span>
                      <span className="tabular-nums">{meuPct === 100 ? "concluída" : `${meuPct}%`}</span>
                    </span>
                    <span className="mt-1 block h-[4px] rounded-full bg-linha" aria-hidden>
                      <span className="block h-full rounded-full bg-bordo" style={{ width: `${Math.max(meuPct, 2)}%` }} />
                    </span>
                  </div>
                ) : null}
                <p className="mt-1.5 text-[11px] text-tinta-suave">
                  {[and ? (and.faltam > 0 ? `${and.faltam} ${and.faltam === 1 ? "dia restante" : "dias restantes"}` : "prazo encerrado") : null, quemEscolheu].filter(Boolean).join(" · ")}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-revista text-[17px] text-ameixa italic">qual será a próxima leitura?</p>
              <p className="mt-1 text-[12px] text-tinta-suave">{c.membros.length > 1 ? "sugira um livro para o clube." : "convide membros e sugira o primeiro livro."}</p>
            </div>
          )}
          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            {contexto ? (
              <p className="min-w-0 text-[12px]">
                <span className="block font-mono text-[10px] tracking-[.12em] text-oliva uppercase">{contexto.rotulo}</span>
                <span className="text-ameixa">{contexto.texto}</span>
              </p>
            ) : (
              <span />
            )}
            <span className="flex-none text-[13px] font-semibold text-bordo">
              ver clube <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </div>
        </div>
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
    <ul className={`grid gap-5 ${clubes.length > 1 ? "xl:grid-cols-2" : ""}`}>
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
        <div className="w-full max-w-[1200px]">
          <CabecalhoTogether ativo="clubes" />
          <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
            <h2 className="font-revista text-[24px] leading-none text-ameixa italic lg:text-[30px]">meus clubes</h2>
            <div className="flex items-center gap-4">
              <Link href="/clubes/entrar" className="min-h-11 content-center text-[13px] font-semibold text-cinza hover:text-bordo">
                entrar por convite
              </Link>
              <Link href="/clubes/novo" className="inline-flex h-11 items-center rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme hover:bg-bordo-suave">
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
