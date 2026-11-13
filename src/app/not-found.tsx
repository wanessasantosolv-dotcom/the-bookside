import Link from "next/link";
import { Tela } from "@/components/ui/Tela";

export default function NaoEncontrada() {
  return (
    <Tela className="justify-center px-6 py-12 text-center">
      <p aria-hidden className="font-accent text-3xl italic text-ouro">
        ✦
      </p>
      <p className="mt-4 text-[11px] font-semibold tracking-[.16em] text-bordo uppercase">página não encontrada</p>
      <h1 className="mt-2 font-display text-[32px] leading-[1.12] font-semibold italic text-bordo">essa página saiu da estante</h1>
      <p className="mt-3 text-sm text-cinza">o endereço pode estar errado, ou a página foi removida.</p>
      <Link href="/inicio" className="mx-auto mt-6 flex min-h-[52px] items-center rounded-pill bg-bordo px-8 text-[15px] font-semibold text-creme">
        voltar ao início
      </Link>
    </Tela>
  );
}
