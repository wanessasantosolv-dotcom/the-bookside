"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { AdicionarALista } from "@/components/descoberta/AdicionarALista";
import { dadosDoTermino, PerguntaTermino } from "@/components/PerguntaTermino";
import { chaveTitulo, lembrarLivros, type LivroBusca } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { buscarDescoberta, surpresa, type Contexto, type Resposta, type Resultado } from "@/lib/descoberta";
import { usePerfil, type StatusLivro } from "@/lib/perfil-store";
import { CARACTERISTICAS, NOMES_CATEGORIA, PORID, type Caracteristica, type Categoria } from "@/lib/taxonomia";

/*
 * A busca única: título, autor, ISBN e pesquisas por temas e sensações no
 * mesmo campo. Em Descobrir oferece quero ler / já li / lista; dentro de uma
 * lista, seleção múltipla. A pesquisa fica guardada na aba do navegador para
 * voltar de um livro sem perder nada.
 */

type Modo =
  | { tipo: "descobrir" }
  | { tipo: "lista"; selecionados: Map<string, LivroBusca>; alternar: (l: LivroBusca) => void; naLista: Set<string> };

const GRUPOS: Categoria[] = ["atmosfera", "ritmo", "genero", "tematica", "ambientacao", "origem", "idioma", "extensao", "periodo"];
const ABERTOS_PRIMEIRO: Categoria[] = ["atmosfera", "ritmo", "genero"];

export type BuscaControle = { pesquisar: (q: string) => void; limpar: () => void };

export function Busca({
  modo,
  contexto,
  chaveSessao,
  placeholder = "O que você tem vontade de ler?",
  sugestoes,
  onAtiva,
  controle,
  vazio,
  sugestoesEmLinks = false,
}: {
  modo: Modo;
  contexto?: Contexto;
  /** onde guardar a pesquisa nesta aba (para voltar de um livro) */
  chaveSessao: string;
  placeholder?: string;
  sugestoes: string[];
  onAtiva?: (ativa: boolean) => void;
  /** para outras seções (curadorias, sugestões) dispararem uma pesquisa aqui */
  controle?: (c: BuscaControle) => void;
  /** o que aparece sem pesquisa (ex.: sugestões da lista) */
  vazio?: React.ReactNode;
  /** sugestões como links de texto (Descobrir), em vez de botões */
  sugestoesEmLinks?: boolean;
}) {
  const [texto, setTexto] = useState("");
  const [consulta, setConsulta] = useState("");
  const [filtros, setFiltros] = useState<string[]>([]);
  const [ignorados, setIgnorados] = useState<string[]>([]);
  const [resposta, setResposta] = useState<Resposta | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);
  const [painel, setPainel] = useState(false);
  const pedido = useRef<AbortController | null>(null);
  const restaurado = useRef(false);

  // volta com a pesquisa de antes (ao voltar da página de um livro)
  useEffect(() => {
    try {
      const s = JSON.parse(sessionStorage.getItem(chaveSessao) ?? "null") as { consulta: string; filtros: string[]; ignorados?: string[] } | null;
      if (s && (s.consulta || s.filtros.length)) {
        setTexto(s.consulta);
        setConsulta(s.consulta);
        setFiltros(s.filtros);
        setIgnorados(s.ignorados ?? []);
      }
    } catch {
      /* sem armazenamento */
    }
    restaurado.current = true;
  }, [chaveSessao]);

  const ativa = !!(consulta.trim() || filtros.length);
  useEffect(() => onAtiva?.(ativa), [ativa, onAtiva]);

  useEffect(() => {
    if (!restaurado.current) return;
    try {
      sessionStorage.setItem(chaveSessao, JSON.stringify({ consulta, filtros, ignorados }));
    } catch {
      /* sem armazenamento */
    }
  }, [consulta, filtros, ignorados, chaveSessao]);

  // pesquisa: cancela a anterior; nunca mostra resultado antigo como se fosse novo
  useEffect(() => {
    pedido.current?.abort();
    if (!consulta.trim() && !filtros.length) {
      setResposta(null);
      setCarregando(false);
      setErro(false);
      return;
    }
    const ctrl = new AbortController();
    pedido.current = ctrl;
    setCarregando(true);
    setErro(false);
    setResposta(null);
    const meus = usePerfil.getState().livros.filter((l) => l.status === "lido").map((l) => l.titulo);
    buscarDescoberta({ consulta, filtros, contexto, excluir: modo.tipo === "descobrir" ? meus : [] }, ctrl.signal)
      .then((r) => {
        if (ctrl.signal.aborted) return;
        // um critério reconhecido que a pessoa tirou some do uso
        const criterios = r.criterios.filter((c) => !ignorados.includes(c.id));
        setResposta({ ...r, criterios });
        lembrarLivros(r.resultados.map((x) => x.livro));
      })
      .catch(() => !ctrl.signal.aborted && setErro(true))
      .finally(() => !ctrl.signal.aborted && setCarregando(false));
    return () => ctrl.abort();
    // o contexto entra pela lista; ignorados filtram só a exibição
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consulta, filtros]);

  // digitando: espera uma pausa antes de pesquisar
  useEffect(() => {
    if (!restaurado.current || texto === consulta) return;
    const t = setTimeout(() => setConsulta(texto), texto.trim().length < 3 && texto.trim() ? 99999 : 700);
    return () => clearTimeout(t);
  }, [texto, consulta]);

  const pesquisar = useCallback((q: string) => {
    const final = q === "Me surpreenda" ? surpresa() : q;
    setTexto(final);
    setConsulta(final);
    setIgnorados([]);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => controle?.({ pesquisar, limpar }), [controle, pesquisar]);

  function limpar() {
    setTexto("");
    setConsulta("");
    setFiltros([]);
    setIgnorados([]);
  }

  const reconhecidos = (resposta?.interpretacao.criterios ?? []).filter((c) => !ignorados.includes(c.id));
  const escolhidos = filtros.map((id) => PORID.get(id)).filter((x): x is Caracteristica => !!x);
  const refinamentos = useMemo(() => {
    if (!resposta?.resultados.length) return [];
    const usados = new Set([...reconhecidos, ...escolhidos].map((c) => c.id));
    const conta = new Map<string, number>();
    for (const r of resposta.resultados) for (const c of r.caracteristicas) if (!usados.has(c.id)) conta.set(c.id, (conta.get(c.id) ?? 0) + 1);
    const sugeridos = [...conta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id]) => PORID.get(id)!);
    // extensão e período só quando os dados permitem confirmar
    const comPaginas = resposta.resultados.filter((r) => r.livro.paginas).length;
    const curtos = resposta.resultados.filter((r) => (r.livro.paginas ?? 999) <= 200).length;
    if (!usados.has("curto") && curtos >= 2 && curtos < comPaginas) sugeridos.push(PORID.get("curto")!);
    const recentes = resposta.resultados.filter((r) => (r.livro.ano ?? 0) >= 2000).length;
    if (!usados.has("contemporaneos") && recentes >= 2 && recentes < resposta.resultados.length) sugeridos.push(PORID.get("contemporaneos")!);
    return sugeridos.slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resposta]);

  const visiveis = resposta?.resultados ?? [];

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setConsulta(texto);
        }}
        className="flex gap-2"
      >
        <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-[8px] border border-linha bg-creme-quente px-3 focus-within:border-bordo">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden className="flex-none text-cinza">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="sr-only">Busque por livros, temas ou sensações</span>
          <input
            type="search"
            enterKeyHint="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent text-[16px] text-ameixa outline-none placeholder:text-cinza"
          />
          {texto ? (
            <button type="button" onClick={limpar} aria-label="Limpar pesquisa" className="grid size-8 flex-none place-items-center text-cinza hover:text-bordo">
              ✕
            </button>
          ) : null}
        </label>
        <button
          type="button"
          onClick={() => setPainel(true)}
          aria-label={`Refinar descoberta${filtros.length ? ` (${filtros.length})` : ""}`}
          className={`relative grid h-12 w-12 flex-none place-items-center rounded-[8px] border ${filtros.length ? "border-bordo text-bordo" : "border-linha text-tinta-suave"} bg-creme-quente hover:border-bordo`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
            <circle cx="16" cy="6" r="2" />
            <circle cx="10" cy="12" r="2" />
            <circle cx="18" cy="18" r="2" />
          </svg>
          {filtros.length ? <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-bordo text-[10px] font-semibold text-creme">{filtros.length}</span> : null}
        </button>
      </form>

      {/* critérios em uso: reconhecidos (interpretados) e escolhidos; cada um sai sozinho */}
      {ativa && (reconhecidos.length || escolhidos.length || resposta?.interpretacao.parecidoCom || resposta?.interpretacao.sem.length) ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px]">
          <span className="text-cinza">Entendemos:</span>
          {reconhecidos.map((c) => (
            <Criterio key={c.id} texto={c.nome} onTirar={() => setIgnorados((v) => [...v, c.id])} interpretado />
          ))}
          {resposta?.interpretacao.sem.map((c) => (
            <Criterio key={`sem-${c.id}`} texto={`sem ${c.nome.toLowerCase()}`} interpretado />
          ))}
          {resposta?.interpretacao.parecidoCom ? <Criterio texto={`parecidos com ${resposta.interpretacao.parecidoCom}`} interpretado /> : null}
          {escolhidos.map((c) => (
            <Criterio key={c.id} texto={c.nome} onTirar={() => setFiltros((v) => v.filter((x) => x !== c.id))} />
          ))}
        </div>
      ) : null}

      {!ativa ? (
        <>
          {sugestoesEmLinks ? (
            <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px]">
              <span className="text-cinza">Por onde começar?</span>
              {sugestoes.map((s) => (
                <button key={s} type="button" onClick={() => pesquisar(s)} className="min-h-9 font-semibold text-ameixa underline decoration-rosa-antigo decoration-2 underline-offset-[5px] hover:text-bordo">
                  {s}
                </button>
              ))}
            </p>
          ) : (
          <div className="mt-5">
            <p className="text-[11px] font-semibold tracking-[.14em] text-cinza uppercase">Por onde começar?</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sugestoes.map((s) => (
                <button key={s} type="button" onClick={() => pesquisar(s)} className="min-h-9 rounded-[6px] border border-linha bg-creme-quente px-3 text-[13px] text-tinta-suave hover:border-bordo hover:text-bordo">
                  {s}
                </button>
              ))}
            </div>
          </div>
          )}
          {vazio}
        </>
      ) : (
        <Resultados
          modo={modo}
          carregando={carregando}
          erro={erro}
          resposta={resposta}
          visiveis={visiveis}
          refinamentos={refinamentos}
          refinar={(id) => setFiltros((v) => [...v, id])}
          ampliar={() => {
            setFiltros([]);
            setIgnorados([]);
          }}
          tentar={() => setFiltros((f) => [...f])}
        />
      )}

      {painel ? (
        <Refinar
          iniciais={filtros}
          fechar={() => setPainel(false)}
          aplicar={(ids) => {
            setFiltros(ids);
            setPainel(false);
          }}
        />
      ) : null}
    </div>
  );
}

function Criterio({ texto, onTirar, interpretado }: { texto: string; onTirar?: () => void; interpretado?: boolean }) {
  return (
    <span className={`inline-flex min-h-8 items-center gap-1 rounded-[6px] border px-2.5 ${interpretado ? "border-dashed border-bege text-tinta-suave" : "border-bordo/50 text-ameixa"}`}>
      {texto}
      {onTirar ? (
        <button type="button" onClick={onTirar} aria-label={`Remover ${texto}`} className="-mr-1 grid size-6 place-items-center text-cinza hover:text-bordo">
          ✕
        </button>
      ) : null}
    </span>
  );
}

/* ───────── resultados ───────── */

function Resultados({
  modo,
  carregando,
  erro,
  resposta,
  visiveis,
  refinamentos,
  refinar,
  ampliar,
  tentar,
}: {
  modo: Modo;
  carregando: boolean;
  erro: boolean;
  resposta: Resposta | null;
  visiveis: Resultado[];
  refinamentos: Caracteristica[];
  refinar: (id: string) => void;
  ampliar: () => void;
  tentar: () => void;
}) {
  const livros = usePerfil((s) => s.livros);
  const guardarLivro = usePerfil((s) => s.guardarLivro);
  const [terminando, setTerminando] = useState<LivroBusca | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const meus = useMemo(() => new Map(livros.map((l) => [chaveTitulo(l.titulo), l])), [livros]);

  function marcar(l: LivroBusca, status: StatusLivro, extra = {}) {
    const ja = meus.get(chaveTitulo(l.titulo));
    guardarLivro({ ...(ja ?? {}), id: ja?.id ?? l.id, titulo: ja?.titulo ?? l.titulo, autor: ja?.autor ?? l.autor, capa: ja?.capa ?? l.capa, paginas: ja?.paginas ?? l.paginas, genero: ja?.genero ?? l.genero, status, ...extra });
    setAviso(status === "quero" ? "Livro adicionado ao seu quero ler." : "Leitura registrada.");
  }

  if (carregando)
    return (
      <ul aria-busy className="mt-5 space-y-4">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex animate-pulse gap-3.5">
            <span className="block h-[84px] w-[56px] rounded-[3px] bg-linha" />
            <span className="flex-1 space-y-2 pt-1">
              <span className="block h-4 w-2/3 rounded bg-linha" />
              <span className="block h-3 w-1/3 rounded bg-linha" />
            </span>
          </li>
        ))}
        <li className="text-[12px] text-cinza">Procurando histórias…</li>
      </ul>
    );
  if (erro)
    return (
      <div className="mt-6 text-[14px] text-tinta-suave">
        Não foi possível carregar os resultados. Tente novamente.
        <button type="button" onClick={tentar} className="ml-2 font-semibold text-bordo">
          Tentar de novo
        </button>
      </div>
    );
  if (!resposta) return null;
  if (!visiveis.length)
    return (
      <div className="mt-6 rounded-[8px] border border-dashed border-bege px-4 py-5">
        <p className="font-revista text-[18px] text-ameixa">Não encontramos histórias com essas características.</p>
        <p className="mt-1 text-[13px] text-tinta-suave">Experimente outros termos ou retire alguns filtros.</p>
        <button type="button" onClick={ampliar} className="mt-3 min-h-10 text-[13px] font-semibold text-bordo">
          Ampliar pesquisa
        </button>
      </div>
    );

  const interpretativa = resposta.fonte === "descoberta";
  return (
    <section aria-label="Resultados" className="mt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-revista text-[20px] text-ameixa">{resposta.fonte === "catalogo" ? "Resultados" : "Histórias que combinam com sua busca"}</h2>
        {interpretativa ? <span className="text-[11px] text-cinza">características e justificativas são interpretações</span> : null}
      </div>
      {resposta.avisos.map((a) => (
        <p key={a} className="mt-2 text-[12px] text-tinta-suave">
          {a}
        </p>
      ))}
      {refinamentos.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-semibold tracking-[.12em] text-cinza uppercase">Refinar descoberta</span>
          {refinamentos.map((c) => (
            <button key={c.id} type="button" onClick={() => refinar(c.id)} className="min-h-8 rounded-[6px] border border-linha px-2.5 text-[12px] text-tinta-suave hover:border-bordo hover:text-bordo">
              + {c.nome}
            </button>
          ))}
        </div>
      ) : null}
      {aviso ? (
        <p role="status" className="mt-3 text-[13px] text-oliva">
          {aviso}
        </p>
      ) : null}
      <ul className="mt-3 divide-y divide-linha">
        {visiveis.map((r) => {
          const l = r.livro;
          const meu = meus.get(chaveTitulo(l.titulo));
          const k = chaveTitulo(l.titulo);
          const selecionado = modo.tipo === "lista" && modo.selecionados.has(k);
          const naLista = modo.tipo === "lista" && modo.naLista.has(k);
          const dados = [l.ano, l.paginas ? `${l.paginas.toLocaleString("pt-BR")} páginas` : null].filter(Boolean).join(" · ");
          return (
            <li key={l.id} className={`flex gap-3.5 py-3.5 ${selecionado ? "bg-rosa-fundo/50" : ""}`}>
              <Link href={`/livro/${meu?.id ?? l.id}`} className="w-[56px] flex-none">
                <CapaLivro titulo={l.titulo} cor={l.cor ?? corDoLivro(l.id)} capa={l.capa} className="!w-[56px]" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/livro/${meu?.id ?? l.id}`} className="block text-[15px] leading-snug font-semibold text-ameixa hover:text-bordo">
                  {l.titulo}
                </Link>
                <p className="text-[13px] text-cinza">
                  {l.autor}
                  {dados ? ` · ${dados}` : ""}
                </p>
                {r.caracteristicas.length ? <p className="mt-1 text-[11px] text-tinta-suave">{r.caracteristicas.slice(0, 3).map((c) => c.nome).join(" · ")}</p> : null}
                {r.porque ? <p className="mt-1 text-[13px] leading-snug text-tinta-suave italic">{r.porque}</p> : null}
                {r.fontes?.length || l.editora ? (
                  <details className="mt-1 text-[12px] text-cinza">
                    <summary className="inline-flex min-h-7 cursor-pointer list-none items-center underline-offset-4 hover:text-bordo hover:underline [&::-webkit-details-marker]:hidden">por que este livro?</summary>
                    <div className="mt-1 space-y-1 border-l border-linha pl-3">
                      {l.editora || l.isbn ? (
                        <p>
                          Edição em português{l.editora ? ` · ${l.editora}` : ""}
                          {l.isbn ? ` · ISBN ${l.isbn}` : ""}
                        </p>
                      ) : null}
                      {r.fontes?.length ? (
                        <p>
                          Recomendado em:{" "}
                          {r.fontes.map((f, i) => (
                            <span key={f.url}>
                              {i ? ", " : ""}
                              <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-tinta-suave underline decoration-linha underline-offset-2 hover:text-bordo">
                                {f.titulo}
                              </a>
                            </span>
                          ))}
                        </p>
                      ) : null}
                    </div>
                  </details>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {modo.tipo === "lista" ? (
                    naLista ? (
                      <span className="text-[12px] text-cinza">Já está na lista</span>
                    ) : (
                      <label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-[6px] border border-linha px-2.5 text-[13px] font-semibold text-ameixa has-[:checked]:border-bordo has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordo">
                        <input type="checkbox" checked={selecionado} onChange={() => modo.alternar(l)} className="size-4 accent-[var(--color-bordo)]" />
                        {selecionado ? "Selecionado" : "Selecionar"}
                      </label>
                    )
                  ) : meu && meu.status ? (
                    <>
                      <span className="mr-1 text-[12px] text-cinza">{meu.status === "lido" ? "Você já leu" : meu.status === "quero" ? "No seu quero ler" : "Na sua estante"}</span>
                      <AdicionarALista livro={l} onFeito={setAviso} />
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => marcar(l, "quero")} className="h-9 rounded-[6px] border border-bege px-3 text-[13px] font-semibold text-ameixa hover:border-bordo">
                        Quero ler
                      </button>
                      <button type="button" onClick={() => setTerminando(l)} className="h-9 rounded-[6px] px-2.5 text-[13px] font-semibold text-tinta-suave hover:text-bordo">
                        Já li
                      </button>
                      <AdicionarALista livro={l} onFeito={setAviso} />
                    </>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {terminando ? (
        <PerguntaTermino
          titulo={terminando.titulo}
          onCancelar={() => setTerminando(null)}
          onConfirmar={(t) => {
            marcar(terminando, "lido", dadosDoTermino(t));
            setTerminando(null);
          }}
        />
      ) : null}
    </section>
  );
}

/* ───────── refinar descoberta (painel inferior no celular, lateral no computador) ───────── */

function Refinar({ iniciais, fechar, aplicar }: { iniciais: string[]; fechar: () => void; aplicar: (ids: string[]) => void }) {
  const [sel, setSel] = useState<string[]>(iniciais);
  const [abertos, setAbertos] = useState<Set<Categoria>>(() => new Set(iniciais.map((id) => PORID.get(id)?.categoria).filter((x): x is Categoria => !!x)));
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [fechar]);
  const ordem = [...ABERTOS_PRIMEIRO, ...GRUPOS.filter((g) => !ABERTOS_PRIMEIRO.includes(g))];
  return (
    <div role="dialog" aria-modal="true" aria-label="Refinar descoberta" className="fixed inset-0 z-50 flex items-end bg-[#38252c]/40 lg:items-stretch lg:justify-end" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div className="flex max-h-[88dvh] w-full flex-col rounded-t-[12px] bg-creme lg:max-h-none lg:w-[400px] lg:rounded-none">
        <div className="flex items-center justify-between border-b border-linha px-5 py-3">
          <h2 className="font-revista text-[20px] text-ameixa">Refinar descoberta</h2>
          <button type="button" onClick={fechar} className="min-h-11 px-2 text-[13px] font-semibold text-bordo">
            Fechar
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {ordem.map((g) => {
            const opcoes = CARACTERISTICAS.filter((c) => c.categoria === g);
            const aberto = abertos.has(g);
            const marcados = opcoes.filter((o) => sel.includes(o.id)).length;
            return (
              <div key={g} className="border-b border-linha">
                <button
                  type="button"
                  aria-expanded={aberto}
                  onClick={() => setAbertos((s) => (s.has(g) ? new Set([...s].filter((x) => x !== g)) : new Set([...s, g])))}
                  className="flex min-h-12 w-full items-center justify-between text-left text-[14px] font-semibold text-ameixa"
                >
                  <span>
                    {NOMES_CATEGORIA[g]}
                    {marcados ? <span className="ml-2 text-[12px] font-normal text-bordo">{marcados}</span> : null}
                  </span>
                  <span aria-hidden className={`text-cinza transition-transform ${aberto ? "rotate-180" : ""}`}>
                    ▾
                  </span>
                </button>
                {aberto ? (
                  <div className="flex flex-wrap gap-1.5 pb-3">
                    {opcoes.map((o) => {
                      const on = sel.includes(o.id);
                      return (
                        <button
                          key={o.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setSel((v) => (on ? v.filter((x) => x !== o.id) : [...v, o.id]))}
                          className={`min-h-9 rounded-[6px] border px-3 text-[13px] ${on ? "border-bordo bg-rosa-fundo text-ameixa" : "border-linha text-tinta-suave"}`}
                        >
                          {o.nome}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
          <p className="pt-3 text-[11px] text-cinza">Opções da mesma categoria valem como alternativas; categorias diferentes se somam. Extensão, idioma e período usam os dados da edição.</p>
        </div>
        <div className="flex gap-2 border-t border-linha px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button type="button" onClick={() => setSel([])} className="h-12 rounded-[6px] border border-bege px-4 text-[14px] font-semibold text-ameixa">
            Limpar filtros
          </button>
          <button type="button" onClick={() => aplicar(sel)} className="h-12 flex-1 rounded-[6px] bg-bordo text-[14px] font-semibold text-creme hover:bg-bordo-suave">
            Encontrar livros
          </button>
        </div>
      </div>
    </div>
  );
}
