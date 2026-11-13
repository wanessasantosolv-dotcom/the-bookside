-- the bookside · parte social e clubes (Supabase)
-- Rode DEPOIS do schema.sql: SQL Editor → New query → cole tudo → Run.
-- Pode rodar de novo sem problema (tudo usa "if not exists" / "or replace").

-- ───────────────────────── perfis públicos ─────────────────────────
-- O que as outras pessoas veem de um perfil: tudo menos o e-mail.
-- (a tabela perfis continua fechada: cada uma só lê a própria linha)
drop view if exists public.perfis_publicos;
create view public.perfis_publicos as
  select id, usuario, nome, dados ->> 'foto' as foto, dados - 'email' as dados, atualizado_em
  from public.perfis;
revoke all on public.perfis_publicos from anon, public;
grant select on public.perfis_publicos to authenticated;

-- ───────────────────────── seguir ─────────────────────────
create table if not exists public.seguidores (
  seguidor uuid not null references auth.users (id) on delete cascade,
  seguido uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (seguidor, seguido),
  check (seguidor <> seguido)
);
alter table public.seguidores enable row level security;
drop policy if exists "ver quem segue quem" on public.seguidores;
create policy "ver quem segue quem" on public.seguidores for select to authenticated using (true);
drop policy if exists "seguir" on public.seguidores;
create policy "seguir" on public.seguidores for insert to authenticated with check (seguidor = auth.uid());
drop policy if exists "deixar de seguir" on public.seguidores;
create policy "deixar de seguir" on public.seguidores for delete to authenticated using (seguidor = auth.uid());

-- ───────────────────────── clubes ─────────────────────────
create table if not exists public.clubes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 1 and 60),
  descricao text check (char_length(descricao) <= 280),
  codigo text not null unique,
  capa text,
  criado_por uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now()
);

-- regras do clube (também para quem já tinha rodado este arquivo antes)
alter table public.clubes add column if not exists limite_sugestoes int default 1 check (limite_sugestoes between 1 and 10);
alter table public.clubes add column if not exists max_membros int check (max_membros between 2 and 100);
alter table public.clubes add column if not exists codigo_expira_em timestamptz default now() + interval '7 days';

create table if not exists public.membros (
  clube_id uuid not null references public.clubes (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  papel text not null default 'membro' check (papel in ('moderadora', 'membro')),
  entrou_em timestamptz not null default now(),
  primary key (clube_id, usuario_id)
);

-- funções de apoio (rodam com permissão do dono para não dar voltas no RLS)
create or replace function public.e_membro(c uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from membros where clube_id = c and usuario_id = auth.uid());
$$;

create or replace function public.e_moderadora(c uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from membros where clube_id = c and usuario_id = auth.uid() and papel = 'moderadora');
$$;

-- código de convite: 6 caracteres sem os que confundem (0/O, 1/I)
create or replace function public.gerar_codigo() returns text
  language plpgsql volatile set search_path = public as $$
declare
  cod text;
  letras text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
begin
  loop
    cod := '';
    for i in 1..6 loop
      cod := cod || substr(letras, 1 + floor(random() * length(letras))::int, 1);
    end loop;
    exit when not exists (select 1 from clubes where codigo = cod);
  end loop;
  return cod;
end $$;

-- criar clube: gera o código de convite e coloca quem criou como moderadora
create or replace function public.criar_clube(p_nome text, p_descricao text default null) returns uuid
  language plpgsql security definer set search_path = public as $$
declare novo uuid;
begin
  if auth.uid() is null then raise exception 'precisa estar logada'; end if;
  insert into clubes (nome, descricao, codigo, criado_por, codigo_expira_em)
    values (trim(p_nome), nullif(trim(coalesce(p_descricao, '')), ''), gerar_codigo(), auth.uid(), now() + interval '7 days')
    returning id into novo;
  insert into membros (clube_id, usuario_id, papel) values (novo, auth.uid(), 'moderadora');
  return novo;
end $$;

-- novo código de convite (só moderadora): o antigo para de funcionar
create or replace function public.novo_codigo(p_clube uuid) returns text
  language plpgsql security definer set search_path = public as $$
declare cod text;
begin
  if not e_moderadora(p_clube) then raise exception 'só quem modera gera convite'; end if;
  cod := gerar_codigo();
  update clubes set codigo = cod, codigo_expira_em = now() + interval '7 days' where id = p_clube;
  return cod;
end $$;

-- entrar com o código de 6 caracteres (vale 7 dias; respeita o limite de membros)
create or replace function public.entrar_no_clube(p_codigo text) returns uuid
  language plpgsql security definer set search_path = public as $$
declare c clubes%rowtype;
begin
  if auth.uid() is null then raise exception 'precisa estar logada'; end if;
  select * into c from clubes where codigo = upper(trim(p_codigo));
  if c.id is null then return null; end if;
  if exists (select 1 from membros where clube_id = c.id and usuario_id = auth.uid()) then return c.id; end if;
  if c.codigo_expira_em is not null and c.codigo_expira_em < now() then raise exception 'convite expirado'; end if;
  if c.max_membros is not null and (select count(*) from membros where clube_id = c.id) >= c.max_membros then
    raise exception 'clube cheio';
  end if;
  insert into membros (clube_id, usuario_id) values (c.id, auth.uid()) on conflict do nothing;
  return c.id;
end $$;

grant execute on function public.criar_clube(text, text) to authenticated;
grant execute on function public.entrar_no_clube(text) to authenticated;
grant execute on function public.novo_codigo(uuid) to authenticated;
revoke execute on function public.gerar_codigo() from public, anon, authenticated;

alter table public.clubes enable row level security;
drop policy if exists "membros veem o clube" on public.clubes;
create policy "membros veem o clube" on public.clubes for select to authenticated using (public.e_membro(id));
drop policy if exists "moderadora edita o clube" on public.clubes;
create policy "moderadora edita o clube" on public.clubes for update to authenticated
  using (public.e_moderadora(id)) with check (public.e_moderadora(id));
drop policy if exists "moderadora apaga o clube" on public.clubes;
create policy "moderadora apaga o clube" on public.clubes for delete to authenticated using (public.e_moderadora(id));

alter table public.membros enable row level security;
drop policy if exists "membros veem os membros" on public.membros;
create policy "membros veem os membros" on public.membros for select to authenticated using (public.e_membro(clube_id));
drop policy if exists "sair do clube" on public.membros;
create policy "sair do clube" on public.membros for delete to authenticated
  using (usuario_id = auth.uid() or public.e_moderadora(clube_id));

-- livros do clube: sugestões, leitura da vez e lidos
create table if not exists public.clube_livros (
  id uuid primary key default gen_random_uuid(),
  clube_id uuid not null references public.clubes (id) on delete cascade,
  livro jsonb not null,
  estado text not null default 'sugerido' check (estado in ('sugerido', 'lendo', 'lido')),
  sugerido_por uuid references auth.users (id) on delete set null,
  motivo text check (char_length(motivo) <= 280),
  rodada int,
  prazo date,
  iniciado_em timestamptz,
  encerrado_em timestamptz,
  criado_em timestamptz not null default now()
);
create index if not exists clube_livros_clube on public.clube_livros (clube_id, estado);
-- ainda dá para sugerir este mês? (regra do clube: N sugestões por pessoa por mês)
create or replace function public.pode_sugerir(c uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select e_membro(c) and (
    (select limite_sugestoes from clubes where id = c) is null
    or (select count(*) from clube_livros
        where clube_id = c and sugerido_por = auth.uid() and criado_em >= date_trunc('month', now()))
       < (select limite_sugestoes from clubes where id = c)
  );
$$;

alter table public.clube_livros enable row level security;
drop policy if exists "membros veem os livros" on public.clube_livros;
create policy "membros veem os livros" on public.clube_livros for select to authenticated using (public.e_membro(clube_id));
-- membros sugerem (dentro da regra do mês); quem modera pode pôr o livro da vez direto
drop policy if exists "membros sugerem" on public.clube_livros;
create policy "membros sugerem" on public.clube_livros for insert to authenticated
  with check (
    (public.e_moderadora(clube_id) or public.pode_sugerir(clube_id))
    and sugerido_por = auth.uid() and estado = 'sugerido'
  );
drop policy if exists "moderadora organiza a leitura" on public.clube_livros;
create policy "moderadora organiza a leitura" on public.clube_livros for update to authenticated
  using (public.e_moderadora(clube_id)) with check (public.e_moderadora(clube_id));
drop policy if exists "apagar sugestão" on public.clube_livros;
create policy "apagar sugestão" on public.clube_livros for delete to authenticated
  using (public.e_moderadora(clube_id) or (sugerido_por = auth.uid() and estado = 'sugerido'));

create table if not exists public.votos (
  clube_livro_id uuid not null references public.clube_livros (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  primary key (clube_livro_id, usuario_id)
);
alter table public.votos enable row level security;
drop policy if exists "membros veem os votos" on public.votos;
create policy "membros veem os votos" on public.votos for select to authenticated
  using (exists (select 1 from clube_livros l where l.id = clube_livro_id and public.e_membro(l.clube_id)));
drop policy if exists "votar" on public.votos;
create policy "votar" on public.votos for insert to authenticated
  with check (usuario_id = auth.uid() and exists (select 1 from clube_livros l where l.id = clube_livro_id and public.e_membro(l.clube_id)));
drop policy if exists "tirar o voto" on public.votos;
create policy "tirar o voto" on public.votos for delete to authenticated using (usuario_id = auth.uid());

-- fichas (a avaliação de cada membro sobre a leitura do clube)
create table if not exists public.fichas (
  id uuid primary key default gen_random_uuid(),
  clube_livro_id uuid not null references public.clube_livros (id) on delete cascade,
  autor uuid not null references auth.users (id) on delete cascade,
  notas jsonb not null default '{}'::jsonb,
  nota numeric(2, 1),
  personagem text check (char_length(personagem) <= 80),
  citacao text check (char_length(citacao) <= 400),
  texto text check (char_length(texto) <= 4000),
  spoiler boolean not null default false,
  criado_em timestamptz not null default now(),
  unique (clube_livro_id, autor)
);
alter table public.fichas enable row level security;
drop policy if exists "membros leem as fichas" on public.fichas;
create policy "membros leem as fichas" on public.fichas for select to authenticated
  using (exists (select 1 from clube_livros l where l.id = clube_livro_id and public.e_membro(l.clube_id)));
drop policy if exists "escrever a própria ficha" on public.fichas;
create policy "escrever a própria ficha" on public.fichas for insert to authenticated
  with check (autor = auth.uid() and exists (select 1 from clube_livros l where l.id = clube_livro_id and public.e_membro(l.clube_id)));
drop policy if exists "editar a própria ficha" on public.fichas;
create policy "editar a própria ficha" on public.fichas for update to authenticated
  using (autor = auth.uid()) with check (autor = auth.uid());
drop policy if exists "apagar a própria ficha" on public.fichas;
create policy "apagar a própria ficha" on public.fichas for delete to authenticated using (autor = auth.uid());

-- agenda do clube
create table if not exists public.encontros (
  id uuid primary key default gen_random_uuid(),
  clube_id uuid not null references public.clubes (id) on delete cascade,
  titulo text not null check (char_length(titulo) between 1 and 80),
  quando timestamptz not null,
  local text check (char_length(local) <= 120),
  criado_por uuid references auth.users (id) on delete set null,
  criado_em timestamptz not null default now()
);
alter table public.encontros enable row level security;
drop policy if exists "membros veem a agenda" on public.encontros;
create policy "membros veem a agenda" on public.encontros for select to authenticated using (public.e_membro(clube_id));
drop policy if exists "membros marcam encontros" on public.encontros;
create policy "membros marcam encontros" on public.encontros for insert to authenticated
  with check (public.e_membro(clube_id) and criado_por = auth.uid());
drop policy if exists "desmarcar encontro" on public.encontros;
create policy "desmarcar encontro" on public.encontros for delete to authenticated
  using (criado_por = auth.uid() or public.e_moderadora(clube_id));

alter table public.clubes add column if not exists capa text;
alter table public.fichas add column if not exists spoiler boolean not null default false;

-- ───────────────────────── feed ─────────────────────────
-- o que aparece no feed: começou, terminou, avaliou, quer ler, ficha do clube
create table if not exists public.atividades (
  id uuid primary key default gen_random_uuid(),
  autor uuid not null references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('comecou', 'terminou', 'avaliou', 'quer', 'ficha')),
  livro jsonb not null,
  nota numeric(2, 1),
  texto text check (char_length(texto) <= 4000),
  clube_id uuid references public.clubes (id) on delete cascade,
  criado_em timestamptz not null default now()
);
create index if not exists atividades_autor on public.atividades (autor, criado_em desc);
create index if not exists atividades_clube on public.atividades (clube_id, criado_em desc);
alter table public.atividades enable row level security;
drop policy if exists "ler atividades" on public.atividades;
create policy "ler atividades" on public.atividades for select to authenticated
  using (clube_id is null or public.e_membro(clube_id));
drop policy if exists "publicar atividade" on public.atividades;
create policy "publicar atividade" on public.atividades for insert to authenticated
  with check (autor = auth.uid() and (clube_id is null or public.e_membro(clube_id)));
drop policy if exists "apagar a própria atividade" on public.atividades;
create policy "apagar a própria atividade" on public.atividades for delete to authenticated using (autor = auth.uid());

create table if not exists public.curtidas (
  atividade_id uuid not null references public.atividades (id) on delete cascade,
  autor uuid not null references auth.users (id) on delete cascade,
  criado_em timestamptz not null default now(),
  primary key (atividade_id, autor)
);
alter table public.curtidas enable row level security;
drop policy if exists "ver curtidas" on public.curtidas;
create policy "ver curtidas" on public.curtidas for select to authenticated
  using (exists (select 1 from atividades a where a.id = atividade_id));
drop policy if exists "curtir" on public.curtidas;
create policy "curtir" on public.curtidas for insert to authenticated
  with check (autor = auth.uid() and exists (select 1 from atividades a where a.id = atividade_id));
drop policy if exists "descurtir" on public.curtidas;
create policy "descurtir" on public.curtidas for delete to authenticated using (autor = auth.uid());

create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  atividade_id uuid not null references public.atividades (id) on delete cascade,
  autor uuid not null references auth.users (id) on delete cascade,
  texto text not null check (char_length(texto) between 1 and 1000),
  criado_em timestamptz not null default now()
);
create index if not exists comentarios_atividade on public.comentarios (atividade_id, criado_em);
alter table public.comentarios enable row level security;
drop policy if exists "ler comentários" on public.comentarios;
create policy "ler comentários" on public.comentarios for select to authenticated
  using (exists (select 1 from atividades a where a.id = atividade_id));
drop policy if exists "comentar" on public.comentarios;
create policy "comentar" on public.comentarios for insert to authenticated
  with check (autor = auth.uid() and exists (select 1 from atividades a where a.id = atividade_id));
drop policy if exists "apagar comentário" on public.comentarios;
create policy "apagar comentário" on public.comentarios for delete to authenticated
  using (autor = auth.uid() or exists (select 1 from atividades a where a.id = atividade_id and a.autor = auth.uid()));
