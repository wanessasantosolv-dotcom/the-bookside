"use client";

import Link from "next/link";
import { useEffect } from "react";
import { COR, Marcadores } from "@/components/coread/Marca";
import { minhasLeiturasJuntas } from "@/lib/lerjunto";
import { useConsulta, useMeuId } from "@/lib/social";

/**
 * together. — a central social do the bookside: clubes e co-read, duas
 * experiências independentes debaixo do mesmo cabeçalho. O seletor é a própria
 * navegação (cada lado tem a sua rota), sem página intermediária.
 */
export type Experiencia = "clubes" | "coread";
const ULTIMA = "bookside-comunidade-ultima";

export function ultimaExperiencia(): Experiencia {
  try {
    return localStorage.getItem(ULTIMA) === "coread" ? "coread" : "clubes";
  } catch {
    return "clubes";
  }
}

/** convites de co-read esperando resposta (os de clube chegam por código) */
export function useConvitesPendentes() {
  const eu = useMeuId();
  const c = useConsulta(async () => {
    if (!eu) return 0;
    const lista = await minhasLeiturasJuntas().catch(() => []);
    return lista.filter((l) => !l.encerrada_em && l.pessoas.some((p) => p.usuario_id === eu && p.estado === "convidada")).length;
  }, [eu]);
  return c.dados ?? 0;
}

/** lettering together. com as aspas complementares */
export function LetteringTogether({ tamanho = 52 }: { tamanho?: number }) {
  return (
    <span className="relative inline-flex items-end leading-none">
      <svg aria-hidden viewBox="0 0 40 30" width={tamanho * 0.34} height={tamanho * 0.26} className="mr-1 -translate-y-[70%]">
        <path d="M4 26c0-10 4-17 12-22M20 26c0-10 4-17 12-22" stroke={COR.rosa} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      </svg>
      <span className="font-revista font-normal tracking-[-.03em]" style={{ fontSize: tamanho, color: COR.vinho, lineHeight: 0.95 }}>
        together<span style={{ color: COR.oliva }}>.</span>
      </span>
    </span>
  );
}

/** emblema dos clubes: três lombadas em pé, como um ex-libris */
export function EmblemaClubes({ tamanho = 40, cor = COR.oliva }: { tamanho?: number; cor?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 48 48" width={tamanho} height={tamanho} fill="none">
      <circle cx="24" cy="24" r="22" stroke={cor} strokeWidth="1.3" strokeDasharray="2 3" />
      <rect x="13" y="14" width="6" height="21" rx="1" fill={cor} />
      <rect x="20.5" y="11" width="6.5" height="24" rx="1" fill={cor} opacity=".7" />
      <rect x="28.5" y="16" width="6" height="19" rx="1" transform="rotate(8 31.5 25.5)" fill={cor} opacity=".45" />
      <path d="M10 36h28" stroke={cor} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function CabecalhoTogether({ ativo }: { ativo: Experiencia | null }) {
  const convites = useConvitesPendentes();
  useEffect(() => {
    if (!ativo) return;
    try {
      localStorage.setItem(ULTIMA, ativo);
    } catch {
      /* sem armazenamento */
    }
  }, [ativo]);

  return (
    <div className="mb-6">
      <header className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="sr-only">comunidade</h1>
          <span className="lg:hidden">
            <LetteringTogether tamanho={32} />
          </span>
          <span className="hidden lg:inline">
            <LetteringTogether tamanho={42} />
          </span>
          <p className="mt-1 font-revista text-[14px] text-tinta-suave lg:text-[16px]">good books, better company.</p>
        </div>
        <Link
          href="/comunidade/convites"
          aria-label={convites ? `convites, ${convites} pendentes` : "convites"}
          className="flex min-h-10 flex-none items-center gap-1.5 px-1 font-texto text-[13px] font-medium text-tinta-suave hover:text-bordo"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="5" width="18" height="14" rx="1.5" />
            <path d="m3.5 6 8.5 7 8.5-7" />
          </svg>
          convites
          {convites ? <span className="ml-0.5 grid min-w-[18px] place-items-center rounded-full bg-bordo px-1 text-[10px] leading-[18px] text-creme">{convites}</span> : null}
        </Link>
      </header>

      {/* clubes · co-read: navegação editorial, não banners */}
      <nav aria-label="experiências" className="mt-5 flex gap-7 border-b border-linha lg:border-fio">
        <Link
          href="/clubes"
          aria-current={ativo === "clubes" ? "page" : undefined}
          className={`-mb-px flex min-h-11 items-center gap-2 border-b-2 pb-1 font-texto text-[15px] ${ativo === "clubes" ? "border-oliva font-semibold text-ameixa" : "border-transparent font-medium text-cinza hover:text-ameixa"}`}
        >
          <EmblemaClubes tamanho={20} />
          clubes
        </Link>
        <Link
          href="/co-read"
          aria-current={ativo === "coread" ? "page" : undefined}
          className={`-mb-px flex min-h-11 items-center gap-2 border-b-2 pb-1 font-texto text-[15px] ${ativo === "coread" ? "border-bordo font-semibold text-ameixa" : "border-transparent font-medium text-cinza hover:text-ameixa"}`}
        >
          <Marcadores tamanho={22} linha={false} />
          co-read
        </Link>
      </nav>
    </div>
  );
}
