import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabaseClient'

const ensureConfigured = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.')
  }
}

const getCurrentUserId = async () => {
  ensureConfigured()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) throw error
  if (!user) throw new Error('No authenticated user is available.')

  return user.id
}

const getAppIdMaps = (rosterPlayers) => {
  const databaseToApp = new Map()
  const appToDatabase = new Map()

  rosterPlayers.forEach((player) => {
    if (!player.databaseId) return
    databaseToApp.set(String(player.databaseId), player.id)
    appToDatabase.set(String(player.id), player.databaseId)
  })

  return { databaseToApp, appToDatabase }
}

export const loadSavedLineupSlots = async ({
  teamId,
  rosterPlayers,
  defaultLineups,
}) => {
  ensureConfigured()

  const userId = await getCurrentUserId()
  const { databaseToApp } = getAppIdMaps(rosterPlayers)

  const { data, error } = await supabase
    .from('lineups')
    .select(`
      id,
      name,
      slot_index,
      formation,
      is_public,
      previous_player_ids,
      lineup_players (
        player_id,
        slot
      )
    `)
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .order('slot_index')

  if (error) throw error

  const remoteBySlot = new Map(
    (data || []).map((lineup) => [lineup.slot_index, lineup]),
  )

  return defaultLineups.map((fallback, slotIndex) => {
    const remote = remoteBySlot.get(slotIndex)
    if (!remote) return fallback

    const orderedPlayers = [...(remote.lineup_players || [])].sort(
      (a, b) => String(a.slot).localeCompare(String(b.slot)),
    )

    return {
      ...fallback,
      databaseId: remote.id,
      isPublic: Boolean(remote.is_public),
      name: remote.name || fallback.name,
      playerIds: orderedPlayers
        .map((row) => databaseToApp.get(String(row.player_id)))
        .filter((value) => value != null),
      previousPlayerIds: (remote.previous_player_ids || [])
        .map((databaseId) => databaseToApp.get(String(databaseId)))
        .filter((value) => value != null),
    }
  })
}

export const persistSavedLineupSlot = async ({
  teamId,
  season,
  slotIndex,
  name,
  formation,
  playerDatabaseIds,
  previousPlayerDatabaseIds,
}) => {
  ensureConfigured()

  const userId = await getCurrentUserId()

  const { data: lineup, error: lineupError } = await supabase
    .from('lineups')
    .upsert(
      {
        user_id: userId,
        team_id: teamId,
        season,
        slot_index: slotIndex,
        name,
        formation,
        previous_player_ids: previousPlayerDatabaseIds,
        is_submitted: false,
      },
      {
        onConflict: 'user_id,team_id,slot_index',
      },
    )
    .select('id, is_public')
    .single()

  if (lineupError) throw lineupError

  const { error: deleteError } = await supabase
    .from('lineup_players')
    .delete()
    .eq('lineup_id', lineup.id)

  if (deleteError) throw deleteError

  if (!playerDatabaseIds.length) return lineup

  const starterSlots = ['pg', 'sg', 'sf', 'pf', 'c']

  const { error: playersError } = await supabase
    .from('lineup_players')
    .insert(
      playerDatabaseIds.map((playerId, index) => ({
        lineup_id: lineup.id,
        player_id: playerId,
        unit: 'starters',
        slot: starterSlots[index] || `slot-${index + 1}`,
      })),
    )

  if (playersError) throw playersError

  return lineup
}

export const renameSavedLineupSlot = async ({
  teamId,
  slotIndex,
  name,
}) => {
  ensureConfigured()

  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('lineups')
    .update({ name })
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .eq('slot_index', slotIndex)

  if (error) throw error
}


export const setSavedLineupVisibility = async ({
  teamId,
  slotIndex,
  isPublic,
}) => {
  ensureConfigured()

  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('lineups')
    .update({ is_public: isPublic })
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .eq('slot_index', slotIndex)
    .select('id, is_public')
    .single()

  if (error) throw error
  return data
}
