create table if not exists public.internal_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_name text not null,
  user_email text not null,
  recipient_id uuid null,
  content text null,
  message_type text not null default 'text' check (message_type in ('text', 'image', 'file', 'audio')),
  attachment_name text null,
  attachment_url text null,
  mime_type text null,
  created_at timestamptz not null default now(),
  constraint internal_chat_messages_content_check check (content is not null or attachment_url is not null)
);

alter table public.internal_chat_messages add column if not exists recipient_id uuid null;

create index if not exists internal_chat_messages_created_at_idx on public.internal_chat_messages (created_at asc);
create index if not exists internal_chat_messages_recipient_id_idx on public.internal_chat_messages (recipient_id);

alter table public.internal_chat_messages enable row level security;

drop policy if exists "internal_chat_select_authenticated" on public.internal_chat_messages;
create policy "internal_chat_select_authenticated"
  on public.internal_chat_messages
  for select
  to authenticated
  using (auth.uid() = user_id or auth.uid() = recipient_id);

drop policy if exists "internal_chat_insert_authenticated" on public.internal_chat_messages;
create policy "internal_chat_insert_authenticated"
  on public.internal_chat_messages
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "internal_chat_update_own" on public.internal_chat_messages;
create policy "internal_chat_update_own"
  on public.internal_chat_messages
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "internal_chat_delete_own" on public.internal_chat_messages;
create policy "internal_chat_delete_own"
  on public.internal_chat_messages
  for delete
  to authenticated
  using (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'internal_chat_messages'
  ) then
    alter publication supabase_realtime add table public.internal_chat_messages;
  end if;
end
$$;

create table if not exists public.internal_chat_user_preferences (
  user_id uuid primary key,
  avatar_style text not null default 'homem_moreno',
  updated_at timestamptz not null default now()
);

alter table public.internal_chat_user_preferences enable row level security;

drop policy if exists "internal_chat_preferences_select_authenticated" on public.internal_chat_user_preferences;
create policy "internal_chat_preferences_select_authenticated"
  on public.internal_chat_user_preferences
  for select
  to authenticated
  using (true);

drop policy if exists "internal_chat_preferences_insert_own" on public.internal_chat_user_preferences;
create policy "internal_chat_preferences_insert_own"
  on public.internal_chat_user_preferences
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "internal_chat_preferences_update_own" on public.internal_chat_user_preferences;
create policy "internal_chat_preferences_update_own"
  on public.internal_chat_user_preferences
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "internal_chat_preferences_delete_own" on public.internal_chat_user_preferences;
create policy "internal_chat_preferences_delete_own"
  on public.internal_chat_user_preferences
  for delete
  to authenticated
  using (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'internal_chat_user_preferences'
  ) then
    alter publication supabase_realtime add table public.internal_chat_user_preferences;
  end if;
end
$$;

create table if not exists public.internal_chat_presence (
  user_id uuid primary key,
  user_name text not null,
  user_email text not null,
  is_online boolean not null default false,
  last_seen timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists internal_chat_presence_is_online_idx on public.internal_chat_presence (is_online);

alter table public.internal_chat_presence enable row level security;

drop policy if exists "internal_chat_presence_select_authenticated" on public.internal_chat_presence;
create policy "internal_chat_presence_select_authenticated"
  on public.internal_chat_presence
  for select
  to authenticated
  using (true);

drop policy if exists "internal_chat_presence_insert_own" on public.internal_chat_presence;
create policy "internal_chat_presence_insert_own"
  on public.internal_chat_presence
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "internal_chat_presence_update_own" on public.internal_chat_presence;
create policy "internal_chat_presence_update_own"
  on public.internal_chat_presence
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "internal_chat_presence_delete_own" on public.internal_chat_presence;
create policy "internal_chat_presence_delete_own"
  on public.internal_chat_presence
  for delete
  to authenticated
  using (auth.uid() = user_id);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'internal_chat_presence'
  ) then
    alter publication supabase_realtime add table public.internal_chat_presence;
  end if;
end
$$;
