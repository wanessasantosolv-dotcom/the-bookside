import { TemaSimbolo } from "@/components/TemaSimbolo";
import type { Decoracao, TemaApp } from "@/lib/temas";

/**
 * O pequeno ornamento do tema (fio + símbolo). A intensidade muda a presença,
 * não a identidade: fine print fica sempre num fio só; plot twist continua com
 * a estrela mesmo no minimal.
 */
export function OrnamentoTema({ tema, nivel, className = "" }: { tema: TemaApp; nivel: Decoracao; className?: string }) {
  const fio = <span className="h-px flex-1 bg-linha" />;
  if (tema.id === "fine-print")
    return (
      <span aria-hidden className={`flex items-center gap-2 ${className}`}>
        <span className="h-px flex-1 bg-ameixa/60" />
        {nivel !== "minimal" ? <span className="size-1.5 bg-[var(--tema-acento)]" /> : null}
      </span>
    );
  if (nivel === "minimal" && tema.id !== "plot-twist") return null;
  const cor = tema.id === "plot-twist" ? "text-[var(--tema-acento)] drop-shadow-[1px_1px_0_var(--color-bordo)]" : "text-bordo";
  return (
    <span aria-hidden className={`flex items-center gap-3 ${className}`}>
      {fio}
      {nivel === "expressive" ? <TemaSimbolo simbolo={tema.simbolo} tamanho={11} className={`${cor} opacity-70`} /> : null}
      <TemaSimbolo simbolo={tema.simbolo} tamanho={nivel === "minimal" ? 12 : 16} className={cor} />
      {nivel === "expressive" ? <TemaSimbolo simbolo={tema.simbolo} tamanho={11} className={`${cor} opacity-70`} /> : null}
      {fio}
    </span>
  );
}
