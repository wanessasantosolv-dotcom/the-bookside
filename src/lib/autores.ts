"use client";

/**
 * Página de autoria: foto, biografia curta e de onde é, pelo Wikidata e pela
 * Wikipédia (gratuitos, sem chave, com CORS). Guarda no aparelho por 30 dias.
 * Os livros vêm do catálogo (Google Books + Open Library).
 */
import { buscarPorAutoria, chaveTitulo, type LivroBusca } from "@/lib/catalogo";

export type Autoria = {
  nome: string;
  /** uma linha: "escritora brasileira", "romancista turca"… */
  descricao?: string;
  bio?: string;
  foto?: string;
  nascimento?: string;
  morte?: string;
  /** a página da Wikipédia, para ler mais */
  link?: string;
};

const CACHE = "bookside-autorias-v1";
const VALIDADE = 30 * 86_400_000;
const WD = "https://www.wikidata.org/w/api.php?format=json&origin=*";

/** o endereço da página de uma autoria */
export const linkDaAutoria = (nome: string) =>
  `/autor/${encodeURIComponent(nome.trim().toLowerCase())}`;

/** "autoria desconhecida" e afins não viram link */
export const autoriaConhecida = (nome?: string) =>
  !!nome && nome.trim().length > 1 && !/^autoria|desconhecid/i.test(nome.trim());

function lerCache(): Record<string, { em: number; a: Autoria | null }> {
  try {
    return JSON.parse(localStorage.getItem(CACHE) ?? "{}");
  } catch {
    return {};
  }
}
function gravarCache(nome: string, a: Autoria | null) {
  try {
    const c = lerCache();
    c[chaveTitulo(nome)] = { em: Date.now(), a };
    localStorage.setItem(CACHE, JSON.stringify(c));
  } catch {
    /* sem armazenamento */
  }
}

type Claim = { mainsnak?: { datavalue?: { value?: unknown } } };
type Ent = {
  claims?: Record<string, Claim[]>;
  sitelinks?: Record<string, { title: string }>;
  descriptions?: Record<string, { value: string }>;
  labels?: Record<string, { value: string }>;
};

const ESCRITA =
  /escrit|autor|autora|romancist|poet|novel|writer|author|jornalist|dramaturg|ensa[ií]st|cronista|contist|roteirist|quadrinist|ilustrador/i;

/** "+1952-03-11T00:00:00Z" → "1952" */
const anoDe = (c?: Claim[]) => {
  const v = c?.[0]?.mainsnak?.datavalue?.value as { time?: string } | undefined;
  return v?.time?.match(/^[+-]?(\d{1,4})/)?.[1];
};

async function resumoDaWikipedia(lingua: "pt" | "en", titulo: string) {
  const r = await fetch(
    `https://${lingua}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(titulo.replace(/ /g, "_"))}`,
  );
  if (!r.ok) return null;
  const d = (await r.json()) as {
    type?: string;
    extract?: string;
    description?: string;
    thumbnail?: { source: string };
    originalimage?: { source: string };
    content_urls?: { desktop?: { page?: string } };
  };
  if (d.type === "disambiguation") return null;
  return {
    bio: d.extract,
    descricao: d.description,
    foto: d.thumbnail?.source ?? d.originalimage?.source,
    link: d.content_urls?.desktop?.page,
  };
}

async function buscarAutoria(nome: string): Promise<Autoria | null> {
  // 1. a pessoa no Wikidata (preferindo quem escreve)
  const busca = (await fetch(
    `${WD}&action=wbsearchentities&type=item&limit=7&language=pt&uselang=pt&search=${encodeURIComponent(nome)}`,
  ).then((r) => r.json())) as {
    search?: { id: string; description?: string }[];
  };
  const candidatos = busca.search ?? [];
  if (!candidatos.length) return null;
  const ids = candidatos.map((c) => c.id);
  const ents = (await fetch(
    `${WD}&action=wbgetentities&props=claims|sitelinks|descriptions&languages=pt|en&ids=${ids.join("|")}`,
  ).then((r) => r.json())) as { entities?: Record<string, Ent> };
  const pessoas = ids
    .map((id) => ({ id, e: ents.entities?.[id] }))
    .filter(({ e }) =>
      e?.claims?.P31?.some(
        (c) => (c.mainsnak?.datavalue?.value as { id?: string })?.id === "Q5",
      ),
    );
  const descricao = (e?: Ent) =>
    e?.descriptions?.pt?.value ?? e?.descriptions?.en?.value ?? "";
  const escolhida =
    pessoas.find(({ e }) => ESCRITA.test(descricao(e)) || e?.claims?.P800) ??
    pessoas[0];
  if (!escolhida?.e) return null;
  const e = escolhida.e;

  // 2. o resumo da Wikipédia (português; senão inglês)
  const pt = e.sitelinks?.ptwiki?.title;
  const en = e.sitelinks?.enwiki?.title;
  const resumo =
    (pt ? await resumoDaWikipedia("pt", pt).catch(() => null) : null) ??
    (en ? await resumoDaWikipedia("en", en).catch(() => null) : null);

  const imagem = e.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
  const fotoWD =
    typeof imagem === "string"
      ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imagem)}?width=480`
      : undefined;

  return {
    nome,
    descricao: descricao(e) || resumo?.descricao,
    bio: resumo?.bio,
    foto: resumo?.foto ?? fotoWD,
    nascimento: anoDe(e.claims?.P569),
    morte: anoDe(e.claims?.P570),
    link:
      resumo?.link ??
      (pt
        ? `https://pt.wikipedia.org/wiki/${encodeURIComponent(pt)}`
        : undefined),
  };
}

/** foto, bio e datas de uma autoria (do aparelho, se já buscou) */
export async function autoriaPorNome(nome: string): Promise<Autoria | null> {
  const guardada = lerCache()[chaveTitulo(nome)];
  if (guardada && Date.now() - guardada.em < VALIDADE) return guardada.a;
  const a = await buscarAutoria(nome);
  gravarCache(nome, a);
  return a;
}

/** sobrenome (a última palavra), para conferir se o livro é mesmo dela */
const sobrenome = (n: string) => chaveTitulo(n).split(" ").pop() ?? "";

/**
 * Os principais livros da autoria: sem repetidos (o mesmo título em várias
 * edições), preferindo a edição com capa e em português, e ordenados pelos
 * mais avaliados.
 */
export async function livrosDaAutoria(nome: string): Promise<LivroBusca[]> {
  const todos = await buscarPorAutoria(nome);
  const alvo = sobrenome(nome);
  const porTitulo = new Map<string, LivroBusca>();
  const pontos = (l: LivroBusca) =>
    (l.capa ? 4 : 0) +
    (l.idioma === "pt" ? 3 : 0) +
    (l.sinopse ? 1 : 0) +
    Math.log10((l.avaliacao?.total ?? 0) + 1);
  for (const l of todos) {
    if (alvo && !chaveTitulo(l.autor).includes(alvo)) continue;
    const k = chaveTitulo(l.titulo)
      .replace(/\b(vol|volume|livro|book)\s*\d+\b/g, "")
      .trim();
    if (!k) continue;
    const atual = porTitulo.get(k);
    if (!atual || pontos(l) > pontos(atual)) {
      // guarda a soma das avaliações das edições
      const total = (atual?.avaliacao?.total ?? 0) + (l.avaliacao?.total ?? 0);
      porTitulo.set(k, {
        ...l,
        avaliacao: l.avaliacao
          ? { ...l.avaliacao, total }
          : atual?.avaliacao
            ? { ...atual.avaliacao, total }
            : undefined,
      });
    }
  }
  // só edições em português: com o idioma da edição, ou (sem idioma) com
  // título que tem palavras em português e nenhuma em inglês/outra língua
  return [...porTitulo.values()]
    .filter(edicaoEmPortugues)
    .sort(
      (a, b) =>
        (b.avaliacao?.total ?? 0) - (a.avaliacao?.total ?? 0) ||
        Number(!!b.capa) - Number(!!a.capa),
    )
    .slice(0, 18);
}

const PALAVRAS_PT = ["o", "a", "os", "as", "de", "do", "da", "dos", "das", "e", "um", "uma", "que", "no", "na", "em", "para", "com", "sete", "maridos", "amor", "vida"];
const PALAVRAS_OUTRAS = ["the", "of", "and", "in", "der", "die", "und", "los", "las", "el", "la", "le", "les", "des", "il", "is", "my", "your"];

/** a edição é em português? (idioma da edição; sem idioma, pelas palavras do título) */
export function edicaoEmPortugues(l: { titulo: string; idioma?: string }) {
  if (l.idioma) return l.idioma.startsWith("pt");
  const ps = ` ${chaveTitulo(l.titulo)} `;
  const tem = (lista: string[]) => lista.some((p) => ps.includes(` ${p} `));
  return tem(PALAVRAS_PT) && !tem(PALAVRAS_OUTRAS) && !/[äöüßñ]/i.test(l.titulo);
}
