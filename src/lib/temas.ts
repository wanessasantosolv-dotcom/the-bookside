/**
 * A coleção de temas pessoais do The Bookside: oito identidades, cada uma com
 * variante clara e escura feitas à mão, tipografia, símbolo, pattern, estante
 * e intensidade decorativa próprias. Tema e aparência (claro/escuro/sistema)
 * são escolhas independentes.
 *
 * Os temas antigos (lib/dados → temas) continuam funcionando para quem já os
 * usa e para os clubes; a tela de edição mostra só esta coleção.
 */
import type { CSSProperties } from "react";

export type Variante = {
  fundo: string;
  superficie: string;
  primaria: string;
  secundaria: string;
  acento: string;
  acento2?: string;
  texto: string;
  borda: string;
  sobrePrimaria: string;
  /** fundo dos blocos de destaque (cartões cheios, como "meu capítulo") */
  bloco: string;
  /** texto sobre o bloco */
  sobreBloco: string;
  /** estante no modo automático */
  estante: string;
};

export type FonteTitulo = "fraunces" | "playfair" | "dm-serif" | "manrope" | "inter";

export type SimboloTema = "livro" | "estrela" | "grade" | "lua" | "arco" | "ramo" | "borboleta" | "rosa";

export type TemaApp = {
  id: string;
  nome: string;
  descricao: string;
  simbolo: SimboloTema;
  claro: Variante;
  escuro: Variante;
  fonte: FonteTitulo;
  /** fonte dos títulos grandes no celular (font-display); sem ela, a mesma de `fonte` */
  fonteDisplay?: FonteTitulo;
  /** peso dos títulos editoriais (undefined: o do componente) */
  peso?: number;
  /** títulos em itálico onde o app usa itálico */
  italico: boolean;
  /** cantos retos (fine print) */
  reto?: boolean;
  /** decoração recomendada */
  decoracao: Decoracao;
  /** desenho do banner gráfico do tema */
  banner: "linhas" | "estrelas" | "xadrez" | "grade" | "constelacao" | "arcos" | "folhas" | "borboletas" | "ornamento";
};

export type Decoracao = "minimal" | "editorial" | "expressive";
export type EstiloEstante = "auto" | "clara" | "escura" | "tema" | "minimalista";

export const TEMAS_APP: TemaApp[] = [
  {
    id: "the-original",
    nome: "the original.",
    descricao: "editorial clássico",
    simbolo: "livro",
    fonte: "fraunces",
    fonteDisplay: "playfair",
    italico: true,
    decoracao: "editorial",
    banner: "linhas",
    claro: {
      fundo: "#F6F0E5", superficie: "#EDE1D9", primaria: "#692536", secundaria: "#59634F", acento: "#ECAABB",
      texto: "#38252C", borda: "#D8C9BF", sobrePrimaria: "#F6F0E5", bloco: "#692536", sobreBloco: "#F6F0E5", estante: "#9A6B43",
    },
    escuro: {
      fundo: "#21191D", superficie: "#35272E", primaria: "#ECAABB", secundaria: "#A8B397", acento: "#80374D",
      texto: "#F2E4DB", borda: "#503B45", sobrePrimaria: "#21191D", bloco: "#80374D", sobreBloco: "#F6F0E5", estante: "#7A5235",
    },
  },
  {
    id: "plot-twist",
    nome: "plot twist!",
    descricao: "Y2K e Tumblr",
    simbolo: "estrela",
    fonte: "manrope",
    peso: 800,
    italico: false,
    decoracao: "expressive",
    banner: "xadrez",
    claro: {
      fundo: "#F2D9E9", superficie: "#E3D2F1", primaria: "#752963", secundaria: "#B5A2E3", acento: "#D9ED58", acento2: "#EC8DC5",
      texto: "#39253D", borda: "#C5A4CF", sobrePrimaria: "#FFFFFF", bloco: "#752963", sobreBloco: "#FFFFFF", estante: "#B5A2E3",
    },
    escuro: {
      fundo: "#291D36", superficie: "#40304E", primaria: "#F0B4DA", secundaria: "#9B85C8", acento: "#D9ED58", acento2: "#EC8DC5",
      texto: "#F5E8F6", borda: "#5C446D", sobrePrimaria: "#291D36", bloco: "#5E2450", sobreBloco: "#F5E8F6", estante: "#9B85C8",
    },
  },
  {
    id: "fine-print",
    nome: "fine print.",
    descricao: "minimalismo modernista",
    simbolo: "grade",
    fonte: "inter",
    peso: 600,
    italico: false,
    reto: true,
    decoracao: "minimal",
    banner: "grade",
    claro: {
      fundo: "#F2F0EB", superficie: "#E5E3DE", primaria: "#1D1D1D", secundaria: "#696969", acento: "#CC332D",
      texto: "#1D1D1D", borda: "#C8C7C2", sobrePrimaria: "#FFFFFF", bloco: "#1D1D1D", sobreBloco: "#F2F0EB", estante: "#1D1D1D",
    },
    escuro: {
      fundo: "#191919", superficie: "#262626", primaria: "#E8E8E3", secundaria: "#A4A4A0", acento: "#EF6256",
      texto: "#F2F0EB", borda: "#414141", sobrePrimaria: "#191919", bloco: "#2E2E2E", sobreBloco: "#F2F0EB", estante: "#A4A4A0",
    },
  },
  {
    id: "moon-chapter",
    nome: "the moon chapter.",
    descricao: "celestial e mágico",
    simbolo: "lua",
    fonte: "playfair",
    italico: true,
    decoracao: "editorial",
    banner: "constelacao",
    claro: {
      fundo: "#E5EAF2", superficie: "#D1D9ED", primaria: "#263C85", secundaria: "#6478B7", acento: "#C5A66E", acento2: "#B6C3EB",
      texto: "#26314D", borda: "#B7C2DB", sobrePrimaria: "#FFFFFF", bloco: "#263C85", sobreBloco: "#FFFFFF", estante: "#2E3D6B",
    },
    escuro: {
      fundo: "#151D38", superficie: "#253456", primaria: "#BDC9FF", secundaria: "#879ACC", acento: "#DDC48A", acento2: "#364979",
      texto: "#EDF0FC", borda: "#43547C", sobrePrimaria: "#151D38", bloco: "#2C3E78", sobreBloco: "#EDF0FC", estante: "#364979",
    },
  },
  {
    id: "paperback-72",
    nome: "paperback '72.",
    descricao: "vintage e mid-century",
    simbolo: "arco",
    fonte: "dm-serif",
    italico: false,
    decoracao: "editorial",
    banner: "arcos",
    claro: {
      fundo: "#F5E5CB", superficie: "#E9D3AC", primaria: "#963A1E", secundaria: "#6A7043", acento: "#D9A23B", acento2: "#BC764B",
      texto: "#503626", borda: "#CFB58D", sobrePrimaria: "#FFF4E2", bloco: "#963A1E", sobreBloco: "#FFF4E2", estante: "#8A5A2B",
    },
    escuro: {
      fundo: "#30251B", superficie: "#443326", primaria: "#E5B16D", secundaria: "#989C59", acento: "#C9683C", acento2: "#D9A23B",
      texto: "#F0DFC5", borda: "#644B34", sobrePrimaria: "#30251B", bloco: "#8E3B20", sobreBloco: "#FFF4E2", estante: "#6E4A2C",
    },
  },
  {
    id: "between-the-leaves",
    nome: "between the leaves.",
    descricao: "botânico e natural",
    simbolo: "ramo",
    fonte: "fraunces",
    italico: false,
    decoracao: "editorial",
    banner: "folhas",
    claro: {
      fundo: "#E8EBDC", superficie: "#D7DDCA", primaria: "#40543A", secundaria: "#788A65", acento: "#D0B7A1", acento2: "#A5B18A",
      texto: "#34432D", borda: "#BAC4AD", sobrePrimaria: "#F4F3E8", bloco: "#40543A", sobreBloco: "#F4F3E8", estante: "clara",
    },
    escuro: {
      fundo: "#202820", superficie: "#303B2F", primaria: "#C3D2A4", secundaria: "#7B936A", acento: "#C6A58D", acento2: "#566C4D",
      texto: "#E6EBDD", borda: "#465642", sobrePrimaria: "#202820", bloco: "#3F5238", sobreBloco: "#F4F3E8", estante: "#8A6A48",
    },
  },
  {
    id: "daydream",
    nome: "daydream.",
    descricao: "lilás e dreamy indie",
    simbolo: "borboleta",
    fonte: "playfair",
    italico: true,
    decoracao: "editorial",
    banner: "borboletas",
    claro: {
      fundo: "#EEE5FA", superficie: "#DDD0F1", primaria: "#684599", secundaria: "#9676C4", acento: "#B69ADD", acento2: "#C3CDD9",
      texto: "#3E2B58", borda: "#D7C5EB", sobrePrimaria: "#FFFFFF", bloco: "#684599", sobreBloco: "#FFFFFF", estante: "#B69ADD",
    },
    escuro: {
      fundo: "#251B37", superficie: "#403052", primaria: "#CDB5F1", secundaria: "#9676C4", acento: "#B69ADD", acento2: "#D3D7E5",
      texto: "#F0E8FC", borda: "#57436D", sobrePrimaria: "#251B37", bloco: "#55397F", sobreBloco: "#F0E8FC", estante: "#6E5596",
    },
  },
  {
    id: "red-prose",
    nome: "red prose.",
    descricao: "vinho e dark romantic",
    simbolo: "rosa",
    fonte: "playfair",
    peso: 600,
    italico: true,
    decoracao: "editorial",
    banner: "ornamento",
    claro: {
      fundo: "#F0DDE0", superficie: "#E3C3CC", primaria: "#601329", secundaria: "#87334B", acento: "#A75B70", acento2: "#C3A47F",
      texto: "#400D1E", borda: "#D6B5BE", sobrePrimaria: "#FFF0F2", bloco: "#601329", sobreBloco: "#FFF0F2", estante: "#5A1A2A",
    },
    escuro: {
      fundo: "#260D17", superficie: "#3D1021", primaria: "#E5B8C4", secundaria: "#A75B70", acento: "#87334B", acento2: "#C3A47F",
      texto: "#F4DFE5", borda: "#633247", sobrePrimaria: "#260D17", bloco: "#501326", sobreBloco: "#F4DFE5", estante: "#501326",
    },
  },
];

/** o tema antigo "biblioteca clássica" (o padrão de sempre) é a mesma assinatura do the original */
const APELIDOS: Record<string, string> = { "biblioteca-classica": "the-original" };

export function temaApp(id: string | null | undefined): TemaApp | undefined {
  if (!id) return undefined;
  const real = APELIDOS[id] ?? id;
  return TEMAS_APP.find((t) => t.id === real);
}

/** o tema escolhido é um dos antigos (fora da coleção)? */
export function ehTemaLegado(id: string | null | undefined) {
  return !!id && !temaApp(id);
}

const mix = (a: string, pct: number, b: string) => `color-mix(in srgb, ${a} ${pct}%, ${b})`;

const FONTES: Record<FonteTitulo, string> = {
  fraunces: "var(--font-fraunces), Georgia, serif",
  playfair: "var(--font-playfair), Georgia, serif",
  "dm-serif": "var(--font-dm-serif), Georgia, serif",
  manrope: "var(--font-manrope), system-ui, sans-serif",
  inter: "var(--font-inter), system-ui, sans-serif",
};

/** o desenho do banner gráfico do tema, nas cores da variante */
export function bannerDoTema(t: TemaApp, v: Variante): string {
  const a = v.acento;
  const p = v.primaria;
  const f = v.superficie;
  const s = v.secundaria;
  switch (t.banner) {
    case "linhas":
      return `repeating-linear-gradient(90deg, ${mix(a, 70, "transparent")} 0 2px, transparent 2px 14px), ${f}`;
    case "xadrez":
      return `conic-gradient(${mix(v.acento2 ?? a, 55, "transparent")} 25%, transparent 0 50%, ${mix(v.acento2 ?? a, 55, "transparent")} 0 75%, transparent 0) 0 0 / 28px 28px, radial-gradient(circle at 78% 40%, ${a} 0 22px, transparent 23px), ${f}`;
    case "grade":
      return `linear-gradient(${mix(v.texto, 14, "transparent")} 1px, transparent 1px) 0 0 / 100% 24px, linear-gradient(90deg, ${mix(v.texto, 14, "transparent")} 1px, transparent 1px) 0 0 / 24px 100%, linear-gradient(90deg, transparent 72%, ${a} 72% 73%, transparent 73%), ${f}`;
    case "constelacao":
      return `radial-gradient(circle, ${a} 1.2px, transparent 1.8px) 0 0 / 46px 46px, radial-gradient(circle, ${mix(v.texto, 45, "transparent")} 0.8px, transparent 1.3px) 23px 17px / 46px 46px, radial-gradient(circle at 82% 50%, transparent 30px, ${mix(a, 60, "transparent")} 31px 32px, transparent 33px), ${f}`;
    case "arcos":
      return `radial-gradient(circle at 20% 120%, ${p} 0 42px, transparent 43px), radial-gradient(circle at 20% 120%, ${a} 0 64px, transparent 65px), radial-gradient(circle at 20% 120%, ${s} 0 86px, transparent 87px), repeating-linear-gradient(0deg, ${mix(v.acento2 ?? a, 30, "transparent")} 0 3px, transparent 3px 12px), ${f}`;
    case "folhas":
      return `radial-gradient(ellipse 7px 14px at 50% 50%, ${mix(s, 45, "transparent")} 98%, transparent) 0 0 / 34px 34px, radial-gradient(ellipse 7px 14px at 50% 50%, ${mix(v.acento2 ?? s, 40, "transparent")} 98%, transparent) 17px 17px / 34px 34px, ${f}`;
    case "borboletas":
      return `radial-gradient(circle at 30% 40%, ${mix(a, 45, "transparent")} 0 38px, transparent 39px), radial-gradient(circle at 72% 65%, ${mix(v.acento2 ?? a, 60, "transparent")} 0 54px, transparent 55px), radial-gradient(circle, ${mix(v.texto, 25, "transparent")} 1px, transparent 1.6px) 0 0 / 30px 30px, ${f}`;
    case "ornamento":
      return `radial-gradient(circle at 50% 50%, transparent 9px, ${mix(v.acento2 ?? a, 55, "transparent")} 10px 11px, transparent 12px) 0 0 / 36px 36px, linear-gradient(${mix(p, 18, "transparent")}, ${mix(p, 18, "transparent")}), ${f}`;
    case "estrelas":
      return `radial-gradient(circle, ${p} 1px, transparent 1.6px) 0 0 / 22px 22px, ${f}`;
  }
}

/**
 * Todos os tokens do app para um tema numa variante: fundos, superfícies,
 * textos, bordas, destaques, blocos, estante, banner e tipografia.
 */
export function tokensDoTema(t: TemaApp, escuro: boolean): CSSProperties {
  const v = escuro ? t.escuro : t.claro;
  const fundo2 = escuro ? mix(v.fundo, 82, "#000000") : mix(v.fundo, 92, v.texto);
  return {
    colorScheme: escuro ? "dark" : "light",
    "--color-creme": v.fundo,
    "--color-jornal": v.fundo,
    "--color-mesa": fundo2,
    "--color-papel": v.superficie,
    "--color-creme-quente": mix(v.superficie, 45, v.fundo),
    "--color-bordo": v.primaria,
    "--color-bordo-escuro": v.primaria,
    "--color-vinho": v.primaria,
    "--color-bordo-suave": mix(v.primaria, 84, v.texto),
    "--color-rosa-antigo": v.secundaria,
    "--color-rosa-claro": mix(v.acento, 60, v.fundo),
    "--color-rosa-fundo": mix(v.primaria, 11, v.fundo),
    "--color-ameixa": v.texto,
    "--color-tinta": v.texto,
    "--color-tinta-suave": mix(v.texto, 84, v.fundo),
    "--color-cinza": mix(v.texto, 78, v.fundo),
    "--color-grafite": mix(v.texto, 78, v.fundo),
    "--color-linha": v.borda,
    "--color-fio": v.borda,
    "--color-bege": mix(v.borda, 72, v.texto),
    "--color-oliva": v.secundaria,
    "--color-ouro": v.acento2 ?? v.acento,
    // blocos de destaque (.inverso) no modo escuro
    "--inverso-bordo": v.bloco,
    "--inverso-bordo-escuro": mix(v.bloco, 80, "#000000"),
    "--inverso-bordo-suave": mix(v.bloco, 85, v.sobreBloco),
    "--inverso-rosa-claro": mix(v.acento, 55, v.sobreBloco),
    "--inverso-rosa-antigo": v.acento,
    "--inverso-rosa-fundo": mix(v.bloco, 14, v.sobreBloco),
    "--inverso-texto": v.sobreBloco,
    // estante, banner e tipografia
    "--tema-estante": v.estante,
    "--tema-banner": bannerDoTema(t, v),
    "--tema-primaria": v.primaria,
    "--tema-acento": v.acento,
    "--font-display": FONTES[t.fonteDisplay ?? t.fonte],
    "--font-revista": FONTES[t.fonte],
    // sem peso próprio: "initial" deixa valer o peso do componente
    "--peso-titulo": t.peso ? String(t.peso) : "initial",
    "--titulo-estilo": t.italico ? "italic" : "normal",
  } as CSSProperties;
}

/** os atributos que o <html> (ou a área do perfil) recebe com o tema */
export function atributosDoTema(t: TemaApp | undefined) {
  return {
    "data-tema-app": t?.id,
    "data-titulo-app": t && !t.italico ? "reto" : undefined,
    "data-peso-app": t?.peso ? "1" : undefined,
    "data-cantos-app": t?.reto ? "retos" : undefined,
  };
}

/** a cor da estante para a escolha da pessoa (auto: a do tema) */
/** a estante clareia (madeira clara) em vez de tingir? */
export function estanteClareia(estilo: EstiloEstante | undefined, t: TemaApp | undefined, escuro: boolean) {
  const v = t ? (escuro ? t.escuro : t.claro) : undefined;
  return estilo === "clara" || ((!estilo || estilo === "auto") && v?.estante === "clara");
}

export function corDaEstanteApp(estilo: EstiloEstante | undefined, t: TemaApp | undefined, escuro: boolean) {
  const v = t ? (escuro ? t.escuro : t.claro) : undefined;
  switch (estilo) {
    case "clara":
      return "#8f7457";
    case "escura":
      return "#4A2F22";
    case "tema":
      return v?.primaria ?? null;
    case "minimalista":
      return v?.texto ?? null;
    default:
      // the original: a madeira natural, sem tinta
      if (t?.id === "the-original") return null;
      return v?.estante === "clara" ? "#8f7457" : (v?.estante ?? null);
  }
}

// ───────── contraste (WCAG) ─────────

function lum(hex: string) {
  const n = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contraste(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}
