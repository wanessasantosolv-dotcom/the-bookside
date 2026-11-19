"use client";

import { useRef, useState } from "react";
import { AjustarFoto } from "@/components/AjustarFoto";
import { rotuloCampo } from "@/components/clube/Pecas";
import { reduzirImagem } from "@/lib/imagem";

/** a foto redonda do clube (como a foto de perfil) */
export function CampoFoto({
  valor,
  onMudar,
}: {
  valor: string | null;
  onMudar: (v: string | null) => void;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [ajustar, setAjustar] = useState<string | null>(null);
  return (
    <div>
      <p className={rotuloCampo}>foto do clube</p>
      <div className="mt-2 flex items-center gap-4">
        <button
          type="button"
          onClick={() => entrada.current?.click()}
          aria-label={valor ? "trocar a foto do clube" : "escolher a foto do clube"}
          className="flex size-20 flex-none items-center justify-center overflow-hidden rounded-full border-[3px] border-creme bg-rosa-fundo text-2xl text-bordo shadow-[0_6px_14px_-8px_rgba(43,20,32,.5)]"
        >
          {valor ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={valor} alt="" className="size-full object-cover" />
          ) : (
            "+"
          )}
        </button>
        <span className="text-[13px]">
          <button
            type="button"
            onClick={() => entrada.current?.click()}
            className="block min-h-9 font-semibold text-bordo underline underline-offset-4"
          >
            {valor ? "trocar foto" : "escolher foto"}
          </button>
          {valor ? (
            <button
              type="button"
              onClick={() => onMudar(null)}
              className="block min-h-9 text-xs font-semibold text-cinza underline underline-offset-4"
            >
              tirar a foto
            </button>
          ) : (
            <span className="font-accent text-xs italic text-cinza">
              aparece na lista de clubes e no topo do clube.
            </span>
          )}
        </span>
      </div>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) setAjustar(await reduzirImagem(f, 1200, 0.9));
        }}
      />
      {ajustar ? (
        <AjustarFoto
          src={ajustar}
          onCancelar={() => setAjustar(null)}
          onPronto={(v) => {
            onMudar(v);
            setAjustar(null);
          }}
        />
      ) : null}
    </div>
  );
}
