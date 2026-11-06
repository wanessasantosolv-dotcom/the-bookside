"use client";

import { Carta } from "@/components/teste/Carta";
import { useResultado } from "@/components/teste/useResultado";
import { BotaoLink } from "@/components/ui/Botao";

export default function FrasePage() {
  const { pronto, resultado } = useResultado();
  if (!pronto) return <main className="envelope min-h-dvh" />;
  const { frase } = resultado.principal;

  return (
    <Carta
      voltar={{ href: "/teste/livros", rotulo: "estante" }}
      rotulo="sua frase"
      rodape={<BotaoLink href="/teste/salvar">continuar ✧</BotaoLink>}
    >
      <p className="rotulo-carta">anexo iii · escrito nas estrelas</p>
      <figure className="flex min-h-[380px] flex-col items-center justify-center px-0.5 text-center">
        <p aria-hidden className="font-accent text-[64px] leading-none italic text-[#E8D5CC]">
          “
        </p>
        <blockquote className="-mt-2.5 font-display text-[27px] leading-[1.3] font-bold italic">{frase.texto}</blockquote>
        <span aria-hidden className="mt-6 block h-px w-[54px] bg-bege" />
        <figcaption>
          <p className="mt-[22px] text-[10px] font-semibold tracking-[.2em] text-bordo uppercase">{frase.autor}</p>
          <p className="mt-2 font-accent text-[15px] leading-tight italic text-cinza">{frase.obra}</p>
        </figcaption>
      </figure>
    </Carta>
  );
}
