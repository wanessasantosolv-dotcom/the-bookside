import { BarraLink, PaginaRevista } from "@/components/teste/Revista";

export default function RevelacaoPage() {
  return (
    <PaginaRevista
      voltar={{ href: "/teste/pergunta/15", rotulo: "pergunta 15" }}
      rotulo="revelação"
      rodape={
        <BarraLink href="/teste/resultado" className="aparece [animation-delay:2.6s]">
          ver meu bookside →
        </BarraLink>
      }
    >
      <section className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="aparece text-[9px] font-semibold tracking-[.3em] text-vinho uppercase [animation-delay:.1s]">
          ✦ the bookside reveal ✦
        </p>
        <p role="status" className="aparece mt-14 font-revista text-[32px] leading-[1.2] italic [animation-delay:.2s]">
          montando seu
          <br />
          universo literário…
        </p>
        <div aria-hidden className="mt-8 h-[3px] w-[200px] overflow-hidden rounded-full bg-fio">
          <i className="enche block h-full rounded-full bg-vinho" />
        </div>
        <p className="mt-6 animate-subir text-xs leading-[1.4] text-grafite [animation-delay:.3s]">
          lendo suas quinze respostas com atenção.
        </p>
      </section>
    </PaginaRevista>
  );
}
