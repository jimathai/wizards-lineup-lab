-- Persist each anonymous user's current Lineup Editor workspace.

begin;

create table if not exists public.lineup_editor_states
(
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id text not null references public.teams(id) on delete cascade,
  formation text not null default '2-1-2',
  starter_player_ids jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lineup_editor_states_user_team_unique
    unique (user_id, team_id)
);

create index if not exists ix_lineup_editor_states_user_id
  on public.lineup_editor_states(user_id);

alter table public.lineup_editor_states enable row level security;

drop policy if exists "Users can view their editor state"
  on public.lineup_editor_states;
drop policy if exists "Users can insert their editor state"
  on public.lineup_editor_states;
drop policy if exists "Users can update their editor state"
  on public.lineup_editor_states;
drop policy if exists "Users can delete their editor state"
  on public.lineup_editor_states;

create policy "Users can view their editor state"
on public.lineup_editor_states
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their editor state"
on public.lineup_editor_states
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their editor state"
on public.lineup_editor_states
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their editor state"
on public.lineup_editor_states
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant select, insert, update, delete
  on public.lineup_editor_states
  to authenticated;

notify pgrst, 'reload schema';

commit;

select
  id,
  user_id,
  team_id,
  formation,
  starter_player_ids,
  updated_at
from public.lineup_editor_states
order by updated_at desc;
