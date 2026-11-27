"use client";

/**
 * O cadastro de livro do app — o MESMO em todo lugar (estante, sugerir no clube,
 * escolher o livro da vez): capa (foto ou achada na internet), título, autoria,
 * "completar com a internet", sinopse, páginas e gênero.
 * Não é um <form>: cada tela põe os próprios botões em volta.
 */
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { AjustarFoto } from "@/components/AjustarFoto";
import { CapaLivro } from "@/components/CapaLivro";
import { campo, rotuloCampo } from "@/components/clube/Pecas";
import type { LivroBusca } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { infoNaInternet } from "@/lib/fontes";
import { reduzirImagem } from "@/lib/imagem";
import { normalizar } from "@/lib/importar";

export const generos = [
  "romance",
  "suspense",
  "fantasia",
  "ficção científica",
  "não ficção",
  "poesia",
  "clássico",
  "drama",
  "terror",
  "biografia",
  "infantojuvenil",
  "quadrinhos",
];

export type DadosDoLivro = {
  titulo: string;
  autor: string;
  paginas: string;
  genero: string;
  capa: string | null;
  sinopse: string;
};

export const livroEmBranco = (titulo = ""): DadosDoLivro => ({
  titulo,
  autor: "",
  paginas: "",
  genero: "",
  capa: null,
  sinopse: "",
});

/** id de um livro cadastrado à mão */
export const idManual = (titulo: string) =>
  `manual-${normalizar(titulo).replace(/ /g, "-").slice(0, 40)}-${Date.now().toString(36)}`;

/** o livro cadastrado no formato da busca (para clubes e sugestões) */
export function comoLivroBusca(
  d: DadosDoLivro,
  id = idManual(d.titulo),
): LivroBusca {
  return {
    id,
    titulo: d.titulo.trim(),
    autor: d.autor.trim().toLowerCase() || "autoria desconhecida",
    paginas: Number(d.paginas) || undefined,
    genero: d.genero || undefined,
    sinopse: d.sinopse.trim() || undefined,
    capa: d.capa ?? undefined,
    cor: corDoLivro(id),
  };
}

type EstadoBusca = {
  estado: "procurando" | "pronto" | "nada" | "erro";
  fonte?: string;
  emIngles?: boolean;
  passos?: string[];
};

export function CamposDoLivro({
  dados,
  onMudar,
}: {
  dados: DadosDoLivro;
  onMudar: Dispatch<SetStateAction<DadosDoLivro>>;
}) {
  const arquivo = useRef<HTMLInputElement>(null);
  const [ajustar, setAjustar] = useState<string | null>(null);
  const [capasAchadas, setCapasAchadas] = useState<string[]>([]);
  const [busca, setBusca] = useState<EstadoBusca | null>(null);
  // o que a internet achou fica numa prévia: só entra no formulário se a pessoa aceitar
  const [achado, setAchado] = useState<Awaited<ReturnType<typeof infoNaInternet>> | null>(null);
  const [antes, setAntes] = useState<DadosDoLivro | null>(null);
  const mudar = (parte: Partial<DadosDoLivro>) =>
    onMudar((d) => ({ ...d, ...parte }));

  /** procura o livro (Google Books, BrasilAPI, Open Library, Wikipédia) e preenche o que estiver vazio */
  async function completarDaInternet() {
    if (dados.titulo.trim().length < 2) return setBusca({ estado: "erro" });
    setBusca({ estado: "procurando" });
    try {
      const r = await infoNaInternet(dados.titulo.trim(), dados.autor.trim());
      if (!r) return setBusca({ estado: "nada" });
      setAchado(r);
      setBusca({ estado: "pronto", fonte: r.fonte, emIngles: r.emIngles, passos: r.passos });
    } catch {
      setBusca({ estado: "erro" });
    }
  }

  function usarAchado() {
    const r = achado;
    if (!r) return;
    setAntes(dados);
    setCapasAchadas(r.capas);
    setAchado(null);
    {
      onMudar((d) => ({
        ...d,
        titulo: r.titulo || d.titulo,
        autor: d.autor.trim() ? d.autor : (r.autor?.toLowerCase() ?? d.autor),
        sinopse: d.sinopse.trim() ? d.sinopse : (r.sinopse ?? ""),
        paginas: d.paginas ? d.paginas : r.paginas ? String(r.paginas) : "",
        // a capa achada só entra se a pessoa ainda não pôs uma foto dela
        capa:
          r.capa && (!d.capa || !d.capa.startsWith("data:")) ? r.capa : d.capa,
      }));
    }
  }

  function desfazer() {
    if (antes) onMudar(antes);
    setAntes(null);
    setCapasAchadas([]);
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-4">
        <button
          type="button"
          onClick={() => arquivo.current?.click()}
          aria-label={
            dados.capa ? "trocar a foto da capa" : "adicionar foto da capa"
          }
          className="relative w-[96px] flex-none self-start"
        >
          <CapaLivro
            titulo={dados.titulo || "seu livro"}
            capa={dados.capa ?? undefined}
            cor={corDoLivro(dados.titulo || "novo")}
            className="w-full"
          />
          <span className="absolute inset-x-1 bottom-1 rounded-pill bg-creme/90 py-1 text-[10px] font-semibold text-bordo">
            {dados.capa ? "trocar ✎" : "+ capa"}
          </span>
        </button>
        <div className="min-w-0 flex-1 space-y-3">
          <label className="block">
            <span className={rotuloCampo}>título *</span>
            <input
              value={dados.titulo}
              onChange={(e) => mudar({ titulo: e.target.value })}
              maxLength={200}
              className={campo}
            />
          </label>
          <label className="block">
            <span className={rotuloCampo}>autoria</span>
            <input
              value={dados.autor}
              onChange={(e) => mudar({ autor: e.target.value })}
              maxLength={200}
              placeholder="nome da autora"
              className={campo}
            />
          </label>
        </div>
      </div>
      <input
        ref={arquivo}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) setAjustar(await reduzirImagem(f, 1600, 0.9));
        }}
      />

      <div className="rounded-md border border-dashed border-bege px-4 py-3">
        <button
          type="button"
          onClick={completarDaInternet}
          disabled={busca?.estado === "procurando"}
          className="flex min-h-11 items-center gap-2 text-[13px] font-semibold text-bordo disabled:opacity-60"
        >
          {busca?.estado === "procurando"
            ? "✦ procurando o livro…"
            : "✦ completar com a internet"}
        </button>
        {achado ? (
          <div className="mt-2 flex gap-3 rounded-[6px] border border-linha bg-creme-quente p-3">
            <CapaLivro titulo={achado.titulo || dados.titulo} capa={achado.capa ?? undefined} cor={corDoLivro(achado.titulo || dados.titulo)} className="w-[54px] flex-none" />
            <div className="min-w-0 flex-1">
              <p className="text-[12px] text-cinza">É este livro?</p>
              <p className="truncate font-revista text-[16px] text-ameixa italic">{achado.titulo || dados.titulo}</p>
              <p className="truncate text-[12px] text-tinta-suave">
                {[achado.autor, achado.paginas ? `${achado.paginas} páginas` : null].filter(Boolean).join(" · ")}
              </p>
              {achado.sinopse ? <p className="mt-1 line-clamp-2 text-[12px] text-cinza">{achado.sinopse}</p> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" onClick={usarAchado} className="h-9 rounded-[6px] bg-bordo px-3 text-[12px] font-semibold text-creme">
                  Usar esses dados
                </button>
                <button type="button" onClick={() => (setAchado(null), setBusca(null))} className="h-9 rounded-[6px] border border-bege px-3 text-[12px] font-semibold text-ameixa">
                  Não é esse
                </button>
              </div>
            </div>
          </div>
        ) : antes ? (
          <p className="mt-1 text-xs text-cinza">
            dados preenchidos com a internet.{" "}
            <button type="button" onClick={desfazer} className="font-semibold text-bordo underline underline-offset-2">
              desfazer
            </button>
          </p>
        ) : null}
        <p className="text-xs text-cinza">
          {achado
            ? "nada foi preenchido ainda: confira antes de usar."
            : busca?.estado === "pronto"
            ? `pronto! confira os dados antes de salvar.${
                busca.fonte
                  ? ` (sinopse: ${busca.fonte}${busca.emIngles ? ", só achei em inglês" : ""})`
                  : " não achei sinopse."
              }`
            : busca?.estado === "nada"
              ? "não achei esse livro. confira o título e a autoria, ou preencha à mão."
              : busca?.estado === "erro"
                ? dados.titulo.trim().length < 2
                  ? "escreva o título primeiro."
                  : "sem conexão agora. tente de novo."
                : "procura a edição brasileira e preenche sinopse, páginas e capa."}
        </p>
        {busca?.passos?.length ? (
          <details className="mt-1.5 text-[11px] text-cinza">
            <summary className="cursor-pointer select-none">
              ver onde procurei
            </summary>
            <ul className="mt-1 list-disc space-y-0.5 pl-4">
              {busca.passos.map((p) => (
                <li
                  key={p}
                  className={
                    p.startsWith("⚠") ? "font-semibold text-bordo" : ""
                  }
                >
                  {p}
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>

      {capasAchadas.length ? (
        <div>
          <p className={rotuloCampo}>capas achadas · toque para escolher</p>
          <ul className="-mx-1 mt-2 flex gap-2.5 overflow-x-auto px-1 pb-1">
            {capasAchadas.map((u) => (
              <li key={u} className="flex-none">
                <button
                  type="button"
                  aria-pressed={dados.capa === u}
                  aria-label="usar esta capa"
                  onClick={() => mudar({ capa: u })}
                  className={`block w-[62px] overflow-hidden rounded-[5px] border-2 ${
                    dados.capa === u ? "border-bordo" : "border-transparent"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u}
                    alt=""
                    className="aspect-[2/3] w-full object-cover"
                    loading="lazy"
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <label className="block">
        <span className={rotuloCampo}>sinopse</span>
        <textarea
          value={dados.sinopse}
          onChange={(e) => mudar({ sinopse: e.target.value })}
          maxLength={1200}
          rows={4}
          placeholder="sobre o que é o livro (opcional)"
          className={`${campo} resize-none`}
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={rotuloCampo}>páginas</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={20000}
            value={dados.paginas}
            onChange={(e) => mudar({ paginas: e.target.value })}
            className={campo}
          />
        </label>
        <label className="block">
          <span className={rotuloCampo}>gênero</span>
          <select
            value={dados.genero}
            onChange={(e) => mudar({ genero: e.target.value })}
            className={`${campo} min-h-[50px]`}
          >
            <option value="">—</option>
            {generos.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
      </div>

      {ajustar ? (
        <AjustarFoto
          src={ajustar}
          formato="livro"
          onCancelar={() => setAjustar(null)}
          onPronto={(v) => {
            mudar({ capa: v });
            setAjustar(null);
          }}
        />
      ) : null}
    </div>
  );
}
