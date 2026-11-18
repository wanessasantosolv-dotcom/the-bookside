"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Animacao } from "@/components/Animacao";
import { CapaLivro } from "@/components/CapaLivro";
import { useClube } from "@/components/clube/ClubeContexto";
import {
  botaoPrincipal,
  campo,
  Rodape,
  rotuloCampo,
  TopoForm,
} from "@/components/clube/Pecas";
import { Vazio } from "@/components/social/Estados";
import { buscaDoApp, type LivroBusca } from "@/lib/catalogo";
import {
  adicionarLidoAoClube,
  livrosDoClube,
  salvarFicha,
  type LivroDoClube,
} from "@/lib/clubes";
import { corDoLivro } from "@/lib/cores";
import { dataDoDia, diaLocal } from "@/lib/datas";
import {
  acharLivro,
  lerArquivo,
  lerLista,
  normalizar,
  type ItemImport,
} from "@/lib/importar";
import { usePerfil } from "@/lib/perfil-store";
import { semPublicar } from "@/lib/social";

type Linha = {
  item: ItemImport;
  opcoes: LivroBusca[];
  /** -1 = usar só o que foi escrito (cadastro manual) */
  escolhido: number;
  dia: string;
  incluir: boolean;
  jaNoClube: boolean;
  termo?: string;
  buscando?: boolean;
};

const espera = (ms: number) => new Promise((ok) => setTimeout(ok, ms));
const temFicha = (i: ItemImport) =>
  !!(
    i.nota ||
    i.citacao ||
    i.personagem ||
    i.resenha ||
    (i.notas && Object.keys(i.notas).length)
  );

/**
 * Importar de uma vez os livros que o clube já leu (só quem modera), como na estante
 * pessoal: uma lista colada ("título - 14/04", um por linha) ou um arquivo .json.
 * Se a lista tiver notas e fichas, elas viram a ficha de quem importou.
 */
export default function ImportarNoClubePage() {
  const { clube, papel, recarregar } = useClube();
  const router = useRouter();
  const editarLivro = usePerfil((s) => s.editarLivro);
  const [texto, setTexto] = useState("");
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [progresso, setProgresso] = useState<{
    feito: number;
    total: number;
  } | null>(null);
  const [euLi, setEuLi] = useState(true);
  const [salvando, setSalvando] = useState<{
    feito: number;
    total: number;
  } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const arquivo = useRef<HTMLInputElement>(null);

  if (papel !== "moderadora")
    return (
      <div className="px-6 pt-6 lg:px-0">
        <Vazio
          titulo="só quem modera importa livros no clube"
          acao={{
            href: `/clubes/${clube.id}/biblioteca`,
            rotulo: "voltar à biblioteca",
          }}
        />
      </div>
    );

  async function procurar(itens: ItemImport[]) {
    if (!itens.length)
      return setErro(
        "não achei nenhum livro. escreva um por linha, como “três - 27/05”.",
      );
    setErro(null);
    setProgresso({ feito: 0, total: itens.length });
    const doClube = new Set(
      (await livrosDoClube(clube.id).catch(() => [] as LivroDoClube[])).map(
        (l) => normalizar(l.livro.titulo),
      ),
    );
    const resultado: Linha[] = [];
    for (const [i, item] of itens.entries()) {
      const opcoes = await acharLivro(item).catch(() => [] as LivroBusca[]);
      const jaNoClube =
        doClube.has(normalizar(item.titulo)) ||
        (!!opcoes[0] && doClube.has(normalizar(opcoes[0].titulo)));
      resultado.push({
        item,
        opcoes,
        escolhido: opcoes.length ? 0 : -1,
        dia: item.lidoEm ?? diaLocal(),
        incluir: !jaNoClube,
        jaNoClube,
      });
      setProgresso({ feito: i + 1, total: itens.length });
      await espera(300);
    }
    setProgresso(null);
    setLinhas(resultado);
  }

  async function abrirArquivo(f: File | undefined) {
    if (!f) return;
    try {
      const conteudo = await f.text();
      const json = f.name.endsWith(".json") || /^\s*[[{]/.test(conteudo);
      await procurar(json ? lerArquivo(conteudo) : lerLista(conteudo));
    } catch {
      setErro("não consegui ler esse arquivo.");
    }
  }

  const mudar = (i: number, dados: Partial<Linha>) =>
    setLinhas((ls) => ls!.map((l, k) => (k === i ? { ...l, ...dados } : l)));

  async function procurarDeNovo(i: number, termo: string) {
    if (!linhas || termo.trim().length < 2) return;
    mudar(i, { buscando: true });
    const opcoes = (
      await buscaDoApp(termo.trim()).catch(() => [] as LivroBusca[])
    ).slice(0, 12);
    mudar(i, {
      opcoes,
      escolhido: opcoes.length ? 0 : -1,
      buscando: false,
      termo: opcoes.length ? undefined : termo,
    });
  }

  async function salvar() {
    if (!linhas) return;
    const escolhidas = linhas.filter((l) => l.incluir);
    setSalvando({ feito: 0, total: escolhidas.length });
    let falhas = 0;
    for (const [k, l] of escolhidas.entries()) {
      const achado = l.escolhido >= 0 ? l.opcoes[l.escolhido] : undefined;
      const livro = {
        id:
          achado?.id ??
          `manual-${normalizar(l.item.titulo).replace(/ /g, "-").slice(0, 40)}-${Date.now().toString(36)}${k}`,
        titulo: achado?.titulo ?? l.item.titulo,
        autor:
          achado?.autor ??
          l.item.autor?.toLowerCase() ??
          "autoria desconhecida",
        capa: achado?.capa,
        paginas: achado?.paginas ?? l.item.paginas,
      };
      const terminouEm = dataDoDia(l.dia);
      try {
        const id = await adicionarLidoAoClube(clube.id, livro, terminouEm);
        // a lista trouxe nota/ficha: vira a ficha de quem importou (sem avisar no feed)
        if (temFicha(l.item))
          await salvarFicha(
            { id, clube_id: clube.id, livro } as LivroDoClube,
            {
              notas: l.item.notas ?? {},
              nota: l.item.nota ?? null,
              personagem: l.item.personagem ?? null,
              citacao: l.item.citacao ?? null,
              texto: l.item.resenha ?? null,
              spoiler: false,
            },
            true,
          ).catch(() => {});
        if (euLi)
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
                ...(l.item.nota ? { nota: l.item.nota } : {}),
                ...(l.item.personagem ? { personagem: l.item.personagem } : {}),
                ...(l.item.citacao ? { citacao: l.item.citacao } : {}),
                ...(l.item.resenha ? { resenha: l.item.resenha } : {}),
              },
            ),
          );
      } catch {
        falhas++;
      }
      setSalvando({ feito: k + 1, total: escolhidas.length });
    }
    setSalvando(null);
    if (falhas === escolhidas.length && falhas)
      return setErro(
        "o banco não deixou salvar. rode de novo o arquivo supabase/social.sql no SQL Editor do Supabase e tente outra vez.",
      );
    recarregar();
    router.push(`/clubes/${clube.id}/biblioteca`);
  }

  if (progresso)
    return (
      <Animacao
        tipo="pilha"
        titulo={`procurando ${progresso.feito} de ${progresso.total}`}
        sub="título, autoria e o título original"
      />
    );
  if (salvando)
    return (
      <Animacao
        tipo="carimbo"
        titulo={`guardando ${salvando.feito} de ${salvando.total}`}
        sub="no histórico do clube"
        tela
      />
    );

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <TopoForm
        voltar={{ href: `/clubes/${clube.id}/biblioteca`, r: "biblioteca" }}
        rotulo="histórico do clube"
        titulo="importar livros já lidos"
        frase="cole a lista do clube e o app acha cada livro ✦"
      />
      {!linhas ? (
        <div className="mt-6 space-y-4 px-6 lg:max-w-[640px] lg:px-0">
          <label className="block">
            <span className={rotuloCampo}>
              um livro por linha, com a data em que o clube terminou
            </span>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={9}
              placeholder={
                "três - 30/05\no rio que me corta por dentro - 10/06\neu que nunca conheci os homens - 10/07"
              }
              className={`${campo} resize-y font-mono text-[13px]`}
            />
          </label>
          <p className="font-accent text-[13px] italic text-cinza">
            pode pôr a autoria junto (“recursão · blake crouch - 12/10”) e as
            estrelas (“★★★★½”). também aceita o arquivo .json da importação
            pessoal, com as fichas.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => procurar(lerLista(texto))}
              disabled={!texto.trim()}
              className={`${botaoPrincipal} !w-auto px-6`}
            >
              procurar os livros
            </button>
            <button
              type="button"
              onClick={() => arquivo.current?.click()}
              className="flex min-h-12 items-center rounded-pill border border-bordo px-5 text-sm font-semibold text-bordo"
            >
              abrir arquivo
            </button>
            <input
              ref={arquivo}
              type="file"
              accept=".txt,.json,.csv"
              className="sr-only"
              tabIndex={-1}
              onChange={(e) => abrirArquivo(e.target.files?.[0])}
            />
          </div>
          {erro ? (
            <p role="alert" className="text-[13px] text-bordo">
              {erro}
            </p>
          ) : null}
        </div>
      ) : (
        <>
          <ul className="mt-5 px-6 lg:max-w-[760px] lg:px-0">
            {linhas.map((l, i) => {
              const achado =
                l.escolhido >= 0 ? l.opcoes[l.escolhido] : undefined;
              return (
                <li
                  key={i}
                  className={`border-t border-linha py-4 lg:border-fio ${l.incluir ? "" : "opacity-50"}`}
                >
                  <div className="flex gap-3.5">
                    <CapaLivro
                      titulo={achado?.titulo ?? l.item.titulo}
                      capa={achado?.capa}
                      cor={corDoLivro(achado?.id ?? l.item.titulo)}
                      className="w-[54px] self-start [&>span:last-child]:text-[8px]"
                    />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs text-cinza">
                          você escreveu: <i>{l.item.titulo}</i>
                          {l.jaNoClube ? (
                            <span className="ml-1 font-semibold text-bordo">
                              · já está no clube
                            </span>
                          ) : null}
                          {temFicha(l.item) ? (
                            <span className="ml-1 text-bordo">
                              · com a sua ficha ✎
                            </span>
                          ) : null}
                        </p>
                        <label className="flex min-h-9 flex-none items-center gap-1.5 text-xs">
                          <input
                            type="checkbox"
                            checked={l.incluir}
                            onChange={(e) =>
                              mudar(i, { incluir: e.target.checked })
                            }
                            className="size-4 accent-bordo"
                          />
                          incluir
                        </label>
                      </div>
                      <select
                        value={l.escolhido}
                        onChange={(e) =>
                          mudar(i, { escolhido: Number(e.target.value) })
                        }
                        aria-label="qual livro é"
                        className="min-h-11 w-full rounded-md border border-linha bg-creme-quente px-3 text-sm"
                      >
                        {l.opcoes.map((o, k) => (
                          <option key={o.id} value={k}>
                            {o.titulo} — {o.autor}
                            {o.ano ? ` (${o.ano})` : ""}
                          </option>
                        ))}
                        <option value={-1}>
                          cadastrar manualmente (só o que escrevi)
                        </option>
                      </select>
                      {l.termo === undefined ? (
                        <button
                          type="button"
                          onClick={() => mudar(i, { termo: l.item.titulo })}
                          className="min-h-9 text-xs font-semibold text-bordo underline underline-offset-4"
                        >
                          {l.opcoes.length
                            ? "não é esse? procurar de novo"
                            : "nada encontrado · procurar de novo"}
                        </button>
                      ) : (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            void procurarDeNovo(i, l.termo ?? "");
                          }}
                          className="flex gap-2"
                        >
                          <input
                            type="search"
                            value={l.termo}
                            onChange={(e) =>
                              mudar(i, { termo: e.target.value })
                            }
                            placeholder="título ou autoria"
                            aria-label="buscar por título ou autoria"
                            className="min-h-10 min-w-0 flex-1 rounded-md border border-linha bg-creme-quente px-3 text-sm outline-none focus:border-bordo"
                          />
                          <button
                            type="submit"
                            disabled={l.buscando}
                            className="min-h-10 rounded-pill bg-bordo px-4 text-xs font-semibold text-creme disabled:opacity-60"
                          >
                            {l.buscando ? "procurando…" : "procurar"}
                          </button>
                        </form>
                      )}
                      <label className="flex items-center gap-2 text-xs text-cinza">
                        o clube terminou em
                        <input
                          type="date"
                          value={l.dia}
                          max={diaLocal()}
                          onChange={(e) =>
                            e.target.value && mudar(i, { dia: e.target.value })
                          }
                          className="min-h-9 rounded-md border border-linha bg-creme-quente px-2 text-[13px]"
                        />
                      </label>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-2 px-6 lg:px-0">
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={euLi}
                onChange={(e) => setEuLi(e.target.checked)}
                className="size-5 accent-bordo"
              />
              eu também li: colocar todos na minha estante como lidos
            </label>
            {erro ? (
              <p role="alert" className="mt-2 text-[13px] text-bordo">
                {erro}
              </p>
            ) : null}
          </div>
          <Rodape>
            <button
              type="button"
              onClick={salvar}
              disabled={!linhas.some((l) => l.incluir)}
              className={`${botaoPrincipal} lg:max-w-[560px]`}
            >
              colocar {linhas.filter((l) => l.incluir).length} no histórico do
              clube
            </button>
          </Rodape>
        </>
      )}
    </div>
  );
}
