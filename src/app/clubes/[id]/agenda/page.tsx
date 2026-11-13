"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useClube } from "@/components/clube/ClubeContexto";
import { botaoPrincipal, campo, rotuloCampo } from "@/components/clube/Pecas";
import { Carregando, ErroOuFalta } from "@/components/social/Estados";
import { desmarcarEncontro, encontrosDe, livrosDoClube, marcarEncontro } from "@/lib/clubes";
import { nomeDe, useConsulta, useMeuId } from "@/lib/social";

type Evento = {
  id: string;
  quando: Date;
  rotulo: string;
  titulo: string;
  detalhe?: string;
  encontroId?: string;
  criado_por?: string | null;
  href?: string;
};

function NovoEncontro({ aoMarcar }: { aoMarcar: () => void }) {
  const { clube } = useClube();
  const [aberto, setAberto] = useState(false);
  const [titulo, setTitulo] = useState("conversa do clube");
  const [quando, setQuando] = useState("");
  const [local, setLocal] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function marcar(e: FormEvent) {
    e.preventDefault();
    if (!quando) return setErro("escolha o dia e a hora.");
    setOcupado(true);
    setErro(null);
    try {
      await marcarEncontro(clube.id, { titulo, quando: new Date(quando).toISOString(), local });
      setAberto(false);
      setQuando("");
      setLocal("");
      aoMarcar();
    } catch {
      setErro("não deu para marcar. tente de novo.");
    } finally {
      setOcupado(false);
    }
  }

  if (!aberto)
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="flex min-h-11 items-center rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme"
      >
        + marcar encontro
      </button>
    );
  return (
    <form
      onSubmit={marcar}
      className="space-y-4 rounded-xl border border-linha bg-creme-quente p-4 lg:rounded-[4px] lg:border-fio lg:bg-transparent lg:p-5"
    >
      <label className="block">
        <span className={rotuloCampo}>o que é</span>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={80} required className={campo} />
      </label>
      <label className="block">
        <span className={rotuloCampo}>quando</span>
        <input
          type="datetime-local"
          value={quando}
          onChange={(e) => setQuando(e.target.value)}
          required
          className={campo}
        />
      </label>
      <label className="block">
        <span className={rotuloCampo}>onde (opcional)</span>
        <input
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          maxLength={120}
          placeholder="café da esquina, chamada de vídeo…"
          className={campo}
        />
      </label>
      {erro ? (
        <p role="alert" className="text-[13px] text-bordo">
          {erro}
        </p>
      ) : null}
      <div className="flex gap-2.5">
        <button type="submit" disabled={ocupado} className={botaoPrincipal}>
          marcar
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="min-h-[52px] px-4 text-sm font-semibold text-cinza"
        >
          cancelar
        </button>
      </div>
    </form>
  );
}

export default function AgendaPage() {
  const { clube, membros, papel } = useClube();
  const eu = useMeuId();
  const [aba, setAba] = useState<"proximos" | "passados">("proximos");
  const consulta = useConsulta(async () => {
    const [encontros, livros] = await Promise.all([encontrosDe(clube.id), livrosDoClube(clube.id)]);
    return { encontros, livros };
  }, [clube.id]);

  if (consulta.carregando && !consulta.dados) return <Carregando texto="abrindo a agenda…" linhas={2} />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const { encontros, livros } = consulta.dados!;
  const pessoa = (id?: string | null) => (id ? (membros.find((m) => m.usuario_id === id)?.pessoa ?? null) : null);

  const eventos: Evento[] = [
    ...encontros.map((e) => ({
      id: e.id,
      quando: new Date(e.quando),
      rotulo: "encontro",
      titulo: e.titulo,
      detalhe: `${new Date(e.quando).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}${e.local ? ` · ${e.local}` : ""} · marcado ${e.criado_por === eu ? "por você" : `pela ${nomeDe(pessoa(e.criado_por))}`}`,
      encontroId: e.id,
      criado_por: e.criado_por,
    })),
    ...livros
      .filter((l) => l.iniciado_em)
      .map((l) => ({
        id: `ini-${l.id}`,
        quando: new Date(l.iniciado_em!),
        rotulo: "começa",
        titulo: l.livro.titulo,
        detalhe: `${l.livro.autor}${l.rodada ? ` · rodada ${l.rodada}` : ""}`,
        href: l.estado === "lendo" ? `/clubes/${clube.id}/leitura` : `/clubes/${clube.id}/livro/${l.id}`,
      })),
    ...livros
      .filter((l) => l.prazo)
      .map((l) => ({
        id: `fim-${l.id}`,
        quando: new Date(`${l.prazo}T23:00`),
        rotulo: "fim da leitura",
        titulo: l.livro.titulo,
        detalhe: "fichas até as 23h",
        href: `/clubes/${clube.id}/ficha/${l.id}`,
      })),
  ];
  const agora = Date.now();
  const lista = eventos
    .filter((e) =>
      aba === "proximos" ? e.quando.getTime() >= agora - 864e5 / 2 : e.quando.getTime() < agora - 864e5 / 2,
    )
    .sort((a, b) =>
      aba === "proximos" ? a.quando.getTime() - b.quando.getTime() : b.quando.getTime() - a.quando.getTime(),
    );

  return (
    <div className="px-6 pt-5 lg:max-w-[760px] lg:px-0">
      <div className="flex items-center justify-between gap-3">
        <div role="group" aria-label="período" className="flex gap-1.5">
          {[
            { id: "proximos", r: "próximos" },
            { id: "passados", r: "passados" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={aba === t.id}
              onClick={() => setAba(t.id as typeof aba)}
              className={`min-h-9 rounded-pill px-3.5 text-[11px] font-semibold ${aba === t.id ? "bg-bordo text-creme" : "border border-bege text-ameixa"}`}
            >
              {t.r}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <NovoEncontro aoMarcar={consulta.recarregar} />
      </div>

      <ol className="mt-5">
        {lista.map((e) => {
          const conteudo = (
            <>
              <span className="w-12 flex-none text-center">
                <span className="block text-[10px] font-semibold tracking-[.12em] text-cinza uppercase">
                  {e.quando.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                </span>
                <span className="block font-display text-[28px] leading-none font-semibold text-bordo">
                  {e.quando.getDate()}
                </span>
                <span className="block text-[10px] text-cinza">
                  {e.quando.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}
                </span>
              </span>
              <span className="min-w-0 flex-1 border-l border-linha pl-4">
                <span className="block text-[10px] font-semibold tracking-[.14em] text-rosa-antigo uppercase">
                  {e.rotulo}
                </span>
                <span className="mt-0.5 block font-display text-lg leading-tight font-semibold italic lg:font-revista lg:font-normal">
                  {e.titulo}
                </span>
                {e.detalhe ? <span className="mt-0.5 block text-xs text-cinza">{e.detalhe}</span> : null}
              </span>
            </>
          );
          return (
            <li key={e.id} className="flex items-start gap-2 border-b border-linha py-4 lg:border-fio">
              {e.href ? (
                <Link href={e.href} className="flex flex-1 gap-3">
                  {conteudo}
                </Link>
              ) : (
                <span className="flex flex-1 gap-3">{conteudo}</span>
              )}
              {e.encontroId && (e.criado_por === eu || papel === "moderadora") ? (
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm(`desmarcar "${e.titulo}"?`)) return;
                    await desmarcarEncontro(e.encontroId!);
                    consulta.recarregar();
                  }}
                  className="min-h-9 px-2 text-xs text-cinza underline underline-offset-2 hover:text-bordo"
                >
                  desmarcar
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
      {!lista.length ? (
        <p className="py-8 text-center font-accent text-sm italic text-cinza">
          {aba === "proximos" ? "nada marcado por enquanto ✦" : "nada no passado ainda."}
        </p>
      ) : null}
    </div>
  );
}
