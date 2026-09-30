-- RLS and integrity tests. Run with `npm run db:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(34);

-- ---------------------------------------------------------------------------
-- Fixtures (as postgres, before switching roles)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'free@test.dev'),
  ('00000000-0000-0000-0000-00000000000b', 'subscriber@test.dev'),
  ('00000000-0000-0000-0000-00000000000c', 'expired@test.dev'),
  ('00000000-0000-0000-0000-00000000000d', 'admin@test.dev');

update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000d';

insert into public.subscriptions
  (user_id, provider, provider_subscription_id, plan, currency, status, current_period_end)
values
  ('00000000-0000-0000-0000-00000000000b', 'stripe', 'sub_active', 'monthly', 'USD', 'active', now() + interval '20 days'),
  ('00000000-0000-0000-0000-00000000000c', 'mercadopago', 'mp_old', 'annual', 'BRL', 'active', now() - interval '1 day');

insert into public.dishes (id, location_id, slug, name, access, status, published_at) values
  ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'draft-dish', '{"pt": "Rascunho"}', 'free', 'draft', null),
  ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', 'scheduled-dish', '{"pt": "Agendado"}', 'free', 'published', now() + interval '7 days');

insert into public.ingredients (dish_id, position, name) values
  ('60000000-0000-0000-0000-000000000001', 0, '{"pt": "Segredo"}');

insert into public.videos (dish_id, kind, status, mux_playback_id) values
  ('50000000-0000-0000-0000-000000000003', 'teaser', 'ready', 'teaser-playback'),
  ('50000000-0000-0000-0000-000000000003', 'full', 'ready', 'full-playback');

create function pg_temp.act_as(p_role text, p_user uuid default null) returns void
language plpgsql as $$
begin
  execute format('set local role %I', p_role);
  perform set_config('request.jwt.claims',
    coalesce(json_build_object('sub', p_user, 'role', p_role)::text, ''), true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Integrity
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.locations (parent_id, type, name, slug, lat, lng)
     values ('10000000-0000-0000-0000-000000000001', 'city', '{"pt": "X"}', 'x', 0, 0) $$,
  'P0001', 'A city must have a country as parent',
  'a city cannot hang directly from a continent'
);
select throws_ok(
  $$ insert into public.dishes (location_id, slug, name)
     values ('30000000-0000-0000-0000-000000000001', 'no-pt', '{"en": "Only English"}') $$,
  '23514', null, 'dish names require PT text'
);
select throws_ok(
  $$ insert into public.dishes (location_id, slug, name)
     values ('10000000-0000-0000-0000-000000000001', 'on-continent', '{"pt": "X"}') $$,
  'P0001', null, 'dishes cannot belong to a continent'
);
select throws_ok(
  $$ insert into public.dishes (location_id, slug, name, status)
     values ('30000000-0000-0000-0000-000000000001', 'no-date', '{"pt": "X"}', 'published') $$,
  '23514', null, 'published dishes need published_at'
);
select is(
  (select count(*)::int from public.profiles where id::text like '00000000-0000-0000-0000-00000000000%'),
  4, 'a profile is created for every new auth user'
);
select is(
  (select count(*)::int from public.dishes
   where search_vector @@ to_tsquery('simple', public.f_unaccent('napoles'))),
  1, 'search is accent-insensitive and matches story text'
);

-- ---------------------------------------------------------------------------
-- Visitor (anon)
-- ---------------------------------------------------------------------------
select pg_temp.act_as('anon');

select is((select count(*)::int from public.locations), 10, 'anon: sees all locations');
select is((select count(*)::int from public.dishes), 3, 'anon: sees only published, non-scheduled dishes');
select ok(
  (select count(*) from public.ingredients where dish_id = '50000000-0000-0000-0000-000000000001') > 0,
  'anon: reads ingredients of a free dish'
);
select is(
  (select count(*)::int from public.ingredients where dish_id = '50000000-0000-0000-0000-000000000003'),
  0, 'anon: cannot read ingredients of a premium dish'
);
select is(
  (select count(*)::int from public.steps where dish_id = '50000000-0000-0000-0000-000000000003'),
  0, 'anon: cannot read steps of a premium dish'
);
select is(
  (select array_agg(kind::text) from public.videos), array['teaser'],
  'anon: sees the teaser but not the full video'
);
select is(
  (select count(*)::int from public.ingredients where dish_id = '60000000-0000-0000-0000-000000000001'),
  0, 'anon: cannot read ingredients of a draft dish'
);
select throws_ok(
  $$ insert into public.locations (type, name, slug, lat, lng) values ('continent', '{"pt": "X"}', 'x', 0, 0) $$,
  '42501', null, 'anon: cannot create locations'
);
select throws_ok($$ select * from public.profiles $$, '42501', null, 'anon: cannot read profiles');
select throws_ok($$ select * from public.subscriptions $$, '42501', null, 'anon: cannot read subscriptions');

-- ---------------------------------------------------------------------------
-- Signed-in user without a subscription
-- ---------------------------------------------------------------------------
select pg_temp.act_as('authenticated', '00000000-0000-0000-0000-00000000000a');

select ok(not public.has_access('50000000-0000-0000-0000-000000000003'), 'free user: no access to premium dish');
select ok(public.has_access('50000000-0000-0000-0000-000000000001'), 'free user: access to free dish');
select is(
  (select count(*)::int from public.ingredients where dish_id = '50000000-0000-0000-0000-000000000003'),
  0, 'free user: cannot read premium ingredients'
);
select is((select count(*)::int from public.profiles), 1, 'free user: sees only their own profile');
select lives_ok(
  $$ update public.profiles set display_name = 'Ana', country = 'BR' where id = '00000000-0000-0000-0000-00000000000a' $$,
  'free user: can edit own preferences'
);
select throws_ok(
  $$ update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501', null, 'free user: cannot promote themselves to admin'
);
select throws_ok(
  $$ insert into public.subscriptions (user_id, provider, provider_subscription_id, plan, currency, status, current_period_end)
     values ('00000000-0000-0000-0000-00000000000a', 'stripe', 'fake', 'monthly', 'USD', 'active', now() + interval '1 year') $$,
  '42501', null, 'free user: cannot grant themselves a subscription'
);
-- RLS filters the row out of UPDATE, so it silently touches nothing.
update public.dishes set access = 'free' where id = '50000000-0000-0000-0000-000000000003';
select is(
  (select access::text from public.dishes where id = '50000000-0000-0000-0000-000000000003'),
  'premium', 'free user: cannot edit dishes'
);
select lives_ok(
  $$ insert into public.favorites (user_id, dish_id) values ('00000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-000000000003') $$,
  'free user: can favorite a published dish'
);
select throws_ok(
  $$ insert into public.favorites (user_id, dish_id) values ('00000000-0000-0000-0000-00000000000a', '60000000-0000-0000-0000-000000000001') $$,
  '42501', null, 'free user: cannot favorite a draft dish'
);

-- ---------------------------------------------------------------------------
-- Active subscriber
-- ---------------------------------------------------------------------------
select pg_temp.act_as('authenticated', '00000000-0000-0000-0000-00000000000b');

select ok(
  (select count(*) from public.ingredients where dish_id = '50000000-0000-0000-0000-000000000003') > 0,
  'subscriber: reads premium ingredients'
);
select is(
  (select count(*)::int from public.videos where kind = 'full'), 1,
  'subscriber: sees the full video'
);
select is((select count(*)::int from public.dishes), 3, 'subscriber: still cannot see drafts');
select is((select count(*)::int from public.favorites), 0, 'subscriber: cannot see other users'' favorites');

-- ---------------------------------------------------------------------------
-- Subscription past its period end
-- ---------------------------------------------------------------------------
select pg_temp.act_as('authenticated', '00000000-0000-0000-0000-00000000000c');

select ok(not public.has_access('50000000-0000-0000-0000-000000000003'), 'expired: loses premium access');

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------
select pg_temp.act_as('authenticated', '00000000-0000-0000-0000-00000000000d');

select is((select count(*)::int from public.dishes), 5, 'admin: sees drafts and scheduled dishes');
select lives_ok(
  $$ insert into public.locations (type, name, slug, lat, lng) values ('continent', '{"pt": "Ásia", "en": "Asia"}', 'asia', 34, 100) $$,
  'admin: can create locations'
);
select ok((select count(*) from public.profiles) >= 4, 'admin: sees all profiles');

select * from finish();
rollback;
