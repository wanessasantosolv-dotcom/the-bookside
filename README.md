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
| `/numeros`, `/numeros/generos`, `/numeros/retrospectiva` | seus números: meta, páginas, meses, gêneros, autores e retrospectiva (no computador: layout web) |
| `/inicio`, `/clubes`, `/em-breve` | provisórias (com o menu do app) |

## Versão web

A partir de 1024px de largura as telas do app ganham o menu fixo na lateral (`AppShell`) e o perfil usa o layout web "C · hero cheio" do canvas.

## Conta e nuvem (Supabase)

Sem configuração, o app roda no **modo local**: tudo fica só no navegador.
Com o Supabase ligado, cada leitora tem conta (e-mail + senha) e o perfil inteiro é salvo na nuvem.

1. Crie um projeto em https://supabase.com (região São Paulo).
2. **SQL Editor → New query**: cole o conteúdo de `supabase/schema.sql` e clique em **Run**.
3. **Authentication → Sign In / Providers → Email**: deixe "Confirm email" ligado.
4. **Authentication → Emails → Confirm signup**: troque o texto do e-mail para mandar o código de 6 dígitos, usando `{{ .Token }}`. Ex.: `seu código do the bookside é {{ .Token }}`.
5. **Authentication → URL Configuration**: em *Site URL* coloque o endereço da Vercel (ex.: `https://the-bookside.vercel.app`) e em *Redirect URLs* adicione `https://the-bookside.vercel.app/**`.
6. **Project Settings → API**: copie a *Project URL* e a chave *anon / publishable*.
7. Na **Vercel → Settings → Environment Variables**, crie:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = chave anon
   e faça um **Redeploy**. (Nunca use a chave `service_role` no app.)

Para rodar no computador com a nuvem, copie `.env.example` para `.env.local` e preencha.

Código: `src/lib/supabase.ts` (cliente), `src/lib/nuvem.ts` (sincronização), telas em `src/app/entrar`, `criar-conta`, `confirmar-email`, `esqueci-senha` e `nova-senha`.

## Catálogo de livros

A busca usa a [Open Library](https://openlibrary.org/dev/docs/api/search) direto do navegador (gratuita, sem chave): título, autoria, ano, páginas, capa e sinopse. Sem termo, ou sem conexão, aparecem as sugestões locais de `src/lib/dados.ts`. Código em `src/lib/catalogo.ts`.

## Organização

- `src/app/globals.css` — tokens do design system (cores, fontes, raios) e animações.
- `src/components/` — `Botao`, `Tela`, `Passo` (estrutura das telas de onboarding), `CapaLivro`…
- `src/lib/perfil-store.ts` — estado do perfil (zustand). **Hoje salvo no navegador.**
- `src/lib/dados.ts` — temas, frases, metas, gêneros e sugestões de livros.
- `public/brand/` — logos do design system.

## Próximos passos

1. Supabase Storage para foto e capa (hoje vão dentro do perfil, como imagem reduzida).
2. Revisar os textos dos arquétipos marcados como rascunho em `src/lib/teste.ts`.
3. Feed e clubes.
