"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { CapaAuto } from "@/components/CapaAuto";
import { CapaDoLivro, PrateleiraMadeira } from "@/components/estantes/Biblioteca";
import { lembrarLivros } from "@/lib/catalogo";
import { meusClubes } from "@/lib/clubes";
import { estrelas, porDataDeLeitura } from "@/lib/estantes";
import { generoGenerico, traduzirGenero } from "@/lib/generos";
import type { Match } from "@/lib/match";
import { usePerfil, type LivroSalvo, type Perfil } from "@/lib/perfil-store";
import { arquetipos, type ArquetipoId } from "@/lib/teste";
import { atividadesDe, quandoFoi, useConsulta, verbo } from "@/lib/social";

/*
 * O perfil: identidade literária (banner, foto, nome, bio, números, ações)
 * e quatro abas (visão geral, jornada, resenhas, estantes). O mesmo
 * componente serve o seu perfil e o de outra pessoa, no celular e no
 * computador; a cor de destaque vem do tema do perfil (--acc).
 */

export type AbaDoPerfil = "geral" | "jornada" | "resenhas" | "estantes";

const ABAS: { id: AbaDoPerfil; nome: string }[] = [
  { id: "geral", nome: "visão geral" },
  { id: "jornada", nome: "jornada" },
  { id: "resenhas", nome: "resenhas" },
  { id: "estantes", nome: "estantes" },
];

const suave = (pct: number): CSSProperties => ({ background: `color-mix(in srgb, var(--acc) ${pct}%, transparent)` });
const titulo = "font-revista text-[22px] leading-none italic text-[var(--acc)] lg:text-[24px]";
const linhaSecao = "mb-4 flex items-baseline justify-between gap-3 border-b border-[var(--linha)] pb-2";
const linkSecao = "flex min-h-9 items-center text-[12px] font-semibold text-[var(--acc)] hover:underline";

function Secao({ id, nome, acao, children }: { id: string; nome: string; acao?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <div className={linhaSecao}>
        <h2 id={id} className={titulo}>
          {nome}
        </h2>
        {acao}
      </div>
      {children}
    </section>
  );
}

function Convite({ href, texto }: { href: string; texto: string }) {
  return (
    <Link href={href} className="inline-flex min-h-10 items-center text-[14px] text-[var(--suave)] hover:text-[var(--acc)]">
      {texto} <span className="ml-1 text-[var(--acc)]">→</span>
    </Link>
  );
}

// ───────── menu de ações secundárias ─────────

function MenuMais({ itens }: { itens: { nome: string; href?: string; onClick?: () => void }[] }) {
  const [aberto, setAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!aberto) return;
    const fora = (e: MouseEvent) => {
      if (!caixa.current?.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, [aberto]);
  return (
    <div ref={caixa} className="relative">
      <button
        type="button"
        aria-label="mais opções"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className="grid size-11 place-items-center rounded-full border border-[var(--linha)] text-[var(--acc)] hover:border-[var(--acc)]"
      >
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.7" />
          <circle cx="12" cy="12" r="1.7" />
          <circle cx="19" cy="12" r="1.7" />
        </svg>
      </button>
      {aberto ? (
        <ul role="menu" className="absolute top-12 right-0 z-30 min-w-[200px] rounded-[8px] border border-[var(--linha)] bg-[var(--papel)] py-1.5 shadow-[0_12px_28px_-14px_rgba(43,20,32,.45)]">
          {itens.map((i) => (
            <li key={i.nome} role="none">
              {i.href ? (
                <Link role="menuitem" href={i.href} className="block px-4 py-2.5 text-[14px] text-[var(--tinta)] hover:bg-[var(--linha)]">
                  {i.nome}
                </Link>
              ) : (
                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setAberto(false);
                    i.onClick?.();
                  }}
                  className="block w-full px-4 py-2.5 text-left text-[14px] text-[var(--tinta)] hover:bg-[var(--linha)]"
                >
                  {i.nome}
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

// ───────── cabeçalho ─────────

function Banner({ p }: { p: Perfil }) {
  return (
    <div
      className={`h-[120px] w-full bg-cover bg-center lg:h-[200px] lg:rounded-b-[4px] ${p.capaImagem ? "" : `pat-${p.capa}`}`}
      style={p.capaImagem ? { backgroundImage: `url("${p.capaImagem}")` } : undefined}
    />
  );
}

function Foto({ p, tamanho }: { p: Perfil; tamanho: number }) {
  return (
    <span className="block overflow-hidden rounded-full border-4 border-[var(--papel)] bg-[var(--linha)]" style={{ width: tamanho, height: tamanho }}>
      {p.foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.foto} alt="" className="size-full object-cover object-[50%_30%]" />
      ) : (
        <span className="flex size-full items-center justify-center font-revista text-[var(--acc)] italic" style={{ fontSize: tamanho * 0.42 }}>
          {(p.nome || p.usuario || "?").charAt(0).toLowerCase()}
        </span>
      )}
    </span>
  );
}

function Numeros({ p, numeros, base }: { p: Perfil; numeros: { seguidores: number; seguindo: number } | null; base: string }) {
  const lidos = p.livros.filter((l) => l.status === "lido").length;
  const resenhas = p.livros.filter((l) => l.resenha?.trim()).length;
  const item = (n: number | string, r: string, href?: string) => {
    const conteudo = (
      <>
        <b className="block font-revista text-[22px] leading-none font-normal text-[var(--tinta)] tabular-nums">{n}</b>
        <span className="mt-1 block text-[11px] text-[var(--suave)]">{r}</span>
      </>
    );
    return href ? (
      <Link href={href} className="block min-h-11 hover:opacity-80">
        {conteudo}
      </Link>
    ) : (
      <span className="block min-h-11">{conteudo}</span>
    );
  };
  return (
    <dl className="flex gap-6 sm:gap-8">
      <div>{item(lidos, lidos === 1 ? "livro lido" : "livros lidos")}</div>
      <div>{item(resenhas, resenhas === 1 ? "resenha" : "resenhas")}</div>
      {numeros ? (
        <>
          <div>{item(numeros.seguidores, numeros.seguidores === 1 ? "seguidor" : "seguidores", `${base}/seguidores`)}</div>
          <div>{item(numeros.seguindo, "seguindo", `${base}/seguidores?aba=seguindo`)}</div>
        </>
      ) : null}
    </dl>
  );
}

// ───────── visão geral ─────────

function LivrosFavoritos({ favoritos, proprio }: { favoritos: LivroSalvo[]; proprio: boolean }) {
  if (!favoritos.length && !proprio) return null;
  return (
    <Secao
      id="t-favoritos"
      nome="livros favoritos"
      acao={proprio ? <Link href="/perfil/favoritos" className={linkSecao}>{favoritos.length ? "reorganizar" : "escolher"}</Link> : undefined}
    >
      {favoritos.length ? (
        <div>
          <ul className="flex items-end gap-3 overflow-x-auto px-3 pt-3 [scrollbar-width:none] sm:gap-5">
            {favoritos.map((l) => (
              <li key={l.id} className="flex-none">
                <Link href={`/livro/${l.id}`} aria-label={`${l.titulo}, de ${l.autor}`} className="block transition-transform duration-300 hover:-translate-y-1.5 motion-reduce:transition-none">
                  <span className="sm:hidden">
                    <CapaDoLivro livro={l} altura={130} />
                  </span>
                  <span className="hidden sm:block">
                    <CapaDoLivro livro={l} altura={170} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <PrateleiraMadeira className="-mt-[5px]" />
        </div>
      ) : (
        <Convite href="/perfil/favoritos" texto="escolha seus livros favoritos" />
      )}
    </Secao>
  );
}

function Citacao({ p, proprio, onEscolher }: { p: Perfil; proprio: boolean; onEscolher: () => void }) {
  const c = p.citacaoPerfil;
  if (!c && !proprio) return null;
  if (!c)
    return (
      <section aria-label="citação favorita">
        <button type="button" onClick={onEscolher} className="inline-flex min-h-10 items-center text-[14px] text-[var(--suave)] hover:text-[var(--acc)]">
          adicione uma citação ao seu perfil <span className="ml-1 text-[var(--acc)]">→</span>
        </button>
      </section>
    );
  return (
    <figure className="rounded-[10px] px-5 py-5" style={suave(8)}>
      <span aria-hidden className="block font-revista text-[44px] leading-[.6] text-[var(--acc)]">
        “
      </span>
      <blockquote className="mt-2 font-revista text-[19px] leading-[1.4] text-[var(--tinta)]">
        <i>{c.texto}</i>
      </blockquote>
      <figcaption className="mt-3 text-[12px] text-[var(--suave)]">
        {c.autor ? <span className="font-semibold">{c.autor}</span> : null}
        {c.livro ? (
          <>
            {c.autor ? " · " : ""}
            {c.livroId ? (
              <Link href={`/livro/${c.livroId}`} className="hover:underline">
                {c.livro}
              </Link>
            ) : (
              c.livro
            )}
          </>
        ) : null}
      </figcaption>
      {proprio ? (
        <button type="button" onClick={onEscolher} className="mt-2 min-h-9 text-[12px] font-semibold text-[var(--acc)] hover:underline">
          trocar citação
        </button>
      ) : null}
    </figure>
  );
}

function LendoAgora({ lendo, proprio }: { lendo: LivroSalvo[]; proprio: boolean }) {
  if (!lendo.length) return null;
  return (
    <Secao id="t-lendo" nome="lendo agora">
      <ul className="grid gap-5 sm:grid-cols-2">
        {lendo.slice(0, 4).map((l) => {
          const pct = l.paginas && l.paginaAtual ? Math.min(100, Math.round((l.paginaAtual / l.paginas) * 100)) : null;
          return (
            <li key={l.id} className="flex gap-4">
              <Link href={`/livro/${l.id}`} className="w-[64px] flex-none">
                <CapaAuto livro={l} className="w-full [&>span:last-child]:hidden" />
              </Link>
              <span className="min-w-0 flex-1">
                <Link href={`/livro/${l.id}`} className="line-clamp-2 font-revista text-[17px] leading-tight text-[var(--tinta)] hover:text-[var(--acc)]">
                  {l.titulo}
                </Link>
                <span className="mt-0.5 block truncate text-[12px] text-[var(--suave)]">{l.autor}</span>
                <span className="mt-2 flex items-baseline justify-between text-[11px] text-[var(--suave)]">
                  <span>{pct !== null ? `${l.paginaAtual} de ${l.paginas} págs.` : "lendo"}</span>
                  {pct !== null ? <b className="font-semibold text-[var(--acc)]">{pct}%</b> : null}
                </span>
                <span className="mt-1 block h-[4px] rounded-full bg-[var(--linha)]">
                  <span className="block h-full rounded-full bg-[var(--acc)]" style={{ width: `${pct ?? 2}%` }} />
                </span>
                {proprio ? (
                  <Link href={`/livro/${l.id}/progresso`} className="mt-2 inline-flex min-h-9 items-center text-[12px] font-semibold text-[var(--acc)] hover:underline">
                    registrar leitura
                  </Link>
                ) : null}
              </span>
            </li>
          );
        })}
      </ul>
    </Secao>
  );
}

function UltimasLeituras({ lidos, href }: { lidos: LivroSalvo[]; href: string }) {
  if (!lidos.length) return null;
  return (
    <Secao id="t-ultimas" nome="últimas leituras" acao={<Link href={href} className={linkSecao}>acervo completo</Link>}>
      <ul className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-6 sm:overflow-visible sm:px-0">
        {lidos.slice(0, 6).map((l) => (
          <li key={l.id} className="w-[26%] min-w-[88px] flex-none snap-start sm:w-auto sm:min-w-0">
            <Link href={`/livro/${l.id}`} className="block">
              <CapaAuto livro={l} className="w-full [&>span:last-child]:hidden" />
              <span className="mt-1.5 block text-[11px] text-[var(--acc)]" aria-label={l.nota ? `nota ${l.nota}` : "sem nota"}>
                {l.nota ? estrelas(l.nota) : ""}
              </span>
              {l.lidoEm ? (
                <span className="block text-[10px] text-[var(--suave)]">
                  {new Date(l.lidoEm).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </Secao>
  );
}

function ResenhaEmDestaque({ p, proprio, base }: { p: Perfil; proprio: boolean; base: string }) {
  const comTexto = p.livros.filter((l) => l.resenha?.trim());
  const fixada = p.resenhaFixada ? comTexto.find((l) => l.id === p.resenhaFixada) : undefined;
  const l = fixada ?? [...comTexto].sort((a, b) => (b.lidoEm ?? "").localeCompare(a.lidoEm ?? ""))[0];
  const [aberta, setAberta] = useState(false);
  if (!l) return null;
  return (
    <Secao
      id="t-resenha"
      nome={fixada ? "resenha em destaque" : "resenha recente"}
      acao={<Link href={proprio ? "/perfil?aba=resenhas" : `${base}?aba=resenhas`} className={linkSecao}>{proprio && !fixada ? "fixar uma" : "todas"}</Link>}
    >
      <article className="flex gap-5">
        <Link href={`/livro/${l.id}`} className="w-[72px] flex-none sm:w-[88px]">
          <CapaAuto livro={l} className="w-full [&>span:last-child]:hidden" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/livro/${l.id}`} className="font-revista text-[20px] leading-tight text-[var(--tinta)] hover:text-[var(--acc)]">
            {l.titulo}
          </Link>
          <p className="mt-0.5 text-[12px] text-[var(--suave)]">
            {l.autor}
            {l.nota ? <span className="ml-2 text-[var(--acc)]">{estrelas(l.nota)}</span> : null}
          </p>
          <p className={`mt-3 text-[15px] leading-[1.65] whitespace-pre-line text-[var(--tinta)] ${aberta ? "" : "line-clamp-4"}`}>{l.resenha}</p>
          {(l.resenha?.length ?? 0) > 260 ? (
            <button type="button" onClick={() => setAberta((v) => !v)} aria-expanded={aberta} className="mt-1.5 min-h-9 text-[13px] font-semibold text-[var(--acc)] hover:underline">
              {aberta ? "recolher" : "continuar lendo"}
            </button>
          ) : null}
        </div>
      </article>
    </Secao>
  );
}

function Preferencias({ p, proprio }: { p: Perfil; proprio: boolean }) {
  const declaradas = (p.gostos ?? []).filter(Boolean);
  const conta = new Map<string, number>();
  for (const l of p.livros.filter((x) => x.status === "lido" && !generoGenerico(x.genero))) {
    const g = traduzirGenero(l.genero);
    if (g) conta.set(g, (conta.get(g) ?? 0) + 1);
  }
  const lidos = [...conta.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g)
    .filter((g) => !declaradas.some((d) => d.toLowerCase() === g))
    .slice(0, 5);
  if (!declaradas.length && !lidos.length && !proprio) return null;
  const etiqueta = "inline-flex min-h-8 items-center rounded-full border border-[var(--linha)] px-3 text-[13px] text-[var(--tinta)]";
  return (
    <Secao id="t-pref" nome="preferências literárias" acao={proprio ? <Link href="/perfil/editar" className={linkSecao}>editar</Link> : undefined}>
      {declaradas.length ? (
        <>
          <p className="mb-2 text-[11px] text-[var(--suave)]">{proprio ? "você escolheu" : "escolhidas"}</p>
          <ul className="flex flex-wrap gap-2">
            {declaradas.map((g) => (
              <li key={g} className={etiqueta} style={suave(8)}>
                {g}
              </li>
            ))}
          </ul>
        </>
      ) : proprio ? (
        <Convite href="/perfil/editar" texto="conte o que você gosta de ler" />
      ) : null}
      {lidos.length ? (
        <>
          <p className="mt-4 mb-2 text-[11px] text-[var(--suave)]">pelo que {proprio ? "você lê" : "lê"}</p>
          <ul className="flex flex-wrap gap-2">
            {lidos.map((g) => (
              <li key={g} className={etiqueta}>
                {g}
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </Secao>
  );
}

function Afinidade({ match, favoritosDela }: { match: Match; favoritosDela: LivroSalvo[] }) {
  const meus = usePerfil((s) => s.favoritos);
  const meusLivros = usePerfil((s) => s.livros);
  const chave = (l: { titulo: string }) => l.titulo.toLowerCase().trim();
  const meusFav = new Set((meus ?? []).map((id) => meusLivros.find((l) => l.id === id)).filter((l): l is LivroSalvo => !!l).map(chave));
  const favEmComum = favoritosDela.filter((l) => meusFav.has(chave(l)));
  // só mostra a porcentagem quando há dados suficientes para comparar
  const suficiente = match.emComum.length >= 3 || (match.emComum.length >= 1 && match.generos.length >= 2);
  const temAlgo = match.emComum.length || match.generos.length || match.autorias.length || favEmComum.length;
  return (
    <section aria-labelledby="t-afinidade" className="rounded-[10px] px-5 py-5" style={suave(8)}>
      <h2 id="t-afinidade" className={titulo}>
        afinidade literária
      </h2>
      {!temAlgo ? (
        <p className="mt-3 text-[14px] text-[var(--suave)]">ainda não há leituras suficientes para comparar vocês duas.</p>
      ) : (
        <>
          {suficiente ? (
            <p className="mt-3 flex items-baseline gap-2">
              <span className="font-revista text-[44px] leading-none text-[var(--acc)] tabular-nums">{match.pontos}%</span>
              <span className="text-[13px] text-[var(--suave)]">de afinidade</span>
            </p>
          ) : null}
          <ul className="mt-3 space-y-1 text-[14px] text-[var(--tinta)]">
            {match.emComum.length ? <li>{match.emComum.length} {match.emComum.length === 1 ? "livro lido em comum" : "livros lidos em comum"}</li> : null}
            {favEmComum.length ? <li>{favEmComum.length} {favEmComum.length === 1 ? "favorito em comum" : "favoritos em comum"}</li> : null}
            {match.concordam ? <li>{match.concordam} com notas quase iguais</li> : null}
            {match.generos.length ? <li>gêneros em comum: {match.generos.slice(0, 3).join(", ")}</li> : null}
            {match.autorias.length ? <li>autorias em comum: {match.autorias.slice(0, 3).join(", ")}</li> : null}
          </ul>
          {match.amaram.length ? (
            <>
              <p className="mt-4 text-[12px] text-[var(--suave)]">vocês duas gostaram de</p>
              <ul className="mt-2 flex gap-2 overflow-x-auto [scrollbar-width:none]">
                {match.amaram.slice(0, 6).map((l) => (
                  <li key={l.id} className="w-[48px] flex-none">
                    <Link href={`/livro/${l.id}`} title={l.titulo}>
                      <CapaAuto livro={l} className="w-full [&>span:last-child]:hidden" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {suficiente ? (
            <p className="mt-4 text-[11px] leading-snug text-[var(--suave)]">
              calculada por livros em comum e notas parecidas, autorias, gêneros e indicações cruzadas.
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}

function Clubes() {
  const consulta = useConsulta(() => meusClubes().catch(() => []), []);
  const clubes = consulta.dados ?? [];
  if (!clubes.length) return null;
  return (
    <Secao id="t-clubes" nome="clubes de leitura">
      <ul className="space-y-3">
        {clubes.slice(0, 5).map((c) => (
          <li key={c.id}>
            <Link href={`/clubes/${c.id}`} className="flex items-center gap-3 hover:opacity-85">
              {c.foto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.foto} alt="" className="size-10 flex-none rounded-full object-cover" />
              ) : (
                <span className="flex size-10 flex-none items-center justify-center rounded-full font-revista text-[16px] text-[var(--acc)] italic" style={suave(12)}>
                  {c.nome.charAt(0).toLowerCase()}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-semibold text-[var(--tinta)]">{c.nome}</span>
                <span className="block truncate text-[12px] text-[var(--suave)]">
                  {c.lendo ? `lendo ${c.lendo.livro.titulo}` : `${c.membros.length} pessoas`}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Secao>
  );
}

function Atividade({ pessoaId, proprio }: { pessoaId: string | null; proprio: boolean }) {
  const consulta = useConsulta(async () => {
    if (!pessoaId) return [];
    const a = await atividadesDe(pessoaId, 4);
    lembrarLivros(a.map((x) => x.livro));
    return a;
  }, [pessoaId]);
  const lista = consulta.dados ?? [];
  if (!lista.length) return null;
  return (
    <Secao id="t-atividade" nome="atividade recente" acao={proprio ? <Link href="/atividade" className={linkSecao}>ver mais</Link> : undefined}>
      <ol>
        {lista.map((a) => (
          <li key={a.id} className="flex items-baseline gap-3 border-b border-[var(--linha)] py-2.5 text-[14px] last:border-b-0">
            <span className="w-[72px] flex-none text-[11px] text-[var(--suave)]">{quandoFoi(a.criado_em)}</span>
            <span className="min-w-0 text-[var(--tinta)]">
              {verbo[a.tipo]}{" "}
              {a.livro.id.startsWith("encontro-") ? null : (
                <Link href={`/livro/${a.livro.id}`} className="font-revista italic hover:text-[var(--acc)]">
                  {a.livro.titulo}
                </Link>
              )}
              {a.nota ? <span className="ml-1.5 text-[12px] text-[var(--acc)]">{estrelas(Number(a.nota))}</span> : null}
            </span>
          </li>
        ))}
      </ol>
    </Secao>
  );
}

/** escolher a citação do perfil entre os trechos já salvos (nada inventado) */
function EscolherCitacao({ onFechar }: { onFechar: () => void }) {
  const livros = usePerfil((s) => s.livros);
  const atualizar = usePerfil((s) => s.atualizar);
  const opcoes = livros.flatMap((l) => [
    ...(l.citacao?.trim() ? [{ texto: l.citacao.trim(), livro: l.titulo, autor: l.autor, livroId: l.id }] : []),
    ...(l.trechos ?? []).filter((t) => t.texto?.trim()).map((t) => ({ texto: t.texto.trim(), livro: l.titulo, autor: l.autor, livroId: l.id })),
  ]);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="escolher citação"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#2b1420]/45 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onFechar();
      }}
    >
      <div className="max-h-[85dvh] w-full max-w-[560px] overflow-y-auto rounded-t-[18px] bg-[var(--papel,#F9F5EE)] px-5 pt-5 pb-8 sm:rounded-[14px]">
        <div className="flex items-baseline justify-between">
          <p className="font-revista text-[22px] text-[var(--acc)] italic">sua citação favorita</p>
          <button type="button" onClick={onFechar} className="min-h-10 text-[13px] font-semibold text-[var(--suave)]">
            fechar
          </button>
        </div>
        {!opcoes.length ? (
          <p className="mt-4 text-[14px] text-[var(--suave)]">
            você ainda não salvou trechos. marque um trecho na ficha de um livro (ou importe os destaques do Kindle) e ele aparece aqui.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--linha)]">
            {opcoes.slice(0, 80).map((o, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    atualizar({ citacaoPerfil: o });
                    onFechar();
                  }}
                  className="block w-full py-3 text-left hover:opacity-80"
                >
                  <span className="line-clamp-3 font-revista text-[15px] text-[var(--tinta)] italic">“{o.texto}”</span>
                  <span className="mt-1 block text-[12px] text-[var(--suave)]">
                    {o.autor} · {o.livro}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="button" onClick={() => { atualizar({ citacaoPerfil: null }); onFechar(); }} className="mt-4 min-h-10 text-[13px] text-[var(--suave)] hover:text-[var(--acc)]">
          tirar a citação do perfil
        </button>
      </div>
    </div>
  );
}

// ───────── a página ─────────

export function PerfilEditorial({
  p,
  proprio,
  pessoaId,
  numeros,
  acoesDela,
  match,
  aba,
  onAba,
  conteudoAba,
}: {
  p: Perfil;
  proprio: boolean;
  /** id da pessoa (para a atividade) */
  pessoaId: string | null;
  numeros: { seguidores: number; seguindo: number } | null;
  /** no perfil de outra pessoa: seguir etc. */
  acoesDela?: ReactNode;
  match?: Match | null;
  aba: AbaDoPerfil;
  onAba: (a: AbaDoPerfil) => void;
  /** conteúdo das abas jornada, resenhas e estantes */
  conteudoAba: Partial<Record<Exclude<AbaDoPerfil, "geral">, ReactNode>>;
}) {
  const [escolhendo, setEscolhendo] = useState(false);
  const [aviso, setAviso] = useState("");
  const base = `/u/${p.usuario}`;
  const nome = p.nome || p.usuario || "leitora";
  const arquetipo = p.bookside ? arquetipos[p.bookside.principal as ArquetipoId] : null;
  const favoritos = (p.favoritos ?? []).map((id) => p.livros.find((l) => l.id === id)).filter((l): l is LivroSalvo => !!l).slice(0, 6);
  const lendo = p.livros.filter((l) => !l.status || l.status === "lendo");
  const lidos = p.livros.filter((l) => l.status === "lido").sort(porDataDeLeitura);
  const geral = aba === "geral";

  async function compartilhar() {
    const url = `${window.location.origin}${base}`;
    try {
      if (navigator.share) await navigator.share({ title: `${nome} no the bookside`, url });
      else {
        await navigator.clipboard.writeText(url);
        setAviso("link do perfil copiado");
        setTimeout(() => setAviso(""), 2400);
      }
    } catch {
      /* cancelou */
    }
  }

  const botao = "inline-flex min-h-11 items-center rounded-full px-5 text-[14px] font-semibold";
  const acoes = proprio ? (
    <div className="flex items-center gap-2">
      <Link href="/perfil/editar" className={`${botao} bg-[var(--acc)] text-[var(--papel)]`}>
        editar perfil
      </Link>
      <MenuMais
        itens={[
          { nome: "personalizar (cores e capa)", href: "/perfil/editar" },
          { nome: "livros favoritos", href: "/perfil/favoritos" },
          { nome: p.citacaoPerfil ? "trocar citação" : "adicionar citação", onClick: () => setEscolhendo(true) },
          { nome: "compartilhar perfil", onClick: compartilhar },
          { nome: "configurações", href: "/perfil/configuracoes" },
        ]}
      />
    </div>
  ) : (
    <div className="flex items-center gap-2">
      {acoesDela}
      <button type="button" onClick={compartilhar} aria-label="compartilhar perfil" className="grid size-11 place-items-center rounded-full border border-[var(--linha)] text-[var(--acc)] hover:border-[var(--acc)]">
        <svg aria-hidden width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="min-h-dvh bg-[var(--papel)] pb-12 text-[var(--tinta)]">
      <div className="mx-auto w-full max-w-[1240px] lg:px-12">
        {geral ? (
          <header>
            <Banner p={p} />
            <div className="px-5 lg:px-2">
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div className="-mt-12 lg:-mt-16">
                  <span className="lg:hidden">
                    <Foto p={p} tamanho={96} />
                  </span>
                  <span className="hidden lg:block">
                    <Foto p={p} tamanho={128} />
                  </span>
                </div>
                <div className="order-last w-full sm:order-none sm:w-auto">{acoes}</div>
              </div>
              <div className="mt-3 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-10">
                <div className="min-w-0">
                  <h1 className="font-revista text-[30px] leading-[1.05] text-[var(--acc)] lg:text-[42px]">{nome}</h1>
                  <p className="mt-1 text-[13px] text-[var(--suave)]">
                    @{p.usuario}
                    {arquetipo ? (
                      <>
                        {" · "}
                        <Link href={proprio ? "/teste/resultado" : "/teste"} className="hover:text-[var(--acc)]">
                          {arquetipo.nome}
                        </Link>
                      </>
                    ) : null}
                  </p>
                  {p.frase ? (
                    <p className="mt-2 max-w-[56ch] text-[15px] leading-relaxed text-[var(--tinta)]">{p.frase}</p>
                  ) : proprio ? (
                    <Convite href="/perfil/editar" texto="escreva um pouco sobre você" />
                  ) : null}
                </div>
                <div className="mt-4 lg:mt-0">
                  <Numeros p={p} numeros={numeros} base={base} />
                </div>
              </div>
            </div>
          </header>
        ) : (
          <header className="flex items-center gap-3 px-5 pt-4 pb-2 lg:px-2 lg:pt-8">
            <Foto p={p} tamanho={44} />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-revista text-[22px] leading-tight text-[var(--acc)]">{nome}</span>
              <span className="block text-[12px] text-[var(--suave)]">@{p.usuario}</span>
            </span>
            {proprio ? null : acoesDela}
          </header>
        )}

        {/* abas: linha discreta embaixo da selecionada; presas no topo ao rolar */}
        <div className="sticky top-0 z-20 mt-5 border-b border-[var(--linha)] bg-[var(--papel)]">
          <nav role="tablist" aria-label="seções do perfil" className="flex gap-6 overflow-x-auto px-5 [scrollbar-width:none] lg:gap-8 lg:px-2 [&::-webkit-scrollbar]:hidden">
            {ABAS.map((a) => (
              <button
                key={a.id}
                role="tab"
                type="button"
                aria-selected={aba === a.id}
                onClick={() => onAba(a.id)}
                className={`flex min-h-12 flex-none items-center border-b-2 text-[15px] whitespace-nowrap ${
                  aba === a.id ? "border-[var(--acc)] font-semibold text-[var(--acc)]" : "border-transparent text-[var(--suave)] hover:text-[var(--tinta)]"
                }`}
              >
                {a.nome}
              </button>
            ))}
          </nav>
        </div>

        {geral ? (
          <div className="grid gap-9 px-5 pt-7 lg:grid-cols-[minmax(0,1.85fr)_minmax(280px,1fr)] lg:gap-14 lg:px-2 lg:pt-9">
            <div className="min-w-0 space-y-9 lg:space-y-11">
              <LivrosFavoritos favoritos={favoritos} proprio={proprio} />
              {/* no celular, afinidade e citação vêm logo depois dos favoritos */}
              {!proprio && match ? (
                <div className="lg:hidden">
                  <Afinidade match={match} favoritosDela={favoritos} />
                </div>
              ) : null}
              <div className="lg:hidden">
                <Citacao p={p} proprio={proprio} onEscolher={() => setEscolhendo(true)} />
              </div>
              <LendoAgora lendo={lendo} proprio={proprio} />
              <UltimasLeituras lidos={lidos} href={proprio ? "/estantes/lidos" : `${base}/estantes/lidos`} />
              <ResenhaEmDestaque p={p} proprio={proprio} base={base} />
              <div className="lg:hidden">
                <Preferencias p={p} proprio={proprio} />
              </div>
              {proprio ? (
                <div className="lg:hidden">
                  <Clubes />
                </div>
              ) : null}
              <Atividade pessoaId={pessoaId} proprio={proprio} />
            </div>
            <aside className="hidden min-w-0 space-y-10 lg:block">
              <Citacao p={p} proprio={proprio} onEscolher={() => setEscolhendo(true)} />
              <Preferencias p={p} proprio={proprio} />
              {!proprio && match ? <Afinidade match={match} favoritosDela={favoritos} /> : null}
              {proprio ? <Clubes /> : null}
            </aside>
          </div>
        ) : (
          <div className="px-5 pt-6 lg:px-2 lg:pt-8">{conteudoAba[aba]}</div>
        )}
      </div>

      {escolhendo ? <EscolherCitacao onFechar={() => setEscolhendo(false)} /> : null}
      {aviso ? (
        <p role="status" className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[var(--tinta)] px-4 py-2 text-[13px] text-[var(--papel)] lg:bottom-8">
          {aviso}
        </p>
      ) : null}
    </div>
  );
}
