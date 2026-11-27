"use client";

import Link from "next/link";
import { ArteCarta } from "@/components/entrelinhas/Carta";
import { CATALOGO, ehCarta } from "@/lib/entrelinhas";
import { marcarVisibilidade, useEntrelinhas } from "@/lib/entrelinhas-store";
import { usePerfil } from "@/lib/perfil-store";

/**
 * O retrato literário na visão geral do perfil: miniatura da carta original,
 * nome e assinatura. Quem é dona pode ocultar ou refazer o teste; sem carta,
 * só um convite discreto (para a própria pessoa).
 */
export function CartaNoPerfil({ carta, proprio }: { carta?: string; proprio: boolean }) {
  const atualizar = usePerfil((s) => s.atualizar);
  const resultado = useEntrelinhas((s) => s.resultado);
  if (!ehCarta(carta)) {
    if (!proprio) return null;
    // tem resultado guardado mas oculto: oferece exibir de novo
    if (resultado)
      return (
        <button
          type="button"
          onClick={() => {
            atualizar({ cartaLiteraria: { carta: resultado.carta, em: new Date().toISOString() } });
            void marcarVisibilidade(resultado.execucaoId, true);
          }}
          className="inline-flex min-h-9 items-center rounded-[6px] border border-[var(--linha)] px-3 text-[12px] font-semibold text-[var(--acc)] hover:border-[var(--acc)]"
        >
          Exibir minha carta literária
        </button>
      );
    return (
      <Link href="/nas-entrelinhas" className="inline-flex min-h-9 items-center rounded-[6px] border border-[var(--linha)] px-3 text-[12px] font-semibold text-[var(--acc)] hover:border-[var(--acc)]">
        ✦ descubra sua carta literária
      </Link>
    );
  }
  const c = CATALOGO[carta];
  return (
    <div className="flex max-w-[420px] items-center gap-3.5 text-left">
      {/* a carta mantém as cores originais, qualquer que seja o tema do perfil */}
      <Link href={proprio ? "/nas-entrelinhas?ver=carta" : "/nas-entrelinhas"} aria-label={`${c.nome} — nas entrelinhas`}>
        <ArteCarta carta={carta} largura={56} />
      </Link>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold tracking-[.16em] text-[var(--suave)] uppercase">carta literária</p>
        <p className="font-revista text-[17px] leading-tight text-[var(--tinta)]">{c.nome}</p>
        <p className="mt-0.5 font-revista text-[13px] leading-snug text-[var(--acc)] italic">{c.assinatura}</p>
        {proprio ? (
          <p className="mt-1 flex gap-3 text-[11px]">
            <Link href="/nas-entrelinhas?ver=carta" className="font-semibold text-[var(--acc)] hover:underline">
              ver resultado
            </Link>
            <button
              type="button"
              onClick={() => {
                atualizar({ cartaLiteraria: null });
                if (resultado) void marcarVisibilidade(resultado.execucaoId, false);
              }}
              className="text-[var(--suave)] hover:text-[var(--acc)]"
            >
              ocultar
            </button>
            <Link href="/nas-entrelinhas" className="text-[var(--suave)] hover:text-[var(--acc)]">
              refazer
            </Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
