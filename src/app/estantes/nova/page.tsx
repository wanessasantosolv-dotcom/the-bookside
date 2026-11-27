"use client";

import { Voltar } from "@/components/Voltar";
import { TelaApp } from "@/components/AppShell";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Botao } from "@/components/ui/Botao";
import { usePerfil } from "@/lib/perfil-store";

const COR_PADRAO = "#692536";
const rotulo =
  "mb-1.5 block text-[10px] leading-[14px] font-semibold tracking-[.12em] text-bordo uppercase";

export default function NovaEstantePage() {
  const router = useRouter();
  const criarEstante = usePerfil((s) => s.criarEstante);
  const [nome, setNome] = useState("");
  const [publica, setPublica] = useState(false);

  return (
    <TelaApp aba="estantes">
      <header className="flex items-center justify-between px-6 pt-2">
        <Voltar
          padrao="/estantes"
          rotulo="estantes"
          className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo"
        />
        <span className="eyebrow !text-[10px] text-cinza">nova estante</span>
      </header>
      <div className="animate-subir px-6 pt-4">
        <h1 className="font-display text-[30px] leading-[1.1] font-semibold italic text-bordo">
          crie uma estante
        </h1>
        <p className="mt-2 font-accent text-sm italic text-cinza">
          pra organizar do seu jeito — &quot;favoritos de{" "}
          {new Date().getFullYear()}&quot;, &quot;pra chorar&quot;, o que
          quiser.
        </p>
      </div>

      <div className="flex-1 px-6 pt-7">
        <div className="animate-subir rounded-md border border-linha bg-creme-quente px-[18px] py-5 [animation-delay:.12s]">
          <label className="block">
            <span className={rotulo}>nome da estante</span>
            <input
              value={nome}
              maxLength={40}
              placeholder="ex: pra reler"
              onChange={(e) => setNome(e.target.value)}
              className="h-[46px] w-full rounded-sm border border-bege bg-creme-quente px-3 text-[15px] outline-none placeholder:text-[#8A7E7A] focus:border-bordo focus:ring-1 focus:ring-bordo"
            />
          </label>

          <fieldset className="mt-[18px]">
            <legend className={rotulo}>visibilidade</legend>
            <div className="mt-1 flex gap-2">
              {[
                { v: false, t: "privada" },
                { v: true, t: "pública" },
              ].map((o) => (
                <label
                  key={o.t}
                  className={`flex h-11 cursor-pointer items-center rounded-pill border px-[13px] text-xs font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordo ${
                    publica === o.v
                      ? "border-bordo bg-bordo text-creme"
                      : "border-bege bg-creme-quente"
                  }`}
                >
                  <input
                    type="radio"
                    name="vis"
                    className="sr-only"
                    checked={publica === o.v}
                    onChange={() => setPublica(o.v)}
                  />
                  {o.t}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <footer className="sticky bottom-0 px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        <Botao
          disabled={!nome.trim()}
          onClick={() => {
            const id = criarEstante({ nome: nome.trim(), cor: COR_PADRAO, publica });
            router.push(`/estantes/${id}`);
          }}
        >
          criar estante
        </Botao>
      </footer>
    </TelaApp>
  );
}
