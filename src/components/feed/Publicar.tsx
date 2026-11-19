"use client";

import { useEffect, useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { useBuscaLivros } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { usePerfil } from "@/lib/perfil-store";
import { publicarAtividade, type LivroAtividade } from "@/lib/social";

type Tipo = "post" | "trecho";

/** "publicar": um comentário ou um trecho sobre um livro, direto no feed. */
export function Publicar({ onPublicado }: { onPublicado: () => void }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-linha bg-creme-quente px-4 py-3 text-left hover:border-bordo lg:rounded-[4px] lg:border-fio lg:bg-transparent lg:hover:bg-[#F3ECDF]"
      >
        <span
          aria-hidden
          className="flex size-9 flex-none items-center justify-center rounded-full bg-bordo text-creme"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-accent text-[15px] italic text-cinza lg:font-revista">
            o que você está achando da leitura?
          </span>
        </span>
        <span className="flex-none rounded-pill bg-bordo px-4 py-2 text-xs font-semibold text-creme">
          publicar
        </span>
      </button>
      {aberto ? (
        <Janela
          onFechar={() => setAberto(false)}
          onPublicado={() => {
            setAberto(false);
            onPublicado();
          }}
        />
      ) : null}
    </>
  );
}

function Janela({
  onFechar,
  onPublicado,
}: {
  onFechar: () => void;
  onPublicado: () => void;
}) {
  const livros = usePerfil((s) => s.livros);
  const meus = [...livros].sort(
    (a, b) =>
      (a.status === "lendo" ? 0 : 1) - (b.status === "lendo" ? 0 : 1) ||
      (b.lidoEm ?? b.adicionadoEm ?? "").localeCompare(
        a.lidoEm ?? a.adicionadoEm ?? "",
      ),
  );
  const [livro, setLivro] = useState<LivroAtividade | null>(
    meus[0]?.status === "lendo"
      ? {
          id: meus[0].id,
          titulo: meus[0].titulo,
          autor: meus[0].autor,
          capa: meus[0].capa,
        }
      : null,
  );
  const [trocando, setTrocando] = useState(!livro);
  const [termo, setTermo] = useState("");
  const [tipo, setTipo] = useState<Tipo>("post");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const busca = useBuscaLivros(termo);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onFechar]);

  const daEstante = meus
    .filter(
      (l) =>
        !termo.trim() ||
        `${l.titulo} ${l.autor}`.toLowerCase().includes(termo.toLowerCase()),
    )
    .slice(0, 6);
  const deFora =
    termo.trim().length >= 2 && busca.estado === "pronto"
      ? busca.resultados
          .filter((r) => !meus.some((m) => m.id === r.id))
          .slice(0, 5)
      : [];

  async function publicar() {
    if (!livro || !texto.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      const r = await publicarAtividade({ tipo, livro, texto });
      if (r === null) throw new Error("sem conta");
      onPublicado();
    } catch (x) {
      const e = x as { code?: string; message?: string };
      setErro(
        e?.code === "23514"
          ? "o banco do app precisa ser atualizado: rode de novo o arquivo supabase/social.sql no SQL Editor do Supabase."
          : "não deu para publicar agora. tente de novo.",
      );
      setEnviando(false);
    }
  }

  const escolher = (l: LivroAtividade) => {
    setLivro({ id: l.id, titulo: l.titulo, autor: l.autor, capa: l.capa });
    setTrocando(false);
    setTermo("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ameixa/40 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onFechar()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="publicar-titulo"
        className="max-h-[92dvh] w-full max-w-[520px] animate-subir overflow-y-auto rounded-t-[20px] bg-creme px-6 pt-6 pb-[max(24px,env(safe-area-inset-bottom))] sm:rounded-[20px]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id="publicar-titulo"
            className="font-display text-[26px] leading-[1.1] font-semibold italic text-bordo"
          >
            publicar
          </h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="fechar"
            className="-mt-1 -mr-2 flex size-11 items-center justify-center text-xl text-cinza"
          >
            ×
          </button>
        </div>

        {/* o livro */}
        <p className="mt-4 text-[11px] font-semibold tracking-[.12em] text-bordo uppercase">
          sobre qual livro?
        </p>
        {livro && !trocando ? (
          <div className="mt-2 flex items-center gap-3 rounded-[12px] border border-bordo bg-rosa-fundo/40 p-3">
            <CapaLivro
              titulo={livro.titulo}
              capa={livro.capa}
              cor={corDoLivro(livro.id)}
              className="w-10 [&>span:last-child]:hidden"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-base font-semibold italic">
                {livro.titulo}
              </span>
              <span className="block truncate text-xs text-cinza">
                {livro.autor}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setTrocando(true)}
              className="min-h-9 px-2 text-xs font-semibold text-bordo underline underline-offset-4"
            >
              trocar
            </button>
          </div>
        ) : (
          <div className="mt-2">
            <input
              type="search"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="procure na sua estante ou em qualquer lugar"
              autoFocus
              className="h-12 w-full rounded-[12px] border border-bege bg-creme-quente px-4 text-[15px] outline-none focus:border-bordo focus:ring-1 focus:ring-bordo"
            />
            <ul className="mt-2 divide-y divide-linha/70 rounded-[12px] border border-linha">
              {[...daEstante, ...deFora].map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => escolher(l)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-rosa-fundo/50"
                  >
                    <CapaLivro
                      titulo={l.titulo}
                      capa={l.capa}
                      cor={corDoLivro(l.id)}
                      className="w-8 flex-none [&>span:last-child]:hidden"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {l.titulo}
                      </span>
                      <span className="block truncate text-xs text-cinza">
                        {l.autor}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
              {busca.estado === "carregando" ? (
                <li className="px-4 py-3 font-accent text-sm italic text-cinza">
                  procurando…
                </li>
              ) : null}
              {!daEstante.length &&
              !deFora.length &&
              busca.estado !== "carregando" ? (
                <li className="px-4 py-3 font-accent text-sm italic text-cinza">
                  digite o título ou a autoria.
                </li>
              ) : null}
            </ul>
          </div>
        )}

        {/* o tipo */}
        <div
          role="radiogroup"
          aria-label="tipo de publicação"
          className="mt-5 flex gap-2"
        >
          {(
            [
              ["post", "um comentário"],
              ["trecho", "um trecho do livro"],
            ] as const
          ).map(([id, r]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={tipo === id}
              onClick={() => setTipo(id)}
              className={`flex h-9 items-center rounded-pill border px-4 text-xs font-semibold ${
                tipo === id
                  ? "border-bordo bg-bordo text-creme"
                  : "border-bege text-ameixa"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <label className="mt-3 block">
          <span className="sr-only">
            {tipo === "post" ? "seu comentário" : "o trecho"}
          </span>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={600}
            rows={4}
            placeholder={
              tipo === "post"
                ? "o que você está achando? sem spoiler, hein ✦"
                : "copie aqui o trecho que ficou com você"
            }
            className={`w-full resize-none rounded-[12px] border border-bege bg-creme-quente px-4 py-3 outline-none focus:border-bordo focus:ring-1 focus:ring-bordo ${
              tipo === "trecho"
                ? "font-accent text-[17px] italic text-bordo"
                : "text-[15px]"
            }`}
          />
          <span className="block text-right text-[11px] text-cinza">
            {texto.length}/600
          </span>
        </label>
        {erro ? (
          <p role="alert" className="mt-2 text-[13px] text-bordo">
            {erro}
          </p>
        ) : null}
        <button
          type="button"
          onClick={publicar}
          disabled={!livro || trocando || !texto.trim() || enviando}
          className="mt-4 h-12 w-full rounded-pill bg-bordo text-sm font-semibold text-creme hover:bg-bordo-suave disabled:opacity-45"
        >
          {enviando ? "publicando…" : "publicar no feed"}
        </button>
      </div>
    </div>
  );
}
