"use client";

import { reacoes } from "@/lib/reacoes";
import type { Reacao } from "@/lib/perfil-store";

/**
 * A ficha de leitura do app — a MESMA em todo lugar (avaliar um livro da
 * estante e a ficha do clube): nota, os quatro critérios, personagem favorita,
 * um trecho que ficou, o que achei e, nos clubes, o aviso de spoiler.
 * Não é um <form>: cada tela põe o próprio botão de salvar.
 */
import type { ReactNode } from "react";
import { CapaAuto } from "@/components/CapaAuto";
import { campo, EstrelasInput, rotuloCampo } from "@/components/clube/Pecas";
import { criterios, media, type Criterio } from "@/lib/clubes";

export type ValoresFicha = {
  nota: number;
  notas: Partial<Record<Criterio, number>>;
  personagem: string;
  citacao: string;
  texto: string;
  spoiler: boolean;
};

export const fichaEmBranco = (v: Partial<ValoresFicha> = {}): ValoresFicha => ({
  nota: 0,
  notas: {},
  personagem: "",
  citacao: "",
  texto: "",
  spoiler: false,
  ...v,
});

/** sem nota geral, vale a média dos critérios (arredondada em meia estrela) */
export const notaDaFicha = (v: ValoresFicha) =>
  v.nota || Math.round((media(Object.values(v.notas)) ?? 0) * 2) / 2;

export function FichaLeitura({
  livro,
  detalhe,
  valores,
  onMudar,
  comSpoiler,
  children,
  reacao,
  onReacao,
}: {
  livro: {
    id: string;
    titulo: string;
    autor: string;
    paginas?: number;
    capa?: string;
  };
  /** linha extra embaixo da autoria (ex.: "lido em 12/03") */
  detalhe?: ReactNode;
  valores: ValoresFicha;
  onMudar: (v: ValoresFicha) => void;
  /** clubes: mostra "tem spoiler" */
  comSpoiler?: boolean;
  /** opções extras no fim da ficha (ex.: marcar como lido na estante) */
  children?: ReactNode;
  /** o veredito (só na ficha pessoal) */
  reacao?: Reacao;
  onReacao?: (r: Reacao | undefined) => void;
}) {
  const mudar = (parte: Partial<ValoresFicha>) =>
    onMudar({ ...valores, ...parte });
  const final = notaDaFicha(valores);
  return (
    <div className="rounded-xl border border-linha bg-creme-quente p-4 lg:rounded-[4px] lg:border-fio lg:bg-transparent lg:p-5">
      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <p className={rotuloCampo}>sua nota</p>
          <EstrelasInput
            valor={valores.nota || Math.round(final * 2) / 2}
            onMudar={(n) => mudar({ nota: n })}
            rotulo="sua nota"
          />
          <p className="mt-1 text-xs text-cinza">
            {livro.autor}
            {livro.paginas ? ` · ${livro.paginas} páginas` : ""}
          </p>
          {detalhe ? (
            <p className="mt-0.5 text-xs text-cinza">{detalhe}</p>
          ) : null}
        </div>
        <CapaAuto
          livro={livro}
          className="w-[70px] [&>span:last-child]:hidden"
        />
      </div>

      <ul className="mt-4 border-t border-linha">
        {criterios.map((c) => (
          <li
            key={c}
            className="flex items-center justify-between border-b border-linha py-1.5"
          >
            <span className="font-accent text-[15px] italic text-cinza">
              {c}
            </span>
            <EstrelasInput
              pequeno
              valor={valores.notas[c] ?? 0}
              onMudar={(n) =>
                mudar({ notas: { ...valores.notas, [c]: n || undefined } })
              }
              rotulo={`nota para ${c}`}
            />
          </li>
        ))}
      </ul>

      {onReacao ? (
        <fieldset className="mt-5">
          <legend className={rotuloCampo}>seu veredito</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {reacoes.map((r) => {
              const on = reacao === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onReacao(on ? undefined : r.id)}
                  className={`flex h-10 items-center gap-2 rounded-pill border px-3.5 text-[13px] font-semibold transition-transform active:scale-95 ${
                    on ? "text-creme" : "border-bege bg-creme text-ameixa"
                  }`}
                  style={
                    on ? { background: r.cor, borderColor: r.cor } : undefined
                  }
                >
                  <span aria-hidden style={on ? undefined : { color: r.cor }}>
                    {r.emoji}
                  </span>
                  {r.nome}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="mt-5 space-y-5">
        <label className="block">
          <span className={rotuloCampo}>personagem favorita ♡</span>
          <input
            value={valores.personagem}
            onChange={(e) => mudar({ personagem: e.target.value })}
            maxLength={80}
            placeholder="helena"
            className={campo}
          />
        </label>
        <label className="block">
          <span className={rotuloCampo}>um trecho que ficou</span>
          <textarea
            value={valores.citacao}
            onChange={(e) => mudar({ citacao: e.target.value })}
            maxLength={400}
            rows={2}
            placeholder="não é que a memória falhe. é que ela reescreve."
            className={`${campo} resize-none font-accent italic`}
          />
        </label>
        <label className="block">
          <span className={rotuloCampo}>o que eu achei</span>
          <textarea
            value={valores.texto}
            onChange={(e) => mudar({ texto: e.target.value })}
            maxLength={4000}
            rows={5}
            placeholder="conta tudo…"
            className={`${campo} resize-y`}
          />
        </label>
        {comSpoiler ? (
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={valores.spoiler}
              onChange={(e) => mudar({ spoiler: e.target.checked })}
              className="size-5 accent-bordo"
            />
            tem spoiler (esconde o texto até a pessoa tocar)
          </label>
        ) : null}
        {children}
      </div>
    </div>
  );
}
