"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { useHidratado } from "@/components/PerfilHidratacao";
import {
  Carregando,
  ComConta,
  ErroOuFalta,
  Vazio,
} from "@/components/social/Estados";
import { Avatar, BotaoSeguir, Topo } from "@/components/social/Pessoas";
import { AnelMatch } from "@/components/social/AnelMatch";
import { corDoLivro } from "@/lib/cores";
import { melhoresMatches, rotuloDoMatch, type Candidata } from "@/lib/match";
import { usePerfil } from "@/lib/perfil-store";
import { idsQueSigo, nomeDe, useConsulta } from "@/lib/social";

function Cartao({ c, seguindo }: { c: Candidata; seguindo: boolean }) {
  const m = c.match;
  const capas = (m.amaram.length ? m.amaram : m.emComum).slice(0, 4);
  return (
    <li className="rounded-[14px] border border-linha bg-creme-quente p-4 lg:rounded-[6px] lg:border-fio">
      <div className="flex items-center gap-3">
        <Link href={c.usuario ? `/u/${c.usuario}` : "#"} className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar pessoa={c} tamanho={46} />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold text-ameixa">
              {nomeDe(c)}
            </span>
            <span className="block text-[10px] font-semibold tracking-[.12em] text-bordo uppercase">
              {rotuloDoMatch(m.pontos)}
            </span>
          </span>
        </Link>
        <AnelMatch pontos={m.pontos} />
      </div>
      <p className="mt-3 text-[13px] leading-[1.5] text-tinta-suave">{m.resumo}</p>
      {capas.length ? (
        <ul className="mt-3 flex gap-2">
          {capas.map((l) => (
            <li key={l.id} className="w-[46px]">
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
      ) : null}
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
        {m.autorias.slice(0, 3).map((a) => (
          <span key={a} className="rounded-pill bg-rosa-fundo px-2.5 py-1 font-semibold text-bordo">
            {a}
          </span>
        ))}
        {m.generos.slice(0, 3).map((g) => (
          <span key={g} className="rounded-pill border border-bege px-2.5 py-1 font-semibold text-ameixa">
            {g}
          </span>
        ))}
      </div>
      {m.paraVoce.length ? (
        <p className="mt-3 text-[12px] text-cinza">
          ela pode te indicar{" "}
          <b className="font-semibold text-ameixa">{m.paraVoce[0].titulo}</b>
          {m.paraVoce.length > 1 ? ` e mais ${m.paraVoce.length - 1}` : ""}
        </p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-2">
        {c.usuario ? (
          <Link
            href={`/u/${c.usuario}#match`}
            className="flex min-h-10 items-center text-[12px] font-semibold text-bordo hover:underline"
          >
            ver o match completo →
          </Link>
        ) : (
          <span />
        )}
        <BotaoSeguir id={c.id} seguindo={seguindo} />
      </div>
    </li>
  );
}

function Lista() {
  const livros = usePerfil((s) => s.livros);
  const gostos = usePerfil((s) => s.gostos);
  const lidos = livros.filter((l) => l.status === "lido").length;
  const consulta = useConsulta(async () => {
    const [lista, sigo] = await Promise.all([
      melhoresMatches(livros, gostos),
      idsQueSigo(),
    ]);
    return { lista, sigo };
  }, [lidos, gostos.join(",")]);

  if (lidos < 3)
    return (
      <div className="px-6 pt-4 lg:px-0">
        <Vazio
          titulo="marque alguns lidos primeiro"
          texto="o match compara as estantes. com pelo menos 3 livros lidos (e as notas), ele fica bem mais certeiro."
          acao={{ href: "/estantes/importar", rotulo: "importar meus lidos" }}
        />
      </div>
    );
  if (consulta.carregando && !consulta.dados)
    return <Carregando texto="comparando estantes…" linhas={3} />;
  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { lista, sigo } = consulta.dados!;
  if (!lista.length)
    return (
      <div className="px-6 pt-4 lg:px-0">
        <Vazio
          titulo="ainda sem match por aqui"
          texto="quando mais leitoras chegarem ao the bookside, as parecidas com você aparecem aqui."
          acao={{ href: "/pessoas", rotulo: "buscar pessoas" }}
        />
      </div>
    );
  return (
    <ul className="mt-5 grid gap-3 px-6 pb-10 lg:grid-cols-2 lg:px-0">
      {lista.map((c) => (
        <Cartao key={c.id} c={c} seguindo={sigo.has(c.id)} />
      ))}
    </ul>
  );
}

export default function MatchPage() {
  const hidratado = useHidratado();
  return (
    <AppShell aba="inicio">
      <div className="flex flex-1 flex-col lg:bg-jornal lg:px-12 lg:py-8">
        <div className="lg:max-w-[900px]">
          <Topo voltar={{ href: "/pessoas", r: "pessoas" }} rotulo="match" />
          <h1 className="mt-4 px-6 font-display text-[32px] leading-[1.1] font-semibold italic text-bordo lg:px-0 lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
            leitoras parecidas com você
          </h1>
          <p className="mt-1.5 px-6 font-accent text-sm italic text-cinza lg:px-0">
            pelos livros em comum, pelas notas que batem, pelas autorias e gêneros ✦
          </p>
          <ComConta>{hidratado ? <Lista /> : null}</ComConta>
        </div>
      </div>
    </AppShell>
  );
}
