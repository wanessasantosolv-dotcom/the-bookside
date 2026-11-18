import Link from "next/link";

/** Linha de status da busca: procurando, sem conexão ou nada encontrado. */
export function EstadoBusca({
  estado,
  vazio,
  termo,
  volta,
}: {
  estado: "sugestoes" | "carregando" | "pronto" | "erro";
  vazio: boolean;
  /** com termo, oferece cadastrar o livro quando a busca não acha */
  termo?: string;
  volta?: string;
}) {
  if (estado === "carregando")
    return (
      <p role="status" className="py-6 text-center font-accent text-sm italic text-cinza">
        procurando na estante do mundo… ✦
      </p>
    );
  if (estado === "erro")
    return (
      <p role="status" className="mb-1 rounded-sm bg-rosa-fundo px-3 py-2 text-xs text-bordo">
        não conseguimos falar com o catálogo agora. mostrando o que temos por aqui.
      </p>
    );
  if (estado === "pronto" && vazio)
    return (
      <div role="status" className="py-6 text-center">
        <p className="font-accent text-sm italic text-cinza">
          nenhum livro encontrado. tente o título ou o nome da autora.
        </p>
        {termo !== undefined ? <LinkCadastrar termo={termo} volta={volta} destaque /> : null}
      </div>
    );
  return null;
}

/** "não achou? cadastre o livro" — abre o cadastro já com o título digitado. */
export function LinkCadastrar({ termo, volta, destaque }: { termo: string; volta?: string; destaque?: boolean }) {
  const href = `/livro/novo?titulo=${encodeURIComponent(termo.trim())}${volta ? `&volta=${encodeURIComponent(volta)}` : ""}`;
  return destaque ? (
    <Link
      href={href}
      className="mt-4 inline-flex min-h-11 items-center rounded-pill bg-bordo px-5 text-[13px] font-semibold text-creme"
    >
      cadastrar “{termo.trim()}”
    </Link>
  ) : (
    <p className="py-5 text-center text-[13px] text-cinza">
      não achou o livro?{" "}
      <Link href={href} className="font-semibold text-bordo underline underline-offset-4">
        cadastre ele
      </Link>
    </p>
  );
}
