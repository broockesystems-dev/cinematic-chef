-- Access rules. Premium content is decided here (RLS) and on the server,
-- never in the browser. Subscriptions are only written by webhooks through
-- the service role, which bypasses RLS.

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER lets these read profiles/subscriptions without tripping
-- those tables' own RLS (and without policy recursion). They only ever look
-- at the calling user, via auth.uid().

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  )
$$;

create function public.has_active_subscription()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions
    where user_id = (select auth.uid())
      and status in ('active', 'trialing')
      and current_period_end > now()
  )
$$;

create function public.is_dish_visible(p_dish_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1 from public.dishes
    where id = p_dish_id and status = 'published' and published_at <= now()
  )
$$;

-- Full recipe access: ingredients, steps and the full video.
create function public.has_access(p_dish_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1 from public.dishes
    where id = p_dish_id
      and status = 'published'
      and published_at <= now()
      and (access = 'free' or public.has_active_subscription())
  )
$$;

-- ---------------------------------------------------------------------------
-- Table privileges: start from nothing, then grant only what the API needs.
-- ---------------------------------------------------------------------------
revoke all on public.locations, public.dishes, public.ingredients, public.steps,
  public.videos, public.profiles, public.subscriptions, public.favorites
  from anon, authenticated;

grant select on public.locations, public.dishes, public.ingredients,
  public.steps, public.videos
  to anon, authenticated;

-- Admin writes go through the authenticated role and are gated by RLS.
grant insert, update, delete on public.locations, public.dishes,
  public.ingredients, public.steps, public.videos
  to authenticated;

grant select on public.profiles, public.subscriptions to authenticated;
-- Users may edit their own preferences, never their role.
grant update (display_name, locale, country) on public.profiles to authenticated;

grant select, insert, delete on public.favorites to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.locations enable row level security;
alter table public.dishes enable row level security;
alter table public.ingredients enable row level security;
alter table public.steps enable row level security;
alter table public.videos enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.favorites enable row level security;

-- Locations are public geography.
create policy "Locations are public"
  on public.locations for select
  to anon, authenticated
  using (true);

create policy "Admins manage locations"
  on public.locations for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- Dish cards (name, story, cover, badge) are public once published so
-- premium dishes can be discovered; the recipe itself is protected below.
create policy "Published dishes are public"
  on public.dishes for select
  to anon, authenticated
  using (
    (status = 'published' and published_at <= now())
    or (select public.is_admin())
  );

create policy "Admins manage dishes"
  on public.dishes for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Ingredients require access"
  on public.ingredients for select
  to anon, authenticated
  using (public.has_access(dish_id));

create policy "Admins manage ingredients"
  on public.ingredients for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Steps require access"
  on public.steps for select
  to anon, authenticated
  using (public.has_access(dish_id));

create policy "Admins manage steps"
  on public.steps for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Teasers are public, full videos require access"
  on public.videos for select
  to anon, authenticated
  using (
    case kind
      when 'teaser' then public.is_dish_visible(dish_id)
      else public.has_access(dish_id)
    end
  );

create policy "Admins manage videos"
  on public.videos for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Users read their own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Users read their own subscriptions"
  on public.subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "Users read their own favorites"
  on public.favorites for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Users favorite visible dishes"
  on public.favorites for insert
  to authenticated
  with check (user_id = (select auth.uid()) and public.is_dish_visible(dish_id));

create policy "Users remove their own favorites"
  on public.favorites for delete
  to authenticated
  using (user_id = (select auth.uid()));
