"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CapaAuto } from "@/components/CapaAuto";
import { useClube } from "@/components/clube/ClubeContexto";
import { TopoForm } from "@/components/clube/Pecas";
import { Carregando, ErroOuFalta, Vazio } from "@/components/social/Estados";
import {
  definirFavoritosDoClube,
  fichasComAntigas,
  fichasDoClube,
  livrosDoClube,
  media,
  organiza,
  virgula,
} from "@/lib/clubes";
import { useConsulta } from "@/lib/social";

const MAXIMO = 4;

/** Escolher "o que a gente amou" — ou deixar o app mostrar os de nota mais alta. */
export default function FavoritosDoClubePage() {
  const { clube, membros, papel, recarregar } = useClube();
  const router = useRouter();
  const [escolhidos, setEscolhidos] = useState<string[]>(clube.favoritos ?? []);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const consulta = useConsulta(async () => {
    const livros = (await livrosDoClube(clube.id)).filter(
      (l) => l.estado === "lido",
    );
    const fichas = await fichasDoClube(livros.map((l) => l.id));
    return livros
      .map((l) => ({
        l,
        m: media(
          fichasComAntigas(
            l,
            fichas.filter((f) => f.clube_livro_id === l.id),
            membros,
          ).map((f) => f.nota),
        ),
      }))
      .sort((a, b) => (b.m ?? 0) - (a.m ?? 0));
  }, [clube.id]);

  const base = `/clubes/${clube.id}`;
  if (!organiza(papel))
    return (
      <div className="px-6 pt-6 lg:px-0">
        <Vazio
          titulo="só quem organiza pode editar os destaques"
          texto="enquanto isso, aparecem os livros com as notas mais altas do clube."
          acao={{ href: base, rotulo: "voltar ao clube" }}
        />
      </div>
    );
  if (consulta.carregando && !consulta.dados) return <Carregando />;
  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const lidos = consulta.dados!;
  const cheio = escolhidos.length >= MAXIMO;

  async function salvar(ids: string[]) {
    setSalvando(true);
    setErro(null);
    try {
      await definirFavoritosDoClube(clube.id, ids);
      recarregar();
      router.push(base);
    } catch (x) {
      const e = x as { code?: string };
      setErro(
        e?.code === "PGRST202"
          ? "o banco do app precisa ser atualizado: rode de novo o arquivo supabase/social.sql no SQL Editor do Supabase."
          : "não foi possível salvar agora. tente de novo.",
      );
      setSalvando(false);
    }
  }

  return (
    <div className="pb-8">
      <TopoForm
        voltar={{ href: base, r: "início" }}
        rotulo="editar destaques"
        titulo="favoritos do clube"
        frase="escolha até 4 livros ou deixe o app mostrar os de nota mais alta."
      />
      <div className="mt-6 px-6 lg:px-0">
        {!lidos.length ? (
          <p className="font-accent text-sm italic text-cinza">
            o clube ainda não terminou nenhum livro.
          </p>
        ) : (
          <>
            <p className="text-xs font-semibold text-bordo" aria-live="polite">
              {escolhidos.length
                ? `${escolhidos.length} de ${MAXIMO} escolhidos`
                : "automático: notas mais altas"}
            </p>
            <ul className="mt-4 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
              {lidos.map(({ l, m }) => {
                const on = escolhidos.includes(l.id);
                return (
                  <li key={l.id}>
                    <label
                      className={`relative block cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-bordo ${!on && cheio ? "opacity-45" : ""}`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={on}
                        disabled={!on && cheio}
                        onChange={() =>
                          setEscolhidos((e) =>
                            on
                              ? e.filter((x) => x !== l.id)
                              : e.length < MAXIMO
                                ? [...e, l.id]
                                : e,
                          )
                        }
                      />
                      <CapaAuto
                        livro={l.livro}
                        className={`w-full ${on ? "ring-2 ring-bordo ring-offset-2 ring-offset-creme" : ""}`}
                      />
                      <span
                        aria-hidden
                        className={`absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full border-2 border-creme text-xs font-bold ${on ? "bg-bordo text-creme" : "bg-creme/70 text-transparent"}`}
                      >
                        {on ? escolhidos.indexOf(l.id) + 1 : "✓"}
                      </span>
                      <span className="mt-1.5 block truncate text-[12px] font-medium">
                        {l.livro.titulo}
                      </span>
                      <span className="block text-[11px] text-bordo">
                        {m ? `${virgula(m)}★` : "sem nota"}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {erro ? (
          <p role="alert" className="mt-4 text-[13px] text-bordo">
            {erro}
          </p>
        ) : null}
        <div className="mt-8 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={salvando}
            onClick={() => salvar([])}
            className="h-12 rounded-pill border border-bege px-6 text-sm font-semibold text-ameixa disabled:opacity-45"
          >
            deixar automático
          </button>
          <button
            type="button"
            disabled={salvando || !escolhidos.length}
            onClick={() => salvar(escolhidos)}
            className="h-12 rounded-pill bg-bordo px-8 text-sm font-semibold text-creme hover:bg-bordo-suave disabled:opacity-45"
          >
            {salvando ? "salvando…" : "salvar favoritos"}
          </button>
        </div>
      </div>
    </div>
  );
}
