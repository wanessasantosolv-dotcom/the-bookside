"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { CadastroManual } from "@/components/clube/CadastroManual";
import { useClube } from "@/components/clube/ClubeContexto";
import {
  botaoPrincipal,
  campo,
  Rodape,
  rotuloCampo,
  TopoForm,
} from "@/components/clube/Pecas";
import { Vazio } from "@/components/social/Estados";
import { useBuscaLivros, type LivroBusca } from "@/lib/catalogo";
import { adicionarLidoAoClube } from "@/lib/clubes";
import { corDoLivro } from "@/lib/cores";
import { dataDoDia, diaLocal } from "@/lib/datas";
import { usePerfil } from "@/lib/perfil-store";
import { semPublicar } from "@/lib/social";

/** Incluir um livro que o clube já leu (monta o histórico do clube). Só quem modera. */
export default function AdicionarLidoPage() {
  const { clube, papel, recarregar } = useClube();
  const router = useRouter();
  const editarLivro = usePerfil((s) => s.editarLivro);
  const [termo, setTermo] = useState("");
  const [livro, setLivro] = useState<LivroBusca | null>(null);
  const [cadastrar, setCadastrar] = useState(false);
  const [dia, setDia] = useState(diaLocal());
  const [euLi, setEuLi] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const busca = useBuscaLivros(termo);

  if (papel !== "moderadora")
    return (
      <div className="px-6 pt-6 lg:px-0">
        <Vazio
          titulo="só quem modera inclui livros já lidos"
          texto="peça para a moderadora do clube incluir. você pode escrever a sua ficha nele depois."
          acao={{
            href: `/clubes/${clube.id}/biblioteca`,
            rotulo: "voltar à biblioteca",
          }}
        />
      </div>
    );

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!livro) return setErro("escolha o livro primeiro.");
    setEnviando(true);
    setErro(null);
    const terminouEm = dataDoDia(dia);
    try {
      await adicionarLidoAoClube(
        clube.id,
        {
          id: livro.id,
          titulo: livro.titulo,
          autor: livro.autor,
          capa: livro.capa?.startsWith("data:") ? undefined : livro.capa,
          paginas: livro.paginas,
        },
        terminouEm,
      );
      if (euLi)
        // na sua estante e nos seus números, sem virar novidade no feed (é uma leitura antiga)
        semPublicar(() =>
          editarLivro(
            {
              id: livro.id,
              titulo: livro.titulo,
              autor: livro.autor,
              capa: livro.capa,
            },
            {
              status: "lido",
              lidoEm: terminouEm,
              paginas: livro.paginas,
              paginaAtual: livro.paginas,
            },
          ),
        );
      recarregar();
      router.push(`/clubes/${clube.id}/biblioteca`);
    } catch (x) {
      const e = x as { code?: string; message?: string };
      setErro(
        e?.code === "42501" || /row-level security/i.test(e?.message ?? "")
          ? "o banco ainda não deixa incluir livros lidos. rode de novo o arquivo supabase/social.sql no SQL Editor do Supabase."
          : "não deu para salvar agora. tente de novo.",
      );
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="flex min-h-[70dvh] flex-col">
      <TopoForm
        voltar={{ href: `/clubes/${clube.id}/biblioteca`, r: "biblioteca" }}
        rotulo="histórico do clube"
        titulo="um livro que já lemos"
        frase="para a biblioteca contar toda a história do clube ✦"
      />
      <div className="mt-6 space-y-6 px-6 lg:max-w-[640px] lg:px-0">
        <div>
          <p className={rotuloCampo}>o livro</p>
          {livro ? (
            <div className="mt-2 flex items-center gap-3 rounded-md border border-bordo bg-rosa-fundo/40 p-3">
              <CapaLivro
                titulo={livro.titulo}
                capa={livro.capa}
                cor={livro.cor || corDoLivro(livro.id)}
                className="w-10 [&>span:last-child]:hidden"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-base font-semibold italic lg:font-revista lg:font-normal">
                  {livro.titulo}
                </span>
                <span className="block truncate text-xs text-cinza">
                  {livro.autor}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setLivro(null)}
                className="min-h-9 px-2 text-xs font-semibold text-bordo underline underline-offset-4"
              >
                trocar
              </button>
            </div>
          ) : (
            <>
              <label className="block">
                <span className="sr-only">
                  buscar o livro pelo título ou autoria
                </span>
                <input
                  type="search"
                  value={termo}
                  onChange={(e) => setTermo(e.target.value)}
                  placeholder="título ou autoria"
                  className={campo}
                  autoComplete="off"
                />
              </label>
              {busca.estado === "sugestoes" ? (
                <p className="mt-2 font-accent text-[13px] italic text-cinza">
                  digite o título ou o nome da autora para procurar.
                </p>
              ) : (
                <ul
                  className="mt-2 max-h-[280px] overflow-y-auto rounded-md border border-linha"
                  aria-live="polite"
                >
                  {busca.estado === "carregando" ? (
                    <li className="px-4 py-3 font-accent text-sm italic text-cinza">
                      procurando…
                    </li>
                  ) : (
                    busca.resultados.slice(0, 12).map((l) => (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => setLivro(l)}
                          className="flex w-full items-center gap-3 border-b border-linha/70 px-3 py-2 text-left hover:bg-rosa-fundo/50"
                        >
                          <CapaLivro
                            titulo={l.titulo}
                            capa={l.capa}
                            cor={l.cor}
                            className="w-8 [&>span:last-child]:hidden"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">
                              {l.titulo}
                            </span>
                            <span className="block truncate text-xs text-cinza">
                              {l.autor}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                  {busca.estado !== "carregando" && !busca.resultados.length ? (
                    <li className="px-4 py-3 font-accent text-sm italic text-cinza">
                      não achamos esse livro.
                    </li>
                  ) : null}
                </ul>
              )}
              {cadastrar ? (
                <CadastroManual
                  termoInicial={termo}
                  onCancelar={() => setCadastrar(false)}
                  onCadastrar={(l) => {
                    setLivro(l);
                    setCadastrar(false);
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setCadastrar(true)}
                  className="mt-2 min-h-9 text-xs font-semibold text-bordo underline underline-offset-4"
                >
                  não achou? cadastrar o livro manualmente
                </button>
              )}
            </>
          )}
        </div>

        <label className="block">
          <span className={rotuloCampo}>quando o clube terminou</span>
          <input
            type="date"
            value={dia}
            max={diaLocal()}
            onChange={(e) => e.target.value && setDia(e.target.value)}
            className={campo}
          />
        </label>

        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={euLi}
            onChange={(e) => setEuLi(e.target.checked)}
            className="size-5 accent-bordo"
          />
          eu também li: colocar na minha estante como lido
        </label>
        <p className="-mt-3 font-accent text-[13px] italic text-cinza">
          as outras pessoas do clube podem escrever a ficha delas depois, e o
          livro entra na estante de cada uma.
        </p>

        {erro ? (
          <p role="alert" className="text-[13px] text-bordo">
            {erro}
          </p>
        ) : null}
      </div>
      <Rodape>
        <button
          type="submit"
          disabled={enviando || !livro}
          className={`${botaoPrincipal} lg:max-w-[640px]`}
        >
          {enviando ? "salvando…" : "colocar no histórico do clube"}
        </button>
      </Rodape>
    </form>
  );
}
