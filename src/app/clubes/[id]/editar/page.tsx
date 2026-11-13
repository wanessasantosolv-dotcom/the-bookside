"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { CampoCapa } from "@/components/clube/CampoCapa";
import { useClube } from "@/components/clube/ClubeContexto";
import { botaoPrincipal, campo, Rodape, rotuloCampo, TopoForm } from "@/components/clube/Pecas";
import { Vazio } from "@/components/social/Estados";
import { apagarClube, editarClube } from "@/lib/clubes";

export default function EditarClubePage() {
  const { clube, membros, papel, recarregar } = useClube();
  const router = useRouter();
  const [nome, setNome] = useState(clube.nome);
  const [descricao, setDescricao] = useState(clube.descricao ?? "");
  const [capa, setCapa] = useState<string | null>(clube.capa);
  const [limite, setLimite] = useState<string>(clube.limite_sugestoes ? String(clube.limite_sugestoes) : "");
  const [maximo, setMaximo] = useState<string>(clube.max_membros ? String(clube.max_membros) : "");
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
        limite_sugestoes: limite ? Number(limite) : null,
        max_membros: maximo ? Math.max(Number(maximo), membros.length) : null,
      });
      recarregar();
      router.push(`/clubes/${clube.id}`);
    } catch {
      setErro("não deu para salvar. tente de novo.");
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

  const linha = "flex min-h-[52px] items-center justify-between border-b border-linha text-sm lg:border-fio";

  return (
    <form onSubmit={salvar} className="flex min-h-[70dvh] flex-col">
      <TopoForm voltar={{ href: `/clubes/${clube.id}`, r: "cancelar" }} rotulo="editar clube" titulo="sobre o clube" />
      <div className="mt-6 space-y-6 px-6 lg:max-w-[560px] lg:px-0">
        <label className="block">
          <span className={rotuloCampo}>nome</span>
          <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={60} required className={campo} />
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
        <CampoCapa valor={capa} onMudar={setCapa} />
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
        </fieldset>
        <div className="border-t border-linha lg:border-fio">
          <Link href={`/clubes/${clube.id}/convidar`} className={linha}>
            membros e papéis <span className="text-cinza">{membros.length} ›</span>
          </Link>
          <Link href={`/clubes/${clube.id}/leitura`} className={linha}>
            leitura e prazos <span className="text-cinza">›</span>
          </Link>
          <button type="button" onClick={apagar} className={`${linha} w-full text-bordo`}>
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
        <button type="submit" disabled={ocupado} className={`${botaoPrincipal} lg:max-w-[560px]`}>
          {ocupado ? "salvando…" : "salvar alterações"}
        </button>
      </Rodape>
    </form>
  );
}
