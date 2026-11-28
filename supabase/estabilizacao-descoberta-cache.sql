-- O cache de pesquisas passa a ficar em memória, isolado por conta.
-- Revoga o acesso às linhas legadas e preserva os registros existentes.
do $$
begin
  if to_regclass('public.descoberta_cache') is not null then
    drop policy if exists "descoberta_cache leitura" on public.descoberta_cache;
    drop policy if exists "descoberta_cache grava" on public.descoberta_cache;
    drop policy if exists "descoberta_cache atualiza" on public.descoberta_cache;
    revoke all on public.descoberta_cache from anon, authenticated;
  end if;
end;
$$;
