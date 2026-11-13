"use client";

import { useRef, useState } from "react";
import { AjustarFoto } from "@/components/AjustarFoto";
import { Passo } from "@/components/onboarding/Passo";
import { PreviaPerfil } from "@/components/onboarding/PreviaPerfil";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { reduzirImagem } from "@/lib/imagem";
import { usePerfil, type PadraoCapa } from "@/lib/perfil-store";

const padroes: PadraoCapa[] = ["linhas", "bolinhas", "ondas", "estrelas"];

export default function CapaPage() {
  const capa = usePerfil((s) => s.capa);
  const capaImagem = usePerfil((s) => s.capaImagem);
  const atualizar = usePerfil((s) => s.atualizar);
  const galeria = useRef<HTMLInputElement>(null);
  const [paraAjustar, setParaAjustar] = useState<string | null>(null);

  return (
    <Passo
      voltar={{ href: "/criar-perfil/foto", rotulo: "foto" }}
      passo={3}
      eyebrow="o cenário da ficha"
      titulo="a capa do seu perfil"
      descricao="um padrão do app ou uma imagem da sua galeria."
      rodape={<BotaoLink href="/criar-perfil/frase">continuar</BotaoLink>}
    >
      <PreviaPerfil />

      <fieldset className="mt-5 grid grid-cols-2 gap-3">
        <legend className="sr-only">padrão da capa</legend>
        {padroes.map((p) => {
          const marcado = !capaImagem && capa === p;
          return (
            <label
              key={p}
              className={`relative block h-[84px] cursor-pointer rounded-md border bg-creme-quente p-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordo ${
                marcado ? "border-bordo shadow-[0_0_0_1px_#6B0D24]" : "border-linha"
              }`}
            >
              <input
                type="radio"
                name="capa"
                className="sr-only"
                checked={marcado}
                onChange={() => atualizar({ capa: p, capaImagem: null })}
              />
              <b className={`block h-12 rounded-[8px] pat-${p}`} />
              <span className="absolute bottom-2.5 left-3 text-[13px] font-medium">{p}</span>
            </label>
          );
        })}
      </fieldset>

      <input
        ref={galeria}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const arquivo = e.target.files?.[0];
          e.target.value = "";
          if (arquivo) setParaAjustar(await reduzirImagem(arquivo, 2000, 0.9));
        }}
      />
      {paraAjustar ? (
        <AjustarFoto
          src={paraAjustar}
          formato="capa"
          onCancelar={() => setParaAjustar(null)}
          onPronto={(dataUrl) => {
            atualizar({ capaImagem: dataUrl });
            setParaAjustar(null);
          }}
        />
      ) : null}
      {capaImagem ? (
        <Botao variante="contorno" className="mt-5 !h-12" onClick={() => setParaAjustar(capaImagem)}>
          ajustar capa
        </Botao>
      ) : null}
      <Botao variante="contorno" className={`${capaImagem ? "mt-3" : "mt-5"} !h-12`} onClick={() => galeria.current?.click()}>
        {capaImagem ? "trocar imagem da galeria" : "+ escolher da galeria"}
      </Botao>
    </Passo>
  );
}
