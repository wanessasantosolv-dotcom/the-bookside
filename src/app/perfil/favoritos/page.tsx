"use client";

import Link from "next/link";
import { TelaApp } from "@/components/AppShell";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { corDoLivro } from "@/lib/cores";
import { usePerfil } from "@/lib/perfil-store";

const MAXIMO = 4;

function Escolha({ inicial }: { inicial: string[] }) {
  const router = useRouter();
  const livros = usePerfil((s) => s.livros);
  const atualizar = usePerfil((s) => s.atualizar);
  const [escolhidos, setEscolhidos] = useState(inicial);
  const cheio = escolhidos.length >= MAXIMO;

  function alternar(id: string) {
    setEscolhidos((e) => (e.includes(id) ? e.filter((x) => x !== id) : e.length < MAXIMO ? [...e, id] : e));
  }

  return (
    <TelaApp aba="perfil">
      <header className="flex items-center justify-between px-6 pt-2">
        <Link href="/perfil/editar" className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo">
          ‹ editar perfil
        </Link>
        <span className="eyebrow !text-[10px] text-cinza">favoritos</span>
      </header>
      <div className="animate-subir px-6 pt-4">
        <h1 className="font-display text-[30px] leading-[1.1] font-semibold italic text-bordo">escolha até 4</h1>
        <p className="mt-2 font-accent text-sm italic text-cinza">esses livros aparecem em destaque no seu perfil.</p>
        <p className="mt-3 text-xs font-semibold text-bordo" aria-live="polite">
          {escolhidos.length} de {MAXIMO}
        </p>
      </div>

      <div className="flex-1 px-6 pt-5 pb-6">
        {livros.length ? (
          <fieldset className="grid grid-cols-3 gap-x-3 gap-y-4">
            <legend className="sr-only">livros da sua estante</legend>
            {livros.map((l) => {
              const on = escolhidos.includes(l.id);
              return (
                <label
                  key={l.id}
                  className={`relative block cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bordo ${
                    !on && cheio ? "opacity-45" : ""
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={on} disabled={!on && cheio} onChange={() => alternar(l.id)} />
                  <CapaLivro titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className={`w-full ${on ? "ring-2 ring-bordo ring-offset-2 ring-offset-creme" : ""}`} />
                  <span
                    aria-hidden
                    className={`absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border-2 border-creme text-xs font-bold ${
                      on ? "bg-bordo text-creme" : "bg-creme/70 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className="mt-1.5 block truncate text-[11px] text-cinza">{l.titulo}</span>
                </label>
              );
            })}
          </fieldset>
        ) : (
          <div className="pt-10 text-center">
            <p className="font-accent text-[17px] italic text-cinza">sua estante ainda está vazia.</p>
            <BotaoLink href="/criar-perfil/estante/buscar" variante="contorno" className="mx-auto mt-6 max-w-[260px]">
              adicionar livros
            </BotaoLink>
          </div>
        )}
      </div>

      <footer className="sticky bottom-0 bg-gradient-to-t from-creme from-70% to-transparent px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
        <Botao
          onClick={() => {
            atualizar({ favoritos: escolhidos });
            router.push("/perfil/editar");
          }}
        >
          salvar favoritos
        </Botao>
      </footer>
    </TelaApp>
  );
}

export default function FavoritosPage() {
  const hidratado = useHidratado();
  const favoritos = usePerfil((s) => s.favoritos);
  if (!hidratado) return <TelaApp aba="perfil">{null}</TelaApp>;
  return <Escolha inicial={favoritos ?? []} />;
}
