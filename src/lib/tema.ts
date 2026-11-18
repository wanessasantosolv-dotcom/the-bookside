import type { CSSProperties } from "react";
import { temas } from "@/lib/dados";

/**
 * Pinta uma área inteira com um tema (os mesmos do perfil): troca as cores do
 * app (creme, bordô, cinza, linhas…) só dentro dela. Biblioteca clássica é o
 * visual padrão do app, então não troca nada.
 */
export function coresDoTema(id: string | null | undefined): CSSProperties | undefined {
  const t = temas.find((x) => x.id === id);
  if (!t || t.id === "biblioteca-classica") return undefined;
  const escuro = "escuro" in t;
  const mistura = (cor: string, pct: number, com: string = t.papel) => `color-mix(in srgb, ${cor} ${pct}%, ${com})`;
  const texto = escuro ? "#F5EFE6" : "#2B1420";
  const suave = escuro ? "#CFC3B8" : mistura(t.texto, 70, "#5A4E52");
  return {
    // fundo e cartões
    "--color-creme": t.papel,
    "--color-jornal": t.papel,
    "--color-papel": t.papel,
    "--color-creme-quente": escuro ? mistura("#FFFFFF", 7) : mistura("#FFFFFF", 45),
    // destaque (títulos, botões, links)
    "--color-bordo": escuro ? t.destaque : t.texto,
    "--color-bordo-escuro": escuro ? t.destaque : t.texto,
    "--color-bordo-suave": t.destaque,
    "--color-vinho": escuro ? t.destaque : t.texto,
    "--color-rosa-antigo": t.destaque,
    "--color-rosa-claro": mistura(t.destaque, 45),
    "--color-rosa-fundo": mistura(t.destaque, 14),
    // texto
    "--color-ameixa": texto,
    "--color-tinta": texto,
    "--color-tinta-suave": texto,
    "--color-cinza": suave,
    "--color-grafite": suave,
    // linhas e bordas
    "--color-linha": mistura(t.destaque, 22),
    "--color-fio": mistura(t.destaque, 22),
    "--color-bege": mistura(t.destaque, 35),
    color: texto,
  } as CSSProperties;
}
