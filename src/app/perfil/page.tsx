"use client";

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
import { estiloDoPerfil } from "@/lib/tema";

const ABAS: AbaDoPerfil[] = ["geral", "jornada", "resenhas", "estantes"];
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
    <AppShell aba="perfil" style={estiloDoPerfil(p.tema, modoEscuro)} className="acc-tema [&_main]:!bg-[var(--papel)] [&_main]:!text-[var(--tinta)]">
      <PerfilEditorial
        p={p}
        proprio
        pessoaId={eu}
        numeros={numeros.dados ?? null}
        aba={aba}
        onAba={mudarAba}
        conteudoAba={{
          jornada: <JornadaNoPerfil />,
          resenhas: <ResenhasLista />,
          estantes: <EstantesDela p={p} base="" nome="" propria />,
        }}
      />
    </AppShell>
  );
}
