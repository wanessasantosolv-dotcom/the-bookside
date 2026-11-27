/* eslint-disable @next/next/no-img-element */
import { CATALOGO, VERSO, imagemDaCarta, type CartaId } from "@/lib/entrelinhas";

/**
 * A carta original. A faixa de baixo veio sem o título em inglês; o nome em
 * português entra por cima, na mesma posição, com tipografia da coleção.
 * As cores da arte nunca mudam (sem filtros, sem tema do perfil).
 */
export function ArteCarta({ carta, largura, className = "", prioridade = false }: { carta: CartaId; largura: number; className?: string; prioridade?: boolean }) {
  const c = CATALOGO[carta];
  const altura = Math.round((largura * c.arte.h) / c.arte.w);
  // nomes longos encolhem um pouco para caber entre as bordas da faixa
  const fonte = Math.max(7, (largura * (c.nome.length > 20 ? 0.036 : 0.042)));
  return (
    <figure className={`relative m-0 flex-none ${className}`} style={{ width: largura, height: altura }}>
      <img
        src={imagemDaCarta(carta)}
        alt={`${c.nome}. ${c.alt}`}
        width={largura}
        height={altura}
        loading={prioridade ? "eager" : "lazy"}
        decoding="async"
        className="block h-full w-full select-none drop-shadow-[0_10px_18px_rgba(56,37,44,.28)]"
        draggable={false}
      />
      <figcaption
        aria-hidden
        className="pointer-events-none absolute inset-x-[10%] flex -translate-y-1/2 items-center justify-center gap-[.6em] text-center leading-none font-semibold tracking-[.14em] whitespace-nowrap text-[#fbe9ef] uppercase [font-family:var(--font-manrope),var(--font-inter),system-ui,sans-serif]"
        style={{ top: `${c.arte.faixaCentro}%`, fontSize: fonte }}
      >
        <span className="text-[.8em]">✦</span>
        {c.nome}
        <span className="text-[.8em]">✦</span>
      </figcaption>
    </figure>
  );
}

/** o verso comum das cartas */
export function VersoCarta({ largura, className = "" }: { largura: number; className?: string }) {
  return (
    <img
      src={VERSO}
      alt=""
      aria-hidden
      width={largura}
      height={Math.round((largura * 462) / 218)}
      className={`block flex-none select-none drop-shadow-[0_10px_18px_rgba(56,37,44,.28)] ${className}`}
      style={{ width: largura, height: Math.round((largura * 462) / 218) }}
      draggable={false}
    />
  );
}
