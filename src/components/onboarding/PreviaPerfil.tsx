"use client";

import { usePerfil } from "@/lib/perfil-store";

/** Miniatura do perfil: capa (padrão ou imagem), avatar, nome e @usuário. */
export function PreviaPerfil() {
  const { capa, capaImagem, foto, nome, usuario } = usePerfil();

  return (
    <div className="relative h-[232px]">
      <div
        className={`absolute inset-x-0 top-0 h-[120px] rounded-t-md border border-b-0 border-linha bg-cover bg-center ${
          capaImagem ? "" : `pat-${capa}`
        }`}
        style={capaImagem ? { backgroundImage: `url(${capaImagem})` } : undefined}
      />
      <div className="absolute inset-x-0 top-[92px] bottom-0 rounded-[28px_28px_12px_12px] border border-linha bg-creme" />
      <div className="absolute top-[70px] left-1/2 size-[68px] -translate-x-1/2 overflow-hidden rounded-full border-[3px] border-creme bg-linha">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="" className="size-full object-cover" />
        ) : null}
      </div>
      <p className="absolute inset-x-0 top-[148px] text-center font-display text-[22px] leading-[1.1] font-semibold italic text-ameixa">
        {nome || "seu nome"}
      </p>
      <p className="absolute inset-x-0 top-[176px] text-center text-xs font-medium text-bordo">
        @{usuario || "seu.nome"}
      </p>
    </div>
  );
}
