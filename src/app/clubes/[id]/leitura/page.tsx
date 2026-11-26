"use client";

import { CapaAuto } from "@/components/CapaAuto";
import { Animacao } from "@/components/Animacao";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { usePerfil } from "@/lib/perfil-store";
import { useClube } from "@/components/clube/ClubeContexto";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import {
  andamento,
  andamentoDasMembros,
  criterios,
  encerrarLeitura,
  encontrosDe,
  fichasComAntigas,
  fichasDe,
  livrosDoClube,
  marcarMarca,
  marcarProgresso,
  progressoDe,
  type AndamentoMembro,
  type Criterio,
  type Encontro,
  type Ficha,
  type LivroDoClube,
  type Membro,
  type Progresso,
  type StatusLeitura,
  type UnidadeMarca,
  organiza,
  quemTrouxe,
} from "@/lib/clubes";
import { nomeDe, useConsulta, useMeuId } from "@/lib/social";

/*
 * A leitura atual do clube. Tudo aqui usa os tokens do clube (--club-* e os
 * tokens do app redefinidos pelo club studio): nada de cor fixa.
 */

const NOME_CRITERIO: Record<Criterio, string> = { personagens: "personagens", plot: "enredo", escrita: "escrita", final: "final" };
const CORES_LEITORES = [
  "var(--club-chart-1)",
  "var(--club-chart-2)",
  "var(--club-chart-3)",
  "color-mix(in srgb, var(--club-chart-1) 55%, var(--club-bg))",
  "color-mix(in srgb, var(--club-chart-2) 60%, var(--club-text))",
  "color-mix(in srgb, var(--club-chart-3) 60%, var(--club-text))",
];

const tituloEditorial = "font-revista text-[22px] leading-none text-bordo italic lg:text-[24px]";
const linhaTitulo = "mb-4 flex items-baseline justify-between gap-3 border-b border-linha pb-2 lg:border-fio";
const cartao = "border border-linha bg-papel p-5 lg:border-fio";
const raio = { borderRadius: "var(--club-card-radius)" };
const botaoPrincipal = "inline-flex min-h-11 items-center rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme hover:bg-bordo-suave";
const botaoSecundario = "inline-flex min-h-11 items-center rounded-pill border border-bordo/40 px-4 text-[13px] font-semibold text-bordo hover:border-bordo";
const linkPequeno = "inline-flex min-h-10 items-center text-[13px] font-semibold text-bordo hover:underline";

const media = (xs: (number | null | undefined)[]) => {
  const v = xs.filter((x): x is number => typeof x === "number" && x > 0);
  return v.length ? v.reduce((t, x) => t + x, 0) / v.length : null;
};
const virgula = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const dataLonga = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00` : iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
const vol = (n: number | null) => (n ? `VOL. ${String(n).padStart(2, "0")}` : null);

function Estrelas({ n, tamanho = 14 }: { n: number; tamanho?: number }) {
  return (
    <span className="inline-flex gap-px text-bordo" aria-label={`${virgula(n)} de 5`} style={{ fontSize: tamanho }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} aria-hidden style={{ opacity: n >= i ? 1 : n >= i - 0.5 ? 0.55 : 0.2 }}>
          ★
        </span>
      ))}
    </span>
  );
}

function Barra({ pct, cor = "var(--club-progress-fill)", alta = 5 }: { pct: number; cor?: string; alta?: number }) {
  return (
    <span className="block rounded-full" style={{ height: alta, background: "var(--club-progress-track)" }} aria-hidden>
      <span className="block h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: cor }} />
    </span>
  );
}

type Fase = "antes" | "durante" | "conclui" | "todos";

export default function LeituraPage() {
  const { clube, membros, papel } = useClube();
  const eu = useMeuId();
  const consulta = useConsulta(async () => {
    const livros = await livrosDoClube(clube.id);
    const lendo = livros.find((l) => l.estado === "lendo") ?? null;
    const [fichas, progresso, encontros] = lendo
      ? await Promise.all([fichasDe(lendo.id), progressoDe(lendo.id), encontrosDe(clube.id).catch(() => [] as Encontro[])])
      : [[] as Ficha[], [] as Progresso[], [] as Encontro[]];
    const turma = lendo ? await andamentoDasMembros(lendo, membros, fichas).catch(() => new Map<string, AndamentoMembro>()) : new Map<string, AndamentoMembro>();
    return { livros, lendo, fichas, progresso, encontros, turma };
  }, [clube.id, membros.length]);

  if (consulta.carregando && !consulta.dados) return <Animacao tipo="marcador" titulo="carregando a leitura atual" sub="o progresso de cada leitor" />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { livros, lendo, fichas, progresso, encontros, turma } = consulta.dados!;
  const moderadora = organiza(papel);

  if (!lendo) {
    const sugestoes = livros.filter((l) => l.estado === "sugerido");
    return (
      <div className="px-5 pt-6 lg:max-w-[640px] lg:px-0">
        <h2 className="font-revista text-[28px] text-bordo italic">ready for the next chapter?</h2>
        {moderadora ? (
          <Vazio
            className="mt-5"
            titulo="definam o próximo livro do clube"
            texto={sugestoes.length ? `escolha um dos ${sugestoes.length} ${sugestoes.length === 1 ? "livro sugerido" : "livros sugeridos"}, faça um sorteio ou busque qualquer livro.` : "busque qualquer livro e defina o prazo. não é preciso ter sugestões antes."}
            acao={{ href: `/clubes/${clube.id}/escolher`, rotulo: "definir próxima leitura" }}
          />
        ) : (
          <Vazio
            className="mt-5"
            titulo="o que vamos ler depois?"
            texto="vote nos livros sugeridos. quem organiza define a próxima leitura entre os mais votados ou por sorteio."
            acao={{ href: `/clubes/${clube.id}/sugestoes`, rotulo: "votar nos sugeridos" }}
          />
        )}
      </div>
    );
  }

  return <Leitura lendo={lendo} fichasReais={fichas} progresso={progresso} encontros={encontros} turma={turma} membros={membros} eu={eu} moderadora={moderadora} clubeId={clube.id} recarregar={consulta.recarregar} />;
}

function Leitura({
  lendo,
  fichasReais,
  progresso,
  encontros,
  turma,
  membros,
  eu,
  moderadora,
  clubeId,
  recarregar,
}: {
  lendo: LivroDoClube;
  fichasReais: Ficha[];
  progresso: Progresso[];
  encontros: Encontro[];
  turma: Map<string, AndamentoMembro>;
  membros: Membro[];
  eu: string | null;
  moderadora: boolean;
  clubeId: string;
  recarregar: () => void;
}) {
  const router = useRouter();
  const meusLivros = usePerfil((s) => s.livros);
  const and = andamento(lendo);
  const fichas = fichasComAntigas(lendo, fichasReais, membros);
  const minha = fichasReais.find((f) => f.autor === eu);

  // o que a pessoa marcou manda; sem marcador, quem já publicou a ficha conta como concluída
  const statusDe = (u: string): StatusLeitura => progresso.find((p) => p.usuario_id === u)?.status ?? (fichas.some((f) => f.autor === u) ? "terminei" : "nao_comecei");
  const meuStatus = statusDe(eu ?? "");
  const concluiram = membros.filter((m) => statusDe(m.usuario_id) === "terminei");
  const pessoal = meusLivros.find((l) => l.id === lendo.livro.id || l.titulo.toLowerCase() === lendo.livro.titulo.toLowerCase());
  const agora = Date.now();
  const fase: Fase =
    and && agora < and.inicio.getTime() ? "antes" : membros.length && concluiram.length === membros.length ? "todos" : meuStatus === "terminei" ? "conclui" : "durante";
  const corDe = new Map(membros.map((m, i) => [m.usuario_id, CORES_LEITORES[i % CORES_LEITORES.length]]));
  const proximo = encontros.filter((e) => +new Date(e.quando) >= agora - 3 * 3600e3).sort((a, b) => a.quando.localeCompare(b.quando))[0] ?? null;

  const partes: Record<string, ReactNode> = {
    minha: (
      <MinhaLeitura
        key="minha"
        lendo={lendo}
        status={meuStatus}
        progresso={progresso.find((p) => p.usuario_id === eu)}
        pessoal={pessoal}
        and={and}
        cor={corDe.get(eu ?? "") ?? "var(--club-progress-fill)"}
        compacta={fase === "conclui" || fase === "todos"}
        recarregar={recarregar}
      />
    ),
    notas: <ReadingNotes key="notas" lendo={lendo} clubeId={clubeId} minha={minha} fichas={fichas} eu={eu} membros={membros} status={meuStatus} />,
    veredito: <FinalVerdict key="veredito" fichas={fichas} />,
    opinioes: <DifferentOpinions key="opinioes" fichas={fichas} membros={membros} eu={eu} corDe={corDe} />,
  };
  const ordem =
    fase === "todos" ? ["veredito", "opinioes", "notas", "minha"] : fase === "conclui" ? ["notas", "veredito", "opinioes", "minha"] : ["minha", "notas", "veredito", "opinioes"];

  return (
    <div className="px-5 pt-6 pb-4 lg:grid lg:grid-cols-[minmax(0,65fr)_minmax(0,35fr)] lg:gap-12 lg:px-0">
      <div className="min-w-0 space-y-10">
        <CurrentRead lendo={lendo} membros={membros} eu={eu} and={and} fase={fase} minha={!!minha} status={meuStatus} clubeId={clubeId} pessoalId={pessoal?.id} moderadora={moderadora} />
        {ordem.map((k) => partes[k])}
      </div>

      <aside className="mt-10 min-w-0 space-y-10 lg:mt-0">
        <CadaUm membros={membros} eu={eu} statusDe={statusDe} turma={turma} progresso={progresso} corDe={corDe} />
        <BookDate encontro={proximo} clubeId={clubeId} />
        <Pendentes membros={membros} fichas={fichas} eu={eu} statusDe={statusDe} clubeId={clubeId} lendoId={lendo.id} />
        {moderadora ? (
          <section aria-label="organizar a leitura" className="space-y-1 border-t border-linha pt-5 text-[13px] lg:border-fio">
            <p className="mb-2 font-mono text-[10px] tracking-[.14em] text-cinza uppercase">para quem organiza</p>
            <Link href={`/clubes/${clubeId}/escolher`} className="flex min-h-10 items-center font-semibold text-bordo hover:underline">
              trocar a leitura atual
            </Link>
            <button
              type="button"
              onClick={async () => {
                if (!confirm(`encerrar a leitura de ${lendo.livro.titulo}? o livro vai para os livros lidos do clube.`)) return;
                await encerrarLeitura(lendo.id);
                router.push(`/clubes/${clubeId}/concluido/${lendo.id}`);
              }}
              className="flex min-h-10 items-center text-cinza hover:text-bordo"
            >
              encerrar leitura
            </button>
          </section>
        ) : null}
      </aside>
    </div>
  );
}

/* ───────── the current read ───────── */
function CurrentRead({
  lendo,
  membros,
  eu,
  and,
  fase,
  minha,
  status,
  clubeId,
  pessoalId,
  moderadora,
}: {
  lendo: LivroDoClube;
  membros: Membro[];
  eu: string | null;
  and: ReturnType<typeof andamento>;
  fase: Fase;
  minha: boolean;
  status: StatusLeitura;
  clubeId: string;
  pessoalId?: string;
  moderadora: boolean;
}) {
  const trouxe = quemTrouxe(lendo, membros, eu);
  const prazo = and ? (and.faltam > 1 ? `${and.faltam} dias restantes` : and.faltam === 1 ? "1 dia restante" : +and.fim >= Date.now() ? "prazo de leitura hoje" : "prazo encerrado") : null;
  const principal =
    status === "terminei" && !minha
      ? { href: `/clubes/${clubeId}/ficha/${lendo.id}`, rotulo: "preencher minha ficha" }
      : status === "terminei"
        ? { href: `/clubes/${clubeId}/livro/${lendo.id}`, rotulo: "ver fichas de leitura" }
        : { href: `/livro/${pessoalId ?? lendo.livro.id}/progresso`, rotulo: "registrar leitura" };
  return (
    <section aria-labelledby="t-current" className="grid grid-cols-[112px_minmax(0,1fr)] gap-5 sm:grid-cols-[150px_minmax(0,1fr)] lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-8">
      <Link href={`/livro/${pessoalId ?? lendo.livro.id}`} className="block">
        <CapaAuto livro={lendo.livro} className="w-full shadow-[0_20px_34px_-20px_rgba(0,0,0,.55)] [&>span:last-child]:text-sm" />
      </Link>
      <div className="min-w-0">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span id="t-current" className="font-revista text-[17px] text-bordo italic">
            the current read.
          </span>
          {vol(lendo.rodada) ? <span className="font-mono text-[11px] tracking-[.16em] text-tinta-suave">{vol(lendo.rodada)}</span> : null}
        </p>
        <h2 className="mt-2 font-revista text-[26px] leading-[1.06] text-ameixa sm:text-[32px] lg:text-[40px]">{lendo.livro.titulo}</h2>
        <p className="mt-1 text-[14px] text-tinta-suave">
          {lendo.livro.autor}
          {lendo.livro.paginas ? ` · ${lendo.livro.paginas} páginas` : ""}
        </p>
        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-tinta-suave">
          {trouxe ? (
            <div>
              <dt className="sr-only">escolha</dt>
              <dd>{trouxe}</dd>
            </div>
          ) : null}
          {lendo.iniciado_em ? (
            <div>
              <dt className="inline">{fase === "antes" ? "começa " : "desde "}</dt>
              <dd className="inline">{dataLonga(lendo.iniciado_em)}</dd>
            </div>
          ) : null}
          {lendo.prazo ? (
            <div>
              <dt className="inline">até </dt>
              <dd className="inline">
                {dataLonga(lendo.prazo)}
                {prazo && fase !== "antes" ? <b className="ml-1.5 font-semibold text-bordo">· {prazo}</b> : null}
              </dd>
            </div>
          ) : null}
        </dl>
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href={principal.href} className={botaoPrincipal}>
            {principal.rotulo}
          </Link>
          <Link href={`/livro/${pessoalId ?? lendo.livro.id}`} className={linkPequeno}>
            ver detalhes do livro
          </Link>
          {moderadora ? (
            <Link href={`/clubes/${clubeId}/escolher`} className={`${linkPequeno} text-cinza`}>
              editar leitura
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/* ───────── minha leitura: o mesmo registro da estante pessoal ───────── */
function MinhaLeitura({
  lendo,
  status,
  progresso,
  pessoal,
  and,
  cor,
  compacta,
  recarregar,
}: {
  lendo: LivroDoClube;
  status: StatusLeitura;
  progresso?: Progresso;
  pessoal?: { id: string; paginaAtual?: number; paginas?: number; status?: string };
  and: ReturnType<typeof andamento>;
  cor: string;
  compacta: boolean;
  recarregar: () => void;
}) {
  const [marcando, setMarcando] = useState(false);
  const [unidade, setUnidade] = useState<UnidadeMarca>(progresso?.unidade ?? "pagina");
  const [numero, setNumero] = useState(progresso?.numero != null ? String(progresso.numero) : "");
  const total = pessoal?.paginas ?? lendo.livro.paginas;
  const pagina = pessoal?.paginaAtual ?? (progresso?.unidade === "pagina" ? (progresso.numero ?? undefined) : undefined);
  const pct = status === "terminei" || pessoal?.status === "lido" ? 100 : total && pagina ? Math.min(100, Math.round((pagina / total) * 100)) : 0;
  const ESTADOS: { v: StatusLeitura; r: string }[] = [
    { v: "nao_comecei", r: "não comecei" },
    { v: "lendo", r: "lendo" },
    { v: "terminei", r: "concluí" },
  ];

  async function salvarMarca() {
    const n = Number(numero);
    if (!numero || Number.isNaN(n) || n < 0) return;
    await marcarMarca(lendo.id, unidade, Math.round(n));
    setMarcando(false);
    recarregar();
  }

  return (
    <section aria-labelledby="t-minha">
      <div className={linhaTitulo}>
        <h2 id="t-minha" className={tituloEditorial}>
          minha leitura
        </h2>
        <span className="text-[12px] tabular-nums text-tinta-suave">
          {pct === 100 ? "concluída" : total && pagina ? `pág. ${pagina} de ${total} · ${pct}%` : progresso?.numero != null ? `${progresso.unidade === "capitulo" ? "capítulo" : "pág."} ${progresso.numero}` : "ainda não começou"}
        </span>
      </div>
      <Barra pct={pct} cor={cor} alta={compacta ? 4 : 7} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-pill border border-linha p-0.5" role="group" aria-label="como está a sua leitura">
          {ESTADOS.map((e) => (
            <button
              key={e.v}
              type="button"
              aria-pressed={status === e.v}
              onClick={async () => {
                await marcarProgresso(lendo.id, e.v);
                recarregar();
              }}
              className={`min-h-10 rounded-pill px-3.5 text-[12px] font-semibold ${status === e.v ? "bg-bordo text-creme" : "text-tinta-suave hover:text-bordo"}`}
            >
              {e.r}
            </button>
          ))}
        </div>
        <span className="text-[11px] text-cinza">
          {progresso?.atualizado_em ? `último registro ${new Date(progresso.atualizado_em).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")}` : ""}
          {and && and.faltam > 0 && status !== "terminei" ? `${progresso?.atualizado_em ? " · " : ""}${and.faltam} ${and.faltam === 1 ? "dia restante" : "dias restantes"}` : ""}
        </span>
      </div>
      {status !== "terminei" ? (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link href={`/livro/${pessoal?.id ?? lendo.livro.id}/progresso`} className={botaoSecundario}>
            registrar leitura
          </Link>
          {!marcando ? (
            <button type="button" onClick={() => setMarcando(true)} className="min-h-10 text-[12px] font-semibold text-cinza underline-offset-4 hover:text-bordo hover:underline">
              marcar capítulo no clube
            </button>
          ) : (
            <span className="flex flex-wrap items-center gap-2">
              <span className="flex rounded-pill border border-linha p-0.5">
                {(["pagina", "capitulo"] as const).map((u) => (
                  <button key={u} type="button" onClick={() => setUnidade(u)} className={`rounded-pill px-3 py-1.5 text-[11px] font-semibold ${unidade === u ? "bg-bordo text-creme" : "text-cinza"}`}>
                    {u === "pagina" ? "página" : "capítulo"}
                  </button>
                ))}
              </span>
              <input
                inputMode="numeric"
                autoFocus
                value={numero}
                onChange={(e) => setNumero(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""))}
                placeholder={unidade === "pagina" ? "nº da página" : "nº do capítulo"}
                aria-label={unidade === "pagina" ? "número da página" : "número do capítulo"}
                className="h-10 w-28 rounded-[4px] border border-linha px-2.5 text-[13px] outline-none focus:border-bordo"
                style={{ background: "var(--club-input-bg)" }}
              />
              <button type="button" onClick={salvarMarca} className="h-10 rounded-pill bg-bordo px-4 text-[12px] font-semibold text-creme">
                salvar
              </button>
              <button type="button" onClick={() => setMarcando(false)} className="h-10 px-2 text-[12px] text-cinza">
                cancelar
              </button>
            </span>
          )}
        </div>
      ) : null}
    </section>
  );
}

/* ───────── cada um no seu capítulo ───────── */
function CadaUm({
  membros,
  eu,
  statusDe,
  turma,
  progresso,
  corDe,
}: {
  membros: Membro[];
  eu: string | null;
  statusDe: (u: string) => StatusLeitura;
  turma: Map<string, AndamentoMembro>;
  progresso: Progresso[];
  corDe: Map<string, string>;
}) {
  const [todos, setTodos] = useState(false);
  const lista = [...membros].sort((a, b) => (a.usuario_id === eu ? -1 : b.usuario_id === eu ? 1 : 0));
  const visiveis = todos ? lista : lista.slice(0, 8);
  const terminaram = membros.filter((m) => statusDe(m.usuario_id) === "terminei").length;
  return (
    <section aria-labelledby="t-cada">
      <div className={linhaTitulo}>
        <h2 id="t-cada" className={tituloEditorial}>
          cada um no seu capítulo
        </h2>
      </div>
      <p className="mb-4 text-[13px] text-tinta-suave">
        <b className="font-semibold text-ameixa">
          {terminaram} de {membros.length}
        </b>{" "}
        {membros.length === 1 ? "leitor concluiu" : "leitores concluíram"}
      </p>
      <ul className="space-y-3.5">
        {visiveis.map((m) => {
          const s = statusDe(m.usuario_id);
          const a = turma.get(m.usuario_id);
          const marca = progresso.find((p) => p.usuario_id === m.usuario_id);
          const pct = s === "terminei" ? 100 : (a?.pct ?? 0);
          const rotulo =
            s === "terminei"
              ? "concluiu"
              : s === "lendo" || a?.estado === "lendo"
                ? a?.pct !== undefined
                  ? `lendo · ${a.pct}%`
                  : marca?.numero != null
                    ? `lendo · ${marca.unidade === "capitulo" ? "cap." : "pág."} ${marca.numero}`
                    : "lendo"
                : "ainda não começou";
          return (
            <li key={m.usuario_id} className="flex items-center gap-3">
              <Avatar pessoa={m.pessoa} tamanho={30} />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2 text-[13px]">
                  <span className="truncate text-ameixa">{m.usuario_id === eu ? "você" : nomeDe(m.pessoa)}</span>
                  <span className={`flex-none text-[11px] ${s === "terminei" ? "font-semibold text-bordo" : "text-tinta-suave"}`}>{rotulo}</span>
                </span>
                <span className="mt-1.5 block">
                  <Barra pct={pct} cor={corDe.get(m.usuario_id)} alta={4} />
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      {lista.length > 8 && !todos ? (
        <button type="button" onClick={() => setTodos(true)} className={`${linkPequeno} mt-2`}>
          ver mais {lista.length - 8} {lista.length - 8 === 1 ? "membro" : "membros"}
        </button>
      ) : null}
    </section>
  );
}

/* ───────── the reading notes ───────── */
function ReadingNotes({
  lendo,
  clubeId,
  minha,
  fichas,
  eu,
  membros,
  status,
}: {
  lendo: LivroDoClube;
  clubeId: string;
  minha?: Ficha;
  fichas: Ficha[];
  eu: string | null;
  membros: Membro[];
  status: StatusLeitura;
}) {
  const [revelar, setRevelar] = useState<string[]>([]);
  const outras = fichas.filter((f) => f.autor !== eu);
  const pessoa = (u: string) => membros.find((m) => m.usuario_id === u)?.pessoa ?? null;
  return (
    <section aria-labelledby="t-notas">
      <div className={linhaTitulo}>
        <h2 id="t-notas" className={tituloEditorial}>
          the reading notes.
        </h2>
        {fichas.length ? (
          <Link href={`/clubes/${clubeId}/livro/${lendo.id}`} className="text-[12px] font-semibold text-bordo hover:underline">
            ver todas
          </Link>
        ) : null}
      </div>

      {/* minha ficha */}
      {minha ? (
        <article className={cartao} style={raio}>
          <p className="font-mono text-[10px] tracking-[.16em] text-tinta-suave uppercase">your reading notes.</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            {minha.nota ? <span className="font-revista text-[30px] leading-none text-bordo">{virgula(minha.nota)}</span> : null}
            {minha.nota ? <Estrelas n={minha.nota} /> : null}
          </div>
          {minha.texto ? <p className="mt-3 line-clamp-3 font-revista text-[16px] leading-relaxed text-ameixa italic">“{minha.texto}”</p> : null}
          <div className="mt-3 flex flex-wrap gap-x-4">
            <Link href={`/clubes/${clubeId}/livro/${lendo.id}`} className={linkPequeno}>
              ver minha ficha
            </Link>
            <Link href={`/clubes/${clubeId}/ficha/${lendo.id}`} className={`${linkPequeno} text-tinta-suave`}>
              editar avaliação
            </Link>
          </div>
        </article>
      ) : status === "terminei" ? (
        <article className="border border-dashed border-bordo/40 px-5 py-5" style={{ ...raio, background: "var(--club-surface-accent)" }}>
          <p className="font-revista text-[22px] text-ameixa italic">e então, o que você achou?</p>
          <p className="mt-1 text-[13px] text-tinta-suave">registre suas impressões para o clube comparar opiniões.</p>
          <Link href={`/clubes/${clubeId}/ficha/${lendo.id}`} className={`${botaoPrincipal} mt-4`}>
            preencher minha ficha
          </Link>
        </article>
      ) : (
        <p className="text-[13px] text-tinta-suave">quando você concluir a leitura, sua ficha fica disponível aqui.</p>
      )}

      {/* fichas dos outros */}
      {outras.length ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {outras.map((f, i) => {
            const p = pessoa(f.autor);
            const escondido = f.spoiler && !revelar.includes(f.id);
            return (
              <li key={f.id} className={`${cartao} relative`} style={raio}>
                <span className="absolute top-3 right-4 font-mono text-[10px] text-cinza">nº {String(i + 1).padStart(2, "0")}</span>
                <div className="flex items-center gap-2.5">
                  <Avatar pessoa={p} tamanho={30} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold text-ameixa">{p ? nomeDe(p) : "membro do clube"}</span>
                    <span className="block text-[11px] text-cinza">{new Date(f.criado_em).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")}</span>
                  </span>
                </div>
                {f.nota ? (
                  <p className="mt-3 flex items-baseline gap-2">
                    <span className="font-revista text-[24px] leading-none text-bordo">{virgula(f.nota)}</span>
                    <Estrelas n={f.nota} tamanho={12} />
                  </p>
                ) : null}
                {f.texto ? (
                  escondido ? (
                    <button type="button" onClick={() => setRevelar((r) => [...r, f.id])} className="mt-2 text-left text-[12px] text-tinta-suave underline-offset-2 hover:underline">
                      contém spoiler · toque para ler
                    </button>
                  ) : (
                    <p className="mt-2 line-clamp-4 font-revista text-[15px] leading-relaxed text-ameixa italic">“{f.texto}”</p>
                  )
                ) : null}
                <Link href={`/clubes/${clubeId}/livro/${lendo.id}`} className="mt-2 inline-flex min-h-9 items-center text-[12px] font-semibold text-bordo hover:underline">
                  ver ficha completa
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

/* ───────── fichas pendentes ───────── */
function Pendentes({
  membros,
  fichas,
  eu,
  statusDe,
  clubeId,
  lendoId,
}: {
  membros: Membro[];
  fichas: Ficha[];
  eu: string | null;
  statusDe: (u: string) => StatusLeitura;
  clubeId: string;
  lendoId: string;
}) {
  const publicadas = membros.filter((m) => fichas.some((f) => f.autor === m.usuario_id));
  const pendentes = membros.filter((m) => !fichas.some((f) => f.autor === m.usuario_id) && statusDe(m.usuario_id) === "terminei");
  if (!publicadas.length && !pendentes.length) return null;
  const minhaPendente = pendentes.some((m) => m.usuario_id === eu);
  return (
    <section aria-labelledby="t-pend">
      <div className={linhaTitulo}>
        <h2 id="t-pend" className={tituloEditorial}>
          fichas de leitura
        </h2>
      </div>
      <p className="text-[13px] text-tinta-suave">
        <b className="font-semibold text-ameixa">
          {publicadas.length} de {membros.length}
        </b>{" "}
        {publicadas.length === 1 ? "ficha publicada" : "fichas publicadas"}
      </p>
      {minhaPendente ? (
        <Link href={`/clubes/${clubeId}/ficha/${lendoId}`} className={`${linkPequeno} mt-1`}>
          a sua está pendente · preencher minha ficha →
        </Link>
      ) : null}
      {pendentes.filter((m) => m.usuario_id !== eu).length ? (
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-cinza">
          {pendentes
            .filter((m) => m.usuario_id !== eu)
            .slice(0, 6)
            .map((m) => (
              <Avatar key={m.usuario_id} pessoa={m.pessoa} tamanho={22} />
            ))}
          <span className="ml-1">concluíram e ainda vão publicar</span>
        </p>
      ) : null}
    </section>
  );
}

/* ───────── the final verdict ───────── */
function FinalVerdict({ fichas }: { fichas: Ficha[] }) {
  const notas = fichas.map((f) => f.nota).filter((n): n is number => typeof n === "number" && n > 0);
  if (!notas.length)
    return (
      <section aria-labelledby="t-veredito">
        <div className={linhaTitulo}>
          <h2 id="t-veredito" className={tituloEditorial}>
            the final verdict.
          </h2>
        </div>
        <p className="font-revista text-[19px] text-ameixa italic">the verdict is still out.</p>
        <p className="mt-1 text-[13px] text-tinta-suave">as avaliações aparecem aqui conforme forem publicadas.</p>
      </section>
    );
  const m = notas.reduce((t, n) => t + n, 0) / notas.length;
  const faixas = [5, 4, 3, 2, 1].map((n) => ({ n, q: notas.filter((x) => Math.round(x) === n).length }));
  const maior = Math.max(1, ...faixas.map((f) => f.q));
  return (
    <section aria-labelledby="t-veredito">
      <div className={linhaTitulo}>
        <h2 id="t-veredito" className={tituloEditorial}>
          the final verdict.
        </h2>
        <span className="text-[11px] text-cinza">média desta leitura do clube</span>
      </div>
      <div className="grid gap-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-10">
        <div>
          <p className="flex items-baseline gap-1.5">
            <span className="font-revista text-[64px] leading-none text-bordo tabular-nums">{virgula(m)}</span>
            <span className="text-[16px] text-tinta-suave">/ 5</span>
          </p>
          <Estrelas n={m} tamanho={18} />
          <p className="mt-1 text-[12px] text-tinta-suave">
            {notas.length} {notas.length === 1 ? "avaliação publicada" : "avaliações publicadas"}
            {notas.length >= 3 ? ` · de ${virgula(Math.min(...notas))} a ${virgula(Math.max(...notas))}` : ""}
          </p>
        </div>
        <ul className="space-y-1.5">
          {faixas.map((f) => (
            <li key={f.n} className="flex items-center gap-2.5 text-[12px] text-tinta-suave">
              <span className="w-7 tabular-nums">{f.n}★</span>
              <span className="min-w-0 flex-1">
                <Barra pct={(f.q / maior) * 100} alta={7} cor={f.q ? "var(--club-chart-1)" : "transparent"} />
              </span>
              <span className="w-4 text-right tabular-nums">{f.q}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────── same book, different opinions ───────── */
function DifferentOpinions({ fichas, membros, eu, corDe }: { fichas: Ficha[]; membros: Membro[]; eu: string | null; corDe: Map<string, string> }) {
  const comNotas = fichas.filter((f) => criterios.some((c) => (f.notas?.[c] ?? 0) > 0));
  if (comNotas.length < 2) return null;
  const nome = (u: string) => (u === eu ? "você" : nomeDe(membros.find((m) => m.usuario_id === u)?.pessoa));
  const linhas = criterios
    .map((c) => {
      const vs = comNotas.map((f) => ({ autor: f.autor, v: f.notas?.[c] ?? 0 })).filter((x) => x.v > 0);
      const m = media(vs.map((x) => x.v));
      const spread = vs.length ? Math.max(...vs.map((x) => x.v)) - Math.min(...vs.map((x) => x.v)) : 0;
      return { c, vs, m, spread };
    })
    .filter((l) => l.vs.length >= 2);
  if (!linhas.length) return null;
  // insights calculados, sem interpretar respostas abertas
  const insights: string[] = [];
  const melhor = [...linhas].sort((a, b) => (b.m ?? 0) - (a.m ?? 0))[0];
  insights.push(`${NOME_CRITERIO[melhor.c]} foi o critério mais bem avaliado (${virgula(melhor.m!)}).`);
  const dividiu = [...linhas].sort((a, b) => b.spread - a.spread)[0];
  if (dividiu.spread >= 2) insights.push(`${NOME_CRITERIO[dividiu.c] === "final" ? "o final" : NOME_CRITERIO[dividiu.c]} dividiu opiniões.`);
  const consenso = [...linhas].filter((l) => l.vs.length >= 3).sort((a, b) => a.spread - b.spread)[0];
  if (consenso && consenso.spread <= 0.5 && consenso.c !== dividiu.c) insights.push(`${NOME_CRITERIO[consenso.c] === "final" ? "o final" : NOME_CRITERIO[consenso.c]} foi o ponto de maior consenso.`);
  const autores = [...new Set(comNotas.map((f) => f.autor))];

  return (
    <section aria-labelledby="t-opinioes">
      <div className={linhaTitulo}>
        <h2 id="t-opinioes" className={tituloEditorial}>
          same book, different opinions.
        </h2>
      </div>
      <ul className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-tinta-suave" aria-label="legenda">
        {autores.map((a) => (
          <li key={a} className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full" style={{ background: corDe.get(a) ?? "var(--club-chart-1)" }} />
            {nome(a)}
          </li>
        ))}
      </ul>
      <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
        {linhas.map((l) => (
          <div key={l.c}>
            <p className="flex items-baseline justify-between text-[13px]">
              <span className="font-semibold text-ameixa">{NOME_CRITERIO[l.c]}</span>
              <span className="text-tinta-suave tabular-nums">média {virgula(l.m!)}</span>
            </p>
            <ul className="mt-2 space-y-1.5">
              {l.vs.map((x) => (
                <li key={x.autor} className="flex items-center gap-2 text-[11px] text-tinta-suave">
                  <span className="w-[64px] flex-none truncate">{nome(x.autor)}</span>
                  <span className="min-w-0 flex-1">
                    <Barra pct={(x.v / 5) * 100} cor={corDe.get(x.autor)} alta={6} />
                  </span>
                  <span className="w-6 text-right tabular-nums">{virgula(x.v)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <ul className="mt-5 space-y-1 border-t border-dashed border-linha pt-4 text-[13px] text-ameixa">
        {insights.map((t) => (
          <li key={t} className="font-revista italic">
            {t}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────── book date ───────── */
function BookDate({ encontro, clubeId }: { encontro: Encontro | null; clubeId: string }) {
  if (!encontro)
    return (
      <section aria-labelledby="t-date" className="border border-dashed border-linha p-5 lg:border-fio" style={raio}>
        <h2 id="t-date" className="font-revista text-[20px] text-bordo italic">
          it&apos;s time for a book date.
        </h2>
        <p className="mt-1 text-[13px] text-tinta-suave">ainda não temos um encontro marcado. escolham uma data para conversar sobre a leitura.</p>
        <Link href={`/clubes/${clubeId}/agenda`} className={`${botaoSecundario} mt-4`}>
          agendar encontro
        </Link>
      </section>
    );
  const d = new Date(encontro.quando);
  const link = encontro.local && /^https?:\/\//.test(encontro.local) ? encontro.local : null;
  return (
    <section aria-labelledby="t-date" className="overflow-hidden border border-linha lg:border-fio" style={{ ...raio, background: "var(--club-surface-accent)" }}>
      <div className="flex gap-4 p-5">
        <span className="flex w-[64px] flex-none flex-col items-center border-r border-bordo/25 pr-4 text-bordo">
          <span className="font-revista text-[34px] leading-none">{d.getDate()}</span>
          <span className="text-[11px] uppercase">{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</span>
        </span>
        <span className="min-w-0">
          <span id="t-date" className="block font-revista text-[17px] text-bordo italic">
            book date.
          </span>
          <span className="mt-1 block text-[14px] font-semibold text-ameixa">{encontro.titulo}</span>
          <span className="mt-0.5 block text-[12px] text-tinta-suave">
            {d.toLocaleDateString("pt-BR", { weekday: "long" })} · {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            {encontro.local && !link ? ` · ${encontro.local}` : ""}
            {link ? " · online" : ""}
          </span>
          <span className="mt-2 flex flex-wrap gap-x-4">
            <Link href={`/clubes/${clubeId}/agenda`} className="inline-flex min-h-9 items-center text-[12px] font-semibold text-bordo hover:underline">
              ver encontro
            </Link>
            {link ? (
              <a href={link} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center text-[12px] font-semibold text-bordo hover:underline">
                abrir link
              </a>
            ) : null}
          </span>
        </span>
      </div>
    </section>
  );
}
