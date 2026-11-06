import { BuscaLivros } from "@/components/BuscaLivros";
import { Passo } from "@/components/onboarding/Passo";
import { BotaoLink } from "@/components/ui/Botao";

export default function BuscarLivroPage() {
  return (
    <Passo
      voltar={{ href: "/criar-perfil/estante", rotulo: "estante" }}
      passo={7}
      eyebrow="estou lendo um"
      titulo="buscar livro"
      descricao="encontre o livro que você já começou e coloque na estante."
      rodape={<BotaoLink href="/criar-perfil/gostos">continuar</BotaoLink>}
    >
      <BuscaLivros status="lendo" rotuloInicial="resultados" />
    </Passo>
  );
}
