"use client";

import Link from "next/link";
import { EmConstrucao } from "@/components/EmConstrucao";
import { useHidratado } from "@/components/PerfilHidratacao";
import { usePerfil } from "@/lib/perfil-store";

export default function InicioPage() {
  const hidratado = useHidratado();
  const bookside = usePerfil((s) => s.bookside);

  return (
    <EmConstrucao
      eyebrow="início"
      titulo="o feed vem aí"
      texto="citações, amigas e fichas de leitura. esta é uma das próximas telas a ser construída."
      aba="inicio"
      extra={
        !hidratado || bookside ? null : (
          <Link href="/teste" className="block rounded-[4px] border border-dashed border-ouro p-5 text-left font-texto hover:bg-jornal">
            <p className="text-[10px] font-semibold tracking-[.18em] text-bordo uppercase">✦ ainda não fez o teste?</p>
            <p className="mt-2 font-revista text-[19px] leading-[1.2] italic text-tinta">descubra seu bookside</p>
            <p className="mt-1.5 text-xs leading-[1.4] text-grafite">15 perguntas, 8 arquétipos — e um universo literário só seu.</p>
            <p className="mt-2.5 text-[11px] font-bold tracking-[.1em] text-bordo uppercase">fazer o teste →</p>
          </Link>
        )
      }
    />
  );
}
