"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/social/Pessoas";
import { aceitarConvite, recusarConvite } from "@/lib/lerjunto";
import { nomeDe, type PessoaResumo } from "@/lib/social";
import { CartaoConvite, LinkDetalhes, botaoPrincipal, botaoSecundario, botaoTexto, useCompartilharConvite } from "./Convite";
import type { Coread } from "./calculos";

/* ───────── convite enviado (aguardando) ───────── */
export function ConviteEnviado({ l, eu }: { l: Coread; eu: string | null }) {
  const c = useCompartilharConvite(l);
  const esperando = l.pessoas.filter((p) => p.estado === "convidada");
  return (
    <li>
      <CartaoConvite l={l} compacto>
        <span className="mr-auto flex items-center gap-1.5 text-[12px] text-tinta-suave">
          {esperando.slice(0, 4).map((p) => (
            <Avatar key={p.usuario_id} pessoa={p.pessoa} tamanho={22} />
          ))}
          aguardando {esperando.map((p) => (p.usuario_id === eu ? "você" : nomeDe(p.pessoa))).join(", ")}
        </span>
        <button type="button" onClick={c.compartilhar} className={botaoSecundario}>
          {c.copiado === "convite" ? "convite copiado" : "compartilhar convite"}
        </button>
        <button type="button" onClick={c.copiarLink} className={botaoTexto}>
          {c.copiado === "link" ? "link copiado" : "copiar link"}
        </button>
        <LinkDetalhes id={l.id} />
      </CartaoConvite>
    </li>
  );
}

export function ConviteRecebido({ l, deQuem, onMudou }: { l: Coread; deQuem: PessoaResumo | null; onMudou: () => void }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  async function fazer(acao: "aceitar" | "recusar") {
    setOcupado(true);
    setErro(null);
    try {
      if (acao === "aceitar") {
        await aceitarConvite(l.id);
        router.push(`/co-read/${l.id}`);
      } else {
        await recusarConvite(l.id);
        onMudou();
      }
    } catch {
      setErro("não deu agora. tente de novo.");
      setOcupado(false);
    }
  }
  return (
    <li>
      <CartaoConvite l={l} deQuem={deQuem}>
        <button type="button" disabled={ocupado} onClick={() => fazer("aceitar")} className={botaoPrincipal}>
          aceitar
        </button>
        <button type="button" disabled={ocupado} onClick={() => fazer("recusar")} className={botaoSecundario}>
          recusar
        </button>
        <LinkDetalhes id={l.id} />
        {erro ? <span className="w-full text-[12px] text-bordo">{erro}</span> : null}
      </CartaoConvite>
    </li>
  );
}

