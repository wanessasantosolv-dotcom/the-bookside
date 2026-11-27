"use client";

import { MiniaturaTema } from "@/components/perfil/PreviaTema";
import { TemaSimbolo } from "@/components/TemaSimbolo";
import { TEMAS_APP, temaApp } from "@/lib/temas";

/**
 * Os oito temas numa grade compacta (4 colunas no computador, 2 no celular).
 * O mesmo seletor serve ao tema do app (configurações) e ao tema do perfil.
 */
export function SeletorDeTemas({ valor, onChange, escuro, rotulo }: { valor: string | null | undefined; onChange: (id: string) => void; escuro: boolean; rotulo: string }) {
  const atual = temaApp(valor);
  return (
    <div role="radiogroup" aria-label={rotulo} className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {TEMAS_APP.map((t) => {
        const v = escuro ? t.escuro : t.claro;
        const on = atual?.id === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${t.nome} — ${t.descricao}`}
            onClick={() => onChange(t.id)}
            className={`relative flex h-[112px] flex-col overflow-hidden rounded-[6px] border text-left transition-colors ${on ? "border-bordo ring-1 ring-bordo" : "border-linha hover:border-bege"}`}
            style={{ background: v.fundo, color: v.texto }}
          >
            <MiniaturaTema id={t.id} escuro={escuro} />
            <span className="flex flex-1 flex-col justify-between px-2.5 pt-2 pb-2">
              <span className="flex items-center gap-1.5">
                <span style={{ color: v.primaria }}>
                  <TemaSimbolo simbolo={t.simbolo} tamanho={14} />
                </span>
                <span className="truncate text-[12px] font-semibold">{t.nome}</span>
              </span>
              <span className="flex gap-1">
                {[v.primaria, v.secundaria, v.acento, v.acento2 ?? v.superficie].map((c, i) => (
                  <span key={i} className="size-3 rounded-full" style={{ background: c, boxShadow: `inset 0 0 0 1px ${v.borda}` }} />
                ))}
              </span>
            </span>
            {on ? (
              <span aria-hidden className="absolute top-1.5 right-1.5 flex size-[18px] items-center justify-center rounded-full" style={{ background: v.primaria, color: v.sobrePrimaria }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
