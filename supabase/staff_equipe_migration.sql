-- Migração da tabela public.equipe para o modal Novo Membro
-- Pode ser executada no Supabase SQL Editor com segurança.

create extension if not exists pgcrypto;

create table if not exists public.equipe_departamentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

insert into public.equipe_departamentos (nome)
values ('Administrativo'), ('Externo')
on conflict (nome) do nothing;

-- Solta uma foreign key antiga no campo id, caso exista.
alter table public.equipe
  drop constraint if exists equipe_id_fkey;

alter table public.equipe
  alter column id set default gen_random_uuid();

alter table public.equipe
  add column if not exists cursos jsonb not null default '[]'::jsonb,
  add column if not exists documentos_anexos jsonb not null default '[]'::jsonb,
  add column if not exists funcao text,
  add column if not exists unidade_obra text,
  add column if not exists data_admissao date,
  add column if not exists data_demissao date,
  add column if not exists tipo_contrato text,
  add column if not exists regime_trabalho text,
  add column if not exists ctps text,
  add column if not exists pis text,
  add column if not exists cbo text,
  add column if not exists cpf text,
  add column if not exists rg text,
  add column if not exists data_nascimento date,
  add column if not exists estado_civil text,
  add column if not exists endereco text,
  add column if not exists contato text,
  add column if not exists salario_base text,
  add column if not exists adicional_insalubridade text,
  add column if not exists adicional_periculosidade text,
  add column if not exists conta_bancaria text,
  add column if not exists motivo_demissao text,
  add column if not exists tipo_desligamento text;

-- Remove checks antigas de status que não contemplem "Afastado".
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
      and t.relname = 'equipe'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%'
  loop
    execute format('alter table public.equipe drop constraint if exists %I', constraint_name);
  end loop;
end $$;

alter table public.equipe
  drop constraint if exists equipe_status_check;

alter table public.equipe
  add constraint equipe_status_check
  check (status in ('Ativo', 'Inativo', 'Afastado', 'Em Licença'));

-- Gera ID de funcionário automaticamente quando vier vazio no insert/update.
create or replace function public.set_equipe_id_funcionario()
returns trigger
language plpgsql
as $$
declare
  next_code text;
begin
  if new.id_funcionario is null or btrim(new.id_funcionario) = '' then
    loop
      next_code := 'F' || lpad(nextval('public.equipe_id_funcionario_seq')::text, 4, '0');

      exit when not exists (
        select 1
        from public.equipe
        where id_funcionario = next_code
          and (tg_op = 'INSERT' or id <> new.id)
      );
    end loop;

    new.id_funcionario := next_code;
  end if;

  return new;
end;
$$;

create sequence if not exists public.equipe_id_funcionario_seq;

do $$
declare
  max_numeric_id integer;
begin
  select max(nullif(regexp_replace(id_funcionario, '\D', '', 'g'), '')::integer)
  into max_numeric_id
  from public.equipe;

  if max_numeric_id is not null then
    perform setval('public.equipe_id_funcionario_seq', greatest(max_numeric_id, 1), true);
  end if;
end $$;

drop trigger if exists trg_set_equipe_id_funcionario on public.equipe;

create trigger trg_set_equipe_id_funcionario
before insert or update on public.equipe
for each row
execute function public.set_equipe_id_funcionario();
