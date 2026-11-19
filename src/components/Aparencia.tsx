"use client";

import { useEffect } from "react";
import { usePerfil } from "@/lib/perfil-store";

/** Mantém o modo escuro/claro do app em dia com a escolha da pessoa (e com o sistema, no "automático"). */
export function Aparencia() {
  const aparencia = usePerfil((s) => s.aparencia ?? "claro");
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const aplicar = () => {
      const escuro =
        aparencia === "escuro" || (aparencia === "sistema" && mq.matches);
      if (escuro) document.documentElement.dataset.modo = "escuro";
      else delete document.documentElement.dataset.modo;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", escuro ? "#1a1416" : "#6b0d24");
    };
    aplicar();
    mq.addEventListener("change", aplicar);
    return () => mq.removeEventListener("change", aplicar);
  }, [aparencia]);
  return null;
}
