"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavInferior } from "@/components/NavInferior";
import { Botao } from "@/components/ui/Botao";
import { Tela } from "@/components/ui/Tela";
import { usePerfil } from "@/lib/perfil-store";
import { useTeste } from "@/lib/teste-store";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const email = usePerfil((s) => s.email);
  const sair = usePerfil((s) => s.sair);

  return (
    <Tela>
      <header className="px-6 pt-2">
        <Link href="/perfil" className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo">
          ‹ perfil
        </Link>
        <h1 className="mt-2 font-display text-[32px] leading-[1.1] font-semibold italic text-bordo">configurações</h1>
      </header>

      <div className="flex-1 px-6 pt-6">
        <dl className="border-t border-linha">
          <div className="flex items-center justify-between border-b border-linha py-3.5">
            <dt className="text-sm font-semibold">conta</dt>
            <dd className="text-[13px] text-cinza">{email ?? "não conectada"}</dd>
          </div>
        </dl>
        <p className="mt-4 font-accent text-sm italic text-cinza">
          notificações, privacidade e o resto das configurações chegam numa próxima etapa.
        </p>

        <Botao
          variante="contorno"
          className="mt-8"
          onClick={() => {
            // TODO(supabase): supabase.auth.signOut()
            sair();
            useTeste.getState().recomecar();
            router.push("/entrar");
          }}
        >
          sair da conta
        </Botao>
        <p className="mt-2 text-center text-[11px] text-cinza">por enquanto, sair apaga o perfil salvo neste navegador.</p>
      </div>

      <NavInferior ativa="perfil" />
    </Tela>
  );
}
