"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { ComConta, ErroOuFalta } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { Voltar } from "@/components/Voltar";
import { corDoLivro } from "@/lib/cores";
import { entrarComCodigo, minhasLeiturasJuntas } from "@/lib/lerjunto";
import { nomeDe, useConsulta, useMeuId } from "@/lib/social";

function Lista() {
  const eu = useMeuId();
  const router = useRouter();
  const consulta = useConsulta(() => minhasLeiturasJuntas(), []);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  useEffect(() => {
    const c = new URLSearchParams(window.location.search).get("codigo");
    if (c) setCodigo(c.toUpperCase().slice(0, 6));
  }, []);

  async function entrar() {
    setErro(null);
    try {
      const id = await entrarComCodigo(codigo);
      if (!id) return setErro("esse código não existe.");
      router.push(`/ler-junto/${id}`);
    } catch {
      setErro("não deu para entrar agora. tente de novo.");
    }
  }

  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const lista = consulta.dados ?? [];

  return (
    <div className="space-y-10">
      <section>
        {consulta.carregando && !consulta.dados ? (
          <p className="font-accent text-sm italic text-cinza">abrindo…</p>
        ) : lista.length ? (
          <ul className="grid gap-3 lg:grid-cols-2">
            {lista.map((l) => {
              const outros = l.pessoas.filter((p) => p.usuario_id !== eu);
              const total = l.livro.paginas ?? 0;
              return (
                <li key={l.id}>
                  <Link
                    href={`/ler-junto/${l.id}`}
                    className="flex gap-4 rounded-xl border border-linha bg-creme-quente p-4 hover:border-bordo lg:rounded-[6px]"
                  >
                    <CapaLivro
                      titulo={l.livro.titulo}
                      capa={l.livro.capa}
                      cor={corDoLivro(l.livro.id)}
                      className="w-14 flex-none [&>span:last-child]:hidden"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-lg font-semibold italic text-ameixa lg:font-revista lg:font-normal">
                        {l.livro.titulo}
                      </span>
                      <span className="block truncate text-xs text-cinza">
                        com{" "}
                        {outros.length
                          ? outros.map((p) => nomeDe(p.pessoa)).join(", ")
                          : "ninguém ainda — mande o convite"}
                      </span>
                      <span className="mt-3 block space-y-1.5">
                        {l.pessoas.slice(0, 4).map((p) => (
                          <span
                            key={p.usuario_id}
                            className="flex items-center gap-2"
                          >
                            <Avatar pessoa={p.pessoa} tamanho={18} />
                            <span className="block h-1.5 flex-1 overflow-hidden rounded-full bg-linha/70">
                              <span
                                className="block h-full rounded-full bg-bordo"
                                style={{
                                  width: `${p.terminou ? 100 : total ? Math.min(100, (p.pagina / total) * 100) : 0}%`,
                                }}
                              />
                            </span>
                          </span>
                        ))}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="font-accent text-[15px] italic text-cinza">
            nenhuma leitura junta ainda ✦
          </p>
        )}
        <Link
          href="/ler-junto/novo"
          className="mt-5 inline-flex h-12 items-center rounded-pill bg-bordo px-7 text-sm font-semibold text-creme hover:bg-bordo-suave"
        >
          + ler junto com alguém
        </Link>
      </section>

      <section>
        <h2 className="border-b border-linha pb-2 font-display text-[22px] font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
          recebeu um convite?
        </h2>
        <div className="mt-4 flex max-w-[420px] gap-2">
          <input
            value={codigo}
            onChange={(e) =>
              setCodigo(e.target.value.toUpperCase().slice(0, 6))
            }
            placeholder="código"
            className="h-12 min-w-0 flex-1 rounded-[12px] border border-bege bg-creme-quente px-4 font-mono text-lg tracking-[.2em] uppercase outline-none focus:border-bordo lg:rounded-[4px]"
          />
          <button
            type="button"
            onClick={entrar}
            disabled={codigo.length < 6}
            className="h-12 rounded-pill bg-bordo px-6 text-sm font-semibold text-creme disabled:opacity-45"
          >
            entrar
          </button>
        </div>
        {erro ? <p className="mt-2 text-[13px] text-bordo">{erro}</p> : null}
      </section>
    </div>
  );
}

export default function LerJuntoPage() {
  return (
    <AppShell aba="clubes">
      <div className="flex flex-1 flex-col px-6 pt-2 pb-10 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="w-full max-w-[1000px]">
          <Voltar
            padrao="/clubes"
            rotulo="clubes"
            className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo"
          />
          <h1 className="mt-1 font-display text-[32px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[44px] lg:font-normal lg:text-tinta">
            ler junto
          </h1>
          <p className="mt-1.5 mb-8 font-accent text-sm italic text-cinza">
            o mesmo livro com um amigo: cada um na sua página, e uma conversa
            sem spoiler ✦
          </p>
          <ComConta>
            <Lista />
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
