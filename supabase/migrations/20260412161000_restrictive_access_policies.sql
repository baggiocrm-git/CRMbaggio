create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '');
$$;

create or replace function public.current_user_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select auth.uid() is not null
    and (
      public.current_user_email() = 'lucabaggio28@gmail.com'
      or public.current_user_role() = 'Administrador'
    );
$$;

create or replace function public.is_internal_user()
returns boolean
language sql
stable
as $$
  select auth.uid() is not null
    and public.current_user_role() <> 'Cliente';
$$;

do $$
declare
  policy_row record;
begin
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'documentos') then
    execute 'alter table public.documentos enable row level security';
    for policy_row in
      select policyname from pg_policies where schemaname = 'public' and tablename = 'documentos'
    loop
      execute format('drop policy if exists %I on public.documentos', policy_row.policyname);
    end loop;

    execute 'create policy documentos_internal_select on public.documentos for select to authenticated using (public.is_internal_user())';
    execute 'create policy documentos_internal_insert on public.documentos for insert to authenticated with check (public.is_internal_user())';
    execute 'create policy documentos_internal_update on public.documentos for update to authenticated using (public.is_internal_user()) with check (public.is_internal_user())';
    execute 'create policy documentos_internal_delete on public.documentos for delete to authenticated using (public.is_internal_user())';
  end if;

  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'pastas') then
    execute 'alter table public.pastas enable row level security';
    for policy_row in
      select policyname from pg_policies where schemaname = 'public' and tablename = 'pastas'
    loop
      execute format('drop policy if exists %I on public.pastas', policy_row.policyname);
    end loop;

    execute 'create policy pastas_internal_select on public.pastas for select to authenticated using (public.is_internal_user())';
    execute 'create policy pastas_internal_insert on public.pastas for insert to authenticated with check (public.is_internal_user())';
    execute 'create policy pastas_internal_update on public.pastas for update to authenticated using (public.is_internal_user()) with check (public.is_internal_user())';
    execute 'create policy pastas_internal_delete on public.pastas for delete to authenticated using (public.is_internal_user())';
  end if;

  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'google_tokens') then
    execute 'alter table public.google_tokens enable row level security';
    for policy_row in
      select policyname from pg_policies where schemaname = 'public' and tablename = 'google_tokens'
    loop
      execute format('drop policy if exists %I on public.google_tokens', policy_row.policyname);
    end loop;

    execute 'create policy google_tokens_admin_select on public.google_tokens for select to authenticated using (public.is_admin_user())';
    execute 'create policy google_tokens_admin_insert on public.google_tokens for insert to authenticated with check (public.is_admin_user())';
    execute 'create policy google_tokens_admin_update on public.google_tokens for update to authenticated using (public.is_admin_user()) with check (public.is_admin_user())';
    execute 'create policy google_tokens_admin_delete on public.google_tokens for delete to authenticated using (public.is_admin_user())';
  end if;

  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'contas_receber_pagadores') then
    for policy_row in
      select policyname from pg_policies where schemaname = 'public' and tablename = 'contas_receber_pagadores'
    loop
      execute format('drop policy if exists %I on public.contas_receber_pagadores', policy_row.policyname);
    end loop;

    execute 'create policy contas_receber_pagadores_internal_select on public.contas_receber_pagadores for select to authenticated using (public.is_internal_user())';
    execute 'create policy contas_receber_pagadores_internal_insert on public.contas_receber_pagadores for insert to authenticated with check (public.is_internal_user())';
    execute 'create policy contas_receber_pagadores_internal_update on public.contas_receber_pagadores for update to authenticated using (public.is_internal_user()) with check (public.is_internal_user())';
  end if;

  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'contas_pagar_fornecedores') then
    for policy_row in
      select policyname from pg_policies where schemaname = 'public' and tablename = 'contas_pagar_fornecedores'
    loop
      execute format('drop policy if exists %I on public.contas_pagar_fornecedores', policy_row.policyname);
    end loop;

    execute 'create policy contas_pagar_fornecedores_internal_select on public.contas_pagar_fornecedores for select to authenticated using (public.is_internal_user())';
    execute 'create policy contas_pagar_fornecedores_internal_insert on public.contas_pagar_fornecedores for insert to authenticated with check (public.is_internal_user())';
    execute 'create policy contas_pagar_fornecedores_internal_update on public.contas_pagar_fornecedores for update to authenticated using (public.is_internal_user()) with check (public.is_internal_user())';
  end if;

  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'equipe_movimentos_mensais') then
    for policy_row in
      select policyname from pg_policies where schemaname = 'public' and tablename = 'equipe_movimentos_mensais'
    loop
      execute format('drop policy if exists %I on public.equipe_movimentos_mensais', policy_row.policyname);
    end loop;

    execute 'create policy equipe_movimentos_internal_select on public.equipe_movimentos_mensais for select to authenticated using (public.is_internal_user())';
    execute 'create policy equipe_movimentos_internal_insert on public.equipe_movimentos_mensais for insert to authenticated with check (public.is_internal_user())';
    execute 'create policy equipe_movimentos_internal_update on public.equipe_movimentos_mensais for update to authenticated using (public.is_internal_user()) with check (public.is_internal_user())';
    execute 'create policy equipe_movimentos_internal_delete on public.equipe_movimentos_mensais for delete to authenticated using (public.is_internal_user())';
  end if;

  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'equipe_pagamentos') then
    for policy_row in
      select policyname from pg_policies where schemaname = 'public' and tablename = 'equipe_pagamentos'
    loop
      execute format('drop policy if exists %I on public.equipe_pagamentos', policy_row.policyname);
    end loop;

    execute 'create policy equipe_pagamentos_internal_select on public.equipe_pagamentos for select to authenticated using (public.is_internal_user())';
    execute 'create policy equipe_pagamentos_internal_insert on public.equipe_pagamentos for insert to authenticated with check (public.is_internal_user())';
    execute 'create policy equipe_pagamentos_internal_update on public.equipe_pagamentos for update to authenticated using (public.is_internal_user()) with check (public.is_internal_user())';
    execute 'create policy equipe_pagamentos_internal_delete on public.equipe_pagamentos for delete to authenticated using (public.is_internal_user())';
  end if;

  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'equipe_cartoes_ponto') then
    for policy_row in
      select policyname from pg_policies where schemaname = 'public' and tablename = 'equipe_cartoes_ponto'
    loop
      execute format('drop policy if exists %I on public.equipe_cartoes_ponto', policy_row.policyname);
    end loop;

    execute 'create policy equipe_cartoes_ponto_internal_select on public.equipe_cartoes_ponto for select to authenticated using (public.is_internal_user())';
    execute 'create policy equipe_cartoes_ponto_internal_insert on public.equipe_cartoes_ponto for insert to authenticated with check (public.is_internal_user())';
    execute 'create policy equipe_cartoes_ponto_internal_update on public.equipe_cartoes_ponto for update to authenticated using (public.is_internal_user()) with check (public.is_internal_user())';
    execute 'create policy equipe_cartoes_ponto_internal_delete on public.equipe_cartoes_ponto for delete to authenticated using (public.is_internal_user())';
  end if;

  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'internal_chat_messages') then
    for policy_row in
      select policyname from pg_policies where schemaname = 'public' and tablename = 'internal_chat_messages'
    loop
      execute format('drop policy if exists %I on public.internal_chat_messages', policy_row.policyname);
    end loop;

    execute 'create policy internal_chat_messages_internal_select on public.internal_chat_messages for select to authenticated using (public.is_internal_user() and (auth.uid() = user_id or auth.uid() = recipient_id))';
    execute 'create policy internal_chat_messages_internal_insert on public.internal_chat_messages for insert to authenticated with check (public.is_internal_user() and auth.uid() = user_id)';
    execute 'create policy internal_chat_messages_internal_update on public.internal_chat_messages for update to authenticated using (public.is_internal_user() and auth.uid() = user_id) with check (public.is_internal_user() and auth.uid() = user_id)';
    execute 'create policy internal_chat_messages_internal_delete on public.internal_chat_messages for delete to authenticated using (public.is_internal_user() and auth.uid() = user_id)';
  end if;

  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'internal_chat_user_preferences') then
    for policy_row in
      select policyname from pg_policies where schemaname = 'public' and tablename = 'internal_chat_user_preferences'
    loop
      execute format('drop policy if exists %I on public.internal_chat_user_preferences', policy_row.policyname);
    end loop;

    execute 'create policy internal_chat_preferences_internal_select on public.internal_chat_user_preferences for select to authenticated using (public.is_internal_user())';
    execute 'create policy internal_chat_preferences_internal_insert on public.internal_chat_user_preferences for insert to authenticated with check (public.is_internal_user() and auth.uid() = user_id)';
    execute 'create policy internal_chat_preferences_internal_update on public.internal_chat_user_preferences for update to authenticated using (public.is_internal_user() and auth.uid() = user_id) with check (public.is_internal_user() and auth.uid() = user_id)';
    execute 'create policy internal_chat_preferences_internal_delete on public.internal_chat_user_preferences for delete to authenticated using (public.is_internal_user() and auth.uid() = user_id)';
  end if;

  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'internal_chat_presence') then
    for policy_row in
      select policyname from pg_policies where schemaname = 'public' and tablename = 'internal_chat_presence'
    loop
      execute format('drop policy if exists %I on public.internal_chat_presence', policy_row.policyname);
    end loop;

    execute 'create policy internal_chat_presence_internal_select on public.internal_chat_presence for select to authenticated using (public.is_internal_user())';
    execute 'create policy internal_chat_presence_internal_insert on public.internal_chat_presence for insert to authenticated with check (public.is_internal_user() and auth.uid() = user_id)';
    execute 'create policy internal_chat_presence_internal_update on public.internal_chat_presence for update to authenticated using (public.is_internal_user() and auth.uid() = user_id) with check (public.is_internal_user() and auth.uid() = user_id)';
    execute 'create policy internal_chat_presence_internal_delete on public.internal_chat_presence for delete to authenticated using (public.is_internal_user() and auth.uid() = user_id)';
  end if;
end
$$;
