/**
 * A busca única do app (Descobrir e "adicionar à lista").
 *
 * 1. interpreta a pesquisa (taxonomia local, sem IA);
 * 2. pesquisa direta (título, autor, ISBN) vai ao catálogo de sempre;
 * 3. pesquisa por características pede candidatos à IA, quando há, e confere
 *    cada um no catálogo (registro real, capa oficial) antes de mostrar;
 * 4. sem IA, cai numa busca por palavras-chave no catálogo e avisa;
 * 5. aplica só as restrições que os dados confirmam (páginas, idioma, ano).
 */
import { buscarLivros, chaveTitulo, livrosDoGoogle, type LivroBusca } from "@/lib/catalogo";
import { supabase } from "@/lib/supabase";
import { CARACTERISTICAS, PORID, ehBuscaDireta, interpretarBusca, type Caracteristica, type Interpretacao } from "@/lib/taxonomia";

export type Resultado = {
  livro: LivroBusca;
  /** justificativa curta (interpretativa), quando a fonte permite */
  porque?: string;
  /** características interpretativas apontadas para este livro */
  caracteristicas: Caracteristica[];
};

export type Contexto = { nome: string; descricao?: string; titulos?: string[] };

export type Resposta = {
  interpretacao: Interpretacao;
  /** critérios em uso: os reconhecidos na pesquisa + os escolhidos em "refinar" */
  criterios: Caracteristica[];
  resultados: Resultado[];
  fonte: "catalogo" | "descoberta" | "palavras";
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

const cache = new Map<string, Resposta>();

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

function semRepetir(lista: Resultado[], excluir: Set<string>) {
  const vistos = new Set<string>();
  return lista.filter((r) => {
    const k = chaveTitulo(r.livro.titulo);
    if (vistos.has(k) || excluir.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

/** acha o registro real de um candidato: título igual e sobrenome do autor batendo */
async function conferir(titulo: string, autor: string, signal?: AbortSignal): Promise<LivroBusca | null> {
  const sobrenome = norm(autor).split(" ").pop() ?? "";
  const t = norm(titulo);
  const achar = (r: LivroBusca[]) => {
    const certos = r.filter((l) => norm(l.titulo).startsWith(t.slice(0, Math.max(6, Math.min(t.length, 24)))) && norm(l.autor).includes(sobrenome));
    return certos.find((l) => l.capa && l.idioma === "pt") ?? certos.find((l) => l.capa) ?? certos[0] ?? null;
  };
  const r = await livrosDoGoogle(`intitle:"${titulo}" inauthor:"${sobrenome}"`, undefined, signal, { inicio: 0 }).catch(() => [] as LivroBusca[]);
  return achar(r) ?? achar(await buscarLivros(`${titulo} ${autor}`, signal).catch(() => [] as LivroBusca[]));
}

async function token() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

type Pedido = { consulta: string; filtros?: string[]; contexto?: Contexto; excluir?: string[] };

export async function buscarDescoberta({ consulta, filtros = [], contexto, excluir = [] }: Pedido, signal?: AbortSignal): Promise<Resposta> {
  const chave = JSON.stringify([consulta.trim().toLowerCase(), [...filtros].sort(), contexto?.nome ?? "", contexto?.descricao ?? ""]);
  const pronto = cache.get(chave);
  if (pronto) return pronto;

  const interpretacao = interpretarBusca(consulta);
  const criterios = [...interpretacao.criterios, ...filtros.map((id) => PORID.get(id)).filter((x): x is Caracteristica => !!x && !interpretacao.criterios.includes(x))];
  const avisos = [...interpretacao.avisos];
  const fora = new Set(excluir.map(chaveTitulo));
  const subjetivos = criterios.filter((c) => !c.objetiva);
  const direta = ehBuscaDireta(interpretacao) && !subjetivos.length && !contexto;

  // 1. título, autor ou ISBN: o catálogo de sempre, com correspondência exata primeiro
  if (direta && consulta.trim()) {
    const r = await buscarLivros(consulta.trim(), signal);
    const resultados = semRepetir(
      r.filter((l) => confirma(l, criterios)).map((livro) => ({ livro, caracteristicas: [] })),
      new Set(),
    );
    const resposta: Resposta = { interpretacao, criterios, resultados, fonte: "catalogo", avisos };
    cache.set(chave, resposta);
    return resposta;
  }

  // um título que parece pesquisa ("O Pequeno Príncipe", "Cem anos de solidão"): a obra exata vem primeiro
  const exatos =
    consulta.trim() && consulta.trim().split(/\s+/).length <= 7
      ? buscarLivros(consulta.trim(), signal)
          .then((r) => r.filter((l) => norm(l.titulo) === norm(consulta) || norm(l.titulo).startsWith(`${norm(consulta)} `)).slice(0, 3))
          .catch(() => [] as LivroBusca[])
      : Promise.resolve([] as LivroBusca[]);

  // 2. descoberta: candidatos da IA, conferidos no catálogo
  const tk = await token();
  let resultados: Resultado[] = [];
  let fonte: Resposta["fonte"] = "descoberta";
  if (tk) {
    const r = await fetch("/api/ia/descoberta", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", authorization: `Bearer ${tk}` },
      body: JSON.stringify({
        consulta: consulta.trim(),
        criterios: criterios.map((c) => `${c.nome} (${c.id}, ${c.categoria})`),
        sem: interpretacao.sem.map((c) => c.nome),
        parecidoCom: interpretacao.parecidoCom,
        contexto: contexto ? [contexto.nome, contexto.descricao, contexto.titulos?.length ? `já tem: ${contexto.titulos.slice(0, 12).join("; ")}` : ""].filter(Boolean).join(" · ") : "",
        excluir: [...excluir.slice(0, 50), ...(contexto?.titulos ?? []).slice(0, 20)],
        ids: CARACTERISTICAS.filter((c) => !c.objetiva).map((c) => c.id),
      }),
    }).catch(() => null);
    const dados = r?.ok ? ((await r.json().catch(() => null)) as { livros?: { titulo: string; autor: string; porque: string; caracteristicas: string[] }[] } | null) : null;
    if (dados?.livros?.length) {
      const conferidos = await Promise.all(
        dados.livros.map(async (c): Promise<Resultado | null> => {
          const livro = await conferir(c.titulo, c.autor, signal);
          return livro ? { livro, porque: c.porque || undefined, caracteristicas: c.caracteristicas.map((id) => PORID.get(id)).filter((x): x is Caracteristica => !!x) } : null;
        }),
      );
      resultados = conferidos.filter((x): x is Resultado => !!x);
    }
  }

  // 3. sem IA (ou sem candidatos): palavras-chave no catálogo, com aviso
  if (!resultados.length) {
    fonte = "palavras";
    const termos = subjetivos.flatMap((c) => c.termos.slice(0, 1));
    const assuntos = subjetivos.map((c) => c.assunto).filter((x): x is string => !!x);
    const base = [interpretacao.resto, interpretacao.parecidoCom].filter(Boolean).join(" ");
    const consultas = [
      [...termos, base].filter(Boolean).join(" "),
      ...assuntos.slice(0, 1).map((a) => `subject:"${a}" ${termos.filter((t) => !assuntos.includes(t)).slice(0, 2).join(" ")}`.trim()),
      ...(contexto && !termos.length ? [contexto.nome] : []),
    ].filter((q) => q.trim());
    const listas = await Promise.all(consultas.map((q) => livrosDoGoogle(q, "pt", signal, { inicio: 0 }).catch(() => [] as LivroBusca[])));
    const semTermos = interpretacao.sem.flatMap((c) => [norm(c.nome), ...c.termos.map(norm)]);
    resultados = listas
      .flat()
      .filter((l) => l.capa)
      .filter((l) => !semTermos.some((s) => norm(l.genero ?? "").includes(s)))
      .map((livro) => ({ livro, caracteristicas: [] }));
    if (subjetivos.length || interpretacao.parecidoCom) avisos.push("A busca por sensações e temas não está disponível agora. Mostramos resultados por palavras-chave, que podem não corresponder a todos os critérios.");
  }

  const primeiros = (await exatos).map((livro) => ({ livro, caracteristicas: [] as Caracteristica[] }));
  resultados = semRepetir(
    [...primeiros, ...resultados.filter((r) => confirma(r.livro, criterios))],
    fora,
  );
  const resposta: Resposta = { interpretacao, criterios, resultados, fonte, avisos };
  if (resultados.length) cache.set(chave, resposta);
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
