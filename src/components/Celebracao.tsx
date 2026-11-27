"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { CapaLivro } from "@/components/CapaLivro";
import { corDoLivro } from "@/lib/cores";
import { useCelebracao } from "@/lib/celebrar";

/** as estrelas autorais (as mesmas da marca), surgindo ao redor da capa */
function Estrela({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} style={style}>
      <path d="M12 1.5c.6 4.9 2.6 8.2 10.5 10.5-7.9 2.3-9.9 5.6-10.5 10.5-.6-4.9-2.6-8.2-10.5-10.5C9.4 9.7 11.4 6.4 12 1.5z" fill="currentColor" />
    </svg>
  );
}

/**
 * A celebração global: um ritual curto quando uma leitura é concluída, em
 * qualquer tela. Sobreposição bordô com desfoque, capa em destaque, meta do
 * ano (só quando a leitura conta para ela), conquistas confirmadas e as ações
 * de registrar impressões e compartilhar. "amei" e "favorito" são só um
 * estouro breve, sem cartão.
 */
export function Celebracao() {
  const atual = useCelebracao((s) => s.atual);
  const fechar = useCelebracao((s) => s.fechar);
  const caixa = useRef<HTMLDivElement>(null);
  const pequeno = atual?.tipo === "amei" || atual?.tipo === "favorito";

  useEffect(() => {
    if (!atual) return;
    if (pequeno) {
      const t = setTimeout(fechar, 1300);
      return () => clearTimeout(t);
    }
    // trava a rolagem do fundo e leva o foco para o cartão
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const foco = document.activeElement as HTMLElement | null;
    caixa.current?.querySelector<HTMLElement>("[data-foco]")?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    document.addEventListener("keydown", tecla);
    return () => {
      document.body.style.overflow = antes;
      document.removeEventListener("keydown", tecla);
      foco?.focus?.();
    };
  }, [atual, fechar, pequeno]);

  if (!atual || typeof document === "undefined") return null;

  if (pequeno)
    return createPortal(
      <div aria-live="polite" className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={`${atual.id}-${i}`} className="celebra-estouro absolute" style={{ color: i % 2 ? "#ECAABB" : "#692536", "--dx": `${Math.cos((i / 10) * Math.PI * 2) * 120}px`, "--dy": `${Math.sin((i / 10) * Math.PI * 2) * 120}px` } as React.CSSProperties}>
            <Estrela className="size-4" />
          </span>
        ))}
      </div>,
      document.body,
    );

  const comLivro = !!atual.livroId && atual.tipo !== "lote";
  const meta = atual.meta;
  const pct = meta ? Math.min(100, Math.round((meta.lidos / meta.meta) * 100)) : 0;
  const faltam = meta ? Math.max(0, meta.meta - meta.lidos) : 0;

  return createPortal(
    <div className="celebra-fundo fixed inset-0 z-[90] flex items-center justify-center bg-[#38252C]/70 px-4 py-[max(16px,env(safe-area-inset-top))] backdrop-blur-[6px]" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby="celebra-titulo"
        className="celebra-cartao relative max-h-[calc(100dvh-32px)] w-full max-w-[400px] overflow-y-auto rounded-[10px] bg-[#F8F4EE] px-6 pt-6 pb-5 text-center text-[#38252C] shadow-[0_40px_80px_-30px_rgba(20,8,14,.7)]"
      >
        <button type="button" onClick={fechar} aria-label="fechar" className="absolute top-2.5 right-2.5 grid size-10 place-items-center rounded-full text-[#715F65] hover:bg-[#E8D2D8]/60">
          <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <p className="text-[10px] font-semibold tracking-[.2em] text-[#8297D1] uppercase">{atual.tipo === "lote" ? "sua estante cresceu" : "mais um capítulo da sua história"}</p>
        <h2 id="celebra-titulo" className="mt-1.5 font-revista text-[30px] leading-[1.05] text-[#692536] italic">
          {atual.chamada ?? "mais uma última página."}
        </h2>

        {comLivro ? (
          <div className="relative mx-auto mt-5 w-[150px]">
            <Estrela className="celebra-brilho absolute -top-3 -left-6 size-5 text-[#ECAABB]" />
            <Estrela className="celebra-brilho absolute top-10 -right-7 size-4 text-[#8297D1]" style={{ animationDelay: ".25s" }} />
            <Estrela className="celebra-brilho absolute -bottom-2 -left-4 size-3 text-[#F1DFA0]" style={{ animationDelay: ".45s" }} />
            <span className="celebra-capa block -rotate-2">
              <CapaLivro titulo={atual.titulo} capa={atual.capa} cor={corDoLivro(atual.livroId ?? atual.titulo)} className="w-full shadow-[0_18px_30px_-14px_rgba(43,20,32,.55)] [&>span:last-child]:text-[11px]" />
            </span>
          </div>
        ) : (
          <Estrela className="mx-auto mt-4 size-10 text-[#ECAABB]" />
        )}

        <p className="mt-4 font-revista text-[20px] leading-tight text-[#38252C]">{atual.titulo}</p>
        {atual.autor ? <p className="mt-0.5 text-[13px] text-[#715F65]">{atual.autor}</p> : null}
        {atual.texto ? <p className="mt-1 text-[12px] text-[#715F65]">{atual.texto}</p> : null}

        {meta ? (
          <div className="mx-auto mt-5 max-w-[300px] border-t border-[#DCCDC8] pt-4 text-left">
            <p className="text-[10px] font-semibold tracking-[.14em] text-[#715F65] uppercase">
              seu {meta.lidos}º livro de {meta.ano}
            </p>
            <p className="mt-1 flex items-baseline gap-2">
              <span className="font-revista text-[30px] leading-none text-[#692536] tabular-nums">
                {meta.lidos} / {meta.meta}
              </span>
            </p>
            <span aria-hidden className="mt-2 block h-[5px] overflow-hidden rounded-full bg-[#E8D2D8]">
              <span className="celebra-barra block h-full rounded-full bg-[#692536]" style={{ width: `${pct}%` }} />
            </span>
            <p className="mt-1.5 text-[12px] text-[#56444B]">{faltam ? `Faltam ${faltam} ${faltam === 1 ? "história" : "histórias"} para sua meta.` : "Meta do ano alcançada."}</p>
          </div>
        ) : null}

        {atual.conquistas?.length ? (
          <ul className="mx-auto mt-4 max-w-[300px] space-y-2 text-left">
            {atual.conquistas.map((c) => (
              <li key={c.titulo} className="flex items-center gap-2.5 rounded-[6px] bg-[#DCE3F0]/70 px-3 py-2">
                <Estrela className="size-4 flex-none text-[#692536]" />
                <span className="text-[13px]">
                  <b className="font-semibold">{c.titulo}</b>
                  {c.detalhe ? <span className="text-[#56444B]"> · {c.detalhe}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        ) : null}

        {comLivro ? (
          <div className="mt-6 flex flex-col gap-2">
            <Link href={`/livro/${atual.livroId}/avaliar`} onClick={fechar} data-foco className="flex min-h-12 items-center justify-center rounded-[6px] bg-[#692536] text-[14px] font-semibold text-[#F8F4EE] hover:bg-[#54202F]">
              Registrar minhas impressões
            </Link>
            <Link href={`/story?tipo=terminei&livro=${encodeURIComponent(atual.livroId!)}`} onClick={fechar} className="flex min-h-12 items-center justify-center rounded-[6px] border border-[#692536]/40 text-[14px] font-semibold text-[#692536] hover:border-[#692536]">
              Compartilhar leitura
            </Link>
          </div>
        ) : null}
        <button type="button" onClick={fechar} data-foco={comLivro ? undefined : true} className="mt-2 min-h-11 w-full text-[13px] font-semibold text-[#715F65] hover:text-[#692536]">
          Continuar
        </button>
      </div>
    </div>,
    document.body,
  );
}
