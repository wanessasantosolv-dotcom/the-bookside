"use client";

import { useState } from "react";
import { Passo } from "@/components/onboarding/Passo";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { conjuntosDeFrases } from "@/lib/dados";
import { usePerfil } from "@/lib/perfil-store";

const LIMITE = 80;

export default function FrasePage() {
  const frase = usePerfil((s) => s.frase);
  const atualizar = usePerfil((s) => s.atualizar);
  const [conjunto, setConjunto] = useState(0);

  return (
    <Passo
      voltar={{ href: "/criar-perfil/capa", rotulo: "capa" }}
      passo={4}
      eyebrow="o que vai na sua ficha"
      titulo="uma frase sobre você"
      descricao="escolha uma sugestão ou deixe a sua. ela aparece logo abaixo do nome."
      rodape={
        <BotaoLink href="/criar-perfil/meta" desabilitado={!frase.trim()}>
          continuar
        </BotaoLink>
      }
    >
      <label className="relative block min-h-[150px] rounded-md border border-linha bg-creme-quente px-[22px] pt-[46px] pb-11">
        <span aria-hidden className="absolute top-[-6px] left-[18px] font-accent text-[60px] leading-none italic text-rosa-antigo">
          “
        </span>
        <span className="sr-only">sua frase</span>
        <textarea
          value={frase}
          maxLength={LIMITE}
          rows={2}
          placeholder="escreva a sua…"
          onChange={(e) => atualizar({ frase: e.target.value })}
          className="w-full resize-none bg-transparent font-display text-[22px] leading-[1.3] font-semibold italic text-ameixa outline-none placeholder:text-cinza/70"
        />
        <span className="eyebrow absolute bottom-4 left-[22px] !text-[10px] text-cinza">— você, daqui a pouco</span>
        <span className="absolute right-4 bottom-4 text-[11px] font-medium text-cinza">
          {frase.length}/{LIMITE}
        </span>
      </label>

      <p className="mt-4 font-accent text-[17px] leading-tight italic text-bordo">sem ideia? a gente te dá umas dicas ✦</p>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {conjuntosDeFrases[conjunto].map((s) => {
          const ativa = s === frase;
          return (
            <button
              key={s}
              type="button"
              aria-pressed={ativa}
              onClick={() => atualizar({ frase: s })}
              className={`inline-flex min-h-9 items-center rounded-pill border px-3.5 text-sm font-medium transition-colors ${
                ativa ? "border-bordo bg-bordo text-creme" : "border-bege bg-creme-quente text-ameixa hover:border-bordo"
              }`}
            >
              {s}
            </button>
          );
        })}
      </div>

      <Botao
        variante="contorno"
        className="mt-6 !h-11 !bg-creme-quente !text-sm"
        onClick={() => setConjunto((c) => (c + 1) % conjuntosDeFrases.length)}
      >
        renovar sugestões ↻
      </Botao>
    </Passo>
  );
}
