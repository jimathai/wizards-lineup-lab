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

export const loadLineupEditorState = async ({
  teamId,
  rosterPlayers,
}) => {
  ensureConfigured()

  const userId = await getCurrentUserId()

  const { data, error } = await supabase
    .from('lineup_editor_states')
    .select('formation, starter_player_ids')
    .eq('user_id', userId)
    .eq('team_id', teamId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const databaseToAppId = new Map(
    rosterPlayers
      .filter((player) => player.databaseId)
      .map((player) => [String(player.databaseId), player.id]),
  )

  return {
    formation: data.formation,
    starters: Object.fromEntries(
      Object.entries(data.starter_player_ids || {}).map(
        ([slot, databaseId]) => [
          slot,
          databaseId
            ? databaseToAppId.get(String(databaseId)) ?? null
            : null,
        ],
      ),
    ),
  }
}

export const persistLineupEditorState = async ({
  teamId,
  formation,
  starterDatabaseIds,
}) => {
  ensureConfigured()

  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('lineup_editor_states')
    .upsert(
      {
        user_id: userId,
        team_id: teamId,
        formation,
        starter_player_ids: starterDatabaseIds,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,team_id',
      },
    )

  if (error) throw error
}
