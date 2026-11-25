"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { AvisoRemovido } from "@/components/AvisoRemovido";
import { useHidratado } from "@/components/PerfilHidratacao";
import { LendoJunto } from "@/components/social/LendoJunto";
import {
  BarraDaBiblioteca,
  FilaDaPrateleira,
  GradeDeLivros,
  ICONE_MAIS,
  Icone,
  LinhaDaEstante,
  ListaDeLivros,
  MenuDeAcoes,
  NOME_STATUS,
  filtrarLivros,
  progressoDe,
  statusDe,
  useFaceSalva,
  useVistaSalva,
  type AcaoDoMenu,
  type Escopo,
  type FiltroStatus,
  type LinhaEstante,
  type Ordem,
} from "@/components/estantes/Biblioteca";
import { livrosDaEstante, todasAsEstantes, type EstanteInfo } from "@/lib/estantes";
import { usePerfil, type LivroSalvo, type StatusLivro } from "@/lib/perfil-store";

const ORDEM_STATUS: StatusLivro[] = ["lendo", "lido", "quero", "pausado", "abandonado"];
const LIMITE_FAVORITOS = 4;
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;
const agora = () => new Date().toISOString();

// ───────── cabeçalho e indicadores ─────────

function Indicadores({ livros }: { livros: LivroSalvo[] }) {
  const conta = new Map<StatusLivro, number>();
  for (const l of livros) conta.set(statusDe(l), (conta.get(statusDe(l)) ?? 0) + 1);
  const itens = [
    { nome: "livros", qtd: livros.length },
    ...ORDEM_STATUS.filter((s) => s === "lendo" || s === "lido" || s === "quero" || conta.get(s)).map((s) => ({
      nome: s === "lido" ? "lidos" : s === "pausado" ? "pausados" : s === "abandonado" ? "abandonados" : NOME_STATUS[s],
      qtd: conta.get(s) ?? 0,
    })),
  ];
  return (
    <dl className="grid grid-cols-4 border-y border-linha py-4 sm:flex sm:justify-around lg:border-fio">
      {itens.map((x, i) => (
        <div key={x.nome} className={`text-center sm:flex-1 ${i ? "sm:border-l sm:border-linha lg:border-fio" : ""} ${i > 3 ? "hidden sm:block" : ""}`}>
          <dt className="order-2 text-[11px] text-tinta-suave sm:text-[13px]">{x.nome}</dt>
          <dd className="font-revista text-[24px] leading-none text-bordo tabular-nums sm:text-[30px]">
            {String(x.qtd).padStart(2, "0")}
          </dd>
        </div>
      ))}
    </dl>
  );
}

// ───────── janelinha para renomear / confirmar ─────────

function Janela({ titulo, children, onFechar }: { titulo: string; children: ReactNode; onFechar: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      className="fixed inset-0 z-50 grid place-items-center bg-ameixa/40 px-6"
      onKeyDown={(e) => {
        if (e.key === "Escape") onFechar();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
    >
      <div className="w-full max-w-[380px] rounded-[12px] border border-linha bg-papel p-5">
        <h2 className="font-revista text-[22px] text-bordo italic">{titulo}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

type Pendente =
  | { tipo: "renomear"; id: string; nome: string }
  | { tipo: "apagar"; id: string; nome: string }
  | { tipo: "remover-livro"; livro: LivroSalvo };

// ───────── página ─────────

export default function EstantesPage() {
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  const proprias = usePerfil((s) => s.estantesProprias);
  const idsFavoritos = usePerfil((s) => s.favoritos);
  const atualizar = usePerfil((s) => s.atualizar);
  const editarLivro = usePerfil((s) => s.editarLivro);
  const removerLivro = usePerfil((s) => s.removerLivro);

  const [vista, setVista] = useVistaSalva();
  const [face, setFace] = useFaceSalva();
  const [escopo, setEscopo] = useState<Escopo>("estantes");
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<FiltroStatus>("todos");
  const [ordem, setOrdem] = useState<Ordem>("personalizada");
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const [texto, setTexto] = useState("");

  const estantes = useMemo(() => todasAsEstantes(proprias ?? []), [proprias]);
  const minhas = estantes.filter((e) => e.propria);
  const favoritos = (idsFavoritos ?? [])
    .map((id) => livros.find((l) => l.id === id))
    .filter((l): l is LivroSalvo => l !== undefined);
  const filtro = { busca, status, ordem };
  const filtrando = !!busca.trim() || status !== "todos";
  const statusDisponiveis = ORDEM_STATUS.filter((s) => livros.some((l) => statusDe(l) === s));

  if (!hidratado) return <AppShell aba="estantes">{null}</AppShell>;

  // ── ações (as mesmas que o app já oferece) ──
  const base = (l: LivroSalvo) => ({ id: l.id, titulo: l.titulo, autor: l.autor, capa: l.capa, genero: l.genero });
  const mudarStatus = (l: LivroSalvo, s: StatusLivro) =>
    editarLivro(base(l), {
      status: s,
      ...(s === "lendo" && !l.iniciadoEm ? { iniciadoEm: agora() } : {}),
      ...(s === "lido" && !l.lidoEm ? { lidoEm: agora() } : {}),
      ...(s === "pausado" || s === "abandonado" ? { paradoEm: agora() } : {}),
    });
  const alternarNaEstante = (l: LivroSalvo, id: string) => {
    const atuais = l.estantes ?? [];
    editarLivro(base(l), { estantes: atuais.includes(id) ? atuais.filter((x) => x !== id) : [...atuais, id] });
  };
  const alternarFavorito = (l: LivroSalvo) => {
    const ids = idsFavoritos ?? [];
    atualizar({ favoritos: ids.includes(l.id) ? ids.filter((x) => x !== l.id) : [...ids, l.id] });
  };
  const acoesDoLivro = (l: LivroSalvo): AcaoDoMenu[] => {
    const fav = (idsFavoritos ?? []).includes(l.id);
    return [
      { tipo: "link", nome: "abrir ficha", href: `/livro/${l.id}` },
      ...(statusDe(l) === "lendo"
        ? [{ tipo: "link" as const, nome: "atualizar progresso", href: `/livro/${l.id}/progresso` }]
        : []),
      ...(statusDe(l) === "lido" ? [{ tipo: "link" as const, nome: "avaliar", href: `/livro/${l.id}/avaliar` }] : []),
      ...ORDEM_STATUS.filter((s) => s !== statusDe(l)).map((s) => ({
        tipo: "botao" as const,
        nome: `mover para ${s === "lido" ? "lidos" : NOME_STATUS[s]}`,
        onClick: () => mudarStatus(l, s),
      })),
      ...minhas.map((e) => ({
        tipo: "botao" as const,
        nome: `${l.estantes?.includes(e.id) ? "tirar de" : "pôr em"} “${e.nome}”`,
        onClick: () => alternarNaEstante(l, e.id),
      })),
      ...(fav || (idsFavoritos ?? []).length < LIMITE_FAVORITOS
        ? [{ tipo: "botao" as const, nome: fav ? "tirar dos favoritos" : "favoritar", onClick: () => alternarFavorito(l) }]
        : []),
      { tipo: "botao", nome: "remover da biblioteca", perigo: true, onClick: () => setPendente({ tipo: "remover-livro", livro: l }) },
    ];
  };
  const estantesDoLivro = (l: LivroSalvo) =>
    minhas.filter((e) => l.estantes?.includes(e.id)).map((e) => e.nome);

  const menuDaEstante = (e: EstanteInfo | null, id: string, nome: string): ReactNode => {
    const acoes: AcaoDoMenu[] =
      id === "favoritos"
        ? [{ tipo: "link", nome: "escolher favoritos", href: "/perfil/favoritos" }]
        : [
            { tipo: "link", nome: "abrir estante", href: `/estantes/${id}` },
            { tipo: "link", nome: "adicionar livro", href: `/buscar?estante=${id}` },
            ...(e?.propria
              ? [
                  { tipo: "botao" as const, nome: "renomear", onClick: () => { setTexto(nome); setPendente({ tipo: "renomear", id, nome }); } },
                  {
                    tipo: "botao" as const,
                    nome: e.propria.publica ? "deixar privada" : "deixar pública",
                    onClick: () =>
                      atualizar({
                        estantesProprias: (proprias ?? []).map((p) => (p.id === id ? { ...p, publica: !p.publica } : p)),
                      }),
                  },
                  { tipo: "botao" as const, nome: "apagar estante", perigo: true, onClick: () => setPendente({ tipo: "apagar", id, nome }) },
                ]
              : []),
          ];
    return <MenuDeAcoes rotulo={`gerenciar ${nome}`} acoes={acoes} />;
  };

  const confirmar = () => {
    if (!pendente) return;
    if (pendente.tipo === "renomear" && texto.trim()) {
      atualizar({
        estantesProprias: (proprias ?? []).map((p) => (p.id === pendente.id ? { ...p, nome: texto.trim() } : p)),
      });
    }
    if (pendente.tipo === "apagar") {
      // a estante some; os livros continuam na biblioteca
      atualizar({
        estantesProprias: (proprias ?? []).filter((p) => p.id !== pendente.id),
        livros: livros.map((l) =>
          l.estantes?.includes(pendente.id)
            ? { ...l, estantes: l.estantes.filter((x) => x !== pendente.id), atualizadoEm: agora() }
            : l,
        ),
      });
    }
    if (pendente.tipo === "remover-livro") removerLivro(pendente.livro.id);
    setPendente(null);
  };

  // ── as linhas da estante (só dados reais) ──
  const ano = new Date().getFullYear();
  const linhas: LinhaEstante[] = [];
  const fixa = (id: string) => estantes.find((e) => e.id === id)!;
  const daFixa = (id: string) => livrosDaEstante(fixa(id), livros);

  const lendo = daFixa("lendo");
  const comProgresso = lendo.map(progressoDe).filter((p): p is number => p !== null);
  const media = comProgresso.length ? comProgresso.reduce((t, p) => t + p, 0) / comProgresso.length : null;
  linhas.push({
    id: "lendo",
    nome: "lendo agora",
    livros: lendo,
    link: "/estantes/lendo",
    vazio: "nenhuma leitura em andamento.",
    lateral: lendo.length ? (
      <div>
        <span className="block text-[11px] text-cinza">em andamento</span>
        <span className="font-revista text-[20px] text-bordo">{plural(lendo.length, "leitura", "leituras")}</span>
        {media !== null ? (
          <span className="mt-1.5 block h-[5px] max-w-[140px] rounded-full bg-linha" aria-label={`progresso médio ${Math.round(media * 100)}%`}>
            <span className="block h-full rounded-full bg-bordo" style={{ width: `${Math.round(media * 100)}%` }} />
          </span>
        ) : null}
        <Link
          href={lendo.length === 1 ? `/livro/${lendo[0].id}/progresso` : `/estantes/lendo`}
          className="mt-2 inline-block text-[12px] font-semibold text-bordo hover:underline"
        >
          atualizar progresso
        </Link>
      </div>
    ) : null,
  });

  linhas.push({
    id: "favoritos",
    nome: "meus favoritos",
    livros: favoritos,
    link: "/perfil/favoritos",
    vazio: `escolha até ${LIMITE_FAVORITOS} livros para o destaque do seu perfil.`,
    lateral: (
      <div>
        <span className="block text-[11px] text-cinza">em destaque no perfil</span>
        <Link href="/perfil/favoritos" className="text-[12px] font-semibold text-bordo hover:underline">
          {favoritos.length ? "trocar favoritos" : "escolher favoritos"}
        </Link>
      </div>
    ),
  });

  const lidos = daFixa("lidos");
  const lidosNoAno = lidos.filter((l) => l.lidoEm?.startsWith(String(ano))).length;
  linhas.push({
    id: "lidos",
    nome: "lidos",
    livros: lidos,
    link: "/estantes/lidos",
    vazio: "os livros que você terminar aparecem aqui.",
    lateral: lidos.length ? (
      <div>
        <span className="block text-[11px] text-cinza">em {ano}</span>
        <span className="font-revista text-[20px] text-bordo">{plural(lidosNoAno, "livro lido", "livros lidos")}</span>
      </div>
    ) : null,
  });

  const quero = daFixa("quero-ler");
  linhas.push({
    id: "quero-ler",
    nome: "quero ler",
    livros: quero,
    link: "/estantes/quero-ler",
    vazio: "guarde aqui o que você quer ler depois.",
    lateral: quero.length ? (
      <div>
        <span className="block text-[11px] text-cinza">na fila</span>
        <span className="font-revista text-[20px] text-bordo">{plural(quero.length, "livro", "livros")}</span>
      </div>
    ) : null,
  });

  for (const id of ["pausados", "abandonados"]) {
    const lista = daFixa(id);
    if (!lista.length) continue;
    linhas.push({ id, nome: fixa(id).nome, livros: lista, link: `/estantes/${id}` });
  }

  for (const e of minhas) {
    const lista = livrosDaEstante(e, livros);
    const criada = e.propria?.criadaEm
      ? new Date(e.propria.criadaEm).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
      : null;
    linhas.push({
      id: e.id,
      nome: e.nome,
      livros: lista,
      link: `/estantes/${e.id}`,
      vazio: (
        <Link href={`/buscar?estante=${e.id}`} className="not-italic text-bordo hover:underline">
          + adicionar o primeiro livro
        </Link>
      ),
      lateral: (
        <div>
          <span className="flex items-center gap-1.5 text-[11px] text-cinza">
            <span aria-hidden className="size-2 rounded-full" style={{ background: e.propria?.cor }} />
            {e.propria?.publica ? "pública" : "privada"}
          </span>
          {criada ? <span className="block text-[12px]">criada em {criada}</span> : null}
        </div>
      ),
    });
  }

  // filtros valem para as três vistas; com busca/filtro, linhas vazias somem
  const linhasFiltradas = linhas
    .map((l) => ({
      ...l,
      menu: menuDaEstante(estantes.find((e) => e.id === l.id) ?? null, l.id, l.nome),
      livros: filtrarLivros(l.livros, filtro),
    }))
    .filter((l) => !filtrando || l.livros.length);
  // "personalizado" em todos os livros = ordem em que entraram na biblioteca
  const todosFiltrados = filtrarLivros(
    ordem === "personalizada"
      ? [...livros].sort((a, b) => (b.adicionadoEm ?? "").localeCompare(a.adicionadoEm ?? ""))
      : livros,
    filtro,
  );

  const nada = (
    <p className="py-12 text-center font-accent text-[15px] text-cinza italic">
      nenhum livro encontrado{busca.trim() ? ` para “${busca.trim()}”` : ""}.
    </p>
  );

  // em "todos os livros", a estante vira andares de 10 livros
  const andares: LivroSalvo[][] = [];
  for (let i = 0; i < todosFiltrados.length; i += 10) andares.push(todosFiltrados.slice(i, i + 10));

  return (
    <AppShell aba="estantes">
      <AvisoRemovido />
      <div className="mx-auto w-full max-w-[1240px] px-5 pt-4 pb-16 text-ameixa sm:px-8 lg:px-14 lg:pt-12">
        {/* cabeçalho editorial */}
        <header className="flex flex-wrap items-end justify-between gap-4 pb-6">
          <div>
            <p className="text-[11px] font-bold tracking-[.14em] text-bordo">the bookside / biblioteca pessoal</p>
            <h1 className="mt-2 font-revista text-[38px] leading-none text-bordo italic sm:text-[52px]">minhas estantes.</h1>
            <p className="mt-2 text-[14px] text-tinta-suave sm:text-[15px]">histórias vividas e tantas outras por descobrir.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/estantes/importar" className="text-[13px] text-cinza underline decoration-bege underline-offset-4 hover:text-bordo">
              importar lista
            </Link>
            <Link
              href="/estantes/nova"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-bordo px-5 text-[14px] font-semibold text-creme hover:bg-bordo/90"
            >
              <Icone d={ICONE_MAIS} />
              nova estante
            </Link>
          </div>
        </header>

        {livros.length ? <Indicadores livros={livros} /> : null}

        <LendoJunto />

        {livros.length === 0 ? (
          <div className="border-b border-linha py-14 text-center lg:border-fio">
            <h2 className="font-revista text-[28px] text-bordo italic">sua biblioteca ainda está em branco.</h2>
            <p className="mt-2 text-[14px] text-tinta-suave">adicione o primeiro livro que você está lendo ou quer ler.</p>
            <Link href="/buscar" className="mt-5 inline-flex h-11 items-center rounded-full bg-bordo px-6 text-[14px] font-semibold text-creme">
              buscar um livro
            </Link>
          </div>
        ) : (
          <>
            <BarraDaBiblioteca
              escopo={escopo}
              onEscopo={setEscopo}
              busca={busca}
              onBusca={setBusca}
              status={status}
              onStatus={setStatus}
              statusDisponiveis={statusDisponiveis}
              ordem={ordem}
              onOrdem={setOrdem}
              vista={vista}
              onVista={setVista}
              face={face}
              onFace={setFace}
            />

            {escopo === "estantes" ? (
              !linhasFiltradas.length ? (
                nada
              ) : vista === "estante" ? (
                <div className="border-t border-linha lg:border-fio">
                  {linhasFiltradas.map((l) => (
                    <LinhaDaEstante key={l.id} linha={l} destaque={l.id === "favoritos"} face={face} />
                  ))}
                </div>
              ) : (
                <div className="grid gap-10">
                  {linhasFiltradas.map((l) => (
                    <section key={l.id} aria-label={l.nome}>
                      <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-linha pb-2 lg:border-fio">
                        <h2 className="font-revista text-[24px] text-bordo italic">
                          <Link href={l.link} className="hover:underline">{l.nome}</Link>
                          <span className="ml-2 font-sans text-[12px] text-cinza not-italic">· {l.livros.length}</span>
                        </h2>
                        {l.menu}
                      </div>
                      {!l.livros.length ? (
                        <p className="font-accent text-sm text-cinza italic">{l.vazio ?? "nenhum livro aqui ainda."}</p>
                      ) : vista === "grade" ? (
                        <GradeDeLivros livros={l.livros} />
                      ) : (
                        <ListaDeLivros livros={l.livros} acoesDoLivro={acoesDoLivro} estantesDoLivro={estantesDoLivro} />
                      )}
                    </section>
                  ))}
                </div>
              )
            ) : !todosFiltrados.length ? (
              nada
            ) : vista === "estante" ? (
              <div className="grid gap-8 border-t border-linha pt-8 lg:border-fio">
                <p className="text-[13px] text-tinta-suave">{plural(todosFiltrados.length, "livro", "livros")}</p>
                {andares.map((a, i) => (
                  <FilaDaPrateleira key={i} livros={a} altura={150} face={face} />
                ))}
              </div>
            ) : vista === "grade" ? (
              <GradeDeLivros livros={todosFiltrados} />
            ) : (
              <ListaDeLivros livros={todosFiltrados} acoesDoLivro={acoesDoLivro} estantesDoLivro={estantesDoLivro} />
            )}

            {escopo === "estantes" && !filtrando ? (
              <Link
                href="/estantes/nova"
                className="mt-10 flex flex-col items-center rounded-[12px] border border-dashed border-rosa-antigo px-6 py-7 text-center hover:bg-bordo/[.03]"
              >
                <Icone d={ICONE_MAIS} className="size-6 text-bordo" />
                <span className="mt-2 font-revista text-[22px] text-bordo italic">criar nova estante</span>
                <span className="mt-1 text-[13px] text-tinta-suave">
                  organize seus livros do seu jeito, por temas, gêneros ou como preferir.
                </span>
              </Link>
            ) : null}
          </>
        )}
      </div>

      {pendente ? (
        <Janela
          titulo={
            pendente.tipo === "renomear"
              ? "renomear estante"
              : pendente.tipo === "apagar"
                ? `apagar “${pendente.nome}”?`
                : `remover “${pendente.livro.titulo}”?`
          }
          onFechar={() => setPendente(null)}
        >
          {pendente.tipo === "renomear" ? (
            <input
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmar();
              }}
              aria-label="novo nome da estante"
              className="h-11 w-full rounded-[8px] border border-linha bg-transparent px-3 text-[14px] focus:border-bordo focus:outline-none"
            />
          ) : (
            <p className="text-[14px] text-tinta-suave">
              {pendente.tipo === "apagar"
                ? "a estante some, mas os livros continuam na sua biblioteca."
                : "o livro sai da sua biblioteca, junto com a nota e a ficha dele."}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setPendente(null)} className="h-10 rounded-full px-4 text-[13px] font-semibold text-cinza hover:text-ameixa">
              cancelar
            </button>
            <button
              type="button"
              autoFocus={pendente.tipo !== "renomear"}
              onClick={confirmar}
              className="h-10 rounded-full bg-bordo px-5 text-[13px] font-semibold text-creme"
            >
              {pendente.tipo === "renomear" ? "salvar" : pendente.tipo === "apagar" ? "apagar" : "remover"}
            </button>
          </div>
        </Janela>
      ) : null}
    </AppShell>
  );
}
