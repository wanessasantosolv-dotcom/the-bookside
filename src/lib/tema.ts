import type { CSSProperties } from "react";
import { temas, type Tema } from "@/lib/dados";

const mistura = (cor: string, pct: number, com: string) =>
  `color-mix(in srgb, ${cor} ${pct}%, ${com})`;

/** o tema tem papel escuro (noite de tinta, veludo vinho…)? */
export function temaEhEscuro(t: Tema | undefined | null) {
  return !!t && "escuro" in t;
}

/**
 * Destaque de um tema escuro quando o app está no modo claro: o destaque
 * original é claro (feito para o papel escuro), então escurece para ler no creme.
 */
function destaqueClaroDeTemaEscuro(t: Tema) {
  if (t.id === "preto-e-branco") return "#111111";
  return mistura(t.destaque, 60, "#2B1420");
}

/** o modo escuro do app, quando quem chama não sabe (lê do <html>) */
function modoEscuroAtual(modoEscuroDoApp?: boolean) {
  return (
    modoEscuroDoApp ??
    (typeof document !== "undefined" &&
      document.documentElement.dataset.modo === "escuro")
  );
}

/**
 * Aplica um tema (os mesmos do perfil) numa área.
 *
 * - modo claro do app: o papel fica creme e só o destaque muda (também nos
 *   temas escuros, que ganham uma versão clara do destaque);
 * - modo escuro do app: temas claros ficam no escuro padrão com o destaque
 *   clareado; temas escuros usam o papel escuro deles.
 *
 * Biblioteca clássica é o visual padrão do app, então não troca nada.
 */
export function coresDoTema(
  id: string | null | undefined,
  modoEscuroDoApp?: boolean,
): CSSProperties | undefined {
  const t = temas.find((x) => x.id === id);
  if (!t || t.id === "biblioteca-classica") return undefined;
  const escuro = temaEhEscuro(t);
  const modoEscuro = modoEscuroAtual(modoEscuroDoApp);

  if (!modoEscuro) {
    // modo claro: papel creme, só o destaque muda
    // (títulos, botões, abas, links e os toques de cor)
    const destaque = escuro ? destaqueClaroDeTemaEscuro(t) : t.texto;
    const suave = escuro ? destaque : t.destaque;
    return {
      "--color-bordo": destaque,
      "--color-bordo-escuro": destaque,
      "--color-bordo-suave": suave,
      "--color-vinho": destaque,
      "--color-rosa-antigo": suave,
      "--color-rosa-claro": mistura(escuro ? t.destaque : suave, 40, "#F9F5EE"),
      "--color-rosa-fundo": mistura(escuro ? t.destaque : suave, 12, "#F9F5EE"),
    } as CSSProperties;
  }

  // blocos de destaque (.inverso) no modo escuro: a cor forte do tema, como no modo claro
  const forte = escuro ? destaqueClaroDeTemaEscuro(t) : t.texto;
  const inverso = {
    "--inverso-bordo": forte,
    "--inverso-bordo-escuro": mistura(forte, 80, "#000000"),
    "--inverso-bordo-suave": escuro ? forte : t.destaque,
    "--inverso-rosa-claro": mistura(escuro ? t.destaque : t.destaque, 40, "#F9F5EE"),
    "--inverso-rosa-antigo": escuro ? forte : t.destaque,
    "--inverso-rosa-fundo": mistura(t.destaque, 12, "#F9F5EE"),
  };

  if (!escuro) {
    // tema claro no modo escuro: o destaque clareia para dar leitura
    // e os fundos rosados misturam com o escuro
    const claro = mistura(t.destaque, 65, "#F5EFE6");
    return {
      "--color-bordo": claro,
      "--color-bordo-escuro": claro,
      "--color-bordo-suave": claro,
      "--color-vinho": claro,
      "--color-rosa-antigo": mistura(t.destaque, 80, "#F5EFE6"),
      // o fundo escuro acompanha o tema (um escuro neutro tingido pela cor do tema), não o vinho do app
      "--color-creme": mistura(t.destaque, 7, "#141214"),
      "--color-jornal": mistura(t.destaque, 7, "#141214"),
      "--color-mesa": mistura(t.destaque, 5, "#0d0c0d"),
      "--color-creme-quente": mistura(t.destaque, 9, "#1d1b1d"),
      "--color-papel": mistura(t.destaque, 10, "#222023"),
      "--color-linha": mistura(t.destaque, 14, "#333034"),
      "--color-fio": mistura(t.destaque, 14, "#333034"),
      "--color-bege": mistura(t.destaque, 18, "#4a464b"),
      "--color-cinza": mistura(t.destaque, 10, "#b0abaf"),
      "--color-grafite": mistura(t.destaque, 10, "#b0abaf"),
      "--color-rosa-fundo": mistura(t.destaque, 18, "#141214"),
      "--color-rosa-claro": mistura(t.destaque, 45, "#141214"),
      ...inverso,
    } as CSSProperties;
  }

  // tema escuro no modo escuro: a página inteira usa o papel do tema
  return {
    ...inverso,
    "--color-bordo": t.destaque,
    "--color-bordo-escuro": t.destaque,
    "--color-bordo-suave": t.destaque,
    "--color-vinho": t.destaque,
    "--color-rosa-antigo": t.destaque,
    "--color-creme": t.papel,
    "--color-jornal": t.papel,
    "--color-papel": mistura("#FFFFFF", 5, t.papel),
    "--color-mesa": mistura("#000000", 25, t.papel),
    "--color-creme-quente": mistura("#FFFFFF", 7, t.papel),
    "--color-rosa-fundo": mistura(t.destaque, 16, t.papel),
    "--color-rosa-claro": mistura(t.destaque, 55, t.papel),
    "--color-ameixa": "#F5EFE6",
    "--color-tinta": "#F5EFE6",
    "--color-tinta-suave": "#E8DED4",
    "--color-cinza": "#CFC3B8",
    "--color-grafite": "#CFC3B8",
    "--color-linha": "rgba(245,239,230,.18)",
    "--color-fio": "rgba(245,239,230,.18)",
    "--color-bege": "rgba(245,239,230,.28)",
    color: "#F5EFE6",
  } as CSSProperties;
}

/**
 * Variáveis da página de perfil (a minha e a das outras leitoras).
 * Segue a mesma regra de `coresDoTema`: o papel escuro do tema só aparece
 * no modo escuro do app; no modo claro, o perfil fica no creme.
 */
export function estiloDoPerfil(tema: Tema, modoEscuro: boolean): CSSProperties {
  const escuro = temaEhEscuro(tema);
  const papelEscuro = escuro && modoEscuro;
  const acc = papelEscuro
    ? tema.texto
    : escuro
      ? destaqueClaroDeTemaEscuro(tema)
      : tema.id === "biblioteca-classica"
        ? "#6B0D24"
        : tema.texto;
  return {
    "--papel": papelEscuro ? tema.papel : "var(--color-creme)",
    "--tinta": papelEscuro ? "#F5EFE6" : "var(--color-ameixa)",
    "--acc-base": acc,
    "--suave": papelEscuro ? "#CFC3B8" : "var(--color-cinza)",
    "--linha": papelEscuro ? "rgba(245,239,230,.18)" : "var(--color-linha)",
  } as CSSProperties;
}

/** destaque do perfil na versão web (papel sempre do app) */
export function destaqueWebDoTema(tema: Tema) {
  if (tema.id === "biblioteca-classica") return "#692536";
  return temaEhEscuro(tema) ? destaqueClaroDeTemaEscuro(tema) : tema.destaque;
}
