"use client";

import { useRouter } from "next/navigation";
import { Carta } from "@/components/teste/Carta";
import { useResultado } from "@/components/teste/useResultado";
import { BotaoLink } from "@/components/ui/Botao";
import { useTeste } from "@/lib/teste-store";

function hoje() {
  return new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function ResultadoPage() {
  const router = useRouter();
  const recomecar = useTeste((s) => s.recomecar);
  const { pronto, resultado, respondidas } = useResultado();
  const { principal, secundario } = resultado;

  if (!pronto) return <main className="envelope min-h-dvh" />;
  if (respondidas === 0) {
    return (
      <Carta
        voltar={{ href: "/teste", rotulo: "teste" }}
        rotulo="uma carta pra você"
        rodape={<BotaoLink href="/teste">fazer o teste ✧</BotaoLink>}
      >
        <p className="manuscrito">querida leitora, ainda não recebemos suas respostas.</p>
      </Carta>
    );
  }

  return (
    <Carta
      voltar={{ href: "/teste/revelacao", rotulo: "voltar" }}
      rotulo="uma carta pra você"
      rodape={
        <>
          <BotaoLink href="/teste/dna" className="!bg-ameixa !text-creme hover:!bg-bordo-escuro">
            ver meu DNA literário ✧
          </BotaoLink>
          <p className="mt-2 text-center">
            <button
              type="button"
              onClick={() => {
                recomecar();
                router.push("/teste/pergunta/1");
              }}
              className="inline-block py-2 text-xs font-semibold text-[#FFF1F3] underline underline-offset-4"
            >
              refazer o teste
            </button>
          </p>
        </>
      }
    >
      <p className="rotulo-carta mt-2">the bookside · {hoje()}</p>
      <p className="manuscrito mt-[18px]">querida leitora,</p>
      <p className="manuscrito mt-3.5">lemos suas quinze respostas com atenção. não há mais dúvida:</p>

      <div className="-mx-1.5 mt-3.5 px-2.5 pt-3 pb-2 text-center">
        <span aria-hidden className="mx-auto block h-px w-[54px] bg-bege" />
        <p className="mt-[11px] text-[9px] font-semibold tracking-[.3em] text-cinza uppercase">você é</p>
        <h1 className="mt-2 font-display text-[40px] leading-[1.02] font-bold italic text-bordo">{principal.nome}</h1>
        <p className="mt-2 mb-3 font-accent text-[15px] leading-tight italic text-rosa-antigo">{principal.clube}</p>
        <span aria-hidden className="mx-auto block h-px w-[54px] bg-bege" />
      </div>

      <p className="manuscrito mt-4">{principal.descricao}</p>
      <p className="manuscrito mt-4">
        guardamos também um pouco de <b className="font-normal text-bordo">{secundario.nome.replace(/^a /, "")}</b> em você.
      </p>
      <p className="manuscrito mt-[18px] text-right">
        com carinho,
        <br />
        <span className="text-[17px] text-bordo">the bookside ✦</span>
      </p>
    </Carta>
  );
}
