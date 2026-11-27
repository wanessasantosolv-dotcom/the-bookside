/**
 * Pequenas curadorias: recortes por experiência de leitura. Cada uma tem
 * critérios explícitos e uma seleção editorial fixa de obras (sementes) que o
 * servidor confere uma a uma: só entram as que têm edição em português
 * confirmada no Google Books, com a capa dessa edição. A pesquisa contextual
 * completa a seleção, e o resultado fica em cache por 7 dias (atualização
 * periódica, sem nova pesquisa a cada visita).
 */
export type Curadoria = {
  id: string;
  nome: string;
  descricao: string;
  consulta: string;
  imagem: string;
  cor: string;
  cor2: string;
  criterios: string[];
  sementes: { titulo: string; autor: string }[];
};

const s = (titulo: string, autor: string) => ({ titulo, autor });

const SELECAO: Record<string, Pick<Curadoria, "criterios" | "sementes">> = {
  "pequenos-refugios": {
    criterios: ["atmosfera acolhedora", "ritmo predominantemente tranquilo", "narrativa reconfortante"],
    sementes: [s("Bem-vindos à livraria Hyunam-dong", "Hwang Bo-reum"), s("Antes que o café esfrie", "Toshikazu Kawaguchi"), s("Os dias da livraria Morisaki", "Satoshi Yagisawa"), s("Um homem chamado Ove", "Fredrik Backman"), s("A casa no mar cerúleo", "TJ Klune"), s("Lendas & lattes", "Travis Baldree"), s("O gato que salvava livros", "Sosuke Natsukawa")],
  },
  "delicadeza-do-cotidiano": {
    criterios: ["vida cotidiana como centro", "olhar contemplativo", "pequenos acontecimentos"],
    sementes: [s("Pequenas coisas como estas", "Claire Keegan"), s("Stoner", "John Williams"), s("Olive Kitteridge", "Elizabeth Strout"), s("Meu nome é Lucy Barton", "Elizabeth Strout"), s("Kitchen", "Banana Yoshimoto"), s("Mrs. Dalloway", "Virginia Woolf")],
  },
  "uma-tarde-chuvosa": {
    criterios: ["intimista", "atmosférico", "introspectivo"],
    sementes: [s("Água fresca para as flores", "Valérie Perrin"), s("Rebecca", "Daphne du Maurier"), s("Norwegian Wood", "Haruki Murakami"), s("Os anéis de Saturno", "W. G. Sebald"), s("Jane Eyre", "Charlotte Brontë")],
  },
  "alem-do-possivel": {
    criterios: ["realismo mágico ou elementos oníricos", "o insólito tratado como cotidiano"],
    sementes: [s("Cem anos de solidão", "Gabriel García Márquez"), s("Pedro Páramo", "Juan Rulfo"), s("A casa dos espíritos", "Isabel Allende"), s("Como água para chocolate", "Laura Esquivel"), s("Kafka à beira-mar", "Haruki Murakami"), s("Piranesi", "Susanna Clarke")],
  },
  "o-peso-do-silencio": {
    criterios: ["solidão, memória ou luto", "tom melancólico", "sentimentos difíceis de nomear"],
    sementes: [s("Os vestígios do dia", "Kazuo Ishiguro"), s("O ano do pensamento mágico", "Joan Didion"), s("Hamnet", "Maggie O'Farrell"), s("Uma mulher", "Annie Ernaux"), s("Klara e o Sol", "Kazuo Ishiguro")],
  },
  "literatura-sem-fronteiras": {
    criterios: ["tradições literárias diversas", "obras traduzidas ou de língua portuguesa fora do eixo habitual"],
    sementes: [s("Hibisco roxo", "Chimamanda Ngozi Adichie"), s("A vegetariana", "Han Kang"), s("Terra sonâmbula", "Mia Couto"), s("As coisas que perdemos no fogo", "Mariana Enriquez"), s("Ensaio sobre a cegueira", "José Saramago"), s("O avesso da pele", "Jeferson Tenório")],
  },
  "entre-livros-e-segredos": {
    criterios: ["bibliotecas, livrarias ou universidades", "segredos e conhecimento proibido"],
    sementes: [s("A sombra do vento", "Carlos Ruiz Zafón"), s("O nome da rosa", "Umberto Eco"), s("A história secreta", "Donna Tartt"), s("Babel", "R. F. Kuang"), s("O mar sem estrelas", "Erin Morgenstern"), s("Se um viajante numa noite de inverno", "Italo Calvino")],
  },
  "uma-vida-nao-basta": {
    criterios: ["mundos imaginários", "leitura imersiva"],
    sementes: [s("A vida invisível de Addie LaRue", "V. E. Schwab"), s("O circo da noite", "Erin Morgenstern"), s("A mão esquerda da escuridão", "Ursula K. Le Guin"), s("Duna", "Frank Herbert"), s("Não me abandone jamais", "Kazuo Ishiguro")],
  },
  "o-que-permanece": {
    criterios: ["impacto emocional duradouro", "memória", "obras muito lembradas por leitores"],
    sementes: [s("A amiga genial", "Elena Ferrante"), s("Torto arado", "Itamar Vieira Junior"), s("A menina que roubava livros", "Markus Zusak"), s("O sol é para todos", "Harper Lee"), s("Grande sertão: veredas", "João Guimarães Rosa")],
  },
  "o-lado-obscuro-do-afeto": {
    criterios: ["relações ambíguas ou perturbadoras", "personagens contraditórios"],
    sementes: [s("Dom Casmurro", "Machado de Assis"), s("Precisamos falar sobre o Kevin", "Lionel Shriver"), s("Garota exemplar", "Gillian Flynn"), s("Meu ano de descanso e relaxamento", "Ottessa Moshfegh"), s("Pequenos incêndios por toda parte", "Celeste Ng")],
  },
};

const BASE: Omit<Curadoria, "criterios" | "sementes">[] = [
  { id: "pequenos-refugios", nome: "Pequenos refúgios", descricao: "Histórias acolhedoras para desacelerar.", consulta: "Livros acolhedores para desacelerar", imagem: "lugar-quarto", cor: "var(--color-meta)", cor2: "var(--color-progresso)" },
  { id: "delicadeza-do-cotidiano", nome: "A delicadeza do cotidiano", descricao: "A beleza escondida nos dias comuns.", consulta: "Histórias contemplativas sobre a vida cotidiana", imagem: "lugar-jardim", cor: "var(--color-diario)", cor2: "var(--color-bordo)" },
  { id: "uma-tarde-chuvosa", nome: "Uma tarde chuvosa", descricao: "Leituras introspectivas, tranquilas e atmosféricas.", consulta: "Livros para uma tarde chuvosa, intimistas e contemplativos", imagem: "lugar-cafe", cor: "var(--color-descoberta)", cor2: "var(--color-descoberta-tinta)" },
  { id: "alem-do-possivel", nome: "Além do possível", descricao: "Quando a realidade deixa de seguir suas próprias regras.", consulta: "Realismo mágico e histórias oníricas", imagem: "objeto-bussola", cor: "var(--color-citacao)", cor2: "var(--color-descoberta)" },
  { id: "o-peso-do-silencio", nome: "O peso do silêncio", descricao: "Narrativas sobre solidão, memória e sentimentos difíceis de expressar.", consulta: "Livros melancólicos sobre solidão e memória", imagem: "biblioteca-esconderijo", cor: "var(--color-descoberta-tinta)", cor2: "var(--color-diario)" },
  { id: "literatura-sem-fronteiras", nome: "Literatura sem fronteiras", descricao: "Outras culturas, territórios e maneiras de existir.", consulta: "Literatura africana, japonesa e latino-americana", imagem: "lugar-trem", cor: "var(--color-progresso)", cor2: "var(--color-citacao)" },
  { id: "entre-livros-e-segredos", nome: "Entre livros e segredos", descricao: "Bibliotecas, universidades e conhecimentos proibidos.", consulta: "Bibliotecas, universidades e segredos", imagem: "biblioteca-arquivo", cor: "var(--color-bordo)", cor2: "var(--color-creme)" },
  { id: "uma-vida-nao-basta", nome: "Uma vida não basta", descricao: "Histórias que permitem experimentar outras existências.", consulta: "Leituras imersivas em mundos imaginários", imagem: "biblioteca-janela", cor: "var(--color-diario)", cor2: "var(--color-descoberta)" },
  { id: "o-que-permanece", nome: "O que permanece", descricao: "Livros que continuam conosco depois da última página.", consulta: "Livros emocionantes sobre memória que fazem pensar", imagem: "biblioteca-lembrancas", cor: "var(--color-citacao)", cor2: "var(--color-bordo)" },
  { id: "o-lado-obscuro-do-afeto", nome: "O lado obscuro do afeto", descricao: "Relações complexas, ambiguidades e contradições humanas.", consulta: "Relações humanas sombrias e perturbadoras", imagem: "objeto-espelho", cor: "var(--color-bordo)", cor2: "var(--color-diario)" },
];


export const CURADORIAS: Curadoria[] = BASE.map((c) => ({ ...c, ...(SELECAO[c.id] ?? { criterios: [], sementes: [] }) }));
