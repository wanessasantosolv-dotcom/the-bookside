import type { CSSProperties } from "react";

/**
 * club studio — a identidade visual de um clube.
 *
 * Cada clube guarda só o que mudou (tema base + sobrescritas) em
 * clubes.identidade (jsonb). Daqui sai uma paleta completa, que vira os tokens
 * semânticos --club-* e também redefine os tokens do app (--color-creme,
 * --color-bordo, --color-ameixa…) dentro do clube: assim fundos, superfícies,
 * textos, bordas, botões, barras e estantes de TODAS as telas do clube mudam,
 * sem tocar nas páginas pessoais, no co-read ou em outros clubes.
 *
 * Nada de CSS livre: só cores hexadecimais validadas e opções de listas fechadas.
 */

export type Paleta = {
  fundo: string;
  fundo2: string;
  superficie: string;
  primaria: string;
  complementar: string;
  destaque: string;
  texto: string;
  textoSuave: string;
  borda: string;
  estante: string;
};
export const CAMPOS_PALETA: { id: keyof Paleta; nome: string }[] = [
  { id: "fundo", nome: "fundo principal" },
  { id: "fundo2", nome: "fundo secundário" },
  { id: "superficie", nome: "superfícies" },
  { id: "primaria", nome: "cor primária" },
  { id: "complementar", nome: "cor complementar" },
  { id: "destaque", nome: "cor de destaque" },
  { id: "texto", nome: "texto" },
  { id: "textoSuave", nome: "texto secundário" },
  { id: "borda", nome: "bordas e divisórias" },
  { id: "estante", nome: "estantes" },
];

export type TipografiaId = "editorial" | "classica" | "retro" | "moderna" | "indie";
export const TIPOGRAFIAS: { id: TipografiaId; nome: string; familia: string; italico: boolean; peso: number }[] = [
  { id: "editorial", nome: "editorial serif", familia: "var(--font-fraunces), Georgia, serif", italico: true, peso: 500 },
  { id: "classica", nome: "classic serif", familia: "var(--font-playfair), Georgia, serif", italico: true, peso: 600 },
  { id: "retro", nome: "retro serif", familia: "var(--font-dm-serif), Georgia, serif", italico: false, peso: 400 },
  { id: "moderna", nome: "modern sans", familia: "var(--font-manrope), system-ui, sans-serif", italico: false, peso: 700 },
  { id: "indie", nome: "indie editorial", familia: "var(--font-special-elite), 'Courier New', monospace", italico: false, peso: 400 },
];

export type TemaClubeId = "botanical" | "dark-academia" | "cherry-club" | "paperback" | "after-hours" | "the-editor";
export type TemaClube = {
  id: TemaClubeId;
  nome: string;
  descricao: string;
  escuro: boolean;
  tipografia: TipografiaId;
  raio: number;
  paleta: Paleta;
  /** fundo do banner quando o clube não tem foto de capa (só gradientes e padrões em CSS) */
  banner: string;
};

export const TEMAS_CLUBE: TemaClube[] = [
  {
    id: "botanical",
    nome: "botanical.",
    descricao: "orgânico, nostálgico e intimista",
    escuro: false,
    tipografia: "editorial",
    raio: 6,
    paleta: { fundo: "#F3EFE3", fundo2: "#E7E7D6", superficie: "#FAF7EE", primaria: "#48533F", complementar: "#D8A9AD", destaque: "#BEAD86", texto: "#2E3428", textoSuave: "#5E6553", borda: "#D9D6C4", estante: "#9A7650" },
    banner: "radial-gradient(circle at 20% 30%, #A2AC8B55 0 18%, transparent 19%), radial-gradient(circle at 75% 70%, #D8A9AD55 0 14%, transparent 15%), radial-gradient(circle at 55% 20%, #BEAD8644 0 9%, transparent 10%), #E4E6D3",
  },
  {
    id: "dark-academia",
    nome: "dark academia.",
    descricao: "clássico, dramático e literário",
    escuro: true,
    tipografia: "classica",
    raio: 2,
    paleta: { fundo: "#302522", fundo2: "#3A2D29", superficie: "#3D2F2A", primaria: "#C9A26A", complementar: "#75443D", destaque: "#54513D", texto: "#E9D7B1", textoSuave: "#C8B48F", borda: "#5A4740", estante: "#3B2418" },
    banner: "repeating-linear-gradient(90deg, #3B2418 0 22px, #2A1B14 22px 24px, #4A3022 24px 40px, #2A1B14 40px 42px), #302522",
  },
  {
    id: "cherry-club",
    nome: "cherry club.",
    descricao: "retrô, divertido e expressivo",
    escuro: false,
    tipografia: "retro",
    raio: 10,
    paleta: { fundo: "#F9E7D8", fundo2: "#F6D7D6", superficie: "#FFF4EA", primaria: "#8C263E", complementar: "#ECAABB", destaque: "#F0DFA0", texto: "#3D1420", textoSuave: "#7A4150", borda: "#EBC6C2", estante: "#D64D63" },
    banner: "repeating-conic-gradient(#ECAABB 0 25%, #F9E7D8 0 50%) 0 0 / 36px 36px",
  },
  {
    id: "paperback",
    nome: "paperback.",
    descricao: "indie, gráfico e contemporâneo",
    escuro: false,
    tipografia: "moderna",
    raio: 0,
    paleta: { fundo: "#F8F3E9", fundo2: "#E9ECF5", superficie: "#FFFDF7", primaria: "#344B89", complementar: "#8297D1", destaque: "#D5DD76", texto: "#1F2A4A", textoSuave: "#4E5B80", borda: "#D6DBEA", estante: "#344B89" },
    banner: "linear-gradient(135deg, transparent 0 55%, #D5DD76 55% 70%, transparent 70%), radial-gradient(circle at 18% 50%, #8297D1 0 22%, transparent 23%), #F1DFA0",
  },
  {
    id: "after-hours",
    nome: "after hours.",
    descricao: "mid-century, vintage e acolhedor",
    escuro: false,
    tipografia: "retro",
    raio: 4,
    paleta: { fundo: "#F1E7D7", fundo2: "#EAD8BF", superficie: "#F8F0E3", primaria: "#A24E30", complementar: "#D39358", destaque: "#5F6542", texto: "#3B2418", textoSuave: "#6E5440", borda: "#E0CCB0", estante: "#7A4A2A" },
    banner: "repeating-radial-gradient(circle at 50% 120%, #D39358 0 14px, #E4C6A1 14px 28px, #A24E30 28px 34px, #E4C6A1 34px 48px)",
  },
  {
    id: "the-editor",
    nome: "the editor.",
    descricao: "minimalista, atemporal e editorial",
    escuro: false,
    tipografia: "indie",
    raio: 0,
    paleta: { fundo: "#F9F6EE", fundo2: "#EFEBE0", superficie: "#FDFBF6", primaria: "#292923", complementar: "#B0A999", destaque: "#696861", texto: "#292923", textoSuave: "#696861", borda: "#E3DED0", estante: "#B0A999" },
    banner: "repeating-linear-gradient(0deg, #E3DED0 0 1px, transparent 1px 22px), #F9F6EE",
  },
];

/* ───────── fase 3: emblema, padrões, elementos, estantes, layout e títulos ───────── */
export const FORMATOS_EMBLEMA = ["circulo", "oval", "postal", "escudo", "exlibris", "arco", "organico"] as const;
export type FormatoEmblema = (typeof FORMATOS_EMBLEMA)[number];
export const NOME_FORMATO: Record<FormatoEmblema, string> = { circulo: "circular", oval: "oval", postal: "selo postal", escudo: "escudo", exlibris: "ex-libris", arco: "arco", organico: "orgânico" };
export const SIMBOLOS = ["nenhum", "livro-aberto", "livro", "lua", "sol", "estrela", "flor", "chave", "olho", "aspas", "marcador"] as const;
export type Simbolo = (typeof SIMBOLOS)[number];
export const NOME_SIMBOLO: Record<Simbolo, string> = { nenhum: "sem símbolo", "livro-aberto": "livro aberto", livro: "livro fechado", lua: "lua", sol: "sol", estrela: "estrela", flor: "flor", chave: "chave", olho: "olho", aspas: "aspas", marcador: "marcador" };
export const PAPEIS_COR = ["primaria", "complementar", "destaque", "superficie", "fundo", "texto"] as const;
export type PapelCor = (typeof PAPEIS_COR)[number];
export type Emblema = {
  formato: FormatoEmblema;
  texto: string;
  simbolo: Simbolo;
  ano?: number;
  fundo: PapelCor;
  tinta: PapelCor;
  /** usar o emblema no lugar da foto do clube */
  noAvatar: boolean;
};

export const PADROES = ["nenhum", "xadrez", "vichy", "listras", "diagonal", "grade", "losangos", "zigue", "floral", "estrelas", "pontilhado", "bolas", "geometrico", "ondas", "papel", "organico"] as const;
export type Padrao = (typeof PADROES)[number];
export const NOME_PADRAO: Record<Padrao, string> = { nenhum: "sem pattern", xadrez: "xadrez", vichy: "vichy", listras: "listras", diagonal: "listras diagonais", grade: "grade", losangos: "losangos", zigue: "zigue-zague", bolas: "bolinhas grandes", floral: "floral", estrelas: "estrelas", pontilhado: "pontilhado", geometrico: "geométrico", ondas: "ondas", papel: "papel editorial", organico: "formas orgânicas" };
export const LUGARES_PADRAO = ["banner", "faixa", "vazios", "cartoes"] as const;
export type LugarPadrao = (typeof LUGARES_PADRAO)[number];
export const NOME_LUGAR: Record<LugarPadrao, string> = { banner: "banner", faixa: "faixa sob o cabeçalho", vazios: "estados vazios", cartoes: "cards comemorativos" };
export type ConfigPadrao = { tipo: Padrao; cor: PapelCor; escala: 1 | 2 | 3; intensidade: number; onde: LugarPadrao[] };

export const FAMILIAS = ["botanical", "celestial", "vintage", "paper", "retro", "minimal"] as const;
export type Familia = (typeof FAMILIAS)[number];
export const NOME_FAMILIA: Record<Familia, string> = { botanical: "botanical", celestial: "celestial", vintage: "vintage library", paper: "paper goods", retro: "retro graphic", minimal: "minimal editorial" };
export type Decoracao = "minimal" | "balanced" | "expressive";

export const ESTANTES = ["tema", "natural", "clara", "escura", "bordo", "cereja", "oliva", "azul", "minimalista", "personalizada"] as const;
export type EstiloEstante = (typeof ESTANTES)[number];
export const NOME_ESTANTE: Record<EstiloEstante, string> = { tema: "do tema", natural: "madeira natural", clara: "madeira clara", escura: "madeira escura", bordo: "bordô", cereja: "vermelho cereja", oliva: "verde oliva", azul: "azul", minimalista: "minimalista", personalizada: "cor personalizada" };
const COR_ESTANTE: Partial<Record<EstiloEstante, string>> = { natural: "#9A7650", clara: "#D2B48C", escura: "#3B2418", bordo: "#692536", cereja: "#C7354F", oliva: "#59634F", azul: "#344B89" };
export type ConfigEstante = { estilo: EstiloEstante; cor?: string; espessura: "fina" | "padrao" | "grossa" };

export type Cabecalho = "editorial" | "centered" | "compact";
export type EstiloCartao = "editorial" | "paper" | "minimal" | "vintage";

/** módulos da página inicial que existem de verdade (a leitura atual fica sempre no topo) */
export const MODULOS = ["progresso", "favoritos", "encontro", "atividade", "proximas", "membros", "liga"] as const;
export type Modulo = (typeof MODULOS)[number];
export const NOME_MODULO: Record<Modulo, string> = { progresso: "progresso dos leitores", favoritos: "favoritos do clube", encontro: "próximo encontro", atividade: "atividade recente", proximas: "próximas leituras", membros: "membros do clube", liga: "the reading league (resumo)" };
export type ConfigModulos = { ordem: Modulo[]; ocultos: Modulo[] };

/** títulos editoriais que o clube pode trocar (menus, botões e avisos continuam os do app) */
export const TITULOS = {
  progresso: ["progresso dos leitores", "cada um no seu capítulo", "entre capítulos"],
  favoritos: ["favoritos do clube", "the club favorites.", "nossos favoritos", "five-star reads."],
  atividade: ["atividade recente", "entre capítulos", "o que rolou"],
  proximas: ["próximas leituras", "next on our list.", "na fila"],
  estante: ["nossa estante", "the club shelf.", "estante do clube"],
  encontro: ["próximo encontro", "book date.", "next book date."],
} as const;
export type ChaveTitulo = keyof typeof TITULOS;

export type Identidade = {
  v: 1;
  tema: TemaClubeId;
  /** tema: só o tema; simples: principal + complementar + atmosfera; avancado: cada cor */
  modo: "tema" | "simples" | "avancado";
  simples?: { principal: string; complementar: string; escuro: boolean };
  cores?: Partial<Paleta>;
  tipografia?: TipografiaId;
  emblema?: Emblema;
  padrao?: ConfigPadrao;
  familia?: Familia;
  decoracao?: Decoracao;
  estante?: ConfigEstante;
  cabecalho?: Cabecalho;
  cartoes?: EstiloCartao;
  modulos?: ConfigModulos;
  /** the reading league desligada (clube prefere não ter ranking) */
  semRanking?: boolean;
  titulos?: Partial<Record<ChaveTitulo, string>>;
};

/** o que cada tema sugere quando o clube ainda não escolheu */
export const PADRAO_DO_TEMA: Record<TemaClubeId, { familia: Familia; padrao: Padrao; cartoes: EstiloCartao; formato: FormatoEmblema; simbolo: Simbolo }> = {
  botanical: { familia: "botanical", padrao: "floral", cartoes: "editorial", formato: "oval", simbolo: "flor" },
  "dark-academia": { familia: "vintage", padrao: "papel", cartoes: "vintage", formato: "exlibris", simbolo: "chave" },
  "cherry-club": { familia: "retro", padrao: "xadrez", cartoes: "paper", formato: "postal", simbolo: "estrela" },
  paperback: { familia: "paper", padrao: "geometrico", cartoes: "minimal", formato: "circulo", simbolo: "livro" },
  "after-hours": { familia: "retro", padrao: "ondas", cartoes: "vintage", formato: "arco", simbolo: "sol" },
  "the-editor": { familia: "minimal", padrao: "nenhum", cartoes: "minimal", formato: "circulo", simbolo: "aspas" },
};

/* ───────── cor ───────── */
const HEX = /^#[0-9a-f]{6}$/i;
export const ehHex = (c: unknown): c is string => typeof c === "string" && HEX.test(c);

function rgb(h: string) {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const hex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
/** mistura a cor a com b (p = quanto de a) */
export function misturar(a: string, b: string, p: number) {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  return hex(r1 * p + r2 * (1 - p), g1 * p + g2 * (1 - p), b1 * p + b2 * (1 - p));
}
function luminancia(h: string) {
  const [r, g, b] = rgb(h).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contraste(a: string, b: string) {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
/** empurra a cor para o preto ou o branco até ter o contraste pedido sobre o fundo */
export function ajustarContraste(cor: string, fundo: string, alvo: number) {
  if (contraste(cor, fundo) >= alvo) return cor;
  const extremo = luminancia(fundo) > 0.35 ? "#000000" : "#FFFFFF";
  for (let p = 0.95; p >= 0; p -= 0.05) {
    const c = misturar(cor, extremo, p);
    if (contraste(c, fundo) >= alvo) return c;
  }
  return extremo;
}

/* ───────── leitura e validação ───────── */
export const temaDoId = (id: string | undefined) => TEMAS_CLUBE.find((t) => t.id === id) ?? TEMAS_CLUBE[0];

/** lê o que veio do banco, descartando tudo que não for válido */
export function lerIdentidade(x: unknown): Identidade | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const tema = TEMAS_CLUBE.find((t) => t.id === o.tema)?.id;
  if (!tema) return null;
  const modo = o.modo === "simples" || o.modo === "avancado" ? o.modo : "tema";
  const s = o.simples as Record<string, unknown> | undefined;
  const simples = s && ehHex(s.principal) && ehHex(s.complementar) ? { principal: s.principal, complementar: s.complementar, escuro: !!s.escuro } : undefined;
  const cores: Partial<Paleta> = {};
  const c = (o.cores ?? {}) as Record<string, unknown>;
  CAMPOS_PALETA.forEach(({ id }) => {
    if (ehHex(c[id])) cores[id] = c[id] as string;
  });
  const tipografia = TIPOGRAFIAS.find((t) => t.id === o.tipografia)?.id;
  const um = <T extends string>(lista: readonly T[], v: unknown): T | undefined => (lista.includes(v as T) ? (v as T) : undefined);
  const limpar = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[<>{}]/g, "").slice(0, max).trim() : "");

  const e = o.emblema as Record<string, unknown> | undefined;
  const emblema: Emblema | undefined =
    e && um(FORMATOS_EMBLEMA, e.formato)
      ? {
          formato: um(FORMATOS_EMBLEMA, e.formato)!,
          texto: limpar(e.texto, 4),
          simbolo: um(SIMBOLOS, e.simbolo) ?? "nenhum",
          ano: typeof e.ano === "number" && e.ano > 1900 && e.ano < 2200 ? Math.round(e.ano) : undefined,
          fundo: um(PAPEIS_COR, e.fundo) ?? "primaria",
          tinta: um(PAPEIS_COR, e.tinta) ?? "fundo",
          noAvatar: !!e.noAvatar,
        }
      : undefined;
  const pd = o.padrao as Record<string, unknown> | undefined;
  const padrao: ConfigPadrao | undefined =
    pd && um(PADROES, pd.tipo)
      ? {
          tipo: um(PADROES, pd.tipo)!,
          cor: um(PAPEIS_COR, pd.cor) ?? "complementar",
          escala: pd.escala === 1 || pd.escala === 3 ? pd.escala : 2,
          intensidade: typeof pd.intensidade === "number" ? Math.max(0.04, Math.min(0.6, pd.intensidade)) : 0.25,
          onde: Array.isArray(pd.onde) ? (pd.onde.filter((x) => LUGARES_PADRAO.includes(x as LugarPadrao)) as LugarPadrao[]) : ["banner"],
        }
      : undefined;
  const es = o.estante as Record<string, unknown> | undefined;
  const estante: ConfigEstante | undefined =
    es && um(ESTANTES, es.estilo)
      ? { estilo: um(ESTANTES, es.estilo)!, cor: ehHex(es.cor) ? es.cor : undefined, espessura: es.espessura === "fina" || es.espessura === "grossa" ? es.espessura : "padrao" }
      : undefined;
  const md = o.modulos as Record<string, unknown> | undefined;
  const modulos: ConfigModulos | undefined = md
    ? {
        ordem: [...new Set([...(Array.isArray(md.ordem) ? md.ordem.filter((x) => MODULOS.includes(x as Modulo)) : []), ...MODULOS])] as Modulo[],
        ocultos: Array.isArray(md.ocultos) ? (md.ocultos.filter((x) => MODULOS.includes(x as Modulo)) as Modulo[]) : [],
      }
    : undefined;
  const tt = (o.titulos ?? {}) as Record<string, unknown>;
  const titulos: Partial<Record<ChaveTitulo, string>> = {};
  (Object.keys(TITULOS) as ChaveTitulo[]).forEach((k) => {
    const v = limpar(tt[k], 40);
    if (v) titulos[k] = v;
  });
  return {
    v: 1,
    tema,
    modo,
    simples,
    cores,
    tipografia,
    emblema,
    padrao,
    familia: um(FAMILIAS, o.familia),
    decoracao: um(["minimal", "balanced", "expressive"] as const, o.decoracao),
    estante,
    cabecalho: um(["editorial", "centered", "compact"] as const, o.cabecalho),
    cartoes: um(["editorial", "paper", "minimal", "vintage"] as const, o.cartoes),
    modulos,
    semRanking: o.semRanking === true ? true : undefined,
    titulos,
  };
}

/* ───────── resolvidos (com os padrões do tema) ───────── */
export const corDoPapel = (p: Paleta, papel: PapelCor) => p[papel];
export function familiaDe(id: Identidade): Familia {
  return id.familia ?? PADRAO_DO_TEMA[id.tema].familia;
}
export const decoracaoDe = (id: Identidade): Decoracao => id.decoracao ?? "balanced";
export const cabecalhoDe = (id: Identidade): Cabecalho => id.cabecalho ?? "editorial";
export const cartoesDe = (id: Identidade): EstiloCartao => id.cartoes ?? PADRAO_DO_TEMA[id.tema].cartoes;
export function padraoDe(id: Identidade): ConfigPadrao {
  return id.padrao ?? { tipo: PADRAO_DO_TEMA[id.tema].padrao, cor: "complementar", escala: 2, intensidade: 0.25, onde: ["banner"] };
}
export function emblemaDe(id: Identidade, nome: string): Emblema {
  const iniciais = nome
    .split(/\s+/)
    .filter((x) => x.length > 2 || /^[A-ZÀ-Ú]/.test(x))
    .map((x) => x[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  return id.emblema ?? { formato: PADRAO_DO_TEMA[id.tema].formato, texto: iniciais || nome.slice(0, 2).toUpperCase(), simbolo: PADRAO_DO_TEMA[id.tema].simbolo, fundo: "primaria", tinta: "fundo", noAvatar: false };
}
export function modulosDe(id: Identidade | null): ConfigModulos {
  return id?.modulos ?? { ordem: [...MODULOS], ocultos: [] };
}
export function tituloDe(id: Identidade | null, k: ChaveTitulo) {
  return id?.titulos?.[k] || TITULOS[k][0];
}

/** pattern em CSS puro (gradientes), nunca imagem enviada ou CSS do usuário */
export function padraoCss(tipo: Padrao, cor: string, escala: 1 | 2 | 3, intensidade: number): string | undefined {
  if (tipo === "nenhum") return undefined;
  const a = Math.round(Math.max(0.04, Math.min(0.6, intensidade)) * 255).toString(16).padStart(2, "0");
  const c = `${cor}${a}`;
  const s = [14, 22, 34][escala - 1];
  switch (tipo) {
    case "xadrez":
      return `repeating-conic-gradient(${c} 0 25%, transparent 0 50%) 0 0 / ${s * 2}px ${s * 2}px`;
    case "listras":
      return `repeating-linear-gradient(90deg, ${c} 0 ${s / 2}px, transparent ${s / 2}px ${s}px)`;
    case "vichy":
      return `repeating-linear-gradient(0deg, ${c} 0 ${s / 2}px, transparent ${s / 2}px ${s}px), repeating-linear-gradient(90deg, ${c} 0 ${s / 2}px, transparent ${s / 2}px ${s}px)`;
    case "diagonal":
      return `repeating-linear-gradient(45deg, ${c} 0 ${s / 3}px, transparent ${s / 3}px ${s}px)`;
    case "grade":
      return `linear-gradient(${c} 1px, transparent 1px) 0 0 / ${s}px ${s}px, linear-gradient(90deg, ${c} 1px, transparent 1px) 0 0 / ${s}px ${s}px`;
    case "losangos":
      return `linear-gradient(135deg, ${c} 25%, transparent 25%) ${-s / 2}px 0 / ${s}px ${s}px, linear-gradient(225deg, ${c} 25%, transparent 25%) ${-s / 2}px 0 / ${s}px ${s}px, linear-gradient(315deg, ${c} 25%, transparent 25%) 0 0 / ${s}px ${s}px, linear-gradient(45deg, ${c} 25%, transparent 25%) 0 0 / ${s}px ${s}px`;
    case "zigue":
      return `linear-gradient(135deg, ${c} 25%, transparent 25%) ${-s / 2}px 0 / ${s}px ${s / 2}px, linear-gradient(225deg, ${c} 25%, transparent 25%) ${-s / 2}px 0 / ${s}px ${s / 2}px, linear-gradient(315deg, ${c} 25%, transparent 25%) 0 0 / ${s}px ${s / 2}px, linear-gradient(45deg, ${c} 25%, transparent 25%) 0 0 / ${s}px ${s / 2}px`;
    case "bolas":
      return `radial-gradient(circle, ${c} 0 ${s / 3.2}px, transparent ${s / 3.2 + 0.5}px) 0 0 / ${s * 1.4}px ${s * 1.4}px`;
    case "floral":
      return `radial-gradient(circle at 50% 30%, ${c} 0 ${s / 7}px, transparent ${s / 7 + 0.5}px), radial-gradient(circle at 30% 50%, ${c} 0 ${s / 7}px, transparent ${s / 7 + 0.5}px), radial-gradient(circle at 70% 50%, ${c} 0 ${s / 7}px, transparent ${s / 7 + 0.5}px), radial-gradient(circle at 50% 70%, ${c} 0 ${s / 7}px, transparent ${s / 7 + 0.5}px) 0 0 / ${s * 1.6}px ${s * 1.6}px`;
    case "estrelas":
      return `radial-gradient(circle, ${c} 0 1.4px, transparent 2px) 0 0 / ${s}px ${s}px, radial-gradient(circle, ${c} 0 0.9px, transparent 1.4px) ${s / 2}px ${s / 3}px / ${s * 1.3}px ${s * 1.3}px`;
    case "pontilhado":
      return `radial-gradient(circle, ${c} 0 ${s / 10 + 0.8}px, transparent ${s / 10 + 1.3}px) 0 0 / ${s / 1.5}px ${s / 1.5}px`;
    case "geometrico":
      return `linear-gradient(45deg, ${c} 25%, transparent 25% 75%, ${c} 75%) 0 0 / ${s}px ${s}px, linear-gradient(45deg, ${c} 25%, transparent 25% 75%, ${c} 75%) ${s / 2}px ${s / 2}px / ${s}px ${s}px`;
    case "ondas":
      return `repeating-radial-gradient(circle at 50% 120%, transparent 0 ${s / 3}px, ${c} ${s / 3}px ${s / 3 + 2}px) 0 0 / ${s * 2}px ${s}px`;
    case "papel":
      return `repeating-linear-gradient(0deg, ${c} 0 1px, transparent 1px ${s}px)`;
    case "organico":
      return `radial-gradient(ellipse 40% 30% at 20% 30%, ${c} 0 60%, transparent 62%) 0 0 / ${s * 4}px ${s * 3}px, radial-gradient(ellipse 30% 40% at 75% 70%, ${c} 0 55%, transparent 57%) 0 0 / ${s * 4}px ${s * 3}px`;
  }
}

/** a paleta a partir de principal + complementar + atmosfera (modo simples) */
export function paletaSimples(principal: string, complementar: string, escuro: boolean): Paleta {
  if (escuro) {
    const fundo = misturar(principal, "#151112", 0.22);
    return {
      fundo,
      fundo2: misturar(principal, "#151112", 0.3),
      superficie: misturar(principal, "#1C1718", 0.28),
      primaria: ajustarContraste(misturar(principal, "#FFFFFF", 0.75), fundo, 4.5),
      complementar,
      destaque: misturar(complementar, "#FFFFFF", 0.7),
      texto: "#F3ECE2",
      textoSuave: "#CDBFB2",
      borda: misturar("#F3ECE2", fundo, 0.18),
      estante: misturar(principal, "#2A1B14", 0.4),
    };
  }
  const fundo = misturar(principal, "#FAF6EE", 0.07);
  return {
    fundo,
    fundo2: misturar(principal, "#FAF6EE", 0.14),
    superficie: misturar(principal, "#FFFDF8", 0.04),
    primaria: ajustarContraste(principal, fundo, 4.5),
    complementar,
    destaque: complementar,
    texto: ajustarContraste(misturar(principal, "#1E1A1A", 0.25), fundo, 7),
    textoSuave: ajustarContraste(misturar(principal, "#5A5050", 0.3), fundo, 4.5),
    borda: misturar(principal, "#FAF6EE", 0.18),
    estante: misturar(principal, "#9A7650", 0.35),
  };
}

export function paletaDe(id: Identidade): Paleta {
  const t = temaDoId(id.tema);
  const base = id.modo === "simples" && id.simples ? paletaSimples(id.simples.principal, id.simples.complementar, id.simples.escuro) : t.paleta;
  return id.modo === "avancado" ? { ...base, ...(id.cores ?? {}) } : base;
}
export const ehEscura = (p: Paleta) => luminancia(p.fundo) < 0.2;

/* ───────── contraste: o que precisa ficar legível ───────── */
export type Alerta = { campo: keyof Paleta; texto: string; grave: boolean; sugestao: string };
export function verificarContraste(p: Paleta): Alerta[] {
  const a: Alerta[] = [];
  const t = contraste(p.texto, p.fundo);
  if (t < 4.5) a.push({ campo: "texto", texto: `o texto tem pouco contraste com o fundo (${t.toFixed(1)}:1).`, grave: t < 3, sugestao: ajustarContraste(p.texto, p.fundo, 4.5) });
  const s = contraste(p.textoSuave, p.fundo);
  if (s < 3) a.push({ campo: "textoSuave", texto: `o texto secundário quase some no fundo (${s.toFixed(1)}:1).`, grave: s < 2, sugestao: ajustarContraste(p.textoSuave, p.fundo, 4.5) });
  const pr = contraste(p.primaria, p.fundo);
  if (pr < 3) a.push({ campo: "primaria", texto: `títulos e links na cor primária ficam fracos sobre o fundo (${pr.toFixed(1)}:1).`, grave: pr < 2, sugestao: ajustarContraste(p.primaria, p.fundo, 4.5) });
  const bt = contraste(p.fundo, p.primaria);
  if (bt >= 3 && bt < 4.5 && pr >= 3) a.push({ campo: "primaria", texto: `o texto dos botões fica no limite do legível (${bt.toFixed(1)}:1).`, grave: false, sugestao: ajustarContraste(p.primaria, p.fundo, 4.5) });
  return a;
}

/* ───────── tokens ───────── */
export function estiloDaIdentidade(id: Identidade): CSSProperties {
  const p = paletaDe(id);
  const t = temaDoId(id.tema);
  const tipo = TIPOGRAFIAS.find((x) => x.id === (id.tipografia ?? t.tipografia)) ?? TIPOGRAFIAS[0];
  const escura = ehEscura(p);
  const hover = misturar(p.primaria, escura ? "#FFFFFF" : "#000000", 0.85);
  const on = contraste(p.fundo, p.primaria) >= contraste("#FFFFFF", p.primaria) ? p.fundo : contraste("#FFFFFF", p.primaria) > contraste("#111111", p.primaria) ? "#FFFFFF" : "#111111";
  const acento = misturar(p.complementar, p.fundo, escura ? 0.35 : 0.28);
  return {
    // semânticos (para componentes novos)
    "--club-bg": p.fundo,
    "--club-bg-secondary": p.fundo2,
    "--club-surface": p.superficie,
    "--club-surface-elevated": misturar(p.superficie, escura ? "#FFFFFF" : "#FFFFFF", escura ? 0.92 : 0.6),
    "--club-surface-accent": acento,
    "--club-primary": p.primaria,
    "--club-primary-hover": hover,
    "--club-on-primary": on,
    "--club-secondary": p.complementar,
    "--club-tertiary": p.destaque,
    "--club-accent": p.destaque,
    "--club-text": p.texto,
    "--club-text-muted": p.textoSuave,
    "--club-border": p.borda,
    "--club-divider": p.borda,
    "--club-input-bg": p.superficie,
    "--club-progress-track": misturar(p.borda, p.fundo, 0.8),
    "--club-progress-fill": p.primaria,
    "--club-chart-1": p.primaria,
    "--club-chart-2": ajustarContraste(p.complementar, p.fundo, 2),
    "--club-chart-3": ajustarContraste(p.destaque, p.fundo, 2),
    "--club-shelf-color": corDaEstante(id, p),
    "--club-decoration-color": misturar(p.primaria, p.fundo, 0.35),
    "--club-heading-font": tipo.familia,
    "--club-heading-weight": String(tipo.peso),
    "--club-heading-style": tipo.italico ? "italic" : "normal",
    "--club-card-radius": `${t.raio}px`,
    "--club-banner": bannerDe(id, p),
    "--club-pattern": padraoCss(padraoDe(id).tipo, corDoPapel(p, padraoDe(id).cor), padraoDe(id).escala, padraoDe(id).intensidade) ?? "none",
    "--club-shelf-height": id.estante?.espessura === "fina" ? "18px" : id.estante?.espessura === "grossa" ? "34px" : "27px",
    ...estiloDosCartoes(cartoesDe(id), p),
    // os tokens do app, redefinidos dentro do clube (as telas existentes já usam esses)
    "--color-creme": p.fundo,
    "--color-jornal": p.fundo,
    "--color-mesa": p.fundo2,
    "--color-papel": p.superficie,
    "--color-creme-quente": p.superficie,
    "--color-rosa-fundo": acento,
    "--color-rosa-claro": misturar(p.complementar, p.fundo, 0.6),
    "--color-rosa-antigo": ajustarContraste(p.complementar, p.fundo, 2),
    "--color-bordo": p.primaria,
    "--color-bordo-escuro": hover,
    "--color-bordo-suave": hover,
    "--color-vinho": p.primaria,
    "--color-ameixa": p.texto,
    "--color-tinta": p.texto,
    "--color-tinta-suave": p.textoSuave,
    "--color-cinza": misturar(p.textoSuave, p.fundo, 0.85),
    "--color-grafite": misturar(p.textoSuave, p.fundo, 0.85),
    "--color-linha": p.borda,
    "--color-fio": p.borda,
    "--color-bege": misturar(p.borda, p.texto, 0.75),
    "--color-ouro": p.destaque,
    "--font-revista": tipo.familia,
    "--font-display": tipo.familia,
    colorScheme: escura ? "dark" : "light",
    color: p.texto,
  } as CSSProperties;
}

export function corDaEstante(id: Identidade, p: Paleta) {
  const e = id.estante;
  if (!e || e.estilo === "tema" || e.estilo === "minimalista") return p.estante;
  if (e.estilo === "personalizada") return e.cor ?? p.estante;
  return COR_ESTANTE[e.estilo] ?? p.estante;
}

/** o banner sem foto: o do tema, com o pattern por cima quando escolhido para o banner */
function bannerDe(id: Identidade, p: Paleta) {
  const t = temaDoId(id.tema);
  const pd = padraoDe(id);
  if (!id.padrao || !pd.onde.includes("banner")) return t.banner;
  const camada = padraoCss(pd.tipo, corDoPapel(p, pd.cor), pd.escala, Math.min(0.6, pd.intensidade + 0.15));
  return camada ? `${camada}, ${misturar(p.complementar, p.fundo, 0.35)}` : misturar(p.complementar, p.fundo, 0.35);
}

function estiloDosCartoes(e: EstiloCartao, p: Paleta): Record<string, string> {
  const r = (v: string) => ({ "--club-card-border-style": v });
  if (e === "paper") return { ...r("dashed"), "--club-card-shadow": `3px 3px 0 ${misturar(p.complementar, p.fundo, 0.55)}`, "--club-card-bg": p.superficie };
  if (e === "minimal") return { ...r("solid"), "--club-card-shadow": "none", "--club-card-bg": "transparent", "--club-card-border-color": "transparent" };
  if (e === "vintage") return { ...r("double"), "--club-card-shadow": "none", "--club-card-bg": p.superficie, "--club-card-border-width": "3px" };
  return { ...r("solid"), "--club-card-shadow": "none", "--club-card-bg": p.superficie };
}

/** identidade inicial para quem abre o studio pela primeira vez (parte da cor atual do clube) */
export function identidadeInicial(corAtual?: string | null): Identidade {
  if (corAtual && ehHex(corAtual))
    return { v: 1, tema: "botanical", modo: "simples", simples: { principal: corAtual, complementar: "#D8A9AD", escuro: false } };
  return { v: 1, tema: "botanical", modo: "tema" };
}

/* cache local: aplica o tema antes do clube carregar (sem piscar a cor errada) */
const CACHE = "bookside-identidade-clube-";
export function identidadeEmCache(clubeId: string): Identidade | null {
  try {
    return lerIdentidade(JSON.parse(localStorage.getItem(CACHE + clubeId) ?? "null"));
  } catch {
    return null;
  }
}
export function guardarIdentidadeEmCache(clubeId: string, id: Identidade | null) {
  try {
    if (id) localStorage.setItem(CACHE + clubeId, JSON.stringify(id));
    else localStorage.removeItem(CACHE + clubeId);
  } catch {
    /* sem armazenamento */
  }
}
