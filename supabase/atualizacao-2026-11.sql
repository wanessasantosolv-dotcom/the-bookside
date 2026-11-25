-- the bookside · atualização de novembro de 2026
-- Rode no Supabase: SQL Editor → New query → cole tudo → Run.
-- (o banco-completo.sql e o social.sql já trazem isso para quem instala do zero)

-- Os livros que mais gente pôs na estante (ou começou/terminou) nos últimos
-- 60 dias, juntando o mesmo livro mesmo com códigos diferentes (pelo título).
-- Traz também a sinopse, a média das notas de quem leu e uma resenha curta.
drop function if exists public.livros_em_alta(int);
create or replace function public.livros_em_alta(p_dias int default 60)
returns table (
  id text, titulo text, autor text, capa text, pessoas bigint,
  sinopse text, media numeric, avaliacoes bigint, resenha text, resenha_de text
)
language sql stable security invoker set search_path = public as $$
  with recentes as (
    select p.id as pessoa, coalesce(nullif(p.nome, ''), p.usuario) as nome, l
    from public.perfis_publicos p
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(p.dados -> 'livros') = 'array' then p.dados -> 'livros' else '[]'::jsonb end
    ) as l
    where p.id <> auth.uid()
      and greatest(
        coalesce(public.data_ou_nada(l ->> 'adicionadoEm'), 'epoch'),
        coalesce(public.data_ou_nada(l ->> 'iniciadoEm'), 'epoch'),
        coalesce(public.data_ou_nada(l ->> 'lidoEm'), 'epoch')
      ) > now() - make_interval(days => least(greatest(p_dias, 1), 365))
  )
  select (array_agg(l ->> 'id'))[1], (array_agg(l ->> 'titulo'))[1], (array_agg(l ->> 'autor'))[1],
         (array_agg(l ->> 'capa') filter (where (l ->> 'capa') like 'http%'))[1],
         count(distinct pessoa),
         (array_agg(l ->> 'sinopse') filter (where coalesce(l ->> 'sinopse', '') <> ''))[1],
         round(avg((l ->> 'nota')::numeric) filter (where (l ->> 'nota') ~ '^[0-9]+([.][0-9]+)?$'), 1),
         count(*) filter (where (l ->> 'nota') ~ '^[0-9]+([.][0-9]+)?$'),
         (array_agg(left(l ->> 'resenha', 280)) filter (where coalesce(l ->> 'resenha', '') <> ''))[1],
         (array_agg(nome) filter (where coalesce(l ->> 'resenha', '') <> ''))[1]
  from recentes
  where coalesce(l ->> 'titulo', '') <> ''
  group by public.titulo_normalizado(l ->> 'titulo')
  order by count(distinct pessoa) desc, max(l ->> 'adicionadoEm') desc
  limit 20
$$;
revoke all on function public.livros_em_alta(int) from anon, public;
grant execute on function public.livros_em_alta(int) to authenticated;
