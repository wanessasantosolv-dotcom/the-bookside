"use client";

import { BarraLink, Filete, PaginaRevista, Rotulo } from "@/components/teste/Revista";
import { useResultado } from "@/components/teste/useResultado";
import { usePerfil } from "@/lib/perfil-store";

function idDoLivro(titulo: string) {
  return titulo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

export default function LivrosPage() {
  const { pronto, resultado } = useResultado();
  const livros = usePerfil((s) => s.livros);
  const alternarLivro = usePerfil((s) => s.alternarLivro);
  if (!pronto) return <main className="min-h-dvh bg-jornal" />;

  return (
    <PaginaRevista
      voltar={{ href: "/teste/dna", rotulo: "dna" }}
      rotulo="sua estante"
      rodape={<BarraLink href="/teste/frase">continuar →</BarraLink>}
    >
      <Rotulo vinho className="aparece mt-8 !tracking-[.3em]">
        anexo ii · indicações
      </Rotulo>
      <h1 className="mt-3 animate-subir font-revista text-[32px] leading-[1.1] italic [animation-delay:.1s]">sua próxima estante</h1>
      <p className="mt-2 text-[13px] leading-normal text-grafite">escolhemos estes três pra você ✦</p>

      <ul className="mt-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:text-left">
        {resultado.principal.livros.map((l, i) => {
          const id = idDoLivro(l.titulo);
          const guardado = livros.some((x) => x.id === id);
          return (
            <li
              key={l.titulo}
              className="aparece flex items-start gap-3.5 border-t border-tinta py-4"
              style={{ animationDelay: `${0.1 + i * 0.07}s` }}
            >
              <span className="w-[26px] flex-none pt-[3px] font-mono text-[11px] font-bold text-vinho">{String(i + 1).padStart(2, "0")}—</span>
              <span className="min-w-0 flex-1">
                <b className="block font-revista text-lg leading-[1.2] font-semibold italic">{l.titulo}</b>
                <span className="mt-1 block text-[9px] font-semibold tracking-[.14em] text-grafite uppercase">{l.autor}</span>
                <em className="mt-1.5 block font-revista text-[13px] leading-[1.3] italic text-vinho">{l.porque}</em>
              </span>
              <button
                type="button"
                aria-pressed={guardado}
                aria-label={guardado ? `tirar ${l.titulo} do quero ler` : `guardar ${l.titulo} no quero ler`}
                onClick={() => alternarLivro({ id, titulo: l.titulo, autor: l.autor, status: "quero" })}
                className={`-mt-2.5 -mr-2 flex size-11 flex-none items-center justify-center text-lg ${guardado ? "text-vinho" : "text-grafite hover:text-vinho"}`}
              >
                {guardado ? "♥" : "♡"}
              </button>
            </li>
          );
        })}
      </ul>
      <Filete />
    </PaginaRevista>
  );
}
