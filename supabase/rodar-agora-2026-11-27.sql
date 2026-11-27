-- the bookside · tudo o que falta rodar (novembro/2026). Pode rodar inteiro: é idempotente.

-- ═════ 1. nas entrelinhas ═════
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

-- ═════ 2. descoberta literária (cache) ═════
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
grant select, insert, update on public.descoberta_cache to authenticated;

-- ═════ 3. liga dos leitores (histórico) ═════
-- the bookside · liga dos leitores: histórico consolidado das pequenas glórias
-- cada mês encerrado é gravado uma vez e nunca sobrescrito
create table if not exists public.liga_historico (
  clube_id uuid not null references public.clubes(id) on delete cascade,
  periodo text not null,            -- "2026-10"
  nome text not null,               -- "outubro de 2026"
  distincoes jsonb not null,        -- [{id, nome, vencedores:[{usuario_id, valor}]}]
  consolidado_em timestamptz not null default now(),
  primary key (clube_id, periodo)
);
alter table public.liga_historico enable row level security;
drop policy if exists "liga_historico leitura" on public.liga_historico;
create policy "liga_historico leitura" on public.liga_historico for select to authenticated using (public.e_membro(clube_id));
drop policy if exists "liga_historico grava" on public.liga_historico;
create policy "liga_historico grava" on public.liga_historico for insert to authenticated with check (public.e_membro(clube_id));
-- sem política de update/delete: resultados históricos não são reescritos
grant select, insert on public.liga_historico to authenticated;
