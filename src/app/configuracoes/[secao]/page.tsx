"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Configuracoes, type Secao } from "@/components/configuracoes/Configuracoes";

const SECOES: Secao[] = ["app", "conta", "privacidade", "dados"];

export default function SecaoPage() {
  const { secao } = useParams<{ secao: string }>();
  const router = useRouter();
  // aparência agora fica direto na primeira tela
  useEffect(() => {
    if (secao === "aparencia") router.replace("/configuracoes");
  }, [secao, router]);
  if (secao === "aparencia") return null;
  if (!SECOES.includes(secao as Secao)) notFound();
  return <Configuracoes secao={secao as Secao} />;
}
