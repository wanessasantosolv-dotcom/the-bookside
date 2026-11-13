"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import { EstadoBusca } from "@/components/EstadoBusca";
import { useBuscaLivros, type LivroBusca } from "@/lib/catalogo";
import { todasAsEstantes } from "@/lib/estantes";
import { usePerfil } from "@/lib/perfil-store";

function Busca() {
  const params = useSearchParams();
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  const proprias = usePerfil((s) => s.estantesProprias);
  const editarLivro = usePerfil((s) => s.editarLivro);
  const [busca, setBusca] = useState("");

  const estante = todasAsEstantes(proprias ?? []).find((e) => e.id === params.get("estante")) ?? todasAsEstantes([])[2];
  const { estado, resultados } = useBuscaLivros(busca);

  function estaNaEstante(id: string) {
    const l = livros.find((x) => x.id === id);
    if (!l) return false;
    return estante.status ? (l.status ?? "lendo") === estante.status : !!l.estantes?.includes(estante.id);
  }

  function adicionar(l: LivroBusca) {
    const base = { id: l.id, titulo: l.titulo, autor: l.autor, capa: l.capa, genero: l.genero };
    const atual = livros.find((x) => x.id === l.id);
    if (estante.status) {
      const agora = new Date().toISOString();
      editarLivro(base, {
        status: estante.status,
        paginas: l.paginas,
        ...(estante.status === "lendo" ? { iniciadoEm: atual?.iniciadoEm ?? agora } : {}),
        ...(estante.status === "lido" ? { lidoEm: atual?.lidoEm ?? agora } : {}),
      });
    } else {
      editarLivro(base, { status: atual?.status ?? "quero", paginas: l.paginas, estantes: [...new Set([...(atual?.estantes ?? []), estante.id])] });
    }
  }

  return (
    <div className="flex flex-1 flex-col px-6 pb-8 lg:max-w-[760px] lg:px-14 lg:pt-8">
      <header className="flex items-center justify-between pt-2">
        <Link href={`/estantes/${estante.id}`} className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo">
          ‹ {estante.nome}
        </Link>
        <span className="eyebrow !text-[10px] text-cinza">buscar</span>
      </header>
      <h1 className="mt-3 animate-subir font-display text-[32px] leading-[1.1] font-semibold italic text-bordo">buscar livro</h1>
      <p className="mt-1.5 text-[13px] text-cinza">
        adicionando em <b className="text-bordo">{estante.nome}</b>
      </p>

      <label className="relative mt-5 block">
        <span className="sr-only">buscar um livro</span>
        <svg aria-hidden className="absolute top-1/2 left-4 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A6A6E" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4.5 4.5" />
        </svg>
        <input
          type="search"
          autoFocus
          placeholder="título, autora ou isbn"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="h-12 w-full rounded-pill border border-bege bg-creme-quente pr-3.5 pl-[42px] text-[15px] outline-none placeholder:text-cinza focus:border-bordo focus:ring-1 focus:ring-bordo"
        />
      </label>

      <p className="eyebrow mt-6 mb-1 !text-[10px] text-bordo">{estado === "sugestoes" ? "sugestões" : "resultados"}</p>
      <EstadoBusca estado={estado} vazio={!resultados.length} />
      <ul>
        {(estado === "carregando" ? [] : resultados).map((l) => {
          const ok = hidratado && estaNaEstante(l.id);
          return (
            <li key={l.id} className="flex items-center gap-3.5 border-t border-linha py-[13px]">
              <Link href={`/livro/${l.id}`} className="flex min-w-0 flex-1 items-center gap-3.5">
                <CapaLivro titulo={l.titulo} capa={l.capa} cor={l.cor} className="w-[52px] [&>span:last-child]:hidden" />
                <span className="min-w-0">
                  <h3 className="font-display text-[17px] leading-[1.2] font-semibold italic">{l.titulo}</h3>
                  <small className="mt-1 block text-xs text-cinza">
                    {l.autor}
                    {l.ano ? ` · ${l.ano}` : ""}
                    {l.paginas ? ` · ${l.paginas} págs` : ""}
                  </small>
                </span>
              </Link>
              <button
                type="button"
                disabled={ok}
                onClick={() => adicionar(l)}
                className={`flex h-11 flex-none items-center rounded-pill border px-3 text-[11px] font-semibold whitespace-nowrap ${
                  ok ? "border-linha bg-[#F1E4DC] text-cinza" : "border-bordo text-bordo hover:bg-rosa-fundo"
                }`}
              >
                {ok ? "na estante" : "+ estante"}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-6 text-center text-[11px] text-cinza">busca e capas: Google Books e Open Library</p>
    </div>
  );
}

export default function BuscarPage() {
  return (
    <AppShell aba="estantes">
      <Suspense>
        <Busca />
      </Suspense>
    </AppShell>
  );
}
