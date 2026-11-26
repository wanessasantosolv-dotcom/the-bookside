"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CapaAuto } from "@/components/CapaAuto";
import { Animacao } from "@/components/Animacao";
import { tituloDe } from "@/lib/identidade";
import { useClube } from "@/components/clube/ClubeContexto";
import {
  EstanteDeVerdadeFila,
  LequeLinhaWeb,
  PrateleiraCapas,
  SeletorVisualizacao,
  type ItemVitrine,
  type Visualizacao,
} from "@/components/estantes/Vitrine";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import {
  apagarLivroDoClube,
  fichasDoClube,
  livrosDoClube,
  modoDe,
  quemTrouxe,
  type LivroDoClube,
  organiza,
} from "@/lib/clubes";
import { useConsulta, useMeuId } from "@/lib/social";

type Linha = {
  id: string;
  nome: string;
  livros: LivroDoClube[];
  link?: string;
  mais?: string;
};

type Ordem = "leitura" | "recentes" | "antigos" | "titulo" | "autor" | "avaliacao";
const ORDENS: { id: Ordem; nome: string }[] = [
  { id: "leitura", nome: "ordem de leitura" },
  { id: "recentes", nome: "mais recentes" },
  { id: "antigos", nome: "mais antigos" },
  { id: "titulo", nome: "título" },
  { id: "autor", nome: "autor" },
  { id: "avaliacao", nome: "avaliação" },
];
const PREF = "bookside-estante-clube";
const sem = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * A estante do clube: só os livros (prateleiras, leque, estante de pé e catálogo),
 * com busca, filtros e ordem. Números, metas e retrospectiva ficam na jornada;
 * a ordem de escolha e o calendário, na agenda.
 */
export default function BibliotecaPage() {
  const { clube, membros, papel, identidade } = useClube();
  const eu = useMeuId();
  const [filtro, setFiltro] = useState("todas");
  const [vis, setVis] = useState<Visualizacao | "catalogo">("prateleira");
  const [ordem, setOrdem] = useState<Ordem>("leitura");
  const [busca, setBusca] = useState("");
  const [menu, setMenu] = useState(false);
  const caixaMenu = useRef<HTMLDivElement>(null);
  const [editando, setEditando] = useState(false);
  // a preferência de visualização e de ordem fica guardada no aparelho
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem(PREF) ?? "{}") as { vis?: Visualizacao | "catalogo"; ordem?: Ordem };
      if (p.vis) setVis(p.vis);
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
    if (!menu) return;
    const fora = (e: MouseEvent) => !caixaMenu.current?.contains(e.target as Node) && setMenu(false);
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [menu]);
  const consulta = useConsulta(async () => {
    const livros = await livrosDoClube(clube.id);
    const fichas = await fichasDoClube(livros.filter((l) => l.estado === "lido").map((l) => l.id)).catch(() => []);
    return { livros, fichas };
  }, [clube.id]);
  if (consulta.carregando && !consulta.dados)
    return (
      <Animacao
        tipo="pilha"
        titulo="carregando nossa estante"
        sub="os livros lidos e as próximas leituras"
      />
    );
  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { livros: todos, fichas } = consulta.dados!;
  const notaDe = (id: string) => {
    const ns = fichas.filter((f) => f.clube_livro_id === id && f.nota).map((f) => f.nota as number);
    return ns.length ? ns.reduce((t, n) => t + n, 0) / ns.length : null;
  };
  const termo = sem(busca.trim());
  const livros = termo ? todos.filter((l) => sem(`${l.livro.titulo} ${l.livro.autor}`).includes(termo)) : todos;
  const ordenar = (ls: LivroDoClube[]) => {
    const data = (l: LivroDoClube) => l.encerrado_em ?? l.iniciado_em ?? l.criado_em;
    const c = [...ls];
    if (ordem === "titulo") return c.sort((a, b) => a.livro.titulo.localeCompare(b.livro.titulo, "pt-BR"));
    if (ordem === "autor") return c.sort((a, b) => a.livro.autor.localeCompare(b.livro.autor, "pt-BR"));
    if (ordem === "avaliacao") return c.sort((a, b) => (notaDe(b.id) ?? -1) - (notaDe(a.id) ?? -1));
    if (ordem === "recentes") return c.sort((a, b) => data(b).localeCompare(data(a)));
    if (ordem === "antigos") return c.sort((a, b) => data(a).localeCompare(data(b)));
    // ordem de leitura: a sequência das leituras do clube (sem mudar nada salvo)
    return c.sort((a, b) => (a.rodada ?? 1e9) - (b.rodada ?? 1e9) || data(a).localeCompare(data(b)));
  };
  const moderadora = organiza(papel);
  const base = `/clubes/${clube.id}`;
  const votacao = modoDe(clube) === "votacao";

  async function excluir(l: LivroDoClube) {
    if (
      !confirm(
        `remover "${l.livro.titulo}" da nossa estante? as fichas de leitura desse livro também serão apagadas.`,
      )
    )
      return;
    await apagarLivroDoClube(l.id);
    consulta.recarregar();
  }

  const lendo = livros.filter((l) => l.estado === "lendo");
  const lidos = ordenar(livros.filter((l) => l.estado === "lido"));
  const sugeridos = livros.filter((l) => l.estado === "sugerido");
  // a fila da agenda manda na ordem padrão das próximas leituras
  const proximas =
    ordem === "leitura"
      ? [...sugeridos].sort((a, b) => (votacao ? b.votos.length - a.votos.length : a.criado_em.localeCompare(b.criado_em)))
      : ordenar(sugeridos);

  const linhas: Linha[] = [
    {
      id: "lendo",
      nome: "lendo agora",
      livros: lendo,
      link: `${base}/leitura`,
      mais: moderadora ? `${base}/escolher` : undefined,
    },
    {
      id: "lidos",
      nome: "lidos",
      livros: lidos,
      mais: moderadora ? `${base}/adicionar-lido` : undefined,
    },
    {
      id: "proximas",
      nome: votacao ? "sugestões" : "próximas leituras",
      livros: proximas,
      link: `${base}/sugestoes`,
      mais: `${base}/sugerir`,
    },
  ];
  // em "todas", as prateleiras vazias somem (menos coisa na tela)
  const visiveis =
    filtro === "todas"
      ? linhas.filter((l) => l.livros.length)
      : linhas.filter((l) => l.id === filtro);

  const itens = (ls: LivroDoClube[]): ItemVitrine[] =>
    ls.map((l) => ({
      id: l.id,
      titulo: l.livro.titulo,
      autor: l.livro.autor,
      capa: l.livro.capa,
      paginas: l.livro.paginas,
      href: l.estado === "lendo" ? `${base}/leitura` : `${base}/livro/${l.id}`,
      legenda: quemTrouxe(l, membros, eu),
      segurar: moderadora ? () => excluir(l) : undefined,
      acao:
        moderadora && editando ? (
          <button
            type="button"
            aria-label={`tirar ${l.livro.titulo} da estante`}
            onClick={() => excluir(l)}
            className="flex size-6 items-center justify-center rounded-full border border-creme bg-bordo text-xs leading-none text-creme shadow-[0_2px_6px_rgba(43,20,32,.35)]"
          >
            ×
          </button>
        ) : undefined,
    }));

  const acao =
    "flex min-h-9 items-center rounded-pill border border-bordo px-4 text-xs font-semibold text-bordo hover:bg-bordo/5 lg:text-[11px] lg:font-bold lg:tracking-[.1em] lg:uppercase";

  return (
    <div className="px-6 pt-5 pb-6 lg:px-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-revista text-[28px] leading-none text-bordo italic lg:text-[36px]">{tituloDe(identidade, "estante")}</h2>
          <span className="text-[13px] text-cinza">
            {todos.length} {todos.length === 1 ? "livro" : "livros"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {moderadora && editando ? (
            <button type="button" onClick={() => setEditando(false)} className={`${acao} border-bordo bg-bordo text-creme`}>
              concluir edição
            </button>
          ) : null}
          <Link href={`${base}/sugerir`} className={`${acao} border-bordo bg-bordo text-creme hover:bg-bordo`}>
            + adicionar livro
          </Link>
          <div ref={caixaMenu} className="relative">
            <button type="button" aria-label="mais ações da estante" aria-expanded={menu} onClick={() => setMenu((m) => !m)} className="grid size-10 place-items-center rounded-full border border-bordo/40 text-bordo hover:border-bordo">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <circle cx="5" cy="12" r="1.8" />
                <circle cx="12" cy="12" r="1.8" />
                <circle cx="19" cy="12" r="1.8" />
              </svg>
            </button>
            {menu ? (
              <div role="menu" className="absolute top-12 right-0 z-30 w-60 overflow-hidden rounded-[6px] border border-linha bg-papel py-1 shadow-[0_14px_30px_-16px_rgba(43,20,32,.45)]">
                <Link role="menuitem" href={`${base}/sugerir`} className="block px-4 py-2.5 text-[13px] text-ameixa hover:bg-rosa-fundo">
                  sugerir livro
                </Link>
                <Link role="menuitem" href={`${base}/sugestoes`} className="block px-4 py-2.5 text-[13px] text-ameixa hover:bg-rosa-fundo">
                  {votacao ? "votar nas sugestões" : "ver a fila na agenda"}
                </Link>
                {moderadora ? (
                  <>
                    <Link role="menuitem" href={`${base}/adicionar-lido`} className="block px-4 py-2.5 text-[13px] text-ameixa hover:bg-rosa-fundo">
                      adicionar leitura anterior
                    </Link>
                    <button role="menuitem" type="button" onClick={() => (setEditando(true), setMenu(false))} className="block w-full px-4 py-2.5 text-left text-[13px] text-ameixa hover:bg-rosa-fundo">
                      editar estante
                    </button>
                    <Link role="menuitem" href={`${base}/studio`} className="block px-4 py-2.5 text-[13px] text-ameixa hover:bg-rosa-fundo">
                      personalizar estante
                    </Link>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-pill border border-linha px-4 sm:max-w-[320px]" style={{ background: "var(--club-input-bg)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-none text-cinza" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="sr-only">buscar livro</span>
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="buscar livro ou autor" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-cinza" />
        </label>
        <label className="flex h-10 items-center gap-1.5 text-[12px] text-tinta-suave">
          <span className="sr-only sm:not-sr-only">ordenar</span>
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-10 rounded-pill border border-linha bg-transparent px-3 text-[12px] text-ameixa outline-none focus:border-bordo">
            {ORDENS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nome}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="filtrar a estante"
          className="-mx-6 flex gap-[7px] overflow-x-auto px-6 [scrollbar-width:none] lg:mx-0 lg:px-0"
        >
          {[
            { id: "todas", nome: "todos" },
            ...linhas.map((l) => ({
              id: l.id,
              nome: l.livros.length ? `${l.nome} · ${l.livros.length}` : l.nome,
            })),
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filtro === f.id}
              onClick={() => setFiltro(f.id)}
              className={`flex h-9 flex-none items-center rounded-pill border px-[13px] text-xs font-semibold whitespace-nowrap ${
                filtro === f.id
                  ? "border-bordo bg-bordo text-creme"
                  : "border-bege bg-creme-quente text-ameixa"
              }`}
            >
              {f.nome}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <SeletorVisualizacao vis={vis === "catalogo" ? "prateleira" : vis} onChange={setVis} />
          <button type="button" aria-pressed={vis === "catalogo"} onClick={() => setVis(vis === "catalogo" ? "prateleira" : "catalogo")} className={`flex h-9 items-center rounded-pill border px-3 text-[12px] font-semibold ${vis === "catalogo" ? "border-bordo bg-bordo text-creme" : "border-linha text-ameixa"}`}>
            catálogo
          </button>
        </div>
      </div>

      {!todos.length ? (
        <Vazio className="mt-6" titulo="uma estante por preencher." texto="adicione o primeiro livro do clube." acao={{ href: `${base}/sugerir`, rotulo: "adicionar livro" }} />
      ) : !livros.length ? (
        <p className="mt-8 font-accent text-sm text-cinza italic">nenhum livro encontrado para “{busca}”.</p>
      ) : (
        <div
          className={`mt-7 flex flex-col ${vis === "prateleira" ? "gap-10" : "gap-8"}`}
        >
          {visiveis.map((linha) => (
            <section key={linha.id} className="animate-subir">
              <div className="mb-3.5 flex items-baseline justify-between gap-3 border-b border-ameixa/70 pb-2">
                <h3 className="font-display text-xl leading-none font-semibold italic text-bordo lg:font-revista lg:text-2xl lg:font-normal lg:text-ameixa">
                  {linha.nome}
                </h3>
                {linha.link ? (
                  <Link
                    href={linha.link}
                    className="text-[10px] font-bold tracking-[.12em] text-bordo uppercase"
                  >
                    {linha.id === "lendo"
                      ? "ver leitura →"
                      : votacao
                        ? "votar →"
                        : "organizar fila →"}
                  </Link>
                ) : null}
              </div>
              {!linha.livros.length ? (
                <p className="font-accent text-sm italic text-cinza">
                  {linha.id === "lendo"
                    ? "nenhuma leitura atual."
                    : linha.id === "lidos"
                      ? "nenhum livro lido ainda."
                      : "nenhum livro sugerido ainda."}{" "}
                  {linha.mais ? (
                    <Link
                      href={linha.mais}
                      className="text-bordo underline underline-offset-4"
                    >
                      {linha.id === "lendo"
                        ? "definir próxima leitura →"
                        : linha.id === "lidos"
                          ? "adicionar leitura anterior →"
                          : "sugerir livro →"}
                    </Link>
                  ) : null}
                </p>
              ) : vis === "catalogo" ? (
                <ul className="divide-y divide-linha border-y border-linha lg:divide-fio lg:border-fio">
                  {linha.livros.map((l) => {
                    const nota = notaDe(l.id);
                    return (
                      <li key={l.id}>
                        <Link href={l.estado === "lendo" ? `${base}/leitura` : `${base}/livro/${l.id}`} className="flex items-center gap-3 py-2.5 hover:bg-rosa-fundo/50">
                          <span className="w-[34px] flex-none">
                            <CapaAuto livro={l.livro} className="w-full [&>span:last-child]:hidden" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] text-ameixa">{l.livro.titulo}</span>
                            <span className="block truncate text-[12px] text-tinta-suave">
                              {l.livro.autor}
                              {quemTrouxe(l, membros, eu) ? ` · ${quemTrouxe(l, membros, eu)}` : ""}
                            </span>
                          </span>
                          <span className="hidden flex-none text-right text-[11px] text-tinta-suave sm:block">
                            {l.rodada ? `VOL. ${String(l.rodada).padStart(2, "0")}` : ""}
                            {l.encerrado_em ? <span className="block">{new Date(l.encerrado_em).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "")}</span> : null}
                          </span>
                          <span className="w-[44px] flex-none text-right text-[12px] tabular-nums text-bordo">{nota ? `${nota.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}★` : ""}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : vis === "leque" ? (
                <LequeLinhaWeb livros={itens(linha.livros)} />
              ) : vis === "estante" ? (
                <EstanteDeVerdadeFila
                  livros={itens(linha.livros)}
                  alturaBase={150}
                />
              ) : (
                <PrateleiraCapas
                  livros={itens(linha.livros)}
                  maisHref={linha.mais}
                  maisRotulo={`adicionar em ${linha.nome}`}
                />
              )}
            </section>
          ))}
        </div>
      )}




    </div>
  );
}
