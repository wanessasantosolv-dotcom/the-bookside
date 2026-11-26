"use client";

import { Animacao } from "@/components/Animacao";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useClube } from "@/components/clube/ClubeContexto";
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
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import {
  fichasDe,
  livroDoClube,
  salvarFicha,
  apagarFicha,
  type Ficha,
  type LivroDoClube,
} from "@/lib/clubes";
import { dataDoDia, diaDaData, diaLocal } from "@/lib/datas";
import { notasCompletas } from "@/lib/estantes";
import { usePerfil } from "@/lib/perfil-store";
import { useConsulta, useMeuId } from "@/lib/social";

function Formulario({ l, minha }: { l: LivroDoClube; minha: Ficha | null }) {
  const { clube } = useClube();
  const router = useRouter();
  const editarLivro = usePerfil((s) => s.editarLivro);
  const [ficha, setFicha] = useState<ValoresFicha>(
    fichaEmBranco({
      notas: minha?.notas ?? {},
      nota: minha?.nota ? Math.round(Number(minha.nota)) : 0,
      personagem: minha?.personagem ?? "",
      citacao: minha?.citacao ?? "",
      texto: minha?.texto ?? "",
      spoiler: minha?.spoiler ?? false,
    }),
  );
  const [naEstante, setNaEstante] = useState(!minha);
  // quando terminou: o fim da rodada, se já encerrou; senão, hoje
  const [dia, setDia] = useState(
    diaDaData(l.encerrado_em ?? undefined) ?? diaLocal(),
  );
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function publicar(e: FormEvent) {
    e.preventDefault();
    const nota = notaDaFicha(ficha);
    if (!nota) return setErro("dê pelo menos a sua nota.");
    setEnviando(true);
    setErro(null);
    try {
      await salvarFicha(
        l,
        {
          notas: ficha.notas,
          nota,
          personagem: ficha.personagem.trim() || null,
          citacao: ficha.citacao.trim() || null,
          texto: ficha.texto.trim() || null,
          spoiler: ficha.spoiler,
        },
        !!minha,
      );
      if (naEstante) {
        // a mesma ficha vai para a estante: nota, critérios, personagem, trecho e resenha
        editarLivro(
          {
            id: l.livro.id,
            titulo: l.livro.titulo,
            autor: l.livro.autor,
            capa: l.livro.capa,
          },
          {
            status: "lido",
            lidoEm: dataDoDia(dia),
            nota,
            notas: notasCompletas(ficha.notas),
            personagem: ficha.personagem.trim() || undefined,
            citacao: ficha.citacao.trim() || undefined,
            resenha: ficha.texto.trim() || undefined,
            paginas: l.livro.paginas,
          },
        );
      }
      router.push(`/clubes/${clube.id}/livro/${l.id}`);
    } catch {
      setErro("não foi possível publicar agora. tente de novo.");
      setEnviando(false);
    }
  }

  async function excluir() {
    if (
      !confirm(
        "excluir sua ficha de leitura? ela deixa de aparecer no clube. sua estante continua igual.",
      )
    )
      return;
    setEnviando(true);
    setErro(null);
    try {
      await apagarFicha(l);
      router.push(`/clubes/${clube.id}/livro/${l.id}`);
    } catch {
      setErro("não foi possível excluir agora. tente de novo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={publicar} className="flex min-h-[70dvh] flex-col">
      {enviando ? (
        <Animacao
          tipo="carimbo"
          titulo="publicando sua ficha"
          sub="ela aparece nas fichas de leitura do livro"
          tela
        />
      ) : null}
      <TopoForm
        voltar={{ href: `/clubes/${clube.id}/leitura`, r: "leitura atual" }}
        rotulo={l.rodada ? `rodada ${l.rodada}` : "ficha"}
        titulo={l.livro.titulo}
        frase={minha ? "editar minha ficha" : "e então, o que você achou?"}
      />
      <div className="mx-6 mt-5 lg:mx-0 lg:max-w-[640px]">
        <FichaLeitura
          livro={l.livro}
          valores={ficha}
          onMudar={setFicha}
          comSpoiler
        >
          {!minha ? (
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={naEstante}
                onChange={(e) => setNaEstante(e.target.checked)}
                className="size-5 accent-bordo"
              />
              marcar como lido na minha estante, com esta ficha
            </label>
          ) : null}
          {!minha && naEstante ? (
            <label className="block">
              <span className={rotuloCampo}>concluí em</span>
              <input
                type="date"
                value={dia}
                max={diaLocal()}
                onChange={(e) => e.target.value && setDia(e.target.value)}
                className={campo}
              />
            </label>
          ) : null}
        </FichaLeitura>
        {minha ? (
          <button
            type="button"
            onClick={excluir}
            disabled={enviando}
            className="mt-4 min-h-11 text-xs font-semibold text-cinza underline underline-offset-4 hover:text-bordo"
          >
            excluir minha ficha
          </button>
        ) : null}
      </div>
      {erro ? (
        <p role="alert" className="mt-4 px-6 text-[13px] text-bordo lg:px-0">
          {erro}
        </p>
      ) : null}
      <Rodape>
        <button
          type="submit"
          disabled={enviando}
          className={`${botaoPrincipal} lg:max-w-[640px]`}
        >
          {enviando ? "publicando…" : minha ? "salvar alterações" : "publicar ficha"}
        </button>
      </Rodape>
    </form>
  );
}

export default function FichaPage() {
  const { livro } = useParams<{ livro: string }>();
  const eu = useMeuId();
  const consulta = useConsulta(async () => {
    const [l, fichas] = await Promise.all([
      livroDoClube(livro),
      fichasDe(livro),
    ]);
    return l ? { l, minha: fichas.find((f) => f.autor === eu) ?? null } : null;
  }, [livro, eu]);
  if (consulta.carregando && !consulta.dados)
    return (
      <Animacao
        tipo="escrevendo"
        titulo="carregando sua ficha"
        frase="e então, o que você achou?"
        sub="só um instante"
      />
    );
  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  if (!consulta.dados)
    return (
      <Vazio
        className="mx-6 mt-6 lg:mx-0"
        titulo="esse livro não está no clube"
      />
    );
  return (
    <Formulario
      key={consulta.dados.minha?.id ?? "nova"}
      l={consulta.dados.l}
      minha={consulta.dados.minha}
    />
  );
}
