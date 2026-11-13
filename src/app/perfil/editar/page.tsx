"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AjustarFoto } from "@/components/AjustarFoto";
import { useHidratado } from "@/components/PerfilHidratacao";
import { Tela } from "@/components/ui/Tela";
import { metas, temas } from "@/lib/dados";
import { reduzirImagem } from "@/lib/imagem";
import { sugerirUsuario, usePerfil, type PadraoCapa, type Perfil } from "@/lib/perfil-store";

const LIMITE_FRASE = 120;
const padroes: PadraoCapa[] = ["linhas", "bolinhas", "ondas", "estrelas"];
const rotulo = "mb-1.5 block text-[10px] leading-[14px] font-semibold tracking-[.12em] text-bordo uppercase";
const caixa =
  "w-full rounded-sm border border-bege bg-creme-quente px-3 text-ameixa outline-none focus:border-bordo focus:ring-1 focus:ring-bordo";

type Rascunho = Pick<Perfil, "nome" | "usuario" | "frase" | "meta" | "tema" | "foto" | "capa" | "capaImagem">;

function Formulario({ inicial }: { inicial: Rascunho }) {
  const router = useRouter();
  const atualizar = usePerfil((s) => s.atualizar);
  const livrosLidos = usePerfil((s) => s.livros.filter((l) => l.status === "lido").length);
  const [r, setR] = useState<Rascunho>(inicial);
  const fotoRef = useRef<HTMLInputElement>(null);
  const [fotoParaAjustar, setFotoParaAjustar] = useState<string | null>(null);
  const capaRef = useRef<HTMLInputElement>(null);
  const mudar = (d: Partial<Rascunho>) => setR((x) => ({ ...x, ...d }));
  const valido = r.nome.trim() && r.usuario.trim();

  function salvar() {
    if (!valido) return;
    atualizar({ ...r, nome: r.nome.trim(), frase: r.frase.trim() });
    router.push("/perfil");
  }

  function trocarPadrao() {
    const i = padroes.indexOf(r.capa);
    mudar({ capa: padroes[(i + 1) % padroes.length], capaImagem: null });
  }

  return (
    <Tela>
      <header className="flex items-center justify-between px-6 pt-2">
        <Link href="/perfil" className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo">
          ‹ perfil
        </Link>
        <h1 className="font-display text-lg font-semibold italic">editar perfil</h1>
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
        className={`relative mt-1 h-[104px] bg-cover bg-[50%_40%] ${r.capaImagem ? "" : `pat-${r.capa}`}`}
        style={r.capaImagem ? { backgroundImage: `url(${r.capaImagem})` } : undefined}
      >
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent from-45% to-ameixa/45" />
        <div className="absolute right-4 bottom-3 flex gap-2">
          <button type="button" onClick={trocarPadrao} className="h-[30px] rounded-pill bg-creme/90 px-3 text-xs font-semibold text-bordo">
            padrão: {r.capaImagem ? "foto" : r.capa}
          </button>
          <button type="button" onClick={() => capaRef.current?.click()} className="h-[30px] rounded-pill bg-creme px-3 text-xs font-semibold text-bordo">
            trocar capa
          </button>
        </div>
        <input
          ref={capaRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) mudar({ capaImagem: await reduzirImagem(f, 900, 0.78) });
          }}
        />
      </div>

      {/* foto */}
      <div className="relative -mt-10 ml-6 size-[78px]">
        <button
          type="button"
          onClick={() => fotoRef.current?.click()}
          aria-label="trocar foto"
          className="block size-full overflow-hidden rounded-full border-[3px] border-creme bg-linha"
        >
          {r.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={r.foto} alt="" className="size-full object-cover object-[50%_30%]" />
          ) : (
            <span className="font-display text-3xl font-semibold italic text-bordo">+</span>
          )}
        </button>
        <span
          aria-hidden
          className="pointer-events-none absolute -right-0.5 -bottom-0.5 flex size-[26px] items-center justify-center rounded-full border-2 border-creme bg-bordo"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F9F5EE" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </span>
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
        {r.foto ? (
          <button
            type="button"
            onClick={() => setFotoParaAjustar(r.foto)}
            className="absolute top-[34px] left-[92px] flex min-h-11 items-center text-xs font-semibold whitespace-nowrap text-bordo"
          >
            ajustar foto
          </button>
        ) : null}
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

      <div className="flex-1 px-6 pt-3 pb-6">
        <div className="flex gap-3">
          <label className="block flex-[1.4]">
            <span className={rotulo}>nome</span>
            <input
              value={r.nome}
              onChange={(e) => mudar({ nome: e.target.value })}
              className={`${caixa} h-[46px] font-display text-[21px] font-semibold italic`}
            />
          </label>
          <label className="block flex-1">
            <span className={rotulo}>usuário</span>
            <span className={`${caixa} flex h-[46px] items-center text-sm font-medium focus-within:border-bordo`}>
              <span className="text-bordo">@</span>
              <input
                value={r.usuario}
                autoCapitalize="none"
                onChange={(e) => mudar({ usuario: sugerirUsuario(e.target.value) || "" })}
                className="w-full min-w-0 bg-transparent outline-none"
              />
            </span>
          </label>
        </div>

        <label className="mt-5 block">
          <span className={rotulo}>frase do perfil</span>
          <textarea
            value={r.frase}
            maxLength={LIMITE_FRASE}
            rows={2}
            onChange={(e) => mudar({ frase: e.target.value })}
            className={`${caixa} resize-none py-2.5 font-accent text-sm leading-[1.35] italic !text-bordo`}
          />
          <span className="mt-1 block text-right text-[9px] font-semibold tracking-[.12em] text-cinza uppercase">
            {r.frase.length} / {LIMITE_FRASE}
          </span>
        </label>

        <fieldset className="mt-3">
          <legend className={rotulo}>meta de leitura · {new Date().getFullYear()}</legend>
          <div className="flex flex-wrap items-center gap-2">
            {metas.map((m) => (
              <label
                key={String(m.valor)}
                className={`inline-flex h-11 min-w-11 cursor-pointer items-center justify-center rounded-pill border px-3.5 text-sm font-medium has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordo ${
                  r.meta === m.valor ? "border-bordo bg-bordo text-creme" : "border-bege bg-creme-quente"
                }`}
              >
                <input type="radio" name="meta" className="sr-only" checked={r.meta === m.valor} onChange={() => mudar({ meta: m.valor })} />
                {m.valor ?? "sem meta"}
              </label>
            ))}
            <span className="ml-auto text-[9px] font-semibold tracking-[.12em] text-cinza uppercase">{livrosLidos} lidos</span>
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className={rotulo}>tema do perfil</legend>
          <div className="-mx-6 flex gap-[9px] overflow-x-auto px-6 py-0.5 [scrollbar-width:none]">
            {temas.map((t) => {
              const on = r.tema === t.id;
              return (
                <label
                  key={t.id}
                  className={`relative h-[78px] w-[92px] flex-none cursor-pointer overflow-hidden rounded-[10px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordo ${
                    on ? "border-2 border-bordo shadow-[0_6px_12px_-8px_rgba(107,13,36,.6)]" : "border-[1.5px] border-linha"
                  }`}
                  style={{ background: t.papel }}
                >
                  <input type="radio" name="tema" className="sr-only" checked={on} onChange={() => mudar({ tema: t.id })} />
                  <div className="h-[26px]" style={{ background: t.destaque, opacity: 0.55 }} />
                  <div className="absolute inset-x-2.5 top-[18px] bottom-0 rounded-t-[8px]" style={{ background: t.papel }} />
                  <span className="absolute top-3.5 left-1/2 -ml-[9px] size-[18px] rounded-full border-2 border-creme-quente" style={{ background: t.destaque }} />
                  <span className="absolute inset-x-1 top-[38px] text-center font-display text-[11px] leading-[1.15] font-semibold italic" style={{ color: t.texto }}>
                    {t.nome}
                  </span>
                  {on ? (
                    <span aria-hidden className="absolute top-[5px] right-[5px] size-4 rounded-full bg-bordo text-center text-[10px] leading-4 font-bold text-creme">
                      ✓
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
          <p className="mt-2 font-accent text-[13px] italic text-cinza">o tema define a cor de destaque e o papel do seu perfil.</p>
        </fieldset>

        <div className="mt-5 flex items-center justify-between border-y border-linha py-3">
          <div>
            <p className="text-[13px] font-semibold">favoritos</p>
            <p className="mt-0.5 font-accent text-xs italic text-cinza">até 4 capas em destaque</p>
          </div>
          <Link href="/perfil/favoritos" className="flex min-h-11 items-center text-xs font-semibold text-bordo">
            editar →
          </Link>
        </div>

        <div className="mt-6 flex gap-2.5">
          <Link
            href="/perfil"
            className="flex h-[52px] flex-1 items-center justify-center rounded-pill border border-bege text-sm font-semibold text-ameixa"
          >
            cancelar
          </Link>
          <button
            type="button"
            onClick={salvar}
            disabled={!valido}
            className="h-[52px] flex-1 rounded-pill bg-bordo text-sm font-semibold text-creme hover:bg-bordo-suave disabled:opacity-45"
          >
            salvar ♡
          </button>
        </div>
      </div>
    </Tela>
  );
}

export default function EditarPerfilPage() {
  const hidratado = useHidratado();
  const p = usePerfil();
  if (!hidratado) return <Tela>{null}</Tela>;
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
