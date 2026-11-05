import { EmConstrucao } from "@/components/EmConstrucao";

export default function EmBrevePage() {
  return (
    <EmConstrucao
      eyebrow="clube de leitura"
      titulo="essa parte chega em breve"
      texto="os clubes estão no mapa do app. por enquanto, siga criando seu perfil."
      voltar={{ href: "/bem-vinda/primeiro-livro", rotulo: "continuar o perfil" }}
    />
  );
}
