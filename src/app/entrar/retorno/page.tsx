"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Animacao } from "@/components/Animacao";
import { Tela } from "@/components/ui/Tela";
import { useNuvem } from "@/lib/nuvem";
import { usePerfil } from "@/lib/perfil-store";

/** Volta do login com Google/Apple: espera a sessão e o perfil e segue para o app. */
export default function RetornoPage() {
  const router = useRouter();
  const estado = useNuvem((s) => s.estado);
  const usuario = useNuvem((s) => s.usuario);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    // o Supabase devolve erros na URL (ex.: a pessoa cancelou o login)
    const dados = new URLSearchParams(window.location.hash.slice(1) + "&" + window.location.search.slice(1));
    if (dados.get("error")) setErro(dados.get("error_description") ?? "o login não foi concluído.");
  }, []);

  useEffect(() => {
    if (erro) return;
    if (estado === "sem-conta") setErro("o login não foi concluído.");
    if (usuario && (estado === "salvo" || estado === "salvando" || estado === "erro")) {
      router.replace(usePerfil.getState().onboardingConcluido ? "/inicio" : "/criar-perfil/nome");
    }
  }, [estado, usuario, erro, router]);

  return (
    <Tela className="justify-center">
      {erro ? (
        <div className="px-8 text-center">
          <p className="font-display text-2xl font-semibold italic text-bordo">não deu para entrar</p>
          <p className="mt-2 text-sm text-cinza">{erro}</p>
          <Link
            href="/entrar"
            className="mt-6 inline-flex min-h-11 items-center rounded-pill bg-bordo px-6 text-sm font-semibold text-creme"
          >
            voltar para entrar
          </Link>
        </div>
      ) : (
        <Animacao tipo="livro" titulo="abrindo sua estante" sub="só um instante" />
      )}
    </Tela>
  );
}
