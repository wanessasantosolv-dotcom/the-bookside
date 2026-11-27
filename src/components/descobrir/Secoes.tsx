"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { buscarLivros, chaveTitulo, type LivroBusca } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { usePerfil } from "@/lib/perfil-store";
import { estantesDasAmigas, nomeDe, type PessoaResumo } from "@/lib/social";

/*
 * As seções de Descobrir abaixo da próxima leitura. Tudo vem de dados reais:
 * a estante da pessoa, o catálogo (busca de verdade) e as estantes públicas
 * de quem ela segue. Sem livros inventados; seção sem resultado não aparece.
 */

type Item = { id: string; titulo: string; autor: string; capa?: string; cor?: string; extra?: string };

const tituloSecao = "font-revista text-[20px] leading-none text-ameixa";

function useNaEstante() {
  const livros = usePerfil((s) => s.livros);
  return useMemo(() => new Set(livros.map((l) => chaveTitulo(l.titulo))), [livros]);
}

/** uma fileira horizontal de capas, com título e autor curtos */
function Fileira({ itens }: { itens: Item[] }) {
  return (
    <ul className="-mx-6 flex snap-x gap-3.5 overflow-x-auto px-6 pb-2 [scrollbar-width:none] lg:mx-0 lg:px-0">
      {itens.map((l) => (
        <li key={l.id} className="w-[104px] flex-none snap-start sm:w-[118px]">
          <Link href={`/livro/${l.id}`} className="group block">
            <span className="block aspect-[2/3] overflow-hidden rounded-[3px] shadow-[0_6px_14px_-8px_rgba(43,20,32,.45)] transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none">
              <CapaLivro titulo={l.titulo} cor={l.cor ?? corDoLivro(l.id)} capa={l.capa} className="!h-full !w-full" />
            </span>
            <span className="mt-1.5 block line-clamp-2 text-[12px] leading-tight font-semibold text-ameixa">{l.titulo}</span>
            <span className="block truncate text-[11px] text-cinza">{l.extra ?? l.autor}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Carregando() {
  return (
    <div className="flex gap-3.5 overflow-hidden">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="block aspect-[2/3] w-[104px] flex-none animate-pulse rounded-[3px] bg-linha sm:w-[118px]" />
      ))}
    </div>
  );
}

const paraItem = (l: LivroBusca): Item => ({ id: l.id, titulo: l.titulo, autor: l.autor, capa: l.capa, cor: l.cor });

/** busca no catálogo, tira o que já está na estante e repetidos */
function useBusca(termo: string | null, filtro?: (l: LivroBusca) => boolean) {
  const naEstante = useNaEstante();
  const [itens, setItens] = useState<Item[] | null>(null);
  useEffect(() => {
    if (!termo) return;
    const c = new AbortController();
    setItens(null);
    buscarLivros(termo, c.signal)
      .then((r) => {
        const vistos = new Set<string>();
        setItens(
          r
            .filter((l) => l.capa && (!filtro || filtro(l)))
            .filter((l) => {
              const k = chaveTitulo(l.titulo);
              if (naEstante.has(k) || vistos.has(k)) return false;
              vistos.add(k);
              return true;
            })
            .slice(0, 12)
            .map(paraItem),
        );
      })
      .catch(() => {
        if (!c.signal.aborted) setItens([]);
      });
    return () => c.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [termo]);
  return itens;
}

/* ───────── por afinidade: mais de quem a pessoa leu e gostou ───────── */
export function PorAfinidade() {
  const livros = usePerfil((s) => s.livros);
  const autores = useMemo(() => {
    const conta = new Map<string, number>();
    for (const l of livros) if (l.status === "lido" && (l.nota ?? 0) >= 4 && l.autor) conta.set(l.autor, (conta.get(l.autor) ?? 0) + (l.nota ?? 0));
    return [...conta.entries()].sort((a, b) => b[1] - a[1]).map(([a]) => a).slice(0, 4);
  }, [livros]);
  const [i, setI] = useState(0);
  const autor = autores[i] ?? null;
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const itens = useBusca(autor, (l) => !!autor && norm(l.autor).includes(norm(autor).split(" ").pop() ?? ""));
  if (!autores.length) return null;
  return (
    <section aria-labelledby="d-afinidade">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="d-afinidade" className={tituloSecao}>
          por afinidade
        </h2>
      </div>
      <div role="tablist" aria-label="autores que você avaliou bem" className="-mx-6 mb-3 flex gap-1.5 overflow-x-auto px-6 [scrollbar-width:none] lg:mx-0 lg:px-0">
        {autores.map((a, j) => (
          <button
            key={a}
            type="button"
            role="tab"
            aria-selected={i === j}
            onClick={() => setI(j)}
            className={`min-h-9 flex-none rounded-[6px] border px-3 text-[12px] ${i === j ? "border-azul bg-azul/15 font-semibold text-ameixa" : "border-linha text-tinta-suave"}`}
          >
            {a}
          </button>
        ))}
      </div>
      {itens === null ? <Carregando /> : itens.length ? <Fileira itens={itens} /> : <p className="text-[13px] text-cinza">Nada novo deste autor no catálogo por enquanto.</p>}
    </section>
  );
}

/* ───────── curadorias: recortes temáticos com busca real ───────── */
const CURADORIAS: { id: string; nome: string; termo: string }[] = [
  { id: "classicos-br", nome: "clássicos brasileiros", termo: "clássicos da literatura brasileira" },
  { id: "curtos", nome: "para ler num fim de semana", termo: "novela curta romance breve" },
  { id: "japao", nome: "literatura japonesa", termo: "literatura japonesa romance" },
  { id: "latino", nome: "américa latina", termo: "literatura latino-americana" },
  { id: "nao-ficcao", nome: "não ficção narrativa", termo: "não ficção narrativa reportagem" },
  { id: "misterio", nome: "mistério", termo: "romance policial mistério" },
  { id: "poesia", nome: "poesia", termo: "poesia" },
];

export function Curadorias() {
  const [atual, setAtual] = useState(CURADORIAS[0]);
  const itens = useBusca(atual.termo);
  return (
    <section aria-labelledby="d-curadoria">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="d-curadoria" className={tituloSecao}>
          curadorias
        </h2>
        <Link href={`/buscar?q=${encodeURIComponent(atual.termo)}`} className="text-[12px] font-semibold text-bordo">
          ver tudo
        </Link>
      </div>
      <div role="tablist" aria-label="curadorias" className="-mx-6 mb-3 flex gap-1.5 overflow-x-auto px-6 [scrollbar-width:none] lg:mx-0 lg:px-0">
        {CURADORIAS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={atual.id === c.id}
            onClick={() => setAtual(c)}
            className={`min-h-9 flex-none rounded-[6px] border px-3 text-[12px] ${atual.id === c.id ? "border-azul bg-azul/15 font-semibold text-ameixa" : "border-linha text-tinta-suave"}`}
          >
            {c.nome}
          </button>
        ))}
      </div>
      {itens === null ? <Carregando /> : itens.length ? <Fileira itens={itens} /> : <p className="text-[13px] text-cinza">O catálogo não respondeu agora. Tente outra curadoria.</p>}
    </section>
  );
}

/* ───────── comunidade: o que quem você segue leu e gostou ───────── */
export function EntreLeitores() {
  const naEstante = useNaEstante();
  const [itens, setItens] = useState<(Item & { pessoas: PessoaResumo[] })[] | null>(null);
  useEffect(() => {
    let vivo = true;
    estantesDasAmigas()
      .then((lista) => {
        const m = new Map<string, Item & { pessoas: PessoaResumo[]; quando: string; nota: number }>();
        for (const { pessoa, livros } of lista)
          for (const l of livros) {
            if (l.status !== "lido" || (l.nota ?? 0) < 4) continue;
            const k = chaveTitulo(l.titulo);
            if (naEstante.has(k)) continue;
            const atual = m.get(k);
            if (atual) {
              atual.pessoas.push(pessoa);
              if ((l.lidoEm ?? "") > atual.quando) atual.quando = l.lidoEm ?? "";
            } else m.set(k, { id: l.id, titulo: l.titulo, autor: l.autor, capa: l.capa, pessoas: [pessoa], quando: l.lidoEm ?? "", nota: l.nota ?? 0 });
          }
        const ordenados = [...m.values()].sort((a, b) => b.pessoas.length - a.pessoas.length || b.quando.localeCompare(a.quando)).slice(0, 12);
        if (vivo)
          setItens(
            ordenados.map((x) => ({
              ...x,
              extra: x.pessoas.length > 1 ? `${nomeDe(x.pessoas[0])} e mais ${x.pessoas.length - 1}` : `${nomeDe(x.pessoas[0])} gostou`,
            })),
          );
      })
      .catch(() => vivo && setItens([]));
    return () => {
      vivo = false;
    };
  }, [naEstante]);
  if (!itens?.length) return null;
  return (
    <section aria-labelledby="d-leitores">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="d-leitores" className={tituloSecao}>
          entre leitores
        </h2>
        <span className="text-[11px] text-cinza">lidos e bem avaliados por quem você segue</span>
      </div>
      <Fileira itens={itens} />
    </section>
  );
}
