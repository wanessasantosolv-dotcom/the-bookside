"use client";

import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { ClubeProvedor } from "@/components/clube/ClubeContexto";
import { ComConta } from "@/components/social/Estados";

/** Todas as telas de um clube carregam o clube uma vez só, aqui. */
export default function ClubeLayout({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  return (
    <AppShell aba="clubes">
      <div className="flex flex-1 flex-col pb-8 lg:bg-jornal">
        <ComConta>
          <ClubeProvedor id={id}>{children}</ClubeProvedor>
        </ComConta>
      </div>
    </AppShell>
  );
}
