"use client";

import type { ReactNode } from "react";
import { Passo } from "@/components/onboarding/Passo";
import { BotaoLink } from "@/components/ui/Botao";
import { usePerfil, type EscolhaEstante } from "@/lib/perfil-store";

const opcoes: { id: EscolhaEstante; rotulo: string; titulo: string; icone: ReactNode }[] = [
  {
    id: "lendo",
    rotulo: "estou lendo um",
    titulo: "já comecei um livro",
    icone: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6B0D24" strokeWidth="1.7" strokeLinejoin="round" aria-hidden>
        <path d="M6 3h12v18l-6-4-6 4z" />
      </svg>
    ),
  },
  {
    id: "quero",
    rotulo: "quero ler",
    titulo: "quero começar um agora",
    icone: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6B0D24" strokeWidth="1.7" strokeLinejoin="round" aria-hidden>
        <path d="M12 6c-2-2-5-2-8-1v13c3-1 6-1 8 1 2-2 5-2 8-1V5c-3-1-6-1-8 1z" />
        <path d="M12 6v13" />
      </svg>
    ),
  },
  {
    id: "vazia",
    rotulo: "só olhando",
    titulo: "a estante fica vazia por enquanto",
    icone: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B75A6B" strokeWidth="1.5" aria-hidden>
        <rect x="4" y="4" width="16" height="16" rx="4" strokeDasharray="3 3" />
      </svg>
    ),
  },
];

export default function EstantePage() {
  const estante = usePerfil((s) => s.estante);
  const atualizar = usePerfil((s) => s.atualizar);

  return (
    <Passo
      voltar={{ href: "/criar-perfil/tema", rotulo: "tema" }}
      passo={7}
      eyebrow="sua estante"
      titulo={<span className="text-[30px]">o que você está lendo?</span>}
      descricao="a gente monta sua estante a partir disso. ela começa vazia, e tudo bem."
      rodape={<BotaoLink href="/criar-perfil/gostos">continuar</BotaoLink>}
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="sr-only">sua estante</legend>
        {opcoes.map((o) => {
          const marcado = o.id === estante;
          return (
            <label
              key={o.id}
              className={`flex h-24 cursor-pointer items-center gap-3.5 rounded-md px-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordo ${
                marcado ? "border-[1.5px] border-bordo bg-rosa-fundo" : "border border-linha bg-creme-quente"
              }`}
            >
              <input
                type="radio"
                name="estante"
                className="sr-only"
                checked={marcado}
                onChange={() => atualizar({ estante: o.id })}
              />
              <span
                className={`flex size-[52px] flex-none items-center justify-center rounded-md ${
                  marcado ? "bg-creme-quente" : "bg-rosa-fundo"
                }`}
              >
                {o.icone}
              </span>
              <span className="min-w-0 flex-1">
                <span className="eyebrow block !text-[10px] text-cinza">{o.rotulo}</span>
                <span className="mt-1.5 block font-display text-lg leading-[1.2] font-semibold italic text-ameixa">
                  {o.titulo}
                </span>
              </span>
              <span
                aria-hidden
                className={`size-5 flex-none rounded-full ${
                  marcado ? "border-[6px] border-bordo" : "border-[1.5px] border-rosa-antigo"
                }`}
              />
            </label>
          );
        })}
      </fieldset>
    </Passo>
  );
}
