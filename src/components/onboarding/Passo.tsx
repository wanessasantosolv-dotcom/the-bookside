import Link from "next/link";
import type { ReactNode } from "react";
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
};

/** Estrutura comum das telas de criar perfil: topo, barra de passos, título e botão fixo embaixo. */
export function Passo({ voltar, passo, rotuloTopo, eyebrow, titulo, descricao, children, rodape }: Props) {
  return (
    <Tela>
      <header className="px-6 pt-[18px]">
        <div className="flex items-center justify-between">
          <Link href={voltar.href} className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo">
            ‹ {voltar.rotulo}
          </Link>
          <span className="eyebrow !text-[10px] text-cinza">
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
        <p className="eyebrow text-bordo">{eyebrow}</p>
        <h1 className="mt-2 font-display text-[32px] leading-[1.12] font-semibold italic text-bordo">{titulo}</h1>
        {descricao ? <p className="mt-3 text-sm leading-normal text-cinza">{descricao}</p> : null}
      </div>

      <div className="flex-1 px-6 pt-7 pb-6 [animation-delay:.18s] animate-subir">{children}</div>

      {rodape ? (
        <footer className="sticky bottom-0 bg-gradient-to-t from-creme from-70% to-transparent px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
          {rodape}
        </footer>
      ) : null}
    </Tela>
  );
}
