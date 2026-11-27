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

// quatro áreas: a leitura atual e a agenda vivem na visão geral
const abas = [
  { id: "", r: "Visão geral" },
  { id: "biblioteca", r: "Estante" },
  { id: "jornada", r: "Jornada" },
  { id: "membros", r: "Membros" },
];
const POSICOES = "bookside-clube-rolagem";

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
        aria-label="configurações do clube"
        title="configurações do clube"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="flex size-11 items-center justify-center rounded-full text-bordo hover:bg-rosa-fundo"
      >
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
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
                ateliê do clube
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
  // cada aba volta para onde a pessoa estava; na primeira visita, começa do topo
  function guardar() {
    try {
      const m = JSON.parse(sessionStorage.getItem(POSICOES) ?? "{}");
      m[pathname] = window.scrollY;
      sessionStorage.setItem(POSICOES, JSON.stringify(m));
    } catch {
      /* sem armazenamento */
    }
  }
  return (
    <nav aria-label="áreas do clube" className="grid grid-cols-4">
      {abas.map((a) => {
        const href = a.id ? `${base}/${a.id}` : base;
        const on =
          pathname === href ||
          (a.id === "" && [`${base}/feed`, `${base}/leitura`, `${base}/agenda`].includes(pathname)) ||
          (a.id === "biblioteca" && pathname.startsWith(`${base}/livro/`)) ||
          (a.id === "membros" && pathname.startsWith(`${base}/membros/`));
        return (
          <Link
            key={a.id}
            href={href}
            scroll={false}
            onClick={guardar}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-11 items-center justify-center border-b-2 px-1 text-center text-[13.5px] whitespace-nowrap transition-colors lg:min-h-12 lg:text-[15px] ${
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

function SeloDoClube({ c, tamanho, ident }: { c: Clube; tamanho: "mini" | "pequeno" | "grande"; ident: Identidade | null }) {
  const cls = tamanho === "grande" ? "size-20 lg:size-24 border-4 border-creme lg:border-jornal" : tamanho === "mini" ? "size-8" : "size-10";
  // emblema do club studio: no lugar da foto (se pedido) ou quando não há foto
  if (ident && (ident.emblema?.noAvatar || !c.foto))
    return <Emblema e={emblemaDe(ident, c.nome)} paleta={paletaDe(ident)} tamanho={tamanho === "grande" ? 96 : tamanho === "mini" ? 32 : 42} className="block flex-none drop-shadow-[0_6px_10px_rgba(0,0,0,.12)]" />;
  return c.foto ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={c.foto} alt="" className={`block flex-none rounded-full object-cover ${cls}`} />
  ) : (
    <span className={`flex flex-none items-center justify-center rounded-full bg-rosa-fundo font-revista text-bordo italic ${cls} ${tamanho === "grande" ? "text-[34px]" : tamanho === "mini" ? "text-[15px]" : "text-[18px]"}`}>
      {c.nome.charAt(0).toLowerCase()}
    </span>
  );
}

/**
 * Cabeçalho do clube, um só para as quatro áreas. Visão geral: banner
 * proporcional, selo, nome e descrição; ao rolar além dele, fica só a linha
 * compacta. Estante, Jornada e Membros: só a linha compacta (voltar, selo,
 * nome, configurações). As abas ficam presas logo abaixo.
 */
function Cabecalho({ c, papel, membros, ident }: { c: Clube; papel: Papel | null; membros: number; ident: Identidade | null }) {
  const layout = ident ? cabecalhoDe(ident) : "editorial";
  const faixa = ident && ident.padrao && padraoDe(ident).onde.includes("faixa");
  const pathname = usePathname();
  const base = `/clubes/${c.id}`;
  const inicio = pathname === base || pathname === `${base}/feed`;
  const tema = c.tema ? (temas.find((t) => t.id === c.tema) ?? null) : null;
  const fim = useRef<HTMLDivElement>(null);
  const [passou, setPassou] = useState(false);

  // na visão geral, a linha compacta aparece quando o banner sai da tela
  useEffect(() => {
    if (!inicio || !fim.current) return setPassou(false);
    const ob = new IntersectionObserver(([e]) => setPassou(!e.isIntersecting), { rootMargin: "-1px 0px 0px 0px" });
    ob.observe(fim.current);
    return () => ob.disconnect();
  }, [inicio]);

  // ao trocar de aba: volta para onde estava naquela aba, ou para o topo
  useEffect(() => {
    let y = 0;
    try {
      y = JSON.parse(sessionStorage.getItem(POSICOES) ?? "{}")[pathname] ?? 0;
    } catch {
      /* sem armazenamento */
    }
    requestAnimationFrame(() => window.scrollTo({ top: y }));
  }, [pathname]);

  const compacta = (
    <div className="flex h-[52px] items-center gap-2 lg:gap-3">
      <Voltar padrao="/comunidade" className="-ml-2 grid size-11 flex-none place-items-center text-bordo">
        <span className="sr-only">voltar</span>
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </Voltar>
      <Link href={base} scroll={false} className="flex min-w-0 flex-1 items-center gap-2.5">
        <SeloDoClube c={c} tamanho="mini" ident={ident} />
        <span className="min-w-0 truncate font-revista text-[17px] leading-tight text-ameixa lg:text-[19px]">{c.nome}</span>
      </Link>
      <Menu c={c} papel={papel} />
    </div>
  );

  const banner = layout === "compact" ? null : (
    <div className="relative">
      <div
        className={`h-[110px] w-full bg-cover bg-center sm:h-[150px] lg:h-[190px] ${c.capa || tema || c.identidade ? "" : "pat-estrelas"}`}
        style={
          c.capa
            ? { backgroundImage: `url("${c.capa}")` }
            : lerIdentidade(c.identidade)
              ? { background: "var(--club-banner)" }
              : tema
                ? { background: tema.fundo }
                : undefined
        }
      />
      <div className={`absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-2 lg:pt-4 ${largura}`}>
        <Voltar padrao="/comunidade" rotulo="comunidade" className="flex min-h-10 items-center rounded-full bg-creme/90 px-4 text-[13px] font-semibold text-bordo" />
        <span className="rounded-full bg-creme/85">
          <Menu c={c} papel={papel} />
        </span>
      </div>
    </div>
  );

  return (
    <>
      {inicio ? (
        layout === "compact" ? (
          <div className={`flex items-center gap-4 px-4 pt-3 pb-1 ${largura}`}>
            <Voltar padrao="/comunidade" rotulo="comunidade" className="-ml-2 flex min-h-11 flex-none items-center px-2 text-[13px] font-semibold text-bordo" />
            <SeloDoClube c={c} tamanho="pequeno" ident={ident} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-revista text-[24px] leading-tight text-bordo italic lg:text-[30px]">{c.nome}</h1>
              <p className="truncate text-[12px] text-tinta-suave">
                {membros} {membros === 1 ? "membro" : "membros"}
                {c.descricao ? ` · ${c.descricao}` : ""}
              </p>
            </div>
            <Menu c={c} papel={papel} />
          </div>
        ) : (
          <div>
            {banner}
            <div className={`relative px-5 ${largura} ${layout === "centered" ? "flex flex-col items-center text-center" : ""}`}>
              <div className={layout === "centered" ? "flex flex-col items-center" : "flex items-end gap-4"}>
                <span className="relative z-10 -mt-9 lg:-mt-11">
                  <SeloDoClube c={c} tamanho="grande" ident={ident} />
                </span>
                <div className="min-w-0 flex-1 pt-2">
                  <h1 className="font-revista text-[26px] leading-[1.05] text-bordo italic lg:text-[36px]">{c.nome}</h1>
                  <p className="mt-0.5 text-[12px] text-tinta-suave">
                    {membros} {membros === 1 ? "membro" : "membros"}
                  </p>
                </div>
              </div>
              {c.descricao ? <p className="mt-2 max-w-[60ch] text-[13px] leading-relaxed text-tinta-suave">{c.descricao}</p> : null}
            </div>
          </div>
        )
      ) : null}
      {faixa && inicio ? <div aria-hidden className={`faixa-clube mt-3 h-2.5 ${largura}`} /> : null}
      <div ref={fim} aria-hidden className="h-px" />
      {/* identificação compacta + abas: presas no topo, juntas (cerca de 96px no celular) */}
      {/* a linha compacta entra por cima ao rolar a visão geral; a margem negativa evita o salto do conteúdo */}
      <div className={`sticky top-0 z-20 border-b border-linha ${inicio ? "mt-2" : ""} ${inicio && passou ? "-mb-[52px]" : ""} bg-creme/95 backdrop-blur-md lg:border-fio lg:bg-jornal/95`}>
        <div className={`px-4 lg:px-5 ${largura}`}>
          {!inicio || passou ? compacta : null}
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
    pathname.startsWith(`${base}/membro/`) ||
    pathname.startsWith(`${base}/membros/`);

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
