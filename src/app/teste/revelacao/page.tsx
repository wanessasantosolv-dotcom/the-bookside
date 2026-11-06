import { BotaoLink } from "@/components/ui/Botao";

export default function RevelacaoPage() {
  return (
    <main className="papel-noite relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center overflow-hidden px-6 pb-[max(24px,env(safe-area-inset-bottom))] text-creme">
      <span aria-hidden className="estrela-pisca absolute top-[120px] left-11 text-xs text-ouro">✦</span>
      <span aria-hidden className="estrela-pisca absolute top-[150px] right-[52px] text-[15px] text-rosa-claro [animation-delay:1.1s]">✧</span>
      <span aria-hidden className="estrela-pisca absolute bottom-[280px] left-[60px] text-[10px] text-ouro [animation-delay:2s]">✦</span>
      <span aria-hidden className="estrela-pisca absolute right-11 bottom-[240px] text-xs text-rosa-claro">✧</span>

      <section className="flex flex-1 flex-col items-center justify-center text-center">
        <p className="aparece text-[10px] font-semibold tracking-[.2em] text-rosa-claro uppercase">✦ the bookside reveal ✦</p>
        <div className="relative mt-14 flex size-[250px] items-center justify-center">
          <span aria-hidden className="anel absolute inset-0 opacity-50 [animation-direction:reverse] [animation-duration:30s]" />
          <span aria-hidden className="anel absolute inset-[25px]" />
          <span aria-hidden className="aparece font-accent text-[70px] leading-none italic text-rosa-claro [animation-delay:.15s]">
            ✷
          </span>
        </div>
        <p className="aparece mt-10 font-accent text-2xl leading-[1.25] italic text-creme [animation-delay:.3s]" role="status">
          montando seu universo literário…
        </p>
        <div aria-hidden className="mt-6 h-[3px] w-[220px] overflow-hidden rounded-full bg-rosa-claro/25">
          <i className="enche block h-full bg-rosa-claro" />
        </div>
      </section>

      <BotaoLink href="/teste/resultado" variante="creme" className="aparece [animation-delay:2.6s]">
        ver meu bookside ✧
      </BotaoLink>
    </main>
  );
}
