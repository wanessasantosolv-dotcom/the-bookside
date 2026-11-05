import { Tela } from "@/components/ui/Tela";
import { BotaoLink } from "@/components/ui/Botao";

/** Tela provisória para destinos que ainda vão ser construídos. */
export function EmConstrucao({
  eyebrow,
  titulo,
  texto,
  voltar = { href: "/entrar", rotulo: "voltar ao início" },
}: {
  eyebrow: string;
  titulo: string;
  texto: string;
  voltar?: { href: string; rotulo: string };
}) {
  return (
    <Tela className="papel-pontilhado justify-center px-6 py-12 text-center">
      <p aria-hidden className="font-accent text-3xl italic text-ouro">✦</p>
      <p className="eyebrow mt-4 text-bordo">{eyebrow}</p>
      <h1 className="mt-2 font-display text-[32px] leading-[1.12] font-semibold italic text-bordo">{titulo}</h1>
      <p className="mx-auto mt-3 max-w-[300px] font-accent text-[17px] leading-[1.35] italic text-cinza">{texto}</p>
      <BotaoLink href={voltar.href} variante="contorno" className="mx-auto mt-10 max-w-[280px]">
        {voltar.rotulo}
      </BotaoLink>
    </Tela>
  );
}
