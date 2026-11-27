"use client";

import { Voltar } from "@/components/Voltar";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FilaDaPrateleira,
  MODOS_ESTANTE,
  ListaDeLivros,
  useVistaSalva,
} from "@/components/estantes/Biblioteca";
import { useAcoesDoLivro } from "@/components/estantes/AcoesDoLivro";
import { BarraCompacta } from "@/components/estantes/BarraCompacta";
import { PilhaDeCapas } from "@/components/estantes/Vitrine";
import { BotaoFiltros, PainelFiltros } from "@/components/estantes/PainelFiltros";
import { AppShell } from "@/components/AppShell";
import { AvisoRemovido } from "@/components/AvisoRemovido";
import { useHidratado } from "@/components/PerfilHidratacao";
import { BotaoLink } from "@/components/ui/Botao";
import {
  livrosDaEstante,
  mesDe,
  todasAsEstantes,
  type EstanteInfo,
} from "@/lib/estantes";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";

/** "todos", um ano ("2025"), "sem-data", "4mais" ou "amei" */
type Filtro = string;

/** a data que vale para o livro nesta estante (nos lidos: só quando terminou) */
function dataDoLivro(l: LivroSalvo) {
  if (l.status === "lido") return l.lidoEm;
  return l.lidoEm ?? l.iniciadoEm ?? l.adicionadoEm;
}

/** quantos livros cabem em cada andar da estante, pela largura da tela */
function usePorAndar(face: "capas" | "lombadas") {
  const [largura, setLargura] = useState(1200);
  useEffect(() => {
    const medir = () => setLargura(window.innerWidth);
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);
  const celular = largura < 640;
  const util = largura >= 1024 ? largura - 380 : largura - 40;
  const porLivro = face === "lombadas" ? 36 : celular ? 96 : 118;
  return { porAndar: Math.max(3, Math.floor(util / porLivro)), alturaCapa: celular ? 118 : 150 };
}

export default function EstanteAbertaPage() {
  const { id } = useParams<{ id: string }>();
  const hidratado = useHidratado();
  const livros = usePerfil((s) => s.livros);
  const proprias = usePerfil((s) => s.estantesProprias);
  const idsFavoritos = usePerfil((s) => s.favoritos);
  const [vista, setVista] = useVistaSalva();
  const [extra, setExtra] = useState<{ ordem: string; autor?: string; notaMin?: number }>({ ordem: "padrao" });
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const { acoesDoLivro, estantesDoLivro, janela } = useAcoesDoLivro();
  const { porAndar, alturaCapa } = usePorAndar(vista === "pe" ? "lombadas" : "capas");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [busca, setBusca] = useState("");
  const [adicionados, setAdicionados] = useState(0);
  useEffect(() => {
    const n = Number(new URLSearchParams(window.location.search).get("adicionados"));
    if (n > 0) {
      setAdicionados(n);
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  if (!hidratado) return <AppShell aba="estantes">{null}</AppShell>;
  // além das estantes, "todos os livros" e "meus favoritos" também abrem aqui
  const etiqueta = { fundo: "#692536", texto: "#F6F0E5" };
  const estante: EstanteInfo | undefined =
    id === "todos"
      ? { id: "todos", nome: "todos os livros", etiqueta }
      : id === "favoritos"
        ? { id: "favoritos", nome: "meus favoritos", etiqueta }
        : todasAsEstantes(proprias ?? []).find((e) => e.id === id);
  if (!estante) notFound();
  const ehLidos = estante.status === "lido";

  const todos =
    estante.id === "todos"
      ? [...livros].sort((a, b) => (b.adicionadoEm ?? "").localeCompare(a.adicionadoEm ?? ""))
      : estante.id === "favoritos"
        ? (idsFavoritos ?? []).map((f) => livros.find((l) => l.id === f)).filter((l): l is LivroSalvo => !!l)
        : livrosDaEstante(estante, livros);
  // os anos que aparecem na estante, do mais recente ao mais antigo
  const anos = [
    ...new Set(
      todos
        .map((l) => dataDoLivro(l)?.slice(0, 4))
        .filter((a): a is string => !!a && /^\d{4}$/.test(a)),
    ),
  ].sort((a, b) => b.localeCompare(a));
  if (!anos.length) anos.push(String(new Date().getFullYear()));
  const temSemData = todos.some((l) => !dataDoLivro(l));
  const termo = busca
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
  const filtrada = todos.filter((l) => {
    if (
      termo &&
      !`${l.titulo} ${l.autor}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .includes(termo)
    )
      return false;
    if (/^\d{4}$/.test(filtro))
      return (dataDoLivro(l) ?? "").startsWith(filtro);
    if (filtro === "sem-data") return !dataDoLivro(l);
    if (filtro === "4mais") return (l.nota ?? 0) >= 4;
    if (filtro === "amei") return !!l.amei;
    return true;
  });
  // o mesmo painel de filtros de todas as estantes: ordem, autor e avaliação
  const autoresDaEstante = [...new Set(todos.map((l) => l.autor).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  const lista = filtrada
    .filter((l) => (!extra.autor || l.autor === extra.autor) && (!extra.notaMin || (l.nota ?? 0) >= extra.notaMin))
    .sort((a, b) =>
      extra.ordem === "titulo"
        ? a.titulo.localeCompare(b.titulo, "pt-BR")
        : extra.ordem === "autor"
          ? (a.autor ?? "").localeCompare(b.autor ?? "", "pt-BR")
          : extra.ordem === "avaliacao"
            ? (b.nota ?? 0) - (a.nota ?? 0)
            : extra.ordem === "antigos"
              ? (dataDoLivro(a) ?? "9").localeCompare(dataDoLivro(b) ?? "9")
              : extra.ordem === "recentes"
                ? (dataDoLivro(b) ?? "").localeCompare(dataDoLivro(a) ?? "")
                : 0,
    );
  const extrasAtivos = [extra.autor, extra.notaMin, extra.ordem !== "padrao" ? extra.ordem : null].filter(Boolean).length;
  const grupos = lista.reduce<{ mes: string; livros: LivroSalvo[] }[]>(
    (acc, l) => {
      const mes = mesDe(dataDoLivro(l));
      const g = acc.find((x) => x.mes === mes);
      if (g) g.livros.push(l);
      else acc.push({ mes, livros: [l] });
      return acc;
    },
    [],
  );
  // os sem data vão para o fim
  grupos.sort(
    (a, b) => Number(a.mes === "sem data") - Number(b.mes === "sem data"),
  );
  const subtitulo =
    estante.id === "todos"
      ? "sua biblioteca inteira"
      : estante.id === "favoritos"
        ? "em destaque no seu perfil"
        :
    estante.status === "lido"
      ? "do mais recente ao mais antigo"
      : estante.status === "quero"
        ? "na ordem em que entraram"
        : estante.status === "lendo"
          ? "leituras em andamento"
          : estante.propria?.publica
            ? "amigos também veem"
            : "só você vê";

  return (
    <AppShell aba="estantes">
      <AvisoRemovido />
      <div className="flex flex-1 flex-col lg:bg-jornal lg:px-14 lg:pt-10">
        <header className="flex items-center gap-2 px-4 pt-1 lg:px-0 lg:pt-0">
          <Voltar padrao="/estantes" className="-ml-2 grid size-11 flex-none place-items-center text-bordo">
            <span className="sr-only">voltar</span>
            <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Voltar>
          <div className="flex min-w-0 flex-1 items-baseline gap-2.5">
            <h1 className="truncate font-revista text-[25px] leading-none text-ameixa lg:text-[30px]">{estante.nome}</h1>
            <span className="flex-none text-[13px] text-cinza">
              {todos.length} {todos.length === 1 ? "livro" : "livros"}
            </span>
          </div>
          <Link
            href={estante.id === "favoritos" ? "/perfil/favoritos" : estante.id === "todos" ? "/buscar" : estante.propria ? `/estantes/${estante.id}/adicionar` : `/buscar?estante=${estante.id}`}
            aria-label={estante.id === "favoritos" ? "escolher favoritos" : `adicionar livro em ${estante.nome}`}
            className="flex h-9 flex-none items-center gap-1 rounded-[6px] bg-bordo px-3 text-[13px] font-semibold text-creme hover:bg-bordo-suave"
          >
            <span aria-hidden className="text-[16px] leading-none">+</span>
            <span className="sm:hidden">{estante.id === "favoritos" ? "escolher" : "livro"}</span>
            <span className="hidden sm:inline">{estante.id === "favoritos" ? "escolher favoritos" : "adicionar livro"}</span>
          </Link>
        </header>
        <p className="mt-1 px-4 text-[12px] text-cinza lg:px-0">{subtitulo}</p>

        <div className="relative z-30 mt-3 px-4 lg:px-0">
          {adicionados ? (
            <p role="status" className="mb-2 text-[13px] text-oliva">
              {adicionados === 1 ? "Livro adicionado à sua lista." : "Livros adicionados à sua lista."}
            </p>
          ) : null}
          <BarraCompacta
            filtros={[
              { id: "todos", nome: `Todos · ${todos.length}` },
              ...anos.map((a) => ({ id: String(a), nome: String(a) })),
              ...(temSemData && estante.status === "lido" ? [{ id: "sem-data", nome: "Sem data" }] : []),
              ...(estante.status === "lido" ? [{ id: "4mais", nome: "Nota 4 ou mais" }] : []),
              ...(todos.some((l) => l.amei) ? [{ id: "amei", nome: "Amei" }] : []),
            ]}
            filtro={filtro}
            onFiltro={(f) => setFiltro(f as Filtro)}
            busca={busca}
            onBusca={todos.length > 4 ? setBusca : undefined}
            placeholder="Buscar nesta estante"
            modos={MODOS_ESTANTE}
            modo={vista}
            onModo={(v) => setVista(v as typeof vista)}
            extra={todos.length > 1 ? <BotaoFiltros ativos={extrasAtivos} onAbrir={() => setFiltrosAbertos(true)} /> : null}
          />
        </div>
        <div className="flex-1 px-6 pt-4 pb-8 lg:px-0 lg:pt-8">
          {lista.length === 0 ? (
            <div className="pt-8 text-center">
              <p aria-hidden className="text-xl text-ouro">
                ✦
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold italic text-ameixa">
                {todos.length
                  ? "nenhum livro com esse filtro"
                  : "essa estante ainda está vazia"}
              </h2>
              {!todos.length ? (
                <BotaoLink
                  href={estante.propria ? `/estantes/${estante.id}/adicionar` : `/buscar?estante=${estante.id}`}
                  className="mx-auto mt-5 !h-11 max-w-[220px] !text-sm"
                >
                  buscar um livro
                </BotaoLink>
              ) : null}
            </div>
          ) : vista === "estante" || vista === "pe" ? (
            <div className="space-y-10">
              {Array.from({ length: Math.ceil(lista.length / porAndar) }, (_, k) => (
                <FilaDaPrateleira key={k} livros={lista.slice(k * porAndar, (k + 1) * porAndar)} altura={alturaCapa} face={vista === "pe" ? "lombadas" : "capas"} />
              ))}
            </div>
          ) : vista === "leque" ? (
            <PilhaDeCapas livros={lista.map((l) => ({ id: l.id, titulo: l.titulo, autor: l.autor, capa: l.capa, paginas: l.paginas }))} />
          ) : (
            grupos.map((g, gi) => (
              <section key={g.mes} className={gi ? "mt-8" : ""}>
                {ehLidos ? <h2 className="mb-2 font-revista text-[20px] leading-[1.2] text-bordo italic">{g.mes}</h2> : null}
                <ListaDeLivros livros={g.livros} acoesDoLivro={acoesDoLivro} estantesDoLivro={estantesDoLivro} />
              </section>
            ))
          )}
        </div>
      </div>
      {janela}
      {filtrosAbertos ? (
        <PainelFiltros
          ativos={extrasAtivos}
          onLimpar={() => setExtra({ ordem: "padrao" })}
          onFechar={() => setFiltrosAbertos(false)}
          campos={[
            { rotulo: "Ordenar por", valor: extra.ordem, opcoes: [["padrao", "Ordem da estante"], ["recentes", "Mais recentes"], ["antigos", "Mais antigos"], ["titulo", "Título"], ["autor", "Autor"], ["avaliacao", "Avaliação"]], onMudar: (v) => setExtra((e) => ({ ...e, ordem: v })) },
            ...(autoresDaEstante.length > 1 ? [{ rotulo: "Autor", valor: extra.autor ?? "", opcoes: [["", "todos"], ...autoresDaEstante.map((a) => [a, a] as [string, string])] as [string, string][], onMudar: (v: string) => setExtra((e) => ({ ...e, autor: v || undefined })) }] : []),
            ...(todos.some((l) => l.nota) ? [{ rotulo: "Minha avaliação", valor: String(extra.notaMin ?? ""), opcoes: [["", "qualquer"], ["3", "3 ou mais"], ["4", "4 ou mais"], ["4.5", "4,5 ou mais"]] as [string, string][], onMudar: (v: string) => setExtra((e) => ({ ...e, notaMin: v ? Number(v) : undefined })) }] : []),
          ]}
        />
      ) : null}
    </AppShell>
  );
}
