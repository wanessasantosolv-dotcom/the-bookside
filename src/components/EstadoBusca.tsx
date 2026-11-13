/** Linha de status da busca: procurando, sem conexão ou nada encontrado. */
export function EstadoBusca({ estado, vazio }: { estado: "sugestoes" | "carregando" | "pronto" | "erro"; vazio: boolean }) {
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
      <p role="status" className="py-6 text-center font-accent text-sm italic text-cinza">
        nenhum livro encontrado. tente o título ou o nome da autora.
      </p>
    );
  return null;
}
