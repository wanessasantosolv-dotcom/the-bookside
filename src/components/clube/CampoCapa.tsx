"use client";

import { useRef, useState } from "react";
import { AjustarFoto } from "@/components/AjustarFoto";
import { rotuloCampo } from "@/components/clube/Pecas";
import { reduzirImagem } from "@/lib/imagem";

/** Foto de capa do clube: escolher, ajustar o corte (3:1, igual ao topo do clube) e trocar. */
export function CampoCapa({ valor, onMudar }: { valor: string | null; onMudar: (v: string | null) => void }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [ajustar, setAjustar] = useState<string | null>(null);
  return (
    <div>
      <p className={rotuloCampo}>foto de capa</p>
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        className={`mt-2 flex aspect-[3/1] w-full items-end justify-between overflow-hidden rounded-md border border-linha bg-cover bg-center p-3 text-left ${valor ? "" : "pat-estrelas"}`}
        style={valor ? { backgroundImage: `url("${valor}")` } : undefined}
      >
        <span className="rounded-pill bg-creme/90 px-3 py-1.5 text-xs font-semibold text-bordo">{valor ? "trocar foto ✎" : "escolher foto"}</span>
      </button>
      <p className="mt-1.5 font-accent text-[13px] italic text-cinza">é a primeira coisa que aparece no clube.</p>
      {valor ? (
        <button type="button" onClick={() => onMudar(null)} className="mt-1 min-h-9 text-xs font-semibold text-cinza underline underline-offset-4">
          tirar a foto
        </button>
      ) : null}
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) setAjustar(await reduzirImagem(f, 2400, 0.9));
        }}
      />
      {ajustar ? (
        <AjustarFoto
          src={ajustar}
          formato="clube"
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
