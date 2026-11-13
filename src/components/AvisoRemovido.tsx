"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";

const CHAVE = "bookside-removido";

/** Guarda o livro tirado da estante, para dar para desfazer na tela seguinte. */
export function lembrarRemovido(livro: LivroSalvo, favorito: boolean) {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify({ livro, favorito }));
  } catch {
    /* sem sessionStorage: só não dá para desfazer */
  }
}

function Aviso() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const titulo = params.get("removido");
  const [guardado, setGuardado] = useState<{ livro: LivroSalvo; favorito: boolean } | null>(null);

  useEffect(() => {
    try {
      const v = sessionStorage.getItem(CHAVE);
      setGuardado(v ? JSON.parse(v) : null);
    } catch {
      setGuardado(null);
    }
  }, [titulo]);

  if (!titulo) return null;

  function fechar() {
    try {
      sessionStorage.removeItem(CHAVE);
    } catch {}
    router.replace(pathname, { scroll: false });
  }

  function desfazer() {
    if (!guardado) return;
    const { livro, favorito } = guardado;
    usePerfil.setState((s) => ({
      livros: s.livros.some((l) => l.id === livro.id) ? s.livros : [...s.livros, livro],
      favoritos: favorito && !s.favoritos.includes(livro.id) ? [...s.favoritos, livro.id] : s.favoritos,
    }));
    fechar();
  }

  return (
    <div
      role="status"
      className="mx-6 mt-3 flex items-center gap-3 rounded-md bg-ameixa px-4 py-3 text-[13px] text-creme lg:mx-14 lg:mt-6"
    >
      <span className="min-w-0 flex-1">
        <i className="font-accent">{titulo}</i> saiu da sua estante.
      </span>
      {guardado ? (
        <button
          type="button"
          onClick={desfazer}
          className="min-h-9 flex-none font-semibold text-rosa-claro underline underline-offset-4"
        >
          desfazer
        </button>
      ) : null}
      <button
        type="button"
        onClick={fechar}
        aria-label="fechar aviso"
        className="flex size-9 flex-none items-center justify-center text-creme/80"
      >
        ✕
      </button>
    </div>
  );
}

/** Aviso "tal livro saiu da sua estante · desfazer" (lê ?removido= da URL). */
export function AvisoRemovido() {
  return (
    <Suspense fallback={null}>
      <Aviso />
    </Suspense>
  );
}
