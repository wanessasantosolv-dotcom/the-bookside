"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/AppShell";
import { Carregando, ComConta, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { BotaoSeguir, LinhaPessoa, Topo } from "@/components/social/Pessoas";
import { contagemSeguidores, idsQueSigo, listaDeSeguidores, perfilPorUsuario, useConsulta } from "@/lib/social";

function Lista({ usuario }: { usuario: string }) {
  const aba = useSearchParams().get("aba") === "seguindo" ? "seguindo" : "seguidores";
  const consulta = useConsulta(async () => {
    const pessoa = await perfilPorUsuario(usuario);
    if (!pessoa) return null;
    const [lista, numeros, sigo] = await Promise.all([listaDeSeguidores(pessoa.id, aba), contagemSeguidores(pessoa.id), idsQueSigo()]);
    return { pessoa, lista, numeros, sigo };
  }, [usuario, aba]);

  if (consulta.carregando && !consulta.dados) return <Carregando texto="trazendo as pessoas…" linhas={2} />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  if (!consulta.dados) return <Vazio className="mx-6 mt-6 lg:mx-0" titulo={`não achamos @${usuario}`} />;
  const { pessoa, lista, numeros, sigo } = consulta.dados;
  const base = `/u/${pessoa.usuario}/seguidores`;

  return (
    <>
      <Topo voltar={{ href: `/u/${pessoa.usuario}`, r: pessoa.nome || pessoa.usuario || "perfil" }} rotulo="pessoas" />
      <nav aria-label="seguidores e seguindo" className="mx-6 mt-4 flex overflow-hidden rounded-pill border border-bege lg:mx-0 lg:max-w-[420px]">
        {[
          { id: "seguidores", r: `seguidores · ${numeros.seguidores}`, href: base },
          { id: "seguindo", r: `seguindo · ${numeros.seguindo}`, href: `${base}?aba=seguindo` },
        ].map((t) => (
          <Link
            key={t.id}
            href={t.href}
            aria-current={aba === t.id ? "page" : undefined}
            className={`flex min-h-11 flex-1 items-center justify-center text-[10px] font-semibold tracking-[.12em] uppercase ${
              aba === t.id ? "rounded-pill bg-bordo text-creme" : "text-cinza"
            }`}
          >
            {t.r}
          </Link>
        ))}
      </nav>
      <div className="px-6 pt-4 pb-8 lg:px-0">
        {lista.length ? (
          <ul>
            {lista.map((p) => (
              <LinhaPessoa key={p.id} pessoa={p} acao={<BotaoSeguir id={p.id} seguindo={sigo.has(p.id)} />} />
            ))}
          </ul>
        ) : (
          <Vazio titulo={aba === "seguidores" ? "ninguém segue ainda" : "ainda não segue ninguém"} />
        )}
      </div>
    </>
  );
}

export default function SeguidoresPage() {
  const { usuario } = useParams<{ usuario: string }>();
  return (
    <AppShell aba="inicio">
      <div className="flex flex-1 flex-col lg:bg-jornal lg:px-12 lg:py-8">
        <div className="lg:max-w-[720px]">
          <ComConta>
            <Suspense fallback={<Carregando />}>
              <Lista usuario={decodeURIComponent(usuario)} />
            </Suspense>
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
