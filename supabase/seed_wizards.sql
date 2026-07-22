-- District Basketball Lab: Wizards seed and roster view update
-- Run after the corrected teams/players schema migration.

alter table public.players add column if not exists legacy_player_id bigint;
alter table public.players add column if not exists age integer;
alter table public.players add column if not exists experience_years integer;
create unique index if not exists ux_players_legacy_player_id
    on public.players(legacy_player_id)
    where legacy_player_id is not null;

-- Keep the official roster data read-only to browser clients.


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    '22f3383c-7e65-5a3b-a191-a54b8a860056'::uuid, 1641731, 'bilal-coulibaly', 'Bilal', 'Coulibaly', 'Bilal Coulibaly',
    'G', 'F', null, 21,
    3, 'France', 'https://cdn.nba.com/headshots/nba/latest/260x190/1641731.png', 1641731,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '0', 'G/F',
    'active', true
from public.players
where slug = 'bilal-coulibaly'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    11.7, 4.3, 2.6,
    1.3, 1.0, 1.4,
    1.2, 42.5,
    74.6, 31.9,
    '2025-26 NBA / career through 2025-26', now()
from public.players
where slug = 'bilal-coulibaly'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'bilal-coulibaly')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 78.5, 195, 38.5, 86.25, 106.0,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'bilal-coulibaly';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    '6b759e9c-34cc-550c-b523-857e5fd5a12e'::uuid, 1641774, 'tristan-vukcevic', 'Tristan', 'Vukcevic', 'Tristan Vukcevic',
    'F', 'C', null, 23,
    3, 'Italy', 'https://cdn.nba.com/headshots/nba/latest/260x190/1641774.png', 1641774,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '00', 'F/C',
    'active', true
from public.players
where slug = 'tristan-vukcevic'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    9.0, 3.0, 1.1,
    0.5, 0.7, 1.3,
    1.0, 48.0,
    78.4, 34.7,
    '2025-26 NBA / career through 2025-26', now()
from public.players
where slug = 'tristan-vukcevic'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'tristan-vukcevic')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 83.0, 223, null, 86.5, 110.0,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'tristan-vukcevic';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    '88305461-ce8d-546a-8320-b035e439c57e'::uuid, 1641715, 'cam-whitmore', 'Cam', 'Whitmore', 'Cam Whitmore',
    'F', null, null, 22,
    3, 'Villanova', 'https://cdn.nba.com/headshots/nba/latest/260x190/1641715.png', 1641715,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '1', 'F',
    'active', true
from public.players
where slug = 'cam-whitmore'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    9.2, 2.8, 0.7,
    0.7, 0.4, 0.9,
    0.8, 45.6,
    74.2, 28.6,
    '2025-26 NBA / career through 2025-26', now()
from public.players
where slug = 'cam-whitmore'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'cam-whitmore')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 77.75, 235, 40.5, 80.5, 102.0,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'cam-whitmore';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    '91214092-424a-5a22-a233-24c3cdb44218'::uuid, 1629027, 'trae-young', 'Trae', 'Young', 'Trae Young',
    'G', null, null, 27,
    8, 'Oklahoma', 'https://cdn.nba.com/headshots/nba/latest/260x190/1629027.png', 1629027,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '3', 'G',
    'active', true
from public.players
where slug = 'trae-young'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    17.9, 2.0, 8.0,
    0.9, 0.1, 2.6,
    1.8, 45.8,
    82.5, 33.8,
    '2025-26 NBA / career through 2025-26', now()
from public.players
where slug = 'trae-young'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'trae-young')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 73.5, 164, 35.0, 75.5, 97.0,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'trae-young';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    '3566ff90-8e15-5e44-bc4d-e2458ab11e2a'::uuid, 1643407, 'aj-dybantsa', 'AJ', 'Dybantsa', 'AJ Dybantsa',
    'F', null, null, 19,
    0, 'BYU', 'https://pbs.twimg.com/media/HLmH9ChWoAAp3nU.jpg', 1643407,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '4', 'F',
    'active', true
from public.players
where slug = 'aj-dybantsa'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    25.5, 6.8, 3.7,
    1.1, 0.3, 3.1,
    1.4, 51.0,
    77.4, 33.1,
    '2025-26 BYU', now()
from public.players
where slug = 'aj-dybantsa'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'aj-dybantsa')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 80.5, 217, 42.0, 84.5, 106.0,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'aj-dybantsa';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    '6687a1c8-ca02-5bb5-b026-e9cdf3ec0f04'::uuid, 1642364, 'jamir-watkins', 'Jamir', 'Watkins', 'Jamir Watkins',
    'F', null, null, 25,
    1, 'Florida State', 'https://cdn.nba.com/headshots/nba/latest/260x190/1642364.png', 1642364,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '5', 'F',
    'active', true
from public.players
where slug = 'jamir-watkins'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    7.4, 3.9, 1.3,
    1.1, 0.5, 0.8,
    0.9, 44.6,
    69.5, 29.7,
    '2025-26 NBA / career through 2025-26', now()
from public.players
where slug = 'jamir-watkins'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'jamir-watkins')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 77.5, 215, 39.5, 83.25, 104.0,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'jamir-watkins';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    '008933a7-357e-565b-a086-a80554cbfc11'::uuid, 1629028, 'deandre-ayton', 'Deandre', 'Ayton', 'Deandre Ayton',
    'C', null, null, 27,
    8, 'Arizona', 'https://cdn.nba.com/headshots/nba/latest/260x190/1629028.png', 1629028,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '5', 'C',
    'active', true
from public.players
where slug = 'deandre-ayton'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    12.5, 8.0, 0.8,
    0.6, 1.0, 1.2,
    0.0, 67.1,
    64.5, 0.0,
    '2025-26 NBA / career through 2025-26', now()
from public.players
where slug = 'deandre-ayton'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'deandre-ayton')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 84.25, 250, 43.5, 89.5, 111.0,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'deandre-ayton';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    'ef2208ab-90c7-5013-9dc5-1f2e5ef02b72'::uuid, 1642267, 'bub-carrington', 'Bub', 'Carrington', 'Bub Carrington',
    'G', null, null, 20,
    2, 'Pitt', 'https://cdn.nba.com/headshots/nba/latest/260x190/1642267.png', 1642267,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '7', 'G',
    'active', true
from public.players
where slug = 'bub-carrington'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    10.7, 3.4, 4.6,
    0.6, 0.2, 2.3,
    2.1, 42.4,
    73.0, 40.8,
    '2025-26 NBA / career through 2025-26', now()
from public.players
where slug = 'bub-carrington'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'bub-carrington')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 76.75, 195, 37.5, 80.0, 100.0,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'bub-carrington';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    'd1e0a51c-3d7d-5f9b-ab76-4de132a64939'::uuid, 1630551, 'justin-champagnie', 'Justin', 'Champagnie', 'Justin Champagnie',
    'G', 'F', null, 25,
    5, 'Pitt', 'https://cdn.nba.com/headshots/nba/latest/260x190/1630551.png', 1630551,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '9', 'G/F',
    'active', true
from public.players
where slug = 'justin-champagnie'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    8.7, 5.6, 1.2,
    0.9, 0.6, 0.7,
    0.8, 50.2,
    78.4, 31.9,
    '2025-26 NBA / career through 2025-26', now()
from public.players
where slug = 'justin-champagnie'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'justin-champagnie')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 78.0, 206, 39.0, 83.5, 103.5,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'justin-champagnie';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    '322c74c6-8d0d-5bb8-b2e6-9e0aa68f82e6'::uuid, 1642848, 'tre-johnson', 'Tre', 'Johnson', 'Tre Johnson',
    'G', null, null, 20,
    1, 'Texas', 'https://cdn.nba.com/headshots/nba/latest/260x190/1642848.png', 1642848,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '12', 'G',
    'active', true
from public.players
where slug = 'tre-johnson'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    12.2, 2.8, 2.0,
    0.6, 0.3, 1.6,
    1.9, 41.9,
    87.4, 35.8,
    '2025-26 NBA / career through 2025-26', now()
from public.players
where slug = 'tre-johnson'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'tre-johnson')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 77.75, 190, null, 81.75, 102.0,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'tre-johnson';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    '76c2bcca-be6b-582b-96d7-cb9d5956010a'::uuid, 1642273, 'kyshawn-george', 'Kyshawn', 'George', 'Kyshawn George',
    'F', null, null, 22,
    2, 'Miami', 'https://cdn.nba.com/headshots/nba/latest/260x190/1642273.png', 1642273,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '18', 'F',
    'active', true
from public.players
where slug = 'kyshawn-george'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    14.8, 5.1, 4.5,
    1.0, 0.9, 2.6,
    2.1, 43.8,
    80.2, 38.1,
    '2025-26 NBA / career through 2025-26', now()
from public.players
where slug = 'kyshawn-george'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'kyshawn-george')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 79.75, 209, 35.5, 83.0, 105.0,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'kyshawn-george';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    '51149a16-df30-5065-8922-768cb9561d00'::uuid, 203114, 'khris-middleton', 'Khris', 'Middleton', 'Khris Middleton',
    'F', null, null, 34,
    14, 'Texas A&M', 'https://cdn.nba.com/headshots/nba/latest/260x190/203114.png', 203114,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '20', 'F',
    'active', true
from public.players
where slug = 'khris-middleton'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    10.2, 3.7, 2.8,
    0.7, 0.1, 1.7,
    1.1, 42.0,
    87.5, 36.0,
    '2025-26 NBA / career through 2025-26', now()
from public.players
where slug = 'khris-middleton'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'khris-middleton')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 79.5, 222, 31.5, 83.25, 104.5,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'khris-middleton';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    '24a1e763-d48b-5ed6-97ec-3b615aa52551'::uuid, 1642259, 'alex-sarr', 'Alex', 'Sarr', 'Alex Sarr',
    'C', null, null, 21,
    2, 'France', 'https://cdn.nba.com/headshots/nba/latest/260x190/1642259.png', 1642259,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '20', 'C',
    'active', true
from public.players
where slug = 'alex-sarr'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    16.3, 7.4, 2.7,
    0.8, 2.0, 1.7,
    1.0, 48.2,
    69.2, 33.3,
    '2025-26 NBA / career through 2025-26', now()
from public.players
where slug = 'alex-sarr'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'alex-sarr')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 83.75, 224, 37.0, 88.5, 110.5,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'alex-sarr';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    '4db75956-ab41-5e93-a0a7-955a5b0e81f5'::uuid, 203076, 'anthony-davis', 'Anthony', 'Davis', 'Anthony Davis',
    'F', 'C', null, 33,
    14, 'Kentucky', 'https://cdn.nba.com/headshots/nba/latest/260x190/203076.png', 203076,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '23', 'F/C',
    'active', true
from public.players
where slug = 'anthony-davis'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    20.4, 11.1, 2.8,
    1.1, 1.7, 2.1,
    0.5, 50.6,
    72.8, 27.0,
    '2025-26 NBA / career through 2025-26', now()
from public.players
where slug = 'anthony-davis'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'anthony-davis')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 82.25, 253, 35.5, 89.5, 108.0,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'anthony-davis';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    '0058b92c-85f9-5bfd-9783-47f012605702'::uuid, 1642860, 'will-riley', 'Will', 'Riley', 'Will Riley',
    'F', null, null, 20,
    1, 'Illinois', 'https://cdn.nba.com/headshots/nba/latest/260x190/1642860.png', 1642860,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '27', 'F',
    'active', true
from public.players
where slug = 'will-riley'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    10.3, 2.9, 2.0,
    0.7, 0.1, 1.3,
    1.1, 43.9,
    80.0, 31.6,
    '2025-26 NBA / career through 2025-26', now()
from public.players
where slug = 'will-riley'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'will-riley')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 80.25, 186, 36.0, 80.75, 104.5,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'will-riley';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    '4dc0081c-5e2c-52b8-a605-162a309c19ce'::uuid, 1643590, 'felix-okpara', 'Felix', 'Okpara', 'Felix Okpara',
    'C', null, null, 22,
    0, 'Tennessee', 'https://s.yimg.com/lo/mysterio/api/f1517d06dd52101ea17a700fc1bf35d7da21c65d9ea7fc1b20247937b59873bd/lightyear_networkapi/resizefill_w1200;quality_80;format_webp/https:%2F%2Fmedia.zenfs.com%2Fen%2Fvols_wire_usa_today_articles_138%2F1dd0a3b8b2367e4794d2575cf50a2288', 1643590,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '', 'C',
    'active', true
from public.players
where slug = 'felix-okpara'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    8.0, 6.3, 0.5,
    0.4, 1.5, 1.0,
    0.1, 59.7,
    63.5, 36.4,
    '2025-26 Tennessee', now()
from public.players
where slug = 'felix-okpara'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'felix-okpara')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 82.0, 242, 34.5, 86.5, 112.0,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'felix-okpara';


insert into public.players
(
    id, legacy_player_id, slug, first_name, last_name, display_name,
    primary_position, secondary_position, archetype, age,
    experience_years, college_country, image_url, nba_player_id,
    is_active
)
values
(
    '5cc68096-8fb5-5ad0-9c78-924f52e5fb79'::uuid, 1642882, 'julian-reese', 'Julian', 'Reese', 'Julian Reese',
    'F', null, null, 23,
    1, 'Maryland', 'https://cdn.nba.com/headshots/nba/latest/260x190/1642882.png', 1642882,
    true
)
on conflict (slug) do update set
    legacy_player_id = excluded.legacy_player_id,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    display_name = excluded.display_name,
    primary_position = excluded.primary_position,
    secondary_position = excluded.secondary_position,
    age = excluded.age,
    experience_years = excluded.experience_years,
    college_country = excluded.college_country,
    image_url = excluded.image_url,
    nba_player_id = excluded.nba_player_id,
    is_active = true,
    updated_at = now();

insert into public.team_rosters
(
    team_id, player_id, season, jersey_number, roster_position,
    roster_status, is_active
)
select
    'wizards', id, '2025-26', '', 'F',
    'active', true
from public.players
where slug = 'julian-reese'
on conflict (team_id, player_id, season) do update set
    jersey_number = excluded.jersey_number,
    roster_position = excluded.roster_position,
    roster_status = excluded.roster_status,
    is_active = true,
    updated_at = now();


insert into public.player_stats
(
    player_id, team_id, season, competition, stat_type,
    points_per_game, rebounds_per_game, assists_per_game,
    steals_per_game, blocks_per_game, turnovers_per_game,
    three_pointers_made_per_game, field_goal_percentage,
    free_throw_percentage, three_point_percentage,
    source_name, source_updated_at
)
select
    id, 'wizards', '2025-26',
    'nba',
    'season',
    11.8, 10.5, 1.8,
    1.4, 0.6, 2.5,
    0.0, 52.9,
    63.6, 0.0,
    '2025-26 Washington Wizards', now()
from public.players
where slug = 'julian-reese'
on conflict (player_id, team_id, season, competition, stat_type)
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
    source_updated_at = now(),
    updated_at = now();


delete from public.player_measurements
where player_id = (select id from public.players where slug = 'julian-reese')
  and is_current = true;

insert into public.player_measurements
(
    player_id, height_inches, weight_pounds, vertical_inches,
    wingspan_inches, standing_reach_inches, measurement_type,
    source_name, notes, is_current
)
select
    id, 80.75, 252, null, 86.25, 109.0,
    'verified', 'District Basketball Lab measurements workbook',
    'Imported from the Wizards measurements workbook and verified roster data.',
    true
from public.players
where slug = 'julian-reese';


-- Rebuild the API-facing roster view with legacy app IDs and display metadata.
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

select team_id, season, count(*) as roster_count
from public.active_team_roster
group by team_id, season;
