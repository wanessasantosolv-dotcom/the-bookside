"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { lembrarLivros } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { estrelas } from "@/lib/estantes";
import { contagemSeguidores, curtir, nomeDe, quandoFoi, seguir, useMeuId, verbo, type Atividade, type PessoaResumo } from "@/lib/social";

/** Topo das telas internas: voltar à esquerda, rótulo à direita. */
export function Topo({ voltar, rotulo, direita }: { voltar: { href: string; r: string }; rotulo?: string; direita?: ReactNode }) {
  return (
    <header className="flex items-center justify-between px-6 pt-2 lg:px-0 lg:pt-0">
      <Link href={voltar.href} className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo">
        ‹ {voltar.r}
      </Link>
      {direita ?? (rotulo ? <span className="text-[11px] font-semibold tracking-[.16em] text-bordo uppercase">{rotulo}</span> : null)}
    </header>
  );
}

export function Avatar({ pessoa, tamanho = 40, className = "" }: { pessoa: PessoaResumo | null; tamanho?: number; className?: string }) {
  const letra = (pessoa?.nome || pessoa?.usuario || "?").slice(0, 1).toLowerCase();
  return (
    <span
      aria-hidden
      className={`flex flex-none items-center justify-center overflow-hidden rounded-full bg-rosa-fundo font-display font-semibold italic text-bordo ${className}`}
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.42 }}
    >
      {pessoa?.foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={pessoa.foto} alt="" className="size-full object-cover object-[50%_30%]" />
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

export function LinhaPessoa({ pessoa, detalhe, acao }: { pessoa: PessoaResumo; detalhe?: string; acao?: ReactNode }) {
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
  const livroHref = `/livro/${a.livro.id}`;

  return (
    <article className="rounded-xl border border-linha bg-creme-quente p-4 lg:flex lg:gap-4 lg:rounded-[4px] lg:border-fio lg:bg-transparent lg:p-5">
      <div className="flex items-center gap-2.5 lg:hidden">
        <Link href={perfil}>
          <Avatar pessoa={pessoa} tamanho={30} />
        </Link>
        <p className="min-w-0 truncate text-xs font-semibold">
          <Link href={perfil}>{nomeDe(pessoa)}</Link> <span className="font-normal text-cinza">{verbo[a.tipo]}</span>
        </p>
        <span className="ml-auto flex-none text-[10px] font-semibold tracking-[.12em] text-cinza uppercase">{quandoFoi(a.criado_em)}</span>
      </div>
      <div className="mt-3 flex gap-3.5 lg:mt-0 lg:flex-1">
        <Link href={livroHref} onClick={() => lembrarLivros([a.livro])} className="flex-none">
          <CapaLivro titulo={a.livro.titulo} capa={a.livro.capa} cor={corDoLivro(a.livro.id)} className="w-[52px] lg:w-[58px] [&>span:last-child]:hidden" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={livroHref} onClick={() => lembrarLivros([a.livro])}>
            <h3 className="font-display text-[17px] leading-[1.2] font-semibold italic text-ameixa lg:font-revista lg:text-lg lg:font-normal">
              {a.livro.titulo}
            </h3>
          </Link>
          <p className="mt-1 hidden text-xs text-grafite lg:block">
            <Link href={perfil} className="font-semibold text-tinta hover:underline">
              {nomeDe(pessoa)}
            </Link>{" "}
            {verbo[a.tipo]} · {a.livro.autor} · {quandoFoi(a.criado_em)}
          </p>
          <p className="mt-0.5 text-xs text-cinza lg:hidden">{a.livro.autor}</p>
          {a.nota ? (
            <p className="mt-1.5 text-[12px] font-semibold tracking-[1px] text-bordo" aria-label={`nota ${a.nota} de 5`}>
              {estrelas(Number(a.nota))}
            </p>
          ) : null}
          {a.texto ? (
            <blockquote className="mt-2 line-clamp-4 font-accent text-sm leading-[1.4] italic lg:font-revista">“{a.texto}”</blockquote>
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
              <Link href={`/atividade/${a.id}`} className="flex min-h-9 items-center rounded-pill px-2 hover:text-bordo">
                {comentarios ? `${comentarios} ${comentarios === 1 ? "comentário" : "comentários"}` : "comentar"}
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

/** "12 seguidores · 8 seguindo" com links, para o seu próprio perfil. */
export function MeusSeguidores({ usuario, className = "" }: { usuario: string; className?: string }) {
  const eu = useMeuId();
  const [n, setN] = useState<{ seguidores: number; seguindo: number } | null>(null);
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
        <b className="font-semibold">{n.seguidores}</b> {n.seguidores === 1 ? "seguidora" : "seguidores"}
      </Link>
      <Link href={`/u/${usuario}/seguidores?aba=seguindo`} className="hover:underline">
        <b className="font-semibold">{n.seguindo}</b> seguindo
      </Link>
    </span>
  );
}
