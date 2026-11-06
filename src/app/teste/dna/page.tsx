"use client";

import { Carta, TituloCarta } from "@/components/teste/Carta";
import { useResultado } from "@/components/teste/useResultado";
import { BotaoLink } from "@/components/ui/Botao";

export default function DnaPage() {
  const { pronto, resultado } = useResultado();
  if (!pronto) return <main className="envelope min-h-dvh" />;
  const { principal, dna } = resultado;

  return (
    <Carta
      voltar={{ href: "/teste/resultado", rotulo: "resultado" }}
      rotulo="seu dna"
      rodape={<BotaoLink href="/teste/livros">ver meus livros ✧</BotaoLink>}
    >
      <p className="rotulo-carta">anexo i · afinidades</p>
      <TituloCarta>seu DNA literário</TituloCarta>
      <p className="manuscrito mt-3 !text-sm !text-cinza">o quanto de cada arquétipo mora em você.</p>

      <ul className="mt-1">
        {dna.slice(0, 4).map(({ arquetipo, afinidade }, i) => (
          <li key={arquetipo.id} className="mt-[18px] animate-subir" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
            <div className="flex items-baseline justify-between">
              <span className="font-accent text-[15px] leading-tight italic">{arquetipo.nome}</span>
              <b className="text-xs font-semibold text-bordo">{afinidade}%</b>
            </div>
            <div
              className="mt-2 h-[7px] overflow-hidden rounded-full bg-[#F0E6DC]"
              role="meter"
              aria-label={arquetipo.nome}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={afinidade}
            >
              <i className="block h-full rounded-full bg-gradient-to-r from-bordo to-rosa-antigo" style={{ width: `${afinidade}%` }} />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-[22px] border-t border-[#EFE4D8] pt-3.5">
        <p className="rotulo-carta">o que isso revela</p>
        <p className="manuscrito mt-2">{principal.revela}</p>
        <p className="rotulo-carta mt-4">o que vale explorar</p>
        <p className="manuscrito mt-2">{principal.explorar}</p>
      </div>
    </Carta>
  );
}
