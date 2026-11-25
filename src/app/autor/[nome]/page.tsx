"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CapaLivro } from "@/components/CapaLivro";
import { Voltar } from "@/components/Voltar";
import { useHidratado } from "@/components/PerfilHidratacao";
import {
  autoriaPorNome,
  livrosDaAutoria,
  type Autoria,
} from "@/lib/autores";
import { chaveTitulo, type LivroBusca } from "@/lib/catalogo";
import { corDoLivro } from "@/lib/cores";
import { estrelas } from "@/lib/estantes";
import { usePerfil, type LivroSalvo } from "@/lib/perfil-store";

const rotuloStatus: Record<string, string> = {
  lido: "lido",
  lendo: "lendo",
  quero: "quero ler",
  pausado: "pausado",
  abandonado: "abandonado",
};

/** "Maria José Silva" a partir de "maria josé silva" (para o título) */
const minusculas = new Set(["de", "da", "do", "das", "dos", "e", "van", "von", "y"]);
const nomeBonito = (n: string) =>
  n
    .split(" ")
    .map((p, i) =>
      i && minusculas.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1),
    )
    .join(" ");

function Foto({ a, nome }: { a: Autoria | null | undefined; nome: string }) {
  const [quebrou, setQuebrou] = useState(false);
  const letra = nome.slice(0, 1).toLowerCase();
  return (
    <div className="size-[120px] flex-none overflow-hidden rounded-full border-4 border-creme bg-rosa-fundo shadow-[0_14px_30px_-16px_rgba(43,20,32,.5)] lg:size-[168px]">
      {a?.foto && !quebrou ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={a.foto}
          alt={`foto de ${nome}`}
          onError={() => setQuebrou(true)}
          className="size-full object-cover object-[50%_25%]"
        />
      ) : (
        <span className="flex size-full items-center justify-center font-display text-5xl font-semibold italic text-bordo">
          {a === undefined ? "" : letra}
        </span>
      )}
    </div>
  );
}

function Conteudo({ nome }: { nome: string }) {
  const meus = usePerfil((s) => s.livros);
  const [autoria, setAutoria] = useState<Autoria | null | undefined>(undefined);
  const [livros, setLivros] = useState<LivroBusca[] | null>(null);
  const [bioAberta, setBioAberta] = useState(false);

  useEffect(() => {
    let vivo = true;
    setAutoria(undefined);
    setLivros(null);
    autoriaPorNome(nome)
      .then((a) => vivo && setAutoria(a))
      .catch(() => vivo && setAutoria(null));
    livrosDaAutoria(nome)
      .then((l) => vivo && setLivros(l))
      .catch(() => vivo && setLivros([]));
    return () => {
      vivo = false;
    };
  }, [nome]);

  const alvo = chaveTitulo(nome);
  const naEstante: LivroSalvo[] = meus.filter((l) => {
    const a = chaveTitulo(l.autor);
    return a === alvo || (alvo.length > 4 && (a.includes(alvo) || alvo.includes(a)));
  });
  const titulosMeus = new Set(naEstante.map((l) => chaveTitulo(l.titulo)));
  const outros = (livros ?? []).filter(
    (l) => !titulosMeus.has(chaveTitulo(l.titulo)),
  );
  const lidos = naEstante.filter((l) => l.status === "lido");
  const notas = lidos.map((l) => l.nota).filter((n): n is number => !!n);
  const media = notas.length
    ? notas.reduce((t, n) => t + n, 0) / notas.length
    : null;
  const titulo = nomeBonito(nome);
  const datas =
    autoria?.nascimento || autoria?.morte
      ? `${autoria?.nascimento ?? "?"}${autoria?.morte ? ` – ${autoria.morte}` : ""}`
      : null;

  return (
    <>
      <section className="flex flex-col items-center gap-5 px-6 pt-4 text-center lg:flex-row lg:items-start lg:gap-10 lg:px-0 lg:pt-2 lg:text-left">
        <Foto a={autoria} nome={nome} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">
            autoria
            {datas ? ` · ${datas}` : ""}
          </p>
          <h1 className="mt-1 font-display text-[34px] leading-[1.05] font-semibold italic text-bordo lg:font-revista lg:text-[48px] lg:font-normal lg:text-tinta">
            {titulo}
          </h1>
          {autoria?.descricao ? (
            <p className="mt-1.5 font-accent text-[15px] italic text-cinza">
              {autoria.descricao}
            </p>
          ) : null}
          {naEstante.length ? (
            <p className="mt-3 text-[13px] text-ameixa">
              <b className="font-semibold">{naEstante.length}</b>{" "}
              {naEstante.length === 1 ? "livro" : "livros"} na sua estante
              {lidos.length ? ` · ${lidos.length} lidos` : ""}
              {media ? (
                <span className="ml-1.5 text-bordo">
                  · sua média {media.toFixed(1).replace(".", ",")} ★
                </span>
              ) : null}
            </p>
          ) : null}

          {autoria === undefined ? (
            <div aria-hidden className="mt-4 space-y-2">
              <span className="block h-3 w-full animate-pulse rounded bg-linha/70" />
              <span className="block h-3 w-5/6 animate-pulse rounded bg-linha/70" />
              <span className="block h-3 w-2/3 animate-pulse rounded bg-linha/60" />
            </div>
          ) : autoria?.bio ? (
            <div className="mt-4 text-left">
              <p
                className={`text-[14px] leading-[1.65] text-tinta-suave ${bioAberta ? "" : "line-clamp-5"}`}
              >
                {autoria.bio}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-x-4">
                {autoria.bio.length > 320 ? (
                  <button
                    type="button"
                    onClick={() => setBioAberta((v) => !v)}
                    className="min-h-9 text-xs font-semibold text-bordo underline underline-offset-4"
                  >
                    {bioAberta ? "mostrar menos" : "ler a biografia toda"}
                  </button>
                ) : null}
                {autoria.link ? (
                  <a
                    href={autoria.link}
                    target="_blank"
                    rel="noreferrer"
                    className="min-h-9 py-2 text-xs font-semibold text-cinza underline underline-offset-4 hover:text-bordo"
                  >
                    na wikipédia ↗
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <p className="mt-4 font-accent text-sm italic text-cinza">
              ainda não achamos a biografia dessa autoria.
            </p>
          )}
        </div>
      </section>

      {naEstante.length ? (
        <section className="mt-9 px-6 lg:px-0">
          <h2 className="font-display text-[22px] font-semibold italic text-bordo lg:font-revista lg:text-[26px] lg:font-normal lg:text-tinta">
            na sua estante
          </h2>
          <ul className="mt-3 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
            {naEstante.map((l) => (
              <li key={l.id}>
                <Link href={`/livro/${l.id}`} className="block">
                  <CapaLivro
                    titulo={l.titulo}
                    capa={l.capa}
                    cor={corDoLivro(l.id)}
                    className="w-full [&>span:last-child]:text-[10px]"
                  />
                  <p className="mt-2 line-clamp-2 font-display text-sm leading-tight font-semibold italic">
                    {l.titulo}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold tracking-[.06em] text-cinza uppercase">
                    {rotuloStatus[l.status ?? "lendo"] ?? ""}
                    {l.nota ? (
                      <span className="ml-1 tracking-normal text-bordo normal-case">
                        {estrelas(l.nota)}
                      </span>
                    ) : null}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-9 px-6 pb-10 lg:px-0">
        <h2 className="font-display text-[22px] font-semibold italic text-bordo lg:font-revista lg:text-[26px] lg:font-normal lg:text-tinta">
          {naEstante.length ? "outros livros" : "principais livros"}
        </h2>
        {livros === null ? (
          <ul aria-hidden className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <li key={i} className="aspect-[2/3] animate-pulse rounded-[4px] bg-linha/70" />
            ))}
          </ul>
        ) : outros.length ? (
          <ul className="mt-3 grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4 lg:grid-cols-6">
            {outros.map((l) => (
              <li key={l.id}>
                <Link href={`/livro/${l.id}`} className="block">
                  <CapaLivro
                    titulo={l.titulo}
                    capa={l.capa}
                    cor={l.cor ?? corDoLivro(l.id)}
                    className="w-full [&>span:last-child]:text-[10px]"
                  />
                  <p className="mt-2 line-clamp-2 font-display text-sm leading-tight font-semibold italic">
                    {l.titulo}
                  </p>
                  <p className="mt-0.5 text-[10px] text-cinza">
                    {l.ano ?? ""}
                    {l.avaliacao?.media ? (
                      <span className="ml-1 text-bordo">
                        ★ {l.avaliacao.media.toFixed(1).replace(".", ",")}
                      </span>
                    ) : null}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 font-accent text-sm italic text-cinza">
            não achamos outros livros dessa autoria no catálogo.
          </p>
        )}
      </section>
    </>
  );
}

export default function AutorPage() {
  const { nome } = useParams<{ nome: string }>();
  const hidratado = useHidratado();
  const decodificado = decodeURIComponent(nome ?? "").trim();
  return (
    <AppShell aba="descobrir">
      <div className="flex flex-1 flex-col lg:bg-jornal lg:px-12 lg:py-8">
        <div className="lg:max-w-[1000px]">
          <header className="flex items-center justify-between px-6 pt-2 lg:px-0 lg:pt-0">
            <Voltar
              padrao="/descobrir"
              className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo"
            />
            <span className="text-[11px] font-semibold tracking-[.16em] text-bordo uppercase">
              autoria
            </span>
          </header>
          {hidratado && decodificado ? <Conteudo nome={decodificado} /> : null}
        </div>
      </div>
    </AppShell>
  );
}
