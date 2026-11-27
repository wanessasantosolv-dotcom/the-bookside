"use client";

import { diaLocal } from "@/lib/datas";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { SeletorFormato } from "@/components/SeletorFormato";
import { TelaApp } from "@/components/AppShell";
import {
  CamposDoLivro,
  comoLivroBusca,
  livroEmBranco,
  type DadosDoLivro,
} from "@/components/CadastroLivro";
import {
  botaoPrincipal,
  campo,
  EstrelasInput,
  Rodape,
  rotuloCampo,
  TopoForm,
} from "@/components/clube/Pecas";
import { normalizar } from "@/lib/importar";
import {
  usePerfil,
  type StatusLivro,
  type FormatoLivro,
} from "@/lib/perfil-store";

const hoje = () => diaLocal();

/** Cadastrar um livro que a busca não achou: o cadastro de livro do app + em qual estante. */
function Cadastro() {
  const router = useRouter();
  const params = useSearchParams();
  const editarLivro = usePerfil((s) => s.editarLivro);
  const livros = usePerfil((s) => s.livros);
  const [dados, setDados] = useState<DadosDoLivro>(
    livroEmBranco(params.get("titulo") ?? ""),
  );
  const [status, setStatus] = useState<StatusLivro>("quero");
  const [lidoEm, setLidoEm] = useState(hoje());
  // "só sei o ano" e "sem data"
  const [quando, setQuando] = useState<"dia" | "ano" | "sem">("dia");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [nota, setNota] = useState(0);
  const [formato, setFormato] = useState<FormatoLivro | undefined>();
  const [erro, setErro] = useState<string | null>(null);
  const voltar = params.get("volta") || "/buscar";

  function salvar(e: FormEvent) {
    e.preventDefault();
    const t = dados.titulo.trim();
    if (!t) return setErro("escreva o título do livro.");
    const repetido = livros.find((l) => normalizar(l.titulo) === normalizar(t));
    if (
      repetido &&
      !confirm(
        `"${repetido.titulo}" já está na sua estante. cadastrar mesmo assim?`,
      )
    )
      return;
    const l = comoLivroBusca(dados);
    const agora = new Date().toISOString();
    editarLivro(
      {
        id: l.id,
        titulo: l.titulo,
        autor: l.autor,
        capa: l.capa,
        genero: l.genero,
      },
      {
        status,
        formato,
        paginas: l.paginas,
        sinopse: l.sinopse,
        capaEscolhida: l.capa ? true : undefined,
        ...(status === "lendo" ? { iniciadoEm: agora } : {}),
        ...(status === "lido"
          ? {
              lidoEm: quando === "sem" ? undefined : new Date(quando === "ano" ? `${ano}-01-01T12:00:00` : `${lidoEm}T12:00:00`).toISOString(),
              lidoSoAno: quando === "ano" || undefined,
              paginaAtual: l.paginas,
              nota: nota || undefined,
            }
          : {}),
      },
    );
    router.push(`/livro/${l.id}`);
  }

  const pilula = (on: boolean) =>
    `flex min-h-10 items-center rounded-pill px-4 text-[13px] font-semibold ${
      on ? "bg-bordo text-creme" : "border border-bege text-ameixa"
    }`;

  return (
    <form onSubmit={salvar} className="flex flex-1 flex-col">
      <TopoForm
        voltar={{ href: voltar, r: "voltar" }}
        rotulo="novo livro"
        titulo="cadastrar um livro"
        frase="não achou na busca? coloque ele na estante do seu jeito ✦"
      />
      <div className="mt-6 flex-1 space-y-5 px-6 pb-6 lg:px-0">
        <CamposDoLivro dados={dados} onMudar={setDados} />

        <fieldset>
          <legend className={rotuloCampo}>em qual estante?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["quero", "quero ler ♡"],
                ["lendo", "lendo"],
                ["lido", "já li ✓"],
              ] as [StatusLivro, string][]
            ).map(([s, r]) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={pilula(status === s)}
              >
                {r}
              </button>
            ))}
          </div>
        </fieldset>

        {status !== "quero" ? (
          <SeletorFormato valor={formato} onChange={setFormato} />
        ) : null}

        {status === "lido" ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["dia", "sei a data"],
                  ["ano", "só sei o ano"],
                  ["sem", "sem data"],
                ] as const
              ).map(([id, nome]) => (
                <button key={id} type="button" aria-pressed={quando === id} onClick={() => setQuando(id)} className={pilula(quando === id)}>
                  {nome}
                </button>
              ))}
            </div>
            {quando === "dia" ? (
              <label className="block min-w-0">
                <span className={rotuloCampo}>terminei em</span>
                <input
                  type="date"
                  value={lidoEm}
                  max={hoje()}
                  onChange={(e) => setLidoEm(e.target.value)}
                  className={`${campo} block w-full max-w-full min-w-0 appearance-none`}
                />
              </label>
            ) : quando === "ano" ? (
              <label className="block">
                <span className={rotuloCampo}>li em (ano)</span>
                <input type="number" inputMode="numeric" min={1900} max={new Date().getFullYear()} value={ano} onChange={(e) => setAno(Number(e.target.value) || ano)} className={campo} />
              </label>
            ) : (
              <p className="text-[12px] text-cinza">o livro entra nos lidos sem contar em nenhum mês nem na meta. dá para pôr a data depois.</p>
            )}
            <div>
              <p className={rotuloCampo}>sua nota</p>
              <EstrelasInput valor={nota} onMudar={setNota} rotulo="sua nota" />
            </div>
          </div>
        ) : null}

        {erro ? (
          <p role="alert" className="text-[13px] text-bordo">
            {erro}
          </p>
        ) : null}
      </div>
      <Rodape>
        <button type="submit" className={botaoPrincipal}>
          colocar na estante
        </button>
      </Rodape>
    </form>
  );
}

export default function NovoLivroPage() {
  return (
    <TelaApp aba="estantes">
      <Suspense>
        <Cadastro />
      </Suspense>
    </TelaApp>
  );
}
