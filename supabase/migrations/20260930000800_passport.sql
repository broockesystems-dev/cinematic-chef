-- Phase 3: gastronomic passport. "I cooked this" entries with an optional
-- photo; stamps and achievements are derived from them in the app.

alter table public.profiles
  add column username text unique check (username ~ '^[a-z0-9](?:[a-z0-9_]{1,28}[a-z0-9])$'),
  add column passport_public boolean not null default false,
  add constraint profiles_public_passport_needs_username check (not passport_public or username is not null);

grant update (username, passport_public) on public.profiles to authenticated;

create table public.cooked_dishes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  dish_id uuid not null references public.dishes (id) on delete cascade,
  -- Object path in the private `cooked` bucket ("<user_id>/<file>").
  photo_path text check (photo_path is null or photo_path like user_id::text || '/%'),
  created_at timestamptz not null default now(),
  constraint cooked_dishes_user_dish_key unique (user_id, dish_id)
);

create index cooked_dishes_dish_id_idx on public.cooked_dishes (dish_id);

alter table public.cooked_dishes enable row level security;
revoke all on public.cooked_dishes from anon, authenticated;
grant select, insert, delete on public.cooked_dishes to authenticated;
grant update (photo_path) on public.cooked_dishes to authenticated;

create policy "Users see their own cooked dishes"
  on public.cooked_dishes for select
  to authenticated
  using (user_id = (select auth.uid()));

-- You can only stamp a dish you're allowed to open.
create policy "Users stamp dishes they can access"
  on public.cooked_dishes for insert
  to authenticated
  with check (user_id = (select auth.uid()) and public.has_access(dish_id));

create policy "Users update their own photos"
  on public.cooked_dishes for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users remove their own stamps"
  on public.cooked_dishes for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Public passports are read on the server with the service role, and only
-- when the owner opted in; this helper keeps that rule in one place.
create function public.public_passport(p_username text)
returns table (user_id uuid, display_name text, username text)
language sql
stable
security definer
set search_path = ''
as $$
  select id, display_name, username
  from public.profiles
  where username = lower(p_username) and passport_public
$$;

grant execute on function public.public_passport(text) to anon, authenticated;

-- Private photo bucket: each user writes and reads only their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cooked', 'cooked', false, 8388608, array['image/jpeg', 'image/png', 'image/webp', 'image/heic']);

create policy "Users read their own cooked photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'cooked' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users upload their own cooked photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'cooked' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Users delete their own cooked photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'cooked' and (storage.foldername(name))[1] = (select auth.uid())::text);
