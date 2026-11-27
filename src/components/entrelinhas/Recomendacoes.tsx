"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { dadosDoTermino, PerguntaTermino } from "@/components/PerguntaTermino";
import { buscarLivros, chaveTitulo, type LivroBusca } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { CATALOGO, type CartaId } from "@/lib/entrelinhas";
import { usePerfil, type StatusLivro } from "@/lib/perfil-store";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** acha o registro real do catálogo: título igual e o sobrenome do autor batendo */
async function resolver(titulo: string, autor: string, signal: AbortSignal): Promise<LivroBusca | null> {
  const r = await buscarLivros(`${titulo} ${autor}`, signal);
  const t = norm(titulo);
  const sobrenome = norm(autor).split(" ").pop() ?? "";
  const certos = r.filter((l) => norm(l.titulo).startsWith(t) && norm(l.autor).includes(sobrenome));
  return certos.find((l) => l.capa) ?? certos[0] ?? null;
}

/**
 * Histórias para o seu universo: a curadoria inicial da carta, resolvida no
 * catálogo de verdade (capa oficial), sem repetir como novidade o que já está
 * na estante. Quero ler e Já li usam a estante de sempre (sem duplicar).
 */
export function Recomendacoes({ carta }: { carta: CartaId }) {
  const c = CATALOGO[carta];
  const livros = usePerfil((s) => s.livros);
  const guardarLivro = usePerfil((s) => s.guardarLivro);
  const [achados, setAchados] = useState<(LivroBusca | null)[] | null>(null);
  const [terminando, setTerminando] = useState<LivroBusca | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setAchados(null);
    Promise.all(c.curadoria.map((x) => resolver(x.titulo, x.autor, ctrl.signal).catch(() => null)))
      .then((r) => !ctrl.signal.aborted && setAchados(r))
      .catch(() => {});
    return () => ctrl.abort();
  }, [c]);

  const naEstante = useMemo(() => new Map(livros.map((l) => [chaveTitulo(l.titulo), l])), [livros]);

  function marcar(l: LivroBusca, status: StatusLivro, extra = {}) {
    // se o livro já está na estante com outro registro, atualiza esse (sem duplicar)
    const existente = naEstante.get(chaveTitulo(l.titulo));
    guardarLivro({ ...(existente ?? {}), id: existente?.id ?? l.id, titulo: existente?.titulo ?? l.titulo, autor: existente?.autor ?? l.autor, capa: existente?.capa ?? l.capa, paginas: existente?.paginas ?? l.paginas, status, ...extra });
  }

  const encontrados = (achados ?? []).filter((x): x is LivroBusca => !!x);
  if (achados && !encontrados.length) return null;

  return (
    <section aria-labelledby="t-universo" className="mt-14 border-t border-linha pt-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="t-universo" className="font-revista text-[22px] leading-none text-ameixa">
          Histórias para o seu universo
        </h2>
        <Link href="/descobrir" className="text-[12px] font-semibold text-bordo">
          mais em Descobrir
        </Link>
      </div>
      <p className="mt-1 text-[12px] text-cinza">A curadoria de {c.nome}, para complementar o que você já gosta de ler.</p>
      <ul className="mt-5 grid gap-5 sm:grid-cols-2">
        {achados === null
          ? [0, 1].map((i) => (
              <li key={i} className="flex animate-pulse gap-4">
                <span className="block h-[132px] w-[88px] rounded-[3px] bg-linha" />
                <span className="flex-1 space-y-2 pt-2">
                  <span className="block h-4 w-40 rounded bg-linha" />
                  <span className="block h-3 w-24 rounded bg-linha" />
                </span>
              </li>
            ))
          : encontrados.map((l) => {
              const meu = naEstante.get(chaveTitulo(l.titulo));
              return (
                <li key={l.id} className="flex gap-4">
                  <Link href={`/livro/${meu?.id ?? l.id}`} className="w-[88px] flex-none">
                    <CapaLivro titulo={l.titulo} cor={l.cor ?? corDoLivro(l.id)} capa={l.capa} className="!w-[88px]" />
                  </Link>
                  <div className="min-w-0 pt-1">
                    <Link href={`/livro/${meu?.id ?? l.id}`} className="block font-revista text-[17px] leading-tight text-ameixa hover:text-bordo">
                      {l.titulo}
                    </Link>
                    <p className="mt-0.5 text-[13px] text-cinza">{l.autor}</p>
                    {meu ? (
                      <p className="mt-3 text-[12px] text-tinta-suave">{meu.status === "lido" ? "Você já leu" : meu.status === "quero" ? "Já está no seu quero ler" : "Já está na sua estante"}</p>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => marcar(l, "quero")} className="h-9 rounded-[6px] border border-bege px-3 text-[13px] font-semibold text-ameixa hover:border-bordo">
                          Quero ler
                        </button>
                        <button type="button" onClick={() => setTerminando(l)} className="h-9 rounded-[6px] px-3 text-[13px] font-semibold text-tinta-suave hover:text-bordo">
                          Já li
                        </button>
                      </div>
                    )}
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
