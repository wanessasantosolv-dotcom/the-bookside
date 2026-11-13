"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Filete, PaginaRevista, Rotulo } from "@/components/teste/Revista";
import { perguntas } from "@/lib/teste";
import { useTeste } from "@/lib/teste-store";

const dois = (n: number) => String(n).padStart(2, "0");

export default function PerguntaPage() {
  const { n } = useParams<{ n: string }>();
  const router = useRouter();
  const numero = Number(n);
  const respostas = useTeste((s) => s.respostas);
  const responder = useTeste((s) => s.responder);
  const [escolhida, setEscolhida] = useState<number | null>(null);

  if (!Number.isInteger(numero) || numero < 1 || numero > perguntas.length) notFound();
  const indice = numero - 1;
  const pergunta = perguntas[indice];
  const total = perguntas.length;
  const atual = escolhida ?? respostas[indice];

  function escolher(opcao: number) {
    setEscolhida(opcao);
    responder(indice, opcao);
    // pequena pausa para a pessoa ver a escolha marcada
    setTimeout(() => router.push(numero === total ? "/teste/revelacao" : `/teste/pergunta/${numero + 1}`), 220);
  }

  return (
    <PaginaRevista
      key={numero}
      voltar={{ href: numero === 1 ? "/teste" : `/teste/pergunta/${numero - 1}`, rotulo: "voltar" }}
      rotulo={
        <span className="font-semibold tracking-[.16em] text-grafite">
          pergunta {dois(numero)}/{total}
        </span>
      }
      barra={numero / total}
    >
      <p className="aparece mt-8 font-revista text-sm leading-[1.3] italic text-vinho lg:mt-0 lg:text-center">
        {pergunta.selo}
      </p>
      <h1 className="mt-3 animate-subir font-revista text-[30px] leading-[1.12] tracking-[-.01em] italic [animation-delay:.1s] lg:mx-auto lg:max-w-[560px] lg:text-center lg:text-[36px]">
        {pergunta.titulo}
      </h1>

      <fieldset className="mt-10 lg:mx-auto lg:grid lg:max-w-[600px] lg:grid-cols-2 lg:gap-4">
        <legend className="sr-only">{pergunta.titulo}</legend>
        {pergunta.opcoes.map((o, i) => (
          <button
            key={o.texto}
            type="button"
            aria-pressed={atual === i}
            disabled={escolhida !== null}
            onClick={() => escolher(i)}
            className={`aparece flex w-full items-center gap-3.5 border-t border-tinta px-1 py-[17px] text-left transition-colors hover:bg-vinho/5 lg:items-start lg:rounded-[6px] lg:border lg:border-fio lg:px-4 lg:py-4 lg:hover:border-vinho ${
              atual === i ? "bg-vinho/10" : ""
            }`}
            style={{ animationDelay: `${0.1 + i * 0.07}s` }}
          >
            <span className="w-[22px] flex-none font-mono text-[11px] font-bold text-vinho">{"ABCD"[i]}—</span>
            <span className="flex-1 text-[15px] leading-[1.35]">{o.texto}</span>
            <span aria-hidden className="flex-none text-base text-grafite">
              →
            </span>
          </button>
        ))}
        <Filete />
      </fieldset>

      <div className="mt-auto pt-10">
        <Filete />
        <div className="mt-3.5 flex justify-between">
          <Rotulo>the bookside · teste de leitora</Rotulo>
          <Rotulo vinho>
            {dois(numero)} / {total}
          </Rotulo>
        </div>
      </div>
    </PaginaRevista>
  );
}
