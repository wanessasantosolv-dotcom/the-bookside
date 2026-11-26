"use client";

import Link from "next/link";
import { useEffect } from "react";
import { COR, Envelope, Marcadores } from "@/components/coread/Marca";
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
      <svg aria-hidden viewBox="0 0 40 30" width={tamanho * 0.42} height={tamanho * 0.32} className="mr-1 -translate-y-[60%]">
        <path d="M4 26c0-10 4-17 12-22M20 26c0-10 4-17 12-22" stroke={COR.rosa} strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
      <span className="font-revista font-semibold tracking-[-.035em] italic" style={{ fontSize: tamanho, color: COR.vinho, lineHeight: 0.9 }}>
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
    <div className="mb-6 lg:mb-8">
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="sr-only">comunidade</h1>
          <span className="lg:hidden">
            <LetteringTogether tamanho={38} />
          </span>
          <span className="hidden lg:inline">
            <LetteringTogether tamanho={60} />
          </span>
          <p className="mt-1.5 font-revista text-[15px] text-ameixa italic lg:mt-2.5 lg:text-[19px]">good books, better company.</p>
        </div>
        <Link
          href="/comunidade/convites"
          aria-label={convites ? `convites, ${convites} pendentes` : "convites"}
          className="relative flex min-h-11 flex-none items-center gap-2 rounded-pill border border-linha px-3 text-[13px] font-semibold text-bordo hover:border-bordo lg:px-4"
        >
          <Envelope tamanho={26} />
          <span className="hidden sm:inline">convites</span>
          {convites ? (
            <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-bordo text-[10px] text-creme">{convites}</span>
          ) : null}
        </Link>
      </header>

      {/* as duas experiências, lado a lado: funcionam como abas */}
      <nav aria-label="experiências" className="mt-5 grid grid-cols-2 gap-3 lg:mt-7 lg:gap-5">
        <Link
          href="/clubes"
          aria-current={ativo === "clubes" ? "page" : undefined}
          className={`group relative flex items-center gap-3 overflow-hidden rounded-[4px] border-b-[3px] px-3.5 py-3 transition-colors lg:gap-5 lg:px-6 lg:py-5 ${
            ativo === "clubes" ? "border-oliva bg-[#E7EADF]" : "border-transparent bg-[#F1F0E8] hover:bg-[#E7EADF]"
          }`}
        >
          <span className="flex-none lg:hidden">
            <EmblemaClubes tamanho={30} />
          </span>
          <span className="hidden flex-none lg:block">
            <EmblemaClubes tamanho={54} />
          </span>
          <span className="min-w-0">
            <span className="block font-revista text-[20px] leading-none font-semibold italic lg:text-[30px]" style={{ color: COR.oliva }}>
              clubes.
            </span>
            <span className="mt-1.5 hidden font-revista text-[14px] italic text-tinta-suave lg:block">our kind of club.</span>
          </span>
        </Link>
        <Link
          href="/co-read"
          aria-current={ativo === "coread" ? "page" : undefined}
          className={`group relative flex items-center gap-3 overflow-hidden rounded-[4px] border-b-[3px] px-3.5 py-3 transition-colors lg:gap-5 lg:px-6 lg:py-5 ${
            ativo === "coread" ? "border-bordo bg-[#F7E1E6]" : "border-transparent bg-[#F6ECEC] hover:bg-[#F7E1E6]"
          }`}
        >
          <span className="flex-none lg:hidden">
            <Marcadores tamanho={34} linha={false} />
          </span>
          <span className="hidden flex-none lg:block">
            <Marcadores tamanho={60} />
          </span>
          <span className="min-w-0">
            <span className="block font-revista text-[20px] leading-none font-semibold tracking-[-.02em] italic lg:text-[30px]" style={{ color: COR.vinho }}>
              co-read<span style={{ color: COR.rosa }}>.</span>
            </span>
            <span className="mt-1.5 hidden font-revista text-[14px] italic text-tinta-suave lg:block">different bookmarks, same story.</span>
          </span>
        </Link>
      </nav>
    </div>
  );
}
