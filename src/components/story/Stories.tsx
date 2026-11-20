"use client";

import { forwardRef, type ReactNode } from "react";
import { corDoLivro } from "@/lib/cores";
import { formatoDe } from "@/lib/formatos";
import { diasDeLeitura } from "@/lib/numeros";
import type { LivroSalvo } from "@/lib/perfil-store";

/** o que entra no story (cada um liga/desliga; ausente = aparece) */
export type Mostrar = Partial<
  Record<
    | "data"
    | "nota"
    | "resenha"
    | "detalhes"
    | "progresso"
    | "numeros"
    | "favorito",
    boolean
  >
>;
const ve = (m: Mostrar | undefined, k: keyof Mostrar) => m?.[k] !== false;

/** Os estilos de story: cores e papel. */
export type EstiloStory = {
  id: string;
  nome: string;
  fundo: string;
  texto: string;
  suave: string;
  destaque: string;
  fio: string;
};

export const estilosBase: EstiloStory[] = [
  {
    id: "creme",
    nome: "creme",
    fundo: "#F5EFE6",
    texto: "#2B1420",
    suave: "#7A6A6E",
    destaque: "#6B0D24",
    fio: "rgba(43,20,32,.18)",
  },
  {
    id: "vinho",
    nome: "vinho",
    fundo: "#4B0D1B",
    texto: "#F9F5EE",
    suave: "#E8B4BF",
    destaque: "#F2C9D2",
    fio: "rgba(249,245,238,.22)",
  },
  {
    id: "noite",
    nome: "noite",
    fundo: "#141015",
    texto: "#F5EFE6",
    suave: "#B5A6A9",
    destaque: "#C9A46A",
    fio: "rgba(245,239,230,.18)",
  },
];

/** um tema do app vira um estilo de story */
export function estiloDoTema(t: {
  id: string;
  nome: string;
  papel: string;
  destaque: string;
  texto: string;
}): EstiloStory {
  const escuro = "escuro" in t;
  return {
    id: t.id,
    nome: t.nome,
    fundo: t.papel,
    texto: escuro ? "#F5EFE6" : "#2B1420",
    suave: escuro ? "#CFC3B8" : "#6E6264",
    destaque: escuro ? t.destaque : t.texto,
    fio: escuro ? "rgba(245,239,230,.2)" : "rgba(43,20,32,.16)",
  };
}

/** título que cabe: quanto mais longo, menor a letra (e no máximo N linhas) */
export const tituloQueCabe = (
  texto: string,
  base: number,
  linhas = 2,
): React.CSSProperties => {
  const n = texto.length;
  const tam =
    n > 60 ? base * 0.62 : n > 40 ? base * 0.72 : n > 24 ? base * 0.85 : base;
  return {
    fontSize: Math.round(tam),
    display: "-webkit-box",
    WebkitLineClamp: linhas,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    overflowWrap: "anywhere",
  };
};

/** capas de fora passam pelo app para poderem virar imagem */
export const capaSegura = (url?: string) =>
  !url
    ? undefined
    : url.startsWith("data:") || url.startsWith("/")
      ? url
      : `/api/imagem?url=${encodeURIComponent(url)}`;

export const estrelasTexto = (n?: number) =>
  n ? "★".repeat(Math.floor(n)) + (n % 1 ? "½" : "") : "";

export function Capa({
  l,
  largura,
  girar = 0,
  sombra = true,
}: {
  l: Pick<LivroSalvo, "id" | "titulo" | "capa">;
  largura: number;
  girar?: number;
  sombra?: boolean;
}) {
  const src = capaSegura(l.capa);
  return (
    <div
      style={{
        width: largura,
        aspectRatio: "2 / 3",
        transform: girar ? `rotate(${girar}deg)` : undefined,
        boxShadow: sombra
          ? "0 18px 30px -14px rgba(0,0,0,.55), inset 4px 0 6px -4px rgba(0,0,0,.4)"
          : undefined,
        borderRadius: "2px 6px 6px 2px",
        overflow: "hidden",
        background: corDoLivro(l.id),
        flex: "none",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          crossOrigin="anonymous"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "flex-end",
            padding: largura / 10,
            color: "#F9F5EE",
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontStyle: "italic",
            fontSize: Math.max(10, largura / 9),
            lineHeight: 1.1,
          }}
        >
          {l.titulo}
        </div>
      )}
    </div>
  );
}

/** a moldura comum: 360×640 (vira 1080×1920), marca no topo e o @ embaixo */
export const Moldura = forwardRef<
  HTMLDivElement,
  { e: EstiloStory; usuario: string; children: ReactNode }
>(function Moldura({ e, usuario, children }, ref) {
  return (
    <div
      ref={ref}
      style={{
        width: 360,
        height: 640,
        background: e.fundo,
        color: e.texto,
        position: "relative",
        overflow: "hidden",
        padding: "34px 30px 30px",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-manrope), system-ui, sans-serif",
      }}
    >
      {/* textura de papel: linhas finas */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-linear-gradient(0deg, transparent 0 31px, ${e.fio} 31px 32px)`,
          opacity: 0.25,
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontSize: 9,
          letterSpacing: ".22em",
          textTransform: "uppercase",
          color: e.suave,
          fontWeight: 600,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontStyle: "italic",
            letterSpacing: 0,
            textTransform: "none",
            fontSize: 15,
            color: e.destaque,
            fontWeight: 500,
          }}
        >
          the bookside ✦
        </span>
        <span>read · track · belong</span>
      </div>
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
        }}
        className="story-conteudo"
      >
        {children}
      </div>
      <div
        style={{
          position: "relative",
          borderTop: `1px solid ${e.fio}`,
          paddingTop: 10,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 9,
          letterSpacing: ".18em",
          textTransform: "uppercase",
          color: e.suave,
          fontWeight: 600,
        }}
      >
        <span>{usuario ? `@${usuario}` : "minha estante"}</span>
        <span>the bookside</span>
      </div>
    </div>
  );
});

export const eyebrow = (e: EstiloStory): React.CSSProperties => ({
  fontSize: 10,
  letterSpacing: ".24em",
  textTransform: "uppercase",
  fontWeight: 700,
  color: e.destaque,
});
export const tituloStyle = (tamanho: number): React.CSSProperties => ({
  fontFamily: "var(--font-fraunces), Georgia, serif",
  fontStyle: "italic",
  fontSize: tamanho,
  lineHeight: 1.05,
  fontWeight: 400,
});

export const dataLonga = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

/* ───────────── terminei ───────────── */

export const StoryTerminei = forwardRef<
  HTMLDivElement,
  { e: EstiloStory; usuario: string; livro: LivroSalvo; mostrar?: Mostrar }
>(function StoryTerminei({ e, usuario, livro, mostrar }, ref) {
  const comNota = ve(mostrar, "nota") && !!livro.nota;
  const comResenha = ve(mostrar, "resenha") && !!livro.citacao;
  const comData = ve(mostrar, "data") && !!livro.lidoEm;
  const comDetalhes = ve(mostrar, "detalhes");
  // a capa diminui quando tem mais coisa, para nada ficar cortado
  const largura = Math.max(
    112,
    180 -
      (comResenha ? 46 : 0) -
      (comNota ? 10 : 0) -
      (livro.titulo.length > 24 ? 12 : 0),
  );
  const dias = diasDeLeitura(livro);
  const formato = formatoDe(livro.formato);
  const detalhes = [
    dias ? `lido em ${dias} ${dias === 1 ? "dia" : "dias"}` : null,
    livro.paginas ? `${livro.paginas} páginas` : null,
    formato ? formato.onde : null,
  ].filter(Boolean);
  return (
    <Moldura ref={ref} e={e} usuario={usuario}>
      <p style={{ ...eyebrow(e), marginTop: 30, textAlign: "center" }}>
        terminei ✦
      </p>
      {comData ? (
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            color: e.suave,
            marginTop: 6,
            fontStyle: "italic",
            fontFamily: "var(--font-fraunces), Georgia, serif",
          }}
        >
          {dataLonga(livro.lidoEm)}
        </p>
      ) : null}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 22 }}>
        <Capa l={livro} largura={largura} girar={-2} />
      </div>
      <p
        style={{
          ...tituloStyle(30),
          ...tituloQueCabe(livro.titulo, 30, comResenha ? 2 : 3),
          textAlign: "center",
          marginTop: 22,
        }}
      >
        {livro.titulo}
      </p>
      <p
        style={{
          textAlign: "center",
          fontSize: 10,
          letterSpacing: ".2em",
          textTransform: "uppercase",
          color: e.suave,
          marginTop: 8,
          fontWeight: 600,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {livro.autor}
      </p>
      {comNota ? (
        <p
          style={{
            textAlign: "center",
            fontSize: 24,
            color: e.destaque,
            marginTop: 12,
            letterSpacing: 3,
          }}
        >
          {estrelasTexto(livro.nota)}
        </p>
      ) : null}
      {comResenha ? (
        <p
          style={{
            margin: "14px 8px 0",
            textAlign: "center",
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontStyle: "italic",
            fontSize: 13,
            lineHeight: 1.4,
            color: e.texto,
            opacity: 0.9,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          “{livro.citacao}”
        </p>
      ) : null}
      {comDetalhes && detalhes.length ? (
        <p
          style={{
            marginTop: "auto",
            marginBottom: 14,
            textAlign: "center",
            fontSize: 10,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            color: e.suave,
            fontWeight: 600,
          }}
        >
          {detalhes.join(" · ")}
        </p>
      ) : null}
    </Moldura>
  );
});

/* ───────────── lendo agora ───────────── */

export const StoryLendo = forwardRef<
  HTMLDivElement,
  { e: EstiloStory; usuario: string; livros: LivroSalvo[]; mostrar?: Mostrar }
>(function StoryLendo({ e, usuario, livros, mostrar }, ref) {
  const comProgresso = ve(mostrar, "progresso");
  const lista = livros.slice(0, 3);
  return (
    <Moldura ref={ref} e={e} usuario={usuario}>
      <p style={{ ...eyebrow(e), marginTop: 34 }}>na minha cabeceira</p>
      <p style={{ ...tituloStyle(42), marginTop: 10 }}>
        lendo
        <br />
        agora
      </p>
      <div
        style={{
          marginTop: 28,
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        {lista.map((l, i) => {
          const pct =
            comProgresso && l.paginas && l.paginaAtual
              ? Math.min(100, Math.round((l.paginaAtual / l.paginas) * 100))
              : null;
          return (
            <div key={l.id} style={{ display: "flex", gap: 16 }}>
              <Capa
                l={l}
                largura={lista.length === 1 ? 120 : 74}
                girar={i % 2 ? 1.5 : -1.5}
              />
              <div style={{ minWidth: 0, flex: 1, paddingTop: 4 }}>
                <p
                  style={{
                    ...tituloStyle(lista.length === 1 ? 26 : 19),
                    ...tituloQueCabe(l.titulo, lista.length === 1 ? 26 : 19, 2),
                  }}
                >
                  {l.titulo}
                </p>
                <p
                  style={{
                    fontSize: 9,
                    letterSpacing: ".18em",
                    textTransform: "uppercase",
                    color: e.suave,
                    marginTop: 6,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {l.autor}
                </p>
                {pct !== null ? (
                  <>
                    <div
                      style={{
                        marginTop: 12,
                        height: 4,
                        borderRadius: 4,
                        background: e.fio,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: e.destaque,
                        }}
                      />
                    </div>
                    <p
                      style={{
                        fontSize: 10,
                        color: e.suave,
                        marginTop: 6,
                        fontWeight: 600,
                      }}
                    >
                      {pct}% · página {l.paginaAtual} de {l.paginas}
                    </p>
                  </>
                ) : (
                  <p
                    style={{
                      fontSize: 11,
                      color: e.suave,
                      marginTop: 10,
                      fontStyle: "italic",
                      fontFamily: "var(--font-fraunces), Georgia, serif",
                    }}
                  >
                    {l.iniciadoEm
                      ? `desde ${new Date(l.iniciadoEm).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}`
                      : "começando agora"}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p
        style={{
          marginTop: "auto",
          marginBottom: 14,
          fontFamily: "var(--font-fraunces), Georgia, serif",
          fontStyle: "italic",
          fontSize: 14,
          color: e.suave,
        }}
      >
        só mais um capítulo ✦
      </p>
    </Moldura>
  );
});

/* ───────────── meu mês (mini wrapped) ───────────── */

export const StoryMes = forwardRef<
  HTMLDivElement,
  {
    e: EstiloStory;
    usuario: string;
    mes: string;
    ano: number;
    livros: LivroSalvo[];
    mostrar?: Mostrar;
  }
>(function StoryMes({ e, usuario, mes, ano, livros, mostrar }, ref) {
  const paginas = livros.reduce((t, l) => t + (l.paginas ?? 0), 0);
  const notas = livros.map((l) => l.nota).filter((n): n is number => !!n);
  const media = notas.length
    ? notas.reduce((t, n) => t + n, 0) / notas.length
    : null;
  const melhor = [...livros]
    .filter((l) => l.nota)
    .sort((a, b) => (b.nota ?? 0) - (a.nota ?? 0))[0];
  const contaFormato = new Map<string, number>();
  for (const l of livros)
    if (l.formato)
      contaFormato.set(l.formato, (contaFormato.get(l.formato) ?? 0) + 1);
  const formatoTop = [...contaFormato].sort((a, b) => b[1] - a[1])[0];
  const time = formatoTop
    ? {
        fisico: "time papel",
        ebook: "time tela",
        audio: "time fone de ouvido",
      }[formatoTop[0]]
    : null;
  // cabe sempre: até 3 capas grandes numa fileira; mais que isso, até 8 em duas fileiras
  const capas = livros.slice(0, 8);
  const largura = capas.length > 3 ? 60 : 92;

  return (
    <Moldura ref={ref} e={e} usuario={usuario}>
      <p style={{ ...eyebrow(e), marginTop: 28 }}>meu mês de leitura</p>
      <p style={{ ...tituloStyle(54), marginTop: 6 }}>{mes}</p>
      <p
        style={{
          fontSize: 10,
          letterSpacing: ".22em",
          textTransform: "uppercase",
          color: e.suave,
          fontWeight: 600,
          marginTop: 2,
        }}
      >
        {ano}
      </p>

      {ve(mostrar, "numeros") ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            marginTop: 20,
            borderTop: `1px solid ${e.fio}`,
            borderBottom: `1px solid ${e.fio}`,
            padding: "12px 0",
          }}
        >
          {[
            {
              v: String(livros.length),
              r: livros.length === 1 ? "livro" : "livros",
            },
            {
              v: paginas ? paginas.toLocaleString("pt-BR") : "—",
              r: "páginas",
            },
            {
              v: media ? `${media.toFixed(1).replace(".", ",")}★` : "—",
              r: "média",
            },
          ].map((c, i) => (
            <div
              key={c.r}
              style={{
                textAlign: "center",
                borderLeft: i ? `1px solid ${e.fio}` : undefined,
              }}
            >
              <p style={{ ...tituloStyle(28), color: e.destaque }}>{c.v}</p>
              <p
                style={{
                  fontSize: 9,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  color: e.suave,
                  marginTop: 4,
                  fontWeight: 600,
                }}
              >
                {c.r}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "center",
          marginTop: 20,
        }}
      >
        {capas.map((l, i) => (
          <Capa
            key={l.id}
            l={l}
            largura={largura}
            girar={[-2, 1.5, -1, 2, -1.5, 1][i % 6]}
          />
        ))}
      </div>
      {livros.length > capas.length ? (
        <p
          style={{
            textAlign: "center",
            fontSize: 10,
            color: e.suave,
            marginTop: 8,
          }}
        >
          + {livros.length - capas.length}
        </p>
      ) : null}

      <div style={{ marginTop: "auto", marginBottom: 12 }}>
        {melhor && ve(mostrar, "favorito") ? (
          <p
            style={{
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontStyle: "italic",
              fontSize: 15,
              lineHeight: 1.3,
            }}
          >
            <span
              style={{
                display: "block",
                fontFamily: "var(--font-manrope), system-ui, sans-serif",
                fontStyle: "normal",
                fontSize: 9,
                letterSpacing: ".2em",
                textTransform: "uppercase",
                color: e.destaque,
                fontWeight: 700,
                marginBottom: 4,
              }}
            >
              o favorito do mês
            </span>
            <span
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {melhor.titulo}
            </span>
            <span style={{ color: e.destaque, fontStyle: "normal" }}>
              {estrelasTexto(melhor.nota)}
            </span>
          </p>
        ) : null}
        {time ? (
          <p style={{ fontSize: 11, color: e.suave, marginTop: 8 }}>
            neste mês fui {time} ✦
          </p>
        ) : null}
      </div>
    </Moldura>
  );
});
