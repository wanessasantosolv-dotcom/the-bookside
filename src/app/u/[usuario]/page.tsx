"use client";

import { Voltar } from "@/components/Voltar";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { PerfilEditorial, type AbaDoPerfil } from "@/components/perfil/PerfilEditorial";
import { EstantesDela, JornadaResumida } from "@/components/perfil/DaAmiga";
import {
  Carregando,
  ComConta,
  ErroOuFalta,
  Vazio,
} from "@/components/social/Estados";
import { BotaoSeguir, CartaoAtividade } from "@/components/social/Pessoas";
import { lembrarLivros } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { estiloDoPerfil } from "@/lib/tema";
import { estanteDoPerfil } from "@/lib/temas";
import { calcularMatch, rotuloDoMatch, type Match } from "@/lib/match";
import { linkDaAutoria } from "@/lib/autores";
import { AnelMatch } from "@/components/social/AnelMatch";
import { estrelas, numerosDoPerfil, porDataDeLeitura } from "@/lib/estantes";
import { useModoEscuro } from "@/components/Aparencia";
import {
  perfilInicial,
  usePerfil,
  type LivroSalvo,
  type Perfil,
} from "@/lib/perfil-store";
import {
  atividadesDe,
  contagemSeguidores,
  idsQueSigo,
  perfilPorUsuario,
  useConsulta,
  useMeuId,
} from "@/lib/social";
import { arquetipos, type ArquetipoId } from "@/lib/teste";

/** "vocês duas": o match com essa leitora, no perfil dela */
function SecaoMatch({
  match,
  nome,
  id,
}: {
  match: Match;
  nome: string;
  id?: string;
}) {
  const m = match;
  const lista = (titulo: string, livros: LivroSalvo[]) =>
    livros.length ? (
      <div className="mt-4">
        <p className="text-[10px] font-semibold tracking-[.14em] text-[var(--suave)] uppercase">
          {titulo}
        </p>
        <ul className="mt-2 flex gap-2 overflow-x-auto [scrollbar-width:none]">
          {livros.slice(0, 6).map((l) => (
            <li key={l.id} className="w-[52px] flex-none">
              <Link href={`/livro/${l.id}`}>
                <CapaLivro
                  titulo={l.titulo}
                  capa={l.capa}
                  cor={corDoLivro(l.id)}
                  className="w-full [&>span:last-child]:hidden"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    ) : null;
  return (
    <section
      id={id}
      className="mt-7 scroll-mt-6 rounded-[16px] border border-[var(--linha)] p-4"
    >
      <div className="flex items-center gap-3.5">
        <AnelMatch pontos={m.pontos} tamanho={70} />
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[.14em] text-[var(--suave)] uppercase">
            match de leitura
          </p>
          <h2 className="font-display text-[21px] leading-tight font-semibold italic text-[var(--acc)]">
            {rotuloDoMatch(m.pontos)}
          </h2>
          <p className="mt-0.5 text-[12px] text-[var(--suave)]">{m.resumo}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 border-y border-[var(--linha)] text-center">
        {[
          { n: m.emComum.length, r: "em comum" },
          { n: m.concordam, r: "notas iguais" },
          { n: m.autorias.length, r: "autorias" },
        ].map((x, i) => (
          <div
            key={x.r}
            className={`py-2.5 ${i ? "border-l border-[var(--linha)]" : ""}`}
          >
            <dt className="sr-only">{x.r}</dt>
            <dd>
              <b className="block font-display text-xl leading-none font-semibold text-[var(--acc)]">
                {x.n}
              </b>
              <span className="mt-1 block text-[9px] font-semibold tracking-[.1em] text-[var(--suave)] uppercase">
                {x.r}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      {lista("as duas amaram", m.amaram)}
      {lista(`${nome} pode te indicar`, m.paraVoce)}
      {lista("você pode indicar pra ela", m.paraEla)}
      {m.autorias.length || m.generos.length ? (
        <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
          {m.autorias.slice(0, 4).map((a) => (
            <Link
              key={a}
              href={linkDaAutoria(a)}
              className="rounded-pill bg-rosa-fundo px-2.5 py-1 font-semibold text-bordo"
            >
              {a}
            </Link>
          ))}
          {m.generos.slice(0, 4).map((g) => (
            <span
              key={g}
              className="rounded-pill border border-[var(--linha)] px-2.5 py-1 font-semibold"
            >
              {g}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}

const ABAS_DELA: AbaDoPerfil[] = ["geral", "jornada", "resenhas", "estantes"];
const abaDaUrl = (): AbaDoPerfil => {
  const a = new URLSearchParams(window.location.search).get("aba") as AbaDoPerfil | null;
  return a && ABAS_DELA.includes(a) ? a : "geral";
};

function PerfilDela({ usuario }: { usuario: string }) {
  const router = useRouter();
  const [aba, setAba] = useState<AbaDoPerfil>("geral");
  useEffect(() => {
    setAba(abaDaUrl());
    const voltar = () => setAba(abaDaUrl());
    window.addEventListener("popstate", voltar);
    return () => window.removeEventListener("popstate", voltar);
  }, []);
  function mudarAba(a: AbaDoPerfil) {
    setAba(a);
    window.history.pushState(null, "", a === "geral" ? `/u/${usuario}` : `/u/${usuario}?aba=${a}`);
  }
  const eu = useMeuId();
  const meuUsuario = usePerfil((s) => s.usuario);
  const modoEscuro = useModoEscuro();

  const consulta = useConsulta(async () => {
    const pessoa = await perfilPorUsuario(usuario);
    if (!pessoa) return null;
    const [numeros, sigo, atividades] = await Promise.all([
      contagemSeguidores(pessoa.id),
      idsQueSigo(),
      atividadesDe(pessoa.id, 10),
    ]);
    lembrarLivros(pessoa.dados.livros ?? []);
    return { pessoa, numeros, seguindo: sigo.has(pessoa.id), atividades };
  }, [usuario]);

  useEffect(() => {
    if (consulta.dados?.pessoa.id && consulta.dados.pessoa.id === eu)
      router.replace("/perfil");
  }, [consulta.dados, eu, router]);

  if (consulta.carregando && !consulta.dados)
    return <Carregando texto="abrindo o perfil…" linhas={2} />;
  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  if (!consulta.dados)
    return (
      <div className="px-6 pt-10 lg:px-0">
        <Vazio
          titulo={`não achamos @${usuario}`}
          texto={
            usuario === meuUsuario
              ? undefined
              : "confira se o @usuário está certinho."
          }
          acao={{ href: "/pessoas", rotulo: "buscar pessoas" }}
        />
      </div>
    );

  const { pessoa, numeros, seguindo, atividades } = consulta.dados;
  const p = {
    ...perfilInicial,
    ...pessoa.dados,
    nome: pessoa.nome ?? "",
    usuario: pessoa.usuario ?? "",
  } as Perfil;
  const lidos = p.livros
    .filter((l) => l.status === "lido")
    .sort(porDataDeLeitura);
  const lendo = p.livros.filter((l) => !l.status || l.status === "lendo");
  const quero = p.livros.filter((l) => l.status === "quero");
  const favoritos = (p.favoritos ?? [])
    .map((id) => p.livros.find((l) => l.id === id))
    .filter((l) => l !== undefined)
    .slice(0, 4);
  const arquetipo = p.bookside
    ? arquetipos[p.bookside.principal as ArquetipoId]
    : null;
  const base = `/u/${pessoa.usuario}`;
  const meusLivros = new Set(
    usePerfil
      .getState()
      .livros.filter((l) => l.status === "lido")
      .map((l) => l.id),
  );
  const emComum = lidos.filter((l) => meusLivros.has(l.id)).length;
  const meuPerfil = usePerfil.getState();
  const match = calcularMatch(
    meuPerfil.livros,
    meuPerfil.gostos ?? [],
    p.livros,
    p.gostos ?? [],
  );

  const estilo = estiloDoPerfil(p.tema, modoEscuro);

  const seguidores = (
    <span className="flex gap-3">
      <Link href={`${base}/seguidores`} className="hover:underline">
        <b className="font-semibold">{numeros.seguidores}</b>{" "}
        {numeros.seguidores === 1 ? "seguidor" : "seguidores"}
      </Link>
      <Link
        href={`${base}/seguidores?aba=seguindo`}
        className="hover:underline"
      >
        <b className="font-semibold">{numeros.seguindo}</b> seguindo
      </Link>
    </span>
  );

  const nomeCurto = (p.nome || p.usuario).split(" ")[0].toLowerCase();
  const resenhasDela = p.livros
    .filter((l) => l.resenha?.trim())
    .sort((a, b) => (b.lidoEm ?? "").localeCompare(a.lidoEm ?? ""));

  return (
    <div style={{ ...estilo, ...estanteDoPerfil(p.estiloEstante, p.tema, modoEscuro).estilo }} data-previa-estante={estanteDoPerfil(p.estiloEstante, p.tema, modoEscuro).atributo} className="acc-tema">
      <PerfilEditorial
        p={p}
        proprio={false}
        pessoaId={pessoa.id}
        numeros={numeros}
        acoesDela={<BotaoSeguir id={pessoa.id} seguindo={seguindo} escuro onMudar={consulta.recarregar} />}
        match={match}
        aba={aba}
        onAba={mudarAba}
        conteudoAba={{
          jornada: <JornadaResumida p={p} nome={nomeCurto} />,
          resenhas: resenhasDela.length ? (
            <ul className="border-t border-[var(--linha)]">
              {resenhasDela.map((l) => (
                <li key={l.id} className="flex gap-4 border-b border-[var(--linha)] py-6">
                  <Link href={`/livro/${l.id}`} className="w-[72px] flex-none lg:w-[90px]">
                    <CapaLivro titulo={l.titulo} capa={l.capa} cor={corDoLivro(l.id)} className="w-full [&>span:last-child]:hidden" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/livro/${l.id}`} className="font-revista text-[20px] leading-tight text-[var(--acc)] hover:underline">
                      {l.titulo}
                    </Link>
                    <p className="mt-0.5 text-[12px] text-[var(--suave)]">
                      {l.autor}
                      {l.nota ? <span className="ml-2 text-[var(--acc)]">{estrelas(l.nota)}</span> : null}
                    </p>
                    <p className="mt-3 line-clamp-6 text-[15px] leading-[1.65] whitespace-pre-line">{l.resenha}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[14px] text-[var(--suave)]">este leitor ainda não publicou resenhas.</p>
          ),
          estantes: <EstantesDela p={p} base={base} nome={nomeCurto} />,
        }}
      />
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
