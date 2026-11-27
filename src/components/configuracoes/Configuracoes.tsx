"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { InstalarApp } from "@/components/InstalarApp";
import { useHidratado } from "@/components/PerfilHidratacao";
import { Voltar } from "@/components/Voltar";
import { sairDaConta, useNuvem } from "@/lib/nuvem";
import { usePerfil } from "@/lib/perfil-store";
import { apagarMinhasAtividades } from "@/lib/social";
import { supabase } from "@/lib/supabase";
import { temaApp } from "@/lib/temas";
import { useTeste } from "@/lib/teste-store";

export type Secao = "aparencia" | "app" | "conta" | "privacidade" | "dados";

const GRUPOS: { nome: string; itens: { id: Secao; nome: string; sub: string; icone: string }[] }[] = [
  {
    nome: "Preferências",
    itens: [
      { id: "aparencia", nome: "Aparência", sub: "modo claro, escuro ou do sistema", icone: "M12 3a9 9 0 1 0 9 9c0-.5-.5-.8-1-.6A6 6 0 0 1 12.6 4c.2-.5-.1-1-.6-1z" },
      { id: "app", nome: "App no celular", sub: "instalar o app e rever o passeio", icone: "M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M11 18h2" },
    ],
  },
  {
    nome: "Conta",
    itens: [
      { id: "conta", nome: "Dados da conta e segurança", sub: "e-mail, usuário e senha", icone: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21c.8-4 4-6 8-6s7.2 2 8 6" },
      { id: "privacidade", nome: "Privacidade", sub: "feed e estantes visíveis", icone: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z" },
      { id: "dados", nome: "Seus dados", sub: "baixar uma cópia ou esvaziar a estante", icone: "M12 4v11 M7 10l5 5 5-5 M5 20h14" },
    ],
  },
];

const Ic = ({ d }: { d: string }) => (
  <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {d.split(" M").map((p, i) => (
      <path key={i} d={i ? `M${p}` : p} />
    ))}
  </svg>
);
const linha = "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-linha py-3.5";
const tituloSecao = "font-revista text-[22px] leading-tight text-ameixa";

/** Configurações: como você usa o app (separado da identidade pública do perfil). */
export function Configuracoes({ secao }: { secao?: Secao }) {
  const hidratado = useHidratado();
  const router = useRouter();
  const nuvem = useNuvem((s) => s.estado);
  if (!hidratado) return <AppShell aba="perfil">{null}</AppShell>;

  async function sair() {
    if (!confirm("sair da conta neste aparelho?")) return;
    await sairDaConta();
    useTeste.getState().recomecar();
    router.push("/entrar");
  }

  const sairBotao = (
    <div className="mt-8">
      <button type="button" onClick={sair} className="flex min-h-11 items-center gap-2.5 text-[14px] font-semibold text-tinta-suave hover:text-bordo">
        <Ic d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3 M10 8l-4 4 4 4 M6 12h10" />
        Sair da conta
      </button>
      <p className="text-[11px] text-cinza">{nuvem === "desligada" ? "sem conta na nuvem, sair apaga o perfil salvo neste navegador." : "seus dados continuam guardados na sua conta."}</p>
    </div>
  );

  const lista = (
    <nav aria-label="configurações" className="space-y-6">
      {GRUPOS.map((g) => (
        <div key={g.nome}>
          <p className="mb-1 text-[11px] font-semibold tracking-[.14em] text-cinza uppercase">{g.nome}</p>
          <ul className="border-t border-linha">
            {g.itens.map((i) => (
              <li key={i.id}>
                <Link
                  href={`/configuracoes/${i.id}`}
                  aria-current={secao === i.id ? "page" : undefined}
                  className={`flex min-h-14 items-center gap-3 border-b border-linha py-2.5 ${secao === i.id ? "text-bordo" : "text-ameixa hover:text-bordo"}`}
                >
                  <span className={secao === i.id ? "text-bordo" : "text-tinta-suave"}>
                    <Ic d={i.icone} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold">{i.nome}</span>
                    <span className="block truncate text-[12px] text-cinza">{i.sub}</span>
                  </span>
                  <span aria-hidden className="text-cinza">
                    ›
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <AppShell aba="perfil">
      <div className="mx-auto w-full max-w-[1000px] px-4 pt-2 pb-16 sm:px-6 lg:px-10 lg:pt-8">
        <header className="flex items-center gap-2">
          <Voltar padrao={secao ? "/configuracoes" : "/perfil"} className="-ml-2 grid size-11 place-items-center text-bordo">
            <span className="sr-only">voltar</span>
            <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Voltar>
          <h1 className="font-revista text-[26px] leading-none text-ameixa lg:text-[30px]">
            <span className={secao ? "hidden lg:inline" : ""}>Configurações</span>
            {secao ? <span className="lg:hidden">{GRUPOS.flatMap((g) => g.itens).find((i) => i.id === secao)?.nome}</span> : null}
          </h1>
        </header>

        <div className="mt-6 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
          {/* a lista: sozinha no celular (sem seção aberta); sempre ao lado no computador */}
          <div className={secao ? "hidden lg:block" : ""}>
            {lista}
            {sairBotao}
          </div>
          {secao ? (
            <div className="min-w-0 max-w-[640px]">
              {secao === "aparencia" ? <Aparencia /> : null}
              {secao === "app" ? <AppCelular /> : null}
              {secao === "conta" ? <Conta /> : null}
              {secao === "privacidade" ? <Privacidade /> : null}
              {secao === "dados" ? <Dados /> : null}
            </div>
          ) : (
            <div className="hidden lg:block">
              <Aparencia />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

/* ───────── aparência do aplicativo ───────── */
function Aparencia() {
  const aparencia = usePerfil((s) => s.aparencia ?? "claro");
  const tema = usePerfil((s) => s.tema);
  const atualizar = usePerfil((s) => s.atualizar);
  const segmento = (on: boolean) =>
    `flex min-h-10 flex-1 items-center justify-center rounded-[5px] text-[13px] font-semibold ${on ? "bg-creme text-ameixa shadow-[0_1px_3px_rgba(0,0,0,.12)]" : "text-tinta-suave hover:text-ameixa"}`;
  return (
    <div className="space-y-8">
      <section aria-labelledby="c-modo">
        <h2 id="c-modo" className={tituloSecao}>
          Modo de aparência
        </h2>
        <div role="radiogroup" aria-labelledby="c-modo" className="mt-3 flex max-w-[380px] gap-1 rounded-[7px] bg-papel p-1">
          {(
            [
              ["claro", "Claro"],
              ["escuro", "Escuro"],
              ["sistema", "Sistema"],
            ] as const
          ).map(([id, nome]) => (
            <button key={id} type="button" role="radio" aria-checked={aparencia === id} onClick={() => atualizar({ aparencia: id })} className={segmento(aparencia === id)}>
              {nome}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-cinza">sistema acompanha o celular ou o computador. vale para o app e para os perfis que você visita.</p>
      </section>
      <section className="border-t border-linha pt-4">
        <p className="text-[13px] text-tinta-suave">
          O app usa a identidade do the bookside. O tema que você escolhe vale no seu perfil
          {temaApp(tema) ? ` (${temaApp(tema)!.nome})` : ""}.
        </p>
        <Link href="/perfil/editar?aba=identidade" className="mt-1 inline-block min-h-10 py-2 text-[13px] font-semibold text-bordo">
          Editar identidade do perfil →
        </Link>
      </section>
    </div>
  );
}

/* ───────── app no celular ───────── */
function AppCelular() {
  const atualizar = usePerfil((s) => s.atualizar);
  const router = useRouter();
  return (
    <div className="space-y-6">
      <section>
        <h2 className={tituloSecao}>App no celular</h2>
        <div className="mt-3">
          <InstalarApp />
        </div>
      </section>
      <button
        type="button"
        onClick={() => {
          atualizar({ tourVisto: false });
          router.push("/inicio");
        }}
        className="min-h-10 text-[13px] font-semibold text-bordo"
      >
        Rever o passeio pelo app
      </button>
    </div>
  );
}

/* ───────── conta e segurança ───────── */
function Conta() {
  const email = usePerfil((s) => s.email);
  const usuario = usePerfil((s) => s.usuario);
  const nuvem = useNuvem((s) => s.estado);
  const erroNuvem = useNuvem((s) => s.erro);
  const [aviso, setAviso] = useState<string | null>(null);
  async function trocarSenha() {
    if (!email || !supabase) return;
    if (!confirm(`mandar um link de troca de senha para ${email}?`)) return;
    setAviso("enviando…");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/nova-senha` });
    setAviso(error ? "não deu para mandar agora. tente de novo em alguns minutos." : `mandamos um link para ${email}. abra o e-mail para criar a senha nova.`);
  }
  const estadoNuvem: Record<string, string> = { desligada: "só neste navegador", "sem-conta": "só neste navegador", carregando: "abrindo…", salvando: "salvando…", salvo: "salvos ✓", erro: erroNuvem ?? "erro ao salvar" };
  return (
    <div className="space-y-8">
      <section>
        <h2 className={tituloSecao}>Dados da conta</h2>
        <dl className="mt-2">
          <Linha t="E-mail" d={email ?? "sem conta conectada"} />
          <Linha
            t="Nome de usuário"
            d={
              <>
                {usuario ? `@${usuario}` : "—"}{" "}
                <Link href="/perfil/editar" className="ml-2 font-semibold text-bordo">
                  alterar no perfil
                </Link>
              </>
            }
          />
          <Linha t="Seus dados na nuvem" d={estadoNuvem[nuvem] ?? nuvem} />
        </dl>
      </section>
      <section>
        <h2 className={tituloSecao}>Segurança</h2>
        <div className={linha}>
          <span>
            <span className="block text-[14px] font-semibold">Senha</span>
            <span className="block text-[12px] text-cinza">você entra com o e-mail ou com o @usuário.</span>
          </span>
          <button type="button" onClick={trocarSenha} disabled={!email} className="min-h-10 text-[13px] font-semibold text-bordo disabled:text-cinza">
            trocar senha
          </button>
          {aviso ? <p className="w-full text-[12px] text-cinza">{aviso}</p> : null}
        </div>
      </section>
    </div>
  );
}

function Linha({ t, d }: { t: string; d: ReactNode }) {
  return (
    <div className={linha}>
      <dt className="text-[14px] font-semibold">{t}</dt>
      <dd className="text-[13px] text-tinta-suave">{d}</dd>
    </div>
  );
}

/* ───────── privacidade ───────── */
function Privacidade() {
  const publicarNoFeed = usePerfil((s) => s.publicarNoFeed ?? true);
  const proprias = usePerfil((s) => s.estantesProprias ?? []);
  const usuario = usePerfil((s) => s.usuario);
  const atualizar = usePerfil((s) => s.atualizar);
  return (
    <div className="space-y-8">
      <section>
        <h2 className={tituloSecao}>Atividades de leitura</h2>
        <Interruptor
          ligado={publicarNoFeed}
          onChange={(v) => atualizar({ publicarNoFeed: v })}
          titulo="Mostrar minhas leituras no feed"
          texto="quando você começa, termina ou avalia um livro, quem te segue vê. desligado, só aparece o que você publicar. os clubes continuam vendo o que acontece neles."
        />
      </section>
      <section>
        <h2 className={tituloSecao}>Estantes</h2>
        {proprias.length ? (
          <ul className="mt-2">
            {proprias.map((e) => (
              <li key={e.id}>
                <Interruptor
                  ligado={e.publica}
                  onChange={(v) => atualizar({ estantesProprias: proprias.map((x) => (x.id === e.id ? { ...x, publica: v } : x)) })}
                  titulo={e.nome}
                  texto={e.publica ? "aparece no seu perfil" : "só você vê"}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[13px] text-cinza">você ainda não criou estantes próprias. lidos, lendo e quero ler aparecem no seu perfil.</p>
        )}
      </section>
      <p className="text-[12px] text-cinza">seu perfil (@{usuario || "…"}) pode ser encontrado pelo nome e pelo @. as estantes privadas não aparecem para ninguém.</p>
    </div>
  );
}

function Interruptor({ ligado, onChange, titulo, texto }: { ligado: boolean; onChange: (v: boolean) => void; titulo: string; texto: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 border-b border-linha py-3.5">
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold">{titulo}</span>
        <span className="mt-0.5 block text-[12px] text-cinza">{texto}</span>
      </span>
      <input type="checkbox" role="switch" checked={ligado} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden className={`relative mt-0.5 h-6 w-11 flex-none rounded-full transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-bordo ${ligado ? "bg-bordo" : "bg-bege"}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-creme shadow transition-all ${ligado ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </label>
  );
}

/* ───────── seus dados ───────── */
function Dados() {
  const router = useRouter();
  const quantos = usePerfil((s) => s.livros.length);
  const esvaziarEstante = usePerfil((s) => s.esvaziarEstante);
  function baixar() {
    const p = usePerfil.getState();
    const dados = { exportado_em: new Date().toISOString(), nome: p.nome, usuario: p.usuario, frase: p.frase, meta: p.meta, tema: p.tema, favoritos: p.favoritos, estantes: p.estantesProprias, livros: p.livros };
    const url = URL.createObjectURL(new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `the-bookside-${p.usuario || "meus-dados"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function esvaziar() {
    if (!quantos) return;
    if (!confirm(`tirar ${quantos === 1 ? "o livro" : `os ${quantos} livros`} da sua estante? as notas, resenhas e o progresso de leitura deles somem junto. as fichas dos clubes continuam. não dá para desfazer.`)) return;
    esvaziarEstante();
    await apagarMinhasAtividades().catch(() => {});
    router.push("/estantes");
  }
  return (
    <div className="space-y-8">
      <section>
        <h2 className={tituloSecao}>Seus dados</h2>
        <div className={linha}>
          <span>
            <span className="block text-[14px] font-semibold">Baixar uma cópia</span>
            <span className="block text-[12px] text-cinza">seus livros, notas, resenhas e estantes num arquivo.</span>
          </span>
          <button type="button" onClick={baixar} className="min-h-10 text-[13px] font-semibold text-bordo">
            baixar (.json)
          </button>
        </div>
      </section>
      {/* ação destrutiva separada e bem identificada */}
      <section className="rounded-[6px] border border-bordo/40 p-4">
        <h2 className="text-[14px] font-semibold text-bordo">Esvaziar a estante</h2>
        <p className="mt-1 text-[12px] text-tinta-suave">
          {quantos ? `${quantos} ${quantos === 1 ? "livro" : "livros"} na estante.` : "a estante está vazia."} tira todos os livros, notas e resenhas. não dá para desfazer.
        </p>
        <button type="button" onClick={esvaziar} disabled={!quantos} className="mt-3 h-10 rounded-[6px] border border-bordo px-4 text-[13px] font-semibold text-bordo disabled:opacity-40">
          esvaziar a estante
        </button>
      </section>
    </div>
  );
}
