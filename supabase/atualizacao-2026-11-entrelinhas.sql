-- Nas entrelinhas: execuções do teste, privadas (só a própria pessoa lê e grava).
-- O perfil público recebe apenas a carta escolhida para exibir (perfis.dados.cartaLiteraria).
create table if not exists public.entrelinhas_execucoes (
  id uuid primary key,
  usuario_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  versao int not null,
  ordem jsonb not null default '{}'::jsonb,       -- ordem das alternativas sorteada na execução
  respostas jsonb not null default '{}'::jsonb,   -- id da pergunta → id da alternativa
  pontos jsonb not null default '{}'::jsonb,
  carta text check (carta in ('D','X','R','S','W','N','C','E')),
  empatados text[],
  desempate text check (desempate in ('D','X','R','S','W','N','C','E')),
  estado text not null default 'em_andamento' check (estado in ('em_andamento','concluida')),
  visivel boolean not null default false,          -- é a carta exibida no perfil
  criado_em timestamptz not null default now(),
  concluida_em timestamptz
);
create index if not exists entrelinhas_execucoes_usuario on public.entrelinhas_execucoes (usuario_id, criado_em desc);

alter table public.entrelinhas_execucoes enable row level security;
revoke all on public.entrelinhas_execucoes from anon, public;
grant select, insert, update, delete on public.entrelinhas_execucoes to authenticated;

drop policy if exists "ver as próprias execuções" on public.entrelinhas_execucoes;
create policy "ver as próprias execuções" on public.entrelinhas_execucoes for select to authenticated using (usuario_id = auth.uid());
drop policy if exists "criar as próprias execuções" on public.entrelinhas_execucoes;
create policy "criar as próprias execuções" on public.entrelinhas_execucoes for insert to authenticated with check (usuario_id = auth.uid());
drop policy if exists "atualizar as próprias execuções" on public.entrelinhas_execucoes;
create policy "atualizar as próprias execuções" on public.entrelinhas_execucoes for update to authenticated using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
drop policy if exists "apagar as próprias execuções" on public.entrelinhas_execucoes;
create policy "apagar as próprias execuções" on public.entrelinhas_execucoes for delete to authenticated using (usuario_id = auth.uid());
