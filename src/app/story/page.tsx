"use client";

import { fotografarPng } from "@/lib/fotografar";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useHidratado } from "@/components/PerfilHidratacao";
import {
  estiloDoTema,
  type EstiloStory,
  type Mostrar,
  StoryLendo,
  StoryMes,
  StoryTerminei,
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
  const chaveMes = (a: number, m: number) =>
    `${a}-${String(m + 1).padStart(2, "0")}`;
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

  // poucos estilos: o seu tema + três fixos (claro, vinho e preto)
  const estilos = useMemo(() => {
    const fixos = ["biblioteca-classica", "veludo-vinho", "preto-e-branco"];
    const ids = fixos.includes(temaId) || !temaId ? fixos : [temaId, ...fixos];
    return ids
      .map((id) => temas.find((t) => t.id === id))
      .filter((t): t is (typeof temas)[number] => !!t)
      .map(estiloDoTema);
  }, [temaId]);
  const [estiloId, setEstiloId] = useState(temaId || "biblioteca-classica");
  const e = estilos.find((x) => x.id === estiloId) ?? estilos[0];

  const indice = Math.max(
    0,
    estilos.findIndex((x) => x.id === e.id),
  );
  const trilho = useRef<HTMLDivElement>(null);
  function irPara(i: number) {
    const el = trilho.current;
    const alvo = el?.children[i] as HTMLElement | undefined;
    if (!el || !alvo || !estilos[i]) return;
    setEstiloId(estilos[i].id);
    el.scrollTo({
      left: alvo.offsetLeft - (el.clientWidth - alvo.clientWidth) / 2,
      behavior: "smooth",
    });
  }
  // ao arrastar com o dedo, o estilo do meio é o escolhido
  const rolagem = useRef<ReturnType<typeof setTimeout>>(undefined);
  function aoRolar() {
    clearTimeout(rolagem.current);
    rolagem.current = setTimeout(() => {
      const el = trilho.current;
      if (!el) return;
      const meio = el.scrollLeft + el.clientWidth / 2;
      let melhor = 0;
      let dist = Infinity;
      [...el.children].forEach((c, i) => {
        const h = c as HTMLElement;
        const d = Math.abs(h.offsetLeft + h.clientWidth / 2 - meio);
        if (d < dist) [dist, melhor] = [d, i];
      });
      if (estilos[melhor]) setEstiloId(estilos[melhor].id);
    }, 120);
  }

  const [mostrar, setMostrar] = useState<Mostrar>({});
  const quadro = useRef<HTMLDivElement>(null);
  const [gerando, setGerando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  async function compartilhar() {
    if (!quadro.current) return;
    setGerando(true);
    setAviso(null);
    try {
      const png = await fotografarPng(quadro.current, {
        pixelRatio: 3,
        // cada capa tem o seu endereço (sem isto, todas viravam a primeira)
        includeQueryParams: true,
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

  const opcoes: [keyof Mostrar, string][] =
    tipo === "terminei"
      ? [
          ["data", "data"],
          ["nota", "nota"],
          ...(livro?.citacao
            ? [["resenha", "trecho da resenha"] as [keyof Mostrar, string]]
            : []),
          ["detalhes", "dias e páginas"],
        ]
      : tipo === "lendo"
        ? [["progresso", "progresso"]]
        : [
            ["numeros", "números do mês"],
            ["favorito", "favorito do mês"],
          ];

  const historia = (est: EstiloStory, ref?: React.Ref<HTMLDivElement>) =>
    tipo === "terminei" && livro ? (
      <StoryTerminei
        ref={ref}
        e={est}
        usuario={usuario}
        livro={livro}
        mostrar={mostrar}
      />
    ) : tipo === "lendo" ? (
      <StoryLendo
        ref={ref}
        e={est}
        usuario={usuario}
        livros={lendo}
        mostrar={mostrar}
      />
    ) : (
      <StoryMes
        ref={ref}
        e={est}
        usuario={usuario}
        mes={MESES[mesNum - 1]}
        ano={anoMes}
        livros={doMes}
        mostrar={mostrar}
      />
    );

  const pilula = (on: boolean) =>
    `flex min-h-10 items-center rounded-pill border px-3.5 text-[13px] font-semibold whitespace-nowrap transition-colors ${
      on ? "border-bordo bg-bordo text-creme" : "border-linha text-cinza hover:text-ameixa"
    }`;
  const campo =
    "h-12 w-full border-0 border-b-[1.5px] border-ameixa bg-transparent px-0 font-display text-[17px] italic text-ameixa outline-none focus:border-bordo";
  const rotuloCampo =
    "font-maquina mb-2 block text-[10px] tracking-[.12em] text-rosa-antigo uppercase";

  return (
    <div className="flex flex-1 flex-col px-6 pt-2 pb-10 lg:bg-jornal lg:px-12 lg:pt-8">
      <Voltar
        padrao="/numeros"
        className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo"
      />
      <h1 className="mt-1 font-display text-[26px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
        compartilhar no story
      </h1>
      <p className="mt-1.5 hidden font-accent text-sm italic text-cinza sm:block">
        escolha o que mostrar e passe pelos estilos. a imagem sai no tamanho do
        story ✦
      </p>

      <div className="mt-4 lg:mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-12">
        <div className="space-y-6 lg:rounded-[20px] lg:bg-creme-quente lg:p-7 lg:shadow-[0_20px_40px_-26px_rgba(43,20,32,.22)]">
          <div
            role="radiogroup"
            aria-label="o que compartilhar"
            className="-mx-6 flex gap-6 overflow-x-auto border-b border-linha px-6 [scrollbar-width:none] lg:mx-0 lg:px-0 [&::-webkit-scrollbar]:hidden"
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
                className={`flex min-h-11 flex-none items-center border-b-2 text-[14px] whitespace-nowrap ${
                  tipo === id ? "border-bordo font-semibold text-bordo" : "border-transparent text-cinza"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {tipo === "terminei" ? (
            <label className="block">
              <span className={rotuloCampo}>qual livro?</span>
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
              <span className={rotuloCampo}>qual mês?</span>
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

          {opcoes.length ? (
            <div>
              <span className={rotuloCampo}>o que aparece</span>
              <div className="flex flex-wrap gap-2">
                {opcoes.map(([k, r]) => {
                  const on = mostrar[k] !== false;
                  return (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setMostrar((m) => ({ ...m, [k]: !on }))}
                      className={pilula(on)}
                    >
                      {on ? "✓ " : ""}
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

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
            <div className="w-full">
              <div className="relative">
                <div
                  ref={trilho}
                  onScroll={aoRolar}
                  className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[calc(50%-148px)] py-4 [scrollbar-width:none] lg:px-[calc(50%-162px)]"
                >
                  {estilos.map((x, i) => (
                    <button
                      key={x.id}
                      type="button"
                      aria-label={`estilo ${x.nome}`}
                      aria-pressed={x.id === e.id}
                      onClick={() => irPara(i)}
                      className={`h-[525px] w-[295px] flex-none snap-center overflow-hidden rounded-[14px] text-left transition-opacity lg:h-[576px] lg:w-[324px] ${
                        x.id === e.id
                          ? "shadow-[0_24px_50px_-24px_rgba(43,20,32,.6)]"
                          : "opacity-60"
                      }`}
                    >
                      <div className="pointer-events-none origin-top-left scale-[.82] lg:scale-[.9]">
                        {historia(x, x.id === e.id ? quadro : undefined)}
                      </div>
                    </button>
                  ))}
                </div>
                {(
                  [
                    [-1, "‹", "estilo anterior", "left-0"],
                    [1, "›", "próximo estilo", "right-0"],
                  ] as const
                ).map(([d, seta, r, lado]) => (
                  <button
                    key={d}
                    type="button"
                    aria-label={r}
                    disabled={indice + d < 0 || indice + d >= estilos.length}
                    onClick={() => irPara(indice + d)}
                    className={`absolute top-1/2 ${lado} flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-linha bg-creme text-2xl text-bordo shadow-md disabled:opacity-0`}
                  >
                    {seta}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-center font-display text-[15px] font-semibold italic text-ameixa lg:font-revista lg:font-normal">
                {e.id === temaId ? "seu tema" : e.nome}
              </p>
              <div className="mt-2 flex justify-center gap-1.5">
                {estilos.map((x, i) => (
                  <button
                    key={x.id}
                    type="button"
                    aria-label={x.nome}
                    onClick={() => irPara(i)}
                    className={`h-2 rounded-full transition-all ${x.id === e.id ? "w-5 bg-bordo" : "w-2 bg-bege"}`}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="sticky bottom-[calc(84px+env(safe-area-inset-bottom))] z-10 mt-5 w-full max-w-[360px] lg:hidden">
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
      className="flex h-12 w-full items-center justify-center gap-2 rounded-pill bg-ameixa px-8 text-sm font-semibold text-creme hover:bg-bordo-escuro disabled:opacity-45 lg:w-auto"
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
