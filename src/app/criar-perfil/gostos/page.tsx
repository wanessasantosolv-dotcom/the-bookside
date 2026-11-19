"use client";

import { Passo } from "@/components/onboarding/Passo";
import { BotaoLink } from "@/components/ui/Botao";
import { pilhasDeGostos } from "@/lib/dados";
import { usePerfil } from "@/lib/perfil-store";

const MINIMO = 3;

export default function GostosPage() {
  const gostos = usePerfil((s) => s.gostos);
  const alternarGosto = usePerfil((s) => s.alternarGosto);
  const total = gostos.length;

  return (
    <Passo
      voltar={{ href: "/criar-perfil/estante", rotulo: "estante" }}
      passo={8}
      eyebrow="o que você lê"
      frase="escolha pelo menos três gêneros"
      titulo="do que você gosta?"
      descricao="escolha pelo menos três. isso ajuda a sugerir leituras, dá para mudar depois."
      rodape={
        <BotaoLink href="/bem-vinda/clube" desabilitado={total < MINIMO}>
          continuar
        </BotaoLink>
      }
    >
      <fieldset>
        <legend className="sr-only">gêneros que você gosta</legend>
        <div className="flex flex-wrap gap-2">
          {pilhasDeGostos.flat().map((g) => {
            const on = gostos.includes(g.nome);
            return (
              <label
                key={g.nome}
                className={`flex h-10 cursor-pointer items-center rounded-pill border-[1.5px] px-4 text-[13px] font-semibold transition-colors ${
                  on
                    ? "border-bordo bg-bordo text-creme"
                    : "border-linha bg-creme-quente text-ameixa"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  onChange={() => alternarGosto(g.nome)}
                />
                {g.nome}
              </label>
            );
          })}
        </div>
      </fieldset>

      <p className="mt-6 text-center font-accent text-[15px] leading-[1.3] italic text-cinza" aria-live="polite">
        {total} {total === 1 ? "escolhido" : "escolhidos"} · mínimo {MINIMO}
      </p>
    </Passo>
  );
}
