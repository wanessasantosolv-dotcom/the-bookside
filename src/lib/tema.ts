import type { CSSProperties } from "react";
import { temas } from "@/lib/dados";

/**
 * Aplica um tema (os mesmos do perfil) numa área: nos temas claros muda só a
 * cor de destaque, como no perfil; no tema escuro, a página toda escurece.
 * Biblioteca clássica é o visual padrão do app, então não troca nada.
 */
export function coresDoTema(
  id: string | null | undefined,
  modoEscuroDoApp?: boolean,
): CSSProperties | undefined {
  const t = temas.find((x) => x.id === id);
  if (!t || t.id === "biblioteca-classica") return undefined;
  const escuro = "escuro" in t;
  const mistura = (cor: string, pct: number, com: string) =>
    `color-mix(in srgb, ${cor} ${pct}%, ${com})`;

  // temas claros: o papel ganha a cor do tema (cada um com o seu fundo),
  // os cartões ficam um tom mais claro, e o destaque muda junto
  const destaque = escuro ? t.destaque : t.texto;
  const cores: Record<string, string> = {
    "--color-bordo": destaque,
    "--color-bordo-escuro": destaque,
    "--color-bordo-suave": t.destaque,
    "--color-vinho": destaque,
    "--color-rosa-antigo": t.destaque,
    "--color-rosa-claro": mistura(t.destaque, 40, "#F9F5EE"),
    "--color-rosa-fundo": mistura(t.destaque, 12, "#F9F5EE"),
  };
  // no modo escuro do app o papel claro não entra (o fundo continua escuro)
  const modoEscuro =
    modoEscuroDoApp ??
    (typeof document !== "undefined" &&
      document.documentElement.dataset.modo === "escuro");
  if (!escuro && !modoEscuro)
    Object.assign(cores, {
      "--color-creme": t.papel,
      "--color-jornal": t.papel,
      "--color-papel": t.papel,
      "--color-creme-quente": mistura("#FFFFFF", 45, t.papel),
      "--color-rosa-fundo": mistura(t.destaque, 12, t.papel),
      "--color-rosa-claro": mistura(t.destaque, 40, t.papel),
    });
  if (!escuro && modoEscuro)
    // tema claro no modo escuro do app: os fundos rosados misturam com o escuro
    Object.assign(cores, {
      "--color-bordo": mistura(t.destaque, 65, "#F5EFE6"),
      "--color-bordo-escuro": mistura(t.destaque, 65, "#F5EFE6"),
      "--color-vinho": mistura(t.destaque, 65, "#F5EFE6"),
      "--color-rosa-fundo": mistura(t.destaque, 16, "var(--color-creme)"),
      "--color-rosa-claro": mistura(t.destaque, 55, "var(--color-creme)"),
    });
  if (escuro) {
    // tema escuro: a página inteira escurece, como no perfil
    Object.assign(cores, {
      "--color-creme": t.papel,
      "--color-jornal": t.papel,
      "--color-papel": t.papel,
      "--color-creme-quente": mistura("#FFFFFF", 7, t.papel),
      "--color-rosa-fundo": mistura(t.destaque, 16, t.papel),
      "--color-rosa-claro": mistura(t.destaque, 55, t.papel),
      "--color-ameixa": "#F5EFE6",
      "--color-tinta": "#F5EFE6",
      "--color-tinta-suave": "#F5EFE6",
      "--color-cinza": "#CFC3B8",
      "--color-grafite": "#CFC3B8",
      "--color-linha": "rgba(245,239,230,.18)",
      "--color-fio": "rgba(245,239,230,.18)",
      "--color-bege": "rgba(245,239,230,.28)",
      color: "#F5EFE6",
    });
  }
  return cores as CSSProperties;
}
