"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  assinaturaDe,
  contextoParaIA,
  edicaoSalvaDe,
  estadoDaEdicao,
  livrosDoMes,
  montarEdicao,
  textosPorRegras,
  type Edicao,
} from "@/lib/journal";
import { useGenerosRefinados } from "@/lib/generos";
import { autoresDoLivro } from "@/lib/jornada";
import {
  generosDasAutoras,
  paisesDasAutoras,
  type GeneroAutoria,
  type Pais,
} from "@/lib/nacionalidade";
import {
  usePerfil,
  type LivroDaEdicao,
  type LivroSalvo,
  type TextosEdicao,
} from "@/lib/perfil-store";
import { supabase } from "@/lib/supabase";

/** pede à IA os textos da edição (só números e nomes vão); sem IA, null */
async function textosDaIA(ed: Edicao): Promise<Omit<TextosEdicao, "fonte"> | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return null;
    const r = await fetch("/api/ia/journal", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ dados: contextoParaIA(ed) }),
    });
    if (!r.ok) return null;
    const j = (await r.json()) as Partial<Record<keyof TextosEdicao, string>>;
    if (!j.titulo || !j.introducao || !j.encerramento) return null;
    return {
      titulo: j.titulo,
      introducao: j.introducao,
      ritmo: j.ritmo || undefined,
      tendencias: j.tendencias || undefined,
      encerramento: j.encerramento,
    };
  } catch {
    return null;
  }
}

/** países e gênero declarado das autorias (Wikidata, guardado no aparelho) */
function useAutoriasDe(livros: { autor: string }[]) {
  const nomes = [...new Set(livros.flatMap((l) => [l.autor, ...autoresDoLivro(l.autor)]))].sort().join("|");
  const [paises, setPaises] = useState<Record<string, Pais | null> | null>(null);
  const [generos, setGeneros] = useState<Record<string, GeneroAutoria | null> | null>(null);
  useEffect(() => {
    let vivo = true;
    const lista = nomes ? nomes.split("|") : [];
    paisesDasAutoras(lista)
      .then((c) => vivo && setPaises({ ...c }))
      .catch(() => vivo && setPaises({}))
      .then(() => generosDasAutoras(lista))
      .then((g) => vivo && g && setGeneros({ ...g }))
      .catch(() => vivo && setGeneros({}));
    return () => {
      vivo = false;
    };
  }, [nomes]);
  return { paises, generos };
}

/**
 * Uma edição do journal pronta para mostrar:
 * - mês fechado: usa a edição guardada (e guarda na primeira vez que abre);
 * - prévia (últimos dias do mês): calculada na hora, sem guardar;
 * - se os registros do mês mudarem depois de guardada, avisa e oferece
 *   "atualizar edição" (nada muda sozinho no que já foi colecionado).
 */
export function useEdicao(chave: string) {
  const livros = usePerfil((s) => s.livros);
  const edicoes = usePerfil((s) => s.edicoes);
  const atualizarPerfil = usePerfil((s) => s.atualizar);
  const estado = estadoDaEdicao(chave);
  const vivos = useMemo(() => livrosDoMes(livros, chave), [livros, chave]);
  const salva = edicoes?.[chave];
  const usados: LivroDaEdicao[] = estado === "fechada" && salva ? salva.livros : vivos;
  const { paises, generos } = useAutoriasDe(usados.filter((l) => l.concluido));
  const generoDe = useGenerosRefinados(usados as unknown as LivroSalvo[], (l) => l.genero);
  const edicao = useMemo(
    () =>
      montarEdicao(chave, usados, {
        todos: livros,
        generoDe: (l) => generoDe(l as unknown as LivroSalvo),
        paises,
        generosAutoria: generos,
      }),
    [chave, usados, livros, generoDe, paises, generos],
  );
  const desatualizada = !!salva && estado === "fechada" && salva.assinatura !== assinaturaDe(vivos);
  const [gerando, setGerando] = useState(false);
  const pedindo = useRef(false);

  /** guarda a edição (na primeira vez ou ao atualizar), com textos por regras e depois da IA */
  async function fechar(lista: LivroDaEdicao[]) {
    if (pedindo.current) return;
    pedindo.current = true;
    setGerando(true);
    const ed = montarEdicao(chave, lista, { todos: livros, generoDe: (l) => generoDe(l as unknown as LivroSalvo), paises, generosAutoria: generos });
    const regras = textosPorRegras(ed);
    const guardar = (textos: TextosEdicao) =>
      atualizarPerfil({
        edicoes: { ...(usePerfil.getState().edicoes ?? {}), [chave]: edicaoSalvaDe(chave, lista, textos) },
      });
    guardar(regras);
    const ia = await textosDaIA(ed);
    if (ia)
      guardar({
        ...regras,
        ...ia,
        ritmo: ia.ritmo ?? regras.ritmo,
        tendencias: ia.tendencias ?? regras.tendencias,
        fonte: "ia",
      });
    setGerando(false);
    pedindo.current = false;
  }

  // mês fechado e ainda sem edição guardada: guarda agora
  useEffect(() => {
    if (estado === "fechada" && !salva && vivos.length) void fechar(vivos);
    // fechar é estável para o propósito (só roda sem edição guardada)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado, !!salva, vivos.length, chave]);

  const textos: TextosEdicao =
    estado === "fechada" && salva?.textos ? salva.textos : textosPorRegras(edicao);

  return {
    edicao,
    estado,
    textos,
    desatualizada,
    gerando,
    vazia: !usados.length,
    finalizadaEm: estado === "fechada" ? salva?.finalizadaEm : undefined,
    atualizar: () => fechar(vivos),
  };
}
