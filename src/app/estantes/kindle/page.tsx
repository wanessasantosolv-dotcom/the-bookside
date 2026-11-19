"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useHidratado } from "@/components/PerfilHidratacao";
import { Voltar } from "@/components/Voltar";
import { formasDoTitulo } from "@/lib/catalogo";
import { acharLivro } from "@/lib/importar";
import { lerClippings, type LivroKindle } from "@/lib/kindle";
import {
  usePerfil,
  type LivroSalvo,
  type StatusLivro,
} from "@/lib/perfil-store";
import { semPublicar } from "@/lib/social";

type Destino = StatusLivro | "nao";
type Linha = {
  k: LivroKindle;
  /** o livro da estante com o mesmo título (se tiver) */
  naEstante?: LivroSalvo;
  destino: Destino;
};

/**
 * Importar do Kindle: lê o arquivo de destaques (My Clippings.txt) e traz os
 * livros e os trechos marcados para a estante.
 */
export default function KindlePage() {
  const hidratado = useHidratado();
  const router = useRouter();
  const livros = usePerfil((s) => s.livros);
  const editarLivro = usePerfil((s) => s.editarLivro);
  const arquivo = useRef<HTMLInputElement>(null);
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState<{
    feito: number;
    total: number;
  } | null>(null);

  const porTitulo = useMemo(() => {
    const m = new Map<string, LivroSalvo>();
    for (const l of livros)
      for (const f of formasDoTitulo(l.titulo)) m.set(f, l);
    return m;
  }, [livros]);

  async function abrir(f: File) {
    setErro(null);
    const texto = await f.text();
    const achados = lerClippings(texto);
    if (!achados.length)
      return setErro(
        "não achei destaques nesse arquivo. ele precisa ser o “My Clippings.txt” do Kindle.",
      );
    setLinhas(
      achados.map((k) => {
        const naEstante = formasDoTitulo(k.titulo)
          .map((x) => porTitulo.get(x))
          .find(Boolean);
        return {
          k,
          naEstante,
          destino: naEstante ? (naEstante.status ?? "lido") : "lido",
        };
      }),
    );
  }

  async function salvar() {
    if (!linhas) return;
    const escolhidas = linhas.filter((l) => l.destino !== "nao");
    setSalvando({ feito: 0, total: escolhidas.length });
    for (const [i, l] of escolhidas.entries()) {
      const trechosNovos = l.k.trechos.map((t) => ({
        ...t,
        origem: "kindle" as const,
      }));
      let base: Pick<LivroSalvo, "id" | "titulo" | "autor" | "capa">;
      let extra: Partial<LivroSalvo> = {};
      if (l.naEstante) base = l.naEstante;
      else {
        // acha o livro no catálogo (capa, páginas); se não achar, entra com o que veio do Kindle
        const achado = (
          await acharLivro({ titulo: l.k.titulo, autor: l.k.autor }).catch(
            () => [],
          )
        )[0];
        base = achado
          ? {
              id: achado.id,
              titulo: achado.titulo,
              autor: achado.autor,
              capa: achado.capa,
            }
          : {
              id: `kindle-${l.k.titulo
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .slice(0, 40)}`,
              titulo: l.k.titulo,
              autor: l.k.autor.toLowerCase() || "autoria desconhecida",
            };
        extra = {
          status: l.destino as StatusLivro,
          formato: "ebook",
          paginas: achado?.paginas,
          ...(l.destino === "lido"
            ? { lidoEm: l.k.trechos.at(-1)?.em, paginaAtual: achado?.paginas }
            : {}),
        };
      }
      const atual = usePerfil.getState().livros.find((x) => x.id === base.id);
      const jaTem = new Set((atual?.trechos ?? []).map((t) => t.texto));
      const trechos = [
        ...(atual?.trechos ?? []),
        ...trechosNovos.filter((t) => !jaTem.has(t.texto)),
      ];
      // a importação não vira novidade no feed
      semPublicar(() =>
        editarLivro(base, {
          ...extra,
          trechos,
        }),
      );
      setSalvando({ feito: i + 1, total: escolhidas.length });
    }
    router.push("/perfil/resenhas");
  }

  if (!hidratado) return <AppShell aba="estantes">{null}</AppShell>;
  const mudar = (i: number, destino: Destino) =>
    setLinhas(
      (ls) => ls && ls.map((l, k) => (k === i ? { ...l, destino } : l)),
    );
  const total =
    linhas?.reduce(
      (t, l) => t + (l.destino === "nao" ? 0 : l.k.trechos.length),
      0,
    ) ?? 0;

  return (
    <AppShell aba="estantes">
      <div className="flex flex-1 flex-col px-6 pt-2 pb-10 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="lg:max-w-[760px]">
          <Voltar
            padrao="/estantes"
            rotulo="estantes"
            className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo"
          />
          <h1 className="mt-1 font-display text-[30px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
            trazer do kindle
          </h1>
          <p className="mt-1.5 font-accent text-sm italic text-cinza">
            os livros e os trechos que você marcou no kindle, direto na sua
            estante ✦
          </p>

          {!linhas ? (
            <>
              <ol className="mt-6 space-y-3 rounded-[12px] border border-linha bg-creme-quente p-5 text-[14px] text-ameixa lg:rounded-[6px]">
                <li>
                  <b className="text-bordo">1.</b> ligue o kindle no computador
                  com o cabo (ele aparece como um pen drive).
                </li>
                <li>
                  <b className="text-bordo">2.</b> abra a pasta <b>documents</b>{" "}
                  e ache o arquivo <b>My Clippings.txt</b> (no kindle em
                  português pode se chamar “Meus recortes.txt”).
                </li>
                <li>
                  <b className="text-bordo">3.</b> escolha esse arquivo aqui
                  embaixo.
                </li>
              </ol>
              <p className="mt-3 text-xs text-cinza">
                o arquivo é lido aqui no seu aparelho; só os trechos que você
                escolher vão para a sua estante.
              </p>
              <input
                ref={arquivo}
                type="file"
                accept=".txt,text/plain"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void abrir(f);
                }}
              />
              <button
                type="button"
                onClick={() => arquivo.current?.click()}
                className="mt-5 h-12 w-full rounded-pill bg-bordo px-8 text-sm font-semibold text-creme hover:bg-bordo-suave sm:w-auto"
              >
                escolher o arquivo do kindle
              </button>
              {erro ? (
                <p role="alert" className="mt-3 text-[13px] text-bordo">
                  {erro}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <p className="mt-6 text-[13px] text-cinza">
                {linhas.length} {linhas.length === 1 ? "livro" : "livros"} com
                destaques. escolha onde cada um entra:
              </p>
              <ul className="mt-3 divide-y divide-linha border-y border-linha">
                {linhas.map((l, i) => (
                  <li key={`${l.k.titulo}-${i}`} className="py-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[17px] leading-tight font-semibold italic text-ameixa lg:font-revista lg:font-normal">
                          {l.k.titulo}
                        </p>
                        <p className="mt-0.5 text-xs text-cinza">
                          {l.k.autor || "autoria desconhecida"} ·{" "}
                          {l.k.trechos.length}{" "}
                          {l.k.trechos.length === 1 ? "trecho" : "trechos"}
                          {l.naEstante ? (
                            <b className="ml-1 font-semibold text-oliva">
                              · já está na sua estante
                            </b>
                          ) : null}
                        </p>
                      </div>
                      {l.naEstante ? (
                        <label className="flex items-center gap-2 text-xs text-ameixa">
                          <input
                            type="checkbox"
                            checked={l.destino !== "nao"}
                            onChange={(e) =>
                              mudar(
                                i,
                                e.target.checked
                                  ? (l.naEstante!.status ?? "lido")
                                  : "nao",
                              )
                            }
                            className="size-4 accent-bordo"
                          />
                          juntar os trechos
                        </label>
                      ) : (
                        <select
                          value={l.destino}
                          onChange={(e) => mudar(i, e.target.value as Destino)}
                          className="h-9 rounded-pill border border-bege bg-creme-quente px-3 text-xs font-semibold text-ameixa"
                        >
                          <option value="lido">lidos</option>
                          <option value="lendo">lendo</option>
                          <option value="quero">quero ler</option>
                          <option value="nao">não trazer</option>
                        </select>
                      )}
                    </div>
                    <p className="mt-2 line-clamp-2 border-l-2 border-bordo/30 pl-3 font-accent text-[13px] italic text-cinza">
                      “{l.k.trechos[0].texto}”
                    </p>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  disabled={!!salvando || !total}
                  onClick={salvar}
                  className="h-12 rounded-pill bg-bordo px-8 text-sm font-semibold text-creme hover:bg-bordo-suave disabled:opacity-45"
                >
                  {salvando
                    ? `guardando ${salvando.feito} de ${salvando.total}…`
                    : `trazer ${total} ${total === 1 ? "trecho" : "trechos"}`}
                </button>
                <button
                  type="button"
                  onClick={() => setLinhas(null)}
                  className="h-12 rounded-pill border border-bege px-6 text-sm font-semibold text-ameixa"
                >
                  outro arquivo
                </button>
              </div>
              <p className="mt-3 text-xs text-cinza">
                os trechos aparecem na página de cada livro e em{" "}
                <Link
                  href="/perfil/resenhas"
                  className="text-bordo underline underline-offset-4"
                >
                  minhas resenhas
                </Link>
                . nada disso vira novidade no feed.
              </p>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
