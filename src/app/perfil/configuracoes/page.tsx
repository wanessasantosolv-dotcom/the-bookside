"use client";

import { Voltar } from "@/components/Voltar";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { InstalarApp } from "@/components/InstalarApp";
import { Botao } from "@/components/ui/Botao";
import { usePerfil } from "@/lib/perfil-store";
import { sairDaConta, useNuvem } from "@/lib/nuvem";
import { apagarMinhasAtividades } from "@/lib/social";
import { useTeste } from "@/lib/teste-store";

export default function ConfiguracoesPage() {
  const router = useRouter();
  const email = usePerfil((s) => s.email);
  const nuvem = useNuvem((s) => s.estado);
  const erroNuvem = useNuvem((s) => s.erro);
  const quantos = usePerfil((s) => s.livros.length);
  const esvaziarEstante = usePerfil((s) => s.esvaziarEstante);
  const aparencia = usePerfil((s) => s.aparencia ?? "claro");
  const atualizar = usePerfil((s) => s.atualizar);

  async function esvaziar() {
    if (!quantos) return;
    if (
      !confirm(
        `tirar ${quantos === 1 ? "o livro" : `os ${quantos} livros`} da sua estante? as notas, resenhas e o progresso de leitura deles somem junto. as fichas dos clubes continuam. não dá para desfazer.`,
      )
    )
      return;
    esvaziarEstante();
    await apagarMinhasAtividades().catch(() => {});
    router.push("/estantes");
  }

  return (
    <AppShell aba="perfil">
      <header className="px-6 pt-2 lg:px-12 lg:pt-8">
        <Voltar
          padrao="/perfil"
          rotulo="perfil"
          className="-ml-2 flex min-h-11 w-fit items-center px-2 text-[13px] font-semibold text-bordo"
        />
        <h1 className="mt-2 font-display text-[32px] leading-[1.1] font-semibold italic text-bordo">
          configurações
        </h1>
      </header>

      <div className="flex-1 px-6 pt-6 lg:max-w-[560px] lg:px-12">
        <dl className="border-t border-linha">
          <div className="flex items-center justify-between border-b border-linha py-3.5">
            <dt className="text-sm font-semibold">seus dados</dt>
            <dd
              className={`text-[13px] ${nuvem === "erro" ? "text-bordo-suave" : "text-cinza"}`}
            >
              {
                {
                  desligada: "só neste navegador",
                  "sem-conta": "só neste navegador",
                  carregando: "abrindo…",
                  salvando: "salvando…",
                  salvo: "salvos na nuvem ✓",
                  erro: erroNuvem ?? "erro ao salvar",
                }[nuvem]
              }
            </dd>
          </div>
          <div className="flex items-center justify-between border-b border-linha py-3.5">
            <dt className="text-sm font-semibold">conta</dt>
            <dd className="text-[13px] text-cinza">
              {email ?? "sem conta conectada"}
            </dd>
          </div>
        </dl>
        <fieldset className="mt-6">
          <legend className="text-sm font-semibold">aparência</legend>
          <p className="mt-0.5 text-[13px] text-cinza">
            o app claro, escuro ou igual ao seu celular/computador.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["claro", "☀ claro"],
                ["escuro", "☾ escuro"],
                ["sistema", "automático"],
              ] as const
            ).map(([id, r]) => (
              <label
                key={id}
                className={`flex h-10 cursor-pointer items-center rounded-pill border px-4 text-[13px] font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-bordo ${
                  aparencia === id
                    ? "border-bordo bg-bordo text-creme"
                    : "border-bege bg-creme-quente text-ameixa"
                }`}
              >
                <input
                  type="radio"
                  name="aparencia"
                  className="sr-only"
                  checked={aparencia === id}
                  onChange={() => atualizar({ aparencia: id })}
                />
                {r}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-6">
          <InstalarApp />
        </div>
        <p className="mt-4 font-accent text-sm italic text-cinza">
          notificações, privacidade e o resto das configurações chegam numa
          próxima etapa.
        </p>

        <div className="mt-8 border-t border-linha pt-5">
          <p className="text-sm font-semibold">sua estante</p>
          <p className="mt-1 text-[13px] text-cinza">
            {quantos
              ? `${quantos} ${quantos === 1 ? "livro" : "livros"} na estante.`
              : "a estante está vazia."}{" "}
            para recomeçar, tire todos de uma vez e importe de novo em estantes
            → importar.
          </p>
          <button
            type="button"
            onClick={esvaziar}
            disabled={!quantos}
            className="mt-2 min-h-11 text-[13px] font-semibold text-bordo underline underline-offset-4 disabled:text-cinza disabled:no-underline"
          >
            esvaziar a estante
          </button>
        </div>

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
          {nuvem === "desligada"
            ? "sem conta na nuvem, sair apaga o perfil salvo neste navegador."
            : "seus dados continuam guardados na sua conta."}
        </p>
      </div>
    </AppShell>
  );
}
