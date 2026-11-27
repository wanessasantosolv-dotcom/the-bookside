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
      texto: "#38252C", borda: "#DCCDC8", sobrePrimaria: "#F6F0E5", bloco: "#692536", sobreBloco: "#F6F0E5", estante: "#9A6B43",
    },
    escuro: {
      fundo: "#21191D", superficie: "#392A32", primaria: "#ECAABB", secundaria: "#A8B397", acento: "#8297D1",
      texto: "#F2E4DB", borda: "#523B46", sobrePrimaria: "#21191D", bloco: "#52303E", sobreBloco: "#F2E4DB", estante: "#7A5235",
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
      fundo: "#F5EFE9", superficie: "#EDE0E6", primaria: "#874C70", secundaria: "#C6CA91", acento: "#D6ADC7",
      texto: "#44333F", borda: "#D9D1CE", sobrePrimaria: "#F5EFE9", bloco: "#874C70", sobreBloco: "#F5EFE9", estante: "#C6CA91",
    },
    escuro: {
      fundo: "#251F26", superficie: "#483747", primaria: "#D6ADC7", secundaria: "#7E7D61", acento: "#8F7487",
      texto: "#EDE3EC", borda: "#49424A", sobrePrimaria: "#251F26", bloco: "#6A3E5A", sobreBloco: "#EDE3EC", estante: "#6E5A6C",
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
      fundo: "#F2EFE9", superficie: "#E5E1D9", primaria: "#373532", secundaria: "#B9B4AB", acento: "#A65349",
      texto: "#373532", borda: "#D4D1CC", sobrePrimaria: "#F2EFE9", bloco: "#373532", sobreBloco: "#F2EFE9", estante: "#373532",
    },
    escuro: {
      fundo: "#222120", superficie: "#393735", primaria: "#DBD7CE", secundaria: "#75726C", acento: "#713F39",
      texto: "#EDEBE5", borda: "#474543", sobrePrimaria: "#222120", bloco: "#312F2D", sobreBloco: "#EDEBE5", estante: "#8A857D",
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
      fundo: "#EEEFF1", superficie: "#E1E5ED", primaria: "#414D70", secundaria: "#BAA47D", acento: "#A5B0CA",
      texto: "#343A4B", borda: "#D0D2D6", sobrePrimaria: "#EEEFF1", bloco: "#414D70", sobreBloco: "#EEEFF1", estante: "#414D70",
    },
    escuro: {
      fundo: "#20232D", superficie: "#343C4F", primaria: "#B5C1DE", secundaria: "#756A59", acento: "#70788B",
      texto: "#E3E6EE", borda: "#434650", sobrePrimaria: "#20232D", bloco: "#37405C", sobreBloco: "#E3E6EE", estante: "#3E4863",
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
      fundo: "#F5EEE1", superficie: "#ECE0CB", primaria: "#8C523A", secundaria: "#84876C", acento: "#C9A36C",
      texto: "#4C3E32", borda: "#DAD2C5", sobrePrimaria: "#F5EEE1", bloco: "#8C523A", sobreBloco: "#F5EEE1", estante: "#8A5A2B",
    },
    escuro: {
      fundo: "#29231E", superficie: "#48382C", primaria: "#D3AF89", secundaria: "#5B5A49", acento: "#89704D",
      texto: "#EFE2CF", borda: "#4D453E", sobrePrimaria: "#29231E", bloco: "#784B37", sobreBloco: "#EFE2CF", estante: "#6E4A2C",
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
      fundo: "#EFF0E7", superficie: "#E0E5D6", primaria: "#52654B", secundaria: "#C6AF9A", acento: "#A9B49A",
      texto: "#394635", borda: "#D2D5CB", sobrePrimaria: "#EFF0E7", bloco: "#52654B", sobreBloco: "#EFF0E7", estante: "clara",
    },
    escuro: {
      fundo: "#222820", superficie: "#364234", primaria: "#B9C6A7", secundaria: "#7C7263", acento: "#737C69",
      texto: "#E3E8DB", borda: "#454B42", sobrePrimaria: "#222820", bloco: "#44533E", sobreBloco: "#E3E8DB", estante: "#8A6A48",
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
      fundo: "#F3EFF5", superficie: "#E8E0EE", primaria: "#6C5882", secundaria: "#C5C3D0", acento: "#B9A6CD",
      texto: "#493D53", borda: "#D8D3DB", sobrePrimaria: "#F3EFF5", bloco: "#6C5882", sobreBloco: "#F3EFF5", estante: "#B9A6CD",
    },
    escuro: {
      fundo: "#25212C", superficie: "#40364D", primaria: "#C7B5DC", secundaria: "#7D7A86", acento: "#7E718D",
      texto: "#EBE4F0", borda: "#49444F", sobrePrimaria: "#25212C", bloco: "#5E4E6E", sobreBloco: "#EBE4F0", estante: "#6E5F80",
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
      fundo: "#F4EAE9", superficie: "#EAD7DC", primaria: "#702A40", secundaria: "#BFA78B", acento: "#BC8697",
      texto: "#492D36", borda: "#D9CCCC", sobrePrimaria: "#F4EAE9", bloco: "#702A40", sobreBloco: "#F4EAE9", estante: "#5A1A2A",
    },
    escuro: {
      fundo: "#291C23", superficie: "#472B39", primaria: "#D5A5B6", secundaria: "#7C685C", acento: "#815C69",
      texto: "#EFE0E5", borda: "#4D3F46", sobrePrimaria: "#291C23", bloco: "#5B2637", sobreBloco: "#EFE0E5", estante: "#5A2A3A",
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
    // a tipografia é a mesma em todos os temas (a do the bookside): só cores e desenhos mudam
    "--peso-titulo": "initial",
    "--titulo-estilo": "italic",
  } as CSSProperties;
}

/** os atributos que o <html> (ou a área do perfil) recebe com o tema */
export function atributosDoTema(t: TemaApp | undefined) {
  // a geometria (cantos, pesos) é a mesma em todos os temas
  return { "data-tema-app": t?.id };
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

/** a estante do perfil (no escopo da página do perfil): a cor e o atributo do acabamento */
export function estanteDoPerfil(estilo: EstiloEstante | undefined, id: string | null | undefined, escuro: boolean) {
  const t = temaApp(id);
  const cor = corDaEstanteApp(estilo ?? "auto", t, escuro);
  return {
    estilo: (cor ? { "--app-estante": cor } : {}) as CSSProperties,
    atributo: estilo === "minimalista" ? "minimalista" : estanteClareia(estilo, t, escuro) ? "clara" : undefined,
  };
}
