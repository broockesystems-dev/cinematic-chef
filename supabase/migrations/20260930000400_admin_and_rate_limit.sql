-- Admin helpers and a Postgres-backed rate limiter (works across serverless
-- instances, unlike in-memory counters).

-- ---------------------------------------------------------------------------
-- Rate limiting (fixed window). Only the service role may call it.
-- ---------------------------------------------------------------------------
create schema if not exists private;

create table private.rate_limits (
  key text primary key,
  window_start timestamptz not null,
  count integer not null
);

create function public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  window_expired boolean;
  current_count integer;
begin
  insert into private.rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update set
    count = case
      when r.window_start < now() - make_interval(secs => p_window_seconds) then 1
      else r.count + 1
    end,
    window_start = case
      when r.window_start < now() - make_interval(secs => p_window_seconds) then now()
      else r.window_start
    end
  returning count into current_count;

  return current_count <= p_limit;
end;
$$;

revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- ---------------------------------------------------------------------------
-- Replace a dish's ingredients/steps in one transaction. SECURITY INVOKER, so
-- RLS still applies; the explicit check gives a clear error instead of a
-- silent no-op.
-- ---------------------------------------------------------------------------
create function public.admin_replace_ingredients(p_dish_id uuid, p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can edit recipes' using errcode = '42501';
  end if;

  delete from public.ingredients where dish_id = p_dish_id;

  insert into public.ingredients
    (dish_id, position, name, qty_metric, unit_metric, qty_us, unit_us, note)
  select
    p_dish_id,
    (t.ord - 1)::integer,
    t.item -> 'name',
    (t.item ->> 'qty_metric')::numeric,
    t.item ->> 'unit_metric',
    (t.item ->> 'qty_us')::numeric,
    t.item ->> 'unit_us',
    nullif(t.item -> 'note', 'null'::jsonb)
  from jsonb_array_elements(p_items) with ordinality as t(item, ord);
end;
$$;

create function public.admin_replace_steps(p_dish_id uuid, p_items jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can edit recipes' using errcode = '42501';
  end if;

  delete from public.steps where dish_id = p_dish_id;

  insert into public.steps (dish_id, position, title, text, media_url, timer_seconds)
  select
    p_dish_id,
    (t.ord - 1)::integer,
    nullif(t.item -> 'title', 'null'::jsonb),
    t.item -> 'text',
    t.item ->> 'media_url',
    (t.item ->> 'timer_seconds')::integer
  from jsonb_array_elements(p_items) with ordinality as t(item, ord);
end;
$$;

revoke execute on function public.admin_replace_ingredients(uuid, jsonb) from public, anon;
revoke execute on function public.admin_replace_steps(uuid, jsonb) from public, anon;
grant execute on function public.admin_replace_ingredients(uuid, jsonb) to authenticated;
grant execute on function public.admin_replace_steps(uuid, jsonb) to authenticated;
