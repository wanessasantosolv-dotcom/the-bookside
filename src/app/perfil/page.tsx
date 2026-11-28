"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useModoEscuro } from "@/components/Aparencia";
import { useHidratado } from "@/components/PerfilHidratacao";
import { EstantesDela } from "@/components/perfil/DaAmiga";
import { JornadaNoPerfil } from "@/components/perfil/JornadaNoPerfil";
import { PerfilEditorial, type AbaDoPerfil } from "@/components/perfil/PerfilEditorial";
import { ResenhasLista } from "@/components/perfil/ResenhasLista";
import { usePerfil } from "@/lib/perfil-store";
import { contagemSeguidores, useConsulta, useMeuId } from "@/lib/social";
import { estanteDoPerfil } from "@/lib/temas";
import { estiloDoPerfil } from "@/lib/tema";

const ABAS: AbaDoPerfil[] = ["geral", "jornada", "resenhas"];
const daUrl = (): AbaDoPerfil => {
  const a = new URLSearchParams(window.location.search).get("aba") as AbaDoPerfil | null;
  return a && ABAS.includes(a) ? a : "geral";
};

/** o seu perfil: identidade literária + jornada, resenhas e estantes (cada aba com endereço próprio) */
export default function PerfilPage() {
  const hidratado = useHidratado();
  const p = usePerfil();
  const eu = useMeuId();
  const modoEscuro = useModoEscuro();
  const [aba, setAba] = useState<AbaDoPerfil>("geral");
  // abre na aba do endereço (?aba=jornada) e acompanha o voltar do navegador
  useEffect(() => {
    setAba(daUrl());
    const voltar = () => setAba(daUrl());
    window.addEventListener("popstate", voltar);
    return () => window.removeEventListener("popstate", voltar);
  }, []);
  const numeros = useConsulta(async () => (eu ? contagemSeguidores(eu) : null), [eu]);

  if (!hidratado) return <AppShell aba="perfil">{null}</AppShell>;

  function mudarAba(a: AbaDoPerfil) {
    setAba(a);
    window.history.pushState(null, "", a === "geral" ? "/perfil" : `/perfil?aba=${a}`);
  }

  return (
    <AppShell aba="perfil" className="[&_main]:!bg-[var(--papel,var(--color-creme))]">
      {/* o tema do perfil vale só aqui dentro (a navegação continua institucional) */}
      <div
        style={{ ...estiloDoPerfil(p.tema, modoEscuro), ...estanteDoPerfil(p.estiloEstante, p.tema, modoEscuro).estilo }}
        data-previa-estante={estanteDoPerfil(p.estiloEstante, p.tema, modoEscuro).atributo}
        className="acc-tema flex flex-1 flex-col bg-[var(--papel)] text-[var(--tinta)]"
      >
      <PerfilEditorial
        p={p}
        proprio
        pessoaId={eu}
        numeros={numeros.dados ?? null}
        aba={aba}
        onAba={mudarAba}
        conteudoAba={{
          jornada: <><div className="mx-auto w-full max-w-[960px] px-5 py-3"><Link href="/caderno" className="block rounded-md border border-[var(--tinta)]/20 px-4 py-3 font-semibold text-[var(--tinta)]">Caderno de leitura →</Link></div><JornadaNoPerfil /></>,
          resenhas: <ResenhasLista />,
          estantes: <EstantesDela p={p} base="" nome="" propria />,
        }}
      />
      </div>
    </AppShell>
  );
}
