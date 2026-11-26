-- the bookside · club studio (identidade visual dos clubes)
-- Rode no Supabase: SQL Editor → New query → cole tudo → Run. Pode rodar mais de uma vez.
-- Não muda nenhum clube: quem não abrir o club studio continua com o tema de antes.

-- a identidade fica num jsonb só com o tema base e o que o clube mudou.
-- quem pode editar o clube (a política de update que já existe) é quem pode salvar.
alter table public.clubes add column if not exists identidade jsonb;
alter table public.clubes drop constraint if exists clubes_identidade_valida;
alter table public.clubes add constraint clubes_identidade_valida check (
  identidade is null
  or (jsonb_typeof(identidade) = 'object'
      and pg_column_size(identidade) < 8000
      and identidade ->> 'tema' in ('botanical', 'dark-academia', 'cherry-club', 'paperback', 'after-hours', 'the-editor'))
);

-- meta anual de livros do clube ({"2026": 12}); quem pode editar o clube pode definir
alter table public.clubes add column if not exists metas jsonb;
