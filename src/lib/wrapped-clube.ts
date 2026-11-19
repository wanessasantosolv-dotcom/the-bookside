import {
  criterios,
  media,
  pessoaDaFicha,
  type AnoDoClube,
  type Criterio,
  type LivroDoClube,
} from "@/lib/clubes";
import { nomeDe, type PessoaResumo } from "@/lib/social";

/** Os números do ano do clube (o "wrapped"). */
export function calcularWrapped(d: AnoDoClube) {
  const lidos = d.livros.filter((l) => l.estado === "lido");
  const paginas = lidos.reduce((t, l) => t + (l.livro.paginas ?? 0), 0);
  const fichasDe = (l: LivroDoClube) =>
    d.fichas.filter((f) => f.clube_livro_id === l.id);
  const notasDe = (l: LivroDoClube) =>
    fichasDe(l)
      .map((f) => Number(f.nota))
      .filter((n) => n > 0);
  const pessoa = (id: string): PessoaResumo | null =>
    pessoaDaFicha(id, d.membros);

  const comMedia = lidos
    .map((l) => ({ l, m: media(notasDe(l)), notas: notasDe(l) }))
    .filter(
      (x): x is { l: LivroDoClube; m: number; notas: number[] } => x.m !== null,
    );
  const maisAmado = [...comMedia].sort((a, b) => b.m - a.m)[0];
  const menosAmado =
    comMedia.length > 1
      ? [...comMedia].sort((a, b) => a.m - b.m)[0]
      : undefined;
  // o que mais dividiu o clube: maior diferença entre a maior e a menor nota
  const polemico = comMedia
    .filter((x) => x.notas.length > 1)
    .map((x) => ({ ...x, d: Math.max(...x.notas) - Math.min(...x.notas) }))
    .sort((a, b) => b.d - a.d)[0];

  const porCriterio = criterios
    .map((c) => ({
      c,
      m: media(d.fichas.map((f) => f.notas?.[c as Criterio])),
    }))
    .filter(
      (x): x is { c: (typeof criterios)[number]; m: number } => x.m !== null,
    )
    .sort((a, b) => b.m - a.m);

  // personagem mais citada nas fichas
  const contagem = new Map<string, number>();
  for (const f of d.fichas) {
    const p = f.personagem?.trim();
    if (p)
      contagem.set(p.toLowerCase(), (contagem.get(p.toLowerCase()) ?? 0) + 1);
  }
  const personagem = [...contagem].sort((a, b) => b[1] - a[1])[0];
  const personagemNome = personagem
    ? (d.fichas
        .find((f) => f.personagem?.trim().toLowerCase() === personagem[0])
        ?.personagem?.trim() ?? personagem[0])
    : null;

  // quem escreveu mais fichas, a nota mais generosa e a mais exigente
  // por pessoa (contas do app e nomes das fichas antigas)
  const porPessoa = [...new Set(d.fichas.map((f) => f.autor))]
    .map((autor) => {
      const fs = d.fichas.filter((f) => f.autor === autor);
      return {
        pessoa: pessoa(autor)!,
        fichas: fs.length,
        media: media(fs.map((f) => Number(f.nota))),
      };
    })
    .filter((x) => x.fichas && x.pessoa);
  const dedicada = [...porPessoa].sort((a, b) => b.fichas - a.fichas)[0];
  const generosa =
    porPessoa.length > 1
      ? [...porPessoa].sort((a, b) => (b.media ?? 0) - (a.media ?? 0))[0]
      : undefined;
  const exigente =
    porPessoa.length > 1
      ? [...porPessoa].sort((a, b) => (a.media ?? 0) - (b.media ?? 0))[0]
      : undefined;

  const citacoes = d.fichas.filter((f) => f.citacao?.trim() && !f.spoiler);
  const citacao = citacoes
    .sort((a, b) => (b.citacao?.length ?? 0) - (a.citacao?.length ?? 0))
    .find((f) => (f.citacao?.length ?? 0) <= 220);

  const fora = [...d.foraDoClube.values()].reduce((t, l) => t + l.length, 0);
  const leitoraVoraz = [...d.foraDoClube]
    .map(([id, l]) => ({ pessoa: pessoa(id), n: l.length }))
    .sort((a, b) => b.n - a.n)[0];

  return {
    lidos: lidos.length,
    paginas,
    media: media(d.fichas.map((f) => Number(f.nota))),
    fichas: d.fichas.length,
    encontros: d.encontros.length,
    maisAmado,
    menosAmado,
    polemico: polemico && polemico.d >= 2 ? polemico : undefined,
    criterio: porCriterio[0],
    personagem:
      personagemNome && personagem![1] > 1
        ? { nome: personagemNome, vezes: personagem![1] }
        : null,
    dedicada,
    generosa,
    exigente:
      exigente && generosa && exigente.pessoa.id !== generosa.pessoa.id
        ? exigente
        : undefined,
    citacao: citacao
      ? {
          texto: citacao.citacao!.trim(),
          quem: nomeDe(pessoa(citacao.autor)),
          livro:
            d.livros.find((l) => l.id === citacao.clube_livro_id)?.livro
              .titulo ?? "",
        }
      : null,
    fora,
    leitoraVoraz: leitoraVoraz?.n ? leitoraVoraz : undefined,
  };
}
