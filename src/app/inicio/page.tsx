import { EmConstrucao } from "@/components/EmConstrucao";

export default function InicioPage() {
  return (
    <EmConstrucao
      eyebrow="início"
      titulo="o feed vem aí"
      texto="citações, amigas e fichas de leitura. esta é a próxima tela a ser construída."
      voltar={{ href: "/perfil", rotulo: "ver meu perfil" }}
    />
  );
}
