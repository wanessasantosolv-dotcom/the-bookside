"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TelaApp } from "@/components/AppShell";
import {
  botaoPrincipal,
  campo,
  Rodape,
  rotuloCampo,
  TopoForm,
} from "@/components/clube/Pecas";
import {
  FichaLeitura,
  fichaEmBranco,
  notaDaFicha,
  type ValoresFicha,
} from "@/components/FichaLeitura";
import { useHidratado } from "@/components/PerfilHidratacao";
import { livroLembrado } from "@/lib/catalogo";
import { infoDoLivro, notasCompletas } from "@/lib/estantes";
import { dataDoDia, diaDaData, diaLocal } from "@/lib/datas";
import { usePerfil, type LivroSalvo, type Reacao } from "@/lib/perfil-store";

/** Avaliar um livro da estante: a mesma ficha de leitura dos clubes. */
function Formulario({ livro }: { livro: LivroSalvo & { paginas?: number } }) {
  const router = useRouter();
  const editarLivro = usePerfil((s) => s.editarLivro);
  // critérios em 0 = sem nota naquele critério
  const notas = Object.fromEntries(
    Object.entries(livro.notas ?? {}).filter(([, v]) => v),
  );
  const [ficha, setFicha] = useState<ValoresFicha>(
    fichaEmBranco({
      nota: livro.nota ?? 0,
      notas,
      personagem: livro.personagem ?? "",
      citacao: livro.citacao ?? "",
      texto: livro.resenha ?? "",
    }),
  );
  const [erro, setErro] = useState<string | null>(null);
  const [reacao, setReacao] = useState<Reacao | undefined>(livro.reacao);
  const [dia, setDia] = useState(diaDaData(livro.lidoEm) ?? diaLocal());
  const lidoEm = dataDoDia(dia);

  function salvar(e: FormEvent) {
    e.preventDefault();
    const nota = notaDaFicha(ficha);
    const abandonou = reacao === "abandonei";
    if (!nota && !reacao)
      return setErro("dê a sua nota ou escolha um veredito.");
    editarLivro(
      {
        id: livro.id,
        titulo: livro.titulo,
        autor: livro.autor,
        capa: livro.capa,
      },
      {
        status: abandonou ? "abandonado" : "lido",
        ...(abandonou ? { paradoEm: lidoEm } : { lidoEm }),
        nota: nota || undefined,
        reacao,
        ...(reacao === "favoritado" ? { amei: true } : {}),
        notas: notasCompletas(ficha.notas),
        personagem: ficha.personagem.trim() || undefined,
        citacao: ficha.citacao.trim() || undefined,
        resenha: ficha.texto.trim() || undefined,
        paginas: livro.paginas,
        ...(abandonou ? {} : { paginaAtual: livro.paginas }),
      },
    );
    router.push(`/livro/${livro.id}`);
  }

  return (
    <TelaApp aba="estantes">
      <form onSubmit={salvar} className="flex flex-1 flex-col">
        <TopoForm
          voltar={{ href: `/livro/${livro.id}`, r: livro.titulo.toLowerCase() }}
          rotulo="ficha"
          titulo={livro.titulo}
          frase={livro.nota ? "editando sua ficha ✎" : "como foi a leitura? ✓"}
        />
        <div className="mx-6 mt-5 flex-1 lg:mx-0">
          <FichaLeitura
            livro={livro}
            valores={ficha}
            onMudar={setFicha}
            reacao={reacao}
            onReacao={setReacao}
          >
            <label className="block">
              <span className={rotuloCampo}>
                {reacao === "abandonei" ? "parei em" : "terminei em"}
              </span>
              <input
                type="date"
                value={dia}
                max={diaLocal()}
                onChange={(e) => e.target.value && setDia(e.target.value)}
                className={campo}
              />
            </label>
          </FichaLeitura>
          <p className="mt-3 font-accent text-[13px] italic text-cinza">
            essa ficha fica no seu perfil, fora de qualquer clube.
          </p>
        </div>
        {erro ? (
          <p role="alert" className="mt-4 px-6 text-[13px] text-bordo lg:px-0">
            {erro}
          </p>
        ) : null}
        <Rodape>
          <button type="submit" className={botaoPrincipal}>
            salvar ficha ✎
          </button>
        </Rodape>
      </form>
    </TelaApp>
  );
}

export default function AvaliarPage() {
  const { id } = useParams<{ id: string }>();
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  if (!hidratado) return <TelaApp aba="estantes">{null}</TelaApp>;
  const livro = infoDoLivro(id, livros, livroLembrado(id));
  if (!livro) notFound();
  return <Formulario livro={livro} />;
}
