"use client";

import { Voltar } from "@/components/Voltar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { InstalarApp } from "@/components/InstalarApp";
import { Botao } from "@/components/ui/Botao";
import { temas } from "@/lib/dados";
import { usePerfil } from "@/lib/perfil-store";
import { sairDaConta, useNuvem } from "@/lib/nuvem";
import { apagarMinhasAtividades } from "@/lib/social";
import { supabase } from "@/lib/supabase";
import { useTeste } from "@/lib/teste-store";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const email = usePerfil((s) => s.email);
  const nuvem = useNuvem((s) => s.estado);
  const erroNuvem = useNuvem((s) => s.erro);
  const quantos = usePerfil((s) => s.livros.length);
  const esvaziarEstante = usePerfil((s) => s.esvaziarEstante);
  const aparencia = usePerfil((s) => s.aparencia ?? "claro");
  const atualizar = usePerfil((s) => s.atualizar);
  const temaNoApp = usePerfil((s) => !s.temaSoNoPerfil);
  const publicarNoFeed = usePerfil((s) => s.publicarNoFeed ?? true);
  const usuario = usePerfil((s) => s.usuario);
  const [avisoSenha, setAvisoSenha] = useState<string | null>(null);
  const temaAtual =
    temas.find((t) => t.id === usePerfil.getState().tema) ?? temas[0];

  async function esvaziar() {
    if (!quantos) return;
    if (
      !confirm(
        `tirar ${quantos === 1 ? "o livro" : `os ${quantos} livros`} da sua estante? as notas, resenhas e o progresso de leitura deles somem junto. as fichas dos clubes continuam. não dá para desfazer.`,
      )
    )
      return;
    esvaziarEstante();
    await apagarMinhasAtividades().catch(() => {});
    router.push("/estantes");
  }

  async function trocarSenha() {
    if (!email || !supabase) return;
    setAvisoSenha("enviando…");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    });
    setAvisoSenha(
      error
        ? "não deu para mandar agora. tente de novo em alguns minutos."
        : `mandamos um link para ${email}. abra o e-mail para criar a senha nova.`,
    );
  }

  function baixarDados() {
    const p = usePerfil.getState();
    const dados = {
      exportado_em: new Date().toISOString(),
      nome: p.nome,
      usuario: p.usuario,
      frase: p.frase,
      meta: p.meta,
      tema: p.tema,
      favoritos: p.favoritos,
      estantes: p.estantesProprias,
      livros: p.livros,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `the-bookside-${p.usuario || "meus-dados"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const secoes = [
    { id: "conta", nome: "conta" },
    { id: "aparencia", nome: "aparência" },
    { id: "privacidade", nome: "privacidade" },
    { id: "app", nome: "app no celular" },
    { id: "dados", nome: "seus dados" },
  ];
  const tituloSecao =
    "flex items-center gap-2 border-b border-linha pb-2 font-display text-xl leading-none font-semibold italic text-bordo lg:font-revista lg:text-[22px] lg:font-normal lg:text-tinta";
  const linha =
    "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-linha/70 py-3.5";

  return (
    <AppShell aba="perfil">
      <div className="flex flex-1 flex-col pb-10 lg:bg-jornal lg:px-12 lg:py-8">
        <header className="px-6 pt-2 lg:px-0 lg:pt-0">
          <Voltar
            padrao="/perfil"
            rotulo="perfil"
            className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo"
          />
          <h1 className="mt-2 font-display text-[32px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
            configurações
          </h1>
        </header>

        <div className="mt-6 lg:grid lg:grid-cols-[200px_minmax(0,680px)] lg:gap-14">
          {/* índice (computador) */}
          <nav
            aria-label="seções das configurações"
            className="hidden lg:sticky lg:top-8 lg:block lg:self-start"
          >
            <ul className="space-y-1 border-l border-linha">
              {secoes.map((x) => (
                <li key={x.id}>
                  <a
                    href={`#${x.id}`}
                    className="-ml-px block border-l-2 border-transparent py-1.5 pl-4 text-[13px] font-semibold text-cinza hover:border-bordo hover:text-bordo"
                  >
                    {x.nome}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-10 px-6 lg:px-0">
            {/* conta */}
            <section id="conta" className="scroll-mt-8">
              <h2 className={tituloSecao}>conta</h2>
              <dl>
                <div className={linha}>
                  <dt className="text-sm font-semibold">e-mail</dt>
                  <dd className="text-[13px] text-cinza">
                    {email ?? "sem conta conectada"}
                  </dd>
                </div>
                <div className={linha}>
                  <dt className="text-sm font-semibold">usuário</dt>
                  <dd className="flex items-center gap-3 text-[13px] text-cinza">
                    {usuario ? `@${usuario}` : "—"}
                    <Link
                      href="/perfil/editar"
                      className="font-semibold text-bordo underline underline-offset-4"
                    >
                      mudar
                    </Link>
                  </dd>
                </div>
                <div className={linha}>
                  <dt className="text-sm font-semibold">
                    senha
                    <span className="block text-xs font-normal text-cinza">
                      você entra com o e-mail ou com o @usuário.
                    </span>
                  </dt>
                  <dd>
                    <button
                      type="button"
                      onClick={trocarSenha}
                      disabled={!email}
                      className="min-h-9 text-[13px] font-semibold text-bordo underline underline-offset-4 disabled:text-cinza disabled:no-underline"
                    >
                      trocar senha
                    </button>
                  </dd>
                  {avisoSenha ? (
                    <p className="w-full text-xs text-cinza">{avisoSenha}</p>
                  ) : null}
                </div>
                <div className={linha}>
                  <dt className="text-sm font-semibold">seus dados na nuvem</dt>
                  <dd
                    className={`text-[13px] ${nuvem === "erro" ? "text-bordo-suave" : "text-cinza"}`}
                  >
                    {
                      {
                        desligada: "só neste navegador",
                        "sem-conta": "só neste navegador",
                        carregando: "abrindo…",
                        salvando: "salvando…",
                        salvo: "salvos ✓",
                        erro: erroNuvem ?? "erro ao salvar",
                      }[nuvem]
                    }
                  </dd>
                </div>
              </dl>
            </section>

            {/* aparência */}
            <section id="aparencia" className="scroll-mt-8">
              <h2 className={tituloSecao}>aparência</h2>
              <fieldset className="mt-3">
                <legend className="text-[13px] text-cinza">
                  o app claro, escuro ou igual ao seu celular/computador.
                </legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(
                    [
                      ["claro", "☀ claro"],
                      ["escuro", "☾ escuro"],
                      ["sistema", "automático"],
                    ] as const
                  ).map(([id, r]) => (
                    <label
                      key={id}
                      className={`flex h-10 cursor-pointer items-center rounded-pill border px-4 text-[13px] font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordo ${
                        aparencia === id
                          ? "border-bordo bg-bordo text-creme"
                          : "border-bege bg-creme-quente text-ameixa"
                      }`}
                    >
                      <input
                        type="radio"
                        name="aparencia"
                        className="sr-only"
                        checked={aparencia === id}
                        onChange={() => atualizar({ aparencia: id })}
                      />
                      {r}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Interruptor
                ligado={temaNoApp}
                onChange={(v) => atualizar({ temaSoNoPerfil: !v })}
                titulo="usar o tema do perfil no app todo"
                texto={`as cores de “${temaAtual.nome}” nos botões, títulos e menus de todas as telas.${"escuro" in temaAtual ? " como é um tema escuro, o app todo escurece." : ""}`}
              />
            </section>

            {/* privacidade */}
            <section id="privacidade" className="scroll-mt-8">
              <h2 className={tituloSecao}>privacidade</h2>
              <Interruptor
                ligado={publicarNoFeed}
                onChange={(v) => atualizar({ publicarNoFeed: v })}
                titulo="mostrar minhas leituras no feed dos amigos"
                texto="quando você começa, termina ou avalia um livro, isso aparece para quem te segue. desligado, só aparece o que você publicar no botão “publicar”. os clubes continuam vendo o que acontece neles."
              />
              <p className="mt-3 text-[13px] text-cinza">
                seu perfil (@{usuario || "…"}) pode ser encontrado pelo nome e
                pelo @. as estantes privadas não aparecem para ninguém.
              </p>
            </section>

            {/* app */}
            <section id="app" className="scroll-mt-8">
              <h2 className={tituloSecao}>app no celular</h2>
              <div className="mt-3">
                <InstalarApp />
              </div>
              <button
                type="button"
                onClick={() => {
                  atualizar({ tourVisto: false });
                  router.push("/inicio");
                }}
                className="mt-4 min-h-9 text-[13px] font-semibold text-bordo underline underline-offset-4"
              >
                rever o passeio pelo app
              </button>
            </section>

            {/* dados */}
            <section id="dados" className="scroll-mt-8">
              <h2 className={tituloSecao}>seus dados</h2>
              <div className={linha}>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    baixar uma cópia
                  </span>
                  <span className="block text-[13px] text-cinza">
                    seus livros, notas, resenhas e estantes num arquivo.
                  </span>
                </span>
                <button
                  type="button"
                  onClick={baixarDados}
                  className="min-h-9 text-[13px] font-semibold text-bordo underline underline-offset-4"
                >
                  baixar (.json)
                </button>
              </div>
              <div className={linha}>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    esvaziar a estante
                  </span>
                  <span className="block text-[13px] text-cinza">
                    {quantos
                      ? `${quantos} ${quantos === 1 ? "livro" : "livros"} na estante.`
                      : "a estante está vazia."}{" "}
                    para recomeçar e importar de novo em estantes → importar.
                  </span>
                </span>
                <button
                  type="button"
                  onClick={esvaziar}
                  disabled={!quantos}
                  className="min-h-9 text-[13px] font-semibold text-bordo underline underline-offset-4 disabled:text-cinza disabled:no-underline"
                >
                  esvaziar
                </button>
              </div>

              <Botao
                variante="contorno"
                className="mt-8 lg:max-w-[320px]"
                onClick={async () => {
                  await sairDaConta();
                  useTeste.getState().recomecar();
                  router.push("/entrar");
                }}
              >
                sair da conta
              </Botao>
              <p className="mt-2 text-[11px] text-cinza">
                {nuvem === "desligada"
                  ? "sem conta na nuvem, sair apaga o perfil salvo neste navegador."
                  : "seus dados continuam guardados na sua conta."}
              </p>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

/** um liga/desliga com título e explicação */
function Interruptor({
  ligado,
  onChange,
  titulo,
  texto,
}: {
  ligado: boolean;
  onChange: (v: boolean) => void;
  titulo: string;
  texto: string;
}) {
  return (
    <label className="mt-4 flex cursor-pointer items-start justify-between gap-4 rounded-[12px] border border-linha bg-creme-quente p-4 lg:rounded-[4px]">
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{titulo}</span>
        <span className="mt-0.5 block text-[13px] text-cinza">{texto}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={ligado}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`relative mt-0.5 h-6 w-11 flex-none rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-bordo ${ligado ? "bg-bordo" : "bg-bege"}`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-creme shadow transition-all ${ligado ? "left-[22px]" : "left-0.5"}`}
        />
      </span>
    </label>
  );
}
