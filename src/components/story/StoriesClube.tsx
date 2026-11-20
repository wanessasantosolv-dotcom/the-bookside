"use client";

import { forwardRef } from "react";
import {
  Capa,
  capaSegura,
  dataLonga,
  estrelasTexto,
  eyebrow,
  Moldura,
  tituloQueCabe,
  tituloStyle,
  type EstiloStory,
} from "@/components/story/Stories";

/** uma avaliação do clube: quem leu, a nota que deu e (quando tem) um trechinho da ficha */
export type AvaliacaoClube = {
  nome: string;
  foto?: string | null;
  nota?: number | null;
  citacao?: string | null;
};

export type DadosClube = {
  clube: string;
  livro: { id: string; titulo: string; autor: string; capa?: string };
  avaliacoes: AvaliacaoClube[];
  media: number | null;
  encerradoEm?: string;
};

type Props = { e: EstiloStory } & DadosClube;

function Avatar({
  a,
  tamanho,
  e,
}: {
  a: AvaliacaoClube;
  tamanho: number;
  e: EstiloStory;
}) {
  const src = capaSegura(a.foto ?? undefined);
  return (
    <div
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: "50%",
        flex: "none",
        overflow: "hidden",
        border: `2px solid ${e.fundo}`,
        background: e.fio,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: tamanho * 0.4,
        color: e.suave,
        fontWeight: 700,
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
        a.nome.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

const mediaTexto = (m: number | null) =>
  m === null ? "" : m.toLocaleString("pt-BR", { maximumFractionDigits: 1 });

/* ───────────── A: ficha coletiva ───────────── */

export const StoryClubeFicha = forwardRef<HTMLDivElement, Props>(
  function StoryClubeFicha(
    { e, clube, livro, avaliacoes, media, encerradoEm },
    ref,
  ) {
    const comCitacao = avaliacoes.find((a) => a.citacao);
    return (
      <Moldura ref={ref} e={e} usuario="">
        <p style={{ ...eyebrow(e), marginTop: 18, textAlign: "center" }}>
          clube · {clube}
        </p>
        <div
          style={{
            margin: "14px auto 0",
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: `1.6px dashed ${e.destaque}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            fontSize: 8.5,
            lineHeight: 1.15,
            letterSpacing: ".06em",
            textTransform: "uppercase",
            color: e.destaque,
            fontWeight: 700,
            transform: "rotate(-7deg)",
          }}
        >
          lemos
          <br />
          juntas
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <Capa l={livro} largura={118} girar={-2} />
        </div>
        <p
          style={{
            ...tituloStyle(24),
            ...tituloQueCabe(livro.titulo, 24, 2),
            textAlign: "center",
            marginTop: 16,
          }}
        >
          {livro.titulo}
        </p>
        <p
          style={{
            textAlign: "center",
            fontSize: 10,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: e.suave,
            marginTop: 6,
            fontWeight: 600,
          }}
        >
          {livro.autor}
        </p>
        {media !== null ? (
          <>
            <p
              style={{
                textAlign: "center",
                fontSize: 20,
                color: e.destaque,
                marginTop: 10,
                letterSpacing: 2,
              }}
            >
              {estrelasTexto(media)}
            </p>
            <p
              style={{
                textAlign: "center",
                fontSize: 10,
                color: e.suave,
                marginTop: 2,
              }}
            >
              média {mediaTexto(media)} entre {avaliacoes.length}{" "}
              {avaliacoes.length === 1 ? "ficha" : "fichas"}
            </p>
          </>
        ) : null}
        {avaliacoes.length ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 12,
            }}
          >
            {avaliacoes.slice(0, 7).map((a, i) => (
              <div key={i} style={{ marginLeft: i ? -8 : 0 }}>
                <Avatar a={a} tamanho={26} e={e} />
              </div>
            ))}
          </div>
        ) : null}
        {comCitacao ? (
          <p
            style={{
              margin: "14px 6px 0",
              textAlign: "center",
              fontFamily: "var(--font-fraunces), Georgia, serif",
              fontStyle: "italic",
              fontSize: 12.5,
              lineHeight: 1.4,
              color: e.texto,
              opacity: 0.9,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            &ldquo;{comCitacao.citacao}&rdquo;
          </p>
        ) : null}
        {comCitacao ? (
          <p
            style={{
              textAlign: "center",
              fontSize: 9.5,
              color: e.suave,
              marginTop: 4,
              letterSpacing: ".06em",
            }}
          >
            — {comCitacao.nome}
          </p>
        ) : null}
        {encerradoEm ? (
          <p
            style={{
              marginTop: "auto",
              marginBottom: 2,
              textAlign: "center",
              fontSize: 9,
              letterSpacing: ".14em",
              textTransform: "uppercase",
              color: e.suave,
              fontWeight: 600,
            }}
          >
            {dataLonga(encerradoEm)}
          </p>
        ) : null}
      </Moldura>
    );
  },
);

/* ───────────── B: carimbo do clube ───────────── */

export const StoryClubeCarimbo = forwardRef<HTMLDivElement, Props>(
  function StoryClubeCarimbo({ e, clube, livro, avaliacoes, media }, ref) {
    return (
      <Moldura ref={ref} e={e} usuario="">
        <p style={{ ...eyebrow(e), marginTop: 18, textAlign: "center" }}>
          {clube}
        </p>
        <div
          style={{
            margin: "20px auto 0",
            width: 190,
            height: 190,
            borderRadius: "50%",
            border: `1.3px dashed ${e.destaque}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 12,
              borderRadius: "50%",
              border: `1px solid ${e.fio}`,
            }}
          />
          <Capa l={livro} largura={78} />
        </div>
        <p
          style={{
            ...tituloStyle(21),
            ...tituloQueCabe(livro.titulo, 21, 2),
            textAlign: "center",
            marginTop: 18,
          }}
        >
          {livro.titulo}
        </p>
        <p
          style={{
            textAlign: "center",
            fontSize: 10,
            letterSpacing: ".16em",
            textTransform: "uppercase",
            color: e.suave,
            marginTop: 6,
            fontWeight: 600,
          }}
        >
          {livro.autor}
        </p>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 26,
            marginTop: "auto",
            marginBottom: 10,
          }}
        >
          {[
            [media !== null ? `${mediaTexto(media)}★` : "—", "média"],
            [String(avaliacoes.length), "fichas"],
          ].map(([v, r]) => (
            <div key={r} style={{ textAlign: "center" }}>
              <p
                style={{
                  ...tituloStyle(22),
                  color: e.destaque,
                }}
              >
                {v}
              </p>
              <p
                style={{
                  fontSize: 8,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: e.suave,
                  marginTop: 2,
                  fontWeight: 600,
                }}
              >
                {r}
              </p>
            </div>
          ))}
        </div>
      </Moldura>
    );
  },
);

/* ───────────── C: mural de recados ───────────── */

export const StoryClubeMural = forwardRef<HTMLDivElement, Props>(
  function StoryClubeMural({ e, clube, livro, avaliacoes, media }, ref) {
    const notas = avaliacoes.slice(0, 4);
    return (
      <Moldura ref={ref} e={e} usuario="">
        <p style={{ ...eyebrow(e), marginTop: 10, textAlign: "center" }}>
          terminamos juntas ✦
        </p>
        <p
          style={{
            ...tituloStyle(19),
            ...tituloQueCabe(livro.titulo, 19, 2),
            textAlign: "center",
            marginTop: 6,
          }}
        >
          {livro.titulo}
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 8,
            marginTop: 14,
          }}
        >
          {notas.map((a, i) => (
            <div
              key={i}
              style={{
                width: 128,
                background: e.fundo === "#F5EFE6" ? "#FFF8F3" : e.fio,
                border: `1px solid ${e.fio}`,
                borderRadius: 3,
                padding: "9px 10px",
                fontSize: 10.5,
                lineHeight: 1.32,
                color: e.texto,
                transform: `rotate(${i % 2 ? 2 : -2}deg)`,
                boxShadow: "0 8px 14px -8px rgba(0,0,0,.25)",
              }}
            >
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: e.destaque,
                  marginBottom: 3,
                }}
              >
                {a.nome}
              </p>
              {a.citacao ? (
                <span>
                  &ldquo;
                  {a.citacao.length > 46
                    ? `${a.citacao.slice(0, 46)}…`
                    : a.citacao}
                  &rdquo;
                </span>
              ) : null}
              {a.nota ? (
                <p style={{ fontSize: 9.5, color: e.destaque, marginTop: 4 }}>
                  {estrelasTexto(a.nota)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <Capa l={livro} largura={104} girar={-2} />
        </div>
        <p
          style={{
            marginTop: "auto",
            marginBottom: 2,
            textAlign: "center",
            fontSize: 10.5,
            color: e.suave,
          }}
        >
          {clube}
          {media !== null ? ` · média ${mediaTexto(media)}★` : ""}
        </p>
      </Moldura>
    );
  },
);
