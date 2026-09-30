-- Passport: stamps, photos and public profiles. Run with `npm run db:test`.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'cook@passport.dev'),
  ('00000000-0000-0000-0000-0000000000d2', 'other@passport.dev');
update public.profiles set username = 'ana_cozinha', passport_public = true where id = '00000000-0000-0000-0000-0000000000d2';
insert into public.cooked_dishes (user_id, dish_id) values ('00000000-0000-0000-0000-0000000000d2', '50000000-0000-0000-0000-000000000001');

create function pg_temp.act_as(p_user uuid) returns void
language plpgsql as $$
begin
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
end;
$$;

select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select lives_ok(
  $$ insert into public.cooked_dishes (user_id, dish_id, photo_path)
     values ('00000000-0000-0000-0000-0000000000d1', '50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d1/pizza.jpg') $$,
  'user stamps a free dish'
);
select throws_ok(
  $$ insert into public.cooked_dishes (user_id, dish_id)
     values ('00000000-0000-0000-0000-0000000000d1', '50000000-0000-0000-0000-000000000003') $$,
  '42501', null, 'user cannot stamp a premium dish they cannot open'
);
select throws_ok(
  $$ insert into public.cooked_dishes (user_id, dish_id, photo_path)
     values ('00000000-0000-0000-0000-0000000000d1', '50000000-0000-0000-0000-000000000002', 'someone-else/photo.jpg') $$,
  '23514', null, 'photo must live in the user''s own folder'
);
select throws_ok(
  $$ insert into public.cooked_dishes (user_id, dish_id)
     values ('00000000-0000-0000-0000-0000000000d2', '50000000-0000-0000-0000-000000000002') $$,
  '42501', null, 'user cannot stamp someone else''s passport'
);
select is((select count(*)::int from public.cooked_dishes), 1, 'user sees only their own stamps');
select throws_ok(
  $$ update public.cooked_dishes set dish_id = '50000000-0000-0000-0000-000000000002' $$,
  '42501', null, 'only the photo of a stamp can change'
);
select throws_ok(
  $$ update public.profiles set passport_public = true where id = '00000000-0000-0000-0000-0000000000d1' $$,
  '23514', null, 'a public passport needs a username'
);
select throws_ok(
  $$ update public.profiles set username = 'ana_cozinha' where id = '00000000-0000-0000-0000-0000000000d1' $$,
  '23505', null, 'usernames are unique'
);

-- Public lookup only returns opted-in passports.
set local role anon;
select is((select count(*)::int from public.public_passport('ANA_COZINHA')), 1, 'public passport found (case-insensitive)');
reset role;
update public.profiles set passport_public = false where id = '00000000-0000-0000-0000-0000000000d2';
set local role anon;
select is((select count(*)::int from public.public_passport('ana_cozinha')), 0, 'private passport is hidden');

-- Storage: nobody reads another user's photo folder.
reset role;
insert into storage.objects (bucket_id, name, owner) values ('cooked', '00000000-0000-0000-0000-0000000000d2/secret.jpg', '00000000-0000-0000-0000-0000000000d2');
select pg_temp.act_as('00000000-0000-0000-0000-0000000000d1');
select is((select count(*)::int from storage.objects where bucket_id = 'cooked'), 0, 'photos of other users are invisible');

select * from finish();
rollback;
