\set ON_ERROR_STOP on
-- Execute em um PostgreSQL descartável. Os dados abaixo são inteiramente fictícios.
begin;
create role anon;
create role authenticated;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to authenticated;

\ir ../supabase/schema.sql
\ir ../supabase/atualizacao-2026-11-descoberta.sql
grant select, insert, update on public.descoberta_cache to authenticated;
insert into auth.users values ('00000000-0000-0000-0000-000000000001'), ('00000000-0000-0000-0000-000000000002');
insert into public.perfis(id, dados)
select id, '{
  "email":"ficticio@example.invalid","bookside":{"respostas":[1]},"edicoes":{"2025-02":{}},
  "estantesProprias":[{"id":"privada","publica":false},{"id":"publica","publica":true}],
  "livros":[{"id":"obra","estantes":["privada","publica"],"anotacao":"pessoal","sessoes":[],"trechos":[],"resenha":"visível"}]
}' from auth.users;
alter table public.perfis add column if not exists foto text;
\ir ../supabase/estabilizacao-perfis-publicos.sql
\ir ../supabase/estabilizacao-perfis-publicos.sql
insert into public.descoberta_cache(chave, consulta, resposta) values ('legado', 'fictícia', '{}');
\ir ../supabase/estabilizacao-descoberta-cache.sql
\ir ../supabase/estabilizacao-descoberta-cache.sql

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
do $$
begin
  if (select count(*) from public.perfis) <> 1 then
    raise exception 'a conta deve enxergar somente o próprio perfil';
  end if;
  if not exists (select 1 from public.perfis where id = auth.uid()) then
    raise exception 'a conta perdeu acesso ao próprio perfil';
  end if;
  update public.perfis set nome = 'perfil de teste' where id = auth.uid();
  if not found then raise exception 'atualização do próprio perfil indisponível'; end if;
  update public.perfis set dados = '{}' where id <> auth.uid();
  if found then raise exception 'atualização de outro perfil permitida'; end if;
  if (select count(*) from public.perfis_publicos) <> 2 then
    raise exception 'perfil público deixou de funcionar';
  end if;
  if exists (select 1 from public.perfis_publicos where dados ?| array['email','bookside','edicoes']
      or dados -> 'livros' -> 0 ?| array['anotacao','sessoes','trechos']
      or dados -> 'estantesProprias' -> 0 ->> 'id' <> 'publica'
      or dados -> 'livros' -> 0 -> 'estantes' <> '["publica"]'::jsonb
      or dados -> 'livros' -> 0 ->> 'resenha' <> 'visível') then
    raise exception 'a projeção pública não preservou os limites de privacidade';
  end if;
  if has_table_privilege(current_user, 'public.descoberta_cache', 'select,insert,update') then
    raise exception 'a conta ainda tem acesso ao cache compartilhado';
  end if;
end $$;
reset role;
do $$
begin
  if (select count(*) from public.descoberta_cache) <> 1 then
    raise exception 'registro legado removido';
  end if;
end $$;
rollback;
