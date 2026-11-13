"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { EstrelasInput } from "@/components/Estrelas";
import { useHidratado } from "@/components/PerfilHidratacao";
import { Botao } from "@/components/ui/Botao";
import { Tela } from "@/components/ui/Tela";
import { livroLembrado } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { infoDoLivro } from "@/lib/estantes";
import { usePerfil, type LivroSalvo, type NotasDetalhe } from "@/lib/perfil-store";

const criterios: (keyof NotasDetalhe)[] = ["personagens", "plot", "escrita", "final"];

function Formulario({ livro }: { livro: LivroSalvo & { paginas?: number } }) {
  const router = useRouter();
  const editarLivro = usePerfil((s) => s.editarLivro);
  const [nota, setNota] = useState(livro.nota ?? 0);
  const [notas, setNotas] = useState<NotasDetalhe>(livro.notas ?? { personagens: 0, plot: 0, escrita: 0, final: 0 });
  const [resenha, setResenha] = useState(livro.resenha ?? "");
  const lidoEm = livro.lidoEm ?? new Date().toISOString();

  return (
    <Tela>
      <header className="flex items-center justify-between px-6 pt-2">
        <Link href={`/livro/${livro.id}`} className="-ml-2 flex min-h-11 max-w-[70%] items-center truncate px-2 text-[13px] font-semibold text-bordo">
          ‹ {livro.titulo.toLowerCase()}
        </Link>
        <span className="eyebrow !text-[10px] text-cinza">avaliar</span>
      </header>
      <div className="animate-subir px-6 pt-4">
        <h1 className="font-display text-[30px] leading-[1.1] font-semibold italic text-bordo">como foi a leitura?</h1>
        <p className="mt-2 font-accent text-sm italic text-cinza">sua avaliação fica só no seu perfil, fora de qualquer clube.</p>
      </div>

      <div className="flex-1 px-6 pt-6 pb-6">
        <div className="relative animate-subir rounded-md border border-linha bg-creme-quente px-[18px] py-5 [animation-delay:.12s]">
          <div className="absolute top-[18px] right-[18px] w-[74px]">
            <CapaLivro titulo={livro.titulo} capa={livro.capa} cor={corDoLivro(livro.id)} className="w-full [&>span:last-child]:hidden" />
          </div>
          <div className="w-[190px]">
            <p className="eyebrow text-bordo">sua nota</p>
            <div className="-ml-1.5 mt-1">
              <EstrelasInput valor={nota} onChange={setNota} rotulo="sua nota geral" tamanho="text-2xl" />
            </div>
            <p className="mt-1.5 text-[13px] leading-normal text-cinza">
              {livro.autor}
              {livro.paginas ? ` · ${livro.paginas} páginas` : ""}
              <br />
              lido em {new Date(lidoEm).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
            </p>
          </div>

          <div className="mt-[22px] border-t border-linha pt-1">
            {criterios.map((c) => (
              <div key={c} className="flex items-center justify-between border-b border-dashed border-linha py-0.5 last:border-b-0">
                <span className="font-accent text-[15px] italic">{c}</span>
                <EstrelasInput valor={notas[c]} onChange={(n) => setNotas((x) => ({ ...x, [c]: n }))} rotulo={`nota para ${c}`} tamanho="text-sm" />
              </div>
            ))}
          </div>

          <label className="mt-4 block">
            <span className="eyebrow text-bordo">sua resenha (opcional)</span>
            <textarea
              value={resenha}
              rows={4}
              maxLength={1000}
              placeholder="escreva o que achou…"
              onChange={(e) => setResenha(e.target.value)}
              className="mt-2 w-full resize-none rounded-sm border border-bege bg-creme-quente p-3 text-[13px] leading-normal outline-none placeholder:text-[#8A7E7A] focus:border-bordo focus:ring-1 focus:ring-bordo"
            />
          </label>
        </div>
      </div>

      <footer className="sticky bottom-0 bg-gradient-to-t from-creme from-70% to-transparent px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        <Botao
          disabled={!nota}
          onClick={() => {
            editarLivro(
              { id: livro.id, titulo: livro.titulo, autor: livro.autor, capa: livro.capa },
              { status: "lido", lidoEm, nota, notas, resenha: resenha.trim() || undefined, paginas: livro.paginas, paginaAtual: livro.paginas },
            );
            router.push(`/livro/${livro.id}`);
          }}
        >
          salvar avaliação
        </Botao>
      </footer>
    </Tela>
  );
}

export default function AvaliarPage() {
  const { id } = useParams<{ id: string }>();
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  if (!hidratado) return <Tela>{null}</Tela>;
  const livro = infoDoLivro(id, livros, livroLembrado(id));
  if (!livro) notFound();
  return <Formulario livro={livro} />;
}
