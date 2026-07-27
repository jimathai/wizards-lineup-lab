-- Expanded Player Focus fields
-- Safe to run more than once.

begin;

alter table public.players
  add column if not exists draft_year integer,
  add column if not exists draft_pick integer,
  add column if not exists shooting_hand text;

alter table public.player_stats
  add column if not exists plus_minus numeric(8,2),
  add column if not exists true_shooting_percentage numeric(8,3);

-- Keep shooting-hand values predictable while allowing nulls.
alter table public.players
  drop constraint if exists players_shooting_hand_check;

alter table public.players
  add constraint players_shooting_hand_check
  check (
    shooting_hand is null
    or lower(shooting_hand) in ('right', 'left', 'both')
  );

notify pgrst, 'reload schema';
commit;

-- Examples after the migration:
-- update public.players
-- set draft_year = 2024, draft_pick = 7, shooting_hand = 'Right'
-- where slug = 'player-slug';
--
-- update public.player_stats
-- set plus_minus = 2.4, true_shooting_percentage = 61.8
-- where player_id = '<uuid>' and stat_type = 'current';
