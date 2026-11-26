"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CapaAuto } from "@/components/CapaAuto";
import { useClube } from "@/components/clube/ClubeContexto";
import { PrateleiraMadeira } from "@/components/estantes/Biblioteca";
import { Vazio } from "@/components/social/Estados";
import { editarClube, livrosDoClube, organiza } from "@/lib/clubes";
import {
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

type Categoria = "tema" | "cores" | "tipografia";
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
  return (
    <div
      style={estiloDaIdentidade(ident)}
      data-titulo={tipo.italico ? undefined : "reto"}
      className={`clube-identidade mx-auto overflow-hidden border border-black/10 bg-creme text-ameixa shadow-[0_20px_40px_-30px_rgba(0,0,0,.5)] transition-[max-width] duration-300 motion-reduce:transition-none ${mobile ? "max-w-[360px] rounded-[22px]" : "max-w-full rounded-[6px]"}`}
    >
      {contexto === "inicio" ? (
        <div
          className={`${mobile ? "h-[96px]" : "h-[120px]"} bg-cover bg-center`}
          style={capa ? { backgroundImage: `url("${capa}")` } : { background: "var(--club-banner)" }}
        />
      ) : null}
      <div className={`flex items-center gap-3 px-5 ${contexto === "inicio" ? "-mt-7" : "pt-5"}`}>
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt="" className={`${contexto === "inicio" ? "size-16 border-4 border-creme" : "size-10"} flex-none rounded-full object-cover`} />
        ) : (
          <span className={`${contexto === "inicio" ? "size-16 border-4 border-creme text-[28px]" : "size-10 text-[18px]"} flex flex-none items-center justify-center rounded-full bg-rosa-fundo font-revista text-bordo italic`}>
            {nome.charAt(0).toLowerCase()}
          </span>
        )}
        <div className={`min-w-0 ${contexto === "inicio" ? "pt-7" : ""}`}>
          <p className={`truncate font-revista leading-tight text-bordo italic ${mobile ? "text-[22px]" : "text-[28px]"}`}>{nome}</p>
          {contexto === "inicio" && descricao ? <p className="truncate text-[12px] text-tinta-suave">{descricao}</p> : null}
        </div>
      </div>
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
            <p className="font-revista text-[22px] text-bordo italic">nossa estante</p>
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
                <p className="font-mono text-[10px] tracking-[.14em] text-bordo uppercase">the current read.</p>
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
                <div className="border p-4" style={{ background: "var(--club-surface)", borderColor: "var(--club-border)", borderRadius: "var(--club-card-radius)" }}>
                  <p className="font-revista text-[17px] text-bordo italic">the final verdict.</p>
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
                  <p className="border-b border-linha pb-1.5 font-revista text-[17px] text-bordo italic">the club favorites.</p>
                  <div className="mt-3 flex items-end gap-2 px-2">
                    {(lidos.length ? lidos : livro ? [livro] : []).slice(0, 3).map((l) => (
                      <CapaAuto key={l.id} livro={l} className="w-[46px] flex-none [&>span:last-child]:hidden" />
                    ))}
                  </div>
                  <PrateleiraMadeira className="-mt-[5px]" />
                  <p className="mt-3 rounded-[4px] bg-rosa-fundo px-3 py-2 text-[11px] text-ameixa">next book date. · sáb, 14h</p>
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
  const mudou = JSON.stringify(ident) !== JSON.stringify(publicada ?? identidadeInicial(corAntiga)) || !publicada;

  function escolherTema(id: TemaClubeId) {
    if (id === ident.tema && ident.modo === "tema") return;
    const personalizadas = ident.modo === "avancado" ? Object.keys(ident.cores ?? {}).length : ident.modo === "simples" ? 2 : 0;
    if (personalizadas && !confirm(`trocar para ${temaDoId(id).nome}? as cores personalizadas serão substituídas pelas do tema. a tipografia que você escolheu continua.`)) return;
    setIdent({ v: 1, tema: id, modo: "tema", tipografia: ident.tipografia });
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
      await editarClube(clube.id, { identidade: ident });
      guardarIdentidadeEmCache(clube.id, ident);
      recarregar();
      setMsg({ tipo: "ok", texto: "identidade salva. todos os membros já veem o clube assim." });
    } catch (x) {
      const c = (x as { code?: string })?.code;
      setMsg({
        tipo: "erro",
        texto:
          c === "PGRST204" || c === "42703"
            ? "o banco ainda não tem o club studio: rode o arquivo supabase/atualizacao-2026-11-club-studio.sql no SQL Editor do Supabase."
            : "não foi possível salvar agora. tente de novo.",
      });
    } finally {
      setSalvando(false);
    }
  }
  async function voltarAoAntigo() {
    if (!confirm("voltar ao visual antigo do clube? a identidade do club studio sai e o clube volta a usar só a cor de destaque.")) return;
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
  const titulo = "font-revista text-[22px] italic text-[#692536]";

  const editor = (
    <div className="space-y-8">
      {/* categorias */}
      <nav aria-label="categorias" className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] lg:mx-0 lg:px-0">
        {(
          [
            ["tema", "tema"],
            ["cores", "cores"],
            ["tipografia", "tipografia"],
          ] as const
        ).map(([id, n]) => (
          <button key={id} type="button" aria-pressed={categoria === id} onClick={() => setCategoria(id)} className={chip(categoria === id)}>
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
      <Previa ident={ident} contexto={contexto} dispositivo={dispositivo} nome={clube.nome} descricao={clube.descricao} foto={clube.foto} capa={clube.capa} livro={atual} lidos={lidos} />
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
          <p className="font-revista text-[36px] leading-none font-semibold tracking-[-.03em] text-[#692536] italic lg:text-[48px]">club studio.</p>
          <p className="mt-1.5 font-revista text-[16px] text-[#2B1420] italic">make it yours.</p>
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
      <div className="fixed inset-x-0 bottom-[var(--altura-menu,0px)] z-30 border-t border-[#E6D5CE] bg-[#F9F5EE]/95 px-5 py-3 backdrop-blur lg:sticky lg:bottom-0 lg:mt-10 lg:px-0">
        {msg ? <p role="status" className={`mb-2 text-[13px] ${msg.tipo === "ok" ? "text-[#4E6B3F]" : "text-[#6B0D24]"}`}>{msg.texto}</p> : null}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={salvar} disabled={salvando || !mudou || graves.length > 0} className="inline-flex h-11 items-center rounded-pill bg-[#692536] px-6 text-[13px] font-semibold text-[#F9F5EE] disabled:opacity-45">
            {salvando ? "salvando…" : "salvar identidade"}
          </button>
          <button type="button" onClick={() => setIdent(publicada ?? identidadeInicial(corAntiga))} disabled={!mudou} className="inline-flex h-11 items-center rounded-pill border border-[#E6D5CE] px-4 text-[13px] font-semibold text-[#2B1420] disabled:opacity-45">
            cancelar
          </button>
          <button type="button" onClick={() => setIdent({ v: 1, tema: ident.tema, modo: "tema" })} className="inline-flex h-11 items-center px-2 text-[13px] font-semibold text-[#5A4A50] hover:text-[#692536]">
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
