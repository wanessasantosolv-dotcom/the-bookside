"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { corDoLivro } from "@/lib/cores";
import { usePerfil } from "@/lib/perfil-store";

const ACOES: { href: string; nome: string; sub: string; icone: string }[] = [
  { href: "/buscar", nome: "adicionar um livro", sub: "buscar e guardar na estante", icone: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M20 20l-3.5-3.5" },
  { href: "/livro/novo", nome: "cadastrar à mão", sub: "quando o livro não aparece na busca", icone: "M4 20h4L19 9l-4-4L4 16v4z M14 6l4 4" },
  { href: "/estantes/importar", nome: "importar leituras", sub: "goodreads, skoob, storygraph, planilha", icone: "M12 4v11 M7 10l5 5 5-5 M5 20h14" },
  { href: "/co-read/novo", nome: "ler junto", sub: "um co-read com alguém", icone: "M8 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M16 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M3 20c.6-3 2.6-5 5-5s4.4 2 5 5 M11 20c.6-3 2.6-5 5-5s4.4 2 5 5" },
  { href: "/clubes/novo", nome: "criar um clube", sub: "um clube do livro novo", icone: "M4 6h16v12H4z M4 10h16 M9 6v12" },
];

const Icone = ({ d }: { d: string }) => (
  <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {d.split(" M").map((p, i) => (
      <path key={i} d={i ? `M${p}` : p} />
    ))}
  </svg>
);

/** o + suspenso do app: registrar leitura e os atalhos de adicionar */
export function BotaoMais() {
  const [aberto, setAberto] = useState(false);
  const livros = usePerfil((s) => s.livros);
  const lendo = livros.filter((l) => l.status === "lendo").slice(0, 4);

  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [aberto]);

  return (
    <>
      {aberto ? <div aria-hidden className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px]" onClick={() => setAberto(false)} /> : null}
      <div className="fixed right-4 bottom-[calc(var(--altura-menu,0px)+16px)] z-40 flex flex-col items-end gap-3 sm:right-[max(16px,calc(50vw-199px))] lg:right-8 lg:bottom-8">
        {aberto ? (
          <div role="menu" aria-label="adicionar" className="w-[min(320px,calc(100vw-32px))] animate-subir overflow-hidden rounded-[10px] border border-linha bg-creme shadow-[0_18px_40px_-16px_rgba(0,0,0,.45)]">
            <div className="border-b border-linha px-4 pt-3 pb-2">
              <p className="text-[11px] font-semibold tracking-[.14em] text-cinza uppercase">registrar leitura</p>
              {lendo.length ? (
                <ul className="mt-2 space-y-1">
                  {lendo.map((l) => (
                    <li key={l.id}>
                      <Link href={`/livro/${l.id}/progresso`} role="menuitem" onClick={() => setAberto(false)} className="flex min-h-11 items-center gap-3 rounded-[6px] px-1 hover:bg-papel">
                        <CapaLivro titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className="aspect-[2/3] w-7 flex-none rounded-[2px]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] text-ameixa">{l.titulo}</span>
                          {l.paginas && l.paginaAtual ? <span className="block text-[11px] text-cinza">página {l.paginaAtual} de {l.paginas}</span> : null}
                        </span>
                        <span aria-hidden className="text-bordo">+</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 pb-1 text-[13px] text-cinza">nenhuma leitura em andamento. comece um livro para registrar o progresso.</p>
              )}
            </div>
            <ul className="py-1">
              {ACOES.map((a) => (
                <li key={a.href}>
                  <Link href={a.href} role="menuitem" onClick={() => setAberto(false)} className="flex min-h-12 items-center gap-3 px-4 py-1.5 hover:bg-papel">
                    <span className="text-bordo">
                      <Icone d={a.icone} />
                    </span>
                    <span>
                      <span className="block text-[14px] font-semibold text-ameixa">{a.nome}</span>
                      <span className="block text-[11px] text-cinza">{a.sub}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <button
          type="button"
          aria-expanded={aberto}
          aria-label={aberto ? "fechar" : "adicionar ou registrar leitura"}
          onClick={() => setAberto((v) => !v)}
          className="grid size-14 place-items-center rounded-full bg-bordo text-creme shadow-[0_10px_24px_-8px_rgba(0,0,0,.5)] transition-transform hover:bg-bordo-suave active:scale-95"
        >
          <svg aria-hidden width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className={`transition-transform duration-200 motion-reduce:transition-none ${aberto ? "rotate-45" : ""}`}>
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </>
  );
}
