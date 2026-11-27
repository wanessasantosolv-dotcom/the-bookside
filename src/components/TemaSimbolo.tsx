import type { SimboloTema } from "@/lib/temas";

/** os símbolos da coleção de temas (traço fino, leem bem pequenos) */
const DESENHOS: Record<SimboloTema, React.ReactNode> = {
  // the original: livro aberto
  livro: (
    <>
      <path d="M12 6.5c-2-1.4-4.6-1.9-8-1.6v12.6c3.4-.3 6 .2 8 1.6 2-1.4 4.6-1.9 8-1.6V4.9c-3.4-.3-6 .2-8 1.6z" />
      <path d="M12 6.5v12.6" />
    </>
  ),
  // plot twist: estrela gráfica irregular
  estrela: <path d="M12 2.8l1.9 6.1 6.6-1.7-4.6 4.6 4.4 5.2-6.5-1.6L12 21.6l-1.8-6.2-6.5 1.6 4.4-5.2L3.5 7.2l6.6 1.7z" />,
  // fine print: composição tipográfica (bloco, linha e ponto vermelho)
  grade: (
    <>
      <path d="M4 4h16v16H4z" />
      <path d="M4 10h16M10 10v10" />
      <circle cx="15" cy="15" r="1.6" fill="currentColor" stroke="none" />
    </>
  ),
  // the moon chapter: lua crescente com estrela
  lua: (
    <>
      <path d="M15.5 3.5a8.5 8.5 0 1 0 5 14.6A7 7 0 0 1 15.5 3.5z" />
      <path d="M18.5 4.5l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6z" fill="currentColor" stroke="none" />
    </>
  ),
  // paperback '72: arco geométrico retrô
  arco: (
    <>
      <path d="M3.5 19.5a8.5 8.5 0 0 1 17 0" />
      <path d="M7.5 19.5a4.5 4.5 0 0 1 9 0" />
      <path d="M3 19.5h18" />
    </>
  ),
  // between the leaves: ramo botânico
  ramo: (
    <>
      <path d="M12 21V5" />
      <path d="M12 9c-3.2-.2-5-2-5.5-4.5C9.3 4.6 11.4 6.2 12 9zM12 9c3.2-.2 5-2 5.5-4.5C14.7 4.6 12.6 6.2 12 9zM12 15c-3.6-.2-5.6-2.3-6-5 3.1.1 5.4 2 6 5zM12 15c3.6-.2 5.6-2.3 6-5-3.1.1-5.4 2-6 5z" />
    </>
  ),
  // daydream: borboleta
  borboleta: (
    <>
      <path d="M12 8v10" />
      <path d="M12 9.5C10 5.5 6.6 4.2 4.4 5.4c-1.6 1 .2 5.2 3.3 6.1-2.4.8-3.3 3.4-1.9 4.8 1.7 1.7 4.6-.6 6.2-4.3M12 9.5c2-4 5.4-5.3 7.6-4.1 1.6 1-.2 5.2-3.3 6.1 2.4.8 3.3 3.4 1.9 4.8-1.7 1.7-4.6-.6-6.2-4.3" />
      <path d="M11 6.5l-1.2-2M13 6.5l1.2-2" />
    </>
  ),
  // red prose: rosa gravada
  rosa: (
    <>
      <path d="M12 13.5c-3 0-4.8-2-4.8-4.6S9.2 4 12 4s4.8 2.3 4.8 4.9-1.8 4.6-4.8 4.6z" />
      <path d="M12 6.5c-1.4.2-2.2 1.2-2.1 2.4.2 1.4 1.4 2 2.5 1.7 1-.3 1.4-1.3 1-2.1M12 13.5V21M12 17c-1.6-1.6-3.6-1.8-5-1 1 1.6 3 2.2 5 1zM12 18.5c1.4-1.3 3.2-1.4 4.4-.7-.9 1.3-2.6 1.7-4.4.7z" />
    </>
  ),
};

export function TemaSimbolo({ simbolo, tamanho = 18, className }: { simbolo: SimboloTema; tamanho?: number; className?: string }) {
  return (
    <svg
      aria-hidden
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {DESENHOS[simbolo]}
    </svg>
  );
}
