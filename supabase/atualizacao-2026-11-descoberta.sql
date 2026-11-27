-- the bookside · descoberta literária: cache das pesquisas contextuais (7 dias)
-- guarda só referências, metadados bibliográficos e justificativas curtas próprias
create table if not exists public.descoberta_cache (
  chave text primary key,
  consulta text,
  resposta jsonb not null,
  criado_em timestamptz not null default now()
);
alter table public.descoberta_cache enable row level security;
drop policy if exists "descoberta_cache leitura" on public.descoberta_cache;
create policy "descoberta_cache leitura" on public.descoberta_cache for select to authenticated using (true);
drop policy if exists "descoberta_cache grava" on public.descoberta_cache;
create policy "descoberta_cache grava" on public.descoberta_cache for insert to authenticated with check (true);
drop policy if exists "descoberta_cache atualiza" on public.descoberta_cache;
create policy "descoberta_cache atualiza" on public.descoberta_cache for update to authenticated using (true) with check (true);
create index if not exists descoberta_cache_criado on public.descoberta_cache (criado_em);
