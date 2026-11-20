"use client";

import { toPng } from "html-to-image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useRef, useState } from "react";
import { Animacao } from "@/components/Animacao";
import { useClube } from "@/components/clube/ClubeContexto";
import { botaoPrincipal, TopoForm } from "@/components/clube/Pecas";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import { estilosBase } from "@/components/story/Stories";
import {
  StoryClubeCarimbo,
  StoryClubeFicha,
  StoryClubeMural,
  type AvaliacaoClube,
} from "@/components/story/StoriesClube";
import { fichasDe, livroDoClube } from "@/lib/clubes";
import { nomeDe, useConsulta } from "@/lib/social";

type Modelo = "ficha" | "carimbo" | "mural";
const MODELOS: { id: Modelo; r: string }[] = [
  { id: "ficha", r: "ficha coletiva" },
  { id: "carimbo", r: "carimbo do clube" },
  { id: "mural", r: "mural de recados" },
];

/**
 * Quando o clube termina um livro: três jeitos de compartilhar a leitura —
 * ficha coletiva, carimbo do clube e mural de recados — com os dados de
 * verdade (fichas, notas e quem leu).
 */
export default function ConcluidoPage() {
  const { clube, membros } = useClube();
  const params = useParams<{ livro: string }>();
  const [modelo, setModelo] = useState<Modelo>("ficha");
  const quadro = useRef<HTMLDivElement>(null);
  const [gerando, setGerando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const consulta = useConsulta(async () => {
    const [l, fichas] = await Promise.all([
      livroDoClube(params.livro),
      fichasDe(params.livro),
    ]);
    return { l, fichas };
  }, [params.livro]);

  if (consulta.carregando && !consulta.dados)
    return (
      <Animacao
        tipo="carimbo"
        titulo="preparando o selo do clube"
        sub="juntando as fichas de todo mundo"
      />
    );
  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { l, fichas } = consulta.dados!;
  if (!l)
    return (
      <div className="px-6 pt-6 lg:max-w-[640px] lg:px-0">
        <Vazio titulo="não achei essa leitura" texto="ela pode ter sido removida." />
      </div>
    );

  const avaliacoes: AvaliacaoClube[] = fichas.map((f) => {
    const m = membros.find((mm) => mm.usuario_id === f.autor);
    return {
      nome: m ? nomeDe(m.pessoa) : "alguém do clube",
      foto: m?.pessoa.foto,
      nota: f.nota,
      citacao: f.citacao,
    };
  });
  const comNota = avaliacoes.filter((a) => a.nota != null);
  const media = comNota.length
    ? comNota.reduce((t, a) => t + (a.nota ?? 0), 0) / comNota.length
    : null;

  const dados = {
    clube: clube.nome,
    livro: l.livro,
    avaliacoes,
    media,
    encerradoEm: l.encerrado_em ?? undefined,
  };

  const estilo =
    modelo === "carimbo" ? estilosBase[1] /* vinho */ : estilosBase[0] /* creme */;

  const historia = (ref?: React.Ref<HTMLDivElement>) =>
    modelo === "ficha" ? (
      <StoryClubeFicha ref={ref} e={estilo} {...dados} />
    ) : modelo === "carimbo" ? (
      <StoryClubeCarimbo ref={ref} e={estilo} {...dados} />
    ) : (
      <StoryClubeMural ref={ref} e={estilo} {...dados} />
    );

  async function compartilhar() {
    if (!quadro.current) return;
    setGerando(true);
    setAviso(null);
    try {
      const png = await toPng(quadro.current, {
        pixelRatio: 3,
        cacheBust: true,
        includeQueryParams: true,
      });
      const blob = await (await fetch(png)).blob();
      const nome = `the-bookside-clube-${modelo}.png`;
      const arquivo = new File([blob], nome, { type: "image/png" });
      if (navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: "the bookside" });
      } else {
        const a = document.createElement("a");
        a.href = png;
        a.download = nome;
        a.click();
        setAviso("imagem baixada ✓ é só postar no story.");
      }
    } catch (x) {
      if ((x as Error).name !== "AbortError")
        setAviso("não deu para gerar a imagem agora. tente de novo.");
    } finally {
      setGerando(false);
    }
  }

  const pilula = (on: boolean) =>
    `flex h-10 items-center rounded-pill px-4 text-xs font-semibold whitespace-nowrap transition-colors ${
      on ? "bg-bordo text-creme shadow-sm" : "text-cinza hover:text-ameixa"
    }`;

  return (
    <div className="flex min-h-[70dvh] flex-col px-6 pt-2 pb-10 lg:px-0 lg:pt-6">
      <TopoForm
        voltar={{ href: `/clubes/${clube.id}`, r: clube.nome }}
        rotulo="vocês terminaram!"
        titulo=""
      />
      <h1 className="mt-1 font-display text-[28px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[38px] lg:font-normal lg:text-tinta">
        {l.livro.titulo}, terminado ✦
      </h1>
      <p className="mt-1.5 font-accent text-sm italic text-cinza">
        escolha um jeito de compartilhar que o clube terminou essa leitura
      </p>

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12">
        <div className="space-y-6 rounded-[20px] bg-creme-quente p-5 shadow-[0_20px_40px_-26px_rgba(43,20,32,.22)] lg:order-2 lg:p-7">
          <div
            role="radiogroup"
            aria-label="modelo do cartão"
            className="inline-flex flex-wrap gap-1 rounded-pill bg-linha/60 p-1"
          >
            {MODELOS.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={modelo === m.id}
                onClick={() => setModelo(m.id)}
                className={pilula(modelo === m.id)}
              >
                {m.r}
              </button>
            ))}
          </div>

          <div className="hidden lg:block">
            <BotaoCompartilhar onClick={compartilhar} gerando={gerando} />
            {aviso ? <p className="mt-2 text-[13px] text-cinza">{aviso}</p> : null}
          </div>

          <Link
            href={`/clubes/${clube.id}/escolher?depois=encerrar`}
            className="inline-flex min-h-11 items-center text-[13px] font-semibold text-bordo underline underline-offset-4"
          >
            escolher o próximo livro →
          </Link>
        </div>

        <div className="mt-6 flex flex-col items-center lg:order-1 lg:mt-0">
          <div className="origin-top scale-[.86] lg:scale-100">
            {historia(quadro)}
          </div>
          <div className="mt-5 w-full max-w-[360px] lg:hidden">
            <BotaoCompartilhar onClick={compartilhar} gerando={gerando} />
            {aviso ? (
              <p className="mt-2 text-center text-[13px] text-cinza">{aviso}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function BotaoCompartilhar({
  onClick,
  gerando,
}: {
  onClick: () => void;
  gerando: boolean;
}) {
  return (
    <button type="button" onClick={onClick} disabled={gerando} className={botaoPrincipal}>
      {gerando ? "gerando a imagem…" : "compartilhar no story ✦"}
    </button>
  );
}

