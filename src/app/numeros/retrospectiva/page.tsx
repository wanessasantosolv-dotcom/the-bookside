"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useHidratado } from "@/components/PerfilHidratacao";
import { NumerosWeb } from "@/components/numeros/NumerosWeb";
import { Botao } from "@/components/ui/Botao";
import { calcularNumeros, numero } from "@/lib/numeros";
import { usePerfil } from "@/lib/perfil-store";

const cartao = "rounded-[14px] border border-rosa-claro/30 bg-creme/5 p-[18px]";
const etiqueta = "text-[9px] leading-none font-semibold tracking-[.2em] text-ouro uppercase";

export default function RetrospectivaPage() {
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  const meta = usePerfil((s) => s.meta);
  const nome = usePerfil((s) => s.nome);
  const frase = usePerfil((s) => s.frase);
  const [aviso, setAviso] = useState<string | null>(null);
  if (!hidratado) return <AppShell aba="numeros">{null}</AppShell>;
  const n = calcularNumeros(livros, meta);
  const genero = n.generos[0];

  async function compartilhar() {
    const texto = [
      `meu ${n.ano} em livros ✦`,
      `${n.total} ${n.total === 1 ? "livro" : "livros"}${n.paginasConhecidas ? ` · ${numero(n.paginas)} páginas` : ""}`,
      genero ? `gênero do ano: ${genero.nome}` : null,
      n.livroDoAno ? `livro do ano: ${n.livroDoAno.titulo}` : null,
      "— the bookside",
    ]
      .filter(Boolean)
      .join("\n");
    try {
      if (navigator.share) await navigator.share({ text: texto });
      else {
        await navigator.clipboard.writeText(texto);
        setAviso("copiado! é só colar onde quiser ✦");
      }
    } catch {
      /* cancelou */
    }
  }

  return (
    <AppShell aba="numeros">
      <NumerosWeb n={n} nome={nome} frase={frase} />
      <div className="papel-noite flex flex-1 flex-col px-6 pb-6 text-creme lg:hidden">
        <header className="flex items-center justify-between pt-2">
          <Link href="/numeros" className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-rosa-claro">
            ‹ números
          </Link>
          <span className="text-[10px] font-semibold tracking-[.14em] text-rosa-claro uppercase">{n.ano}</span>
        </header>

        <div className="mt-4 animate-subir">
          <p className="text-[10px] leading-none font-semibold tracking-[.2em] text-ouro uppercase">sua retrospectiva</p>
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-bold italic">
            o seu ano
            <br />
            em livros
          </h1>
        </div>

        <div className="mt-7 flex flex-col gap-3.5">
          <div className={`${cartao} animate-subir [animation-delay:.12s]`}>
            <p className={etiqueta}>você leu</p>
            <p className="mt-2.5 font-display text-[70px] leading-[.95] font-bold italic">{n.total}</p>
            <p className="mt-2 font-accent text-[15px] leading-[1.3] italic text-rosa-claro">
              {n.total === 1 ? "livro" : "livros"}
              {n.paginasConhecidas ? ` · ${numero(n.paginas)} páginas` : ""}
              {n.paginasPorLivro ? ` · ${numero(n.paginasPorLivro)} por livro` : ""}
            </p>
          </div>

          {genero ? (
            <div className={cartao}>
              <p className={etiqueta}>seu gênero do ano</p>
              <p className="mt-2 font-display text-2xl leading-[1.15] font-semibold italic">{genero.nome}</p>
              <p className="mt-2 font-accent text-[15px] italic text-rosa-claro">
                {genero.qtd} dos seus {n.total} livros ✦
              </p>
            </div>
          ) : null}

          {n.livroDoAno ? (
            <Link href={`/livro/${n.livroDoAno.id}`} className={`${cartao} block`}>
              <p className={etiqueta}>o livro do ano</p>
              <p className="mt-2 font-display text-2xl leading-[1.15] font-semibold italic">{n.livroDoAno.titulo}</p>
              <p className="mt-2 font-accent text-[15px] italic text-rosa-claro">
                {n.livroDoAno.nota === 5 ? "cinco estrelas ♡" : `${n.livroDoAno.nota} estrelas, a maior nota do ano ♡`}
              </p>
            </Link>
          ) : null}

          {n.maisForte ? (
            <div className={`${cartao} py-3.5`}>
              <p className={etiqueta}>e ainda</p>
              <p className="mt-2 font-accent text-sm italic">
                {n.maisForte.mes} foi seu mês mais forte, com {n.maisForte.livros} {n.maisForte.livros === 1 ? "livro" : "livros"}.
              </p>
            </div>
          ) : null}

          {!n.total ? (
            <p className="font-accent text-[15px] italic text-rosa-claro">sua retrospectiva começa no primeiro “já li” do ano ✦</p>
          ) : null}
        </div>

        <div className="mt-auto pt-8">
          <p role="status" className="mb-2 min-h-4 text-center text-xs text-rosa-claro">
            {aviso}
          </p>
          <Botao variante="creme" onClick={compartilhar} disabled={!n.total}>
            compartilhar ✧
          </Botao>
        </div>
      </div>
    </AppShell>
  );
}
