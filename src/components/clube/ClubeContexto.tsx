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
  modoDe,
  sincronizarMinhaEstante,
  tirarMembro,
  type Clube,
  type Membro,
  type Papel,
} from "@/lib/clubes";
import { temas } from "@/lib/dados";
import { coresDoTema } from "@/lib/tema";
import { TIPOGRAFIAS, cabecalhoDe, decoracaoDe, emblemaDe, estiloDaIdentidade, padraoDe, paletaDe, guardarIdentidadeEmCache, identidadeEmCache, lerIdentidade, temaDoId, type Identidade } from "@/lib/identidade";
import { useModoEscuro } from "@/components/Aparencia";
import { Emblema } from "@/components/clube/Emblema";
import { useConsulta, useMeuId } from "@/lib/social";

type Ctx = {
  clube: Clube;
  membros: Membro[];
  papel: Papel | null;
  recarregar: () => void;
  /** a identidade publicada no club studio (null = visual antigo) */
  identidade: Identidade | null;
};
export const ContextoClube = createContext<Ctx | null>(null);
const Contexto = ContextoClube;

export function useClube() {
  const c = useContext(Contexto);
  if (!c) throw new Error("useClube fora do clube");
  return c;
}

/** largura do clube no computador: centralizada como o perfil (a capa continua de ponta a ponta) */
const largura = "lg:mx-auto lg:w-full lg:max-w-[1320px] lg:px-12";

const abas = [
  { id: "", r: "início" },
  { id: "leitura", r: "leitura atual" },
  { id: "biblioteca", r: "estante" },
  { id: "jornada", r: "jornada" },
  { id: "agenda", r: "agenda" },
  { id: "membros", r: "membros" },
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
            <>
              <Link href={`/clubes/${c.id}/editar`} className={item}>
                editar clube
              </Link>
              <Link href={`/clubes/${c.id}/studio`} className={item}>
                personalizar clube
              </Link>
            </>
          ) : null}
          <Link href={`/clubes/${c.id}/convidar`} className={item}>
            convidar membros
          </Link>
          <Link href={`/clubes/${c.id}/sugestoes`} className={item}>
            {modoDe(c) === "votacao" ? "livros sugeridos e votação" : "próximas leituras"}
          </Link>
          <Link href={`/clubes/${c.id}/retrospectiva`} className={item}>
            ver retrospectiva
          </Link>
          <button type="button" onClick={sair} className={`${item} text-bordo`}>
            sair do clube
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Abas({ base }: { base: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="seções do clube" className="-mx-5 flex gap-6 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:gap-8 lg:px-0 [&::-webkit-scrollbar]:hidden">
      {abas.map((a) => {
        const href = a.id ? `${base}/${a.id}` : base;
        // a leitura de um livro do clube fica dentro da estante; o perfil de um membro, dentro de membros
        const on =
          pathname === href ||
          (a.id === "biblioteca" && pathname.startsWith(`${base}/livro/`)) ||
          (a.id === "membros" && pathname.startsWith(`${base}/membro/`)) ||
          (a.id === "" && pathname === `${base}/feed`);
        return (
          <Link
            key={a.id}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-12 flex-none items-center border-b-2 text-[14px] whitespace-nowrap transition-colors lg:text-[15px] ${
              on ? "border-bordo font-semibold text-bordo" : "border-transparent text-cinza hover:text-ameixa"
            }`}
          >
            {a.r}
          </Link>
        );
      })}
    </nav>
  );
}

function SeloDoClube({ c, tamanho, ident }: { c: Clube; tamanho: "pequeno" | "grande"; ident: Identidade | null }) {
  const cls = tamanho === "grande" ? "size-20 lg:size-24 border-4 border-creme lg:border-jornal" : "size-10";
  // emblema do club studio: no lugar da foto (se pedido) ou quando não há foto
  if (ident && (ident.emblema?.noAvatar || !c.foto))
    return <Emblema e={emblemaDe(ident, c.nome)} paleta={paletaDe(ident)} tamanho={tamanho === "grande" ? 96 : 42} className="block flex-none drop-shadow-[0_6px_10px_rgba(0,0,0,.12)]" />;
  return c.foto ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={c.foto} alt="" className={`block flex-none rounded-full object-cover ${cls}`} />
  ) : (
    <span className={`flex flex-none items-center justify-center rounded-full bg-rosa-fundo font-revista text-bordo italic ${cls} ${tamanho === "grande" ? "text-[34px]" : "text-[18px]"}`}>
      {c.nome.charAt(0).toLowerCase()}
    </span>
  );
}

/**
 * Cabeçalho do clube. No início: capa, selo sobre a capa, nome, descrição,
 * membros e ações. Nas outras abas: barra compacta (selo, nome, voltar).
 * As abas ficam presas no topo enquanto rola.
 */
function Cabecalho({ c, papel, membros, ident }: { c: Clube; papel: Papel | null; membros: number; ident: Identidade | null }) {
  const layout = ident ? cabecalhoDe(ident) : "editorial";
  const faixa = ident && ident.padrao && padraoDe(ident).onde.includes("faixa");
  const pathname = usePathname();
  const base = `/clubes/${c.id}`;
  const inicio = pathname === base || pathname === `${base}/feed`;
  const tema = c.tema ? (temas.find((t) => t.id === c.tema) ?? null) : null;
  const acao =
    "flex min-h-10 items-center rounded-full border border-bordo/40 px-4 text-[13px] font-semibold text-bordo hover:border-bordo hover:bg-rosa-fundo";
  return (
    <>
      {inicio && layout === "compact" ? (
        <div className={`flex flex-wrap items-center gap-4 px-5 pt-3 pb-1 ${largura}`}>
          <Voltar padrao="/clubes" rotulo="clubes" className="-ml-2 flex min-h-11 flex-none items-center px-2 text-[13px] font-semibold text-bordo" />
          <SeloDoClube c={c} tamanho="pequeno" ident={ident} />
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-revista text-[26px] leading-tight text-bordo italic lg:text-[32px]">{c.nome}</h1>
            <p className="truncate text-[12px] text-tinta-suave">
              {membros} {membros === 1 ? "membro" : "membros"}
              {c.descricao ? ` · ${c.descricao}` : ""}
            </p>
          </div>
          <Link href={`${base}/convidar`} className={`${acao} hidden sm:flex`}>
            convidar membros
          </Link>
          <Menu c={c} papel={papel} />
        </div>
      ) : inicio && layout === "centered" ? (
        <div>
          <div className="relative">
            <div
              className="aspect-[4/1] w-full bg-cover bg-center lg:aspect-[7/1]"
              style={c.capa ? { backgroundImage: `url("${c.capa}")` } : { background: "var(--club-banner)" }}
            />
            <div className={`absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-2 lg:pt-4 ${largura}`}>
              <Voltar padrao="/clubes" rotulo="clubes" className="flex min-h-10 items-center rounded-full bg-creme/90 px-4 text-[13px] font-semibold text-bordo" />
              <span className="rounded-full bg-creme/85">
                <Menu c={c} papel={papel} />
              </span>
            </div>
          </div>
          <div className={`flex flex-col items-center px-5 text-center ${largura}`}>
            <span className="relative z-10 -mt-12">
              <SeloDoClube c={c} tamanho="grande" ident={ident} />
            </span>
            <h1 className="mt-3 font-revista text-[32px] leading-[1.05] text-bordo italic lg:text-[44px]">{c.nome}</h1>
            <p className="mt-1 text-[13px] text-tinta-suave">
              clube de leitura · {membros} {membros === 1 ? "membro" : "membros"}
            </p>
            {c.descricao ? <p className="mt-2 max-w-[56ch] text-[14px] leading-relaxed text-tinta-suave">{c.descricao}</p> : null}
            <div className="mt-4 flex gap-2">
              <Link href={`${base}/convidar`} className={acao}>
                convidar membros
              </Link>
              {papel === "moderadora" ? (
                <Link href={`${base}/editar`} className={acao}>
                  editar clube
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : inicio ? (
        <div>
          <div className="relative">
            <div
              className={`aspect-[3/1] w-full bg-cover bg-center lg:aspect-[6/1] ${c.capa || tema || c.identidade ? "" : "pat-estrelas"}`}
              style={
                c.capa
                  ? { backgroundImage: `linear-gradient(rgba(43,20,32,.02),rgba(43,20,32,.14)), url("${c.capa}")` }
                  : lerIdentidade(c.identidade)
                    ? { background: "var(--club-banner)" }
                    : tema
                    ? { background: tema.fundo }
                    : undefined
              }
            />
            <div className={`absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-2 lg:pt-4 ${largura}`}>
              <Voltar padrao="/clubes" rotulo="clubes" className="flex min-h-10 items-center rounded-full bg-creme/90 px-4 text-[13px] font-semibold text-bordo" />
              <span className="rounded-full bg-creme/85">
                <Menu c={c} papel={papel} />
              </span>
            </div>
          </div>
          <div className={`relative px-5 ${largura}`}>
            <div className="flex flex-wrap items-end gap-x-5 gap-y-3">
              <span className="-mt-10 lg:-mt-12">
                <SeloDoClube c={c} tamanho="grande" ident={ident} />
              </span>
              <div className="min-w-[min(100%,14rem)] flex-1 pt-3">
                <h1 className="font-revista text-[30px] leading-[1.05] text-bordo italic lg:text-[40px]">{c.nome}</h1>
                <p className="mt-1 text-[13px] text-tinta-suave">
                  clube de leitura · {membros} {membros === 1 ? "membro" : "membros"}
                </p>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <Link href={`${base}/convidar`} className={acao}>
                  convidar membros
                </Link>
                {papel === "moderadora" ? (
                  <Link href={`${base}/editar`} className={acao}>
                    editar clube
                  </Link>
                ) : null}
              </div>
            </div>
            {c.descricao ? <p className="mt-3 max-w-[60ch] text-[14px] leading-relaxed text-tinta-suave">{c.descricao}</p> : null}
          </div>
        </div>
      ) : (
        <div className={`flex items-center gap-3 px-5 pt-3 pb-1 ${largura}`}>
          <Voltar padrao="/clubes" rotulo="clubes" className="-ml-2 flex min-h-11 flex-none items-center px-2 text-[13px] font-semibold text-bordo" />
          <Link href={base} className="flex min-w-0 flex-1 items-center gap-3 border-l border-linha pl-3 lg:border-fio">
            <SeloDoClube c={c} tamanho="pequeno" ident={ident} />
            <span className="truncate font-revista text-[19px] leading-tight text-bordo italic lg:text-[22px]">{c.nome}</span>
          </Link>
          <Menu c={c} papel={papel} />
        </div>
      )}
      {faixa ? <div aria-hidden className={`faixa-clube mt-4 h-3 ${largura}`} /> : null}
      {/* abas: presas no topo enquanto rola, sem cobrir o conteúdo */}
      <div className="sticky top-0 z-20 mt-3 border-b border-linha bg-creme/95 backdrop-blur-md lg:border-fio lg:bg-jornal/95">
        <div className={`px-5 ${largura}`}>
          <Abas base={base} />
        </div>
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
  const modoEscuro = useModoEscuro();
  const pathname = usePathname();
  // o que o clube está lendo vai para a estante pessoal (no máximo 1 vez por minuto)
  useEffect(() => {
    void sincronizarMinhaEstante();
  }, [id]);
  const consulta = useConsulta(async () => {
    const [c, membros] = await Promise.all([clube(id), membrosDe(id)]);
    return c ? { c, membros } : null;
  }, [id]);
  // a identidade do club studio (ou a última vista, enquanto carrega: sem piscar a cor errada)
  const [emCache, setEmCache] = useState<Identidade | null>(null);
  useEffect(() => setEmCache(identidadeEmCache(id)), [id]);
  const publicada = consulta.dados ? lerIdentidade(consulta.dados.c.identidade) : undefined;
  useEffect(() => {
    if (publicada !== undefined) guardarIdentidadeEmCache(id, publicada);
  }, [id, publicada === undefined ? "?" : JSON.stringify(publicada)]); // eslint-disable-line react-hooks/exhaustive-deps

  if (consulta.carregando && !consulta.dados)
    return (
      <div style={emCache ? estiloDaIdentidade(emCache) : undefined} className={`clube-tokens flex flex-1 flex-col ${emCache ? "clube-identidade bg-creme" : ""}`}>
        <Animacao
          tipo="livro"
          titulo="abrindo o clube"
          sub="organizando a estante e as fichas de leitura"
        />
      </div>
    );
  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  if (!consulta.dados)
    return (
      <div className="px-6 pt-10 lg:px-12">
        <Vazio
          titulo="esse clube não está disponível"
          texto="ele pode ter sido apagado, ou você ainda não é membro. peça o código de convite a quem organiza."
          acao={{ href: "/clubes/entrar", rotulo: "entrar por convite" }}
        />
      </div>
    );

  const { c, membros } = consulta.dados;
  const papel = membros.find((m) => m.usuario_id === eu)?.papel ?? null;
  const base = `/clubes/${c.id}`;
  // além das 5 seções principais, a leitura de um livro e o perfil de um
  // membro também mantêm a barra do clube — sem isso, a navegação some
  // assim que a pessoa entra mais fundo e ela precisa ficar voltando
  const comAbas =
    [base, `${base}/feed`, `${base}/biblioteca`, `${base}/jornada`, `${base}/leitura`, `${base}/agenda`, `${base}/membros`].includes(
      pathname,
    ) ||
    pathname.startsWith(`${base}/livro/`) ||
    pathname.startsWith(`${base}/membro/`);

  return (
    <Contexto.Provider
      value={{ clube: c, membros, papel, recarregar: consulta.recarregar, identidade: publicada ?? null }}
    >
      {/* o tema do clube vale para todas as telas dele, como o tema do perfil */}
      <div
        style={publicada ? estiloDaIdentidade(publicada) : coresDoTema(c.tema, modoEscuro)}
        data-estante={publicada?.estante?.estilo}
        data-decoracao={publicada ? decoracaoDe(publicada) : undefined}
        data-titulo={publicada && !TIPOGRAFIAS.find((t) => t.id === (publicada.tipografia ?? temaDoId(publicada.tema).tipografia))?.italico ? "reto" : undefined}
        className={`clube-tokens flex flex-1 flex-col bg-creme pb-8 lg:bg-jornal ${publicada ? "clube-identidade" : ""}`}
      >
        {comAbas ? <Cabecalho c={c} papel={papel} membros={membros.length} ident={publicada ?? null} /> : null}
        <div className={comAbas ? largura : `${largura} lg:py-8`}>
          {children}
        </div>
      </div>
    </Contexto.Provider>
  );
}
