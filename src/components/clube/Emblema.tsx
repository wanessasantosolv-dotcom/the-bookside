import type { Emblema as TipoEmblema, Paleta, Simbolo } from "@/lib/identidade";

/**
 * O emblema do clube: forma + texto + símbolo, todo em SVG próprio (nada de
 * imagem gerada). As cores vêm da paleta do clube.
 */
const FORMAS: Record<TipoEmblema["formato"], (f: string, t: string) => React.ReactNode> = {
  circulo: (f, t) => (
    <>
      <circle cx="50" cy="50" r="48" fill={f} />
      <circle cx="50" cy="50" r="42" fill="none" stroke={t} strokeWidth="1.2" opacity=".55" />
    </>
  ),
  oval: (f, t) => (
    <>
      <ellipse cx="50" cy="50" rx="40" ry="48" fill={f} />
      <ellipse cx="50" cy="50" rx="34" ry="42" fill="none" stroke={t} strokeWidth="1.2" opacity=".55" />
    </>
  ),
  postal: (f, t) => (
    <>
      <rect x="4" y="4" width="92" height="92" fill={f} />
      {Array.from({ length: 9 }, (_, i) => (
        <g key={i} fill="var(--club-bg, #F9F5EE)">
          <circle cx={9 + i * 10.25} cy="4" r="3" />
          <circle cx={9 + i * 10.25} cy="96" r="3" />
          <circle cx="4" cy={9 + i * 10.25} r="3" />
          <circle cx="96" cy={9 + i * 10.25} r="3" />
        </g>
      ))}
      <rect x="12" y="12" width="76" height="76" fill="none" stroke={t} strokeWidth="1.2" opacity=".55" />
    </>
  ),
  escudo: (f, t) => (
    <>
      <path d="M50 2 92 14v34c0 26-18 42-42 50C26 90 8 74 8 48V14z" fill={f} />
      <path d="M50 10 85 20v28c0 21-14 35-35 42C29 83 15 69 15 48V20z" fill="none" stroke={t} strokeWidth="1.2" opacity=".55" />
    </>
  ),
  exlibris: (f, t) => (
    <>
      <rect x="6" y="2" width="88" height="96" rx="3" fill={f} />
      <rect x="12" y="8" width="76" height="84" rx="2" fill="none" stroke={t} strokeWidth="1" opacity=".6" />
      <rect x="15" y="11" width="70" height="78" rx="1" fill="none" stroke={t} strokeWidth=".6" opacity=".45" />
      <text x="50" y="22" textAnchor="middle" fill={t} style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 6.5, letterSpacing: 1.5 }}>
        EX LIBRIS
      </text>
    </>
  ),
  arco: (f, t) => (
    <>
      <path d="M8 98V44a42 42 0 0 1 84 0v54z" fill={f} />
      <path d="M15 92V45a35 35 0 0 1 70 0v47" fill="none" stroke={t} strokeWidth="1.2" opacity=".55" />
    </>
  ),
  organico: (f, t) => (
    <>
      <path d="M52 3c20 1 40 14 43 36 4 25-11 52-37 57C30 101 6 84 4 58 2 30 25 2 52 3z" fill={f} />
      <path d="M52 11c16 1 32 12 35 29 3 20-9 42-30 46-22 4-42-10-44-31-1-22 17-45 39-44z" fill="none" stroke={t} strokeWidth="1.1" opacity=".5" />
    </>
  ),
};

export function IconeSimbolo({ s, cor, x = 50, y = 50, tamanho = 22 }: { s: Simbolo; cor: string; x?: number; y?: number; tamanho?: number }) {
  if (s === "nenhum") return null;
  const k = tamanho / 24;
  const p = { stroke: cor, strokeWidth: 1.6, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <g transform={`translate(${x - tamanho / 2} ${y - tamanho / 2}) scale(${k})`}>
      {s === "livro-aberto" ? <path {...p} d="M12 6c-2-1.4-5-2-8-2v13c3 0 6 .6 8 2 2-1.4 5-2 8-2V4c-3 0-6 .6-8 2zm0 0v13" /> : null}
      {s === "livro" ? <path {...p} d="M6 3h11a1 1 0 0 1 1 1v16H7a2 2 0 0 1-2-2V5a2 2 0 0 1 1-2zM5 18a2 2 0 0 1 2-2h11" /> : null}
      {s === "lua" ? <path {...p} d="M19 14.5A8 8 0 1 1 9.5 5a6.5 6.5 0 0 0 9.5 9.5z" /> : null}
      {s === "sol" ? (
        <>
          <circle {...p} cx="12" cy="12" r="4" />
          <path {...p} d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
        </>
      ) : null}
      {s === "estrela" ? <path {...p} d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" /> : null}
      {s === "flor" ? (
        <>
          <circle {...p} cx="12" cy="9" r="2" />
          <path {...p} d="M12 7c0-3 3-4 3-1s-3 3-3 3 3-3 5-1-2 4-5 2c3 1 3 5 0 4s-1-4 0-4c-1 0-3 4-5 2s1-4 5-2c-3 0-6-1-4-3s4 1 4 2c0-1-3-4 0-4M12 11v10M12 17c2-2 4-2 5-1" />
        </>
      ) : null}
      {s === "chave" ? (
        <>
          <circle {...p} cx="7.5" cy="12" r="3.5" />
          <path {...p} d="M11 12h10M17 12v3M20 12v2" />
        </>
      ) : null}
      {s === "olho" ? (
        <>
          <path {...p} d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6S2 12 2 12z" />
          <circle {...p} cx="12" cy="12" r="2.6" />
        </>
      ) : null}
      {s === "aspas" ? <path {...p} strokeWidth={2.2} d="M5 18c0-6 2-10 6-12M13 18c0-6 2-10 6-12" /> : null}
      {s === "marcador" ? <path {...p} d="M7 3h10v18l-5-4-5 4z" /> : null}
    </g>
  );
}

export function Emblema({ e, paleta, tamanho = 64, className = "" }: { e: TipoEmblema; paleta: Paleta; tamanho?: number; className?: string }) {
  const f = paleta[e.fundo];
  const t = paleta[e.tinta];
  const comSimbolo = e.simbolo !== "nenhum";
  const texto = e.texto.trim();
  const yTexto = comSimbolo ? 66 : e.formato === "exlibris" ? 60 : 57;
  const tamTexto = texto.length > 3 ? 15 : texto.length === 3 ? 19 : 24;
  return (
    <svg viewBox="0 0 100 100" width={tamanho} height={tamanho} className={className} role="img" aria-label={`emblema ${texto}`}>
      {FORMAS[e.formato](f, t)}
      {comSimbolo ? <IconeSimbolo s={e.simbolo} cor={t} x={50} y={texto ? 38 : 50} tamanho={texto ? 22 : 34} /> : null}
      {texto ? (
        <text x="50" y={yTexto} textAnchor="middle" fill={t} style={{ fontFamily: "var(--club-heading-font, var(--font-fraunces))", fontSize: tamTexto, fontStyle: "var(--club-heading-style, italic)" as React.CSSProperties["fontStyle"], fontWeight: 600, letterSpacing: texto.length > 2 ? 1 : 0 }}>
          {texto}
        </text>
      ) : null}
      {e.ano ? (
        <text x="50" y={e.formato === "escudo" ? 80 : 82} textAnchor="middle" fill={t} opacity=".8" style={{ fontFamily: "var(--font-space-mono), monospace", fontSize: 7, letterSpacing: 1.5 }}>
          EST. {e.ano}
        </text>
      ) : null}
    </svg>
  );
}
