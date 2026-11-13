"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import { Botao } from "@/components/ui/Botao";
import { Tela } from "@/components/ui/Tela";
import { corDoLivro } from "@/lib/cores";
import { infoDoLivro } from "@/lib/estantes";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";

const passo = "flex size-11 items-center justify-center rounded-full border border-bege bg-creme-quente text-lg font-semibold text-bordo disabled:text-bege";
const campo =
  "h-11 w-24 rounded-sm border border-bege bg-creme-quente text-center text-[22px] font-semibold outline-none focus:border-bordo focus:ring-1 focus:ring-bordo";

function Progresso({ livro }: { livro: LivroSalvo }) {
  const router = useRouter();
  const editarLivro = usePerfil((s) => s.editarLivro);
  const [paginas, setPaginas] = useState(livro.paginas ?? 0);
  const [atual, setAtual] = useState(livro.paginaAtual ?? 0);
  const iniciadoEm = livro.iniciadoEm ?? new Date().toISOString();
  const dias = Math.max(1, Math.ceil((Date.now() - new Date(iniciadoEm).getTime()) / 86_400_000));
  const pct = paginas ? Math.min(100, Math.round((atual / paginas) * 100)) : 0;
  const base = { id: livro.id, titulo: livro.titulo, autor: livro.autor };
  const mudar = (n: number) => setAtual(Math.max(0, paginas ? Math.min(paginas, n) : n));

  function salvar(terminou = false) {
    editarLivro(base, {
      status: terminou ? "lido" : "lendo",
      iniciadoEm,
      paginas: paginas || undefined,
      paginaAtual: terminou ? paginas || atual : atual,
      ...(terminou ? { lidoEm: new Date().toISOString() } : {}),
    });
    router.push(terminou ? `/livro/${livro.id}/avaliar` : `/livro/${livro.id}`);
  }

  return (
    <Tela>
      <header className="flex items-center justify-between px-6 pt-2">
        <Link href={`/livro/${livro.id}`} className="-ml-2 flex min-h-11 max-w-[70%] items-center truncate px-2 text-[13px] font-semibold text-bordo">
          ‹ {livro.titulo.toLowerCase()}
        </Link>
        <span className="eyebrow !text-[10px] text-cinza">lendo agora</span>
      </header>
      <div className="animate-subir px-6 pt-4">
        <h1 className="font-display text-[30px] leading-[1.1] font-semibold italic text-bordo">seu progresso</h1>
        <p className="mt-2 font-accent text-sm italic text-cinza">
          comecei em {new Date(iniciadoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} · {dias}{" "}
          {dias === 1 ? "dia" : "dias"} de leitura
        </p>
      </div>

      <div className="flex-1 px-6 pt-6 pb-6">
        <div className="animate-subir rounded-md border border-linha bg-creme-quente px-5 py-[22px] [animation-delay:.12s]">
          <div className="flex gap-4">
            <CapaLivro titulo={livro.titulo} cor={corDoLivro(livro.id)} className="w-[74px] [&>span:last-child]:hidden" />
            <div className="min-w-0 flex-1 self-center">
              <p className="font-display text-[19px] leading-[1.2] font-semibold italic">{livro.titulo}</p>
              <p className="mt-1 font-accent text-[13px] italic text-cinza">
                {livro.autor}
                {paginas ? ` · ${paginas} páginas` : ""}
              </p>
              <p className="mt-3 text-[26px] leading-none font-semibold text-bordo" aria-live="polite">
                {pct}
                <span className="text-sm text-cinza">%</span>
              </p>
            </div>
          </div>
          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-[#F1E4DC]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="progresso do livro">
            <i className="block h-full rounded-full bg-bordo transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2.5 text-[13px] text-cinza">{paginas ? `página ${atual} de ${paginas}` : "informe o total de páginas abaixo"}</p>

          {!livro.paginas ? (
            <label className="mt-5 flex items-center justify-between gap-3">
              <span className="eyebrow text-bordo">total de páginas</span>
              <input type="number" inputMode="numeric" min={1} value={paginas || ""} onChange={(e) => setPaginas(Math.max(0, Number(e.target.value)))} className={campo} />
            </label>
          ) : null}

          <div className="mt-[22px] flex items-center justify-center gap-3.5">
            <button type="button" aria-label="voltar 10 páginas" onClick={() => mudar(atual - 10)} disabled={atual <= 0} className={passo}>
              –
            </button>
            <label className="flex flex-1 flex-col items-center">
              <span className="eyebrow mb-1 text-bordo">página atual</span>
              <input type="number" inputMode="numeric" min={0} max={paginas || undefined} value={atual} onChange={(e) => mudar(Number(e.target.value))} className={campo} />
            </label>
            <button type="button" aria-label="avançar 10 páginas" onClick={() => mudar(atual + 10)} disabled={!!paginas && atual >= paginas} className={passo}>
              +
            </button>
          </div>
        </div>
        <Botao variante="contorno" className="mt-4 !h-11" onClick={() => salvar(false)}>
          salvar progresso
        </Botao>
      </div>

      <footer className="sticky bottom-0 bg-gradient-to-t from-creme from-70% to-transparent px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        <Botao onClick={() => salvar(true)}>terminei de ler ✓</Botao>
      </footer>
    </Tela>
  );
}

export default function ProgressoPage() {
  const { id } = useParams<{ id: string }>();
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  if (!hidratado) return <Tela>{null}</Tela>;
  const livro = infoDoLivro(id, livros);
  if (!livro) notFound();
  return <Progresso livro={livro} />;
}
