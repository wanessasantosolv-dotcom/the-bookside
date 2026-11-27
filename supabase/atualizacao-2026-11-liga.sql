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
