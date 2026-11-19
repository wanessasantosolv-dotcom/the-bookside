"use client";

import { numero, type Numeros } from "@/lib/numeros";

/** um audiolivro leva, em média, 1 hora a cada ~35 páginas do livro impresso */
const horasDeEscuta = (paginas: number) => Math.round(paginas / 35);

/** "papel, tela ou ouvidos": como a pessoa leu no ano. */
export function FormatosDoAno({ n, web }: { n: Numeros; web?: boolean }) {
  const comFormato = n.porFormato.filter((f) => f.qtd);
  const total = comFormato.reduce((t, f) => t + f.qtd, 0);
  const titulo = web
    ? "mb-[18px] border-b border-ameixa pb-2 font-revista text-[22px] leading-none text-ameixa italic"
    : "eyebrow mb-3 text-bordo";

  if (!total)
    return n.total ? (
      <section className={web ? "mb-14" : "mb-4"}>
        <h2 className={titulo}>papel, tela ou ouvidos?</h2>
        <p
          className={`text-[13px] text-cinza italic ${web ? "font-revista" : "font-accent"}`}
        >
          marque na página de cada livro se foi físico, e-book ou audiolivro — e
          descubra de que time você é ✦
        </p>
      </section>
    ) : null;

  const favorito = [...comFormato].sort((a, b) => b.qtd - a.qtd)[0];
  const empate = comFormato.filter((f) => f.qtd === favorito.qtd).length > 1;
  const time = empate
    ? "você lê de todo jeito"
    : {
        fisico: "você é time papel",
        ebook: "você é time tela",
        audio: "você é time fone de ouvido",
      }[favorito.id];
  const notas = comFormato.filter((f) => f.media !== null);
  const melhorNota =
    notas.length > 1
      ? [...notas].sort((a, b) => (b.media ?? 0) - (a.media ?? 0))[0]
      : null;
  const frases = comFormato.map((f) =>
    f.id === "fisico"
      ? `${numero(f.paginas)} páginas viradas no papel`
      : f.id === "ebook"
        ? `${f.qtd} ${f.qtd === 1 ? "livro lido" : "livros lidos"} na tela`
        : `${f.qtd} ${f.qtd === 1 ? "livro ouvido" : "livros ouvidos"}${f.paginas ? ` · ≈ ${horasDeEscuta(f.paginas)}h de escuta` : ""}`,
  );

  return (
    <section className={web ? "mb-14" : "mb-4"}>
      <h2 className={titulo}>papel, tela ou ouvidos</h2>
      <div
        className={`rounded-md border border-linha p-4 ${web ? "rounded-[4px] p-6" : "bg-creme-quente"}`}
      >
        <p
          className={`text-bordo italic ${web ? "font-revista text-[26px]" : "font-display text-[21px] font-semibold"}`}
        >
          {time} ✦
        </p>
        {/* a barra dividida entre os formatos */}
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-linha/70">
          {comFormato.map((f, i) => (
            <span
              key={f.id}
              className="block h-full"
              style={{
                width: `${(f.qtd / total) * 100}%`,
                background: ["#6B0D24", "#B75A6B", "#C9A46A"][i % 3],
              }}
            />
          ))}
        </div>
        <ul
          className={`mt-4 grid gap-3 ${web ? "grid-cols-3" : "grid-cols-1"}`}
        >
          {comFormato.map((f, i) => (
            <li key={f.id} className="flex items-center gap-3">
              <span
                className="flex size-9 flex-none items-center justify-center rounded-full text-creme"
                style={{ background: ["#6B0D24", "#B75A6B", "#C9A46A"][i % 3] }}
              >
                <svg
                  aria-hidden
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {f.icone.split(" M").map((d, k) => (
                    <path key={k} d={k ? `M${d}` : d} />
                  ))}
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold">
                  {Math.round((f.qtd / total) * 100)}% {f.onde}
                </span>
                <span className="block text-[11px] text-cinza">
                  {frases[i]}
                </span>
              </span>
            </li>
          ))}
        </ul>
        {melhorNota ? (
          <p
            className={`mt-4 text-[13px] text-cinza italic ${web ? "font-revista" : "font-accent"}`}
          >
            curiosidade: suas notas são mais altas {melhorNota.onde} (média{" "}
            {melhorNota.media!.toFixed(1).replace(".", ",")}★).
          </p>
        ) : null}
        {n.semFormato ? (
          <p className="mt-2 text-[11px] text-cinza">
            {n.semFormato} {n.semFormato === 1 ? "livro está" : "livros estão"}{" "}
            sem formato marcado.
          </p>
        ) : null}
      </div>
    </section>
  );
}
