"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useClube } from "@/components/clube/ClubeContexto";
import { botaoContorno, Rodape, TopoForm } from "@/components/clube/Pecas";
import { Avatar } from "@/components/social/Pessoas";
import { linkDeConvite, tirarMembro } from "@/lib/clubes";
import { nomeDe, useMeuId } from "@/lib/social";

function Convite() {
  const { clube, membros, papel, recarregar } = useClube();
  const eu = useMeuId();
  const novo = useSearchParams().get("novo") === "1";
  const [link, setLink] = useState("");
  const [copiado, setCopiado] = useState<"link" | "codigo" | null>(null);
  useEffect(() => setLink(linkDeConvite(clube.codigo)), [clube.codigo]);

  async function copiar(texto: string, qual: "link" | "codigo") {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(qual);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      /* sem permissão de copiar: a pessoa pode selecionar o texto */
    }
  }

  async function enviar() {
    const texto = `vem pro clube ${clube.nome} no the bookside! o código é ${clube.codigo}`;
    try {
      if (navigator.share) await navigator.share({ title: clube.nome, text: texto, url: link });
      else await copiar(`${texto}\n${link}`, "link");
    } catch {
      /* a pessoa cancelou */
    }
  }

  async function tirar(id: string, nome: string) {
    if (!confirm(`tirar ${nome} do clube?`)) return;
    await tirarMembro(clube.id, id);
    recarregar();
  }

  const botao = "flex min-h-11 flex-1 items-center justify-center rounded-pill text-[13px] font-semibold";

  return (
    <div className="flex min-h-[70dvh] flex-col">
      <TopoForm
        voltar={{ href: `/clubes/${clube.id}`, r: clube.nome }}
        rotulo="convidar"
        titulo={novo ? "clube criado! ✦" : "chama mais gente"}
        frase={novo ? "agora chama as amigas: mande o link ou o código." : "quem entra pelo link já cai no clube ✦"}
      />
      <div className="mt-6 space-y-6 px-6 lg:max-w-[640px] lg:px-0">
        <div className="rounded-xl border border-linha bg-creme-quente p-4 lg:rounded-[4px] lg:border-fio lg:bg-transparent lg:p-5">
          <p className="text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">link de convite</p>
          <p className="mt-2 rounded-md border border-linha bg-creme px-3 py-3 font-accent text-sm break-all italic text-cinza">{link || "…"}</p>
          <div className="mt-3 flex gap-2.5">
            <button type="button" onClick={() => copiar(link, "link")} className={`${botao} bg-bordo text-creme`}>
              {copiado === "link" ? "copiado ✓" : "copiar link"}
            </button>
            <button type="button" onClick={enviar} className={`${botao} border border-bordo text-bordo`}>
              enviar
            </button>
          </div>
          <p className="mt-4 text-[10px] font-semibold tracking-[.16em] text-cinza uppercase">ou o código</p>
          <button
            type="button"
            onClick={() => copiar(clube.codigo, "codigo")}
            aria-label={`código ${clube.codigo.split("").join(" ")}, tocar para copiar`}
            className="mt-2 flex gap-1.5"
          >
            {clube.codigo.split("").map((c, i) => (
              <span key={i} className="flex h-11 w-9 items-center justify-center rounded-md border border-linha bg-creme font-display text-xl font-semibold text-bordo">
                {c}
              </span>
            ))}
          </button>
          <p className="mt-2 font-accent text-xs italic text-cinza">{copiado === "codigo" ? "código copiado ✓" : "toque no código para copiar."}</p>
        </div>

        <section>
          <p className="text-[10px] font-semibold tracking-[.16em] text-bordo uppercase">membros · {membros.length}</p>
          <ul className="mt-2">
            {membros.map((m) => (
              <li key={m.usuario_id} className="flex items-center gap-3 border-t border-linha py-3 lg:border-fio">
                <Avatar pessoa={m.pessoa} tamanho={38} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{m.usuario_id === eu ? "você" : nomeDe(m.pessoa)}</span>
                  {m.pessoa.usuario ? <span className="block truncate text-xs text-cinza">@{m.pessoa.usuario}</span> : null}
                </span>
                <span className={`text-[10px] font-semibold tracking-[.12em] uppercase ${m.papel === "moderadora" ? "text-bordo" : "text-cinza"}`}>
                  {m.usuario_id === clube.criado_por ? "dona" : m.papel}
                </span>
                {papel === "moderadora" && m.usuario_id !== eu ? (
                  <button type="button" onClick={() => tirar(m.usuario_id, nomeDe(m.pessoa))} className="min-h-9 px-1 text-xs text-cinza underline underline-offset-2 hover:text-bordo">
                    tirar
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <Rodape>
        <Link href="/clubes/entrar" className={`${botaoContorno} flex-1 lg:max-w-[640px]`}>
          entrar com um convite
        </Link>
      </Rodape>
    </div>
  );
}

export default function ConvidarPage() {
  return (
    <Suspense>
      <Convite />
    </Suspense>
  );
}
