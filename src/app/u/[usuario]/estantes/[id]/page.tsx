"use client";

import { PilhaDeCapas } from "@/components/estantes/Vitrine";
import { BotaoFiltros, PainelFiltros } from "@/components/estantes/PainelFiltros";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  FilaDaPrateleira,
  ListaDeLivros,
  SeletorDeVista,
  useVistaSalva,
} from "@/components/estantes/Biblioteca";
import { estantesDela } from "@/components/perfil/DaAmiga";
import { Carregando, ComConta, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { Voltar } from "@/components/Voltar";
import { lembrarLivros } from "@/lib/catalogo";
import { perfilInicial, type Perfil } from "@/lib/perfil-store";
import { perfilPorUsuario, useConsulta } from "@/lib/social";

/** a estante de outra leitora, só para ver: estante (capas ou lombadas) ou grade */
function EstanteDela({ usuario, id }: { usuario: string; id: string }) {
  const [vista, setVista] = useVistaSalva();
  const [extra, setExtra] = useState<{ ordem: string; autor?: string; notaMin?: number }>({ ordem: "padrao" });
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [largura, setLargura] = useState(1200);
  useEffect(() => {
    const medir = () => setLargura(window.innerWidth);
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);
  const consulta = useConsulta(async () => {
    const pessoa = await perfilPorUsuario(usuario);
    if (pessoa) lembrarLivros(pessoa.dados.livros ?? []);
    return pessoa;
  }, [usuario]);

  if (consulta.carregando && !consulta.dados) return <Carregando texto="abrindo a estante…" linhas={2} />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const pessoa = consulta.dados;
  if (!pessoa) return <Vazio titulo={`não achamos @${usuario}`} acao={{ href: "/pessoas", rotulo: "buscar pessoas" }} />;
  const p = { ...perfilInicial, ...pessoa.dados } as Perfil;
  const estante = estantesDela(p).find((e) => e.id === id);
  const nome = (pessoa.nome || pessoa.usuario || "").split(" ")[0].toLowerCase();
  if (!estante) return <Vazio titulo="essa estante não está disponível" texto="ela pode estar vazia ou privada." />;

  const autores = [...new Set(estante.livros.map((l) => l.autor).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const livros = estante.livros
    .filter((l) => (!extra.autor || l.autor === extra.autor) && (!extra.notaMin || (l.nota ?? 0) >= extra.notaMin))
    .sort((a, b) =>
      extra.ordem === "titulo" ? a.titulo.localeCompare(b.titulo, "pt-BR") : extra.ordem === "autor" ? (a.autor ?? "").localeCompare(b.autor ?? "", "pt-BR") : extra.ordem === "avaliacao" ? (b.nota ?? 0) - (a.nota ?? 0) : 0,
    );
  const ativos = [extra.autor, extra.notaMin, extra.ordem !== "padrao" ? extra.ordem : null].filter(Boolean).length;
  const util = largura >= 1024 ? largura - 380 : largura - 48;
  const modo = vista;
  const lombadas = modo === "pe";
  const porAndar = Math.max(3, Math.floor(util / (lombadas ? 38 : 118)));

  return (
    <div>
      <p className="text-[12px] text-cinza">estante de {nome}</p>
      <h1 className="mt-1 font-revista text-[32px] leading-none text-bordo italic lg:text-[40px]">{estante.nome}</h1>
      <p className="mt-2 text-[13px] text-tinta-suave">
        {estante.livros.length} {estante.livros.length === 1 ? "livro" : "livros"}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-linha pb-4 lg:border-fio">
        {estante.livros.length > 1 ? <BotaoFiltros ativos={ativos} onAbrir={() => setFiltrosAbertos(true)} /> : <span />}
        <SeletorDeVista vista={modo} onChange={setVista} />
      </div>
      <div className="pt-8">
        {modo === "estante" || modo === "pe" ? (
          <div className="space-y-10">
            {Array.from({ length: Math.ceil(livros.length / porAndar) }, (_, k) => (
              <FilaDaPrateleira key={k} livros={livros.slice(k * porAndar, (k + 1) * porAndar)} altura={150} face={lombadas ? "lombadas" : "capas"} />
            ))}
          </div>
        ) : modo === "leque" ? (
          <PilhaDeCapas livros={livros.map((l) => ({ id: l.id, titulo: l.titulo, autor: l.autor, capa: l.capa, paginas: l.paginas }))} />
        ) : (
          <ListaDeLivros livros={livros} acoesDoLivro={() => []} estantesDoLivro={() => []} />
        )}
      </div>
      {filtrosAbertos ? (
        <PainelFiltros
          ativos={ativos}
          onLimpar={() => setExtra({ ordem: "padrao" })}
          onFechar={() => setFiltrosAbertos(false)}
          campos={[
            { rotulo: "Ordenar por", valor: extra.ordem, opcoes: [["padrao", "Ordem da estante"], ["titulo", "Título"], ["autor", "Autor"], ["avaliacao", "Avaliação"]], onMudar: (v) => setExtra((e) => ({ ...e, ordem: v })) },
            ...(autores.length > 1 ? [{ rotulo: "Autor", valor: extra.autor ?? "", opcoes: [["", "todos"], ...autores.map((a) => [a, a] as [string, string])] as [string, string][], onMudar: (v: string) => setExtra((e) => ({ ...e, autor: v || undefined })) }] : []),
            ...(estante.livros.some((l) => l.nota) ? [{ rotulo: `Avaliação de ${nome}`, valor: String(extra.notaMin ?? ""), opcoes: [["", "qualquer"], ["3", "3 ou mais"], ["4", "4 ou mais"], ["4.5", "4,5 ou mais"]] as [string, string][], onMudar: (v: string) => setExtra((e) => ({ ...e, notaMin: v ? Number(v) : undefined })) }] : []),
          ]}
        />
      ) : null}
    </div>
  );
}

export default function EstanteDelaPage() {
  const { usuario, id } = useParams<{ usuario: string; id: string }>();
  return (
    <AppShell aba="inicio">
      <div className="mx-auto w-full max-w-[1240px] px-5 pt-2 pb-16 sm:px-8 lg:px-14 lg:pt-8">
        <Voltar padrao={`/u/${usuario}`} rotulo="perfil" className="-ml-2 mb-3 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo" />
        <ComConta>
          <EstanteDela usuario={decodeURIComponent(usuario)} id={id} />
        </ComConta>
      </div>
    </AppShell>
  );
}
