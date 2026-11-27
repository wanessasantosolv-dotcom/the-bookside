"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Estado do perfil criado no onboarding.
 * Por enquanto fica salvo no navegador (localStorage).
 * Quando o Supabase entrar, este store passa a ler e gravar no banco.
 */

export type PadraoCapa = "linhas" | "bolinhas" | "ondas" | "estrelas" | "tema" | "solida";
export type EscolhaEstante = "lendo" | "quero" | "vazia";

export type StatusLivro = "lendo" | "quero" | "lido" | "pausado" | "abandonado";
/** a reação da ficha: o "veredito" do livro */
export type Reacao = "favoritado" | "adorei" | "gostei" | "neutro" | "nao" | "abandonei";
export type FormatoLivro = "fisico" | "ebook" | "audio";
export type NotasDetalhe = {
  personagens: number;
  plot: number;
  escrita: number;
  final: number;
};

export type LivroSalvo = {
  id: string;
  titulo: string;
  autor: string;
  /** sinopse (escrita pela IA ou pela pessoa, nos livros cadastrados à mão) */
  sinopse?: string;
  status?: StatusLivro;
  /** como a pessoa leu: livro físico, e-book (Kindle etc.) ou audiolivro */
  formato?: FormatoLivro;
  /** URL da capa (Open Library) */
  capa?: string;
  /** a pessoa escolheu ou enviou esta capa: o app não troca sozinho */
  capaEscolhida?: boolean;
  genero?: string;
  /** quando entrou na estante (ISO) */
  adicionadoEm?: string;
  paginas?: number;
  paginaAtual?: number;
  iniciadoEm?: string;
  lidoEm?: string;
  /** a pessoa sabe só o ano em que leu (lidoEm fica em 1º de janeiro, sem valer como dia nem mês) */
  lidoSoAno?: boolean;
  /** 0,5 a 5 */
  nota?: number;
  /** sessões do modo foco: quando começou, quantos minutos e quantas páginas */
  sessoes?: { em: string; minutos: number; paginas?: number }[];
  reacao?: Reacao;
  /** quando pausou/abandonou (ISO) */
  paradoEm?: string;
  /** o coraçãozinho de "amei" (diferente dos 4 favoritos do perfil) */
  amei?: boolean;
  notas?: NotasDetalhe;
  resenha?: string;
  anotacao?: string;
  /** personagem favorita (das fichas) */
  personagem?: string;
  /** marginalia: como foi a experiência (atmosfera, ritmo, impressão), só o que a pessoa escolheu */
  sensacoes?: string[];
  /** recomendaria esta obra? */
  recomendaria?: "sim" | "ressalvas" | "nao";
  /** consideraria uma releitura? (não cria leitura nova) */
  releria?: "sim" | "talvez" | "nao";
  /** a resenha tem spoilers (esconde até a pessoa tocar) */
  resenhaSpoiler?: boolean;
  /** critérios que não se aplicam a esta obra (ex.: poesia sem personagens) */
  naoAplica?: (keyof NotasDetalhe)[];
  /** quando a ficha foi salva pela primeira vez e a última edição (ISO) */
  fichaEm?: string;
  fichaEditadaEm?: string;
  /** trecho favorito */
  citacao?: string;
  /** quando este livro foi mudado pela última vez (para juntar celular e computador) */
  atualizadoEm?: string;
  /** trechos marcados (ex.: destaques importados do Kindle) */
  trechos?: {
    texto: string;
    em?: string;
    origem?: "kindle" | "app";
    /** página do trecho, quando a pessoa anotou */
    pagina?: number;
    capitulo?: string;
    /** nota pessoal sobre o trecho */
    nota?: string;
    spoiler?: boolean;
    /** está na ficha ("entre as páginas"); tirar da ficha não apaga o trecho */
    naFicha?: boolean;
  }[];
  /** leituras anteriores (quando a pessoa começa uma releitura) */
  releituras?: { iniciadoEm?: string; lidoEm?: string; nota?: number; formato?: FormatoLivro }[];
  /** ids das estantes criadas pela pessoa onde o livro está */
  estantes?: string[];
  /** só na lista: aparece numa estante própria sem estar na estante pessoal (nunca é salvo em livros) */
  soNaLista?: boolean;
};

/** um livro como ficou guardado numa edição do journal (só o que a revista usa) */
export type LivroDaEdicao = {
  id: string;
  titulo: string;
  autor: string;
  capa?: string;
  genero?: string;
  paginas?: number;
  nota?: number;
  iniciadoEm?: string;
  lidoEm?: string;
  formato?: FormatoLivro;
  /** terminou no mês (senão, estava em andamento) */
  concluido: boolean;
  /** quantas páginas já tinha lido (para os meses sem livro terminado) */
  paginaAtual?: number;
  /** sessões do modo foco no mês (páginas por dia, quando há) */
  sessoes?: { em: string; minutos: number; paginas?: number }[];
};

/** uma edição fechada: o retrato do mês e os textos, como foram colecionados */
export type EdicaoSalva = {
  chave: string;
  finalizadaEm: string;
  /** muda quando os registros do mês mudam (para oferecer "atualizar edição") */
  assinatura: string;
  livros: LivroDaEdicao[];
  textos?: TextosEdicao;
};

export type TextosEdicao = {
  /** o título do mood (capítulo 09) */
  titulo: string;
  introducao: string;
  ritmo?: string;
  tendencias?: string;
  encerramento: string;
  fonte: "ia" | "regras";
};

export type EstantePropria = {
  id: string;
  nome: string;
  cor: string;
  publica: boolean;
  criadaEm: string;
  /** o que a lista reúne, escrito pela pessoa (ajuda a sugerir livros) */
  descricao?: string;
  /** livros que estão só na lista (sem entrar na estante pessoal nem ganhar status) */
  livros?: ItemDeLista[];
};

export type ItemDeLista = { id: string; titulo: string; autor: string; capa?: string; paginas?: number; adicionadoEm: string };

export type Perfil = {
  email: string | null;
  nome: string;
  usuario: string;
  foto: string | null; // data URL reduzida
  capa: PadraoCapa;
  capaImagem: string | null; // data URL da galeria
  /** que altura da foto da capa aparece quando a capa é mais baixa (0 topo, 50 meio, 100 base) */
  capaPosY: number;
  frase: string;
  meta: number | null; // null = sem meta
  tema: string;
  estante: EscolhaEstante;
  gostos: string[];
  livros: LivroSalvo[];
  /** ids dos até 4 livros em destaque no perfil */
  favoritos: string[];
  /** estantes criadas pela pessoa (além de lidos, lendo e quero ler) */
  estantesProprias: EstantePropria[];
  /** resultado do teste, salvo só com consentimento */
  bookside: {
    principal: string;
    secundario: string;
    respostas: (number | null)[];
    livros: string[];
    salvoEm: string;
  } | null;
  /** a carta de nas entrelinhas exibida no perfil (só a carta: respostas e pontos ficam privados) */
  cartaLiteraria: { carta: string; em: string } | null;
  /** compartilha as métricas pessoais de leitura com a liga dos leitores dos clubes */
  ligaPessoal: boolean;
  onboardingConcluido: boolean;
  /** já viu o passo a passo mostrando onde fica cada coisa no app */
  tourVisto: boolean;
  /** última vez que abriu as novidades (para marcar o que é novo) */
  novidadesVistasEm: string | null;
  /** as edições fechadas do The Bookside Journal ("2026-11" → edição) */
  edicoes?: Record<string, EdicaoSalva>;
  /** id do livro cuja resenha a pessoa fixou no topo da aba resenhas */
  resenhaFixada?: string | null;
  /** a citação favorita do perfil (escolhida entre os trechos salvos) */
  citacaoPerfil?: { texto: string; livro?: string; autor?: string; livroId?: string } | null;
  /** aparência do app: claro, escuro ou igual ao celular/computador */
  aparencia: "claro" | "escuro" | "sistema";
  /** acabamento das estantes (auto: o do tema) */
  estiloEstante: "auto" | "clara" | "escura" | "tema" | "minimalista";
  /** intensidade dos elementos decorativos do tema (null: a recomendada pelo tema) */
  decoracao: "minimal" | "editorial" | "expressive" | null;
  /** as cores do tema do perfil valem para o app inteiro */
  temaNoApp: boolean;
  /** o tema do perfil fica só no perfil (padrão: vale no app todo) — antigo; o tema do app agora é temaApp */
  temaSoNoPerfil: boolean;
  /** o tema da interface (configurações → aparência); sem ele, vale o comportamento antigo */
  temaApp?: string | null;
  /** o perfil público acompanha o tema do app (padrão) */
  perfilSegueApp?: boolean | null;
  /** as leituras (comecei, terminei, notas, progresso) aparecem no feed dos amigos */
  publicarNoFeed: boolean;
  /** livros tirados da estante (para não voltarem quando outro aparelho sincronizar) */
  removidos: { id: string; em: string }[];
  /** livros em que a pessoa tocou "passar" no descobrir (títulos normalizados): não voltam, em nenhum aparelho */
  passados: string[];
};

type Acoes = {
  atualizar: (dados: Partial<Perfil>) => void;
  alternarGosto: (gosto: string) => void;
  alternarLivro: (livro: LivroSalvo) => void;
  guardarLivro: (livro: LivroSalvo) => void;
  /** junta dados num livro da estante (cria se não existir) */
  editarLivro: (
    base: Pick<LivroSalvo, "id" | "titulo" | "autor" | "capa" | "genero">,
    dados: Partial<LivroSalvo>,
  ) => void;
  removerLivro: (id: string) => void;
  /** tira todos os livros da estante (e dos favoritos); o resto do perfil fica */
  esvaziarEstante: () => void;
  criarEstante: (e: Omit<EstantePropria, "id" | "criadaEm">) => string;
  sair: () => void;
};

export const perfilInicial: Perfil = {
  email: null,
  nome: "",
  usuario: "",
  foto: null,
  capa: "linhas",
  capaImagem: null,
  capaPosY: 50,
  frase: "gosto de finais que doem",
  meta: 40,
  tema: "biblioteca-classica",
  estante: "lendo",
  gostos: [],
  livros: [],
  favoritos: [],
  estantesProprias: [],
  bookside: null,
  cartaLiteraria: null,
  ligaPessoal: true,
  onboardingConcluido: false,
  tourVisto: false,
  novidadesVistasEm: null,
  edicoes: {},
  resenhaFixada: null,
  citacaoPerfil: null,
  passados: [],
  removidos: [],
  aparencia: "claro",
  estiloEstante: "auto",
  decoracao: null,
  temaNoApp: false,
  temaSoNoPerfil: false,
  temaApp: null,
  perfilSegueApp: null,
  publicarNoFeed: true,
};

export const usePerfil = create<Perfil & Acoes>()(
  persist(
    (set) => ({
      ...perfilInicial,
      atualizar: (dados) => set(dados),
      alternarGosto: (gosto) =>
        set((s) => ({
          gostos: s.gostos.includes(gosto)
            ? s.gostos.filter((g) => g !== gosto)
            : [...s.gostos, gosto],
        })),
      alternarLivro: (livro) =>
        set((s) => ({
          livros: s.livros.some((l) => l.id === livro.id)
            ? s.livros.filter((l) => l.id !== livro.id)
            : [
                ...s.livros,
                {
                  adicionadoEm: new Date().toISOString(),
                  ...livro,
                  atualizadoEm: new Date().toISOString(),
                },
              ],
          removidos: s.livros.some((l) => l.id === livro.id)
            ? tirarDaLista(s.removidos, livro.id)
            : (s.removidos ?? []).filter((r) => r.id !== livro.id),
        })),
      guardarLivro: (livro) =>
        set((s) => {
          const antigo = s.livros.find((l) => l.id === livro.id);
          return {
            livros: [
              ...s.livros.filter((l) => l.id !== livro.id),
              {
                ...antigo,
                adicionadoEm: antigo?.adicionadoEm ?? new Date().toISOString(),
                ...livro,
                atualizadoEm: new Date().toISOString(),
              },
            ],
            removidos: (s.removidos ?? []).filter((r) => r.id !== livro.id),
          };
        }),
      editarLivro: (base, dados) =>
        set((s) => {
          const antigo = s.livros.find((l) => l.id === base.id);
          const novo: LivroSalvo = {
            adicionadoEm: new Date().toISOString(),
            ...base,
            ...antigo,
            ...dados,
            atualizadoEm: new Date().toISOString(),
          };
          return {
            livros: antigo
              ? s.livros.map((l) => (l.id === base.id ? novo : l))
              : [...s.livros, novo],
            removidos: (s.removidos ?? []).filter((r) => r.id !== base.id),
          };
        }),
      removerLivro: (id) =>
        set((s) => ({
          livros: s.livros.filter((l) => l.id !== id),
          favoritos: s.favoritos.filter((f) => f !== id),
          removidos: tirarDaLista(s.removidos, id),
        })),
      criarEstante: (e) => {
        const id = `${sugerirUsuario(e.nome).replace(/\./g, "-") || "estante"}-${Date.now().toString(36)}`;
        set((s) => ({
          estantesProprias: [
            ...s.estantesProprias,
            { ...e, id, criadaEm: new Date().toISOString() },
          ],
        }));
        return id;
      },
      esvaziarEstante: () =>
        set((s) => ({
          livros: [],
          favoritos: [],
          removidos: s.livros.reduce((r, l) => tirarDaLista(r, l.id), s.removidos),
        })),
      sair: () => set({ ...perfilInicial }),
    }),
    {
      name: "bookside-perfil",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // carregado por <PerfilHidratacao /> depois de montar
    },
  ),
);

/** gera um @usuario a partir do nome: "Ana Clara" → "ana.clara" */
/** marca um livro como tirado da estante (guarda os 800 mais recentes) */
function tirarDaLista(lista: { id: string; em: string }[] | undefined, id: string) {
  return [
    ...(lista ?? []).filter((r) => r.id !== id),
    { id, em: new Date().toISOString() },
  ].slice(-800);
}

export function sugerirUsuario(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);
}

/** o tema que vale na interface: o escolhido em configurações ou, para quem nunca escolheu, o do perfil */
export function temaDoApp(s: Pick<Perfil, "temaApp" | "temaSoNoPerfil" | "tema">): string | undefined {
  if (s.temaApp) return s.temaApp;
  return s.temaSoNoPerfil ? undefined : s.tema;
}

/** o perfil acompanha o app? (padrão: sim, menos para quem tinha separado os dois) */
export function perfilSegue(s: Pick<Perfil, "perfilSegueApp" | "temaSoNoPerfil">): boolean {
  return s.perfilSegueApp ?? !s.temaSoNoPerfil;
}
