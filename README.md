# the bookside

read ✦ track ✦ belong — app de livros pessoais e clubes de leitura.

Feito com **Next.js 15 (App Router) + TypeScript + Tailwind CSS 4**, a partir do design system
*The Bookside* e do canvas *Perfil — Opções*.

## Rodar no computador

```bash
npm install
npm run dev
```

Abra http://localhost:3000 (o app é mobile: use o modo celular do navegador, 390px).

## O que já existe

| Rota | Tela do canvas |
| --- | --- |
| `/entrar` | ONB 1 · entrar (logo animada) |
| `/criar-conta`, `/confirmar-email`, `/esqueci-senha` | ONB 1b, 1c, 1d · conta |
| `/criar-perfil/nome` … `/gostos` | ONB 2 a 4 · os 8 passos de criar perfil |
| `/bem-vinda/clube` | ONB 5 · clube (entrar, criar ou depois) |
| `/bem-vinda/primeiro-livro` | ONB 6 · primeiro livro |
| `/bem-vinda/pronto` | ONB 7 · perfil pronto (o livro que abre) |
| `/criar-perfil/estante/buscar`, `/descobrir` | buscar livro · descobrir (passar / quero ler / já li) |
| `/teste` … `/teste/salvar` | teste "what's your bookside" em estilo revista — agora fora do onboarding, aberto pelo início |
| `/perfil`, `/perfil/editar`, `/perfil/favoritos`, `/perfil/configuracoes` | meu perfil (no computador: layout web C) · editar · escolher favoritos · configurações |
| `/estantes` | minhas estantes · prateleiras ou leque (no computador: layout web) |
| `/estantes/[id]` | estante aberta (lidos, lendo, quero-ler ou criada) · lista ou grade |
| `/estantes/nova` | criar nova estante |
| `/buscar?estante=…` | buscar livro e adicionar na estante |
| `/livro/[id]`, `/livro/[id]/progresso`, `/livro/[id]/avaliar` | página do livro · lendo agora / progresso · avaliar |
| `/inicio`, `/clubes`, `/numeros`, `/em-breve` | provisórias (com o menu do app) |

## Versão web

A partir de 1024px de largura as telas do app ganham o menu fixo na lateral (`AppShell`) e o perfil usa o layout web "C · hero cheio" do canvas.

## Catálogo de livros

A busca usa a [Open Library](https://openlibrary.org/dev/docs/api/search) direto do navegador (gratuita, sem chave): título, autoria, ano, páginas, capa e sinopse. Sem termo, ou sem conexão, aparecem as sugestões locais de `src/lib/dados.ts`. Código em `src/lib/catalogo.ts`.

## Organização

- `src/app/globals.css` — tokens do design system (cores, fontes, raios) e animações.
- `src/components/` — `Botao`, `Tela`, `Passo` (estrutura das telas de onboarding), `CapaLivro`…
- `src/lib/perfil-store.ts` — estado do perfil (zustand). **Hoje salvo no navegador.**
- `src/lib/dados.ts` — temas, frases, metas, gêneros e sugestões de livros.
- `public/brand/` — logos do design system.

## Próximos passos

1. Supabase: login de verdade (`/entrar`), tabela `perfis` e upload de foto/capa no Storage
   (procure `TODO(supabase)`).
2. Revisar os textos dos arquétipos marcados como rascunho em `src/lib/teste.ts`.
4. Feed, números e clubes.
