-- District Basketball Lab
-- Anonymous authentication + persistent six-slot saved lineups

begin;

-- Fixed saved-lineup slot number for each user/team.
alter table public.lineups
  add column if not exists slot_index integer;

alter table public.lineups
  add column if not exists previous_player_ids uuid[] not null default '{}';

alter table public.lineups
  alter column user_id set not null;

alter table public.lineups
  alter column team_id set not null;

alter table public.lineups
  alter column name set default 'Saved Lineup';

alter table public.lineups
  alter column season set default '2025-26';

alter table public.lineups
  alter column formation set default '2-1-2';

alter table public.lineups
  add constraint lineups_slot_index_range
  check (slot_index between 0 and 5) not valid;

alter table public.lineups
  validate constraint lineups_slot_index_range;

create unique index if not exists ux_lineups_user_team_slot
  on public.lineups(user_id, team_id, slot_index)
  where slot_index is not null;

create index if not exists ix_lineups_user_team
  on public.lineups(user_id, team_id);

create index if not exists ix_lineup_players_lineup
  on public.lineup_players(lineup_id);

-- Ensure lineup-player rows disappear with their parent lineup.
do $$
declare
  constraint_name text;
begin
  select conname
  into constraint_name
  from pg_constraint
  where conrelid = 'public.lineup_players'::regclass
    and confrelid = 'public.lineups'::regclass
    and contype = 'f'
  limit 1;

  if constraint_name is not null then
    execute format(
      'alter table public.lineup_players drop constraint %I',
      constraint_name
    );
  end if;

  alter table public.lineup_players
    add constraint lineup_players_lineup_id_fkey
    foreign key (lineup_id)
    references public.lineups(id)
    on delete cascade;
end;
$$;

alter table public.lineups enable row level security;
alter table public.lineup_players enable row level security;

-- Replace earlier lineup policies with owner-only policies.
drop policy if exists "Users can view their own lineups"
  on public.lineups;
drop policy if exists "Users can insert their own lineups"
  on public.lineups;
drop policy if exists "Users can update their own lineups"
  on public.lineups;
drop policy if exists "Users can delete their own lineups"
  on public.lineups;
drop policy if exists "Public lineups are readable"
  on public.lineups;

create policy "Users can view their own lineups"
on public.lineups
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own lineups"
on public.lineups
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own lineups"
on public.lineups
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own lineups"
on public.lineups
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can view players in their lineups"
  on public.lineup_players;
drop policy if exists "Users can insert players in their lineups"
  on public.lineup_players;
drop policy if exists "Users can update players in their lineups"
  on public.lineup_players;
drop policy if exists "Users can delete players in their lineups"
  on public.lineup_players;

create policy "Users can view players in their lineups"
on public.lineup_players
for select
to authenticated
using (
  exists (
    select 1
    from public.lineups l
    where l.id = lineup_players.lineup_id
      and l.user_id = (select auth.uid())
  )
);

create policy "Users can insert players in their lineups"
on public.lineup_players
for insert
to authenticated
with check (
  exists (
    select 1
    from public.lineups l
    where l.id = lineup_players.lineup_id
      and l.user_id = (select auth.uid())
  )
);

create policy "Users can update players in their lineups"
on public.lineup_players
for update
to authenticated
using (
  exists (
    select 1
    from public.lineups l
    where l.id = lineup_players.lineup_id
      and l.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.lineups l
    where l.id = lineup_players.lineup_id
      and l.user_id = (select auth.uid())
  )
);

create policy "Users can delete players in their lineups"
on public.lineup_players
for delete
to authenticated
using (
  exists (
    select 1
    from public.lineups l
    where l.id = lineup_players.lineup_id
      and l.user_id = (select auth.uid())
  )
);

grant select, insert, update, delete
  on public.lineups
  to authenticated;

grant select, insert, update, delete
  on public.lineup_players
  to authenticated;

notify pgrst, 'reload schema';

commit;

select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('lineups', 'lineup_players')
order by table_name, ordinal_position;
