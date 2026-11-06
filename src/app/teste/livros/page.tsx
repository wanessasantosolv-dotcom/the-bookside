"use client";

import { Carta, TituloCarta } from "@/components/teste/Carta";
import { useResultado } from "@/components/teste/useResultado";
import { BotaoLink } from "@/components/ui/Botao";
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
  if (!pronto) return <main className="envelope min-h-dvh" />;

  return (
    <Carta
      voltar={{ href: "/teste/dna", rotulo: "dna" }}
      rotulo="sua estante"
      rodape={<BotaoLink href="/teste/frase">continuar ✧</BotaoLink>}
    >
      <p className="rotulo-carta">anexo ii · indicações</p>
      <TituloCarta>sua próxima estante</TituloCarta>
      <p className="manuscrito mt-3 mb-[18px]">escolhemos estes três pra você ✦</p>

      <ul>
        {resultado.principal.livros.map((l, i) => {
          const id = idDoLivro(l.titulo);
          const guardado = livros.some((x) => x.id === id);
          return (
            <li
              key={l.titulo}
              className="flex animate-subir items-center gap-3.5 border-t border-[#EFE4D8] py-3.5 first:border-t-0"
              style={{ animationDelay: `${0.2 + i * 0.1}s` }}
            >
              <span
                aria-hidden
                className="flex h-16 w-11 flex-none items-center justify-center rounded-[2px_4px_4px_2px] text-sm text-creme shadow-[inset_5px_0_0_rgba(0,0,0,.16),2px_3px_7px_-2px_rgba(43,20,32,.45)]"
                style={{ background: l.cor }}
              >
                ✦
              </span>
              <span className="min-w-0 flex-1">
                <b className="block font-display text-lg leading-[1.15] font-semibold italic">{l.titulo}</b>
                <span className="mt-0.5 block text-xs text-cinza">{l.autor}</span>
                <em className="mt-1 block font-accent text-[13px] leading-tight italic text-bordo">{l.porque}</em>
              </span>
              <button
                type="button"
                aria-pressed={guardado}
                aria-label={guardado ? `tirar ${l.titulo} do quero ler` : `guardar ${l.titulo} no quero ler`}
                onClick={() => alternarLivro({ id, titulo: l.titulo, autor: l.autor, status: "quero" })}
                className={`flex size-11 flex-none items-center justify-center rounded-full border border-bordo text-sm transition-colors ${
                  guardado ? "bg-bordo text-creme" : "text-bordo hover:bg-rosa-fundo"
                }`}
              >
                {guardado ? "♥" : "♡"}
              </button>
            </li>
          );
        })}
      </ul>
    </Carta>
  );
}
