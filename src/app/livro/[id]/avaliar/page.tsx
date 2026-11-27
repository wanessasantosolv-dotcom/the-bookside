"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaAuto } from "@/components/CapaAuto";
import { useHidratado } from "@/components/PerfilHidratacao";
import { EstrelasEscolha } from "@/components/marginalia/Estrelas";
import { FichaPublicada, type DadosFicha } from "@/components/marginalia/FichaPublicada";
import { livroLembrado } from "@/lib/catalogo";
import { fichaApagada, infoDoLivro, notasCompletas } from "@/lib/estantes";
import { dataDoDia, diaDaData, diaLocal, diasEntre } from "@/lib/datas";
import { formatos } from "@/lib/formatos";
import { CRITERIOS, PERGUNTAS_REFLEXAO, RECOMENDARIA, RELERIA, SENSACOES, SENSACOES_VISIVEIS, notaTexto } from "@/lib/marginalia";
import { reacoes } from "@/lib/reacoes";
import { media } from "@/lib/clubes";
import { usePerfil, type FormatoLivro, type LivroSalvo, type NotasDetalhe, type Reacao } from "@/lib/perfil-store";

type Trecho = NonNullable<LivroSalvo["trechos"]>[number];

/** o que está sendo escrito (vira rascunho neste aparelho enquanto não for salvo) */
type Rascunho = {
  inicio: string;
  fim: string;
  soAno: boolean;
  ano: number;
  formato?: FormatoLivro;
  nota: number;
  notas: Partial<NotasDetalhe>;
  naoAplica: (keyof NotasDetalhe)[];
  reacao?: Reacao;
  sensacoes: string[];
  resenha: string;
  spoiler: boolean;
  personagem: string;
  trechos: Trecho[];
  recomendaria?: "sim" | "ressalvas" | "nao";
  releria?: "sim" | "talvez" | "nao";
};

const CHAVE_RASCUNHO = (id: string) => `bookside-marginalia-${id}`;
const rotulo = "mb-1.5 block text-[12px] font-semibold text-tinta-suave";
const campo =
  "h-11 w-full rounded-[6px] border border-bege bg-creme-quente px-3 text-[15px] text-ameixa outline-none focus:border-bordo focus:ring-1 focus:ring-bordo";
const tituloSecao = "font-revista text-[21px] leading-tight text-ameixa lg:text-[23px]";
const etiqueta = (on: boolean) =>
  `inline-flex min-h-9 items-center gap-1 rounded-[4px] border px-2.5 text-[13px] transition-colors ${on ? "border-bordo bg-rosa-fundo font-semibold text-bordo" : "border-linha text-tinta-suave hover:border-bege"}`;

/** os valores salvos do livro → o rascunho inicial (nada vazio por cima do que existe) */
function doLivro(l: LivroSalvo): Rascunho {
  const notas = Object.fromEntries(Object.entries(l.notas ?? {}).filter(([, v]) => v)) as Partial<NotasDetalhe>;
  const naFicha = (l.trechos ?? []).filter((t) => t.naFicha);
  // o trecho antigo da ficha (um só) entra como primeira passagem, sem duplicar
  const antigo = l.citacao && !naFicha.some((t) => t.texto === l.citacao) ? [{ texto: l.citacao, naFicha: true } as Trecho] : [];
  const fimDia = diaDaData(l.status === "abandonado" ? l.paradoEm : l.lidoEm);
  return {
    inicio: diaDaData(l.iniciadoEm) ?? "",
    fim: l.lidoSoAno ? "" : (fimDia ?? ""),
    soAno: !!l.lidoSoAno,
    ano: Number((fimDia ?? diaLocal()).slice(0, 4)),
    formato: l.formato,
    nota: l.nota ?? 0,
    notas,
    naoAplica: l.naoAplica ?? [],
    reacao: l.reacao,
    sensacoes: l.sensacoes ?? [],
    resenha: l.resenha ?? "",
    spoiler: !!l.resenhaSpoiler,
    personagem: l.personagem ?? "",
    trechos: [...antigo, ...naFicha],
    recomendaria: l.recomendaria,
    releria: l.releria,
  };
}

function Marginalia({ livro }: { livro: LivroSalvo & { paginas?: number } }) {
  const router = useRouter();
  const editarLivro = usePerfil((s) => s.editarLivro);
  const atualizar = usePerfil((s) => s.atualizar);
  const favoritos = usePerfil((s) => s.favoritos);
  const perfil = { nome: usePerfil((s) => s.nome), foto: usePerfil((s) => s.foto), tema: usePerfil((s) => s.tema) };
  const salvo = useMemo(() => doLivro(livro), [livro]);
  const [r, setR] = useState<Rascunho>(() => {
    try {
      const guardado = localStorage.getItem(CHAVE_RASCUNHO(livro.id));
      if (guardado) return { ...salvo, ...(JSON.parse(guardado) as Partial<Rascunho>) };
    } catch {
      /* sem rascunho */
    }
    return salvo;
  });
  const [estado, setEstado] = useState<"salvo" | "alterado" | "rascunho" | "erro">(() => {
    try {
      return localStorage.getItem(CHAVE_RASCUNHO(livro.id)) ? "rascunho" : "salvo";
    } catch {
      return "salvo";
    }
  });
  const [erros, setErros] = useState<{ nota?: string; datas?: string }>({});
  const [previa, setPrevia] = useState(false);
  const [perguntas, setPerguntas] = useState(false);
  const [importar, setImportar] = useState(false);
  const [todasSensacoes, setTodasSensacoes] = useState(false);
  const mudar = (d: Partial<Rascunho>) => {
    setR((x) => ({ ...x, ...d }));
    setEstado("alterado");
  };
  const resenhaRef = useRef<HTMLTextAreaElement>(null);

  // rascunho automático neste aparelho (com folga para não gravar a cada letra)
  const primeiro = useRef(true);
  useEffect(() => {
    if (primeiro.current) {
      primeiro.current = false;
      return;
    }
    if (estado !== "alterado") return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(CHAVE_RASCUNHO(livro.id), JSON.stringify(r));
        setEstado("rascunho");
      } catch {
        setEstado("erro");
      }
    }, 900);
    return () => clearTimeout(t);
  }, [r, estado, livro.id]);

  // sair com alterações que ainda não viraram rascunho
  useEffect(() => {
    const aviso = (e: BeforeUnloadEvent) => {
      if (estado === "alterado") e.preventDefault();
    };
    window.addEventListener("beforeunload", aviso);
    return () => window.removeEventListener("beforeunload", aviso);
  }, [estado]);

  // a resenha cresce com o texto
  useEffect(() => {
    const el = resenhaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(220, el.scrollHeight)}px`;
  }, [r.resenha]);

  const abandonou = r.reacao === "abandonei";
  const hoje = diaLocal();
  const dias = !r.soAno ? diasEntre(r.inicio || undefined, r.fim || undefined) : null;
  const notaGeral = r.nota || Math.round((media(Object.entries(r.notas).filter(([k]) => !r.naoAplica.includes(k as keyof NotasDetalhe)).map(([, v]) => v as number)) ?? 0) * 2) / 2;
  const temFicha = !!(livro.nota || livro.reacao || livro.resenha || livro.citacao || livro.personagem || (livro.notas && Object.values(livro.notas).some(Boolean)));
  const favorito = favoritos.includes(livro.id);
  const concluida = !abandonou && (livro.status === "lido" || !!r.fim || r.soAno);

  function validar() {
    const e: typeof erros = {};
    if (!notaGeral && !r.reacao) e.nota = "dê uma nota ou escolha um veredito para salvar a ficha.";
    if (r.fim && r.fim > hoje) e.datas = "a data de conclusão não pode estar no futuro.";
    else if (r.inicio && r.inicio > hoje) e.datas = "a data de início não pode estar no futuro.";
    else if (r.inicio && r.fim && r.fim < r.inicio) e.datas = "a conclusão não pode ser antes do início.";
    setErros(e);
    return !Object.keys(e).length;
  }

  function publicar() {
    if (!validar()) {
      document.getElementById(erros.nota ? "t-avaliacao" : "t-leitura")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const agora = new Date().toISOString();
    const fimIso = r.soAno ? new Date(`${r.ano}-01-01T12:00:00`).toISOString() : r.fim ? dataDoDia(r.fim) : undefined;
    // passagens: as da ficha ficam marcadas; as que saíram da ficha continuam nas anotações
    const textosFicha = new Set(r.trechos.map((t) => t.texto.trim()).filter(Boolean));
    const outros = (livro.trechos ?? []).filter((t) => !textosFicha.has(t.texto.trim())).map((t) => ({ ...t, naFicha: undefined }));
    const daFicha = r.trechos.filter((t) => t.texto.trim()).map((t) => ({ ...t, texto: t.texto.trim(), naFicha: true, origem: t.origem ?? ("app" as const) }));
    editarLivro(
      { id: livro.id, titulo: livro.titulo, autor: livro.autor, capa: livro.capa },
      {
        status: abandonou ? "abandonado" : "lido",
        ...(abandonou ? { paradoEm: fimIso } : { lidoEm: fimIso ?? livro.lidoEm, lidoSoAno: r.soAno || undefined }),
        // sem data de início: fica sem (nunca inventamos uma)
        iniciadoEm: r.inicio ? dataDoDia(r.inicio) : undefined,
        formato: r.formato,
        nota: notaGeral || undefined,
        notas: notasCompletas(r.notas),
        naoAplica: r.naoAplica.length ? r.naoAplica : undefined,
        reacao: r.reacao,
        ...(r.reacao === "favoritado" ? { amei: true } : {}),
        sensacoes: r.sensacoes.length ? r.sensacoes : undefined,
        resenha: r.resenha.trim() || undefined,
        resenhaSpoiler: r.spoiler || undefined,
        personagem: r.personagem.trim() || undefined,
        citacao: daFicha[0]?.texto,
        trechos: [...outros, ...daFicha],
        recomendaria: r.recomendaria,
        releria: r.releria,
        fichaEm: livro.fichaEm ?? agora,
        fichaEditadaEm: agora,
        paginas: livro.paginas,
        ...(abandonou ? {} : { paginaAtual: livro.paginas }),
      },
    );
    try {
      localStorage.removeItem(CHAVE_RASCUNHO(livro.id));
    } catch {
      /* nada */
    }
    setEstado("salvo");
    router.push(`/livro/${livro.id}`);
  }

  function salvarRascunho() {
    try {
      localStorage.setItem(CHAVE_RASCUNHO(livro.id), JSON.stringify(r));
      setEstado("rascunho");
    } catch {
      setEstado("erro");
    }
  }

  function descartarRascunho() {
    try {
      localStorage.removeItem(CHAVE_RASCUNHO(livro.id));
    } catch {
      /* nada */
    }
    setR(salvo);
    setEstado("salvo");
  }

  function alternarFavorito() {
    if (favorito) atualizar({ favoritos: favoritos.filter((f) => f !== livro.id) });
    else if (favoritos.length < 6) atualizar({ favoritos: [...favoritos, livro.id] });
  }

  function excluir() {
    if (!confirm("excluir a sua ficha? a nota, os critérios, as impressões e as passagens saem da ficha. o livro continua na estante.")) return;
    editarLivro(livro, { ...fichaApagada, trechos: (livro.trechos ?? []).map((t) => ({ ...t, naFicha: undefined })) });
    try {
      localStorage.removeItem(CHAVE_RASCUNHO(livro.id));
    } catch {
      /* nada */
    }
    router.push(`/livro/${livro.id}`);
  }

  const dados: DadosFicha = {
    livro,
    leitora: perfil.nome ? { nome: perfil.nome, foto: perfil.foto } : undefined,
    tema: perfil.tema,
    inicio: r.inicio || undefined,
    fim: r.soAno ? `${r.ano}-01-01` : r.fim || undefined,
    soAno: r.soAno,
    dias,
    formato: r.formato,
    nota: notaGeral,
    notas: r.notas,
    naoAplica: r.naoAplica,
    reacao: r.reacao,
    sensacoes: r.sensacoes,
    resenha: r.resenha,
    spoiler: r.spoiler,
    personagem: r.personagem.trim() || undefined,
    trechos: r.trechos.filter((t) => t.texto.trim()),
    recomendaria: r.recomendaria,
    releria: r.releria,
    concluida,
  };

  const textoEstado = {
    salvo: temFicha ? "ficha publicada" : "nova ficha",
    alterado: "alterações não salvas",
    rascunho: "rascunho salvo neste aparelho",
    erro: "não foi possível salvar o rascunho",
  }[estado];
  const contexto = (livro.releituras?.length ?? 0) > 0 ? `releitura · ${(livro.releituras?.length ?? 0) + 1}ª leitura` : "leitura pessoal";
  const anotacoesFora = (livro.trechos ?? []).filter((t) => !r.trechos.some((x) => x.texto.trim() === t.texto.trim()));

  return (
    <AppShell aba="estantes" menuCelular={false}>
      <div className="mx-auto w-full max-w-[1120px] px-4 pt-2 pb-32 sm:px-6 lg:px-10 lg:pt-8 lg:pb-16">
        {/* cabeçalho */}
        <header className="flex items-center justify-between gap-3 border-b border-linha pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link href={`/livro/${livro.id}`} className="-ml-2 flex min-h-11 items-center gap-1 px-2 text-[13px] font-semibold text-bordo">
              <span aria-hidden>←</span> <span className="hidden sm:inline">voltar ao livro</span>
            </Link>
            <div className="min-w-0">
              <p className="flex items-baseline gap-2 font-revista text-[28px] leading-none text-ameixa lg:text-[36px]">
                marginalia.
                <svg aria-hidden width="14" height="20" viewBox="0 0 14 20" className="text-bordo">
                  <path d="M2 1h10v18l-5-4-5 4z" fill="currentColor" opacity=".85" />
                </svg>
              </p>
              <p className="mt-1 hidden text-[12px] text-cinza sm:block">O seu registro literário.</p>
            </div>
          </div>
          <p role="status" className={`text-right text-[12px] ${estado === "erro" ? "font-semibold text-bordo" : "text-cinza"}`}>
            <span aria-hidden className={`mr-1.5 inline-block size-1.5 rounded-full align-middle ${estado === "alterado" ? "bg-[var(--tema-acento,var(--color-ouro))]" : estado === "erro" ? "bg-bordo" : "bg-oliva"}`} />
            {textoEstado}
          </p>
        </header>

        <div className="mt-5 lg:mt-8 lg:grid lg:grid-cols-[minmax(0,30%)_minmax(0,1fr)] lg:gap-12">
          {/* ficha bibliográfica */}
          <aside aria-label="o livro" className="lg:sticky lg:top-8 lg:self-start">
            <div className="flex gap-4 lg:block lg:rounded-[6px] lg:border lg:border-linha lg:bg-papel lg:p-5">
              <CapaAuto livro={livro} className="w-[76px] flex-none lg:mx-auto lg:w-[160px] [&>span:last-child]:hidden" />
              <div className="min-w-0 lg:mt-4">
                <h1 className="font-revista text-[19px] leading-tight text-ameixa lg:text-[22px]">{livro.titulo}</h1>
                <p className="mt-0.5 text-[13px] text-tinta-suave">{livro.autor}</p>
                <p className="mt-1 text-[12px] text-cinza">{[livro.genero, livro.paginas ? `${livro.paginas} páginas` : null].filter(Boolean).join(" · ")}</p>
                <dl className="mt-3 hidden space-y-1.5 border-t border-dashed border-bege pt-3 text-[12px] lg:block">
                  <Linha r="contexto" v={contexto} />
                  <Linha r="período" v={r.soAno ? `em ${r.ano}` : r.inicio || r.fim ? `${r.inicio ? fmt(r.inicio) : "?"} → ${r.fim ? fmt(r.fim) : "…"}` : "sem datas"} />
                  {dias ? <Linha r="duração" v={`${dias === 1 ? "1 dia" : `${dias} dias`} de leitura`} /> : null}
                  <Linha r="formato" v={formatos.find((f) => f.id === r.formato)?.nome ?? "não informado"} />
                  <Linha r="ficha" v={temFicha ? "publicada" : "nova"} />
                </dl>
                <p className="mt-1 text-[11px] text-cinza lg:hidden">{contexto}</p>
                {concluida && (r.fim || r.soAno) ? (
                  <span className="mt-3 inline-block -rotate-2 rounded-[3px] border-[1.5px] border-bordo px-2 py-0.5 font-revista text-[13px] text-bordo italic">officially read.</span>
                ) : null}
              </div>
            </div>
          </aside>

          {/* os campos */}
          <div className="mt-6 min-w-0 max-w-[700px] divide-y divide-linha lg:mt-0 [&>section]:py-7 [&>section:first-child]:pt-0">
            {/* a leitura */}
            <section aria-labelledby="t-leitura">
              <h2 id="t-leitura" className={tituloSecao}>
                A leitura
              </h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={rotulo}>Data de início</span>
                  <input type="date" value={r.inicio} max={r.fim || hoje} disabled={r.soAno} onChange={(e) => mudar({ inicio: e.target.value })} className={`${campo} disabled:opacity-50`} />
                  <span className="mt-1 block text-[11px] text-cinza">se não lembrar, pode deixar em branco.</span>
                </label>
                <label className="block">
                  <span className={`${rotulo} !text-ameixa`}>{abandonou ? "Parei em" : "Data de conclusão"}</span>
                  {r.soAno && !abandonou ? (
                    <input type="number" inputMode="numeric" min={1900} max={Number(hoje.slice(0, 4))} value={r.ano} onChange={(e) => mudar({ ano: Number(e.target.value) || r.ano })} aria-label="ano em que terminou" className={campo} />
                  ) : (
                    <input type="date" value={r.fim} min={r.inicio || undefined} max={hoje} onChange={(e) => mudar({ fim: e.target.value })} className={`${campo} border-bordo/60`} />
                  )}
                  {!abandonou ? (
                    <label className="mt-1.5 flex min-h-9 cursor-pointer items-center gap-2 text-[12px] text-tinta-suave">
                      <input type="checkbox" checked={r.soAno} onChange={(e) => mudar({ soAno: e.target.checked, ano: Number((r.fim || hoje).slice(0, 4)) })} className="size-4 accent-bordo" />
                      só sei o ano
                    </label>
                  ) : null}
                </label>
              </div>
              {erros.datas ? (
                <p role="alert" className="mt-2 text-[13px] font-semibold text-bordo">
                  ⚠ {erros.datas}
                </p>
              ) : dias ? (
                <p className="mt-2 text-[13px] text-cinza">{dias === 1 ? "1 dia" : `${dias} dias`} de leitura.</p>
              ) : null}

              <div className="mt-5">
                <span className={rotulo} id="r-formato">
                  Formato de leitura
                </span>
                <div role="radiogroup" aria-labelledby="r-formato" className="flex flex-wrap gap-2">
                  {formatos.map((f) => {
                    const on = r.formato === f.id;
                    return (
                      <button key={f.id} type="button" role="radio" aria-checked={on} onClick={() => mudar({ formato: on ? undefined : f.id })} className={etiqueta(on)}>
                        <svg aria-hidden width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                          {f.icone.split(" M").map((p, i) => (
                            <path key={i} d={i ? `M${p}` : p} />
                          ))}
                        </svg>
                        {f.curto}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* avaliação geral */}
            <section aria-labelledby="t-avaliacao">
              <h2 id="t-avaliacao" className={tituloSecao}>
                Avaliação geral
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                <EstrelasEscolha valor={r.nota} onMudar={(n) => mudar({ nota: n })} rotulo="avaliação geral" />
                <p className="font-revista text-[22px] text-ameixa tabular-nums">
                  {r.nota ? (
                    <>
                      {notaTexto(r.nota)} <span className="text-[14px] text-cinza">/ 5</span>
                    </>
                  ) : notaGeral ? (
                    <span className="text-[14px] text-cinza">pela média dos aspectos: {notaTexto(notaGeral)} / 5</span>
                  ) : (
                    <span className="text-[14px] text-cinza">sem avaliação</span>
                  )}
                </p>
                {r.nota ? (
                  <button type="button" onClick={() => mudar({ nota: 0 })} className="min-h-9 text-[12px] text-cinza underline-offset-4 hover:underline">
                    limpar
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-[12px] text-cinza">toque na metade esquerda da estrela para meia estrela. no teclado, use as setas.</p>
              {erros.nota ? (
                <p role="alert" className="mt-2 text-[13px] font-semibold text-bordo">
                  ⚠ {erros.nota}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button type="button" aria-pressed={favorito} onClick={alternarFavorito} disabled={!favorito && favoritos.length >= 6} className={`${etiqueta(favorito)} disabled:opacity-50`}>
                  <span aria-hidden>{favorito ? "♥" : "♡"}</span>
                  {favorito ? "nos seus favoritos" : "Adicionar aos favoritos"}
                </button>
                {!favorito && favoritos.length >= 6 ? <span className="text-[12px] text-cinza">seus 6 favoritos estão completos.</span> : null}
              </div>

              <fieldset className="mt-5">
                <legend className={rotulo}>Veredito</legend>
                <div className="flex flex-wrap gap-2">
                  {reacoes.map((x) => {
                    const on = r.reacao === x.id;
                    return (
                      <button key={x.id} type="button" aria-pressed={on} onClick={() => mudar({ reacao: on ? undefined : x.id })} className={etiqueta(on)}>
                        <span aria-hidden style={{ color: x.cor }}>
                          {x.emoji}
                        </span>
                        {x.nome}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </section>

            {/* aspectos */}
            <Recolhivel id="t-aspectos" titulo="Aspectos da obra" resumo={contarAspectos(r)} aberta>
              <p className="text-[13px] text-cinza">Avalie individualmente os elementos da obra. o que não se aplica não conta na média.</p>
              <ul className="mt-3 border-t border-linha">
                {CRITERIOS.map((c) => {
                  const na = r.naoAplica.includes(c.id);
                  return (
                    <li key={c.id} className="grid grid-cols-[1fr_auto] items-center gap-x-3 border-b border-linha py-1 sm:grid-cols-[150px_1fr_auto]">
                      <span className="text-[14px] text-ameixa">
                        {c.nome}
                        <span className="hidden text-[11px] text-cinza sm:block">{c.dica}</span>
                      </span>
                      <span className={`order-3 col-span-2 sm:order-none sm:col-span-1 ${na ? "opacity-35" : ""}`}>
                        <EstrelasEscolha tamanho={20} valor={na ? 0 : (r.notas[c.id] ?? 0)} onMudar={(n) => mudar({ notas: { ...r.notas, [c.id]: n }, naoAplica: r.naoAplica.filter((x) => x !== c.id) })} rotulo={`nota para ${c.nome}`} />
                      </span>
                      <span className="flex items-center gap-2 text-[12px]">
                        {r.notas[c.id] && !na ? <span className="tabular-nums text-tinta-suave">{notaTexto(r.notas[c.id]!)}</span> : null}
                        <button
                          type="button"
                          aria-pressed={na}
                          onClick={() => {
                            const notas = { ...r.notas };
                            delete notas[c.id];
                            mudar({ naoAplica: na ? r.naoAplica.filter((x) => x !== c.id) : [...r.naoAplica, c.id], notas });
                          }}
                          className={`min-h-9 rounded-[4px] px-1.5 ${na ? "font-semibold text-bordo" : "text-cinza hover:text-ameixa"}`}
                        >
                          não se aplica
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
              {!r.nota && notaGeral ? <p className="mt-2 text-[12px] text-cinza">sem avaliação geral, a ficha usa a média dos aspectos ({notaTexto(notaGeral)}).</p> : null}
            </Recolhivel>

            {/* experiência */}
            <Recolhivel id="t-experiencia" titulo="Experiência de leitura" resumo={r.sensacoes.length ? r.sensacoes.slice(0, 3).join(", ") + (r.sensacoes.length > 3 ? "…" : "") : undefined}>
              <p className="text-[13px] text-cinza">Selecione os aspectos que melhor descrevem sua experiência com a obra.</p>
              <div className="mt-3 space-y-3">
                {SENSACOES.map((g) => (
                  <div key={g.id} className="sm:grid sm:grid-cols-[96px_1fr] sm:gap-3">
                    <p className="mb-1.5 pt-2 text-[12px] font-semibold text-tinta-suave sm:mb-0">{g.nome}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(todasSensacoes ? g.opcoes : g.opcoes.filter((o, i) => i < SENSACOES_VISIVEIS || r.sensacoes.includes(o))).map((o) => {
                        const on = r.sensacoes.includes(o);
                        return (
                          <button key={o} type="button" aria-pressed={on} onClick={() => mudar({ sensacoes: on ? r.sensacoes.filter((x) => x !== o) : [...r.sensacoes, o] })} className={etiqueta(on)}>
                            {on ? <span aria-hidden>✓</span> : null}
                            {o}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setTodasSensacoes((v) => !v)} className="mt-3 min-h-9 text-[12px] font-semibold text-bordo">
                {todasSensacoes ? "ver menos" : "ver todas as opções"}
              </button>
            </Recolhivel>

            {/* impressões */}
            <Recolhivel id="t-impressoes" titulo="Impressões pessoais" resumo={r.resenha.trim() ? `${r.resenha.trim().split(/\s+/).length} palavras` : undefined} aberta>
              <p className="text-[13px] text-cinza">Registre suas reflexões e opiniões sobre a obra.</p>
              <div className="mt-3 rounded-[6px] border border-linha bg-creme-quente focus-within:border-bordo">
                <textarea
                  ref={resenhaRef}
                  value={r.resenha}
                  onChange={(e) => mudar({ resenha: e.target.value })}
                  maxLength={8000}
                  placeholder="Escreva suas impressões sobre a obra..."
                  aria-label="impressões pessoais"
                  className="block min-h-[220px] w-full resize-none bg-transparent px-4 py-3.5 font-accent text-[16px] leading-[1.7] text-ameixa outline-none placeholder:text-cinza"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-linha px-3 py-1.5 text-[12px]">
                  <label className="flex min-h-9 cursor-pointer items-center gap-2 text-tinta-suave">
                    <input type="checkbox" checked={r.spoiler} onChange={(e) => mudar({ spoiler: e.target.checked })} className="size-4 accent-bordo" />
                    Contém spoilers
                  </label>
                  <span className="tabular-nums text-cinza">{r.resenha.length.toLocaleString("pt-BR")} / 8.000</span>
                </div>
              </div>
              <button type="button" aria-expanded={perguntas} onClick={() => setPerguntas((v) => !v)} className="mt-3 min-h-9 text-[13px] font-semibold text-bordo">
                {perguntas ? "fechar perguntas" : "Perguntas para reflexão"}
              </button>
              {perguntas ? (
                <ul className="mt-1 border-l-2 border-linha pl-3">
                  {PERGUNTAS_REFLEXAO.map((q) => (
                    <li key={q} className="flex items-start justify-between gap-3 py-1.5 text-[13px] text-tinta-suave">
                      <span>{q}</span>
                      <button
                        type="button"
                        onClick={() => {
                          mudar({ resenha: `${r.resenha.trimEnd()}${r.resenha.trim() ? "\n\n" : ""}${q}\n` });
                          setTimeout(() => {
                            const el = resenhaRef.current;
                            if (el) {
                              el.focus();
                              el.selectionStart = el.selectionEnd = el.value.length;
                            }
                          }, 0);
                        }}
                        className="min-h-9 flex-none text-[12px] font-semibold text-bordo"
                      >
                        usar
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              <label className="mt-4 block max-w-[360px]">
                <span className={rotulo}>Personagem favorita</span>
                <input value={r.personagem} onChange={(e) => mudar({ personagem: e.target.value })} maxLength={80} className={campo} />
              </label>
            </Recolhivel>

            {/* entre as páginas */}
            <Recolhivel id="t-paginas" titulo="Entre as páginas" resumo={r.trechos.filter((t) => t.texto.trim()).length ? `${r.trechos.filter((t) => t.texto.trim()).length} passagem(ns)` : undefined}>
              <p className="text-[13px] text-cinza">Passagens que você deseja preservar.</p>
              <div className="mt-3 space-y-3">
                {r.trechos.map((t, i) => {
                  const mudarTrecho = (d: Partial<Trecho>) => mudar({ trechos: r.trechos.map((x, k) => (k === i ? { ...x, ...d } : x)) });
                  return (
                    <div key={i} className="rounded-[6px] border-l-2 border-bordo bg-papel px-3 py-3">
                      <div className="flex gap-2">
                        <span aria-hidden className="font-revista text-[28px] leading-none text-bordo">“</span>
                        <textarea value={t.texto} onChange={(e) => mudarTrecho({ texto: e.target.value })} rows={2} maxLength={1000} placeholder="a passagem" aria-label={`passagem ${i + 1}`} className="min-h-[56px] w-full resize-y bg-transparent font-accent text-[15px] leading-[1.55] text-ameixa italic outline-none placeholder:text-cinza" />
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-[90px_1fr_1fr]">
                        <input type="number" inputMode="numeric" min={1} value={t.pagina ?? ""} onChange={(e) => mudarTrecho({ pagina: Number(e.target.value) || undefined })} placeholder="página" aria-label="página" className={`${campo} !h-9 text-[13px]`} />
                        <input value={t.capitulo ?? ""} onChange={(e) => mudarTrecho({ capitulo: e.target.value || undefined })} placeholder="capítulo" aria-label="capítulo" className={`${campo} !h-9 text-[13px]`} />
                        <input value={t.nota ?? ""} onChange={(e) => mudarTrecho({ nota: e.target.value || undefined })} placeholder="nota pessoal" aria-label="nota pessoal" className={`${campo} col-span-2 !h-9 text-[13px] sm:col-span-1`} />
                      </div>
                      <div className="mt-1.5 flex items-center justify-between text-[12px]">
                        <label className="flex min-h-9 cursor-pointer items-center gap-2 text-tinta-suave">
                          <input type="checkbox" checked={!!t.spoiler} onChange={(e) => mudarTrecho({ spoiler: e.target.checked || undefined })} className="size-4 accent-bordo" />
                          spoiler
                        </label>
                        <button type="button" onClick={() => mudar({ trechos: r.trechos.filter((_, k) => k !== i) })} className="min-h-9 text-cinza hover:text-bordo">
                          remover da ficha
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5">
                <button type="button" onClick={() => mudar({ trechos: [...r.trechos, { texto: "", naFicha: true }] })} className="min-h-10 text-[13px] font-semibold text-bordo">
                  + Adicionar citação
                </button>
                {anotacoesFora.length ? (
                  <button type="button" aria-expanded={importar} onClick={() => setImportar((v) => !v)} className="min-h-10 text-[13px] font-semibold text-bordo">
                    importar das anotações ({anotacoesFora.length})
                  </button>
                ) : null}
              </div>
              {importar && anotacoesFora.length ? (
                <ul className="mt-2 divide-y divide-linha border-y border-linha">
                  {anotacoesFora.map((t, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 py-2 text-[13px]">
                      <span className="font-accent text-ameixa italic">“{t.texto.length > 180 ? `${t.texto.slice(0, 180)}…` : t.texto}”</span>
                      <button type="button" onClick={() => mudar({ trechos: [...r.trechos, { ...t, naFicha: true }] })} className="min-h-9 flex-none text-[12px] font-semibold text-bordo">
                        adicionar
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Recolhivel>

            {/* considerações finais */}
            <Recolhivel id="t-finais" titulo="Considerações finais" resumo={[r.recomendaria && "recomendação", r.releria && "releitura"].filter(Boolean).join(" · ") || undefined}>
              <Segmento rotulo="Recomendaria esta obra?" opcoes={RECOMENDARIA} valor={r.recomendaria} onMudar={(v) => mudar({ recomendaria: v })} />
              <div className="mt-4">
                <Segmento rotulo="Consideraria uma releitura?" opcoes={RELERIA} valor={r.releria} onMudar={(v) => mudar({ releria: v })} />
              </div>
            </Recolhivel>

            {/* visibilidade */}
            <section aria-labelledby="t-visivel">
              <h2 id="t-visivel" className={tituloSecao}>
                Visibilidade
              </h2>
              <p className="mt-2 text-[13px] text-tinta-suave">
                Quem poderá visualizar esta ficha: ela aparece no seu perfil e na página do livro. a atividade no feed segue a sua escolha em{" "}
                <Link href="/perfil/editar?aba=privacidade" className="font-semibold text-bordo underline-offset-4 hover:underline">
                  privacidade
                </Link>
                . o rascunho fica só neste aparelho até você salvar.
              </p>
              {temFicha ? (
                <button type="button" onClick={excluir} className="mt-3 min-h-10 text-[12px] font-semibold text-cinza underline underline-offset-4 hover:text-bordo">
                  excluir ficha
                </button>
              ) : null}
            </section>
          </div>
        </div>
      </div>

      {/* ações */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-creme/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1120px] items-center gap-2 px-4 py-2.5 sm:px-6 lg:px-10">
          <button type="button" onClick={() => setPrevia(true)} className="h-10 rounded-[6px] border border-bege px-3.5 text-[13px] font-semibold text-ameixa">
            Pré-visualizar
          </button>
          {estado === "rascunho" ? (
            <button type="button" onClick={descartarRascunho} className="hidden h-10 px-2 text-[12px] text-cinza underline-offset-4 hover:underline sm:block">
              descartar rascunho
            </button>
          ) : (
            <button type="button" onClick={salvarRascunho} disabled={estado !== "alterado"} className="hidden h-10 px-2 text-[13px] font-semibold text-tinta-suave disabled:opacity-40 sm:block">
              Salvar rascunho
            </button>
          )}
          <button type="button" onClick={publicar} className="ml-auto h-10 rounded-[6px] bg-bordo px-5 text-[14px] font-semibold text-creme hover:bg-bordo-suave">
            {temFicha ? "Salvar alterações" : "Publicar ficha"}
          </button>
        </div>
      </div>

      {previa ? (
        <div role="dialog" aria-modal="true" aria-label="pré-visualização da ficha" className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 sm:items-center" onClick={() => setPrevia(false)}>
          <div className="max-h-[92dvh] w-full max-w-[560px] overflow-y-auto rounded-t-[10px] bg-creme p-4 sm:rounded-[10px]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[12px] font-semibold tracking-[.14em] text-cinza uppercase">como a ficha fica publicada</p>
              <button type="button" onClick={() => setPrevia(false)} className="min-h-11 px-2 text-[13px] font-semibold text-bordo">
                fechar
              </button>
            </div>
            <FichaPublicada d={dados} />
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

const fmt = (dia: string) => new Date(`${dia}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");

function contarAspectos(r: Rascunho) {
  const n = CRITERIOS.filter((c) => r.notas[c.id] && !r.naoAplica.includes(c.id)).length;
  return n ? `${n} de ${CRITERIOS.length} avaliados` : undefined;
}

function Linha({ r, v }: { r: string; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-cinza">{r}</dt>
      <dd className="text-right text-ameixa">{v}</dd>
    </div>
  );
}

/** seção aberta no computador e recolhível no celular, com um resumo quando já tem respostas */
function Recolhivel({ id, titulo, resumo, aberta, children }: { id: string; titulo: string; resumo?: string; aberta?: boolean; children: ReactNode }) {
  const [aberto, setAberto] = useState(!!aberta);
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className="m-0">
        <button type="button" aria-expanded={aberto} onClick={() => setAberto((v) => !v)} className="flex w-full items-baseline justify-between gap-3 text-left lg:pointer-events-none">
          <span className={tituloSecao}>{titulo}</span>
          <span className="flex items-center gap-2 text-[12px] text-cinza">
            {resumo ? <span className="truncate">{resumo}</span> : null}
            <span aria-hidden className={`transition-transform lg:hidden ${aberto ? "rotate-180" : ""}`}>
              ⌄
            </span>
          </span>
        </button>
      </h2>
      <div className={`mt-3 ${aberto ? "" : "hidden lg:block"}`}>{children}</div>
    </section>
  );
}

function Segmento<T extends string>({ rotulo: r, opcoes, valor, onMudar }: { rotulo: string; opcoes: { id: T; nome: string }[]; valor?: T; onMudar: (v: T | undefined) => void }) {
  return (
    <fieldset>
      <legend className={rotulo}>{r}</legend>
      <div className="inline-flex rounded-[6px] border border-linha p-0.5">
        {opcoes.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={valor === o.id}
            onClick={() => onMudar(valor === o.id ? undefined : o.id)}
            className={`min-h-10 rounded-[4px] px-3.5 text-[13px] ${valor === o.id ? "bg-bordo font-semibold text-creme" : "text-tinta-suave hover:text-ameixa"}`}
          >
            {o.nome}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function AvaliarPage() {
  const { id } = useParams<{ id: string }>();
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  if (!hidratado) return <AppShell aba="estantes">{null}</AppShell>;
  const livro = infoDoLivro(id, livros, livroLembrado(id));
  if (!livro) notFound();
  return <Marginalia livro={livro} />;
}
