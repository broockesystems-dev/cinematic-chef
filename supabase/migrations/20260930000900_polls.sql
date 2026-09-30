-- Phase 3: monthly vote on the next destination. Subscribers vote; the
-- winner becomes the next video and Instagram post.

create type public.poll_status as enum ('draft', 'open', 'closed');

create table public.polls (
  id uuid primary key default gen_random_uuid(),
  month date not null unique check (extract(day from month) = 1),
  status public.poll_status not null default 'draft',
  closes_at timestamptz not null,
  winner_option_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger polls_set_updated_at
  before update on public.polls
  for each row execute function public.set_updated_at();

create table public.poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls (id) on delete cascade,
  position integer not null check (position >= 0),
  dish_name jsonb not null check (public.is_i18n_text(dish_name)),
  description jsonb check (description is null or public.is_i18n_text(description, false)),
  location_id uuid references public.locations (id) on delete set null,
  image_url text,
  -- Lets votes reference (option, poll) so a vote can't point at another poll's option.
  constraint poll_options_id_poll_key unique (id, poll_id)
);

create index poll_options_poll_idx on public.poll_options (poll_id, position);

alter table public.polls
  add constraint polls_winner_fkey foreign key (winner_option_id, id)
  references public.poll_options (id, poll_id) on delete set null (winner_option_id);

create table public.votes (
  poll_id uuid not null references public.polls (id) on delete cascade,
  option_id uuid not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id),
  foreign key (option_id, poll_id) references public.poll_options (id, poll_id) on delete cascade
);

create index votes_option_idx on public.votes (option_id);

create function public.poll_accepts_votes(p_poll_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.polls
    where id = p_poll_id and status = 'open' and closes_at > now()
  )
$$;

-- Vote counts are shown once you've voted, when the poll is closed, or to
-- admins, so early results don't sway the vote.
create function public.poll_results(p_poll_id uuid)
returns table (option_id uuid, votes integer)
language sql
stable
security definer
set search_path = ''
as $$
  select o.id, count(v.user_id)::integer
  from public.poll_options o
  left join public.votes v on v.option_id = o.id
  where o.poll_id = p_poll_id
    and (
      public.is_admin()
      or exists (select 1 from public.polls p where p.id = p_poll_id and p.status = 'closed')
      or exists (select 1 from public.votes mine where mine.poll_id = p_poll_id and mine.user_id = (select auth.uid()))
    )
  group by o.id
$$;

grant execute on function public.poll_results(uuid) to anon, authenticated;
grant execute on function public.poll_accepts_votes(uuid) to anon, authenticated;

alter table public.polls enable row level security;
alter table public.poll_options enable row level security;
alter table public.votes enable row level security;

revoke all on public.polls, public.poll_options, public.votes from anon, authenticated;
grant select on public.polls, public.poll_options to anon, authenticated;
grant insert, update, delete on public.polls, public.poll_options to authenticated;
grant select, insert on public.votes to authenticated;
grant update (option_id) on public.votes to authenticated;

create policy "Published polls are public"
  on public.polls for select
  to anon, authenticated
  using (status <> 'draft' or (select public.is_admin()));

create policy "Admins manage polls"
  on public.polls for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Options of published polls are public"
  on public.poll_options for select
  to anon, authenticated
  using (
    exists (select 1 from public.polls p where p.id = poll_id and p.status <> 'draft')
    or (select public.is_admin())
  );

create policy "Admins manage poll options"
  on public.poll_options for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Users see their own votes"
  on public.votes for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Subscribers vote in open polls"
  on public.votes for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and (select public.has_active_subscription())
    and public.poll_accepts_votes(poll_id)
  );

create policy "Subscribers change their vote while the poll is open"
  on public.votes for update
  to authenticated
  using (user_id = (select auth.uid()) and public.poll_accepts_votes(poll_id))
  with check (
    user_id = (select auth.uid())
    and (select public.has_active_subscription())
    and public.poll_accepts_votes(poll_id)
  );
