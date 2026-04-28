create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  parceiro text not null,
  connection_type text not null check (connection_type in ('open_finance', 'pix', 'boleto', 'cnab')),
  status text not null default 'ativa' check (status in ('ativa', 'expirada', 'revogada', 'erro')),
  external_connection_id text,
  consent_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  bank_connection_id uuid not null references public.bank_connections(id) on delete cascade,
  banco_codigo text,
  banco_nome text,
  agencia text,
  conta_mascarada text,
  account_type text not null default 'corrente' check (account_type in ('corrente', 'poupanca', 'pagamento', 'outro')),
  holder_name text,
  holder_document text,
  is_active boolean not null default true,
  external_account_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  conta_pagar_id text not null references public.contas_pagar(id) on delete cascade,
  bank_account_id uuid references public.bank_accounts(id) on delete set null,
  request_type text not null check (request_type in ('pix', 'ted', 'boleto', 'manual')),
  status text not null default 'rascunho' check (status in ('rascunho', 'pendente_aprovacao', 'aprovado', 'rejeitado', 'enviado', 'processando', 'pago', 'falhou', 'cancelado')),
  favorecido_nome text not null,
  favorecido_documento text,
  favorecido_banco text,
  favorecido_agencia text,
  favorecido_conta text,
  favorecido_chave_pix text,
  valor numeric(14,2) not null,
  scheduled_for date,
  requested_by uuid,
  approved_at timestamptz,
  executed_at timestamptz,
  external_payment_id text,
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_approvals (
  id uuid primary key default gen_random_uuid(),
  payment_request_id uuid not null references public.payment_requests(id) on delete cascade,
  approver_user_id uuid not null,
  decision text not null check (decision in ('aprovado', 'rejeitado')),
  comment text,
  decided_at timestamptz not null default now()
);

create table if not exists public.payment_executions (
  id uuid primary key default gen_random_uuid(),
  payment_request_id uuid not null references public.payment_requests(id) on delete cascade,
  provider text not null,
  provider_status text not null,
  provider_reference text,
  amount numeric(14,2) not null,
  executed_at timestamptz,
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_request_id uuid not null references public.payment_requests(id) on delete cascade,
  event_type text not null,
  event_source text not null check (event_source in ('system', 'user', 'provider', 'webhook')),
  event_payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.collection_charges (
  id uuid primary key default gen_random_uuid(),
  conta_receber_id text not null references public.contas_receber(id) on delete cascade,
  bank_account_id uuid references public.bank_accounts(id) on delete set null,
  charge_type text not null check (charge_type in ('pix', 'boleto', 'link_pagamento', 'manual')),
  status text not null default 'rascunho' check (status in ('rascunho', 'gerada', 'aguardando_pagamento', 'recebido_parcial', 'recebido_total', 'expirada', 'cancelada', 'falhou')),
  valor numeric(14,2) not null,
  valor_recebido numeric(14,2) not null default 0,
  due_date date,
  payer_name text,
  payer_document text,
  pix_copy_paste text,
  boleto_url text,
  qr_code_url text,
  external_charge_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reconciliation_matches (
  id uuid primary key default gen_random_uuid(),
  match_type text not null check (match_type in ('pagamento', 'recebimento')),
  conta_pagar_id text references public.contas_pagar(id) on delete set null,
  conta_receber_id text references public.contas_receber(id) on delete set null,
  provider_reference text,
  amount numeric(14,2) not null,
  matched_by text not null check (matched_by in ('automatico', 'manual')),
  matched_user_id uuid,
  confidence numeric(5,2),
  notes text,
  created_at timestamptz not null default now(),
  constraint reconciliation_target_check check (
    (conta_pagar_id is not null and conta_receber_id is null)
    or (conta_pagar_id is null and conta_receber_id is not null)
  )
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  actor_user_id uuid,
  actor_name text,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'contas_pagar') then
    alter table public.contas_pagar
      add column if not exists created_by uuid,
      add column if not exists updated_by uuid,
      add column if not exists approval_status text not null default 'nao_enviado',
      add column if not exists payment_request_id uuid,
      add column if not exists bank_account_id uuid,
      add column if not exists partner_payment_status text,
      add column if not exists paid_at timestamptz,
      add column if not exists last_event_at timestamptz;
  end if;

  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'contas_receber') then
    alter table public.contas_receber
      add column if not exists created_by uuid,
      add column if not exists updated_by uuid,
      add column if not exists collection_status text not null default 'nao_cobrado',
      add column if not exists collection_charge_id uuid,
      add column if not exists bank_account_id uuid,
      add column if not exists partner_collection_status text,
      add column if not exists received_at timestamptz,
      add column if not exists last_event_at timestamptz;
  end if;
end
$$;

create index if not exists idx_bank_accounts_connection_id on public.bank_accounts(bank_connection_id);
create index if not exists idx_payment_requests_conta_pagar_id on public.payment_requests(conta_pagar_id);
create unique index if not exists idx_payment_requests_idempotency_key on public.payment_requests(idempotency_key) where idempotency_key is not null;
create index if not exists idx_payment_requests_status on public.payment_requests(status);
create index if not exists idx_payment_approvals_request_id on public.payment_approvals(payment_request_id);
create index if not exists idx_payment_executions_request_id on public.payment_executions(payment_request_id);
create index if not exists idx_payment_events_request_id on public.payment_events(payment_request_id);
create index if not exists idx_collection_charges_conta_receber_id on public.collection_charges(conta_receber_id);
create index if not exists idx_collection_charges_status on public.collection_charges(status);
create index if not exists idx_reconciliation_matches_conta_pagar_id on public.reconciliation_matches(conta_pagar_id);
create index if not exists idx_reconciliation_matches_conta_receber_id on public.reconciliation_matches(conta_receber_id);
create index if not exists idx_audit_logs_entity on public.audit_logs(entity_type, entity_id, created_at desc);

drop trigger if exists trg_bank_connections_updated_at on public.bank_connections;
create trigger trg_bank_connections_updated_at
before update on public.bank_connections
for each row execute function public.set_updated_at();

drop trigger if exists trg_bank_accounts_updated_at on public.bank_accounts;
create trigger trg_bank_accounts_updated_at
before update on public.bank_accounts
for each row execute function public.set_updated_at();

drop trigger if exists trg_payment_requests_updated_at on public.payment_requests;
create trigger trg_payment_requests_updated_at
before update on public.payment_requests
for each row execute function public.set_updated_at();

drop trigger if exists trg_collection_charges_updated_at on public.collection_charges;
create trigger trg_collection_charges_updated_at
before update on public.collection_charges
for each row execute function public.set_updated_at();

alter table public.bank_connections enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.payment_requests enable row level security;
alter table public.payment_approvals enable row level security;
alter table public.payment_executions enable row level security;
alter table public.payment_events enable row level security;
alter table public.collection_charges enable row level security;
alter table public.reconciliation_matches enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists bank_connections_internal_select on public.bank_connections;
create policy bank_connections_internal_select
  on public.bank_connections for select to authenticated
  using (public.is_internal_user());

drop policy if exists bank_connections_internal_insert on public.bank_connections;
create policy bank_connections_internal_insert
  on public.bank_connections for insert to authenticated
  with check (public.is_internal_user());

drop policy if exists bank_connections_internal_update on public.bank_connections;
create policy bank_connections_internal_update
  on public.bank_connections for update to authenticated
  using (public.is_internal_user())
  with check (public.is_internal_user());

drop policy if exists bank_accounts_internal_select on public.bank_accounts;
create policy bank_accounts_internal_select
  on public.bank_accounts for select to authenticated
  using (public.is_internal_user());

drop policy if exists bank_accounts_internal_insert on public.bank_accounts;
create policy bank_accounts_internal_insert
  on public.bank_accounts for insert to authenticated
  with check (public.is_internal_user());

drop policy if exists bank_accounts_internal_update on public.bank_accounts;
create policy bank_accounts_internal_update
  on public.bank_accounts for update to authenticated
  using (public.is_internal_user())
  with check (public.is_internal_user());

drop policy if exists payment_requests_internal_select on public.payment_requests;
create policy payment_requests_internal_select
  on public.payment_requests for select to authenticated
  using (public.is_internal_user());

drop policy if exists payment_requests_internal_insert on public.payment_requests;
create policy payment_requests_internal_insert
  on public.payment_requests for insert to authenticated
  with check (public.is_internal_user());

drop policy if exists payment_requests_internal_update on public.payment_requests;
create policy payment_requests_internal_update
  on public.payment_requests for update to authenticated
  using (public.is_internal_user())
  with check (public.is_internal_user());

drop policy if exists payment_approvals_internal_select on public.payment_approvals;
create policy payment_approvals_internal_select
  on public.payment_approvals for select to authenticated
  using (public.is_internal_user());

drop policy if exists payment_approvals_internal_insert on public.payment_approvals;
create policy payment_approvals_internal_insert
  on public.payment_approvals for insert to authenticated
  with check (public.is_internal_user());

drop policy if exists payment_approvals_internal_update on public.payment_approvals;
create policy payment_approvals_internal_update
  on public.payment_approvals for update to authenticated
  using (public.is_internal_user())
  with check (public.is_internal_user());

drop policy if exists payment_executions_internal_select on public.payment_executions;
create policy payment_executions_internal_select
  on public.payment_executions for select to authenticated
  using (public.is_internal_user());

drop policy if exists payment_executions_internal_insert on public.payment_executions;
create policy payment_executions_internal_insert
  on public.payment_executions for insert to authenticated
  with check (public.is_internal_user());

drop policy if exists payment_executions_internal_update on public.payment_executions;
create policy payment_executions_internal_update
  on public.payment_executions for update to authenticated
  using (public.is_internal_user())
  with check (public.is_internal_user());

drop policy if exists payment_events_internal_select on public.payment_events;
create policy payment_events_internal_select
  on public.payment_events for select to authenticated
  using (public.is_internal_user());

drop policy if exists payment_events_internal_insert on public.payment_events;
create policy payment_events_internal_insert
  on public.payment_events for insert to authenticated
  with check (public.is_internal_user());

drop policy if exists collection_charges_internal_select on public.collection_charges;
create policy collection_charges_internal_select
  on public.collection_charges for select to authenticated
  using (public.is_internal_user());

drop policy if exists collection_charges_internal_insert on public.collection_charges;
create policy collection_charges_internal_insert
  on public.collection_charges for insert to authenticated
  with check (public.is_internal_user());

drop policy if exists collection_charges_internal_update on public.collection_charges;
create policy collection_charges_internal_update
  on public.collection_charges for update to authenticated
  using (public.is_internal_user())
  with check (public.is_internal_user());

drop policy if exists reconciliation_matches_internal_select on public.reconciliation_matches;
create policy reconciliation_matches_internal_select
  on public.reconciliation_matches for select to authenticated
  using (public.is_internal_user());

drop policy if exists reconciliation_matches_internal_insert on public.reconciliation_matches;
create policy reconciliation_matches_internal_insert
  on public.reconciliation_matches for insert to authenticated
  with check (public.is_internal_user());

drop policy if exists reconciliation_matches_internal_update on public.reconciliation_matches;
create policy reconciliation_matches_internal_update
  on public.reconciliation_matches for update to authenticated
  using (public.is_internal_user())
  with check (public.is_internal_user());

drop policy if exists audit_logs_internal_select on public.audit_logs;
create policy audit_logs_internal_select
  on public.audit_logs for select to authenticated
  using (public.is_internal_user());

drop policy if exists audit_logs_internal_insert on public.audit_logs;
create policy audit_logs_internal_insert
  on public.audit_logs for insert to authenticated
  with check (public.is_internal_user());
