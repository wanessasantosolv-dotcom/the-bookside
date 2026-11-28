"use client";

import { AppShell } from "@/components/AppShell";
import { Caderno } from "@/components/caderno/Caderno";
import { useHidratado } from "@/components/PerfilHidratacao";
import { usePerfil } from "@/lib/perfil-store";

/** Caderno de leitura: só para a própria conta (privado). Acesso pelo perfil e pela jornada. */
export default function CadernoPage() {
  const hidratado = useHidratado();
  const email = usePerfil((s) => s.email);
  return (
    <AppShell aba="perfil">
      <div className="flex-1 bg-[#EFE8E2]">
        {!hidratado ? <p className="p-6 text-[14px] text-cinza">Abrindo o caderno</p> : !email ? <p className="p-6 text-[14px] text-cinza">Entre na sua conta para abrir seu caderno de leitura.</p> : <Caderno />}
      </div>
    </AppShell>
  );
}
