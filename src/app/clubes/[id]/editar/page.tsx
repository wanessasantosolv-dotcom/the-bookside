"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CampoFoto } from "@/components/clube/CampoFoto";
import { CampoCapa } from "@/components/clube/CampoCapa";
import { useClube } from "@/components/clube/ClubeContexto";
import {
  botaoPrincipal,
  campo,
  Rodape,
  rotuloCampo,
  TopoForm,
} from "@/components/clube/Pecas";
import { Vazio } from "@/components/social/Estados";
import {
  apagarClube,
  editarClube,
  modoDe,
  modosDeEscolha,
  type ModoEscolha,
} from "@/lib/clubes";
import { temas } from "@/lib/dados";

export default function EditarClubePage() {
  const { clube, membros, papel, recarregar } = useClube();
  const router = useRouter();
  const [nome, setNome] = useState(clube.nome);
  const [descricao, setDescricao] = useState(clube.descricao ?? "");
  const [capa, setCapa] = useState<string | null>(clube.capa);
  const [foto, setFoto] = useState<string | null>(clube.foto ?? null);
  const [tema, setTema] = useState<string>(clube.tema ?? temas[0].id);
  const POR_PAGINA_TEMA = 4;
  const [paginaTema, setPaginaTema] = useState(() =>
    Math.max(
      0,
      Math.floor(
        temas.findIndex((t) => t.id === (clube.tema ?? temas[0].id)) /
          POR_PAGINA_TEMA,
      ),
    ),
  );
  const totalPaginasTema = Math.ceil(temas.length / POR_PAGINA_TEMA);
  const [limite, setLimite] = useState<string>(
    clube.limite_sugestoes ? String(clube.limite_sugestoes) : "",
  );
  const [maximo, setMaximo] = useState<string>(
    clube.max_membros ? String(clube.max_membros) : "",
  );
  const [escolha, setEscolha] = useState<ModoEscolha>(modoDe(clube));
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (papel !== "moderadora")
    return (
      <div className="px-6 pt-6 lg:px-0">
        <Vazio
          titulo="só quem modera edita o clube"
          acao={{ href: `/clubes/${clube.id}`, rotulo: "voltar ao clube" }}
        />
      </div>
    );

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return setErro("o clube precisa de um nome.");
    setOcupado(true);
    setErro(null);
    try {
      await editarClube(clube.id, {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        capa,
        tema,
        limite_sugestoes: limite ? Number(limite) : null,
        max_membros: maximo ? Math.max(Number(maximo), membros.length) : null,
        // só manda quando muda (clubes sem a coluna nova continuam salvando o resto)
        ...(escolha !== modoDe(clube) ? { escolha } : {}),
        ...(foto !== (clube.foto ?? null) ? { foto } : {}),
      });
      recarregar();
      router.push(`/clubes/${clube.id}`);
    } catch (x) {
      const e = x as { code?: string; message?: string };
      // campo novo que ainda não existe no banco: falta rodar o supabase/social.sql atualizado
      const faltaCampo =
        e?.code === "PGRST204" ||
        e?.code === "42703" ||
        /column/i.test(e?.message ?? "");
      setErro(
        faltaCampo
          ? "o banco ainda não tem esse campo. rode de novo o arquivo supabase/social.sql no SQL Editor do Supabase."
          : "não deu para salvar. tente de novo.",
      );
      setOcupado(false);
    }
  }

  async function apagar() {
    if (
      !confirm(
        `apagar o clube ${clube.nome} para todo mundo? as fichas, sugestões e a agenda somem junto. não dá para desfazer.`,
      )
    )
      return;
    await apagarClube(clube.id);
    router.push("/clubes");
  }

  const linha =
    "flex min-h-[52px] items-center justify-between border-b border-linha text-sm lg:border-fio";

  return (
    <form onSubmit={salvar} className="flex min-h-[70dvh] flex-col">
      <TopoForm
        voltar={{ href: `/clubes/${clube.id}`, r: "cancelar" }}
        rotulo="editar clube"
        titulo="sobre o clube"
      />
      <div className="mt-6 space-y-6 px-6 lg:max-w-[560px] lg:px-0">
        <label className="block">
          <span className={rotuloCampo}>nome</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={60}
            required
            className={campo}
          />
        </label>
        <label className="block">
          <span className={rotuloCampo}>descrição</span>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            maxLength={280}
            rows={2}
            className={`${campo} resize-none font-accent italic`}
          />
        </label>
        <CampoFoto valor={foto} onMudar={setFoto} />
        <CampoCapa valor={capa} onMudar={setCapa} />
        <fieldset>
          <legend className={rotuloCampo}>tema do clube</legend>
          <p className="mt-1 font-accent text-[13px] italic text-cinza">
            define a cor de destaque do cabeçalho do clube.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <button
              type="button"
              aria-label="temas anteriores"
              disabled={paginaTema === 0}
              onClick={() => setPaginaTema((p) => Math.max(0, p - 1))}
              className="flex size-9 flex-none items-center justify-center rounded-full border border-bege text-bordo disabled:opacity-30"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className="grid flex-1 grid-cols-4 gap-2.5">
              {temas
                .slice(
                  paginaTema * POR_PAGINA_TEMA,
                  paginaTema * POR_PAGINA_TEMA + POR_PAGINA_TEMA,
                )
                .map((t) => {
                  const marcado = t.id === tema;
                  return (
                    <label key={t.id} className="block">
                      <input
                        type="radio"
                        name="tema"
                        className="sr-only"
                        checked={marcado}
                        onChange={() => setTema(t.id)}
                      />
                      <span
                        aria-label={t.nome}
                        className={`flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 p-1 text-center ${
                          marcado
                            ? "shadow-[0_6px_14px_-8px_rgba(43,20,32,.5)]"
                            : "border-transparent"
                        }`}
                        style={{
                          background: t.papel,
                          borderColor: marcado ? t.destaque : "transparent",
                        }}
                      >
                        <span
                          aria-hidden
                          className="size-4 rounded-full"
                          style={{ background: t.destaque }}
                        />
                        <span
                          className="text-[9px] leading-tight font-semibold"
                          style={{ color: t.texto }}
                        >
                          {t.nome}
                        </span>
                      </span>
                    </label>
                  );
                })}
            </div>
            <button
              type="button"
              aria-label="mais temas"
              disabled={paginaTema === totalPaginasTema - 1}
              onClick={() =>
                setPaginaTema((p) => Math.min(totalPaginasTema - 1, p + 1))
              }
              className="flex size-9 flex-none items-center justify-center rounded-full border border-bege text-bordo disabled:opacity-30"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
          <div className="mt-2.5 flex justify-center gap-1.5">
            {Array.from({ length: totalPaginasTema }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`página ${i + 1} de temas`}
                aria-current={i === paginaTema}
                onClick={() => setPaginaTema(i)}
                className={`size-1.5 rounded-full ${i === paginaTema ? "bg-bordo" : "bg-linha"}`}
              />
            ))}
          </div>
        </fieldset>
        <fieldset className="space-y-4">
          <legend className={rotuloCampo}>regras do clube</legend>
          <label className="flex items-center justify-between gap-4 text-sm">
            sugestões por pessoa, por mês
            <select
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              className="min-h-11 rounded-md border border-linha bg-creme-quente px-3"
            >
              {["1", "2", "3", "5"].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value="">sem limite</option>
            </select>
          </label>
          <label className="flex items-center justify-between gap-4 text-sm">
            máximo de pessoas
            <select
              value={maximo}
              onChange={(e) => setMaximo(e.target.value)}
              className="min-h-11 rounded-md border border-linha bg-creme-quente px-3"
            >
              <option value="">sem limite</option>
              {[4, 6, 8, 10, 12, 15, 20, 30]
                .filter((n) => n >= membros.length)
                .map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-sm">
            como o clube escolhe os livros
            <select
              value={escolha}
              onChange={(e) => setEscolha(e.target.value as ModoEscolha)}
              className="mt-2 min-h-11 w-full rounded-md border border-linha bg-creme-quente px-3"
            >
              {modosDeEscolha.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-cinza">
              {modosDeEscolha.find((m) => m.id === escolha)?.descricao}
            </span>
          </label>
        </fieldset>
        <div className="border-t border-linha lg:border-fio">
          <Link href={`/clubes/${clube.id}/convidar`} className={linha}>
            membros e papéis{" "}
            <span className="text-cinza">{membros.length} ›</span>
          </Link>
          <Link href={`/clubes/${clube.id}/leitura`} className={linha}>
            leitura e prazos <span className="text-cinza">›</span>
          </Link>
          <button
            type="button"
            onClick={apagar}
            className={`${linha} w-full text-bordo`}
          >
            apagar o clube <span>›</span>
          </button>
        </div>
        {erro ? (
          <p role="alert" className="text-[13px] text-bordo">
            {erro}
          </p>
        ) : null}
      </div>
      <Rodape>
        <button
          type="submit"
          disabled={ocupado}
          className={`${botaoPrincipal} lg:max-w-[560px]`}
        >
          {ocupado ? "salvando…" : "salvar alterações"}
        </button>
      </Rodape>
    </form>
  );
}
