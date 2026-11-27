/**
 * Pequenas curadorias: recortes por experiência de leitura. Cada uma é uma
 * pesquisa real na busca única (os livros vêm do catálogo, conferidos), com
 * uma ilustração aprovada da coleção nas entrelinhas (sem texto na arte).
 */
export type Curadoria = { id: string; nome: string; descricao: string; consulta: string; imagem: string; cor: string };

export const CURADORIAS: Curadoria[] = [
  { id: "pequenos-refugios", nome: "Pequenos refúgios", descricao: "Histórias acolhedoras para desacelerar.", consulta: "Livros acolhedores para desacelerar", imagem: "lugar-quarto", cor: "var(--color-rosa-claro)" },
  { id: "delicadeza-do-cotidiano", nome: "A delicadeza do cotidiano", descricao: "A beleza escondida nos dias comuns.", consulta: "Histórias contemplativas sobre a vida cotidiana", imagem: "lugar-jardim", cor: "var(--color-citrico)" },
  { id: "uma-tarde-chuvosa", nome: "Uma tarde chuvosa", descricao: "Leituras introspectivas, tranquilas e atmosféricas.", consulta: "Livros para uma tarde chuvosa, intimistas e contemplativos", imagem: "lugar-cafe", cor: "var(--color-azul)" },
  { id: "alem-do-possivel", nome: "Além do possível", descricao: "Quando a realidade deixa de seguir suas próprias regras.", consulta: "Realismo mágico e histórias oníricas", imagem: "objeto-bussola", cor: "var(--color-manteiga)" },
  { id: "o-peso-do-silencio", nome: "O peso do silêncio", descricao: "Narrativas sobre solidão, memória e sentimentos difíceis de expressar.", consulta: "Livros melancólicos sobre solidão e memória", imagem: "biblioteca-esconderijo", cor: "var(--color-azul)" },
  { id: "literatura-sem-fronteiras", nome: "Literatura sem fronteiras", descricao: "Outras culturas, territórios e maneiras de existir.", consulta: "Literatura africana, japonesa e latino-americana", imagem: "lugar-trem", cor: "var(--color-oliva)" },
  { id: "entre-livros-e-segredos", nome: "Entre livros e segredos", descricao: "Bibliotecas, universidades e conhecimentos proibidos.", consulta: "Bibliotecas, universidades e segredos", imagem: "biblioteca-arquivo", cor: "var(--color-bordo)" },
  { id: "uma-vida-nao-basta", nome: "Uma vida não basta", descricao: "Histórias que permitem experimentar outras existências.", consulta: "Leituras imersivas em mundos imaginários", imagem: "biblioteca-janela", cor: "var(--color-rosa-claro)" },
  { id: "o-que-permanece", nome: "O que permanece", descricao: "Livros que continuam conosco depois da última página.", consulta: "Livros emocionantes sobre memória que fazem pensar", imagem: "biblioteca-lembrancas", cor: "var(--color-manteiga)" },
  { id: "o-lado-obscuro-do-afeto", nome: "O lado obscuro do afeto", descricao: "Relações complexas, ambiguidades e contradições humanas.", consulta: "Relações humanas sombrias e perturbadoras", imagem: "objeto-espelho", cor: "var(--color-bordo)" },
];
