import { Descobrir } from "@/components/Descobrir";

/** A estrela do feed: uma indicação por vez — passar, quero ler ou já li. */
export default function DescobrirPage() {
  return <Descobrir voltar={{ href: "/inicio", r: "início" }} continuar={{ href: "/inicio", r: "voltar ao início" }} />;
}
