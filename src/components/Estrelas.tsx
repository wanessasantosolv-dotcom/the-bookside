"use client";

/** Escolha de 1 a 5 estrelas (botões de verdade, um por estrela). */
export function EstrelasInput({
  valor,
  onChange,
  rotulo,
  tamanho = "text-xl",
}: {
  valor: number;
  onChange: (n: number) => void;
  rotulo: string;
  tamanho?: string;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}
          onClick={() => onChange(valor === n ? 0 : n)}
          className={`flex size-9 items-center justify-center leading-none text-bordo ${tamanho}`}
        >
          {n <= valor ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}
