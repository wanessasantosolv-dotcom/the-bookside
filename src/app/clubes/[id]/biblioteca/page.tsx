"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CapaAuto } from "@/components/CapaAuto";
import { Animacao } from "@/components/Animacao";
import { tituloDe } from "@/lib/identidade";
import { useClube } from "@/components/clube/ClubeContexto";
import { PrateleiraMadeira } from "@/components/estantes/Biblioteca";
import { EstanteDeVerdadeFila, LequeLinhaWeb, type ItemVitrine } from "@/components/estantes/Vitrine";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import { apagarLivroDoClube, fichasDoClube, livrosDoClube, modoDe, quemTrouxe, type LivroDoClube, organiza } from "@/lib/clubes";
import { useConsulta, useMeuId } from "@/lib/social";

type Ordem = "leitura" | "recentes" | "antigos" | "titulo" | "autor" | "avaliacao";
type Status = "todos" | "lendo" | "lidos" | "proximas";
type Vis = "prateleira" | "leque" | "estante" | "catalogo";
type Filtros = { ano?: string; autor?: string; por?: string; notaMin?: number };

const ORDENS: { id: Ordem; nome: string }[] = [
  { id: "leitura", nome: "Ordem de leitura" },
  { id: "recentes", nome: "Mais recentes" },
  { id: "antigos", nome: "Mais antigos" },
  { id: "titulo", nome: "Título" },
  { id: "autor", nome: "Autor" },
  { id: "avaliacao", nome: "Avaliação" },
];
const MODOS: { id: Vis; nome: string; icone: string }[] = [
  { id: "prateleira", nome: "Prateleiras", icone: "M3 20h18 M5 20V9h3v11 M10 20V6h3v14 M15 20v-9h3l1 9" },
  { id: "leque", nome: "Leque de capas", icone: "M12 20L5 8l4-2 3 14 M12 20l3-14 4 2-7 12" },
  { id: "estante", nome: "Estante de pé", icone: "M5 3h14v18H5z M5 9h14 M5 15h14" },
  { id: "catalogo", nome: "Catálogo", icone: "M4 6h2 M9 6h11 M4 12h2 M9 12h11 M4 18h2 M9 18h11" },
];
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
  const [vis, setVis] = useState<Vis>("prateleira");
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
      const p = JSON.parse(localStorage.getItem(PREF) ?? "{}") as { vis?: Vis; ordem?: Ordem };
      if (p.vis && MODOS.some((m) => m.id === p.vis)) setVis(p.vis);
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

      {/* controles: uma linha (celular) / barra completa (computador) */}
      {todos.length ? (
        <div className="mt-3 flex items-center gap-2">
          <label className="relative min-w-0 flex-1 sm:flex-none">
            <span className="sr-only">mostrar</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="h-11 w-full appearance-none rounded-[6px] border border-linha bg-transparent pr-8 pl-3 text-[14px] font-semibold text-ameixa outline-none focus:border-bordo sm:h-10 sm:w-auto"
            >
              {STATUS.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id !== "todos" && !contagem[s.id]}>
                  {s.nome} · {contagem[s.id]}
                </option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-cinza">
              ▾
            </span>
          </label>

          {/* busca sempre visível no computador */}
          <label className="hidden h-10 min-w-0 flex-1 items-center gap-2 rounded-[6px] border border-linha px-3 focus-within:border-bordo sm:flex lg:max-w-[340px]">
            <span className="text-cinza">
              <Icone d={ICONE_BUSCA} tamanho={15} />
            </span>
            <span className="sr-only">buscar livro ou autor</span>
            <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar livro ou autor" className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-cinza" />
          </label>
          <label className="relative hidden sm:block">
            <span className="sr-only">ordenar por</span>
            <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-10 appearance-none rounded-[6px] border border-linha bg-transparent pr-8 pl-3 text-[14px] text-ameixa outline-none focus:border-bordo">
              {ORDENS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nome}
                </option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[11px] text-cinza">
              ▾
            </span>
          </label>

          <span className="ml-auto flex items-center gap-1.5">
            <button type="button" aria-label="buscar" aria-expanded={buscaAberta} onClick={() => setBuscaAberta((v) => !v)} className={`${botaoIcone(buscaAberta || !!busca)} sm:hidden`}>
              <Icone d={ICONE_BUSCA} />
            </button>
            <button type="button" aria-label={filtrosAtivos ? `filtros (${filtrosAtivos} ativos)` : "filtros"} aria-expanded={painel === "filtros"} onClick={() => setPainel("filtros")} className={botaoIcone(!!filtrosAtivos)}>
              <Icone d={ICONE_FILTRO} />
              {filtrosAtivos ? <span className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-bordo text-[9px] font-bold text-creme">{filtrosAtivos}</span> : null}
            </button>
            {/* visualização: menu no celular, grupo de ícones no computador */}
            <span className="relative sm:hidden">
              <button type="button" aria-label={`visualização: ${modo.nome}`} aria-expanded={painel === "vis"} onClick={() => setPainel(painel === "vis" ? null : "vis")} className={botaoIcone(false)}>
                <Icone d={modo.icone} />
              </button>
              {painel === "vis" ? (
                <>
                  <div aria-hidden className="fixed inset-0 z-20" onClick={() => setPainel(null)} />
                  <div role="menu" aria-label="visualização" className="absolute top-12 right-0 z-30 w-52 overflow-hidden rounded-[6px] border border-linha bg-papel py-1 shadow-[0_14px_30px_-16px_rgba(0,0,0,.45)]">
                    {MODOS.map((m) => (
                      <button key={m.id} type="button" role="menuitemradio" aria-checked={vis === m.id} onClick={() => (setVis(m.id), setPainel(null))} className={`flex min-h-11 w-full items-center gap-3 px-4 text-left text-[14px] ${vis === m.id ? "font-semibold text-bordo" : "text-ameixa"} hover:bg-rosa-fundo`}>
                        <Icone d={m.icone} />
                        {m.nome}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </span>
            <span role="radiogroup" aria-label="visualização" className="hidden rounded-[6px] border border-linha p-0.5 sm:flex">
              {MODOS.map((m) => (
                <button key={m.id} type="button" role="radio" aria-checked={vis === m.id} aria-label={m.nome} title={m.nome} onClick={() => setVis(m.id)} className={`grid size-9 place-items-center rounded-[4px] ${vis === m.id ? "bg-rosa-fundo text-bordo" : "text-tinta-suave hover:text-ameixa"}`}>
                  <Icone d={m.icone} tamanho={17} />
                </button>
              ))}
            </span>
          </span>
        </div>
      ) : null}

      {/* busca aberta (celular) */}
      {buscaAberta ? (
        <div className="mt-2 flex h-11 items-center gap-2 rounded-[6px] border border-bordo px-3 sm:hidden">
          <span className="text-cinza">
            <Icone d={ICONE_BUSCA} tamanho={15} />
          </span>
          <input ref={buscaRef} type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar livro ou autor" aria-label="buscar livro ou autor" className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-cinza" />
          {busca ? (
            <button type="button" onClick={() => setBusca("")} className="min-h-9 px-1 text-[12px] font-semibold text-tinta-suave">
              limpar
            </button>
          ) : null}
          <button type="button" aria-label="fechar busca" onClick={() => (setBuscaAberta(false), setBusca(""))} className="grid size-9 place-items-center text-tinta-suave">
            ×
          </button>
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
        ) : vis === "catalogo" ? (
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
          <div className="flex flex-col gap-8">
            {Array.from({ length: Math.ceil(ordenados.length / 6) }, (_, i) => (
              <LequeLinhaWeb key={i} livros={itens(ordenados.slice(i * 6, i * 6 + 6))} />
            ))}
          </div>
        ) : vis === "estante" ? (
          <div className="flex flex-col gap-8">
            {Array.from({ length: Math.ceil(ordenados.length / (colunas * 2)) }, (_, i) => (
              <EstanteDeVerdadeFila key={i} livros={itens(ordenados.slice(i * colunas * 2, (i + 1) * colunas * 2))} alturaBase={largura < 640 ? 120 : 150} />
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

      {/* filtros: folha de baixo no celular, caixa no computador */}
      {painel === "filtros" ? (
        <div role="dialog" aria-modal="true" aria-label="filtros" className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center" onClick={() => setPainel(null)}>
          <div className="max-h-[85dvh] w-full max-w-[420px] overflow-y-auto rounded-t-[10px] bg-creme px-5 pt-4 pb-[max(20px,env(safe-area-inset-bottom))] sm:rounded-[10px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-revista text-[20px] text-ameixa">Filtros</p>
              <button type="button" onClick={() => setPainel(null)} className="min-h-11 px-2 text-[13px] font-semibold text-bordo">
                aplicar
              </button>
            </div>
            <div className="mt-3 space-y-4">
              <Escolha rotulo="Ordenar por" valor={ordem} opcoes={ORDENS.map((o) => [o.id, o.nome])} onMudar={(v) => setOrdem(v as Ordem)} />
              {anos.length > 1 ? <Escolha rotulo="Ano" valor={filtros.ano ?? ""} opcoes={[["", "todos"], ...anos.map((a) => [a, a] as [string, string])]} onMudar={(v) => setFiltros((f) => ({ ...f, ano: v || undefined }))} /> : null}
              {autores.length > 1 ? <Escolha rotulo="Autor" valor={filtros.autor ?? ""} opcoes={[["", "todos"], ...autores.map((a) => [a, a] as [string, string])]} onMudar={(v) => setFiltros((f) => ({ ...f, autor: v || undefined }))} /> : null}
              {quem.length > 1 ? <Escolha rotulo="Escolhido por" valor={filtros.por ?? ""} opcoes={[["", "todos"], ...quem.map((q) => [q, nomeDe(q)] as [string, string])]} onMudar={(v) => setFiltros((f) => ({ ...f, por: v || undefined }))} /> : null}
              {temNotas ? (
                <Escolha
                  rotulo="Avaliação do clube"
                  valor={String(filtros.notaMin ?? "")}
                  opcoes={[["", "qualquer"], ["3", "3 ou mais"], ["4", "4 ou mais"], ["4.5", "4,5 ou mais"]]}
                  onMudar={(v) => setFiltros((f) => ({ ...f, notaMin: v ? Number(v) : undefined }))}
                />
              ) : null}
            </div>
            {filtrosAtivos ? (
              <button type="button" onClick={() => setFiltros({})} className="mt-5 min-h-10 text-[13px] font-semibold text-tinta-suave underline-offset-4 hover:underline">
                Limpar filtros
              </button>
            ) : null}
          </div>
        </div>
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

function Escolha({ rotulo, valor, opcoes, onMudar }: { rotulo: string; valor: string; opcoes: [string, string][]; onMudar: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-semibold text-tinta-suave">{rotulo}</span>
      <select value={valor} onChange={(e) => onMudar(e.target.value)} className="h-11 w-full rounded-[6px] border border-linha bg-creme-quente px-3 text-[14px] text-ameixa outline-none focus:border-bordo">
        {opcoes.map(([v, n]) => (
          <option key={v} value={v}>
            {n}
          </option>
        ))}
      </select>
    </label>
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
