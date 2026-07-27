-- District Basketball Lab player-data admin
-- Run this in Supabase SQL Editor before opening /admin.

begin;

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Security-definer helper prevents policy recursion and keeps the check
-- centralized for all admin-managed tables.
create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_admin = true
  );
$$;

revoke all on function public.current_user_is_admin() from public;
grant execute on function public.current_user_is_admin()
  to authenticated;

-- An authenticated user can read only their own profile. Admin users may
-- read profiles so the application can verify access.
alter table public.profiles enable row level security;

drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or public.current_user_is_admin()
);

-- Admin CRUD policies.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'players',
    'team_rosters',
    'player_measurements',
    'player_stats',
    'teams'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);

    execute format(
      'drop policy if exists %I on public.%I',
      'Admins can manage ' || table_name,
      table_name
    );

    execute format(
      'create policy %I on public.%I for all to authenticated using (public.current_user_is_admin()) with check (public.current_user_is_admin())',
      'Admins can manage ' || table_name,
      table_name
    );
  end loop;
end
$$;

grant select, insert, update, delete
  on public.players,
     public.team_rosters,
     public.player_measurements,
     public.player_stats
  to authenticated;

grant select, insert, update, delete
  on public.teams
  to authenticated;

-- Public image bucket for custom player headshots.
insert into storage.buckets (id, name, public)
values ('player-images', 'player-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public player images are readable"
  on storage.objects;
create policy "Public player images are readable"
on storage.objects
for select
to public
using (bucket_id = 'player-images');

drop policy if exists "Admins can upload player images"
  on storage.objects;
create policy "Admins can upload player images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'player-images'
  and public.current_user_is_admin()
);

drop policy if exists "Admins can update player images"
  on storage.objects;
create policy "Admins can update player images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'player-images'
  and public.current_user_is_admin()
)
with check (
  bucket_id = 'player-images'
  and public.current_user_is_admin()
);

drop policy if exists "Admins can delete player images"
  on storage.objects;
create policy "Admins can delete player images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'player-images'
  and public.current_user_is_admin()
);

notify pgrst, 'reload schema';

commit;

-- IMPORTANT:
-- 1. Create your email/password user in Authentication > Users.
-- 2. Replace the email below and run this statement once.
--
-- update public.profiles
-- set is_admin = true
-- where id = (
--   select id from auth.users where email = 'YOUR-EMAIL@example.com'
-- );
