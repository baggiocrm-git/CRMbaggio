create extension if not exists pgcrypto;

create table if not exists public.contas_receber_pagadores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create or replace function public.normalize_contas_receber_pagador_nome()
returns trigger
language plpgsql
as $$
begin
  new.nome := regexp_replace(trim(new.nome), '\s+', ' ', 'g');
  return new;
end;
$$;

drop trigger if exists trg_normalize_contas_receber_pagador_nome on public.contas_receber_pagadores;

create trigger trg_normalize_contas_receber_pagador_nome
before insert or update on public.contas_receber_pagadores
for each row
execute function public.normalize_contas_receber_pagador_nome();

insert into public.contas_receber_pagadores (nome)
select distinct regexp_replace(trim(cliente), '\s+', ' ', 'g')
from public.contas_receber
where cliente is not null
  and trim(cliente) <> ''
on conflict (nome) do nothing;

update public.contas_receber
set situacao = 'Aberto'
where situacao = 'Em andamento';

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'contas_receber'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%situacao%'
  loop
    execute format('alter table public.contas_receber drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table public.contas_receber
  add constraint contas_receber_situacao_check
  check (situacao in ('Aberto', 'Recebido', 'REC. PARCIAL'));

alter table public.contas_receber_pagadores enable row level security;

drop policy if exists "contas_receber_pagadores_select_authenticated" on public.contas_receber_pagadores;
create policy "contas_receber_pagadores_select_authenticated"
  on public.contas_receber_pagadores
  for select
  to authenticated
  using (true);

drop policy if exists "contas_receber_pagadores_insert_authenticated" on public.contas_receber_pagadores;
create policy "contas_receber_pagadores_insert_authenticated"
  on public.contas_receber_pagadores
  for insert
  to authenticated
  with check (true);

drop policy if exists "contas_receber_pagadores_update_authenticated" on public.contas_receber_pagadores;
create policy "contas_receber_pagadores_update_authenticated"
  on public.contas_receber_pagadores
  for update
  to authenticated
  using (true)
  with check (true);
