const SLOT_ORDER = ['pg', 'sg', 'sf', 'pf', 'c']

const getSupabaseSettings = () => {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim()
  const key = (
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim()

  if (!url || !key) {
    throw new Error('Supabase environment variables are missing.')
  }

  return { url: url.replace(/\/$/, ''), key }
}

const supabaseFetch = async (path) => {
  const { url, key } = getSupabaseSettings()
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Supabase request failed (${response.status}): ${body}`)
  }

  return response.json()
}

const resolvePlayerImage = (player) => {
  if (player.image_url_override) return player.image_url_override
  if (player.nba_player_id) {
    return `https://cdn.nba.com/headshots/nba/latest/1040x760/${player.nba_player_id}.png`
  }
  return player.image_url || ''
}

const getRosterPlayers = async (teamId, playerIds) => {
  if (!playerIds.length) return []

  const select = [
    'player_id',
    'display_name',
    'roster_position',
    'primary_position',
    'jersey_number',
    'image_url_override',
    'nba_player_id',
    'image_url',
  ].join(',')
  const ids = playerIds.join(',')

  const rows = await supabaseFetch(
    `active_team_roster?select=${encodeURIComponent(select)}` +
      `&team_id=eq.${encodeURIComponent(teamId)}` +
      `&player_id=in.(${encodeURIComponent(ids)})`,
  )

  const byId = new Map(rows.map((row) => [String(row.player_id), row]))

  return playerIds
    .map((id) => byId.get(String(id)))
    .filter(Boolean)
    .map((player) => ({
      id: player.player_id,
      name: player.display_name,
      position: player.roster_position || player.primary_position || '',
      number: player.jersey_number || '',
      image: resolvePlayerImage(player),
    }))
}

const normalizeLineup = async (lineup) => {
  const orderedRows = [...(lineup.lineup_players || [])].sort(
    (left, right) =>
      SLOT_ORDER.indexOf(String(left.slot).toLowerCase()) -
      SLOT_ORDER.indexOf(String(right.slot).toLowerCase()),
  )

  const players = await getRosterPlayers(
    lineup.team_id,
    orderedRows.map((row) => row.player_id),
  )

  return {
    id: lineup.id,
    name: lineup.name || 'Shared Lineup',
    teamId: lineup.team_id,
    team: lineup.teams || null,
    players,
  }
}

export const getSharedLineupMeta = async ({ lineupId, ownerId, teamId }) => {
  const select = [
    'id',
    'name',
    'team_id',
    'slot_index',
    'teams(city,name,abbreviation,primary_color,secondary_color,accent_color)',
    'lineup_players(player_id,slot)',
  ].join(',')

  let path = `lineups?select=${encodeURIComponent(select)}&is_public=eq.true`

  if (lineupId) {
    path += `&id=eq.${encodeURIComponent(lineupId)}&limit=1`
  } else {
    path +=
      `&user_id=eq.${encodeURIComponent(ownerId)}` +
      `&team_id=eq.${encodeURIComponent(teamId)}` +
      '&order=slot_index.asc&limit=6'
  }

  const rows = await supabaseFetch(path)
  if (!rows.length) return null

  const completeRows = rows.filter(
    (row) => Array.isArray(row.lineup_players) && row.lineup_players.length === 5,
  )
  if (!completeRows.length) return null

  const lineup = await normalizeLineup(completeRows[0])
  if (lineup.players.length !== 5) return null

  const teamName = lineup.team
    ? `${lineup.team.city || ''} ${lineup.team.name || ''}`.trim()
    : 'Washington Wizards'

  return {
    ...lineup,
    teamName,
    collectionCount: completeRows.length,
    isCollection: !lineupId,
  }
}
