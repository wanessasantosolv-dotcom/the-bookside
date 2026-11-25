"use client";

/**
 * Match de leitoras: quão parecido duas pessoas leem, pelo que está nas
 * estantes públicas. Conta livros lidos em comum (e se as notas batem),
 * autorias em comum, gêneros e o que uma pode indicar para a outra.
 */
import { chaveTitulo } from "@/lib/catalogo";
import type { LivroSalvo } from "@/lib/perfil-store";
import { meuId, type PessoaResumo } from "@/lib/social";
import { supabase } from "@/lib/supabase";

export type Match = {
  /** 0 a 100 */
  pontos: number;
  emComum: LivroSalvo[];
  /** livros em comum em que as duas deram nota parecida (até meia estrela) */
  concordam: number;
  /** os que as duas deram 4 ou mais */
  amaram: LivroSalvo[];
  autorias: string[];
  generos: string[];
  /** o que ela leu e gostou que está no seu quero ler (ou você ainda não leu) */
  paraVoce: LivroSalvo[];
  /** o que você leu e gostou que está no quero ler dela */
  paraEla: LivroSalvo[];
  /** frase curta para o cartão */
  resumo: string;
};

const lidos = (ls: LivroSalvo[]) => ls.filter((l) => l.status === "lido");
const chave = (l: LivroSalvo) => chaveTitulo(l.titulo);
const autoria = (a: string) => chaveTitulo(a);

function generosDe(livros: LivroSalvo[], gostos: string[] = []) {
  const s = new Set(gostos.map((g) => g.toLowerCase()));
  for (const l of livros) if (l.genero) s.add(l.genero.toLowerCase());
  return s;
}

export function calcularMatch(
  meus: LivroSalvo[],
  meusGostos: string[],
  dela: LivroSalvo[],
  gostosDela: string[] = [],
): Match {
  const euLi = new Map(lidos(meus).map((l) => [chave(l), l]));
  const elaLeu = new Map(lidos(dela).map((l) => [chave(l), l]));

  const emComum: LivroSalvo[] = [];
  let concordam = 0;
  let acordo = 0;
  const amaram: LivroSalvo[] = [];
  for (const [k, l] of elaLeu) {
    const meu = euLi.get(k);
    if (!meu) continue;
    emComum.push(meu);
    if (meu.nota && l.nota) {
      const dif = Math.abs(meu.nota - l.nota);
      acordo += 1 - Math.min(1, dif / 3);
      if (dif <= 0.5) concordam++;
      if (meu.nota >= 4 && l.nota >= 4) amaram.push(meu);
    } else acordo += 0.6;
  }
  const mediaAcordo = emComum.length ? acordo / emComum.length : 0;

  // autorias que as duas leram
  const minhasAutorias = new Map<string, string>();
  for (const l of lidos(meus)) minhasAutorias.set(autoria(l.autor), l.autor);
  const autorias = [
    ...new Set(
      lidos(dela)
        .map((l) => minhasAutorias.get(autoria(l.autor)))
        .filter(
          (a): a is string => !!a && !/^autoria|desconhecid/i.test(a),
        ),
    ),
  ];

  const g1 = generosDe(meus, meusGostos);
  const g2 = generosDe(dela, gostosDela);
  const generos = [...g1].filter((g) => g2.has(g));
  const uniao = new Set([...g1, ...g2]).size;
  const jaccard = uniao ? generos.length / uniao : 0;

  const meuQuero = new Set(
    meus.filter((l) => l.status === "quero").map(chave),
  );
  const tudoMeu = new Set(meus.map(chave));
  const paraVoce = lidos(dela)
    .filter((l) => (l.nota ?? 0) >= 4 && (meuQuero.has(chave(l)) || !tudoMeu.has(chave(l))))
    .sort(
      (a, b) =>
        Number(meuQuero.has(chave(b))) - Number(meuQuero.has(chave(a))) ||
        (b.nota ?? 0) - (a.nota ?? 0),
    )
    .slice(0, 6);
  const queroDela = new Set(
    dela.filter((l) => l.status === "quero").map(chave),
  );
  const paraEla = lidos(meus)
    .filter((l) => (l.nota ?? 0) >= 4 && queroDela.has(chave(l)))
    .slice(0, 6);

  const pontos = Math.round(
    100 *
      Math.min(
        1,
        0.5 * Math.min(1, emComum.length / 8) * (0.4 + 0.6 * mediaAcordo) +
          0.2 * Math.min(1, autorias.length / 4) +
          0.2 * jaccard +
          0.1 * Math.min(1, (paraVoce.length + paraEla.length) / 4),
      ),
  );

  const resumo = emComum.length
    ? amaram.length
      ? `${emComum.length} ${emComum.length === 1 ? "livro" : "livros"} em comum · as duas amaram ${amaram[0].titulo}`
      : `${emComum.length} ${emComum.length === 1 ? "livro" : "livros"} em comum`
    : autorias.length
      ? `as duas leem ${autorias[0]}`
      : generos.length
        ? `as duas gostam de ${generos.slice(0, 2).join(" e ")}`
        : "estantes bem diferentes — dá pra trocar muita indicação";

  return {
    pontos,
    emComum,
    concordam,
    amaram,
    autorias,
    generos,
    paraVoce,
    paraEla,
    resumo,
  };
}

export const rotuloDoMatch = (p: number) =>
  p >= 75
    ? "almas de estante"
    : p >= 50
      ? "leem parecido"
      : p >= 25
        ? "têm muito em comum"
        : "gostos diferentes";

export type Candidata = PessoaResumo & { match: Match };

/**
 * As leitoras mais parecidas com você, entre os perfis públicos mais
 * recentes do app (só lê a estante e os gêneros de cada uma).
 */
export async function melhoresMatches(
  meus: LivroSalvo[],
  meusGostos: string[],
): Promise<Candidata[]> {
  const eu = meuId();
  if (!supabase || !eu) return [];
  const { data, error } = await supabase
    .from("perfis_publicos")
    .select("id,usuario,nome,foto,livros:dados->livros,gostos:dados->gostos")
    .neq("id", eu)
    .not("usuario", "is", null)
    .order("atualizado_em", { ascending: false })
    .limit(120);
  if (error) throw error;
  return (
    (data ?? []) as (PessoaResumo & {
      livros: LivroSalvo[] | null;
      gostos: string[] | null;
    })[]
  )
    .filter((p) => Array.isArray(p.livros) && p.livros.length)
    .map(({ livros, gostos, ...p }) => ({
      ...p,
      match: calcularMatch(
        meus,
        meusGostos,
        livros ?? [],
        Array.isArray(gostos) ? gostos : [],
      ),
    }))
    .filter((c) => c.match.pontos > 0)
    .sort((a, b) => b.match.pontos - a.match.pontos)
    .slice(0, 20);
}
