"use client";

/*
 * Peças da "edição pessoal" do início: entre palavras (citação do dia),
 * desafios literários e nas entrelinhas. Usam os dados e regras que já
 * existem (lib/citacoes, lib/desafios, lib/entrelinhas): nada é duplicado.
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Selo } from "@/components/desafios/Selo";
import { ArteCarta, VersoCarta } from "@/components/entrelinhas/Carta";
import { ordemDaPessoa, posicaoDoDia, diaLocal, type Citacao } from "@/lib/citacoes";
import { calcularProgresso, diasRestantes, meusDesafios, modelos, unidade, type Desafio } from "@/lib/desafios";
import { CATALOGO } from "@/lib/entrelinhas";
import { useEntrelinhas } from "@/lib/entrelinhas-store";
import { usePerfil } from "@/lib/perfil-store";
import { useConsulta, useMeuId } from "@/lib/social";

const titulo = "font-revista text-[22px] leading-none text-ameixa";

/* ───────── entre palavras ───────── */

const TROCA = "bookside-entre-palavras";

export function EntrePalavras() {
  const eu = useMeuId();
  // seletores estáveis: derivar listas fora do seletor (senão a tela re-renderiza sem parar)
  const livros = usePerfil((s) => s.livros);
  const favoritos = useMemo(() => livros.filter((l) => l.amei).map((l) => l.autor ?? ""), [livros]);
  const guardadasBruto = usePerfil((s) => s.palavrasGuardadas);
  const guardadas = useMemo(() => guardadasBruto ?? [], [guardadasBruto]);
  const atualizar = usePerfil((s) => s.atualizar);
  const dia = diaLocal();
  const ordem = useMemo(() => ordemDaPessoa(eu ?? "anonimo", favoritos), [eu, favoritos.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  // a troca manual vale só para hoje e não mexe na ordem dos próximos dias
  const [passo, setPasso] = useState(0);
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(TROCA) ?? "{}") as { dia?: string; passo?: number };
      setPasso(v.dia === dia ? (v.passo ?? 0) : 0);
    } catch {
      /* sem armazenamento */
    }
  }, [dia]);
  const [aviso, setAviso] = useState("");
  if (!ordem.length) return null;
  const c = ordem[(posicaoDoDia(dia) + passo * 7) % ordem.length];
  const guardada = guardadas.some((g) => g.id === c.id);

  function trocar() {
    const p = passo + 1;
    setPasso(p);
    try {
      localStorage.setItem(TROCA, JSON.stringify({ dia, passo: p }));
    } catch {
      /* sem armazenamento */
    }
  }
  function guardar() {
    atualizar({
      palavrasGuardadas: guardada
        ? guardadas.filter((g) => g.id !== c.id)
        : [{ id: c.id, texto: c.texto, autor: c.autor, obra: c.obra, em: new Date().toISOString(), origem: "inicio" as const }, ...guardadas].slice(0, 200),
    });
    setAviso(guardada ? "citação removida das guardadas" : "citação guardada");
    setTimeout(() => setAviso(""), 2000);
  }

  const botao = "grid size-9 place-items-center rounded-full text-bordo/70 hover:bg-creme/60 hover:text-bordo";
  return (
    <figure className="grao relative overflow-hidden rounded-[10px] bg-rosa-editorial px-4 py-4 lg:px-6 lg:py-5">
      {/* detalhe azul suave no canto, sem tomar a peça */}
      <span aria-hidden className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full bg-descoberta-suave/80" />
      <div className="relative flex items-start gap-3 lg:gap-4">
        <span aria-hidden className="font-revista text-[44px] leading-[.8] text-bordo lg:text-[52px]">
          “
        </span>
        <div className="min-w-0 flex-1">
          <p className="mb-1 font-revista text-[15px] leading-none text-bordo italic">quotes</p>
          <blockquote className="font-revista text-[17px] leading-[1.4] text-ameixa italic lg:text-[19px]">
            {c.texto.split(" / ").map((v, i, a) => (
              <span key={i}>
                {v}
                {i < a.length - 1 ? <br /> : null}
              </span>
            ))}
          </blockquote>
          <figcaption className="mt-2 text-[12px] text-tinta-suave">
            —{" "}
            {c.autor} ·{" "}
            <Link href={`/buscar?q=${encodeURIComponent(`${c.obra} ${c.autor.replace(/\s*\(.*\)/, "")}`)}`} className="italic hover:text-bordo hover:underline">
              {c.obra}
            </Link>
          </figcaption>
        </div>
        <div className="-mr-2 flex flex-none flex-col">
          <button type="button" onClick={guardar} aria-pressed={guardada} aria-label={guardada ? "tirar das citações guardadas" : "guardar citação"} className={`${botao} ${guardada ? "text-bordo" : ""}`}>
            <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill={guardada ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
              <path d="M6 3h12v18l-6-4.5L6 21z" />
            </svg>
          </button>
          <button type="button" onClick={() => compartilharCitacao(c, setAviso)} aria-label="compartilhar citação" className={botao}>
            <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" />
            </svg>
          </button>
          <button type="button" onClick={trocar} aria-label="ler outra citação" className={botao}>
            <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5" />
            </svg>
          </button>
        </div>
      </div>
      <span role="status" className="relative block min-h-0 text-[11px] text-tinta-suave">
        {aviso}
      </span>
    </figure>
  );
}

/** a peça editorial da citação (1080×1350), em PNG; texto em domínio público */
async function compartilharCitacao(c: Citacao, avisar: (s: string) => void) {
  const W = 1080;
  const H = 1350;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const x = cv.getContext("2d");
  if (!x) return;
  const css = getComputedStyle(document.documentElement);
  const serif = `${css.getPropertyValue("--font-fraunces").trim() || "Georgia"}, Georgia, serif`;
  const sans = `${css.getPropertyValue("--font-manrope").trim() || "system-ui"}, system-ui, sans-serif`;
  await document.fonts.ready;
  x.fillStyle = "#F8F4EE";
  x.fillRect(0, 0, W, H);
  x.fillStyle = "#E8D2D8";
  x.fillRect(0, 0, W, 18);
  x.fillStyle = "#DCE3F0";
  x.fillRect(0, H - 18, W, 18);
  x.fillStyle = "#8297D1";
  x.font = `600 26px ${sans}`;
  x.fillText("E N T R E   P A L A V R A S .", 110, 190);
  x.fillStyle = "#38252C";
  x.font = `italic 58px ${serif}`;
  const linhas: string[] = [];
  for (const verso of c.texto.split(" / ")) {
    let atual = "";
    for (const p of verso.split(" ")) {
      const t = atual ? `${atual} ${p}` : p;
      if (x.measureText(t).width > W - 220) {
        linhas.push(atual);
        atual = p;
      } else atual = t;
    }
    linhas.push(atual);
  }
  let y = 330;
  for (const l of linhas) {
    x.fillText(l, 110, y);
    y += 78;
  }
  x.fillStyle = "#692536";
  x.fillRect(110, y + 20, 80, 3);
  x.font = `600 30px ${sans}`;
  x.fillText(c.autor, 110, y + 85);
  x.fillStyle = "#56444B";
  x.font = `italic 30px ${serif}`;
  x.fillText(c.obra, 110, y + 130);
  x.fillStyle = "#692536";
  x.font = `italic 34px ${serif}`;
  x.fillText("the bookside.", W - 110 - x.measureText("the bookside.").width, H - 90);
  const blob = await new Promise<Blob | null>((ok) => cv.toBlob(ok, "image/png"));
  if (!blob) return;
  const arquivo = new File([blob], "entre-palavras.png", { type: "image/png" });
  try {
    if (navigator.canShare?.({ files: [arquivo] })) {
      await navigator.share({ files: [arquivo], text: `${c.texto.replace(/ \/ /g, " ")} — ${c.autor}, ${c.obra}` });
      return;
    }
  } catch {
    return; // cancelou
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "entre-palavras.png";
  a.click();
  URL.revokeObjectURL(a.href);
  avisar("imagem salva");
}

/* ───────── desafios literários ───────── */

function progressoDe(d: Desafio, livros: ReturnType<typeof usePerfil.getState>["livros"], salvo: number) {
  // tipos que o app calcula pelos registros; pilha e bingo usam o progresso guardado
  return ["livros", "paginas", "minutos", "dias"].includes(d.tipo) ? calcularProgresso(d, livros).progresso : salvo;
}

export function DesafiosHome() {
  const eu = useMeuId();
  const livros = usePerfil((s) => s.livros);
  const consulta = useConsulta(() => meusDesafios().catch(() => null), [eu]);
  const dados = consulta.dados;
  const hoje = new Date().toISOString().slice(0, 10);
  const ativos = (dados?.desafios ?? [])
    .filter((d) => dados?.participo.has(d.id) && d.fim >= hoje && !dados.participantes.find((p) => p.desafio_id === d.id && p.usuario_id === eu)?.concluido_em)
    .slice(0, 3);
  if (consulta.carregando && !dados) return null;

  return (
    <section aria-labelledby="t-desafios">
      <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-linha pb-2">
        <h2 id="t-desafios" className={titulo}>
          desafios literários.
        </h2>
        <Link href="/perfil?aba=jornada#desafios" className="text-[12px] font-semibold text-bordo hover:underline">
          {ativos.length ? "todos" : "ver desafios"}
        </Link>
      </div>
      {ativos.length ? (
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {ativos.slice(0, 1).map((d) => {
            const salvo = dados!.participantes.find((p) => p.desafio_id === d.id && p.usuario_id === eu)?.progresso ?? 0;
            const prog = progressoDe(d, livros, salvo);
            const pct = Math.min(100, Math.round((prog / Math.max(1, d.meta)) * 100));
            const faltam = diasRestantes(d.fim);
            return (
              <Link key={d.id} href={`/desafios/${d.id}`} className="group flex gap-4">
                <Selo tipo={d.tipo} numero={d.tipo === "livros" ? d.meta : undefined} cor={modelos.find((m) => m.id === d.modelo)?.cor} tamanho={84} girar={-3} />
                <span className="min-w-0 flex-1">
                  <span className="block font-revista text-[19px] leading-tight text-ameixa group-hover:text-bordo">{d.titulo}</span>
                  <span className="mt-0.5 block text-[12px] text-tinta-suave">
                    Objetivo: {d.meta.toLocaleString("pt-BR")} {unidade[d.tipo][d.meta === 1 ? 0 : 1]} até {new Date(`${d.fim}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                  </span>
                  <span aria-hidden className="mt-3 block h-[5px] rounded-full bg-diario-suave">
                    <span className="block h-full rounded-full bg-diario-tinta" style={{ width: `${Math.max(2, pct)}%` }} />
                  </span>
                  <span className="mt-1.5 flex justify-between text-[11px] text-cinza tabular-nums">
                    <span>
                      {prog.toLocaleString("pt-BR")} de {d.meta.toLocaleString("pt-BR")}
                    </span>
                    <span>{faltam > 0 ? `${faltam} ${faltam === 1 ? "dia" : "dias"}` : "último dia"}</span>
                  </span>
                </span>
              </Link>
            );
          })}
          {ativos.length > 1 ? (
            <ul className="divide-y divide-linha border-y border-linha sm:border-y-0 sm:border-l sm:pl-5">
              {ativos.slice(1).map((d) => {
                const salvo = dados!.participantes.find((p) => p.desafio_id === d.id && p.usuario_id === eu)?.progresso ?? 0;
                const prog = progressoDe(d, livros, salvo);
                return (
                  <li key={d.id}>
                    <Link href={`/desafios/${d.id}`} className="flex items-center gap-3 py-2.5 hover:text-bordo">
                      <Selo tipo={d.tipo} numero={d.tipo === "livros" ? d.meta : undefined} cor={modelos.find((m) => m.id === d.modelo)?.cor} tamanho={36} />
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-ameixa">{d.titulo}</span>
                        <span className="block text-[11px] text-cinza tabular-nums">
                          {prog.toLocaleString("pt-BR")} de {d.meta.toLocaleString("pt-BR")} {unidade[d.tipo][1]}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : (
        <div>
          <p className="text-[13px] text-tinta-suave">Experiências para variar o ritmo, explorar e manter a constância.</p>
          <ul className="mt-3 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none]">
            {modelos.slice(0, 3).map((m) => (
              <li key={m.id} className="w-[150px] flex-none">
                <Link href={`/desafios/novo?modelo=${m.id}`} className="group block">
                  <Selo tipo={m.tipo} numero={m.tipo === "livros" ? m.meta : undefined} cor={m.cor} tamanho={64} rotulo={m.titulo} />
                  <span className="mt-1.5 block text-[13px] font-semibold text-ameixa group-hover:text-bordo">{m.titulo}</span>
                  <span className="line-clamp-2 block text-[11px] text-cinza">{m.descricao}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/desafios" className="mt-3 inline-flex h-10 items-center rounded-[6px] bg-bordo px-4 text-[13px] font-semibold text-creme hover:bg-bordo-suave">
            Encontrar um desafio
          </Link>
        </div>
      )}
    </section>
  );
}

/* ───────── nas entrelinhas ───────── */

export function EntrelinhasHome() {
  const resultado = useEntrelinhas((s) => s.resultado);
  const andamento = useEntrelinhas((s) => s.execucao);
  if (resultado) {
    // depois do teste: só o nome do arquétipo e o caminho para a carta e as indicações
    return (
      <Link href="/nas-entrelinhas?ver=carta" className="group flex items-center gap-3 border-y border-linha py-3">
        <ArteCarta carta={resultado.carta} largura={34} />
        <span className="min-w-0 flex-1">
          <span className="block font-revista text-[16px] text-ameixa italic">✧ {CATALOGO[resultado.carta].nome}</span>
          <span className="block text-[12px] text-cinza">sua carta de nas entrelinhas · leituras para ela</span>
        </span>
        <span className="text-[12px] font-semibold text-bordo group-hover:underline">ver →</span>
      </Link>
    );
  }
  return (
    <Link href="/nas-entrelinhas" className="grao group relative flex items-center gap-4 overflow-hidden rounded-[4px] bg-rosa-editorial px-4 py-5">
      <span aria-hidden className="absolute -right-6 -bottom-8 size-28 rounded-full bg-descoberta-suave" />
      <span className="relative flex-none">
        <VersoCarta largura={44} className="rotate-[-7deg]" />
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block font-revista text-[22px] leading-tight text-bordo italic">nas entrelinhas.</span>
        <span className="block text-[12px] font-semibold text-ameixa">O oráculo dos leitores.</span>
        <span className="mt-0.5 block font-revista text-[13px] text-tinta-suave italic">Nem toda história está escrita nas páginas.</span>
        <span className="mt-2.5 inline-flex h-9 items-center rounded-[6px] bg-bordo px-3 text-[12px] font-semibold text-creme group-hover:bg-bordo-suave">
          {andamento ? "Continuar" : "Descobrir minha carta"}
        </span>
      </span>
    </Link>
  );
}

/* ───────── na jornada: o lugar principal dos desafios e das palavras guardadas ───────── */

export function DesafiosNaJornada() {
  const eu = useMeuId();
  const livros = usePerfil((s) => s.livros);
  const consulta = useConsulta(() => meusDesafios().catch(() => null), [eu]);
  const dados = consulta.dados;
  if (!dados) return null;
  const hoje = new Date().toISOString().slice(0, 10);
  const meu = (d: Desafio) => dados.participantes.find((p) => p.desafio_id === d.id && p.usuario_id === eu);
  const meus = dados.desafios.filter((d) => dados.participo.has(d.id));
  const concluidos = meus.filter((d) => meu(d)?.concluido_em);
  const andamento = meus.filter((d) => !meu(d)?.concluido_em && d.fim >= hoje);
  const disponiveis = modelos.filter((m) => !andamento.some((d) => d.modelo === m.id)).slice(0, 4);
  return (
    <section id="desafios" aria-labelledby="t-j-desafios" className="scroll-mt-24 border-t border-linha pt-6">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="t-j-desafios" className={titulo}>
          desafios literários.
        </h2>
        <Link href="/desafios" className="text-[12px] font-semibold text-bordo hover:underline">
          gerenciar
        </Link>
      </div>
      {andamento.length ? (
        <ul className="divide-y divide-linha border-y border-linha">
          {andamento.map((d) => {
            const prog = progressoDe(d, livros, meu(d)?.progresso ?? 0);
            return (
              <li key={d.id}>
                <Link href={`/desafios/${d.id}`} className="flex items-center gap-3 py-3 hover:text-bordo">
                  <Selo tipo={d.tipo} numero={d.tipo === "livros" ? d.meta : undefined} cor={modelos.find((m) => m.id === d.modelo)?.cor} tamanho={42} estado="andamento" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-semibold text-ameixa">{d.titulo}</span>
                    <span className="block text-[12px] text-cinza tabular-nums">
                      {prog.toLocaleString("pt-BR")} de {d.meta.toLocaleString("pt-BR")} {unidade[d.tipo][1]} · até {new Date(`${d.fim}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[13px] text-tinta-suave">Nenhum desafio em andamento.</p>
      )}
      {concluidos.length ? (
        <div className="mt-5">
          <p className="mb-2 text-[12px] font-semibold text-cinza">Emblemas conquistados</p>
          <ul className="flex flex-wrap gap-4">
            {concluidos.map((d) => (
              <li key={d.id} className="w-[86px] text-center">
                <Link href={`/desafios/${d.id}`}>
                  <Selo tipo={d.tipo} numero={d.tipo === "livros" ? d.meta : undefined} cor={modelos.find((m) => m.id === d.modelo)?.cor} tamanho={72} estado="concluido" data={new Date(meu(d)!.concluido_em!).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })} />
                  <span className="mt-1 line-clamp-2 block text-[11px] text-tinta-suave">{d.titulo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {disponiveis.length ? (
        <p className="mt-4 text-[12px] text-cinza">
          Novos desafios:{" "}
          {disponiveis.map((m, i) => (
            <span key={m.id}>
              {i ? " · " : ""}
              <Link href={`/desafios/novo?modelo=${m.id}`} className="font-semibold text-bordo hover:underline">
                {m.titulo}
              </Link>
            </span>
          ))}
        </p>
      ) : null}
    </section>
  );
}

export function PalavrasGuardadas() {
  const guardadasBruto = usePerfil((s) => s.palavrasGuardadas);
  const guardadas = guardadasBruto ?? [];
  if (!guardadas.length) return null;
  return (
    <section aria-labelledby="t-palavras" className="border-t border-linha pt-6">
      <h2 id="t-palavras" className={`${titulo} mb-3`}>
        palavras guardadas.
      </h2>
      <ul className="divide-y divide-linha">
        {guardadas.slice(0, 12).map((g) => (
          <li key={g.id} className="py-3">
            <p className="font-revista text-[16px] leading-snug text-ameixa italic">{g.texto.replace(/ \/ /g, " / ")}</p>
            <p className="mt-1 text-[12px] text-cinza">
              {g.autor} · <i>{g.obra}</i> · descoberta no início
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
