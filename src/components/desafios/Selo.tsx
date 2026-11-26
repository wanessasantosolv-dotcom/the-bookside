/*
 * Os selos dos desafios: uma família só (selo postal com picote, moldura fina
 * e gravura em traço), com variações por tipo de meta e cor da paleta.
 * Tudo em SVG, sem imagens nem emojis.
 */

import type { ReactNode } from "react";
import type { TipoDesafio } from "@/lib/desafios";

export const PALETA_SELOS = {
  bordo: "#692536",
  oliva: "#59634F",
  rosa: "#D3A6A8",
  terracota: "#B8785F",
  mostarda: "#C6AA70",
  azul: "#788B96",
} as const;

/** a cor de cada tipo (quando o desafio não traz uma) */
const COR_DO_TIPO: Record<TipoDesafio | "anual", string> = {
  anual: PALETA_SELOS.bordo,
  livros: PALETA_SELOS.terracota,
  paginas: PALETA_SELOS.bordo,
  minutos: PALETA_SELOS.azul,
  dias: PALETA_SELOS.oliva,
  pilha: PALETA_SELOS.mostarda,
  bingo: PALETA_SELOS.oliva,
};

/** a gravura no centro do selo (traço fino, 0–100) */
function Gravura({ tipo, numero, cor }: { tipo: TipoDesafio | "anual"; numero?: number; cor: string }) {
  const traco = { fill: "none", stroke: cor, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (tipo === "anual" || tipo === "livros")
    return (
      <g>
        <text x="50" y="57" textAnchor="middle" fontFamily="var(--font-fraunces), Georgia, serif" fontStyle="italic" fontSize={String(numero ?? "").length > 2 ? 26 : 34} fill={cor}>
          {numero ?? ""}
        </text>
        <path d="M30 66h40" {...traco} strokeWidth={1.2} />
        <text x="50" y="76" textAnchor="middle" fontFamily="var(--font-manrope), system-ui, sans-serif" fontSize="7" letterSpacing="1.6" fill={cor}>
          {tipo === "anual" ? "LIVROS NO ANO" : "LIVROS"}
        </text>
      </g>
    );
  if (tipo === "paginas")
    // livro aberto, com linhas de texto
    return (
      <g {...traco}>
        <path d="M24 36c9-4 18-4 26 1v34c-8-5-17-5-26-1Z" />
        <path d="M76 36c-9-4-18-4-26 1v34c8-5 17-5 26-1Z" />
        <path d="M30 45h13M30 51h13M30 57h10M57 45h13M57 51h13M57 57h10" strokeWidth={1.2} />
      </g>
    );
  if (tipo === "pilha")
    // pilha de livros antigos
    return (
      <g {...traco}>
        <rect x="27" y="58" width="46" height="9" rx="1.5" />
        <rect x="31" y="47" width="40" height="9" rx="1.5" />
        <rect x="25" y="36" width="44" height="9" rx="1.5" />
        <path d="M33 62h18M37 51h14M31 40h16" strokeWidth={1.1} />
      </g>
    );
  if (tipo === "bingo")
    return (
      <g {...traco}>
        <rect x="28" y="30" width="44" height="44" rx="2" />
        <path d="M28 44.7h44M28 59.3h44M42.7 30v44M57.3 30v44" strokeWidth={1.2} />
        <circle cx="35.3" cy="37.3" r="3.2" fill={cor} stroke="none" />
        <circle cx="50" cy="52" r="3.2" fill={cor} stroke="none" />
      </g>
    );
  if (tipo === "minutos")
    // carimbo postal redondo com relógio
    return (
      <g {...traco}>
        <circle cx="50" cy="52" r="20" />
        <circle cx="50" cy="52" r="15" strokeWidth={1} strokeDasharray="2 2.4" />
        <path d="M50 42v10l7 5" />
      </g>
    );
  // dias: calendário em gravura
  return (
    <g {...traco}>
      <rect x="28" y="34" width="44" height="38" rx="2" />
      <path d="M28 45h44M38 29v9M62 29v9" />
      <path d="M36 54h5M48 54h5M60 54h4M36 63h5M48 63h5" strokeWidth={1.4} />
    </g>
  );
}

export type EstadoSelo = "disponivel" | "andamento" | "concluido" | "encerrado";

/**
 * O selo de um desafio. Picote nas bordas, moldura dupla, gravura e uma
 * etiqueta curta embaixo. Concluído ganha o carimbo; encerrado fica neutro.
 */
export function Selo({
  tipo,
  numero,
  rotulo,
  cor,
  estado = "disponivel",
  tamanho = 96,
  data,
  girar = 0,
}: {
  tipo: TipoDesafio | "anual";
  numero?: number;
  /** etiqueta curta embaixo (ex.: "maratona") */
  rotulo?: string;
  cor?: string;
  estado?: EstadoSelo;
  tamanho?: number;
  /** data do carimbo de conclusão (ex.: "nov 2026") */
  data?: string;
  girar?: number;
}) {
  const tinta = estado === "encerrado" ? "#9A9089" : (cor ?? COR_DO_TIPO[tipo]);
  // picote: círculos "comendo" a borda do papel
  const furos: ReactNode[] = [];
  for (let i = 0; i <= 10; i++) {
    const p = 4 + i * 9.2;
    furos.push(<circle key={`t${i}`} cx={p} cy="0" r="2.6" />, <circle key={`b${i}`} cx={p} cy="120" r="2.6" />);
  }
  for (let i = 0; i <= 13; i++) {
    const p = 4 + i * 8.7;
    furos.push(<circle key={`l${i}`} cx="0" cy={p} r="2.6" />, <circle key={`r${i}`} cx="100" cy={p} r="2.6" />);
  }
  const id = `selo-${tipo}-${(cor ?? "").replace("#", "")}-${estado}`;
  return (
    <span
      className="relative inline-block flex-none"
      style={{ width: tamanho, height: tamanho * 1.2, transform: girar ? `rotate(${girar}deg)` : undefined }}
      role="img"
      aria-label={`selo${rotulo ? ` ${rotulo}` : ""}${estado === "concluido" ? ", concluído" : estado === "encerrado" ? ", encerrado" : ""}`}
    >
      <svg viewBox="0 0 100 120" width={tamanho} height={tamanho * 1.2} className="block drop-shadow-[0_3px_5px_rgba(43,20,32,.14)]">
        <defs>
          <mask id={id}>
            <rect width="100" height="120" fill="white" />
            <g fill="black">{furos}</g>
          </mask>
        </defs>
        <g mask={`url(#${id})`}>
          <rect width="100" height="120" fill="#FBF8F1" />
          {/* papel levemente tingido pela cor do selo */}
          <rect width="100" height="120" fill={tinta} opacity={estado === "encerrado" ? 0.05 : 0.1} />
        </g>
        <rect x="8" y="8" width="84" height="104" fill="none" stroke={tinta} strokeWidth="1.2" />
        <rect x="11" y="11" width="78" height="98" fill="none" stroke={tinta} strokeWidth="0.6" opacity="0.7" />
        <Gravura tipo={tipo} numero={numero} cor={tinta} />
        {rotulo ? (
          <text
            x="50"
            y="99"
            textAnchor="middle"
            fontFamily="var(--font-special-elite), 'Courier New', monospace"
            fontSize={rotulo.length > 16 ? 5.6 : 6.6}
            letterSpacing="0.8"
            fill={tinta}
          >
            {rotulo.toUpperCase().slice(0, 22)}
          </text>
        ) : null}
      </svg>
      {estado === "concluido" ? <CarimboConcluido tamanho={tamanho} data={data} /> : null}
    </span>
  );
}

/** o carimbo de tinta "concluído", torto, por cima do selo */
export function CarimboConcluido({ tamanho, data }: { tamanho: number; data?: string }) {
  const t = tamanho * 0.74;
  return (
    <svg
      viewBox="0 0 100 100"
      width={t}
      height={t}
      aria-hidden
      className="pointer-events-none absolute -right-[18%] -bottom-[6%] -rotate-[14deg] opacity-85 motion-safe:animate-[carimbo_.45s_ease-out_both]"
    >
      <defs>
        <path id="arco-carimbo" d="M18 50a32 32 0 1 1 64 0" />
      </defs>
      <circle cx="50" cy="50" r="44" fill="none" stroke="#692536" strokeWidth="2.4" />
      <circle cx="50" cy="50" r="37" fill="none" stroke="#692536" strokeWidth="1" />
      <text fontFamily="var(--font-special-elite), 'Courier New', monospace" fontSize="11" letterSpacing="2" fill="#692536">
        <textPath href="#arco-carimbo" startOffset="50%" textAnchor="middle">
          CONCLUÍDO
        </textPath>
      </text>
      <text x="50" y="62" textAnchor="middle" fontFamily="var(--font-special-elite), 'Courier New', monospace" fontSize="9.5" fill="#692536">
        {data ?? "✦"}
      </text>
    </svg>
  );
}
