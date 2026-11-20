"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { ComConta, ErroOuFalta } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { Voltar } from "@/components/Voltar";
import { celebrar } from "@/lib/celebrar";
import { corDoLivro } from "@/lib/cores";
import {
  apagarLeitura,
  apagarRecado,
  atualizarMinhaPagina,
  definirPaginasDaLeitura,
  mandarRecado,
  minhasLeiturasJuntas,
  recadosDe,
  sairDaLeitura,
} from "@/lib/lerjunto";
import { usePerfil } from "@/lib/perfil-store";
import { nomeDe, quandoFoi, useConsulta, useMeuId } from "@/lib/social";

/** Uma leitura junta: o progresso de cada um e os recados (com spoiler escondido para quem está atrás). */
function Leitura() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const eu = useMeuId();
  const editarLivro = usePerfil((s) => s.editarLivro);
  const meuLivro = usePerfil((s) => s.livros);
  const consulta = useConsulta(async () => {
    const [todas, recados] = await Promise.all([
      minhasLeiturasJuntas(),
      recadosDe(id),
    ]);
    return { l: todas.find((x) => x.id === id) ?? null, recados };
  }, [id]);
  const [pagina, setPagina] = useState("");
  const [paginasTotal, setPaginasTotal] = useState("");
  const [texto, setTexto] = useState("");
  const [comSpoiler, setComSpoiler] = useState(true);
  const [revelados, setRevelados] = useState<string[]>([]);
  const [copiado, setCopiado] = useState(false);
  const sincronizou = useRef(false);

  const l = consulta.dados?.l;
  const eus = l?.pessoas.find((p) => p.usuario_id === eu);
  const daEstante = l ? meuLivro.find((x) => x.id === l.livro.id) : undefined;

  // a página da estante pessoal entra sozinha aqui (se estiver mais à frente)
  useEffect(() => {
    if (!l || !eus || sincronizou.current) return;
    sincronizou.current = true;
    // entrar numa leitura junta sem o livro na estante: entra como "lendo"
    // agora mesmo, pra aparecer em "você está lendo" e contar nas métricas
    if (!daEstante && !eus.terminou)
      editarLivro(
        {
          id: l.livro.id,
          titulo: l.livro.titulo,
          autor: l.livro.autor,
          capa: l.livro.capa,
        },
        {
          status: "lendo",
          iniciadoEm: new Date().toISOString(),
          paginaAtual: eus.pagina,
          paginas: l.livro.paginas,
        },
      );
    const p =
      daEstante?.status === "lido"
        ? (l.livro.paginas ?? daEstante.paginas ?? eus.pagina)
        : (daEstante?.paginaAtual ?? 0);
    if (p > eus.pagina || (daEstante?.status === "lido" && !eus.terminou))
      atualizarMinhaPagina(l.id, p, daEstante?.status === "lido")
        .then(() => consulta.recarregar())
        .catch(() => {});
  }, [l, eus, daEstante, consulta, editarLivro]);

  if (consulta.erro)
    return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  if (!consulta.dados)
    return <p className="font-accent text-sm italic text-cinza">abrindo…</p>;
  if (!l)
    return (
      <p className="font-accent text-[15px] italic text-cinza">
        essa leitura não existe mais ou você não está nela.
      </p>
    );

  const total = l.livro.paginas ?? daEstante?.paginas ?? 0;
  const minhaPagina = eus?.terminou ? Infinity : (eus?.pagina ?? 0);
  const pessoas = [...l.pessoas].sort(
    (a, b) => Number(b.terminou) - Number(a.terminou) || b.pagina - a.pagina,
  );
  const pct = (p: { pagina: number; terminou: boolean }) =>
    p.terminou
      ? 100
      : total
        ? Math.min(100, Math.round((p.pagina / total) * 100))
        : 0;
  const link =
    typeof window !== "undefined" && l.codigo
      ? `${window.location.origin}/ler-junto?codigo=${l.codigo}`
      : "";

  async function salvarPagina(terminou = false) {
    const p = terminou
      ? total || Number(pagina) || 0
      : Math.max(0, Math.round(Number(pagina) || 0));
    // livro entrou na leitura junta sem o total de páginas: registra agora,
    // pra barra de progresso de todo mundo parar de ficar travada em 0%
    if (!total && Number(paginasTotal) > 0)
      await definirPaginasDaLeitura(
        l!.id,
        l!.livro,
        Math.round(Number(paginasTotal)),
      ).catch(() => {});
    await atualizarMinhaPagina(l!.id, p, terminou);
    // a estante pessoal acompanha
    editarLivro(
      {
        id: l!.livro.id,
        titulo: l!.livro.titulo,
        autor: l!.livro.autor,
        capa: l!.livro.capa,
      },
      terminou
        ? {
            status: "lido",
            lidoEm: new Date().toISOString(),
            paginaAtual: total || undefined,
            paginas: total || undefined,
          }
        : { status: "lendo", paginaAtual: p, paginas: total || undefined },
    );
    if (terminou) {
      celebrar({
        tipo: "livro",
        titulo: l!.livro.titulo,
        capa: l!.livro.capa ?? "",
        texto: "terminou a leitura junta ✦",
        livroId: l!.livro.id,
      });
      setPagina("");
      router.push(`/livro/${l!.livro.id}/avaliar`);
      return;
    }
    setPagina("");
    consulta.recarregar();
  }

  async function enviar() {
    if (!texto.trim()) return;
    await mandarRecado(l!.id, texto, comSpoiler ? (eus?.pagina ?? null) : null);
    setTexto("");
    consulta.recarregar();
  }

  async function convidar() {
    const t = `bora ler "${l!.livro.titulo}" junto comigo no the bookside? código: ${l!.codigo}`;
    try {
      if (navigator.share)
        await navigator.share({ title: l!.livro.titulo, text: t, url: link });
      else {
        await navigator.clipboard.writeText(`${t}\n${link}`);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2000);
      }
    } catch {
      /* cancelou */
    }
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-10">
      <div>
        {/* o livro */}
        <div className="flex gap-4">
          <Link href={`/livro/${l.livro.id}`} className="flex-none">
            <CapaLivro
              titulo={l.livro.titulo}
              capa={l.livro.capa}
              cor={corDoLivro(l.livro.id)}
              className="w-[92px] -rotate-1 [&>span:last-child]:text-xs"
            />
          </Link>
          <div className="min-w-0 pt-1">
            <p className="text-[10px] font-semibold tracking-[.16em] text-bordo uppercase">
              lendo junto ✦
            </p>
            <h1 className="mt-1 font-display text-[26px] leading-tight font-semibold italic text-ameixa lg:font-revista lg:text-[32px] lg:font-normal">
              {l.livro.titulo}
            </h1>
            <p className="mt-0.5 text-xs text-cinza">
              {l.livro.autor}
              {total ? ` · ${total} páginas` : ""}
              {l.prazo
                ? ` · até ${new Date(`${l.prazo}T12:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}`
                : ""}
            </p>
          </div>
        </div>

        {/* a corrida: cada um na sua página */}
        <section className="mt-6 rounded-xl border border-linha bg-creme-quente p-4 lg:rounded-[6px] lg:p-5">
          <h2 className="text-[11px] font-semibold tracking-[.14em] text-bordo uppercase">
            onde cada um está
          </h2>
          <ul className="mt-4 space-y-4">
            {pessoas.map((p) => (
              <li key={p.usuario_id} className="flex items-center gap-3">
                <Avatar pessoa={p.pessoa} tamanho={38} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2 text-sm">
                    <b className="truncate font-semibold">
                      {p.usuario_id === eu ? "você" : nomeDe(p.pessoa)}
                    </b>
                    <span className="flex-none text-xs text-cinza">
                      {p.terminou
                        ? "terminou ✓"
                        : p.pagina
                          ? `pág. ${p.pagina}${total ? ` · ${pct(p)}%` : ""}`
                          : "ainda não começou"}
                    </span>
                  </span>
                  <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-linha/70">
                    <span
                      className="block h-full rounded-full bg-bordo transition-all"
                      style={{ width: `${pct(p)}%` }}
                    />
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {eus && !eus.terminou ? (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {!total ? (
                <>
                  <p className="w-full font-accent text-xs italic text-cinza">
                    esse livro entrou sem o total de páginas — por isso a
                    barra não se mexe. diga quantas páginas ele tem:
                  </p>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    value={paginasTotal}
                    onChange={(e) => setPaginasTotal(e.target.value)}
                    placeholder="quantas páginas tem o livro?"
                    className="h-11 w-[200px] rounded-pill border border-bege bg-creme px-4 text-sm outline-none focus:border-bordo"
                  />
                </>
              ) : null}
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={pagina}
                onChange={(e) => setPagina(e.target.value)}
                placeholder={
                  eus.pagina
                    ? `estou na pág. ${eus.pagina}`
                    : "em que página você está?"
                }
                className="h-11 w-[200px] rounded-pill border border-bege bg-creme px-4 text-sm outline-none focus:border-bordo"
              />
              <button
                type="button"
                onClick={() => salvarPagina()}
                disabled={!pagina}
                className="h-11 rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme disabled:opacity-45"
              >
                atualizar
              </button>
              <button
                type="button"
                onClick={() => salvarPagina(true)}
                className="h-11 rounded-pill border border-bordo px-5 text-[13px] font-semibold text-bordo"
              >
                terminei ✓
              </button>
            </div>
          ) : null}
        </section>

        {/* recados */}
        <section className="mt-8">
          <h2 className="border-b border-linha pb-2 font-display text-[22px] font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
            conversa
          </h2>
          <ul className="mt-4 space-y-3">
            {consulta.dados.recados.map((r) => {
              const autor =
                l.pessoas.find((p) => p.usuario_id === r.autor)?.pessoa ?? null;
              const meu = r.autor === eu;
              // spoiler: o recado fala de uma página à frente da minha
              const escondido =
                !meu &&
                r.pagina !== null &&
                r.pagina > minhaPagina &&
                !revelados.includes(r.id);
              return (
                <li
                  key={r.id}
                  className={`flex gap-2.5 ${meu ? "flex-row-reverse" : ""}`}
                >
                  <Avatar pessoa={autor} tamanho={30} />
                  <div
                    className={`max-w-[80%] rounded-[14px] px-3.5 py-2.5 text-[14px] ${meu ? "bg-bordo text-creme" : "border border-linha bg-creme-quente"}`}
                  >
                    {escondido ? (
                      <button
                        type="button"
                        onClick={() => setRevelados((x) => [...x, r.id])}
                        className="text-left font-accent italic"
                      >
                        🙈 spoiler da pág. {r.pagina} — você está na{" "}
                        {eus?.pagina ?? 0}. tocar para ver mesmo assim
                      </button>
                    ) : (
                      <p className="whitespace-pre-wrap">{r.texto}</p>
                    )}
                    <p
                      className={`mt-1 text-[10px] ${meu ? "text-rosa-claro" : "text-cinza"}`}
                    >
                      {meu ? "você" : nomeDe(autor)} · {quandoFoi(r.criado_em)}
                      {r.pagina !== null ? ` · pág. ${r.pagina}` : ""}
                      {meu ? (
                        <button
                          type="button"
                          onClick={() =>
                            apagarRecado(r.id).then(() => consulta.recarregar())
                          }
                          className="ml-2 underline"
                        >
                          apagar
                        </button>
                      ) : null}
                    </p>
                  </div>
                </li>
              );
            })}
            {!consulta.dados.recados.length ? (
              <li className="font-accent text-sm italic text-cinza">
                nenhum recado ainda. comenta o primeiro capítulo? ✦
              </li>
            ) : null}
          </ul>
          {eus ? (
            <div className="mt-4">
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value.slice(0, 1000))}
                rows={2}
                placeholder="o que você está achando?"
                className="w-full resize-none rounded-[12px] border border-bege bg-creme-quente px-4 py-3 text-[15px] outline-none focus:border-bordo"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs text-cinza">
                  <input
                    type="checkbox"
                    checked={comSpoiler}
                    onChange={(e) => setComSpoiler(e.target.checked)}
                    className="size-4 accent-bordo"
                  />
                  esconder de quem ainda não chegou na pág. {eus.pagina}
                </label>
                <button
                  type="button"
                  onClick={enviar}
                  disabled={!texto.trim()}
                  className="h-10 rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme disabled:opacity-45"
                >
                  enviar
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <aside className="mt-8 space-y-4 lg:mt-0">
        {l.codigo ? (
          <div className="rounded-xl border border-linha bg-creme-quente p-4 lg:rounded-[6px]">
            <p className="text-[11px] font-semibold tracking-[.14em] text-bordo uppercase">
              chamar mais alguém
            </p>
            <p className="mt-2 font-mono text-2xl tracking-[.25em] text-ameixa">
              {l.codigo}
            </p>
            <button
              type="button"
              onClick={convidar}
              className="mt-3 h-10 w-full rounded-pill bg-bordo text-[13px] font-semibold text-creme"
            >
              {copiado ? "convite copiado ✓" : "mandar convite"}
            </button>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-4 text-xs">
          <button
            type="button"
            onClick={async () => {
              if (!confirm("sair desta leitura?")) return;
              await sairDaLeitura(l.id);
              router.push("/ler-junto");
            }}
            className="min-h-9 font-semibold text-cinza underline underline-offset-4"
          >
            sair da leitura
          </button>
          {l.criado_por === eu ? (
            <button
              type="button"
              onClick={async () => {
                if (!confirm("apagar a leitura para todo mundo?")) return;
                await apagarLeitura(l.id);
                router.push("/ler-junto");
              }}
              className="min-h-9 font-semibold text-bordo underline underline-offset-4"
            >
              apagar
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

export default function LeituraJuntaPage() {
  return (
    <AppShell aba="clubes">
      <div className="flex flex-1 flex-col px-6 pt-2 pb-10 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="w-full max-w-[1000px]">
          <Voltar
            padrao="/ler-junto"
            rotulo="ler junto"
            className="-ml-2 mb-3 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo"
          />
          <ComConta>
            <Leitura />
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
