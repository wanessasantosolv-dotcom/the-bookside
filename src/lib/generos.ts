"use client";

/**
 * Gêneros em português e mais finos que o "Fiction" do Google Books.
 *
 * 1. Os gêneros que vêm em inglês do catálogo são traduzidos.
 * 2. Quando o gênero é genérico ("ficção", "literatura"…) ou falta, o app
 *    procura o livro na Open Library e lê os assuntos (subjects), que são
 *    bem mais detalhados, escolhendo o gênero mais específico.
 * O resultado fica guardado no aparelho (por livro).
 */
import { useEffect, useState } from "react";
import type { LivroSalvo } from "@/lib/perfil-store";

const sem = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** tradução direta das categorias do Google Books (e afins) */
const TRADUCAO: Record<string, string> = {
  fiction: "ficção",
  "literary fiction": "ficção literária",
  "juvenile fiction": "infantojuvenil",
  "juvenile nonfiction": "infantojuvenil",
  "young adult fiction": "jovem adulto",
  "young adult nonfiction": "jovem adulto",
  music: "música",
  poetry: "poesia",
  "biography & autobiography": "biografia",
  biography: "biografia",
  history: "história",
  "literary criticism": "crítica literária",
  philosophy: "filosofia",
  psychology: "psicologia",
  "self-help": "autoajuda",
  "social science": "ciências sociais",
  "political science": "política",
  "true crime": "crimes reais",
  religion: "religião",
  "comics & graphic novels": "quadrinhos",
  drama: "teatro",
  "body, mind & spirit": "espiritualidade",
  "business & economics": "negócios",
  science: "ciência",
  "family & relationships": "família e relações",
  "foreign language study": "idiomas",
  cooking: "culinária",
  art: "arte",
  humor: "humor",
  travel: "viagem",
  nature: "natureza",
};

/** do mais específico ao mais geral: o primeiro que bater nos assuntos vence */
const PELOS_ASSUNTOS: [RegExp, string][] = [
  [/dystopi|distopi/, "distopia"],
  [/science fiction|ficcao cientifica|space opera|cyberpunk/, "ficção científica"],
  [/fantasy|fantasia|magic|dragons|fairies|faerie/, "fantasia"],
  [/horror|terror|ghost stories|haunted/, "terror"],
  [/thriller|suspense|psychological fiction/, "suspense"],
  [/mystery|detective|crime|murder|policial/, "policial"],
  [/historical fiction|romance historico|world war/, "romance histórico"],
  [/romance|love stories|romantic/, "romance"],
  [/young adult|jovem adulto|teen/, "jovem adulto"],
  [/juvenile|children|infantil|infantojuvenil/, "infantojuvenil"],
  [/poetry|poesia|poems/, "poesia"],
  [/biograph|memoir|autobiograph/, "biografia"],
  [/brazilian (literature|fiction)|literatura brasileira|brazil.*fiction/, "literatura brasileira"],
  [/classic|classico/, "clássicos"],
  [/humor|comedy|humorous/, "humor"],
  [/family|famil/, "drama familiar"],
  [/coming of age|bildungsroman/, "formação"],
  [/short stories|contos/, "contos"],
];

/** gêneros que não dizem muito: valem uma busca por algo melhor */
const GENERICOS = new Set([
  "ficcao",
  "fiction",
  "ficcao literaria",
  "literary fiction",
  "literatura",
  "literature",
  "general",
  "fiction general",
  "romance",
]);

/** o gênero do catálogo em português (sem mudar os que já estão em português) */
export function traduzirGenero(g?: string) {
  if (!g) return undefined;
  const k = sem(g);
  return TRADUCAO[k] ?? g.toLowerCase();
}

function generoDosAssuntos(assuntos: string[]): string | undefined {
  const texto = assuntos.map(sem).join(" | ");
  return PELOS_ASSUNTOS.find(([re]) => re.test(texto))?.[1];
}

const CACHE = "bookside-generos-v1";
function lerCache(): Record<string, string | null> {
  try {
    return JSON.parse(localStorage.getItem(CACHE) ?? "{}");
  } catch {
    return {};
  }
}
function gravarCache(c: Record<string, string | null>) {
  try {
    localStorage.setItem(CACHE, JSON.stringify(c));
  } catch {
    /* sem armazenamento */
  }
}

async function assuntosNaOpenLibrary(l: LivroSalvo): Promise<string[]> {
  const q = new URLSearchParams({ title: l.titulo, fields: "subject", limit: "3" });
  if (l.autor && !/^autoria/i.test(l.autor)) q.set("author", l.autor);
  const r = await fetch(`https://openlibrary.org/search.json?${q}`);
  if (!r.ok) return [];
  const d = (await r.json()) as { docs?: { subject?: string[] }[] };
  return (d.docs ?? []).flatMap((x) => x.subject ?? []).slice(0, 80);
}

/**
 * O gênero de cada livro, refinado: devolve id → gênero em português.
 * Enquanto busca, usa o gênero do catálogo traduzido.
 */
export function useGenerosRefinados(livros: LivroSalvo[], generoBase: (l: LivroSalvo) => string | undefined) {
  const chave = livros.map((l) => l.id).sort().join("|");
  const [refinados, setRefinados] = useState<Record<string, string | null>>(() =>
    typeof window === "undefined" ? {} : lerCache(),
  );
  useEffect(() => {
    let vivo = true;
    const cache = lerCache();
    const faltam = livros.filter((l) => {
      if (l.id in cache) return false;
      const base = generoBase(l);
      return !base || GENERICOS.has(sem(traduzirGenero(base) ?? "")) || GENERICOS.has(sem(base));
    });
    if (!faltam.length) {
      setRefinados(cache);
      return;
    }
    (async () => {
      for (let i = 0; i < faltam.length; i += 4) {
        const lote = faltam.slice(i, i + 4);
        const r = await Promise.all(
          lote.map((l) => assuntosNaOpenLibrary(l).then(generoDosAssuntos).catch(() => undefined)),
        );
        lote.forEach((l, k) => {
          cache[l.id] = r[k] ?? null;
        });
        gravarCache(cache);
        if (vivo) setRefinados({ ...cache });
      }
    })();
    return () => {
      vivo = false;
    };
    // a lista de ids é o que importa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  return (l: LivroSalvo) => refinados[l.id] ?? traduzirGenero(generoBase(l));
}

/** o gênero do livro é genérico (ou falta)? */
export function generoGenerico(g?: string) {
  if (!g) return true;
  return GENERICOS.has(sem(g)) || GENERICOS.has(sem(traduzirGenero(g) ?? ""));
}

/** o gênero mais fino de um livro (do aparelho, se já buscou; senão, pelos assuntos da Open Library) */
export async function generoRefinadoDe(l: LivroSalvo): Promise<string | null> {
  const cache = lerCache();
  if (l.id in cache) return cache[l.id];
  const g = await assuntosNaOpenLibrary(l)
    .then(generoDosAssuntos)
    .catch(() => undefined);
  cache[l.id] = g ?? null;
  gravarCache(cache);
  return g ?? null;
}
