"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Botao } from "@/components/ui/Botao";
import { usePerfil } from "@/lib/perfil-store";
import { sairDaConta, useNuvem } from "@/lib/nuvem";
import { useTeste } from "@/lib/teste-store";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const email = usePerfil((s) => s.email);
  const nuvem = useNuvem((s) => s.estado);
  const erroNuvem = useNuvem((s) => s.erro);

  return (
    <AppShell aba="perfil">
      <header className="px-6 pt-2 lg:px-12 lg:pt-8">
        <Link href="/perfil" className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo">
          ‹ perfil
        </Link>
        <h1 className="mt-2 font-display text-[32px] leading-[1.1] font-semibold italic text-bordo">configurações</h1>
      </header>

      <div className="flex-1 px-6 pt-6 lg:max-w-[560px] lg:px-12">
        <dl className="border-t border-linha">
          <div className="flex items-center justify-between border-b border-linha py-3.5">
            <dt className="text-sm font-semibold">seus dados</dt>
            <dd className={`text-[13px] ${nuvem === "erro" ? "text-bordo-suave" : "text-cinza"}`}>
              {{ desligada: "só neste navegador", "sem-conta": "só neste navegador", carregando: "abrindo…", salvando: "salvando…", salvo: "salvos na nuvem ✓", erro: erroNuvem ?? "erro ao salvar" }[nuvem]}
            </dd>
          </div>
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
          onClick={async () => {
            await sairDaConta();
            useTeste.getState().recomecar();
            router.push("/entrar");
          }}
        >
          sair da conta
        </Botao>
        <p className="mt-2 text-center text-[11px] text-cinza">
          {nuvem === "desligada" ? "sem conta na nuvem, sair apaga o perfil salvo neste navegador." : "seus dados continuam guardados na sua conta."}
        </p>
      </div>

    </AppShell>
  );
}
