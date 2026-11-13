"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useNuvem } from "@/lib/nuvem";

/** Com o Supabase ligado, as telas do app pedem login. Sem Supabase (modo local), não faz nada. */
export function ExigeConta() {
  const router = useRouter();
  const estado = useNuvem((s) => s.estado);
  useEffect(() => {
    if (estado === "sem-conta") router.replace("/entrar");
  }, [estado, router]);
  return null;
}
