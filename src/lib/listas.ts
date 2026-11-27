import { chaveTitulo, type LivroBusca } from "@/lib/catalogo";
import { usePerfil, type EstantePropria, type LivroSalvo } from "@/lib/perfil-store";

/**
 * Listas (estantes próprias). Um livro entra numa lista sem mudar a estante
 * pessoal: se ele já está na estante, ganha a lista em `estantes`; se não,
 * fica só na lista (EstantePropria.livros), sem status de leitura.
 */

export function chavesDaLista(lista: EstantePropria, livros: LivroSalvo[]) {
  const chaves = new Set<string>();
  for (const l of livros) if (l.estantes?.includes(lista.id)) chaves.add(chaveTitulo(l.titulo));
  for (const l of lista.livros ?? []) chaves.add(chaveTitulo(l.titulo));
  return chaves;
}

export function estaNaLista(lista: EstantePropria, livros: LivroSalvo[], titulo: string) {
  return chavesDaLista(lista, livros).has(chaveTitulo(titulo));
}

/** adiciona vários livros de uma vez, sem duplicar; devolve quantos entraram */
export function adicionarNaLista(listaId: string, novos: Pick<LivroBusca, "id" | "titulo" | "autor" | "capa" | "paginas">[]) {
  const s = usePerfil.getState();
  const lista = s.estantesProprias.find((e) => e.id === listaId);
  if (!lista) return 0;
  const ja = chavesDaLista(lista, s.livros);
  const porChave = new Map(s.livros.map((l) => [chaveTitulo(l.titulo), l]));
  const agora = new Date().toISOString();
  let n = 0;
  const livros = [...s.livros];
  const soNaLista = [...(lista.livros ?? [])];
  for (const b of novos) {
    const k = chaveTitulo(b.titulo);
    if (ja.has(k)) continue;
    ja.add(k);
    n++;
    const meu = porChave.get(k);
    if (meu) {
      const i = livros.indexOf(meu);
      livros[i] = { ...meu, estantes: [...new Set([...(meu.estantes ?? []), listaId])], atualizadoEm: agora };
    } else soNaLista.push({ id: b.id, titulo: b.titulo, autor: b.autor, capa: b.capa, paginas: b.paginas, adicionadoEm: agora });
  }
  if (!n) return 0;
  usePerfil.setState({
    livros,
    estantesProprias: s.estantesProprias.map((e) => (e.id === listaId ? { ...e, livros: soNaLista } : e)),
  });
  return n;
}

/** tira um livro da lista (das duas formas de estar nela) */
export function tirarDaLista(listaId: string, livro: { id: string; titulo: string }) {
  const s = usePerfil.getState();
  const k = chaveTitulo(livro.titulo);
  usePerfil.setState({
    livros: s.livros.map((l) => (chaveTitulo(l.titulo) === k && l.estantes?.includes(listaId) ? { ...l, estantes: l.estantes.filter((x) => x !== listaId) } : l)),
    estantesProprias: s.estantesProprias.map((e) => (e.id === listaId ? { ...e, livros: (e.livros ?? []).filter((x) => chaveTitulo(x.titulo) !== k) } : e)),
  });
}
