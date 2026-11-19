"use client";

import { toPng } from "html-to-image";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useHidratado } from "@/components/PerfilHidratacao";
import {
  estilosBase,
  StoryLendo,
  StoryMes,
  StoryTerminei,
  type EstiloStory,
} from "@/components/story/Stories";
import { Voltar } from "@/components/Voltar";
import { temas } from "@/lib/dados";
import { mesDoReview } from "@/lib/numeros";
import { usePerfil } from "@/lib/perfil-store";

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

type Tipo = "terminei" | "lendo" | "mes";

/**
 * Stories para o Instagram (1080×1920): "terminei", "lendo agora" e "meu mês".
 * No celular, "compartilhar" abre o menu do sistema (Instagram, WhatsApp…);
 * no computador, baixa a imagem.
 */
function Conteudo() {
  const params = useSearchParams();
  const livros = usePerfil((s) => s.livros);
  const usuario = usePerfil((s) => s.usuario);
  const temaId = usePerfil((s) => s.tema);
  const tipoInicial = (params.get("tipo") as Tipo) || "mes";
  const [tipo, setTipo] = useState<Tipo>(tipoInicial);
  const lidos = livros
    .filter((l) => l.status === "lido" && l.lidoEm)
    .sort((a, b) => b.lidoEm!.localeCompare(a.lidoEm!));
  const lendo = livros.filter((l) => l.status === "lendo");
  const [livroId, setLivroId] = useState(
    params.get("livro") ?? lidos[0]?.id ?? "",
  );
  const hoje = new Date();
  // o mês em andamento só entra quando o review dele abre (penúltimo dia do mês)
  const review = mesDoReview(hoje);
  const chaveMes = (a: number, m: number) => `${a}-${String(m + 1).padStart(2, "0")}`;
  const mesAtual = chaveMes(hoje.getFullYear(), hoje.getMonth());
  const mesReview = review ? chaveMes(review.ano, review.mes) : null;
  const liberado = (m: string) => m < mesAtual || m === mesReview;
  const [mesSel, setMesSel] = useState(() => {
    const pedido = params.get("mes");
    if (pedido && liberado(pedido)) return pedido;
    if (mesReview) return mesReview;
    const anterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    return chaveMes(anterior.getFullYear(), anterior.getMonth());
  });

  // os meses que tiveram leituras (para escolher)
  const meses = useMemo(
    () =>
      [...new Set(lidos.map((l) => l.lidoEm!.slice(0, 7)))]
        .filter((m) => m < mesAtual || m === mesReview)
        .sort()
        .reverse(),
    [lidos, mesAtual, mesReview],
  );
  const [anoMes, mesNum] = [
    Number(mesSel.slice(0, 4)),
    Number(mesSel.slice(5, 7)),
  ];
  const doMes = lidos
    .filter((l) => l.lidoEm!.startsWith(mesSel))
    .sort((a, b) => a.lidoEm!.localeCompare(b.lidoEm!));

  // estilos: os três de sempre + as cores do tema do perfil
  const tema = temas.find((t) => t.id === temaId);
  const estilos: EstiloStory[] = useMemo(
    () =>
      tema && tema.id !== "biblioteca-classica"
        ? [
            ...estilosBase,
            {
              id: "tema",
              nome: tema.nome,
              fundo: tema.papel,
              texto: "escuro" in tema ? "#F5EFE6" : "#2B1420",
              suave: "escuro" in tema ? "#CFC3B8" : "#6E6264",
              destaque: tema.destaque,
              fio:
                "escuro" in tema
                  ? "rgba(245,239,230,.2)"
                  : "rgba(43,20,32,.16)",
            },
          ]
        : estilosBase,
    [tema],
  );
  const [estiloId, setEstiloId] = useState("creme");
  const e = estilos.find((x) => x.id === estiloId) ?? estilos[0];

  const quadro = useRef<HTMLDivElement>(null);
  const [gerando, setGerando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function compartilhar() {
    if (!quadro.current) return;
    setGerando(true);
    setAviso(null);
    try {
      const png = await toPng(quadro.current, {
        pixelRatio: 3,
        cacheBust: true,
      });
      const blob = await (await fetch(png)).blob();
      const nome = `the-bookside-${tipo}.png`;
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

  const livro = livros.find((l) => l.id === livroId);
  const vazio =
    (tipo === "terminei" && !livro) ||
    (tipo === "lendo" && !lendo.length) ||
    (tipo === "mes" && !doMes.length);

  const pilula = (on: boolean) =>
    `flex h-9 items-center rounded-pill border px-[13px] text-xs font-semibold whitespace-nowrap ${
      on
        ? "border-bordo bg-bordo text-creme"
        : "border-bege bg-creme-quente text-ameixa"
    }`;
  const campo =
    "h-11 w-full rounded-[12px] border border-bege bg-creme-quente px-3 text-sm text-ameixa outline-none focus:border-bordo lg:rounded-[4px]";

  return (
    <div className="flex flex-1 flex-col px-6 pt-2 pb-10 lg:bg-jornal lg:px-12 lg:pt-8">
      <Voltar
        padrao="/numeros"
        className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo"
      />
      <h1 className="mt-1 font-display text-[30px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
        compartilhar no story
      </h1>
      <p className="mt-1.5 font-accent text-sm italic text-cinza">
        escolha o que mostrar e o estilo. a imagem sai no tamanho do story ✦
      </p>

      <div className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12">
        <div className="space-y-5">
          <div
            role="radiogroup"
            aria-label="o que compartilhar"
            className="flex flex-wrap gap-2"
          >
            {(
              [
                ["mes", "meu mês"],
                ["terminei", "terminei um livro"],
                ["lendo", "lendo agora"],
              ] as const
            ).map(([id, r]) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={tipo === id}
                onClick={() => setTipo(id)}
                className={pilula(tipo === id)}
              >
                {r}
              </button>
            ))}
          </div>

          {tipo === "terminei" ? (
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold tracking-[.12em] text-bordo uppercase">
                qual livro?
              </span>
              <select
                value={livroId}
                onChange={(ev) => setLivroId(ev.target.value)}
                className={campo}
              >
                {lidos.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.titulo}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {tipo === "mes" ? (
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold tracking-[.12em] text-bordo uppercase">
                qual mês?
              </span>
              <select
                value={mesSel}
                onChange={(ev) => setMesSel(ev.target.value)}
                className={campo}
              >
                {[...new Set([mesSel, ...meses])]
                  .sort()
                  .reverse()
                  .map((m) => (
                    <option key={m} value={m}>
                      {MESES[Number(m.slice(5, 7)) - 1]} de {m.slice(0, 4)}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}

          <div>
            <span className="mb-1.5 block text-[11px] font-semibold tracking-[.12em] text-bordo uppercase">
              estilo
            </span>
            <div className="flex flex-wrap gap-2.5">
              {estilos.map((x) => (
                <button
                  key={x.id}
                  type="button"
                  aria-pressed={estiloId === x.id}
                  onClick={() => setEstiloId(x.id)}
                  className={`flex items-center gap-2 rounded-pill border py-1 pr-3.5 pl-1 text-xs font-semibold ${
                    estiloId === x.id ? "border-bordo" : "border-bege"
                  }`}
                >
                  <span
                    className="flex size-7 items-center justify-center rounded-full border border-black/10 font-revista text-sm italic"
                    style={{ background: x.fundo, color: x.destaque }}
                  >
                    a
                  </span>
                  {x.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden lg:block">
            <BotaoCompartilhar
              onClick={compartilhar}
              gerando={gerando}
              desabilitado={vazio}
            />
            {aviso ? (
              <p className="mt-2 text-[13px] text-cinza">{aviso}</p>
            ) : null}
          </div>
        </div>

        {/* a prévia, no tamanho do celular */}
        <div className="mt-6 flex flex-col items-center lg:mt-0">
          {vazio ? (
            <div className="flex h-[640px] w-[360px] max-w-full items-center justify-center rounded-[14px] border border-dashed border-bege p-8 text-center font-accent text-[15px] italic text-cinza">
              {tipo === "lendo"
                ? "nenhum livro na sua estante de lendo agora."
                : tipo === "terminei"
                  ? "você ainda não marcou nenhum livro como lido."
                  : `nenhum livro terminado em ${MESES[mesNum - 1]} de ${anoMes}.`}
            </div>
          ) : (
            <div className="overflow-hidden rounded-[14px] shadow-[0_24px_50px_-24px_rgba(43,20,32,.6)]">
              {tipo === "terminei" && livro ? (
                <StoryTerminei
                  ref={quadro}
                  e={e}
                  usuario={usuario}
                  livro={livro}
                />
              ) : tipo === "lendo" ? (
                <StoryLendo
                  ref={quadro}
                  e={e}
                  usuario={usuario}
                  livros={lendo}
                />
              ) : (
                <StoryMes
                  ref={quadro}
                  e={e}
                  usuario={usuario}
                  mes={MESES[mesNum - 1]}
                  ano={anoMes}
                  livros={doMes}
                />
              )}
            </div>
          )}
          <div className="mt-5 w-full max-w-[360px] lg:hidden">
            <BotaoCompartilhar
              onClick={compartilhar}
              gerando={gerando}
              desabilitado={vazio}
            />
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
  desabilitado,
}: {
  onClick: () => void;
  gerando: boolean;
  desabilitado: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={gerando || desabilitado}
      className="flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-bordo px-8 text-sm font-semibold text-creme hover:bg-bordo-suave disabled:opacity-45 lg:w-auto"
    >
      <svg
        aria-hidden
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
      </svg>
      {gerando ? "gerando a imagem…" : "compartilhar no story"}
    </button>
  );
}

export default function StoryPage() {
  const hidratado = useHidratado();
  return (
    <AppShell aba="perfil">
      {hidratado ? (
        <Suspense fallback={null}>
          <Conteudo />
        </Suspense>
      ) : null}
    </AppShell>
  );
}
