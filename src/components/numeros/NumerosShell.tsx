"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { useHidratado } from "@/components/PerfilHidratacao";
import { NumerosWeb } from "@/components/numeros/NumerosWeb";
import { calcularNumeros, wrappedLiberado, type Numeros } from "@/lib/numeros";
import { usePerfil } from "@/lib/perfil-store";

const abas = [
  { id: "ano", href: "/numeros", rotulo: "o ano" },
  { id: "generos", href: "/numeros/generos", rotulo: "gêneros" },
  { id: "calendario", href: "/numeros/calendario", rotulo: "calendário" },
  { id: "retro", href: "/numeros/retrospectiva", rotulo: "retrospectiva" },
] as const;

export const bloco =
  "relative rounded-[2px] border border-linha bg-creme-quente px-[18px] py-4";

/** Topo comum da "jornada" (antes "números") (celular) + a versão web no computador. */
export function NumerosShell({
  aba,
  titulo,
  subtitulo,
  children,
}: {
  aba: (typeof abas)[number]["id"];
  titulo: string;
  subtitulo: (n: Numeros) => ReactNode;
  children: (n: Numeros) => ReactNode;
}) {
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  const meta = usePerfil((s) => s.meta);
  const nome = usePerfil((s) => s.nome);
  const frase = usePerfil((s) => s.frase);
  const capa = usePerfil((s) => s.capa);
  const capaImagem = usePerfil((s) => s.capaImagem);
  if (!hidratado) return <AppShell aba="perfil">{null}</AppShell>;
  const n = calcularNumeros(livros, meta);
  const totalVidaToda = livros.filter((l) => l.status === "lido").length;
  const anoInicio = livros.reduce<number | null>((min, l) => {
    if (l.status !== "lido" || !l.lidoEm) return min;
    const ano = new Date(l.lidoEm).getFullYear();
    return min === null || ano < min ? ano : min;
  }, null);

  return (
    <AppShell aba="perfil">
      <NumerosWeb
        n={n}
        nome={nome}
        frase={frase}
        aba={aba === "calendario" ? "ano" : aba}
        totalVidaToda={totalVidaToda}
        anoInicio={anoInicio}
      />
      <div className="papel-pontilhado flex flex-1 flex-col lg:hidden">
        {/* a capa do perfil, como no computador */}
        <div
          aria-hidden
          className={`h-[96px] bg-cover bg-center ${capaImagem ? "" : `pat-${capa ?? "linhas"}`}`}
          style={
            capaImagem ? { backgroundImage: `url("${capaImagem}")` } : undefined
          }
        />
        <header className="flex items-center justify-between px-6 pt-2">
          <span className="font-maquina flex min-h-11 items-center text-[10px] tracking-[.12em] text-rosa-antigo uppercase">
            cartão de leitura
          </span>
          <span className="font-maquina text-[10px] tracking-[.1em] text-cinza uppercase">
            {n.ano}
          </span>
        </header>
        <div className="animate-subir px-6 pt-1">
          <h1 className="font-display text-[32px] leading-[1.1] font-semibold italic text-bordo">
            {titulo}
          </h1>
          <p className="mt-2 font-accent text-sm italic text-cinza">
            {subtitulo(n)}
          </p>
        </div>
        <nav
          aria-label="seções da jornada"
          className="mx-6 mt-5 flex gap-1 rounded-pill bg-linha/70 p-1"
        >
          {abas
            .filter((a) => a.id !== "retro" || wrappedLiberado())
            .map((a) => (
              <Link
                key={a.id}
                href={a.href}
                aria-current={a.id === aba ? "page" : undefined}
                className={`flex h-[34px] flex-1 items-center justify-center rounded-pill text-xs font-semibold ${a.id === aba ? "bg-bordo text-creme" : "text-cinza"}`}
              >
                {a.rotulo}
              </Link>
            ))}
        </nav>
        <div className="flex flex-1 flex-col gap-3.5 px-6 pt-5 pb-6">
          {children(n)}
        </div>
      </div>
    </AppShell>
  );
}

export function SemLeituras({ ano }: { ano: number }) {
  return (
    <div className={`${bloco} py-8 text-center`}>
      <p aria-hidden className="text-xl text-ouro">
        ✦
      </p>
      <h2 className="mt-2 font-display text-2xl leading-[1.15] font-semibold italic text-ameixa">
        nenhum livro lido
        <br />
        em {ano} ainda
      </h2>
      <p className="mt-2 text-[13px] text-cinza">
        quando você marcar um livro como “já li”, a sua jornada começa a
        aparecer aqui.
      </p>
      <Link
        href="/estantes"
        className="mt-4 inline-flex min-h-11 items-center text-[13px] font-semibold text-bordo"
      >
        ir para as estantes →
      </Link>
    </div>
  );
}
