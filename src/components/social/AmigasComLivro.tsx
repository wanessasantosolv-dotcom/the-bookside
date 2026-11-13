"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/social/Pessoas";
import { estrelas } from "@/lib/estantes";
import type { LivroSalvo } from "@/lib/perfil-store";
import { amigasComLivro, nomeDe, useMeuId, type PessoaResumo } from "@/lib/social";

const rotulo: Record<string, string> = { lido: "leu", lendo: "está lendo", quero: "quer ler" };

/** "entre suas amigas" na página do livro: quem você segue e tem este livro. */
export function AmigasComLivro({ livroId }: { livroId: string }) {
  const eu = useMeuId();
  const [lista, setLista] = useState<{ pessoa: PessoaResumo; livro: LivroSalvo }[] | null>(null);
  useEffect(() => {
    if (!eu) return;
    amigasComLivro(livroId)
      .then(setLista)
      .catch(() => setLista([]));
  }, [eu, livroId]);

  if (!lista?.length)
    return <p className="mt-2 font-accent text-sm italic text-cinza">quando suas amigas lerem este livro, elas aparecem aqui.</p>;
  return (
    <ul className="mt-3 space-y-3">
      {lista.map(({ pessoa, livro }) => (
        <li key={pessoa.id}>
          <Link href={pessoa.usuario ? `/u/${pessoa.usuario}` : "#"} className="flex items-start gap-2.5">
            <Avatar pessoa={pessoa} tamanho={30} />
            <span className="min-w-0 text-[13px]">
              <b className="font-semibold">{nomeDe(pessoa)}</b> <span className="text-cinza">{rotulo[livro.status ?? "lendo"] ?? "tem na estante"}</span>
              {livro.nota ? <span className="block text-xs text-bordo">{estrelas(livro.nota)}</span> : null}
              {livro.resenha ? <span className="mt-0.5 line-clamp-2 block font-accent text-[13px] italic text-cinza">“{livro.resenha}”</span> : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
