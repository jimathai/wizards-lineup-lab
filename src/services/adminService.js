import {
  isSupabaseConfigured,
  supabase,
} from '../lib/supabaseClient'

const ensureConfigured = () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured.')
  }
}

const nullableNumber = (value) =>
  value === '' || value === null || value === undefined
    ? null
    : Number(value)

export const signInAdmin = async ({ email, password }) => {
  ensureConfigured()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data.user
}

export const signOutAdmin = async () => {
  ensureConfigured()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getCurrentAdmin = async () => {
  ensureConfigured()

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) throw sessionError
  if (!session?.user || session.user.is_anonymous) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id,is_admin')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) throw error
  return data?.is_admin ? session.user : null
}

export const getAdminReferenceData = async () => {
  ensureConfigured()

  const [
    { data: teams, error: teamsError },
    { data: players, error: playersError },
  ] = await Promise.all([
    supabase
      .from('teams')
      .select('id,city,name,abbreviation,is_active')
      .order('city'),
    supabase
      .from('players')
      .select('*')
      .order('display_name'),
  ])

  if (teamsError) throw teamsError
  if (playersError) throw playersError

  const playerIds = (players || []).map((player) => player.id)

  if (!playerIds.length) {
    return { teams: teams || [], records: [] }
  }

  const [
    { data: rosters, error: rostersError },
    { data: measurements, error: measurementsError },
    { data: stats, error: statsError },
  ] = await Promise.all([
    supabase.from('team_rosters').select('*').in('player_id', playerIds),
    supabase
      .from('player_measurements')
      .select('*')
      .in('player_id', playerIds)
      .eq('is_current', true),
    supabase
      .from('player_stats')
      .select('*')
      .in('player_id', playerIds),
  ])

  if (rostersError) throw rostersError
  if (measurementsError) throw measurementsError
  if (statsError) throw statsError

  const teamMap = new Map((teams || []).map((team) => [team.id, team]))
  const playerMap = new Map((players || []).map((player) => [player.id, player]))

  // Keep the latest roster row for each player/team combination.
  const rosterMap = new Map()
  for (const row of rosters || []) {
    const key = `${row.player_id}:${row.team_id}`
    const current = rosterMap.get(key)
    if (!current || String(row.season) > String(current.season)) {
      rosterMap.set(key, row)
    }
  }

  const measurementMap = new Map(
    (measurements || []).map((row) => [row.player_id, row]),
  )

  // Prefer team-specific stats, with player-level stats as a fallback.
  const statsMap = new Map()
  for (const row of stats || []) {
    const teamKey = row.team_id || 'all'
    const key = `${row.player_id}:${teamKey}:${row.stat_type}`
    const current = statsMap.get(key)

    if (!current || String(row.season) > String(current.season)) {
      statsMap.set(key, row)
    }
  }

  const getStats = (playerId, teamId, statTypes) => {
    for (const statType of statTypes) {
      const teamSpecific = statsMap.get(`${playerId}:${teamId}:${statType}`)
      if (teamSpecific) return teamSpecific

      const fallback = statsMap.get(`${playerId}:all:${statType}`)
      if (fallback) return fallback
    }

    return null
  }

  const records = []
  const assignedPlayerIds = new Set()

  for (const roster of rosterMap.values()) {
    const player = playerMap.get(roster.player_id)
    if (!player) continue

    assignedPlayerIds.add(player.id)
    records.push({
      player,
      roster,
      team: teamMap.get(roster.team_id) || null,
      measurements: measurementMap.get(player.id) || null,
      currentStats: getStats(player.id, roster.team_id, ['season', 'current']),
      careerStats: getStats(player.id, roster.team_id, ['career']),
    })
  }

  // Keep players without a roster available under the Unassigned selector.
  for (const player of players || []) {
    if (assignedPlayerIds.has(player.id)) continue

    records.push({
      player,
      roster: null,
      team: null,
      measurements: measurementMap.get(player.id) || null,
      currentStats: getStats(player.id, 'all', ['season', 'current']),
      careerStats: getStats(player.id, 'all', ['career']),
    })
  }

  return {
    teams: teams || [],
    records,
  }
}


export const setPlayerRosterActive = async ({
  playerId,
  teamId,
  season,
  isActive,
}) => {
  ensureConfigured()

  if (!teamId || !season) {
    throw new Error('This player does not have a roster record to update.')
  }

  const { error } = await supabase
    .from('team_rosters')
    .update({
      is_active: Boolean(isActive),
      roster_status: isActive ? 'active' : 'inactive',
      updated_at: new Date().toISOString(),
    })
    .eq('player_id', playerId)
    .eq('team_id', teamId)
    .eq('season', season)

  if (error) throw error
}

export const uploadPlayerImage = async ({ file, slug }) => {
  ensureConfigured()

  const extension = file.name.split('.').pop()?.toLowerCase() || 'png'
  const safeSlug = slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  const path = `${safeSlug}/${Date.now()}.${extension}`

  const { error } = await supabase.storage
    .from('player-images')
    .upload(path, file, {
      upsert: true,
      contentType: file.type || undefined,
    })

  if (error) throw error

  const { data } = supabase.storage
    .from('player-images')
    .getPublicUrl(path)

  return data.publicUrl
}

const normalizePlayerPayload = (form) => ({
  slug: form.slug.trim(),
  first_name: form.firstName.trim(),
  last_name: form.lastName.trim(),
  display_name: form.displayName.trim(),
  primary_position: form.primaryPosition || null,
  secondary_position: form.secondaryPosition || null,
  archetype: form.archetype.trim() || null,
  birth_date: form.birthDate || null,
  age: nullableNumber(form.age),
  experience_years: nullableNumber(form.experience),
  college_country: form.collegeCountry.trim() || null,
  nba_player_id: nullableNumber(form.nbaPlayerId),
  legacy_player_id: nullableNumber(form.legacyPlayerId),
  image_url_override: form.imageUrlOverride.trim() || null,
  draft_year: nullableNumber(form.draftYear),
  draft_pick: nullableNumber(form.draftPick),
  shooting_hand: form.shootingHand || null,
  is_active: Boolean(form.isActive),
  updated_at: new Date().toISOString(),
})

const normalizeStatsPayload = ({
  playerId,
  form,
  statType,
  teamId,
  season,
}) => ({
  player_id: playerId,
  team_id: teamId,
  season: statType === 'career' ? 'career' : season,
  competition: form.competition || 'nba',
  stat_type: statType,
  points_per_game: nullableNumber(form.pts),
  rebounds_per_game: nullableNumber(form.reb),
  assists_per_game: nullableNumber(form.ast),
  steals_per_game: nullableNumber(form.stl),
  blocks_per_game: nullableNumber(form.blk),
  turnovers_per_game: nullableNumber(form.tov),
  three_pointers_made_per_game: nullableNumber(form.threePm),
  field_goal_percentage: nullableNumber(form.fgPct),
  free_throw_percentage: nullableNumber(form.ftPct),
  three_point_percentage: nullableNumber(form.threePct),
  plus_minus: nullableNumber(form.plusMinus),
  true_shooting_percentage: nullableNumber(form.trueShootingPct),
  source_name: form.sourceName?.trim() || 'District Basketball Lab Admin',
  source_updated_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
})

export const savePlayerRecord = async ({
  playerId,
  form,
  imageFile,
}) => {
  ensureConfigured()

  let imageUrlOverride = form.imageUrlOverride

  if (imageFile) {
    imageUrlOverride = await uploadPlayerImage({
      file: imageFile,
      slug: form.slug,
    })
  }

  const playerPayload = normalizePlayerPayload({
    ...form,
    imageUrlOverride,
  })

  let savedPlayer

  if (playerId) {
    const { data, error } = await supabase
      .from('players')
      .update(playerPayload)
      .eq('id', playerId)
      .select('*')
      .single()

    if (error) throw error
    savedPlayer = data
  } else {
    const { data, error } = await supabase
      .from('players')
      .insert(playerPayload)
      .select('*')
      .single()

    if (error) throw error
    savedPlayer = data
  }

  const rosterPayload = {
    team_id: form.teamId,
    player_id: savedPlayer.id,
    season: form.season,
    jersey_number: form.jerseyNumber.trim() || null,
    roster_position:
      form.rosterPosition.trim() ||
      form.primaryPosition ||
      null,
    roster_status: form.rosterStatus || 'active',
    is_active: Boolean(form.rosterActive),
    updated_at: new Date().toISOString(),
  }

  const { error: rosterError } = await supabase
    .from('team_rosters')
    .upsert(rosterPayload, {
      onConflict: 'team_id,player_id,season',
    })

  if (rosterError) throw rosterError

  const { error: currentMeasurementError } = await supabase
    .from('player_measurements')
    .update({
      is_current: false,
      updated_at: new Date().toISOString(),
    })
    .eq('player_id', savedPlayer.id)
    .eq('is_current', true)

  if (currentMeasurementError) throw currentMeasurementError

  const measurementPayload = {
    player_id: savedPlayer.id,
    height_inches: nullableNumber(form.height),
    weight_pounds: nullableNumber(form.weight),
    vertical_inches: nullableNumber(form.vertical),
    wingspan_inches: nullableNumber(form.wingspan),
    standing_reach_inches: nullableNumber(form.standingReach),
    measurement_type: form.measurementType || 'admin',
    source_name:
      form.measurementSource.trim() ||
      'District Basketball Lab Admin',
    notes: form.measurementNotes.trim() || null,
    is_current: true,
  }

  const hasMeasurement = [
    measurementPayload.height_inches,
    measurementPayload.weight_pounds,
    measurementPayload.vertical_inches,
    measurementPayload.wingspan_inches,
    measurementPayload.standing_reach_inches,
  ].some((value) => value !== null)

  if (hasMeasurement) {
    const { error: measurementError } = await supabase
      .from('player_measurements')
      .insert(measurementPayload)

    if (measurementError) throw measurementError
  }

  const currentStatsPayload = normalizeStatsPayload({
    playerId: savedPlayer.id,
    form: form.currentStats,
    statType: 'season',
    teamId: form.teamId,
    season: form.season,
  })

  const careerStatsPayload = normalizeStatsPayload({
    playerId: savedPlayer.id,
    form: form.careerStats,
    statType: 'career',
    teamId: form.teamId,
    season: form.season,
  })

  const { error: currentStatsError } = await supabase
    .from('player_stats')
    .upsert(currentStatsPayload, {
      onConflict: 'player_id,team_id,season,competition,stat_type',
    })

  if (currentStatsError) throw currentStatsError

  const { error: careerStatsError } = await supabase
    .from('player_stats')
    .upsert(careerStatsPayload, {
      onConflict: 'player_id,team_id,season,competition,stat_type',
    })

  if (careerStatsError) throw careerStatsError

  return savedPlayer
}


const normalizeImportedStats = (stats) => ({
  points_per_game: nullableNumber(stats.pts),
  rebounds_per_game: nullableNumber(stats.reb),
  assists_per_game: nullableNumber(stats.ast),
  steals_per_game: nullableNumber(stats.stl),
  blocks_per_game: nullableNumber(stats.blk),
  turnovers_per_game: nullableNumber(stats.tov),
  three_pointers_made_per_game: nullableNumber(stats.threePm),
  field_goal_percentage: nullableNumber(stats.fgPct),
  free_throw_percentage: nullableNumber(stats.ftPct),
  three_point_percentage: nullableNumber(stats.threePct),
  plus_minus: nullableNumber(stats.plusMinus),
  true_shooting_percentage: nullableNumber(stats.trueShootingPct),
})

export const previewNbaStatsUpdates = async ({ season, records }) => {
  const normalizedSeason = String(season || '').trim()

  if (!/^\d{4}-\d{2}$/.test(normalizedSeason)) {
    throw new Error('Enter an NBA season in YYYY-YY format, such as 2025-26.')
  }

  const response = await fetch(
    `/api/nba-stats?season=${encodeURIComponent(normalizedSeason)}` +
      `&playerIds=${encodeURIComponent(
        records.map((record) => record.player.nba_player_id).filter(Boolean).join(','),
      )}`,
    {
      headers: { Accept: 'application/json' },
    },
  )

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      payload.error || `NBA.com returned HTTP ${response.status}.`,
    )
  }

  const nbaByPlayerId = new Map(
    (payload.players || []).map((player) => [String(player.nbaPlayerId), player]),
  )

  return records.map((record) => {
    const nbaPlayerId = record.player.nba_player_id
    const nba = nbaPlayerId
      ? nbaByPlayerId.get(String(nbaPlayerId)) || null
      : null

    return {
      record,
      nba,
      status: !nbaPlayerId ? 'missing-id' : nba ? 'matched' : 'not-found',
    }
  })
}

export const applyNbaStatsUpdates = async ({ season, previewRows }) => {
  ensureConfigured()

  const now = new Date().toISOString()
  const matchedRows = previewRows.filter(
    (row) => row.status === 'matched' && row.nba,
  )

  if (!matchedRows.length) {
    throw new Error('No matched NBA players are available to update.')
  }

  const statRows = matchedRows.map(({ record, nba }) => ({
    player_id: record.player.id,
    team_id: record.roster?.team_id || null,
    season,
    competition: 'nba',
    stat_type: 'season',
    ...normalizeImportedStats(nba),
    source_name: 'NBA.com Stats',
    source_updated_at: now,
    updated_at: now,
  }))

  const { error: statsError } = await supabase
    .from('player_stats')
    .upsert(statRows, {
      onConflict: 'player_id,team_id,season,competition,stat_type',
    })

  if (statsError) throw statsError

  let bioUpdated = 0
  let measurementsUpdated = 0

  for (const { record, nba } of matchedRows) {
    const playerUpdates = {
      updated_at: now,
    }

    if (nba.position) playerUpdates.primary_position = nba.position
    if (nba.birthDate) playerUpdates.birth_date = nba.birthDate.slice(0, 10)
    if (nba.age !== null) playerUpdates.age = nba.age
    if (nba.experience !== null) playerUpdates.experience_years = nba.experience
    if (nba.collegeCountry) playerUpdates.college_country = nba.collegeCountry
    if (nba.draftYear !== null) playerUpdates.draft_year = nba.draftYear
    if (nba.draftPick !== null) playerUpdates.draft_pick = nba.draftPick

    if (Object.keys(playerUpdates).length > 1) {
      const { error: playerError } = await supabase
        .from('players')
        .update(playerUpdates)
        .eq('id', record.player.id)

      if (playerError) throw playerError
      bioUpdated += 1
    }

    const measurement = {
      height_inches: nullableNumber(nba.heightInches),
      weight_pounds: nullableNumber(nba.weightPounds),
      wingspan_inches: nullableNumber(nba.wingspanInches),
      standing_reach_inches: nullableNumber(nba.standingReachInches),
      vertical_inches: nullableNumber(nba.verticalInches),
    }
    const hasMeasurement = Object.values(measurement).some(
      (value) => value !== null,
    )

    if (hasMeasurement) {
      const { error: oldMeasurementError } = await supabase
        .from('player_measurements')
        .update({ is_current: false, updated_at: now })
        .eq('player_id', record.player.id)
        .eq('is_current', true)

      if (oldMeasurementError) throw oldMeasurementError

      const { error: measurementError } = await supabase
        .from('player_measurements')
        .insert({
          player_id: record.player.id,
          ...measurement,
          measurement_type: nba.hasCombineMeasurements
            ? 'nba-draft-combine'
            : 'nba-roster',
          source_name: nba.measurementSource || 'NBA.com Player Bio',
          notes: nba.hasCombineMeasurements
            ? 'Official NBA Draft Combine measurements imported by Admin.'
            : 'Official NBA roster height and weight imported by Admin.',
          is_current: true,
        })

      if (measurementError) throw measurementError
      measurementsUpdated += 1
    }
  }

  return {
    statsUpdated: statRows.length,
    bioUpdated,
    measurementsUpdated,
  }
}
