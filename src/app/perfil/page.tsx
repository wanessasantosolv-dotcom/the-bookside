import { EmConstrucao } from "@/components/EmConstrucao";

export default function PerfilPage() {
  return (
    <EmConstrucao
      eyebrow="meu perfil"
      titulo="seu perfil está guardado"
      texto="a página completa do perfil, com estantes e favoritos, entra numa das próximas etapas."
      voltar={{ href: "/inicio", rotulo: "ir para o início" }}
    />
  );
}
