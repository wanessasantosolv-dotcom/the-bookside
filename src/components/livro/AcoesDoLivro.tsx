"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { EstanteInfo } from "@/lib/estantes";
import type { StatusLivro } from "@/lib/perfil-store";

/** um menu que abre embaixo de um botão e fecha ao tocar fora ou no Esc */
function Menu({
  botao,
  rotulo,
  children,
  alinhar = "esquerda",
  classeBotao,
}: {
  botao: ReactNode;
  rotulo: string;
  children: (fechar: () => void) => ReactNode;
  alinhar?: "esquerda" | "direita";
  classeBotao: string;
}) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) =>
      caixa.current && !caixa.current.contains(e.target as Node) && setAberto(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    document.addEventListener("mousedown", fora);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fora);
      document.removeEventListener("keydown", esc);
    };
  }, [aberto]);
  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        aria-label={rotulo}
        onClick={() => setAberto((v) => !v)}
        className={classeBotao}
      >
        {botao}
      </button>
      {aberto ? (
        <div
          role="menu"
          className={`absolute top-full z-30 mt-2 min-w-[220px] overflow-hidden rounded-[12px] border border-linha bg-creme-quente py-1.5 shadow-[0_18px_40px_-20px_rgba(43,20,32,.45)] ${
            alinhar === "direita" ? "right-0" : "left-0"
          }`}
        >
          {children(() => setAberto(false))}
        </div>
      ) : null}
    </div>
  );
}

const itemMenu =
  "flex min-h-11 w-full items-center gap-2.5 px-4 text-left text-[14px] text-ameixa hover:bg-rosa-fundo";

function Icone({ d, cheio }: { d: string; cheio?: boolean }) {
  return (
    <svg
      aria-hidden
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill={cheio ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d.split(" M").map((p, i) => (
        <path key={i} d={i ? `M${p}` : p} />
      ))}
    </svg>
  );
}

const ICONE = {
  livro: "M4 19.5V5.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v14 M6.5 22a2 2 0 0 1-2-2 2 2 0 0 1 2-2H19",
  marcador: "M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z",
  coracao: "M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z",
  compartilhar: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M8.6 13.5l6.8 4 M15.4 6.5l-6.8 4",
  mais: "M5 12h.01 M12 12h.01 M19 12h.01",
  seta: "M6 9l6 6 6-6",
};

const rotuloStatus: Record<string, string> = {
  quero: "Quero ler",
  lendo: "Estou lendo",
  lido: "Já li",
  pausado: "Pausado",
  abandonado: "Abandonado",
};

const redondo =
  "flex size-11 items-center justify-center rounded-full border border-bege text-ameixa hover:border-bordo hover:text-bordo";

/**
 * A linha de ações do livro: o status (o único botão cheio), as estantes,
 * o "amei", compartilhar e um menu com o resto.
 */
export function AcoesDoLivro({
  id,
  titulo,
  status,
  amei,
  estantes,
  naEstante,
  salvo,
  onMarcar,
  onAmei,
  onEstante,
  onTrocarCapa,
  onTirar,
}: {
  id: string;
  titulo: string;
  status: StatusLivro | null;
  amei: boolean;
  /** as estantes criadas pela pessoa */
  estantes: EstanteInfo[];
  /** em quais delas o livro está */
  naEstante: string[];
  salvo: boolean;
  onMarcar: (s: StatusLivro) => void;
  onAmei: () => void;
  onEstante: (id: string) => void;
  onTrocarCapa: () => void;
  onTirar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const url = `${window.location.origin}/livro/${encodeURIComponent(id)}`;
    try {
      if (navigator.share) await navigator.share({ title: `${titulo} · the bookside`, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }
    } catch {
      /* a pessoa cancelou */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* o status: o botão principal */}
      <Menu
        rotulo={status ? `status: ${rotuloStatus[status]}. trocar` : "adicionar à estante"}
        classeBotao="flex h-11 items-center gap-2 rounded-pill bg-bordo pr-4 pl-4 text-[14px] font-semibold text-creme hover:bg-bordo-suave"
        botao={
          <>
            <Icone d={ICONE.livro} />
            {status ? rotuloStatus[status] : "Adicionar"}
            <Icone d={ICONE.seta} />
          </>
        }
      >
        {(fechar) =>
          (["quero", "lendo", "lido", "pausado", "abandonado"] as StatusLivro[])
            .filter((s) => salvo || s === "quero" || s === "lendo" || s === "lido")
            .map((s) => (
              <button
                key={s}
                type="button"
                role="menuitemradio"
                aria-checked={status === s}
                onClick={() => {
                  fechar();
                  onMarcar(s);
                }}
                className={itemMenu}
              >
                <span aria-hidden className="w-4 text-bordo">
                  {status === s ? "✓" : ""}
                </span>
                {rotuloStatus[s]}
              </button>
            ))
        }
      </Menu>

      {/* estantes */}
      <Menu
        rotulo="estantes"
        classeBotao={redondo}
        botao={<Icone d={ICONE.marcador} cheio={naEstante.length > 0} />}
      >
        {(fechar) => (
          <>
            <p className="px-4 pt-1.5 pb-1 text-[10px] font-semibold tracking-[.14em] text-cinza uppercase">
              suas estantes
            </p>
            {estantes.length ? (
              estantes.map((e) => {
                const on = naEstante.includes(e.id);
                return (
                  <button
                    key={e.id}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={on}
                    onClick={() => onEstante(e.id)}
                    className={itemMenu}
                  >
                    <span
                      aria-hidden
                      className="size-2.5 flex-none rounded-full"
                      style={{ background: e.etiqueta.fundo }}
                    />
                    <span className="flex-1">{e.nome}</span>
                    <span aria-hidden className="text-bordo">{on ? "✓" : ""}</span>
                  </button>
                );
              })
            ) : (
              <p className="px-4 py-2 text-[13px] text-cinza">você ainda não criou estantes.</p>
            )}
            <Link href="/estantes/nova" onClick={fechar} className={`${itemMenu} text-bordo`}>
              + nova estante
            </Link>
          </>
        )}
      </Menu>

      <button
        type="button"
        aria-pressed={amei}
        aria-label={amei ? "tirar o amei" : "marcar que amei"}
        title={amei ? "você amou este livro" : "amei"}
        onClick={onAmei}
        key={amei ? "amei" : "nao"}
        className={`${redondo} ${amei ? "pulo-coracao !border-bordo bg-bordo !text-creme" : ""}`}
      >
        <Icone d={ICONE.coracao} cheio={amei} />
      </button>

      <button
        type="button"
        onClick={compartilhar}
        aria-label={copiado ? "link copiado" : "compartilhar o livro"}
        className={redondo}
      >
        <Icone d={ICONE.compartilhar} />
      </button>
      {copiado ? (
        <span role="status" className="text-[12px] text-cinza">
          link copiado ✓
        </span>
      ) : null}

      {/* o resto */}
      <Menu rotulo="mais ações" classeBotao={redondo} botao={<Icone d={ICONE.mais} />} alinhar="direita">
        {(fechar) => (
          <>
            <Link href={`/livro/${id}/avaliar`} onClick={fechar} className={itemMenu}>
              escrever ou editar a ficha
            </Link>
            {status === "lendo" ? (
              <>
                <Link href={`/livro/${id}/progresso`} onClick={fechar} className={itemMenu}>
                  atualizar progresso
                </Link>
                <Link href={`/foco?livro=${id}`} onClick={fechar} className={itemMenu}>
                  modo foco (cronômetro)
                </Link>
              </>
            ) : null}
            {status === "lendo" || status === "quero" ? (
              <Link href={`/ler-junto/novo?livro=${id}`} onClick={fechar} className={itemMenu}>
                ler junto com alguém
              </Link>
            ) : null}
            {status === "lido" || status === "lendo" ? (
              <Link
                href={`/story?tipo=${status === "lido" ? "terminei" : "lendo"}&livro=${id}`}
                onClick={fechar}
                className={itemMenu}
              >
                criar story
              </Link>
            ) : null}
            {salvo ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    fechar();
                    onTrocarCapa();
                  }}
                  className={itemMenu}
                >
                  trocar capa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    fechar();
                    onTirar();
                  }}
                  className={`${itemMenu} text-bordo`}
                >
                  tirar da estante
                </button>
              </>
            ) : null}
          </>
        )}
      </Menu>
    </div>
  );
}
