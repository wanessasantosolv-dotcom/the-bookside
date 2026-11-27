"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Busca, type BuscaControle } from "@/components/descoberta/Busca";
import { useHidratado } from "@/components/PerfilHidratacao";
import { Voltar } from "@/components/Voltar";
import { chaveTitulo, type LivroBusca } from "@/lib/catalogo";
import { SUGESTOES_INICIAIS } from "@/lib/descoberta";
import { adicionarNaLista, chavesDaLista } from "@/lib/listas";
import { usePerfil } from "@/lib/perfil-store";
import { interpretarBusca } from "@/lib/taxonomia";

/**
 * Adicionar livros a uma lista: pesquisa dentro da própria lista, seleção de
 * vários livros (que continua valendo entre pesquisas) e uma confirmação só.
 * Entrar na lista não muda a estante pessoal nem o status de leitura.
 */
export default function AdicionarNaListaPage() {
  const { id } = useParams<{ id: string }>();
  const hidratado = useHidratado();
  const router = useRouter();
  const lista = usePerfil((s) => s.estantesProprias.find((e) => e.id === id));
  const livros = usePerfil((s) => s.livros);
  const [selecionados, setSelecionados] = useState<Map<string, LivroBusca>>(new Map());
  const controle = useRef<BuscaControle | null>(null);
  const [sugerindo, setSugerindo] = useState(false);

  const naLista = useMemo(() => (lista ? chavesDaLista(lista, livros) : new Set<string>()), [lista, livros]);
  const contexto = useMemo(
    () =>
      lista
        ? {
            nome: lista.nome,
            descricao: lista.descricao,
            titulos: [...livros.filter((l) => l.estantes?.includes(lista.id)).map((l) => l.titulo), ...(lista.livros ?? []).map((l) => l.titulo)],
          }
        : undefined,
    [lista, livros],
  );
  // o nome e a descrição da lista viram a primeira pesquisa, quando dizem algo
  const proposta = lista ? [lista.descricao, lista.nome].find((t) => t && (interpretarBusca(t).criterios.length || t === lista.descricao)) : undefined;

  const definirControle = useCallback(
    (c: BuscaControle) => {
      controle.current = c;
    },
    [],
  );
  useEffect(() => {
    if (!hidratado || !proposta) return;
    let salvo = null;
    try {
      salvo = sessionStorage.getItem(`bookside-busca-lista-${id}`);
    } catch {
      /* sem armazenamento */
    }
    if (salvo && JSON.parse(salvo)?.consulta) return;
    const t = setTimeout(() => {
      controle.current?.pesquisar(proposta);
      setSugerindo(true);
    }, 50);
    return () => clearTimeout(t);
  }, [hidratado, proposta, id]);

  if (!hidratado) return <AppShell aba="estantes">{null}</AppShell>;
  if (!lista) notFound();

  const alternar = (l: LivroBusca) =>
    setSelecionados((m) => {
      const k = chaveTitulo(l.titulo);
      const n = new Map(m);
      if (n.has(k)) n.delete(k);
      else n.set(k, l);
      return n;
    });
  const total = selecionados.size;
  const plural = total === 1 ? "livro" : "livros";

  return (
    <AppShell aba="estantes" menuCelular={false}>
      <div className="mx-auto w-full max-w-[760px] px-5 pt-2 pb-32 lg:px-10 lg:pt-8">
        <header className="flex items-center justify-between gap-3">
          <Voltar padrao={`/estantes/${lista.id}`} rotulo={lista.nome} className="-ml-2 flex min-h-11 max-w-[70%] items-center truncate px-2 text-[13px] font-semibold text-bordo" />
        </header>
        <h1 className="mt-2 font-revista text-[24px] leading-tight text-ameixa">Adicionar à lista</h1>
        <p className="mt-1 text-[13px] text-cinza">Explore histórias por atmosferas, lugares, temas e experiências de leitura.</p>
        <div className="mt-4">
          {sugerindo ? <p className="mb-2 text-[11px] font-semibold tracking-[.14em] text-cinza uppercase">Mais histórias para esta coleção</p> : null}
          <Busca
            modo={{ tipo: "lista", selecionados, alternar, naLista }}
            contexto={contexto}
            chaveSessao={`bookside-busca-lista-${lista.id}`}
            placeholder="Busque por livros, temas ou sensações"
            sugestoes={SUGESTOES_INICIAIS.slice(0, 6)}
            controle={definirControle}
            onAtiva={(a) => !a && setSugerindo(false)}
          />
        </div>
      </div>

      {/* seleção: discreta, sempre à mão */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-creme/95 px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] backdrop-blur-sm lg:pl-[236px]">
        <div className="mx-auto flex max-w-[760px] items-center gap-3">
          <p aria-live="polite" className="min-w-0 flex-1 text-[13px] text-tinta-suave">
            {total ? `${total} ${plural} ${total === 1 ? "selecionado" : "selecionados"}` : "Selecione os livros que quer adicionar"}
          </p>
          <button
            type="button"
            disabled={!total}
            onClick={() => {
              adicionarNaLista(lista.id, [...selecionados.values()]);
              try {
                sessionStorage.removeItem(`bookside-busca-lista-${lista.id}`);
              } catch {
                /* sem armazenamento */
              }
              router.push(`/estantes/${lista.id}?adicionados=${total}`);
            }}
            className="h-12 rounded-[6px] bg-bordo px-5 text-[14px] font-semibold text-creme hover:bg-bordo-suave disabled:opacity-40"
          >
            {total ? `Adicionar ${total} ${plural} à lista` : "Adicionar à lista"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
