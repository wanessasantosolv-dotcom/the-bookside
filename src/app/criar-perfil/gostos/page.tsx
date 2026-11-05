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
      titulo="do que você gosta?"
      descricao="escolha pelo menos três livros da pilha. isso ajuda a sugerir leituras, dá para mudar depois."
      rodape={
        // TODO: o teste "what's your bookside" entra aqui antes do clube.
        <BotaoLink href="/bem-vinda/clube" desabilitado={total < MINIMO}>
          continuar
        </BotaoLink>
      }
    >
      <fieldset>
        <legend className="sr-only">gêneros que você gosta</legend>
        {pilhasDeGostos.map((pilha, i) => (
          <div key={i} className={`pilha ${i > 0 ? "mt-4" : ""}`}>
            {pilha.map((g) => (
              <label key={g.nome} className="lombada-livro" style={{ "--c": g.cor } as React.CSSProperties}>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={gostos.includes(g.nome)}
                  onChange={() => alternarGosto(g.nome)}
                />
                <span>{g.nome}</span>
              </label>
            ))}
            <div className="prateleira" />
          </div>
        ))}
      </fieldset>

      <p className="mt-6 text-center font-accent text-[15px] leading-[1.3] italic text-cinza" aria-live="polite">
        {total} {total === 1 ? "escolhido" : "escolhidos"} · mínimo {MINIMO}
      </p>
    </Passo>
  );
}
