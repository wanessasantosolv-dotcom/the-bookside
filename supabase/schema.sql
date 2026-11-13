-- the bookside · esquema do banco (Supabase)
-- Cole tudo no Supabase: SQL Editor → New query → Run.

-- Perfil de cada leitora. Por enquanto o perfil inteiro (estantes, livros,
-- avaliações, resultado do teste…) fica no campo `dados`, em JSON.
create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  usuario text unique,
  nome text,
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now()
);

alter table public.perfis enable row level security;

-- cada pessoa só lê e escreve o próprio perfil
drop policy if exists "ler o próprio perfil" on public.perfis;
create policy "ler o próprio perfil" on public.perfis
  for select using (auth.uid() = id);

drop policy if exists "criar o próprio perfil" on public.perfis;
create policy "criar o próprio perfil" on public.perfis
  for insert with check (auth.uid() = id);

drop policy if exists "atualizar o próprio perfil" on public.perfis;
create policy "atualizar o próprio perfil" on public.perfis
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "apagar o próprio perfil" on public.perfis;
create policy "apagar o próprio perfil" on public.perfis
  for delete using (auth.uid() = id);
