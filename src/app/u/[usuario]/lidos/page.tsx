"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { Carregando, ComConta, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { Avatar, BotaoSeguir, Topo } from "@/components/social/Pessoas";
import { lembrarLivros } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { estrelas } from "@/lib/estantes";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";
import { idsQueSigo, perfilPorUsuario, useConsulta } from "@/lib/social";

const estantes = [
  { id: "lido", rotulo: "lidos" },
  { id: "quero", rotulo: "quero ler" },
  { id: "lendo", rotulo: "lendo" },
] as const;

function Estante({ usuario }: { usuario: string }) {
  const params = useSearchParams();
  const estante = (params.get("estante") ?? "lido") as "lido" | "quero" | "lendo";
  const [soResenha, setSoResenha] = useState(false);
  const [grade, setGrade] = useState(false);
  const meus = usePerfil((s) => s.livros);

  const consulta = useConsulta(async () => {
    const pessoa = await perfilPorUsuario(usuario);
    if (!pessoa) return null;
    lembrarLivros(pessoa.dados.livros ?? []);
    return { pessoa, seguindo: (await idsQueSigo()).has(pessoa.id) };
  }, [usuario]);

  if (consulta.carregando && !consulta.dados) return <Carregando texto="abrindo a estante…" />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  if (!consulta.dados) return <Vazio className="mx-6 mt-6 lg:mx-0" titulo={`não achamos @${usuario}`} acao={{ href: "/pessoas", rotulo: "buscar pessoas" }} />;

  const { pessoa, seguindo } = consulta.dados;
  const todos: LivroSalvo[] = pessoa.dados.livros ?? [];
  const daEstante = todos.filter((l) => (estante === "lendo" ? !l.status || l.status === "lendo" : l.status === estante));
  const livros = daEstante
    .filter((l) => !soResenha || l.resenha || l.anotacao)
    .sort((a, b) => (b.lidoEm ?? b.adicionadoEm ?? "").localeCompare(a.lidoEm ?? a.adicionadoEm ?? ""));
  const meusLidos = new Set(meus.filter((l) => l.status === "lido").map((l) => l.id));
  const emComum = todos.filter((l) => l.status === "lido" && meusLidos.has(l.id)).length;
  const nome = pessoa.nome || pessoa.usuario;
  const titulo = estantes.find((e) => e.id === estante)!.rotulo;
  const pilula = (on: boolean) =>
    `flex min-h-9 items-center rounded-pill px-3.5 text-[11px] font-semibold ${on ? "bg-bordo text-creme" : "border border-bege text-ameixa"}`;

  return (
    <>
      <Topo voltar={{ href: `/u/${pessoa.usuario}`, r: "perfil" }} direita={<BotaoSeguir id={pessoa.id} seguindo={seguindo} />} />
      <div className="mt-3 flex items-center gap-3 px-6 lg:px-0">
        <Avatar pessoa={pessoa} tamanho={44} />
        <div>
          <h1 className="font-display text-[30px] leading-none font-semibold italic text-bordo lg:font-revista lg:text-[36px] lg:font-normal lg:text-tinta">
            {titulo}
          </h1>
          <p className="mt-1 font-accent text-sm italic text-cinza">
            {nome} · {daEstante.length} {daEstante.length === 1 ? "livro" : "livros"}
            {emComum ? ` · ${emComum} em comum com você` : ""}
          </p>
        </div>
      </div>

      <nav aria-label="estantes" className="mt-4 flex gap-1.5 px-6 lg:px-0">
        {estantes.map((e) => (
          <Link
            key={e.id}
            href={`/u/${pessoa.usuario}/lidos${e.id === "lido" ? "" : `?estante=${e.id}`}`}
            aria-current={e.id === estante ? "page" : undefined}
            className={pilula(e.id === estante)}
          >
            {e.rotulo}
          </Link>
        ))}
      </nav>
      <div className="mt-3 flex items-center justify-between px-6 lg:px-0">
        <button type="button" aria-pressed={soResenha} onClick={() => setSoResenha((v) => !v)} className={pilula(soResenha)}>
          com resenha
        </button>
        <div role="group" aria-label="modo de ver" className="flex overflow-hidden rounded-pill border border-bege">
          {[
            { v: false, r: "lista" },
            { v: true, r: "grade" },
          ].map((m) => (
            <button
              key={m.r}
              type="button"
              aria-pressed={grade === m.v}
              onClick={() => setGrade(m.v)}
              className={`min-h-9 px-3.5 text-[10px] font-semibold tracking-[.1em] uppercase ${grade === m.v ? "rounded-pill bg-bordo text-creme" : "text-cinza"}`}
            >
              {m.r}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pt-4 pb-8 lg:px-0">
        {!livros.length ? (
          <Vazio titulo={soResenha ? "nenhuma resenha nessa estante" : "estante vazia por enquanto"} />
        ) : grade ? (
          <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
            {livros.map((l) => (
              <li key={l.id}>
                <Link href={`/livro/${l.id}`}>
                  <CapaLivro titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className="w-full" />
                  <p className="mt-2 line-clamp-2 font-display text-sm leading-tight font-semibold italic lg:font-revista lg:font-normal">{l.titulo}</p>
                  {l.nota ? <p className="mt-1 text-[10px] text-bordo">{estrelas(l.nota)}</p> : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <ul>
            {livros.map((l) => (
              <li key={l.id} className="border-t border-linha lg:border-fio">
                <Link href={`/livro/${l.id}`} className="flex gap-3.5 py-3">
                  <CapaLivro titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className="w-[54px] [&>span:last-child]:hidden" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[9px] font-semibold tracking-[.12em] text-cinza uppercase">
                      {l.autor}
                      {meusLidos.has(l.id) ? " · você também leu" : ""}
                    </span>
                    <span className="mt-1 block font-display text-base leading-tight font-semibold italic lg:font-revista lg:font-normal">{l.titulo}</span>
                    {l.nota ? <span className="mt-1 block text-xs text-bordo">{estrelas(l.nota)}</span> : null}
                    {l.resenha || l.anotacao ? (
                      <span className="mt-1.5 line-clamp-2 block font-accent text-[13px] italic text-cinza">“{l.resenha ?? l.anotacao}”</span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {livros.length ? (
          <p className="pt-6 text-center font-accent text-[13px] italic text-cinza">
            {livros.length} de {daEstante.length} {daEstante.length === 1 ? "livro" : "livros"} ✧
          </p>
        ) : null}
      </div>
    </>
  );
}

export default function EstanteDeOutraPage() {
  const { usuario } = useParams<{ usuario: string }>();
  return (
    <AppShell aba="inicio">
      <div className="flex flex-1 flex-col lg:bg-jornal lg:px-12 lg:py-8">
        <div className="lg:max-w-[900px]">
          <ComConta>
            <Suspense fallback={<Carregando />}>
              <Estante usuario={decodeURIComponent(usuario)} />
            </Suspense>
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
