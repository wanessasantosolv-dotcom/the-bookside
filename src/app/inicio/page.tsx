"use client";

import { CapaAuto } from "@/components/CapaAuto";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import {
  Carregando,
  ComConta,
  ErroOuFalta,
  Vazio,
} from "@/components/social/Estados";
import { Avatar, CartaoAtividade } from "@/components/social/Pessoas";
import { lembrarLivros } from "@/lib/catalogo";
import { citacaoDoDia } from "@/lib/citacoes";
import { useIndicacoes } from "@/lib/indicacoes";
import { corDoLivro } from "@/lib/cores";
import { usePerfil } from "@/lib/perfil-store";
import {
  feedDeAmigas,
  lendoEntreAmigas,
  nomeDe,
  pessoasPorId,
  useConsulta,
} from "@/lib/social";

type Filtro = "tudo" | "resenhas" | "listas";

const iconeLink =
  "flex min-h-11 items-center gap-2 rounded-pill px-3 text-[13px] font-semibold text-bordo hover:bg-rosa-fundo";

/**
 * Topo do início: saudação com a data; à direita, buscar, novidades e a sua foto
 * (que leva ao perfil). No computador, os botões têm o nome escrito.
 */
function Topo({ nome }: { nome: string }) {
  const foto = usePerfil((s) => s.foto);
  const usuario = usePerfil((s) => s.usuario);
  const hoje = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <header className="flex items-center justify-between gap-3 px-6 pt-3 lg:mb-7 lg:px-0 lg:pt-0">
      <div className="min-w-0">
        <h1 className="truncate font-display text-[22px] leading-tight font-semibold italic text-bordo lg:font-revista lg:text-[30px] lg:font-normal lg:text-tinta">
          olá, {nome || "leitora"}
        </h1>
        <p className="mt-0.5 text-[11px] text-cinza lg:text-xs">{hoje}</p>
      </div>
      <nav
        aria-label="atalhos"
        className="-mr-2 flex flex-none items-center gap-0.5 lg:mr-0 lg:gap-1.5"
      >
        <Link href="/buscar" aria-label="buscar livros" className={iconeLink}>
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="hidden lg:inline">buscar livros</span>
        </Link>
        <Link href="/novidades" aria-label="novidades" className={iconeLink}>
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <span className="hidden lg:inline">novidades</span>
        </Link>
        <Link
          href="/perfil"
          aria-label="seu perfil"
          className="ml-1 flex size-11 items-center justify-center"
        >
          <Avatar
            pessoa={{ id: "eu", usuario, nome, foto }}
            tamanho={36}
            className="border border-linha"
          />
        </Link>
      </nav>
    </header>
  );
}

/** "pra você ✦": a primeira indicação do dia, que leva à tela de indicações. */
function IndicacaoDoDia() {
  const { lista, carregando } = useIndicacoes();
  const livro = lista[0];
  if (carregando || !livro) return null;
  return (
    <Link
      href="/descobrir"
      className="flex items-center gap-4 rounded-xl border border-linha bg-creme-quente p-4 hover:border-bordo lg:rounded-[4px] lg:border-fio lg:bg-transparent lg:p-5 lg:hover:bg-[#F3ECDF]"
    >
      <CapaLivro
        titulo={livro.titulo}
        capa={livro.capa}
        cor={livro.cor}
        className="w-12 flex-none [&>span:last-child]:hidden"
      />
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold tracking-[.16em] text-bordo uppercase">
          pra você ✦
        </span>
        <span className="mt-1 block truncate font-display text-[17px] font-semibold italic lg:font-revista lg:font-normal">
          {livro.titulo}
        </span>
        <span className="mt-0.5 block truncate text-xs text-cinza">
          {livro.motivo}
        </span>
        <span className="mt-1.5 block text-[11px] font-bold tracking-[.1em] text-bordo uppercase">
          ver indicações →
        </span>
      </span>
    </Link>
  );
}

function BannerTeste() {
  return (
    <Link
      href="/teste"
      className="block rounded-xl border border-dashed border-ouro bg-creme-quente p-4 lg:rounded-[4px] lg:bg-transparent lg:p-5"
    >
      <p className="text-[10px] font-semibold tracking-[.16em] text-bordo uppercase">
        ✦ ainda não fez o teste?
      </p>
      <p className="mt-2 font-display text-[17px] leading-[1.2] font-semibold italic text-ameixa lg:font-revista lg:text-[19px] lg:font-normal">
        descubra seu bookside
      </p>
      <p className="mt-1.5 font-accent text-sm italic text-cinza lg:font-texto lg:text-xs lg:not-italic">
        15 perguntas, 8 arquétipos — e um universo literário só seu.
      </p>
      <p className="mt-2.5 text-[11px] font-bold tracking-[.1em] text-bordo uppercase">
        fazer o teste →
      </p>
    </Link>
  );
}

function Feed() {
  const [filtro, setFiltro] = useState<Filtro>("tudo");
  const feed = useConsulta(async () => {
    const [atividades, lendo] = await Promise.all([
      feedDeAmigas(),
      lendoEntreAmigas(),
    ]);
    const pessoas = await pessoasPorId(atividades.map((a) => a.autor));
    lembrarLivros([
      ...atividades.map((a) => a.livro),
      ...lendo.map((l) => l.livro),
    ]);
    return { atividades, lendo, pessoas };
  }, []);

  if (feed.carregando && !feed.dados) return <Carregando />;
  if (feed.erro)
    return <ErroOuFalta erro={feed.erro} onTentar={feed.recarregar} />;
  const { atividades, lendo, pessoas } = feed.dados!;
  const visiveis = atividades.filter((a) =>
    filtro === "resenhas"
      ? !!a.texto
      : filtro === "listas"
        ? a.tipo === "quer"
        : true,
  );

  const amigasLendo = lendo.length ? (
    <ul className="flex gap-4 overflow-x-auto pb-1">
      {lendo.map(({ pessoa, livro }) => (
        <li key={pessoa.id} className="w-[58px] flex-none text-center">
          <Link
            href={`/livro/${livro.id}`}
            aria-label={`${nomeDe(pessoa)} está lendo ${livro.titulo}`}
          >
            <CapaAuto
              livro={livro}
              className="w-full [&>span:last-child]:hidden"
            />
          </Link>
          <Link
            href={pessoa.usuario ? `/u/${pessoa.usuario}` : "#"}
            className="mt-1.5 flex items-center justify-center gap-1"
          >
            <Avatar pessoa={pessoa} tamanho={14} className="!text-[7px]" />
            <span className="truncate font-accent text-xs italic">
              {pessoa.nome || pessoa.usuario}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <>
      {amigasLendo ? (
        <section className="mt-6 px-6 lg:hidden">
          <p className="eyebrow !text-[10px] text-bordo">
            lendo agora entre amigas
          </p>
          <div className="mt-3">{amigasLendo}</div>
        </section>
      ) : null}

      <div
        className="mt-6 flex gap-1.5 px-6 lg:mt-0 lg:px-0"
        role="group"
        aria-label="filtrar o feed"
      >
        {(["tudo", "resenhas", "listas"] as Filtro[]).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filtro === f}
            onClick={() => setFiltro(f)}
            className={`min-h-9 rounded-pill border px-3.5 text-[11px] font-semibold ${
              filtro === f
                ? "border-bordo bg-bordo text-creme"
                : "border-bege bg-creme-quente text-ameixa lg:bg-transparent"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3 px-6 lg:px-0">
        {!atividades.length ? (
          <Vazio
            titulo="suas leituras e as das amigas aparecem aqui"
            texto="marque o que está lendo ou avalie um livro, e siga quem você conhece para ver o que estão lendo."
            acao={{ href: "/pessoas", rotulo: "buscar pessoas" }}
          />
        ) : !visiveis.length ? (
          <p className="py-6 text-center font-accent text-sm italic text-cinza">
            nada por aqui com esse filtro.
          </p>
        ) : (
          visiveis.map((a) => (
            <CartaoAtividade
              key={a.id}
              a={a}
              pessoa={pessoas.get(a.autor) ?? null}
            />
          ))
        )}
      </div>
      {visiveis.length ? (
        <p className="py-8 text-center font-accent text-[13px] italic text-cinza">
          você está em dia ✦
        </p>
      ) : null}
    </>
  );
}

function AmigasLendoWeb() {
  const lendo = useConsulta(() => lendoEntreAmigas(), []);
  if (!lendo.dados?.length) return null;
  return (
    <div className="rounded-[4px] border border-fio p-5">
      <p className="mb-3 text-[10px] font-semibold tracking-[.18em] text-grafite uppercase">
        lendo agora entre amigas
      </p>
      <ul className="flex flex-wrap gap-3.5">
        {lendo.dados.map(({ pessoa, livro }) => (
          <li key={pessoa.id} className="w-12 text-center">
            <Link
              href={`/livro/${livro.id}`}
              onClick={() => lembrarLivros([livro])}
              aria-label={`${nomeDe(pessoa)} está lendo ${livro.titulo}`}
            >
              <CapaAuto
                livro={livro}
                className="w-full [&>span:last-child]:hidden"
              />
            </Link>
            <Link
              href={pessoa.usuario ? `/u/${pessoa.usuario}` : "#"}
              className="mt-1.5 block truncate font-revista text-xs italic"
            >
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

  return (
    <AppShell aba="inicio">
      <div className="flex flex-1 flex-col pb-6 lg:bg-jornal lg:px-12 lg:py-8">
        <Topo nome={nome} />

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10">
          <div>
            {/* citação do dia */}
            <figure className="mx-6 mt-3 animate-subir rounded-xl bg-bordo px-[18px] py-4 text-creme lg:mx-0 lg:mt-0 lg:mb-7 lg:rounded-[4px] lg:bg-vinho lg:px-7 lg:py-6">
              <p className="text-[10px] font-semibold tracking-[.16em] text-rosa-claro uppercase">
                citação do dia
              </p>
              <blockquote className="mt-2.5 font-accent text-[21px] leading-[1.3] italic lg:font-revista lg:text-[26px]">
                “{citacao.texto}”
              </blockquote>
              <figcaption className="mt-2.5 text-[10px] font-semibold tracking-[.1em] text-rosa-claro">
                {citacao.livro} · {citacao.autor}
              </figcaption>
            </figure>

            {lendo ? (
              <Link
                href={`/livro/${lendo.id}/progresso`}
                className="mb-7 hidden items-center gap-4 rounded-[4px] border border-fio p-5 hover:bg-[#F3ECDF] lg:flex"
              >
                <CapaLivro
                  titulo={lendo.titulo}
                  capa={lendo.capa}
                  cor={corDoLivro(lendo.id)}
                  className="w-11 [&>span:last-child]:hidden"
                />
                <span>
                  <span className="block text-[10px] font-semibold tracking-[.18em] text-grafite uppercase">
                    você está lendo
                  </span>
                  <span className="mt-1 block font-revista text-xl italic">
                    {lendo.titulo}
                  </span>
                  <span className="mt-0.5 block text-xs text-grafite">
                    {lendo.autor}
                    {lendo.paginas && lendo.paginaAtual
                      ? ` · página ${lendo.paginaAtual} de ${lendo.paginas}`
                      : " · quantas páginas já foram? atualizar →"}
                  </span>
                </span>
              </Link>
            ) : null}

            <div className="mx-6 mt-4 lg:hidden">
              <IndicacaoDoDia />
            </div>

            {!bookside ? (
              <div className="mx-6 mt-5 lg:hidden">
                <BannerTeste />
              </div>
            ) : null}

            <p className="mb-3.5 hidden text-[10px] font-semibold tracking-[.18em] text-grafite uppercase lg:block">
              feed
            </p>
            <ComConta>
              <Feed />
            </ComConta>
          </div>

          <aside className="hidden space-y-5 lg:block">
            {!bookside ? <BannerTeste /> : null}
            <AmigasLendoWeb />
            <IndicacaoDoDia />
            <Link
              href="/pessoas"
              className="block rounded-[4px] border border-fio p-5 hover:bg-[#F3ECDF]"
            >
              <p className="font-revista text-[17px] italic">
                encontrar amigas
              </p>
              <p className="mt-1 text-xs text-grafite">
                busque pelo nome ou pelo @usuário →
              </p>
            </Link>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
