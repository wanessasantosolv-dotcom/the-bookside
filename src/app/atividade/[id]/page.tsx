"use client";

import { Animacao } from "@/components/Animacao";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { ComConta, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { Avatar, CartaoAtividade } from "@/components/social/Pessoas";
import {
  apagarComentario,
  atividade,
  comentar,
  comentariosDe,
  nomeDe,
  pessoasPorId,
  quandoFoi,
  useConsulta,
  useMeuId,
} from "@/lib/social";

function Conversa({ id }: { id: string }) {
  const eu = useMeuId();
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const consulta = useConsulta(async () => {
    const [a, comentarios] = await Promise.all([atividade(id), comentariosDe(id)]);
    if (!a) return null;
    const pessoas = await pessoasPorId([a.autor, ...comentarios.map((c) => c.autor), ...(eu ? [eu] : [])]);
    return { a, comentarios, pessoas };
  }, [id]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      await comentar(id, texto);
      setTexto("");
      consulta.recarregar();
    } catch {
      setErro("não deu para enviar. tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  async function apagar(cid: string) {
    if (!consulta.dados) return;
    const antes = consulta.dados;
    consulta.definir({ ...antes, comentarios: antes.comentarios.filter((c) => c.id !== cid) });
    try {
      await apagarComentario(cid);
    } catch {
      consulta.definir(antes);
    }
  }

  if (consulta.carregando && !consulta.dados)
    return <Animacao tipo="escrevendo" titulo="abrindo a conversa" frase="eu também amei esse…" sub="só um instante" />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  if (!consulta.dados)
    return (
      <Vazio
        className="mx-6 mt-6 lg:mx-0"
        titulo="essa publicação não existe mais"
        acao={{ href: "/inicio", rotulo: "voltar ao início" }}
      />
    );
  const { a, comentarios, pessoas } = consulta.dados;
  const n = comentarios.length;

  return (
    <>
      <div className="px-6 pt-3 lg:px-0">
        <CartaoAtividade a={a} pessoa={pessoas.get(a.autor) ?? null} linkComentarios={false} />
      </div>
      <h2 className="mt-6 px-6 text-[10px] font-semibold tracking-[.16em] text-cinza uppercase lg:px-0">
        {n ? `${n} ${n === 1 ? "comentário" : "comentários"}` : "nenhum comentário ainda"}
      </h2>
      <ul className="mt-1 flex-1 px-6 pb-4 lg:px-0">
        {comentarios.map((c) => {
          const p = pessoas.get(c.autor) ?? null;
          const posso = c.autor === eu || a.autor === eu;
          return (
            <li key={c.id} className="flex gap-3 border-t border-linha py-3.5 lg:border-fio">
              <Link href={p?.usuario ? `/u/${p.usuario}` : "#"}>
                <Avatar pessoa={p} tamanho={30} />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">{nomeDe(p)}</p>
                <p className="mt-0.5 text-sm leading-normal break-words whitespace-pre-line">{c.texto}</p>
                <p className="mt-1 flex items-center gap-3 text-[10px] font-semibold tracking-[.1em] text-cinza uppercase">
                  {quandoFoi(c.criado_em)}
                  {posso ? (
                    <button
                      type="button"
                      onClick={() => apagar(c.id)}
                      className="min-h-6 tracking-normal normal-case underline underline-offset-2 hover:text-bordo"
                    >
                      apagar
                    </button>
                  ) : null}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <form
        onSubmit={enviar}
        className="sticky bottom-0 flex items-center gap-2.5 border-t border-linha bg-creme px-6 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] lg:static lg:border-0 lg:bg-transparent lg:px-0"
      >
        <label className="min-w-0 flex-1">
          <span className="sr-only">escreva um comentário</span>
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={1000}
            placeholder="escreva um comentário…"
            className="h-12 w-full rounded-pill border border-linha bg-creme-quente px-5 text-sm outline-none focus:border-bordo"
          />
        </label>
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          aria-label="enviar comentário"
          className="flex size-12 flex-none items-center justify-center rounded-full bg-bordo text-creme disabled:opacity-50"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 19V5M5 12l7-7 7 7" />
          </svg>
        </button>
      </form>
      {erro ? (
        <p role="alert" className="px-6 pb-3 text-[13px] text-bordo lg:px-0">
          {erro}
        </p>
      ) : null}
    </>
  );
}

export default function AtividadePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  return (
    <AppShell aba="inicio">
      <div className="flex flex-1 flex-col lg:bg-jornal lg:px-12 lg:py-8">
        <div className="flex flex-1 flex-col lg:max-w-[720px]">
          <header className="flex items-center justify-between px-6 pt-2 lg:px-0 lg:pt-0">
            <button
              type="button"
              onClick={() => router.back()}
              className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo"
            >
              ‹ voltar
            </button>
            <span className="text-[11px] font-semibold tracking-[.16em] text-bordo uppercase">comentários</span>
          </header>
          <ComConta>
            <Conversa id={id} />
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
