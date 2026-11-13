"use client";

import { Passo } from "@/components/onboarding/Passo";
import { BotaoLink } from "@/components/ui/Botao";
import { temas } from "@/lib/dados";
import { usePerfil } from "@/lib/perfil-store";

export default function TemaPage() {
  const tema = usePerfil((s) => s.tema);
  const foto = usePerfil((s) => s.foto);
  const capa = usePerfil((s) => s.capa);
  const capaImagem = usePerfil((s) => s.capaImagem);
  const atual = temas.find((t) => t.id === tema) ?? temas[0];
  const escuro = "escuro" in atual;
  const atualizar = usePerfil((s) => s.atualizar);

  return (
    <Passo
      voltar={{ href: "/criar-perfil/meta", rotulo: "meta" }}
      passo={6}
      fundo={atual.fundo}
      faixa={atual.destaque}
      escuro={escuro}
      eyebrow="a última camada"
      frase="o tema do seu perfil"
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
              className={`relative block h-[104px] cursor-pointer overflow-hidden rounded-md transition-transform duration-200 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bordo ${
                marcado ? "-translate-y-0.5 border-2 shadow-[0_10px_22px_-10px_rgba(105,37,54,.6)]" : "border border-[#D8C4B4]"
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
              {/* a capa da pessoa, tingida com a cor do tema */}
              <div
                className={`absolute inset-x-0 top-0 h-10 bg-cover bg-[center_30%] ${capaImagem ? "" : `pat-${capa}`}`}
                style={capaImagem ? { backgroundImage: `url("${capaImagem}")` } : undefined}
              >
                <div className="absolute inset-0 opacity-[.58]" style={{ background: t.destaque }} />
              </div>
              <div className="absolute inset-x-0 top-[30px] bottom-0 rounded-t-[18px]" style={{ background: t.papel }} />
              <div className="absolute top-5 left-1/2 size-7 -translate-x-1/2 overflow-hidden rounded-full border-2 border-creme-quente bg-[#D8C4B4]">
                {foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto} alt="" className="size-full object-cover object-[50%_30%]" />
                ) : null}
              </div>
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
