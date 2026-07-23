-- District Basketball Lab: configurable NBA headshots
-- Run this once in the Supabase SQL Editor.

-- nba_player_id already identifies official NBA players.
-- This optional override is for rookies, custom artwork, or players without
-- an NBA CDN image.
alter table public.players
    add column if not exists image_url_override text;

-- Preserve existing custom/non-NBA images as explicit overrides.
-- Existing NBA CDN URLs do not need to be stored because the app now builds
-- them from nba_player_id and VITE_NBA_HEADSHOT_BASE_URL.
update public.players
set image_url_override = image_url
where image_url_override is null
  and nullif(trim(image_url), '') is not null
  and image_url not like 'https://cdn.nba.com/headshots/nba/latest/%';

-- Rebuild the API-facing roster view so the browser receives the NBA ID and
-- optional image override. image_url remains temporarily for backward
-- compatibility and fallback behavior.
drop view if exists public.active_team_roster;

create view public.active_team_roster
with (security_invoker = true)
as
select
    tr.id as roster_id,
    tr.team_id,
    tr.season,
    tr.jersey_number,
    tr.roster_position,
    tr.roster_status,

    p.id as player_id,
    p.legacy_player_id,
    p.slug,
    p.first_name,
    p.last_name,
    p.display_name,
    p.primary_position,
    p.secondary_position,
    p.archetype,
    p.birth_date,
    p.age,
    p.experience_years as experience,
    p.college_country,
    p.image_url,
    p.image_url_override,
    p.nba_player_id,

    pm.height_inches,
    pm.weight_pounds,
    pm.vertical_inches,
    pm.wingspan_inches,
    pm.standing_reach_inches,
    pm.ape_index_inches,

    ps.games_played,
    ps.games_started,
    ps.minutes_per_game,
    ps.points_per_game,
    ps.rebounds_per_game,
    ps.assists_per_game,
    ps.steals_per_game,
    ps.blocks_per_game,
    ps.turnovers_per_game,
    ps.three_pointers_made_per_game,
    ps.field_goal_percentage,
    ps.free_throw_percentage,
    ps.three_point_percentage,
    ps.source_name as stat_source_name,

    t.city as team_city,
    t.name as team_name,
    t.abbreviation as team_abbreviation,
    t.logo_url as team_logo_url,
    t.primary_color,
    t.secondary_color,
    t.accent_color,
    t.alternate_color

from public.team_rosters tr
join public.players p on p.id = tr.player_id
join public.teams t on t.id = tr.team_id
left join public.player_measurements pm
    on pm.player_id = p.id and pm.is_current = true
left join public.player_stats ps
    on ps.player_id = p.id
   and ps.team_id = tr.team_id
   and ps.season = tr.season
   and ps.stat_type = 'season'
where tr.is_active = true
  and p.is_active = true
  and t.is_active = true;

grant select on public.active_team_roster to anon, authenticated;
notify pgrst, 'reload schema';

-- Optional verification
select
    display_name,
    nba_player_id,
    image_url_override
from public.active_team_roster
order by display_name;
