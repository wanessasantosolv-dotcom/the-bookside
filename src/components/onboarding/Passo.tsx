import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { Tela } from "@/components/ui/Tela";
import { PASSOS_PERFIL } from "@/lib/dados";

type Props = {
  voltar: { href: string; rotulo: string };
  /** número do passo (1–8). Sem número, mostra `rotuloTopo` e esconde a barra. */
  passo?: number;
  rotuloTopo?: string;
  eyebrow: string;
  titulo: ReactNode;
  descricao?: ReactNode;
  children?: ReactNode;
  rodape?: ReactNode;
  /** cor de fundo da tela (o passo do tema pinta a tela com o tema escolhido) */
  fundo?: string;
  /** faixa colorida de 5px no topo */
  faixa?: string;
  /** textos claros, para fundo escuro */
  escuro?: boolean;
};

/** Estrutura comum das telas de criar perfil: topo, barra de passos, título e botão fixo embaixo. */
export function Passo({ voltar, passo, rotuloTopo, eyebrow, titulo, descricao, children, rodape, fundo, faixa, escuro }: Props) {
  const estilo = { "--fundo": fundo ?? "#F9F5EE" } as CSSProperties;
  const cor = escuro
    ? { link: "text-[#C9B8A8]", suave: "text-[#C9B8A8]", destaque: "text-rosa-claro" }
    : { link: "text-bordo", suave: "text-cinza", destaque: "text-bordo" };
  return (
    <Tela style={estilo} className="!bg-[var(--fundo)] transition-colors duration-300">
      {faixa ? <div aria-hidden className="absolute inset-x-0 top-0 z-10 h-[5px] transition-colors duration-300" style={{ background: faixa }} /> : null}
      <header className="px-6 pt-[18px]">
        <div className="flex items-center justify-between">
          <Link href={voltar.href} className={`-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold ${cor.link}`}>
            ‹ {voltar.rotulo}
          </Link>
          <span className={`eyebrow !text-[10px] ${cor.suave}`}>
            {passo ? `passo ${passo} de ${PASSOS_PERFIL}` : rotuloTopo}
          </span>
        </div>
        {passo ? (
          <div
            className="mt-2 flex gap-1.5"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={PASSOS_PERFIL}
            aria-valuenow={passo}
            aria-label="progresso do perfil"
          >
            {Array.from({ length: PASSOS_PERFIL }, (_, i) => (
              <i
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i + 1 < passo ? "bg-bordo" : i + 1 === passo ? "bg-rosa-antigo" : "bg-linha"
                }`}
              />
            ))}
          </div>
        ) : null}
      </header>

      <div className="animate-subir px-6 pt-8">
        <p className={`eyebrow ${cor.destaque}`}>{eyebrow}</p>
        <h1 className={`mt-2 font-display text-[32px] leading-[1.12] font-semibold italic ${cor.destaque}`}>{titulo}</h1>
        {descricao ? <p className={`mt-3 text-sm leading-normal ${cor.suave}`}>{descricao}</p> : null}
      </div>

      <div className="flex-1 px-6 pt-7 pb-6 [animation-delay:.18s] animate-subir">{children}</div>

      {rodape ? (
        <footer className="sticky bottom-0 bg-gradient-to-t from-[var(--fundo)] from-70% to-transparent px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
          {rodape}
        </footer>
      ) : null}
    </Tela>
  );
}
