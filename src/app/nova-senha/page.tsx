"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { campoConta, ContaShell, rotuloConta } from "@/components/conta/ContaShell";
import { Botao } from "@/components/ui/Botao";
import { mensagemDeErro, supabase } from "@/lib/supabase";

/** Aberta pelo link do e-mail de "esqueci a senha" (o Supabase já entra com a sessão de recuperação). */
export default function NovaSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (senha.length < 8) return setErro("a senha precisa ter pelo menos 8 caracteres.");
    if (senha !== confirmar) return setErro("as senhas não são iguais.");
    if (!supabase) return router.push("/entrar");
    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);
    if (error) return setErro(mensagemDeErro(error));
    router.push("/inicio");
  }

  return (
    <ContaShell eyebrow="sem problema" voltar={{ href: "/entrar", rotulo: "entrar" }} titulo="crie uma nova senha" descricao="escolha uma senha nova para a sua conta.">
      <form onSubmit={salvar} noValidate>
        <label className="mt-[22px] block">
          <span className={rotuloConta}>nova senha</span>
          <input type="password" autoComplete="new-password" placeholder="mínimo 8 caracteres" className={campoConta} value={senha} onChange={(e) => setSenha(e.target.value)} />
        </label>
        <label className="mt-3.5 block">
          <span className={rotuloConta}>confirmar senha</span>
          <input type="password" autoComplete="new-password" placeholder="repita a senha" className={campoConta} value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
        </label>
        <p role="alert" className="mt-2 min-h-4 text-xs font-medium text-bordo-suave">
          {erro}
        </p>
        <Botao type="submit" className="mt-2" disabled={enviando}>
          {enviando ? "salvando…" : "salvar nova senha"}
        </Botao>
      </form>
    </ContaShell>
  );
}
