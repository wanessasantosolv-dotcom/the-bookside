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
| `/criar-perfil/nome` … `/gostos` | ONB 2 a 4 · os 8 passos de criar perfil |
| `/bem-vinda/clube` | ONB 5 · clube (entrar, criar ou depois) |
| `/bem-vinda/primeiro-livro` | ONB 6 · primeiro livro |
| `/bem-vinda/pronto` | ONB 7 · perfil pronto (o livro que abre) |
| `/inicio`, `/perfil`, `/em-breve` | provisórias |

## Organização

- `src/app/globals.css` — tokens do design system (cores, fontes, raios) e animações.
- `src/components/` — `Botao`, `Tela`, `Passo` (estrutura das telas de onboarding), `CapaLivro`…
- `src/lib/perfil-store.ts` — estado do perfil (zustand). **Hoje salvo no navegador.**
- `src/lib/dados.ts` — temas, frases, metas, gêneros e sugestões de livros.
- `public/brand/` — logos do design system.

## Próximos passos

1. Supabase: login de verdade (`/entrar`), tabela `perfis` e upload de foto/capa no Storage
   (procure `TODO(supabase)`).
2. Teste “what's your bookside” entre gostos e clube.
3. Busca de livros com capas de catálogo autorizado (procure `TODO(catálogo)`).
4. Feed, estantes, perfil e clubes.
