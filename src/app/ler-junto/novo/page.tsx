"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { ComConta } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { Voltar } from "@/components/Voltar";
import { corDoLivro } from "@/lib/cores";
import { criarLeituraJunta } from "@/lib/lerjunto";
import { usePerfil } from "@/lib/perfil-store";
import { idsQueSigo, nomeDe, pessoasPorId, useConsulta } from "@/lib/social";

/** Começar uma leitura junto com um ou mais amigos: o livro, quem, e um prazo (opcional). */
function Formulario() {
  const router = useRouter();
  const params = useSearchParams();
  const livros = usePerfil((s) => s.livros);
  const opcoes = livros.filter(
    (l) =>
      l.status === "lendo" || l.status === "quero" || l.status === "pausado",
  );
  const [livroId, setLivroId] = useState(
    params.get("livro") ?? opcoes[0]?.id ?? "",
  );
  const [amigos, setAmigos] = useState<string[]>([]);
  const [prazo, setPrazo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const sigo = useConsulta(async () => {
    const ids = [...(await idsQueSigo())];
    const pessoas = await pessoasPorId(ids);
    return ids.map((id) => pessoas.get(id)).filter((p) => !!p);
  }, []);
  const livro = livros.find((l) => l.id === livroId);

  async function criar() {
    if (!livro) return;
    setEnviando(true);
    setErro(null);
    try {
      const id = await criarLeituraJunta(
        {
          id: livro.id,
          titulo: livro.titulo,
          autor: livro.autor,
          capa: livro.capa,
          paginas: livro.paginas,
        },
        prazo || null,
        amigos,
      );
      router.push(`/ler-junto/${id}`);
    } catch (x) {
      const e = x as { code?: string };
      setErro(
        e?.code === "42P01" || e?.code === "PGRST205"
          ? "o banco ainda não tem o “ler junto”: rode de novo o arquivo supabase/social.sql no SQL Editor do Supabase."
          : "não deu para começar agora. tente de novo.",
      );
      setEnviando(false);
    }
  }

  const rotulo =
    "mb-2 block text-[11px] font-semibold tracking-[.12em] text-bordo uppercase";

  return (
    <div className="space-y-7">
      <section>
        <span className={rotulo}>qual livro</span>
        {opcoes.length ? (
          <ul className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:thin]">
            {opcoes.map((l) => {
              const on = l.id === livroId;
              return (
                <li key={l.id} className="w-[84px] flex-none">
                  <button
                    type="button"
                    onClick={() => setLivroId(l.id)}
                    aria-pressed={on}
                    className="block w-full text-left"
                  >
                    <CapaLivro
                      titulo={l.titulo}
                      capa={l.capa}
                      cor={corDoLivro(l.id)}
                      className={`w-full [&>span:last-child]:text-[9px] ${on ? "ring-2 ring-bordo ring-offset-2 ring-offset-creme" : "opacity-70"}`}
                    />
                    <span className="mt-1.5 line-clamp-2 block text-[11px] leading-tight font-semibold">
                      {l.titulo}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="font-accent text-sm italic text-cinza">
            coloque o livro em “lendo” ou “quero ler” na sua estante primeiro.
          </p>
        )}
      </section>

      <section>
        <span className={rotulo}>com quem</span>
        {sigo.dados?.length ? (
          <ul className="flex flex-wrap gap-2">
            {sigo.dados.map((p) => {
              const on = amigos.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setAmigos((a) =>
                        on ? a.filter((x) => x !== p.id) : [...a, p.id],
                      )
                    }
                    className={`flex h-11 items-center gap-2 rounded-pill border py-1 pr-4 pl-1 text-[13px] font-semibold ${
                      on
                        ? "border-bordo bg-bordo text-creme"
                        : "border-bege bg-creme-quente text-ameixa"
                    }`}
                  >
                    <Avatar pessoa={p} tamanho={32} />
                    {nomeDe(p)}
                    {on ? " ✓" : ""}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="font-accent text-sm italic text-cinza">
            {sigo.carregando
              ? "procurando quem você segue…"
              : "você ainda não segue ninguém — sem problema: depois de começar, você manda o código de convite."}
          </p>
        )}
        <p className="mt-2 text-xs text-cinza">
          dá para chamar mais gente depois com o código de convite.
        </p>
      </section>

      <label className="block max-w-[280px]">
        <span className={rotulo}>terminar até (opcional)</span>
        <input
          type="date"
          value={prazo}
          onChange={(e) => setPrazo(e.target.value)}
          className="h-12 w-full rounded-[12px] border border-bege bg-creme-quente px-4 text-[15px] outline-none focus:border-bordo lg:rounded-[4px]"
        />
      </label>

      {erro ? (
        <p role="alert" className="text-[13px] text-bordo">
          {erro}
        </p>
      ) : null}
      <button
        type="button"
        onClick={criar}
        disabled={!livro || enviando}
        className="h-12 w-full rounded-pill bg-bordo px-10 text-sm font-semibold text-creme hover:bg-bordo-suave disabled:opacity-45 sm:w-auto"
      >
        {enviando ? "começando…" : "começar a ler junto ✦"}
      </button>
    </div>
  );
}

export default function NovaLeituraJuntaPage() {
  return (
    <AppShell aba="clubes">
      <div className="flex flex-1 flex-col px-6 pt-2 pb-10 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="w-full max-w-[720px]">
          <Voltar
            padrao="/ler-junto"
            rotulo="ler junto"
            className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo"
          />
          <h1 className="mt-1 font-display text-[30px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
            ler junto
          </h1>
          <p className="mt-1.5 mb-6 font-accent text-sm italic text-cinza">
            o mesmo livro, com um amigo ou uma pequena turma — sem precisar de
            clube ✦
          </p>
          <ComConta>
            <Suspense fallback={null}>
              <Formulario />
            </Suspense>
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
