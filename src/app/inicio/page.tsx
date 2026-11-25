"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { AlternarAparencia } from "@/components/Aparencia";
import {
  Atalhos,
  EntreLeitores,
  JournalTemporario,
  LendoAgoraHome,
  MetaDeLeitura,
  ParaVoce,
  QuoteDoDia,
  SeusClubes,
  saudacao,
} from "@/components/inicio/Secoes";
import { useHidratado } from "@/components/PerfilHidratacao";
import { SeloNovidades } from "@/components/social/AvisoNovidades";
import { ComConta } from "@/components/social/Estados";
import { Avatar } from "@/components/social/Pessoas";
import { usePerfil } from "@/lib/perfil-store";

const iconeLink =
  "flex min-h-11 items-center gap-2 rounded-pill px-3 text-[13px] font-semibold text-bordo hover:bg-rosa-fundo";

/**
 * Topo do início: saudação com a data; à direita, buscar, novidades e a sua foto
 * (que leva ao perfil). No computador, os botões têm o nome escrito.
 */
function Topo({ nome }: { nome: string }) {
  const foto = usePerfil((s) => s.foto);
  const usuario = usePerfil((s) => s.usuario);
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 pt-2 lg:mb-6 lg:flex-nowrap lg:px-0 lg:pt-0">
      {/* no celular, a saudação fica numa linha só dela, abaixo dos ícones */}
      <div className="order-2 w-full min-w-0 lg:order-none lg:w-auto">
        <h1 className="font-revista text-[28px] leading-tight text-bordo italic lg:text-[38px]">
          {saudacao()}, {(nome || "leitora").split(" ")[0].toLowerCase()}.
        </h1>
      </div>
      <nav
        aria-label="atalhos"
        className="order-1 -mr-2 ml-auto flex flex-none items-center gap-0.5 lg:order-none lg:mr-0 lg:ml-0 lg:gap-1.5"
      >
        <Link href="/buscar" aria-label="buscar livros" data-tour="buscar" className={iconeLink}>
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            aria-hidden
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="hidden lg:inline">buscar livros</span>
        </Link>
        <Link href="/pessoas" aria-label="encontrar pessoas" data-tour="pessoas" className={iconeLink}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <circle cx="9" cy="8" r="4" />
            <path d="M2 21c1-4 3.8-6 7-6s6 2 7 6" />
            <path d="M19 8v6M16 11h6" />
          </svg>
          <span className="hidden lg:inline">encontrar pessoas</span>
        </Link>
        <Link href="/novidades" aria-label="novidades" data-tour="novidades" className={`relative ${iconeLink}`}>
          <SeloNovidades className="top-1 left-6" />
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <span className="hidden lg:inline">novidades</span>
        </Link>
        <AlternarAparencia />
        <Link
          href="/perfil"
          aria-label="seu perfil"
          className="ml-1 flex size-11 items-center justify-center"
        >
          <Avatar
            pessoa={{ id: "eu", usuario, nome, foto }}
            tamanho={36}
            className="border border-linha"
          />
        </Link>
      </nav>
    </header>
  );
}

/**
 * O início: saudação, quote do dia, leituras em andamento, uma prévia da meta,
 * os amigos, os clubes, recomendações e (alguns dias por mês) a revista.
 * A análise detalhada fica na Jornada.
 */
export default function InicioPage() {
  const hidratado = useHidratado();
  const nome = usePerfil((s) => s.nome);
  if (!hidratado) return <AppShell aba="inicio">{null}</AppShell>;
  return (
    <AppShell aba="inicio">
      <div className="flex flex-1 flex-col pb-8 lg:bg-jornal lg:px-12 lg:py-8">
        <div className="mx-auto w-full max-w-[1240px]">
          <Topo nome={nome} />

          {/* ───── computador: duas colunas assimétricas ───── */}
          <div className="hidden gap-10 lg:grid lg:grid-cols-[minmax(0,2.1fr)_minmax(280px,1fr)] xl:gap-14">
            <div className="min-w-0 space-y-10">
              <QuoteDoDia />
              <LendoAgoraHome />
              <ComConta>
                <EntreLeitores />
              </ComConta>
              <ParaVoce />
            </div>
            <aside className="min-w-0 space-y-10">
              <JournalTemporario />
              <MetaDeLeitura />
              <ComConta>
                <SeusClubes limite={3} />
              </ComConta>
              <Atalhos />
            </aside>
          </div>

          {/* ───── celular: uma coluna, na ordem do guia ───── */}
          <div className="space-y-8 px-5 pt-4 lg:hidden">
            <QuoteDoDia />
            <LendoAgoraHome />
            <MetaDeLeitura faixa />
            <ComConta>
              <EntreLeitores />
            </ComConta>
            <ComConta>
              <SeusClubes limite={1} />
            </ComConta>
            <ParaVoce />
            <JournalTemporario />
            <Atalhos />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
