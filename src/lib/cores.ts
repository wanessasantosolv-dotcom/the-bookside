import { sugestoesDeLivros } from "@/lib/dados";

const paleta = ["#6B0D24", "#2B1420", "#B75A6B", "#6B7A5E", "#8E1D3D", "#4B0D1B"];

/** Cor da capa provisória de um livro: a do catálogo, ou uma da paleta escolhida pelo id. */
export function corDoLivro(id: string) {
  const doCatalogo = sugestoesDeLivros.find((l) => l.id === id)?.cor;
  if (doCatalogo) return doCatalogo;
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return paleta[h % paleta.length];
}
