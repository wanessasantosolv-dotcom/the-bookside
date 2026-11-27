"use client";

import Link from "next/link";
import { useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { corDoLivro } from "@/lib/cores";
import type { PessoaResumo } from "@/lib/social";
import { nomeDe } from "@/lib/social";
import { COR, ESTILOS, estiloDe, Fita, Wordmark } from "./Marca";
import { dataLonga, type Coread } from "./calculos";

export const linkDoConvite = (l: Pick<Coread, "codigo">) =>
  typeof window !== "undefined" && l.codigo ? `${window.location.origin}/co-read?codigo=${l.codigo}` : "";

/** compartilha (ou copia) o convite — só livro, período e código; nada de dados de terceiros */
export function useCompartilharConvite(l: Coread) {
  const [copiado, setCopiado] = useState<"" | "link" | "convite">("");
  const link = linkDoConvite(l);
  const texto = `wanna co-read? vamos ler "${l.livro.titulo}" juntas no the bookside. código: ${l.codigo}`;
  const marcar = (q: "link" | "convite") => {
    setCopiado(q);
    setTimeout(() => setCopiado(""), 2000);
  };
  return {
    copiado,
    async compartilhar() {
      try {
        if (navigator.share) await navigator.share({ title: `co-read · ${l.livro.titulo}`, text: texto, url: link });
        else {
          await navigator.clipboard.writeText(`${texto}\n${link}`);
          marcar("convite");
        }
      } catch {
        /* cancelou */
      }
    },
    async copiarLink() {
      try {
        await navigator.clipboard.writeText(link);
        marcar("link");
      } catch {
        /* sem permissão */
      }
    },
  };
}

/**
 * O convite como um cartão-postal: selo com a capa, "wanna co-read?", quem chamou
 * e o período combinado. As ações ficam fora do cartão.
 */
export function CartaoConvite({
  l,
  deQuem,
  children,
  compacto = false,
}: {
  l: Coread;
  deQuem?: PessoaResumo | null;
  children?: React.ReactNode;
  compacto?: boolean;
}) {
  const e = ESTILOS[estiloDe(l)];
  const periodo = l.prazo ? `${l.inicio ? `de ${dataLonga(l.inicio)} ` : ""}até ${dataLonga(l.prazo)}` : "no ritmo de cada uma";
  return (
    <article className="relative">
      <div
        className="relative grid grid-cols-[minmax(0,1fr)_auto] gap-4 border px-5 pt-5 pb-4 sm:gap-6 sm:px-6"
        style={{ background: COR.creme, borderColor: `${COR.vinho}33` }}
      >
        <Fita cor={e.destaque} className="-top-2 left-8 -rotate-3" />
        {/* lado da mensagem */}
        <div className="min-w-0">
          <Wordmark tamanho={compacto ? 22 : 26} assinatura={false} />
          <p className="mt-3 font-revista text-[26px] leading-[1.05] italic sm:text-[30px]" style={{ color: e.tinta }}>
            vamos ler juntas?
          </p>
          <p className="mt-2 text-[14px] text-ameixa">
            vamos ler <b className="font-semibold">{l.livro.titulo}</b> juntas?
          </p>
          <dl className="mt-4 space-y-1 border-t border-dashed pt-3 text-[12px] text-tinta-suave" style={{ borderColor: `${COR.vinho}40` }}>
            {deQuem ? (
              <div className="flex gap-1.5">
                <dt className="font-mono text-[10px] tracking-[.12em] uppercase opacity-70">de</dt>
                <dd>{nomeDe(deQuem)}</dd>
              </div>
            ) : null}
            <div className="flex gap-1.5">
              <dt className="font-mono text-[10px] tracking-[.12em] uppercase opacity-70">quando</dt>
              <dd>{periodo}</dd>
            </div>
            {l.nome ? (
              <div className="flex gap-1.5">
                <dt className="font-mono text-[10px] tracking-[.12em] uppercase opacity-70">nome</dt>
                <dd className="italic">{l.nome}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        {/* o selo, com a capa */}
        <div className="flex flex-col items-center">
          <div
            className="p-[7px]"
            style={{
              background: e.fundo,
              WebkitMask: "radial-gradient(circle 3.5px at 50% 50%, transparent 98%, #000) -3.5px -3.5px / 10px 10px",
              mask: "radial-gradient(circle 3.5px at 50% 50%, transparent 98%, #000) -3.5px -3.5px / 10px 10px",
            }}
          >
            <div className="border p-1" style={{ borderColor: `${e.tinta}55` }}>
              <CapaLivro titulo={l.livro.titulo} capa={l.livro.capa} cor={corDoLivro(l.livro.id)} className={`${compacto ? "w-[62px]" : "w-[78px] sm:w-[92px]"} [&>span:last-child]:hidden`} />
            </div>
          </div>
          <span className="mt-2 max-w-[100px] truncate text-center text-[11px] text-cinza">{l.livro.autor}</span>
        </div>
      </div>
      {children ? <div className="mt-3 flex flex-wrap items-center gap-2">{children}</div> : null}
    </article>
  );
}

export const botaoPrincipal =
  "inline-flex h-10 items-center rounded-[6px] bg-bordo px-4 font-texto text-[13px] font-semibold text-creme hover:bg-bordo-suave disabled:opacity-45";
export const botaoSecundario =
  "inline-flex h-10 items-center rounded-[6px] border border-bordo/35 px-3.5 font-texto text-[13px] font-medium text-bordo hover:border-bordo disabled:opacity-45";
export const botaoTexto = "inline-flex min-h-11 items-center px-1 text-[13px] font-semibold text-cinza underline-offset-4 hover:text-bordo hover:underline";

export function LinkDetalhes({ id }: { id: string }) {
  return (
    <Link href={`/co-read/${id}`} className={botaoTexto}>
      ver detalhes
    </Link>
  );
}
