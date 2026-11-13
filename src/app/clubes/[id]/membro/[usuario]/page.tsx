"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CapaLivro } from "@/components/CapaLivro";
import { Animacao } from "@/components/Animacao";
import { useClube } from "@/components/clube/ClubeContexto";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import { BotaoSeguir } from "@/components/social/Pessoas";
import { fichasDoClube, livrosDoClube, media, virgula } from "@/lib/clubes";
import { corDoLivro } from "@/lib/cores";
import { estrelas } from "@/lib/estantes";
import type { LivroSalvo } from "@/lib/perfil-store";
import { contagemSeguidores, idsQueSigo, perfilPorUsuario, useConsulta, useMeuId } from "@/lib/social";

/** Perfil de quem está no clube: papel, desde quando, números e as fichas dela aqui. */
export default function MembroPage() {
  const { usuario } = useParams<{ usuario: string }>();
  const { clube, membros } = useClube();
  const eu = useMeuId();
  const nomeUsuario = decodeURIComponent(usuario);

  const consulta = useConsulta(async () => {
    const pessoa = await perfilPorUsuario(nomeUsuario);
    if (!pessoa) return null;
    const [numeros, sigo, livros] = await Promise.all([
      contagemSeguidores(pessoa.id),
      idsQueSigo(),
      livrosDoClube(clube.id),
    ]);
    const fichas = (await fichasDoClube(livros.filter((l) => l.estado !== "sugerido").map((l) => l.id))).filter(
      (f) => f.autor === pessoa.id,
    );
    return { pessoa, numeros, seguindo: sigo.has(pessoa.id), livros, fichas };
  }, [nomeUsuario, clube.id]);

  if (consulta.carregando && !consulta.dados)
    return <Animacao tipo="livro" titulo="abrindo o perfil" sub="trazendo as fichas dela no clube" />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const membro = consulta.dados ? membros.find((m) => m.usuario_id === consulta.dados!.pessoa.id) : null;
  if (!consulta.dados || !membro)
    return (
      <div className="px-6 pt-6 lg:px-0">
        <Vazio
          titulo={`@${nomeUsuario} não está neste clube`}
          acao={{ href: `/clubes/${clube.id}`, rotulo: "voltar ao clube" }}
        />
      </div>
    );

  const { pessoa, numeros, seguindo, livros, fichas } = consulta.dados;
  const p = pessoa.dados;
  const lidos: LivroSalvo[] = (p.livros ?? []).filter((l) => l.status === "lido");
  const paginas = lidos.reduce((t, l) => t + (l.paginas ?? 0), 0);
  const m = media(lidos.map((l) => l.nota));
  const papel = membro.usuario_id === clube.criado_por ? "dona" : membro.papel;
  const destaque = fichas.find((f) => f.citacao) ?? fichas[0];
  const livroDa = (id: string) => livros.find((l) => l.id === id);

  return (
    <div className="pb-8">
      <div
        className={`relative h-[150px] bg-cover bg-center lg:mx-0 lg:h-[180px] lg:rounded-[4px] ${p.capaImagem ? "" : `pat-${p.capa ?? "linhas"}`}`}
        style={p.capaImagem ? { backgroundImage: `url("${p.capaImagem}")` } : undefined}
      >
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-2">
          <Link
            href={`/clubes/${clube.id}`}
            className="flex min-h-11 items-center rounded-pill bg-creme/85 px-3 text-[13px] font-semibold text-bordo"
          >
            ‹ {clube.nome}
          </Link>
          <span className="rounded-pill bg-creme/90 px-3 py-1.5 text-[11px] font-semibold tracking-[.14em] text-bordo uppercase">
            {papel}
          </span>
        </div>
      </div>

      <section className="px-6 text-center lg:px-0 lg:text-left">
        <div className="relative mx-auto -mt-[48px] size-[96px] overflow-hidden rounded-full border-4 border-creme bg-linha lg:mx-0 lg:ml-6 lg:border-jornal">
          {pessoa.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pessoa.foto} alt={`foto de ${pessoa.nome}`} className="size-full object-cover object-[50%_30%]" />
          ) : (
            <span className="flex size-full items-center justify-center font-display text-4xl font-semibold italic text-bordo">
              {(pessoa.nome || "?").slice(0, 1).toLowerCase()}
            </span>
          )}
        </div>
        <h1 className="mt-3 font-display text-[30px] leading-none font-semibold italic text-bordo lg:font-revista lg:text-[36px] lg:font-normal lg:text-tinta">
          {pessoa.nome || pessoa.usuario}
        </h1>
        <p className="mt-2 text-xs text-cinza">
          <Link href={`/u/${pessoa.usuario}`} className="hover:underline">
            @{pessoa.usuario}
          </Link>{" "}
          · {numeros.seguidores} {numeros.seguidores === 1 ? "seguidora" : "seguidores"} · {numeros.seguindo} seguindo
        </p>
        {p.frase ? (
          <p className="mx-auto mt-2 max-w-[24em] font-accent text-[15px] italic text-bordo lg:mx-0">{p.frase}</p>
        ) : null}
        {pessoa.id !== eu ? (
          <div className="mt-3 flex justify-center lg:justify-start">
            <BotaoSeguir id={pessoa.id} seguindo={seguindo} />
          </div>
        ) : null}

        <div className="mt-5 grid grid-cols-4 border-y border-linha lg:max-w-[560px] lg:border-fio">
          {[
            { n: lidos.length, r: "livros" },
            { n: paginas.toLocaleString("pt-BR"), r: "páginas" },
            { n: m ? `${virgula(m)}★` : "—", r: "média" },
            { n: fichas.length, r: "no clube" },
          ].map((s, i) => (
            <span key={s.r} className={`py-3 text-center ${i ? "border-l border-linha lg:border-fio" : ""}`}>
              <b className="block font-display text-xl leading-none font-semibold text-bordo lg:font-revista lg:font-normal lg:text-tinta">
                {s.n}
              </b>
              <span className="mt-1 block text-[9px] font-semibold tracking-[.1em] text-cinza uppercase">{s.r}</span>
            </span>
          ))}
        </div>
      </section>

      <section className="mt-6 px-6 lg:max-w-[720px] lg:px-0">
        <p className="text-[10px] font-semibold tracking-[.16em] text-bordo uppercase">no clube {clube.nome} desde</p>
        <p className="mt-1 text-sm">
          {new Date(membro.entrou_em).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })} · {papel}
        </p>

        {destaque ? (
          <figure className="mt-5 rounded-xl border border-linha bg-creme-quente p-4 lg:rounded-[4px] lg:border-fio lg:bg-transparent">
            <blockquote className="font-accent text-[17px] leading-[1.35] italic lg:font-revista">
              “{destaque.citacao || destaque.texto}”
            </blockquote>
            <figcaption className="mt-2 text-[10px] font-semibold tracking-[.12em] text-cinza uppercase">
              {livroDa(destaque.clube_livro_id)?.livro.titulo} · ficha
              {livroDa(destaque.clube_livro_id)?.rodada ? ` da rodada ${livroDa(destaque.clube_livro_id)?.rodada}` : ""}
            </figcaption>
          </figure>
        ) : null}

        <h2 className="mt-7 text-[10px] font-semibold tracking-[.16em] text-bordo uppercase">fichas no clube</h2>
        {fichas.length ? (
          <ul className="mt-2">
            {fichas.map((f) => {
              const l = livroDa(f.clube_livro_id);
              if (!l) return null;
              return (
                <li key={f.id} className="border-t border-linha lg:border-fio">
                  <Link href={`/clubes/${clube.id}/livro/${l.id}`} className="flex gap-3.5 py-3">
                    <CapaLivro
                      titulo={l.livro.titulo}
                      capa={l.livro.capa}
                      cor={corDoLivro(l.livro.id)}
                      className="w-11 [&>span:last-child]:hidden"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-base font-semibold italic lg:font-revista lg:font-normal">
                        {l.livro.titulo}
                      </span>
                      <span className="block text-xs text-bordo">{estrelas(Number(f.nota))}</span>
                      {f.citacao && !f.spoiler ? (
                        <span className="mt-1 line-clamp-2 block font-accent text-[13px] italic text-cinza">
                          “{f.citacao}”
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 font-accent text-sm italic text-cinza">ainda não escreveu fichas neste clube.</p>
        )}
      </section>
    </div>
  );
}
