import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { LeituraJunta, PessoaNaLeitura, TipoReacao } from "@/lib/lerjunto";

/**
 * co-read. — o sistema gráfico da leitura compartilhada: lettering, marcadores
 * de página em dupla, envelopes, fitas, carimbos e as cores de cada leitora.
 * Tudo em SVG/CSS com a paleta ampliada da marca; nada é gerado por IA.
 */
export const COR = {
  vinho: "#692536",
  vinhoEscuro: "#501927",
  creme: "#F8F3E9",
  rosa: "#ECAABB",
  chartreuse: "#D5DD76",
  azul: "#8297D1",
  manteiga: "#F1DFA0",
  oliva: "#59634F",
} as const;

/** combinações de fundo de cada leitura (não usar todas de uma vez) */
export const ESTILOS = {
  rosa: { nome: "bordô e rosa", fundo: "#F7E1E6", destaque: COR.rosa, tinta: COR.vinho },
  verde: { nome: "chartreuse e bordô", fundo: "#EEF0CF", destaque: COR.chartreuse, tinta: COR.vinho },
  azul: { nome: "azul e creme", fundo: "#E3E8F5", destaque: COR.azul, tinta: "#2E3B66" },
  manteiga: { nome: "manteiga e vinho", fundo: "#F8EDC8", destaque: COR.manteiga, tinta: COR.vinhoEscuro },
  creme: { nome: "creme e oliva", fundo: "#F1ECDF", destaque: "#C9CDB8", tinta: COR.oliva },
} as const;
export type Estilo = keyof typeof ESTILOS;

const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export function estiloDe(l: Pick<LeituraJunta, "id" | "estilo">): Estilo {
  if (l.estilo && l.estilo in ESTILOS) return l.estilo as Estilo;
  const chaves = Object.keys(ESTILOS) as Estilo[];
  return chaves[hash(l.id) % chaves.length];
}

/** a cor de cada leitora fica a mesma em toda a leitura (pela ordem de entrada) */
export const CORES_LEITORAS = [COR.vinho, COR.azul, COR.oliva, "#C77A90", "#B8923A", "#4F6AA8", "#8A5A44", "#7C8740"];

export function ordemDasLeitoras(pessoas: PessoaNaLeitura[]) {
  return [...pessoas].sort(
    (a, b) => (a.entrou_em ?? "").localeCompare(b.entrou_em ?? "") || a.usuario_id.localeCompare(b.usuario_id),
  );
}
export function coresDasLeitoras(pessoas: PessoaNaLeitura[]) {
  const m = new Map<string, string>();
  ordemDasLeitoras(pessoas).forEach((p, i) => m.set(p.usuario_id, CORES_LEITORAS[i % CORES_LEITORAS.length]));
  return m;
}

/** co-read. — lettering da funcionalidade */
export function Wordmark({ tamanho = 56, assinatura = true, className = "" }: { tamanho?: number; assinatura?: boolean; className?: string }) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span
        className="font-revista font-semibold tracking-[-.035em] italic"
        style={{ fontSize: tamanho, color: COR.vinho, lineHeight: 0.9 }}
      >
        co-read<span style={{ color: COR.rosa }}>.</span>
      </span>
      {assinatura ? (
        <span
          className="mt-1.5 font-mono tracking-[.18em] uppercase"
          style={{ fontSize: Math.max(9, tamanho * 0.17), color: COR.vinho, opacity: 0.75 }}
        >
          by the bookside
        </span>
      ) : null}
    </span>
  );
}

/** o símbolo: dois marcadores de página complementares, ligados por uma linha pontilhada */
export function Marcadores({
  tamanho = 120,
  cores = [COR.vinho, COR.rosa],
  className = "",
  linha = true,
}: {
  tamanho?: number;
  cores?: [string, string];
  className?: string;
  linha?: boolean;
}) {
  return (
    <svg viewBox="0 0 120 120" width={tamanho} height={tamanho} aria-hidden className={className} fill="none">
      {linha ? (
        <path
          d="M10 96c18-26 40 6 58-14s30-44 46-36"
          stroke={COR.vinho}
          strokeWidth="1.3"
          strokeDasharray="2.5 4"
          strokeLinecap="round"
          opacity=".55"
        />
      ) : null}
      <g transform="rotate(-9 46 56)">
        <path d="M34 14h26v74l-13-11-13 11z" fill={cores[0]} />
        <path d="M38 22h18" stroke={COR.creme} strokeWidth="1.2" opacity=".7" />
      </g>
      <g transform="rotate(8 74 60)">
        <path d="M62 20h26v74l-13-11-13 11z" fill={cores[1]} />
        <path d="M66 28h18" stroke={COR.vinho} strokeWidth="1.2" opacity=".35" />
      </g>
      {/* o ponto onde os dois se encontram */}
      <circle cx="61" cy="52" r="3.2" fill={COR.creme} stroke={COR.vinho} strokeWidth="1.2" />
    </svg>
  );
}

/** o marcador de uma leitora (cor própria, igual em toda a experiência) */
export function MarcadorLeitora({ cor, tamanho = 14, className = "" }: { cor: string; tamanho?: number; className?: string }) {
  return (
    <svg viewBox="0 0 10 14" width={tamanho * 0.72} height={tamanho} aria-hidden className={`flex-none ${className}`}>
      <path d="M0 0h10v14L5 10.2 0 14z" fill={cor} />
    </svg>
  );
}

/** pedaço de fita adesiva */
export function Fita({ cor = COR.manteiga, className = "", style }: { cor?: string; className?: string; style?: CSSProperties }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute block h-[18px] w-[64px] opacity-80 ${className}`}
      style={{
        background: `repeating-linear-gradient(90deg, ${cor} 0 6px, color-mix(in srgb, ${cor} 82%, white) 6px 8px)`,
        clipPath: "polygon(3% 0, 97% 4%, 100% 50%, 96% 100%, 2% 96%, 0 48%)",
        ...style,
      }}
    />
  );
}

/** envelope em line art (estados vazios e convites) */
export function Envelope({ tamanho = 72, cor = COR.vinho, fundo = COR.creme, aberto = false, className = "" }: { tamanho?: number; cor?: string; fundo?: string; aberto?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 80 60" width={tamanho} height={tamanho * 0.75} aria-hidden className={className} fill="none">
      <rect x="4" y="12" width="72" height="44" rx="2" fill={fundo} stroke={cor} strokeWidth="1.4" />
      {aberto ? (
        <path d="M4 12 40 -6 76 12" stroke={cor} strokeWidth="1.4" fill={fundo} />
      ) : (
        <path d="m4 13 36 25 36-25" stroke={cor} strokeWidth="1.4" />
      )}
      <path d="m4 56 26-20M76 56 50 36" stroke={cor} strokeWidth="1.1" opacity=".55" />
      <circle cx="40" cy={aberto ? 30 : 38} r="5" fill={COR.rosa} stroke={cor} strokeWidth="1.1" />
    </svg>
  );
}

/** carimbo tipográfico redondo (ex.: we read it together!) */
export function Carimbo({ texto, sub, cor = COR.vinho, tamanho = 96, className = "" }: { texto: string; sub?: string; cor?: string; tamanho?: number; className?: string }) {
  const id = `arco-${hash(texto + (sub ?? ""))}`;
  return (
    <svg viewBox="0 0 100 100" width={tamanho} height={tamanho} aria-hidden className={className}>
      <defs>
        <path id={id} d="M50 50m-36 0a36 36 0 1 1 72 0a36 36 0 1 1 -72 0" />
      </defs>
      <circle cx="50" cy="50" r="46" fill="none" stroke={cor} strokeWidth="1.6" />
      <circle cx="50" cy="50" r="27" fill="none" stroke={cor} strokeWidth="1" strokeDasharray="2 3" />
      <text fill={cor} style={{ fontFamily: "var(--font-space-mono, monospace)", fontSize: 9, letterSpacing: 2.2 }}>
        <textPath href={`#${id}`}>{texto.toUpperCase()} · {texto.toUpperCase()} ·</textPath>
      </text>
      {sub ? (
        <text x="50" y="54" textAnchor="middle" fill={cor} style={{ fontFamily: "var(--font-fraunces, serif)", fontStyle: "italic", fontSize: 11 }}>
          {sub}
        </text>
      ) : null}
    </svg>
  );
}

/** etiqueta de identificação (ex.: "lendo junto agora") */
export function Etiqueta({ children, cor = COR.vinho, fundo = COR.creme, className = "" }: { children: ReactNode; cor?: string; fundo?: string; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[3px] border px-2 py-[3px] font-mono text-[10px] tracking-[.12em] uppercase ${className}`}
      style={{ color: cor, borderColor: cor, background: fundo }}
    >
      <span aria-hidden className="size-1.5 rounded-full border" style={{ borderColor: cor }} />
      {children}
    </span>
  );
}

/* ───────── reações: pequenos ícones próprios, sem emoji ───────── */
export const REACOES: { id: TipoReacao; nome: string; cor: string }[] = [
  { id: "amei", nome: "amei", cor: COR.vinho },
  { id: "nao-acredito", nome: "não acredito", cor: "#B8923A" },
  { id: "triste", nome: "fiquei triste", cor: COR.azul },
  { id: "conversar", nome: "preciso conversar sobre isso", cor: COR.oliva },
  { id: "reviravolta", nome: "que reviravolta", cor: "#C77A90" },
  { id: "favorito", nome: "meu momento favorito", cor: COR.vinhoEscuro },
  { id: "confusa", nome: "fiquei confusa", cor: "#4F6AA8" },
];
export const nomeDaReacao = (t: TipoReacao) => REACOES.find((r) => r.id === t)?.nome ?? t;

export function IconeReacao({ tipo, tamanho = 22, cor }: { tipo: TipoReacao; tamanho?: number; cor?: string }) {
  const c = cor ?? REACOES.find((r) => r.id === tipo)?.cor ?? COR.vinho;
  const p = { stroke: c, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <svg viewBox="0 0 24 24" width={tamanho} height={tamanho} aria-hidden className="flex-none">
      {tipo === "amei" ? <path {...p} d="M12 19.5s-7-4.3-7-9.4A3.9 3.9 0 0 1 12 8a3.9 3.9 0 0 1 7 2.1c0 5.1-7 9.4-7 9.4z" /> : null}
      {tipo === "nao-acredito" ? (
        <>
          <path {...p} d="M12 3l1.6 3.4 3.7-1-1 3.7L19.7 11l-3.4 1.6 1 3.7-3.7-1L12 18.7l-1.6-3.4-3.7 1 1-3.7L4.3 11l3.4-1.6-1-3.7 3.7 1z" />
          <path {...p} d="M12 8.5v3.5M12 14.4v.1" />
        </>
      ) : null}
      {tipo === "triste" ? (
        <>
          <path {...p} d="M12 4c3 4 5 6.6 5 9a5 5 0 0 1-10 0c0-2.4 2-5 5-9z" />
          <path {...p} d="M10 14.5a2.4 2.4 0 0 0 2 1.6" opacity=".6" />
        </>
      ) : null}
      {tipo === "conversar" ? (
        <>
          <path {...p} d="M4 6.5h11v7H9l-3 2.5v-2.5H4z" />
          <path {...p} d="M15 9.5h5v6.5h-1.6V18l-2.6-2H11" />
        </>
      ) : null}
      {tipo === "reviravolta" ? (
        <>
          <path {...p} d="M18 9a6.5 6.5 0 1 0 .5 5.3" />
          <path {...p} d="M18.6 4.8V9h-4.2" />
          <path {...p} d="M12 10.2a1.8 1.8 0 1 1-1.6 2.6" opacity=".7" />
        </>
      ) : null}
      {tipo === "favorito" ? (
        <>
          <path {...p} d="M7 3.5h10v17l-5-3.8-5 3.8z" />
          <path {...p} d="M12 7.5v5M9.8 8.8l4.4 2.4M14.2 8.8l-4.4 2.4" />
        </>
      ) : null}
      {tipo === "confusa" ? (
        <>
          <path {...p} d="M8.6 8.6a3.4 3.4 0 1 1 4.7 3.2c-.9.4-1.3 1-1.3 2v.7" />
          <path {...p} d="M12 18v.1" />
          <path {...p} d="M4 18c1.2-1 2.4 1 3.6 0" opacity=".5" />
        </>
      ) : null}
    </svg>
  );
}

/* ───────── comunidade: clubes · co-read ───────── */
export function SeletorComunidade({ ativo, className = "" }: { ativo: "clubes" | "coread"; className?: string }) {
  const item = (on: boolean) =>
    `inline-flex min-h-10 items-center border-b-2 px-1 text-[14px] font-semibold ${on ? "border-bordo text-bordo" : "border-transparent text-cinza hover:text-ameixa"}`;
  return (
    <nav aria-label="comunidade" className={`flex items-center gap-5 ${className}`}>
      <span className="font-mono text-[10px] tracking-[.16em] text-cinza uppercase">comunidade</span>
      <Link href="/clubes" aria-current={ativo === "clubes" ? "page" : undefined} className={item(ativo === "clubes")}>
        clubes
      </Link>
      <Link href="/co-read" aria-current={ativo === "coread" ? "page" : undefined} className={item(ativo === "coread")}>
        leitura compartilhada
      </Link>
    </nav>
  );
}
