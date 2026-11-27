"use client";

import { notFound, useParams } from "next/navigation";
import { Configuracoes, type Secao } from "@/components/configuracoes/Configuracoes";

const SECOES: Secao[] = ["aparencia", "app", "conta", "privacidade", "dados"];

export default function SecaoPage() {
  const { secao } = useParams<{ secao: string }>();
  if (!SECOES.includes(secao as Secao)) notFound();
  return <Configuracoes secao={secao as Secao} />;
}
