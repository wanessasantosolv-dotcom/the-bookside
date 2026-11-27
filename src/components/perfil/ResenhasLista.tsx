"use client";
import { ComSpoiler } from "@/components/marginalia/ComSpoiler";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import { Icone, MenuDeAcoes, type AcaoDoMenu } from "@/components/estantes/Biblioteca";
import { corDoLivro } from "@/lib/cores";
import { traduzirGenero } from "@/lib/generos";
import { reacaoDe } from "@/lib/reacoes";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";

// ───────── regras ─────────

/** resenha = livro com texto escrito pela pessoa (nota só com estrelas não conta) */
const temResenha = (l: LivroSalvo) => !!l.resenha?.trim();

type Ordem = "recentes" | "antigas" | "maior" | "menor";
type FiltroNota = "todas" | "5" | "4" | "3" | "2" | "sem";
type Modo = "editorial" | "compacto";

const ORDENS: { id: Ordem; nome: string }[] = [
  { id: "recentes", nome: "Mais recentes" },
  { id: "antigas", nome: "Mais antigas" },
  { id: "maior", nome: "Maior avaliação" },
  { id: "menor", nome: "Menor avaliação" },
];
const NOTAS: { id: FiltroNota; nome: string }[] = [
  { id: "todas", nome: "Todas as notas" },
  { id: "5", nome: "5 estrelas" },
  { id: "4", nome: "4 ou mais" },
  { id: "3", nome: "3 ou mais" },
  { id: "2", nome: "Até 2" },
  { id: "sem", nome: "Sem nota" },
];
const POR_PAGINA = 12;

const dataDe = (l: LivroSalvo) => l.lidoEm ?? l.adicionadoEm ?? "";
const generoDe = (l: LivroSalvo) => traduzirGenero(l.genero);
const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const numero = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dataLonga = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });

function passaNota(l: LivroSalvo, f: FiltroNota) {
  if (f === "todas") return true;
  if (f === "sem") return !l.nota;
  if (!l.nota) return false;
  if (f === "2") return l.nota <= 2;
  return l.nota >= Number(f);
}

// ───────── peças ─────────

/** estrelas discretas com meia estrela + valor numérico */
function Nota({ nota, grande }: { nota?: number; grande?: boolean }) {
  if (!nota) return <span className="text-[12px] text-cinza">sem nota</span>;
  return (
    <span className="inline-flex items-center gap-2" aria-label={`nota ${numero(nota)} de 5`}>
      <span aria-hidden className={`flex gap-[2px] ${grande ? "text-[15px]" : "text-[13px]"}`}>
        {[1, 2, 3, 4, 5].map((i) => {
          const parte = Math.max(0, Math.min(1, nota - (i - 1)));
          return (
            <span key={i} className="relative inline-block leading-none text-linha">
              ★
              <span className="absolute inset-0 overflow-hidden text-bordo" style={{ width: `${parte * 100}%` }}>
                ★
              </span>
            </span>
          );
        })}
      </span>
      <span className={`font-semibold text-ameixa tabular-nums ${grande ? "text-[14px]" : "text-[12px]"}`}>{numero(nota)}</span>
    </span>
  );
}

function Capa({ l, largura }: { l: LivroSalvo; largura: string }) {
  return (
    <Link href={`/livro/${l.id}`} aria-label={`abrir ${l.titulo}`} className={`block flex-none ${largura}`}>
      <CapaLivro
        titulo={l.titulo}
        capa={l.capa}
        cor={corDoLivro(l.id)}
        className="w-full !rounded-[2px] !shadow-[1px_2px_5px_-2px_rgba(43,20,32,.3)] [&>span:last-child]:hidden"
      />
    </Link>
  );
}

/** o texto com parágrafos preservados; resenhas longas abrem e fecham ali mesmo */
function Texto({ texto, linhas }: { texto: string; linhas: 3 | 5 }) {
  const [aberto, setAberto] = useState(false);
  const [longo, setLongo] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && !aberto) setLongo(el.scrollHeight > el.clientHeight + 4);
  }, [texto, linhas, aberto]);
  const paragrafos = texto.trim().split(/\n{2,}/);
  return (
    <div>
      <div
        ref={ref}
        className={`space-y-3 text-[15px] leading-[1.7] text-ameixa ${aberto ? "" : linhas === 3 ? "line-clamp-3" : "line-clamp-5"}`}
      >
        {paragrafos.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
      </div>
      {longo || aberto ? (
        <button
          type="button"
          aria-expanded={aberto}
          onClick={() => setAberto((v) => !v)}
          className="mt-2 text-[13px] font-semibold text-bordo hover:underline"
        >
          {aberto ? "Recolher" : "Continuar lendo"}
        </button>
      ) : null}
    </div>
  );
}

function Rodape({ l }: { l: LivroSalvo }) {
  const g = generoDe(l);
  const r = reacaoDe(l.reacao);
  return (
    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12px] text-cinza [&>span[aria-hidden]]:select-none">
      {l.lidoEm ? <span>{l.lidoSoAno ? `lido em ${new Date(l.lidoEm).getFullYear()}` : `lido em ${dataLonga(l.lidoEm)}`}</span> : <span>sem data de leitura</span>}
      {g ? (
        <>
          <span aria-hidden>·</span>
          <span>{maiuscula(g)}</span>
        </>
      ) : null}
      {r ? (
        <>
          <span aria-hidden>·</span>
          <span>{r.nome}</span>
        </>
      ) : null}
      {l.amei ? (
        <>
          <span aria-hidden>·</span>
          <span className="text-bordo">♥ amei</span>
        </>
      ) : null}
    </p>
  );
}

// ───────── uma resenha ─────────

function Resenha({ l, modo, acoes }: { l: LivroSalvo; modo: Modo; acoes: AcaoDoMenu[] }) {
  if (modo === "compacto") {
    return (
      <li className="grid grid-cols-[44px_minmax(0,1fr)_auto] gap-x-4 border-b border-linha py-4 lg:border-fio">
        <Capa l={l} largura="w-[44px]" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <Link href={`/livro/${l.id}`} className="font-revista text-[18px] leading-tight text-bordo hover:underline">
              {l.titulo}
            </Link>
            <span className="text-[12px] text-cinza">{l.autor}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[12px] text-cinza">
            <Nota nota={l.nota} />
            {l.lidoEm ? <span>{l.lidoSoAno ? `lido em ${new Date(l.lidoEm).getFullYear()}` : `lido em ${dataLonga(l.lidoEm)}`}</span> : null}
          </div>
          <ComSpoiler spoiler={l.resenhaSpoiler}><p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-tinta-suave">{l.resenha}</p></ComSpoiler>
        </div>
        <MenuDeAcoes semTexto rotulo={`ações da resenha de ${l.titulo}`} acoes={acoes} />
      </li>
    );
  }
  return (
    <li className="border-b border-linha py-8 lg:border-fio">
      {/* celular: capa + identidade lado a lado, texto embaixo */}
      <div className="grid grid-cols-[72px_minmax(0,1fr)_auto] gap-x-4 lg:grid-cols-[minmax(90px,12%)_minmax(0,23%)_minmax(0,1fr)_auto] lg:gap-x-8">
        <Capa l={l} largura="w-[72px] lg:col-start-1 lg:w-[100px]" />
        <div className="min-w-0 lg:col-start-2">
          <Link href={`/livro/${l.id}`} className="block font-revista text-[21px] leading-[1.15] text-bordo hover:underline lg:text-[24px]">
            {l.titulo}
          </Link>
          <p className="mt-1.5 text-[13px] text-tinta-suave">{l.autor}</p>
          {l.paginas ? <p className="mt-1 hidden text-[12px] text-cinza lg:block">{l.paginas} páginas</p> : null}
          <div className="mt-2 lg:hidden">
            <Nota nota={l.nota} />
          </div>
        </div>
        <div className="col-span-3 row-start-2 mt-4 min-w-0 lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:mt-0">
          <div className="hidden lg:block">
            <Nota nota={l.nota} grande />
          </div>
          <div className="mt-0 lg:mt-3">
            <ComSpoiler spoiler={l.resenhaSpoiler}><Texto texto={l.resenha ?? ""} linhas={5} /></ComSpoiler>
          </div>
          {l.citacao ? (
            <blockquote className="mt-4 border-l-2 border-bordo/40 pl-3 font-accent text-[15px] text-bordo italic">
              “{l.citacao.trim().replace(/^["“”'«]+|["“”'»]+$/g, "")}”
            </blockquote>
          ) : null}
          <div className="mt-4">
            <Rodape l={l} />
          </div>
        </div>
        <div className="col-start-3 row-start-1 justify-self-end lg:col-start-4">
          <MenuDeAcoes semTexto rotulo={`ações da resenha de ${l.titulo}`} acoes={acoes} />
        </div>
      </div>
    </li>
  );
}

function Destaque({ l, acoes }: { l: LivroSalvo; acoes: AcaoDoMenu[] }) {
  return (
    <section aria-label="resenha em destaque" className="mt-8 rounded-[10px] bg-creme-quente px-5 py-6 lg:px-8 lg:py-7">
      <div className="grid grid-cols-[84px_minmax(0,1fr)_auto] gap-x-5 lg:grid-cols-[120px_minmax(0,1fr)_auto] lg:gap-x-8">
        <Capa l={l} largura="w-[84px] lg:w-[120px]" />
        <div className="min-w-0">
          <p className="text-[11px] font-bold tracking-[.14em] text-bordo uppercase">Em destaque</p>
          <Link href={`/livro/${l.id}`} className="mt-1.5 block font-revista text-[24px] leading-[1.1] text-bordo hover:underline lg:text-[30px]">
            {l.titulo}
          </Link>
          <p className="mt-1 text-[13px] text-tinta-suave">{l.autor}</p>
          <div className="mt-2">
            <Nota nota={l.nota} grande />
          </div>
          <div className="mt-4 hidden lg:block">
            <ComSpoiler spoiler={l.resenhaSpoiler}><Texto texto={l.resenha ?? ""} linhas={3} /></ComSpoiler>
          </div>
        </div>
        <MenuDeAcoes semTexto rotulo={`ações da resenha de ${l.titulo}`} acoes={acoes} />
        <div className="col-span-3 mt-4 lg:hidden">
          <ComSpoiler spoiler={l.resenhaSpoiler}><Texto texto={l.resenha ?? ""} linhas={3} /></ComSpoiler>
        </div>
      </div>
    </section>
  );
}

// ───────── a aba ─────────

const campo =
  "h-9 rounded-[8px] border border-linha bg-transparent px-2.5 text-[13px] text-ameixa focus:border-bordo focus:outline-none";

/** a aba "resenhas" do perfil: um arquivo pessoal de crítica, com as palavras da pessoa em primeiro plano */
export function ResenhasLista() {
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  const fixada = usePerfil((s) => s.resenhaFixada ?? null);
  const atualizar = usePerfil((s) => s.atualizar);
  const editarLivro = usePerfil((s) => s.editarLivro);

  const [aba, setAba] = useState<"publicadas" | "pendentes">("publicadas");
  const [busca, setBusca] = useState("");
  const [nota, setNota] = useState<FiltroNota>("todas");
  const [genero, setGenero] = useState("todos");
  const [ano, setAno] = useState("todos");
  const [ordem, setOrdem] = useState<Ordem>("recentes");
  const [modo, setModo] = useState<Modo>("editorial");
  const [painel, setPainel] = useState(false);
  const [quantas, setQuantas] = useState(POR_PAGINA);
  const [apagando, setApagando] = useState<LivroSalvo | null>(null);
  const [aviso, setAviso] = useState("");

  useEffect(() => {
    try {
      if (localStorage.getItem("bookside-resenhas-modo") === "compacto") setModo("compacto");
    } catch {
      /* sem armazenamento */
    }
  }, []);
  const mudarModo = (m: Modo) => {
    setModo(m);
    try {
      localStorage.setItem("bookside-resenhas-modo", m);
    } catch {
      /* sem armazenamento */
    }
  };

  const resenhas = useMemo(() => livros.filter(temResenha), [livros]);
  const pendentes = useMemo(
    () => livros.filter((l) => l.status === "lido" && !temResenha(l)).sort((a, b) => dataDe(b).localeCompare(dataDe(a))),
    [livros],
  );
  const generos = useMemo(
    () => [...new Set(resenhas.map(generoDe).filter((g): g is string => !!g))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [resenhas],
  );
  const anos = useMemo(
    () => [...new Set(resenhas.map((l) => l.lidoEm?.slice(0, 4)).filter((a): a is string => !!a))].sort().reverse(),
    [resenhas],
  );

  useEffect(() => setQuantas(POR_PAGINA), [busca, nota, genero, ano, ordem]);

  if (!hidratado) {
    return (
      <div aria-busy className="space-y-6 pt-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-[6px] bg-linha/40" />
        ))}
      </div>
    );
  }

  // ── números ──
  const comNota = resenhas.filter((l) => l.nota);
  const media = comNota.length ? comNota.reduce((t, l) => t + (l.nota ?? 0), 0) / comNota.length : null;
  const mesAtual = new Date().toISOString().slice(0, 7);
  const noMes = resenhas.filter((l) => l.lidoEm?.startsWith(mesAtual)).length;

  // ── filtros (os mesmos para os dois modos) ──
  const q = semAcento(busca.trim());
  const filtradas = resenhas
    .filter(
      (l) =>
        (!q || semAcento(`${l.titulo} ${l.autor} ${l.resenha ?? ""}`).includes(q)) &&
        passaNota(l, nota) &&
        (genero === "todos" || generoDe(l) === genero) &&
        (ano === "todos" || l.lidoEm?.startsWith(ano)),
    )
    .sort((a, b) => {
      if (ordem === "antigas") return dataDe(a).localeCompare(dataDe(b));
      if (ordem === "maior") return (b.nota ?? 0) - (a.nota ?? 0) || dataDe(b).localeCompare(dataDe(a));
      if (ordem === "menor") return (a.nota ?? 6) - (b.nota ?? 6) || dataDe(b).localeCompare(dataDe(a));
      return dataDe(b).localeCompare(dataDe(a));
    });
  const filtrando = !!q || nota !== "todas" || genero !== "todos" || ano !== "todos";
  const livroFixado = fixada ? resenhas.find((l) => l.id === fixada) : undefined;
  // a fixada sai da lista só quando não há filtro (para não sumir de uma busca)
  const lista = filtradas.filter((l) => filtrando || l.id !== livroFixado?.id);
  const qtdSecundarios = [nota !== "todas", genero !== "todos", ano !== "todos"].filter(Boolean).length;

  const limpar = () => {
    setBusca("");
    setNota("todas");
    setGenero("todos");
    setAno("todos");
  };

  const compartilhar = async (l: LivroSalvo) => {
    const url = `${window.location.origin}/livro/${l.id}`;
    const texto = `Minha resenha de ${l.titulo}, de ${l.autor}${l.nota ? ` · ${numero(l.nota)}★` : ""}`;
    try {
      if (navigator.share) await navigator.share({ title: l.titulo, text: texto, url });
      else {
        await navigator.clipboard.writeText(`${texto}\n${url}`);
        setAviso("Link copiado.");
        setTimeout(() => setAviso(""), 2500);
      }
    } catch {
      /* a pessoa cancelou */
    }
  };

  const acoesDe = (l: LivroSalvo): AcaoDoMenu[] => [
    { tipo: "link", nome: "Editar resenha", href: `/livro/${l.id}/avaliar` },
    { tipo: "botao", nome: fixada === l.id ? "Desafixar do topo" : "Fixar no topo", onClick: () => atualizar({ resenhaFixada: fixada === l.id ? null : l.id }) },
    { tipo: "botao", nome: "Compartilhar", onClick: () => { compartilhar(l); } },
    { tipo: "link", nome: "Criar story", href: `/story?tipo=terminei&livro=${l.id}` },
    { tipo: "botao", nome: "Excluir resenha", perigo: true, onClick: () => setApagando(l) },
  ];

  const filtrosSecundarios = (
    <>
      <label className="flex items-center gap-2">
        <span className="sr-only lg:not-sr-only lg:text-cinza">Nota</span>
        <select value={nota} onChange={(e) => setNota(e.target.value as FiltroNota)} className={`${campo} w-full lg:w-auto`} aria-label="filtrar por avaliação">
          {NOTAS.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nome}
            </option>
          ))}
        </select>
      </label>
      {generos.length ? (
        <label className="flex items-center gap-2">
          <span className="sr-only lg:not-sr-only lg:text-cinza">Gênero</span>
          <select value={genero} onChange={(e) => setGenero(e.target.value)} className={`${campo} w-full lg:w-auto lg:max-w-[180px]`} aria-label="filtrar por gênero">
            <option value="todos">Todos os gêneros</option>
            {generos.map((g) => (
              <option key={g} value={g}>
                {maiuscula(g)}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {anos.length ? (
        <label className="flex items-center gap-2">
          <span className="sr-only lg:not-sr-only lg:text-cinza">Ano</span>
          <select value={ano} onChange={(e) => setAno(e.target.value)} className={`${campo} w-full lg:w-auto`} aria-label="filtrar por ano de leitura">
            <option value="todos">Todos os anos</option>
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
      ) : null}
    </>
  );

  return (
    <div className="text-ameixa">
      {/* abertura */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-revista text-[34px] leading-none text-bordo italic lg:text-[44px]">Resenhas</h2>
          <p className="mt-2 text-[14px] text-tinta-suave">Impressões e reflexões sobre suas leituras.</p>
        </div>
        {pendentes.length ? (
          <Link
            href={`/livro/${pendentes[0].id}/avaliar`}
            className="inline-flex h-10 items-center gap-2 rounded-full border border-bordo px-4 text-[13px] font-semibold text-bordo hover:bg-bordo/5"
          >
            Escrever resenha
          </Link>
        ) : null}
      </header>

      {/* números */}
      <dl className="mt-6 grid grid-cols-3 border-y border-linha py-4 lg:border-fio">
        {[
          { n: String(resenhas.length), r: resenhas.length === 1 ? "resenha" : "resenhas" },
          { n: media !== null ? numero(media) : "—", r: "média das notas" },
          { n: String(noMes), r: "lidas e resenhadas este mês" },
        ].map((x, i) => (
          <div key={x.r} className={`px-2 text-center ${i ? "border-l border-linha lg:border-fio" : ""}`}>
            <dd className="font-revista text-[26px] leading-none text-bordo tabular-nums lg:text-[32px]">{x.n}</dd>
            <dt className="mt-1.5 text-[11px] text-tinta-suave lg:text-[12px]">{x.r}</dt>
          </div>
        ))}
      </dl>

      {/* publicadas · sem resenha */}
      <div role="tablist" aria-label="tipo" className="mt-5 flex gap-4 text-[13px]">
        {(
          [
            ["publicadas", `Publicadas (${resenhas.length})`],
            ["pendentes", `Lidos sem resenha (${pendentes.length})`],
          ] as const
        ).map(([id, nome]) => (
          <button
            key={id}
            role="tab"
            type="button"
            aria-selected={aba === id}
            onClick={() => setAba(id)}
            className={`border-b-2 pb-1 ${aba === id ? "border-bordo font-semibold text-bordo" : "border-transparent text-cinza hover:text-ameixa"}`}
          >
            {nome}
          </button>
        ))}
      </div>

      {aba === "pendentes" ? (
        pendentes.length ? (
          <ul className="mt-4 border-t border-linha lg:border-fio">
            {pendentes.map((l) => (
              <li key={l.id} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-4 border-b border-linha py-3 lg:border-fio">
                <Capa l={l} largura="w-[36px]" />
                <div className="min-w-0">
                  <Link href={`/livro/${l.id}`} className="block truncate font-revista text-[16px] text-bordo hover:underline">
                    {l.titulo}
                  </Link>
                  <span className="flex flex-wrap items-center gap-x-3 text-[12px] text-cinza">
                    {l.autor}
                    {l.nota ? <Nota nota={l.nota} /> : null}
                  </span>
                </div>
                <Link href={`/livro/${l.id}/avaliar`} className="text-[13px] font-semibold text-bordo hover:underline">
                  escrever
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-10 font-accent text-[15px] text-cinza italic">Todos os seus lidos já têm resenha.</p>
        )
      ) : !resenhas.length ? (
        <div className="py-12">
          <p className="font-revista text-[24px] text-bordo italic">Você ainda não escreveu nenhuma resenha.</p>
          <p className="mt-2 text-[14px] text-tinta-suave">
            {pendentes.length
              ? `Você tem ${pendentes.length === 1 ? "um livro lido" : `${pendentes.length} livros lidos`} esperando suas palavras.`
              : "Quando terminar um livro, conte aqui o que ficou dele."}
          </p>
          {pendentes.length ? (
            <Link href={`/livro/${pendentes[0].id}/avaliar`} className="mt-4 inline-block text-[14px] font-semibold text-bordo hover:underline">
              Começar por {pendentes[0].titulo} →
            </Link>
          ) : null}
        </div>
      ) : (
        <>
          {/* barra: busca, filtros, ordem e modo */}
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
            <label className="relative min-w-0 flex-1 basis-[220px]">
              <span className="sr-only">Buscar por livro, autoria ou texto da resenha</span>
              <Icone d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4" className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-cinza" />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por livro, autoria ou texto"
                className={`${campo} h-10 w-full pl-9`}
              />
            </label>
            <div className="hidden items-center gap-4 text-[13px] lg:flex">{filtrosSecundarios}</div>
            <button
              type="button"
              onClick={() => setPainel(true)}
              className={`${campo} h-10 lg:hidden`}
              aria-haspopup="dialog"
            >
              Filtros{qtdSecundarios ? ` (${qtdSecundarios})` : ""}
            </button>
            <label className="flex items-center gap-2 text-[13px]">
              <span className="sr-only">Ordenar</span>
              <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className={`${campo} h-10`} aria-label="ordenar resenhas">
                {ORDENS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome}
                  </option>
                ))}
              </select>
            </label>
            <div role="group" aria-label="modo de visualização" className="flex rounded-[8px] border border-linha p-0.5 text-[12px]">
              {(["editorial", "compacto"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={modo === m}
                  onClick={() => mudarModo(m)}
                  className={`h-8 rounded-[6px] px-3 ${modo === m ? "bg-bordo text-creme" : "text-ameixa hover:text-bordo"}`}
                >
                  {maiuscula(m)}
                </button>
              ))}
            </div>
          </div>

          {livroFixado && !filtrando ? <Destaque l={livroFixado} acoes={acoesDe(livroFixado)} /> : null}

          {!lista.length && filtrando ? (
            <div className="py-12">
              <p className="font-revista text-[22px] text-bordo italic">Nenhuma resenha encontrada.</p>
              <button type="button" onClick={limpar} className="mt-2 text-[13px] font-semibold text-bordo hover:underline">
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              {filtrando ? (
                <p className="mt-5 text-[12px] text-cinza">
                  {lista.length} {lista.length === 1 ? "resenha" : "resenhas"} ·{" "}
                  <button type="button" onClick={limpar} className="font-semibold text-bordo hover:underline">
                    limpar filtros
                  </button>
                </p>
              ) : null}
              <ul className={`mt-4 border-t border-linha lg:border-fio ${livroFixado && !filtrando ? "mt-8" : ""}`}>
                {lista.slice(0, quantas).map((l) => (
                  <Resenha key={l.id} l={l} modo={modo} acoes={acoesDe(l)} />
                ))}
              </ul>
              {lista.length > quantas ? (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setQuantas((n) => n + POR_PAGINA)}
                    className="h-10 rounded-full border border-linha px-5 text-[13px] font-semibold text-bordo hover:border-bordo"
                  >
                    Mostrar mais ({lista.length - quantas})
                  </button>
                </div>
              ) : null}
            </>
          )}
        </>
      )}

      {/* filtros no celular */}
      {painel ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="filtros"
          className="fixed inset-0 z-50 flex items-end bg-ameixa/40 lg:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPainel(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setPainel(false);
          }}
        >
          <div className="w-full rounded-t-[18px] bg-papel px-6 pt-5 pb-8">
            <p className="font-revista text-[22px] text-bordo italic">Filtros</p>
            <div className="mt-4 grid gap-3 text-[14px]">{filtrosSecundarios}</div>
            <div className="mt-6 flex justify-between">
              <button type="button" onClick={limpar} className="h-11 text-[14px] font-semibold text-cinza">
                Limpar
              </button>
              <button type="button" autoFocus onClick={() => setPainel(false)} className="h-11 rounded-full bg-bordo px-6 text-[14px] font-semibold text-creme">
                Ver {filtradas.length} {filtradas.length === 1 ? "resenha" : "resenhas"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* confirmar exclusão */}
      {apagando ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="excluir resenha"
          className="fixed inset-0 z-50 grid place-items-center bg-ameixa/40 px-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setApagando(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setApagando(null);
          }}
        >
          <div className="w-full max-w-[380px] rounded-[12px] border border-linha bg-papel p-5">
            <p className="font-revista text-[22px] text-bordo italic">Excluir a resenha de {apagando.titulo}?</p>
            <p className="mt-2 text-[14px] text-tinta-suave">Só o texto sai. O livro, a nota e o resto da ficha continuam.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setApagando(null)} className="h-10 rounded-full px-4 text-[13px] font-semibold text-cinza">
                cancelar
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  editarLivro(
                    { id: apagando.id, titulo: apagando.titulo, autor: apagando.autor, capa: apagando.capa, genero: apagando.genero },
                    { resenha: undefined },
                  );
                  if (fixada === apagando.id) atualizar({ resenhaFixada: null });
                  setApagando(null);
                }}
                className="h-10 rounded-full bg-bordo px-5 text-[13px] font-semibold text-creme"
              >
                excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {aviso ? (
        <p role="status" className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ameixa px-4 py-2 text-[13px] text-creme">
          {aviso}
        </p>
      ) : null}
    </div>
  );
}
