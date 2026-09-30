-- AI chef messages: subscriber-only writes, private reads. Run with `npm run db:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000c1', 'free@chef.dev'),
  ('00000000-0000-0000-0000-0000000000c2', 'sub@chef.dev'),
  ('00000000-0000-0000-0000-0000000000c3', 'other-sub@chef.dev'),
  ('00000000-0000-0000-0000-0000000000c4', 'expired@chef.dev');
insert into public.subscriptions (user_id, provider, provider_subscription_id, plan, currency, status, current_period_end) values
  ('00000000-0000-0000-0000-0000000000c2', 'stripe', 'chef_sub_1', 'monthly', 'USD', 'active', now() + interval '10 days'),
  ('00000000-0000-0000-0000-0000000000c3', 'stripe', 'chef_sub_2', 'annual', 'USD', 'active', now() + interval '300 days'),
  ('00000000-0000-0000-0000-0000000000c4', 'mercadopago', 'chef_mp_1', 'monthly', 'BRL', 'active', now() - interval '1 hour');
insert into public.ai_messages (user_id, dish_id, role, content) values
  ('00000000-0000-0000-0000-0000000000c3', '50000000-0000-0000-0000-000000000003', 'user', 'segredo de outra pessoa');

create function pg_temp.act_as(p_user uuid) returns void
language plpgsql as $$
begin
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
end;
$$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000c1');
select throws_ok(
  $$ insert into public.ai_messages (user_id, dish_id, role, content)
     values ('00000000-0000-0000-0000-0000000000c1', '50000000-0000-0000-0000-000000000001', 'user', 'oi') $$,
  '42501', null, 'free user cannot store chef messages'
);

select pg_temp.act_as('00000000-0000-0000-0000-0000000000c4');
select throws_ok(
  $$ insert into public.ai_messages (user_id, dish_id, role, content)
     values ('00000000-0000-0000-0000-0000000000c4', '50000000-0000-0000-0000-000000000001', 'user', 'oi') $$,
  '42501', null, 'expired subscriber cannot store chef messages'
);

select pg_temp.act_as('00000000-0000-0000-0000-0000000000c2');
select lives_ok(
  $$ insert into public.ai_messages (user_id, dish_id, role, content)
     values ('00000000-0000-0000-0000-0000000000c2', '50000000-0000-0000-0000-000000000003', 'user', 'posso usar parmesão?') $$,
  'subscriber can store their own message'
);
select throws_ok(
  $$ insert into public.ai_messages (user_id, dish_id, role, content)
     values ('00000000-0000-0000-0000-0000000000c3', '50000000-0000-0000-0000-000000000003', 'user', 'forjada') $$,
  '42501', null, 'subscriber cannot write as someone else'
);
select is((select count(*)::int from public.ai_messages), 1, 'subscriber only reads their own messages');
select throws_ok(
  $$ update public.ai_messages set content = 'x' $$,
  '42501', null, 'messages cannot be edited'
);
delete from public.ai_messages where dish_id = '50000000-0000-0000-0000-000000000003';
select is((select count(*)::int from public.ai_messages), 0, 'subscriber can clear their conversation');

reset role;
select is(
  (select count(*)::int from public.ai_messages where user_id = '00000000-0000-0000-0000-0000000000c3'),
  1, 'clearing does not touch other users'
);
select throws_ok(
  $$ insert into public.ai_messages (user_id, dish_id, role, content)
     values ('00000000-0000-0000-0000-0000000000c3', '50000000-0000-0000-0000-000000000003', 'system', 'x') $$,
  '23514', null, 'only user and assistant roles are allowed'
);

select * from finish();
rollback;
