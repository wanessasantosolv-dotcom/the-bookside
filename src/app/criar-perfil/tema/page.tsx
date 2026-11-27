"use client";

import { Passo } from "@/components/onboarding/Passo";
import { BotaoLink } from "@/components/ui/Botao";
import { TEMAS_APP, temaApp } from "@/lib/temas";
import { TemaSimbolo } from "@/components/TemaSimbolo";
import { MiniaturaTema } from "@/components/perfil/PreviaTema";
import { usePerfil } from "@/lib/perfil-store";

export default function TemaPage() {
  const tema = usePerfil((s) => s.tema);
  const atual = temaApp(tema) ?? TEMAS_APP[0];
  const atualizar = usePerfil((s) => s.atualizar);

  return (
    <Passo
      voltar={{ href: "/criar-perfil/meta", rotulo: "meta" }}
      passo={6}
      fundo={atual.claro.fundo}
      faixa={atual.claro.primaria}
      escuro={false}
      eyebrow="a última camada"
      frase="o tema do seu perfil"
      titulo="o tema do seu perfil"
      descricao="cada tema é uma edição do bookside: cores, tipografia e detalhes próprios. dá para trocar depois."
      rodape={<BotaoLink href="/criar-perfil/estante">concluir perfil</BotaoLink>}
    >
      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="sr-only">tema do perfil</legend>
        {TEMAS_APP.map((t) => {
          const marcado = t.id === atual.id;
          const v = t.claro;
          return (
            <label
              key={t.id}
              className={`relative flex h-[112px] cursor-pointer flex-col overflow-hidden rounded-[6px] border has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bordo ${marcado ? "ring-1" : ""}`}
              style={{ background: v.fundo, color: v.texto, borderColor: marcado ? v.primaria : v.borda, ["--tw-ring-color" as string]: v.primaria }}
            >
              <input type="radio" name="tema" className="sr-only" checked={marcado} onChange={() => atualizar({ tema: t.id })} />
              <MiniaturaTema id={t.id} escuro={false} />
              <span className="flex flex-1 flex-col justify-between px-2.5 py-2">
                <span className="flex items-center gap-1.5">
                  <span style={{ color: v.primaria }}>
                    <TemaSimbolo simbolo={t.simbolo} tamanho={14} />
                  </span>
                  <span className="truncate text-[12px] font-semibold">{t.nome}</span>
                </span>
                <span className="text-[11px] opacity-75">{t.descricao}</span>
              </span>
              {marcado ? (
                <span aria-hidden className="absolute top-1.5 right-1.5 size-4 rounded-full text-center text-[10px] leading-4 font-bold" style={{ background: v.primaria, color: v.sobrePrimaria }}>
                  ✓
                </span>
              ) : null}
            </label>
          );
        })}
      </fieldset>
    </Passo>
  );
}
