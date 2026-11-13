"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, type CSSProperties } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { PerfilWeb } from "@/components/perfil/PerfilWeb";
import { Carregando, ComConta, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { BotaoSeguir, CartaoAtividade } from "@/components/social/Pessoas";
import { lembrarLivros } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { temas } from "@/lib/dados";
import { perfilInicial, usePerfil, type Perfil } from "@/lib/perfil-store";
import { atividadesDe, contagemSeguidores, idsQueSigo, perfilPorUsuario, useConsulta, useMeuId } from "@/lib/social";
import { arquetipos, type ArquetipoId } from "@/lib/teste";

function PerfilDela({ usuario }: { usuario: string }) {
  const router = useRouter();
  const eu = useMeuId();
  const meuUsuario = usePerfil((s) => s.usuario);

  const consulta = useConsulta(async () => {
    const pessoa = await perfilPorUsuario(usuario);
    if (!pessoa) return null;
    const [numeros, sigo, atividades] = await Promise.all([contagemSeguidores(pessoa.id), idsQueSigo(), atividadesDe(pessoa.id, 10)]);
    lembrarLivros(pessoa.dados.livros ?? []);
    return { pessoa, numeros, seguindo: sigo.has(pessoa.id), atividades };
  }, [usuario]);

  useEffect(() => {
    if (consulta.dados?.pessoa.id && consulta.dados.pessoa.id === eu) router.replace("/perfil");
  }, [consulta.dados, eu, router]);

  if (consulta.carregando && !consulta.dados) return <Carregando texto="abrindo o perfil…" linhas={2} />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  if (!consulta.dados)
    return (
      <div className="px-6 pt-10 lg:px-0">
        <Vazio
          titulo={`não achamos @${usuario}`}
          texto={usuario === meuUsuario ? undefined : "confira se o @usuário está certinho."}
          acao={{ href: "/pessoas", rotulo: "buscar pessoas" }}
        />
      </div>
    );

  const { pessoa, numeros, seguindo, atividades } = consulta.dados;
  const p = { ...perfilInicial, ...pessoa.dados, nome: pessoa.nome ?? "", usuario: pessoa.usuario ?? "" } as Perfil;
  const tema = temas.find((t) => t.id === p.tema) ?? temas[0];
  const escuro = "escuro" in tema;
  const lidos = p.livros.filter((l) => l.status === "lido");
  const lendo = p.livros.filter((l) => !l.status || l.status === "lendo");
  const quero = p.livros.filter((l) => l.status === "quero");
  const favoritos = (p.favoritos ?? [])
    .map((id) => p.livros.find((l) => l.id === id))
    .filter((l) => l !== undefined)
    .slice(0, 4);
  const arquetipo = p.bookside ? arquetipos[p.bookside.principal as ArquetipoId] : null;
  const base = `/u/${pessoa.usuario}`;
  const meusLivros = new Set(usePerfil.getState().livros.filter((l) => l.status === "lido").map((l) => l.id));
  const emComum = lidos.filter((l) => meusLivros.has(l.id)).length;

  const estilo = {
    "--papel": escuro ? tema.papel : "#F9F5EE",
    "--tinta": escuro ? "#F5EFE6" : "#2B1420",
    "--acc": escuro ? tema.texto : tema.id === "biblioteca-classica" ? "#6B0D24" : tema.texto,
    "--suave": escuro ? "#CFC3B8" : "#7A6A6E",
    "--linha": escuro ? "rgba(245,239,230,.18)" : "#E6D5CE",
  } as CSSProperties;

  const seguidores = (
    <span className="flex gap-3">
      <Link href={`${base}/seguidores`} className="hover:underline">
        <b className="font-semibold">{numeros.seguidores}</b> {numeros.seguidores === 1 ? "seguidora" : "seguidores"}
      </Link>
      <Link href={`${base}/seguidores?aba=seguindo`} className="hover:underline">
        <b className="font-semibold">{numeros.seguindo}</b> seguindo
      </Link>
    </span>
  );

  return (
    <div style={estilo}>
      <PerfilWeb
        perfil={p}
        tema={tema}
        arquetipo={arquetipo}
        lidos={lidos}
        lendo={lendo}
        quero={quero}
        favoritos={favoritos}
        acoes={<BotaoSeguir id={pessoa.id} seguindo={seguindo} escuro onMudar={consulta.recarregar} />}
        detalhe={seguidores}
        links={{ numeros: `${base}/lidos`, favoritos: `${base}/lidos`, lidos: `${base}/lidos`, quero: `${base}/lidos?estante=quero` }}
      />

      <div className="flex min-h-dvh flex-col bg-[var(--papel)] text-[var(--tinta)] lg:hidden">
        <div className={`relative h-[170px] bg-cover bg-center ${p.capaImagem ? "" : `pat-${p.capa}`}`} style={p.capaImagem ? { backgroundImage: `url("${p.capaImagem}")` } : undefined}>
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute top-3 left-4 flex min-h-11 items-center rounded-pill bg-black/25 px-3 text-[13px] font-semibold text-white"
          >
            ‹ voltar
          </button>
        </div>
        <section className="relative -mt-8 rounded-t-[34px] bg-[var(--papel)] px-6 pb-8">
          <div className="mx-auto -mt-[52px] size-[104px] overflow-hidden rounded-full border-4 border-[var(--papel)] bg-linha">
            {p.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.foto} alt={`foto de ${p.nome}`} className="size-full object-cover object-[50%_30%]" />
            ) : (
              <span className="flex size-full items-center justify-center font-display text-4xl font-semibold italic text-bordo">
                {(p.nome || "?").slice(0, 1).toLowerCase()}
              </span>
            )}
          </div>
          <h1 className="mt-4 text-center font-display text-[32px] leading-none font-semibold italic text-[var(--acc)]">{p.nome || p.usuario}</h1>
          <p className="mt-2.5 text-center text-xs text-[var(--suave)]">@{p.usuario}</p>
          <div className="mt-1.5 flex justify-center text-xs text-[var(--suave)]">{seguidores}</div>
          {p.frase ? <p className="mx-4 mt-3 text-center font-accent text-[15px] leading-5 italic text-[var(--acc)]">{p.frase}</p> : null}
          <div className="mt-4 flex justify-center gap-2">
            <BotaoSeguir id={pessoa.id} seguindo={seguindo} onMudar={consulta.recarregar} />
          </div>
          {arquetipo ? (
            <p className="mt-3 text-center text-[10px] font-semibold tracking-[.1em] text-[var(--acc)] uppercase">
              ♡ {arquetipo.nome.replace(/^a /, "")} · {tema.nome}
            </p>
          ) : null}

          <Link href={`${base}/lidos`} className="mt-5 flex border-y border-[var(--linha)]">
            {[
              { n: lidos.length, r: "lidos" },
              { n: lendo.length, r: "lendo" },
              { n: quero.length, r: "quero ler" },
              { n: emComum, r: "em comum" },
            ].map((s, i) => (
              <span key={s.r} className={`flex h-14 flex-1 flex-col items-center justify-center ${i ? "border-l border-[var(--linha)]" : ""}`}>
                <b className="font-display text-xl leading-none font-semibold text-[var(--acc)]">{s.n}</b>
                <span className="mt-1 text-[9px] font-semibold tracking-[.1em] text-[var(--suave)] uppercase">{s.r}</span>
              </span>
            ))}
          </Link>

          <h2 className="mt-6 font-display text-[22px] font-semibold italic text-[var(--acc)]">favoritos dela</h2>
          {favoritos.length ? (
            <ul className="mt-2 grid grid-cols-4 gap-2">
              {favoritos.map((l) => (
                <li key={l.id}>
                  <Link href={`/livro/${l.id}`}>
                    <CapaLivro titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className="w-full" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 font-accent text-sm italic text-[var(--suave)]">nenhum favorito escolhido ainda.</p>
          )}

          <div className="mt-6 flex items-baseline justify-between">
            <h2 className="font-display text-[22px] font-semibold italic text-[var(--acc)]">estantes</h2>
            <Link href={`${base}/lidos`} className="py-2 text-[10px] font-semibold tracking-[.12em] text-[var(--acc)] uppercase">
              ver todas →
            </Link>
          </div>
          <ul className="mt-2 grid grid-cols-3 gap-[9px]">
            {[
              { nome: "lidos", livros: lidos, q: "", fundo: "#D8C3AA", cor: "#2B1420" },
              { nome: "quero ler", livros: quero, q: "?estante=quero", fundo: "#6B0D24", cor: "#F9F5EE" },
              { nome: "lendo", livros: lendo, q: "?estante=lendo", fundo: "#E8B4BF", cor: "#6B0D24" },
            ].map((e) => (
              <li key={e.nome}>
                <Link href={`${base}/lidos${e.q}`} className="block rounded-md px-2 py-2.5 text-center" style={{ background: e.fundo, color: e.cor }}>
                  <b className="block font-display text-2xl font-semibold">{e.livros.length}</b>
                  <span className="text-[11px] font-semibold">{e.nome}</span>
                </Link>
              </li>
            ))}
          </ul>

          {atividades.length ? (
            <>
              <h2 className="mt-7 font-display text-[22px] font-semibold italic text-[var(--acc)]">o que ela anda lendo</h2>
              <div className="mt-3 space-y-3 text-ameixa">
                {atividades.map((a) => (
                  <CartaoAtividade key={a.id} a={a} pessoa={pessoa} />
                ))}
              </div>
            </>
          ) : null}
        </section>
      </div>
    </div>
  );
}

export default function PerfilDeOutraPage() {
  const { usuario } = useParams<{ usuario: string }>();
  return (
    <AppShell aba="inicio" className="[&_main]:!bg-[var(--papel,#F9F5EE)]">
      <ComConta>
        <PerfilDela usuario={decodeURIComponent(usuario)} />
      </ComConta>
    </AppShell>
  );
}
