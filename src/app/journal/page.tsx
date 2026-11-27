"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useHidratado } from "@/components/PerfilHidratacao";
import { Voltar } from "@/components/Voltar";
import { CapaJournal } from "@/components/journal/Revista";
import {
  estadoDaEdicao,
  livrosDoMes,
  mesesComLeitura,
  montarEdicao,
  paletaDoMes,
  textosPorRegras,
} from "@/lib/journal";
import { usePerfil } from "@/lib/perfil-store";

function Colecao() {
  const livros = usePerfil((s) => s.livros);
  const edicoes = usePerfil((s) => s.edicoes);
  const meses = useMemo(() => mesesComLeitura(livros), [livros]);
  const anos = [...new Set<number>(meses.map((m: string) => Number(m.slice(0, 4))))].sort((a, b) => b - a);
  const [ano, setAno] = useState(anos[0] ?? new Date().getFullYear());
  const doAno = meses.filter((m) => m.startsWith(String(ano)));
  const capas = useMemo(
    () =>
      doAno.map((chave) => {
        const estado = estadoDaEdicao(chave);
        const salva = edicoes?.[chave];
        const lista = estado === "fechada" && salva ? salva.livros : livrosDoMes(livros, chave);
        const ed = montarEdicao(chave, lista, { todos: livros });
        return { chave, estado, ed, textos: salva?.textos ?? textosPorRegras(ed), guardada: !!salva };
      }),
    [doAno.join("|"), edicoes, livros],
    // eslint-disable-next-line react-hooks/exhaustive-deps
  );

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-[.2em] text-cinza uppercase">diário literário</p>
          <h1 className="mt-1 font-display text-[34px] leading-[1.05] font-semibold text-bordo lg:font-revista lg:text-[48px] lg:font-normal lg:text-tinta">
            Suas edições
          </h1>
          <p className="mt-1 font-accent text-[15px] italic text-cinza">
            uma revista por mês, feita com as suas leituras. {doAno.length ? `${doAno.length} de 12 em ${ano}.` : ""}
          </p>
        </div>
        {anos.length > 1 ? (
          <label className="relative">
            <span className="sr-only">ano</span>
            <select
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="h-11 appearance-none rounded-[10px] border border-linha bg-creme-quente pr-9 pl-3.5 font-maquina text-[13px] text-ameixa lg:border-fio"
            >
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[10px] text-cinza">
              ▾
            </span>
          </label>
        ) : null}
      </div>

      {capas.length ? (
        <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {capas.map(({ chave, estado, ed, textos }) => (
            <li key={chave}>
              <Link href={`/journal/${chave}`} className="group block">
                <div className="transition-transform group-hover:-translate-y-1 group-hover:rotate-[-1deg]">
                  <CapaJournal ed={ed} textos={textos} paleta={paletaDoMes(ed.mes)} tamanho="media" previa={estado === "previa"} />
                </div>
                <p className="mt-3 font-maquina text-[10px] tracking-[.1em] text-cinza uppercase">
                  vol. {String(ed.vol).padStart(2, "0")}
                </p>
                <p className="font-display text-[18px] leading-tight font-semibold text-ameixa lg:font-revista lg:font-normal">
                  {ed.nome} {ed.ano}
                </p>
                <p className="text-[12px] text-cinza">
                  {ed.numeros.livros
                    ? `${ed.numeros.livros} ${ed.numeros.livros === 1 ? "livro concluído" : "livros concluídos"}`
                    : `${ed.andamento.length} em andamento`}
                  {estado === "previa" ? " · prévia" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-12 border-t border-linha pt-10 text-center lg:border-fio">
          <p className="font-display text-[24px] font-semibold text-ameixa lg:font-revista lg:font-normal">
            a primeira edição está a caminho
          </p>
          <p className="mx-auto mt-2 max-w-[420px] text-[14px] text-cinza">
            marque quando começou e terminou cada livro. no fim de cada mês, as suas leituras viram uma revista.
          </p>
        </div>
      )}
      <p className="mt-10 text-[11px] text-cinza">
        cada edição fecha no fim do mês e fica guardada como foi. se você corrigir um registro depois, a edição avisa e
        você escolhe se quer atualizar.
      </p>
    </>
  );
}

export default function ArquivoPage() {
  const hidratado = useHidratado();
  return (
    <AppShell aba="perfil">
      <div className="flex flex-1 flex-col lg:bg-jornal">
        <div className="mx-auto w-full max-w-[1180px] px-6 pb-16 lg:px-12 lg:pt-6">
          <header className="pt-2 pb-4 lg:pt-0">
            <Voltar
              padrao="/perfil?aba=jornada"
              rotulo="jornada"
              className="-ml-2 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo"
            />
          </header>
          {hidratado ? <Colecao /> : null}
        </div>
      </div>
    </AppShell>
  );
}
