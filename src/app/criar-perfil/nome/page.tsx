"use client";

import { useState } from "react";
import { Passo } from "@/components/onboarding/Passo";
import { BotaoLink } from "@/components/ui/Botao";
import { sugerirUsuario, usePerfil } from "@/lib/perfil-store";

export default function NomePage() {
  const nome = usePerfil((s) => s.nome);
  const usuario = usePerfil((s) => s.usuario);
  const atualizar = usePerfil((s) => s.atualizar);
  const [usuarioEditado, setUsuarioEditado] = useState(false);

  const usuarioMostrado = usuario || sugerirUsuario(nome);
  const podeContinuar = nome.trim().length > 0 && usuarioMostrado.length > 0;

  return (
    <Passo
      voltar={{ href: "/entrar", rotulo: "entrar" }}
      passo={1}
      eyebrow="primeira página da sua ficha"
      titulo={
        <>
          como você
          <br />
          se chama?
        </>
      }
      descricao="é assim que suas amigas vão te reconhecer nas fichas e no clube."
      rodape={
        <BotaoLink
          href="/criar-perfil/foto"
          desabilitado={!podeContinuar}
          onClick={() => atualizar({ usuario: usuarioMostrado })}
        >
          continuar
        </BotaoLink>
      }
    >
      <div className="relative rounded-md border border-linha bg-creme-quente p-5 pb-16">
        <div className="flex justify-between">
          <span className="eyebrow !text-[10px] text-bordo">ficha de leitora</span>
          <span className="eyebrow !text-[10px] text-cinza">nº 0001</span>
        </div>
        <div className="mt-3.5 border-t border-linha" />

        <label className="mt-4 block">
          <span className="eyebrow !text-[10px] text-cinza">nome</span>
          <input
            autoComplete="given-name"
            placeholder="como você quer ser chamada"
            value={nome}
            onChange={(e) => {
              atualizar({ nome: e.target.value });
              if (!usuarioEditado) atualizar({ usuario: sugerirUsuario(e.target.value) });
            }}
            className="mt-2 h-12 w-full rounded-sm border border-bege bg-creme-quente px-3.5 font-accent text-lg italic text-ameixa outline-none placeholder:text-cinza focus:border-bordo focus:ring-1 focus:ring-bordo"
          />
        </label>

        <label className="mt-5 block">
          <span className="eyebrow !text-[10px] text-cinza">usuário</span>
          <span className="mt-2 flex items-center border-b border-linha focus-within:border-bordo">
            <span className="text-base font-medium text-bordo">@</span>
            <input
              autoComplete="username"
              autoCapitalize="none"
              placeholder="seu.nome"
              value={usuario}
              onChange={(e) => {
                setUsuarioEditado(true);
                atualizar({ usuario: sugerirUsuario(e.target.value.replace(/^@/, "")) || e.target.value.toLowerCase() });
              }}
              className="h-10 w-full bg-transparent text-base font-medium text-ameixa outline-none placeholder:text-cinza"
            />
          </span>
        </label>

        <span className="absolute right-[18px] bottom-[18px] flex h-7 items-center rounded-pill bg-bordo px-3.5 text-[10px] font-semibold tracking-[.12em] text-creme uppercase">
          nova leitora
        </span>
      </div>
    </Passo>
  );
}
