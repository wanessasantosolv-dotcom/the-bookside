"use client";

import { useEffect, useState } from "react";
import {
  ideiasDeUsuario,
  limparDigitando,
  situacaoDoUsuario,
  textoDaSituacao,
  usuarioValido,
  type SituacaoUsuario,
} from "@/lib/usuario";

/**
 * O campo do @, igual em todo o app (criar perfil, editar perfil):
 * limpa enquanto digita, confere se está livre e sugere outros se não estiver.
 */
export function CampoUsuario({
  valor,
  onChange,
  nome = "",
  onSituacao,
  className = "",
  classeCaixa,
}: {
  valor: string;
  onChange: (u: string) => void;
  /** para sugerir outros @ a partir do nome */
  nome?: string;
  /** avisa quem usa o campo se dá para salvar */
  onSituacao?: (s: SituacaoUsuario) => void;
  className?: string;
  classeCaixa?: string;
}) {
  const [situacao, setSituacao] = useState<SituacaoUsuario>("verificando");
  useEffect(() => {
    if (!valor) {
      setSituacao("invalido");
      onSituacao?.("invalido");
      return;
    }
    if (!usuarioValido(valor)) {
      setSituacao("invalido");
      onSituacao?.("invalido");
      return;
    }
    setSituacao("verificando");
    onSituacao?.("verificando");
    let vivo = true;
    const t = setTimeout(() => {
      situacaoDoUsuario(valor).then((s) => {
        if (!vivo) return;
        setSituacao(s);
        onSituacao?.(s);
      });
    }, 400);
    return () => {
      vivo = false;
      clearTimeout(t);
    };
    // onSituacao muda a cada render de quem usa; só o valor importa aqui
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor]);

  const cor =
    situacao === "ok"
      ? "text-oliva"
      : situacao === "verificando"
        ? "text-cinza"
        : "text-bordo";

  return (
    <div className={className}>
      <span
        className={
          classeCaixa ??
          "flex h-12 items-center rounded-[12px] border border-bege bg-creme-quente px-4 text-[15px] font-medium focus-within:border-bordo focus-within:ring-1 focus-within:ring-bordo lg:rounded-[4px]"
        }
      >
        <span className="text-bordo">@</span>
        <input
          value={valor}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          placeholder="seu.nome"
          aria-describedby="situacao-usuario"
          onChange={(e) => onChange(limparDigitando(e.target.value))}
          className="w-full min-w-0 bg-transparent text-ameixa outline-none placeholder:text-cinza"
        />
      </span>
      <p
        id="situacao-usuario"
        aria-live="polite"
        className={`mt-1.5 text-xs ${cor}`}
      >
        {valor ? textoDaSituacao[situacao] : "é com ele que você entra e que os amigos te acham."}
      </p>
      {situacao === "em_uso" || situacao === "reservado" ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ideiasDeUsuario(valor, nome).map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => onChange(x)}
              className="flex h-8 items-center rounded-pill border border-bege bg-creme-quente px-3 text-xs font-semibold text-ameixa hover:border-bordo"
            >
              @{x}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
