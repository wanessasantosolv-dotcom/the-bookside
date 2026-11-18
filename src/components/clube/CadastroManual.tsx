"use client";

import { useState, type KeyboardEvent } from "react";
import {
  botaoContorno,
  botaoPrincipal,
  campo,
  rotuloCampo,
} from "@/components/clube/Pecas";
import type { LivroBusca } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";

/**
 * Cadastrar um livro na mão quando a busca não acha (título, autoria e páginas).
 * Não é um <form> para poder ficar dentro de outro formulário (sugerir, escolher).
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
  const [titulo, setTitulo] = useState(termoInicial);
  const [autor, setAutor] = useState("");
  const [paginas, setPaginas] = useState("");

  function salvar() {
    const t = titulo.trim();
    if (!t) return;
    const id = `manual-${t
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40)}-${Date.now().toString(36)}`;
    onCadastrar({
      id,
      titulo: t,
      autor: autor.trim() || "autoria desconhecida",
      paginas: Number(paginas) || undefined,
      cor: corDoLivro(id),
    });
  }
  // enter num campo cadastra o livro, sem enviar o formulário de fora
  const enter = (e: KeyboardEvent) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    salvar();
  };

  return (
    <div className="mt-3 space-y-3 rounded-md border border-linha p-3.5 lg:border-fio">
      <p className="font-accent text-sm italic text-cinza">
        não achou na busca? cadastre ele do seu jeito ✦
      </p>
      <label className="block">
        <span className={rotuloCampo}>título *</span>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={enter}
          maxLength={200}
          autoFocus
          className={campo}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={rotuloCampo}>autoria</span>
          <input
            value={autor}
            onChange={(e) => setAutor(e.target.value)}
            onKeyDown={enter}
            maxLength={200}
            className={campo}
          />
        </label>
        <label className="block">
          <span className={rotuloCampo}>páginas</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={20000}
            value={paginas}
            onChange={(e) => setPaginas(e.target.value)}
            onKeyDown={enter}
            className={campo}
          />
        </label>
      </div>
      <div className="flex gap-2.5">
        <button
          type="button"
          onClick={salvar}
          disabled={!titulo.trim()}
          className={`${botaoPrincipal} min-h-11 flex-1`}
        >
          cadastrar livro
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className={`${botaoContorno} min-h-11`}
        >
          cancelar
        </button>
      </div>
    </div>
  );
}
