/**
 * marginalia. — o registro literário (a ficha pessoal de leitura).
 * Vocabulário da experiência de leitura, nomes dos critérios e perguntas de apoio.
 */
import type { NotasDetalhe } from "@/lib/perfil-store";

/** os critérios que já existem (as chaves continuam as mesmas; só o nome exibido muda) */
export const CRITERIOS: { id: keyof NotasDetalhe; nome: string; dica: string }[] = [
  { id: "plot", nome: "enredo", dica: "a história e como ela se constrói" },
  { id: "personagens", nome: "personagens", dica: "quem vive a história" },
  { id: "escrita", nome: "escrita", dica: "a linguagem e o estilo" },
  { id: "final", nome: "desfecho", dica: "como a obra se encerra" },
];

export const SENSACOES: { id: string; nome: string; opcoes: string[] }[] = [
  {
    id: "atmosfera",
    nome: "atmosfera",
    opcoes: ["intimista", "sombria", "melancólica", "contemplativa", "perturbadora", "acolhedora", "misteriosa", "divertida", "tensa", "nostálgica"],
  },
  {
    id: "ritmo",
    nome: "ritmo",
    opcoes: ["fluido", "envolvente", "intenso", "lento", "irregular", "acelerado", "denso", "equilibrado"],
  },
  {
    id: "impressao",
    nome: "impressão",
    opcoes: ["reflexiva", "surpreendente", "comovente", "marcante", "frustrante", "previsível", "original", "inesquecível", "instigante", "desafiadora"],
  },
];

/** quantas opções de cada categoria aparecem antes de "ver todas" */
export const SENSACOES_VISIVEIS = 6;

export const PERGUNTAS_REFLEXAO = [
  "Quais aspectos da obra mais chamaram sua atenção?",
  "Como a narrativa dialogou com suas expectativas?",
  "Que reflexões a leitura despertou?",
  "O que tornou essa experiência literária particular?",
  "Como você percebeu o desenvolvimento da narrativa?",
  "Quais elementos considera mais bem construídos?",
  "Houve algum aspecto que comprometeu sua experiência?",
  "O que permaneceu com você após a conclusão?",
  "Em que aspectos sua percepção da obra mudou ao longo da leitura?",
];

export const RECOMENDARIA: { id: "sim" | "ressalvas" | "nao"; nome: string }[] = [
  { id: "sim", nome: "sim" },
  { id: "ressalvas", nome: "com ressalvas" },
  { id: "nao", nome: "não" },
];

export const RELERIA: { id: "sim" | "talvez" | "nao"; nome: string }[] = [
  { id: "sim", nome: "sim" },
  { id: "talvez", nome: "talvez" },
  { id: "nao", nome: "não" },
];

/** "4,5" */
export const notaTexto = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
