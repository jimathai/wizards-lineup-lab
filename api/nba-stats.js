import { fetchNbaPlayerStats } from './_nbaStats.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const season = String(request.query?.season || '2025-26').trim()
  const playerIds = String(request.query?.playerIds || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 30)

  try {
    const players = await fetchNbaPlayerStats(season, playerIds)
    response.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600')
    response.status(200).json({ season, players })
  } catch (error) {
    console.error('NBA stats import failed:', error)
    const message = error?.name === 'AbortError'
      ? 'NBA.com did not respond before the request timed out.'
      : error?.message || 'Unable to retrieve NBA.com player data.'
    response.status(502).json({ error: message })
  }
}
