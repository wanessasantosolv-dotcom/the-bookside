"use client";

import { useRouter } from "next/navigation";
import { BarraLink, Filete, PaginaRevista, Rotulo } from "@/components/teste/Revista";
import { useResultado } from "@/components/teste/useResultado";
import { useTeste } from "@/lib/teste-store";

function hoje() {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function ResultadoPage() {
  const router = useRouter();
  const recomecar = useTeste((s) => s.recomecar);
  const { pronto, resultado, respondidas } = useResultado();
  const { principal, secundario } = resultado;

  if (!pronto) return <main className="min-h-dvh bg-jornal" />;
  if (respondidas === 0) {
    return (
      <PaginaRevista voltar={{ href: "/inicio", rotulo: "início" }} rotulo="resultado" rodape={<BarraLink href="/teste">fazer o teste →</BarraLink>}>
        <p className="mt-10 font-revista text-xl italic">ainda não recebemos suas respostas.</p>
      </PaginaRevista>
    );
  }

  return (
    <PaginaRevista
      voltar={{
        rotulo: "refazer",
        onClick: () => {
          recomecar();
          router.push("/teste/pergunta/1");
        },
      }}
      rotulo="resultado"
      rodape={<BarraLink href="/teste/dna">ver meu DNA literário →</BarraLink>}
    >
      <p className="aparece mt-8 font-revista text-sm italic text-vinho">the bookside · {hoje()}</p>
      <div className="mt-6 animate-subir [animation-delay:.1s]">
        <Rotulo vinho className="!tracking-[.3em]">
          você é
        </Rotulo>
        <h1 className="mt-3 font-revista text-[46px] leading-[1.02] font-semibold tracking-[-.02em] italic">{principal.nome}</h1>
        <p className="mt-2.5 font-revista text-base leading-tight italic text-vinho">{principal.clube}</p>
      </div>
      <Filete className="mt-8" />
      <div className="mt-5 animate-subir text-sm leading-[1.6] text-tinta-suave [animation-delay:.2s]">
        <p>{principal.descricao.charAt(0).toLowerCase() + principal.descricao.slice(1)}</p>
        <p className="mt-4">
          guardamos também um pouco de <i className="font-revista text-vinho italic">{secundario.nome.replace(/^a /, "")}</i> em você.
        </p>
      </div>
    </PaginaRevista>
  );
}
