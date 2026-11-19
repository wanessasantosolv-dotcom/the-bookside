"use client";

import { CapaAuto } from "@/components/CapaAuto";
import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ConviteTeste } from "@/components/ConviteTeste";
import { LendoAgora } from "@/components/feed/LendoAgora";
import { Publicar } from "@/components/feed/Publicar";
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
import { arquetipos } from "@/lib/teste";
import { useIndicacoes } from "@/lib/indicacoes";
import { corDoLivro } from "@/lib/cores";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";
import {
  feedDeAmigas,
  lendoEntreAmigas,
  lendoOMesmo,
  nomeDe,
  pessoasPorId,
  quandoFoi,
  useConsulta,
  useMeuId,
  type Atividade,
  type PessoaResumo,
} from "@/lib/social";

type Filtro = "tudo" | "resenhas" | "listas" | "clubes";

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
        <Link href="/pessoas" aria-label="encontrar pessoas" className={iconeLink}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="9" cy="8" r="4" />
            <path d="M2 21c1-4 3.8-6 7-6s6 2 7 6" />
            <path d="M19 8v6M16 11h6" />
          </svg>
          <span className="hidden lg:inline">encontrar pessoas</span>
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
function IndicacaoDoDia({ compacto = false }: { compacto?: boolean } = {}) {
  const { lista, carregando } = useIndicacoes();
  const livro = lista[0];
  if (carregando || !livro) return null;
  if (compacto)
    return (
      <Link
        href="/descobrir"
        className="flex w-[172px] flex-none flex-col rounded-[14px] border border-linha bg-creme-quente p-3"
      >
        <div className="flex items-center gap-2.5">
          <CapaLivro
            titulo={livro.titulo}
            capa={livro.capa}
            cor={livro.cor}
            className="w-9 flex-none [&>span:last-child]:hidden"
          />
          <span className="block text-[9.5px] font-semibold tracking-[.16em] text-bordo uppercase">
            recomendação ✦
          </span>
        </div>
        <span className="mt-2 block font-display text-[13px] leading-snug font-semibold italic [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
          {livro.titulo}
        </span>
      </Link>
    );
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

/** O convite para o teste "que tipo de leitora você é?" (ou, depois de feito, o resultado). */
function BannerTeste({
  principal,
  compacto = false,
}: {
  principal?: string;
  compacto?: boolean;
}) {
  const arq = principal
    ? arquetipos[principal as keyof typeof arquetipos]
    : null;
  if (arq)
    return (
      <Link
        href="/teste/resultado"
        className={
          compacto
            ? "flex w-[172px] flex-none flex-col rounded-[14px] border border-linha bg-creme-quente p-3"
            : "flex items-center gap-3 rounded-xl border border-linha bg-creme-quente p-4 hover:border-bordo lg:rounded-[4px] lg:bg-transparent lg:hover:bg-[#F3ECDF]"
        }
      >
        <span
          aria-hidden
          className={
            compacto
              ? "mb-1.5 flex size-6 items-center justify-center rounded-full bg-rosa-fundo font-display text-xs text-bordo"
              : "flex size-10 flex-none items-center justify-center rounded-full bg-rosa-fundo font-display text-lg text-bordo"
          }
        >
          ✦
        </span>
        <span className="min-w-0">
          <span
            className={
              compacto
                ? "block text-[9.5px] font-semibold tracking-[.16em] text-bordo uppercase"
                : "block text-[10px] font-semibold tracking-[.16em] text-bordo uppercase"
            }
          >
            seu tipo de leitora
          </span>
          <span
            className={
              compacto
                ? "mt-0.5 block truncate font-display text-[13px] font-semibold italic"
                : "mt-0.5 block truncate font-display text-[17px] font-semibold italic lg:font-revista lg:font-normal"
            }
          >
            {arq.nome}
          </span>
          {!compacto ? (
            <span className="block text-xs text-cinza">
              resultado do teste · ver ou refazer →
            </span>
          ) : null}
        </span>
      </Link>
    );
  if (compacto)
    return (
      <Link
        href="/teste"
        className="flex w-[172px] flex-none flex-col rounded-[14px] border border-linha bg-creme-quente p-3"
      >
        <span
          aria-hidden
          className="mb-1.5 flex size-6 items-center justify-center rounded-full bg-rosa-fundo font-display text-xs text-bordo"
        >
          ✦
        </span>
        <span className="block text-[9.5px] font-semibold tracking-[.16em] text-bordo uppercase">
          teste · 3 min
        </span>
        <span className="mt-0.5 block font-display text-[13px] font-semibold italic">
          que tipo de leitora você é?
        </span>
      </Link>
    );
  return <ConviteTeste />;
}

/** Junta atualizações seguidas da mesma pessoa e do mesmo tipo (ex.: "quer ler 4 livros"). */
type ItemFeed =
  | { tipo: "um"; a: Atividade }
  | { tipo: "grupo"; itens: Atividade[] };
const agrupaveis = new Set(["quer", "comecou", "terminou"]);
function agrupar(lista: Atividade[]): ItemFeed[] {
  const saida: ItemFeed[] = [];
  for (const a of lista) {
    const ultimo = saida[saida.length - 1];
    const base =
      ultimo?.tipo === "grupo"
        ? ultimo.itens[0]
        : ultimo?.tipo === "um"
          ? ultimo.a
          : null;
    const simples = (x: Atividade) =>
      agrupaveis.has(x.tipo) && !x.texto && !x.nota && !x.clube_id;
    const junta =
      !!base &&
      simples(a) &&
      simples(base) &&
      base.autor === a.autor &&
      base.tipo === a.tipo &&
      Math.abs(
        new Date(base.criado_em).getTime() - new Date(a.criado_em).getTime(),
      ) <
        12 * 3600e3;
    if (junta && ultimo.tipo === "grupo") ultimo.itens.push(a);
    else if (junta && ultimo.tipo === "um")
      saida[saida.length - 1] = { tipo: "grupo", itens: [ultimo.a, a] };
    else saida.push({ tipo: "um", a });
  }
  return saida;
}

const rotuloGrupo: Record<string, (n: number) => string> = {
  quer: (n) => `quer ler ${n} livros`,
  comecou: (n) => `começou a ler ${n} livros`,
  terminou: (n) => `terminou ${n} livros`,
};

function CartaoGrupo({
  itens,
  pessoa,
  eu,
}: {
  itens: Atividade[];
  pessoa: PessoaResumo | null;
  eu: string | null;
}) {
  const a = itens[0];
  const perfil = pessoa?.usuario ? `/u/${pessoa.usuario}` : "#";
  return (
    <article className="rounded-xl border border-linha bg-creme-quente p-4 lg:rounded-[4px] lg:border-fio lg:bg-transparent lg:p-5">
      <div className="flex items-center gap-2.5">
        <Link href={perfil}>
          <Avatar pessoa={pessoa} tamanho={30} />
        </Link>
        <p className="min-w-0 truncate text-xs font-semibold lg:text-[13px]">
          <Link href={perfil}>{a.autor === eu ? "você" : nomeDe(pessoa)}</Link>{" "}
          <span className="font-normal text-cinza">
            {rotuloGrupo[a.tipo](itens.length)}
          </span>
        </p>
        <span className="ml-auto flex-none text-[10px] font-semibold tracking-[.12em] text-cinza uppercase">
          {quandoFoi(a.criado_em)}
        </span>
      </div>
      <ul className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
        {itens.map((x) => (
          <li key={x.id} className="w-[64px] flex-none">
            <Link
              href={`/livro/${x.livro.id}`}
              onClick={() => lembrarLivros([x.livro])}
              title={x.livro.titulo}
            >
              <CapaAuto
                livro={x.livro}
                className="w-full [&>span:last-child]:hidden"
              />
              <span className="mt-1 line-clamp-2 block text-[11px] leading-tight text-cinza">
                {x.livro.titulo}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </article>
  );
}

/** Destaques do topo do feed: lembrança e amigas lendo o mesmo livro. */
function Destaques({
  mesmos,
}: {
  mesmos: { pessoa: PessoaResumo; livro: LivroSalvo }[];
}) {
  const livros = usePerfil((s) => s.livros);
  const agora = new Date();
  const ano = agora.getFullYear();

  // lembrança: um livro terminado nesta mesma época (até 3 dias de diferença) em outro ano
  const lembranca = livros
    .filter((l) => l.status === "lido" && l.lidoEm)
    .map((l) => ({ l, d: new Date(l.lidoEm!) }))
    .filter(({ d }) => {
      if (d.getFullYear() >= ano) return false;
      const mesmoDia = new Date(ano, d.getMonth(), d.getDate());
      return Math.abs(mesmoDia.getTime() - agora.getTime()) <= 3 * 864e5;
    })
    .sort((x, y) => y.d.getTime() - x.d.getTime())[0];

  const cartao =
    "flex w-[220px] flex-none items-center gap-3.5 rounded-xl border border-linha bg-creme-quente p-3.5 hover:border-bordo lg:w-auto lg:rounded-[4px] lg:border-fio lg:bg-transparent lg:p-4 lg:hover:bg-[#F3ECDF]";
  const rotulo =
    "block text-[10px] font-semibold tracking-[.16em] text-bordo uppercase";

  const itens = [];
  if (lembranca) {
    const anos = ano - lembranca.d.getFullYear();
    itens.push(
      <Link
        key="lembranca"
        href={`/livro/${lembranca.l.id}`}
        className={cartao}
      >
        <CapaLivro
          titulo={lembranca.l.titulo}
          capa={lembranca.l.capa}
          cor={corDoLivro(lembranca.l.id)}
          className="w-10 flex-none [&>span:last-child]:hidden"
        />
        <span className="min-w-0">
          <span className={rotulo}>lembrança ✦</span>
          <span className="mt-0.5 block text-[13px]">
            há {anos === 1 ? "1 ano" : `${anos} anos`} você terminou{" "}
            <i className="font-accent">{lembranca.l.titulo}</i>
            {lembranca.l.nota ? (
              <span className="ml-1 text-bordo">
                {"★".repeat(Math.round(lembranca.l.nota))}
              </span>
            ) : null}
          </span>
        </span>
      </Link>,
    );
  }
  for (const { pessoa, livro } of mesmos.slice(0, 2))
    itens.push(
      <Link
        key={`mesmo-${pessoa.id}`}
        href={pessoa.usuario ? `/u/${pessoa.usuario}` : "#"}
        className={cartao}
      >
        <Avatar pessoa={pessoa} tamanho={34} />
        <span className="min-w-0">
          <span className={rotulo}>lendo junto</span>
          <span className="mt-0.5 block text-[13px]">
            <b className="font-semibold">{nomeDe(pessoa)}</b> também está lendo{" "}
            <i className="font-accent">{livro.titulo}</i>
          </span>
        </span>
      </Link>,
    );
  if (!itens.length) return null;
  return (
    <div className="mt-5 flex gap-2.5 overflow-x-auto px-6 pb-1 lg:mt-0 lg:mb-6 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0 lg:pb-0">
      {itens}
    </div>
  );
}

function Feed() {
  const [filtro, setFiltro] = useState<Filtro>("tudo");
  const eu = useMeuId();
  const feed = useConsulta(async () => {
    const meusLendo = usePerfil
      .getState()
      .livros.filter((l) => l.status === "lendo")
      .map((l) => ({ id: l.id, titulo: l.titulo }));
    const [atividades, lendo, mesmos] = await Promise.all([
      feedDeAmigas(),
      lendoEntreAmigas(),
      lendoOMesmo(meusLendo).catch(() => []),
    ]);
    const pessoas = await pessoasPorId(atividades.map((a) => a.autor));
    lembrarLivros([
      ...atividades.map((a) => a.livro),
      ...lendo.map((l) => l.livro),
    ]);
    return { atividades, lendo, pessoas, mesmos };
  }, []);

  if (feed.carregando && !feed.dados) return <Carregando />;
  if (feed.erro)
    return <ErroOuFalta erro={feed.erro} onTentar={feed.recarregar} />;
  const { atividades, lendo, pessoas, mesmos } = feed.dados!;
  const visiveis = atividades.filter((a) =>
    filtro === "resenhas"
      ? !!a.texto && a.tipo !== "progresso" && a.tipo !== "clube"
      : filtro === "listas"
        ? a.tipo === "quer"
        : filtro === "clubes"
          ? !!a.clube_id
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

      <Destaques mesmos={mesmos} />

      <div
        className="mt-6 flex gap-1.5 px-6 lg:mt-0 lg:px-0"
        role="group"
        aria-label="filtrar o feed"
      >
        {(["tudo", "resenhas", "listas", "clubes"] as Filtro[]).map((f) => (
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
          agrupar(visiveis).map((item) =>
            item.tipo === "grupo" ? (
              <CartaoGrupo
                key={item.itens[0].id}
                itens={item.itens}
                pessoa={pessoas.get(item.itens[0].autor) ?? null}
                eu={eu}
              />
            ) : (
              <CartaoAtividade
                key={item.a.id}
                a={item.a}
                pessoa={pessoas.get(item.a.autor) ?? null}
              />
            ),
          )
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
  const [versaoFeed, setVersaoFeed] = useState(0);

  if (!hidratado) return <AppShell aba="inicio">{null}</AppShell>;
  const citacao = citacaoDoDia();

  return (
    <AppShell aba="inicio">
      <div className="flex flex-1 flex-col pb-6 lg:bg-jornal lg:px-12 lg:py-8">
        <Topo nome={nome} />

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-10">
          <div>
            {/* ===== hoje: citação + lendo num card só (celular e computador) ===== */}
            <div className="relative mx-6 mt-3 animate-subir overflow-hidden rounded-xl bg-gradient-to-br from-bordo to-bordo-escuro px-[18px] py-4 text-creme lg:mx-0 lg:mt-0 lg:mb-7 lg:rounded-[4px] lg:px-8 lg:py-7">
              <span
                aria-hidden
                className="pointer-events-none absolute -top-5 right-1 font-display text-[92px] leading-none text-rosa-claro/15 italic lg:-top-9 lg:text-[140px]"
              >
                “
              </span>
              <p className="flex items-center gap-1.5 text-[10px] font-semibold tracking-[.16em] text-rosa-claro uppercase">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ouro" />
                citação do dia
              </p>
              <blockquote className="relative mt-2.5 font-accent text-[21px] leading-[1.3] italic lg:font-revista lg:text-[28px]">
                “{citacao.texto}”
              </blockquote>
              <figcaption className="relative mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold tracking-[.1em] text-rosa-claro">
                <span aria-hidden className="h-px w-3.5 bg-rosa-claro/50" />
                {citacao.livro} · {citacao.autor}
              </figcaption>
              <div className="relative mt-4 border-t border-creme/15 pt-4 lg:mt-6 lg:pt-6">
                <LendoAgora tema="escura" semCartao />
              </div>
            </div>

            {/* ===== trilha "pra você" (só no celular — no computador isso mora na coluna lateral) ===== */}
            <div className="mt-3.5 flex gap-2.5 overflow-x-auto px-6 pb-1 lg:hidden">
              <IndicacaoDoDia compacto />
              <BannerTeste compacto principal={bookside?.principal} />
            </div>

            <p className="mt-5 mb-3 px-6 text-[10px] font-semibold tracking-[.18em] text-bordo uppercase lg:hidden">
              feed
            </p>
            <p className="mb-3.5 hidden text-[10px] font-semibold tracking-[.18em] text-grafite uppercase lg:block">
              feed
            </p>
            <ComConta>
              <div className="mx-6 mb-5 lg:mx-0">
                <Publicar onPublicado={() => setVersaoFeed((v) => v + 1)} />
              </div>
              <Feed key={versaoFeed} />
            </ComConta>
          </div>

          <aside className="hidden space-y-5 lg:block">
            <BannerTeste principal={bookside?.principal} />
            <AmigasLendoWeb />
            <IndicacaoDoDia />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
