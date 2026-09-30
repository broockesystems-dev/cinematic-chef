-- One-off trips. Run with `npm run db:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(7);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000f1', 'buyer@trip.dev'),
  ('00000000-0000-0000-0000-0000000000f2', 'other@trip.dev');
insert into public.bundles (id, slug, name, price_brl, price_usd, status) values
  ('91000000-0000-0000-0000-000000000001', 'draft-trip', '{"pt": "Rascunho"}', 1000, 300, 'draft');
insert into public.purchases (user_id, bundle_id, provider, provider_payment_id, amount, currency) values
  ('00000000-0000-0000-0000-0000000000f1', '90000000-0000-0000-0000-000000000001', 'mercadopago', 'trip_1', 2900, 'BRL');

create function pg_temp.act_as(p_user uuid) returns void
language plpgsql as $$
begin
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
end;
$$;

set local role anon;
select is((select array_agg(slug) from public.bundles), array['volta-ao-mundo'], 'visitors see published trips only');

select pg_temp.act_as('00000000-0000-0000-0000-0000000000f1');
select ok(public.has_access('50000000-0000-0000-0000-000000000003'), 'buyer opens the premium dish in the trip');
select ok(
  (select count(*) from public.ingredients where dish_id = '50000000-0000-0000-0000-000000000003') > 0,
  'buyer reads the premium recipe'
);
select is((select count(*)::int from public.purchases), 1, 'buyer sees their purchase');
select throws_ok(
  $$ insert into public.purchases (user_id, bundle_id, provider, provider_payment_id, amount, currency)
     values ('00000000-0000-0000-0000-0000000000f1', '90000000-0000-0000-0000-000000000001', 'stripe', 'fake', 1, 'USD') $$,
  '42501', null, 'users cannot record purchases themselves'
);

select pg_temp.act_as('00000000-0000-0000-0000-0000000000f2');
select ok(not public.has_access('50000000-0000-0000-0000-000000000003'), 'non-buyers stay locked out');
select is((select count(*)::int from public.purchases), 0, 'purchases are private');

select * from finish();
rollback;
