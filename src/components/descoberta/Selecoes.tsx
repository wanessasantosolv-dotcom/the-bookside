"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { AdicionarALista } from "@/components/descoberta/AdicionarALista";
import { chaveTitulo, lembrarLivros } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { CURADORIAS } from "@/lib/curadorias";
import { buscarDescoberta, type Resultado } from "@/lib/descoberta";
import { usePerfil } from "@/lib/perfil-store";

/** a curadoria da semana (troca toda segunda; sempre real, vinda da busca) */
const daSemana = () => {
  const semana = Math.floor((Date.now() / 864e5 + 3) / 7);
  const ordem = ["delicadeza-do-cotidiano", "uma-tarde-chuvosa", "pequenos-refugios", "o-que-permanece", "alem-do-possivel", "literatura-sem-fronteiras"];
  return CURADORIAS.find((c) => c.id === ordem[semana % ordem.length])!;
};

/**
 * Seleção literária do momento: fundo azul suave, capas em destaque.
 * Os livros vêm da busca de verdade; sem resultados, o módulo não aparece.
 */
export function SelecaoDoMomento({ explorar }: { explorar: (q: string) => void }) {
  const [c] = useState(daSemana);
  const livros = usePerfil((s) => s.livros);
  const guardarLivro = usePerfil((s) => s.guardarLivro);
  const [itens, setItens] = useState<Resultado[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    const lidos = usePerfil.getState().livros.filter((l) => l.status === "lido").map((l) => l.titulo);
    buscarDescoberta({ consulta: c.consulta, excluir: lidos }, ctrl.signal)
      .then((r) => {
        if (ctrl.signal.aborted) return;
        const comCapa = r.resultados.filter((x) => x.livro.capa).slice(0, 5);
        lembrarLivros(comCapa.map((x) => x.livro));
        setItens(comCapa);
      })
      .catch(() => !ctrl.signal.aborted && setItens([]));
    return () => ctrl.abort();
  }, [c]);
  if (itens && itens.length < 3) return null;
  const meus = new Set(livros.map((l) => chaveTitulo(l.titulo)));

  return (
    <section aria-labelledby="d-momento" className="grao relative mx-6 overflow-hidden rounded-[4px] bg-descoberta-suave px-5 pt-6 pb-5 lg:mx-0 lg:px-7">
      {/* borda de papel recortado no topo: só decoração */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-creme [clip-path:polygon(0_0,100%_0,100%_40%,96%_100%,92%_30%,87%_90%,82%_20%,76%_100%,70%_35%,64%_95%,58%_25%,52%_100%,46%_30%,40%_90%,34%_20%,28%_100%,22%_35%,16%_90%,10%_25%,5%_100%,0_40%)]" />
      <p className="text-[11px] font-semibold tracking-[.16em] text-descoberta-tinta uppercase">Seleção do momento</p>
      <h2 id="d-momento" className="mt-1 font-revista text-[26px] leading-tight text-ameixa italic lg:text-[30px]">
        {c.nome}
      </h2>
      <p className="mt-1 text-[13px] text-tinta-suave">{c.descricao}</p>
      {itens === null ? (
        <div className="mt-5 flex gap-4">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="block aspect-[2/3] w-[96px] animate-pulse rounded-[3px] bg-creme/70" />
          ))}
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-4">
          {itens.map((r) => {
            const l = r.livro;
            const ja = meus.has(chaveTitulo(l.titulo));
            return (
              <li key={l.id} className="min-w-0">
                <Link href={`/livro/${l.id}`} className="group block">
                  <span className="block aspect-[2/3] overflow-hidden rounded-[3px] shadow-[0_8px_16px_-10px_rgba(56,37,44,.5)] transition-transform group-hover:-translate-y-0.5 motion-reduce:transition-none">
                    <CapaLivro titulo={l.titulo} capa={l.capa} cor={l.cor ?? corDoLivro(l.id)} className="!h-full !w-full [&>span:last-child]:hidden" />
                  </span>
                  <span className="mt-1.5 line-clamp-2 block text-[12px] leading-tight font-semibold text-ameixa">{l.titulo}</span>
                  <span className="block truncate text-[11px] text-tinta-suave">{l.autor}</span>
                </Link>
                <div className="mt-1 flex items-center gap-0.5">
                  {ja ? (
                    <span className="text-[11px] text-cinza">na estante</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        guardarLivro({ id: l.id, titulo: l.titulo, autor: l.autor, capa: l.capa, paginas: l.paginas, genero: l.genero, status: "quero" });
                        setAviso("Livro adicionado ao seu quero ler.");
                      }}
                      className="min-h-9 pr-1 text-[12px] font-semibold text-bordo"
                    >
                      + quero ler
                    </button>
                  )}
                  <AdicionarALista livro={l} onFeito={setAviso} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-3 flex items-center justify-between gap-3">
        {aviso ? (
          <p role="status" className="text-[12px] text-progresso">
            {aviso}
          </p>
        ) : (
          <span />
        )}
        <button type="button" onClick={() => explorar(c.consulta)} className="min-h-10 text-[13px] font-semibold text-descoberta-tinta hover:underline">
          Ver a seleção completa →
        </button>
      </div>
    </section>
  );
}

const CORES_NUMERO = ["text-bordo", "text-descoberta-tinta", "text-progresso", "text-diario-tinta", "text-citacao-tinta", "text-bordo"];

/** seleções editoriais: lista tipográfica numerada, cada uma abre resultados reais */
export function SelecoesEditoriais({ explorar }: { explorar: (q: string) => void }) {
  const momento = daSemana().id;
  const [todas, setTodas] = useState(false);
  const lista = CURADORIAS.filter((c) => c.id !== momento);
  return (
    <section aria-labelledby="d-selecoes">
      <h2 id="d-selecoes" className="font-revista text-[22px] leading-none text-ameixa italic">
        Seleções editoriais
      </h2>
      <p className="mt-1 text-[12px] text-cinza">Histórias reunidas por aquilo que têm em comum.</p>
      <ol className="mt-3">
        {(todas ? lista : lista.slice(0, 6)).map((c, i) => (
          <li key={c.id} className="border-b border-linha last:border-b-0">
            <button type="button" onClick={() => explorar(c.consulta)} className="group flex w-full items-start gap-3.5 py-3 text-left">
              <span className={`w-8 flex-none font-revista text-[22px] leading-none tabular-nums ${CORES_NUMERO[i % CORES_NUMERO.length]}`}>{String(i + 1).padStart(2, "0")}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-revista text-[17px] leading-tight text-ameixa group-hover:text-bordo">{c.nome}</span>
                <span className="mt-0.5 block text-[12px] leading-snug text-tinta-suave">{c.descricao}</span>
              </span>
              <span aria-hidden className="pt-1 text-[13px] text-cinza transition-transform group-hover:translate-x-0.5 group-hover:text-bordo">
                →
              </span>
            </button>
          </li>
        ))}
      </ol>
      {!todas && lista.length > 6 ? (
        <button type="button" onClick={() => setTodas(true)} className="mt-1 min-h-10 text-[13px] font-semibold text-bordo">
          Mais seleções
        </button>
      ) : null}
    </section>
  );
}
