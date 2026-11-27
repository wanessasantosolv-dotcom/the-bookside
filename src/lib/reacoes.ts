import type { Reacao } from "@/lib/perfil-store";

/** as reações da ficha, do "favoritado" ao "abandonei" */
export const reacoes: { id: Reacao; nome: string; emoji: string; cor: string }[] = [
  { id: "favoritado", nome: "favoritado", emoji: "♥", cor: "#E2557A" },
  { id: "adorei", nome: "adorei", emoji: "✦", cor: "#2FA37A" },
  { id: "gostei", nome: "gostei", emoji: "☺", cor: "#7DAE2F" },
  { id: "neutro", nome: "neutro", emoji: "≈", cor: "#D89A3A" },
  { id: "nao", nome: "não foi pra mim", emoji: "☹", cor: "#6F6FD8" },
  { id: "abandonei", nome: "abandonei", emoji: "🍂", cor: "#715F65" },
];
export const reacaoDe = (id?: Reacao) => reacoes.find((r) => r.id === id);
