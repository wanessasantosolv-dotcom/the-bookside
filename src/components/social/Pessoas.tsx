"use client";

import { Voltar } from "@/components/Voltar";
import { CapaAuto } from "@/components/CapaAuto";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { lembrarLivros } from "@/lib/catalogo";
import { autoriaConhecida, linkDaAutoria } from "@/lib/autores";
import { estrelas } from "@/lib/estantes";
import {
  comentariosDe,
  contagemSeguidores,
  curtir,
  nomeDe,
  pessoasPorId,
  quandoFoi,
  seguir,
  useMeuId,
  verbo,
  type Atividade,
  type Comentario,
  type PessoaResumo,
} from "@/lib/social";

/** Topo das telas internas: voltar à esquerda, rótulo à direita. */
export function Topo({
  voltar,
  rotulo,
  direita,
}: {
  voltar: { href: string; r: string };
  rotulo?: string;
  direita?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between px-6 pt-2 lg:px-0 lg:pt-0">
      <Voltar
        padrao={voltar.href}
        rotulo={voltar.r}
        className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo"
      />
      {direita ??
        (rotulo ? (
          <span className="text-[11px] font-semibold tracking-[.16em] text-bordo uppercase">
            {rotulo}
          </span>
        ) : null)}
    </header>
  );
}

export function Avatar({
  pessoa,
  tamanho = 40,
  className = "",
}: {
  pessoa: PessoaResumo | null;
  tamanho?: number;
  className?: string;
}) {
  const letra = (pessoa?.nome || pessoa?.usuario || "?")
    .slice(0, 1)
    .toLowerCase();
  return (
    <span
      aria-hidden
      className={`flex flex-none items-center justify-center overflow-hidden rounded-full bg-rosa-fundo font-display font-semibold italic text-bordo ${className}`}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.42 }}
    >
      {pessoa?.foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pessoa.foto}
          alt=""
          className="size-full object-cover object-[50%_30%]"
        />
      ) : (
        letra
      )}
    </span>
  );
}

/** Botão seguir / seguindo, com resposta imediata. */
export function BotaoSeguir({
  id,
  seguindo,
  onMudar,
  escuro = false,
}: {
  id: string;
  seguindo: boolean;
  onMudar?: (sim: boolean) => void;
  escuro?: boolean;
}) {
  const [sim, setSim] = useState(seguindo);
  const [ocupado, setOcupado] = useState(false);
  const eu = useMeuId();
  if (id === eu) return null;

  async function alternar() {
    const novo = !sim;
    setSim(novo);
    setOcupado(true);
    try {
      await seguir(id, novo);
      onMudar?.(novo);
    } catch {
      setSim(!novo);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      disabled={ocupado}
      aria-pressed={sim}
      className={`flex min-h-9 flex-none items-center rounded-pill px-4 text-xs font-semibold transition-colors ${
        sim
          ? `border ${escuro ? "border-white/60 text-white" : "border-linha text-cinza"}`
          : `${escuro ? "bg-white text-bordo" : "bg-bordo text-creme"}`
      }`}
    >
      {sim ? "seguindo" : "+ seguir"}
    </button>
  );
}

export function LinhaPessoa({
  pessoa,
  detalhe,
  acao,
}: {
  pessoa: PessoaResumo;
  detalhe?: string;
  acao?: ReactNode;
}) {
  const href = pessoa.usuario ? `/u/${pessoa.usuario}` : "#";
  return (
    <li className="flex items-center gap-3 border-t border-linha py-3 lg:border-fio">
      <Link href={href} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar pessoa={pessoa} tamanho={44} />
        <span className="min-w-0">
          <span className="block truncate font-display text-[17px] leading-tight font-semibold italic text-ameixa lg:font-revista lg:font-normal">
            {pessoa.nome || pessoa.usuario}
          </span>
          <span className="block truncate text-xs text-cinza">
            @{pessoa.usuario}
            {detalhe ? ` · ${detalhe}` : ""}
          </span>
        </span>
      </Link>
      {acao}
    </li>
  );
}

/** Cartão de uma atividade do feed: quem, o quê, livro, nota, trecho, curtir e comentar. */
export function CartaoAtividade({
  a,
  pessoa,
  linkComentarios = true,
}: {
  a: Atividade;
  pessoa: PessoaResumo | null;
  linkComentarios?: boolean;
}) {
  const eu = useMeuId();
  const [curtiu, setCurtiu] = useState(a.curtidas.some((c) => c.autor === eu));
  const [total, setTotal] = useState(a.curtidas.length);
  const comentarios = a.comentarios[0]?.count ?? 0;

  async function alternarCurtida() {
    const novo = !curtiu;
    setCurtiu(novo);
    setTotal((t) => t + (novo ? 1 : -1));
    try {
      await curtir(a.id, novo);
    } catch {
      setCurtiu(!novo);
      setTotal((t) => t + (novo ? -1 : 1));
    }
  }

  const perfil = pessoa?.usuario ? `/u/${pessoa.usuario}` : "#";
  const clubeHref = a.clube ? `/clubes/${a.clube.id}` : null;
  // movimento do clube leva ao clube; o resto, ao livro
  const livroHref =
    a.tipo === "clube" && clubeHref ? clubeHref : `/livro/${a.livro.id}`;
  const [pagina, totalPaginas] =
    a.tipo === "progresso" ? (a.texto ?? "").split("/").map(Number) : [0, 0];
  const pct = totalPaginas
    ? Math.min(100, Math.round((pagina / totalPaginas) * 100))
    : 0;

  return (
    <article className="rounded-xl border border-linha bg-creme-quente p-4 lg:rounded-[4px] lg:border-fio lg:bg-transparent lg:p-5">
      {/* quem fez: a fotinha da pessoa, no celular e no computador */}
      <div className="flex items-center gap-2.5">
        <Link href={perfil}>
          <Avatar pessoa={pessoa} tamanho={30} />
        </Link>
        <p className="min-w-0 truncate text-xs font-semibold lg:text-[13px]">
          <Link href={perfil}>{a.autor === eu ? "você" : nomeDe(pessoa)}</Link>{" "}
          {a.tipo !== "clube" ? (
            <span className="font-normal text-cinza">{verbo[a.tipo]}</span>
          ) : null}
          {a.clube && clubeHref ? (
            <span className="font-normal text-cinza">
              {" "}
              · no{" "}
              <Link
                href={clubeHref}
                className="font-semibold text-bordo hover:underline"
              >
                {a.clube.nome}
              </Link>
            </span>
          ) : null}
        </p>
        <span className="ml-auto flex-none text-[10px] font-semibold tracking-[.12em] text-cinza uppercase">
          {quandoFoi(a.criado_em)}
        </span>
      </div>
      <div className="mt-3 flex gap-3.5 lg:gap-4">
        <Link
          href={livroHref}
          onClick={() => lembrarLivros([a.livro])}
          className="flex-none"
        >
          {a.livro.id.startsWith("encontro-") ? (
            <span
              aria-hidden
              className="flex aspect-[2/3] w-[52px] flex-col items-center justify-center rounded-[5px] border border-linha bg-rosa-fundo text-bordo lg:w-[58px]"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <rect x="3.5" y="5" width="17" height="15" rx="2" />
                <path d="M3.5 10h17M8 3v4M16 3v4" />
              </svg>
            </span>
          ) : (
            <CapaAuto
              livro={a.livro}
              className="w-[52px] lg:w-[58px] [&>span:last-child]:hidden"
            />
          )}
        </Link>
        <div className="min-w-0 flex-1">
          {/* encontro sem livro da vez: só o texto do encontro */}
          {a.livro.id.startsWith("encontro-") ? null : (
            <>
              <Link href={livroHref} onClick={() => lembrarLivros([a.livro])}>
                <h3 className="font-display text-[17px] leading-[1.2] font-semibold italic text-ameixa lg:font-revista lg:text-lg lg:font-normal">
                  {a.livro.titulo}
                </h3>
              </Link>

              {autoriaConhecida(a.livro.autor) ? (
                <Link
                  href={linkDaAutoria(a.livro.autor)}
                  className="mt-0.5 block text-xs text-cinza hover:text-bordo hover:underline"
                >
                  {a.livro.autor}
                </Link>
              ) : (
                <p className="mt-0.5 text-xs text-cinza">{a.livro.autor}</p>
              )}
            </>
          )}
          {a.nota ? (
            <p
              className="mt-1.5 text-[12px] font-semibold tracking-[1px] text-bordo"
              aria-label={`nota ${a.nota} de 5`}
            >
              {estrelas(Number(a.nota))}
            </p>
          ) : null}
          {a.tipo === "progresso" && totalPaginas ? (
            <div className="mt-2.5 max-w-[320px]">
              <div className="h-1.5 rounded-full bg-rosa-fundo">
                <i
                  className="block h-full rounded-full bg-progresso"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-cinza">
                página {pagina} de {totalPaginas} · {pct}%
              </p>
            </div>
          ) : a.tipo === "clube" && a.texto ? (
            <p className="mt-2 text-[13px] leading-[1.45] text-tinta-suave">
              {a.texto}
            </p>
          ) : a.texto ? (
            a.tipo === "trecho" ? (
              <blockquote className="mt-2 line-clamp-5 font-accent text-[15px] leading-[1.45] italic text-bordo lg:font-revista">
                “{a.texto}”
              </blockquote>
            ) : (
              <p
                className={`mt-2 text-[14px] leading-[1.5] break-words whitespace-pre-line text-tinta-suave ${linkComentarios ? "line-clamp-6" : ""}`}
              >
                {a.texto}
              </p>
            )
          ) : null}
          <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-cinza">
            <button
              type="button"
              onClick={alternarCurtida}
              aria-pressed={curtiu}
              className={`-ml-2 flex min-h-9 items-center gap-1 rounded-pill px-2 ${curtiu ? "text-bordo" : "hover:text-bordo"}`}
            >
              {curtiu ? "♥" : "♡"} {total ? total : "curtir"}
            </button>
            {linkComentarios ? (
              <Link
                href={`/atividade/${a.id}`}
                className="flex min-h-9 items-center rounded-pill px-2 hover:text-bordo"
              >
                {comentarios
                  ? `${comentarios} ${comentarios === 1 ? "comentário" : "comentários"}`
                  : "comentar"}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
      {linkComentarios && comentarios ? (
        <PreviaComentarios
          atividadeId={a.id}
          total={comentarios}
          versao={a.ultimoComentarioEm ?? ""}
        />
      ) : null}
    </article>
  );
}

/**
 * Os últimos comentários de uma publicação, direto no feed — para a conversa
 * aparecer junto do que foi comentado (e não só nas novidades).
 */
function PreviaComentarios({
  atividadeId,
  total,
  versao,
}: {
  atividadeId: string;
  total: number;
  versao: string;
}) {
  const [lista, setLista] = useState<
    { c: Comentario; pessoa: PessoaResumo | null }[] | null
  >(null);
  useEffect(() => {
    let vivo = true;
    comentariosDe(atividadeId)
      .then(async (todos) => {
        const ultimos = todos.slice(-2);
        const pessoas = await pessoasPorId(ultimos.map((c) => c.autor));
        if (vivo)
          setLista(
            ultimos.map((c) => ({ c, pessoa: pessoas.get(c.autor) ?? null })),
          );
      })
      .catch(() => vivo && setLista([]));
    return () => {
      vivo = false;
    };
  }, [atividadeId, total, versao]);
  if (!lista?.length) return null;
  return (
    <div className="mt-3 border-t border-linha pt-3 lg:border-fio">
      {total > lista.length ? (
        <Link
          href={`/atividade/${atividadeId}`}
          className="mb-2 block text-[11px] font-semibold text-cinza hover:text-bordo"
        >
          ver os {total} comentários
        </Link>
      ) : null}
      <ul className="space-y-2.5">
        {lista.map(({ c, pessoa }) => (
          <li key={c.id} className="flex gap-2">
            <Avatar pessoa={pessoa} tamanho={22} className="mt-0.5" />
            <p className="min-w-0 flex-1 text-[13px] leading-[1.45] break-words text-ameixa">
              <Link
                href={pessoa?.usuario ? `/u/${pessoa.usuario}` : "#"}
                className="font-semibold"
              >
                {nomeDe(pessoa)}
              </Link>{" "}
              <span className="text-tinta-suave">{c.texto}</span>
              <span className="ml-1.5 text-[10px] font-semibold tracking-[.08em] whitespace-nowrap text-cinza uppercase">
                {quandoFoi(c.criado_em)}
              </span>
            </p>
          </li>
        ))}
      </ul>
      <Link
        href={`/atividade/${atividadeId}`}
        className="mt-2 inline-flex min-h-8 items-center text-[11px] font-semibold text-bordo hover:underline"
      >
        responder →
      </Link>
    </div>
  );
}

/** "12 seguidores · 8 seguindo" com links, para o seu próprio perfil. */
export function MeusSeguidores({
  usuario,
  className = "",
}: {
  usuario: string;
  className?: string;
}) {
  const eu = useMeuId();
  const [n, setN] = useState<{ seguidores: number; seguindo: number } | null>(
    null,
  );
  useEffect(() => {
    if (!eu) return;
    contagemSeguidores(eu)
      .then(setN)
      .catch(() => setN(null));
  }, [eu]);
  if (!eu || !n || !usuario) return null;
  return (
    <span className={`flex justify-center gap-3 ${className}`}>
      <Link href={`/u/${usuario}/seguidores`} className="hover:underline">
        <b className="font-semibold">{n.seguidores}</b>{" "}
        {n.seguidores === 1 ? "seguidor" : "seguidores"}
      </Link>
      <Link
        href={`/u/${usuario}/seguidores?aba=seguindo`}
        className="hover:underline"
      >
        <b className="font-semibold">{n.seguindo}</b> seguindo
      </Link>
    </span>
  );
}
