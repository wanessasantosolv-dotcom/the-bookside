"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CapaLivro } from "@/components/CapaLivro";
import { useClube } from "@/components/clube/ClubeContexto";
import { botaoPrincipal, campo, Rodape, rotuloCampo, TopoForm } from "@/components/clube/Pecas";
import { useBuscaLivros, type LivroBusca } from "@/lib/catalogo";
import { minhasSugestoesNoMes, sugerir } from "@/lib/clubes";
import { useConsulta } from "@/lib/social";
import { corDoLivro } from "@/lib/cores";

const climas = ["suspense", "ficção", "romance", "fantasia", "leve", "chorar", "clássico", "não ficção"];

export default function SugerirPage() {
  const { clube } = useClube();
  const router = useRouter();
  const [termo, setTermo] = useState("");
  const [livro, setLivro] = useState<LivroBusca | null>(null);
  const [motivo, setMotivo] = useState("");
  const [clima, setClima] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const busca = useBuscaLivros(termo);
  const feitas = useConsulta(() => minhasSugestoesNoMes(clube.id), [clube.id]);
  const limite = clube.limite_sugestoes;
  const restam = limite && feitas.dados !== undefined ? Math.max(0, limite - feitas.dados) : null;
  const esgotou = restam === 0;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!livro) return setErro("escolha um livro primeiro.");
    setEnviando(true);
    setErro(null);
    try {
      await sugerir(
        clube.id,
        {
          id: livro.id,
          titulo: livro.titulo,
          autor: livro.autor,
          capa: livro.capa?.startsWith("data:") ? undefined : livro.capa,
          paginas: livro.paginas,
          clima,
        },
        motivo,
      );
      router.push(`/clubes/${clube.id}/sugestoes`);
    } catch {
      setErro(
        limite
          ? `não deu para enviar. lembre: cada pessoa sugere ${limite} por mês.`
          : "não deu para enviar agora. tente de novo.",
      );
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex min-h-[70dvh] flex-col">
      <TopoForm
        voltar={{ href: `/clubes/${clube.id}/sugestoes`, r: "sugestões" }}
        rotulo="sugestões abertas"
        titulo="sugerir um livro"
        frase="qual vai para o clube? ✦"
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
                <span className="block truncate text-xs text-cinza">{livro.autor}</span>
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
                <span className="sr-only">buscar o livro pelo título ou autoria</span>
                <input
                  type="search"
                  value={termo}
                  onChange={(e) => setTermo(e.target.value)}
                  placeholder="título ou autoria"
                  className={campo}
                  autoComplete="off"
                />
              </label>
              <ul className="mt-2 max-h-[280px] overflow-y-auto rounded-md border border-linha" aria-live="polite">
                {busca.estado === "carregando" ? (
                  <li className="px-4 py-3 font-accent text-sm italic text-cinza">procurando…</li>
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
                          <span className="block truncate text-sm font-semibold">{l.titulo}</span>
                          <span className="block truncate text-xs text-cinza">{l.autor}</span>
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </>
          )}
        </div>

        <label className="block">
          <span className={rotuloCampo}>por que esse livro?</span>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={280}
            rows={3}
            placeholder="um thriller que vai fazer a gente discutir até o último capítulo."
            className={`${campo} resize-none font-accent italic`}
          />
        </label>

        <fieldset>
          <legend className={rotuloCampo}>clima do livro</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {climas.map((c) => {
              const on = clima.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setClima((x) => (on ? x.filter((y) => y !== c) : [...x, c]))}
                  className={`min-h-9 rounded-pill px-3.5 text-xs font-semibold ${on ? "bg-bordo text-creme" : "border border-bege text-ameixa"}`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>
        <div className="rounded-md border border-linha px-4 py-3 lg:border-fio">
          <p className={rotuloCampo}>a regra do clube</p>
          <p className="mt-1 text-[13px] text-cinza">
            {limite
              ? `cada pessoa pode sugerir ${limite} ${limite === 1 ? "livro" : "livros"} por mês.`
              : "pode sugerir quantos livros quiser."}
            {restam !== null ? (
              <b className={`font-semibold ${esgotou ? "text-bordo" : "text-ameixa"}`}>
                {esgotou
                  ? " você já usou a sua deste mês ✦"
                  : ` você ainda tem ${restam} ${restam === 1 ? "disponível" : "disponíveis"} ✦`}
              </b>
            ) : null}
          </p>
        </div>
        {erro ? (
          <p role="alert" className="text-[13px] text-bordo">
            {erro}
          </p>
        ) : null}
      </div>
      <Rodape>
        <button type="submit" disabled={enviando || !livro || esgotou} className={`${botaoPrincipal} lg:max-w-[640px]`}>
          {enviando ? "enviando…" : "enviar para as sugestões"}
        </button>
      </Rodape>
    </form>
  );
}
