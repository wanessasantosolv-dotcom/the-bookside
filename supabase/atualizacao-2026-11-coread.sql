-- the bookside · co-read (o antigo "ler junto")
-- Rode no Supabase: SQL Editor → New query → cole tudo → Run.
-- Pode rodar mais de uma vez. Não apaga nem muda nenhuma leitura que já existe:
-- quem já estava numa leitura continua dentro dela, lendo.

-- ── a leitura ganha nome, cores, início, ritmo e um jeito de encerrar ──
alter table public.leituras_juntas add column if not exists nome text check (nome is null or char_length(nome) <= 60);
alter table public.leituras_juntas add column if not exists estilo text;
alter table public.leituras_juntas add column if not exists inicio date;
alter table public.leituras_juntas add column if not exists sem_spoiler boolean not null default true;
alter table public.leituras_juntas add column if not exists encerrada_em timestamptz;

-- ── cada pessoa: convidada (ainda não aceitou), lendo ou pausou ──
alter table public.leitura_junta_pessoas add column if not exists estado text not null default 'lendo';
alter table public.leitura_junta_pessoas drop constraint if exists leitura_junta_pessoas_estado_check;
alter table public.leitura_junta_pessoas add constraint leitura_junta_pessoas_estado_check
  check (estado in ('convidada', 'lendo', 'pausou'));
alter table public.leitura_junta_pessoas add column if not exists convidada_por uuid references auth.users (id) on delete set null;
alter table public.leitura_junta_pessoas add column if not exists terminou_em timestamptz;

-- está na leitura de verdade (aceitou o convite)
create or replace function public.le_junto_ativa(l uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from leitura_junta_pessoas
                 where leitura_id = l and usuario_id = auth.uid() and estado <> 'convidada');
$$;

-- até que página eu já li nesta leitura (quem terminou vê tudo)
create or replace function public.minha_pagina_no_coread(l uuid) returns int
  language sql stable security definer set search_path = public as $$
  select case when terminou then 2147483647 else pagina end
  from leitura_junta_pessoas where leitura_id = l and usuario_id = auth.uid() and estado <> 'convidada';
$$;

-- ── convites: quem criou chama quem segue como "convidada"; a pessoa aceita ou recusa ──
drop policy if exists "entrar na leitura junta" on public.leitura_junta_pessoas;
create policy "entrar na leitura junta" on public.leitura_junta_pessoas for insert to authenticated
  with check (
    (usuario_id = auth.uid() and exists (select 1 from leituras_juntas where id = leitura_id and criado_por = auth.uid()))
    or exists (select 1 from leituras_juntas l join seguidores s on s.seguidor = auth.uid() and s.seguido = usuario_id
               where l.id = leitura_id and l.criado_por = auth.uid())
  );
-- aceitar o convite, pausar, voltar e registrar a página: só a própria linha
drop policy if exists "meu progresso na leitura junta" on public.leitura_junta_pessoas;
create policy "meu progresso na leitura junta" on public.leitura_junta_pessoas for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
-- recusar o convite ou sair = apagar a própria linha; quem criou pode desfazer um convite pendente
drop policy if exists "sair da leitura junta" on public.leitura_junta_pessoas;
create policy "sair da leitura junta" on public.leitura_junta_pessoas for delete to authenticated
  using (
    usuario_id = auth.uid()
    or (estado = 'convidada' and exists (select 1 from leituras_juntas where id = leitura_id and criado_por = auth.uid()))
  );

-- ── conversa sem spoiler, protegida no banco ──
-- uma mensagem só chega para quem já passou da página dela (ou para quem escreveu).
-- quem ainda está no convite não vê a conversa.
drop policy if exists "ver recados" on public.leitura_junta_recados;
create policy "ver recados" on public.leitura_junta_recados for select to authenticated using (
  autor = auth.uid()
  or (public.le_junto_ativa(leitura_id)
      and (pagina is null or pagina <= coalesce(public.minha_pagina_no_coread(leitura_id), -1)))
);
drop policy if exists "mandar recado" on public.leitura_junta_recados;
create policy "mandar recado" on public.leitura_junta_recados for insert to authenticated
  with check (autor = auth.uid() and public.le_junto_ativa(leitura_id));

-- quantas mensagens estão guardadas esperando por mim (só o número, nunca o texto)
create or replace function public.recados_guardados(l uuid) returns table (pagina int, quantas bigint)
  language sql stable security definer set search_path = public as $$
  select r.pagina, count(*) from leitura_junta_recados r
  where r.leitura_id = l and public.le_junto_ativa(l) and r.autor <> auth.uid()
    and r.pagina is not null and r.pagina > coalesce(public.minha_pagina_no_coread(l), -1)
  group by r.pagina;
$$;
grant execute on function public.recados_guardados(uuid) to authenticated;

-- ── reações por trecho (e por mensagem), com a mesma proteção contra spoiler ──
create table if not exists public.leitura_junta_reacoes (
  id uuid primary key default gen_random_uuid(),
  leitura_id uuid not null references public.leituras_juntas (id) on delete cascade,
  autor uuid not null references auth.users (id) on delete cascade default auth.uid(),
  tipo text not null check (tipo in ('amei', 'nao-acredito', 'triste', 'conversar', 'reviravolta', 'favorito', 'confusa')),
  pagina int,
  recado_id uuid references public.leitura_junta_recados (id) on delete cascade,
  criado_em timestamptz not null default now()
);
create index if not exists leitura_junta_reacoes_leitura on public.leitura_junta_reacoes (leitura_id);
create unique index if not exists leitura_junta_reacoes_uma_por_recado
  on public.leitura_junta_reacoes (recado_id, autor, tipo) where recado_id is not null;

alter table public.leitura_junta_reacoes enable row level security;
drop policy if exists "ver reacoes" on public.leitura_junta_reacoes;
create policy "ver reacoes" on public.leitura_junta_reacoes for select to authenticated using (
  autor = auth.uid()
  or (public.le_junto_ativa(leitura_id)
      and (pagina is null or pagina <= coalesce(public.minha_pagina_no_coread(leitura_id), -1)))
);
drop policy if exists "reagir" on public.leitura_junta_reacoes;
create policy "reagir" on public.leitura_junta_reacoes for insert to authenticated
  with check (autor = auth.uid() and public.le_junto_ativa(leitura_id));
drop policy if exists "desfazer reacao" on public.leitura_junta_reacoes;
create policy "desfazer reacao" on public.leitura_junta_reacoes for delete to authenticated using (autor = auth.uid());

-- entrar pelo código (ou link) também vale como aceitar um convite pendente
create or replace function public.entrar_na_leitura_junta(p_codigo text) returns uuid
  language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  select id into v from leituras_juntas where codigo = upper(btrim(p_codigo)) and encerrada_em is null;
  if v is null then return null; end if;
  insert into leitura_junta_pessoas (leitura_id, usuario_id) values (v, auth.uid())
    on conflict (leitura_id, usuario_id) do update set estado = 'lendo'
    where leitura_junta_pessoas.estado = 'convidada';
  return v;
end $$;
grant execute on function public.entrar_na_leitura_junta(text) to authenticated;
