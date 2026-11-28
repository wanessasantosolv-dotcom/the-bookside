/**
 * A busca única do app (Descobrir e "adicionar à lista").
 *
 * 1. interpreta a pesquisa (taxonomia local, sem IA);
 * 2. pesquisa direta (título, autor, ISBN) vai ao catálogo de sempre;
 * 3. pesquisa por características pede candidatos à IA, quando há, e confere
 *    cada um no catálogo (registro real, capa oficial) antes de mostrar;
 * 4. sem pesquisa externa, usa somente uma curadoria editorial compatível;
 * 5. aplica só as restrições que os dados confirmam (páginas, idioma, ano).
 */
import { buscarLivros, chaveTitulo, type LivroBusca } from "@/lib/catalogo";
import { CURADORIAS } from "@/lib/curadorias";
import { chaveDaObra, ehEdicaoPt, naoLiterario, type TipoFonte } from "@/lib/descoberta-qualidade";
import { supabase } from "@/lib/supabase";
import { CARACTERISTICAS, PORID, ehBuscaDireta, interpretarBusca, type Caracteristica, type Interpretacao } from "@/lib/taxonomia";

export type Resultado = {
  livro: LivroBusca;
  /** justificativa curta (interpretativa), quando a fonte permite */
  porque?: string;
  /** características interpretativas apontadas para este livro */
  caracteristicas: Caracteristica[];
  /** referências reais (páginas da internet) que sustentam a recomendação */
  fontes?: { titulo: string; url: string; tipo: TipoFonte }[];
};

export type Contexto = { nome: string; descricao?: string; titulos?: string[] };

export type Resposta = {
  interpretacao: Interpretacao;
  /** critérios em uso: os reconhecidos na pesquisa + os escolhidos em "refinar" */
  criterios: Caracteristica[];
  resultados: Resultado[];
  fonte: "catalogo" | "descoberta" | "nenhum";
  /** a recomendação passou por pesquisa em fontes literárias na internet */
  pesquisaExterna?: boolean;
  avisos: string[];
};

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const cache = new Map<string, { resposta: Resposta; ate: number }>();
function guardar(chave: string, resposta: Resposta) {
  if (cache.size >= 100) {
    const primeira = cache.keys().next().value;
    if (primeira) cache.delete(primeira);
  }
  cache.set(chave, { resposta, ate: Date.now() + 30 * 60_000 });
}
/** versão do motor de descoberta (muda a chave do cache local junto com a do servidor) */
const VERSAO = "v8";

/** filtros objetivos: só passam livros cujo dado confirma o critério */
function confirma(l: LivroBusca, criterios: Caracteristica[]) {
  const grupos = new Map<string, Caracteristica[]>();
  for (const c of criterios.filter((x) => x.objetiva)) grupos.set(c.categoria, [...(grupos.get(c.categoria) ?? []), c]);
  for (const [cat, cs] of grupos) {
    // dentro da mesma categoria, qualquer opção serve (ou); entre categorias, todas (e)
    const ok = cs.some((c) => {
      if (cat === "extensao") return !!l.paginas && l.paginas >= c.paginas![0] && l.paginas <= c.paginas![1];
      if (cat === "idioma") return l.idioma === c.idioma;
      if (cat === "periodo") return !!l.ano && l.ano >= c.anos![0] && l.ano <= c.anos![1];
      return true;
    });
    if (!ok) return false;
  }
  return true;
}

/**
 * Pesquisa direta: o registro precisa bater com o que foi digitado (título,
 * autoria ou ISBN) e ter autoria identificada. Isso tira os registros soltos
 * do catálogo ("Colóquio", "Letras de hoje", autoria desconhecida).
 */
function casaComAPesquisa(l: LivroBusca, consulta: string) {
  const q = norm(consulta);
  if (/^\d[\d\s-]{8,}[\dx]$/i.test(consulta.trim())) return true; // ISBN
  if (!l.autor || /desconhecid/.test(l.autor)) return false;
  const alvo = norm(`${l.titulo} ${l.subtitulo ?? ""} ${l.autor}`);
  const palavras = q.split(" ").filter((p) => p.length > 2);
  return palavras.length ? palavras.filter((p) => alvo.includes(p)).length / palavras.length >= 0.75 : alvo.includes(q);
}

function semRepetir(lista: Resultado[], excluir: Set<string>) {
  const vistos = new Set<string>();
  return lista.filter((r) => {
    const k = chaveDaObra(r.livro.titulo, r.livro.autor);
    if (vistos.has(k) || excluir.has(chaveTitulo(r.livro.titulo))) return false;
    vistos.add(k);
    return true;
  });
}

type Pedido = { consulta: string; filtros?: string[]; ignorados?: string[]; contexto?: Contexto; excluir?: string[]; sementes?: { titulo: string; autor: string }[] };

export async function buscarDescoberta({ consulta, filtros = [], ignorados = [], contexto, excluir = [], sementes: pedidas = [] }: Pedido, signal?: AbortSignal): Promise<Resposta> {
  // abrir uma curadoria pela busca usa a mesma seleção verificada dela
  // pelo nome ("Entre livros e segredos") ou pela consulta da curadoria
  const curadoria = CURADORIAS.find((c) => [c.consulta, c.nome].some((x) => x.toLowerCase() === consulta.trim().toLowerCase()));
  const sementes = pedidas.length ? pedidas : (curadoria?.sementes ?? []);
  if (curadoria && consulta.trim().toLowerCase() === curadoria.nome.toLowerCase()) consulta = `${curadoria.consulta} (${curadoria.descricao} Critérios: ${curadoria.criterios.join(", ")})`;
  const original = interpretarBusca(consulta);
  const interpretacao = { ...original, criterios: original.criterios.filter((c) => !ignorados.includes(c.id)) };
  const consultaEfetiva = ignorados.length ? original.resto : consulta;
  const criterios = [...interpretacao.criterios, ...filtros.map((id) => PORID.get(id)).filter((x): x is Caracteristica => !!x && !interpretacao.criterios.includes(x))];
  const avisos = [...interpretacao.avisos];
  const fora = new Set([...excluir, ...(contexto?.titulos ?? [])].map(chaveTitulo));
  const subjetivos = criterios.filter((c) => !c.objetiva);
  const direta = ehBuscaDireta(original, consulta) && !subjetivos.length && !contexto && !sementes.length;

  const sessao = !direta && supabase ? (await supabase.auth.getSession()).data.session : null;
  const chave = JSON.stringify([VERSAO, direta ? null : sessao?.user.id, consulta.trim().toLowerCase(), [...filtros].sort(), [...ignorados].sort(), contexto?.nome ?? "", contexto?.descricao ?? "", contexto?.titulos ?? [], [...excluir].sort(), sementes]);
  const pronto = cache.get(chave);
  if (pronto && pronto.ate > Date.now()) return pronto.resposta;

  // 1. título, autor ou ISBN: o catálogo de sempre, com correspondência exata primeiro
  if (direta && consulta.trim()) {
    const r = await buscarLivros(consulta.trim(), signal);
    const resultados = semRepetir(
      r
        .filter((l) => confirma(l, criterios) && !naoLiterario(l, consulta) && casaComAPesquisa(l, consulta))
        .map((livro) => ({ livro, caracteristicas: [] })),
      fora,
    );
    const resposta: Resposta = { interpretacao, criterios, resultados, fonte: "catalogo", avisos };
    if (resultados.length) guardar(chave, resposta);
    return resposta;
  }

  // 2. descoberta: pesquisa contextual + edição em português verificada, tudo no servidor
  const tk = sessao?.access_token;
  let resultados: Resultado[] = [];
  let fonte: Resposta["fonte"] = "descoberta";
  if (tk) {
    const r = await fetch("/api/descobrir", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${tk}` },
      body: JSON.stringify({
        consulta: consultaEfetiva.trim(),
        criterios: criterios.map((c) => `${c.nome} (${c.id}, ${c.categoria})`),
        sem: interpretacao.sem.map((c) => c.nome),
        parecidoCom: interpretacao.parecidoCom,
        contexto: contexto ? [contexto.nome, contexto.descricao, contexto.titulos?.length ? `já tem: ${contexto.titulos.slice(0, 12).join("; ")}` : ""].filter(Boolean).join(" · ") : "",
        excluir: [...excluir.slice(0, 50), ...(contexto?.titulos ?? []).slice(0, 20)],
        ids: CARACTERISTICAS.filter((c) => !c.objetiva).map((c) => c.id),
        sementes,
      }),
    }).catch(() => null);
    const dados = r?.ok
      ? ((await r.json().catch(() => null)) as {
          resultados?: { livro: LivroBusca; porque?: string; caracteristicas: string[]; fontes: { titulo: string; url: string; tipo: TipoFonte }[] }[];
          avisos?: string[];
        } | null)
      : null;
    if (dados) {
      for (const a of dados.avisos ?? []) if (!avisos.includes(a)) avisos.push(a);
    }
    if (dados?.resultados?.length) {
      resultados = dados.resultados.map((x, i) => ({
        livro: { ...x.livro, cor: x.livro.cor ?? ["#692536", "#8297D1", "#667255", "#D8A8B6"][i % 4] },
        porque: x.porque,
        caracteristicas: x.caracteristicas.map((id) => PORID.get(id)).filter((c): c is Caracteristica => !!c),
        fontes: x.fontes,
      }));
    }
  }

  // Todos os resultados exploratórios passam pelo mesmo filtro final.
  resultados = semRepetir(resultados.filter((r) =>
    ehEdicaoPt(r.livro) && !!r.livro.autor && !/desconhecid/i.test(r.livro.autor) &&
    !!r.livro.capa && !naoLiterario(r.livro) && confirma(r.livro, criterios)
  ), fora);
  if (!resultados.length) {
    fonte = "nenhum";
    avisos.push("Não encontramos recomendações confiáveis para esta pesquisa agora. Tente outras palavras, um autor ou um livro de referência.");
  }
  const pesquisaExterna = resultados.some((r) => !!r.fontes?.length);
  const resposta: Resposta = { interpretacao, criterios, resultados, fonte, avisos, pesquisaExterna };
  if (pesquisaExterna) guardar(chave, resposta);
  return resposta;
}

/** sugestões de pesquisa (executam buscas reais) */
export const SUGESTOES_INICIAIS = [
  "Para desacelerar",
  "Literatura coreana",
  "Fora da realidade",
  "Livros curtos e reflexivos",
  "Pequenas cidades",
  "Histórias sobre recomeços",
  "Realismo mágico",
  "Leituras melancólicas",
  "Fantasia acolhedora",
  "Entre livros e segredos",
  "Livros sobre amizade",
  "Narrador não confiável",
];

/** para "me surpreenda": uma combinação diferente a cada vez */
export function surpresa() {
  const origens = CARACTERISTICAS.filter((c) => c.categoria === "origem");
  const atmosferas = CARACTERISTICAS.filter((c) => c.categoria === "atmosfera" || c.categoria === "tematica");
  const o = origens[Math.floor(Math.random() * origens.length)];
  const a = atmosferas[Math.floor(Math.random() * atmosferas.length)];
  return `${o.nome} ${a.nome.toLowerCase()}`;
}
