import { Descobrir } from "@/components/Descobrir";

/** "guardei esta pra você" dentro do cadastro. */
export default function DescobrirPage() {
  return <Descobrir voltar={{ href: "/criar-perfil/estante", r: "estante" }} continuar={{ href: "/criar-perfil/gostos", r: "pular por agora" }} />;
}
