create table if not exists public.internal_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  user_name text not null,
  user_email text not null,
  content text null,
  message_type text not null default 'text' check (message_type in ('text', 'image', 'file', 'audio')),
  attachment_name text null,
  attachment_url text null,
  mime_type text null,
  created_at timestamptz not null default now(),
  constraint internal_chat_messages_content_check check (content is not null or attachment_url is not null)
);

create index if not exists internal_chat_messages_created_at_idx on public.internal_chat_messages (created_at asc);

alter table public.internal_chat_messages enable row level security;

drop policy if exists "internal_chat_select_authenticated" on public.internal_chat_messages;
create policy "internal_chat_select_authenticated"
  on public.internal_chat_messages
  for select
  to authenticated
  using (true);

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

alter publication supabase_realtime add table public.internal_chat_messages;
