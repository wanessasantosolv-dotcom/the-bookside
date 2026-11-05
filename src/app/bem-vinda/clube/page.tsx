import Link from "next/link";
import { Passo } from "@/components/onboarding/Passo";
import { BotaoLink } from "@/components/ui/Botao";

const pill = "inline-flex h-[22px] items-center rounded-pill px-2.5 text-[10px] font-semibold tracking-[.12em] uppercase";

export default function ClubePage() {
  return (
    <Passo
      voltar={{ href: "/criar-perfil/gostos", rotulo: "gostos" }}
      rotuloTopo="opcional"
      eyebrow="clube de leitura"
      titulo="quer ler com alguém?"
      descricao="dá para entrar em um clube, criar o seu ou deixar para depois."
      rodape={
        <BotaoLink href="/bem-vinda/primeiro-livro" variante="contorno">
          pular etapa
        </BotaoLink>
      }
    >
      <div className="flex flex-col gap-4">
        <Link
          href="/em-breve?tela=entrar-no-clube"
          className="block rounded-md border border-linha bg-creme-quente p-5 transition-colors hover:border-bordo"
        >
          <span className={`${pill} border border-bordo text-bordo`}>tenho um convite</span>
          <h2 className="mt-2.5 font-display text-2xl leading-[1.15] font-semibold italic text-ameixa">entrar em um clube</h2>
          <p className="mt-2 text-[13px] leading-[1.45] text-cinza">cole o link ou o código que você recebeu.</p>
        </Link>

        <Link
          href="/em-breve?tela=criar-clube"
          className="block rounded-md bg-bordo p-5 text-creme transition-colors hover:bg-bordo-suave"
        >
          <span className={`${pill} bg-creme text-bordo`}>começar do zero</span>
          <h2 className="mt-2.5 font-display text-2xl leading-[1.15] font-semibold italic text-creme">criar um clube ✦</h2>
          <p className="mt-2 text-[13px] leading-[1.45] text-rosa-claro">
            dê um nome, escolha o primeiro livro e convide quem quiser.
          </p>
        </Link>
      </div>
    </Passo>
  );
}
