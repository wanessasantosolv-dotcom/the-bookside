"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArteCarta, VersoCarta } from "@/components/entrelinhas/Carta";
import { Recomendacoes } from "@/components/entrelinhas/Recomendacoes";
import { compartilharCarta, type FormatoPeca } from "@/components/entrelinhas/compartilhar";
import { CATALOGO, type CartaId } from "@/lib/entrelinhas";
import { marcarVisibilidade } from "@/lib/entrelinhas-store";
import { usePerfil } from "@/lib/perfil-store";

function useMovimentoReduzido() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setR(mq.matches);
  }, []);
  return r;
}

function useLargo() {
  const [l, setL] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(min-width: 1024px)");
    const ler = () => setL(mq.matches);
    ler();
    mq.addEventListener("change", ler);
    return () => mq.removeEventListener("change", ler);
  }, []);
  return l;
}

/** a carta virando: verso → frente, uma vez só (ou um esmaecer, com movimento reduzido) */
function CartaRevelada({ carta, largura, animar }: { carta: CartaId; largura: number; animar: boolean }) {
  const reduzido = useMovimentoReduzido();
  const [virada, setVirada] = useState(!animar);
  useEffect(() => {
    if (!animar) return;
    const t = setTimeout(() => setVirada(true), 350);
    return () => clearTimeout(t);
  }, [animar]);
  const c = CATALOGO[carta];
  const altura = Math.round((largura * c.arte.h) / c.arte.w);
  if (reduzido || !animar)
    return (
      <div className={animar ? "animate-[subir_.5s_ease-out_both]" : ""}>
        <ArteCarta carta={carta} largura={largura} prioridade />
      </div>
    );
  return (
    <div className="[perspective:1400px]" style={{ width: largura, height: altura }}>
      <div
        className="relative h-full w-full transition-transform duration-[1000ms] ease-[cubic-bezier(.3,.7,.2,1)] [transform-style:preserve-3d]"
        style={{ transform: virada ? "rotateY(180deg)" : "none" }}
      >
        <div className="absolute inset-0 grid place-items-center [backface-visibility:hidden]">
          <VersoCarta largura={Math.round((altura * 218) / 462)} />
        </div>
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <ArteCarta carta={carta} largura={largura} prioridade />
        </div>
      </div>
    </div>
  );
}

export function ResultadoCarta({ carta, afinidade, execucaoId, animar, refazer, consulta = false }: { carta: CartaId; afinidade: CartaId | null; execucaoId: string; animar: boolean; refazer: () => void; consulta?: boolean }) {
  const c = CATALOGO[carta];
  const largo = useLargo();
  const noPerfil = usePerfil((s) => s.cartaLiteraria);
  const atualizar = usePerfil((s) => s.atualizar);
  const [confirmar, setConfirmar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [formato, setFormato] = useState<FormatoPeca>("stories");
  const [gerando, setGerando] = useState(false);
  // o texto aparece depois da virada
  const atraso = animar ? "animate-[subir_.6s_ease-out_1.15s_both] motion-reduce:animate-[subir_.4s_ease-out_both]" : "";

  const jaGuardada = noPerfil?.carta === carta;
  function guardar() {
    if (noPerfil && noPerfil.carta !== carta && !confirmar) return setConfirmar(true);
    atualizar({ cartaLiteraria: { carta, em: new Date().toISOString() } });
    if (execucaoId) void marcarVisibilidade(execucaoId, true);
    setConfirmar(false);
    setAviso("Sua carta está no seu perfil.");
  }

  async function compartilhar() {
    setGerando(true);
    try {
      const r = await compartilharCarta(carta, formato);
      if (r === "baixado") setAviso("A imagem da carta foi baixada.");
    } catch {
      setAviso("Não foi possível gerar a imagem agora.");
    } finally {
      setGerando(false);
    }
  }

  return (
    <main className="min-h-dvh bg-creme text-ameixa">
      <header className="flex items-center justify-between px-4 pt-[max(8px,env(safe-area-inset-top))] lg:px-10 lg:pt-6">
        <Link href="/descobrir" className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo">
          Voltar ao The Bookside
        </Link>
        <span className="font-revista text-[15px] text-bordo italic">nas entrelinhas.</span>
      </header>

      <div className="mx-auto w-full max-w-[980px] px-5 pt-2 pb-16 lg:px-10 lg:pt-6">
        <div className="flex flex-col items-center lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-14">
          <div className="lg:sticky lg:top-8">
            <p className="mb-3 text-center text-[11px] font-semibold tracking-[.18em] text-cinza uppercase lg:text-left">{consulta ? "Carta literária" : "Sua carta literária"}</p>
            <CartaRevelada carta={carta} largura={largo ? 280 : 210} animar={animar} />
          </div>

          <section aria-live="polite" className={`mt-7 w-full max-w-[560px] text-center lg:mt-9 lg:text-left ${atraso}`}>
            <p className="text-[11px] font-semibold tracking-[.18em] text-bordo uppercase">Carta {c.numero}</p>
            <h1 className="mt-1 font-revista text-[32px] leading-tight text-ameixa lg:text-[40px]">{c.nome}</h1>
            <p className="mt-2 font-revista text-[18px] leading-snug text-bordo italic">{c.assinatura}</p>
            <div className="mt-5 space-y-3 text-left text-[15px] leading-relaxed text-tinta-suave">
              {c.descricao.map((t) => (
                <p key={t}>{t}</p>
              ))}
            </div>
            <div className="mt-6 border-t border-linha pt-4 text-left">
              <h2 className="text-[11px] font-semibold tracking-[.16em] text-cinza uppercase">Traços literários</h2>
              <p className="mt-2 text-[14px] text-ameixa">{c.tracos.join(" · ")}</p>
              {afinidade ? (
                <p className="mt-3 text-[12px] text-cinza">
                  Também há em você um pouco de <span className="font-semibold text-tinta-suave">{CATALOGO[afinidade].nome}</span>.
                </p>
              ) : null}
            </div>

            {/* ações */}
            {consulta ? (
              <div className="mt-7">
                <Link href="/nas-entrelinhas" className="inline-flex h-12 items-center rounded-[6px] bg-bordo px-5 text-[15px] font-semibold text-creme hover:bg-bordo-suave">
                  Descobrir minha carta
                </Link>
              </div>
            ) : (
            <div className="mt-7 flex flex-col gap-2 text-left">
              {confirmar ? (
                <div className="rounded-[8px] border border-linha bg-creme-quente p-4">
                  <p className="text-[14px] text-ameixa">
                    Seu perfil mostra <b className="font-semibold">{CATALOGO[noPerfil!.carta as CartaId]?.nome ?? "outra carta"}</b>. Substituir por {c.nome}?
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={guardar} className="h-10 rounded-[6px] bg-bordo px-4 text-[14px] font-semibold text-creme">
                      Substituir
                    </button>
                    <button type="button" onClick={() => setConfirmar(false)} className="h-10 rounded-[6px] border border-bege px-4 text-[14px] font-semibold text-ameixa">
                      Manter a atual
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={guardar}
                  disabled={jaGuardada}
                  className="h-12 rounded-[6px] bg-bordo text-[15px] font-semibold text-creme hover:bg-bordo-suave disabled:bg-transparent disabled:text-bordo disabled:ring-1 disabled:ring-bordo/40"
                >
                  {jaGuardada ? "Guardada no seu perfil" : "Guardar no meu perfil"}
                </button>
              )}
              <div className="flex gap-2">
                <label className="relative">
                  <span className="sr-only">Formato da imagem</span>
                  <select value={formato} onChange={(e) => setFormato(e.target.value as FormatoPeca)} className="h-12 appearance-none rounded-[6px] border border-bege bg-transparent pr-8 pl-3 text-[13px] text-ameixa">
                    <option value="stories">Stories</option>
                    <option value="quadrado">Quadrado</option>
                    <option value="vertical">Vertical</option>
                  </select>
                  <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-cinza">▾</span>
                </label>
                <button type="button" onClick={compartilhar} disabled={gerando} className="h-12 flex-1 rounded-[6px] border border-bege text-[14px] font-semibold text-ameixa hover:border-bordo disabled:opacity-50">
                  {gerando ? "Preparando a carta…" : "Compartilhar minha carta"}
                </button>
              </div>
              <button type="button" onClick={refazer} className="min-h-11 text-[13px] font-semibold text-tinta-suave hover:text-bordo">
                Refazer o teste
              </button>
              {aviso ? (
                <p role="status" className="text-center text-[13px] text-oliva">
                  {aviso}{" "}
                  {aviso.startsWith("Sua carta") ? (
                    <Link href="/perfil" className="font-semibold text-bordo underline-offset-4 hover:underline">
                      Ver perfil
                    </Link>
                  ) : null}
                </p>
              ) : null}
            </div>
            )}
          </section>
        </div>

        {consulta ? null : <Recomendacoes carta={carta} />}
      </div>
    </main>
  );
}
