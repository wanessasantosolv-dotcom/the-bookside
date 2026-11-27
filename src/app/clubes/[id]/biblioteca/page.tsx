"use client";

import { AlternarFace, BarraCompacta } from "@/components/estantes/BarraCompacta";
import { BotaoFiltros, PainelFiltros } from "@/components/estantes/PainelFiltros";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CapaAuto } from "@/components/CapaAuto";
import { Animacao } from "@/components/Animacao";
import { tituloDe } from "@/lib/identidade";
import { useClube } from "@/components/clube/ClubeContexto";
import { FilaDaPrateleira, GradeDeLivros, MODOS_ESTANTE, PrateleiraMadeira, useFaceSalva, type Vista } from "@/components/estantes/Biblioteca";
import type { LivroSalvo } from "@/lib/perfil-store";
import { PilhaDeCapas, type ItemVitrine } from "@/components/estantes/Vitrine";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import { apagarLivroDoClube, fichasDoClube, livrosDoClube, modoDe, quemTrouxe, type LivroDoClube, organiza } from "@/lib/clubes";
import { useConsulta, useMeuId } from "@/lib/social";

type Ordem = "leitura" | "recentes" | "antigos" | "titulo" | "autor" | "avaliacao";
type Status = "todos" | "lendo" | "lidos" | "proximas";
type Vis = Vista;
type Filtros = { ano?: string; autor?: string; por?: string; notaMin?: number };

const ORDENS: { id: Ordem; nome: string }[] = [
  { id: "leitura", nome: "Ordem de leitura" },
  { id: "recentes", nome: "Mais recentes" },
  { id: "antigos", nome: "Mais antigos" },
  { id: "titulo", nome: "Título" },
  { id: "autor", nome: "Autor" },
  { id: "avaliacao", nome: "Avaliação" },
];
const MODOS = MODOS_ESTANTE;
const PREF = "bookside-estante-clube";
const sem = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const Icone = ({ d, tamanho = 18 }: { d: string; tamanho?: number }) => (
  <svg aria-hidden width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {d.split(" M").map((p, i) => (
      <path key={i} d={i ? `M${p}` : p} />
    ))}
  </svg>
);
const ICONE_BUSCA = "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-3.5-3.5";
const ICONE_FILTRO = "M4 7h10 M18 7h2 M4 17h4 M12 17h8 M16 5v4 M10 15v4";

/** a largura real da área (para decidir quantas capas cabem por prateleira) */
function useLargura<T extends HTMLElement>() {
  // ref de função: o elemento só aparece depois que a estante carrega
  const [el, setEl] = useState<T | null>(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    setW(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [el]);
  return [setEl, w] as const;
}

/**
 * A estante do clube: os livros num acervo contínuo (o status vira filtro),
 * controles numa linha só e detalhes ao tocar no livro. Números ficam na
 * jornada; a fila e o calendário, na agenda.
 */
export default function BibliotecaPage() {
  const { clube, membros, papel, identidade } = useClube();
  const eu = useMeuId();
  const [status, setStatus] = useState<Status>("todos");
  const [vis, setVis] = useState<Vis>("estante");
  const [face, setFace] = useFaceSalva();
  const [ordem, setOrdem] = useState<Ordem>("leitura");
  const [busca, setBusca] = useState("");
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [filtros, setFiltros] = useState<Filtros>({});
  const [painel, setPainel] = useState<"filtros" | "vis" | "menu" | null>(null);
  const [editando, setEditando] = useState(false);
  const [areaRef, largura] = useLargura<HTMLDivElement>();
  const buscaRef = useRef<HTMLInputElement>(null);

  // a preferência de visualização e de ordem fica guardada no aparelho
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREF) ?? "{}") as { vis?: string; ordem?: Ordem };
      if (p.vis && MODOS.some((m) => m.id === p.vis)) setVis(p.vis as Vis);
      else if (p.vis === "catalogo") setVis("lista");
      if (p.ordem && ORDENS.some((o) => o.id === p.ordem)) setOrdem(p.ordem);
    } catch {
      /* sem armazenamento */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(PREF, JSON.stringify({ vis, ordem }));
    } catch {
      /* sem armazenamento */
    }
  }, [vis, ordem]);
  useEffect(() => {
    if (!painel) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setPainel(null);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [painel]);
  useEffect(() => {
    if (buscaAberta) buscaRef.current?.focus();
  }, [buscaAberta]);

  const consulta = useConsulta(async () => {
    const livros = await livrosDoClube(clube.id);
    const fichas = await fichasDoClube(livros.filter((l) => l.estado === "lido").map((l) => l.id)).catch(() => []);
    return { livros, fichas };
  }, [clube.id]);
  if (consulta.carregando && !consulta.dados) return <Animacao tipo="pilha" titulo="carregando nossa estante" sub="os livros lidos e as próximas leituras" />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { livros: todos, fichas } = consulta.dados!;

  const notaDe = (id: string) => {
    const ns = fichas.filter((f) => f.clube_livro_id === id && f.nota).map((f) => f.nota as number);
    return ns.length ? ns.reduce((t, n) => t + n, 0) / ns.length : null;
  };
  const votacao = modoDe(clube) === "votacao";
  const moderadora = organiza(papel);
  const base = `/clubes/${clube.id}`;
  const data = (l: LivroDoClube) => l.encerrado_em ?? l.iniciado_em ?? l.criado_em;
  const anoDe = (l: LivroDoClube) => (l.encerrado_em ?? l.iniciado_em)?.slice(0, 4);

  // opções de filtro só com o que existe nos dados
  const anos = [...new Set<string>(todos.map(anoDe).filter((a): a is string => !!a))].sort().reverse();
  const autores = [...new Set<string>(todos.map((l) => l.livro.autor).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const quem = [...new Set<string>(todos.map((l) => (l.livro.historico ? null : l.sugerido_por)).filter((x): x is string => !!x))];
  const nomeDe = (id: string) => (id === eu ? "você" : (membros.find((m) => m.usuario_id === id)?.pessoa?.nome ?? membros.find((m) => m.usuario_id === id)?.pessoa?.usuario ?? "alguém"));
  const temNotas = fichas.some((f) => f.nota);
  const filtrosAtivos = Object.values(filtros).filter((v) => v !== undefined && v !== "").length;

  const contagem = {
    todos: todos.length,
    lendo: todos.filter((l) => l.estado === "lendo").length,
    lidos: todos.filter((l) => l.estado === "lido").length,
    proximas: todos.filter((l) => l.estado === "sugerido").length,
  };
  const STATUS: { id: Status; nome: string }[] = [
    { id: "todos", nome: "Todos" },
    { id: "lendo", nome: "Lendo agora" },
    { id: "lidos", nome: "Lidos" },
    { id: "proximas", nome: votacao ? "Sugestões" : "Próximas leituras" },
  ];

  const termo = sem(busca.trim());
  const filtrados = todos.filter(
    (l) =>
      (status === "todos" || (status === "lendo" && l.estado === "lendo") || (status === "lidos" && l.estado === "lido") || (status === "proximas" && l.estado === "sugerido")) &&
      (!termo || sem(`${l.livro.titulo} ${l.livro.autor}`).includes(termo)) &&
      (!filtros.ano || anoDe(l) === filtros.ano) &&
      (!filtros.autor || l.livro.autor === filtros.autor) &&
      (!filtros.por || l.sugerido_por === filtros.por) &&
      (!filtros.notaMin || (notaDe(l.id) ?? 0) >= filtros.notaMin),
  );
  const peso = (l: LivroDoClube) => (l.estado === "lendo" ? 0 : l.estado === "lido" ? 1 : 2);
  const ordenados = [...filtrados].sort((a, b) => {
    if (ordem === "titulo") return a.livro.titulo.localeCompare(b.livro.titulo, "pt-BR");
    if (ordem === "autor") return a.livro.autor.localeCompare(b.livro.autor, "pt-BR");
    if (ordem === "avaliacao") return (notaDe(b.id) ?? -1) - (notaDe(a.id) ?? -1);
    if (ordem === "recentes") return data(b).localeCompare(data(a));
    if (ordem === "antigos") return data(a).localeCompare(data(b));
    // ordem de leitura: a leitura atual primeiro, depois as lidas na sequência do clube, depois a fila
    if (peso(a) !== peso(b)) return peso(a) - peso(b);
    if (a.estado === "sugerido") return votacao ? b.votos.length - a.votos.length : a.criado_em.localeCompare(b.criado_em);
    return (a.rodada ?? 1e9) - (b.rodada ?? 1e9) || data(a).localeCompare(data(b));
  });

  async function excluir(l: LivroDoClube) {
    if (!confirm(`remover "${l.livro.titulo}" da nossa estante? as fichas de leitura desse livro também serão apagadas.`)) return;
    await apagarLivroDoClube(l.id);
    consulta.recarregar();
  }

  const hrefDe = (l: LivroDoClube) => (l.estado === "lendo" ? `${base}/leitura` : `${base}/livro/${l.id}`);
  const itens = (ls: LivroDoClube[]): ItemVitrine[] =>
    ls.map((l) => ({
      id: l.id,
      titulo: l.livro.titulo,
      autor: l.livro.autor,
      capa: l.livro.capa,
      paginas: l.livro.paginas,
      href: hrefDe(l),
      segurar: moderadora ? () => excluir(l) : undefined,
    }));

  const porAndarLombada = Math.max(6, Math.floor((largura - 24) / 40));
  const hrefPorId = new Map(ordenados.map((l) => [l.id, hrefDe(l)]));
  // o livro do clube no formato das estantes do app (estado do clube vira status; lido/lendo/próxima)
  const comoSalvos = (ls: LivroDoClube[]): LivroSalvo[] =>
    ls.map((l) => ({
      id: l.id,
      titulo: l.livro.titulo,
      autor: l.livro.autor,
      capa: l.livro.capa,
      paginas: l.livro.paginas,
      status: l.estado === "lido" ? "lido" : l.estado === "lendo" ? "lendo" : "quero",
    }));

  // quantas capas por prateleira, pela largura real (capas do mesmo tamanho em todas as linhas)
  const vao = largura < 640 ? 10 : 14;
  const minimo = largura < 640 ? 88 : 104;
  const colunas = Math.max(3, Math.min(10, Math.floor((largura + vao) / (minimo + vao)) || 3));
  const linhas: LivroDoClube[][] = [];
  for (let i = 0; i < ordenados.length; i += colunas) linhas.push(ordenados.slice(i, i + colunas));

  const botaoIcone = (on: boolean) =>
    `relative grid size-11 flex-none place-items-center rounded-[6px] border sm:size-10 ${on ? "border-bordo bg-rosa-fundo text-bordo" : "border-linha text-tinta-suave hover:text-ameixa"}`;
  const modo = MODOS.find((m) => m.id === vis) ?? MODOS[0];

  return (
    <div className="px-4 pt-4 pb-6 lg:px-0 lg:pt-6">
      {/* título, contagem e adicionar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h2 className="truncate font-revista text-[25px] leading-none text-ameixa lg:text-[30px]">{tituloDe(identidade, "estante")}</h2>
          <span className="flex-none text-[13px] text-cinza">
            {todos.length} {todos.length === 1 ? "livro" : "livros"}
          </span>
        </div>
        <div className="flex flex-none items-center gap-1.5">
          {moderadora && editando ? (
            <button type="button" onClick={() => setEditando(false)} className="h-9 rounded-[6px] bg-bordo px-3 text-[13px] font-semibold text-creme">
              concluir
            </button>
          ) : null}
          <Link href={`${base}/sugerir`} aria-label="adicionar livro" className="flex h-9 items-center gap-1 rounded-[6px] bg-bordo px-3 text-[13px] font-semibold text-creme hover:bg-bordo-suave">
            <span aria-hidden className="text-[16px] leading-none">+</span>
            <span className="sm:hidden">livro</span>
            <span className="hidden sm:inline">adicionar livro</span>
          </Link>
          <div className="relative">
            <button type="button" aria-label="mais ações da estante" aria-expanded={painel === "menu"} onClick={() => setPainel(painel === "menu" ? null : "menu")} className="grid size-11 place-items-center rounded-[6px] text-tinta-suave hover:text-ameixa sm:size-9">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <circle cx="5" cy="12" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="19" cy="12" r="1.8" />
              </svg>
            </button>
            {painel === "menu" ? (
              <>
                <div aria-hidden className="fixed inset-0 z-20" onClick={() => setPainel(null)} />
                <div role="menu" className="absolute top-11 right-0 z-30 w-60 overflow-hidden rounded-[6px] border border-linha bg-papel py-1 shadow-[0_14px_30px_-16px_rgba(0,0,0,.45)]">
                  <ItemMenu href={`${base}/sugestoes`}>{votacao ? "votar nas sugestões" : "ver a fila na agenda"}</ItemMenu>
                  {moderadora ? (
                    <>
                      <ItemMenu href={`${base}/adicionar-lido`}>adicionar leitura anterior</ItemMenu>
                      <button role="menuitem" type="button" onClick={() => (setEditando(true), setPainel(null))} className="block w-full px-4 py-2.5 text-left text-[13px] text-ameixa hover:bg-rosa-fundo">
                        editar estante
                      </button>
                      <ItemMenu href={`${base}/studio`}>personalizar estante</ItemMenu>
                    </>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* controles: a mesma barra de todas as estantes do app */}
      {todos.length ? (
        <div className="mt-3">
          <BarraCompacta
            filtros={STATUS.filter((x) => x.id === "todos" || contagem[x.id]).map((x) => ({ id: x.id, nome: `${x.nome} · ${contagem[x.id]}` }))}
            filtro={status}
            onFiltro={(v) => setStatus(v as Status)}
            busca={busca}
            onBusca={setBusca}
            modos={MODOS}
            modo={vis}
            onModo={(v) => setVis(v as Vis)}
            extra={
              <>
                {vis === "estante" ? <AlternarFace face={face} onChange={setFace} /> : null}
                <BotaoFiltros ativos={filtrosAtivos} onAbrir={() => setPainel("filtros")} />
              </>
            }
          />
        </div>
      ) : null}

      {/* o acervo */}
      <div ref={areaRef} className="mt-5 w-full min-w-0">
        {!todos.length ? (
          <Vazio titulo="uma estante por preencher." texto="adicione o primeiro livro do clube." acao={{ href: `${base}/sugerir`, rotulo: "adicionar livro" }} />
        ) : !ordenados.length ? (
          <div className="py-8 text-[14px] text-cinza">
            nenhum livro encontrado.{" "}
            <button type="button" onClick={() => (setBusca(""), setFiltros({}), setStatus("todos"))} className="font-semibold text-bordo">
              limpar filtros
            </button>
          </div>
        ) : vis === "lista" ? (
          <ul className="divide-y divide-linha border-y border-linha">
            {ordenados.map((l) => {
              const nota = notaDe(l.id);
              return (
                <li key={l.id}>
                  <Link href={hrefDe(l)} className="flex items-center gap-3 py-2.5 hover:bg-rosa-fundo/50">
                    <span className="w-[34px] flex-none">
                      <CapaAuto livro={l.livro} className="w-full [&>span:last-child]:hidden" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] text-ameixa">{l.livro.titulo}</span>
                      <span className="block truncate text-[12px] text-tinta-suave">
                        {l.livro.autor}
                        <span className="hidden sm:inline">{quemTrouxe(l, membros, eu) ? ` · ${quemTrouxe(l, membros, eu)}` : ""}</span>
                      </span>
                    </span>
                    <span className="flex-none text-right text-[11px] text-tinta-suave">{l.estado === "lendo" ? "lendo agora" : l.estado === "lido" ? (anoDe(l) ?? "lido") : votacao ? "sugestão" : "próxima"}</span>
                    <span className="w-[40px] flex-none text-right text-[12px] tabular-nums text-bordo">{nota ? `${nota.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}★` : ""}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : vis === "leque" ? (
          <PilhaDeCapas livros={itens(ordenados)} largura={largura < 640 ? 92 : 112} />
        ) : vis === "grade" ? (
          <GradeDeLivros livros={comoSalvos(ordenados)} hrefDe={(l) => hrefPorId.get(l.id) ?? base} />
        ) : face === "lombadas" ? (
          // as mesmas lombadas de todas as estantes do app
          <div className="space-y-10">
            {Array.from({ length: Math.ceil(ordenados.length / porAndarLombada) }, (_, k) => (
              <FilaDaPrateleira key={k} livros={comoSalvos(ordenados.slice(k * porAndarLombada, (k + 1) * porAndarLombada))} altura={largura < 640 ? 130 : 150} face="lombadas" hrefDe={(l) => hrefPorId.get(l.id) ?? base} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {linhas.map((linha, i) => (
              <div key={i}>
                <ul className="grid items-end px-1" style={{ gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))`, columnGap: vao }}>
                  {linha.map((l) => (
                    <Capa key={l.id} l={l} href={hrefDe(l)} editando={moderadora && editando} onRemover={() => excluir(l)} />
                  ))}
                </ul>
                <PrateleiraMadeira className="-mt-[6px] !h-[18px]" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* filtros: o mesmo painel de todas as estantes */}
      {painel === "filtros" ? (
        <PainelFiltros
          ativos={filtrosAtivos}
          onLimpar={() => setFiltros({})}
          onFechar={() => setPainel(null)}
          campos={[
            { rotulo: "Ordenar por", valor: ordem, opcoes: ORDENS.map((o) => [o.id, o.nome]), onMudar: (v) => setOrdem(v as Ordem) },
            ...(anos.length > 1 ? [{ rotulo: "Ano", valor: filtros.ano ?? "", opcoes: [["", "todos"], ...anos.map((a) => [a, a] as [string, string])] as [string, string][], onMudar: (v: string) => setFiltros((f) => ({ ...f, ano: v || undefined })) }] : []),
            ...(autores.length > 1 ? [{ rotulo: "Autor", valor: filtros.autor ?? "", opcoes: [["", "todos"], ...autores.map((a) => [a, a] as [string, string])] as [string, string][], onMudar: (v: string) => setFiltros((f) => ({ ...f, autor: v || undefined })) }] : []),
            ...(quem.length > 1 ? [{ rotulo: "Escolhido por", valor: filtros.por ?? "", opcoes: [["", "todos"], ...quem.map((q) => [q, nomeDe(q)] as [string, string])] as [string, string][], onMudar: (v: string) => setFiltros((f) => ({ ...f, por: v || undefined })) }] : []),
            ...(temNotas ? [{ rotulo: "Avaliação do clube", valor: String(filtros.notaMin ?? ""), opcoes: [["", "qualquer"], ["3", "3 ou mais"], ["4", "4 ou mais"], ["4.5", "4,5 ou mais"]] as [string, string][], onMudar: (v: string) => setFiltros((f) => ({ ...f, notaMin: v ? Number(v) : undefined })) }] : []),
          ]}
        />
      ) : null}
    </div>
  );
}

function ItemMenu({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link role="menuitem" href={href} className="block px-4 py-2.5 text-[13px] text-ameixa hover:bg-rosa-fundo">
      {children}
    </Link>
  );
}


/** uma capa na prateleira: só a capa (detalhes ao tocar); a leitura atual ganha um "lendo agora" discreto */
function Capa({ l, href, editando, onRemover }: { l: LivroDoClube; href: string; editando: boolean; onRemover: () => void }) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const segurou = useRef(false);
  return (
    <li className="relative flex min-w-0 flex-col justify-end">
      <Link
        href={href}
        title={`${l.livro.titulo} · ${l.livro.autor}`}
        className="block select-none transition-transform active:scale-[.96]"
        onPointerDown={() => {
          if (!editando) return;
          segurou.current = false;
          timer.current = setTimeout(() => {
            segurou.current = true;
            onRemover();
          }, 520);
        }}
        onPointerUp={() => clearTimeout(timer.current)}
        onPointerLeave={() => clearTimeout(timer.current)}
        onClick={(e) => {
          if (segurou.current) {
            e.preventDefault();
            segurou.current = false;
          }
        }}
      >
        <CapaAuto livro={l.livro} className="w-full [&>span:last-child]:hidden" />
      </Link>
      {l.estado === "lendo" ? (
        <span className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-[3px] bg-bordo px-1.5 py-[1px] text-[9px] font-semibold whitespace-nowrap text-creme shadow-sm">lendo agora</span>
      ) : null}
      {editando ? (
        <button type="button" aria-label={`tirar ${l.livro.titulo} da estante`} onClick={onRemover} className="absolute -top-1.5 -right-1.5 grid size-6 place-items-center rounded-full border border-creme bg-bordo text-xs leading-none text-creme">
          ×
        </button>
      ) : null}
    </li>
  );
}
