-- Restore distinct Career statistics for the Wizards.
-- Run once in Supabase SQL Editor.

begin;

with career_source
(
  slug,
  points_per_game,
  rebounds_per_game,
  assists_per_game,
  steals_per_game,
  blocks_per_game,
  turnovers_per_game,
  three_pointers_made_per_game,
  field_goal_percentage,
  free_throw_percentage,
  three_point_percentage
)
as
(
  values
  (
  'bilal-coulibaly',
  10.8,
  4.5,
  2.6,
  1.2,
  0.8,
  1.6,
  1.1,
  42.6,
  73.4,
  31.3
),
  (
  'tristan-vukcevic',
  9.1,
  3.3,
  1.1,
  0.4,
  0.7,
  1.2,
  1.0,
  48.1,
  78.0,
  34.8
),
  (
  'cam-whitmore',
  10.5,
  3.3,
  0.8,
  0.6,
  0.3,
  0.9,
  1.3,
  45.0,
  71.2,
  34.9
),
  (
  'trae-young',
  25.3,
  3.5,
  9.8,
  1.0,
  0.2,
  null,
  null,
  null,
  null,
  null
),
  (
  'aj-dybantsa',
  25.5,
  6.8,
  3.7,
  1.1,
  0.3,
  3.1,
  null,
  51.0,
  77.4,
  33.1
),
  (
  'jamir-watkins',
  7.4,
  3.9,
  1.3,
  null,
  null,
  null,
  null,
  44.6,
  null,
  null
),
  (
  'deandre-ayton',
  15.8,
  10.1,
  1.5,
  0.7,
  1.0,
  1.6,
  0.1,
  59.9,
  74.1,
  23.0
),
  (
  'bub-carrington',
  10.3,
  3.8,
  4.5,
  0.6,
  0.2,
  2.0,
  1.9,
  41.2,
  76.5,
  37.4
),
  (
  'justin-champagnie',
  7.1,
  4.6,
  1.0,
  0.8,
  0.5,
  0.6,
  0.8,
  49.4,
  75.9,
  34.6
),
  (
  'tre-johnson',
  12.2,
  2.8,
  2.0,
  0.6,
  0.3,
  1.6,
  1.9,
  41.9,
  87.4,
  35.8
),
  (
  'kyshawn-george',
  11.2,
  4.6,
  3.3,
  1.0,
  0.8,
  1.9,
  null,
  40.6,
  78.1,
  34.7
),
  (
  'khris-middleton',
  16.1,
  4.7,
  3.9,
  1.1,
  0.2,
  2.1,
  null,
  45.8,
  87.8,
  38.5
),
  (
  'alex-sarr',
  14.4,
  6.9,
  2.5,
  0.7,
  1.7,
  1.7,
  1.3,
  43.3,
  68.5,
  31.6
),
  (
  'anthony-davis',
  24.0,
  10.7,
  2.6,
  1.3,
  2.3,
  2.0,
  0.5,
  52.2,
  79.3,
  29.5
),
  (
  'will-riley',
  10.3,
  2.9,
  2.0,
  0.7,
  0.1,
  1.3,
  1.1,
  43.9,
  80.0,
  31.6
),
  (
  'felix-okpara',
  8.0,
  6.3,
  0.5,
  0.4,
  1.5,
  null,
  null,
  59.7,
  63.5,
  36.4
),
  (
  'julian-reese',
  11.8,
  10.5,
  1.8,
  1.4,
  0.6,
  2.5,
  0.0,
  52.9,
  63.6,
  0.0
)
)
insert into public.player_stats
(
  player_id,
  team_id,
  season,
  competition,
  stat_type,
  points_per_game,
  rebounds_per_game,
  assists_per_game,
  steals_per_game,
  blocks_per_game,
  turnovers_per_game,
  three_pointers_made_per_game,
  field_goal_percentage,
  free_throw_percentage,
  three_point_percentage,
  source_name,
  source_updated_at
)
select
  p.id,
  'wizards',
  'career',
  case
    when p.slug in ('aj-dybantsa', 'felix-okpara') then 'college'
    else 'nba'
  end,
  'career',
  cs.points_per_game,
  cs.rebounds_per_game,
  cs.assists_per_game,
  cs.steals_per_game,
  cs.blocks_per_game,
  cs.turnovers_per_game,
  cs.three_pointers_made_per_game,
  cs.field_goal_percentage,
  cs.free_throw_percentage,
  cs.three_point_percentage,
  'District Basketball Lab career dataset',
  now()
from career_source cs
inner join public.players p
  on p.slug = cs.slug
on conflict
(
  player_id,
  team_id,
  season,
  competition,
  stat_type
)
do update set
  points_per_game = excluded.points_per_game,
  rebounds_per_game = excluded.rebounds_per_game,
  assists_per_game = excluded.assists_per_game,
  steals_per_game = excluded.steals_per_game,
  blocks_per_game = excluded.blocks_per_game,
  turnovers_per_game = excluded.turnovers_per_game,
  three_pointers_made_per_game = excluded.three_pointers_made_per_game,
  field_goal_percentage = excluded.field_goal_percentage,
  free_throw_percentage = excluded.free_throw_percentage,
  three_point_percentage = excluded.three_point_percentage,
  source_name = excluded.source_name,
  source_updated_at = excluded.source_updated_at,
  updated_at = now();

grant select on public.player_stats to anon, authenticated;
notify pgrst, 'reload schema';

commit;

select
  p.display_name,
  ps.stat_type,
  ps.points_per_game,
  ps.rebounds_per_game,
  ps.assists_per_game
from public.player_stats ps
inner join public.players p
  on p.id = ps.player_id
where ps.team_id = 'wizards'
  and ps.stat_type in ('season', 'career')
order by p.display_name, ps.stat_type;
