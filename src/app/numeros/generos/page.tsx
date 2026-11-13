"use client";

import { bloco, NumerosShell, SemLeituras } from "@/components/numeros/NumerosShell";
import { mediaTexto } from "@/lib/numeros";

const cores = ["#6B0D24", "#8E1D3D", "#B75A6B", "#A88B64", "#6B7A5E", "#464052"];
const extenso = ["nenhum", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez"];

export default function NumerosGenerosPage() {
  return (
    <NumerosShell
      aba="generos"
      titulo="o que você leu"
      subtitulo={(n) =>
        n.total
          ? `${extenso[n.generos.length] ?? n.generos.length} ${n.generos.length === 1 ? "gênero" : "gêneros"} em ${n.total} ${n.total === 1 ? "livro" : "livros"} ✦`
          : "seus gêneros aparecem aqui ✦"
      }
    >
      {(n) =>
        n.total ? (
          <>
            <div className={`${bloco} animate-subir pb-5`}>
              <p className="eyebrow text-bordo">por gênero</p>
              {n.generos.slice(0, 6).map((g, i) => (
                <div key={g.nome} className="mt-[13px]">
                  <div className="flex items-baseline justify-between">
                    <span className="font-accent text-[15px] leading-[1.2] italic">{g.nome}</span>
                    <b className="text-xs font-semibold text-bordo">
                      {g.qtd} {g.qtd === 1 ? "livro" : "livros"}
                    </b>
                  </div>
                  <div className="mt-[7px] h-[9px] overflow-hidden rounded-full bg-[#F0E6DC]">
                    <i className="block h-full rounded-full" style={{ width: `${(g.qtd / n.generos[0].qtd) * 100}%`, background: cores[i % cores.length] }} />
                  </div>
                </div>
              ))}
            </div>

            <div className={bloco}>
              <p className="eyebrow mb-1 text-bordo">quem você mais leu</p>
              <ol>
                {n.autores.map((a, i) => (
                  <li key={a.nome} className="flex items-center gap-[13px] border-t border-linha py-[11px] first:border-t-0">
                    <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-[#F1E4DC] text-xs font-bold text-bordo">{i + 1}</span>
                    <span>
                      <b className="font-display text-base leading-[1.2] font-semibold italic">{a.nome}</b>
                      <small className="mt-[3px] block text-xs text-cinza">
                        {a.qtd} {a.qtd === 1 ? "livro" : "livros"}
                        {a.media ? ` · média ${mediaTexto(a.media)}` : ""}
                      </small>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        ) : (
          <SemLeituras ano={n.ano} />
        )
      }
    </NumerosShell>
  );
}
