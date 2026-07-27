import {
  isSupabaseConfigured,
  supabase,
} from '../../lib/supabaseClient'
import { resolvePlayerImageUrl } from '../../config/playerImages'

const numberOrNull = (value) =>
  value == null || value === '' ? null : Number(value)

const inchesToDisplay = (value) => {
  const inches = numberOrNull(value)
  if (inches == null || Number.isNaN(inches)) return ''

  const feet = Math.floor(inches / 12)
  const remaining = Math.round((inches - feet * 12) * 100) / 100
  return `${feet}'${remaining}"`
}

const decimalToPercent = (value) => {
  const parsed = numberOrNull(value)
  if (parsed == null || Number.isNaN(parsed)) return null
  return parsed <= 1 ? parsed * 100 : parsed
}

const mapStats = (row) => ({
  pts: numberOrNull(row.points_per_game),
  reb: numberOrNull(row.rebounds_per_game),
  ast: numberOrNull(row.assists_per_game),
  stl: numberOrNull(row.steals_per_game),
  blk: numberOrNull(row.blocks_per_game),
  tov: numberOrNull(row.turnovers_per_game),
  threePm: numberOrNull(row.three_pointers_made_per_game),
  fgPct: decimalToPercent(row.field_goal_percentage),
  ftPct: decimalToPercent(row.free_throw_percentage),
  threePct: decimalToPercent(row.three_point_percentage),
  plusMinus: numberOrNull(row.plus_minus),
  trueShootingPct: decimalToPercent(row.true_shooting_percentage),
})

const mapRosterRow = (
  row,
  careerRow = null,
  playerProfile = null,
  currentExtra = null,
) => {
  const current = mapStats({ ...row, ...(currentExtra || {}) })
  const career = careerRow ? mapStats(careerRow) : null
  const appId = row.legacy_player_id ?? row.player_id

  return {
    id: appId,
    databaseId: row.player_id,
    slug: row.slug,
    name: row.display_name,
    number: row.jersey_number || '',
    team: `${row.team_city} ${row.team_name}`,
    pos: row.roster_position || row.primary_position || '',
    age: row.age ?? null,
    experience: row.experience ?? null,
    college: row.college_country || '',
    country: '',
    draftYear: playerProfile?.draft_year ?? row.draft_year ?? null,
    draftPick: playerProfile?.draft_pick ?? row.draft_pick ?? null,
    shootingHand:
      playerProfile?.shooting_hand || row.shooting_hand || '',
    height: inchesToDisplay(row.height_inches),
    weight: numberOrNull(row.weight_pounds),
    wingspan: inchesToDisplay(row.wingspan_inches),
    standingReach: inchesToDisplay(row.standing_reach_inches),
    vertical:
      row.vertical_inches == null ? '' : `${row.vertical_inches}"`,
    image: resolvePlayerImageUrl({
      imageUrlOverride: row.image_url_override,
      nbaPlayerId: row.nba_player_id,
      legacyImageUrl: row.image_url,
    }),
    archetype: row.archetype || null,
    statSource: row.stat_source_name || 'Supabase',
    current,
    career: career || current,
    apeIndex:
      row.ape_index_inches == null
        ? ''
        : `${Number(row.ape_index_inches) >= 0 ? '+' : ''}${row.ape_index_inches}"`,
  }
}

const ensureConfigured = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.',
    )
  }
}

const getRosterRows = async (teamId) => {
  ensureConfigured()

  let query = supabase
    .from('active_team_roster')
    .select('*')
    .order('display_name')

  if (teamId) query = query.eq('team_id', teamId)

  const { data, error } = await query

  if (error) throw error
  return data || []
}

const getCareerStatsByPlayerId = async (playerIds) => {
  ensureConfigured()

  if (!playerIds.length) return new Map()

  const { data, error } = await supabase
    .from('player_stats')
    .select('*')
    .in('player_id', playerIds)
    .eq('stat_type', 'career')

  if (error) throw error

  return new Map(
    (data || []).map((row) => [String(row.player_id), row]),
  )
}

const getPlayerProfilesById = async (playerIds) => {
  if (!playerIds.length) return new Map()

  const { data, error } = await supabase
    .from('players')
    .select('id,draft_year,draft_pick,shooting_hand')
    .in('id', playerIds)

  if (error) throw error
  return new Map((data || []).map((row) => [String(row.id), row]))
}

const getCurrentExtrasByPlayerId = async (playerIds) => {
  if (!playerIds.length) return new Map()

  const { data, error } = await supabase
    .from('player_stats')
    .select('player_id,season,plus_minus,true_shooting_percentage')
    .in('player_id', playerIds)
    .eq('stat_type', 'current')
    .order('season', { ascending: false })

  if (error) throw error

  const result = new Map()
  for (const row of data || []) {
    const key = String(row.player_id)
    if (!result.has(key)) result.set(key, row)
  }
  return result
}

const mapRosterRows = async (rows) => {
  const playerIds = rows.map((row) => row.player_id)
  const [careerStatsByPlayerId, playerProfilesById, currentExtrasByPlayerId] =
    await Promise.all([
      getCareerStatsByPlayerId(playerIds),
      getPlayerProfilesById(playerIds),
      getCurrentExtrasByPlayerId(playerIds),
    ])

  return rows.map((row) => {
    const key = String(row.player_id)
    return mapRosterRow(
      row,
      careerStatsByPlayerId.get(key) || null,
      playerProfilesById.get(key) || null,
      currentExtrasByPlayerId.get(key) || null,
    )
  })
}

export const supabasePlayerProvider = {
  async getPlayers() {
    const rows = await getRosterRows()
    return mapRosterRows(rows)
  },

  async getPlayerById(playerId) {
    const rows = await getRosterRows()
    const id = String(playerId)
    const row = rows.find(
      (candidate) =>
        String(candidate.legacy_player_id) === id ||
        String(candidate.player_id) === id,
    )

    if (!row) return null

    const mappedRows = await mapRosterRows([row])
    return mappedRows[0] || null
  },

  async getTeamRoster(team) {
    if (!team?.id) return []
    const rows = await getRosterRows(team.id)
    return mapRosterRows(rows)
  },
}
