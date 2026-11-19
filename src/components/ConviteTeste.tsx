"use client";

import Link from "next/link";

/** O convite para o teste "que tipo de leitora você é?" — no feed e no perfil, enquanto a pessoa não fez. */
export function ConviteTeste() {
  return (
    <Link
      href="/teste"
      className="group relative block overflow-hidden rounded-xl bg-ameixa p-5 text-creme lg:rounded-[4px] lg:p-7"
    >
      {/* lombadas decorativas */}
      <span
        aria-hidden
        className="absolute -right-3 bottom-0 flex items-end gap-1 opacity-90 transition-transform group-hover:-translate-y-1 sm:right-5"
      >
        {[
          ["#B75A6B", 70, -6],
          ["#A88B64", 92, 0],
          ["#F2C9D2", 60, 0],
          ["#6B7A5E", 84, 4],
          ["#8E1D3D", 74, 0],
        ].map(([cor, alto, giro], i) => (
          <span
            key={i}
            className="block w-4 rounded-t-[3px] sm:w-5"
            style={{
              background: cor as string,
              height: alto as number,
              transform: `rotate(${giro}deg)`,
              transformOrigin: "bottom",
            }}
          />
        ))}
      </span>
      <span className="relative block max-w-[72%] sm:max-w-[60%]">
        <span className="block text-[10px] font-semibold tracking-[.16em] text-rosa-claro uppercase">
          ✦ teste · 3 minutinhos
        </span>
        <span className="mt-2 block font-display text-[24px] leading-[1.1] font-semibold italic lg:font-revista lg:text-[28px] lg:font-normal">
          que tipo de leitora você é?
        </span>
        <span className="mt-2 block font-accent text-[15px] leading-snug italic text-creme/80 lg:font-texto lg:text-[13px] lg:not-italic">
          15 perguntas para descobrir o seu bookside — e ganhar indicações com a
          sua cara.
        </span>
        <span className="mt-4 inline-flex h-10 items-center rounded-pill bg-creme px-5 text-[13px] font-semibold text-bordo">
          fazer o teste →
        </span>
      </span>
    </Link>
  );
}
