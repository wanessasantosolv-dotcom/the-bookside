"use client";

import type { ComponentProps } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { useCapaDoLivro } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";

/** CapaLivro que procura a capa sozinha quando o livro chegou sem ela (feed, clube, amigas). */
export function CapaAuto({
  livro,
  className,
  cor,
}: {
  livro: { id: string; titulo: string; autor: string; capa?: string };
  className?: ComponentProps<typeof CapaLivro>["className"];
  cor?: string;
}) {
  const capa = useCapaDoLivro(livro);
  return <CapaLivro titulo={livro.titulo} capa={capa} cor={cor ?? corDoLivro(livro.id)} className={className} />;
}
