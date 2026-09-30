-- Phase 3: one-off themed trips ("A week in Naples"): a bundle of dishes
-- bought once for lifetime access, alongside the subscription.

create table public.bundles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_i18n_text(name)),
  description jsonb not null default '{"pt": ""}' check (public.is_i18n_text(description, false)),
  cover_url text,
  -- Prices in minor units (centavos / cents).
  price_brl integer not null check (price_brl > 0),
  price_usd integer not null check (price_usd > 0),
  status public.dish_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger bundles_set_updated_at
  before update on public.bundles
  for each row execute function public.set_updated_at();

create table public.bundle_dishes (
  bundle_id uuid not null references public.bundles (id) on delete cascade,
  dish_id uuid not null references public.dishes (id) on delete cascade,
  position integer not null check (position >= 0),
  primary key (bundle_id, dish_id)
);

create index bundle_dishes_dish_idx on public.bundle_dishes (dish_id);

-- Written only by verified payment webhooks (service role).
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  bundle_id uuid not null references public.bundles (id) on delete restrict,
  provider public.payment_provider not null,
  provider_payment_id text not null,
  amount integer not null check (amount > 0),
  currency text not null check (currency in ('BRL', 'USD')),
  created_at timestamptz not null default now(),
  constraint purchases_provider_ref_key unique (provider, provider_payment_id),
  constraint purchases_user_bundle_key unique (user_id, bundle_id)
);

create function public.owns_dish_through_bundle(p_dish_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.purchases p
    join public.bundle_dishes bd on bd.bundle_id = p.bundle_id
    where p.user_id = (select auth.uid()) and bd.dish_id = p_dish_id
  )
$$;

-- Access now also comes from a purchased trip containing the dish.
create or replace function public.has_access(p_dish_id uuid)
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
      and (
        access = 'free'
        or public.has_active_subscription()
        or public.owns_dish_through_bundle(p_dish_id)
      )
  )
$$;

alter table public.bundles enable row level security;
alter table public.bundle_dishes enable row level security;
alter table public.purchases enable row level security;

revoke all on public.bundles, public.bundle_dishes, public.purchases from anon, authenticated;
grant select on public.bundles, public.bundle_dishes to anon, authenticated;
grant insert, update, delete on public.bundles, public.bundle_dishes to authenticated;
grant select on public.purchases to authenticated;

create policy "Published trips are public"
  on public.bundles for select
  to anon, authenticated
  using (status = 'published' or (select public.is_admin()));

create policy "Admins manage trips"
  on public.bundles for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Dishes of published trips are public"
  on public.bundle_dishes for select
  to anon, authenticated
  using (
    exists (select 1 from public.bundles b where b.id = bundle_id and b.status = 'published')
    or (select public.is_admin())
  );

create policy "Admins manage trip dishes"
  on public.bundle_dishes for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Users see their own purchases"
  on public.purchases for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
