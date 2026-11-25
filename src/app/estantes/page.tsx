"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { AppShell } from "@/components/AppShell";
import { AvisoRemovido } from "@/components/AvisoRemovido";
import { useHidratado } from "@/components/PerfilHidratacao";
import { LendoJunto } from "@/components/social/LendoJunto";
import { CapaDoLivro, ICONE_MAIS, Icone, MenuDeAcoes, PrateleiraMadeira, type AcaoDoMenu } from "@/components/estantes/Biblioteca";
import { Janela } from "@/components/estantes/AcoesDoLivro";
import { livrosDaEstante, todasAsEstantes, type EstanteInfo } from "@/lib/estantes";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

type Bloco = { id: string; nome: string; livros: LivroSalvo[]; info?: string; estante?: EstanteInfo };

/** uma estante no índice: mini prateleira com as primeiras capas, nome e quantidade */
function BlocoDaEstante({ b, menu }: { b: Bloco; menu?: ReactNode }) {
  const capas = b.livros.slice(0, 6);
  return (
    <li className="group relative">
      <Link href={`/estantes/${b.id}`} className="block rounded-[10px] px-1 pt-3 pb-2 outline-offset-4">
        <div className="relative">
          <div className="flex h-[104px] items-end gap-2 overflow-hidden px-3">
            {capas.length ? (
              capas.map((l, i) => (
                <span
                  key={l.id}
                  className="flex-none transition-transform duration-300 group-hover:-translate-y-1 motion-reduce:transition-none"
                  style={{ transitionDelay: `${i * 30}ms` }}
                >
                  <CapaDoLivro livro={l} altura={96} />
                </span>
              ))
            ) : (
              <span className="mb-3 font-accent text-[13px] text-cinza italic">ainda sem livros</span>
            )}
          </div>
          <PrateleiraMadeira className="-mt-[5px]" />
        </div>
        <div className="mt-2 flex items-baseline justify-between gap-3 px-1 pr-12">
          <span className="min-w-0">
            <span className="block truncate font-revista text-[22px] leading-tight text-bordo italic decoration-1 underline-offset-4 group-hover:underline">
              {b.nome}
            </span>
            <span className="text-[12px] text-tinta-suave">
              {plural(b.livros.length, "livro", "livros")}
              {b.info ? ` · ${b.info}` : ""}
            </span>
          </span>
        </div>
      </Link>
      {menu ? <div className="absolute top-[140px] right-0">{menu}</div> : null}
    </li>
  );
}

type Pendente = { tipo: "renomear" | "apagar"; id: string; nome: string };

/** /estantes: primeiro escolher o que ver; cada estante abre em /estantes/[id] */
export default function EstantesPage() {
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  const proprias = usePerfil((s) => s.estantesProprias);
  const idsFavoritos = usePerfil((s) => s.favoritos);
  const atualizar = usePerfil((s) => s.atualizar);
  const [pendente, setPendente] = useState<Pendente | null>(null);
  const [texto, setTexto] = useState("");

  if (!hidratado) return <AppShell aba="estantes">{null}</AppShell>;

  const estantes = todasAsEstantes(proprias ?? []);
  const fixa = (id: string) => estantes.find((e) => e.id === id)!;
  const favoritos = (idsFavoritos ?? []).map((id) => livros.find((l) => l.id === id)).filter((l): l is LivroSalvo => !!l);
  const ano = new Date().getFullYear();
  const lidos = livrosDaEstante(fixa("lidos"), livros);

  const blocos: Bloco[] = [
    { id: "lendo", nome: "lendo agora", livros: livrosDaEstante(fixa("lendo"), livros), estante: fixa("lendo") },
    { id: "favoritos", nome: "meus favoritos", livros: favoritos, info: "no seu perfil" },
    {
      id: "lidos",
      nome: "lidos",
      livros: lidos,
      info: `${lidos.filter((l) => l.lidoEm?.startsWith(String(ano))).length} em ${ano}`,
      estante: fixa("lidos"),
    },
    { id: "quero-ler", nome: "quero ler", livros: livrosDaEstante(fixa("quero-ler"), livros), estante: fixa("quero-ler") },
    ...["pausados", "abandonados"]
      .map((id) => ({ id, nome: fixa(id).nome, livros: livrosDaEstante(fixa(id), livros), estante: fixa(id) }))
      .filter((b) => b.livros.length),
    ...estantes
      .filter((e) => e.propria)
      .map((e) => ({
        id: e.id,
        nome: e.nome,
        livros: livrosDaEstante(e, livros),
        info: e.propria?.publica ? "pública" : "privada",
        estante: e,
      })),
    {
      id: "todos",
      nome: "todos os livros",
      livros: [...livros].sort((a, b) => (b.adicionadoEm ?? "").localeCompare(a.adicionadoEm ?? "")),
    },
  ];

  const menuDe = (b: Bloco) => {
    const acoes: AcaoDoMenu[] =
      b.id === "favoritos"
        ? [{ tipo: "link", nome: "escolher favoritos", href: "/perfil/favoritos" }]
        : b.id === "todos"
          ? [{ tipo: "link", nome: "adicionar livro", href: "/buscar" }]
          : [
              { tipo: "link", nome: "adicionar livro", href: `/buscar?estante=${b.id}` },
              ...(b.estante?.propria
                ? [
                    {
                      tipo: "botao" as const,
                      nome: "renomear",
                      onClick: () => {
                        setTexto(b.nome);
                        setPendente({ tipo: "renomear", id: b.id, nome: b.nome });
                      },
                    },
                    {
                      tipo: "botao" as const,
                      nome: b.estante.propria.publica ? "deixar privada" : "deixar pública",
                      onClick: () =>
                        atualizar({
                          estantesProprias: (proprias ?? []).map((p) => (p.id === b.id ? { ...p, publica: !p.publica } : p)),
                        }),
                    },
                    { tipo: "botao" as const, nome: "apagar estante", perigo: true, onClick: () => setPendente({ tipo: "apagar", id: b.id, nome: b.nome }) },
                  ]
                : []),
            ];
    return <MenuDeAcoes semTexto rotulo={`gerenciar ${b.nome}`} acoes={acoes} />;
  };

  const confirmar = () => {
    if (!pendente) return;
    if (pendente.tipo === "renomear" && texto.trim())
      atualizar({ estantesProprias: (proprias ?? []).map((p) => (p.id === pendente.id ? { ...p, nome: texto.trim() } : p)) });
    if (pendente.tipo === "apagar")
      // a estante some; os livros continuam na biblioteca
      atualizar({
        estantesProprias: (proprias ?? []).filter((p) => p.id !== pendente.id),
        livros: livros.map((l) =>
          l.estantes?.includes(pendente.id)
            ? { ...l, estantes: l.estantes.filter((x) => x !== pendente.id), atualizadoEm: new Date().toISOString() }
            : l,
        ),
      });
    setPendente(null);
  };

  return (
    <AppShell aba="estantes">
      <AvisoRemovido />
      <div className="mx-auto w-full max-w-[1240px] px-5 pt-4 pb-16 text-ameixa sm:px-8 lg:px-14 lg:pt-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-revista text-[30px] leading-none text-bordo italic lg:text-[38px]">estantes</h1>
          <div className="flex items-center gap-4">
            <Link href="/estantes/importar" className="text-[13px] text-cinza underline decoration-bege underline-offset-4 hover:text-bordo">
              importar lista
            </Link>
            <Link href="/estantes/nova" className="inline-flex h-11 items-center gap-2 rounded-full bg-bordo px-5 text-[14px] font-semibold text-creme hover:bg-bordo/90">
              <Icone d={ICONE_MAIS} />
              nova estante
            </Link>
          </div>
        </header>

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
          <ul className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
            {blocos.map((b) => (
              <BlocoDaEstante key={b.id} b={b} menu={menuDe(b)} />
            ))}
            <li>
              <Link
                href="/estantes/nova"
                className="flex h-full min-h-[170px] flex-col items-center justify-center rounded-[12px] border border-dashed border-rosa-antigo px-6 py-7 text-center hover:bg-bordo/[.03]"
              >
                <Icone d={ICONE_MAIS} className="size-6 text-bordo" />
                <span className="mt-2 font-revista text-[20px] text-bordo italic">criar nova estante</span>
                <span className="mt-1 text-[12px] text-tinta-suave">por temas, gêneros ou como preferir.</span>
              </Link>
            </li>
          </ul>
        )}
      </div>

      {pendente ? (
        <Janela titulo={pendente.tipo === "renomear" ? "renomear estante" : `apagar “${pendente.nome}”?`} onFechar={() => setPendente(null)}>
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
            <p className="text-[14px] text-tinta-suave">a estante some, mas os livros continuam na sua biblioteca.</p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => setPendente(null)} className="h-10 rounded-full px-4 text-[13px] font-semibold text-cinza hover:text-ameixa">
              cancelar
            </button>
            <button type="button" autoFocus={pendente.tipo !== "renomear"} onClick={confirmar} className="h-10 rounded-full bg-bordo px-5 text-[13px] font-semibold text-creme">
              {pendente.tipo === "renomear" ? "salvar" : "apagar"}
            </button>
          </div>
        </Janela>
      ) : null}
    </AppShell>
  );
}
