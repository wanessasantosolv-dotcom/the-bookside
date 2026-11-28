"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { FolhaCaderno, Mini, PH, PW, type ContextoFolha } from "@/components/caderno/Folhas";
import {
  CAPAS,
  MESES,
  PAPEIS,
  PAPEL_PADRAO,
  SECOES,
  anosDoCaderno,
  inicioDasSecoes,
  leiturasDoAno,
  leiturasDoMes,
  montarFolhas,
  notasDoAno,
  type CapaCaderno,
  type Folha,
  type Papel,
  type PreferenciasCaderno,
  type Secao,
} from "@/lib/caderno";
import { usePerfil } from "@/lib/perfil-store";

/*
 * O caderno de leitura como objeto: fechado (capa de tecido, etiqueta, fita),
 * aberto em página dupla no computador ou uma folha no celular, com folhas que
 * viram de verdade, abas laterais, ampliar, personalizar e imprimir/salvar PDF.
 */

const MOVIMENTO_REDUZIDO = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** largura útil (do conteúdo, sem o menu lateral) e altura da janela */
function useTamanho(chave: unknown) {
  const [t, setT] = useState({ w: 1200, h: 800 });
  useEffect(() => {
    const alvo = document.getElementById("caderno-raiz");
    const f = () => setT({ w: alvo?.clientWidth || window.innerWidth, h: window.innerHeight });
    f();
    const ro = alvo ? new ResizeObserver(f) : null;
    ro?.observe(alvo!);
    window.addEventListener("resize", f);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", f);
    };
  }, [chave]);
  return t;
}

function padraoDaCapa(c: CapaCaderno): CSSProperties {
  const tecido = "repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,.035) 0 1px, transparent 1px 3px)";
  const extra =
    c.padrao === "xadrez"
      ? ", linear-gradient(90deg, rgba(255,255,255,.28) 50%, transparent 50%), linear-gradient(rgba(255,255,255,.28) 50%, transparent 50%)"
      : c.padrao === "listras"
        ? ", repeating-linear-gradient(90deg, rgba(255,255,255,.22) 0 9px, transparent 9px 22px)"
        : c.padrao === "estrelas"
          ? ", radial-gradient(rgba(246,240,229,.55) 1.2px, transparent 1.6px), radial-gradient(rgba(236,170,187,.45) 1px, transparent 1.4px)"
          : "";
  const tam = c.padrao === "xadrez" ? ", 22px 22px, 22px 22px" : c.padrao === "estrelas" ? ", 38px 38px, 26px 26px" : c.padrao === "listras" ? ", auto" : "";
  return { backgroundColor: c.fundo, backgroundImage: tecido + extra, backgroundSize: `auto, auto${tam}`, backgroundPosition: c.padrao === "estrelas" ? "0 0, 0 0, 0 0, 13px 19px" : undefined };
}

export function Caderno() {
  const livros = usePerfil((s) => s.livros);
  const nomePessoa = usePerfil((s) => s.nome || s.usuario || "");
  const prefsBrutas = usePerfil((s) => s.caderno);
  const atualizar = usePerfil((s) => s.atualizar);
  const prefs: PreferenciasCaderno = useMemo(() => prefsBrutas ?? {}, [prefsBrutas]);
  const salvar = useCallback((p: Partial<PreferenciasCaderno>) => atualizar({ caderno: { ...(usePerfil.getState().caderno ?? {}), ...p } }), [atualizar]);

  const anos = useMemo(() => anosDoCaderno(livros), [livros]);
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const leituras = useMemo(() => leiturasDoAno(livros, ano), [livros, ano]);
  const notas = useMemo(() => notasDoAno(livros, leituras), [livros, leituras]);
  const proximas = useMemo(() => {
    const porId = new Map(livros.map((l) => [l.id, l]));
    return (prefs.prioridades ?? []).map((id) => porId.get(id)).filter((l): l is NonNullable<typeof l> => !!l);
  }, [livros, prefs.prioridades]);
  const folhas = useMemo(() => montarFolhas({ leituras, notas, proximas }), [leituras, notas, proximas]);
  const inicio = useMemo(() => inicioDasSecoes(folhas), [folhas]);
  const capa = CAPAS.find((c) => c.id === prefs.capa) ?? CAPAS[0];
  const nomeCaderno = prefs.nome?.trim() || "Caderno de leitura";
  const papelDe = (s: Secao): Papel => prefs.papeis?.[s] ?? PAPEL_PADRAO[s];

  const [aberto, setAberto] = useState(false);
  const { w: vw, h: vh } = useTamanho(aberto);
  const duplo = vw >= 900;
  const [abrindo, setAbrindo] = useState(false);
  // página atual (0-based). No duplo, sempre par (esquerda).
  const [pag, setPag] = useState(0);
  const [virando, setVirando] = useState<null | { dir: 1 | -1; para: number }>(null);
  const [ampliar, setAmpliar] = useState(false);
  const [painel, setPainel] = useState<null | "personalizar" | "prioridades" | { mes: number }>(null);
  const [imprimir, setImprimir] = useState(false);

  // escala para caber: duas folhas lado a lado (ou uma), com folga para abas e controles
  const escala = Math.min(duplo ? (vw - 190) / (PW * 2 + 24) : (vw - 24) / (PW + 12), (vh - (duplo ? 150 : 200)) / (PH + 16), duplo ? 1.35 : 1.2);
  const passo = duplo ? 2 : 1;
  const base = duplo ? pag - (pag % 2) : pag;
  const total = folhas.length;

  const ir = useCallback(
    (alvo: number) => {
      const destino = Math.max(0, Math.min(total - 1, duplo ? alvo - (alvo % 2) : alvo));
      if (destino === base || virando) return;
      const dir = destino > base ? 1 : -1;
      if (MOVIMENTO_REDUZIDO() || Math.abs(destino - base) > passo * 3) {
        setPag(destino);
        return;
      }
      setVirando({ dir, para: destino });
    },
    [base, duplo, passo, total, virando],
  );
  const irPara = useCallback((paginaHumana: number) => ir(paginaHumana - 1), [ir]);

  useEffect(() => {
    if (!aberto) return;
    const tecla = (e: KeyboardEvent) => {
      if (painel || ampliar) return;
      if (e.key === "ArrowRight") ir(base + passo);
      if (e.key === "ArrowLeft") ir(base - passo);
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aberto, base, passo, ir, painel, ampliar]);

  // ano novo: volta para o começo
  useEffect(() => setPag(0), [ano]);

  const toque = useRef<number | null>(null);

  function abrir() {
    if (MOVIMENTO_REDUZIDO()) return setAberto(true);
    setAbrindo(true);
    setTimeout(() => {
      setAberto(true);
      setAbrindo(false);
    }, 700);
  }

  const ctx: ContextoFolha = {
    ano,
    nomeCaderno,
    nomePessoa,
    leituras,
    favoritos: prefs.favoritos ?? {},
    inicio,
    irPara,
    editar: { favorito: (mes) => setPainel({ mes }), prioridades: () => setPainel("prioridades") },
  };
  const folha = (i: number) =>
    i >= 0 && i < total ? <FolhaCaderno f={folhas[i]} n={i + 1} papel={papelDe(folhas[i].secao)} ctx={ctx} /> : <div style={{ width: PW, height: PH, background: "#F3ECE0" }} />;

  const secaoAtual = folhas[base]?.secao;

  /* ───────── fechado ───────── */
  if (!aberto) {
    const cw = Math.min(360, vw - 80, (vh - 220) * 0.7);
    return (
      <div id="caderno-raiz" className="flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center px-4 py-8">
        <div className="caderno-palco" style={{ perspective: 1800 }}>
          <button
            type="button"
            onClick={abrir}
            aria-label={`Abrir ${nomeCaderno} de ${ano}`}
            className={`caderno-capa relative block text-left ${abrindo ? "caderno-abrindo" : ""}`}
            style={{ width: cw, height: cw * 1.42, borderRadius: "4px 10px 10px 4px", ...padraoDaCapa(capa), boxShadow: "0 1px 0 rgba(255,255,255,.15) inset, 6px 0 0 -2px #EFE6D6, 7px 1px 0 -2px #E4D8C4, 0 22px 40px -22px rgba(43,20,32,.6)" }}
          >
            {/* lombada fina */}
            <span aria-hidden className="absolute inset-y-0 left-0 w-[14px] rounded-l-[4px]" style={{ background: "linear-gradient(90deg, rgba(0,0,0,.22), rgba(0,0,0,.04) 70%, rgba(255,255,255,.08))" }} />
            {/* etiqueta */}
            <span className="absolute top-[22%] left-1/2 w-[68%] -translate-x-1/2 rounded-[3px] px-4 py-5 text-center" style={{ background: "#F6F0E5", boxShadow: "0 1px 2px rgba(0,0,0,.18)", border: "1px solid rgba(105,37,54,.25)", outline: "1px solid rgba(105,37,54,.25)", outlineOffset: -5 }}>
              <span className="block text-[10px] tracking-[.16em] uppercase" style={{ fontFamily: "var(--font-special-elite)", color: "#59634F" }}>
                Caderno de leitura
              </span>
              <span className="mt-2 block font-revista text-[24px] leading-tight text-[#692536] italic">{nomeCaderno}</span>
              <span className="mt-1 block font-revista text-[30px] leading-none text-[#38252C]">{ano}</span>
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={capa.tinta.toLowerCase() === "#f6f0e5" || capa.tinta.toLowerCase() === "#f1dfa0" ? "/brand/wordmark-creme.png" : "/brand/wordmark-bordo.png"} alt="the bookside" className="absolute bottom-[7%] left-1/2 h-[14px] w-auto -translate-x-1/2 opacity-90" />
            {prefs.fita !== false ? <span aria-hidden className="absolute -bottom-7 left-[72%] h-12 w-[10px]" style={{ background: "#ECAABB", clipPath: "polygon(0 0,100% 0,100% 100%,50% 80%,0 100%)" }} /> : null}
          </button>
        </div>
        <p className="mt-10 text-[13px] text-tinta-suave">Toque na capa para abrir</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[13px]">
          <label className="flex items-center gap-2 text-tinta-suave">
            Ano
            <select value={ano} onChange={(e) => setAno(e.target.value)} className="h-10 rounded-[6px] border border-linha bg-transparent px-2 text-ameixa">
              {anos.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => setPainel("personalizar")} className="h-10 rounded-[6px] border border-linha px-3 font-semibold text-ameixa hover:border-bordo">
            Personalizar caderno
          </button>
        </div>
        {painel === "personalizar" ? <Personalizar prefs={prefs} salvar={salvar} fechar={() => setPainel(null)} /> : null}
      </div>
    );
  }

  /* ───────── aberto ───────── */
  const W = PW * escala;
  const H = PH * escala;
  const esquerda = virando?.dir === -1 ? virando.para : base;
  const direita = virando?.dir === 1 ? virando.para + 1 : base + 1;

  return (
    <div id="caderno-raiz" className="caderno-aberto flex min-h-[calc(100dvh-80px)] flex-col items-center px-2 pt-3 pb-24 lg:pb-6">
      {/* barra discreta */}
      <div className="flex w-full max-w-[1200px] flex-nowrap items-center justify-between gap-x-2 gap-y-1 px-1 text-[13px]">
        <button type="button" onClick={() => setAberto(false)} className="flex min-h-10 items-center px-2 font-semibold whitespace-nowrap text-bordo">
          {duplo ? "Fechar caderno" : "Fechar"}
        </button>
        <div className="flex items-center justify-end gap-0.5 sm:gap-1">
          {/* no celular, o ano troca na capa (um toque em Fechar) para a barra caber numa linha */}
          <select aria-label="Ano" value={ano} onChange={(e) => setAno(e.target.value)} className={`h-9 rounded-[6px] border border-linha bg-transparent px-2 text-ameixa ${duplo ? "" : "hidden"}`}>
            {anos.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          {!duplo ? (
            <select aria-label="Ir para a seção" value="" onChange={(e) => e.target.value && irPara(Number(e.target.value))} className="h-9 max-w-[112px] rounded-[6px] border border-linha bg-transparent px-1.5 text-[12px] text-ameixa">
              <option value="">Seções</option>
              {SECOES.map((s) => (
                <option key={s.id} value={inicio[s.id]}>
                  {s.nome}
                </option>
              ))}
            </select>
          ) : null}
          <button type="button" onClick={() => setAmpliar(true)} className="h-9 rounded-[6px] px-1.5 text-ameixa hover:bg-rosa-fundo sm:px-2.5">
            Ampliar
          </button>
          <button type="button" onClick={() => setPainel("personalizar")} className="h-9 rounded-[6px] px-1.5 text-ameixa hover:bg-rosa-fundo sm:px-2.5">
            Personalizar
          </button>
          <button type="button" onClick={() => (setImprimir(true), setTimeout(() => window.print(), 300))} className="hidden h-9 rounded-[6px] px-2.5 text-ameixa hover:bg-rosa-fundo sm:block">
            Imprimir ou salvar PDF
          </button>
        </div>
      </div>

      {/* o caderno */}
      <div className="relative mt-3 flex flex-1 items-center justify-center" onTouchStart={(e) => (toque.current = e.touches[0].clientX)} onTouchEnd={(e) => {
        if (toque.current === null) return;
        const dx = e.changedTouches[0].clientX - toque.current;
        if (Math.abs(dx) > 50) ir(base + (dx < 0 ? passo : -passo));
        toque.current = null;
      }}>
        <div className="relative" style={{ width: duplo ? W * 2 + 16 * escala : W + 10 * escala, height: H + 12 * escala, perspective: 2400, marginRight: duplo ? 136 : 0 }}>
          {/* encadernação: capa por trás, bordas das folhas */}
          <div aria-hidden className="absolute inset-0 rounded-[10px]" style={{ ...padraoDaCapa(capa), boxShadow: "0 24px 50px -28px rgba(43,20,32,.65)" }} />
          <div className="absolute" style={{ left: 6 * escala, top: 6 * escala, width: duplo ? W * 2 + 4 * escala : W - 2 * escala, height: H, display: "flex", perspective: 2600 }}>
            {duplo ? (
              <>
                <Pagina w={W} h={H} escala={escala} lado="esquerda">{folha(esquerda)}</Pagina>
                <Pagina w={W} h={H} escala={escala} lado="direita">{folha(direita)}</Pagina>
                {/* sombra da dobra central */}
                <span aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-[46px] -translate-x-1/2" style={{ background: "linear-gradient(90deg, transparent, rgba(56,37,44,.12) 45%, rgba(56,37,44,.2) 50%, rgba(56,37,44,.12) 55%, transparent)" }} />
                {virando ? (
                  <div
                    className={virando.dir === 1 ? "folha-vira-frente" : "folha-vira-tras"}
                    onAnimationEnd={() => {
                      setPag(virando.para);
                      setVirando(null);
                    }}
                    style={{ position: "absolute", top: 0, left: virando.dir === 1 ? W : 0, width: W, height: H, transformStyle: "preserve-3d", transformOrigin: virando.dir === 1 ? "left center" : "right center" }}
                  >
                    <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden" }}>
                      <Pagina w={W} h={H} escala={escala} lado={virando.dir === 1 ? "direita" : "esquerda"}>{folha(virando.dir === 1 ? base + 1 : base)}</Pagina>
                    </div>
                    <div style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                      <Pagina w={W} h={H} escala={escala} lado={virando.dir === 1 ? "esquerda" : "direita"}>{folha(virando.dir === 1 ? virando.para : virando.para + 1)}</Pagina>
                    </div>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <Pagina w={W} h={H} escala={escala} lado="direita">{folha(virando ? (virando.dir === 1 ? virando.para : base) : base)}</Pagina>
                {virando ? (
                  <div
                    className={virando.dir === 1 ? "folha-vira-frente" : "folha-volta"}
                    onAnimationEnd={() => {
                      setPag(virando.para);
                      setVirando(null);
                    }}
                    style={{ position: "absolute", inset: 0, transformOrigin: "left center", backfaceVisibility: "hidden" }}
                  >
                    <Pagina w={W} h={H} escala={escala} lado="direita">{folha(virando.dir === 1 ? base : virando.para)}</Pagina>
                  </div>
                ) : null}
              </>
            )}
          </div>

          {/* abas laterais */}
          <nav aria-label="Seções do caderno" className={`absolute top-[8%] flex-col gap-1 ${duplo ? "flex" : "hidden"}`} style={{ left: "100%" }}>
            {SECOES.map((s, i) => {
              const ativa = secaoAtual === s.id || folhas[base + 1]?.secao === s.id;
              const cores = ["#ECAABB", "#DCE3F0", "#F1DFA0", "#D5DD76", "#F5D9E0", "#C9D3EC"];
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => irPara(inicio[s.id])}
                  aria-current={ativa ? "true" : undefined}
                  title={s.nome}
                  className="flex items-center rounded-r-[6px] text-left text-[11px] text-ameixa transition-all"
                  style={{ background: cores[i], width: duplo ? (ativa ? 132 : 116) : 22, height: duplo ? 30 : 34, paddingLeft: duplo ? 10 : 0, boxShadow: "1px 1px 0 rgba(56,37,44,.08)", fontWeight: ativa ? 600 : 400 }}
                >
                  {duplo ? s.nome : <span className="sr-only">{s.nome}</span>}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* paginação */}
      <div className="mt-3 flex items-center gap-4 text-[13px] text-tinta-suave">
        <button type="button" onClick={() => ir(base - passo)} disabled={base === 0} aria-label="Folha anterior" className="grid size-11 place-items-center rounded-full border border-linha text-ameixa disabled:opacity-35">
          ←
        </button>
        <span aria-live="polite" className="min-w-[110px] text-center tabular-nums">
          {duplo ? `${base + 1}–${Math.min(total, base + 2)}` : base + 1} de {total}
        </span>
        <button type="button" onClick={() => ir(base + passo)} disabled={base + passo >= total} aria-label="Próxima folha" className="grid size-11 place-items-center rounded-full border border-linha text-ameixa disabled:opacity-35">
          →
        </button>
      </div>

      {ampliar ? (
        <div role="dialog" aria-modal="true" aria-label="Folha ampliada" className="fixed inset-0 z-[80] overflow-auto bg-[#38252C]/80 p-4" onClick={(e) => e.target === e.currentTarget && setAmpliar(false)}>
          <button type="button" onClick={() => setAmpliar(false)} className="fixed top-3 right-3 z-10 h-10 rounded-[6px] bg-creme px-3 text-[13px] font-semibold text-bordo">
            Fechar
          </button>
          <div className="mx-auto flex w-fit flex-col gap-4 py-10 lg:flex-row">
            {[base, ...(duplo ? [base + 1] : [])].filter((i) => i < total).map((i) => {
              const z = Math.min((vw - 40) / PW, duplo ? 1.9 : 2.2);
              return (
                <div key={i} style={{ width: PW * z, height: PH * z, boxShadow: "0 20px 40px -20px rgba(0,0,0,.6)" }}>
                  <div style={{ transform: `scale(${z})`, transformOrigin: "top left" }}>{folha(i)}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {painel === "personalizar" ? <Personalizar prefs={prefs} salvar={salvar} fechar={() => setPainel(null)} /> : null}
      {painel === "prioridades" ? <Prioridades prefs={prefs} salvar={salvar} fechar={() => setPainel(null)} /> : null}
      {painel && typeof painel === "object" ? (
        <EscolherFavorito
          mes={painel.mes}
          ano={ano}
          opcoes={leiturasDoMes(leituras, painel.mes).map((l) => l.livro)}
          atual={prefs.favoritos?.[`${ano}-${String(painel.mes + 1).padStart(2, "0")}`]}
          salvar={(id) => {
            const k = `${ano}-${String(painel.mes + 1).padStart(2, "0")}`;
            const f = { ...(prefs.favoritos ?? {}) };
            if (id) f[k] = id;
            else delete f[k];
            salvar({ favoritos: f });
            setPainel(null);
          }}
          fechar={() => setPainel(null)}
        />
      ) : null}

      {/* impressão: todas as folhas em A5, uma por página */}
      {imprimir ? (
        <div className="caderno-impressao" aria-hidden>
          {folhas.map((f: Folha, i) => (
            <div key={i} className="caderno-impressao-folha">
              <FolhaCaderno f={f} n={i + 1} papel={papelDe(f.secao)} ctx={{ ...ctx, editar: undefined }} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Pagina({ w, h, escala, lado, children }: { w: number; h: number; escala: number; lado: "esquerda" | "direita"; children: React.ReactNode }) {
  return (
    <div className="relative flex-none overflow-hidden" style={{ width: w, height: h, borderRadius: lado === "esquerda" ? "6px 0 0 6px" : "0 6px 6px 0", boxShadow: lado === "esquerda" ? "-1px 0 0 #E8DCCB, -2px 1px 0 #DCCDB8" : "1px 0 0 #E8DCCB, 2px 1px 0 #DCCDB8" }}>
      <div style={{ width: PW, height: PH, transform: `scale(${escala})`, transformOrigin: "top left" }}>{children}</div>
    </div>
  );
}

/* ───────── painéis ───────── */

function Gaveta({ titulo, fechar, children }: { titulo: string; fechar: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const t = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", t);
    return () => window.removeEventListener("keydown", t);
  }, [fechar]);
  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-[#38252C]/40" onClick={(e) => e.target === e.currentTarget && fechar()}>
      <div role="dialog" aria-modal="true" aria-label={titulo} className="flex h-full w-full max-w-[380px] flex-col bg-creme shadow-[-20px_0_40px_-30px_rgba(0,0,0,.5)]">
        <div className="flex items-center justify-between border-b border-linha px-5 py-4">
          <h2 className="font-revista text-[20px] text-ameixa">{titulo}</h2>
          <button type="button" onClick={fechar} className="h-10 px-2 text-[13px] font-semibold text-bordo">
            Fechar
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function Personalizar({ prefs, salvar, fechar }: { prefs: PreferenciasCaderno; salvar: (p: Partial<PreferenciasCaderno>) => void; fechar: () => void }) {
  const [nome, setNome] = useState(prefs.nome ?? "");
  return (
    <Gaveta titulo="Personalizar caderno" fechar={fechar}>
      <label className="block">
        <span className="mb-1.5 block text-[13px] font-semibold text-ameixa">Nome do caderno</span>
        <input value={nome} maxLength={40} onChange={(e) => setNome(e.target.value)} onBlur={() => salvar({ nome: nome.trim() || undefined })} placeholder="Caderno de leitura" className="h-11 w-full rounded-[6px] border border-linha bg-creme-quente px-3 text-[15px] text-ameixa outline-none focus:border-bordo" />
      </label>
      <p className="mt-6 mb-2 text-[13px] font-semibold text-ameixa">Capa</p>
      <div className="grid grid-cols-4 gap-2.5">
        {CAPAS.map((c) => (
          <button key={c.id} type="button" aria-pressed={(prefs.capa ?? "bordo") === c.id} onClick={() => salvar({ capa: c.id })} className="flex flex-col items-center gap-1 text-[11px] text-tinta-suave">
            <span className={`block h-[62px] w-[44px] rounded-[2px_5px_5px_2px] ${(prefs.capa ?? "bordo") === c.id ? "ring-2 ring-bordo ring-offset-2 ring-offset-creme" : ""}`} style={padraoDaCapa(c)} />
            <span className="leading-tight">{c.nome}</span>
          </button>
        ))}
      </div>
      <label className="mt-5 flex items-center gap-2.5 text-[13px] text-ameixa">
        <input type="checkbox" checked={prefs.fita !== false} onChange={(e) => salvar({ fita: e.target.checked })} className="size-4 accent-[var(--color-bordo)]" />
        Marcador de fita
      </label>
      <p className="mt-6 mb-2 text-[13px] font-semibold text-ameixa">Papel de cada seção</p>
      <div className="space-y-2">
        {SECOES.map((s) => (
          <label key={s.id} className="flex items-center justify-between gap-3 text-[13px] text-tinta-suave">
            {s.nome}
            <select value={prefs.papeis?.[s.id] ?? PAPEL_PADRAO[s.id]} onChange={(e) => salvar({ papeis: { ...(prefs.papeis ?? {}), [s.id]: e.target.value as Papel } })} className="h-10 w-40 rounded-[6px] border border-linha bg-transparent px-2 text-ameixa">
              {PAPEIS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p className="mt-6 text-[12px] text-cinza">O caderno é privado. As escolhas ficam salvas na sua conta e aparecem em todos os seus aparelhos.</p>
    </Gaveta>
  );
}

function Prioridades({ prefs, salvar, fechar }: { prefs: PreferenciasCaderno; salvar: (p: Partial<PreferenciasCaderno>) => void; fechar: () => void }) {
  const livros = usePerfil((s) => s.livros);
  const escolhidos = (prefs.prioridades ?? []).filter((id) => livros.some((l) => l.id === id));
  const quero = livros.filter((l) => l.status === "quero" && !escolhidos.includes(l.id));
  const porId = new Map(livros.map((l) => [l.id, l]));
  const mover = (i: number, d: number) => {
    const n = [...escolhidos];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    salvar({ prioridades: n });
  };
  return (
    <Gaveta titulo="Próximas leituras" fechar={fechar}>
      <p className="text-[12px] text-cinza">Escolha e ordene as prioridades. Tirar daqui não tira o livro da estante.</p>
      <ol className="mt-3 divide-y divide-linha border-y border-linha">
        {escolhidos.map((id, i) => {
          const l = porId.get(id)!;
          return (
            <li key={id} className="flex items-center gap-3 py-2">
              <span className="w-5 text-center text-[12px] text-cinza tabular-nums">{i + 1}</span>
              <Mini l={l} w={26} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ameixa">{l.titulo}</span>
                <span className="block truncate text-[11px] text-cinza">{l.autor}{l.status === "lido" ? " · lido" : ""}</span>
              </span>
              <button type="button" aria-label="Subir" onClick={() => mover(i, -1)} className="grid size-8 place-items-center text-ameixa disabled:opacity-30" disabled={i === 0}>↑</button>
              <button type="button" aria-label="Descer" onClick={() => mover(i, 1)} className="grid size-8 place-items-center text-ameixa disabled:opacity-30" disabled={i === escolhidos.length - 1}>↓</button>
              <button type="button" aria-label="Tirar da lista" onClick={() => salvar({ prioridades: escolhidos.filter((x) => x !== id) })} className="grid size-8 place-items-center text-cinza hover:text-bordo">×</button>
            </li>
          );
        })}
        {!escolhidos.length ? <li className="py-3 text-[13px] text-cinza">Nenhum livro escolhido ainda.</li> : null}
      </ol>
      <p className="mt-6 mb-2 text-[13px] font-semibold text-ameixa">Da estante Quero ler</p>
      <ul className="divide-y divide-linha">
        {quero.map((l) => (
          <li key={l.id}>
            <button type="button" onClick={() => salvar({ prioridades: [...escolhidos, l.id] })} className="flex w-full items-center gap-3 py-2 text-left hover:text-bordo">
              <Mini l={l} w={22} />
              <span className="min-w-0 flex-1 truncate text-[13px] text-ameixa">{l.titulo}</span>
              <span className="text-[12px] font-semibold text-bordo">+ adicionar</span>
            </button>
          </li>
        ))}
        {!quero.length ? <li className="py-3 text-[13px] text-cinza">Sua estante Quero ler está vazia.</li> : null}
      </ul>
    </Gaveta>
  );
}

function EscolherFavorito({ mes, ano, opcoes, atual, salvar, fechar }: { mes: number; ano: string; opcoes: ReturnType<typeof usePerfil.getState>["livros"]; atual?: string; salvar: (id: string | null) => void; fechar: () => void }) {
  return (
    <Gaveta titulo={`Favorito de ${MESES[mes].toLowerCase()} de ${ano}`} fechar={fechar}>
      <ul className="divide-y divide-linha">
        {opcoes.map((l) => (
          <li key={l.id}>
            <button type="button" onClick={() => salvar(l.id)} aria-pressed={atual === l.id} className={`flex w-full items-center gap-3 py-2.5 text-left ${atual === l.id ? "text-bordo" : "text-ameixa"}`}>
              <Mini l={l} w={30} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold">{l.titulo}</span>
                <span className="block truncate text-[12px] text-cinza">{l.autor}</span>
              </span>
              {atual === l.id ? <span className="text-[12px] font-semibold">escolhido</span> : null}
            </button>
          </li>
        ))}
      </ul>
      {atual ? (
        <button type="button" onClick={() => salvar(null)} className="mt-4 min-h-10 text-[13px] text-cinza hover:text-bordo">
          Deixar o mês sem favorito
        </button>
      ) : null}
    </Gaveta>
  );
}
