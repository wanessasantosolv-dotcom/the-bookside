"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BarraBotao, PaginaRevista, Rotulo } from "@/components/teste/Revista";
import { useResultado } from "@/components/teste/useResultado";
import { usePerfil } from "@/lib/perfil-store";

export default function SalvarPage() {
  const router = useRouter();
  const { pronto, resultado, respostas } = useResultado();
  const atualizar = usePerfil((s) => s.atualizar);
  const [aceito, setAceito] = useState(false);
  if (!pronto) return <main className="min-h-dvh bg-jornal" />;

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
    router.push("/inicio");
  }

  return (
    <PaginaRevista
      voltar={{ href: "/teste/frase", rotulo: "frase" }}
      rotulo="último passo"
      rodape={
        <>
          <p
            aria-hidden={aceito}
            className={`text-center font-revista text-[13px] italic text-vinho transition-opacity ${aceito ? "opacity-0" : ""}`}
          >
            marque a caixa para liberar ✧
          </p>
          <p className="mt-2 mb-3 text-center">
            <Link href="/inicio" className="inline-block py-2 text-[9px] font-bold tracking-[.14em] text-grafite uppercase underline underline-offset-4">
              pular por agora
            </Link>
          </p>
          <BarraBotao onClick={salvar} disabled={!aceito}>
            salvar meu universo literário →
          </BarraBotao>
        </>
      }
    >
      <Rotulo vinho className="aparece mt-8 !tracking-[.3em]">
        para guardar no seu perfil
      </Rotulo>
      <h1 className="mt-3 animate-subir font-revista text-[32px] leading-[1.1] italic [animation-delay:.1s]">posso guardar isso?</h1>
      <p className="mt-2 text-[13px] leading-normal text-grafite">só salvamos com a sua permissão. nada sai daqui sem você escolher.</p>

      <label className="mt-6 flex cursor-pointer items-start gap-3 border-y border-tinta py-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-vinho">
        <input type="checkbox" className="sr-only" checked={aceito} onChange={(e) => setAceito(e.target.checked)} />
        <span
          aria-hidden
          className={`mt-px flex size-5 flex-none items-center justify-center border-[1.5px] border-vinho text-[13px] font-bold ${
            aceito ? "bg-vinho text-jornal" : "text-transparent"
          }`}
        >
          ✓
        </span>
        <span className="text-sm leading-[1.4]">quero salvar meu resultado e minhas respostas no meu perfil</span>
      </label>

      <div className="mt-6">
        <Rotulo>o que fica salvo</Rotulo>
        <p className="mt-2.5 font-revista text-[15px] leading-[1.7] italic">
          arquétipo principal e secundário
          <br />
          as 15 respostas
          <br />
          os três livros sugeridos
        </p>
      </div>
    </PaginaRevista>
  );
}
