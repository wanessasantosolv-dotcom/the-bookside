"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CapaAuto } from "@/components/CapaAuto";
import { useClube } from "@/components/clube/ClubeContexto";
import { PrateleiraMadeira } from "@/components/estantes/Biblioteca";
import { Vazio } from "@/components/social/Estados";
import { editarClube, livrosDoClube, organiza } from "@/lib/clubes";
import { Emblema, IconeSimbolo } from "@/components/clube/Emblema";
import { CampoCapa } from "@/components/clube/CampoCapa";
import { CampoFoto } from "@/components/clube/CampoFoto";
import { Ornamento } from "@/components/clube/Ornamento";
import {
  ESTANTES,
  FAMILIAS,
  FORMATOS_EMBLEMA,
  LUGARES_PADRAO,
  NOME_ESTANTE,
  NOME_FAMILIA,
  NOME_FORMATO,
  NOME_LUGAR,
  NOME_MODULO,
  NOME_PADRAO,
  NOME_SIMBOLO,
  PADROES,
  PAPEIS_COR,
  SIMBOLOS,
  TITULOS,
  cabecalhoDe,
  cartoesDe,
  corDaEstante,
  decoracaoDe,
  emblemaDe,
  familiaDe,
  modulosDe,
  misturar,
  padraoCss,
  padraoDe,
  tituloDe,
  type ChaveTitulo,
  type ConfigPadrao,
  type Emblema as TipoEmblema,
  CAMPOS_PALETA,
  TEMAS_CLUBE,
  TIPOGRAFIAS,
  ehHex,
  estiloDaIdentidade,
  guardarIdentidadeEmCache,
  identidadeInicial,
  lerIdentidade,
  paletaDe,
  temaDoId,
  verificarContraste,
  type Identidade,
  type Paleta,
  type TemaClubeId,
} from "@/lib/identidade";
import { temas } from "@/lib/dados";
import { useConsulta } from "@/lib/social";

type Categoria = "tema" | "cores" | "tipografia" | "banner" | "emblema" | "patterns" | "elementos" | "estantes" | "layout" | "titulos";
type Contexto = "inicio" | "leitura" | "estante";

const fixo = {
  // o editor em si usa as cores do the bookside, para não se confundir com a prévia
  painel: "bg-[#F9F5EE] text-[#2B1420]",
};

/** a prévia: os mesmos tokens que o clube publicado usa, em peças representativas */
function Previa({
  ident,
  contexto,
  dispositivo,
  nome,
  descricao,
  foto,
  capa,
  livro,
  lidos,
}: {
  ident: Identidade;
  contexto: Contexto;
  dispositivo: "desktop" | "mobile";
  nome: string;
  descricao: string | null;
  foto?: string | null;
  capa: string | null;
  livro: { id: string; titulo: string; autor: string; capa?: string } | null;
  lidos: { id: string; titulo: string; autor: string; capa?: string }[];
}) {
  const t = temaDoId(ident.tema);
  const tipo = TIPOGRAFIAS.find((x) => x.id === (ident.tipografia ?? t.tipografia))!;
  const mobile = dispositivo === "mobile";
  const layout = cabecalhoDe(ident);
  const paleta = paletaDe(ident);
  const comEmblema = ident.emblema?.noAvatar || !foto;
  const pd = padraoDe(ident);
  const faixa = !!ident.padrao && pd.onde.includes("faixa");
  const grande = contexto === "inicio" && layout !== "compact";
  return (
    <div
      style={estiloDaIdentidade(ident)}
      data-titulo={tipo.italico ? undefined : "reto"}
      data-estante={ident.estante?.estilo}
      className={`clube-tokens clube-identidade mx-auto overflow-hidden border border-black/10 bg-creme text-ameixa shadow-[0_20px_40px_-30px_rgba(0,0,0,.5)] transition-[max-width] duration-300 motion-reduce:transition-none ${mobile ? "max-w-[360px] rounded-[22px]" : "max-w-full rounded-[6px]"}`}
    >
      {grande ? (
        <div
          className={`${mobile ? "h-[96px]" : "h-[120px]"} bg-cover bg-center`}
          style={capa ? { backgroundImage: `url("${capa}")` } : { background: "var(--club-banner)" }}
        />
      ) : null}
      <div className={`flex gap-3 px-5 ${grande ? "-mt-7" : "pt-5"} ${grande && layout === "centered" ? "flex-col items-center text-center" : "items-center"}`}>
        {comEmblema ? (
          <Emblema e={emblemaDe(ident, nome)} paleta={paleta} tamanho={grande ? 68 : 40} className="flex-none" />
        ) : foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="" className={`${grande ? "size-16 border-4 border-creme" : "size-10"} flex-none rounded-full object-cover`} />
        ) : (
          <span className={`${grande ? "size-16 border-4 border-creme text-[28px]" : "size-10 text-[18px]"} flex flex-none items-center justify-center rounded-full bg-rosa-fundo font-revista text-bordo italic`}>
            {nome.charAt(0).toLowerCase()}
          </span>
        )}
        <div className={`min-w-0 ${grande && layout !== "centered" ? "pt-7" : ""}`}>
          <p className={`truncate font-revista leading-tight text-bordo italic ${mobile ? "text-[22px]" : "text-[28px]"}`}>{nome}</p>
          {contexto === "inicio" && descricao ? <p className="truncate text-[12px] text-tinta-suave">{descricao}</p> : null}
        </div>
      </div>
      {faixa ? <div aria-hidden className="faixa-clube mx-5 mt-3 h-2.5" /> : null}
      <div className="mt-4 flex gap-5 border-b border-linha px-5 text-[12px]">
        {["início", "leitura atual", "estante", "agenda", "membros"].slice(0, mobile ? 4 : 5).map((a, i) => {
          const on = (contexto === "inicio" && i === 0) || (contexto === "leitura" && i === 1) || (contexto === "estante" && i === 2);
          return (
            <span key={a} className={`-mb-px border-b-2 pb-2 ${on ? "border-bordo font-semibold text-bordo" : "border-transparent text-cinza"}`}>
              {a}
            </span>
          );
        })}
      </div>

      <div className={`px-5 py-5 ${mobile ? "" : "grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-6"}`}>
        {contexto === "estante" ? (
          <div className={mobile ? "" : "col-span-2"}>
            <p className="flex items-center gap-2 font-revista text-[22px] text-bordo italic">
              {tituloDe(ident, "estante")} <Ornamento ident={ident} />
            </p>
            <p className="text-[12px] text-cinza">{lidos.length} {lidos.length === 1 ? "livro lido" : "livros lidos"}</p>
            <div className="mt-4 flex items-end gap-2 overflow-hidden px-3">
              {(lidos.length ? lidos : livro ? [livro] : []).slice(0, mobile ? 4 : 8).map((l) => (
                <CapaAuto key={l.id} livro={l} className="w-[54px] flex-none [&>span:last-child]:hidden" />
              ))}
            </div>
            <PrateleiraMadeira className="-mt-[5px]" />
            <div className="mt-4 flex gap-2">
              <span className="rounded-pill border border-bordo px-3 py-1.5 text-[11px] font-semibold text-bordo">editar estante</span>
              <span className="rounded-pill bg-bordo px-3 py-1.5 text-[11px] font-semibold text-creme">+ sugerir livro</span>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-4">
              {livro ? <CapaAuto livro={livro} className="w-[72px] flex-none [&>span:last-child]:hidden" /> : <span className="h-[108px] w-[72px] flex-none rounded-[3px] bg-rosa-fundo" />}
              <div className="min-w-0">
                <p className="font-mono text-[10px] tracking-[.14em] text-bordo uppercase">nossa leitura atual.</p>
                <p className="mt-1 font-revista text-[19px] leading-tight text-ameixa italic">{livro?.titulo ?? "a próxima leitura"}</p>
                <p className="text-[12px] text-tinta-suave">{livro?.autor ?? "definam o próximo livro"}</p>
                <div className="mt-3">
                  <p className="flex justify-between text-[11px]">
                    <span className="font-semibold">minha leitura</span>
                    <span className="text-bordo">42%</span>
                  </p>
                  <span className="mt-1 block h-[5px] rounded-full" style={{ background: "var(--club-progress-track)" }}>
                    <span className="block h-full w-[42%] rounded-full" style={{ background: "var(--club-progress-fill)" }} />
                  </span>
                </div>
                <span className="mt-3 inline-flex rounded-pill bg-bordo px-4 py-2 text-[11px] font-semibold text-creme">registrar leitura</span>
              </div>
            </div>
            <div className={mobile ? "mt-6" : ""}>
              {contexto === "leitura" ? (
                <div className="cartao-clube p-4">
                  <p className="font-revista text-[17px] text-bordo italic">o veredito final.</p>
                  <p className="mt-1 font-revista text-[34px] leading-none text-bordo">4,2</p>
                  {[["chart-1", 70], ["chart-2", 45], ["chart-3", 25]].map(([c, w]) => (
                    <span key={c} className="mt-1.5 block h-[6px] rounded-full" style={{ background: "var(--club-progress-track)" }}>
                      <span className="block h-full rounded-full" style={{ width: `${w}%`, background: `var(--club-${c})` }} />
                    </span>
                  ))}
                  <p className="mt-2 text-[10px] text-cinza">exemplo de gráfico com as cores do clube</p>
                </div>
              ) : (
                <div>
                  <p className="flex items-center gap-2 border-b border-linha pb-1.5 font-revista text-[17px] text-bordo italic">
                    {tituloDe(ident, "favoritos")} <Ornamento ident={ident} />
                  </p>
                  <div className="mt-3 flex items-end gap-2 px-2">
                    {(lidos.length ? lidos : livro ? [livro] : []).slice(0, 3).map((l) => (
                      <CapaAuto key={l.id} livro={l} className="w-[46px] flex-none [&>span:last-child]:hidden" />
                    ))}
                  </div>
                  <PrateleiraMadeira className="-mt-[5px]" />
                  <p className="cartao-clube mt-3 px-3 py-2 text-[11px] text-ameixa">{tituloDe(ident, "encontro")} · exemplo</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Amostra({ cor, tamanho = 18 }: { cor: string; tamanho?: number }) {
  return <span aria-hidden className="inline-block flex-none rounded-full border border-black/10" style={{ width: tamanho, height: tamanho, background: cor }} />;
}

export default function ClubStudioPage() {
  const { clube, papel, recarregar } = useClube();
  const router = useRouter();
  const publicada = useMemo(() => lerIdentidade(clube.identidade), [clube.identidade]);
  const corAntiga = temas.find((t) => t.id === clube.tema)?.texto ?? null;
  const [ident, setIdent] = useState<Identidade>(() => publicada ?? identidadeInicial(corAntiga));
  const [categoria, setCategoria] = useState<Categoria>("tema");
  const [contexto, setContexto] = useState<Contexto>("inicio");
  const [dispositivo, setDispositivo] = useState<"desktop" | "mobile">("desktop");
  const [vistaMobile, setVistaMobile] = useState<"editar" | "previa">("editar");
  const [foto, setFoto] = useState<string | null>(clube.foto ?? null);
  const [capa, setCapa] = useState<string | null>(clube.capa);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const livros = useConsulta(() => livrosDoClube(clube.id).catch(() => []), [clube.id]);
  const atual = livros.dados?.find((l) => l.estado === "lendo")?.livro ?? null;
  const lidos = (livros.dados ?? []).filter((l) => l.estado === "lido").map((l) => l.livro);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) setDispositivo("mobile");
  }, []);

  if (!organiza(papel) || papel !== "moderadora")
    return (
      <div className="px-6 pt-8 lg:px-0">
        <Vazio titulo="só quem organiza pode personalizar o clube" texto="a identidade visual vale para todos os membros." acao={{ href: `/clubes/${clube.id}`, rotulo: "voltar ao clube" }} />
      </div>
    );

  const paleta = paletaDe(ident);
  const alertas = verificarContraste(paleta);
  const graves = alertas.filter((a) => a.grave);
  const tema = temaDoId(ident.tema);
  const mudouFotos = foto !== (clube.foto ?? null) || capa !== clube.capa;
  const mudou = JSON.stringify(ident) !== JSON.stringify(publicada ?? identidadeInicial(corAntiga)) || !publicada || mudouFotos;

  const padrao = padraoDe(ident);
  const emblema = emblemaDe(ident, clube.nome);
  // sem foto, o emblema aparece de qualquer jeito
  const usaEmblema = !!ident.emblema?.noAvatar || !foto;
  const modulos = modulosDe(ident);
  function mudarPadrao(x: Partial<ConfigPadrao>) {
    setIdent({ ...ident, padrao: { ...padrao, ...x } });
  }
  function mudarEmblema(x: Partial<TipoEmblema>) {
    // quem mexe no emblema quer vê-lo: passa a ser o avatar (dá para voltar à foto)
    setIdent({ ...ident, emblema: { ...emblema, noAvatar: true, ...x } });
  }
  function mudarTitulo(k: ChaveTitulo, v: string) {
    const titulos = { ...(ident.titulos ?? {}) };
    if (!v.trim() || v === TITULOS[k][0]) delete titulos[k];
    else titulos[k] = v;
    setIdent({ ...ident, titulos });
  }
  function mover(i: number, d: -1 | 1) {
    const ordem = [...modulos.ordem];
    [ordem[i], ordem[i + d]] = [ordem[i + d], ordem[i]];
    setIdent({ ...ident, modulos: { ...modulos, ordem } });
  }

  function escolherTema(id: TemaClubeId) {
    if (id === ident.tema && ident.modo === "tema") return;
    // só pergunta quando há cores mexidas à mão (o modo simples inicial vem da cor antiga do clube)
    const personalizadas = ident.modo === "avancado" ? Object.keys(ident.cores ?? {}).length : 0;
    if (personalizadas && !confirm(`trocar para ${temaDoId(id).nome}? as cores personalizadas serão substituídas pelas do tema. emblema, patterns, layout e títulos continuam.`)) return;
    // troca só a paleta: emblema, patterns, estantes, layout e títulos continuam
    setIdent({ ...ident, tema: id, modo: "tema", simples: undefined, cores: undefined });
  }
  function mudarCor(campo: keyof Paleta, valor: string) {
    const base = paletaDe(ident);
    const cores = ident.modo === "avancado" ? { ...(ident.cores ?? {}) } : ident.modo === "simples" ? { ...base } : {};
    cores[campo] = valor.toUpperCase();
    setIdent({ ...ident, modo: "avancado", cores, simples: undefined });
  }
  function restaurarCor(campo: keyof Paleta) {
    const cores = { ...(ident.cores ?? {}) };
    delete cores[campo];
    setIdent({ ...ident, cores });
  }
  async function salvar() {
    if (graves.length) return setMsg({ tipo: "erro", texto: "ajuste os alertas de contraste antes de salvar: algumas partes ficariam ilegíveis." });
    setSalvando(true);
    setMsg(null);
    try {
      await editarClube(clube.id, { identidade: ident, ...(mudouFotos ? { foto, capa } : {}) });
      guardarIdentidadeEmCache(clube.id, ident);
      recarregar();
      setMsg({ tipo: "ok", texto: "identidade salva. todos os membros já veem o clube assim." });
    } catch (x) {
      const c = (x as { code?: string })?.code;
      setMsg({
        tipo: "erro",
        texto:
          c === "PGRST204" || c === "42703"
            ? "o banco ainda não tem o ateliê do clube: rode o arquivo supabase/atualizacao-2026-11-club-studio.sql no SQL Editor do Supabase."
            : "não foi possível salvar agora. tente de novo.",
      });
    } finally {
      setSalvando(false);
    }
  }
  async function voltarAoAntigo() {
    if (!confirm("voltar ao visual antigo do clube? a identidade do ateliê sai e o clube volta a usar só a cor de destaque.")) return;
    setSalvando(true);
    try {
      await editarClube(clube.id, { identidade: null });
      guardarIdentidadeEmCache(clube.id, null);
      recarregar();
      router.push(`/clubes/${clube.id}`);
    } catch {
      setMsg({ tipo: "erro", texto: "não foi possível restaurar agora." });
      setSalvando(false);
    }
  }

  const chip = (on: boolean) =>
    `inline-flex min-h-10 flex-none items-center rounded-pill border px-4 text-[13px] font-semibold ${on ? "border-[#692536] bg-[#692536] text-[#F9F5EE]" : "border-[#E6D5CE] text-[#2B1420] hover:border-[#692536]"}`;
  const titulo = "text-[22px] italic text-[#692536] [font-family:var(--font-fraunces),Georgia,serif]";

  const editor = (
    <div className="space-y-8">
      {/* categorias */}
      <nav aria-label="categorias" className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:px-0">
        {(
          [
            ["tema", "tema"],
            ["cores", "cores"],
            ["tipografia", "tipografia"],
            ["banner", "banner"],
            ["emblema", "avatar e emblema"],
            ["patterns", "patterns"],
            ["elementos", "elementos gráficos"],
            ["estantes", "estantes"],
            ["layout", "layout"],
          ] as const
        ).map(([id, n]) => (
          <button key={id} type="button" aria-pressed={categoria === id} onClick={() => { setCategoria(id); if (id === "estantes") setContexto("estante"); }} className={chip(categoria === id)}>
            {n}
          </button>
        ))}
      </nav>

      {categoria === "tema" ? (
        <section aria-labelledby="t-temas">
          <h2 id="t-temas" className={titulo}>
            escolha um tema
          </h2>
          <p className="mt-1 text-[13px] text-[#5A4A50]">cada tema muda fundo, superfícies, títulos, estantes e banner. as funcionalidades continuam as mesmas.</p>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {TEMAS_CLUBE.map((t) => {
              const on = ident.tema === t.id;
              const fam = TIPOGRAFIAS.find((x) => x.id === t.tipografia)!;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => escolherTema(t.id)}
                    className={`block w-full overflow-hidden rounded-[6px] border-2 text-left transition-transform hover:-translate-y-0.5 motion-reduce:transition-none ${on ? "border-[#692536]" : "border-transparent"}`}
                    style={{ background: t.paleta.fundo, color: t.paleta.texto }}
                  >
                    <span className="block h-[46px]" style={{ background: t.banner }} />
                    <span className="block px-3 pt-2 pb-3">
                      <span className="block text-[18px] leading-tight" style={{ fontFamily: fam.familia, fontStyle: fam.italico ? "italic" : "normal", color: t.paleta.primaria, fontWeight: fam.peso }}>
                        {t.nome}
                      </span>
                      <span className="mt-0.5 block text-[11px] opacity-80">{t.descricao}</span>
                      <span className="mt-2 flex gap-1">
                        {[t.paleta.primaria, t.paleta.complementar, t.paleta.destaque, t.paleta.estante].map((c, i) => (
                          <Amostra key={i} cor={c} tamanho={14} />
                        ))}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {categoria === "cores" ? (
        <section aria-labelledby="t-cores" className="space-y-6">
          <div>
            <h2 id="t-cores" className={titulo}>
              cores
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={ident.modo !== "avancado"}
                onClick={() =>
                  setIdent({
                    ...ident,
                    modo: "simples",
                    cores: undefined,
                    simples: ident.simples ?? { principal: paleta.primaria, complementar: paleta.complementar, escuro: tema.escuro },
                  })
                }
                className={chip(ident.modo !== "avancado")}
              >
                simples
              </button>
              <button type="button" aria-pressed={ident.modo === "avancado"} onClick={() => setIdent({ ...ident, modo: "avancado", cores: ident.modo === "avancado" ? ident.cores : { ...paleta }, simples: undefined })} className={chip(ident.modo === "avancado")}>
                avançado
              </button>
            </div>
          </div>
          {ident.modo !== "avancado" ? (
            <div className="space-y-4">
              <p className="text-[13px] text-[#5A4A50]">escolha duas cores e a atmosfera: o resto da paleta é gerado com contraste garantido.</p>
              {(
                [
                  ["principal", "cor principal"],
                  ["complementar", "cor complementar"],
                ] as const
              ).map(([k, n]) => {
                const s = ident.simples ?? { principal: tema.paleta.primaria, complementar: tema.paleta.complementar, escuro: tema.escuro };
                return (
                  <label key={k} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={s[k]}
                      onChange={(e) => setIdent({ ...ident, modo: "simples", simples: { ...s, [k]: e.target.value.toUpperCase() } })}
                      className="size-11 flex-none cursor-pointer rounded-[4px] border border-[#E6D5CE] bg-transparent"
                    />
                    <span className="min-w-0 flex-1 text-[14px]">{n}</span>
                    <input
                      value={s[k]}
                      onChange={(e) => ehHex(e.target.value) && setIdent({ ...ident, modo: "simples", simples: { ...s, [k]: e.target.value.toUpperCase() } })}
                      aria-label={`${n} em hexadecimal`}
                      className="h-10 w-[100px] rounded-[4px] border border-[#E6D5CE] bg-white px-2 font-mono text-[13px] uppercase"
                    />
                  </label>
                );
              })}
              <div className="flex gap-2">
                {(
                  [
                    [false, "atmosfera clara"],
                    [true, "atmosfera escura"],
                  ] as const
                ).map(([v, n]) => {
                  const s = ident.simples ?? { principal: tema.paleta.primaria, complementar: tema.paleta.complementar, escuro: tema.escuro };
                  return (
                    <button key={n} type="button" aria-pressed={s.escuro === v} onClick={() => setIdent({ ...ident, modo: "simples", simples: { ...s, escuro: v } })} className={chip(s.escuro === v)}>
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-[#EFE4DE] border-y border-[#EFE4DE]">
              {CAMPOS_PALETA.map(({ id, nome }) => {
                const personalizada = !!ident.cores?.[id] && ident.cores[id] !== tema.paleta[id];
                return (
                  <li key={id} className="flex items-center gap-3 py-2">
                    <input
                      type="color"
                      value={paleta[id]}
                      onChange={(e) => mudarCor(id, e.target.value)}
                      aria-label={nome}
                      className="size-10 flex-none cursor-pointer rounded-[4px] border border-[#E6D5CE] bg-transparent"
                    />
                    <span className="min-w-0 flex-1 text-[14px]">{nome}</span>
                    <input
                      value={paleta[id]}
                      onChange={(e) => ehHex(e.target.value) && mudarCor(id, e.target.value)}
                      aria-label={`${nome} em hexadecimal`}
                      className="h-9 w-[92px] rounded-[4px] border border-[#E6D5CE] bg-white px-2 font-mono text-[12px] uppercase"
                    />
                    <button
                      type="button"
                      disabled={!personalizada}
                      onClick={() => restaurarCor(id)}
                      aria-label={`restaurar ${nome}`}
                      title="restaurar padrão do tema"
                      className="grid size-9 place-items-center rounded-full text-[15px] text-[#692536] disabled:opacity-25"
                    >
                      ↺
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {alertas.length ? (
            <ul className="space-y-2">
              {alertas.map((a, i) => (
                <li key={i} className={`flex flex-wrap items-center gap-2 rounded-[4px] px-3 py-2 text-[13px] ${a.grave ? "bg-[#F6E3E7] text-[#6B0D24]" : "bg-[#FBF1DD] text-[#6E5106]"}`}>
                  <span className="min-w-0 flex-1">{a.texto}</span>
                  <button type="button" onClick={() => mudarCor(a.campo, a.sugestao)} className="inline-flex items-center gap-1.5 font-semibold underline-offset-2 hover:underline">
                    <Amostra cor={a.sugestao} tamanho={14} /> ajustar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] text-[#4E6B3F]">contraste ok: textos, títulos e botões ficam legíveis.</p>
          )}
        </section>
      ) : null}

      {categoria === "tipografia" ? (
        <section aria-labelledby="t-tipo">
          <h2 id="t-tipo" className={titulo}>
            tipografia
          </h2>
          <p className="mt-1 text-[13px] text-[#5A4A50]">vale para o nome do clube, títulos e números editoriais. textos longos e botões continuam na fonte do app.</p>
          <ul className="mt-4 space-y-2">
            {TIPOGRAFIAS.map((t) => {
              const on = (ident.tipografia ?? tema.tipografia) === t.id;
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => setIdent({ ...ident, tipografia: t.id })}
                    className={`flex w-full items-baseline justify-between gap-3 rounded-[4px] border px-4 py-3 text-left ${on ? "border-[#692536] bg-white" : "border-[#E6D5CE]"}`}
                  >
                    <span className="text-[24px] leading-none" style={{ fontFamily: t.familia, fontStyle: t.italico ? "italic" : "normal", fontWeight: t.peso }}>
                      {clube.nome}
                    </span>
                    <span className="flex-none text-[11px] text-[#7A6A6E]">
                      {t.nome}
                      {t.id === tema.tipografia ? " · do tema" : ""}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {categoria === "banner" ? (
        <section aria-labelledby="t-banner" className="space-y-4">
          <h2 id="t-banner" className={titulo}>
            banner
          </h2>
          <p className="text-[13px] text-[#5A4A50]">
            {capa
              ? "com foto de capa, ela é o banner. a troca de tema não mexe nela. tire a foto para usar o banner gráfico do tema."
              : "sem foto de capa, o banner usa a composição gráfica do tema. dá para colocar um pattern por cima."}
          </p>
          <div className="rounded-[6px] border border-[#E6D5CE] bg-white/60 p-4">
            <CampoCapa valor={capa} onMudar={setCapa} />
          </div>
          <fieldset>
            <legend className="mb-2 text-[12px] font-semibold text-[#5A4A50]">pattern do banner gráfico</legend>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {PADROES.map((pt) => {
                const on = (pt === "nenhum" ? !ident.padrao || !padrao.onde.includes("banner") : !!ident.padrao && padrao.onde.includes("banner") && padrao.tipo === pt);
                return (
                  <button
                    key={pt}
                    type="button"
                    aria-pressed={on}
                    title={NOME_PADRAO[pt]}
                    onClick={() =>
                      pt === "nenhum"
                        ? mudarPadrao({ onde: padrao.onde.filter((x) => x !== "banner") })
                        : mudarPadrao({ tipo: pt, onde: [...new Set([...padrao.onde, "banner" as const])] })
                    }
                    className={`overflow-hidden rounded-[6px] border-2 text-left text-[10px] ${on ? "border-[#692536]" : "border-transparent"}`}
                  >
                    <span className="block h-10" style={{ background: `${padraoCss(pt, paleta[padrao.cor], padrao.escala, Math.max(0.3, padrao.intensidade)) ?? "none"}, ${misturar(paleta.complementar, paleta.fundo, 0.35)}` }} />
                    <span className="block truncate bg-white px-1.5 py-1">{NOME_PADRAO[pt]}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[12px] text-[#7A6A6E]">cor, escala e intensidade ficam em patterns.</p>
          </fieldset>
          <label className="hidden">
            <input
              type="checkbox"
              checked={padrao.onde.includes("banner") && !!ident.padrao}
              onChange={(e) => mudarPadrao({ onde: e.target.checked ? [...new Set([...padrao.onde, "banner" as const])] : padrao.onde.filter((x) => x !== "banner") })}
              className="size-4 accent-[#692536]"
            />
            usar o pattern do clube no banner gráfico
          </label>
          <div className="h-[90px] rounded-[6px] border border-black/10" style={{ background: estiloDaIdentidade(ident)["--club-banner" as keyof React.CSSProperties] as string }} />
        </section>
      ) : null}

      {categoria === "emblema" ? (
        <section aria-labelledby="t-emblema" className="space-y-5">
          <h2 id="t-emblema" className={titulo}>
            avatar e emblema
          </h2>
          <fieldset>
            <legend className="mb-2 text-[12px] font-semibold text-[#5A4A50]">o que aparece como avatar do clube</legend>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                aria-pressed={!usaEmblema}
                onClick={() => setIdent({ ...ident, emblema: { ...emblema, noAvatar: false } })}
                className={`flex flex-col items-center gap-2 rounded-[6px] border-2 p-3 text-[13px] font-semibold ${!usaEmblema ? "border-[#692536] bg-white" : "border-[#E6D5CE]"}`}
              >
                {foto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={foto} alt="" className="size-16 rounded-full object-cover" />
                ) : (
                  <span className="grid size-16 place-items-center rounded-full border border-dashed border-[#B9A6A0] text-[11px] font-normal text-[#7A6A6E]">sem foto</span>
                )}
                foto do clube
              </button>
              <button
                type="button"
                aria-pressed={usaEmblema}
                onClick={() => setIdent({ ...ident, emblema: { ...emblema, noAvatar: true } })}
                className={`flex flex-col items-center gap-2 rounded-[6px] border-2 p-3 text-[13px] font-semibold ${usaEmblema ? "border-[#692536] bg-white" : "border-[#E6D5CE]"}`}
              >
                <Emblema e={emblema} paleta={paleta} tamanho={64} />
                emblema
              </button>
            </div>
          </fieldset>
          {!usaEmblema ? (
            <div className="rounded-[6px] border border-[#E6D5CE] bg-white/60 p-4">
              <CampoFoto valor={foto} onMudar={setFoto} />
              <p className="mt-2 text-[12px] text-[#7A6A6E]">{foto ? "a foto vale para todos os membros depois de salvar." : "sem foto, o clube mostra o emblema."}</p>
            </div>
          ) : (
            <p className="text-[12px] text-[#7A6A6E]">monte o emblema abaixo. a foto continua guardada, caso queira voltar.</p>
          )}
          <fieldset>
            <legend className="mb-2 text-[12px] font-semibold text-[#5A4A50]">formato</legend>
            <div className="flex flex-wrap gap-2">
              {FORMATOS_EMBLEMA.map((f) => (
                <button key={f} type="button" aria-pressed={emblema.formato === f} onClick={() => mudarEmblema({ formato: f })} className={`flex flex-col items-center gap-1 rounded-[6px] border p-2 text-[11px] ${emblema.formato === f ? "border-[#692536] bg-white" : "border-[#E6D5CE]"}`}>
                  <Emblema e={{ ...emblema, formato: f, ano: undefined }} paleta={paleta} tamanho={44} />
                  {NOME_FORMATO[f]}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-4">
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[#5A4A50]">iniciais ou monograma</span>
              <input value={emblema.texto} maxLength={4} onChange={(e) => mudarEmblema({ texto: e.target.value.replace(/[<>{}]/g, "") })} className="h-11 w-[120px] rounded-[4px] border border-[#E6D5CE] bg-white px-3 text-[15px]" />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-[#5A4A50]">ano de criação (opcional)</span>
              <input
                inputMode="numeric"
                value={emblema.ano ?? ""}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/\D/g, "").slice(0, 4));
                  mudarEmblema({ ano: n > 1900 && n < 2200 ? n : undefined });
                }}
                placeholder={String(new Date(clube.criado_em).getFullYear())}
                className="h-11 w-[120px] rounded-[4px] border border-[#E6D5CE] bg-white px-3 text-[15px]"
              />
            </label>
          </div>
          <fieldset>
            <legend className="mb-2 text-[12px] font-semibold text-[#5A4A50]">símbolo</legend>
            <div className="flex flex-wrap gap-2">
              {SIMBOLOS.map((sb) => (
                <button key={sb} type="button" aria-pressed={emblema.simbolo === sb} title={NOME_SIMBOLO[sb]} onClick={() => mudarEmblema({ simbolo: sb })} className={`grid size-12 place-items-center rounded-[6px] border ${emblema.simbolo === sb ? "border-[#692536] bg-white" : "border-[#E6D5CE]"}`}>
                  {sb === "nenhum" ? (
                    <span className="text-[11px] text-[#7A6A6E]">—</span>
                  ) : (
                    <svg viewBox="0 0 100 100" width="34" height="34" aria-hidden>
                      <IconeSimbolo s={sb} cor="#2B1420" tamanho={60} />
                    </svg>
                  )}
                  <span className="sr-only">{NOME_SIMBOLO[sb]}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-6">
            {(
              [
                ["fundo", "cor de fundo"],
                ["tinta", "cor do texto e do símbolo"],
              ] as const
            ).map(([k, n]) => (
              <fieldset key={k}>
                <legend className="mb-2 text-[12px] font-semibold text-[#5A4A50]">{n}</legend>
                <div className="flex gap-1.5">
                  {PAPEIS_COR.map((pc) => (
                    <button key={pc} type="button" aria-pressed={emblema[k] === pc} aria-label={pc} onClick={() => mudarEmblema({ [k]: pc })} className={`rounded-full p-0.5 ${emblema[k] === pc ? "ring-2 ring-[#692536]" : ""}`}>
                      <Amostra cor={paleta[pc]} tamanho={24} />
                    </button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
        </section>
      ) : null}

      {categoria === "patterns" ? (
        <section aria-labelledby="t-padroes" className="space-y-5">
          <h2 id="t-padroes" className={titulo}>
            patterns
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {PADROES.map((pt) => (
              <button key={pt} type="button" aria-pressed={padrao.tipo === pt} onClick={() => mudarPadrao({ tipo: pt })} className={`overflow-hidden rounded-[6px] border text-left text-[11px] ${padrao.tipo === pt ? "border-[#692536]" : "border-[#E6D5CE]"}`}>
                <span className="block h-12" style={{ background: `${padraoCss(pt, paleta[padrao.cor], padrao.escala, Math.max(0.3, padrao.intensidade)) ?? "none"}, ${paleta.fundo}` }} />
                <span className="block bg-white px-2 py-1">{NOME_PADRAO[pt]}</span>
              </button>
            ))}
          </div>
          <fieldset>
            <legend className="mb-2 text-[12px] font-semibold text-[#5A4A50]">cor</legend>
            <div className="flex gap-1.5">
              {PAPEIS_COR.map((pc) => (
                <button key={pc} type="button" aria-pressed={padrao.cor === pc} aria-label={pc} onClick={() => mudarPadrao({ cor: pc })} className={`rounded-full p-0.5 ${padrao.cor === pc ? "ring-2 ring-[#692536]" : ""}`}>
                  <Amostra cor={paleta[pc]} tamanho={24} />
                </button>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap items-center gap-6">
            <fieldset>
              <legend className="mb-2 text-[12px] font-semibold text-[#5A4A50]">escala</legend>
              <div className="flex gap-1.5">
                {([1, 2, 3] as const).map((e) => (
                  <button key={e} type="button" aria-pressed={padrao.escala === e} onClick={() => mudarPadrao({ escala: e })} className={chip(padrao.escala === e)}>
                    {e === 1 ? "pequena" : e === 2 ? "média" : "grande"}
                  </button>
                ))}
              </div>
            </fieldset>
            <label className="block min-w-[200px] flex-1">
              <span className="mb-2 block text-[12px] font-semibold text-[#5A4A50]">intensidade</span>
              <input type="range" min={4} max={60} value={Math.round(padrao.intensidade * 100)} onChange={(e) => mudarPadrao({ intensidade: Number(e.target.value) / 100 })} className="w-full accent-[#692536]" />
            </label>
          </div>
          <fieldset>
            <legend className="mb-2 text-[12px] font-semibold text-[#5A4A50]">onde aplicar</legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {LUGARES_PADRAO.map((l) => (
                <label key={l} className="flex items-center gap-2 text-[14px]">
                  <input type="checkbox" checked={padrao.onde.includes(l)} onChange={(e) => mudarPadrao({ onde: e.target.checked ? [...padrao.onde, l] : padrao.onde.filter((x) => x !== l) })} className="size-4 accent-[#692536]" />
                  {NOME_LUGAR[l]}
                </label>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-[#7A6A6E]">o pattern nunca vai atrás de textos longos. estados vazios e cards comemorativos ganham o pattern nas próximas telas que usarem esses espaços.</p>
          </fieldset>
        </section>
      ) : null}

      {categoria === "elementos" ? (
        <section aria-labelledby="t-elementos" className="space-y-5">
          <h2 id="t-elementos" className={titulo}>
            elementos gráficos
          </h2>
          <fieldset>
            <legend className="mb-2 text-[12px] font-semibold text-[#5A4A50]">família visual</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FAMILIAS.map((f) => (
                <button key={f} type="button" aria-pressed={familiaDe(ident) === f} onClick={() => setIdent({ ...ident, familia: f })} className={`flex flex-col items-start gap-2 rounded-[6px] border px-3 py-3 text-left text-[13px] ${familiaDe(ident) === f ? "border-[#692536] bg-white" : "border-[#E6D5CE]"}`}>
                  <span style={{ ["--club-decoration-color" as string]: paleta.primaria } as React.CSSProperties}>
                    <Ornamento ident={{ ...ident, familia: f, decoracao: "expressive" }} />
                  </span>
                  {NOME_FAMILIA[f]}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-[12px] font-semibold text-[#5A4A50]">nível de decoração</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["minimal", "minimal", "poucos elementos"],
                  ["balanced", "balanced", "equilibrado"],
                  ["expressive", "expressive", "mais presença"],
                ] as const
              ).map(([v, n, d]) => (
                <button key={v} type="button" aria-pressed={decoracaoDe(ident) === v} onClick={() => setIdent({ ...ident, decoracao: v })} className={`rounded-[6px] border px-4 py-2 text-left ${decoracaoDe(ident) === v ? "border-[#692536] bg-white" : "border-[#E6D5CE]"}`}>
                  <span className="block text-[14px] font-semibold">{n}</span>
                  <span className="block text-[11px] text-[#7A6A6E]">{d}</span>
                </button>
              ))}
            </div>
          </fieldset>
        </section>
      ) : null}

      {categoria === "estantes" ? (
        <section aria-labelledby="t-estantes" className="space-y-5">
          <h2 id="t-estantes" className={titulo}>
            estantes
          </h2>
          <p className="text-[13px] text-[#5A4A50]">muda só a aparência: capas, ordem dos livros e coleções continuam iguais.</p>
          <div className="flex flex-wrap gap-2">
            {ESTANTES.map((e) => {
              const on = (ident.estante?.estilo ?? "tema") === e;
              return (
                <button key={e} type="button" aria-pressed={on} onClick={() => setIdent({ ...ident, estante: { estilo: e, cor: ident.estante?.cor, espessura: ident.estante?.espessura ?? "padrao" } })} className={`${chip(on)} gap-2`}>
                  <Amostra cor={corDaEstante({ ...ident, estante: { estilo: e, cor: ident.estante?.cor, espessura: "padrao" } }, paleta)} tamanho={14} />
                  {NOME_ESTANTE[e]}
                </button>
              );
            })}
          </div>
          {ident.estante?.estilo === "personalizada" ? (
            <label className="flex items-center gap-3 text-[14px]">
              <input type="color" value={ident.estante.cor ?? paleta.estante} onChange={(e) => setIdent({ ...ident, estante: { ...ident.estante!, cor: e.target.value.toUpperCase() } })} className="size-11 rounded-[4px] border border-[#E6D5CE]" />
              cor da estante
            </label>
          ) : null}
          <fieldset>
            <legend className="mb-2 text-[12px] font-semibold text-[#5A4A50]">espessura</legend>
            <div className="flex gap-2">
              {(["fina", "padrao", "grossa"] as const).map((e) => (
                <button key={e} type="button" aria-pressed={(ident.estante?.espessura ?? "padrao") === e} onClick={() => setIdent({ ...ident, estante: { estilo: ident.estante?.estilo ?? "tema", cor: ident.estante?.cor, espessura: e } })} className={chip((ident.estante?.espessura ?? "padrao") === e)}>
                  {e === "padrao" ? "padrão" : e}
                </button>
              ))}
            </div>
          </fieldset>
        </section>
      ) : null}

      {categoria === "layout" ? (
        <section aria-labelledby="t-layout" className="space-y-6">
          <h2 id="t-layout" className={titulo}>
            layout
          </h2>
          <fieldset>
            <legend className="mb-2 text-[12px] font-semibold text-[#5A4A50]">cabeçalho da página inicial</legend>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["editorial", "editorial", "banner, avatar à esquerda"],
                  ["centered", "centered", "tudo centralizado"],
                  ["compact", "compact", "sem banner, foco no conteúdo"],
                ] as const
              ).map(([v, n, d]) => (
                <button key={v} type="button" aria-pressed={cabecalhoDe(ident) === v} onClick={() => setIdent({ ...ident, cabecalho: v })} className={`rounded-[6px] border px-3 py-2.5 text-left ${cabecalhoDe(ident) === v ? "border-[#692536] bg-white" : "border-[#E6D5CE]"}`}>
                  <span className="block text-[14px] font-semibold">{n}</span>
                  <span className="block text-[11px] text-[#7A6A6E]">{d}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-[#7A6A6E]">nas outras abas, o cabeçalho fica sempre compacto.</p>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-[12px] font-semibold text-[#5A4A50]">estilo dos cards</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  ["editorial", "editorial"],
                  ["paper", "paper goods"],
                  ["minimal", "minimal"],
                  ["vintage", "vintage"],
                ] as const
              ).map(([v, n]) => (
                <button key={v} type="button" aria-pressed={cartoesDe(ident) === v} onClick={() => setIdent({ ...ident, cartoes: v })} className={`rounded-[6px] border p-2 text-left text-[12px] ${cartoesDe(ident) === v ? "border-[#692536] bg-white" : "border-[#E6D5CE]"}`}>
                  <span className="cartao-clube block h-10" style={estiloDaIdentidade({ ...ident, cartoes: v })} />
                  <span className="mt-1.5 block font-semibold">{n}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-1 text-[12px] font-semibold text-[#5A4A50]">módulos da página inicial</legend>
            <p className="mb-3 text-[12px] text-[#7A6A6E]">a leitura atual fica sempre no topo. ocultar um módulo não apaga nada.</p>
            <ol className="space-y-1.5">
              {modulos.ordem.map((m, i) => {
                const oculto = modulos.ocultos.includes(m);
                return (
                  <li key={m} className={`flex items-center gap-2 rounded-[4px] border border-[#E6D5CE] bg-white px-3 py-1.5 ${oculto ? "opacity-55" : ""}`}>
                    <span className="min-w-0 flex-1 text-[14px]">{NOME_MODULO[m]}</span>
                    <button type="button" disabled={i === 0} onClick={() => mover(i, -1)} aria-label={`subir ${NOME_MODULO[m]}`} className="grid size-9 place-items-center rounded-full disabled:opacity-25">
                      ↑
                    </button>
                    <button type="button" disabled={i === modulos.ordem.length - 1} onClick={() => mover(i, 1)} aria-label={`descer ${NOME_MODULO[m]}`} className="grid size-9 place-items-center rounded-full disabled:opacity-25">
                      ↓
                    </button>
                    <button
                      type="button"
                      aria-pressed={!oculto}
                      onClick={() => setIdent({ ...ident, modulos: { ...modulos, ocultos: oculto ? modulos.ocultos.filter((x) => x !== m) : [...modulos.ocultos, m] } })}
                      className="min-h-9 px-2 text-[12px] font-semibold text-[#692536]"
                    >
                      {oculto ? "mostrar" : "ocultar"}
                    </button>
                  </li>
                );
              })}
            </ol>
            <button type="button" onClick={() => setIdent({ ...ident, modulos: undefined })} className="mt-2 min-h-10 text-[12px] font-semibold text-[#5A4A50] hover:text-[#692536]">
              restaurar organização padrão
            </button>
            <label className="mt-4 flex min-h-11 cursor-pointer items-start gap-3 text-[14px]">
              <input type="checkbox" checked={!ident.semRanking} onChange={(e) => setIdent({ ...ident, semRanking: e.target.checked ? undefined : true })} className="mt-0.5 size-5 accent-[#692536]" />
              <span>
                <b className="font-semibold">a liga dos leitores</b>
                <span className="block text-[12px] text-[#7A6A6E]">ranking e distinções em membros. desligado, o clube fica sem classificação.</span>
              </span>
            </label>
            <p className="mt-1 text-[12px] text-[#7A6A6E]">no computador, os módulos de encontro, membros e próximas leituras ficam na coluna lateral.</p>
          </fieldset>
        </section>
      ) : null}

      {categoria === "titulos" ? (
        <section aria-labelledby="t-titulos" className="space-y-5">
          <h2 id="t-titulos" className={titulo}>
            identidade verbal
          </h2>
          <p className="text-[13px] text-[#5A4A50]">troque os títulos das seções editoriais. menus, botões e avisos continuam com os nomes do app.</p>
          {(Object.keys(TITULOS) as ChaveTitulo[]).map((k) => {
            const atual = ident.titulos?.[k] ?? TITULOS[k][0];
            const proprio = !(TITULOS[k] as readonly string[]).includes(atual);
            return (
              <fieldset key={k}>
                <legend className="mb-2 text-[12px] font-semibold text-[#5A4A50]">{TITULOS[k][0]}</legend>
                <div className="flex flex-wrap gap-2">
                  {TITULOS[k].map((t) => (
                    <button key={t} type="button" aria-pressed={atual === t} onClick={() => mudarTitulo(k, t)} className={chip(atual === t)}>
                      {t}
                    </button>
                  ))}
                  <input
                    value={proprio ? atual : ""}
                    maxLength={40}
                    onChange={(e) => mudarTitulo(k, e.target.value.replace(/[<>{}]/g, ""))}
                    placeholder="título próprio"
                    aria-label={`título próprio para ${TITULOS[k][0]}`}
                    className={`h-10 w-[180px] rounded-pill border bg-white px-4 text-[13px] ${proprio ? "border-[#692536]" : "border-[#E6D5CE]"}`}
                  />
                </div>
              </fieldset>
            );
          })}
        </section>
      ) : null}
    </div>
  );

  const previa = (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1.5" role="group" aria-label="contexto da prévia">
          {(
            [
              ["inicio", "início"],
              ["leitura", "leitura"],
              ["estante", "estante"],
            ] as const
          ).map(([id, n]) => (
            <button key={id} type="button" aria-pressed={contexto === id} onClick={() => setContexto(id)} className={`h-9 rounded-pill px-3.5 text-[12px] font-semibold ${contexto === id ? "bg-[#2B1420] text-[#F9F5EE]" : "text-[#5A4A50] hover:text-[#2B1420]"}`}>
              {n}
            </button>
          ))}
        </div>
        <div className="hidden gap-1.5 lg:flex" role="group" aria-label="dispositivo">
          {(["desktop", "mobile"] as const).map((d) => (
            <button key={d} type="button" aria-pressed={dispositivo === d} onClick={() => setDispositivo(d)} className={`h-9 rounded-pill border px-3.5 text-[12px] font-semibold ${dispositivo === d ? "border-[#2B1420] text-[#2B1420]" : "border-transparent text-[#7A6A6E]"}`}>
              {d}
            </button>
          ))}
        </div>
      </div>
      <Previa ident={ident} contexto={contexto} dispositivo={dispositivo} nome={clube.nome} descricao={clube.descricao} foto={foto} capa={capa} livro={atual} lidos={lidos} />
      <p className="mt-2 text-center text-[11px] text-[#7A6A6E]">prévia privada: só você vê até salvar.</p>
    </div>
  );

  return (
    <div className={`${fixo.painel} -mx-0 min-h-[80dvh] pb-28 lg:-mx-12 lg:px-12 lg:pb-12`}>
      <header className="flex flex-wrap items-end justify-between gap-3 px-5 pt-4 pb-5 lg:px-0 lg:pt-8">
        <div>
          <Link href={`/clubes/${clube.id}`} className="inline-flex min-h-10 items-center text-[13px] font-semibold text-[#692536]">
            ← {clube.nome}
          </Link>
          <p className="text-[36px] leading-none font-semibold tracking-[-.03em] text-[#692536] italic lg:text-[48px]" style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>ateliê do clube.</p>
          <p className="mt-1.5 text-[16px] text-[#2B1420] italic" style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>do seu jeito.</p>
        </div>
        {!publicada ? (
          <p className="max-w-[320px] text-[13px] text-[#5A4A50]">escolha uma identidade que combine com seu clube. nada muda para os membros até você salvar.</p>
        ) : null}
      </header>

      {/* celular: editar ou ver a prévia */}
      <div className="mx-5 mb-5 grid grid-cols-2 rounded-pill border border-[#E6D5CE] p-1 lg:hidden" role="group" aria-label="modo">
        {(["editar", "previa"] as const).map((v) => (
          <button key={v} type="button" aria-pressed={vistaMobile === v} onClick={() => setVistaMobile(v)} className={`h-10 rounded-pill text-[13px] font-semibold ${vistaMobile === v ? "bg-[#2B1420] text-[#F9F5EE]" : "text-[#5A4A50]"}`}>
            {v === "editar" ? "editar" : "prévia"}
          </button>
        ))}
      </div>

      <div className="px-5 lg:grid lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.3fr)] lg:gap-10 lg:px-0">
        <div className={vistaMobile === "editar" ? "" : "hidden lg:block"}>{editor}</div>
        <div className={`${vistaMobile === "previa" ? "" : "hidden lg:block"} lg:sticky lg:top-6 lg:self-start`}>{previa}</div>
      </div>

      {/* ações sempre à mão */}
      <div className="fixed inset-x-0 bottom-[var(--altura-menu,0px)] z-30 mx-auto w-full max-w-[430px] border-t border-[#E6D5CE] bg-[#F9F5EE]/95 px-5 py-3 backdrop-blur lg:sticky lg:bottom-0 lg:mx-0 lg:mt-10 lg:max-w-none lg:px-0">
        {msg ? <p role="status" className={`mb-2 text-[13px] ${msg.tipo === "ok" ? "text-[#4E6B3F]" : "text-[#6B0D24]"}`}>{msg.texto}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={salvar} disabled={salvando || !mudou || graves.length > 0} className="inline-flex h-11 items-center rounded-pill bg-[#692536] px-6 text-[13px] font-semibold text-[#F9F5EE] disabled:opacity-45">
            {salvando ? "salvando…" : "salvar identidade"}
          </button>
          <button type="button" onClick={() => (setIdent(publicada ?? identidadeInicial(corAntiga)), setFoto(clube.foto ?? null), setCapa(clube.capa))} disabled={!mudou} className="inline-flex h-11 items-center rounded-pill border border-[#E6D5CE] px-4 text-[13px] font-semibold text-[#2B1420] disabled:opacity-45">
            cancelar
          </button>
          <button
            type="button"
            onClick={() => confirm("restaurar tudo para o padrão do tema? cores, tipografia, emblema, patterns, estantes, layout e títulos voltam ao original.") && setIdent({ v: 1, tema: ident.tema, modo: "tema" })}
            className="inline-flex h-11 items-center px-2 text-[13px] font-semibold text-[#5A4A50] hover:text-[#692536]"
          >
            restaurar padrão do tema
          </button>
          {publicada ? (
            <button type="button" onClick={voltarAoAntigo} className="ml-auto inline-flex h-11 items-center px-2 text-[12px] text-[#7A6A6E] underline-offset-2 hover:underline">
              voltar ao visual antigo
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
