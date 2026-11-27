"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { ComConta } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { Voltar } from "@/components/Voltar";
import { CartaoConvite, botaoPrincipal, botaoSecundario, botaoTexto } from "@/components/coread/Convite";
import { COR, ESTILOS, MarcadorLeitora, Marcadores, Wordmark, CORES_LEITORAS, type Estilo } from "@/components/coread/Marca";
import type { Coread } from "@/components/coread/calculos";
import { useBuscaLivros, type LivroBusca } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { criarLeituraJunta, type LivroJunto } from "@/lib/lerjunto";
import { usePerfil } from "@/lib/perfil-store";
import { idsQueSigo, nomeDe, pessoasPorId, useConsulta, useMeuId, type PessoaResumo } from "@/lib/social";

const ETAPAS = ["livro", "companhia", "combinados", "personalizar", "revisar"] as const;
const hoje = () => new Date().toISOString().slice(0, 10);

/** criar um co-read em poucas etapas: livro, companhia, combinados, cores e revisão */
function Criador() {
  const router = useRouter();
  const params = useSearchParams();
  const eu = useMeuId();
  const livros = usePerfil((s) => s.livros);
  const nomeMeu = usePerfil((s) => s.nome);
  const [etapa, setEtapa] = useState(0);

  // 1 · livro
  const inicial = livros.find((l) => l.id === params.get("livro"));
  const [livro, setLivro] = useState<LivroJunto | null>(
    inicial ? { id: inicial.id, titulo: inicial.titulo, autor: inicial.autor, capa: inicial.capa, paginas: inicial.paginas } : null,
  );
  const [fonte, setFonte] = useState<"lendo" | "quero" | "todos" | "buscar">(livros.some((l) => l.status === "lendo") ? "lendo" : "quero");
  const [busca, setBusca] = useState("");
  const { estado, resultados } = useBuscaLivros(fonte === "buscar" ? busca : "");
  const daBiblioteca = useMemo(
    () =>
      livros.filter((l) =>
        fonte === "lendo" ? l.status === "lendo" || l.status === "pausado" : fonte === "quero" ? l.status === "quero" : fonte === "todos",
      ),
    [livros, fonte],
  );
  const [paginas, setPaginas] = useState("");

  // 2 · companhia
  const sigo = useConsulta(async () => {
    const ids = [...(await idsQueSigo())];
    const pessoas = await pessoasPorId(ids);
    return ids.map((id) => pessoas.get(id)).filter((p): p is PessoaResumo => !!p);
  }, []);
  const [amigas, setAmigas] = useState<string[]>([]);
  const [filtro, setFiltro] = useState("");

  // 3 · combinados
  const [inicio, setInicio] = useState(hoje());
  const [comPrazo, setComPrazo] = useState(false);
  const [prazo, setPrazo] = useState("");
  const [semSpoiler, setSemSpoiler] = useState(true);

  // 4 · personalizar
  const [estilo, setEstilo] = useState<Estilo>("rosa");
  const [nome, setNome] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const totalPaginas = livro?.paginas ?? (Number(paginas) > 0 ? Math.round(Number(paginas)) : undefined);
  const podeAvancar =
    etapa === 0 ? !!livro : etapa === 2 ? !comPrazo || (!!prazo && prazo >= inicio) : true;

  const escolhidas = (sigo.dados ?? []).filter((p) => amigas.includes(p.id));
  const previa: Coread = {
    id: "previa",
    livro: livro ? { ...livro, paginas: totalPaginas } : { id: "x", titulo: "", autor: "" },
    prazo: comPrazo ? prazo || null : null,
    inicio,
    nome: nome.trim() || null,
    estilo,
    codigo: null,
    criado_por: eu ?? "",
    criado_em: new Date().toISOString(),
    pessoas: [],
  };

  async function criar() {
    if (!livro) return;
    setEnviando(true);
    setErro(null);
    try {
      const id = await criarLeituraJunta(
        { ...livro, paginas: totalPaginas },
        { prazo: comPrazo ? prazo || null : null, inicio, nome, estilo, sem_spoiler: semSpoiler },
        amigas,
      );
      router.push(`/co-read/${id}`);
    } catch (x) {
      const e = x as { code?: string };
      setErro(
        e?.code === "42P01" || e?.code === "PGRST205"
          ? "o banco ainda não tem a leitura compartilhada: rode o arquivo supabase/atualizacao-2026-11-coread.sql no SQL Editor do Supabase."
          : "não deu para começar agora. tente de novo.",
      );
      setEnviando(false);
    }
  }

  const rotulo = "mb-2 block font-mono text-[10px] tracking-[.16em] text-bordo uppercase";
  const chip = (on: boolean) =>
    `inline-flex h-10 flex-none items-center rounded-pill border px-4 text-[13px] font-semibold ${on ? "border-bordo bg-bordo text-creme" : "border-linha text-ameixa hover:border-bordo"}`;

  function escolher(l: { id: string; titulo: string; autor: string; capa?: string; paginas?: number }) {
    setLivro({ id: l.id, titulo: l.titulo, autor: l.autor, capa: l.capa, paginas: l.paginas });
  }

  return (
    <div>
      {/* etapas */}
      <ol className="mb-7 flex gap-1.5" aria-label="etapas">
        {ETAPAS.map((n, i) => (
          <li key={n} className="min-w-0 flex-1">
            <button
              type="button"
              disabled={i > etapa && !(i === etapa + 1 && podeAvancar)}
              onClick={() => setEtapa(i)}
              aria-current={i === etapa ? "step" : undefined}
              className="block w-full text-left disabled:cursor-default"
            >
              <span className="block h-[3px] rounded-full" style={{ background: i <= etapa ? COR.vinho : "var(--color-linha)" }} />
              <span className={`mt-1.5 hidden truncate text-[11px] sm:block ${i === etapa ? "font-semibold text-bordo" : "text-cinza"}`}>
                {i + 1}. {n}
              </span>
            </button>
          </li>
        ))}
      </ol>

      {etapa === 0 ? (
        <section aria-labelledby="t-livro">
          <h2 id="t-livro" className="font-revista text-[26px] text-bordo italic">
            escolha um livro
          </h2>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {(
              [
                ["lendo", "lendo agora"],
                ["quero", "quero ler"],
                ["todos", "minha biblioteca"],
                ["buscar", "buscar"],
              ] as const
            ).map(([id, n]) => (
              <button key={id} type="button" aria-pressed={fonte === id} onClick={() => setFonte(id)} className={chip(fonte === id)}>
                {n}
              </button>
            ))}
          </div>
          {fonte === "buscar" ? (
            <input
              autoFocus
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="título ou autoria"
              aria-label="buscar livro"
              className="mt-4 h-12 w-full rounded-[4px] border border-linha bg-transparent px-4 text-[15px] outline-none focus:border-bordo"
            />
          ) : null}
          <ul className="mt-5 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-5 lg:grid-cols-6">
            {(fonte === "buscar" ? (busca.trim().length >= 2 ? resultados : []) : daBiblioteca).slice(0, 24).map((l) => {
              const on = livro?.id === l.id;
              const capa = (l as LivroBusca).capa ?? (l as { capa?: string }).capa;
              return (
                <li key={l.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => escolher({ id: l.id, titulo: l.titulo, autor: l.autor, capa, paginas: l.paginas })}
                    className="block w-full text-left"
                  >
                    <CapaLivro
                      titulo={l.titulo}
                      capa={capa}
                      cor={corDoLivro(l.id)}
                      className={`w-full [&>span:last-child]:text-[9px] ${on ? "ring-2 ring-bordo ring-offset-2 ring-offset-creme" : ""}`}
                    />
                    <span className="mt-1.5 line-clamp-2 block text-[12px] leading-tight font-semibold text-ameixa">{l.titulo}</span>
                    <span className="block truncate text-[11px] text-cinza">{l.autor}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {fonte === "buscar" && estado === "carregando" ? <p className="mt-3 font-accent text-sm text-cinza italic">procurando…</p> : null}
          {fonte !== "buscar" && !daBiblioteca.length ? (
            <p className="mt-3 font-accent text-sm text-cinza italic">nada por aqui ainda. tente buscar pelo título.</p>
          ) : null}
          {livro && !livro.paginas ? (
            <label className="mt-6 block max-w-[300px]">
              <span className={rotulo}>quantas páginas tem a edição que vocês vão usar?</span>
              <input
                inputMode="numeric"
                value={paginas}
                onChange={(e) => setPaginas(e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="ex.: 320"
                className="h-12 w-full rounded-[4px] border border-linha bg-transparent px-4 text-[15px] outline-none focus:border-bordo"
              />
              <span className="mt-1 block text-[12px] text-cinza">é a referência do progresso de todo mundo. dá para preencher depois.</span>
            </label>
          ) : null}
        </section>
      ) : null}

      {etapa === 1 ? (
        <section aria-labelledby="t-companhia">
          <h2 id="t-companhia" className="font-revista text-[26px] text-bordo italic">
            convide sua companhia
          </h2>
          <p className="mt-1 text-[14px] text-tinta-suave">
            quem você segue recebe um convite e escolhe se quer entrar. depois de começar, também dá para chamar qualquer pessoa pelo link.
          </p>
          {escolhidas.length ? (
            <p className="mt-4 flex items-center gap-1.5 text-[13px] text-ameixa">
              {escolhidas.slice(0, 8).map((p) => (
                <Avatar key={p.id} pessoa={p} tamanho={26} />
              ))}
              <span className="ml-1">
                {escolhidas.length} {escolhidas.length === 1 ? "pessoa convidada" : "pessoas convidadas"}
              </span>
            </p>
          ) : null}
          {(sigo.dados?.length ?? 0) > 8 ? (
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="procurar entre quem você segue"
              className="mt-4 h-11 w-full max-w-[360px] rounded-[4px] border border-linha bg-transparent px-4 text-[14px] outline-none focus:border-bordo"
            />
          ) : null}
          {sigo.dados?.length ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {sigo.dados
                .filter((p) => !filtro || nomeDe(p).toLowerCase().includes(filtro.toLowerCase()))
                .map((p) => {
                  const on = amigas.includes(p.id);
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => setAmigas((a) => (on ? a.filter((x) => x !== p.id) : [...a, p.id]))}
                        className={`flex h-11 items-center gap-2 rounded-pill border py-1 pr-4 pl-1 text-[13px] font-semibold ${on ? "border-bordo bg-bordo text-creme" : "border-linha text-ameixa hover:border-bordo"}`}
                      >
                        <Avatar pessoa={p} tamanho={32} />
                        {nomeDe(p)}
                      </button>
                    </li>
                  );
                })}
            </ul>
          ) : (
            <p className="mt-4 font-accent text-sm text-cinza italic">
              {sigo.carregando ? "procurando quem você segue…" : "você ainda não segue ninguém. sem problema: depois de começar, mande o link do convite."}
            </p>
          )}
        </section>
      ) : null}

      {etapa === 2 ? (
        <section aria-labelledby="t-combinados" className="space-y-6">
          <div>
            <h2 id="t-combinados" className="font-revista text-[26px] text-bordo italic">
              combinados da leitura
            </h2>
            <p className="mt-1 text-[14px] text-tinta-suave">tudo opcional. cada pessoa lê no seu ritmo.</p>
          </div>
          <label className="block max-w-[260px]">
            <span className={rotulo}>começa em</span>
            <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} className="h-12 w-full rounded-[4px] border border-linha bg-transparent px-4 text-[15px] outline-none focus:border-bordo" />
          </label>
          <fieldset>
            <legend className={rotulo}>ritmo</legend>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={!comPrazo} onClick={() => setComPrazo(false)} className={chip(!comPrazo)}>
                ritmo livre
              </button>
              <button type="button" aria-pressed={comPrazo} onClick={() => setComPrazo(true)} className={chip(comPrazo)}>
                com prazo
              </button>
            </div>
            {comPrazo ? (
              <label className="mt-3 block max-w-[260px]">
                <span className="sr-only">terminar até</span>
                <input
                  type="date"
                  min={inicio}
                  value={prazo}
                  onChange={(e) => setPrazo(e.target.value)}
                  className="h-12 w-full rounded-[4px] border border-linha bg-transparent px-4 text-[15px] outline-none focus:border-bordo"
                />
                {prazo && prazo < inicio ? <span className="mt-1 block text-[12px] text-bordo">o prazo precisa ser depois do início.</span> : null}
              </label>
            ) : null}
          </fieldset>
          <label className="flex max-w-[520px] items-start gap-3">
            <input type="checkbox" checked={semSpoiler} onChange={(e) => setSemSpoiler(e.target.checked)} className="mt-1 size-4 accent-bordo" />
            <span>
              <span className="block text-[14px] font-semibold text-ameixa">conversa sem spoiler</span>
              <span className="block text-[13px] text-tinta-suave">
                cada mensagem fica presa à página em que foi escrita e só chega para quem já passou dela.
              </span>
            </span>
          </label>
        </section>
      ) : null}

      {etapa === 3 ? (
        <section aria-labelledby="t-personalizar" className="space-y-6">
          <h2 id="t-personalizar" className="font-revista text-[26px] text-bordo italic">
            personalize
          </h2>
          <fieldset>
            <legend className={rotulo}>cores</legend>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(ESTILOS) as Estilo[]).map((k) => {
                const e = ESTILOS[k];
                const on = estilo === k;
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setEstilo(k)}
                    className={`flex items-center gap-2.5 rounded-[4px] border py-2 pr-3.5 pl-2 text-[13px] ${on ? "border-bordo text-bordo" : "border-linha text-ameixa"}`}
                  >
                    <span className="flex size-8 items-center justify-center rounded-[3px]" style={{ background: e.fundo }}>
                      <Marcadores tamanho={30} cores={[e.tinta, e.destaque]} linha={false} />
                    </span>
                    {e.nome}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="block max-w-[420px]">
            <span className={rotulo}>nome da leitura (opcional)</span>
            <input
              value={nome}
              maxLength={60}
              onChange={(e) => setNome(e.target.value)}
              placeholder="ex.: leitura de verão"
              className="h-12 w-full rounded-[4px] border border-linha bg-transparent px-4 text-[15px] outline-none focus:border-bordo"
            />
          </label>
          <div>
            <span className={rotulo}>marcadores</span>
            <p className="flex flex-wrap items-center gap-3 text-[13px] text-tinta-suave">
              {["você", ...escolhidas.map((p) => nomeDe(p))].slice(0, 8).map((n, i) => (
                <span key={i} className="inline-flex items-center gap-1.5">
                  <MarcadorLeitora cor={CORES_LEITORAS[i % CORES_LEITORAS.length]} tamanho={16} />
                  {n}
                </span>
              ))}
            </p>
            <p className="mt-1 text-[12px] text-cinza">cada pessoa ganha uma cor de marcador pela ordem em que entra.</p>
          </div>
        </section>
      ) : null}

      {etapa === 4 && livro ? (
        <section aria-labelledby="t-revisar" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <h2 id="t-revisar" className="font-revista text-[26px] text-bordo italic">
              revise
            </h2>
            <dl className="mt-4 divide-y divide-linha border-y border-linha text-[14px]">
              {[
                ["livro", `${livro.titulo} · ${livro.autor}${totalPaginas ? ` · ${totalPaginas} páginas` : ""}`],
                ["convidadas", escolhidas.length ? escolhidas.map((p) => nomeDe(p)).join(", ") : "ninguém por enquanto (mande o link depois)"],
                ["período", `${new Date(`${inicio}T12:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })} · ${comPrazo && prazo ? `até ${new Date(`${prazo}T12:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}` : "ritmo livre"}`],
                ["conversa", semSpoiler ? "sem spoiler" : "aberta"],
                ["cores", ESTILOS[estilo].nome],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-4 py-2.5">
                  <dt className="w-[96px] flex-none font-mono text-[10px] tracking-[.14em] text-cinza uppercase">{k}</dt>
                  <dd className="min-w-0 text-ameixa">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[13px] text-tinta-suave">
              o co-read começa agora para você. quem foi convidada entra quando aceitar o convite.
            </p>
          </div>
          <div>
            <span className={rotulo}>como o convite vai chegar</span>
            <CartaoConvite l={previa} deQuem={{ id: eu ?? "", nome: nomeMeu || "você", usuario: null, foto: null }} />
          </div>
        </section>
      ) : null}

      {erro ? (
        <p role="alert" className="mt-5 text-[13px] text-bordo">
          {erro}
        </p>
      ) : null}

      <div className="mt-9 flex flex-wrap items-center gap-3 border-t border-linha pt-5">
        {etapa > 0 ? (
          <button type="button" onClick={() => setEtapa((e) => e - 1)} className={botaoTexto}>
            ← voltar
          </button>
        ) : null}
        <span className="ml-auto" />
        {etapa === 1 && !amigas.length ? (
          <button type="button" onClick={() => setEtapa(2)} className={botaoSecundario}>
            pular por enquanto
          </button>
        ) : null}
        {etapa < ETAPAS.length - 1 ? (
          <button type="button" disabled={!podeAvancar} onClick={() => setEtapa((e) => e + 1)} className={botaoPrincipal}>
            próximo
          </button>
        ) : (
          <button type="button" disabled={!livro || enviando} onClick={criar} className={botaoPrincipal}>
            {enviando ? "começando…" : "começar leitura compartilhada"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function NovoCoreadPage() {
  return (
    <AppShell aba="clubes">
      <div className="flex flex-1 flex-col px-5 pt-2 pb-10 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="w-full max-w-[900px]">
          <Voltar padrao="/co-read" rotulo="leituras compartilhadas" className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo" />
          <header className="mt-1 mb-6 flex items-end justify-between gap-4">
            <div>
              <Wordmark tamanho={34} />
              <p className="mt-2 font-revista text-[16px] text-ameixa italic">nova leitura compartilhada</p>
            </div>
            <Marcadores tamanho={64} className="hidden sm:block" />
          </header>
          <ComConta>
            <Suspense fallback={null}>
              <Criador />
            </Suspense>
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
