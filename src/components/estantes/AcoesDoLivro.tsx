"use client";

import { useState, type ReactNode } from "react";
import { NOME_STATUS, statusDe, type AcaoDoMenu } from "@/components/estantes/Biblioteca";
import { todasAsEstantes } from "@/lib/estantes";
import { usePerfil, type LivroSalvo, type StatusLivro } from "@/lib/perfil-store";

const ORDEM_STATUS: StatusLivro[] = ["lendo", "lido", "quero", "pausado", "abandonado"];
const LIMITE_FAVORITOS = 4;
const agora = () => new Date().toISOString();

/** janelinha de confirmação no estilo do app */
export function Janela({ titulo, children, onFechar }: { titulo: string; children: ReactNode; onFechar: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className="fixed inset-0 z-50 grid place-items-center bg-ameixa/40 px-6"
      onKeyDown={(e) => {
        if (e.key === "Escape") onFechar();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="w-full max-w-[380px] rounded-[12px] border border-linha bg-papel p-5">
        <h2 className="font-revista text-[22px] text-bordo italic">{titulo}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

/** as ações de um livro na estante (mover de status, pôr em estante, favoritar, remover) */
export function useAcoesDoLivro() {
  const proprias = usePerfil((s) => s.estantesProprias);
  const idsFavoritos = usePerfil((s) => s.favoritos);
  const atualizar = usePerfil((s) => s.atualizar);
  const editarLivro = usePerfil((s) => s.editarLivro);
  const removerLivro = usePerfil((s) => s.removerLivro);
  const [removendo, setRemovendo] = useState<LivroSalvo | null>(null);
  const minhas = todasAsEstantes(proprias ?? []).filter((e) => e.propria);

  const base = (l: LivroSalvo) => ({ id: l.id, titulo: l.titulo, autor: l.autor, capa: l.capa, genero: l.genero });
  const mudarStatus = (l: LivroSalvo, s: StatusLivro) =>
    editarLivro(base(l), {
      status: s,
      ...(s === "lendo" && !l.iniciadoEm ? { iniciadoEm: agora() } : {}),
      ...(s === "lido" && !l.lidoEm ? { lidoEm: agora() } : {}),
      ...(s === "pausado" || s === "abandonado" ? { paradoEm: agora() } : {}),
    });

  const acoesDoLivro = (l: LivroSalvo): AcaoDoMenu[] => {
    const favs = idsFavoritos ?? [];
    const fav = favs.includes(l.id);
    return [
      { tipo: "link", nome: "abrir ficha", href: `/livro/${l.id}` },
      ...(statusDe(l) === "lendo" ? [{ tipo: "link" as const, nome: "atualizar progresso", href: `/livro/${l.id}/progresso` }] : []),
      ...(statusDe(l) === "lido" ? [{ tipo: "link" as const, nome: "avaliar", href: `/livro/${l.id}/avaliar` }] : []),
      ...ORDEM_STATUS.filter((s) => s !== statusDe(l)).map((s) => ({
        tipo: "botao" as const,
        nome: `mover para ${s === "lido" ? "lidos" : NOME_STATUS[s]}`,
        onClick: () => mudarStatus(l, s),
      })),
      ...minhas.map((e) => ({
        tipo: "botao" as const,
        nome: `${l.estantes?.includes(e.id) ? "tirar de" : "pôr em"} “${e.nome}”`,
        onClick: () => {
          const atuais = l.estantes ?? [];
          editarLivro(base(l), { estantes: atuais.includes(e.id) ? atuais.filter((x) => x !== e.id) : [...atuais, e.id] });
        },
      })),
      ...(fav || favs.length < LIMITE_FAVORITOS
        ? [
            {
              tipo: "botao" as const,
              nome: fav ? "tirar dos favoritos" : "favoritar",
              onClick: () => atualizar({ favoritos: fav ? favs.filter((x) => x !== l.id) : [...favs, l.id] }),
            },
          ]
        : []),
      { tipo: "botao", nome: "remover da biblioteca", perigo: true, onClick: () => setRemovendo(l) },
    ];
  };

  const estantesDoLivro = (l: LivroSalvo) => minhas.filter((e) => l.estantes?.includes(e.id)).map((e) => e.nome);

  const janela = removendo ? (
    <Janela titulo={`remover “${removendo.titulo}”?`} onFechar={() => setRemovendo(null)}>
      <p className="text-[14px] text-tinta-suave">o livro sai da sua biblioteca, junto com a nota e a ficha dele.</p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={() => setRemovendo(null)} className="h-10 rounded-full px-4 text-[13px] font-semibold text-cinza hover:text-ameixa">
          cancelar
        </button>
        <button
          type="button"
          autoFocus
          onClick={() => {
            removerLivro(removendo.id);
            setRemovendo(null);
          }}
          className="h-10 rounded-full bg-bordo px-5 text-[13px] font-semibold text-creme"
        >
          remover
        </button>
      </div>
    </Janela>
  ) : null;

  return { acoesDoLivro, estantesDoLivro, janela };
}
