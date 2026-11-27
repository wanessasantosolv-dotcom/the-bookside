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
import { fichaApagada, infoDoLivro, notasCompletas } from "@/lib/estantes";
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
  // quando a pessoa sabe só o ano
  const [soAno, setSoAno] = useState(!!livro.lidoSoAno);
  const [ano, setAno] = useState(() => Number((diaDaData(livro.lidoEm) ?? diaLocal()).slice(0, 4)));
  const lidoEm = soAno ? new Date(`${ano}-01-01T12:00:00`).toISOString() : dataDoDia(dia);

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
        ...(abandonou ? { paradoEm: lidoEm } : { lidoEm, lidoSoAno: soAno || undefined }),
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

  const temFicha = !!(
    livro.nota ||
    livro.reacao ||
    livro.personagem ||
    livro.citacao ||
    livro.resenha ||
    (livro.notas && Object.values(livro.notas).some(Boolean))
  );
  function excluir() {
    if (
      !confirm(
        "excluir a sua ficha? a nota, os critérios, a personagem, o trecho e a resenha somem. o livro continua na estante.",
      )
    )
      return;
    editarLivro(livro, fichaApagada);
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
              {soAno && reacao !== "abandonei" ? (
                <input
                  type="number"
                  inputMode="numeric"
                  min={1900}
                  max={new Date().getFullYear()}
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value) || ano)}
                  aria-label="ano em que leu"
                  className={campo}
                />
              ) : (
                <input
                  type="date"
                  value={dia}
                  max={diaLocal()}
                  onChange={(e) => e.target.value && setDia(e.target.value)}
                  className={campo}
                />
              )}
            </label>
            {reacao !== "abandonei" ? (
              <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-2.5 text-[13px] text-tinta-suave">
                <input type="checkbox" checked={soAno} onChange={(e) => setSoAno(e.target.checked)} className="size-5 accent-bordo" />
                só sei o ano (não lembro o dia nem o mês)
              </label>
            ) : null}
          </FichaLeitura>
          <p className="mt-3 font-accent text-[13px] italic text-cinza">
            essa ficha fica no seu perfil, fora de qualquer clube.
          </p>
          {temFicha ? (
            <button
              type="button"
              onClick={excluir}
              className="mt-2 min-h-11 text-xs font-semibold text-cinza underline underline-offset-4 hover:text-bordo"
            >
              excluir ficha
            </button>
          ) : null}
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
