"use client";

import { infoNaInternet } from "@/lib/fontes";
import { Voltar } from "@/components/Voltar";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState, type FormEvent } from "react";
import { AjustarFoto } from "@/components/AjustarFoto";
import { TelaApp } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { botaoPrincipal, campo, rotuloCampo } from "@/components/clube/Pecas";
import { corDoLivro } from "@/lib/cores";
import { reduzirImagem } from "@/lib/imagem";
import { normalizar } from "@/lib/importar";
import { usePerfil, type StatusLivro } from "@/lib/perfil-store";

const generos = [
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
const notas = [0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
const hoje = () => new Date().toISOString().slice(0, 10);

/** Cadastrar um livro que a busca não achou: título, autoria, páginas, gênero, capa e estante. */
function Cadastro() {
  const router = useRouter();
  const params = useSearchParams();
  const editarLivro = usePerfil((s) => s.editarLivro);
  const livros = usePerfil((s) => s.livros);
  const [titulo, setTitulo] = useState(params.get("titulo") ?? "");
  const [autor, setAutor] = useState("");
  const [paginas, setPaginas] = useState("");
  const [genero, setGenero] = useState("");
  const [capa, setCapa] = useState<string | null>(null);
  const [ajustar, setAjustar] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusLivro>("quero");
  const [lidoEm, setLidoEm] = useState(hoje());
  const [nota, setNota] = useState(0);
  const [erro, setErro] = useState<string | null>(null);
  const [sinopse, setSinopse] = useState("");
  /** capas achadas na internet, para escolher */
  const [capasAchadas, setCapasAchadas] = useState<string[]>([]);
  const [ia, setIa] = useState<{
    estado: "procurando" | "pronto" | "nada" | "erro";
    fonte?: string;
    emIngles?: boolean;
  } | null>(null);

  /** procura o livro (Google Books, BrasilAPI, Open Library, Wikipédia) e preenche o que estiver vazio */
  async function completarDaInternet() {
    if (titulo.trim().length < 2) return setIa({ estado: "erro" });
    setIa({ estado: "procurando" });
    try {
      const r = await infoNaInternet(titulo.trim(), autor.trim());
      if (!r) return setIa({ estado: "nada" });
      if (r.titulo) setTitulo(r.titulo);
      if (r.autor && !autor.trim()) setAutor(r.autor.toLowerCase());
      if (r.sinopse && !sinopse.trim()) setSinopse(r.sinopse);
      if (r.paginas && !paginas) setPaginas(String(r.paginas));
      setCapasAchadas(r.capas);
      // a capa achada só entra se a pessoa ainda não pôs uma foto dela
      if (r.capa && (!capa || capasAchadas.includes(capa))) setCapa(r.capa);
      setIa({ estado: "pronto", fonte: r.fonte, emIngles: r.emIngles });
    } catch {
      setIa({ estado: "erro" });
    }
  }
  const arquivo = useRef<HTMLInputElement>(null);
  const voltar = params.get("volta") || "/buscar";

  function salvar(e: FormEvent) {
    e.preventDefault();
    const t = titulo.trim();
    if (!t) return setErro("escreva o título do livro.");
    const repetido = livros.find((l) => normalizar(l.titulo) === normalizar(t));
    if (
      repetido &&
      !confirm(
        `"${repetido.titulo}" já está na sua estante. cadastrar mesmo assim?`,
      )
    )
      return;
    const id = `manual-${normalizar(t).replace(/ /g, "-").slice(0, 40)}-${Date.now().toString(36)}`;
    const pags = Number(paginas) || undefined;
    const agora = new Date().toISOString();
    editarLivro(
      {
        id,
        titulo: t,
        autor: autor.trim().toLowerCase() || "autoria desconhecida",
        capa: capa ?? undefined,
        genero: genero || undefined,
      },
      {
        status,
        paginas: pags,
        sinopse: sinopse.trim() || undefined,
        capaEscolhida: capa ? true : undefined,
        ...(status === "lendo" ? { iniciadoEm: agora } : {}),
        ...(status === "lido"
          ? {
              lidoEm: new Date(`${lidoEm}T12:00:00`).toISOString(),
              paginaAtual: pags,
              nota: nota || undefined,
            }
          : {}),
      },
    );
    router.push(`/livro/${id}`);
  }

  const pilula = (on: boolean) =>
    `flex min-h-10 items-center rounded-pill px-4 text-[13px] font-semibold ${on ? "bg-bordo text-creme" : "border border-bege text-ameixa"}`;

  return (
    <form onSubmit={salvar} className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 pt-2 lg:px-0">
        <Voltar
          padrao={voltar}
          rotulo="voltar"
          className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo"
        />
        <span className="text-[11px] font-semibold tracking-[.16em] text-bordo uppercase">
          novo livro
        </span>
      </header>
      <h1 className="mt-3 px-6 font-display text-[32px] leading-[1.1] font-semibold italic text-bordo lg:px-0 lg:font-revista lg:text-[38px] lg:font-normal lg:text-tinta">
        cadastrar um livro
      </h1>
      <p className="mt-1.5 px-6 font-accent text-sm italic text-cinza lg:px-0">
        não achou na busca? coloque ele na estante do seu jeito ✦
      </p>

      <div className="mt-6 flex-1 space-y-5 px-6 pb-6 lg:px-0">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => arquivo.current?.click()}
            aria-label={
              capa ? "trocar a foto da capa" : "adicionar foto da capa"
            }
            className="relative w-[96px] flex-none"
          >
            <CapaLivro
              titulo={titulo || "seu livro"}
              capa={capa ?? undefined}
              cor={corDoLivro(titulo || "novo")}
              className="w-full"
            />
            <span className="absolute inset-x-1 bottom-1 rounded-pill bg-creme/90 py-1 text-[10px] font-semibold text-bordo">
              {capa ? "trocar ✎" : "+ capa"}
            </span>
          </button>
          <div className="min-w-0 flex-1 space-y-3">
            <label className="block">
              <span className={rotuloCampo}>título *</span>
              <input
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                required
                maxLength={200}
                className={campo}
              />
            </label>
            <label className="block">
              <span className={rotuloCampo}>autoria</span>
              <input
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
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
            disabled={ia?.estado === "procurando"}
            className="flex min-h-10 items-center gap-2 text-[13px] font-semibold text-bordo disabled:opacity-60"
          >
            {ia?.estado === "procurando"
              ? "✦ procurando o livro…"
              : "✦ completar com a internet"}
          </button>
          <p className="text-xs text-cinza">
            {ia?.estado === "pronto"
              ? `pronto! confira os dados antes de salvar.${ia.fonte ? ` (sinopse: ${ia.fonte}${ia.emIngles ? ", só achei em inglês" : ""})` : " não achei sinopse."}`
              : ia?.estado === "nada"
                ? "não achei esse livro. confira o título e a autoria, ou preencha à mão."
                : ia?.estado === "erro"
                  ? titulo.trim().length < 2
                    ? "escreva o título primeiro."
                    : "sem conexão agora. tente de novo."
                  : "procura o livro no Google Books, BrasilAPI, Open Library e Wikipédia, de preferência a edição brasileira, e preenche sinopse, páginas e capa."}
          </p>
        </div>

        {capasAchadas.length ? (
          <div>
            <p className={rotuloCampo}>capas achadas · toque para escolher</p>
            <ul className="-mx-1 mt-2 flex gap-2.5 overflow-x-auto px-1 pb-1">
              {capasAchadas.map((u) => (
                <li key={u} className="flex-none">
                  <button
                    type="button"
                    aria-pressed={capa === u}
                    aria-label="usar esta capa"
                    onClick={() => setCapa(u)}
                    className={`block w-[62px] overflow-hidden rounded-[3px] border-2 ${capa === u ? "border-bordo" : "border-transparent"}`}
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
            value={sinopse}
            onChange={(e) => setSinopse(e.target.value)}
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
              value={paginas}
              onChange={(e) => setPaginas(e.target.value)}
              className={campo}
            />
          </label>
          <label className="block">
            <span className={rotuloCampo}>gênero</span>
            <select
              value={genero}
              onChange={(e) => setGenero(e.target.value)}
              className={`${campo} min-h-[50px]`}
            >
              <option value="">—</option>
              {generos.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
        </div>

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

        {status === "lido" ? (
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={rotuloCampo}>terminei em</span>
              <input
                type="date"
                value={lidoEm}
                max={hoje()}
                onChange={(e) => setLidoEm(e.target.value)}
                className={campo}
              />
            </label>
            <label className="block">
              <span className={rotuloCampo}>nota</span>
              <select
                value={nota}
                onChange={(e) => setNota(Number(e.target.value))}
                className={`${campo} min-h-[50px]`}
              >
                {notas.map((n) => (
                  <option key={n} value={n}>
                    {n
                      ? `${"★".repeat(Math.floor(n))}${n % 1 ? "½" : ""} (${String(n).replace(".", ",")})`
                      : "sem nota"}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ) : null}

        {erro ? (
          <p role="alert" className="text-[13px] text-bordo">
            {erro}
          </p>
        ) : null}
      </div>

      <div className="sticky bottom-0 bg-gradient-to-t from-creme via-creme to-creme/0 px-6 pt-5 pb-[max(20px,env(safe-area-inset-bottom))] lg:static lg:bg-none lg:px-0">
        <button type="submit" className={`${botaoPrincipal} w-full`}>
          colocar na estante
        </button>
      </div>

      {ajustar ? (
        <AjustarFoto
          src={ajustar}
          formato="livro"
          onCancelar={() => setAjustar(null)}
          onPronto={(v) => {
            setCapa(v);
            setAjustar(null);
          }}
        />
      ) : null}
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
