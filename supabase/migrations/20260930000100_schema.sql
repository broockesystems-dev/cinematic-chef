-- Core schema for The Cinematic Chef (phase 1).
-- Bilingual text lives in JSONB as {"pt": "...", "en": "..."}; PT is the
-- authoring language, so it is required and EN may be filled in later.

create extension if not exists unaccent with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.location_type as enum ('continent', 'country', 'city', 'neighborhood');
create type public.dish_access as enum ('free', 'premium');
create type public.dish_status as enum ('draft', 'published');
create type public.dish_difficulty as enum ('easy', 'medium', 'hard');
create type public.video_kind as enum ('teaser', 'full');
create type public.video_status as enum ('waiting', 'preparing', 'ready', 'errored');
create type public.user_role as enum ('user', 'admin');
create type public.payment_provider as enum ('stripe', 'mercadopago');
create type public.subscription_plan as enum ('monthly', 'annual');
create type public.subscription_status as enum (
  'incomplete', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'expired'
);

-- Unit codes are translated in the UI (messages/*.json -> Units).
create domain public.measure_unit as text check (
  value in (
    'g', 'kg', 'ml', 'l', 'unit', 'clove', 'slice', 'bunch', 'pinch',
    'tsp', 'tbsp', 'cup', 'oz', 'lb', 'fl_oz'
  )
);

create function public.is_i18n_text(value jsonb, required boolean default true)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value is not null
    and jsonb_typeof(value) = 'object'
    and (not required or coalesce(length(trim(value ->> 'pt')), 0) > 0)
    and (value - 'pt' - 'en') = '{}'::jsonb
$$;

-- unaccent() is only STABLE, which generated columns and indexes reject.
-- Pinning the dictionary makes the result deterministic.
create function public.f_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, $1)
$$;

create function public.i18n_search_text(value jsonb)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select public.f_unaccent(
    lower(coalesce(value ->> 'pt', '') || ' ' || coalesce(value ->> 'en', ''))
  )
$$;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Locations (single tree: continent > country > city > neighborhood)
-- ---------------------------------------------------------------------------
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.locations (id) on delete restrict,
  type public.location_type not null,
  name jsonb not null check (public.is_i18n_text(name)),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  iso_code text check (iso_code ~ '^[A-Z]{2}$'),
  search_vector tsvector generated always as (
    to_tsvector('simple', public.i18n_search_text(name))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint locations_parent_slug_key unique nulls not distinct (parent_id, slug),
  constraint locations_iso_only_for_countries check (iso_code is null or type = 'country')
);

create index locations_parent_id_idx on public.locations (parent_id);
create index locations_search_idx on public.locations using gin (search_vector);

create trigger locations_set_updated_at
  before update on public.locations
  for each row execute function public.set_updated_at();

-- Each level must hang from the level directly above it.
create function public.check_location_parent()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  parent_type public.location_type;
  expected public.location_type;
begin
  expected := case new.type
    when 'country' then 'continent'
    when 'city' then 'country'
    when 'neighborhood' then 'city'
  end;

  if new.type = 'continent' then
    if new.parent_id is not null then
      raise exception 'A continent cannot have a parent';
    end if;
    return new;
  end if;

  select type into parent_type from public.locations where id = new.parent_id;
  if parent_type is distinct from expected then
    raise exception 'A % must have a % as parent', new.type, expected;
  end if;
  return new;
end;
$$;

create trigger locations_check_parent
  before insert or update of parent_id, type on public.locations
  for each row execute function public.check_location_parent();

-- ---------------------------------------------------------------------------
-- Dishes and recipe content
-- ---------------------------------------------------------------------------
create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (public.is_i18n_text(name)),
  story jsonb not null default '{"pt": ""}' check (public.is_i18n_text(story, false)),
  cover_url text,
  prep_minutes integer check (prep_minutes > 0),
  difficulty public.dish_difficulty not null default 'medium',
  base_servings integer not null default 4 check (base_servings > 0),
  access public.dish_access not null default 'premium',
  status public.dish_status not null default 'draft',
  -- A published dish with a future date is scheduled and stays hidden until then.
  published_at timestamptz,
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', public.i18n_search_text(name)), 'A')
    || setweight(to_tsvector('simple', public.i18n_search_text(story)), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dishes_published_needs_date check (status = 'draft' or published_at is not null)
);

create index dishes_location_status_idx on public.dishes (location_id, status);
create index dishes_search_idx on public.dishes using gin (search_vector);

create trigger dishes_set_updated_at
  before update on public.dishes
  for each row execute function public.set_updated_at();

create function public.check_dish_location()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select type from public.locations where id = new.location_id) = 'continent' then
    raise exception 'A dish must belong to a country, city or neighborhood';
  end if;
  return new;
end;
$$;

create trigger dishes_check_location
  before insert or update of location_id on public.dishes
  for each row execute function public.check_dish_location();

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes (id) on delete cascade,
  position integer not null check (position >= 0),
  name jsonb not null check (public.is_i18n_text(name)),
  -- Null quantities mean "to taste".
  qty_metric numeric(10, 2) check (qty_metric > 0),
  unit_metric public.measure_unit,
  qty_us numeric(10, 2) check (qty_us > 0),
  unit_us public.measure_unit,
  note jsonb check (note is null or public.is_i18n_text(note, false)),
  -- Deferred so the admin can reorder rows inside one transaction.
  constraint ingredients_dish_position_key unique (dish_id, position)
    deferrable initially deferred
);

create table public.steps (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes (id) on delete cascade,
  position integer not null check (position >= 0),
  title jsonb check (title is null or public.is_i18n_text(title, false)),
  text jsonb not null check (public.is_i18n_text(text)),
  media_url text,
  timer_seconds integer check (timer_seconds > 0),
  constraint steps_dish_position_key unique (dish_id, position)
    deferrable initially deferred
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  dish_id uuid not null references public.dishes (id) on delete cascade,
  kind public.video_kind not null,
  status public.video_status not null default 'waiting',
  mux_upload_id text unique,
  mux_asset_id text unique,
  mux_playback_id text,
  duration_s numeric(10, 2),
  -- Subtitle file URL per language: {"pt": "https://...vtt", "en": "..."}.
  subtitles jsonb not null default '{}' check (public.is_i18n_text(subtitles, false)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint videos_dish_kind_key unique (dish_id, kind)
);

create trigger videos_set_updated_at
  before update on public.videos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Users, subscriptions and favorites
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (length(display_name) <= 80),
  locale text not null default 'pt' check (locale in ('pt', 'en')),
  country text check (country ~ '^[A-Z]{2}$'),
  role public.user_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'pt' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Written only by payment webhooks (service role); users can only read.
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider public.payment_provider not null,
  provider_customer_id text,
  provider_subscription_id text not null,
  plan public.subscription_plan not null,
  currency text not null check (currency in ('BRL', 'USD')),
  status public.subscription_status not null,
  current_period_end timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_provider_ref_key unique (provider, provider_subscription_id)
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

create table public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  dish_id uuid not null references public.dishes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, dish_id)
);

create index favorites_dish_id_idx on public.favorites (dish_id);
