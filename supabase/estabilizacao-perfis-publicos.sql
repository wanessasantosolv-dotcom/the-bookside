-- Mantém a interface da view e limita os dados ao que o perfil público usa.
create or replace view public.perfis_publicos as
select p.id, p.usuario, p.nome, p.dados ->> 'foto' as foto,
  (
    select coalesce(jsonb_object_agg(campo, p.dados -> campo), '{}'::jsonb)
    from unnest(array[
      'capa', 'capaImagem', 'capaPosY', 'frase', 'meta', 'tema', 'estante', 'gostos',
      'favoritos', 'cartaLiteraria', 'ligaPessoal', 'resenhaFixada', 'citacaoPerfil',
      'estiloEstante', 'decoracao', 'temaApp', 'perfilSegueApp'
    ]) as campos(campo)
    where p.dados ? campo
  ) || jsonb_build_object(
    'estantesProprias', (
      select coalesce(jsonb_agg(e order by pos), '[]'::jsonb)
      from jsonb_array_elements(case when jsonb_typeof(p.dados -> 'estantesProprias') = 'array'
        then p.dados -> 'estantesProprias' else '[]'::jsonb end) with ordinality as listas(e, pos)
      where e ->> 'publica' = 'true'
    ),
    'livros', (
      select coalesce(jsonb_agg(
        (l - array['anotacao', 'trechos', 'sessoes', 'estantes']) || jsonb_build_object('estantes', (
          select coalesce(jsonb_agg(ref), '[]'::jsonb)
          from jsonb_array_elements_text(case when jsonb_typeof(l -> 'estantes') = 'array'
            then l -> 'estantes' else '[]'::jsonb end) as refs(ref)
          where exists (
            select 1 from jsonb_array_elements(case when jsonb_typeof(p.dados -> 'estantesProprias') = 'array'
              then p.dados -> 'estantesProprias' else '[]'::jsonb end) as e
            where e ->> 'publica' = 'true' and e ->> 'id' = ref
          )
        )) order by pos
      ), '[]'::jsonb)
      from jsonb_array_elements(case when jsonb_typeof(p.dados -> 'livros') = 'array'
        then p.dados -> 'livros' else '[]'::jsonb end) with ordinality as livros(l, pos)
      where jsonb_typeof(l) = 'object'
    )
  ) as dados, p.atualizado_em
from public.perfis p;

revoke all on public.perfis_publicos from anon, public;
grant select on public.perfis_publicos to authenticated;
