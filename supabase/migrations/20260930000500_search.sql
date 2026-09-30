-- Catalog search: dishes (name + story) and places, both languages,
-- accent-insensitive, prefix matching ("napo" finds Nápoles). SECURITY INVOKER,
-- so RLS still hides drafts and scheduled dishes.
create function public.search_catalog(p_query text, p_limit integer default 20)
returns table (
  kind text,
  id uuid,
  slug text,
  name jsonb,
  location_id uuid,
  access public.dish_access,
  rank real
)
language sql
stable
security invoker
set search_path = ''
as $$
  with terms as (
    select word
    from unnest(regexp_split_to_array(public.f_unaccent(lower(left(p_query, 100))), '[^a-z0-9]+')) as word
    where word <> ''
    limit 8
  ),
  q as (
    select to_tsquery('simple', string_agg(quote_literal(word) || ':*', ' & ')) as query
    from terms
    having count(*) > 0
  ),
  results as (
    select 'dish' as kind, d.id, d.slug, d.name, d.location_id, d.access,
      ts_rank(d.search_vector, q.query) as rank
    from public.dishes d, q
    where d.search_vector @@ q.query
    union all
    -- Places rank slightly higher so "Itália" lists the country before its dishes.
    select 'location', l.id, l.slug, l.name, l.id, null::public.dish_access,
      ts_rank(l.search_vector, q.query) * 1.2
    from public.locations l, q
    where l.search_vector @@ q.query
  )
  select * from results
  order by rank desc, name ->> 'pt'
  limit least(greatest(p_limit, 1), 50)
$$;

grant execute on function public.search_catalog(text, integer) to anon, authenticated;
