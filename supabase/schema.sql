-- Zero Grau Bebidas | Supabase (SQL Editor > Run)

create table if not exists categorias (
  id serial primary key,
  slug text unique not null,
  nome text not null,
  ordem int not null default 0
);
insert into categorias (slug, nome, ordem) values
  ('copoes-prontos', 'Copões Prontos', 1),
  ('kits-combos', 'Kits & Combos', 2)
on conflict (slug) do nothing;
-- "Promoções" (sempre a 1ª) e "Monte o seu copão" (sempre a última) são fixas no site.

create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  categoria_id int references categorias(id),
  nome text not null,
  descricao text,
  preco numeric(10,2) not null constraint produtos_preco_nao_negativo check (preco >= 0),
  preco_promocional numeric(10,2) constraint produtos_promocional_positivo check (preco_promocional is null or preco_promocional > 0),
  em_promocao boolean not null default false,
  imagem_url text,
  ativo boolean not null default true,
  criado_em timestamptz default now(),
  constraint produtos_promocao_preco_check check (not em_promocao or (preco_promocional is not null and preco_promocional < preco))
);

-- Itens do "Monte o seu copão" (grupo: base, energetico, gelo)
create table if not exists opcoes_copao (
  id uuid primary key default gen_random_uuid(),
  grupo text not null check (grupo in ('base','energetico','gelo')),
  nome text not null,
  preco_extra numeric(10,2) not null default 0 constraint opcoes_copao_preco_nao_negativo check (preco_extra >= 0),
  imagem_url text,
  ativo boolean not null default true
);

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf char(11) unique not null check (cpf ~ '^[0-9]{11}$'),
  selos int not null default 0 check (selos >= 0),
  criado_em timestamptz default now()
);

-- Só o proprietário: crie o usuário em Authentication e insira o id dele aqui
-- Constraints também são aplicadas quando o projeto já tinha as tabelas.
do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint where conrelid = 'public.produtos'::regclass and conname = 'produtos_preco_nao_negativo') then
    alter table public.produtos add constraint produtos_preco_nao_negativo check (preco >= 0);
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conrelid = 'public.produtos'::regclass and conname = 'produtos_promocional_positivo') then
    alter table public.produtos add constraint produtos_promocional_positivo check (preco_promocional is null or preco_promocional > 0);
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conrelid = 'public.produtos'::regclass and conname = 'produtos_promocao_preco_check') then
    alter table public.produtos add constraint produtos_promocao_preco_check check (not em_promocao or (preco_promocional is not null and preco_promocional < preco));
  end if;
  if not exists (select 1 from pg_catalog.pg_constraint where conrelid = 'public.opcoes_copao'::regclass and conname = 'opcoes_copao_preco_nao_negativo') then
    alter table public.opcoes_copao add constraint opcoes_copao_preco_nao_negativo check (preco_extra >= 0);
  end if;
end $$;

create table if not exists admins (user_id uuid primary key references auth.users(id));

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = '' as
$$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

alter table categorias   enable row level security;
alter table produtos     enable row level security;
alter table opcoes_copao enable row level security;
alter table clientes     enable row level security;
alter table admins       enable row level security;

-- Público: só lê o cardápio ativo
drop policy if exists "ler categorias" on categorias;
drop policy if exists "ler produtos" on produtos;
drop policy if exists "ler opcoes" on opcoes_copao;
drop policy if exists "admin categorias" on categorias;
drop policy if exists "admin produtos" on produtos;
drop policy if exists "admin opcoes" on opcoes_copao;
drop policy if exists "admin clientes" on clientes;
create policy "ler categorias" on categorias   for select using (true);
create policy "ler produtos"   on produtos     for select using (ativo or public.is_admin());
create policy "ler opcoes"     on opcoes_copao for select using (ativo or public.is_admin());

-- Proprietário: tudo
create policy "admin categorias" on categorias   for all using (public.is_admin()) with check (public.is_admin());
create policy "admin produtos"   on produtos     for all using (public.is_admin()) with check (public.is_admin());
create policy "admin opcoes"     on opcoes_copao for all using (public.is_admin()) with check (public.is_admin());
create policy "admin clientes"   on clientes     for all using (public.is_admin()) with check (public.is_admin());
-- clientes: sem política pública (ninguém lê a lista); admins: sem política (só via função)

-- Consulta pública de selos: recebe CPF, devolve apenas a quantidade
create or replace function public.consultar_selos(p_cpf text) returns int
language sql security definer set search_path = '' as
$$ select selos from public.clientes where cpf = pg_catalog.regexp_replace(p_cpf, '\D', '', 'g') $$;
revoke all on function public.consultar_selos(text) from public;
grant execute on function public.consultar_selos(text) to anon, authenticated;

-- Lançar selo (admin): soma 1; ao chegar em 10 o cliente ganha bebida grátis
create or replace function public.lancar_selo(p_cliente uuid) returns int
language plpgsql security definer set search_path = '' as $$
declare novo int;
begin
  if not public.is_admin() then raise exception 'não autorizado'; end if;
  update public.clientes set selos = selos + 1 where id = p_cliente returning selos into novo;
  if not found then raise exception 'cliente não encontrado'; end if;
  return novo;
end $$;

-- Resgatar bebida grátis (admin): exige 10 selos e desconta 10 do saldo
create or replace function public.resgatar_gratis(p_cliente uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'não autorizado'; end if;
  update public.clientes set selos = selos - 10 where id = p_cliente and selos >= 10;
  if not found then raise exception 'selos insuficientes'; end if;
end $$;

-- Bucket público para imagens (envio só pelo admin)
insert into storage.buckets (id, name, public) values ('produtos', 'produtos', true)
  on conflict do nothing;
drop policy if exists "imagens públicas" on storage.objects;
drop policy if exists "admin envia imagens" on storage.objects;
create policy "imagens públicas" on storage.objects for select using (bucket_id = 'produtos');
create policy "admin envia imagens" on storage.objects for all
  using (bucket_id = 'produtos' and public.is_admin()) with check (bucket_id = 'produtos' and public.is_admin());

-- Painel: confirma se quem entrou é o proprietário
create or replace function public.sou_admin() returns boolean
language sql security definer stable set search_path = '' as $$ select public.is_admin() $$;
revoke all on function public.sou_admin() from public;
grant execute on function public.sou_admin() to authenticated;

-- Privilégios mínimos: RLS controla linhas; GRANT limita operações permitidas.
revoke all privileges on table public.admins, public.categorias, public.clientes, public.opcoes_copao, public.produtos from anon, authenticated;
grant select on table public.categorias, public.produtos, public.opcoes_copao to anon, authenticated;
grant insert, update, delete on table public.categorias, public.produtos, public.opcoes_copao to authenticated;
grant select, insert, update, delete on table public.clientes to authenticated;
revoke all privileges on sequence public.categorias_id_seq from anon, authenticated;
grant usage, select on sequence public.categorias_id_seq to authenticated;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
revoke all on function public.consultar_selos(text) from public;
grant execute on function public.consultar_selos(text) to anon, authenticated;
revoke all on function public.lancar_selo(uuid) from public;
grant execute on function public.lancar_selo(uuid) to authenticated;
revoke all on function public.resgatar_gratis(uuid) from public;
grant execute on function public.resgatar_gratis(uuid) to authenticated;
revoke all on function public.sou_admin() from public;
grant execute on function public.sou_admin() to authenticated;

-- Sincronização: o cardápio recebe mudanças do painel em tempo real
do $$
begin
  if exists (select 1 from pg_catalog.pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_catalog.pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'produtos') then
      execute 'alter publication supabase_realtime add table public.produtos';
    end if;
    if not exists (select 1 from pg_catalog.pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'categorias') then
      execute 'alter publication supabase_realtime add table public.categorias';
    end if;
    if not exists (select 1 from pg_catalog.pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'opcoes_copao') then
      execute 'alter publication supabase_realtime add table public.opcoes_copao';
    end if;
  end if;
end $$;
