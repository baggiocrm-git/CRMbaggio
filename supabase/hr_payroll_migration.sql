create extension if not exists pgcrypto;

alter table public.equipe
  add column if not exists indice_contabil text,
  add column if not exists local_trabalho text,
  add column if not exists banco text,
  add column if not exists agencia text,
  add column if not exists operacao_conta text,
  add column if not exists chave_pix text,
  add column if not exists tipo_chave_pix text,
  add column if not exists experiencia_ativa boolean not null default false,
  add column if not exists dias_experiencia integer,
  add column if not exists data_fim_experiencia date,
  add column if not exists em_ferias boolean not null default false,
  add column if not exists data_inicio_ferias date,
  add column if not exists data_fim_ferias date,
  add column if not exists observacoes_rh text;

create table if not exists public.equipe_movimentos_mensais (
  id uuid primary key default gen_random_uuid(),
  funcionario_id uuid not null references public.equipe(id) on delete cascade,
  funcionario_nome_snapshot text not null,
  competencia text not null,
  indice_contabil text,
  data_admissao date,
  funcao text,
  local_trabalho text,
  adiantamento_valor numeric(12,2),
  falta_descricao text,
  atestado_descricao text,
  horas_trabalhadas text,
  horas_extras_50 text,
  horas_extras_100 text,
  adicional_noturno text,
  vale_transporte text,
  vale_cafe numeric(12,2),
  vale_mercado numeric(12,2),
  total_vales numeric(12,2),
  gratificacao numeric(12,2),
  observacoes text,
  financeiro_lancado_por text,
  financeiro_lancado_em timestamptz,
  experiencia_ativa boolean not null default false,
  dias_experiencia integer,
  em_ferias boolean not null default false,
  data_inicio_ferias date,
  data_fim_ferias date,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint equipe_movimentos_mensais_unq unique (funcionario_id, competencia)
);

alter table public.equipe_movimentos_mensais
  add column if not exists financeiro_lancado_por text,
  add column if not exists financeiro_lancado_em timestamptz;

create index if not exists equipe_movimentos_mensais_competencia_idx
  on public.equipe_movimentos_mensais (competencia desc);

create index if not exists equipe_movimentos_mensais_funcionario_idx
  on public.equipe_movimentos_mensais (funcionario_id);

create table if not exists public.equipe_pagamentos (
  id uuid primary key default gen_random_uuid(),
  funcionario_id uuid not null references public.equipe(id) on delete cascade,
  funcionario_nome_snapshot text not null,
  competencia text not null,
  tipo text not null check (tipo in ('adiantamento', 'pagamento')),
  banco text,
  agencia text,
  conta text,
  operacao text,
  chave_pix text,
  valor numeric(12,2),
  referencia text,
  registrado_por text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint equipe_pagamentos_unq unique (funcionario_id, competencia, tipo)
);

alter table public.equipe_pagamentos
  add column if not exists registrado_por text;

create index if not exists equipe_pagamentos_competencia_idx
  on public.equipe_pagamentos (competencia desc);

create index if not exists equipe_pagamentos_funcionario_idx
  on public.equipe_pagamentos (funcionario_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists trg_equipe_movimentos_mensais_touch on public.equipe_movimentos_mensais;
create trigger trg_equipe_movimentos_mensais_touch
before update on public.equipe_movimentos_mensais
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_equipe_pagamentos_touch on public.equipe_pagamentos;
create trigger trg_equipe_pagamentos_touch
before update on public.equipe_pagamentos
for each row
execute function public.touch_updated_at();

alter table public.equipe_movimentos_mensais enable row level security;
alter table public.equipe_pagamentos enable row level security;

drop policy if exists "equipe_movimentos_authenticated_select" on public.equipe_movimentos_mensais;
create policy "equipe_movimentos_authenticated_select"
on public.equipe_movimentos_mensais
for select
to authenticated
using (true);

drop policy if exists "equipe_movimentos_authenticated_insert" on public.equipe_movimentos_mensais;
create policy "equipe_movimentos_authenticated_insert"
on public.equipe_movimentos_mensais
for insert
to authenticated
with check (true);

drop policy if exists "equipe_movimentos_authenticated_update" on public.equipe_movimentos_mensais;
create policy "equipe_movimentos_authenticated_update"
on public.equipe_movimentos_mensais
for update
to authenticated
using (true)
with check (true);

drop policy if exists "equipe_movimentos_authenticated_delete" on public.equipe_movimentos_mensais;
create policy "equipe_movimentos_authenticated_delete"
on public.equipe_movimentos_mensais
for delete
to authenticated
using (true);

drop policy if exists "equipe_pagamentos_authenticated_select" on public.equipe_pagamentos;
create policy "equipe_pagamentos_authenticated_select"
on public.equipe_pagamentos
for select
to authenticated
using (true);

drop policy if exists "equipe_pagamentos_authenticated_insert" on public.equipe_pagamentos;
create policy "equipe_pagamentos_authenticated_insert"
on public.equipe_pagamentos
for insert
to authenticated
with check (true);

drop policy if exists "equipe_pagamentos_authenticated_update" on public.equipe_pagamentos;
create policy "equipe_pagamentos_authenticated_update"
on public.equipe_pagamentos
for update
to authenticated
using (true)
with check (true);

drop policy if exists "equipe_pagamentos_authenticated_delete" on public.equipe_pagamentos;
create policy "equipe_pagamentos_authenticated_delete"
on public.equipe_pagamentos
for delete
to authenticated
using (true);
