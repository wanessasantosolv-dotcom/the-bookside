"use client";

import { Passo } from "@/components/onboarding/Passo";
import { BotaoLink } from "@/components/ui/Botao";
import { metas } from "@/lib/dados";
import { usePerfil } from "@/lib/perfil-store";

export default function MetaPage() {
  const meta = usePerfil((s) => s.meta);
  const atualizar = usePerfil((s) => s.atualizar);
  const indice = Math.max(0, metas.findIndex((m) => m.valor === meta));
  const atual = metas[indice] ?? metas[2];
  const passo = (d: number) => atualizar({ meta: metas[Math.min(metas.length - 1, Math.max(0, indice + d))].valor });
  const botaoPasso =
    "absolute top-[58px] flex size-11 items-center justify-center rounded-full border text-lg font-semibold disabled:cursor-default";
  const ano = new Date().getFullYear();

  return (
    <Passo
      voltar={{ href: "/criar-perfil/frase", rotulo: "frase" }}
      passo={5}
      eyebrow="o ano que começa"
      titulo="quantos livros neste ano?"
      descricao="sua meta aparece no perfil. dá para mudar quando quiser."
      rodape={<BotaoLink href="/criar-perfil/tema">continuar</BotaoLink>}
    >
      <div className="relative rounded-md border border-linha bg-creme-quente px-5 pt-5 pb-6 text-center" aria-live="polite">
        <button
          type="button"
          aria-label="diminuir meta"
          disabled={indice === 0}
          onClick={() => passo(-1)}
          className={`${botaoPasso} left-5 ${indice === 0 ? "border-linha text-bege" : "border-bege bg-creme-quente text-bordo"}`}
        >
          –
        </button>
        <button
          type="button"
          aria-label="aumentar meta"
          disabled={indice === metas.length - 1}
          onClick={() => passo(1)}
          className={`${botaoPasso} right-5 ${indice === metas.length - 1 ? "border-linha text-bege" : "border-bege bg-creme-quente text-bordo"}`}
        >
          +
        </button>
        <p className="eyebrow !text-[10px] text-cinza">livros · {ano}</p>
        <p className="mt-1 font-display text-[88px] leading-none font-semibold italic text-bordo">{atual.valor ?? "—"}</p>
        <p className="mt-3 font-accent text-[17px] leading-[1.3] italic text-cinza">{atual.legenda}</p>
      </div>

      <fieldset className="mt-9 flex flex-wrap justify-center gap-2">
        <legend className="sr-only">meta de livros</legend>
        {metas.map((m) => {
          const marcado = m.valor === meta;
          return (
            <label
              key={String(m.valor)}
              className={`inline-flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-pill border px-4 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordo ${
                marcado ? "border-bordo bg-bordo text-creme" : "border-bege bg-creme-quente text-ameixa"
              }`}
            >
              <input
                type="radio"
                name="meta"
                className="sr-only"
                checked={marcado}
                onChange={() => atualizar({ meta: m.valor })}
              />
              {m.valor ?? "sem meta"}
            </label>
          );
        })}
      </fieldset>
    </Passo>
  );
}
