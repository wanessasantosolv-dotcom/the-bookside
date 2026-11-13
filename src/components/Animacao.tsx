"use client";

import type { CSSProperties } from "react";

/**
 * As animações de carregamento do canvas (45a–45h).
 * Cada uma tem o desenho, um título em itálico, os pontinhos e uma frase.
 */
export type TipoAnimacao = "livro" | "pilha" | "carimbo" | "marcador" | "fita" | "escrevendo" | "estrelas";

const atraso = (s: number): CSSProperties => ({ animationDelay: `${s}s` });

function Desenho({ tipo, frase }: { tipo: TipoAnimacao; frase?: string }) {
  switch (tipo) {
    case "livro":
      return (
        <div className="relative h-[172px] w-[250px] [perspective:1000px]">
          <div className="absolute inset-x-0 bottom-0 h-[162px] rounded-[5px] bg-[linear-gradient(145deg,#8E1D3D,#6B0D24_45%,#4B0D1B)] shadow-[0_14px_22px_-10px_rgba(43,20,32,.55)]" />
          <div className="absolute top-[9px] right-[11px] bottom-[11px] left-[11px] rounded-[2px] bg-[#FFFCF6] shadow-[inset_0_0_0_1px_#E6D5CE]" />
          <div className="absolute top-[9px] bottom-[11px] left-1/2 w-px bg-linha" />
          {[0, 0.7, 1.4].map((d) => (
            <div
              key={d}
              className="ld-pagina absolute top-[9px] left-1/2 h-[calc(100%-20px)] w-[calc(50%-11px)] rounded-r-[3px] border-l border-linha bg-[#FFFCF6] shadow-[-2px_0_6px_-3px_rgba(43,20,32,.3)]"
              style={atraso(d)}
            />
          ))}
        </div>
      );
    case "pilha":
      return (
        <div className="relative h-[200px] w-[150px]">
          {[
            "linear-gradient(150deg,#6B7A5E,#4F5B45)",
            "linear-gradient(150deg,#B75A6B,#8E1D3D)",
            "linear-gradient(150deg,#8E1D3D,#4B0D1B)",
          ].map((fundo, i) => (
            <div
              key={i}
              className="ld-capa absolute top-0 left-0 h-[189px] w-[126px] rounded-[2px_5px_5px_2px] shadow-[inset_6px_0_7px_-5px_rgba(43,20,32,.55),0_10px_18px_-8px_rgba(43,20,32,.5)]"
              style={{ background: fundo, ...atraso(i * 0.42) }}
            >
              <span className="absolute top-3 right-3 left-3 h-px bg-ouro/70" />
            </div>
          ))}
        </div>
      );
    case "carimbo":
      return (
        <div className="relative h-[286px] w-[252px] rounded-[4px] border border-linha bg-creme-quente px-[22px] pt-[22px] shadow-[0_14px_24px_-14px_rgba(43,20,32,.45)]">
          <p className="font-display text-2xl leading-none font-semibold italic text-bordo">sua ficha</p>
          {["100%", "80%", "92%", "60%", "85%", "42%"].map((w, i) => (
            <div
              key={i}
              className={`h-2 rounded-full bg-[#F0E6DC] ${i === 4 ? "mt-6" : "mt-3.5"}`}
              style={{ width: w }}
            />
          ))}
          <span className="ld-carimbo absolute top-[52%] left-1/2 -mt-[68px] -ml-[68px] flex size-[136px] flex-col items-center justify-center rounded-full border-[3px] border-double border-rosa-antigo bg-creme-quente/80 text-rosa-antigo">
            <b className="font-display text-[26px] leading-none font-bold italic">salvo</b>
            <i className="mt-1.5 text-[8px] font-semibold tracking-[.22em] uppercase not-italic">ficha no clube</i>
          </span>
        </div>
      );
    case "marcador":
      return (
        <div className="flex flex-col items-center">
          <div className="relative h-[270px] w-[210px] overflow-hidden rounded-[3px] border border-linha bg-creme-quente pt-[30px] shadow-[0_14px_24px_-14px_rgba(43,20,32,.45)]">
            {["auto", "70%", "auto", "85%", "60%", "auto", "75%"].map((w, i) => (
              <div
                key={i}
                className="mx-6 mb-[15px] h-[7px] rounded-full bg-[#F0E6DC]"
                style={w === "auto" ? undefined : { width: w }}
              />
            ))}
            <span className="ld-fita absolute -top-2 right-[30px] h-[156px] w-7 bg-[linear-gradient(#8E1D3D,#6B0D24)] shadow-[0_3px_6px_-2px_rgba(43,20,32,.4)]" />
          </div>
          <div className="mt-[26px] h-[7px] w-[210px] overflow-hidden rounded-full bg-[#F0E6DC]">
            <i className="ld-trilha block h-full rounded-full bg-[linear-gradient(90deg,#6B0D24,#B75A6B)]" />
          </div>
        </div>
      );
    case "fita":
      return (
        <div className="relative h-[208px] w-[248px] border border-linha bg-creme-quente p-[11px] shadow-[0_14px_24px_-14px_rgba(43,20,32,.45)]">
          <div className="pat-estrelas size-full" />
          <span className="ld-durex absolute top-[72px] -left-3.5 h-8 w-[276px] -rotate-[4deg] bg-[rgba(232,180,191,.88)] bg-[repeating-linear-gradient(45deg,rgba(255,255,255,.35)_0_5px,transparent_5px_11px)] shadow-[0_1px_3px_rgba(43,20,32,.14)]" />
        </div>
      );
    case "escrevendo":
      return (
        <div className="min-h-[168px] w-[264px] border border-linha bg-creme-quente bg-[repeating-linear-gradient(to_bottom,transparent_0_29px,#EFE4D8_29px_30px)] bg-[position:0_22px] px-6 py-[22px] shadow-[0_14px_24px_-14px_rgba(43,20,32,.45)]">
          <span className="ld-texto inline-block max-w-full overflow-hidden border-r-2 border-bordo font-accent text-[19px] leading-[30px] whitespace-nowrap italic text-bordo">
            {frase ?? "a gente vai chorar, eu já sei."}
          </span>
        </div>
      );
    case "estrelas":
      return (
        <div className="flex flex-col items-center">
          <div className="flex gap-3 text-[42px] leading-none">
            {[0, 0.3, 0.6, 0.9, 1.2].map((d) => (
              <span key={d} className="ld-estrela inline-block text-linha" style={atraso(d)}>
                ★
              </span>
            ))}
          </div>
          <p className="ld-media mt-6 font-display text-[46px] leading-none font-bold italic text-rosa-antigo">
            {frase ?? "✦"}
          </p>
        </div>
      );
  }
}

export function Animacao({
  tipo,
  titulo,
  sub,
  frase,
  pontos = tipo !== "carimbo" && tipo !== "marcador" && tipo !== "estrelas",
  tela = false,
}: {
  tipo: TipoAnimacao;
  titulo: string;
  sub?: string;
  /** texto dentro do desenho (o que está sendo escrito, a média…) */
  frase?: string;
  pontos?: boolean;
  /** ocupa a tela toda, por cima de tudo (ex.: enquanto salva) */
  tela?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative flex flex-col items-center justify-center px-10 text-center ${
        tela
          ? "fixed inset-0 z-50 bg-creme bg-[radial-gradient(rgba(107,13,36,.07)_1px,transparent_1.5px)] bg-[length:16px_16px]"
          : "min-h-[62dvh] py-12"
      }`}
    >
      {tela ? (
        <p className="absolute top-10 inset-x-0 text-[10px] font-semibold tracking-[.22em] text-ouro uppercase">
          the bookside ✦
        </p>
      ) : null}
      <span aria-hidden className="ld-brilho absolute top-[12%] left-[12%] text-sm text-ouro">
        ✦
      </span>
      <span
        aria-hidden
        className="ld-brilho absolute top-[20%] right-[13%] text-[11px] text-rosa-antigo"
        style={atraso(1.1)}
      >
        ✧
      </span>
      <span
        aria-hidden
        className="ld-brilho absolute bottom-[16%] left-[14%] text-[11px] text-ouro"
        style={atraso(2.1)}
      >
        ✧
      </span>
      <span
        aria-hidden
        className="ld-brilho absolute right-[11%] bottom-[22%] text-[13px] text-rosa-antigo"
        style={atraso(0.6)}
      >
        ✦
      </span>
      <div aria-hidden>
        <Desenho tipo={tipo} frase={frase} />
      </div>
      <p className="mt-9 font-display text-[28px] leading-[1.15] font-bold italic text-bordo">{titulo}</p>
      {pontos ? (
        <span aria-hidden className="ld-pontos mt-4 flex gap-[7px]">
          {[0, 0.18, 0.36].map((d) => (
            <i key={d} className="size-[7px] rounded-full bg-bordo" style={atraso(d)} />
          ))}
        </span>
      ) : null}
      {sub ? (
        <p className="mt-3.5 max-w-[250px] font-accent text-[15px] leading-[1.35] italic text-cinza">{sub}</p>
      ) : null}
    </div>
  );
}
