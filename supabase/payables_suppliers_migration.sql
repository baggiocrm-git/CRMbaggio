create extension if not exists pgcrypto;

create table if not exists public.contas_pagar_fornecedores (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create or replace function public.normalize_contas_pagar_fornecedor_nome()
returns trigger
language plpgsql
as $$
begin
  new.nome := regexp_replace(trim(new.nome), '\s+', ' ', 'g');
  return new;
end;
$$;

drop trigger if exists trg_normalize_contas_pagar_fornecedor_nome on public.contas_pagar_fornecedores;

create trigger trg_normalize_contas_pagar_fornecedor_nome
before insert or update on public.contas_pagar_fornecedores
for each row
execute function public.normalize_contas_pagar_fornecedor_nome();

insert into public.contas_pagar_fornecedores (nome)
select distinct regexp_replace(trim(fornecedor), '\s+', ' ', 'g')
from public.contas_pagar
where fornecedor is not null
  and trim(fornecedor) <> ''
on conflict (nome) do nothing;

alter table public.contas_pagar_fornecedores enable row level security;

drop policy if exists "contas_pagar_fornecedores_select_authenticated" on public.contas_pagar_fornecedores;
create policy "contas_pagar_fornecedores_select_authenticated"
  on public.contas_pagar_fornecedores
  for select
  to authenticated
  using (true);

drop policy if exists "contas_pagar_fornecedores_insert_authenticated" on public.contas_pagar_fornecedores;
create policy "contas_pagar_fornecedores_insert_authenticated"
  on public.contas_pagar_fornecedores
  for insert
  to authenticated
  with check (true);

drop policy if exists "contas_pagar_fornecedores_update_authenticated" on public.contas_pagar_fornecedores;
create policy "contas_pagar_fornecedores_update_authenticated"
  on public.contas_pagar_fornecedores
  for update
  to authenticated
  using (true)
  with check (true);
