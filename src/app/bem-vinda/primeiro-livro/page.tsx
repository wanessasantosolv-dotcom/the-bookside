import Link from "next/link";
import { BuscaLivros } from "@/components/BuscaLivros";
import { Passo } from "@/components/onboarding/Passo";
import { BotaoLink } from "@/components/ui/Botao";

export default function PrimeiroLivroPage() {
  return (
    <Passo
      voltar={{ href: "/bem-vinda/clube", rotulo: "clube" }}
      rotuloTopo="opcional"
      eyebrow="sua estante"
      titulo="adicione seu primeiro livro"
      descricao="busque o que você está lendo ou escolha uma sugestão."
      rodape={
        <>
          <p className="mb-3 text-center">
            <Link href="/bem-vinda/pronto" className="inline-block py-2 font-accent text-[15px] italic text-cinza">
              pular por agora
            </Link>
          </p>
          <BotaoLink href="/bem-vinda/pronto">concluir</BotaoLink>
        </>
      }
    >
      <BuscaLivros status="lendo" />
    </Passo>
  );
}
