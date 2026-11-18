"use client";

import { useState } from "react";
import {
  CamposDoLivro,
  comoLivroBusca,
  livroEmBranco,
  type DadosDoLivro,
} from "@/components/CadastroLivro";
import { botaoContorno, botaoPrincipal } from "@/components/clube/Pecas";
import type { LivroBusca } from "@/lib/catalogo";

/**
 * Cadastrar um livro que a busca não achou, dentro do clube (sugerir e escolher
 * o livro da vez): o MESMO cadastro de livro do app, com os botões do clube.
 */
export function CadastroManual({
  termoInicial,
  onCancelar,
  onCadastrar,
}: {
  termoInicial: string;
  onCancelar: () => void;
  onCadastrar: (l: LivroBusca) => void;
}) {
  const [dados, setDados] = useState<DadosDoLivro>(livroEmBranco(termoInicial));
  const pronto = dados.titulo.trim().length > 0;
  return (
    <div className="mt-3 space-y-5 rounded-xl border border-linha p-4 lg:rounded-[4px] lg:border-fio">
      <p className="font-accent text-sm italic text-cinza">
        não achou na busca? cadastre ele do seu jeito ✦
      </p>
      <CamposDoLivro dados={dados} onMudar={setDados} />
      <div className="flex gap-2.5">
        <button
          type="button"
          disabled={!pronto}
          onClick={() => {
            const l = comoLivroBusca(dados);
            // foto tirada do celular é grande demais para guardar no clube
            onCadastrar(
              l.capa?.startsWith("data:") ? { ...l, capa: undefined } : l,
            );
          }}
          className={`${botaoPrincipal} flex-1`}
        >
          usar este livro
        </button>
        <button type="button" onClick={onCancelar} className={botaoContorno}>
          cancelar
        </button>
      </div>
    </div>
  );
}
