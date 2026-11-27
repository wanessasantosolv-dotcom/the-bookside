"use client";

import { useMemo } from "react";
import { usePerfil } from "@/lib/perfil-store";
import { CARACTERISTICAS } from "@/lib/taxonomia";

/**
 * Além dos favoritos: caminhos para fora do habitual, mas com coerência —
 * cada sugestão cruza um gênero que a pessoa já lê com uma tradição literária
 * ou uma forma narrativa diferente. Abre na busca (resultados reais).
 */
export function AlemDosFavoritos({ explorar }: { explorar: (consulta: string) => void }) {
  const gostos = usePerfil((s) => s.gostos);
  const livros = usePerfil((s) => s.livros);
  const caminhos = useMemo(() => {
    const generos = CARACTERISTICAS.filter((c) => c.categoria === "genero");
    // gêneros que a pessoa declarou ou que aparecem nas leituras (nunca inventados)
    const lidos = new Set([...gostos, ...livros.filter((l) => l.status === "lido").map((l) => l.genero ?? "")].map((g) => g.toLowerCase()).filter(Boolean));
    const meus = generos.filter((g) => [...lidos].some((x) => x.includes(g.nome.toLowerCase()) || g.sinonimos.some((s) => x.includes(s))));
    if (!meus.length) return [];
    const outros = CARACTERISTICAS.filter((c) => ["origem", "narrativa"].includes(c.categoria) && c.id !== "lit-brasileira");
    const dia = Math.floor(Date.now() / 864e5);
    return [0, 1, 2, 3].map((i) => {
      const g = meus[(dia + i) % meus.length];
      const o = outros[(dia * 7 + i * 5) % outros.length];
      return { rotulo: `${g.nome} · ${o.nome}`, consulta: `${g.nome} ${o.nome}` };
    }).filter((x, i, a) => a.findIndex((y) => y.rotulo === x.rotulo) === i);
  }, [gostos, livros]);
  if (!caminhos.length) return null;
  return (
    <section aria-labelledby="d-alem">
      <h2 id="d-alem" className="font-revista text-[22px] leading-none text-ameixa">
        Além dos favoritos
      </h2>
      <p className="mt-1 text-[13px] text-cinza">Às vezes, a próxima grande leitura está fora do que já conhecemos.</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {caminhos.map((c) => (
          <button key={c.rotulo} type="button" onClick={() => explorar(c.consulta)} className="min-h-10 rounded-[6px] border border-linha bg-creme-quente px-3 text-[13px] text-tinta-suave hover:border-azul hover:text-ameixa">
            {c.rotulo}
          </button>
        ))}
      </div>
    </section>
  );
}
