import { supabase } from '../lib/supabaseClient'
import { supabasePlayerProvider } from './playerData/supabasePlayerProvider'

const SLOT_ORDER = ['pg', 'sg', 'sf', 'pf', 'c']

export const getPublicSharedLineup = async (lineupId) => {
  const { data: lineup, error } = await supabase
    .from('lineups')
    .select(`
      id,
      name,
      team_id,
      season,
      formation,
      updated_at,
      teams (
        id,
        city,
        name,
        abbreviation,
        logo_url,
        primary_color,
        secondary_color,
        accent_color
      ),
      lineup_players (
        player_id,
        slot
      )
    `)
    .eq('id', lineupId)
    .eq('is_public', true)
    .maybeSingle()

  if (error) throw error
  if (!lineup) return null

  const roster = await supabasePlayerProvider.getTeamRoster({
    id: lineup.team_id,
  })

  const playerByDatabaseId = new Map(
    roster.map((player) => [String(player.databaseId), player]),
  )

  const orderedRows = [...(lineup.lineup_players || [])].sort(
    (left, right) =>
      SLOT_ORDER.indexOf(String(left.slot).toLowerCase()) -
      SLOT_ORDER.indexOf(String(right.slot).toLowerCase()),
  )

  const playersBySlot = Object.fromEntries(
    orderedRows.map((row) => [
      String(row.slot).toUpperCase(),
      playerByDatabaseId.get(String(row.player_id)) || null,
    ]),
  )

  return {
    id: lineup.id,
    name: lineup.name,
    season: lineup.season,
    formation: lineup.formation || '2-1-2',
    updatedAt: lineup.updated_at,
    team: lineup.teams || {
      id: lineup.team_id,
      city: '',
      name: lineup.team_id,
      abbreviation: lineup.team_id.toUpperCase(),
    },
    playersBySlot,
    players: SLOT_ORDER
      .map((slot) => playersBySlot[slot.toUpperCase()])
      .filter(Boolean),
  }
}


const mapPublicLineup = (lineup, roster) => {
  const playerByDatabaseId = new Map(
    roster.map((player) => [String(player.databaseId), player]),
  )

  const orderedRows = [...(lineup.lineup_players || [])].sort(
    (left, right) =>
      SLOT_ORDER.indexOf(String(left.slot).toLowerCase()) -
      SLOT_ORDER.indexOf(String(right.slot).toLowerCase()),
  )

  const playersBySlot = Object.fromEntries(
    orderedRows.map((row) => [
      String(row.slot).toUpperCase(),
      playerByDatabaseId.get(String(row.player_id)) || null,
    ]),
  )

  return {
    id: lineup.id,
    name: lineup.name,
    slotIndex: lineup.slot_index,
    season: lineup.season,
    formation: lineup.formation || '2-1-2',
    updatedAt: lineup.updated_at,
    team: lineup.teams || {
      id: lineup.team_id,
      city: '',
      name: lineup.team_id,
      abbreviation: lineup.team_id.toUpperCase(),
    },
    playersBySlot,
    players: SLOT_ORDER
      .map((slot) => playersBySlot[slot.toUpperCase()])
      .filter(Boolean),
  }
}

export const getPublicSharedLineups = async ({
  ownerId,
  teamId,
}) => {
  const { data, error } = await supabase
    .from('lineups')
    .select(`
      id,
      name,
      user_id,
      team_id,
      slot_index,
      season,
      formation,
      updated_at,
      teams (
        id,
        city,
        name,
        abbreviation,
        logo_url,
        primary_color,
        secondary_color,
        accent_color
      ),
      lineup_players (
        player_id,
        slot
      )
    `)
    .eq('user_id', ownerId)
    .eq('team_id', teamId)
    .eq('is_public', true)
    .order('slot_index')

  if (error) throw error
  if (!data?.length) return []

  const roster = await supabasePlayerProvider.getTeamRoster({
    id: teamId,
  })

  return data
    .map((lineup) => mapPublicLineup(lineup, roster))
    .filter((lineup) => lineup.players.length === 5)
    .slice(0, 6)
}
