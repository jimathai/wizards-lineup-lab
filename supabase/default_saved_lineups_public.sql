-- New saved lineups are public by default.
-- Existing saved lineups are made public once for this feature rollout.

begin;

alter table public.lineups
  alter column is_public set default true;

update public.lineups
set is_public = true
where is_public is distinct from true;

notify pgrst, 'reload schema';

commit;

select
  slot_index,
  name,
  is_public,
  updated_at
from public.lineups
order by user_id, team_id, slot_index;
