-- Next-destination polls. Run with `npm run db:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000e1', 'free@vote.dev'),
  ('00000000-0000-0000-0000-0000000000e2', 'sub@vote.dev'),
  ('00000000-0000-0000-0000-0000000000e3', 'sub2@vote.dev');
insert into public.subscriptions (user_id, provider, provider_subscription_id, plan, currency, status, current_period_end) values
  ('00000000-0000-0000-0000-0000000000e2', 'stripe', 'vote_1', 'monthly', 'USD', 'active', now() + interval '5 days'),
  ('00000000-0000-0000-0000-0000000000e3', 'stripe', 'vote_2', 'monthly', 'USD', 'active', now() + interval '5 days');

insert into public.polls (id, month, status, closes_at) values
  ('81000000-0000-0000-0000-000000000001', '2099-01-01', 'open', now() + interval '3 days'),
  ('81000000-0000-0000-0000-000000000002', '2099-02-01', 'draft', now() + interval '30 days'),
  ('81000000-0000-0000-0000-000000000003', '2098-12-01', 'closed', now() - interval '1 day');
insert into public.poll_options (id, poll_id, position, dish_name) values
  ('82000000-0000-0000-0000-000000000001', '81000000-0000-0000-0000-000000000001', 0, '{"pt": "A"}'),
  ('82000000-0000-0000-0000-000000000002', '81000000-0000-0000-0000-000000000001', 1, '{"pt": "B"}'),
  ('82000000-0000-0000-0000-000000000003', '81000000-0000-0000-0000-000000000002', 0, '{"pt": "Rascunho"}'),
  ('82000000-0000-0000-0000-000000000004', '81000000-0000-0000-0000-000000000003', 0, '{"pt": "Fechada"}');

create function pg_temp.act_as(p_user uuid) returns void
language plpgsql as $$
begin
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
end;
$$;

set local role anon;
select ok(
  not exists (select 1 from public.polls where id = '81000000-0000-0000-0000-000000000002'),
  'draft polls are hidden'
);
select is(
  (select count(*)::int from public.poll_options where poll_id = '81000000-0000-0000-0000-000000000001'),
  2, 'options of open polls are public'
);

select pg_temp.act_as('00000000-0000-0000-0000-0000000000e1');
select throws_ok(
  $$ insert into public.votes (poll_id, option_id, user_id) values
     ('81000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e1') $$,
  '42501', null, 'free users cannot vote'
);

select pg_temp.act_as('00000000-0000-0000-0000-0000000000e2');
select is(
  (select count(*)::int from public.poll_results('81000000-0000-0000-0000-000000000001')),
  0, 'results stay hidden until you vote'
);
select lives_ok(
  $$ insert into public.votes (poll_id, option_id, user_id) values
     ('81000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e2') $$,
  'subscribers vote in an open poll'
);
select throws_ok(
  $$ insert into public.votes (poll_id, option_id, user_id) values
     ('81000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000e2') $$,
  '23505', null, 'one vote per poll'
);
select lives_ok(
  $$ update public.votes set option_id = '82000000-0000-0000-0000-000000000002'
     where poll_id = '81000000-0000-0000-0000-000000000001' $$,
  'subscribers can change their vote while open'
);
select throws_ok(
  $$ update public.votes set option_id = '82000000-0000-0000-0000-000000000004'
     where poll_id = '81000000-0000-0000-0000-000000000001' $$,
  '23503', null, 'a vote cannot point at another poll''s option'
);
select throws_ok(
  $$ insert into public.votes (poll_id, option_id, user_id) values
     ('81000000-0000-0000-0000-000000000003', '82000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000e2') $$,
  '42501', null, 'closed polls take no votes'
);
select is(
  (select array_agg(votes order by option_id) from public.poll_results('81000000-0000-0000-0000-000000000001')),
  array[0, 1], 'after voting, results are visible'
);

select pg_temp.act_as('00000000-0000-0000-0000-0000000000e3');
select throws_ok(
  $$ insert into public.votes (poll_id, option_id, user_id) values
     ('81000000-0000-0000-0000-000000000001', '82000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000e2') $$,
  '42501', null, 'nobody votes on someone else''s behalf'
);
select is((select count(*)::int from public.votes), 0, 'votes of others are private');

select * from finish();
rollback;
