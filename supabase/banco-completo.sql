-- the bookside · banco completo (pode rodar quantas vezes quiser: não apaga dados)
-- cole TUDO no SQL Editor do Supabase e clique em Run

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
  papel text not null default 'membro' check (papel in ('moderadora', 'organizadora', 'membro')),
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

-- cargos: moderadora (cuida de tudo, inclusive dos cargos e do clube),
-- organizadora (cuida da leitura, da agenda, dos convites e das membros) e membro
alter table public.membros drop constraint if exists membros_papel_check;
alter table public.membros add constraint membros_papel_check
  check (papel in ('moderadora', 'organizadora', 'membro'));

create or replace function public.e_organizadora(c uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from membros where clube_id = c and usuario_id = auth.uid() and papel in ('moderadora', 'organizadora'));
$$;

create or replace function public.papel_de(c uuid, u uuid) returns text
  language sql stable security definer set search_path = public as $$
  select papel from membros where clube_id = c and usuario_id = u;
$$;

-- só a moderadora troca cargos; o clube nunca fica sem moderadora
create or replace function public.mudar_papel(p_clube uuid, p_usuario uuid, p_papel text) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if not e_moderadora(p_clube) then raise exception 'só a moderadora muda os cargos'; end if;
  if p_papel not in ('moderadora', 'organizadora', 'membro') then raise exception 'cargo inválido'; end if;
  if p_papel <> 'moderadora'
     and (select papel from membros where clube_id = p_clube and usuario_id = p_usuario) = 'moderadora'
     and (select count(*) from membros where clube_id = p_clube and papel = 'moderadora') <= 1 then
    raise exception 'o clube precisa de pelo menos uma moderadora';
  end if;
  update membros set papel = p_papel where clube_id = p_clube and usuario_id = p_usuario;
end $$;
grant execute on function public.mudar_papel(uuid, uuid, text) to authenticated;

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
  if not e_organizadora(p_clube) then raise exception 'só quem organiza gera convite'; end if;
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
  using (
    usuario_id = auth.uid()
    or public.e_moderadora(clube_id)
    -- organizadora tira membros, mas não quem modera ou organiza
    or (public.e_organizadora(clube_id) and papel = 'membro')
  );

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
-- e incluir livros que o clube já leu
drop policy if exists "membros sugerem" on public.clube_livros;
create policy "membros sugerem" on public.clube_livros for insert to authenticated
  with check (
    (public.e_organizadora(clube_id) or public.pode_sugerir(clube_id))
    and sugerido_por = auth.uid()
    -- sugestão (qualquer membro) ou um livro que o clube já leu (só quem modera, para o histórico)
    and (estado = 'sugerido' or (estado = 'lido' and public.e_organizadora(clube_id)))
  );
drop policy if exists "moderadora organiza a leitura" on public.clube_livros;
create policy "moderadora organiza a leitura" on public.clube_livros for update to authenticated
  using (public.e_organizadora(clube_id)) with check (public.e_organizadora(clube_id));
drop policy if exists "apagar sugestão" on public.clube_livros;
create policy "apagar sugestão" on public.clube_livros for delete to authenticated
  using (public.e_organizadora(clube_id) or (sugerido_por = auth.uid() and estado = 'sugerido'));

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
  using (criado_por = auth.uid() or public.e_organizadora(clube_id));

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
-- tipos de atualização: os de sempre + progresso de leitura, trecho guardado e movimento dos clubes
alter table public.atividades drop constraint if exists atividades_tipo_check;
alter table public.atividades add constraint atividades_tipo_check
  check (tipo in ('comecou', 'terminou', 'avaliou', 'quer', 'ficha', 'progresso', 'trecho', 'clube', 'post'));
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

-- tema visual do clube (mesmas opções do tema do perfil, em lib/dados.ts)
alter table public.clubes add column if not exists tema text;
-- como o clube escolhe os livros:
--   fila (cada uma sugere e todos são lidos, na ordem) · votacao · rodizio (cada vez uma escolhe)
--   moderadora (quem modera escolhe) · sorteio (sorteia entre as sugestões)
alter table public.clubes add column if not exists escolha text not null default 'fila';
alter table public.clubes drop constraint if exists clubes_escolha_check;
alter table public.clubes add constraint clubes_escolha_check
  check (escolha in ('fila', 'votacao', 'rodizio', 'moderadora', 'sorteio'));
-- fichas de antes do app (ex.: da revista em PDF do clube), de quem ainda não escreveu a ficha aqui
alter table public.clube_livros add column if not exists fichas_antigas jsonb not null default '[]'::jsonb;

-- ───────────────────────── opiniões sobre um livro ─────────────────────────
-- Notas e resenhas de quem usa o app e tem o livro na estante (os perfis já são
-- públicos para quem tem conta). O mesmo livro pode ter códigos diferentes em
-- cada estante, então também compara o título sem acentos e sem pontuação.
create or replace function public.titulo_normalizado(t text) returns text
language sql immutable as $$
  select trim(regexp_replace(
    translate(lower(coalesce(t, '')), 'áàâãäéèêëíìîïóòôõöúùûüçñ', 'aaaaaeeeeiiiiooooouuuucn'),
    '[^a-z0-9]+', ' ', 'g'))
$$;

create or replace function public.opinioes_do_livro(p_id text, p_titulo text)
returns table (id uuid, usuario text, nome text, foto text, nota numeric, resenha text, status text)
language sql stable security invoker set search_path = public as $$
  select p.id, p.usuario, p.nome, p.foto,
         nullif(l ->> 'nota', '')::numeric, nullif(trim(l ->> 'resenha'), ''), l ->> 'status'
  from public.perfis_publicos p
  cross join lateral jsonb_array_elements(
    case when jsonb_typeof(p.dados -> 'livros') = 'array' then p.dados -> 'livros' else '[]'::jsonb end
  ) as l
  where p.id <> auth.uid()
    and (l ->> 'id' = p_id or public.titulo_normalizado(l ->> 'titulo') = public.titulo_normalizado(p_titulo))
    and (coalesce((l ->> 'nota')::numeric, 0) > 0 or coalesce(trim(l ->> 'resenha'), '') <> '')
  order by (coalesce(trim(l ->> 'resenha'), '') <> '') desc, p.atualizado_em desc
  limit 30
$$;
revoke all on function public.opinioes_do_livro(text, text) from anon, public;
grant execute on function public.opinioes_do_livro(text, text) to authenticated;

-- ───────────────────────── em alta no app ─────────────────────────
-- lê uma data guardada no perfil; se estiver estragada, ignora (não derruba a consulta)
create or replace function public.data_ou_nada(t text) returns timestamptz
language plpgsql immutable as $$
begin
  return nullif(t, '')::timestamptz;
exception when others then
  return null;
end $$;

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

-- progresso de cada membro na leitura em andamento (não comecei / lendo / terminei)
create table if not exists public.progresso_leitura (
  clube_livro_id uuid not null references public.clube_livros (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'lendo' check (status in ('nao_comecei', 'lendo', 'terminei')),
  atualizado_em timestamptz not null default now(),
  primary key (clube_livro_id, usuario_id)
);
alter table public.progresso_leitura enable row level security;
drop policy if exists "membros veem o progresso" on public.progresso_leitura;
create policy "membros veem o progresso" on public.progresso_leitura for select to authenticated
  using (exists (select 1 from clube_livros l where l.id = clube_livro_id and public.e_membro(l.clube_id)));
drop policy if exists "marcar o próprio progresso" on public.progresso_leitura;
create policy "marcar o próprio progresso" on public.progresso_leitura for insert to authenticated
  with check (usuario_id = auth.uid() and exists (select 1 from clube_livros l where l.id = clube_livro_id and public.e_membro(l.clube_id)));
drop policy if exists "atualizar o próprio progresso" on public.progresso_leitura;
create policy "atualizar o próprio progresso" on public.progresso_leitura for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- onde cada um está na leitura em andamento (página ou capítulo)
alter table public.progresso_leitura add column if not exists unidade text check (unidade in ('pagina', 'capitulo'));
alter table public.progresso_leitura add column if not exists numero int check (numero >= 0);


-- "o que a gente amou": os favoritos do clube (ids de clube_livros, em ordem).
-- vazio = o app mostra sozinho os de nota mais alta
alter table public.clubes add column if not exists favoritos jsonb not null default '[]';
create or replace function public.definir_favoritos_do_clube(p_clube uuid, p_ids jsonb) returns void
  language plpgsql security definer set search_path = public as $$
begin
  if not e_organizadora(p_clube) then raise exception 'só quem organiza escolhe os favoritos'; end if;
  update clubes set favoritos = coalesce(p_ids, '[]'::jsonb) where id = p_clube;
end $$;
grant execute on function public.definir_favoritos_do_clube(uuid, jsonb) to authenticated;


-- os mais lidos do ano no the bookside: quantas pessoas marcaram como lido em p_ano
create or replace function public.mais_lidos_do_ano(p_ano int default extract(year from now())::int)
returns table (id text, titulo text, autor text, capa text, pessoas bigint)
language sql stable security invoker set search_path = public as $$
  with lidos as (
    select p.id as pessoa, l
    from public.perfis_publicos p
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(p.dados -> 'livros') = 'array' then p.dados -> 'livros' else '[]'::jsonb end
    ) as l
    where l ->> 'status' = 'lido'
      and extract(year from public.data_ou_nada(l ->> 'lidoEm')) = p_ano
  )
  select (array_agg(l ->> 'id'))[1], (array_agg(l ->> 'titulo'))[1], (array_agg(l ->> 'autor'))[1],
         (array_agg(l ->> 'capa') filter (where (l ->> 'capa') like 'http%'))[1],
         count(distinct pessoa)
  from lidos
  where coalesce(l ->> 'titulo', '') <> ''
  group by public.titulo_normalizado(l ->> 'titulo')
  order by count(distinct pessoa) desc, max(l ->> 'lidoEm') desc
  limit 20
$$;
revoke all on function public.mais_lidos_do_ano(int) from anon, public;
grant execute on function public.mais_lidos_do_ano(int) to authenticated;

-- ───────── usuário (@) ─────────
-- regras: 3 a 24 caracteres, letras minúsculas, números, ponto e sublinhado;
-- começa e termina com letra ou número; sem ".." ; alguns nomes reservados.
create or replace function public.usuario_valido(u text) returns boolean
  language sql immutable as $$
  select coalesce(u ~ '^[a-z0-9][a-z0-9._]{1,22}[a-z0-9]$' and u !~ '\.\.', false);
$$;

-- "ok" | "invalido" | "reservado" | "em_uso" (quem chama pode ser você mesma: o seu atual vale)
create or replace function public.usuario_disponivel(p_usuario text) returns text
  language plpgsql stable security definer set search_path = public as $$
declare u text := lower(btrim(replace(coalesce(p_usuario, ''), '@', '')));
begin
  if not usuario_valido(u) then return 'invalido'; end if;
  if u = any (array['admin', 'administrador', 'bookside', 'thebookside', 'the.bookside', 'suporte',
                    'ajuda', 'entrar', 'perfil', 'clubes', 'clube', 'oficial', 'api', 'moderacao']) then
    return 'reservado';
  end if;
  if exists (select 1 from perfis where lower(usuario) = u and id is distinct from auth.uid()) then
    return 'em_uso';
  end if;
  return 'ok';
end $$;
grant execute on function public.usuario_disponivel(text) to anon, authenticated;

-- o mesmo @ não pode existir com letras maiúsculas/minúsculas diferentes
do $$ begin
  create unique index if not exists perfis_usuario_minusculo on public.perfis (lower(usuario));
exception when others then
  raise notice 'há @ repetidos com maiúsculas diferentes; o índice fica para depois';
end $$;

-- entrar com o @: devolve o e-mail da conta só se a senha estiver certa
-- (assim ninguém descobre o e-mail de outra pessoa pelo @). Limite de 8 tentativas por @ a cada 15 min.
create table if not exists public.tentativas_login (
  usuario text not null,
  em timestamptz not null default now()
);
alter table public.tentativas_login enable row level security;
revoke all on public.tentativas_login from anon, authenticated;

create or replace function public.email_para_entrar(p_usuario text, p_senha text) returns text
  language plpgsql volatile security definer set search_path = public, extensions, auth as $$
declare
  u text := lower(btrim(replace(coalesce(p_usuario, ''), '@', '')));
  v_email text;
  v_hash text;
begin
  delete from tentativas_login where em < now() - interval '1 day';
  if (select count(*) from tentativas_login where usuario = u and em > now() - interval '15 minutes') >= 8 then
    raise exception 'muitas tentativas, espere alguns minutos';
  end if;
  insert into tentativas_login (usuario) values (u);
  select au.email, au.encrypted_password into v_email, v_hash
    from auth.users au join public.perfis p on p.id = au.id
   where lower(p.usuario) = u;
  if v_email is null or v_hash is null or crypt(coalesce(p_senha, ''), v_hash) <> v_hash then
    return null;
  end if;
  return v_email;
end $$;
revoke all on function public.email_para_entrar(text, text) from public;
grant execute on function public.email_para_entrar(text, text) to anon, authenticated;

-- ───────── desafios de leitura (sozinha, com amigos ou com um clube) ─────────
create table if not exists public.desafios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null check (char_length(titulo) between 1 and 80),
  tipo text not null check (tipo in ('livros', 'paginas', 'minutos', 'pilha', 'bingo', 'dias')),
  meta int not null check (meta between 1 and 100000),
  inicio date not null,
  fim date not null,
  modelo text,
  config jsonb not null default '{}',
  codigo text unique,
  clube_id uuid references public.clubes (id) on delete cascade,
  criado_por uuid not null references auth.users (id) on delete cascade default auth.uid(),
  criado_em timestamptz not null default now(),
  check (fim >= inicio)
);
create table if not exists public.desafio_participantes (
  desafio_id uuid not null references public.desafios (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  progresso int not null default 0,
  detalhe jsonb not null default '{}',
  concluido_em timestamptz,
  entrou_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (desafio_id, usuario_id)
);

create or replace function public.participa_do_desafio(d uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from desafio_participantes where desafio_id = d and usuario_id = auth.uid());
$$;

alter table public.desafios enable row level security;
drop policy if exists "ver desafios" on public.desafios;
create policy "ver desafios" on public.desafios for select to authenticated
  using (criado_por = auth.uid() or public.participa_do_desafio(id)
         or (clube_id is not null and public.e_membro(clube_id)));
drop policy if exists "criar desafio" on public.desafios;
create policy "criar desafio" on public.desafios for insert to authenticated
  with check (criado_por = auth.uid() and (clube_id is null or public.e_membro(clube_id)));
drop policy if exists "editar desafio" on public.desafios;
create policy "editar desafio" on public.desafios for update to authenticated
  using (criado_por = auth.uid()) with check (criado_por = auth.uid());
drop policy if exists "apagar desafio" on public.desafios;
create policy "apagar desafio" on public.desafios for delete to authenticated
  using (criado_por = auth.uid());

alter table public.desafio_participantes enable row level security;
drop policy if exists "ver participantes" on public.desafio_participantes;
create policy "ver participantes" on public.desafio_participantes for select to authenticated
  using (public.participa_do_desafio(desafio_id)
         or exists (select 1 from desafios d where d.id = desafio_id and
                    (d.criado_por = auth.uid() or (d.clube_id is not null and public.e_membro(d.clube_id)))));
drop policy if exists "entrar no desafio" on public.desafio_participantes;
create policy "entrar no desafio" on public.desafio_participantes for insert to authenticated
  with check (usuario_id = auth.uid() and exists (
    select 1 from desafios d where d.id = desafio_id and
      (d.criado_por = auth.uid() or (d.clube_id is not null and public.e_membro(d.clube_id)))));
drop policy if exists "meu progresso" on public.desafio_participantes;
create policy "meu progresso" on public.desafio_participantes for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
drop policy if exists "sair do desafio" on public.desafio_participantes;
create policy "sair do desafio" on public.desafio_participantes for delete to authenticated
  using (usuario_id = auth.uid());

-- entrar com o código de convite (amigos de fora do clube)
create or replace function public.entrar_no_desafio(p_codigo text) returns uuid
  language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  select id into v from desafios where codigo = upper(btrim(p_codigo)) and fim >= current_date;
  if v is null then return null; end if;
  insert into desafio_participantes (desafio_id, usuario_id) values (v, auth.uid())
    on conflict do nothing;
  return v;
end $$;
grant execute on function public.entrar_no_desafio(text) to authenticated;

-- foto (avatar) do clube, além da capa
alter table public.clubes add column if not exists foto text;

-- ───────── ler junto (leitura conjunta com amigos, sem clube) ─────────
create table if not exists public.leituras_juntas (
  id uuid primary key default gen_random_uuid(),
  livro jsonb not null,
  prazo date,
  codigo text unique,
  criado_por uuid not null references auth.users (id) on delete cascade default auth.uid(),
  criado_em timestamptz not null default now()
);
create table if not exists public.leitura_junta_pessoas (
  leitura_id uuid not null references public.leituras_juntas (id) on delete cascade,
  usuario_id uuid not null references auth.users (id) on delete cascade,
  pagina int not null default 0,
  terminou boolean not null default false,
  entrou_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (leitura_id, usuario_id)
);
create table if not exists public.leitura_junta_recados (
  id uuid primary key default gen_random_uuid(),
  leitura_id uuid not null references public.leituras_juntas (id) on delete cascade,
  autor uuid not null references auth.users (id) on delete cascade default auth.uid(),
  texto text not null check (char_length(texto) between 1 and 1000),
  -- até que página o recado fala (quem está antes vê como spoiler escondido)
  pagina int,
  criado_em timestamptz not null default now()
);

create or replace function public.le_junto(l uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from leitura_junta_pessoas where leitura_id = l and usuario_id = auth.uid())
      or exists (select 1 from leituras_juntas where id = l and criado_por = auth.uid());
$$;

alter table public.leituras_juntas enable row level security;
drop policy if exists "ver leitura junta" on public.leituras_juntas;
create policy "ver leitura junta" on public.leituras_juntas for select to authenticated using (criado_por = auth.uid() or public.le_junto(id));
drop policy if exists "criar leitura junta" on public.leituras_juntas;
create policy "criar leitura junta" on public.leituras_juntas for insert to authenticated with check (criado_por = auth.uid());
drop policy if exists "apagar leitura junta" on public.leituras_juntas;
create policy "apagar leitura junta" on public.leituras_juntas for delete to authenticated using (criado_por = auth.uid());
drop policy if exists "editar leitura junta" on public.leituras_juntas;
create policy "editar leitura junta" on public.leituras_juntas for update to authenticated
  using (criado_por = auth.uid()) with check (criado_por = auth.uid());

alter table public.leitura_junta_pessoas enable row level security;
drop policy if exists "ver quem le junto" on public.leitura_junta_pessoas;
create policy "ver quem le junto" on public.leitura_junta_pessoas for select to authenticated using (public.le_junto(leitura_id));
-- entra você mesma; ou quem criou chama alguém que ela segue
drop policy if exists "entrar na leitura junta" on public.leitura_junta_pessoas;
create policy "entrar na leitura junta" on public.leitura_junta_pessoas for insert to authenticated
  with check (
    (usuario_id = auth.uid() and exists (select 1 from leituras_juntas where id = leitura_id and criado_por = auth.uid()))
    or exists (select 1 from leituras_juntas l join seguidores s on s.seguidor = auth.uid() and s.seguido = usuario_id
               where l.id = leitura_id and l.criado_por = auth.uid())
  );
drop policy if exists "meu progresso na leitura junta" on public.leitura_junta_pessoas;
create policy "meu progresso na leitura junta" on public.leitura_junta_pessoas for update to authenticated
  using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());
drop policy if exists "sair da leitura junta" on public.leitura_junta_pessoas;
create policy "sair da leitura junta" on public.leitura_junta_pessoas for delete to authenticated
  using (usuario_id = auth.uid());

alter table public.leitura_junta_recados enable row level security;
drop policy if exists "ver recados" on public.leitura_junta_recados;
create policy "ver recados" on public.leitura_junta_recados for select to authenticated using (public.le_junto(leitura_id));
drop policy if exists "mandar recado" on public.leitura_junta_recados;
create policy "mandar recado" on public.leitura_junta_recados for insert to authenticated
  with check (autor = auth.uid() and public.le_junto(leitura_id));
drop policy if exists "apagar meu recado" on public.leitura_junta_recados;
create policy "apagar meu recado" on public.leitura_junta_recados for delete to authenticated using (autor = auth.uid());

create or replace function public.entrar_na_leitura_junta(p_codigo text) returns uuid
  language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  select id into v from leituras_juntas where codigo = upper(btrim(p_codigo));
  if v is null then return null; end if;
  insert into leitura_junta_pessoas (leitura_id, usuario_id) values (v, auth.uid()) on conflict do nothing;
  return v;
end $$;
grant execute on function public.entrar_na_leitura_junta(text) to authenticated;

-- ───────── co-read (o antigo "ler junto"): convites, conversa sem spoiler no banco, reações ─────────

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

-- ───────── club studio: identidade visual dos clubes ─────────
-- Não muda nenhum clube: quem não abrir o club studio continua com o tema de antes.

-- a identidade fica num jsonb só com o tema base e o que o clube mudou.
-- quem pode editar o clube (a política de update que já existe) é quem pode salvar.
alter table public.clubes add column if not exists identidade jsonb;
alter table public.clubes drop constraint if exists clubes_identidade_valida;
alter table public.clubes add constraint clubes_identidade_valida check (
  identidade is null
  or (jsonb_typeof(identidade) = 'object'
      and pg_column_size(identidade) < 8000
      and identidade ->> 'tema' in ('botanical', 'dark-academia', 'cherry-club', 'paperback', 'after-hours', 'the-editor'))
);

-- meta anual de livros do clube ({"2026": 12}); quem pode editar o clube pode definir
alter table public.clubes add column if not exists metas jsonb;
