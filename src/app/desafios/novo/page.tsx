"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ComConta } from "@/components/social/Estados";
import { Voltar } from "@/components/Voltar";
import { meusClubes } from "@/lib/clubes";
import {
  criarDesafio,
  diaHoje,
  modelos,
  somarDias,
  unidade,
  type TipoDesafio,
} from "@/lib/desafios";
import { useConsulta } from "@/lib/social";

const tipos: { id: TipoDesafio; nome: string; ajuda: string }[] = [
  {
    id: "livros",
    nome: "livros terminados",
    ajuda: "conta os livros que você marcar como lidos no período",
  },
  {
    id: "paginas",
    nome: "páginas lidas",
    ajuda: "páginas dos livros terminados + as do modo foco",
  },
  { id: "minutos", nome: "minutos de leitura", ajuda: "o tempo no modo foco" },
  {
    id: "dias",
    nome: "dias lendo",
    ajuda: "dias diferentes com leitura no modo foco",
  },
  {
    id: "pilha",
    nome: "zerar a pilha",
    ajuda: "livros que já estavam no quero ler antes de começar",
  },
  {
    id: "bingo",
    nome: "bingo literário",
    ajuda: "as 9 casas do bingo (a meta é 9)",
  },
];

function Formulario() {
  const router = useRouter();
  const params = useSearchParams();
  const modelo = modelos.find((m) => m.id === params.get("modelo"));
  const [titulo, setTitulo] = useState(modelo?.titulo ?? "");
  const [tipo, setTipo] = useState<TipoDesafio>(modelo?.tipo ?? "livros");
  const [meta, setMeta] = useState(String(modelo?.meta ?? 5));
  const [inicio, setInicio] = useState(diaHoje());
  const [fim, setFim] = useState(
    somarDias(diaHoje(), (modelo?.dias ?? 30) - 1),
  );
  const [com, setCom] = useState<"sozinha" | "amigos" | "clube">("sozinha");
  const [clubeId, setClubeId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const clubes = useConsulta(() => meusClubes(), []);

  const metaN =
    tipo === "bingo" ? 9 : Math.max(1, Math.round(Number(meta) || 0));
  const valido =
    titulo.trim() && metaN > 0 && fim >= inicio && (com !== "clube" || clubeId);

  async function criar() {
    if (!valido) return;
    setEnviando(true);
    setErro(null);
    try {
      const id = await criarDesafio({
        titulo: titulo.trim(),
        tipo,
        meta: metaN,
        inicio,
        fim,
        modelo: modelo?.id,
        comAmigos: com === "amigos",
        clubeId: com === "clube" ? clubeId : null,
      });
      router.push(`/desafios/${id}`);
    } catch (x) {
      const e = x as { code?: string };
      setErro(
        e?.code === "42P01" || e?.code === "PGRST205"
          ? "o banco ainda não tem os desafios: rode de novo o arquivo supabase/social.sql no SQL Editor do Supabase."
          : "não deu para criar agora. tente de novo.",
      );
      setEnviando(false);
    }
  }

  const rotulo =
    "mb-1.5 block text-[11px] font-semibold tracking-[.12em] text-bordo uppercase";
  const campo =
    "h-12 w-full rounded-[12px] border border-bege bg-creme-quente px-4 text-[15px] outline-none focus:border-bordo lg:rounded-[4px]";
  const pilula = (on: boolean) =>
    `flex min-h-10 items-center rounded-pill border px-4 text-[13px] font-semibold ${
      on
        ? "border-bordo bg-bordo text-creme"
        : "border-bege bg-creme-quente text-ameixa"
    }`;

  return (
    <div className="space-y-6">
      {modelo ? (
        <div
          className="rounded-xl p-5 text-creme lg:rounded-[6px]"
          style={{
            background: `linear-gradient(150deg, ${modelo.cor}, ${modelo.cor}cc)`,
          }}
        >
          <span className="text-3xl">{modelo.emoji}</span>
          <p className="mt-2 text-[14px] opacity-90">{modelo.descricao}</p>
        </div>
      ) : null}

      <label className="block">
        <span className={rotulo}>nome do desafio</span>
        <input
          value={titulo}
          onChange={(e) => setTitulo(e.target.value.slice(0, 80))}
          className={campo}
          placeholder="ex.: férias com livro"
        />
      </label>

      {!modelo ? (
        <fieldset>
          <legend className={rotulo}>o que conta</legend>
          <div className="mt-1 grid gap-2 sm:grid-cols-2">
            {tipos.map((t) => (
              <label
                key={t.id}
                className={`flex cursor-pointer gap-3 rounded-[12px] border p-3 lg:rounded-[4px] ${tipo === t.id ? "border-bordo bg-rosa-fundo/50" : "border-linha bg-creme-quente"}`}
              >
                <input
                  type="radio"
                  name="tipo"
                  checked={tipo === t.id}
                  onChange={() => setTipo(t.id)}
                  className="mt-1 accent-bordo"
                />
                <span>
                  <span className="block text-sm font-semibold">{t.nome}</span>
                  <span className="block text-xs text-cinza">{t.ajuda}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={rotulo}>meta ({unidade[tipo][1]})</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            value={tipo === "bingo" ? "9" : meta}
            disabled={tipo === "bingo"}
            onChange={(e) => setMeta(e.target.value)}
            className={campo}
          />
        </label>
        <label className="block">
          <span className={rotulo}>começa</span>
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className={campo}
          />
        </label>
        <label className="block">
          <span className={rotulo}>termina</span>
          <input
            type="date"
            value={fim}
            min={inicio}
            onChange={(e) => setFim(e.target.value)}
            className={campo}
          />
        </label>
      </div>

      <fieldset>
        <legend className={rotulo}>com quem</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCom("sozinha")}
            className={pilula(com === "sozinha")}
          >
            só eu
          </button>
          <button
            type="button"
            onClick={() => setCom("amigos")}
            className={pilula(com === "amigos")}
          >
            com amigos (código de convite)
          </button>
          {clubes.dados?.length ? (
            <button
              type="button"
              onClick={() => setCom("clube")}
              className={pilula(com === "clube")}
            >
              com um clube
            </button>
          ) : null}
        </div>
        {com === "clube" ? (
          <select
            value={clubeId}
            onChange={(e) => setClubeId(e.target.value)}
            className={`${campo} mt-3 max-w-[420px]`}
          >
            <option value="">escolha o clube</option>
            {(clubes.dados ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        ) : null}
        <p className="mt-2 text-xs text-cinza">
          {com === "amigos"
            ? "depois de criar, você recebe um código e um link para mandar."
            : com === "clube"
              ? "todo mundo do clube vê o desafio e pode entrar."
              : "você pode chamar alguém depois, se quiser."}
        </p>
      </fieldset>

      {erro ? (
        <p role="alert" className="text-[13px] text-bordo">
          {erro}
        </p>
      ) : null}
      <button
        type="button"
        onClick={criar}
        disabled={!valido || enviando}
        className="h-12 w-full rounded-pill bg-bordo px-10 text-sm font-semibold text-creme hover:bg-bordo-suave disabled:opacity-45 sm:w-auto"
      >
        {enviando ? "criando…" : "começar o desafio ✦"}
      </button>
    </div>
  );
}

export default function NovoDesafioPage() {
  return (
    <AppShell aba="perfil">
      <div className="flex flex-1 flex-col px-6 pt-2 pb-10 lg:bg-jornal lg:px-12 lg:pt-8">
        <div className="w-full max-w-[720px]">
          <Voltar
            padrao="/desafios"
            rotulo="desafios"
            className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo"
          />
          <h1 className="mt-1 mb-6 font-display text-[30px] leading-[1.1] font-semibold italic text-bordo lg:font-revista lg:text-[40px] lg:font-normal lg:text-tinta">
            novo desafio
          </h1>
          <ComConta>
            <Suspense fallback={null}>
              <Formulario />
            </Suspense>
          </ComConta>
        </div>
      </div>
    </AppShell>
  );
}
