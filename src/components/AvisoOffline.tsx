"use client";

import { useEffect, useState } from "react";

/** Faixa no topo quando a internet cai: o app segue funcionando com o que está salvo no aparelho. */
export function AvisoOffline() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const atualizar = () => setOffline(!navigator.onLine);
    atualizar();
    window.addEventListener("online", atualizar);
    window.addEventListener("offline", atualizar);
    return () => {
      window.removeEventListener("online", atualizar);
      window.removeEventListener("offline", atualizar);
    };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-0 z-50 bg-ameixa px-4 py-2 text-center text-xs font-semibold text-creme">
      sem conexão · sua estante fica salva no aparelho e sincroniza quando a internet voltar ✦
    </div>
  );
}
