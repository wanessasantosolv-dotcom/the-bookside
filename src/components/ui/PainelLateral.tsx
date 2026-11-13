import { PASSOS_PERFIL } from "@/lib/dados";

/**
 * Painel bordô à esquerda das telas de conta e de criar perfil no computador
 * (canvas "Web · entrar / criar perfil"): logo, passos e uma frase grande.
 * No celular não aparece.
 */
export function PainelLateral({ eyebrow, frase, passo }: { eyebrow: string; frase: string; passo?: number }) {
  return (
    <aside
      aria-hidden
      className="relative hidden w-[36%] max-w-[560px] flex-none flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,#6B2335,#4A1222_70%,#3A0E1A)] p-10 text-jornal lg:sticky lg:top-0 lg:flex lg:h-dvh"
    >
      <span className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(115deg,transparent,transparent_38px,rgba(255,255,255,.035)_38px,rgba(255,255,255,.035)_76px)]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-bordo.png" alt="" className="relative w-[96px]" style={{ filter: "brightness(0) invert(1)" }} />

      {passo ? (
        <div className="relative">
          <p className="text-[10px] font-semibold tracking-[.2em] text-[#D9A9B4] uppercase">
            passo {passo} de {PASSOS_PERFIL}
          </p>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: PASSOS_PERFIL }, (_, i) => (
              <i key={i} className={`h-0.5 w-6 rounded-full ${i < passo ? "bg-jornal" : "bg-jornal/25"}`} />
            ))}
          </div>
        </div>
      ) : (
        <span />
      )}

      <div className="relative">
        <p className="text-[10px] font-semibold tracking-[.2em] text-[#D9A9B4] uppercase">{eyebrow}</p>
        <p className="mt-4 max-w-[14em] font-revista text-[34px] leading-[1.2] italic">“{frase}”</p>
      </div>
    </aside>
  );
}

/** Classes para a <Tela> que fica à direita do painel no computador. */
export const telaAoLado = "lg:mx-0 lg:max-w-none lg:flex-1 lg:justify-center lg:py-12 lg:shadow-none";
