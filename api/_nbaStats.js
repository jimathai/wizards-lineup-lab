const NBA_STATS_URL = 'https://stats.nba.com/stats'

const REQUEST_HEADERS = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  Origin: 'https://www.nba.com',
  Referer: 'https://www.nba.com/',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'x-nba-stats-origin': 'stats',
  'x-nba-stats-token': 'true',
}

const createStatsParams = ({ season, measureType }) => new URLSearchParams({
  College: '', Conference: '', Country: '', DateFrom: '', DateTo: '',
  Division: '', DraftPick: '', DraftYear: '', GameScope: '', GameSegment: '',
  Height: '', LastNGames: '0', LeagueID: '00', Location: '',
  MeasureType: measureType, Month: '0', OpponentTeamID: '0', Outcome: '',
  PORound: '0', PaceAdjust: 'N', PerMode: 'PerGame', Period: '0',
  PlayerExperience: '', PlayerPosition: '', PlusMinus: 'N', Rank: 'N',
  Season: season, SeasonSegment: '', SeasonType: 'Regular Season',
  ShotClockRange: '', StarterBench: '', TeamID: '0', VsConference: '',
  VsDivision: '', Weight: '',
})

const resultRows = (payload, resultName = null) => {
  const sets = payload?.resultSets || []
  const result = resultName
    ? sets.find((set) => set.name === resultName)
    : sets[0] || payload?.resultSet
  const headers = result?.headers || []
  return (result?.rowSet || []).map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index]])),
  )
}

const fetchJson = async (endpoint, params, timeoutMs = 18000) => {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(
      `${NBA_STATS_URL}/${endpoint}?${params}`,
      { headers: REQUEST_HEADERS, signal: controller.signal },
    )

    if (!response.ok) {
      throw new Error(`NBA.com ${endpoint} request returned ${response.status}.`)
    }

    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

const fetchMeasure = async ({ season, measureType }) =>
  resultRows(await fetchJson(
    'leaguedashplayerstats',
    createStatsParams({ season, measureType }),
  ))

const numberOrNull = (value) => {
  if (value === null || value === undefined || value === '' || value === '-') {
    return null
  }
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const textOrNull = (value) => {
  const text = String(value ?? '').trim()
  return text && text !== '-' && text.toLowerCase() !== 'undrafted'
    ? text
    : null
}

const feetInchesToInches = (value) => {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'number') return value
  const text = String(value).trim()
  const match = text.match(/^(\d+)\s*[-']\s*(\d+(?:\.\d+)?)?/) 
  if (!match) return numberOrNull(text)
  return Number(match[1]) * 12 + Number(match[2] || 0)
}

const commonPlayerInfo = async (playerId) => {
  const params = new URLSearchParams({ PlayerID: String(playerId), LeagueID: '00' })
  const rows = resultRows(
    await fetchJson('commonplayerinfo', params, 14000),
    'CommonPlayerInfo',
  )
  return rows[0] || null
}

const mapWithConcurrency = async (items, limit, worker) => {
  const results = new Array(items.length)
  let nextIndex = 0

  const runner = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++
      try {
        results[index] = await worker(items[index])
      } catch (error) {
        console.warn(`NBA player detail failed for ${items[index]}:`, error.message)
        results[index] = null
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runner))
  return results
}

const fetchCombineYear = async (draftYear) => {
  const params = new URLSearchParams({ LeagueID: '00', SeasonYear: String(draftYear) })
  const [anthroResult, drillResult] = await Promise.allSettled([
    fetchJson('draftcombineplayeranthro', params, 18000),
    fetchJson('draftcombinedrillresults', params, 18000),
  ])

  const anthroRows = anthroResult.status === 'fulfilled'
    ? resultRows(anthroResult.value)
    : []
  const drillRows = drillResult.status === 'fulfilled'
    ? resultRows(drillResult.value)
    : []
  const drillsById = new Map(
    drillRows.map((row) => [String(row.PLAYER_ID || row.TEMP_PLAYER_ID), row]),
  )

  return anthroRows.map((anthro) => ({
    ...anthro,
    ...(drillsById.get(String(anthro.PLAYER_ID || anthro.TEMP_PLAYER_ID)) || {}),
  }))
}

export const fetchNbaPlayerStats = async (season, requestedPlayerIds = []) => {
  if (!/^\d{4}-\d{2}$/.test(season)) {
    throw new Error('Season must use YYYY-YY format.')
  }

  const [baseRows, advancedRows] = await Promise.all([
    fetchMeasure({ season, measureType: 'Base' }),
    fetchMeasure({ season, measureType: 'Advanced' }),
  ])

  const advancedByPlayerId = new Map(
    advancedRows.map((row) => [String(row.PLAYER_ID), row]),
  )

  const ids = [...new Set(
    requestedPlayerIds
      .map((id) => numberOrNull(id))
      .filter(Boolean),
  )]
  const detailRows = await mapWithConcurrency(ids, 4, commonPlayerInfo)
  const detailByPlayerId = new Map(
    detailRows.filter(Boolean).map((row) => [String(row.PERSON_ID), row]),
  )

  const draftYears = [...new Set(
    detailRows
      .filter(Boolean)
      .map((row) => numberOrNull(row.DRAFT_YEAR))
      .filter((year) => year && year >= 2000),
  )]
  const combineGroups = await mapWithConcurrency(draftYears, 3, fetchCombineYear)
  const combineByPlayerId = new Map()
  combineGroups.flat().filter(Boolean).forEach((row) => {
    const id = row.PLAYER_ID || row.TEMP_PLAYER_ID
    if (id) combineByPlayerId.set(String(id), row)
  })

  const baseByPlayerId = new Map(baseRows.map((row) => [String(row.PLAYER_ID), row]))
  const allIds = new Set([...baseByPlayerId.keys(), ...ids.map(String)])

  return [...allIds].map((playerId) => {
    const base = baseByPlayerId.get(playerId) || {}
    const advanced = advancedByPlayerId.get(playerId) || {}
    const bio = detailByPlayerId.get(playerId) || {}
    const combine = combineByPlayerId.get(playerId) || {}
    const rosterHeight = feetInchesToInches(bio.HEIGHT)
    const combineHeight = numberOrNull(combine.HEIGHT_WO_SHOES)
      ?? feetInchesToInches(combine.HEIGHT_WO_SHOES_FT_IN)

    return {
      nbaPlayerId: numberOrNull(base.PLAYER_ID || bio.PERSON_ID || playerId),
      playerName: base.PLAYER_NAME || bio.DISPLAY_FIRST_LAST || '',
      teamId: numberOrNull(base.TEAM_ID || bio.TEAM_ID),
      teamAbbreviation: base.TEAM_ABBREVIATION || bio.TEAM_ABBREVIATION || '',
      gamesPlayed: numberOrNull(base.GP),
      minutes: numberOrNull(base.MIN),
      pts: numberOrNull(base.PTS), reb: numberOrNull(base.REB),
      ast: numberOrNull(base.AST), stl: numberOrNull(base.STL),
      blk: numberOrNull(base.BLK), tov: numberOrNull(base.TOV),
      threePm: numberOrNull(base.FG3M), fgPct: numberOrNull(base.FG_PCT),
      threePct: numberOrNull(base.FG3_PCT), ftPct: numberOrNull(base.FT_PCT),
      plusMinus: numberOrNull(base.PLUS_MINUS),
      trueShootingPct: numberOrNull(advanced.TS_PCT),
      position: textOrNull(bio.POSITION),
      birthDate: textOrNull(bio.BIRTHDATE),
      age: numberOrNull(base.AGE),
      experience: numberOrNull(bio.SEASON_EXP),
      collegeCountry: textOrNull(bio.SCHOOL) || textOrNull(bio.COUNTRY),
      country: textOrNull(bio.COUNTRY),
      draftYear: numberOrNull(bio.DRAFT_YEAR),
      draftPick: numberOrNull(bio.DRAFT_NUMBER),
      rosterHeightInches: rosterHeight,
      rosterWeightPounds: numberOrNull(bio.WEIGHT),
      heightInches: combineHeight ?? rosterHeight,
      weightPounds: numberOrNull(combine.WEIGHT) ?? numberOrNull(bio.WEIGHT),
      wingspanInches: numberOrNull(combine.WINGSPAN)
        ?? feetInchesToInches(combine.WINGSPAN_FT_IN),
      standingReachInches: numberOrNull(combine.STANDING_REACH)
        ?? feetInchesToInches(combine.STANDING_REACH_FT_IN),
      verticalInches: numberOrNull(combine.MAX_VERTICAL_LEAP)
        ?? numberOrNull(combine.STANDING_VERTICAL_LEAP),
      measurementSource: combine.PLAYER_ID
        ? `NBA Draft Combine ${bio.DRAFT_YEAR}`
        : bio.PERSON_ID ? 'NBA.com Player Bio' : null,
      hasCombineMeasurements: Boolean(combine.PLAYER_ID),
    }
  })
}
