"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import { Carregando, ComConta, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { Avatar, CartaoAtividade } from "@/components/social/Pessoas";
import { lembrarLivros } from "@/lib/catalogo";
import { citacaoDoDia } from "@/lib/citacoes";
import { corDoLivro } from "@/lib/cores";
import { usePerfil } from "@/lib/perfil-store";
import { feedDeAmigas, lendoEntreAmigas, nomeDe, pessoasPorId, useConsulta } from "@/lib/social";

type Filtro = "tudo" | "resenhas" | "listas";

const icone = "flex size-11 items-center justify-center rounded-full text-bordo hover:bg-rosa-fundo lg:size-10";

function Icones() {
  return (
    <span className="-mr-3 flex items-center lg:mr-0">
      <Link href="/buscar" aria-label="buscar livros" className={icone}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </Link>
      <Link href="/pessoas" aria-label="buscar pessoas" className={icone}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6M22 11h-6" />
        </svg>
      </Link>
      <Link href="/descobrir" aria-label="descobrir livros" className={icone}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2 L14.4 9.2 L21.5 12 L14.4 14.8 L12 22 L9.6 14.8 L2.5 12 L9.6 9.2 Z" />
        </svg>
      </Link>
      <Link href="/novidades" aria-label="novidades" className={icone}>
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      </Link>
    </span>
  );
}

function BannerTeste() {
  return (
    <Link href="/teste" className="block rounded-xl border border-dashed border-ouro bg-creme-quente p-4 lg:rounded-[4px] lg:bg-transparent lg:p-5">
      <p className="text-[10px] font-semibold tracking-[.16em] text-bordo uppercase">✦ ainda não fez o teste?</p>
      <p className="mt-2 font-display text-[17px] leading-[1.2] font-semibold italic text-ameixa lg:font-revista lg:text-[19px] lg:font-normal">
        descubra seu bookside
      </p>
      <p className="mt-1.5 font-accent text-sm italic text-cinza lg:font-texto lg:text-xs lg:not-italic">
        15 perguntas, 8 arquétipos — e um universo literário só seu.
      </p>
      <p className="mt-2.5 text-[11px] font-bold tracking-[.1em] text-bordo uppercase">fazer o teste →</p>
    </Link>
  );
}

function Feed() {
  const [filtro, setFiltro] = useState<Filtro>("tudo");
  const feed = useConsulta(async () => {
    const [atividades, lendo] = await Promise.all([feedDeAmigas(), lendoEntreAmigas()]);
    const pessoas = await pessoasPorId(atividades.map((a) => a.autor));
    lembrarLivros([...atividades.map((a) => a.livro), ...lendo.map((l) => l.livro)]);
    return { atividades, lendo, pessoas };
  }, []);

  if (feed.carregando && !feed.dados) return <Carregando />;
  if (feed.erro) return <ErroOuFalta erro={feed.erro} onTentar={feed.recarregar} />;
  const { atividades, lendo, pessoas } = feed.dados!;
  const visiveis = atividades.filter((a) =>
    filtro === "resenhas" ? !!a.texto : filtro === "listas" ? a.tipo === "quer" : true,
  );

  const amigasLendo = lendo.length ? (
    <ul className="flex gap-4 overflow-x-auto pb-1">
      {lendo.map(({ pessoa, livro }) => (
        <li key={pessoa.id} className="w-[58px] flex-none text-center">
          <Link href={`/livro/${livro.id}`} aria-label={`${nomeDe(pessoa)} está lendo ${livro.titulo}`}>
            <CapaLivro titulo={livro.titulo} capa={livro.capa} cor={corDoLivro(livro.id)} className="w-full [&>span:last-child]:hidden" />
          </Link>
          <Link href={pessoa.usuario ? `/u/${pessoa.usuario}` : "#"} className="mt-1.5 flex items-center justify-center gap-1">
            <Avatar pessoa={pessoa} tamanho={14} className="!text-[7px]" />
            <span className="truncate font-accent text-xs italic">{pessoa.nome || pessoa.usuario}</span>
          </Link>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <>
      {amigasLendo ? (
        <section className="mt-6 px-6 lg:hidden">
          <p className="eyebrow !text-[10px] text-bordo">lendo agora entre amigas</p>
          <div className="mt-3">{amigasLendo}</div>
        </section>
      ) : null}

      <div className="mt-6 flex gap-1.5 px-6 lg:mt-0 lg:px-0" role="group" aria-label="filtrar o feed">
        {(["tudo", "resenhas", "listas"] as Filtro[]).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filtro === f}
            onClick={() => setFiltro(f)}
            className={`min-h-9 rounded-pill border px-3.5 text-[11px] font-semibold ${
              filtro === f ? "border-bordo bg-bordo text-creme" : "border-bege bg-creme-quente text-ameixa lg:bg-transparent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3 px-6 lg:px-0">
        {!atividades.length ? (
          <Vazio
            titulo="suas amigas aparecem aqui"
            texto="siga quem você conhece para ver o que estão lendo, as notas e as resenhas."
            acao={{ href: "/pessoas", rotulo: "buscar pessoas" }}
          />
        ) : !visiveis.length ? (
          <p className="py-6 text-center font-accent text-sm italic text-cinza">nada por aqui com esse filtro.</p>
        ) : (
          visiveis.map((a) => <CartaoAtividade key={a.id} a={a} pessoa={pessoas.get(a.autor) ?? null} />)
        )}
      </div>
      {visiveis.length ? <p className="py-8 text-center font-accent text-[13px] italic text-cinza">você está em dia ✦</p> : null}
    </>
  );
}

function AmigasLendoWeb() {
  const lendo = useConsulta(() => lendoEntreAmigas(), []);
  if (!lendo.dados?.length) return null;
  return (
    <div className="rounded-[4px] border border-fio p-5">
      <p className="mb-3 text-[10px] font-semibold tracking-[.18em] text-grafite uppercase">lendo agora entre amigas</p>
      <ul className="flex flex-wrap gap-3.5">
        {lendo.dados.map(({ pessoa, livro }) => (
          <li key={pessoa.id} className="w-12 text-center">
            <Link href={`/livro/${livro.id}`} onClick={() => lembrarLivros([livro])} aria-label={`${nomeDe(pessoa)} está lendo ${livro.titulo}`}>
              <CapaLivro titulo={livro.titulo} capa={livro.capa} cor={corDoLivro(livro.id)} className="w-full [&>span:last-child]:hidden" />
            </Link>
            <Link href={pessoa.usuario ? `/u/${pessoa.usuario}` : "#"} className="mt-1.5 block truncate font-revista text-xs italic">
              {pessoa.nome || pessoa.usuario}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function InicioPage() {
  const hidratado = useHidratado();
  const nome = usePerfil((s) => s.nome);
  const bookside = usePerfil((s) => s.bookside);
  const livros = usePerfil((s) => s.livros);

  if (!hidratado) return <AppShell aba="inicio">{null}</AppShell>;
  const citacao = citacaoDoDia();
  const lendo = livros.find((l) => !l.status || l.status === "lendo");
  const lidos = livros.filter((l) => l.status === "lido");
  const paginas = lidos.reduce((t, l) => t + (l.paginas ?? 0), 0);
  const notas = lidos.filter((l) => l.nota).map((l) => l.nota!);
  const media = notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1).replace(".", ",") : "—";

  return (
    <AppShell aba="inicio">
      <div className="flex flex-1 flex-col pb-6 lg:bg-jornal lg:px-12 lg:py-8">
        <header className="flex items-center justify-between px-6 pt-3 lg:mb-7 lg:px-0 lg:pt-0">
          <span className="text-[13px] font-semibold text-ameixa lg:hidden">amigas</span>
          <h1 className="hidden font-revista text-[26px] leading-none italic text-tinta lg:block">olá, {nome || "leitora"}</h1>
          <Icones />
        </header>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10">
          <div>
            {/* citação do dia */}
            <figure className="mx-6 mt-3 animate-subir rounded-xl bg-bordo px-[18px] py-4 text-creme lg:mx-0 lg:mt-0 lg:mb-7 lg:rounded-[4px] lg:bg-vinho lg:px-7 lg:py-6">
              <p className="text-[10px] font-semibold tracking-[.16em] text-rosa-claro uppercase">citação do dia</p>
              <blockquote className="mt-2.5 font-accent text-[21px] leading-[1.3] italic lg:font-revista lg:text-[26px]">“{citacao.texto}”</blockquote>
              <figcaption className="mt-2.5 text-[10px] font-semibold tracking-[.1em] text-rosa-claro">
                {citacao.livro} · {citacao.autor}
              </figcaption>
            </figure>

            {lendo ? (
              <Link
                href={`/livro/${lendo.id}/progresso`}
                className="mb-7 hidden items-center gap-4 rounded-[4px] border border-fio p-5 hover:bg-[#F3ECDF] lg:flex"
              >
                <CapaLivro titulo={lendo.titulo} capa={lendo.capa} cor={corDoLivro(lendo.id)} className="w-11 [&>span:last-child]:hidden" />
                <span>
                  <span className="block text-[10px] font-semibold tracking-[.18em] text-grafite uppercase">você está lendo</span>
                  <span className="mt-1 block font-revista text-xl italic">{lendo.titulo}</span>
                  <span className="mt-0.5 block text-xs text-grafite">
                    {lendo.autor}
                    {lendo.paginas && lendo.paginaAtual ? ` · página ${lendo.paginaAtual} de ${lendo.paginas}` : " · quantas páginas já foram? atualizar →"}
                  </span>
                </span>
              </Link>
            ) : null}

            {!bookside ? (
              <div className="mx-6 mt-5 lg:hidden">
                <BannerTeste />
              </div>
            ) : null}

            <p className="mb-3.5 hidden text-[10px] font-semibold tracking-[.18em] text-grafite uppercase lg:block">feed</p>
            <ComConta>
              <Feed />
            </ComConta>
          </div>

          <aside className="hidden space-y-5 lg:block">
            {!bookside ? <BannerTeste /> : null}
            <ComConta carregando={null}>
              <AmigasLendoWeb />
            </ComConta>
            <Link href="/numeros" className="block rounded-[4px] border border-fio p-5 hover:bg-[#F3ECDF]">
              <p className="mb-2.5 text-[10px] font-semibold tracking-[.18em] text-grafite uppercase">seus números</p>
              <div className="grid grid-cols-3 border-y border-fio">
                {[
                  { n: lidos.length, r: "livros" },
                  { n: paginas.toLocaleString("pt-BR"), r: "páginas" },
                  { n: media === "—" ? media : `${media}★`, r: "média" },
                ].map((s, i) => (
                  <span key={s.r} className={`py-3 text-center ${i ? "border-l border-fio" : ""}`}>
                    <b className="block font-revista text-[22px] leading-none font-normal">{s.n}</b>
                    <span className="text-[9px] font-semibold tracking-[.1em] text-grafite uppercase">{s.r}</span>
                  </span>
                ))}
              </div>
            </Link>
            <Link href="/pessoas" className="block rounded-[4px] border border-fio p-5 hover:bg-[#F3ECDF]">
              <p className="font-revista text-[17px] italic">encontrar amigas</p>
              <p className="mt-1 text-xs text-grafite">busque pelo nome ou pelo @usuário →</p>
            </Link>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
