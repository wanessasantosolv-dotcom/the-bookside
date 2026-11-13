"use client";

import { BarraLink, Filete, PaginaRevista, Rotulo } from "@/components/teste/Revista";
import { useResultado } from "@/components/teste/useResultado";

export default function DnaPage() {
  const { pronto, resultado } = useResultado();
  if (!pronto) return <main className="min-h-dvh bg-jornal" />;
  const { principal, dna } = resultado;

  return (
    <PaginaRevista
      voltar={{ href: "/teste/resultado", rotulo: "resultado" }}
      rotulo="seu dna"
      rodape={<BarraLink href="/teste/livros">ver meus livros →</BarraLink>}
    >
      <Rotulo vinho className="aparece mt-8 !tracking-[.3em]">
        anexo i · afinidades
      </Rotulo>
      <h1 className="mt-3 animate-subir font-revista text-[32px] leading-[1.1] italic [animation-delay:.1s]">seu DNA literário</h1>
      <p className="mt-2 text-[13px] leading-normal text-grafite">o quanto de cada arquétipo mora em você.</p>

      <ul className="mt-5">
        {dna.slice(0, 4).map(({ arquetipo, afinidade }, i) => (
          <li key={arquetipo.id} className="mt-4 animate-subir" style={{ animationDelay: `${0.14 + i * 0.08}s` }}>
            <div className="flex items-baseline justify-between">
              <span className="font-revista text-base leading-[1.2] italic">{arquetipo.nome}</span>
              <span className="font-mono text-xs font-bold text-vinho">{afinidade}%</span>
            </div>
            <div
              className="mt-[7px] h-[3px] overflow-hidden bg-fio"
              role="meter"
              aria-label={arquetipo.nome}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={afinidade}
            >
              <i className="block h-full bg-vinho" style={{ width: `${afinidade}%` }} />
            </div>
          </li>
        ))}
      </ul>

      <Filete className="mt-8" />
      <div className="mt-5 animate-subir [animation-delay:.3s]">
        <Rotulo vinho>o que isso revela</Rotulo>
        <p className="mt-2 text-sm leading-[1.55] text-tinta-suave">{principal.revela.charAt(0).toLowerCase() + principal.revela.slice(1)}</p>
        <Rotulo vinho className="mt-[18px]">
          o que vale explorar
        </Rotulo>
        <p className="mt-2 text-sm leading-[1.55] text-tinta-suave">{principal.explorar.charAt(0).toLowerCase() + principal.explorar.slice(1)}</p>
      </div>
    </PaginaRevista>
  );
}
