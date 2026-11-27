"use client";

import { Voltar } from "@/components/Voltar";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { aplicarExtrasDoTema } from "@/components/Aparencia";
import { coresDoTema } from "@/lib/tema";
import { AjustarFoto } from "@/components/AjustarFoto";
import { CampoUsuario } from "@/components/CampoUsuario";
import type { SituacaoUsuario } from "@/lib/usuario";
import { useHidratado } from "@/components/PerfilHidratacao";
import { metas, temas } from "@/lib/dados";
import { reduzirImagem } from "@/lib/imagem";
import { TemaSimbolo } from "@/components/TemaSimbolo";
import { MiniaturaTema, PreviaTema } from "@/components/perfil/PreviaTema";
import { TEMAS_APP, corDaEstanteApp, ehTemaLegado, temaApp, type Decoracao, type EstiloEstante } from "@/lib/temas";
import { usePerfil, type Perfil } from "@/lib/perfil-store";

const LIMITE_FRASE = 120;
const rotulo = "mb-1.5 block text-[11px] leading-[14px] font-semibold tracking-[.12em] text-bordo uppercase";
const caixa =
  "h-11 w-full rounded-[6px] border border-bege bg-creme-quente px-3.5 text-[15px] text-ameixa outline-none focus:border-bordo focus:ring-1 focus:ring-bordo";
const tituloSecao = "font-revista text-[20px] leading-tight text-ameixa lg:text-[22px]";

type Aparencia = Perfil["aparencia"];
type Rascunho = Pick<
  Perfil,
  | "nome"
  | "usuario"
  | "frase"
  | "meta"
  | "tema"
  | "foto"
  | "capa"
  | "capaImagem"
  | "capaPosY"
  | "aparencia"
  | "estiloEstante"
  | "decoracao"
  | "temaSoNoPerfil"
  | "publicarNoFeed"
  | "estantesProprias"
>;
type Categoria = "perfil" | "aparencia" | "privacidade";

const CATEGORIAS: [Categoria, string][] = [
  ["perfil", "meu perfil"],
  ["aparencia", "aparência"],
  ["privacidade", "privacidade"],
];

/** o modo escuro que vale para uma escolha de aparência (sistema: o do aparelho) */
function useEscuroDe(aparencia: Aparencia) {
  const [doSistema, setDoSistema] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const ler = () => setDoSistema(mq.matches);
    ler();
    mq.addEventListener("change", ler);
    return () => mq.removeEventListener("change", ler);
  }, []);
  return aparencia === "escuro" || (aparencia === "sistema" && doSistema);
}

/** aplica (ou desfaz) a aparência e o tema no app inteiro, para ver como fica antes de salvar */
function aplicarNoApp(tema: string | undefined, escuro: boolean, estante: EstiloEstante, decoracao: Decoracao | null) {
  const raiz = document.documentElement;
  if (escuro) raiz.dataset.modo = "escuro";
  else delete raiz.dataset.modo;
  const cores = (tema ? coresDoTema(tema, escuro) : undefined) ?? {};
  for (const [k, v] of Object.entries(cores)) if (k.startsWith("--")) raiz.style.setProperty(k, String(v));
  const legado = temas.find((x) => x.id === tema);
  if (legado && "escuro" in legado && escuro) raiz.dataset.temaEscuro = "1";
  else delete raiz.dataset.temaEscuro;
  aplicarExtrasDoTema(tema, escuro, estante, decoracao);
  return Object.keys(cores).filter((k) => k.startsWith("--"));
}

function Formulario({ inicial }: { inicial: Rascunho }) {
  const router = useRouter();
  const atualizar = usePerfil((s) => s.atualizar);
  const livros = usePerfil((s) => s.livros);
  const favoritosIds = usePerfil((s) => s.favoritos);
  const [r, setR] = useState<Rascunho>(inicial);
  const [categoria, setCategoria] = useState<Categoria>(() => {
    if (typeof window === "undefined") return "perfil";
    const c = new URLSearchParams(window.location.search).get("aba");
    return c === "aparencia" || c === "privacidade" ? c : "perfil";
  });
  const [previaAberta, setPreviaAberta] = useState(false);
  const fotoRef = useRef<HTMLInputElement>(null);
  const capaRef = useRef<HTMLInputElement>(null);
  const [fotoParaAjustar, setFotoParaAjustar] = useState<string | null>(null);
  const [capaParaAjustar, setCapaParaAjustar] = useState<string | null>(null);
  const mudar = (d: Partial<Rascunho>) => setR((x) => ({ ...x, ...d }));
  const [situacaoUsuario, setSituacaoUsuario] = useState<SituacaoUsuario>("verificando");
  const usuarioAntigo = inicial.usuario;
  const usuarioOk = r.usuario === usuarioAntigo || situacaoUsuario === "ok" || situacaoUsuario === "sem_internet";
  const valido = !!(r.nome.trim() && r.usuario.trim() && usuarioOk);
  const escuro = useEscuroDe(r.aparencia);

  // prévia ao vivo no app inteiro; ao sair (salvando ou não), volta ao que estiver salvo
  useEffect(() => {
    const raiz = document.documentElement;
    const chaves = aplicarNoApp(r.temaSoNoPerfil ? undefined : r.tema, escuro, r.estiloEstante ?? "auto", r.decoracao ?? null);
    return () => {
      for (const k of chaves) raiz.style.removeProperty(k);
      const s = usePerfil.getState();
      const escuroSalvo = s.aparencia === "escuro" || (s.aparencia === "sistema" && matchMedia("(prefers-color-scheme: dark)").matches);
      aplicarNoApp(s.temaSoNoPerfil ? undefined : s.tema, escuroSalvo, s.estiloEstante ?? "auto", s.decoracao ?? null);
    };
  }, [r.tema, r.temaSoNoPerfil, escuro, r.estiloEstante, r.decoracao]);

  function salvar() {
    if (!valido) return;
    atualizar({ ...r, nome: r.nome.trim(), frase: r.frase.trim() });
    router.push("/perfil");
  }

  function restaurarAparencia() {
    mudar({ tema: "the-original", estiloEstante: "auto", decoracao: null, temaSoNoPerfil: false });
  }

  function trocarCategoria(c: Categoria) {
    setCategoria(c);
    window.history.replaceState(null, "", c === "perfil" ? "/perfil/editar" : `/perfil/editar?aba=${c}`);
  }

  const favoritos = favoritosIds.map((id) => livros.find((l) => l.id === id)).filter((l) => l !== undefined).slice(0, 4);
  const lendo = livros.find((l) => !l.status || l.status === "lendo");
  const previa = (
    <PreviaTema
      tema={r.tema}
      escuro={escuro}
      estiloEstante={r.estiloEstante ?? "auto"}
      decoracao={r.decoracao ?? null}
      nome={r.nome}
      usuario={r.usuario}
      frase={r.frase}
      foto={r.foto}
      capa={r.capa}
      capaImagem={r.capaImagem}
      capaPosY={r.capaPosY ?? 50}
      favoritos={favoritos}
      lendo={lendo}
    />
  );

  return (
    <AppShell aba="perfil" menuCelular={false}>
      <div className="mx-auto w-full max-w-[1160px] px-4 pt-2 pb-28 sm:px-6 lg:px-10 lg:pt-8 lg:pb-12">
        <header className="flex items-center justify-between gap-3">
          <Voltar padrao="/perfil" rotulo="perfil" className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo" />
          <h1 className="font-revista text-[18px] text-ameixa lg:hidden">editar perfil</h1>
          <button type="button" onClick={salvar} disabled={!valido} className="-mr-2 min-h-11 px-2 text-[13px] font-semibold text-bordo disabled:opacity-40 lg:hidden">
            salvar
          </button>
        </header>
        <h1 className="mt-2 hidden font-revista text-[32px] leading-none text-ameixa lg:block">editar perfil</h1>

        {/* categorias: abas compactas no celular, coluna discreta no computador */}
        <nav aria-label="categorias" className="mt-3 grid grid-cols-3 rounded-[8px] border border-linha p-1 lg:hidden">
          {CATEGORIAS.map(([id, nome]) => (
            <button
              key={id}
              type="button"
              aria-current={categoria === id ? "page" : undefined}
              onClick={() => trocarCategoria(id)}
              className={`min-h-11 rounded-[6px] text-[13px] font-semibold ${categoria === id ? "bg-bordo text-creme" : "text-tinta-suave"}`}
            >
              {nome}
            </button>
          ))}
        </nav>

        <div className="mt-5 lg:mt-8 lg:grid lg:grid-cols-[150px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[150px_minmax(0,1fr)_330px]">
          <nav aria-label="categorias" className="hidden lg:block">
            <ul className="sticky top-8 space-y-1 border-l border-linha">
              {CATEGORIAS.map(([id, nome]) => (
                <li key={id}>
                  <button
                    type="button"
                    aria-current={categoria === id ? "page" : undefined}
                    onClick={() => trocarCategoria(id)}
                    className={`-ml-px block min-h-9 border-l-2 pl-4 text-left text-[14px] ${categoria === id ? "border-bordo font-semibold text-bordo" : "border-transparent text-tinta-suave hover:text-ameixa"}`}
                  >
                    {nome}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="min-w-0 max-w-[680px]">
            {categoria === "perfil" ? (
              <MeuPerfil
                r={r}
                mudar={mudar}
                usuarioAntigo={usuarioAntigo}
                onSituacao={setSituacaoUsuario}
                abrirFoto={() => fotoRef.current?.click()}
                ajustarFoto={() => setFotoParaAjustar(r.foto)}
                abrirCapa={() => capaRef.current?.click()}
                ajustarCapa={() => setCapaParaAjustar(r.capaImagem)}
              />
            ) : null}
            {categoria === "aparencia" ? <AparenciaSecao r={r} mudar={mudar} escuro={escuro} abrirPrevia={() => setPreviaAberta(true)} /> : null}
            {categoria === "privacidade" ? <Privacidade r={r} mudar={mudar} /> : null}

            {/* ações */}
            <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-linha bg-creme/95 px-4 py-3 backdrop-blur-sm lg:static lg:mt-10 lg:border-t lg:bg-transparent lg:px-0 lg:pt-6 lg:backdrop-blur-none">
              <button
                type="button"
                onClick={salvar}
                disabled={!valido}
                className="h-10 flex-1 rounded-[6px] bg-bordo px-5 text-[14px] font-semibold text-creme hover:bg-bordo-suave disabled:opacity-45 lg:flex-none"
              >
                salvar alterações
              </button>
              <Link href="/perfil" className="flex h-10 items-center rounded-[6px] border border-bege px-4 text-[14px] font-semibold text-ameixa">
                cancelar
              </Link>
              {categoria === "aparencia" ? (
                <button type="button" onClick={restaurarAparencia} className="ml-auto hidden h-10 px-2 text-[13px] font-semibold text-tinta-suave underline-offset-4 hover:underline sm:block">
                  restaurar padrão
                </button>
              ) : null}
            </div>
          </div>

          {/* prévia lateral (aparência e perfil, quando há espaço) */}
          <aside aria-label="prévia" className="hidden xl:block">
            <div className="sticky top-8">
              <p className="mb-2 text-[11px] font-semibold tracking-[.14em] text-cinza uppercase">prévia</p>
              {previa}
              <p className="mt-2 text-[11px] text-cinza">só você vê até salvar.</p>
            </div>
          </aside>
        </div>
      </div>

      {/* prévia sob demanda (celular e telas médias) */}
      {previaAberta ? (
        <div role="dialog" aria-modal="true" aria-label="prévia do perfil" className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setPreviaAberta(false)}>
          <div className="max-h-[92dvh] w-full max-w-[420px] overflow-y-auto rounded-t-[12px] bg-creme p-4 sm:rounded-[12px]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-revista text-[18px] text-ameixa">prévia</p>
              <button type="button" onClick={() => setPreviaAberta(false)} className="min-h-11 px-2 text-[13px] font-semibold text-bordo">
                fechar
              </button>
            </div>
            {previa}
          </div>
        </div>
      ) : null}

      <input
        ref={fotoRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) setFotoParaAjustar(await reduzirImagem(f, 1600, 0.9));
        }}
      />
      <input
        ref={capaRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) setCapaParaAjustar(await reduzirImagem(f, 3000, 0.92));
        }}
      />
      {fotoParaAjustar ? (
        <AjustarFoto
          src={fotoParaAjustar}
          onCancelar={() => setFotoParaAjustar(null)}
          onPronto={(dataUrl) => {
            mudar({ foto: dataUrl });
            setFotoParaAjustar(null);
          }}
        />
      ) : null}
      {capaParaAjustar ? (
        <AjustarFoto
          src={capaParaAjustar}
          formato="capa"
          posY={capaParaAjustar === r.capaImagem ? (r.capaPosY ?? 50) : 50}
          onCancelar={() => setCapaParaAjustar(null)}
          onPronto={(dataUrl, posY) => {
            mudar({ capaImagem: dataUrl, capaPosY: posY ?? 50 });
            setCapaParaAjustar(null);
          }}
        />
      ) : null}
    </AppShell>
  );
}

// ───────── meu perfil ─────────

function MeuPerfil({
  r,
  mudar,
  usuarioAntigo,
  onSituacao,
  abrirFoto,
  ajustarFoto,
  abrirCapa,
  ajustarCapa,
}: {
  r: Rascunho;
  mudar: (d: Partial<Rascunho>) => void;
  usuarioAntigo: string;
  onSituacao: (s: SituacaoUsuario) => void;
  abrirFoto: () => void;
  ajustarFoto: () => void;
  abrirCapa: () => void;
  ajustarCapa: () => void;
}) {
  const meta = typeof r.meta === "number" ? r.meta : null;
  const [textoMeta, setTextoMeta] = useState(() => (meta !== null && !metas.some((m) => m.valor === meta) ? String(meta) : ""));
  const metaPersonalizada = textoMeta !== "" && meta !== null && meta === Number(textoMeta);

  return (
    <div className="space-y-8">
      {/* identidade visual: banner e avatar */}
      <section aria-labelledby="t-visual">
        <h2 id="t-visual" className={tituloSecao}>
          banner e avatar
        </h2>
        <div className="mt-3 overflow-hidden rounded-[8px] border border-linha">
          <div
            className={`relative h-[120px] bg-cover sm:h-[150px] ${r.capaImagem ? "" : `pat-${r.capa}`}`}
            style={r.capaImagem ? { backgroundImage: `url("${r.capaImagem}")`, backgroundPosition: `center ${r.capaPosY ?? 50}%` } : undefined}
          />
          <div className="flex items-end gap-3 px-4 pb-3">
            <button
              type="button"
              onClick={abrirFoto}
              aria-label={r.foto ? "trocar foto" : "colocar foto"}
              className="relative -mt-9 size-[76px] flex-none overflow-hidden rounded-full border-[3px] border-creme bg-linha"
            >
              {r.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.foto} alt="" className="size-full object-cover object-[50%_30%]" />
              ) : (
                <span className="text-[11px] text-cinza">foto</span>
              )}
            </button>
            <div className="flex flex-wrap gap-x-4 pb-0.5 text-[13px] font-semibold text-bordo">
              <button type="button" onClick={abrirFoto} className="min-h-11">
                {r.foto ? "trocar foto" : "colocar foto"}
              </button>
              {r.foto ? (
                <button type="button" onClick={ajustarFoto} className="min-h-11">
                  ajustar enquadramento
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 text-[13px] font-semibold">
          <button type="button" onClick={abrirCapa} className="min-h-11 text-bordo">
            {r.capaImagem ? "trocar capa" : "colocar foto de capa"}
          </button>
          {r.capaImagem ? (
            <>
              <button type="button" onClick={ajustarCapa} className="min-h-11 text-bordo">
                ajustar enquadramento
              </button>
              <button type="button" onClick={() => mudar({ capaImagem: null, capa: "tema" })} className="min-h-11 text-tinta-suave">
                remover capa
              </button>
            </>
          ) : null}
        </div>
        {!r.capaImagem ? <p className="text-[12px] text-cinza">sem foto, a capa usa o pattern do seu tema.</p> : null}
      </section>

      {/* informações */}
      <section aria-labelledby="t-info" className="space-y-4">
        <h2 id="t-info" className={tituloSecao}>
          sobre você
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block min-w-0">
            <span className={rotulo}>nome de exibição</span>
            <input value={r.nome} onChange={(e) => mudar({ nome: e.target.value })} placeholder="como você quer ser chamada" className={caixa} />
          </label>
          <div className="min-w-0">
            <span className={rotulo}>nome de usuário</span>
            <CampoUsuario valor={r.usuario} nome={r.nome} onChange={(u) => mudar({ usuario: u })} onSituacao={onSituacao} />
            <span className="mt-1 block text-[11px] text-cinza">
              {r.usuario !== usuarioAntigo ? (
                <>
                  seu link vai mudar para <b className="text-ameixa">/u/{r.usuario || "…"}</b>, e você passa a entrar com o @ novo.
                </>
              ) : (
                <>
                  seu perfil: <b className="text-ameixa">/u/{r.usuario}</b>
                </>
              )}
            </span>
          </div>
        </div>
        <label className="block">
          <span className={rotulo}>frase do perfil</span>
          <textarea
            value={r.frase}
            maxLength={LIMITE_FRASE}
            rows={2}
            onChange={(e) => mudar({ frase: e.target.value })}
            placeholder="uma frase que tem a sua cara de leitora"
            className={`${caixa} !h-auto resize-none py-2.5 leading-[1.4]`}
          />
          <span className="mt-1 flex justify-between gap-3 text-[11px] text-cinza">
            <span>aparece logo abaixo do seu nome.</span>
            <span className="tabular-nums">
              {r.frase.length}/{LIMITE_FRASE}
            </span>
          </span>
        </label>
        <p className="text-[12px] text-cinza">
          a citação favorita do perfil você escolhe entre os trechos salvos, na{" "}
          <Link href="/perfil" className="font-semibold text-bordo underline-offset-4 hover:underline">
            visão geral do perfil
          </Link>
          .
        </p>
      </section>

      {/* meta */}
      <fieldset>
        <legend className={tituloSecao}>meta de {new Date().getFullYear()}</legend>
        <p className="mt-1 mb-3 text-[13px] text-cinza">quantos livros você quer ler este ano?</p>
        <div className="flex flex-wrap gap-2">
          {metas.map((m) => (
            <label
              key={String(m.valor)}
              className={`inline-flex min-h-10 min-w-12 cursor-pointer items-center justify-center rounded-[6px] border px-3.5 text-[13px] font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordo ${
                r.meta === m.valor ? "border-bordo bg-bordo text-creme" : "border-linha text-ameixa"
              }`}
            >
              <input
                type="radio"
                name="meta"
                className="sr-only"
                checked={r.meta === m.valor}
                onChange={() => {
                  setTextoMeta("");
                  mudar({ meta: m.valor });
                }}
              />
              {m.valor ?? "sem meta"}
            </label>
          ))}
          <label className={`inline-flex min-h-10 items-center gap-2 rounded-[6px] border pr-1.5 pl-3.5 text-[13px] font-semibold ${metaPersonalizada ? "border-bordo bg-bordo text-creme" : "border-linha text-ameixa"}`}>
            outra
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={999}
              placeholder="nº"
              value={textoMeta}
              onChange={(e) => {
                const v = Math.min(999, Math.round(Number(e.target.value)));
                setTextoMeta(e.target.value === "" ? "" : String(v));
                if (v > 0) mudar({ meta: v });
              }}
              aria-label="meta personalizada: quantos livros"
              className="h-7 w-14 rounded-[4px] bg-creme px-2 text-center text-[13px] text-ameixa outline-none"
            />
          </label>
        </div>
      </fieldset>
    </div>
  );
}

// ───────── aparência ─────────

const ESTANTES: [EstiloEstante, string][] = [
  ["auto", "automático"],
  ["clara", "madeira clara"],
  ["escura", "madeira escura"],
  ["tema", "cor do tema"],
  ["minimalista", "minimalista"],
];
const DECORACOES: [Decoracao, string, string][] = [
  ["minimal", "minimal", "só o essencial"],
  ["editorial", "editorial", "equilíbrio"],
  ["expressive", "expressive", "mais presença"],
];

function AparenciaSecao({ r, mudar, escuro, abrirPrevia }: { r: Rascunho; mudar: (d: Partial<Rascunho>) => void; escuro: boolean; abrirPrevia: () => void }) {
  const atual = temaApp(r.tema);
  const legado = ehTemaLegado(r.tema) ? temas.find((t) => t.id === r.tema) : undefined;
  const nivel = r.decoracao ?? atual?.decoracao ?? "editorial";
  const segmento = (on: boolean) =>
    `flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-[5px] text-[13px] font-semibold ${on ? "bg-creme text-ameixa shadow-[0_1px_3px_rgba(0,0,0,.12)]" : "text-tinta-suave hover:text-ameixa"}`;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-revista text-[30px] leading-none text-ameixa italic lg:text-[34px]">make it yours.</p>
          <p className="mt-1.5 text-[13px] text-cinza">escolha seu tema e, à parte, se o app fica claro ou escuro.</p>
        </div>
        <button type="button" onClick={abrirPrevia} className="flex h-10 flex-none items-center rounded-[6px] border border-bege px-3.5 text-[13px] font-semibold text-bordo xl:hidden">
          ver prévia
        </button>
      </div>

      {/* aparência: claro / escuro / sistema */}
      <section aria-labelledby="t-modo">
        <h2 id="t-modo" className={rotulo}>
          aparência
        </h2>
        <div role="radiogroup" aria-labelledby="t-modo" className="flex max-w-[380px] gap-1 rounded-[7px] bg-papel p-1">
          {(
            [
              ["claro", "claro", "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z M12 2v2 M12 20v2 M4 12H2 M22 12h-2 M5 5l1.4 1.4 M17.6 17.6 19 19 M5 19l1.4-1.4 M17.6 6.4 19 5"],
              ["escuro", "escuro", "M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"],
              ["sistema", "sistema", "M3 5h18v11H3z M8 20h8 M12 16v4"],
            ] as [Aparencia, string, string][]
          ).map(([id, nome, d]) => (
            <button key={id} type="button" role="radio" aria-checked={r.aparencia === id} onClick={() => mudar({ aparencia: id })} className={segmento(r.aparencia === id)}>
              <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {d.split(" M").map((p, i) => (
                  <path key={i} d={i ? `M${p}` : p} />
                ))}
              </svg>
              {nome}
            </button>
          ))}
        </div>
      </section>

      {/* os oito temas */}
      <section aria-labelledby="t-temas">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 id="t-temas" className={tituloSecao}>
            escolha seu tema
          </h2>
          {atual ? <span className="text-[12px] text-cinza">{atual.descricao}</span> : null}
        </div>
        <div role="radiogroup" aria-labelledby="t-temas" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {TEMAS_APP.map((t) => {
            const v = escuro ? t.escuro : t.claro;
            const on = atual?.id === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={`${t.nome} — ${t.descricao}`}
                onClick={() => mudar({ tema: t.id })}
                className={`group relative flex h-[118px] flex-col overflow-hidden rounded-[6px] border text-left transition-colors ${on ? "border-bordo ring-1 ring-bordo" : "border-linha hover:border-bege"}`}
                style={{ background: v.fundo, color: v.texto }}
              >
                <MiniaturaTema id={t.id} escuro={escuro} />
                <span className="flex flex-1 flex-col justify-between px-2.5 pt-2 pb-2">
                  <span className="flex items-center gap-1.5">
                    <span style={{ color: v.primaria }}>
                      <TemaSimbolo simbolo={t.simbolo} tamanho={14} />
                    </span>
                    <span className="truncate text-[12px] font-semibold">{t.nome}</span>
                  </span>
                  <span className="flex gap-1">
                    {[v.primaria, v.secundaria, v.acento, v.acento2 ?? v.superficie].map((c, i) => (
                      <span key={i} className="size-3 rounded-full" style={{ background: c, boxShadow: `inset 0 0 0 1px ${v.borda}` }} />
                    ))}
                  </span>
                </span>
                {on ? (
                  <span aria-hidden className="absolute top-1.5 right-1.5 flex size-[18px] items-center justify-center rounded-full" style={{ background: v.primaria, color: v.sobrePrimaria }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5l4.5 4.5L19 7.5" />
                    </svg>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
        {legado ? (
          <p className="mt-3 rounded-[6px] border border-dashed border-bege px-3 py-2.5 text-[12px] text-tinta-suave">
            você está usando <b className="text-ameixa">{legado.nome}</b>, um tema da coleção anterior. ele continua valendo até você escolher um dos novos.
          </p>
        ) : null}
      </section>

      {/* estante */}
      <section aria-labelledby="t-estante">
        <h2 id="t-estante" className={tituloSecao}>
          estilo da estante
        </h2>
        <div role="radiogroup" aria-labelledby="t-estante" className="mt-3 flex flex-wrap gap-2">
          {ESTANTES.map(([id, nome]) => {
            const on = (r.estiloEstante ?? "auto") === id;
            const cor = id === "auto" ? (corDaEstanteApp("auto", atual, escuro) ?? "#9A6B43") : id === "clara" ? "#D8B98F" : (corDaEstanteApp(id, atual, escuro) ?? "#9A6B43");
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => mudar({ estiloEstante: id })}
                className={`inline-flex min-h-10 items-center gap-2 rounded-[6px] border px-3 text-[13px] font-semibold ${on ? "border-bordo bg-rosa-fundo text-bordo" : "border-linha text-tinta-suave hover:border-bege"}`}
              >
                <span aria-hidden className={id === "minimalista" ? "h-[2px] w-4" : "h-[6px] w-4 rounded-[1px]"} style={{ background: cor }} />
                {nome}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[12px] text-cinza">muda só a aparência da estante; os livros continuam iguais.</p>
      </section>

      {/* decoração */}
      <section aria-labelledby="t-deco">
        <h2 id="t-deco" className={tituloSecao}>
          elementos decorativos
        </h2>
        <div role="radiogroup" aria-labelledby="t-deco" className="mt-3 flex max-w-[460px] gap-1 rounded-[7px] bg-papel p-1">
          {DECORACOES.map(([id, nome, sub]) => (
            <button key={id} type="button" role="radio" aria-checked={nivel === id} onClick={() => mudar({ decoracao: id })} className={`${segmento(nivel === id)} flex-col !gap-0 py-1.5`}>
              <span>{nome}</span>
              <span className="text-[10px] font-normal text-cinza">{sub}</span>
            </button>
          ))}
        </div>
      </section>

      {/* complementares */}
      <section>
        <label className="flex cursor-pointer items-start gap-3 text-[13px]">
          <input type="checkbox" checked={!r.temaSoNoPerfil} onChange={(e) => mudar({ temaSoNoPerfil: !e.target.checked })} className="mt-0.5 size-5 flex-none accent-bordo" />
          <span>
            <b className="font-semibold">usar o tema no app todo</b>
            <span className="block text-cinza">desligado, o tema fica só no seu perfil.</span>
          </span>
        </label>
      </section>
    </div>
  );
}

// ───────── privacidade ─────────

function Privacidade({ r, mudar }: { r: Rascunho; mudar: (d: Partial<Rascunho>) => void }) {
  const linha = "flex cursor-pointer items-start justify-between gap-4 border-b border-linha py-3.5";
  return (
    <div className="space-y-8">
      <section aria-labelledby="t-feed">
        <h2 id="t-feed" className={tituloSecao}>
          atividades
        </h2>
        <label className={linha}>
          <span className="text-[14px]">
            <b className="font-semibold">mostrar minhas leituras no feed</b>
            <span className="block text-[12px] text-cinza">quando você começa, termina, dá nota ou registra progresso, quem te segue vê.</span>
          </span>
          <input type="checkbox" checked={r.publicarNoFeed} onChange={(e) => mudar({ publicarNoFeed: e.target.checked })} className="mt-1 size-5 flex-none accent-bordo" />
        </label>
      </section>

      <section aria-labelledby="t-estantes">
        <h2 id="t-estantes" className={tituloSecao}>
          estantes
        </h2>
        {r.estantesProprias.length ? (
          <ul>
            {r.estantesProprias.map((e) => (
              <li key={e.id}>
                <label className={linha}>
                  <span className="flex items-center gap-2.5 text-[14px]">
                    <span aria-hidden className="size-3 rounded-full" style={{ background: e.cor }} />
                    <span>
                      <b className="font-semibold">{e.nome}</b>
                      <span className="block text-[12px] text-cinza">{e.publica ? "aparece no seu perfil" : "só você vê"}</span>
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={e.publica}
                    aria-label={`estante ${e.nome} pública`}
                    onChange={(ev) => mudar({ estantesProprias: r.estantesProprias.map((x) => (x.id === e.id ? { ...x, publica: ev.target.checked } : x)) })}
                    className="mt-1 size-5 flex-none accent-bordo"
                  />
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13px] text-cinza">você ainda não criou estantes próprias. lidos, lendo e quero ler aparecem no seu perfil.</p>
        )}
      </section>

      <p className="text-[12px] text-cinza">
        conta, senha e seus dados ficam em{" "}
        <Link href="/perfil/configuracoes" className="font-semibold text-bordo underline-offset-4 hover:underline">
          configurações
        </Link>
        .
      </p>
    </div>
  );
}

export default function EditarPerfilPage() {
  const hidratado = useHidratado();
  const p = usePerfil();
  if (!hidratado) return <AppShell aba="perfil">{null}</AppShell>;
  return (
    <Formulario
      inicial={{
        nome: p.nome,
        usuario: p.usuario,
        frase: p.frase,
        meta: p.meta,
        tema: p.tema,
        foto: p.foto,
        capa: p.capa,
        capaImagem: p.capaImagem,
        capaPosY: p.capaPosY ?? 50,
        aparencia: p.aparencia ?? "claro",
        estiloEstante: p.estiloEstante ?? "auto",
        decoracao: p.decoracao ?? null,
        temaSoNoPerfil: !!p.temaSoNoPerfil,
        publicarNoFeed: p.publicarNoFeed ?? true,
        estantesProprias: p.estantesProprias ?? [],
      }}
    />
  );
}
