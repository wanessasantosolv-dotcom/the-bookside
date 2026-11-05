"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Tela } from "@/components/ui/Tela";
import { Botao, BotaoLink } from "@/components/ui/Botao";
import { temas } from "@/lib/dados";
import { usePerfil } from "@/lib/perfil-store";

export default function ProntoPage() {
  const { nome, usuario, livros, gostos, tema, atualizar } = usePerfil();
  const [aberto, setAberto] = useState(false);
  const nomeTema = temas.find((t) => t.id === tema)?.nome ?? "nova leitora";

  useEffect(() => {
    atualizar({ onboardingConcluido: true });
  }, [atualizar]);

  return (
    <Tela className="papel-pontilhado items-center px-6 pb-[max(24px,env(safe-area-inset-bottom))]" >
      <div data-aberto={aberto} className="relative flex w-full flex-1 flex-col items-center">
        <p className="eyebrow mt-5 !text-[10px] !tracking-[.14em] text-cinza">tudo pronto ✦</p>

        <div className={`mt-2 text-center transition-opacity duration-500 ${aberto ? "opacity-0" : ""}`}>
          <h1 className="font-display text-[31px] leading-[1.08] font-bold italic text-bordo">seu perfil está pronto</h1>
          <p className="mt-2.5 text-sm leading-[1.45] text-cinza">
            bem-vinda ao the bookside.
            <br />
            sua estante já começou.
          </p>
        </div>

        <span aria-hidden className="estrelinha absolute top-[214px] left-7 text-[15px] text-ouro">✦</span>
        <span aria-hidden className="estrelinha absolute top-[252px] right-6 text-xs text-rosa-antigo [transition-delay:1.9s]">✧</span>
        <span aria-hidden className="estrelinha absolute top-[430px] left-5 text-[11px] text-ouro [transition-delay:2.1s]">✧</span>
        <span aria-hidden className="estrelinha absolute top-[446px] right-4 text-sm text-rosa-antigo [transition-delay:2.3s]">✦</span>

        {/* o livro */}
        <div data-aberto={aberto} className="livro3d relative mt-8 h-[318px] w-[212px]">
          <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center rounded-[4px_10px_10px_4px] bg-[#FFFCF6] px-6 text-center shadow-[inset_0_0_0_1px_#E6D5CE,inset_-8px_0_10px_-8px_rgba(43,20,32,.25)]">
            <span className="revela font-accent text-[26px] leading-none italic text-ouro [transition-delay:1.5s]">✦</span>
            <p className="revela mt-3.5 font-display text-[26px] leading-[1.18] font-bold italic text-bordo [transition-delay:1.7s]">
              sua história começa agora
            </p>
            <p className="revela mt-3.5 font-accent text-sm leading-[1.35] italic text-cinza [transition-delay:2.1s]">
              vire a página e escreva
              <br />o primeiro capítulo
            </p>
          </div>

          <span className="absolute top-[7px] right-[-5px] bottom-[7px] z-[4] w-1.5 rounded-[0_3px_3px_0] bg-[repeating-linear-gradient(180deg,#F5EFE6_0_2px,#E0D2C6_2px_3px)]" />
          {(["f3", "f2", "f1"] as const).map((f, i) => (
            <div
              key={f}
              className={`folha ${f} absolute inset-0 rounded-[0_8px_8px_0] bg-papel shadow-[inset_-7px_0_9px_-7px_rgba(43,20,32,.3)]`}
              style={{ zIndex: i + 2 }}
            />
          ))}

          <div className="capa absolute inset-0 z-[5] overflow-hidden rounded-[4px_10px_10px_4px] bg-[linear-gradient(145deg,#8E1D3D,#6B0D24_42%,#4B0D1B)] shadow-[0_24px_30px_-14px_rgba(43,20,32,.6)]">
            <span className="absolute inset-y-0 left-0 w-4 bg-[linear-gradient(90deg,#4B0D1B,#8E1D3D_58%,#3E0A16)]" />
            <span className="absolute inset-y-0 left-[17px] w-px bg-ouro/65" />
            <span className="absolute top-10 right-6 left-10 h-px bg-ouro/75" />
            <span className="absolute top-[258px] right-6 left-10 h-px bg-ouro/75" />
            <p className="eyebrow absolute top-[52px] right-6 left-10 text-center !text-[8px] text-rosa-claro">a leitora</p>
            <div className="absolute top-[92px] right-6 left-10 text-center">
              <p className="font-accent text-[30px] leading-none italic text-ouro">✦</p>
              <p className="mt-3.5 font-display text-[29px] leading-[1.05] font-bold break-words italic text-creme">
                {nome || "seu nome"}
              </p>
              <p className="mt-2 text-[11px] leading-[1.3] text-rosa-claro">@{usuario || "seu.nome"}</p>
            </div>
            <div className="absolute inset-x-0 top-[272px] pl-4 text-center">
              <span className="inline-flex h-6 items-center rounded-pill border border-ouro px-3 text-[9px] font-semibold tracking-[.14em] text-ouro uppercase">
                ♡ {nomeTema}
              </span>
            </div>
          </div>
        </div>

        <dl className="mt-11 flex w-full border-y border-linha py-3.5">
          {[
            { n: livros.length, r: livros.length === 1 ? "livro" : "livros" },
            { n: gostos.length, r: "gostos" },
            { n: 0, r: "clubes" },
          ].map((x, i) => (
            <div key={x.r} className={`flex flex-1 flex-col-reverse items-center ${i ? "border-l border-linha" : ""}`}>
              <dt className="mt-1.5 text-[10px] leading-none font-medium text-cinza">{x.r}</dt>
              <dd className="font-display text-[22px] leading-none font-bold italic text-bordo">{x.n}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto w-full pt-8">
          {aberto ? (
            <div className="animate-subir [animation-delay:2.2s]">
              <BotaoLink href="/inicio">ir para o início</BotaoLink>
              <p className="mt-3 text-center">
                <Link href="/perfil" className="inline-block py-2 text-xs font-semibold text-cinza underline underline-offset-4">
                  ver meu perfil
                </Link>
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-center font-accent text-[15px] leading-[1.35] italic text-cinza">
                toque para abrir o seu livro ✧
              </p>
              <Botao onClick={() => setAberto(true)}>abrir o livro</Botao>
            </>
          )}
        </div>
      </div>
    </Tela>
  );
}
