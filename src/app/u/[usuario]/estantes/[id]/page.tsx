"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  FilaDaPrateleira,
  GradeDeLivros,
  SeletorDeFace,
  SeletorDeVista,
  useFaceSalva,
  useVistaSalva,
} from "@/components/estantes/Biblioteca";
import { estantesDela } from "@/components/perfil/DaAmiga";
import { Carregando, ComConta, ErroOuFalta, Vazio } from "@/components/social/Estados";
import { Voltar } from "@/components/Voltar";
import { lembrarLivros } from "@/lib/catalogo";
import { perfilInicial, type Perfil } from "@/lib/perfil-store";
import { perfilPorUsuario, useConsulta } from "@/lib/social";

/** a estante de outra leitora, só para ver: estante (capas ou lombadas) ou grade */
function EstanteDela({ usuario, id }: { usuario: string; id: string }) {
  const [vista, setVista] = useVistaSalva();
  const [face, setFace] = useFaceSalva();
  const [largura, setLargura] = useState(1200);
  useEffect(() => {
    const medir = () => setLargura(window.innerWidth);
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);
  const consulta = useConsulta(async () => {
    const pessoa = await perfilPorUsuario(usuario);
    if (pessoa) lembrarLivros(pessoa.dados.livros ?? []);
    return pessoa;
  }, [usuario]);

  if (consulta.carregando && !consulta.dados) return <Carregando texto="abrindo a estante…" linhas={2} />;
  if (consulta.erro) return <ErroOuFalta erro={consulta.erro} onTentar={consulta.recarregar} />;
  const pessoa = consulta.dados;
  if (!pessoa) return <Vazio titulo={`não achamos @${usuario}`} acao={{ href: "/pessoas", rotulo: "buscar pessoas" }} />;
  const p = { ...perfilInicial, ...pessoa.dados } as Perfil;
  const estante = estantesDela(p).find((e) => e.id === id);
  const nome = (pessoa.nome || pessoa.usuario || "").split(" ")[0].toLowerCase();
  if (!estante) return <Vazio titulo="essa estante não está disponível" texto="ela pode estar vazia ou privada." />;

  const util = largura >= 1024 ? largura - 380 : largura - 48;
  const porAndar = Math.max(3, Math.floor(util / (face === "lombadas" ? 38 : 118)));
  // a escolha "lista" (do meu app) vira grade aqui, que é só para ver
  const modo = vista === "lista" ? "grade" : vista;

  return (
    <div>
      <p className="text-[12px] text-cinza">estante de {nome}</p>
      <h1 className="mt-1 font-revista text-[32px] leading-none text-bordo italic lg:text-[40px]">{estante.nome}</h1>
      <p className="mt-2 text-[13px] text-tinta-suave">
        {estante.livros.length} {estante.livros.length === 1 ? "livro" : "livros"}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-linha pb-4 lg:border-fio">
        {modo === "estante" ? <SeletorDeFace face={face} onChange={setFace} /> : <span />}
        <SeletorDeVista vista={modo} onChange={setVista} />
      </div>
      <div className="pt-8">
        {modo === "estante" ? (
          <div className="space-y-10">
            {Array.from({ length: Math.ceil(estante.livros.length / porAndar) }, (_, k) => (
              <FilaDaPrateleira key={k} livros={estante.livros.slice(k * porAndar, (k + 1) * porAndar)} altura={150} face={face} />
            ))}
          </div>
        ) : (
          <GradeDeLivros livros={estante.livros} />
        )}
      </div>
    </div>
  );
}

export default function EstanteDelaPage() {
  const { usuario, id } = useParams<{ usuario: string; id: string }>();
  return (
    <AppShell aba="inicio">
      <div className="mx-auto w-full max-w-[1240px] px-5 pt-2 pb-16 sm:px-8 lg:px-14 lg:pt-8">
        <Voltar padrao={`/u/${usuario}`} rotulo="perfil" className="-ml-2 mb-3 flex min-h-11 items-center px-2 text-[13px] font-semibold text-bordo" />
        <ComConta>
          <EstanteDela usuario={decodeURIComponent(usuario)} id={id} />
        </ComConta>
      </div>
    </AppShell>
  );
}
