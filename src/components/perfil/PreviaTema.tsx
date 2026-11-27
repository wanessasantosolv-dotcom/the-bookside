"use client";

import type { CSSProperties } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { OrnamentoTema } from "@/components/OrnamentoTema";
import { corDoLivro } from "@/lib/cores";
import { estiloDoPerfil } from "@/lib/tema";
import { bannerDoTema, corDaEstanteApp, estanteClareia, temaApp, TEMAS_APP, type Decoracao, type EstiloEstante } from "@/lib/temas";
import type { LivroSalvo, PadraoCapa } from "@/lib/perfil-store";

type Props = {
  tema: string;
  escuro: boolean;
  estiloEstante: EstiloEstante;
  decoracao: Decoracao | null;
  nome: string;
  usuario: string;
  frase: string;
  foto: string | null;
  capa: PadraoCapa;
  capaImagem: string | null;
  capaPosY: number;
  favoritos: LivroSalvo[];
  lendo: LivroSalvo | undefined;
};

/**
 * A prévia do perfil com o tema em edição: os mesmos tokens e classes do app,
 * com os dados reais da pessoa (sem livros inventados; sem dados, estados vazios).
 */
export function PreviaTema(p: Props) {
  const t = temaApp(p.tema);
  const nivel = p.decoracao ?? t?.decoracao ?? "editorial";
  const corEstante = corDaEstanteApp(p.estiloEstante, t, p.escuro);
  const estilo = {
    ...estiloDoPerfil(p.tema, p.escuro),
    ...(corEstante ? { "--app-estante": corEstante } : {}),
  } as CSSProperties;
  const pct = p.lendo?.paginas && p.lendo.paginaAtual ? Math.min(100, Math.round((p.lendo.paginaAtual / p.lendo.paginas) * 100)) : null;
  return (
    <div
      style={estilo}
      data-cantos={t?.reto ? "retos" : "normal"}
      data-previa-estante={p.estiloEstante === "minimalista" ? "minimalista" : estanteClareia(p.estiloEstante, t, p.escuro) ? "clara" : undefined}
      className="overflow-hidden rounded-[8px] border border-linha bg-creme text-ameixa shadow-[0_10px_30px_rgba(0,0,0,.12)]"
    >
      {/* navegação */}
      <div className="flex h-9 items-center justify-between border-b border-linha px-3">
        <span className="font-revista text-[13px] italic text-bordo">the bookside</span>
        <span className="flex gap-2.5 text-[9px] font-semibold text-cinza">
          <span className="text-bordo">início</span>
          <span>estantes</span>
          <span>perfil</span>
        </span>
      </div>
      {/* banner e avatar */}
      <div
        className={`relative h-[86px] bg-cover ${p.capaImagem ? "" : `pat-${p.capa}`}`}
        style={p.capaImagem ? { backgroundImage: `url("${p.capaImagem}")`, backgroundPosition: `center ${p.capaPosY}%` } : undefined}
      >
        <span className="absolute -bottom-7 left-3 size-[58px] overflow-hidden rounded-full border-[3px] border-creme bg-linha">
          {p.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.foto} alt="" className="size-full object-cover object-[50%_30%]" />
          ) : null}
        </span>
      </div>
      <div className="pt-1 pr-3 pl-[78px]">
        <p className="truncate font-revista text-[19px] leading-tight italic text-ameixa">{p.nome || "seu nome"}</p>
        <p className="truncate text-[10px] font-semibold text-bordo">@{p.usuario || "usuario"}</p>
      </div>
      <div className="space-y-3 px-3 pt-3 pb-4">
        {p.frase ? <p className="text-center font-accent text-[12px] italic text-bordo">“{p.frase}”</p> : null}
        {t ? <OrnamentoTema tema={t} nivel={nivel} /> : null}

        {/* favoritos na estante */}
        <div>
          <p className="mb-1.5 font-revista text-[13px] italic text-ameixa">livros favoritos</p>
          {p.favoritos.length ? (
            <>
              <div className="grid grid-cols-4 items-end gap-1.5 px-1">
                {p.favoritos.slice(0, 4).map((l) => (
                  <CapaLivro key={l.id} titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className="aspect-[2/3] w-full rounded-[2px] shadow-sm" />
                ))}
              </div>
              <span className="prateleira-madeira relative z-10 -mt-1 block h-[14px] bg-[url('/estantes/prateleira.svg')] bg-[length:100%_100%] bg-no-repeat" />
            </>
          ) : (
            <p className="rounded-[4px] border border-dashed border-linha px-3 py-3 text-center text-[11px] text-cinza">seus favoritos aparecem aqui</p>
          )}
        </div>

        {/* leitura atual */}
        <div className="flex gap-2.5 rounded-[6px] bg-papel p-2.5">
          {p.lendo ? (
            <CapaLivro titulo={p.lendo.titulo} capa={p.lendo.capa} cor={corDoLivro(p.lendo.id)} className="aspect-[2/3] w-9 flex-none rounded-[2px]" />
          ) : (
            <span className="aspect-[2/3] w-9 flex-none rounded-[2px] border border-dashed border-bege" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-semibold tracking-[.14em] text-cinza uppercase">lendo agora</p>
            <p className="truncate font-revista text-[13px] text-ameixa">{p.lendo?.titulo ?? "nenhuma leitura em andamento"}</p>
            <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-linha">
              <span className="block h-full rounded-full bg-bordo" style={{ width: `${pct ?? 0}%` }} />
            </span>
            <span className="mt-2 inline-flex h-6 items-center rounded-pill bg-bordo px-2.5 text-[10px] font-semibold text-creme">registrar leitura</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** a miniatura de um tema na grade de escolha (a atmosfera, não um moodboard) */
export function MiniaturaTema({ id, escuro }: { id: string; escuro: boolean }) {
  const t = temaApp(id) ?? TEMAS_APP[0];
  const v = escuro ? t.escuro : t.claro;
  return (
    <span aria-hidden className="relative block h-[46px] overflow-hidden" style={{ background: v.fundo }}>
      <span className="absolute inset-x-0 top-0 h-[22px]" style={{ background: bannerDoTema(t, v) }} />
      <span className="absolute top-[14px] left-2 size-4 rounded-full border-2" style={{ borderColor: v.fundo, background: v.superficie }} />
      <span className="absolute top-[27px] left-7 h-[3px] w-10 rounded-full" style={{ background: v.texto, opacity: 0.75 }} />
      <span className="absolute top-[34px] left-7 h-[3px] w-6 rounded-full" style={{ background: v.primaria }} />
      <span className="absolute right-2 bottom-2 h-[10px] w-7 rounded-[2px]" style={{ background: v.bloco }} />
    </span>
  );
}
