"use client";

import { useEffect, useState } from "react";

/**
 * "Instalar no celular": o site vira app pela tela de início, sem loja.
 * Já instalado (aberto em tela cheia), mostra só um aviso.
 */
export function InstalarApp() {
  const [modo, setModo] = useState<"carregando" | "instalado" | "iphone" | "android" | "outro">("carregando");

  useEffect(() => {
    const instalado =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const ua = navigator.userAgent;
    setModo(instalado ? "instalado" : /iPhone|iPad|iPod/i.test(ua) ? "iphone" : /Android/i.test(ua) ? "android" : "outro");
  }, []);

  if (modo === "carregando") return null;
  if (modo === "instalado")
    return <p className="font-accent text-sm italic text-cinza">o app já está na sua tela de início ✦</p>;

  const passos =
    modo === "android"
      ? ["abra o site no Chrome", "toque nos três pontinhos ⋮ no canto de cima", "toque em “instalar app” (ou “adicionar à tela inicial”)"]
      : [
          "abra o site no Safari (precisa ser o Safari)",
          "toque no botão compartilhar — o quadradinho com a seta para cima",
          "role e toque em “Adicionar à Tela de Início”",
          "toque em “Adicionar”: o ícone do bookside aparece junto dos seus apps",
        ];

  return (
    <div className="rounded-md border border-linha bg-creme-quente p-4 lg:border-fio lg:bg-transparent">
      <p className="text-sm font-semibold">instalar no celular</p>
      <p className="mt-1 text-[13px] text-cinza">
        {modo === "outro"
          ? "no iPhone, abra este site no Safari e siga os passos. ele vira um app na tela de início, sem App Store."
          : "o bookside vira um app na sua tela de início, abre em tela cheia — sem App Store."}
      </p>
      <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[13px]">
        {passos.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>
      {modo === "outro" ? (
        <p className="mt-3 text-[13px] text-cinza">
          no Android: Chrome → ⋮ → “instalar app”.
        </p>
      ) : null}
    </div>
  );
}
