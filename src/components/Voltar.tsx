"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, type ReactNode } from "react";
import { registrarTela, useVoltar } from "@/lib/navegacao";

function Rastro() {
  const pathname = usePathname();
  const busca = useSearchParams().toString();
  useEffect(() => {
    registrarTela(pathname + (busca ? `?${busca}` : ""));
  }, [pathname, busca]);
  return null;
}

/** Anota cada tela aberta no caminho do app (fica no layout raiz). */
export function RastroNavegacao() {
  return (
    <Suspense fallback={null}>
      <Rastro />
    </Suspense>
  );
}

/**
 * Botão "‹ voltar" do app: leva para a tela que trouxe a pessoa até aqui,
 * não importa o histórico do navegador. Sem caminho (link aberto direto),
 * vai para `padrao`. O `rotulo` (ex. "estantes") só aparece quando o destino
 * é mesmo o padrão; senão fica "voltar".
 */
export function Voltar({
  padrao,
  rotulo,
  className,
  sempre,
  children,
}: {
  padrao: string;
  rotulo?: string;
  className?: string;
  /** mostra o rótulo mesmo quando o destino é outro (ex. nome do livro) */
  sempre?: boolean;
  children?: ReactNode;
}) {
  const v = useVoltar(padrao);
  const texto = rotulo && (sempre || v.mesmaQueOPadrao) ? rotulo : "voltar";
  return (
    <Link href={v.href} className={className}>
      {children ?? `‹ ${texto}`}
    </Link>
  );
}
