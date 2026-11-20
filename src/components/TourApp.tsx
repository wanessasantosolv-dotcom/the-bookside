"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { usePerfil } from "@/lib/perfil-store";

/**
 * O passeio guiado: a tela escurece e só o lugar que está sendo explicado fica
 * aceso, com um balãozinho do lado. Aparece uma vez, no início, depois do cadastro.
 * Os lugares são marcados no app com data-tour="…"; passo sem lugar na tela é pulado.
 */
type Passo = { alvo?: string; titulo: string; texto: string };

const PASSOS: Passo[] = [
  {
    titulo: "bem-vinda ao the bookside ✦",
    texto:
      "um passeio de 1 minuto pelo app. eu acendo cada lugar e conto pra que serve.",
  },
  {
    alvo: "lendo",
    titulo: "o que você está lendo",
    texto:
      "atualize a página em que parou, abra o modo foco (⏱) para ler com cronômetro e marque “terminei” quando acabar. dá para ler o mesmo livro junto com uma amiga, cada uma na sua página, sem precisar de clube — é o “ler junto”.",
  },
  {
    alvo: "publicar",
    titulo: "publicar",
    texto:
      "conte o que está achando de um livro ou guarde um trecho. aparece no feed de quem te segue.",
  },
  {
    alvo: "buscar",
    titulo: "buscar livros",
    texto:
      "ache qualquer livro e coloque na estante: lendo, quero ler ou já li.",
  },
  {
    alvo: "pessoas",
    titulo: "encontrar pessoas",
    texto:
      "procure amigos pelo nome ou pelo @usuário e siga para ver o que estão lendo.",
  },
  {
    alvo: "novidades",
    titulo: "novidades",
    texto:
      "curtidas, comentários, novos seguidores e avisos dos seus clubes ficam aqui.",
  },
  {
    alvo: "desafios",
    titulo: "desafios de leitura",
    texto:
      "metas e desafios pra se desafiar: sozinha, com amigas ou com o clube. escolha um modelo ou crie o seu.",
  },
  {
    alvo: "aba-estantes",
    titulo: "estantes",
    texto:
      "lidos, lendo, quero ler, pausados — e estantes suas. dá pra importar a lista antiga e os destaques do kindle.",
  },
  {
    alvo: "aba-descobrir",
    titulo: "descobrir",
    texto:
      "uma indicação por vez, pelo seu gosto (com ajuda de IA): passe, guarde para ler ou marque que já leu.",
  },
  {
    alvo: "aba-clubes",
    titulo: "clubes",
    texto:
      "leia junto: sugestões, votação, agenda dos encontros, fichas e a revista do clube.",
  },
  {
    alvo: "aba-perfil",
    titulo: "perfil",
    texto:
      "seus favoritos e, nas abas, a sua jornada (números, calendário, desafios) e as suas resenhas.",
  },
];

/** o primeiro elemento visível com aquele data-tour (menu de baixo no celular, lateral no computador) */
function acharAlvo(alvo?: string): DOMRect | null {
  if (!alvo) return null;
  for (const el of document.querySelectorAll<HTMLElement>(
    `[data-tour="${alvo}"]`,
  )) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
  }
  return null;
}

export function TourApp() {
  const onboardingConcluido = usePerfil((s) => s.onboardingConcluido);
  const tourVisto = usePerfil((s) => s.tourVisto);
  const atualizar = usePerfil((s) => s.atualizar);
  const caminho = usePathname();
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [, setTique] = useState(0);
  const ativo = onboardingConcluido && !tourVisto && caminho === "/inicio";

  // passos com lugar na tela (os outros são pulados)
  const passos = PASSOS.filter(
    (p) =>
      !p.alvo ||
      (ativo && typeof document !== "undefined" && acharAlvo(p.alvo)),
  );
  const passo = passos[Math.min(i, passos.length - 1)];

  const medir = useCallback(() => {
    if (!passo?.alvo) return setRect(null);
    const els = document.querySelectorAll<HTMLElement>(
      `[data-tour="${passo.alvo}"]`,
    );
    const el = [...els].find((e) => e.getBoundingClientRect().width > 0);
    if (!el) return setRect(null);
    const r0 = el.getBoundingClientRect();
    if (r0.top < 80 || r0.bottom > window.innerHeight - 80) {
      el.scrollIntoView({ block: "center" });
    }
    setRect(el.getBoundingClientRect());
  }, [passo?.alvo]);

  useLayoutEffect(() => {
    if (!ativo) return;
    medir();
    const t = setTimeout(medir, 350);
    return () => clearTimeout(t);
  }, [ativo, medir, i]);

  useEffect(() => {
    if (!ativo) return;
    const re = () => {
      medir();
      setTique((x) => x + 1);
    };
    window.addEventListener("resize", re);
    window.addEventListener("scroll", re, true);
    // a página ainda carregando: mede de novo quando os lugares aparecerem
    const t = setTimeout(re, 1200);
    return () => {
      window.removeEventListener("resize", re);
      window.removeEventListener("scroll", re, true);
      clearTimeout(t);
    };
  }, [ativo, medir]);

  if (!ativo || !passo) return null;
  const ultimo = i >= passos.length - 1;
  const encerrar = () => atualizar({ tourVisto: true });

  // onde fica o balão: embaixo do lugar aceso; se não couber, em cima
  const folga = 12;
  const larguraBalao = Math.min(
    340,
    (typeof window !== "undefined" ? window.innerWidth : 360) - 32,
  );
  const estiloBalao: React.CSSProperties = rect
    ? (() => {
        const embaixo = rect.bottom + folga + 200 < window.innerHeight;
        const left = Math.max(
          16,
          Math.min(
            rect.left + rect.width / 2 - larguraBalao / 2,
            window.innerWidth - larguraBalao - 16,
          ),
        );
        return embaixo
          ? { top: rect.bottom + folga, left, width: larguraBalao }
          : {
              bottom: window.innerHeight - rect.top + folga,
              left,
              width: larguraBalao,
            };
      })()
    : {
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: larguraBalao,
      };

  return (
    <div
      className="fixed inset-0 z-[70]"
      role="dialog"
      aria-modal="true"
      aria-label="passeio pelo app"
    >
      {rect ? (
        <>
          {/* o "buraco" aceso: o resto da tela escurece pela sombra */}
          <div
            aria-hidden
            className="pointer-events-none absolute rounded-[14px] transition-all duration-300"
            style={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
              boxShadow: "0 0 0 9999px rgba(43,20,32,.62)",
            }}
          />
          <div
            aria-hidden
            className="tour-pulso pointer-events-none absolute rounded-[14px] border-2 border-ouro"
            style={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
            }}
          />
        </>
      ) : (
        <div aria-hidden className="absolute inset-0 bg-[#2b1420]/62" />
      )}

      <div
        className="absolute animate-subir rounded-[16px] bg-creme p-5 text-ameixa shadow-[0_24px_50px_-20px_rgba(0,0,0,.6)]"
        style={estiloBalao}
        key={i}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold tracking-[.16em] text-bordo uppercase">
            {i + 1} de {passos.length}
          </span>
          <button
            type="button"
            onClick={encerrar}
            className="min-h-8 px-1 text-xs font-semibold text-cinza"
          >
            pular
          </button>
        </div>
        <p className="mt-1.5 font-display text-[21px] leading-tight font-semibold italic text-bordo">
          {passo.titulo}
        </p>
        <p className="mt-1.5 text-[13px] leading-snug text-cinza">
          {passo.texto}
        </p>
        <div className="mt-4 flex gap-2">
          {i > 0 ? (
            <button
              type="button"
              onClick={() => setI((x) => x - 1)}
              className="h-10 rounded-pill border border-bege px-4 text-[13px] font-semibold text-ameixa"
            >
              voltar
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => (ultimo ? encerrar() : setI((x) => x + 1))}
            className="h-10 flex-1 rounded-pill bg-bordo text-[13px] font-semibold text-creme"
          >
            {ultimo ? "começar a usar ✦" : "próximo →"}
          </button>
        </div>
      </div>
    </div>
  );
}
