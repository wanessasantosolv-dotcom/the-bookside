"use client";

/*
 * As folhas do caderno de leitura, desenhadas em tamanho fixo (A5: 420 × 596)
 * e escaladas pelo caderno. Cada seção tem sua diagramação de journal:
 * capas pequenas "impressas e coladas", fichas preenchidas, molduras finas,
 * papéis pautados, pontilhados, quadriculados e xadrez.
 */
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { FORMATO_NOME, MESES, SECOES, dataCurta, leiturasDoMes, sugestaoDoMes, type Folha, type Leitura, type Nota, type Papel } from "@/lib/caderno";
import type { LivroSalvo } from "@/lib/perfil-store";

export const PW = 420;
export const PH = 596;

const C = { bordo: "#692536", creme: "#FBF7F0", rosa: "#ECAABB", rosaSuave: "#F5D9E0", azul: "#8297D1", azulSuave: "#DCE3F0", verde: "#D5DD76", amarelo: "#F1DFA0", oliva: "#59634F", ameixa: "#38252C", tinta: "#4A3A40", fio: "rgba(105,37,54,.28)", fioLeve: "rgba(105,37,54,.14)" };
const serif = "var(--font-fraunces), Georgia, serif";
const sans = "var(--font-manrope), system-ui, sans-serif";
const maquina = "var(--font-special-elite), 'Courier New', monospace";

/** o papel da folha */
export function fundoDoPapel(p: Papel): CSSProperties {
  switch (p) {
    case "pontilhado":
      return { backgroundColor: C.creme, backgroundImage: "radial-gradient(rgba(105,37,54,.22) 0.8px, transparent 1.1px)", backgroundSize: "14px 14px", backgroundPosition: "7px 7px" };
    case "quadriculado":
      return { backgroundColor: C.creme, backgroundImage: "linear-gradient(rgba(130,151,209,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(130,151,209,.16) 1px, transparent 1px)", backgroundSize: "12px 12px" };
    case "pautado":
      return { backgroundColor: C.creme, backgroundImage: "linear-gradient(rgba(130,151,209,.22) 1px, transparent 1px)", backgroundSize: "100% 21px", backgroundPosition: "0 9px" };
    case "xadrez":
      return { backgroundColor: C.creme, backgroundImage: "linear-gradient(90deg, rgba(236,170,187,.13) 50%, transparent 50%), linear-gradient(rgba(236,170,187,.13) 50%, transparent 50%)", backgroundSize: "16px 16px" };
    default:
      return { backgroundColor: C.creme };
  }
}

/** recorte de papel estampado (para capas coladas em próximas leituras) */
const RECORTES: CSSProperties[] = [
  { backgroundColor: "#fff", backgroundImage: "linear-gradient(90deg, rgba(236,170,187,.55) 50%, transparent 50%), linear-gradient(rgba(236,170,187,.55) 50%, transparent 50%)", backgroundSize: "6px 6px" },
  { backgroundColor: "#fff", backgroundImage: "linear-gradient(90deg, rgba(130,151,209,.5) 50%, transparent 50%), linear-gradient(rgba(130,151,209,.5) 50%, transparent 50%)", backgroundSize: "6px 6px" },
  { backgroundColor: "#fff", backgroundImage: "linear-gradient(90deg, rgba(241,223,160,.9) 50%, transparent 50%), linear-gradient(rgba(241,223,160,.9) 50%, transparent 50%)", backgroundSize: "6px 6px" },
  { backgroundColor: "#fff", backgroundImage: "repeating-linear-gradient(90deg, rgba(105,37,54,.35) 0 2px, transparent 2px 6px)" },
];

/* ───────── miúdos de papelaria ───────── */

export function Estrelas({ nota, tamanho = 9 }: { nota?: number; tamanho?: number }) {
  if (!nota) return <span style={{ display: "inline-flex", gap: 1.5, opacity: 0.35 }}>{[0, 1, 2, 3, 4].map((i) => <Estrela key={i} cheia={0} t={tamanho} />)}</span>;
  return (
    <span role="img" aria-label={`${nota.toLocaleString("pt-BR")} de 5 estrelas`} style={{ display: "inline-flex", gap: 1.5 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <Estrela key={i} cheia={nota >= i + 1 ? 1 : nota > i ? 0.5 : 0} t={tamanho} />
      ))}
    </span>
  );
}

function Estrela({ cheia, t }: { cheia: number; t: number }) {
  const id = `m${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg width={t} height={t} viewBox="0 0 24 24" aria-hidden>
      {cheia === 0.5 ? (
        <defs>
          <linearGradient id={id}>
            <stop offset="50%" stopColor={C.amarelo} />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      ) : null}
      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill={cheia === 1 ? C.amarelo : cheia === 0.5 ? `url(#${id})` : "none"} stroke="#C9A54A" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function Brilho({ x, y, cor = C.amarelo, t = 8, girar = 0 }: { x: number; y: number; cor?: string; t?: number; girar?: number }) {
  return (
    <svg aria-hidden width={t} height={t} viewBox="0 0 24 24" style={{ position: "absolute", left: x, top: y, transform: `rotate(${girar}deg)` }}>
      <path d="M12 1c.6 5.3 2.6 9.4 11 11-8.4 1.6-10.4 5.7-11 11-.6-5.3-2.6-9.4-11-11 8.4-1.6 10.4-5.7 11-11z" fill={cor} />
    </svg>
  );
}

/** capa "impressa e colada": borda branca fina e sombra mínima */
export function Mini({ l, w, girar = 0, borda = 1.5 }: { l: LivroSalvo; w: number; girar?: number; borda?: number }) {
  const h = Math.round(w * 1.5);
  return (
    <span style={{ display: "block", width: w, height: h, padding: borda, background: "#fff", boxShadow: "0 1px 1.5px rgba(56,37,44,.22)", transform: girar ? `rotate(${girar}deg)` : undefined, flex: "none" }}>
      {l.capa ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={l.capa} alt={`Capa de ${l.titulo}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      ) : (
        <span style={{ display: "flex", width: "100%", height: "100%", alignItems: "flex-end", padding: 3, background: C.rosaSuave, fontFamily: serif, fontSize: Math.max(5, w / 7), lineHeight: 1.05, color: C.bordo, overflow: "hidden" }}>{l.titulo}</span>
      )}
    </span>
  );
}

/** a barra de título com moldura fina (como no journal de referência) */
function Titulo({ texto, ano, extra }: { texto: string; ano: string; extra?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${C.fio}`, borderRadius: 7, padding: "6px 10px", background: "rgba(251,247,240,.92)", marginBottom: 12 }}>
      <span style={{ fontFamily: serif, fontSize: 15, color: C.ameixa, fontWeight: 500 }}>{texto}</span>
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {extra}
        <span style={{ fontFamily: serif, fontSize: 13, color: C.bordo, fontWeight: 600 }}>{ano}</span>
      </span>
    </div>
  );
}

/** valor "escrito à mão" sobre uma linha */
function Escrito({ rotulo, valor, largura }: { rotulo: string; valor?: string; largura?: number }) {
  return (
    <span style={{ display: "flex", alignItems: "baseline", gap: 3, fontSize: 7.5, color: C.tinta, fontFamily: sans, lineHeight: 1.25 }}>
      <span style={{ flex: "none" }}>{rotulo}</span>
      <span style={{ flex: 1, minWidth: largura ?? 0, borderBottom: `0.6px solid ${C.fio}`, fontFamily: serif, fontStyle: "italic", fontSize: 8.5, color: C.bordo, paddingLeft: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{valor || " "}</span>
    </span>
  );
}

function Vazio({ texto }: { texto: string }) {
  return (
    <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, color: C.tinta, opacity: 0.75 }}>
      <span style={{ width: 120, height: 80, border: `1px dashed ${C.fio}`, borderRadius: 6 }} />
      <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 12, textAlign: "center", maxWidth: 240 }}>{texto}</p>
    </div>
  );
}

/* ───────── as folhas ───────── */

export type ContextoFolha = {
  ano: string;
  nomeCaderno: string;
  nomePessoa: string;
  leituras: Leitura[];
  favoritos: Record<string, string>;
  inicio: Record<string, number>;
  irPara: (pagina: number) => void;
  /** interação (escolher favorito, editar prioridades); ausente na impressão */
  editar?: {
    favorito: (mes: number) => void;
    prioridades: () => void;
  };
};

export function FolhaCaderno({ f, n, papel, ctx }: { f: Folha; n: number; papel: Papel; ctx: ContextoFolha }) {
  // páginas ímpares ficam à esquerda (a folha de rosto abre o caderno): número na borda de fora
  const esquerda = n % 2 === 1;
  return (
    <div style={{ width: PW, height: PH, position: "relative", overflow: "hidden", ...fundoDoPapel(papel), color: C.tinta, fontFamily: sans, padding: "26px 26px 34px" }}>
      <Conteudo f={f} ctx={ctx} />
      <span style={{ position: "absolute", bottom: 12, [esquerda ? "left" : "right"]: 22, fontFamily: maquina, fontSize: 8.5, color: C.bordo, opacity: 0.7 } as CSSProperties}>{n}</span>
    </div>
  );
}

function Conteudo({ f, ctx }: { f: Folha; ctx: ContextoFolha }) {
  const { ano } = ctx;
  switch (f.secao) {
    case "rosto":
      return (
        <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative" }}>
          <Brilho x={60} y={70} t={10} cor={C.rosa} />
          <Brilho x={320} y={110} t={7} />
          <Brilho x={300} y={430} t={9} cor={C.azul} />
          <Brilho x={80} y={470} t={7} cor={C.verde} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/simbolo-bordo.png" alt="" style={{ height: 34, width: "auto", opacity: 0.9 }} />
          <div style={{ marginTop: 22, border: `1px solid ${C.fio}`, outline: `1px solid ${C.fio}`, outlineOffset: 4, padding: "22px 30px", borderRadius: 4, background: "rgba(251,247,240,.9)" }}>
            <p style={{ fontFamily: maquina, fontSize: 9, letterSpacing: ".18em", color: C.oliva, textTransform: "uppercase" }}>Caderno de leitura</p>
            <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: 30, lineHeight: 1.1, color: C.bordo, marginTop: 8, maxWidth: 260 }}>{ctx.nomeCaderno}</p>
            <p style={{ fontFamily: serif, fontSize: 40, color: C.ameixa, marginTop: 10, letterSpacing: "-.01em" }}>{ano}</p>
          </div>
          <div style={{ marginTop: 30, width: 200 }}>
            <Escrito rotulo="Este caderno pertence a" valor={ctx.nomePessoa} />
          </div>
          <p style={{ marginTop: 14, fontFamily: maquina, fontSize: 9, color: C.tinta }}>{ctx.leituras.length} {ctx.leituras.length === 1 ? "leitura concluída" : "leituras concluídas"}</p>
        </div>
      );
    case "indice":
      return (
        <div>
          <Titulo texto="Índice" ano={ano} />
          <ol style={{ marginTop: 18, listStyle: "none", padding: 0 }}>
            {SECOES.map((s, i) => (
              <li key={s.id}>
                <button type="button" onClick={() => ctx.irPara(ctx.inicio[s.id])} style={{ width: "100%", display: "flex", alignItems: "baseline", gap: 6, padding: "9px 2px", background: "none", border: 0, cursor: "pointer", color: C.ameixa, fontFamily: serif, fontSize: 15, textAlign: "left" }}>
                  <span style={{ fontFamily: maquina, fontSize: 9, color: C.bordo, width: 16 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span>{s.nome}</span>
                  <span style={{ flex: 1, borderBottom: `1px dotted ${C.fio}`, transform: "translateY(-3px)" }} />
                  <span style={{ fontFamily: maquina, fontSize: 10, color: C.bordo }}>{ctx.inicio[s.id]}</span>
                </button>
              </li>
            ))}
          </ol>
          <div style={{ position: "absolute", left: 26, right: 26, bottom: 46, display: "flex", gap: 6, alignItems: "center", justifyContent: "center", opacity: 0.85 }}>
            {[C.rosa, C.azul, C.amarelo, C.verde].map((c, i) => (
              <span key={i} style={{ width: 34, height: 9, background: c, opacity: 0.7, transform: `rotate(${[-3, 2, -1, 3][i]}deg)` }} />
            ))}
          </div>
        </div>
      );
    case "ano": {
      const w = 56;
      return (
        <div style={{ position: "relative", height: "100%" }}>
          {f.primeira ? <Titulo texto="Meu ano em livros" ano={ano} /> : <div style={{ height: 8 }} />}
          {f.leituras.length ? (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(5, ${w}px)`, justifyContent: "space-between", rowGap: 14, padding: "4px 6px" }}>
              {f.leituras.map((l) => (
                <Mini key={l.chave} l={l.livro} w={w} />
              ))}
            </div>
          ) : (
            <Vazio texto="As capas das leituras concluídas neste ano aparecem aqui." />
          )}
          {/* pontinhos dourados nas margens, como no journal */}
          {[[-16, 120], [-16, 300], [372, 200], [372, 420], [170, 516], [-14, 480]].map(([x, y], i) => (
            <Brilho key={i} x={x} y={y} t={7} cor="#D9B44A" girar={i * 20} />
          ))}
        </div>
      );
    }
    case "registro":
      return (
        <div>
          {f.primeira ? <Titulo texto="Registro de leituras" ano={ano} /> : <div style={{ height: 6 }} />}
          {f.leituras.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", columnGap: 0 }}>
              {f.leituras.map((l, i) => (
                <div key={l.chave} style={{ display: "flex", gap: 7, padding: "8px 8px 9px", borderBottom: `0.7px solid ${C.fioLeve}`, borderRight: i % 2 === 0 ? `0.7px solid ${C.fioLeve}` : undefined, minHeight: 98 }}>
                  <Mini l={l.livro} w={38} />
                  <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <span style={{ fontFamily: maquina, fontSize: 8, color: C.bordo }}>#{l.numero}{l.releitura ? " · releitura" : ""}</span>
                    <span style={{ fontFamily: serif, fontSize: 9.5, lineHeight: 1.15, color: C.ameixa, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{l.livro.titulo}</span>
                    <span style={{ fontSize: 7, color: C.tinta, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.livro.autor}</span>
                    <Escrito rotulo="começou:" valor={dataCurta(l.iniciadoEm)} />
                    <Escrito rotulo="terminou:" valor={dataCurta(l.lidoEm, l.soAno, l.soMes)} />
                    <span style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                      <Estrelas nota={l.nota} />
                      {l.livro.amei ? <span aria-label="favorito" style={{ color: C.rosa, fontSize: 9, lineHeight: 1 }}>♥</span> : null}
                    </span>
                    <span style={{ fontSize: 6.8, color: C.tinta, opacity: 0.85 }}>{[l.livro.paginas ? `${l.livro.paginas} pág.` : "", l.formato ? FORMATO_NOME[l.formato] : ""].filter(Boolean).join(" · ")}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Vazio texto="Cada leitura concluída ganha uma ficha aqui, com datas e avaliação." />
          )}
        </div>
      );
    case "resenhas":
      return (
        <div>
          {f.primeira ? <Titulo texto="Resenhas" ano={ano} /> : <div style={{ height: 6 }} />}
          {f.leituras.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {f.leituras.map((l) => {
                const texto = l.livro.resenha!.trim();
                const corte = f.continua?.chave === l.chave ? f.continua : undefined;
                const trecho = corte ? texto.slice(corte.de, corte.ate) : texto;
                const continuacao = !!corte && corte.de > 0;
                return (
                  <article key={l.chave + (corte?.de ?? "")} style={{ position: "relative" }}>
                    {!continuacao ? (
                      <header style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                        <Mini l={l.livro} w={34} girar={-2} />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <p style={{ fontFamily: serif, fontSize: 12.5, lineHeight: 1.15, color: C.ameixa }}>{l.livro.titulo}</p>
                          <p style={{ fontSize: 7.5, color: C.tinta }}>{l.livro.autor}</p>
                          <p style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, fontSize: 7, color: C.tinta }}>
                            <Estrelas nota={l.nota} />
                            <span>{[dataCurta(l.iniciadoEm), dataCurta(l.lidoEm, l.soAno, l.soMes)].filter(Boolean).join(" – ")}</span>
                            {l.formato ? <span>· {FORMATO_NOME[l.formato]}</span> : null}
                          </p>
                          {l.livro.sensacoes?.length ? (
                            <p style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4 }}>
                              {l.livro.sensacoes.slice(0, 5).map((s) => (
                                <span key={s} style={{ fontFamily: maquina, fontSize: 6.8, color: C.oliva, border: `0.6px solid ${C.fio}`, padding: "0 3px", borderRadius: 2 }}>{s}</span>
                              ))}
                            </p>
                          ) : null}
                        </div>
                        {ctx.editar ? (
                          <Link href={`/livro/${l.livro.id}/avaliar`} style={{ fontSize: 7.5, color: C.bordo, textDecoration: "underline", flex: "none" }}>editar</Link>
                        ) : null}
                      </header>
                    ) : (
                      <p style={{ fontFamily: maquina, fontSize: 7.5, color: C.bordo }}>{l.livro.titulo} (continuação)</p>
                    )}
                    {l.livro.resenhaSpoiler && ctx.editar ? (
                      <details style={{ marginTop: 6 }}>
                        <summary style={{ fontSize: 8, color: C.bordo, cursor: "pointer" }}>Resenha com spoiler: mostrar</summary>
                        <Texto>{trecho}</Texto>
                      </details>
                    ) : l.livro.resenhaSpoiler ? (
                      <p style={{ marginTop: 6, fontSize: 8, fontStyle: "italic" }}>Resenha com spoiler.</p>
                    ) : (
                      <Texto>{trecho}{corte?.ate && corte.ate < texto.length ? "…" : ""}</Texto>
                    )}
                    {!continuacao && l.livro.citacao?.trim() ? (
                      <p style={{ marginTop: 6, marginLeft: 14, padding: "4px 8px", background: "rgba(241,223,160,.55)", fontFamily: serif, fontStyle: "italic", fontSize: 8.5, color: C.ameixa, transform: "rotate(-.6deg)", maxWidth: 300 }}>“{l.livro.citacao.trim().slice(0, 220)}”</p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <Vazio texto="As resenhas escritas na Marginalia aparecem aqui, junto com a avaliação de cada livro." />
          )}
        </div>
      );
    case "favoritos":
      return (
        <div>
          <Titulo texto="Favoritos do mês" ano={ano} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 1fr)", gap: 8, height: 506 }}>
            {f.meses.map((m) => (
              <Mes key={m} mes={m} ctx={ctx} />
            ))}
          </div>
        </div>
      );
    case "proximas":
      return (
        <div>
          {f.primeira ? (
            <Titulo
              texto="Próximas leituras"
              ano={ano}
              extra={
                ctx.editar ? (
                  <button type="button" onClick={ctx.editar.prioridades} style={{ fontSize: 8.5, color: C.bordo, background: "none", border: `0.8px solid ${C.fio}`, borderRadius: 4, padding: "2px 6px", cursor: "pointer" }}>
                    escolher
                  </button>
                ) : null
              }
            />
          ) : (
            <div style={{ height: 6 }} />
          )}
          {f.livros.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px 10px", padding: "2px 10px" }}>
              {f.livros.map((l, i) => (
                <div key={l.id} style={{ position: "relative", justifySelf: "center", padding: 7, ...RECORTES[(i + (i >> 1)) % RECORTES.length], transform: `rotate(${[-1.5, 1, -0.5, 1.5][i % 4]}deg)` }}>
                  <Mini l={l} w={84} borda={0} />
                  {l.status === "lido" ? (
                    <span style={{ position: "absolute", right: -6, top: 10, fontFamily: maquina, fontSize: 9, color: C.bordo, border: `1.2px solid ${C.bordo}`, padding: "1px 5px", background: "rgba(251,247,240,.92)", transform: "rotate(12deg)" }}>lido</span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <Vazio texto={ctx.editar ? "Escolha livros da sua estante Quero ler para montar a lista de prioridades." : "Nenhum livro escolhido."} />
          )}
        </div>
      );
    case "notas":
      return (
        <div>
          {f.primeira ? <Titulo texto="Citações e anotações" ano={ano} /> : <div style={{ height: 6 }} />}
          {f.notas.length ? (
            <div style={{ columnCount: 2, columnGap: 12 }}>
              {f.notas.map((n, i) => (
                <Bilhete key={n.chave} n={n} i={i} editar={!!ctx.editar} />
              ))}
            </div>
          ) : (
            <Vazio texto="Citações, trechos e anotações das leituras deste ano aparecem aqui." />
          )}
        </div>
      );
  }
}

function Texto({ children }: { children: ReactNode }) {
  return <p style={{ marginTop: 7, fontFamily: serif, fontSize: 9.6, lineHeight: "15.75px", color: C.ameixa, whiteSpace: "pre-line", textAlign: "left" }}>{children}</p>;
}

function Mes({ mes, ctx }: { mes: number; ctx: ContextoFolha }) {
  const opcoes = leiturasDoMes(ctx.leituras, mes);
  const escolhido = opcoes.find((l) => l.livro.id === ctx.favoritos[`${ctx.ano}-${String(mes + 1).padStart(2, "0")}`]);
  const sugestao = !escolhido ? sugestaoDoMes(ctx.leituras, mes) : undefined;
  const l = escolhido ?? sugestao;
  const clicavel = ctx.editar && opcoes.length > 0;
  const corpo = (
    <>
      <p style={{ textAlign: "center", fontFamily: serif, fontSize: 11.5, color: C.ameixa, padding: "5px 0 4px" }}>{MESES[mes]}</p>
      <div style={{ flex: "none", height: 132, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {l ? (
          <span style={{ position: "relative", opacity: escolhido ? 1 : 0.55 }}>
            <Mini l={l.livro} w={74} />
            {escolhido ? (
              <span style={{ position: "absolute", top: 9, right: -14, transform: "rotate(38deg)", background: C.rosaSuave, color: C.bordo, fontFamily: maquina, fontSize: 7.5, padding: "1px 12px", border: `0.6px solid ${C.fio}` }}>favorito</span>
            ) : null}
          </span>
        ) : (
          <span style={{ width: 74, height: 111, border: `1px solid ${C.fio}`, borderRadius: 2, background: "rgba(255,255,255,.5)" }} />
        )}
      </div>
      <div style={{ flex: 1, borderTop: `1px solid ${C.fio}`, marginTop: 6, padding: "5px 7px", ...fundoDoPapel("quadriculado"), backgroundColor: "rgba(251,247,240,.6)" }}>
        {l ? (
          <>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 3 }}>
              <Estrelas nota={l.nota} tamanho={10} />
            </div>
            {l.livro.genero ? <Escrito rotulo="Gênero:" valor={l.livro.genero} /> : null}
            <Escrito rotulo="Páginas:" valor={l.livro.paginas ? String(l.livro.paginas) : ""} />
            <Escrito rotulo="Formato:" valor={l.formato ? FORMATO_NOME[l.formato] : ""} />
            {!escolhido ? <p style={{ marginTop: 3, textAlign: "center", fontFamily: maquina, fontSize: 7, color: C.bordo }}>{ctx.editar ? "sugestão · tocar para escolher" : "sugestão"}</p> : null}
          </>
        ) : opcoes.length ? (
          <p style={{ textAlign: "center", fontSize: 7.5, color: C.tinta, marginTop: 10 }}>{ctx.editar ? "tocar para escolher" : ""}</p>
        ) : null}
      </div>
    </>
  );
  const caixa: CSSProperties = { display: "flex", flexDirection: "column", border: `1px solid ${C.fio}`, borderRadius: 3, background: "rgba(251,247,240,.85)", overflow: "hidden", minHeight: 0, textAlign: "left", padding: 0, font: "inherit", color: "inherit" };
  return clicavel ? (
    <button type="button" onClick={() => ctx.editar!.favorito(mes)} aria-label={`Escolher o favorito de ${MESES[mes]}`} style={{ ...caixa, cursor: "pointer" }}>
      {corpo}
    </button>
  ) : (
    <div style={caixa}>{corpo}</div>
  );
}

function Bilhete({ n, i, editar }: { n: Nota; i: number; editar: boolean }) {
  const fundos = ["#FFFDF7", "rgba(220,227,240,.75)", "rgba(245,217,224,.7)", "rgba(241,223,160,.55)"];
  const fita = [C.rosa, C.azul, C.amarelo, C.verde][i % 4];
  const conteudo = (
    <p style={{ fontFamily: serif, fontStyle: n.tipo === "anotação" ? "normal" : "italic", fontSize: 9, lineHeight: 1.45, color: C.ameixa, whiteSpace: "pre-line" }}>
      {n.tipo === "anotação" ? n.texto : `“${n.texto}”`}
    </p>
  );
  return (
    <div style={{ breakInside: "avoid", position: "relative", marginBottom: 12, padding: "12px 9px 8px", background: fundos[i % fundos.length], boxShadow: "0 1px 1.5px rgba(56,37,44,.12)", transform: `rotate(${[-0.8, 0.6, -0.4, 0.9][i % 4]}deg)` }}>
      <span aria-hidden style={{ position: "absolute", top: -4, left: "50%", width: 38, height: 9, marginLeft: -19, background: fita, opacity: 0.75, transform: `rotate(${i % 2 ? 3 : -3}deg)` }} />
      {n.spoiler ? (
        editar ? (
          <details>
            <summary style={{ fontSize: 8, color: C.bordo, cursor: "pointer" }}>Trecho com spoiler: mostrar</summary>
            {conteudo}
          </details>
        ) : (
          <p style={{ fontSize: 8, fontStyle: "italic" }}>Trecho com spoiler.</p>
        )
      ) : (
        conteudo
      )}
      {n.comentario ? <p style={{ marginTop: 4, fontSize: 7.5, color: C.tinta }}>{n.comentario}</p> : null}
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, borderTop: `0.6px solid ${C.fioLeve}`, paddingTop: 5 }}>
        <Mini l={n.livro} w={14} borda={0.8} />
        <span style={{ minWidth: 0, fontSize: 6.8, color: C.tinta, lineHeight: 1.2 }}>
          <b style={{ fontWeight: 600 }}>{n.livro.titulo}</b> · {n.livro.autor}
          {n.pagina ? ` · p. ${n.pagina}` : ""}
          {n.capitulo ? ` · ${n.capitulo}` : ""}
        </span>
      </div>
    </div>
  );
}
