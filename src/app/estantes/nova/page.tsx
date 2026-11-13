"use client";

import Link from "next/link";
import { TelaApp } from "@/components/AppShell";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Botao } from "@/components/ui/Botao";
import { usePerfil } from "@/lib/perfil-store";

const cores = [
  { cor: "#6B0D24", nome: "bordô" },
  { cor: "#8E1D3D", nome: "vinho" },
  { cor: "#6B7A5E", nome: "oliva" },
  { cor: "#A88B64", nome: "dourado" },
  { cor: "#464052", nome: "ameixa" },
];
const rotulo = "mb-1.5 block text-[10px] leading-[14px] font-semibold tracking-[.12em] text-bordo uppercase";

export default function NovaEstantePage() {
  const router = useRouter();
  const criarEstante = usePerfil((s) => s.criarEstante);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(cores[0].cor);
  const [publica, setPublica] = useState(false);

  return (
    <TelaApp aba="estantes">
      <header className="flex items-center justify-between px-6 pt-2">
        <Link href="/estantes" className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo">
          ‹ estantes
        </Link>
        <span className="eyebrow !text-[10px] text-cinza">nova estante</span>
      </header>
      <div className="animate-subir px-6 pt-4">
        <h1 className="font-display text-[30px] leading-[1.1] font-semibold italic text-bordo">crie uma estante</h1>
        <p className="mt-2 font-accent text-sm italic text-cinza">
          pra organizar do seu jeito — &quot;favoritos de {new Date().getFullYear()}&quot;, &quot;pra chorar&quot;, o que quiser.
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
            <legend className={rotulo}>cor</legend>
            <div className="mt-1 flex gap-1">
              {cores.map((c) => (
                <label key={c.cor} className="flex size-11 cursor-pointer items-center justify-center rounded-full has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordo">
                  <input type="radio" name="cor" className="sr-only" checked={cor === c.cor} onChange={() => setCor(c.cor)} />
                  <span className="sr-only">{c.nome}</span>
                  <span
                    aria-hidden
                    className={`size-[34px] rounded-full border-2 ${cor === c.cor ? "border-ameixa ring-2 ring-creme-quente ring-inset" : "border-transparent"}`}
                    style={{ background: c.cor }}
                  />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-[18px]">
            <legend className={rotulo}>visibilidade</legend>
            <div className="mt-1 flex gap-2">
              {[
                { v: false, t: "só eu vejo" },
                { v: true, t: "amigas também" },
              ].map((o) => (
                <label
                  key={o.t}
                  className={`flex h-11 cursor-pointer items-center rounded-pill border px-[13px] text-xs font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordo ${
                    publica === o.v ? "border-bordo bg-bordo text-creme" : "border-bege bg-creme-quente"
                  }`}
                >
                  <input type="radio" name="vis" className="sr-only" checked={publica === o.v} onChange={() => setPublica(o.v)} />
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
            const id = criarEstante({ nome: nome.trim(), cor, publica });
            router.push(`/estantes/${id}`);
          }}
        >
          criar estante
        </Botao>
      </footer>
    </TelaApp>
  );
}
