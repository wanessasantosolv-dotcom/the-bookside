"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import type { LivroSalvo } from "@/lib/perfil-store";

type Trecho = NonNullable<LivroSalvo["trechos"]>[number];
type Painel = "trechos" | "anotacao" | "resenha" | "novo-trecho" | null;

const data = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })
    : null;

const campo =
  "mt-1.5 w-full rounded-[10px] border border-linha bg-creme-quente px-3.5 py-2.5 text-[14px] text-ameixa outline-none focus:border-bordo lg:border-fio";

function Bloco({
  numero,
  rotulo,
  icone,
  ativo,
  onClick,
  previa,
}: {
  numero: number;
  rotulo: string;
  icone: string;
  ativo: boolean;
  onClick: () => void;
  previa?: string;
}) {
  return (
    <button
      type="button"
      aria-expanded={ativo}
      onClick={onClick}
      className={`flex min-h-[112px] flex-col items-start rounded-[12px] px-3.5 py-3 text-left transition-colors lg:px-4 ${
        ativo ? "bg-rosa-fundo" : "bg-[color-mix(in_srgb,var(--color-bege)_28%,var(--color-creme))] hover:bg-rosa-fundo/70"
      }`}
    >
      <svg
        aria-hidden
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-rosa-antigo"
      >
        {icone.split(" M").map((p, i) => (
          <path key={i} d={i ? `M${p}` : p} />
        ))}
      </svg>
      <b className="mt-2 font-display text-[26px] leading-none font-semibold text-ameixa tabular-nums lg:font-revista lg:font-normal">
        {numero}
      </b>
      <span className="mt-1 text-[13px] text-tinta-suave">{rotulo}</span>
      {previa ? (
        <span className="mt-1 line-clamp-2 text-[11px] leading-snug text-cinza">{previa}</span>
      ) : null}
    </button>
  );
}

const ICONES = {
  aspas: "M7 7h4v4c0 3-1.5 5-4 6 M14 7h4v4c0 3-1.5 5-4 6",
  nota: "M5 4h10l4 4v12H5z M14 4v5h5 M8 13h8 M8 17h5",
  estrela: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z",
};

/**
 * "Nas suas margens": os registros pessoais da leitura — trechos, anotação
 * e resenha — com contagem, prévia e tudo abrindo aqui mesmo.
 */
export function Margens({
  livro,
  salvo,
  onTrechos,
  onAnotacao,
  ficha,
}: {
  livro: LivroSalvo;
  salvo: boolean;
  onTrechos: (t: Trecho[]) => void;
  onAnotacao: (texto: string | undefined) => void;
  /** a ficha já preenchida (nota, critérios, personagem, resenha), mostrada ao abrir a resenha */
  ficha: ReactNode;
}) {
  const [painel, setPainel] = useState<Painel>(null);
  const [todos, setTodos] = useState(false);
  const [texto, setTexto] = useState("");
  const [pagina, setPagina] = useState("");
  const [anotacao, setAnotacao] = useState(livro.anotacao ?? "");
  const trechos = livro.trechos ?? [];
  const ultimo = [...trechos].sort((a, b) => (b.em ?? "").localeCompare(a.em ?? ""))[0];
  const temResenha = !!livro.resenha;
  const alternar = (p: Painel) => setPainel((atual) => (atual === p ? null : p));

  function salvarTrecho(e: FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    const n = Number(pagina);
    onTrechos([
      ...trechos,
      { texto: t, em: new Date().toISOString(), origem: "app", ...(n > 0 ? { pagina: n } : {}) },
    ]);
    setTexto("");
    setPagina("");
    setPainel("trechos");
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-[24px] leading-tight font-semibold text-bordo lg:font-revista lg:text-[30px] lg:font-normal lg:text-tinta">
            Nas suas margens
          </h2>
          <p className="mt-0.5 text-[13px] text-cinza">seus registros desta leitura.</p>
        </div>
        {salvo ? (
          <button
            type="button"
            onClick={() => alternar("novo-trecho")}
            aria-expanded={painel === "novo-trecho"}
            className="flex-none text-[13px] font-semibold text-bordo hover:underline"
          >
            + adicionar registro
          </button>
        ) : null}
      </div>

      {!salvo ? (
        <p className="mt-4 font-accent text-sm italic text-cinza">
          guarde o livro na estante para marcar trechos, anotar e escrever a sua resenha.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            <Bloco
              numero={trechos.length}
              rotulo={trechos.length === 1 ? "trecho" : "trechos"}
              icone={ICONES.aspas}
              ativo={painel === "trechos"}
              onClick={() => alternar("trechos")}
              previa={ultimo ? `“${ultimo.texto}”` : undefined}
            />
            <Bloco
              numero={livro.anotacao ? 1 : 0}
              rotulo="anotação"
              icone={ICONES.nota}
              ativo={painel === "anotacao"}
              onClick={() => alternar("anotacao")}
              previa={livro.anotacao}
            />
            <Bloco
              numero={temResenha ? 1 : 0}
              rotulo="resenha"
              icone={ICONES.estrela}
              ativo={painel === "resenha"}
              onClick={() => alternar("resenha")}
              previa={livro.resenha}
            />
          </div>

          {painel === "novo-trecho" ? (
            <div className="mt-4 border-t border-linha pt-4 lg:border-fio">
              <form onSubmit={salvarTrecho}>
                <label className="block text-[12px] font-semibold text-ameixa">
                  um trecho que ficou
                  <textarea
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    rows={3}
                    maxLength={1000}
                    placeholder="copie aqui a frase que te marcou…"
                    className={`${campo} resize-y font-accent italic`}
                  />
                </label>
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <label className="text-[12px] font-semibold text-ameixa">
                    página (opcional)
                    <input
                      inputMode="numeric"
                      value={pagina}
                      onChange={(e) => setPagina(e.target.value.replace(/\D/g, "").slice(0, 5))}
                      className={`${campo} !w-[110px]`}
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={!texto.trim()}
                    className="h-11 rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme disabled:opacity-50"
                  >
                    guardar trecho
                  </button>
                </div>
              </form>
              <p className="mt-3 text-[12px] text-cinza">
                quer anotar algo?{" "}
                <button type="button" onClick={() => setPainel("anotacao")} className="font-semibold text-bordo underline underline-offset-2">
                  abrir a anotação
                </button>{" "}
                · quer escrever a resenha?{" "}
                <Link href={`/livro/${livro.id}/avaliar`} className="font-semibold text-bordo underline underline-offset-2">
                  abrir a ficha
                </Link>
              </p>
            </div>
          ) : null}

          {painel === "trechos" ? (
            <div className="mt-4 border-t border-linha pt-4 lg:border-fio">
              {trechos.length ? (
                <>
                  <ul className="space-y-3">
                    {(todos ? trechos : trechos.slice(-3)).map((t) => {
                      const i = trechos.indexOf(t);
                      return (
                        <li key={i} className="border-l-2 border-rosa-claro pl-3.5">
                          <p className="font-accent text-[15px] leading-snug italic text-ameixa">“{t.texto}”</p>
                          <p className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-cinza">
                            {[
                              t.pagina ? `página ${t.pagina}` : null,
                              data(t.em),
                              t.origem === "kindle" ? "do kindle" : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm("apagar este trecho?"))
                                  onTrechos(trechos.filter((_, k) => k !== i));
                              }}
                              className="font-semibold hover:text-bordo"
                            >
                              apagar
                            </button>
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                  {trechos.length > 3 ? (
                    <button
                      type="button"
                      onClick={() => setTodos((v) => !v)}
                      className="mt-3 text-[12px] font-semibold text-bordo hover:underline"
                    >
                      {todos ? "mostrar só os últimos" : `ver todos os ${trechos.length}`}
                    </button>
                  ) : null}
                </>
              ) : (
                <p className="font-accent text-sm italic text-cinza">
                  nenhum trecho ainda.{" "}
                  <button type="button" onClick={() => setPainel("novo-trecho")} className="font-semibold text-bordo not-italic underline underline-offset-2">
                    guardar o primeiro
                  </button>
                </p>
              )}
            </div>
          ) : null}

          {painel === "anotacao" ? (
            <div className="mt-4 border-t border-linha pt-4 lg:border-fio">
              <label className="block text-[12px] font-semibold text-ameixa">
                sua anotação
                <textarea
                  value={anotacao}
                  onChange={(e) => setAnotacao(e.target.value)}
                  rows={4}
                  maxLength={4000}
                  placeholder="o que você quer lembrar desta leitura?"
                  className={`${campo} resize-y`}
                />
              </label>
              <div className="mt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    onAnotacao(anotacao.trim() || undefined);
                    setPainel(null);
                  }}
                  className="h-10 rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme"
                >
                  guardar
                </button>
                {livro.anotacao ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm("apagar a anotação?")) return;
                      setAnotacao("");
                      onAnotacao(undefined);
                    }}
                    className="text-[12px] font-semibold text-cinza hover:text-bordo"
                  >
                    apagar
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {painel === "resenha" ? (
            <div className="mt-4 border-t border-linha pt-4 lg:border-fio">
              {temResenha || livro.nota ? (
                ficha
              ) : (
                <p className="font-accent text-sm italic text-cinza">
                  nenhuma resenha ainda.{" "}
                  <Link href={`/livro/${livro.id}/avaliar`} className="font-semibold text-bordo not-italic underline underline-offset-2">
                    escrever a ficha
                  </Link>
                </p>
              )}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
