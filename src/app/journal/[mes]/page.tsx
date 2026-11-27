"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useHidratado } from "@/components/PerfilHidratacao";
import { Voltar } from "@/components/Voltar";
import {
  AsHistorias,
  CapaJournal,
  Editorial,
  EntreExtremos,
  HistoriaDoMes,
  MesEmNumeros,
  Mood,
  NasMargens,
  OQueVoceLeu,
  QuemEscreveu,
  SeuRitmo,
} from "@/components/journal/Revista";
import { Compartilhar } from "@/components/journal/Compartilhar";
import { ExportarPdf, Folhear, type Folha } from "@/components/journal/Folhear";
import { useEdicao } from "@/components/journal/useEdicao";
import {
  chaveDoMes,
  lerChave,
  margensDoMes,
  mesesComLeitura,
  paletaDoMes,
} from "@/lib/journal";
import { usePerfil } from "@/lib/perfil-store";

function Leitura({ chave }: { chave: string }) {
  const livros = usePerfil((s) => s.livros);
  const { edicao, estado, textos, desatualizada, gerando, vazia, finalizadaEm, atualizar } = useEdicao(chave);
  const [compartilhando, setCompartilhando] = useState(false);
  const [modo, setModo] = useState<"rolar" | "folhear">("rolar");
  const [pdf, setPdf] = useState<"parado" | "gerando">("parado");
  const [avisoPdf, setAvisoPdf] = useState<string | null>(null);
  useEffect(() => {
    try {
      if (localStorage.getItem("bookside-journal-modo") === "folhear") setModo("folhear");
    } catch {
      /* sem armazenamento */
    }
  }, []);
  const mudarModo = (m: "rolar" | "folhear") => {
    setModo(m);
    try {
      localStorage.setItem("bookside-journal-modo", m);
    } catch {
      /* sem armazenamento */
    }
  };
  const paleta = paletaDoMes(edicao.mes);
  const cor = paleta.fundo;
  const margens = useMemo(() => margensDoMes(livros, edicao), [livros, edicao]);
  // edições vizinhas (para passar de uma a outra)
  const meses = useMemo(() => mesesComLeitura(livros), [livros]);
  const i = meses.indexOf(chave);
  const anterior = i >= 0 ? meses[i + 1] : meses.find((m) => m < chave);
  const proxima = i > 0 ? meses[i - 1] : undefined;

  if (estado === "futura")
    return (
      <div className="py-16 text-center">
        <p className="font-display text-[26px] font-semibold text-ameixa lg:font-revista lg:font-normal">
          esta edição ainda não saiu.
        </p>
        <p className="mt-2 text-[14px] text-cinza">
          a revista de {edicao.nome} chega no penúltimo dia do mês, como prévia.
        </p>
        <Link href="/journal" className="mt-6 inline-block text-[13px] font-semibold text-bordo underline underline-offset-4">
          ver suas edições
        </Link>
      </div>
    );

  const rotulo = `${edicao.nome} ${edicao.ano}`;
  const folhas: Folha[] = [
    {
      id: "capa",
      sangrada: true,
      el: <CapaJournal ed={edicao} textos={textos} paleta={paleta} previa={estado === "previa"} />,
    },
    {
      id: "abertura",
      el: (
        <div className="space-y-8">
          <Editorial textos={textos} cor={cor} />
          <MesEmNumeros ed={edicao} cor={cor} />
        </div>
      ),
    },
    { id: "historias", el: <AsHistorias ed={edicao} cor={cor} /> },
    { id: "historia-do-mes", el: <HistoriaDoMes ed={edicao} cor={cor} todos={livros} /> },
    { id: "extremos", el: <EntreExtremos ed={edicao} cor={cor} /> },
    { id: "ritmo", el: <SeuRitmo ed={edicao} textos={textos} cor={cor} /> },
    { id: "leu", el: <OQueVoceLeu ed={edicao} textos={textos} cor={cor} /> },
    { id: "autorias", el: <QuemEscreveu ed={edicao} cor={cor} /> },
    ...(margens.trechos.length || margens.resenhas.length || margens.anotacoes.length ? [{ id: "margens", el: <NasMargens margens={margens} cor={cor} /> }] : []),
    { id: "mood", sangrada: true, el: <Mood textos={textos} paleta={paleta} style={{ height: "100%", borderRadius: 0, display: "flex", flexDirection: "column", justifyContent: "center" }} /> },
  ];

  return (
    <article>
      {/* navegação entre edições */}
      <nav aria-label="edições" className="flex items-center justify-between gap-3 border-b border-linha pb-3 text-[12px] lg:border-fio">
        {anterior ? (
          <Link href={`/journal/${anterior}`} className="font-semibold text-cinza hover:text-bordo">
            ‹ edição anterior
          </Link>
        ) : (
          <span />
        )}
        <Link href="/journal" className="font-semibold text-ameixa hover:text-bordo">
          suas edições
        </Link>
        {proxima ? (
          <Link href={`/journal/${proxima}`} className="font-semibold text-cinza hover:text-bordo">
            próxima edição ›
          </Link>
        ) : (
          <span />
        )}
      </nav>

      {estado === "previa" ? (
        <p className="mt-4 rounded-[8px] bg-rosa-fundo px-4 py-2.5 text-[13px] text-ameixa">
          <b className="font-semibold">prévia</b> — o mês ainda não acabou e novas leituras podem entrar. a edição fecha no dia 1º.
        </p>
      ) : null}
      {desatualizada ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-linha px-4 py-3 text-[13px] lg:border-fio">
          <span className="text-tinta-suave">
            seus registros de {edicao.nome} mudaram depois que esta edição foi fechada.
          </span>
          <button
            type="button"
            onClick={() => void atualizar()}
            disabled={gerando}
            className="h-9 rounded-pill bg-bordo px-4 text-[12px] font-semibold text-creme disabled:opacity-60"
          >
            {gerando ? "atualizando…" : "atualizar edição"}
          </button>
        </div>
      ) : null}

      {!vazia ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px]">
          <div role="group" aria-label="como ler a edição" className="flex rounded-full border border-linha p-0.5 lg:border-fio">
            {(["rolar", "folhear"] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={modo === m}
                onClick={() => mudarModo(m)}
                className={`h-8 rounded-full px-4 font-semibold ${modo === m ? "bg-ameixa text-creme" : "text-ameixa hover:text-bordo"}`}
              >
                {m === "rolar" ? "ler rolando" : "folhear"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <Link href={`/story?tipo=mes&mes=${chave}`} className="font-semibold text-cinza hover:text-bordo">
              wrapped clássico do mês
            </Link>
            <button
              type="button"
              disabled={pdf === "gerando"}
              onClick={() => {
                setAvisoPdf(null);
                setPdf("gerando");
              }}
              className="font-semibold text-bordo hover:underline disabled:opacity-60"
            >
              {pdf === "gerando" ? "gerando pdf…" : "exportar pdf"}
            </button>
            <button type="button" onClick={() => setCompartilhando(true)} className="font-semibold text-bordo hover:underline">
              compartilhar
            </button>
          </div>
        </div>
      ) : null}
      {avisoPdf ? <p role="status" className="mt-2 text-[12px] text-cinza">{avisoPdf}</p> : null}
      {pdf === "gerando" ? (
        <ExportarPdf
          folhas={folhas}
          paleta={paleta}
          nomeArquivo={`the-bookside-journal-${chave}.pdf`}
          onFim={(erro) => {
            setPdf("parado");
            setAvisoPdf(erro ?? "pdf baixado ✓");
          }}
        />
      ) : null}

      {!vazia && modo === "folhear" ? (
        <div className="mt-8">
          <Folhear folhas={folhas} rotulo={rotulo} paleta={paleta} />
          <p className="mt-3 text-center text-[11px] text-cinza">use as setas do teclado ou deslize para virar as páginas.</p>
        </div>
      ) : vazia ? (
        <div className="py-16 text-center">
          <p className="font-display text-[26px] font-semibold text-ameixa lg:font-revista lg:font-normal">
            {edicao.nome} não teve leituras registradas.
          </p>
          <p className="mt-2 text-[14px] text-cinza">quando houver um livro aberto no mês, ele vira edição.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-10 lg:mt-10 lg:space-y-16">
          {/* página dupla de abertura: capa + editorial */}
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14">
            <div className="mx-auto w-full max-w-[420px] lg:sticky lg:top-6">
              <CapaJournal ed={edicao} textos={textos} paleta={paleta} previa={estado === "previa"} />
              <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-cinza">
                <span>
                  {finalizadaEm
                    ? `edição fechada em ${new Date(finalizadaEm).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}`
                    : "prévia da edição"}
                  {textos.fonte === "ia" ? " · textos com IA" : ""}
                </span>
                <button
                  type="button"
                  onClick={() => setCompartilhando(true)}
                  className="h-9 rounded-pill px-4 text-[12px] font-semibold"
                  style={{ background: paleta.fundo, color: paleta.texto }}
                >
                  compartilhar
                </button>
              </div>
            </div>
            <div className="space-y-10">
              <Editorial textos={textos} cor={cor} />
              <MesEmNumeros ed={edicao} cor={cor} />
            </div>
          </div>

          <AsHistorias ed={edicao} cor={cor} />
          <HistoriaDoMes ed={edicao} cor={cor} todos={livros} />
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <EntreExtremos ed={edicao} cor={cor} />
            <SeuRitmo ed={edicao} textos={textos} cor={cor} />
          </div>
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <OQueVoceLeu ed={edicao} textos={textos} cor={cor} />
            <QuemEscreveu ed={edicao} cor={cor} />
          </div>
          <NasMargens margens={margens} cor={cor} />
          <Mood textos={textos} paleta={paleta} />
        </div>
      )}

      {compartilhando ? (
        <Compartilhar ed={edicao} textos={textos} paleta={paleta} previa={estado === "previa"} onFechar={() => setCompartilhando(false)} />
      ) : null}
    </article>
  );
}

export default function EdicaoPage() {
  const { mes } = useParams<{ mes: string }>();
  const hidratado = useHidratado();
  const hoje = new Date();
  const chave = lerChave(mes ?? "") ? mes : chaveDoMes(hoje.getFullYear(), hoje.getMonth());
  return (
    <AppShell aba="perfil">
      <div className="flex flex-1 flex-col lg:bg-jornal">
        <div className="mx-auto w-full max-w-[1180px] px-6 pb-16 lg:px-12 lg:pt-6">
          <header className="flex items-center justify-between pt-2 pb-2 lg:pt-0">
            <Voltar
              padrao="/perfil?aba=jornada"
              rotulo="jornada"
              className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo"
            />
            <span className="text-[10px] font-semibold tracking-[.2em] text-ameixa uppercase">diário literário</span>
          </header>
          {hidratado ? <Leitura key={chave} chave={chave} /> : null}
        </div>
      </div>
    </AppShell>
  );
}
