"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
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
import { lerIdentidade, temaDoId } from "@/lib/identidade";

export default function EditarClubePage() {
  const { clube, membros, papel, recarregar } = useClube();
  const router = useRouter();
  const [nome, setNome] = useState(clube.nome);
  const [descricao, setDescricao] = useState(clube.descricao ?? "");
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
          titulo="só quem organiza pode editar o clube"
          acao={{ href: `/clubes/${clube.id}`, rotulo: "voltar ao clube" }}
        />
      </div>
    );

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return setErro("dê um nome ao clube.");
    setOcupado(true);
    setErro(null);
    try {
      await editarClube(clube.id, {
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        tema,
        limite_sugestoes: limite ? Number(limite) : null,
        max_membros: maximo ? Math.max(Number(maximo), membros.length) : null,
        // só manda quando muda (clubes sem a coluna nova continuam salvando o resto)
        ...(escolha !== modoDe(clube) ? { escolha } : {}),
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
          : "não foi possível salvar. tente de novo.",
      );
      setOcupado(false);
    }
  }

  async function apagar() {
    if (
      !confirm(
        `apagar o clube ${clube.nome} para todos os membros? as fichas de leitura, os livros sugeridos e o calendário também serão apagados. essa ação não pode ser desfeita.`,
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
        titulo="informações do clube"
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
        {/* a aparência agora fica toda no club studio (o tema antigo continua salvo, sem mudar) */}
        <section aria-labelledby="t-aparencia">
          <p id="t-aparencia" className={rotuloCampo}>
            aparência do clube
          </p>
          <Link
            href={`/clubes/${clube.id}/studio`}
            className="mt-2 flex items-center justify-between gap-3 rounded-[6px] border border-linha px-4 py-3.5 hover:border-bordo lg:border-fio"
          >
            <span>
              <span className="block text-[15px] font-semibold text-ameixa">club studio</span>
              <span className="block text-[13px] text-tinta-suave">
                foto, capa, emblema, tema, cores, fontes, estantes e layout{lerIdentidade(clube.identidade) ? ` · tema ${temaDoId(lerIdentidade(clube.identidade)!.tema).nome}` : ""}
              </span>
            </span>
            <span className="text-[13px] font-semibold text-bordo">personalizar →</span>
          </Link>
        </section>
        <fieldset className="space-y-4">
          <legend className={rotuloCampo}>regras do clube</legend>
          <label className="flex items-center justify-between gap-4 text-sm">
            sugestões por membro, por mês
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
            máximo de membros
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
