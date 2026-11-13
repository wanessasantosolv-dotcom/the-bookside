"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { useClube } from "@/components/clube/ClubeContexto";
import { botaoPrincipal, campo, EstrelasInput, Rodape, rotuloCampo, TopoForm } from "@/components/clube/Pecas";
import { Carregando, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { criterios, fichasDe, livroDoClube, media, salvarFicha, type Criterio, type Ficha, type LivroDoClube } from "@/lib/clubes";
import { corDoLivro } from "@/lib/cores";
import { usePerfil } from "@/lib/perfil-store";
import { useConsulta, useMeuId } from "@/lib/social";

function Formulario({ l, minha }: { l: LivroDoClube; minha: Ficha | null }) {
  const { clube } = useClube();
  const router = useRouter();
  const editarLivro = usePerfil((s) => s.editarLivro);
  const [notas, setNotas] = useState<Partial<Record<Criterio, number>>>(minha?.notas ?? {});
  const [nota, setNota] = useState<number>(minha?.nota ? Math.round(Number(minha.nota)) : 0);
  const [personagem, setPersonagem] = useState(minha?.personagem ?? "");
  const [citacao, setCitacao] = useState(minha?.citacao ?? "");
  const [texto, setTexto] = useState(minha?.texto ?? "");
  const [spoiler, setSpoiler] = useState(minha?.spoiler ?? false);
  const [naEstante, setNaEstante] = useState(!minha);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // sem nota geral, vale a média dos critérios
  const notaFinal = nota || Math.round((media(Object.values(notas)) ?? 0) * 2) / 2;

  async function publicar(e: FormEvent) {
    e.preventDefault();
    if (!notaFinal) return setErro("dê pelo menos a sua nota.");
    setEnviando(true);
    setErro(null);
    try {
      await salvarFicha(
        l,
        { notas, nota: notaFinal, personagem: personagem.trim() || null, citacao: citacao.trim() || null, texto: texto.trim() || null, spoiler },
        !!minha,
      );
      if (naEstante) {
        const agora = new Date().toISOString();
        editarLivro(
          { id: l.livro.id, titulo: l.livro.titulo, autor: l.livro.autor, capa: l.livro.capa },
          { status: "lido", lidoEm: agora, nota: notaFinal, resenha: texto.trim() || undefined, paginas: l.livro.paginas },
        );
      }
      router.push(`/clubes/${clube.id}/livro/${l.id}`);
    } catch {
      setErro("não deu para publicar agora. tente de novo.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={publicar} className="flex min-h-[70dvh] flex-col">
      <TopoForm
        voltar={{ href: `/clubes/${clube.id}/leitura`, r: "leitura da vez" }}
        rotulo={l.rodada ? `rodada ${l.rodada}` : "ficha"}
        titulo={l.livro.titulo}
        frase={minha ? "editando sua ficha ✎" : "como foi a leitura? ✓"}
      />
      <div className="mx-6 mt-5 rounded-xl border border-linha bg-creme-quente p-4 lg:mx-0 lg:max-w-[640px] lg:rounded-[4px] lg:border-fio lg:bg-transparent lg:p-5">
        <div className="flex gap-4">
          <div className="min-w-0 flex-1">
            <p className={rotuloCampo}>sua nota</p>
            <EstrelasInput valor={nota || Math.round(notaFinal)} onMudar={setNota} rotulo="sua nota" />
            <p className="mt-1 text-xs text-cinza">
              {l.livro.autor}
              {l.livro.paginas ? ` · ${l.livro.paginas} páginas` : ""}
            </p>
          </div>
          <CapaLivro titulo={l.livro.titulo} capa={l.livro.capa} cor={corDoLivro(l.livro.id)} className="w-[70px] [&>span:last-child]:hidden" />
        </div>

        <ul className="mt-4 border-t border-linha">
          {criterios.map((c) => (
            <li key={c} className="flex items-center justify-between border-b border-linha py-1.5">
              <span className="font-accent text-[15px] italic text-cinza">{c}</span>
              <EstrelasInput pequeno valor={notas[c] ?? 0} onMudar={(n) => setNotas((x) => ({ ...x, [c]: n || undefined }))} rotulo={`nota para ${c}`} />
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-5">
          <label className="block">
            <span className={rotuloCampo}>personagem favorita ♡</span>
            <input value={personagem} onChange={(e) => setPersonagem(e.target.value)} maxLength={80} placeholder="helena" className={campo} />
          </label>
          <label className="block">
            <span className={rotuloCampo}>um trecho que ficou</span>
            <textarea
              value={citacao}
              onChange={(e) => setCitacao(e.target.value)}
              maxLength={400}
              rows={2}
              placeholder="não é que a memória falhe. é que ela reescreve."
              className={`${campo} resize-none font-accent italic`}
            />
          </label>
          <label className="block">
            <span className={rotuloCampo}>o que eu achei</span>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={4000}
              rows={5}
              placeholder="conta tudo…"
              className={`${campo} resize-y`}
            />
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input type="checkbox" checked={spoiler} onChange={(e) => setSpoiler(e.target.checked)} className="size-5 accent-bordo" />
            tem spoiler (esconde o texto até a pessoa tocar)
          </label>
          {!minha ? (
            <label className="flex min-h-11 items-center gap-3 text-sm">
              <input type="checkbox" checked={naEstante} onChange={(e) => setNaEstante(e.target.checked)} className="size-5 accent-bordo" />
              marcar como lido na minha estante, com esta nota
            </label>
          ) : null}
        </div>
      </div>
      {erro ? (
        <p role="alert" className="mt-4 px-6 text-[13px] text-bordo lg:px-0">
          {erro}
        </p>
      ) : null}
      <Rodape>
        <button type="submit" disabled={enviando} className={`${botaoPrincipal} lg:max-w-[640px]`}>
          {enviando ? "publicando…" : minha ? "salvar ficha ✎" : "publicar ✎"}
        </button>
      </Rodape>
    </form>
  );
}

export default function FichaPage() {
  const { livro } = useParams<{ livro: string }>();
  const eu = useMeuId();
  const consulta = useConsulta(async () => {
    const [l, fichas] = await Promise.all([livroDoClube(livro), fichasDe(livro)]);
    return l ? { l, minha: fichas.find((f) => f.autor === eu) ?? null } : null;
  }, [livro, eu]);
  if (consulta.carregando && !consulta.dados) return <Carregando texto="abrindo a ficha…" linhas={1} />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  if (!consulta.dados) return <Vazio className="mx-6 mt-6 lg:mx-0" titulo="esse livro não está no clube" />;
  return <Formulario key={consulta.dados.minha?.id ?? "nova"} l={consulta.dados.l} minha={consulta.dados.minha} />;
}
