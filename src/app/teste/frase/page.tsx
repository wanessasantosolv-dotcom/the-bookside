"use client";

import { BarraLink, Filete, PaginaRevista, Rotulo } from "@/components/teste/Revista";
import { useResultado } from "@/components/teste/useResultado";

export default function FrasePage() {
  const { pronto, resultado } = useResultado();
  if (!pronto) return <main className="min-h-dvh bg-jornal" />;
  const { frase } = resultado.principal;

  return (
    <PaginaRevista
      voltar={{ href: "/teste/livros", rotulo: "estante" }}
      rotulo="sua frase"
      rodape={<BarraLink href="/teste/salvar">continuar →</BarraLink>}
    >
      <figure className="flex flex-1 animate-subir flex-col items-center justify-center px-1.5 text-center [animation-delay:.1s]">
        <p aria-hidden className="font-revista text-[64px] leading-none italic text-[#D8C4B4]">
          “
        </p>
        <blockquote className="-mt-3.5 font-revista text-[26px] leading-[1.3] font-semibold italic">{frase.texto}</blockquote>
        <Filete className="mt-[26px] w-12" />
        <figcaption>
          <Rotulo vinho className="mt-3.5 !tracking-[.3em]">
            {frase.autor}
          </Rotulo>
          <p className="mt-2 font-revista text-[15px] leading-[1.2] italic text-grafite">{frase.obra}</p>
        </figcaption>
      </figure>
    </PaginaRevista>
  );
}
