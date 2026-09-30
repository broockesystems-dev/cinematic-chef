-- Search, rate limiting and admin RPC permissions. Run with `npm run db:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'user@test.dev'),
  ('00000000-0000-0000-0000-0000000000a2', 'admin@test.dev');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a2';
insert into public.dishes (id, location_id, slug, name, status) values
  ('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'segredo', '{"pt": "Pizza secreta"}', 'draft');

create function pg_temp.act_as(p_role text, p_user uuid default null) returns void
language plpgsql as $$
begin
  execute format('set local role %I', p_role);
  perform set_config('request.jwt.claims',
    coalesce(json_build_object('sub', p_user, 'role', p_role)::text, ''), true);
end;
$$;

-- Search
select pg_temp.act_as('anon');
select is(
  (select array_agg(slug order by slug) from public.search_catalog('pizza')),
  array['pizza-fritta'], 'search: drafts are hidden from visitors'
);
select is((select count(*)::int from public.search_catalog('')), 0, 'search: empty query returns nothing');
select is((select count(*)::int from public.search_catalog('!!! ???')), 0, 'search: punctuation-only query returns nothing');
select lives_ok($$ select * from public.search_catalog(''') or 1=1 --') $$, 'search: quotes are treated as text');
select is((select count(*)::int from public.search_catalog('pizza', 1000)), 1, 'search: limit is capped safely');

-- Rate limiter is server-only
select throws_ok($$ select public.check_rate_limit('x', 1, 60) $$, '42501', null, 'rate limit: visitors cannot call it');
select pg_temp.act_as('authenticated', '00000000-0000-0000-0000-0000000000a1');
select throws_ok($$ select public.check_rate_limit('x', 1, 60) $$, '42501', null, 'rate limit: users cannot call it');

-- Admin RPCs
select throws_ok(
  $$ select public.admin_replace_ingredients('50000000-0000-0000-0000-000000000001', '[]') $$,
  '42501', null, 'admin RPC: regular users cannot replace ingredients'
);
select pg_temp.act_as('authenticated', '00000000-0000-0000-0000-0000000000a2');
select lives_ok(
  $$ select public.admin_replace_steps('50000000-0000-0000-0000-000000000001',
       '[{"text": {"pt": "Um"}}, {"text": {"pt": "Dois"}, "timer_seconds": 60}]') $$,
  'admin RPC: admins can replace steps'
);
select is(
  (select array_agg(text ->> 'pt' order by position) from public.steps where dish_id = '50000000-0000-0000-0000-000000000001'),
  array['Um', 'Dois'], 'admin RPC: steps are stored in the given order'
);

reset role;
select is(public.check_rate_limit('t', 2, 60) and public.check_rate_limit('t', 2, 60) and not public.check_rate_limit('t', 2, 60),
  true, 'rate limit: the third call in the window is refused');

select * from finish();
rollback;
