/**
 * Curadoria fixa por característica: obras reais e reconhecidas, escolhidas a
 * mão para cada traço da taxonomia. É o plano B da descoberta quando a IA não
 * responde (cota, erro, tempo): o servidor confere cada obra no Google Books
 * (edição em português, autoria, capa) antes de mostrar, então só aparece o
 * que existe de fato. Não é a seleção principal — a pesquisa contextual é.
 */
import { CURADORIAS } from "@/lib/curadorias";

type Obra = { titulo: string; autor: string };
const o = (titulo: string, autor: string): Obra => ({ titulo, autor });
const daCuradoria = (id: string) => CURADORIAS.find((c) => c.id === id)?.sementes ?? [];

export const CURADORIA_FIXA: Record<string, Obra[]> = {
  "lit-coreana": [o("A vegetariana", "Han Kang"), o("Atos humanos", "Han Kang"), o("O livro branco", "Han Kang"), o("Kim Jiyoung, nascida em 1982", "Cho Nam-joo"), o("Por favor, cuide da mamãe", "Kyung-sook Shin"), o("Amêndoas", "Won-pyung Sohn"), o("Bem-vindos à livraria Hyunam-dong", "Hwang Bo-reum")],
  "lit-japonesa": [o("Kafka à beira-mar", "Haruki Murakami"), o("Norwegian Wood", "Haruki Murakami"), o("Querida Konbini", "Sayaka Murata"), o("Kitchen", "Banana Yoshimoto"), o("A mulher das dunas", "Kobo Abe"), o("A polícia da memória", "Yoko Ogawa"), o("Antes que o café esfrie", "Toshikazu Kawaguchi"), o("Confissões de uma máscara", "Yukio Mishima")],
  "lit-africana": [o("Hibisco roxo", "Chimamanda Ngozi Adichie"), o("Meio sol amarelo", "Chimamanda Ngozi Adichie"), o("Terra sonâmbula", "Mia Couto"), o("O mundo se despedaça", "Chinua Achebe"), o("Niketche", "Paulina Chiziane"), o("Mayombe", "Pepetela"), o("Paraíso", "Abdulrazak Gurnah")],
  "lit-brasileira": [o("Torto arado", "Itamar Vieira Junior"), o("Dom Casmurro", "Machado de Assis"), o("A hora da estrela", "Clarice Lispector"), o("Vidas secas", "Graciliano Ramos"), o("Grande sertão: veredas", "João Guimarães Rosa"), o("Quarto de despejo", "Carolina Maria de Jesus"), o("Ponciá Vicêncio", "Conceição Evaristo"), o("O avesso da pele", "Jeferson Tenório")],
  "lit-latino-americana": [o("Cem anos de solidão", "Gabriel García Márquez"), o("Pedro Páramo", "Juan Rulfo"), o("A casa dos espíritos", "Isabel Allende"), o("Ficções", "Jorge Luis Borges"), o("O túnel", "Ernesto Sabato"), o("As coisas que perdemos no fogo", "Mariana Enriquez")],
  "lit-russa": [o("Crime e castigo", "Fiódor Dostoiévski"), o("Os irmãos Karamázov", "Fiódor Dostoiévski"), o("Anna Kariênina", "Liev Tolstói"), o("O mestre e Margarida", "Mikhail Bulgákov"), o("Almas mortas", "Nikolai Gógol")],
  "lit-francesa": [o("O estrangeiro", "Albert Camus"), o("A elegância do ouriço", "Muriel Barbery"), o("Madame Bovary", "Gustave Flaubert"), o("Os anos", "Annie Ernaux"), o("Água fresca para as flores", "Valérie Perrin"), o("O pequeno príncipe", "Antoine de Saint-Exupéry")],
  "lit-portuguesa": [o("Ensaio sobre a cegueira", "José Saramago"), o("Os Maias", "Eça de Queirós"), o("Livro do desassossego", "Fernando Pessoa"), o("A desumanização", "valter hugo mãe")],
  "lit-italiana": [o("A amiga genial", "Elena Ferrante"), o("O nome da rosa", "Umberto Eco"), o("As cidades invisíveis", "Italo Calvino"), o("O leopardo", "Giuseppe Tomasi di Lampedusa")],
  "lit-chinesa": [o("Viver", "Yu Hua"), o("O problema dos três corpos", "Cixin Liu")],
  "lit-indigena": [o("A queda do céu", "Davi Kopenawa"), o("Ideias para adiar o fim do mundo", "Ailton Krenak"), o("Metade cara, metade máscara", "Eliane Potiguara")],
  "lit-inglesa": [o("Orgulho e preconceito", "Jane Austen"), o("Mrs. Dalloway", "Virginia Woolf"), o("Os vestígios do dia", "Kazuo Ishiguro"), o("Jane Eyre", "Charlotte Brontë"), o("1984", "George Orwell")],
  "narrador-nao-confiavel": [o("Dom Casmurro", "Machado de Assis"), o("Os vestígios do dia", "Kazuo Ishiguro"), o("Garota exemplar", "Gillian Flynn"), o("A paciente silenciosa", "Alex Michaelides"), o("O assassinato de Roger Ackroyd", "Agatha Christie"), o("Rebecca", "Daphne du Maurier"), o("Precisamos falar sobre o Kevin", "Lionel Shriver")],
  reviravoltas: [o("Garota exemplar", "Gillian Flynn"), o("A paciente silenciosa", "Alex Michaelides"), o("A garota no trem", "Paula Hawkins"), o("Os sete maridos de Evelyn Hugo", "Taylor Jenkins Reid"), o("Recursão", "Blake Crouch")],
  fantasia: [o("O nome do vento", "Patrick Rothfuss"), o("O hobbit", "J. R. R. Tolkien"), o("A mão esquerda da escuridão", "Ursula K. Le Guin"), o("O império final", "Brandon Sanderson"), o("Piranesi", "Susanna Clarke"), o("O circo da noite", "Erin Morgenstern")],
  "ficcao-cientifica": [o("Duna", "Frank Herbert"), o("Fundação", "Isaac Asimov"), o("Kindred", "Octavia E. Butler"), o("O problema dos três corpos", "Cixin Liu"), o("Recursão", "Blake Crouch"), o("Não me abandone jamais", "Kazuo Ishiguro")],
  policial: [o("Assassinato no Expresso do Oriente", "Agatha Christie"), o("A garota no trem", "Paula Hawkins"), o("O silêncio dos inocentes", "Thomas Harris"), o("A paciente silenciosa", "Alex Michaelides")],
  terror: [o("O iluminado", "Stephen King"), o("Drácula", "Bram Stoker"), o("Frankenstein", "Mary Shelley"), o("A assombração da casa da colina", "Shirley Jackson"), o("Gótico mexicano", "Silvia Moreno-Garcia")],
  classicos: [o("Orgulho e preconceito", "Jane Austen"), o("Dom Casmurro", "Machado de Assis"), o("Crime e castigo", "Fiódor Dostoiévski"), o("O morro dos ventos uivantes", "Emily Brontë"), o("Grandes esperanças", "Charles Dickens"), o("O estrangeiro", "Albert Camus")],
  livrarias: [o("Bem-vindos à livraria Hyunam-dong", "Hwang Bo-reum"), o("Os dias da livraria Morisaki", "Satoshi Yagisawa"), o("A livraria", "Penelope Fitzgerald"), o("A sombra do vento", "Carlos Ruiz Zafón"), o("O gato que salvava livros", "Sosuke Natsukawa")],
  bibliotecas: [o("A sombra do vento", "Carlos Ruiz Zafón"), o("O nome da rosa", "Umberto Eco"), o("A biblioteca da meia-noite", "Matt Haig"), o("O mar sem estrelas", "Erin Morgenstern"), o("A menina que roubava livros", "Markus Zusak")],
  "livros-e-literatura": [o("A sombra do vento", "Carlos Ruiz Zafón"), o("A menina que roubava livros", "Markus Zusak"), o("Se um viajante numa noite de inverno", "Italo Calvino"), o("Os dias da livraria Morisaki", "Satoshi Yagisawa"), o("A livraria", "Penelope Fitzgerald")],
  universidades: [o("A história secreta", "Donna Tartt"), o("Babel", "R. F. Kuang"), o("Não me abandone jamais", "Kazuo Ishiguro"), o("Sociedade dos poetas mortos", "N. H. Kleinbaum")],
  solidao: [o("Querida Konbini", "Sayaka Murata"), o("Kitchen", "Banana Yoshimoto"), o("Eleanor Oliphant está muito bem", "Gail Honeyman"), o("Stoner", "John Williams"), o("Um homem chamado Ove", "Fredrik Backman")],
  luto: [o("O ano do pensamento mágico", "Joan Didion"), o("Hamnet", "Maggie O'Farrell"), o("O luto é a coisa com penas", "Max Porter"), o("Água fresca para as flores", "Valérie Perrin")],
  amizade: [o("A amiga genial", "Elena Ferrante"), o("O caçador de pipas", "Khaled Hosseini"), o("Uma vida pequena", "Hanya Yanagihara"), o("Amanhã, amanhã e ainda outro amanhã", "Gabrielle Zevin")],
  recomecos: [o("Um homem chamado Ove", "Fredrik Backman"), o("A biblioteca da meia-noite", "Matt Haig"), o("Eleanor Oliphant está muito bem", "Gail Honeyman"), o("Água fresca para as flores", "Valérie Perrin")],
  poesia: [o("Sentimento do mundo", "Carlos Drummond de Andrade"), o("A rosa do povo", "Carlos Drummond de Andrade"), o("Viagem", "Cecília Meireles"), o("O guardador de rebanhos", "Fernando Pessoa"), o("Outros jeitos de usar a boca", "Rupi Kaur")],
  contos: [o("Laços de família", "Clarice Lispector"), o("Ficções", "Jorge Luis Borges"), o("As coisas que perdemos no fogo", "Mariana Enriquez"), o("Papéis avulsos", "Machado de Assis")],
  curto: [o("Pequenas coisas como estas", "Claire Keegan"), o("A hora da estrela", "Clarice Lispector"), o("O estrangeiro", "Albert Camus"), o("A metamorfose", "Franz Kafka"), o("Kitchen", "Banana Yoshimoto")],
  "realismo-magico": daCuradoria("alem-do-possivel"),
  onirica: daCuradoria("alem-do-possivel"),
  acolhedora: daCuradoria("pequenos-refugios"),
  encantadora: daCuradoria("pequenos-refugios"),
  leve: daCuradoria("pequenos-refugios"),
  contemplativa: daCuradoria("delicadeza-do-cotidiano"),
  cotidiano: daCuradoria("delicadeza-do-cotidiano"),
  "ritmo-lento": daCuradoria("delicadeza-do-cotidiano"),
  chuvosa: daCuradoria("uma-tarde-chuvosa"),
  intimista: daCuradoria("uma-tarde-chuvosa"),
  outono: daCuradoria("uma-tarde-chuvosa"),
  melancolica: daCuradoria("o-peso-do-silencio"),
  memoria: daCuradoria("o-que-permanece"),
  emocionante: daCuradoria("o-que-permanece"),
  "mundos-imaginarios": daCuradoria("uma-vida-nao-basta"),
  imersiva: daCuradoria("uma-vida-nao-basta"),
  sombria: daCuradoria("o-lado-obscuro-do-afeto"),
  perturbadora: daCuradoria("o-lado-obscuro-do-afeto"),
  relacoes: daCuradoria("o-lado-obscuro-do-afeto"),
  misteriosa: daCuradoria("entre-livros-e-segredos"),
};

/** Só usa obras presentes em todas as características pedidas.
 * Uma característica sem curadoria impede o preenchimento automático.
 */
export function obrasFixas(ids: string[], limite = 12): Obra[] {
  const unicos = [...new Set(ids)];
  if (!unicos.length || unicos.some((id) => !CURADORIA_FIXA[id]?.length)) return [];
  const chave = (ob: Obra) => `${ob.titulo.toLowerCase()}|${ob.autor.toLowerCase()}`;
  const conjuntos = unicos.slice(1).map((id) => new Set(CURADORIA_FIXA[id].map(chave)));
  return CURADORIA_FIXA[unicos[0]].filter((ob) => conjuntos.every((s) => s.has(chave(ob)))).slice(0, limite);
}
