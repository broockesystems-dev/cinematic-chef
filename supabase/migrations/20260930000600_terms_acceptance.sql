-- LGPD: record when the user accepted the terms. Sign-up happens through a
-- form that states "by continuing you accept the Terms and Privacy Policy",
-- so the profile creation time is the acceptance time.
alter table public.profiles
  add column terms_accepted_at timestamptz not null default now();
