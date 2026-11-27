"use client";

import { Animacao } from "@/components/Animacao";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useClube } from "@/components/clube/ClubeContexto";
import { CapaAuto } from "@/components/CapaAuto";
import { EstrelasEscolha } from "@/components/marginalia/Estrelas";
import { CRITERIOS, notaTexto } from "@/lib/marginalia";
import {
  fichaEmBranco,
  notaDaFicha,
  type ValoresFicha,
} from "@/components/FichaLeitura";
import { ErroOuFalta, Vazio } from "@/components/social/Estados";
import {
  fichasDe,
  livroDoClube,
  salvarFicha,
  apagarFicha,
  type Ficha,
  type LivroDoClube,
} from "@/lib/clubes";
import { dataDoDia, diaDaData, diaLocal } from "@/lib/datas";
import { notasCompletas } from "@/lib/estantes";
import { usePerfil } from "@/lib/perfil-store";
import { useConsulta, useMeuId } from "@/lib/social";

const rotuloM = "mb-1.5 block text-[12px] font-semibold text-tinta-suave";
const campoM =
  "h-11 w-full min-w-0 rounded-[6px] border border-bege bg-creme-quente px-3 text-[15px] text-ameixa outline-none focus:border-bordo focus:ring-1 focus:ring-bordo";
const tituloM = "font-revista text-[21px] leading-tight text-ameixa lg:text-[23px]";

/**
 * A ficha do clube no formato marginalia: os mesmos dados de sempre (nota,
 * critérios, personagem, trecho, impressões e spoiler), com a identidade do
 * clube. A nota aceita meia estrela, como o banco guarda.
 */
function Formulario({ l, minha }: { l: LivroDoClube; minha: Ficha | null }) {
  const { clube } = useClube();
  const router = useRouter();
  const editarLivro = usePerfil((s) => s.editarLivro);
  const [ficha, setFicha] = useState<ValoresFicha>(
    fichaEmBranco({
      notas: minha?.notas ?? {},
      // a nota vem como está salva (inclusive meia estrela)
      nota: minha?.nota ? Number(minha.nota) : 0,
      personagem: minha?.personagem ?? "",
      citacao: minha?.citacao ?? "",
      texto: minha?.texto ?? "",
      spoiler: minha?.spoiler ?? false,
    }),
  );
  const mudar = (d: Partial<ValoresFicha>) => setFicha((f) => ({ ...f, ...d }));
  const [naEstante, setNaEstante] = useState(!minha);
  const [dia, setDia] = useState(diaDaData(l.encerrado_em ?? undefined) ?? diaLocal());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const nota = notaDaFicha(ficha);

  async function publicar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await salvarFicha(
        l,
        {
          notas: ficha.notas,
          nota: nota || null,
          personagem: ficha.personagem.trim() || null,
          citacao: ficha.citacao.trim() || null,
          texto: ficha.texto.trim() || null,
          spoiler: ficha.spoiler,
        },
        !!minha,
      );
      if (naEstante) {
        // a mesma ficha vai para a estante: nota, critérios, personagem, trecho e resenha
        editarLivro(
          { id: l.livro.id, titulo: l.livro.titulo, autor: l.livro.autor, capa: l.livro.capa },
          {
            status: "lido",
            lidoEm: dataDoDia(dia),
            nota: nota || undefined,
            notas: notasCompletas(ficha.notas),
            personagem: ficha.personagem.trim() || undefined,
            citacao: ficha.citacao.trim() || undefined,
            resenha: ficha.texto.trim() || undefined,
            resenhaSpoiler: ficha.spoiler || undefined,
            paginas: l.livro.paginas,
          },
        );
      }
      router.push(`/clubes/${clube.id}/livro/${l.id}`);
    } catch {
      setErro("não foi possível salvar agora. tente de novo.");
      setEnviando(false);
    }
  }

  async function excluir() {
    if (!confirm("excluir sua ficha de leitura? ela deixa de aparecer no clube. sua estante continua igual.")) return;
    setEnviando(true);
    setErro(null);
    try {
      await apagarFicha(l);
      router.push(`/clubes/${clube.id}/livro/${l.id}`);
    } catch {
      setErro("não foi possível excluir agora. tente de novo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={publicar} className="px-4 pt-3 pb-28 lg:px-0 lg:pt-6">
      {enviando ? <Animacao tipo="carimbo" titulo="salvando sua ficha" sub="ela aparece nas fichas de leitura do livro" tela /> : null}
      <header className="flex items-end justify-between gap-3 border-b border-linha pb-3">
        <div>
          <p className="flex items-baseline gap-2 font-revista text-[28px] leading-none text-ameixa lg:text-[34px]">
            marginalia.
            <svg aria-hidden width="13" height="18" viewBox="0 0 14 20" className="text-bordo">
              <path d="M2 1h10v18l-5-4-5 4z" fill="currentColor" opacity=".85" />
            </svg>
          </p>
          <p className="mt-1 text-[12px] text-cinza">
            leitura do clube · {clube.nome}
            {l.rodada ? ` · VOL. ${String(l.rodada).padStart(2, "0")}` : ""}
          </p>
        </div>
        <p className="text-right text-[12px] text-cinza">{minha ? "ficha publicada" : "nova ficha"}</p>
      </header>

      <div className="mt-5 lg:grid lg:grid-cols-[minmax(0,28%)_minmax(0,1fr)] lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex gap-4 lg:block lg:rounded-[6px] lg:border lg:border-linha lg:bg-papel lg:p-5">
            <CapaAuto livro={l.livro} className="w-[72px] flex-none lg:mx-auto lg:w-[150px] [&>span:last-child]:hidden" />
            <div className="min-w-0 lg:mt-4">
              <h1 className="font-revista text-[19px] leading-tight text-ameixa lg:text-[21px]">{l.livro.titulo}</h1>
              <p className="mt-0.5 text-[13px] text-tinta-suave">{l.livro.autor}</p>
              {l.livro.paginas ? <p className="mt-1 text-[12px] text-cinza">{l.livro.paginas} páginas</p> : null}
            </div>
          </div>
        </aside>

        <div className="mt-6 min-w-0 max-w-[680px] divide-y divide-linha lg:mt-0 [&>section]:py-6 [&>section:first-child]:pt-0">
          <section aria-labelledby="c-avaliacao">
            <h2 id="c-avaliacao" className={tituloM}>
              Avaliação geral
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              <EstrelasEscolha valor={ficha.nota} onMudar={(n) => mudar({ nota: n })} rotulo="avaliação geral" />
              <p className="font-revista text-[21px] text-ameixa tabular-nums">
                {ficha.nota ? (
                  <>
                    {notaTexto(ficha.nota)} <span className="text-[14px] text-cinza">/ 5</span>
                  </>
                ) : nota ? (
                  <span className="text-[14px] text-cinza">pela média dos aspectos: {notaTexto(nota)}</span>
                ) : (
                  <span className="text-[14px] text-cinza">sem avaliação</span>
                )}
              </p>
              {ficha.nota ? (
                <button type="button" onClick={() => mudar({ nota: 0 })} className="min-h-9 text-[12px] text-cinza underline-offset-4 hover:underline">
                  limpar
                </button>
              ) : null}
            </div>
          </section>

          <section aria-labelledby="c-aspectos">
            <h2 id="c-aspectos" className={tituloM}>
              Aspectos da obra
            </h2>
            <ul className="mt-3 border-t border-linha">
              {CRITERIOS.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-x-3 border-b border-linha py-1">
                  <span className="text-[14px] text-ameixa">{c.nome}</span>
                  <span className="flex items-center gap-2">
                    <EstrelasEscolha tamanho={20} valor={ficha.notas[c.id] ?? 0} onMudar={(n) => mudar({ notas: { ...ficha.notas, [c.id]: n } })} rotulo={`nota para ${c.nome}`} />
                    {ficha.notas[c.id] ? (
                      <button type="button" aria-label={`limpar ${c.nome}`} onClick={() => mudar({ notas: { ...ficha.notas, [c.id]: undefined } })} className="grid size-9 place-items-center text-cinza hover:text-bordo">
                        ×
                      </button>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="c-impressoes">
            <h2 id="c-impressoes" className={tituloM}>
              Impressões pessoais
            </h2>
            <div className="mt-3 rounded-[6px] border border-linha bg-creme-quente focus-within:border-bordo">
              <textarea
                value={ficha.texto}
                onChange={(e) => mudar({ texto: e.target.value })}
                maxLength={4000}
                rows={8}
                placeholder="Escreva suas impressões sobre a obra..."
                aria-label="impressões pessoais"
                className="block min-h-[200px] w-full resize-y bg-transparent px-4 py-3.5 font-accent text-[16px] leading-[1.7] text-ameixa outline-none placeholder:text-cinza"
              />
              <div className="flex items-center justify-between gap-2 border-t border-linha px-3 py-1.5 text-[12px]">
                <label className="flex min-h-9 cursor-pointer items-center gap-2 text-tinta-suave">
                  <input type="checkbox" checked={ficha.spoiler} onChange={(e) => mudar({ spoiler: e.target.checked })} className="size-4 accent-bordo" />
                  Contém spoilers
                </label>
                <span className="tabular-nums text-cinza">{ficha.texto.length} / 4.000</span>
              </div>
            </div>
            <label className="mt-4 block max-w-[360px]">
              <span className={rotuloM}>Personagem favorita</span>
              <input value={ficha.personagem} onChange={(e) => mudar({ personagem: e.target.value })} maxLength={80} className={campoM} />
            </label>
          </section>

          <section aria-labelledby="c-paginas">
            <h2 id="c-paginas" className={tituloM}>
              Entre as páginas
            </h2>
            <div className="mt-3 flex gap-2 rounded-[6px] border-l-2 border-bordo bg-papel px-3 py-3">
              <span aria-hidden className="font-revista text-[28px] leading-none text-bordo">“</span>
              <textarea value={ficha.citacao} onChange={(e) => mudar({ citacao: e.target.value })} maxLength={400} rows={2} placeholder="uma passagem que você quer guardar" aria-label="passagem" className="min-h-[56px] w-full resize-y bg-transparent font-accent text-[15px] leading-[1.55] text-ameixa italic outline-none placeholder:text-cinza" />
            </div>
          </section>

          {!minha ? (
            <section aria-labelledby="c-estante">
              <h2 id="c-estante" className={tituloM}>
                Na sua estante
              </h2>
              <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 text-[14px]">
                <input type="checkbox" checked={naEstante} onChange={(e) => setNaEstante(e.target.checked)} className="size-5 accent-bordo" />
                marcar como lido na minha estante, com esta ficha
              </label>
              {naEstante ? (
                <label className="mt-2 block max-w-[260px]">
                  <span className={rotuloM}>Data de conclusão</span>
                  <input type="date" value={dia} max={diaLocal()} onChange={(e) => e.target.value && setDia(e.target.value)} className={`${campoM} appearance-none`} />
                </label>
              ) : null}
            </section>
          ) : (
            <section>
              <button type="button" onClick={excluir} disabled={enviando} className="min-h-11 text-[12px] font-semibold text-cinza underline underline-offset-4 hover:text-bordo">
                excluir minha ficha
              </button>
            </section>
          )}
          {erro ? (
            <p role="alert" className="py-3 text-[13px] font-semibold text-bordo">
              ⚠ {erro}
            </p>
          ) : null}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-creme/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1120px] items-center justify-end gap-2 px-4 py-2.5 lg:px-10">
          <button type="button" onClick={() => router.back()} className="h-10 rounded-[6px] border border-bege px-4 text-[13px] font-semibold text-ameixa">
            cancelar
          </button>
          <button type="submit" disabled={enviando} className="h-10 rounded-[6px] bg-bordo px-5 text-[14px] font-semibold text-creme hover:bg-bordo-suave disabled:opacity-50">
            {enviando ? "salvando…" : minha ? "Salvar alterações" : "Publicar ficha"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function FichaPage() {
  const { livro } = useParams<{ livro: string }>();
  const eu = useMeuId();
  const consulta = useConsulta(async () => {
    const [l, fichas] = await Promise.all([
      livroDoClube(livro),
      fichasDe(livro),
    ]);
    return l ? { l, minha: fichas.find((f) => f.autor === eu) ?? null } : null;
  }, [livro, eu]);
  if (consulta.carregando && !consulta.dados)
    return (
      <Animacao
        tipo="escrevendo"
        titulo="carregando sua ficha"
        frase="e então, o que você achou?"
        sub="só um instante"
      />
    );
  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  if (!consulta.dados)
    return (
      <Vazio
        className="mx-6 mt-6 lg:mx-0"
        titulo="esse livro não está no clube"
      />
    );
  return (
    <Formulario
      key={consulta.dados.minha?.id ?? "nova"}
      l={consulta.dados.l}
      minha={consulta.dados.minha}
    />
  );
}
