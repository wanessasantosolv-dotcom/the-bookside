"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Animacao } from "@/components/Animacao";
import { CapaLivro } from "@/components/CapaLivro";
import { botaoPrincipal, campo, rotuloCampo } from "@/components/clube/Pecas";
import { buscarLivros, type LivroBusca } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { lerArquivo, lerLista, melhorResultado, normalizar, type ItemImport } from "@/lib/importar";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";
import { semPublicar } from "@/lib/social";

type Linha = {
  item: ItemImport;
  opcoes: LivroBusca[];
  escolhido: number;
  lidoEm: string;
  nota: number;
  incluir: boolean;
};

const notas = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
const rotuloNota = (n: number) =>
  n ? `${"★".repeat(Math.floor(n))}${n % 1 ? "½" : ""} (${String(n).replace(".", ",")})` : "sem nota";
const hoje = () => new Date().toISOString().slice(0, 10);
const espera = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

export default function ImportarPage() {
  const router = useRouter();
  const livros = usePerfil((s) => s.livros);
  const editarLivro = usePerfil((s) => s.editarLivro);
  const [texto, setTexto] = useState("");
  const [linhas, setLinhas] = useState<Linha[] | null>(null);
  const [progresso, setProgresso] = useState<{ feito: number; total: number } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const arquivo = useRef<HTMLInputElement>(null);

  async function procurar(itens: ItemImport[]) {
    if (!itens.length) return setErro("não achei nenhum livro. escreva um por linha, como “três - 27/05”.");
    setErro(null);
    setProgresso({ feito: 0, total: itens.length });
    const resultado: Linha[] = [];
    for (const [i, item] of itens.entries()) {
      let opcoes: LivroBusca[] = [];
      try {
        const achados = await buscarLivros(`${item.titulo} ${item.autor ?? ""}`.trim());
        const melhor = melhorResultado(item, achados);
        opcoes = melhor ? [melhor, ...achados.filter((l) => l.id !== melhor.id)].slice(0, 6) : [];
      } catch {
        /* sem internet: fica só o título digitado */
      }
      resultado.push({
        item,
        opcoes,
        escolhido: opcoes.length ? 0 : -1,
        lidoEm: item.lidoEm ?? hoje(),
        nota: item.nota ?? 0,
        incluir: true,
      });
      setProgresso({ feito: i + 1, total: itens.length });
      await espera(120);
    }
    setProgresso(null);
    setLinhas(resultado);
  }

  async function abrirArquivo(f: File | undefined) {
    if (!f) return;
    try {
      const conteudo = await f.text();
      await procurar(
        f.name.endsWith(".json") || conteudo.trim().startsWith("[") || conteudo.trim().startsWith("{")
          ? lerArquivo(conteudo)
          : lerLista(conteudo),
      );
    } catch {
      setErro("não consegui ler esse arquivo.");
    }
  }

  function mudar(i: number, dados: Partial<Linha>) {
    setLinhas((ls) => ls!.map((l, k) => (k === i ? { ...l, ...dados } : l)));
  }

  function salvar() {
    if (!linhas) return;
    const escolhidas = linhas.filter((l) => l.incluir);
    semPublicar(() => {
      for (const l of escolhidas) {
        const achado = l.escolhido >= 0 ? l.opcoes[l.escolhido] : undefined;
        const titulo = achado?.titulo ?? l.item.titulo;
        const existente = livros.find(
          (x) =>
            (achado && x.id === achado.id) ||
            normalizar(x.titulo) === normalizar(titulo) ||
            normalizar(x.titulo) === normalizar(l.item.titulo),
        );
        const base: Pick<LivroSalvo, "id" | "titulo" | "autor" | "capa" | "genero"> = existente
          ? {
              id: existente.id,
              titulo: existente.titulo,
              autor: existente.autor,
              capa: existente.capa,
              genero: existente.genero,
            }
          : {
              id: achado?.id ?? `imp-${normalizar(l.item.titulo).replace(/ /g, "-")}`,
              titulo,
              autor: achado?.autor ?? (l.item.autor?.toLowerCase() || "autoria desconhecida"),
              capa: achado?.capa,
              genero: achado?.genero,
            };
        const paginas = l.item.paginas ?? achado?.paginas ?? existente?.paginas;
        const it = l.item;
        editarLivro(base, {
          status: "lido",
          lidoEm: new Date(`${l.lidoEm}T12:00:00`).toISOString(),
          iniciadoEm: it.iniciadoEm ? new Date(`${it.iniciadoEm}T12:00:00`).toISOString() : existente?.iniciadoEm,
          paginas,
          paginaAtual: paginas,
          nota: l.nota || undefined,
          ...(it.notas ? { notas: { personagens: 0, plot: 0, escrita: 0, final: 0, ...it.notas } } : {}),
          ...(it.personagem ? { personagem: it.personagem } : {}),
          ...(it.citacao ? { citacao: it.citacao } : {}),
          ...(it.resenha ? { resenha: it.resenha } : {}),
        });
      }
    });
    router.push(`/estantes/lidos?importados=${escolhidas.length}`);
  }

  const titulo =
    "font-display text-[32px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta";

  return (
    <AppShell aba="estantes">
      <div className="flex flex-1 flex-col pb-8 lg:bg-jornal lg:px-12 lg:py-8">
        <header className="flex items-center justify-between px-6 pt-2 lg:px-0 lg:pt-0">
          <Link href="/estantes" className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo">
            ‹ estantes
          </Link>
          <span className="text-[11px] font-semibold tracking-[.16em] text-bordo uppercase">importar</span>
        </header>

        {progresso ? (
          <Animacao
            tipo="pilha"
            titulo="procurando na estante"
            sub={`${progresso.feito} de ${progresso.total} livros encontrados`}
          />
        ) : !linhas ? (
          <div className="px-6 lg:max-w-[640px] lg:px-0">
            <h1 className={`mt-4 ${titulo}`}>importar lidos</h1>
            <p className="mt-1.5 font-accent text-sm italic text-cinza">
              cole sua lista e o app acha cada livro, com capa ✦
            </p>
            <label className="mt-6 block">
              <span className={rotuloCampo}>um livro por linha</span>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                rows={10}
                placeholder={"guerra da papoula - 14/04 ★★★½\nquarta asa - 20/05\ntrês - 27/05 ★★★★"}
                className={`${campo} resize-y font-mono text-[13px]`}
              />
            </label>
            <p className="mt-2 text-xs text-cinza">
              a data é quando você terminou. as estrelas são opcionais — dá para escolher na próxima tela.
            </p>
            {erro ? (
              <p role="alert" className="mt-3 text-[13px] text-bordo">
                {erro}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => procurar(lerLista(texto))}
                disabled={!texto.trim()}
                className={`${botaoPrincipal} max-w-[320px]`}
              >
                procurar os livros
              </button>
              <button
                type="button"
                onClick={() => arquivo.current?.click()}
                className="flex min-h-[52px] items-center rounded-pill border border-bordo px-6 text-[15px] font-semibold text-bordo"
              >
                abrir arquivo
              </button>
              <input
                ref={arquivo}
                type="file"
                accept=".json,.txt,application/json,text/plain"
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => {
                  void abrirArquivo(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
          </div>
        ) : (
          <div className="px-6 lg:max-w-[820px] lg:px-0">
            <h1 className={`mt-4 ${titulo}`}>confira antes de salvar</h1>
            <p className="mt-1.5 font-accent text-sm italic text-cinza">
              {linhas.filter((l) => l.incluir).length} de {linhas.length} livros vão para os lidos. nada disso aparece
              no feed das amigas.
            </p>
            <ul className="mt-5">
              {linhas.map((l, i) => {
                const achado = l.escolhido >= 0 ? l.opcoes[l.escolhido] : undefined;
                const ja = livros.some(
                  (x) =>
                    (achado && x.id === achado.id) ||
                    normalizar(x.titulo) === normalizar(achado?.titulo ?? l.item.titulo) ||
                    normalizar(x.titulo) === normalizar(l.item.titulo),
                );
                return (
                  <li key={i} className={`border-t border-linha py-4 lg:border-fio ${l.incluir ? "" : "opacity-50"}`}>
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
                            {ja ? (
                              <span className="ml-1 font-semibold text-bordo">
                                · já está na estante (será atualizado)
                              </span>
                            ) : null}
                          </p>
                          <label className="flex min-h-9 flex-none items-center gap-1.5 text-xs">
                            <input
                              type="checkbox"
                              checked={l.incluir}
                              onChange={(e) => mudar(i, { incluir: e.target.checked })}
                              className="size-4 accent-bordo"
                            />
                            incluir
                          </label>
                        </div>
                        <label className="block">
                          <span className="sr-only">qual livro é</span>
                          <select
                            value={l.escolhido}
                            onChange={(e) => mudar(i, { escolhido: Number(e.target.value) })}
                            className="min-h-11 w-full rounded-md border border-linha bg-creme-quente px-3 text-sm"
                          >
                            {l.opcoes.map((o, k) => (
                              <option key={o.id} value={k}>
                                {o.titulo} — {o.autor}
                                {o.ano ? ` (${o.ano})` : ""}
                              </option>
                            ))}
                            <option value={-1}>usar só o que escrevi, sem capa</option>
                          </select>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <label className="flex items-center gap-2 text-xs text-cinza">
                            terminei em
                            <input
                              type="date"
                              value={l.lidoEm}
                              onChange={(e) => mudar(i, { lidoEm: e.target.value })}
                              className="min-h-10 rounded-md border border-linha bg-creme-quente px-2 text-sm text-ameixa"
                            />
                          </label>
                          <label className="flex items-center gap-2 text-xs text-cinza">
                            nota
                            <select
                              value={l.nota}
                              onChange={(e) => mudar(i, { nota: Number(e.target.value) })}
                              className="min-h-10 rounded-md border border-linha bg-creme-quente px-2 text-sm text-bordo"
                            >
                              {notas.map((n) => (
                                <option key={n} value={n}>
                                  {rotuloNota(n)}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                        {l.item.personagem || l.item.citacao || l.item.resenha || l.item.notas ? (
                          <p className="text-xs text-cinza">
                            ✦ com ficha:{" "}
                            {[
                              l.item.notas && "critérios",
                              l.item.personagem && "personagem",
                              l.item.citacao && "citação",
                              l.item.resenha && "comentário",
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="sticky bottom-[70px] mt-4 flex gap-2.5 bg-gradient-to-t from-creme via-creme to-creme/0 pt-5 pb-3 lg:static lg:bg-none">
              <button
                type="button"
                onClick={salvar}
                disabled={!linhas.some((l) => l.incluir)}
                className={`${botaoPrincipal} max-w-[420px]`}
              >
                salvar {linhas.filter((l) => l.incluir).length} nos lidos
              </button>
              <button
                type="button"
                onClick={() => setLinhas(null)}
                className="min-h-[52px] px-4 text-sm font-semibold text-cinza underline underline-offset-4"
              >
                voltar
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
