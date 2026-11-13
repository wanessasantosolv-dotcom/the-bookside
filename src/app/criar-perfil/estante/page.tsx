"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Passo } from "@/components/onboarding/Passo";
import { usePerfil, type EscolhaEstante } from "@/lib/perfil-store";

const opcoes: { id: EscolhaEstante; href: string; rotulo: string; titulo: string; icone: ReactNode }[] = [
  {
    id: "lendo",
    href: "/criar-perfil/estante/buscar",
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
    href: "/criar-perfil/estante/descobrir",
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
    href: "/criar-perfil/gostos",
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
  const atualizar = usePerfil((s) => s.atualizar);

  return (
    <Passo
      voltar={{ href: "/criar-perfil/tema", rotulo: "tema" }}
      passo={7}
      eyebrow="sua estante"
      frase="ela começa vazia, e tudo bem"
      titulo={<span className="text-[30px]">o que você está lendo?</span>}
      descricao="a gente monta sua estante a partir disso. ela começa vazia, e tudo bem."
    >
      <ul className="flex flex-col gap-3">
        {opcoes.map((o) => (
          <li key={o.id}>
            <Link
              href={o.href}
              onClick={() => atualizar({ estante: o.id })}
              className="flex h-24 items-center gap-3.5 rounded-md border border-linha bg-creme-quente px-4 transition-colors hover:border-bordo active:border-[1.5px] active:border-bordo active:bg-rosa-fundo"
            >
              <span className="flex size-[52px] flex-none items-center justify-center rounded-md bg-rosa-fundo">{o.icone}</span>
              <span className="min-w-0 flex-1">
                <span className="eyebrow block !text-[10px] text-cinza">{o.rotulo}</span>
                <span className="mt-1.5 block font-display text-lg leading-[1.2] font-semibold italic text-ameixa">
                  {o.titulo}
                </span>
              </span>
              <span aria-hidden className="flex-none text-[17px] text-rosa-antigo">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Passo>
  );
}
