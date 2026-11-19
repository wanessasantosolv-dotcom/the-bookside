"use client";

import { celebrar } from "@/lib/celebrar";

import { Voltar } from "@/components/Voltar";
import { TelaApp } from "@/components/AppShell";
import { useMemo, useState } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { CadastroManual } from "@/components/clube/CadastroManual";
import { useHidratado } from "@/components/PerfilHidratacao";
import { PerguntaTermino } from "@/components/PerguntaTermino";
import { useBuscaLivros, type LivroBusca } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { useVoltar } from "@/lib/navegacao";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";
import { semPublicar } from "@/lib/social";

const MAXIMO = 4;

const semAcento = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Escolher os até 4 favoritos do perfil — uma tela só deles, separada da edição do perfil. */
function Escolha({ inicial }: { inicial: string[] }) {
  const voltar = useVoltar("/perfil");
  const livros = usePerfil((s) => s.livros);
  const atualizar = usePerfil((s) => s.atualizar);
  const editarLivro = usePerfil((s) => s.editarLivro);
  const [escolhidos, setEscolhidos] = useState(inicial);
  const [termo, setTermo] = useState("");
  const [deFora, setDeFora] = useState<LivroBusca | null>(null);
  const [cadastrar, setCadastrar] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const cheio = escolhidos.length >= MAXIMO;
  const busca = useBuscaLivros(termo);
  const limpo = semAcento(termo.trim());

  // lidos primeiro (os mais recentes antes), depois o resto da estante
  const estante = useMemo(() => {
    const peso = (l: LivroSalvo) => (l.status === "lido" ? 0 : 1);
    return [...livros]
      .sort(
        (a, b) =>
          peso(a) - peso(b) ||
          (b.lidoEm ?? b.adicionadoEm ?? "").localeCompare(
            a.lidoEm ?? a.adicionadoEm ?? "",
          ),
      )
      .filter(
        (l) => !limpo || semAcento(`${l.titulo} ${l.autor}`).includes(limpo),
      );
  }, [livros, limpo]);

  const naEstante = new Set(livros.map((l) => l.id));
  const daInternet =
    limpo.length >= 2 && busca.estado !== "sugestoes"
      ? busca.resultados.filter((l) => !naEstante.has(l.id)).slice(0, 8)
      : [];

  function alternar(id: string) {
    setSalvo(false);
    if (!escolhidos.includes(id) && escolhidos.length < MAXIMO)
      celebrar({ tipo: "favorito", titulo: "favorito" });
    setEscolhidos((e) =>
      e.includes(id)
        ? e.filter((x) => x !== id)
        : e.length < MAXIMO
          ? [...e, id]
          : e,
    );
  }

  /** livro que não estava na estante: entra como lido (sem virar novidade no feed) e já vira favorito */
  function adicionarLido(l: LivroBusca, lidoEm: string) {
    semPublicar(() =>
      editarLivro(
        { id: l.id, titulo: l.titulo, autor: l.autor, capa: l.capa },
        {
          status: "lido",
          lidoEm,
          paginas: l.paginas,
          paginaAtual: l.paginas,
          genero: l.genero,
          sinopse: l.sinopse,
        },
      ),
    );
    if (!cheio) setEscolhidos((e) => [...e, l.id]);
    setSalvo(false);
    setDeFora(null);
    setCadastrar(false);
    setTermo("");
  }

  function salvar() {
    atualizar({ favoritos: escolhidos });
    setSalvo(true);
    voltar.ir();
  }

  const porId = new Map(livros.map((l) => [l.id, l]));

  return (
    <TelaApp aba="perfil">
      <div className="mx-auto flex w-full max-w-[640px] flex-1 flex-col lg:mx-0 lg:max-w-[720px]">
        <header className="flex items-center justify-between px-6 pt-2 lg:px-0">
          <Voltar
            padrao="/perfil"
            rotulo="perfil"
            className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo"
          />
          <span className="eyebrow !text-[10px] text-cinza">favoritos</span>
        </header>

        <div className="animate-subir px-6 pt-4 lg:px-0">
          <h1 className="font-display text-[30px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[36px] lg:font-normal lg:text-tinta">
            seus favoritos
          </h1>
          <p className="mt-2 font-accent text-[15px] italic text-cinza">
            até 4 livros que contam quem você é. eles ficam em destaque no seu
            perfil.
          </p>

          {/* os 4 lugares */}
          <ol className="mt-5 grid grid-cols-4 gap-2.5 sm:gap-4">
            {Array.from({ length: MAXIMO }, (_, i) => {
              const l = porId.get(escolhidos[i]);
              return (
                <li key={i} className="relative">
                  {l ? (
                    <>
                      <CapaLivro
                        titulo={l.titulo}
                        capa={l.capa}
                        cor={corDoLivro(l.id)}
                        className="w-full"
                      />
                      <button
                        type="button"
                        onClick={() => alternar(l.id)}
                        aria-label={`tirar ${l.titulo} dos favoritos`}
                        className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full border-2 border-creme bg-bordo text-sm leading-none text-creme"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <span className="flex aspect-[2/3] w-full items-center justify-center rounded-[4px] border-[1.5px] border-dashed border-rosa-antigo/70 font-display text-2xl font-semibold italic text-rosa-antigo/70">
                      {i + 1}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          <p
            className="mt-3 text-xs font-semibold text-bordo"
            aria-live="polite"
          >
            {escolhidos.length} de {MAXIMO}
            {cheio ? " · para trocar, tire um primeiro" : ""}
          </p>

          <label className="mt-6 block">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-[.12em] text-bordo uppercase">
              procurar um livro
            </span>
            <span className="flex h-12 items-center gap-2 rounded-[12px] border border-bege bg-creme-quente px-4 focus-within:border-bordo focus-within:ring-1 focus-within:ring-bordo lg:rounded-[4px]">
              <svg
                aria-hidden
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="flex-none text-cinza"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
              <input
                type="search"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="na sua estante ou em qualquer lugar"
                autoComplete="off"
                className="w-full min-w-0 bg-transparent text-[15px] outline-none focus-visible:outline-none"
              />
            </span>
          </label>
        </div>

        <div className="flex-1 px-6 pt-5 pb-6 lg:px-0">
          {estante.length ? (
            <fieldset>
              <legend className="mb-3 text-[11px] font-semibold tracking-[.12em] text-cinza uppercase">
                {limpo ? "na sua estante" : "da sua estante"}
              </legend>
              <div className="grid grid-cols-3 gap-x-3 gap-y-4 sm:grid-cols-4 sm:gap-x-4">
                {estante.map((l) => {
                  const on = escolhidos.includes(l.id);
                  return (
                    <label
                      key={l.id}
                      className={`relative block cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bordo ${
                        !on && cheio ? "opacity-45" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={on}
                        disabled={!on && cheio}
                        onChange={() => alternar(l.id)}
                      />
                      <CapaLivro
                        titulo={l.titulo}
                        capa={l.capa}
                        cor={corDoLivro(l.id)}
                        className={`w-full ${on ? "ring-2 ring-bordo ring-offset-2 ring-offset-creme" : ""}`}
                      />
                      <span
                        aria-hidden
                        className={`absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border-2 border-creme text-xs font-bold ${
                          on
                            ? "bg-bordo text-creme"
                            : "bg-creme/70 text-transparent"
                        }`}
                      >
                        ✓
                      </span>
                      <span className="mt-1.5 block truncate text-[12px] font-medium">
                        {l.titulo}
                      </span>
                      <span className="block truncate text-[11px] text-cinza">
                        {l.status === "lido"
                          ? "lido"
                          : l.status === "quero"
                            ? "quero ler"
                            : "lendo"}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : limpo ? (
            <p className="font-accent text-sm italic text-cinza">
              esse livro não está na sua estante.
            </p>
          ) : (
            <p className="font-accent text-[15px] italic text-cinza">
              sua estante ainda está vazia — procure acima um livro que você já
              leu.
            </p>
          )}

          {limpo.length >= 2 ? (
            <section className="mt-8" aria-live="polite">
              <h2 className="text-[11px] font-semibold tracking-[.12em] text-cinza uppercase">
                esqueceu de marcar como lido?
              </h2>
              <p className="mt-1 font-accent text-sm italic text-cinza">
                escolha o livro: ele entra nos seus lidos e já vira favorito.
              </p>
              {busca.estado === "carregando" ? (
                <p className="mt-3 font-accent text-sm italic text-cinza">
                  procurando…
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-linha/70 rounded-[12px] border border-linha lg:rounded-[4px]">
                  {daInternet.map((l) => (
                    <li key={l.id}>
                      <button
                        type="button"
                        onClick={() => setDeFora(l)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-rosa-fundo/50"
                      >
                        <CapaLivro
                          titulo={l.titulo}
                          capa={l.capa}
                          cor={l.cor}
                          className="w-9 flex-none [&>span:last-child]:hidden"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">
                            {l.titulo}
                          </span>
                          <span className="block truncate text-xs text-cinza">
                            {l.autor}
                          </span>
                        </span>
                        <span className="flex-none text-xs font-semibold text-bordo">
                          + já li
                        </span>
                      </button>
                    </li>
                  ))}
                  {!daInternet.length ? (
                    <li className="px-4 py-3 font-accent text-sm italic text-cinza">
                      não achamos esse livro por aí.
                    </li>
                  ) : null}
                  <li>
                    <button
                      type="button"
                      onClick={() => setCadastrar(true)}
                      className="flex min-h-11 w-full items-center px-4 text-left text-xs font-semibold text-bordo"
                    >
                      não achou? cadastrar o livro à mão →
                    </button>
                  </li>
                </ul>
              )}
              {cadastrar ? (
                <div className="mt-4">
                  <CadastroManual
                    termoInicial={termo}
                    onCancelar={() => setCadastrar(false)}
                    onCadastrar={(l) => {
                      setCadastrar(false);
                      setDeFora(l);
                    }}
                  />
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <footer className="sticky bottom-0 bg-gradient-to-t from-creme from-70% to-transparent px-6 pt-4 pb-[max(24px,env(safe-area-inset-bottom))] lg:px-0">
          <button
            type="button"
            onClick={salvar}
            className="h-12 w-full rounded-pill bg-bordo text-sm font-semibold text-creme hover:bg-bordo-suave sm:ml-auto sm:block sm:w-auto sm:min-w-[240px] sm:px-8"
          >
            {salvo ? "salvo ✓" : "salvar favoritos"}
          </button>
        </footer>
      </div>

      {deFora ? (
        <PerguntaTermino
          titulo={deFora.titulo}
          onCancelar={() => setDeFora(null)}
          onConfirmar={(lidoEm) => adicionarLido(deFora, lidoEm)}
        />
      ) : null}
    </TelaApp>
  );
}

export default function FavoritosPage() {
  const hidratado = useHidratado();
  const favoritos = usePerfil((s) => s.favoritos);
  if (!hidratado) return <TelaApp aba="perfil">{null}</TelaApp>;
  return <Escolha inicial={favoritos ?? []} />;
}
