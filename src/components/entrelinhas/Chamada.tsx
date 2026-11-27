"use client";

import Link from "next/link";
import { ArteCarta, VersoCarta } from "@/components/entrelinhas/Carta";
import { CATALOGO } from "@/lib/entrelinhas";
import { useEntrelinhas } from "@/lib/entrelinhas-store";

/** a chamada compacta em Descobrir: antes do teste, o convite; depois, a carta obtida */
export function ChamadaEntrelinhas() {
  const resultado = useEntrelinhas((s) => s.resultado);
  const andamento = useEntrelinhas((s) => s.execucao);
  if (resultado) {
    const c = CATALOGO[resultado.carta];
    return (
      <Link href="/nas-entrelinhas?ver=carta" className="group flex items-center gap-4 rounded-[8px] border border-linha bg-creme-quente p-3 pr-4 hover:border-bege">
        <ArteCarta carta={resultado.carta} largura={54} />
        <span className="min-w-0 flex-1">
          <span className="block font-revista text-[13px] text-bordo italic">nas entrelinhas.</span>
          <span className="block font-revista text-[18px] leading-tight text-ameixa">{c.nome}</span>
          <span className="block truncate text-[12px] text-tinta-suave italic">{c.assinatura}</span>
        </span>
        <span className="flex-none text-[12px] font-semibold text-bordo group-hover:underline">ver carta</span>
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-4 rounded-[8px] border border-linha bg-creme-quente p-3 pr-4">
      <VersoCarta largura={38} />
      <span className="min-w-0 flex-1">
        <span className="block font-revista text-[19px] leading-tight text-bordo italic">nas entrelinhas.</span>
        <span className="block text-[13px] text-tinta-suave">Descubra sua carta literária.</span>
      </span>
      <Link href="/nas-entrelinhas" className="flex h-10 flex-none items-center rounded-[6px] bg-bordo px-4 text-[13px] font-semibold text-creme hover:bg-bordo-suave">
        {andamento ? "Continuar" : "Fazer o teste"}
      </Link>
    </div>
  );
}
