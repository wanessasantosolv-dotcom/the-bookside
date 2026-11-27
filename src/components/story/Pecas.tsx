"use client";

/*
 * As peças do editor de compartilhamento: quatro modelos com direção própria
 * (editorial, ex-líbris, contracapa, memórias), cada um com paletas próprias e
 * três formatos (story 1080×1920, vertical 1080×1350, quadrado 1080×1080).
 * Desenhadas a 360 px de largura e exportadas a 3× (só a arte, nunca a tela).
 * Tudo vem de dados reais; o que falta simplesmente não aparece.
 */
import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { Capa } from "@/components/story/Stories";
import type { LivroSalvo } from "@/lib/perfil-store";

export type Formato = "story" | "vertical" | "quadrado";
export const FORMATOS: { id: Formato; nome: string; alto: number; px: string }[] = [
  { id: "story", nome: "Story", alto: 640, px: "1080 × 1920" },
  { id: "vertical", nome: "Vertical", alto: 450, px: "1080 × 1350" },
  { id: "quadrado", nome: "Quadrado", alto: 360, px: "1080 × 1080" },
];

export type Modelo = "editorial" | "exlibris" | "contracapa" | "memorias";
export type Paleta = { id: string; nome: string; fundo: string; texto: string; suave: string; destaque: string; bloco: string; papel: string };

const P = (id: string, nome: string, fundo: string, texto: string, suave: string, destaque: string, bloco: string, papel: string): Paleta => ({ id, nome, fundo, texto, suave, destaque, bloco, papel });

export const MODELOS: { id: Modelo; nome: string; descricao: string; paletas: Paleta[] }[] = [
  {
    id: "editorial",
    nome: "Editorial",
    descricao: "revista literária, hierarquia assimétrica",
    paletas: [
      P("creme", "creme", "#F8F4EE", "#38252C", "#6E5C62", "#692536", "#E8D2D8", "#FCFAF6"),
      P("azul", "azul vintage", "#DCE3F0", "#2B2440", "#5A5772", "#4D5FA3", "#8297D1", "#F4F6FA"),
      P("bordo", "bordô", "#692536", "#F8F4EE", "#ECAABB", "#F1DFA0", "#54202F", "#7A2E41"),
    ],
  },
  {
    id: "exlibris",
    nome: "Ex-líbris",
    descricao: "moldura, selo e tipografia clássica",
    paletas: [
      P("manteiga", "manteiga", "#F1DFA0", "#38252C", "#6B5530", "#692536", "#F8F4EE", "#F7EBC0"),
      P("rosa", "rosa", "#E8D2D8", "#38252C", "#6E5C62", "#692536", "#F8F4EE", "#F3E5E9"),
      P("noite", "marrom vinho", "#38252C", "#F8F4EE", "#D8A8B6", "#F1DFA0", "#4A3139", "#43303A"),
    ],
  },
  {
    id: "contracapa",
    nome: "Contracapa",
    descricao: "blocos de cor e formas dos anos 70",
    paletas: [
      P("citrico", "cítrico e bordô", "#F8F4EE", "#38252C", "#5A4A50", "#692536", "#D5DD76", "#ECAABB"),
      P("azul-rosa", "azul e rosa", "#8297D1", "#1F1B33", "#2F2A4A", "#F8F4EE", "#ECAABB", "#F1DFA0"),
      P("bordo-manteiga", "bordô e manteiga", "#F1DFA0", "#38252C", "#5E4A2C", "#692536", "#692536", "#8297D1"),
    ],
  },
  {
    id: "memorias",
    nome: "Memórias",
    descricao: "foto instantânea e anotação à mão",
    paletas: [
      P("papel", "papel", "#EFE7DD", "#38252C", "#6E5C62", "#692536", "#FFFFFF", "#D5DD76"),
      P("rosa", "rosa antigo", "#E8D2D8", "#38252C", "#6E5C62", "#692536", "#FFFFFF", "#8297D1"),
      P("azul", "azul suave", "#DCE3F0", "#2B2440", "#5A5772", "#692536", "#FFFFFF", "#ECAABB"),
    ],
  },
];

/** o conteúdo de uma peça, igual para todos os modelos */
export type Conteudo = {
  /** frase editorial do evento (ex.: "mais uma última página.") */
  chamada: string;
  livro?: LivroSalvo;
  /** para o mês: as capas */
  livros?: LivroSalvo[];
  /** linha de contexto (ex.: "novembro de 2026") */
  contexto?: string;
  mostrarCapa: boolean;
  mostrarTitulo: boolean;
  mostrarAutor: boolean;
  nota?: number;
  /** pares rótulo/valor já filtrados (páginas, datas, duração, livros no ano…) */
  dados: { rotulo: string; valor: string }[];
  trecho?: { tipo: "citação" | "resenha"; texto: string };
  progresso?: number;
  leitor?: string;
};

const serif = "var(--font-fraunces), Georgia, serif";
const sans = "var(--font-manrope), system-ui, sans-serif";
const maquina = "var(--font-special-elite), 'Courier New', monospace";
const estrelas = (n?: number) => (n ? "★".repeat(Math.floor(n)) + (n % 1 ? "½" : "") : "");
const tamTitulo = (t: string, base: number) => Math.round(t.length > 48 ? base * 0.62 : t.length > 30 ? base * 0.76 : t.length > 18 ? base * 0.88 : base);
const clamp = (linhas: number): CSSProperties => ({ display: "-webkit-box", WebkitLineClamp: linhas, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere" });

function Assinatura({ cor, claro }: { cor: string; claro?: boolean }) {
  // a marca oficial, pequena e discreta
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={claro ? "/brand/wordmark-creme.png" : "/brand/wordmark-bordo.png"} alt="the bookside" style={{ height: 13, width: "auto", opacity: 0.9, filter: claro ? undefined : undefined, color: cor }} />
  );
}

const ehEscura = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 < 140;
};

/** capas do mês: uma grade arrumada que ocupa a largura toda (com "+N" quando sobram) */
function CapasDoMes({ livros, largura, formato, cor }: { livros: LivroSalvo[]; largura: number; formato: Formato; cor: string }) {
  const max = formato === "story" ? 6 : formato === "vertical" ? 4 : 3;
  const mostrar = livros.slice(0, livros.length > max ? max - 1 : max);
  const resto = livros.length - mostrar.length;
  const colunas = mostrar.length + (resto ? 1 : 0) <= 4 && formato !== "story" ? Math.max(2, mostrar.length + (resto ? 1 : 0)) : 3;
  const gap = 10;
  const w = Math.floor((largura - gap * (colunas - 1)) / colunas);
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${colunas}, ${w}px)`, gap, justifyContent: "center" }}>
      {mostrar.map((l, i) => (
        <Capa key={l.id} l={l} largura={w} girar={[-2, 1.5, -1, 2, -1.5, 1][i % 6]} />
      ))}
      {resto ? (
        <div style={{ width: w, aspectRatio: "2 / 3", border: `1px dashed ${cor}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontStyle: "italic", fontSize: 22, color: cor }}>+{resto}</div>
      ) : null}
    </div>
  );
}

/** capa de um livro (ou, no mês, a grade de capas) */
function Capas({ c, largura, girar = 0, sombra = true, formato = "story", cor = "#692536" }: { c: Conteudo; largura: number; girar?: number; sombra?: boolean; formato?: Formato; cor?: string }) {
  if (c.livros?.length) return <CapasDoMes livros={c.livros} largura={308} formato={formato} cor={cor} />;
  return c.livro ? <Capa l={c.livro} largura={largura} girar={girar} sombra={sombra} /> : null;
}

function Dados({ c, cor, suave, fio, centro }: { c: Conteudo; cor: string; suave: string; fio: string; centro?: boolean }) {
  if (!c.dados.length && !c.nota) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: centro ? "center" : "flex-start", gap: "6px 16px", borderTop: `1px solid ${fio}`, paddingTop: 8 }}>
      {c.nota ? (
        <span style={{ fontSize: 13, color: cor, letterSpacing: 1 }}>
          {estrelas(c.nota)}
        </span>
      ) : null}
      {c.dados.map((d) => (
        <span key={d.rotulo} style={{ fontSize: 9.5, color: suave, fontFamily: sans }}>
          <span style={{ textTransform: "uppercase", letterSpacing: ".12em", fontSize: 7.5, display: "block" }}>{d.rotulo}</span>
          <span style={{ color: cor, fontWeight: 600, fontSize: 11 }}>{d.valor}</span>
        </span>
      ))}
    </div>
  );
}

function Trecho({ c, cor, suave, linhas = 4, centro }: { c: Conteudo; cor: string; suave: string; linhas?: number; centro?: boolean }) {
  if (!c.trecho) return null;
  return (
    <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 13, lineHeight: 1.35, color: cor, textAlign: centro ? "center" : "left", ...clamp(linhas) }}>
      “{c.trecho.texto}”
      <span style={{ display: "block", fontStyle: "normal", fontFamily: sans, fontSize: 8, letterSpacing: ".14em", textTransform: "uppercase", color: suave, marginTop: 4 }}>{c.trecho.tipo === "citação" ? "palavras que guardei" : "da minha resenha"}</span>
    </p>
  );
}

function Progresso({ c, cor, fundo }: { c: Conteudo; cor: string; fundo: string }) {
  if (c.progresso === undefined) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ flex: 1, height: 4, borderRadius: 4, background: fundo, overflow: "hidden" }}>
        <span style={{ display: "block", height: "100%", width: `${c.progresso}%`, background: cor }} />
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, color: cor, fontFamily: sans }}>{c.progresso}%</span>
    </div>
  );
}

type Props = { c: Conteudo; formato: Formato; paleta: Paleta };

/** a base: tamanho do formato e área segura dos stories */
const Base = forwardRef<HTMLDivElement, { formato: Formato; fundo: string; children: ReactNode; estilo?: CSSProperties }>(function Base({ formato, fundo, children, estilo }, ref) {
  const alto = FORMATOS.find((f) => f.id === formato)!.alto;
  const seguro = formato === "story" ? { paddingTop: 54, paddingBottom: 64 } : { paddingTop: 26, paddingBottom: 24 };
  return (
    <div ref={ref} style={{ width: 360, height: alto, background: fundo, position: "relative", overflow: "hidden", fontFamily: sans, display: "flex", flexDirection: "column", paddingLeft: 26, paddingRight: 26, ...seguro, ...estilo }}>
      {children}
    </div>
  );
});

/* ───────── editorial ───────── */

const Editorial = forwardRef<HTMLDivElement, Props>(function Editorial({ c, formato, paleta: p }, ref) {
  const curto = formato === "quadrado";
  const titulo = c.livro?.titulo ?? c.contexto ?? "";
  const fio = ehEscura(p.fundo) ? "rgba(248,244,238,.28)" : "rgba(56,37,44,.18)";
  return (
    <Base ref={ref} formato={formato} fundo={p.fundo}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: `1px solid ${fio}`, paddingBottom: 6, fontSize: 8, letterSpacing: ".2em", textTransform: "uppercase", color: p.suave, fontWeight: 600 }}>
        <span>{c.contexto ?? "edição pessoal"}</span>
        <span>nº {new Date().getFullYear()}</span>
      </div>
      <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: curto ? 26 : 34, lineHeight: 1, color: p.destaque, marginTop: curto ? 12 : 22, ...clamp(2) }}>{c.chamada}</p>
      {c.livros?.length ? (
        <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: curto ? 10 : 18 }}>
          {c.mostrarCapa ? <Capas c={c} largura={0} formato={formato} cor={p.destaque} /> : null}
        </div>
      ) : (
      <div style={{ display: "flex", gap: 16, marginTop: curto ? 14 : 24, flex: 1, minHeight: 0, alignItems: formato === "story" ? "flex-start" : "center" }}>
        {c.mostrarCapa ? (
          <div style={{ flex: "none" }}>
            <Capas c={c} largura={formato === "story" ? 150 : curto ? 100 : 118} />
          </div>
        ) : null}
        <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
          {c.mostrarTitulo && c.livro ? <p style={{ fontFamily: serif, fontSize: tamTitulo(titulo, curto ? 20 : 24), lineHeight: 1.08, color: p.texto, ...clamp(4) }}>{titulo}</p> : null}
          {c.mostrarAutor && c.livro ? <p style={{ fontSize: 9, letterSpacing: ".18em", textTransform: "uppercase", color: p.suave, fontWeight: 600 }}>{c.livro.autor}</p> : null}
          <span style={{ width: 28, height: 2, background: p.bloco }} />
          <Progresso c={c} cor={p.destaque} fundo={fio} />
          {formato !== "quadrado" ? <Trecho c={c} cor={p.texto} suave={p.suave} linhas={formato === "story" ? 6 : 3} /> : null}
        </div>
      </div>
      )}
      <Dados c={c} cor={p.texto} suave={p.suave} fio={fio} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <span style={{ fontSize: 8, color: p.suave, letterSpacing: ".14em", textTransform: "uppercase" }}>{c.leitor ? `@${c.leitor}` : ""}</span>
        <Assinatura cor={p.destaque} claro={ehEscura(p.fundo)} />
      </div>
    </Base>
  );
});

/* ───────── ex-líbris ───────── */

const ExLibris = forwardRef<HTMLDivElement, Props>(function ExLibris({ c, formato, paleta: p }, ref) {
  const curto = formato === "quadrado";
  const titulo = c.livro?.titulo ?? c.contexto ?? "";
  return (
    <Base ref={ref} formato={formato} fundo={p.fundo}>
      <div style={{ position: "relative", flex: 1, border: `1.5px solid ${p.destaque}`, outline: `1px solid ${p.destaque}`, outlineOffset: 4, borderRadius: "48% 48% 6px 6px / 22% 22% 6px 6px", display: "flex", flexDirection: "column", alignItems: "center", padding: curto ? "18px 18px 12px" : "30px 22px 18px", textAlign: "center", background: p.papel }}>
        <p style={{ fontFamily: serif, fontSize: 9, letterSpacing: ".4em", color: p.suave, textTransform: "uppercase" }}>ex · libris</p>
        <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: curto ? 18 : 22, color: p.destaque, marginTop: 4, ...clamp(2) }}>{c.chamada}</p>
        <span style={{ color: p.destaque, fontSize: 10, letterSpacing: 6, margin: "6px 0" }}>✦ ✦ ✦</span>
        {c.mostrarCapa ? (
          <div style={{ padding: 6, border: `1px solid ${p.destaque}`, borderRadius: 4, marginTop: 4 }}>
            {c.livros?.length ? <div style={{ width: 250 }}><CapasDoMes livros={c.livros} largura={250} formato={formato} cor={p.destaque} /></div> : <Capas c={c} largura={formato === "story" ? 132 : curto ? 74 : 96} sombra={false} />}
          </div>
        ) : null}
        {c.mostrarTitulo && c.livro ? <p style={{ fontFamily: serif, fontSize: tamTitulo(titulo, curto ? 17 : 21), lineHeight: 1.1, color: p.texto, marginTop: 12, ...clamp(3) }}>{titulo}</p> : null}
        {c.mostrarAutor && c.livro ? <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 11, color: p.suave, marginTop: 3 }}>{c.livro.autor}</p> : null}
        <div style={{ marginTop: "auto", width: "100%" }}>
          {formato === "story" ? <Trecho c={c} cor={p.texto} suave={p.suave} linhas={3} centro /> : null}
          <div style={{ marginTop: 8 }}>
            <Progresso c={c} cor={p.destaque} fundo={p.fundo} />
          </div>
          <Dados c={c} cor={p.texto} suave={p.suave} fio={p.destaque} centro />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
        <Assinatura cor={p.destaque} claro={ehEscura(p.fundo)} />
      </div>
    </Base>
  );
});

/* ───────── contracapa ───────── */

const Contracapa = forwardRef<HTMLDivElement, Props>(function Contracapa({ c, formato, paleta: p }, ref) {
  const curto = formato === "quadrado";
  const titulo = c.livro?.titulo ?? c.contexto ?? "";
  const alto = FORMATOS.find((f) => f.id === formato)!.alto;
  return (
    <Base ref={ref} formato={formato} fundo={p.fundo}>
      {/* blocos e formas */}
      <span aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: alto * 0.42, background: p.bloco }} />
      <span aria-hidden style={{ position: "absolute", right: -50, top: alto * 0.2, width: 190, height: 190, borderRadius: "50%", background: p.papel }} />
      <span aria-hidden style={{ position: "absolute", left: 26, bottom: alto * 0.42 - 6, width: 120, height: 12, background: p.destaque }} />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
        <p style={{ fontFamily: sans, fontWeight: 800, fontSize: curto ? 26 : 34, lineHeight: 0.92, letterSpacing: "-.02em", color: p.destaque, textTransform: "lowercase", maxWidth: 230, ...clamp(3) }}>{c.chamada}</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 14, marginTop: "auto" }}>
          {c.mostrarCapa ? c.livros?.length ? <div style={{ width: 308 }}><CapasDoMes livros={c.livros} largura={308} formato={formato} cor={p.destaque} /></div> : <Capas c={c} largura={formato === "story" ? 160 : curto ? 98 : 120} girar={-4} /> : null}
          <div style={{ minWidth: 0, flex: 1, paddingBottom: 4 }}>
            {c.mostrarTitulo && c.livro ? <p style={{ fontFamily: serif, fontSize: tamTitulo(titulo, curto ? 18 : 22), lineHeight: 1.05, color: ehEscura(p.bloco) ? "#F8F4EE" : p.texto, ...clamp(4) }}>{titulo}</p> : null}
            {c.mostrarAutor && c.livro ? <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: ehEscura(p.bloco) ? "#F8F4EE" : p.suave, marginTop: 4 }}>{c.livro.autor}</p> : null}
          </div>
        </div>
        <div style={{ marginTop: 12, color: ehEscura(p.bloco) ? "#F8F4EE" : p.texto }}>
          {formato === "story" ? <Trecho c={c} cor={ehEscura(p.bloco) ? "#F8F4EE" : p.texto} suave={ehEscura(p.bloco) ? "#F1DFA0" : p.suave} linhas={3} /> : null}
          <div style={{ marginTop: 8 }}>
            <Progresso c={c} cor={p.destaque} fundo="rgba(255,255,255,.5)" />
          </div>
          <Dados c={c} cor={ehEscura(p.bloco) ? "#F8F4EE" : p.texto} suave={ehEscura(p.bloco) ? "#F1DFA0" : p.suave} fio="rgba(56,37,44,.25)" />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
          <Assinatura cor={p.destaque} claro={ehEscura(p.bloco)} />
        </div>
      </div>
    </Base>
  );
});

/* ───────── memórias ───────── */

const Memorias = forwardRef<HTMLDivElement, Props>(function Memorias({ c, formato, paleta: p }, ref) {
  const curto = formato === "quadrado";
  const titulo = c.livro?.titulo ?? c.contexto ?? "";
  const data = c.dados.find((d) => /conclu|início|mês/i.test(d.rotulo))?.valor;
  return (
    <Base ref={ref} formato={formato} fundo={p.fundo}>
      <p style={{ fontFamily: maquina, fontSize: curto ? 15 : 18, color: p.destaque, transform: "rotate(-2deg)", ...clamp(2) }}>{c.chamada}</p>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 0 }}>
        <div style={{ position: "relative", background: p.bloco, padding: curto ? "8px 8px 30px" : "12px 12px 44px", boxShadow: "0 14px 28px -14px rgba(43,20,32,.45)", transform: "rotate(-3deg)" }}>
          <span aria-hidden style={{ position: "absolute", top: -8, left: "50%", width: 70, height: 16, marginLeft: -35, background: p.papel, opacity: 0.8, transform: "rotate(4deg)" }} />
          {c.mostrarCapa ? (
            <div style={{ background: "#EDE6DC", padding: 10, display: "flex", justifyContent: "center" }}>
              {c.livros?.length ? <div style={{ width: 230 }}><CapasDoMes livros={c.livros} largura={230} formato={formato} cor={p.destaque} /></div> : <Capas c={c} largura={formato === "story" ? 150 : curto ? 86 : 112} sombra={false} />}
            </div>
          ) : (
            <div style={{ width: 160, height: 120, background: "#EDE6DC" }} />
          )}
          <p style={{ position: "absolute", left: 12, right: 12, bottom: curto ? 8 : 12, fontFamily: maquina, fontSize: curto ? 9 : 11, color: "#38252C", textAlign: "center", ...clamp(1) }}>{data ?? c.contexto ?? ""}</p>
        </div>
      </div>
      {c.mostrarTitulo && c.livro ? <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: tamTitulo(titulo, curto ? 18 : 22), color: p.texto, textAlign: "center", ...clamp(2) }}>{titulo}</p> : null}
      {c.mostrarAutor && c.livro ? <p style={{ fontFamily: maquina, fontSize: 10, color: p.suave, textAlign: "center", marginTop: 2 }}>{c.livro.autor}</p> : null}
      {formato === "story" ? (
        <div style={{ marginTop: 10 }}>
          <Trecho c={c} cor={p.texto} suave={p.suave} linhas={3} centro />
        </div>
      ) : null}
      <div style={{ marginTop: 8 }}>
        <Progresso c={c} cor={p.destaque} fundo="rgba(56,37,44,.12)" />
        <Dados c={{ ...c, dados: c.dados.filter((d) => d.valor !== data) }} cor={p.texto} suave={p.suave} fio="rgba(56,37,44,.15)" centro />
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 10 }}>
        <Assinatura cor={p.destaque} />
      </div>
    </Base>
  );
});

export const Peca = forwardRef<HTMLDivElement, Props & { modelo: Modelo }>(function Peca({ modelo, ...props }, ref) {
  if (modelo === "exlibris") return <ExLibris ref={ref} {...props} />;
  if (modelo === "contracapa") return <Contracapa ref={ref} {...props} />;
  if (modelo === "memorias") return <Memorias ref={ref} {...props} />;
  return <Editorial ref={ref} {...props} />;
});

/** frases editoriais por evento (a pessoa pode trocar por uma direta ou escrever a sua) */
export const CHAMADAS: Record<"terminei" | "lendo" | "mes", string[]> = {
  terminei: ["mais uma última página.", "depois da última página.", "uma história que fica.", "terminei."],
  lendo: ["um novo capítulo.", "lendo agora.", "entre páginas."],
  mes: ["um mês entre páginas.", "o mês em livros.", "meu mês de leitura."],
};
