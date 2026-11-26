"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { ultimaExperiencia } from "@/components/comunidade/Together";

/** /comunidade abre direto a última experiência usada (clubes ou co-read), sem etapa extra */
export default function ComunidadePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(ultimaExperiencia() === "coread" ? "/co-read" : "/clubes");
  }, [router]);
  return (
    <AppShell aba="clubes">
      <div className="flex-1 lg:bg-jornal" />
    </AppShell>
  );
}
