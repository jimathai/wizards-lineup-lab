const BASE_URL = 'https://api.balldontlie.io/v1'

function getApiKey() {
  return import.meta.env.VITE_BDL_API_KEY?.trim()
}

function buildQuery(params = {}) {
  const query = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return

    if (Array.isArray(value)) {
      value.forEach((item) => query.append(`${key}[]`, String(item)))
      return
    }

    query.set(key, String(value))
  })

  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

async function request(endpoint, params) {
  const apiKey = getApiKey()

  if (!apiKey) {
    throw new Error(
      'BALLDONTLIE API key is missing. Add VITE_BDL_API_KEY to .env.local and restart Vite.',
    )
  }

  const response = await fetch(`${BASE_URL}${endpoint}${buildQuery(params)}`, {
    headers: {
      Authorization: apiKey,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const rawBody = await response.text()
    let details = rawBody

    if (rawBody) {
      try {
        const errorBody = JSON.parse(rawBody)
        details =
          errorBody?.message ||
          errorBody?.error ||
          errorBody?.errors ||
          JSON.stringify(errorBody)
      } catch {
        // Keep the plain-text response body.
      }
    }

    throw new Error(
      `BALLDONTLIE request failed (${response.status} ${response.statusText})${
        details ? `: ${details}` : ''
      }`,
    )
  }

  return response.json()
}

export function hasBalldontlieApiKey() {
  return Boolean(getApiKey())
}

export function getTeams() {
  return request('/teams')
}

export function getTeam(teamId) {
  return request(`/teams/${teamId}`)
}

export function searchPlayers(search, options = {}) {
  return request('/players', {
    search,
    per_page: options.perPage ?? 100,
    cursor: options.cursor,
  })
}

export function getPlayersByTeam(teamId, options = {}) {
  return request('/players', {
    team_ids: [teamId],
    per_page: options.perPage ?? 100,
    cursor: options.cursor,
  })
}

export function getSeasonAverages({ season, playerIds }) {
  return request('/season_averages', {
    season,
    player_ids: playerIds,
  })
}
