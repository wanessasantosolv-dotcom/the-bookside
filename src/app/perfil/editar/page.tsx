"use client";

import { Voltar } from "@/components/Voltar";
import Link from "next/link";
import { TelaApp } from "@/components/AppShell";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AjustarFoto } from "@/components/AjustarFoto";
import { CampoUsuario } from "@/components/CampoUsuario";
import type { SituacaoUsuario } from "@/lib/usuario";
import { useHidratado } from "@/components/PerfilHidratacao";
import { metas, temas } from "@/lib/dados";
import { reduzirImagem } from "@/lib/imagem";
import {
  usePerfil,
  type PadraoCapa,
  type Perfil,
} from "@/lib/perfil-store";

const LIMITE_FRASE = 120;
const padroes: PadraoCapa[] = ["linhas", "bolinhas", "ondas", "estrelas"];
const rotulo =
  "mb-1.5 block text-[11px] leading-[14px] font-semibold tracking-[.12em] text-bordo uppercase";
const caixa =
  "h-12 w-full rounded-[12px] border border-bege bg-creme-quente px-4 text-ameixa outline-none focus:border-bordo focus:ring-1 focus:ring-bordo lg:rounded-[4px]";

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
>;

function Formulario({ inicial }: { inicial: Rascunho }) {
  const router = useRouter();
  const atualizar = usePerfil((s) => s.atualizar);
  const atualizarJa = atualizar;
  const temaNoApp = usePerfil((s) => !s.temaSoNoPerfil);
  const livrosLidos = usePerfil(
    (s) => s.livros.filter((l) => l.status === "lido").length,
  );
  const [r, setR] = useState<Rascunho>(inicial);
  const fotoRef = useRef<HTMLInputElement>(null);
  const [fotoParaAjustar, setFotoParaAjustar] = useState<string | null>(null);
  const [capaParaAjustar, setCapaParaAjustar] = useState<string | null>(null);
  const capaRef = useRef<HTMLInputElement>(null);
  const mudar = (d: Partial<Rascunho>) => setR((x) => ({ ...x, ...d }));
  const [situacaoUsuario, setSituacaoUsuario] =
    useState<SituacaoUsuario>("verificando");
  const usuarioAntigo = inicial.usuario;
  // o @ só bloqueia se for inválido ou de outra pessoa
  const usuarioOk =
    r.usuario === usuarioAntigo ||
    situacaoUsuario === "ok" ||
    situacaoUsuario === "sem_internet";
  const valido = r.nome.trim() && r.usuario.trim() && usuarioOk;

  function salvar() {
    if (!valido) return;
    atualizar({ ...r, nome: r.nome.trim(), frase: r.frase.trim() });
    router.push("/perfil");
  }

  function trocarPadrao() {
    const i = padroes.indexOf(r.capa);
    mudar({ capa: padroes[(i + 1) % padroes.length], capaImagem: null });
  }

  const meta = typeof r.meta === "number" ? r.meta : null;
  const [textoMeta, setTextoMeta] = useState(() =>
    meta !== null && !metas.some((m) => m.valor === meta) ? String(meta) : "",
  );
  // a meta escrita à mão (fica marcada enquanto for a escolhida)
  const metaPersonalizada =
    textoMeta !== "" && meta !== null && meta === Number(textoMeta);

  return (
    <TelaApp aba="perfil">
      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col lg:mx-0 lg:max-w-[720px]">
        <header className="flex items-center justify-between px-6 pt-2 lg:px-0">
          <Voltar
            padrao="/perfil"
            rotulo="perfil"
            className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo"
          />
          <h1 className="font-display text-lg font-semibold italic lg:font-revista lg:text-xl lg:font-normal">
            editar perfil
          </h1>
          <button
            type="button"
            onClick={salvar}
            disabled={!valido}
            className="-mr-2 min-h-11 px-2 text-[13px] font-semibold text-bordo disabled:opacity-40"
          >
            salvar
          </button>
        </header>

        {/* capa */}
        <div
          className={`relative mt-2 h-[120px] bg-cover bg-center sm:mx-6 sm:h-[150px] sm:rounded-[12px] sm:overflow-hidden lg:mx-0 lg:rounded-[4px] ${r.capaImagem ? "" : `pat-${r.capa}`}`}
          style={
            r.capaImagem
              ? { backgroundImage: `url("${r.capaImagem}")` }
              : undefined
          }
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-transparent from-45% to-ameixa/45"
          />
          <div className="absolute right-3 bottom-3 flex flex-wrap justify-end gap-2">
            {r.capaImagem ? (
              <button
                type="button"
                onClick={() => setCapaParaAjustar(r.capaImagem)}
                className={botaoCapa}
              >
                <Icone d={ICONES.ajustar} />
                ajustar
              </button>
            ) : (
              <button
                type="button"
                onClick={trocarPadrao}
                className={botaoCapa}
                aria-label={`trocar o desenho da capa (agora: ${r.capa})`}
              >
                <Icone d={ICONES.padrao} />
                outro desenho
              </button>
            )}
            <button
              type="button"
              onClick={() => capaRef.current?.click()}
              className={`${botaoCapa} bg-creme`}
            >
              <Icone d={ICONES.foto} />
              {r.capaImagem ? "trocar foto da capa" : "usar uma foto"}
            </button>
            {r.capaImagem ? (
              <button
                type="button"
                onClick={() => mudar({ capaImagem: null })}
                className={botaoCapa}
                aria-label="tirar a foto da capa"
              >
                <Icone d={ICONES.lixo} />
              </button>
            ) : null}
          </div>
          <input
            ref={capaRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) setCapaParaAjustar(await reduzirImagem(f, 2000, 0.9));
            }}
          />
        </div>
        {capaParaAjustar ? (
          <AjustarFoto
            src={capaParaAjustar}
            formato="capa"
            onCancelar={() => setCapaParaAjustar(null)}
            onPronto={(dataUrl) => {
              mudar({ capaImagem: dataUrl });
              setCapaParaAjustar(null);
            }}
          />
        ) : null}

        {/* foto */}
        <div className="-mt-10 flex items-end gap-3 px-6 sm:px-10 lg:px-4">
          <div className="relative size-[84px] flex-none">
            <button
              type="button"
              onClick={() => fotoRef.current?.click()}
              aria-label="trocar foto"
              className="flex size-full items-center justify-center overflow-hidden rounded-full border-[3px] border-creme bg-linha"
            >
              {r.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.foto}
                  alt=""
                  className="size-full object-cover object-[50%_30%]"
                />
              ) : (
                <Icone d={ICONES.foto} tamanho={24} />
              )}
            </button>
            <span
              aria-hidden
              className="pointer-events-none absolute -right-0.5 -bottom-0.5 flex size-[26px] items-center justify-center rounded-full border-2 border-creme bg-bordo text-creme"
            >
              <Icone d={ICONES.lapis} tamanho={11} />
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 pb-1">
            <button
              type="button"
              onClick={() => fotoRef.current?.click()}
              className="flex min-h-11 items-center text-xs font-semibold text-bordo"
            >
              {r.foto ? "trocar foto" : "colocar foto"}
            </button>
            {r.foto ? (
              <button
                type="button"
                onClick={() => setFotoParaAjustar(r.foto)}
                className="flex min-h-11 items-center text-xs font-semibold text-bordo"
              >
                ajustar enquadramento
              </button>
            ) : null}
          </div>
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
        </div>
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

        <div className="flex-1 space-y-8 px-6 pt-6 pb-6 lg:px-0">
          <section>
            <TituloSecao icone={ICONES.pessoa} titulo="quem é você por aqui" />
            <div className="grid gap-4 sm:grid-cols-[1.3fr_1fr]">
              <label className="block min-w-0">
                <span className={rotulo}>seu nome</span>
                <input
                  value={r.nome}
                  onChange={(e) => mudar({ nome: e.target.value })}
                  placeholder="como você quer ser chamada"
                  className={`${caixa} font-display text-[21px] font-semibold italic`}
                />
              </label>
              <div className="min-w-0">
                <span className={rotulo}>usuário</span>
                <CampoUsuario
                  valor={r.usuario}
                  nome={r.nome}
                  onChange={(u) => mudar({ usuario: u })}
                  onSituacao={setSituacaoUsuario}
                />
                {r.usuario !== usuarioAntigo ? (
                  <span className="mt-1 block text-[11px] text-cinza">
                    seu link vai mudar para{" "}
                    <b className="text-ameixa">/u/{r.usuario || "…"}</b> — e
                    você passa a entrar com o @ novo.
                  </span>
                ) : (
                  <span className="mt-1 block text-[11px] text-cinza">
                    seu perfil: <b className="text-ameixa">/u/{r.usuario}</b>
                  </span>
                )}
              </div>
            </div>

            <label className="mt-4 block">
              <span className={rotulo}>frase do perfil</span>
              <textarea
                value={r.frase}
                maxLength={LIMITE_FRASE}
                rows={2}
                onChange={(e) => mudar({ frase: e.target.value })}
                placeholder="uma frase que tem a sua cara de leitora"
                className={`${caixa} !h-auto resize-none py-3 font-accent text-base leading-[1.35] italic !text-bordo`}
              />
              <span className="mt-1 flex justify-between gap-3 text-[11px] text-cinza">
                <span className="font-accent italic">
                  aparece logo abaixo do seu nome.
                </span>
                <span className="font-semibold tabular-nums">
                  {r.frase.length}/{LIMITE_FRASE}
                </span>
              </span>
            </label>
          </section>

          <fieldset>
            <legend className="w-full">
              <TituloSecao
                icone={ICONES.alvo}
                titulo={`meta de ${new Date().getFullYear()}`}
              />
            </legend>
            <p className="-mt-1 mb-3 font-accent text-sm italic text-cinza">
              quantos livros você quer ler este ano?
            </p>
            <div className="flex flex-wrap gap-2">
              {metas.map((m) => (
                <label
                  key={String(m.valor)}
                  className={`inline-flex h-11 min-w-12 cursor-pointer items-center justify-center rounded-pill border px-4 text-sm font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordo ${
                    r.meta === m.valor
                      ? "border-bordo bg-bordo text-creme"
                      : "border-bege bg-creme-quente text-ameixa"
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
              {/* outra quantidade, do jeito da pessoa */}
              <label
                className={`inline-flex h-11 items-center gap-2 rounded-pill border pr-2 pl-4 text-sm font-semibold focus-within:border-bordo ${
                  metaPersonalizada
                    ? "border-bordo bg-bordo text-creme"
                    : "border-bege bg-creme-quente text-ameixa"
                }`}
              >
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
                  className={`h-8 w-16 rounded-pill px-2 text-center text-sm outline-none ${
                    metaPersonalizada
                      ? "bg-creme text-bordo"
                      : "bg-creme text-ameixa"
                  }`}
                />
              </label>
            </div>
            <div className="mt-3 rounded-[12px] bg-creme-quente px-4 py-3 lg:rounded-[4px]">
              <p className="text-[13px] text-ameixa">
                {meta ? (
                  <>
                    <b className="text-bordo">{livrosLidos}</b> de {meta} lidos ·{" "}
                    <span className="font-accent italic text-cinza">
                      {metas.find((m) => m.valor === meta)?.legenda ??
                        (meta >= 52
                          ? `mais de um livro por semana — que fôlego!`
                          : `cerca de ${Math.max(1, Math.round((365 / meta) * 10) / 10).toLocaleString("pt-BR")} dias por livro`)}
                    </span>
                  </>
                ) : (
                  <span className="font-accent italic text-cinza">
                    sem números, só leitura · {livrosLidos} lidos até agora
                  </span>
                )}
              </p>
              {meta ? (
                <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-bege/70">
                  <span
                    className="block h-full rounded-full bg-bordo"
                    style={{
                      width: `${Math.min(100, (livrosLidos / meta) * 100)}%`,
                    }}
                  />
                </span>
              ) : null}
            </div>
          </fieldset>

          <fieldset>
            <legend className="w-full">
              <TituloSecao icone={ICONES.paleta} titulo="cores do perfil" />
            </legend>
            <p className="-mt-1 mb-3 font-accent text-sm italic text-cinza">
              o tema muda a cor de destaque e o papel do seu perfil.
            </p>
            <div className="grid grid-cols-2 gap-2.5 min-[420px]:grid-cols-4">
              {temas.map((t) => {
                const on = r.tema === t.id;
                return (
                  <label
                    key={t.id}
                    className={`relative h-[84px] cursor-pointer overflow-hidden rounded-[12px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bordo lg:rounded-[6px] ${
                      on
                        ? "ring-2 ring-bordo ring-offset-2 ring-offset-creme"
                        : "border border-linha"
                    }`}
                    style={{ background: t.papel }}
                  >
                    <input
                      type="radio"
                      name="tema"
                      className="sr-only"
                      checked={on}
                      onChange={() => mudar({ tema: t.id })}
                    />
                    <div
                      className="h-[26px]"
                      style={{ background: t.destaque, opacity: 0.55 }}
                    />
                    <div
                      className="absolute inset-x-2.5 top-[18px] bottom-0 rounded-t-[8px]"
                      style={{ background: t.papel }}
                    />
                    <span
                      className="absolute top-3.5 left-1/2 -ml-[9px] size-[18px] rounded-full border-2 border-creme-quente"
                      style={{ background: t.destaque }}
                    />
                    <span
                      className="absolute inset-x-1.5 top-[40px] text-center font-display text-[12px] leading-[1.15] font-semibold italic"
                      style={{ color: t.texto }}
                    >
                      {t.nome}
                    </span>
                    {on ? (
                      <span
                        aria-hidden
                        className="absolute top-[5px] right-[5px] flex size-[18px] items-center justify-center rounded-full bg-bordo text-creme"
                      >
                        <Icone d="M5 12.5l4.5 4.5L19 7.5" tamanho={10} grosso />
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-3 text-[13px]">
              <input
                type="checkbox"
                checked={temaNoApp}
                onChange={(e) => atualizarJa({ temaSoNoPerfil: !e.target.checked })}
                className="size-5 flex-none accent-bordo"
              />
              <span>
                <b className="font-semibold">usar esse tema no app todo</b>{" "}
                <span className="text-cinza">
                  — as cores valem em todas as telas, não só no perfil.
                </span>
              </span>
            </label>
          </fieldset>

          <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
            <Link
              href="/perfil"
              className="flex h-12 items-center justify-center rounded-pill border border-bege px-8 text-sm font-semibold text-ameixa sm:min-w-[160px]"
            >
              cancelar
            </Link>
            <button
              type="button"
              onClick={salvar}
              disabled={!valido}
              className="h-12 rounded-pill bg-bordo px-8 text-sm font-semibold text-creme hover:bg-bordo-suave disabled:opacity-45 sm:min-w-[200px]"
            >
              salvar alterações
            </button>
          </div>
        </div>
      </div>
    </TelaApp>
  );
}

const botaoCapa =
  "inline-flex h-8 items-center gap-1.5 rounded-pill bg-creme/90 px-3 text-xs font-semibold text-bordo shadow-[0_2px_8px_rgba(43,20,32,.25)]";

const ICONES = {
  foto: "M4 8h3l2-3h6l2 3h3v11H4z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  ajustar: "M4 7h10 M18 7h2 M4 17h2 M10 17h10 M16 5v4 M8 15v4",
  padrao: "M4 4h16v16H4z M4 9c3 2 5-2 8 0s5-2 8 0 M4 15c3 2 5-2 8 0s5-2 8 0",
  lixo: "M5 7h14 M10 7V5h4v2 M7 7l1 12h8l1-12",
  lapis: "M12 20h9 M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z",
  pessoa: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6",
  alvo: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 12h.01",
  paleta:
    "M12 3a9 9 0 0 0 0 18c1.5 0 2-1 2-2 0-1.5-1-2 0-3s3 0 4.5-1A5 5 0 0 0 21 11c0-4.5-4-8-9-8z M7.5 11h.01 M10 7h.01 M15 7.5h.01",
};

function Icone({
  d,
  tamanho = 14,
  grosso,
}: {
  d: string;
  tamanho?: number;
  grosso?: boolean;
}) {
  return (
    <svg
      aria-hidden
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={grosso ? 3 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {d.split(" M").map((p, i) => (
        <path key={i} d={i ? `M${p}` : p} />
      ))}
    </svg>
  );
}

function TituloSecao({ icone, titulo }: { icone: string; titulo: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 border-b border-linha pb-2 font-display text-[19px] leading-none font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
      <span className="flex size-7 items-center justify-center rounded-full bg-rosa-fundo text-bordo">
        <Icone d={icone} />
      </span>
      {titulo}
    </h2>
  );
}

export default function EditarPerfilPage() {
  const hidratado = useHidratado();
  const p = usePerfil();
  if (!hidratado) return <TelaApp aba="perfil">{null}</TelaApp>;
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
      }}
    />
  );
}
