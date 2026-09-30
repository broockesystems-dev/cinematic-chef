-- Public bucket for covers, step photos and .vtt subtitles. None of these
-- are premium on their own; premium video is protected by Mux signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'text/vtt']
);

create policy "Admins read media objects"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

create policy "Admins upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "Admins update media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

create policy "Admins delete media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
