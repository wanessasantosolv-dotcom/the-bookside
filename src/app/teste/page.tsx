"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarraBotao, Filete, PaginaRevista, Rotulo } from "@/components/teste/Revista";
import { useTeste } from "@/lib/teste-store";

export default function TesteIntroPage() {
  const router = useRouter();
  const recomecar = useTeste((s) => s.recomecar);

  return (
    <PaginaRevista
      voltar={{ href: "/inicio", rotulo: "início" }}
      rotulo={<span className="font-semibold tracking-[.16em] text-grafite">edição especial</span>}
      rodape={
        <>
          <p className="mb-6 text-center">
            <Link href="/inicio" className="inline-block py-2 font-revista text-sm italic text-grafite underline underline-offset-4">
              deixar para depois
            </Link>
          </p>
          <BarraBotao
            onClick={() => {
              recomecar();
              router.push("/teste/pergunta/1");
            }}
          >
            descobrir meu bookside →
          </BarraBotao>
        </>
      }
    >
      <section className="aparece pt-11 text-center">
        <Rotulo className="!tracking-[.3em]">the bookside apresenta</Rotulo>
        <h1 className="mt-3.5 font-revista text-[54px] leading-[.92] font-semibold tracking-[-.02em] italic">
          what&apos;s your
          <br />
          bookside?
        </h1>
      </section>

      <Filete className="mt-10" />

      <p className="mt-6 animate-subir text-center text-sm leading-[1.6] text-tinta-suave [animation-delay:.1s]">
        15 perguntas, 8 arquétipos e um universo
        <br />
        literário que é só seu.
      </p>

      <dl className="mt-7 flex animate-subir justify-center gap-7 border-y border-tinta py-[18px] [animation-delay:.2s]">
        {[
          ["15", "perguntas"],
          ["08", "arquétipos"],
          ["02", "minutos"],
        ].map(([n, r]) => (
          <div key={r} className="flex flex-col-reverse items-center text-center">
            <dt>
              <Rotulo className="mt-1.5">{r}</Rotulo>
            </dt>
            <dd className="font-mono text-[26px] leading-none font-bold text-vinho">{n}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-8 animate-subir text-center font-revista text-[15px] leading-[1.4] italic text-grafite [animation-delay:.3s]">
        “sem respostas erradas — só descobertas”
      </p>
    </PaginaRevista>
  );
}
