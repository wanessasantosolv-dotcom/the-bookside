"use client";

import { fotografarPng } from "@/lib/fotografar";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useRef, useState } from "react";
import { CHAMADAS, FORMATOS, MODELOS, Peca, type Conteudo, type Formato, type Modelo } from "@/components/story/Pecas";
import { diasDeLeitura } from "@/lib/numeros";
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
 * O editor de compartilhamento: uma peça por vez, com modelo, paleta, formato
 * e informações escolhidas pela pessoa. A pré-visualização é a própria arte
 * (o PNG sai dela, em 3×). Rota e parâmetros de sempre: ?tipo=&livro=&mes=.
 */
function Conteudo() {
  const params = useSearchParams();
  const livros = usePerfil((s) => s.livros);
  const usuario = usePerfil((s) => s.usuario);
  const tipoInicial = (params.get("tipo") as Tipo) || "mes";
  const [tipo, setTipo] = useState<Tipo>(["terminei", "lendo", "mes"].includes(tipoInicial) ? tipoInicial : "mes");
  const lidos = livros.filter((l) => l.status === "lido" && l.lidoEm).sort((a, b) => b.lidoEm!.localeCompare(a.lidoEm!));
  const lendo = livros.filter((l) => l.status === "lendo");
  const [livroId, setLivroId] = useState(params.get("livro") ?? "");
  const hoje = new Date();
  // o mês em andamento só entra quando o diário dele abre (penúltimo dia do mês)
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
  const meses = useMemo(() => [...new Set(lidos.map((l) => l.lidoEm!.slice(0, 7)))].filter((m) => m < mesAtual || m === mesReview).sort().reverse(), [lidos, mesAtual, mesReview]);
  const [anoMes, mesNum] = [Number(mesSel.slice(0, 4)), Number(mesSel.slice(5, 7))];
  const doMes = lidos.filter((l) => l.lidoEm!.startsWith(mesSel)).sort((a, b) => a.lidoEm!.localeCompare(b.lidoEm!));

  // o livro da peça
  const opcoesLivro = tipo === "terminei" ? lidos : tipo === "lendo" ? lendo : [];
  const livro = opcoesLivro.find((l) => l.id === livroId) ?? opcoesLivro[0];

  const [modelo, setModelo] = useState<Modelo>("editorial");
  const infoModelo = MODELOS.find((m) => m.id === modelo)!;
  const [paletaId, setPaletaId] = useState(infoModelo.paletas[0].id);
  const paleta = infoModelo.paletas.find((p) => p.id === paletaId) ?? infoModelo.paletas[0];
  const [formato, setFormato] = useState<Formato>("story");
  const [chamada, setChamada] = useState<string | null>(null);
  const [propria, setPropria] = useState("");
  const [mostrar, setMostrar] = useState<Record<string, boolean>>({ leitor: false });
  const on = (k: string) => mostrar[k] !== false;

  // as informações possíveis vêm só do que existe nos dados
  const dias = livro ? diasDeLeitura(livro) : null;
  const doAno = lidos.filter((l) => l.lidoEm!.startsWith(String(hoje.getFullYear()))).length;
  const disponiveis: { id: string; rotulo: string; valor?: string }[] =
    tipo === "mes"
      ? [
          { id: "qtd", rotulo: "livros no mês", valor: String(doMes.length) },
          { id: "paginas", rotulo: "páginas", valor: doMes.reduce((t, l) => t + (l.paginas ?? 0), 0) ? doMes.reduce((t, l) => t + (l.paginas ?? 0), 0).toLocaleString("pt-BR") : undefined },
        ]
      : livro
        ? [
            { id: "fim", rotulo: "concluído em", valor: tipo === "terminei" && livro.lidoEm && !livro.lidoSoAno ? new Date(livro.lidoEm).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }) : undefined },
            { id: "inicio", rotulo: "início", valor: livro.iniciadoEm ? new Date(livro.iniciadoEm).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) : undefined },
            { id: "paginas", rotulo: "páginas", valor: livro.paginas ? String(livro.paginas) : undefined },
            { id: "duracao", rotulo: "duração", valor: tipo === "terminei" && dias ? `${dias} ${dias === 1 ? "dia" : "dias"}` : undefined },
            { id: "ano", rotulo: `livros em ${hoje.getFullYear()}`, valor: tipo === "terminei" && doAno ? String(doAno) : undefined },
          ]
        : [];
  const comValor = disponiveis.filter((d) => d.valor);
  const temNota = tipo === "terminei" && !!livro?.nota;
  const temCitacao = !!livro?.citacao?.trim();
  const temResenha = !!livro?.resenha?.trim();
  const temProgresso = tipo === "lendo" && !!livro?.paginas && !!livro?.paginaAtual;

  const frase = propria.trim() || chamada || CHAMADAS[tipo][0];
  const conteudo: Conteudo = {
    chamada: frase,
    livro: tipo === "mes" ? undefined : livro,
    livros: tipo === "mes" ? doMes : undefined,
    contexto: tipo === "mes" ? `${MESES[mesNum - 1]} de ${anoMes}` : undefined,
    mostrarCapa: on("capa"),
    mostrarTitulo: on("titulo"),
    mostrarAutor: on("autor"),
    nota: temNota && on("nota") ? livro!.nota : undefined,
    dados: comValor.filter((d) => on(d.id)).map((d) => ({ rotulo: d.rotulo, valor: d.valor! })),
    trecho: temCitacao && on("citacao") ? { tipo: "citação", texto: livro!.citacao!.trim().slice(0, 180) } : temResenha && on("resenha") ? { tipo: "resenha", texto: livro!.resenha!.trim().slice(0, 160) } : undefined,
    progresso: temProgresso && on("progresso") ? Math.min(100, Math.round((livro!.paginaAtual! / livro!.paginas!) * 100)) : undefined,
    leitor: mostrar.leitor && usuario ? usuario : undefined,
  };

  const quadro = useRef<HTMLDivElement>(null);
  const [gerando, setGerando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const podeCompartilhar = typeof navigator !== "undefined" && !!navigator.canShare;
  async function gerar(acao: "salvar" | "compartilhar") {
    if (!quadro.current) return;
    setGerando(true);
    setAviso(null);
    try {
      await document.fonts.ready;
      const png = await fotografarPng(quadro.current, { pixelRatio: 3, includeQueryParams: true });
      const blob = await (await fetch(png)).blob();
      const nome = `the-bookside-${tipo}-${formato}.png`;
      const arquivo = new File([blob], nome, { type: "image/png" });
      if (acao === "compartilhar" && navigator.canShare?.({ files: [arquivo] })) {
        await navigator.share({ files: [arquivo], title: "the bookside" });
      } else {
        const a = document.createElement("a");
        a.href = png;
        a.download = nome;
        a.click();
        setAviso("imagem salva ✓");
      }
    } catch (x) {
      if ((x as Error).name !== "AbortError") setAviso("não deu para gerar a imagem agora. tente de novo.");
    } finally {
      setGerando(false);
    }
  }

  const vazio = (tipo !== "mes" && !livro) || (tipo === "mes" && !doMes.length);
  const alto = FORMATOS.find((f) => f.id === formato)!.alto;
  const escala = formato === "story" ? 0.86 : 1;
  const rotulo = "mb-2 block text-[12px] font-semibold text-tinta-suave";
  const chip = (ativo: boolean) => `flex min-h-10 items-center rounded-[6px] border px-3 text-[13px] ${ativo ? "border-bordo bg-rosa-fundo font-semibold text-bordo" : "border-linha text-ameixa hover:border-bege"}`;
  const select = "h-11 w-full appearance-none rounded-[6px] border border-linha bg-transparent px-3 text-[14px] text-ameixa outline-none focus:border-bordo";

  const interruptor = (id: string, nome: string) => (
    <button key={id} type="button" aria-pressed={on(id)} onClick={() => setMostrar((m) => ({ ...m, [id]: !on(id) }))} className={chip(on(id))}>
      {on(id) ? "✓ " : ""}
      {nome}
    </button>
  );

  return (
    <div className="flex flex-1 flex-col pb-10 lg:bg-jornal lg:px-10 lg:pt-6">
      <div className="flex items-center justify-between px-5 pt-2 lg:px-0 lg:pt-0">
        <Voltar padrao="/numeros" className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo" />
        <h1 className="font-revista text-[20px] text-bordo italic lg:text-[24px]">compartilhar.</h1>
      </div>

      <div className="mt-2 lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(340px,2fr)] lg:items-start lg:gap-10">
        {/* pré-visualização: a arte em si, sobre fundo neutro */}
        <div className="lg:sticky lg:top-6">
          <div className="flex justify-center bg-[#E9E4DE] px-4 py-6 lg:rounded-[8px] lg:py-10">
            {vazio ? (
              <div className="flex h-[400px] w-[300px] items-center justify-center rounded-[6px] border border-dashed border-bege p-8 text-center text-[14px] text-cinza italic">
                {tipo === "lendo" ? "nenhum livro em lendo agora." : tipo === "terminei" ? "nenhum livro lido com data ainda." : `nenhum livro terminado em ${MESES[mesNum - 1]} de ${anoMes}.`}
              </div>
            ) : (
              <div style={{ width: 360 * escala, height: alto * escala }} className="shadow-[0_24px_50px_-24px_rgba(43,20,32,.55)]">
                <div style={{ transform: `scale(${escala})`, transformOrigin: "top left" }}>
                  <Peca ref={quadro} modelo={modelo} c={conteudo} formato={formato} paleta={paleta} />
                </div>
              </div>
            )}
          </div>
          <div role="radiogroup" aria-label="formato" className="mt-3 flex justify-center gap-2 px-5">
            {FORMATOS.map((f) => (
              <button key={f.id} type="button" role="radio" aria-checked={formato === f.id} onClick={() => setFormato(f.id)} className={chip(formato === f.id)}>
                {f.nome}
                <span className="ml-1.5 hidden text-[11px] font-normal text-cinza sm:inline">{f.px}</span>
              </button>
            ))}
          </div>
        </div>

        {/* controles */}
        <div className="mt-6 space-y-6 px-5 lg:mt-0 lg:px-0">
          <div role="radiogroup" aria-label="o que compartilhar" className="flex gap-5 border-b border-linha">
            {([["terminei", "Terminei"], ["lendo", "Lendo"], ["mes", "Meu mês"]] as const).map(([id, r]) => (
              <button key={id} type="button" role="radio" aria-checked={tipo === id} onClick={() => (setTipo(id), setChamada(null))} className={`-mb-px min-h-11 border-b-2 text-[14px] ${tipo === id ? "border-bordo font-semibold text-bordo" : "border-transparent text-cinza"}`}>
                {r}
              </button>
            ))}
          </div>

          {tipo !== "mes" && opcoesLivro.length ? (
            <label className="block">
              <span className={rotulo}>Livro</span>
              <select value={livro?.id ?? ""} onChange={(ev) => setLivroId(ev.target.value)} className={select}>
                {opcoesLivro.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.titulo}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {tipo === "mes" ? (
            <label className="block">
              <span className={rotulo}>Mês</span>
              <select value={mesSel} onChange={(ev) => setMesSel(ev.target.value)} className={select}>
                {[...new Set([mesSel, ...meses])].sort().reverse().map((m) => (
                  <option key={m} value={m}>
                    {MESES[Number(m.slice(5, 7)) - 1]} de {m.slice(0, 4)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div>
            <span className={rotulo}>Modelo</span>
            <div className="grid grid-cols-2 gap-2">
              {MODELOS.map((m) => (
                <button key={m.id} type="button" aria-pressed={modelo === m.id} onClick={() => (setModelo(m.id), setPaletaId(m.paletas[0].id))} className={`rounded-[6px] border px-3 py-2.5 text-left ${modelo === m.id ? "border-bordo bg-rosa-fundo" : "border-linha hover:border-bege"}`}>
                  <span className="block font-revista text-[16px] text-ameixa">{m.nome}</span>
                  <span className="block text-[11px] text-cinza">{m.descricao}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={rotulo}>Paleta</span>
            <div className="flex flex-wrap gap-2">
              {infoModelo.paletas.map((p) => (
                <button key={p.id} type="button" aria-pressed={paleta.id === p.id} aria-label={p.nome} title={p.nome} onClick={() => setPaletaId(p.id)} className={`flex items-center gap-2 rounded-[6px] border px-2.5 py-1.5 text-[12px] ${paleta.id === p.id ? "border-bordo text-bordo" : "border-linha text-ameixa"}`}>
                  <span aria-hidden className="flex overflow-hidden rounded-full border border-black/10">
                    {[p.fundo, p.destaque, p.bloco].map((c, i) => (
                      <span key={i} className="block size-4" style={{ background: c }} />
                    ))}
                  </span>
                  {p.nome}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={rotulo}>Frase</span>
            <div className="flex flex-wrap gap-2">
              {CHAMADAS[tipo].map((f) => (
                <button key={f} type="button" aria-pressed={!propria && frase === f} onClick={() => (setChamada(f), setPropria(""))} className={chip(!propria && frase === f)}>
                  {f}
                </button>
              ))}
            </div>
            <input value={propria} onChange={(ev) => setPropria(ev.target.value.slice(0, 48))} placeholder="ou escreva a sua (até 48 letras)" className={`${select} mt-2`} />
          </div>

          <div>
            <span className={rotulo}>O que aparece</span>
            <div className="flex flex-wrap gap-2">
              {tipo !== "mes" ? [interruptor("capa", "capa"), interruptor("titulo", "título"), interruptor("autor", "autoria")] : interruptor("capa", "capas")}
              {temNota ? interruptor("nota", "avaliação") : null}
              {temProgresso ? interruptor("progresso", "progresso") : null}
              {comValor.map((d) => interruptor(d.id, d.rotulo))}
              {temCitacao ? interruptor("citacao", "citação favorita") : null}
              {temResenha && !(temCitacao && on("citacao")) ? interruptor("resenha", "trecho da resenha") : null}
              {usuario ? (
                <button type="button" aria-pressed={!!mostrar.leitor} onClick={() => setMostrar((m) => ({ ...m, leitor: !m.leitor }))} className={chip(!!mostrar.leitor)}>
                  {mostrar.leitor ? "✓ " : ""}@{usuario}
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-[11px] text-cinza">Só aparecem informações que existem no seu registro. Seu @ fica de fora, a menos que você ligue.</p>
          </div>

          <div className="sticky bottom-[calc(76px+env(safe-area-inset-bottom))] z-10 flex gap-2 bg-creme py-2 lg:static lg:bg-transparent">
            {podeCompartilhar ? (
              <button type="button" onClick={() => gerar("compartilhar")} disabled={gerando || vazio} className="flex h-12 flex-1 items-center justify-center rounded-[6px] bg-bordo text-[14px] font-semibold text-creme disabled:opacity-45">
                {gerando ? "gerando…" : "Compartilhar"}
              </button>
            ) : null}
            <button type="button" onClick={() => gerar("salvar")} disabled={gerando || vazio} className={`flex h-12 flex-1 items-center justify-center rounded-[6px] text-[14px] font-semibold disabled:opacity-45 ${podeCompartilhar ? "border border-bege text-ameixa" : "bg-bordo text-creme"}`}>
              {gerando && !podeCompartilhar ? "gerando…" : "Salvar imagem"}
            </button>
          </div>
          {aviso ? <p className="text-[13px] text-cinza">{aviso}</p> : null}
        </div>
      </div>
    </div>
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
