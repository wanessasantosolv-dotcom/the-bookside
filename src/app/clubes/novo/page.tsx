"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { CampoCapa } from "@/components/clube/CampoCapa";
import { botaoPrincipal, campo, Rodape, rotuloCampo, TopoForm } from "@/components/clube/Pecas";
import { ComConta, faltaTabela } from "@/components/social/Estados";
import { criarClube } from "@/lib/clubes";

function Formulario() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [capa, setCapa] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function criar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return setErro("dê um nome para o clube.");
    setEnviando(true);
    setErro(null);
    try {
      const id = await criarClube(nome, descricao, capa);
      router.push(`/clubes/${id}/convidar?novo=1`);
    } catch (x) {
      setErro(
        faltaTabela(x)
          ? "falta criar as tabelas de clubes no Supabase (supabase/social.sql)."
          : "não deu para criar agora. tente de novo.",
      );
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={criar} className="flex flex-1 flex-col">
      <div className="mt-7 space-y-6 px-6 lg:max-w-[560px] lg:px-0">
        <label className="block">
          <span className={rotuloCampo}>nome do clube</span>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={60}
            placeholder="dois amores"
            className={campo}
            required
          />
        </label>
        <label className="block">
          <span className={rotuloCampo}>descrição</span>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            maxLength={280}
            rows={2}
            placeholder="a gente lê com calma e se conta tudo depois ♡"
            className={`${campo} resize-none font-accent italic`}
          />
        </label>
        <CampoCapa valor={capa} onMudar={setCapa} />
        {erro ? (
          <p role="alert" className="text-[13px] text-bordo">
            {erro}
          </p>
        ) : null}
      </div>
      <Rodape>
        <button type="submit" disabled={enviando} className={`${botaoPrincipal} lg:max-w-[560px]`}>
          {enviando ? "criando…" : "criar clube ✧"}
        </button>
      </Rodape>
    </form>
  );
}

export default function NovoClubePage() {
  return (
    <AppShell aba="clubes">
      <div className="flex flex-1 flex-col lg:bg-jornal lg:px-12 lg:py-8">
        <TopoForm
          voltar={{ href: "/clubes", r: "clubes" }}
          rotulo="novo clube"
          titulo="criar um clube"
          frase="ele começa com você ✦"
        />
        <ComConta>
          <Formulario />
        </ComConta>
      </div>
    </AppShell>
  );
}
