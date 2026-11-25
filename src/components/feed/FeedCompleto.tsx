"use client";

import Link from "next/link";
import { CapaAuto } from "@/components/CapaAuto";
import { CapaLivro } from "@/components/CapaLivro";
import { Carregando, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { Avatar, CartaoAtividade } from "@/components/social/Pessoas";
import { lembrarLivros } from "@/lib/catalogo";
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

/* O feed inteiro das pessoas que você segue (antes ficava no início). */

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
    "flex w-[220px] flex-none items-center gap-3.5 rounded-xl border border-linha bg-creme-quente p-3.5 hover:border-bordo lg:w-auto lg:rounded-[4px] lg:border-fio lg:bg-transparent lg:p-4 lg:hover:bg-papel";
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

export function FeedCompleto() {
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
  const visiveis = atividades;

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
            lendo agora entre amigos
          </p>
          <div className="mt-3">{amigasLendo}</div>
        </section>
      ) : null}

      <Destaques mesmos={mesmos} />

      <div className="mt-6 space-y-3 px-6 lg:mt-5 lg:px-0">
        {!atividades.length ? (
          <Vazio
            titulo="suas leituras e as dos amigos aparecem aqui"
            texto="marque o que está lendo ou avalie um livro, e siga quem você conhece para ver o que estão lendo."
            acao={{ href: "/pessoas", rotulo: "buscar pessoas" }}
          />
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

