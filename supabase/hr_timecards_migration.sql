create extension if not exists pgcrypto;

create table if not exists public.equipe_cartoes_ponto (
  id uuid primary key default gen_random_uuid(),
  funcionario_id uuid not null references public.equipe(id) on delete cascade,
  competencia text not null,
  data_referencia date not null,
  origem text not null default 'manual' check (origem in ('manual', 'digital')),
  entrada_1 text,
  saida_1 text,
  entrada_2 text,
  saida_2 text,
  entrada_3 text,
  saida_3 text,
  horas_trabalhadas numeric(8,2) not null default 0,
  horas_extras_50 numeric(8,2) not null default 0,
  horas_extras_100 numeric(8,2) not null default 0,
  adicional_noturno numeric(8,2) not null default 0,
  falta_descricao text,
  atestado_descricao text,
  observacoes text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint equipe_cartoes_ponto_unq unique (funcionario_id, data_referencia)
);

alter table public.equipe_cartoes_ponto
  add column if not exists falta_descricao text,
  add column if not exists atestado_descricao text;

create index if not exists equipe_cartoes_ponto_competencia_idx
  on public.equipe_cartoes_ponto (competencia desc);

create index if not exists equipe_cartoes_ponto_funcionario_idx
  on public.equipe_cartoes_ponto (funcionario_id, data_referencia desc);

drop trigger if exists trg_equipe_cartoes_ponto_touch on public.equipe_cartoes_ponto;
create trigger trg_equipe_cartoes_ponto_touch
before update on public.equipe_cartoes_ponto
for each row
execute function public.touch_updated_at();

alter table public.equipe_cartoes_ponto enable row level security;

drop policy if exists "equipe_cartoes_ponto_authenticated_select" on public.equipe_cartoes_ponto;
create policy "equipe_cartoes_ponto_authenticated_select"
on public.equipe_cartoes_ponto
for select
to authenticated
using (true);

drop policy if exists "equipe_cartoes_ponto_authenticated_insert" on public.equipe_cartoes_ponto;
create policy "equipe_cartoes_ponto_authenticated_insert"
on public.equipe_cartoes_ponto
for insert
to authenticated
with check (true);

drop policy if exists "equipe_cartoes_ponto_authenticated_update" on public.equipe_cartoes_ponto;
create policy "equipe_cartoes_ponto_authenticated_update"
on public.equipe_cartoes_ponto
for update
to authenticated
using (true)
with check (true);

drop policy if exists "equipe_cartoes_ponto_authenticated_delete" on public.equipe_cartoes_ponto;
create policy "equipe_cartoes_ponto_authenticated_delete"
on public.equipe_cartoes_ponto
for delete
to authenticated
using (true);
