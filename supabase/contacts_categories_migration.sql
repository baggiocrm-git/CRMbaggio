create table if not exists public.contatos_categorias (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

alter table public.contatos
  drop constraint if exists contatos_categoria_check;

alter table public.contatos_categorias enable row level security;

drop policy if exists "contatos_categorias_select_authenticated" on public.contatos_categorias;
create policy "contatos_categorias_select_authenticated"
  on public.contatos_categorias
  for select
  to authenticated
  using (true);

drop policy if exists "contatos_categorias_insert_authenticated" on public.contatos_categorias;
create policy "contatos_categorias_insert_authenticated"
  on public.contatos_categorias
  for insert
  to authenticated
  with check (true);

insert into public.contatos_categorias (nome)
select distinct trim(categoria)
from public.contatos
where categoria is not null
  and trim(categoria) <> ''
on conflict (nome) do nothing;
