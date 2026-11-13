import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import type { Aba } from "@/components/NavInferior";
import { BotaoLink } from "@/components/ui/Botao";
import { Tela } from "@/components/ui/Tela";

/** Tela provisória para destinos que ainda vão ser construídos. */
export function EmConstrucao({
  eyebrow,
  titulo,
  texto,
  voltar,
  aba,
  extra,
}: {
  eyebrow: string;
  titulo: string;
  texto: string;
  voltar?: { href: string; rotulo: string };
  /** mostra o menu do app (inferior no celular, lateral no computador) com esta aba marcada */
  aba?: Aba;
  extra?: ReactNode;
}) {
  const conteudo = (
    <div className="papel-pontilhado flex flex-1 flex-col justify-center px-6 py-12 text-center lg:bg-jornal lg:bg-none">
      <p aria-hidden className="font-accent text-3xl italic text-ouro">
        ✦
      </p>
      <p className="eyebrow mt-4 text-bordo">{eyebrow}</p>
      <h1 className="mt-2 font-display text-[32px] leading-[1.12] font-semibold italic text-bordo">{titulo}</h1>
      <p className="mx-auto mt-3 max-w-[300px] font-accent text-[17px] leading-[1.35] italic text-cinza">{texto}</p>
      {voltar ? (
        <BotaoLink href={voltar.href} variante="contorno" className="mx-auto mt-10 max-w-[280px]">
          {voltar.rotulo}
        </BotaoLink>
      ) : null}
      {extra ? <div className="mx-auto mt-10 w-full max-w-[360px]">{extra}</div> : null}
    </div>
  );
  return aba ? <AppShell aba={aba}>{conteudo}</AppShell> : <Tela className="text-center">{conteudo}</Tela>;
}
