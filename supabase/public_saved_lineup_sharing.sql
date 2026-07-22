-- Public, read-only sharing for explicitly shared saved lineups.

begin;

alter table public.lineups
  alter column is_public set default false;

-- Owners retain their existing private read policy. These additional
-- policies expose only rows that the owner explicitly marked public.
drop policy if exists "Public lineups are readable"
  on public.lineups;

create policy "Public lineups are readable"
on public.lineups
for select
to anon, authenticated
using (is_public = true);

drop policy if exists "Players in public lineups are readable"
  on public.lineup_players;

create policy "Players in public lineups are readable"
on public.lineup_players
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.lineups l
    where l.id = lineup_players.lineup_id
      and l.is_public = true
  )
);

grant select on public.lineups to anon;
grant select on public.lineup_players to anon;
grant select on public.teams to anon;

notify pgrst, 'reload schema';

commit;

select
  id,
  name,
  team_id,
  slot_index,
  is_public,
  updated_at
from public.lineups
order by updated_at desc;
