"use client";

import { CapaAuto } from "@/components/CapaAuto";
import { EstrelasFixas } from "@/components/marginalia/Estrelas";
import { TemaSimbolo } from "@/components/TemaSimbolo";
import { formatos } from "@/lib/formatos";
import { CRITERIOS, RECOMENDARIA, RELERIA, notaTexto } from "@/lib/marginalia";
import { reacaoDe } from "@/lib/reacoes";
import { temaApp } from "@/lib/temas";
import type { FormatoLivro, NotasDetalhe, Reacao } from "@/lib/perfil-store";

export type DadosFicha = {
  livro: { id: string; titulo: string; autor: string; capa?: string; genero?: string; paginas?: number };
  leitora?: { nome: string; foto?: string | null };
  tema?: string;
  inicio?: string;
  fim?: string;
  soAno?: boolean;
  dias?: number | null;
  formato?: FormatoLivro;
  nota: number;
  notas: Partial<NotasDetalhe>;
  naoAplica: (keyof NotasDetalhe)[];
  reacao?: Reacao;
  sensacoes: string[];
  resenha: string;
  spoiler: boolean;
  personagem?: string;
  trechos: { texto: string; pagina?: number; capitulo?: string; nota?: string; spoiler?: boolean }[];
  recomendaria?: "sim" | "ressalvas" | "nao";
  releria?: "sim" | "talvez" | "nao";
  concluida: boolean;
};

const data = (dia?: string) =>
  dia ? new Date(`${dia}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }).replace(".", "") : null;

/**
 * A ficha como fica publicada: uma pequena publicação literária, nas cores e
 * no símbolo do tema. Só aparece o que foi preenchido (nada vira zero).
 */
export function FichaPublicada({ d }: { d: DadosFicha }) {
  const tema = temaApp(d.tema);
  const criterios = CRITERIOS.filter((c) => d.notas[c.id] && !d.naoAplica.includes(c.id));
  const formato = formatos.find((f) => f.id === d.formato);
  const reacao = reacaoDe(d.reacao);
  const fim = d.soAno && d.fim ? `em ${d.fim.slice(0, 4)}` : data(d.fim);
  const rotulo = "text-[10px] font-semibold tracking-[.18em] text-cinza uppercase";
  return (
    <article className="relative overflow-hidden rounded-[6px] border border-linha bg-creme text-ameixa">
      {/* cabeçalho: marginalia + selo */}
      <header className="flex items-center justify-between border-b border-linha px-5 py-3">
        <p className="font-revista text-[20px] leading-none text-bordo italic">marginalia.</p>
        <span className="flex items-center gap-2 text-bordo">
          {tema ? <TemaSimbolo simbolo={tema.simbolo} tamanho={16} /> : null}
          <span className="text-[10px] font-semibold tracking-[.16em] uppercase">registro literário</span>
        </span>
      </header>

      {/* identificação */}
      <div className="grid grid-cols-[88px_1fr] gap-4 px-5 pt-5 sm:grid-cols-[104px_1fr]">
        <CapaAuto livro={d.livro} className="w-full [&>span:last-child]:hidden" />
        <div className="min-w-0">
          <h3 className="font-revista text-[24px] leading-[1.1] text-ameixa">{d.livro.titulo}</h3>
          <p className="mt-1 text-[13px] text-tinta-suave">{d.livro.autor}</p>
          {d.nota ? (
            <p className="mt-3 flex items-center gap-2">
              <EstrelasFixas valor={d.nota} tamanho={16} />
              <span className="font-revista text-[18px] text-ameixa tabular-nums">{notaTexto(d.nota)}</span>
            </p>
          ) : null}
          {reacao ? <p className="mt-2 text-[12px] text-tinta-suave">veredito: <b className="font-semibold text-ameixa">{reacao.nome}</b></p> : null}
          {d.concluida && d.fim ? (
            <span className="mt-3 inline-block -rotate-3 rounded-[3px] border-[1.5px] border-bordo px-2 py-0.5 font-revista text-[13px] text-bordo italic">officially read.</span>
          ) : null}
        </div>
      </div>

      {/* registro */}
      {d.inicio || fim || formato ? (
        <dl className="mx-5 mt-5 grid grid-cols-3 gap-3 border-y border-linha py-3 text-[12px]">
          {d.inicio && !d.soAno ? (
            <div>
              <dt className={rotulo}>início</dt>
              <dd className="mt-1 text-ameixa">{data(d.inicio)}</dd>
            </div>
          ) : null}
          {fim ? (
            <div>
              <dt className={rotulo}>{d.concluida ? "conclusão" : "parei em"}</dt>
              <dd className="mt-1 text-ameixa">{fim}</dd>
              {d.dias ? <dd className="text-cinza">{d.dias === 1 ? "1 dia" : `${d.dias} dias`} de leitura</dd> : null}
            </div>
          ) : null}
          {formato ? (
            <div>
              <dt className={rotulo}>formato</dt>
              <dd className="mt-1 text-ameixa">{formato.nome}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      <div className="space-y-5 px-5 py-5">
        {criterios.length ? (
          <section>
            <h4 className={rotulo}>aspectos da obra</h4>
            <ul className="mt-2">
              {criterios.map((c) => (
                <li key={c.id} className="flex items-center justify-between border-b border-dashed border-linha py-1.5 text-[13px]">
                  <span>{c.nome}</span>
                  <EstrelasFixas valor={d.notas[c.id]!} tamanho={12} />
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {d.sensacoes.length ? (
          <section>
            <h4 className={rotulo}>experiência de leitura</h4>
            <p className="mt-2 flex flex-wrap gap-1.5">
              {d.sensacoes.map((s) => (
                <span key={s} className="rounded-[3px] border border-linha bg-papel px-2 py-0.5 text-[12px] text-ameixa">
                  {s}
                </span>
              ))}
            </p>
          </section>
        ) : null}

        {d.resenha.trim() ? (
          <section>
            <h4 className={rotulo}>impressões pessoais</h4>
            {d.spoiler ? <p className="mt-2 text-[11px] font-semibold text-bordo">contém spoilers</p> : null}
            <p className="mt-2 font-accent text-[15px] leading-[1.6] whitespace-pre-line text-ameixa">{d.resenha.trim()}</p>
          </section>
        ) : null}

        {d.personagem ? (
          <p className="text-[13px] text-tinta-suave">
            personagem favorita: <b className="font-semibold text-ameixa">{d.personagem}</b>
          </p>
        ) : null}

        {d.trechos.length ? (
          <section>
            <h4 className={rotulo}>entre as páginas</h4>
            <div className="mt-2 space-y-3">
              {d.trechos.map((t, i) => (
                <blockquote key={i} className="border-l-2 border-bordo pl-3">
                  <p className="font-accent text-[15px] leading-[1.5] text-ameixa italic">“{t.texto}”</p>
                  {t.pagina || t.capitulo ? (
                    <footer className="mt-1 text-[11px] text-cinza">{[t.capitulo, t.pagina ? `p. ${t.pagina}` : null].filter(Boolean).join(" · ")}</footer>
                  ) : null}
                  {t.nota ? <p className="mt-1 text-[12px] text-tinta-suave">{t.nota}</p> : null}
                </blockquote>
              ))}
            </div>
          </section>
        ) : null}

        {d.recomendaria || d.releria ? (
          <section className="flex flex-wrap gap-x-6 gap-y-1 border-t border-linha pt-3 text-[13px]">
            {d.recomendaria ? (
              <p>
                recomendaria: <b className="font-semibold">{RECOMENDARIA.find((r) => r.id === d.recomendaria)?.nome}</b>
              </p>
            ) : null}
            {d.releria ? (
              <p>
                releria: <b className="font-semibold">{RELERIA.find((r) => r.id === d.releria)?.nome}</b>
              </p>
            ) : null}
          </section>
        ) : null}
      </div>

      {d.leitora ? (
        <footer className="flex items-center gap-2 border-t border-linha px-5 py-3 text-[12px] text-cinza">
          {d.leitora.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.leitora.foto} alt="" className="size-6 rounded-full object-cover" />
          ) : null}
          por <b className="font-semibold text-ameixa">{d.leitora.nome}</b>
        </footer>
      ) : null}
    </article>
  );
}
