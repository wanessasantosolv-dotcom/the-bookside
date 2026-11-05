"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Passo } from "@/components/onboarding/Passo";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { reduzirImagem } from "@/lib/imagem";
import { usePerfil } from "@/lib/perfil-store";

export default function FotoPage() {
  const foto = usePerfil((s) => s.foto);
  const atualizar = usePerfil((s) => s.atualizar);
  const galeria = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(arquivo?: File) {
    if (!arquivo) return;
    try {
      setErro(null);
      atualizar({ foto: await reduzirImagem(arquivo, 320) });
    } catch {
      setErro("não deu para abrir essa imagem. tente outra.");
    }
  }

  return (
    <Passo
      voltar={{ href: "/criar-perfil/nome", rotulo: "nome" }}
      passo={2}
      eyebrow="um rosto para a ficha"
      titulo="uma foto sua"
      descricao="escolha uma imagem da galeria. dá para trocar quando quiser."
      rodape={
        foto ? (
          <BotaoLink href="/criar-perfil/capa">continuar</BotaoLink>
        ) : (
          <Botao onClick={() => galeria.current?.click()}>escolher da galeria</Botao>
        )
      }
    >
      <input ref={galeria} type="file" accept="image/*" hidden onChange={(e) => escolher(e.target.files?.[0])} />
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="user"
        hidden
        onChange={(e) => escolher(e.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => galeria.current?.click()}
        aria-label={foto ? "trocar foto" : "escolher foto da galeria"}
        className="mx-auto mt-2 flex size-[200px] flex-col items-center justify-center overflow-hidden rounded-full border border-dashed border-rosa-antigo bg-[radial-gradient(circle,#F6E3E7_0%,#F9F5EE_72%)]"
      >
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="sua foto" className="size-full object-cover" />
        ) : (
          <>
            <span className="font-display text-[44px] leading-none font-semibold italic text-bordo">+</span>
            <span className="mt-1.5 font-accent text-base italic text-cinza">sua foto</span>
          </>
        )}
      </button>

      {erro ? (
        <p role="alert" className="mt-3 text-center text-xs font-medium text-bordo-suave">
          {erro}
        </p>
      ) : null}

      <Botao variante="contorno" className="mt-9 !h-12" onClick={() => camera.current?.click()}>
        {foto ? "tirar outra foto" : "tirar uma foto"}
      </Botao>

      <p className="mt-4 text-center">
        <Link
          href="/criar-perfil/capa"
          className="inline-block py-2 font-accent text-[15px] italic text-cinza underline decoration-cinza underline-offset-4"
        >
          {foto ? "trocar depois" : "pular por agora"}
        </Link>
      </p>
    </Passo>
  );
}
