"use client";

import Link from "next/link";
import { ArteCarta, VersoCarta } from "@/components/entrelinhas/Carta";
import { CATALOGO } from "@/lib/entrelinhas";
import { useEntrelinhas } from "@/lib/entrelinhas-store";

/** chamada compacta de nas entrelinhas: rosa suave e bordô; depois do teste, a carta obtida */
export function ChamadaEntrelinhas() {
  const resultado = useEntrelinhas((s) => s.resultado);
  const andamento = useEntrelinhas((s) => s.execucao);
  const c = resultado ? CATALOGO[resultado.carta] : null;
  return (
    <Link href={resultado ? "/nas-entrelinhas?ver=carta" : "/nas-entrelinhas"} className="grao group flex items-center gap-4 rounded-[4px] bg-rosa-editorial px-4 py-4">
      {resultado ? <ArteCarta carta={resultado.carta} largura={46} /> : <VersoCarta largura={34} className="rotate-[-6deg]" />}
      <span className="min-w-0 flex-1">
        <span className="block font-revista text-[20px] leading-tight text-bordo italic">nas entrelinhas.</span>
        <span className="block text-[12px] text-tinta-suave">{c ? `Sua carta: ${c.nome}` : "O oráculo dos leitores."}</span>
      </span>
      <span className="flex-none text-[12px] font-semibold text-bordo group-hover:underline">{c ? "ver carta" : andamento ? "continuar" : "fazer o teste"} →</span>
    </Link>
  );
}
