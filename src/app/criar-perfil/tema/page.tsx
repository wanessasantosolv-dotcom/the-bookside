"use client";

import { Passo } from "@/components/onboarding/Passo";
import { BotaoLink } from "@/components/ui/Botao";
import { temas } from "@/lib/dados";
import { usePerfil } from "@/lib/perfil-store";

export default function TemaPage() {
  const tema = usePerfil((s) => s.tema);
  const atualizar = usePerfil((s) => s.atualizar);

  return (
    <Passo
      voltar={{ href: "/criar-perfil/meta", rotulo: "meta" }}
      passo={6}
      eyebrow="a última camada"
      titulo="o tema do seu perfil"
      descricao="escolha um tema. ele define a cor de destaque e o papel do seu perfil."
      rodape={<BotaoLink href="/criar-perfil/estante">concluir perfil</BotaoLink>}
    >
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="sr-only">tema do perfil</legend>
        {temas.map((t) => {
          const marcado = t.id === tema;
          return (
            <label
              key={t.id}
              className={`relative block h-[104px] cursor-pointer overflow-hidden rounded-md has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bordo ${
                marcado ? "border-2 shadow-[0_6px_14px_-8px_rgba(105,37,54,.55)]" : "border border-[#D8C4B4]"
              }`}
              style={{ background: t.papel, borderColor: marcado ? t.destaque : undefined }}
            >
              <input
                type="radio"
                name="tema"
                className="sr-only"
                checked={marcado}
                onChange={() => atualizar({ tema: t.id })}
              />
              <div
                className="absolute inset-x-0 top-0 h-10"
                style={{
                  background: `repeating-linear-gradient(-45deg,${t.destaque} 0 8px,rgba(255,255,255,.16) 8px 16px)`,
                }}
              />
              <div className="absolute inset-x-0 top-[30px] bottom-0 rounded-t-[18px]" style={{ background: t.papel }} />
              <div className="absolute top-5 left-1/2 size-7 -translate-x-1/2 rounded-full border-2 border-creme-quente bg-[#D8C4B4]" />
              {marcado ? (
                <span
                  aria-hidden
                  className="absolute top-2 right-2 z-10 size-4 rounded-full text-center text-[10px] leading-4 font-bold text-[#F5EFE6]"
                  style={{ background: t.destaque }}
                >
                  ✓
                </span>
              ) : null}
              <p
                className="absolute inset-x-0 bottom-3 text-center font-display text-[13px] leading-none font-semibold italic"
                style={{ color: t.texto }}
              >
                {t.nome}
              </p>
            </label>
          );
        })}
      </fieldset>
    </Passo>
  );
}
