import Link from "next/link";
import { TelaAviso } from "@/components/ui/TelaAviso";

export default function NaoEncontrada() {
  return (
    <TelaAviso selo="página não encontrada" titulo="essa página saiu da estante." texto="o endereço pode estar errado, ou a página foi removida.">
      <Link href="/inicio" className="flex h-12 items-center rounded-[6px] bg-bordo px-6 text-[14px] font-semibold text-creme hover:bg-bordo-suave">
        Voltar ao início
      </Link>
      <Link href="/descobrir" className="flex h-12 items-center rounded-[6px] border border-bege px-6 text-[14px] font-semibold text-ameixa hover:border-bordo">
        Descobrir livros
      </Link>
    </TelaAviso>
  );
}
