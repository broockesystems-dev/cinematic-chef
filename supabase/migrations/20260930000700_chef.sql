-- Phase 2: AI chef chat, one conversation per user and dish.
create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  dish_id uuid not null references public.dishes (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (length(content) between 1 and 20000),
  -- Input + output tokens billed for assistant replies (cost tracking).
  tokens integer check (tokens >= 0),
  created_at timestamptz not null default now()
);

create index ai_messages_conversation_idx on public.ai_messages (user_id, dish_id, created_at);
create index ai_messages_daily_idx on public.ai_messages (user_id, created_at) where role = 'user';

alter table public.ai_messages enable row level security;
revoke all on public.ai_messages from anon, authenticated;
grant select, insert, delete on public.ai_messages to authenticated;

create policy "Users read their own chef messages"
  on public.ai_messages for select
  to authenticated
  using (user_id = (select auth.uid()));

-- The chef is a subscriber feature: even a direct API call can't store
-- messages without an active subscription.
create policy "Subscribers write their own chef messages"
  on public.ai_messages for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and ((select public.has_active_subscription()) or (select public.is_admin()))
    and public.is_dish_visible(dish_id)
  );

create policy "Users clear their own chef messages"
  on public.ai_messages for delete
  to authenticated
  using (user_id = (select auth.uid()));
