"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { perguntas } from "@/lib/teste";
import { useTeste } from "@/lib/teste-store";

const giros = ["-0.6deg", "0.5deg", "-0.3deg", "0.7deg"];
const giroSelo = ["-2deg", "1.5deg"];

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
    <main
      key={numero}
      className="papel-teste relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden px-6 pb-[max(24px,env(safe-area-inset-bottom))] text-ameixa"
    >
      <header className="pt-[18px]">
        <div className="flex items-center justify-between">
          <Link
            href={numero === 1 ? "/teste" : `/teste/pergunta/${numero - 1}`}
            className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo"
          >
            ‹ voltar
          </Link>
          <span className="eyebrow !text-[10px] text-cinza">
            pergunta {String(numero).padStart(2, "0")}/{total}
          </span>
        </div>
        <div
          className="mt-1 h-1.5 overflow-hidden rounded-full bg-linha"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={numero}
          aria-label="progresso do teste"
        >
          <i
            className="block h-full rounded-full bg-gradient-to-r from-bordo to-rosa-antigo transition-[width] duration-500"
            style={{ width: `${Math.round((numero / total) * 100)}%` }}
          />
        </div>
      </header>

      <span
        className="washi aparece mt-9 self-start"
        style={{ transform: `rotate(${giroSelo[indice % 2]})` }}
      >
        {pergunta.selo}
      </span>
      <span aria-hidden className="estrela-pisca absolute top-[140px] right-[34px] text-base text-ouro">
        ✧
      </span>

      <h1 className="mt-6 animate-subir font-display text-[27px] leading-[1.16] font-semibold italic text-ameixa [animation-delay:.15s]">
        {pergunta.titulo}
      </h1>

      <fieldset className="mt-8 flex flex-col gap-3.5">
        <legend className="sr-only">{pergunta.titulo}</legend>
        {pergunta.opcoes.map((o, i) => (
          <button
            key={o.texto}
            type="button"
            className="opcao-teste"
            data-escolhida={atual === i}
            aria-pressed={atual === i}
            disabled={escolhida !== null}
            onClick={() => escolher(i)}
            style={{ transform: `rotate(${giros[i]})`, animationDelay: `${0.12 + i * 0.08}s` }}
          >
            <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-bordo text-xs font-semibold text-creme">
              {"ABCD"[i]}
            </span>
            <span className="flex-1">{o.texto}</span>
            <span aria-hidden className="text-lg font-semibold text-bordo">
              ›
            </span>
          </button>
        ))}
      </fieldset>

      {/* lombadas: uma por pergunta */}
      <div aria-hidden className="mt-auto flex justify-center gap-1 pt-10 pb-2">
        {perguntas.map((_, i) => (
          <i
            key={i}
            className={`block w-[9px] rounded-[1px] ${i % 2 ? "h-[18px]" : "h-6"} ${i <= indice ? "bg-bordo" : "bg-linha"}`}
          />
        ))}
      </div>
    </main>
  );
}
