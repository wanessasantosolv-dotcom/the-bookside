"use client";

import { Voltar } from "@/components/Voltar";
import { Animacao } from "@/components/Animacao";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import {
  clube,
  membrosDe,
  tirarMembro,
  type Clube,
  type Membro,
  type Papel,
} from "@/lib/clubes";
import { temas } from "@/lib/dados";
import { coresDoTema } from "@/lib/tema";
import { useConsulta, useMeuId } from "@/lib/social";

type Ctx = {
  clube: Clube;
  membros: Membro[];
  papel: Papel | null;
  recarregar: () => void;
};
const Contexto = createContext<Ctx | null>(null);

export function useClube() {
  const c = useContext(Contexto);
  if (!c) throw new Error("useClube fora do clube");
  return c;
}

/** largura do clube no computador: ocupa a tela toda, com capa, título e conteúdo alinhados */
const largura = "lg:w-full lg:px-12 xl:px-16";

const abas = [
  { id: "", r: "início" },
  { id: "feed", r: "feed" },
  { id: "biblioteca", r: "biblioteca" },
  { id: "leitura", r: "leitura" },
  { id: "agenda", r: "agenda" },
];

function Menu({ c, papel }: { c: Clube; papel: Papel | null }) {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();
  const eu = useMeuId();
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) =>
      !caixa.current?.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);

  async function sair() {
    if (!eu || !confirm(`sair do clube ${c.nome}?`)) return;
    await tirarMembro(c.id, eu);
    router.push("/clubes");
  }

  const item =
    "flex min-h-11 w-full items-center px-4 text-left text-[13px] hover:bg-rosa-fundo";
  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        aria-label="opções do clube"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="flex size-11 items-center justify-center rounded-full text-bordo hover:bg-rosa-fundo"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {aberto ? (
        <div className="absolute top-12 right-0 z-30 w-56 overflow-hidden rounded-xl border border-linha bg-creme-quente py-1 shadow-[0_14px_30px_-16px_rgba(43,20,32,.45)]">
          {papel === "moderadora" ? (
            <Link href={`/clubes/${c.id}/editar`} className={item}>
              informações do clube
            </Link>
          ) : null}
          <Link href={`/clubes/${c.id}/convidar`} className={item}>
            convidar e membros
          </Link>
          <Link href={`/clubes/${c.id}/sugestoes`} className={item}>
            sugestões e votação
          </Link>
          <button type="button" onClick={sair} className={`${item} text-bordo`}>
            sair do clube
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Abas({ base, sublinhadas }: { base: string; sublinhadas?: boolean }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="seções do clube"
      className={
        sublinhadas
          ? "flex gap-6"
          : "-mx-6 mt-2 flex gap-1.5 overflow-x-auto px-6 pb-0.5 [scrollbar-width:none]"
      }
    >
      {abas.map((a) => {
        const href = a.id ? `${base}/${a.id}` : base;
        const on = pathname === href;
        return (
          <Link
            key={a.id}
            href={href}
            aria-current={on ? "page" : undefined}
            className={
              sublinhadas
                ? `flex min-h-10 items-center border-b-2 text-[10px] font-bold tracking-[.1em] uppercase ${
                    on
                      ? "border-vinho text-vinho"
                      : "border-transparent text-grafite hover:text-tinta"
                  }`
                : `flex min-h-9 flex-none items-center rounded-pill px-3.5 text-xs font-semibold ${
                    on
                      ? "bg-bordo text-creme"
                      : "border border-linha text-cinza hover:text-bordo"
                  }`
            }
          >
            {a.r}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Cabeçalho do clube. Celular: capa, nome e abas em pílulas.
 * Computador: na home, capa com o selo do clube e ações; nas outras abas,
 * a barra compacta do canvas (selo, nome, edição e abas sublinhadas).
 */
function Cabecalho({
  c,
  papel,
  rodada,
}: {
  c: Clube;
  papel: Papel | null;
  rodada: string | null;
}) {
  const pathname = usePathname();
  const base = `/clubes/${c.id}`;
  const inicio = pathname === base;
  const tema = c.tema ? (temas.find((t) => t.id === c.tema) ?? null) : null;
  const acao =
    "flex min-h-9 items-center rounded-pill border border-fio px-4 text-[10px] font-bold tracking-[.1em] text-tinta uppercase hover:border-vinho hover:text-vinho";
  return (
    <>
      {!inicio ? (
        <div className="hidden border-b border-fio lg:block">
          <div
            className={`${largura} flex items-center justify-between gap-6 py-4`}
          >
            <span className="flex items-center gap-5">
              <Voltar
                padrao={base}
                rotulo="voltar"
                className="-ml-2 flex min-h-11 items-center px-2 text-[11px] font-bold tracking-[.1em] text-grafite uppercase hover:text-vinho"
              />
              <Link
                href={base}
                className="flex items-center gap-3.5 border-l border-fio pl-5"
              >
                <span>
                  <span className="block font-revista text-xl leading-none italic">
                    {c.nome}
                  </span>
                  <span className="mt-1 block text-[11px] text-grafite">
                    {rodada ?? "clube de leitura"}
                  </span>
                </span>
              </Link>
            </span>
            <Abas base={base} sublinhadas />
          </div>
        </div>
      ) : null}

      <div className={inicio ? "" : "lg:hidden"}>
        {/* computador: capa de ponta a ponta, como no perfil (a faixa do meio, 5:1) */}
        <div className="relative">
          <div
            className={`aspect-[3/1] w-full bg-cover bg-center lg:aspect-[5/1] ${c.capa || tema ? "" : "pat-estrelas"}`}
            style={
              c.capa
                ? {
                    backgroundImage: `linear-gradient(rgba(43,20,32,.02),rgba(43,20,32,.14)), url("${c.capa}")`,
                  }
                : tema
                  ? { background: "escuro" in tema ? "#3A343B" : tema.fundo }
                  : undefined
            }
          />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-2 lg:px-10 lg:pt-4 xl:px-14">
            <Voltar
              padrao={inicio ? "/clubes" : base}
              rotulo={inicio ? "clubes" : "voltar"}
              className="flex min-h-11 items-center rounded-pill bg-creme/85 px-3 text-[11px] font-semibold tracking-[.14em] text-bordo uppercase"
            />
            <span className="rounded-pill bg-creme/85">
              <Menu c={c} papel={papel} />
            </span>
          </div>
        </div>
        <div
          className={`relative bg-creme px-6 pt-5 text-center lg:bg-jornal lg:text-left ${largura}`}
        >
          <div className="lg:flex lg:items-end lg:gap-5">
            <div className="min-w-0 flex-1">
              {rodada ? (
                <p className="text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
                  {rodada}
                </p>
              ) : null}
              <h1 className="mt-1 font-display text-[34px] leading-[1.05] font-semibold italic text-bordo lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
                {c.nome}
              </h1>
              <p className="mt-1 text-[10px] font-semibold tracking-[.2em] text-cinza uppercase">
                clube de leitura
              </p>
            </div>
            <div className="hidden gap-2.5 lg:flex">
              <Link href={`${base}/convidar`} className={acao}>
                convidar
              </Link>
              {papel === "moderadora" ? (
                <Link href={`${base}/editar`} className={acao}>
                  editar
                </Link>
              ) : null}
            </div>
          </div>
          {c.descricao ? (
            <p className="mx-auto mt-2 max-w-[30em] font-accent text-sm italic text-cinza lg:mx-0">
              {c.descricao}
            </p>
          ) : null}
          <div className="hidden lg:mt-5 lg:block lg:border-b lg:border-fio">
            <Abas base={base} sublinhadas />
          </div>
        </div>
      </div>
      {/* celular: as abas do clube ficam presas no topo enquanto rola */}
      <div className="sticky top-0 z-20 border-b border-linha/70 bg-creme/95 px-6 pt-0.5 pb-1.5 backdrop-blur-md lg:hidden">
        <Abas base={base} />
      </div>
    </>
  );
}

/** Carrega o clube uma vez e entrega para as telas de dentro. */
export function ClubeProvedor({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const eu = useMeuId();
  const pathname = usePathname();
  const consulta = useConsulta(async () => {
    const [c, membros] = await Promise.all([clube(id), membrosDe(id)]);
    return c ? { c, membros } : null;
  }, [id]);

  if (consulta.carregando && !consulta.dados)
    return (
      <Animacao
        tipo="livro"
        titulo="abrindo o clube"
        sub="arrumando as estantes e as fichas do mês"
      />
    );
  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  if (!consulta.dados)
    return (
      <div className="px-6 pt-10 lg:px-12">
        <Vazio
          titulo="esse clube não está disponível"
          texto="ele pode ter sido apagado, ou você ainda não é membro. peça o código de convite."
          acao={{ href: "/clubes/entrar", rotulo: "entrar com código" }}
        />
      </div>
    );

  const { c, membros } = consulta.dados;
  const papel = membros.find((m) => m.usuario_id === eu)?.papel ?? null;
  const base = `/clubes/${c.id}`;
  const comAbas = [
    base,
    `${base}/feed`,
    `${base}/biblioteca`,
    `${base}/leitura`,
    `${base}/agenda`,
  ].includes(pathname);

  return (
    <Contexto.Provider
      value={{ clube: c, membros, papel, recarregar: consulta.recarregar }}
    >
      {/* o tema do clube vale para todas as telas dele, como o tema do perfil */}
      <div
        style={coresDoTema(c.tema)}
        className="flex flex-1 flex-col bg-creme pb-8 lg:bg-jornal"
      >
        {comAbas ? <Cabecalho c={c} papel={papel} rodada={null} /> : null}
        <div className={comAbas ? largura : `${largura} lg:py-8`}>
          {children}
        </div>
      </div>
    </Contexto.Provider>
  );
}
