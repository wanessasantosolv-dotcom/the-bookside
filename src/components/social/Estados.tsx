"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { useNuvem } from "@/lib/nuvem";

/** Carregando: o esqueleto do feed com a frase e os três pontinhos. */
export function Carregando({ texto = "trazendo as novidades…", linhas = 3 }: { texto?: string; linhas?: number }) {
  return (
    <div role="status" aria-live="polite" className="px-6 pt-4 lg:px-0">
      <span className="sr-only">{texto}</span>
      <div aria-hidden className="space-y-3">
        {Array.from({ length: linhas }, (_, i) => (
          <div key={i} className="flex gap-4 rounded-xl border border-linha bg-creme-quente p-4 lg:rounded-[4px] lg:border-fio lg:bg-transparent">
            <span className="h-[78px] w-[52px] flex-none animate-pulse rounded-[2px_5px_5px_2px] bg-linha/70" />
            <span className="flex flex-1 flex-col gap-2.5 pt-1.5">
              <span className="h-2.5 w-3/5 animate-pulse rounded-full bg-linha/70" />
              <span className="h-2.5 w-2/5 animate-pulse rounded-full bg-linha/70" />
              <span className="h-2.5 w-4/5 animate-pulse rounded-full bg-linha/60" />
            </span>
          </div>
        ))}
      </div>
      <p aria-hidden className="mt-8 text-center font-accent text-sm italic text-cinza">
        {texto}
      </p>
      <p aria-hidden className="mt-3 flex justify-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-pulse rounded-full bg-bordo"
            style={{ animationDelay: `${i * 0.2}s`, opacity: 0.4 + i * 0.3 }}
          />
        ))}
      </p>
    </div>
  );
}

/** Quando não tem nada: estrela, título em itálico, frase e uma ação. */
export function Vazio({
  titulo,
  texto,
  acao,
  className = "",
}: {
  titulo: string;
  texto?: string;
  acao?: { href?: string; onClick?: () => void; rotulo: string };
  className?: string;
}) {
  const botao = "mt-4 inline-flex min-h-11 items-center rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme";
  return (
    <div className={`relative rounded-xl border border-linha bg-creme-quente px-5 py-6 lg:rounded-[4px] lg:border-fio lg:bg-transparent ${className}`}>
      <span aria-hidden className="absolute top-4 right-5 text-lg text-ouro">
        ✦
      </span>
      <p className="max-w-[16em] font-display text-xl leading-[1.2] font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
        {titulo}
      </p>
      {texto ? <p className="mt-2 text-[13px] leading-normal text-cinza">{texto}</p> : null}
      {acao?.href ? (
        <Link href={acao.href} className={botao}>
          {acao.rotulo}
        </Link>
      ) : acao?.onClick ? (
        <button type="button" onClick={acao.onClick} className={botao}>
          {acao.rotulo}
        </button>
      ) : null}
    </div>
  );
}

function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

/** Quando falha: distingue "sem conexão" de "não carregou". */
export function Erro({ onTentar, voltar = true }: { onTentar?: () => void; voltar?: boolean }) {
  const online = useOnline();
  return (
    <div role="alert" className="mx-6 mt-4 rounded-xl border border-linha bg-creme-quente px-5 py-7 text-center lg:mx-0 lg:rounded-[4px] lg:border-fio lg:bg-transparent">
      <span aria-hidden className="mx-auto flex size-16 items-center justify-center rounded-full border border-linha text-bordo">
        {online ? (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            <path d="m9 8 6 6M15 8l-6 6" />
          </svg>
        ) : (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 5.2-2.7M19 12.9a10 10 0 0 0-2-1.5M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8A15 15 0 0 0 11 5M2 2l20 20" />
          </svg>
        )}
      </span>
      <p className="mt-4 font-display text-xl font-semibold italic text-bordo lg:font-revista lg:font-normal lg:text-tinta">
        {online ? "não consegui trazer seus dados agora" : "sem conexão"}
      </p>
      <p className="mt-2 text-[13px] leading-normal text-cinza">
        {online ? "pode ser um problema nosso. tente de novo daqui a pouco." : "confira o wi-fi ou os dados. sua estante fica salva no aparelho ✦"}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {onTentar ? (
          <button type="button" onClick={onTentar} className="min-h-11 rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme">
            tentar de novo
          </button>
        ) : null}
        {voltar ? (
          <Link href="/inicio" className="flex min-h-11 items-center rounded-pill border border-bordo px-5 text-[13px] font-semibold text-bordo">
            voltar ao início
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Telas sociais precisam de conta na nuvem. Sem Supabase (modo local) mostra
 * um aviso; carregando a sessão, o esqueleto; com conta, o conteúdo.
 */
export function ComConta({ children, carregando }: { children: ReactNode; carregando?: ReactNode }) {
  const estado = useNuvem((s) => s.estado);
  const usuario = useNuvem((s) => s.usuario);
  if (estado === "desligada")
    return (
      <div className="px-6 pt-4 lg:px-0">
        <Vazio
          titulo="isso precisa de uma conta"
          texto="amigas, clubes e comentários ficam na nuvem. o app está no modo local, só neste navegador."
          acao={{ href: "/perfil/configuracoes", rotulo: "ver configurações" }}
        />
      </div>
    );
  if (!usuario) return <>{carregando ?? <Carregando />}</>;
  return <>{children}</>;
}

/** Erro amigável quando as tabelas sociais ainda não foram criadas no Supabase. */
export function faltaTabela(erro: unknown) {
  const e = erro as { code?: string; message?: string } | null;
  return e?.code === "42P01" || e?.code === "PGRST205" || /does not exist|could not find the table/i.test(e?.message ?? "");
}

export function ErroOuFalta({ erro, onTentar }: { erro: unknown; onTentar: () => void }) {
  if (faltaTabela(erro))
    return (
      <div className="px-6 pt-4 lg:px-0">
        <Vazio
          titulo="falta um passo no banco"
          texto="as tabelas de amigas e clubes ainda não foram criadas no Supabase. rode o arquivo supabase/social.sql no SQL Editor."
        />
      </div>
    );
  return <Erro onTentar={onTentar} />;
}
