"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Carta, TituloCarta } from "@/components/teste/Carta";
import { useResultado } from "@/components/teste/useResultado";
import { Botao } from "@/components/ui/Botao";
import { usePerfil } from "@/lib/perfil-store";

export default function SalvarPage() {
  const router = useRouter();
  const { pronto, resultado, respostas } = useResultado();
  const atualizar = usePerfil((s) => s.atualizar);
  const [aceito, setAceito] = useState(false);
  if (!pronto) return <main className="envelope min-h-dvh" />;

  function salvar() {
    atualizar({
      bookside: {
        principal: resultado.principal.id,
        secundario: resultado.secundario.id,
        respostas,
        livros: resultado.principal.livros.map((l) => l.titulo),
        salvoEm: new Date().toISOString(),
      },
    });
    router.push("/bem-vinda/clube");
  }

  return (
    <Carta
      voltar={{ href: "/teste/frase", rotulo: "frase" }}
      rotulo="último passo"
      rodape={
        <>
          <p
            className={`mb-2 text-center font-accent text-sm italic text-[#FFF1F3] transition-opacity ${aceito ? "opacity-0" : ""}`}
            aria-hidden={aceito}
          >
            marque a caixa para liberar ✧
          </p>
          <Botao onClick={salvar} disabled={!aceito}>
            salvar meu universo literário
          </Botao>
          <p className="mt-2 text-center">
            <Link href="/bem-vinda/clube" className="inline-block py-2 text-xs font-semibold text-[#FFF1F3] underline underline-offset-4">
              pular por agora
            </Link>
          </p>
        </>
      }
    >
      <p className="rotulo-carta">para guardar no seu perfil</p>
      <TituloCarta>posso guardar isso?</TituloCarta>
      <p className="manuscrito mt-3 !text-sm !text-cinza">só salvamos com a sua permissão. nada sai daqui sem você escolher.</p>

      <label className="mt-[22px] flex cursor-pointer items-start gap-3 border border-[#E0D2C6] bg-[#FFF8F0] p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordo">
        <input type="checkbox" className="peer sr-only" checked={aceito} onChange={(e) => setAceito(e.target.checked)} />
        <span
          aria-hidden
          className={`flex size-[22px] flex-none items-center justify-center border border-bordo text-[13px] font-bold ${
            aceito ? "bg-bordo text-creme" : "bg-[#FFFDF8] text-transparent"
          }`}
        >
          ✓
        </span>
        <span className="text-sm leading-[1.4]">quero salvar meu resultado e minhas respostas no meu perfil</span>
      </label>

      <div className="mt-5 border-t border-[#EFE4D8] pt-3.5">
        <p className="rotulo-carta mb-2">o que fica salvo</p>
        <p className="font-accent text-[15px] leading-[1.85] italic">
          arquétipo principal e secundário
          <br />
          as 15 respostas
          <br />
          os três livros sugeridos
        </p>
      </div>
    </Carta>
  );
}
