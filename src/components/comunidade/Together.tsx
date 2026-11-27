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

/** cabeçalho das páginas de detalhe da comunidade (ex.: todas as leituras compartilhadas) */
export function CabecalhoTogether({ ativo }: { ativo: Experiencia | null }) {
  useEffect(() => {
    if (!ativo) return;
    try {
      localStorage.setItem(ULTIMA, ativo);
    } catch {
      /* sem armazenamento */
    }
  }, [ativo]);
  return (
    <header className="mb-5">
      <Link href="/comunidade" className="-ml-2 inline-flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo">
        ← entre leitores
      </Link>
      <h1 className="mt-1 font-revista text-[26px] leading-none text-ameixa">{ativo === "coread" ? "Leituras compartilhadas" : "Comunidade"}</h1>
      {ativo === "coread" ? <p className="mt-1 text-[13px] text-cinza">Marcadores diferentes, a mesma história.</p> : null}
    </header>
  );
}
