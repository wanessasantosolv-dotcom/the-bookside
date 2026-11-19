"use client";

/**
 * De onde é cada autora: Wikidata (gratuito, sem chave). Procura a pessoa pelo nome,
 * pega a cidadania (P27) e o país (nome em português + código para a bandeira).
 * Guarda no aparelho para não perguntar de novo.
 */
const CACHE = "bookside-paises-v1";
const API = "https://www.wikidata.org/w/api.php?format=json&origin=*";

export type Pais = { nome: string; codigo?: string };

function lerCache(): Record<string, Pais | null> {
  try {
    return JSON.parse(localStorage.getItem(CACHE) ?? "{}");
  } catch {
    return {};
  }
}
function gravarCache(c: Record<string, Pais | null>) {
  try {
    localStorage.setItem(CACHE, JSON.stringify(c));
  } catch {
    /* sem armazenamento */
  }
}

export const bandeira = (codigo?: string) =>
  codigo && /^[A-Z]{2}$/.test(codigo)
    ? String.fromCodePoint(...[...codigo].map((c) => 0x1f1a5 + c.charCodeAt(0)))
    : "🌍";

type Ent = {
  claims?: Record<
    string,
    { mainsnak?: { datavalue?: { value?: { id?: string } | string } } }[]
  >;
  labels?: Record<string, { value: string }>;
};

async function paisDaAutora(autor: string): Promise<Pais | null> {
  const busca = (await fetch(
    `${API}&action=wbsearchentities&type=item&limit=5&language=pt&uselang=pt&search=${encodeURIComponent(autor)}`,
  ).then((r) => r.json())) as { search?: { id: string }[] };
  const ids = (busca.search ?? []).map((s) => s.id);
  if (!ids.length) return null;
  const ents = (await fetch(
    `${API}&action=wbgetentities&props=claims&ids=${ids.join("|")}`,
  ).then((r) => r.json())) as { entities?: Record<string, Ent> };
  // a primeira que é pessoa (P31 = Q5) e tem cidadania
  const pessoa = ids
    .map((id) => ents.entities?.[id])
    .find(
      (e) =>
        e?.claims?.P31?.some(
          (c) => (c.mainsnak?.datavalue?.value as { id?: string })?.id === "Q5",
        ) && e.claims?.P27?.length,
    );
  const paisId = (
    pessoa?.claims?.P27?.at(-1)?.mainsnak?.datavalue?.value as { id?: string }
  )?.id;
  if (!paisId) return null;
  const p = (await fetch(
    `${API}&action=wbgetentities&props=labels|claims&languages=pt|en&ids=${paisId}`,
  ).then((r) => r.json())) as { entities?: Record<string, Ent> };
  const ent = p.entities?.[paisId];
  const nome = ent?.labels?.pt?.value ?? ent?.labels?.en?.value;
  const codigo = ent?.claims?.P297?.[0]?.mainsnak?.datavalue?.value;
  return nome
    ? { nome, codigo: typeof codigo === "string" ? codigo : undefined }
    : null;
}

/** os países de várias autoras (devagar, de 3 em 3, guardando no aparelho) */
export async function paisesDasAutoras(autores: string[]) {
  const cache = lerCache();
  const faltam = [...new Set(autores)].filter(
    (a) => a && !a.startsWith("autoria") && !(a.toLowerCase() in cache),
  );
  for (let i = 0; i < faltam.length; i += 3) {
    const lote = faltam.slice(i, i + 3);
    const r = await Promise.all(
      lote.map((a) => paisDaAutora(a).catch(() => undefined)),
    );
    lote.forEach((a, k) => {
      if (r[k] !== undefined) cache[a.toLowerCase()] = r[k]!;
    });
    gravarCache(cache);
  }
  return cache;
}
